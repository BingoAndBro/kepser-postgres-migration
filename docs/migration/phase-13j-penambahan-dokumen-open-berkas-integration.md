# Phase 13J - Penambahan Dokumen Open Berkas Integration

Date: 2026-05-29

Status: implemented pending targeted test verification and human smoke.

Runtime smoke follow-up:

- `docs/migration/phase-13j1-runtime-smoke-penambahan-dokumen-to-berkas.md`

## Phase Status

Phase 13J integrates the existing `Penambahan Dokumen` manual create runtime with the Phase 13F/13G folder/berkas backend foundation.

When `KEPALA_SUB_BAGIAN_UMUM` adds a manual document with `Jenis Pembayaran` / `klasifikasi_id`, the create transaction now opens or reuses the matching `OPEN` berkas and attaches the new manual source row as a `MANUAL` berkas item.

## Runtime Integration Added

The existing route remains:

```text
POST /api/arsiparis/manual-arsip
```

The existing manual create flow still:

- validates required manual document metadata, including `keterangan`;
- validates active `Kategori`;
- validates active `Jenis Pembayaran`;
- inserts the transitional `arsip.manual_arsip` source row;
- creates the linked canonical `arsip.arsip` row with `source_type='MANUAL'`;
- updates `manual_arsip.canonical_arsip_id` in the same transaction;
- returns the existing compatible `manual_arsip` response shape.

After the canonical bridge exists, the same transaction now calls:

- `getOrCreateOpenBerkasForKlasifikasi`;
- `addManualDocumentToOpenBerkas`.

## Open Berkas Behavior

- One `OPEN` berkas per `klasifikasi_id` is reused when present.
- If no `OPEN` berkas exists, the helper creates one from active `master_klasifikasi_arsip` snapshots.
- Client-supplied classification snapshots are not trusted.
- Closed folders are not reopened.
- The create flow does not close folders automatically.

## MANUAL Item Behavior

The new berkas item uses:

- `source_type='MANUAL'`;
- `manual_arsip_id` from the newly inserted source row;
- `canonical_arsip_id` from the linked `manual_arsip.canonical_arsip_id` bridge when available;
- `added_by` from the authenticated `dms_session` user.

Duplicate source assignment is mapped to the safe conflict message:

```text
Dokumen sudah terhubung ke berkas
```

## Transitional Compatibility Preserved

This phase preserves the existing transitional compatibility model:

- `manual_arsip` remains the manual source table;
- canonical `source_type='MANUAL'` rows are still created for new manual creates;
- existing unified archive list/detail compatibility remains active;
- manual attachment upload remains separate after parent create;
- preview/download authorization and lifecycle blocking remain unchanged.

## Non-Goals

Phase 13J does not:

- add browser UI or folder-first pages;
- add close-folder UI;
- add a `Nomor SPM` form;
- add final retention metadata forms;
- backfill existing `manual_arsip` rows;
- auto-attach historical manual rows;
- automatically close folders;
- change archive lifecycle mapping;
- delete or mutate existing canonical archive rows beyond existing manual create behavior;
- delete database rows;
- touch physical files or storage behavior;
- add schema, migrations, route generation, package changes, seeds, cleanup, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Follow-Up Recommendation

Future folder-first finalization work should define how closed berkas metadata, `Nomor SPM`, retention dates, and lifecycle state relate to transitional per-item canonical archive rows. Keep that separate from initial manual document intake.
