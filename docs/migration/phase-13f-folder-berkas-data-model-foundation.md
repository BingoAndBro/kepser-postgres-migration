# Phase 13F - Folder/Berkas Data Model Foundation

Date: 2026-05-29

Status: schema/data-model foundation only.

## Phase Status

Phase 13F adds the first real folder/berkas data model for the Phase 13 folder-first archive direction.

This phase is additive only. It does not implement close-folder UI/API, folder-first archive list pages, lifecycle mutation, data backfill, seed changes, route generation, storage cleanup, physical file changes, or Supabase fallback.

This is not production readiness, not public rollout approval, not go-live approval, not operational certification, not security certification, and not compliance validation.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Added Models

### `arsip.berkas_arsip`

`berkas_arsip` represents one folder/berkas for one `Jenis Pembayaran` / `master_klasifikasi_arsip` classification.

Key fields:

- `klasifikasi_id`, with code/name snapshots for historical display resilience.
- `status_berkas`, limited to `OPEN` and `CLOSED`.
- nullable close-folder metadata: `nomor_spm`, retention labels, retention end dates, `closed_at`, and `closed_by`.
- `created_by`, `created_at`, and `updated_at`.

The model enforces at most one `OPEN` folder per `klasifikasi_id`. Multiple closed folders for the same classification remain possible across batches.

### `arsip.berkas_arsip_item`

`berkas_arsip_item` links source documents/items into a folder.

Supported source types:

- `WORKFLOW`, linked through `dokumen_id`;
- `MANUAL`, linked through `manual_arsip_id`.

The table also has nullable `canonical_arsip_id` as a transitional bridge to the current canonical `arsip.arsip` row when one exists. This preserves compatibility with Phase 13E, where new manual document creates still write `manual_arsip` plus linked canonical `source_type='MANUAL'` rows.

Database checks require exactly one source reference for the selected `source_type`. Unique partial indexes prevent the same workflow document or manual source row from being assigned to more than one folder.

## Constants And Schemas

Added minimal folder status constants:

```text
OPEN
CLOSED
```

Added a Zod schema for future close-folder metadata:

- `nomor_spm`;
- `retensi_aktif`;
- `retensi_inaktif`;
- optional `closed_at`.

This schema is not wired to any route or runtime flow in Phase 13F.

## Transitional Compatibility

Existing runtime remains unchanged:

- current `Pengklasifikasian Dokumen` workflow runtime is unchanged;
- current `Penambahan Dokumen` manual runtime is unchanged;
- `manual_arsip`, `manual_arsip_attachment`, `klasifikasi_id`, `master_klasifikasi_arsip`, and compatibility route/API paths are not renamed;
- new manual creates can continue writing transitional `manual_arsip` and canonical `source_type='MANUAL'` rows;
- workflow archive creation and unified archive detail/list behavior are not changed.

No existing documents or manual rows are automatically attached to folders in this phase.

## Non-Goals

Phase 13F does not:

- implement close-folder/finalize-folder UI or API;
- implement folder-first active, inactive, or proposed-destruction archive pages;
- change current archive lifecycle mutation;
- change file preview/download behavior;
- backfill existing rows;
- mutate existing data;
- run migrations against a database;
- run seed scripts;
- touch physical files or storage roots;
- change auth, RBAC, sessions, or `ADMIN` behavior;
- modify package files, `.env`, `.env.migration`, `src/routeTree.gen.ts`, or historical `supabase/` artifacts.

## Follow-Up Phases

- 13G: close-folder helper/API with `Nomor SPM`, retention calculation, and server-authoritative closed-folder enforcement.
- 13H: folder-first active archive filing UI.
- 13I: folder-first inactive/proposed-destruction lifecycle pages.
- 13J: report/classification cleanup if standalone classification reports remain redundant.

## Open Risks

- The folder lifecycle still has only `OPEN` and `CLOSED`; folder-level `status_arsip` is intentionally deferred until the close-folder and folder-first lifecycle phases decide the exact mapping.
- Runtime must enforce that `CLOSED` folders cannot accept new items before any write API is introduced.
- Existing Phase 12 canonical archive rows remain transitional until later phases decide whether folder closure creates, updates, or supersedes per-item canonical archive rows.
- If future business rules require moving a source item between folders, the unique source indexes will require an explicit reassignment policy.
