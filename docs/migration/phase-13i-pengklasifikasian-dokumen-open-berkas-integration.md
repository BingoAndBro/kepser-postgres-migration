# Phase 13I - Pengklasifikasian Dokumen Open Berkas Integration

Date: 2026-05-29

Status: implemented pending targeted test verification and human smoke.

## Phase Status

Phase 13I integrates the existing workflow `Pengklasifikasian Dokumen` write route with the Phase 13F/13G folder/berkas backend foundation.

When `KEPALA_SUB_BAGIAN_UMUM` classifies a completed workflow document by `Jenis Pembayaran` / `klasifikasi_id`, the route now opens or reuses the matching `OPEN` berkas and attaches the workflow document as a `WORKFLOW` berkas item.

## Runtime Integration Added

The existing route remains:

```text
POST /api/arsiparis/dokumen/$id/archive
```

After server-side validation and transitional canonical workflow archive creation, the route now calls:

- `getOrCreateOpenBerkasForKlasifikasi`;
- `addWorkflowDocumentToOpenBerkas`.

The berkas operation runs inside the existing archive transaction so the workflow source classification is validated from the canonical `source_type='WORKFLOW'` archive row created by the route, not from client-supplied snapshots.

## Open Berkas Behavior

- One `OPEN` berkas per `klasifikasi_id` is reused when present.
- If no `OPEN` berkas exists, the helper creates one from active `master_klasifikasi_arsip` snapshots.
- Closed folders are not reopened.
- The route does not close folders automatically.

## Duplicate And Closed Handling

Duplicate source assignment is mapped to a safe `409` conflict response through `BerkasArsipServiceError('CONFLICT')`.

If the helper reports a closed or non-open berkas state, the route maps that to a safe conflict response without exposing SQL, raw rows, file paths, tokens, sessions, cookies, env values, storage roots, or secrets.

## Transitional Behavior Preserved

The existing workflow classification route still performs the transitional archive behavior already present before this phase:

- validates `klasifikasi_id`;
- creates the canonical `arsip.arsip` workflow row;
- transitions `dokumen_transaksi.status` from `COMPLETED` to `ARCHIVED` through the FSM;
- writes the append-only `ARCHIVE` log.

This phase does not replace the transitional canonical archive model with folder-first archive finalization.

## Non-Goals

Phase 13I does not:

- add folder-first UI or list pages;
- add close-folder UI;
- add a `Nomor SPM` form;
- add final retention metadata forms;
- change `Penambahan Dokumen` manual flow;
- attach existing historical workflow/manual rows to folders;
- backfill existing data;
- automatically close folders;
- change archive lifecycle mapping broadly;
- delete or mutate canonical archive rows beyond the existing route behavior;
- delete database rows;
- touch physical files or storage;
- add schema, migrations, route generation, package changes, seeds, cleanup, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Follow-Up Recommendation

Future phases should decide the folder-first finalization model: how closed berkas metadata, `Nomor SPM`, retention dates, and lifecycle state relate to transitional per-item canonical archive rows. That should remain separate from initial document classification.
