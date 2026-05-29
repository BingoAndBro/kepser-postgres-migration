# Phase 13K - Folder-First Finalization Policy And De-Transitionalization Plan

Date: 2026-05-29

Status: docs/planning only.

## Phase Status

Phase 13K locks the accepted folder-first archive policy before further runtime implementation.

This phase does not change runtime behavior, schema, Drizzle models, migrations, routes, route generation, UI, storage files, physical files, database rows, package files, env files, cleanup behavior, seeds, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog. This phase does not claim Supabase is fully removed from the repository and does not approve any Supabase fallback.

## Accepted Final Model

Option A is accepted as the final Phase 13 direction.

- `arsip.berkas_arsip` becomes the canonical archive/folder parent for new runtime.
- `arsip.berkas_arsip_item` becomes the folder item list combining `WORKFLOW` and `MANUAL` source documents.
- `dokumen.dokumen_transaksi` remains the workflow source table.
- `arsip.manual_arsip` remains the manual source table for now.
- `arsip.manual_arsip_attachment` remains the manual source attachment table for now.
- `arsip.arsip` becomes legacy/transitional compatibility only after de-transitionalization, not the new write target.

Initial classification is no longer final archive creation in the target model. Final archive metadata and archive lifecycle belong to the folder/berkas level.

## Table Responsibilities

### `arsip.master_klasifikasi_arsip`

Stores the classification hierarchy used as `Jenis Pembayaran` during initial classification and as classification snapshot source for folders. Runtime must derive trusted classification code/name snapshots server-side from this table.

### `arsip.berkas_arsip`

Canonical folder/archive parent for new runtime. It owns folder identity, `klasifikasi_id`, classification snapshots, `status_berkas`, final archive metadata, closure/finalization actor and time, retention labels/end dates, and future folder-level `status_arsip`.

### `arsip.berkas_arsip_item`

Source-item list inside a folder. It combines:

- `WORKFLOW` items linked to `dokumen_transaksi` through `dokumen_id`;
- `MANUAL` items linked to `manual_arsip` through `manual_arsip_id`.

The transitional `canonical_arsip_id` bridge may remain only for compatibility while old `arsip.arsip` surfaces exist.

### `dokumen.dokumen_transaksi`

Workflow document source table. Completed workflow documents remain source records and can be attached as `WORKFLOW` folder items. In the target de-transitionalized model, Pengklasifikasian Dokumen keeps workflow documents at `COMPLETED` and does not immediately set `ARCHIVED`.

### `arsip.manual_arsip`

Manual document source table for `Penambahan Dokumen` during transition. It stores manually added document metadata and remains the source for `MANUAL` folder items until a later source-model redesign replaces it.

### `arsip.manual_arsip_attachment`

Manual source attachment table. It stores manual document attachment metadata and logical storage references. It is not a folder parent and must not be counted as separate archive reports.

### `arsip.arsip`

Legacy/transitional compatibility table after de-transitionalization. Existing rows remain for old unified archive list/detail/lifecycle/file-access compatibility until folder-first replacements are ready. New runtime should stop writing this table only in a later implementation phase.

### `arsip.lampiran_snapshot`

`lampiran_snapshot` on `arsip.arsip` remains relevant for existing transitional `WORKFLOW` rows and old source-aware file access. In the folder-first target, new file access should resolve attachments from folder items and their source tables instead of requiring a new `arsip.arsip` snapshot write.

### `dokumen.log_aktivitas`

Append-only workflow audit trail. It remains append-only by contract. Future folder lifecycle audit may need a folder-level audit model, but this phase does not create one.

## De-Transitionalization Policy

### Workflow Pengklasifikasian Dokumen

Future target behavior:

1. Validate the selected `Jenis Pembayaran` server-side.
2. Open or reuse the matching `OPEN` berkas.
3. Attach the workflow document as a `WORKFLOW` item.
4. Keep `dokumen_transaksi.status = COMPLETED`.
5. Do not create a new canonical `arsip.arsip` row.
6. Do not set `ARCHIVED` during initial classification.

The current Phase 13I behavior still creates transitional `arsip.arsip` `WORKFLOW` rows and sets `ARCHIVED`; that is compatibility behavior to remove in a later implementation phase.

### Manual Penambahan Dokumen

Future target behavior:

1. Create the manual source row.
2. Attach it to the matching `OPEN` berkas as a `MANUAL` item.
3. Do not create a new canonical `arsip.arsip` row after de-transitionalization.
4. Do not fill final archive metadata at manual create time.

The current Phase 13J behavior still creates linked canonical `arsip.arsip` `MANUAL` rows and stores `manual_arsip.canonical_arsip_id`; that is compatibility behavior to remove in a later implementation phase.

### Close/Finalize Berkas

Future target behavior:

1. Require assigned `KEPALA_SUB_BAGIAN_UMUM` server-side through `dms_session`; `ADMIN` is not a substitute.
2. Require `Nomor SPM` and retention metadata.
3. Set `status_berkas = CLOSED`.
4. Set folder-level `status_arsip = AKTIF`.
5. Set `closed_by` and `closed_at` server-side or from validated caller input where allowed.
6. Apply final archive metadata to all items in the folder.

Initial classification stays lightweight. Final metadata belongs to folder finalization.

## Status Model

Preferred future model:

```text
status_berkas = OPEN | CLOSED
status_arsip = null while OPEN
status_arsip = AKTIF when CLOSED/finalized
```

Folder-level lifecycle:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Lifecycle is folder-level, not per individual item. Items inherit access and lifecycle behavior from the containing folder.

## UI Model

Future target:

- `Pemberkasan Arsip Aktif`, `Arsip Inaktif`, and `Usul Musnah` pages are folder-first.
- Lists show folders first.
- Folder detail shows the documents/items inside the selected folder.
- Individual item detail is lightweight, such as a popup or drawer.
- New runtime should not keep the old large individual archive detail model as the primary detail experience.
- Old individual archive pages/routes should be removed only after folder-first replacements are ready.

Lifecycle actions should live on folder detail so `KEPALA_SUB_BAGIAN_UMUM` can inspect the folder and its item list before moving lifecycle state.

## File Access And `DIMUSNAHKAN`

Future preview/download must check folder-level lifecycle before serving any item file.

If a folder has `status_arsip = DIMUSNAHKAN`:

- preview/download is blocked for every item in the folder;
- stale links, stale tokens, and raw/path-style access must fail closed;
- user-facing copy should be `Data sudah dimusnahkan` or an equivalent safe message.

Future physical destruction should actually delete physical files for `DIMUSNAHKAN` folders while preserving metadata. That must be a separate destructive phase with safeguards, dry-run or preflight where appropriate, explicit confirmation, safe counts, audit consideration, and no path/root/token leakage.

## Legacy `arsip.arsip` Policy

Do not delete `arsip.arsip` yet.

Existing legacy/transitional rows remain for compatibility until folder-first replacement pages, routes, lifecycle behavior, and file access are ready.

New runtime should stop writing `arsip.arsip` only in a later implementation phase. Cleanup or removal of old individual archive pages must come after replacements are implemented and verified.

No later phase should infer that historical `arsip.arsip` data can be blindly deleted. Any cleanup requires a separate human-approved policy.

## Security And Domain Boundaries

- `dms_session` is the auth boundary.
- `dms_active_role` is UX-only and is not authorization proof.
- Server/API RBAC is authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` owns archive/folder operations.
- `ADMIN` is not a substitute for `KEPALA_SUB_BAGIAN_UMUM`.
- `BENDAHARA` remains the internal enum; `PPSPM` is display label only.
- No Supabase fallback may be reintroduced.
- File access must not expose physical storage paths, storage roots, file tokens, signed token internals, raw attachment metadata, SQL details, env values, session/cookie values, or secrets.

## Follow-Up Roadmap

- 13L - Berkas `status_arsip` schema foundation.
- 13M - Close Berkas finalization behavior sets `status_arsip = AKTIF` and final metadata.
- 13N - Stop workflow/manual create from writing canonical `arsip.arsip`.
- 13O - Folder-first archive pages/read model.
- 13P - Folder item preview/download and `DIMUSNAHKAN` block.
- 13Q - Legacy individual archive page cleanup.
- 13R - Physical destruction implementation.

High-risk follow-ups:

- schema/lifecycle phases, because lifecycle authority moves from individual canonical archive rows to folders;
- de-transitionalization, because workflow/manual writes must stop depending on `arsip.arsip` without breaking compatibility reads prematurely;
- file access and `DIMUSNAHKAN`, because stale links must fail closed for every item in a destroyed folder;
- physical deletion, because files will be removed while metadata must be preserved.

## Validation For This Phase

Required validation:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase src/routeTree.gen.ts
git diff -- src/routes src/lib src/db
```

Do not run dev server, route generation, broad tests, build, E2E, DB migrations, seed scripts, cleanup scripts, storage cleanup, or package manager operations for this phase.
