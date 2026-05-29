# Phase 13N - Folder-First Read Model Foundation

Date: 2026-05-29

Status: implemented pending targeted test and human review.

## Phase Status

Phase 13N adds a bounded read-only helper foundation for future folder-first archive pages.

The helper reads the folder-first model through `arsip.berkas_arsip` and `arsip.berkas_arsip_item` as the primary authority, then enriches item metadata from source tables:

- `dokumen.dokumen_transaksi` for `WORKFLOW` items;
- `arsip.manual_arsip` for `MANUAL` items;
- `arsip.manual_arsip_attachment` only for safe attachment counts.

This phase does not add UI pages, API routes, route generation, lifecycle mutations, schema changes, migrations, write behavior changes, file-access changes, storage helper changes, package changes, env changes, seed execution, backfill, cleanup, physical deletion, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Helper Added

New helper:

```text
src/lib/archive/berkas-arsip-read-model.ts
```

Primary functions:

```ts
listBerkasArsipFolders(query, deps?)
getBerkasArsipDetail(berkasId, deps?)
```

The helper supports dependency injection for targeted unit tests and future API/UI wrappers. Default runtime reads are metadata-only and do not mutate rows.

Future API/UI wrappers must still enforce:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM`;
- server-authoritative RBAC;
- no `ADMIN` substitute for archive/folder operations.

## Folder List DTO

The list read model returns folder rows, not individual legacy archive rows.

List folder DTO fields:

- `berkas_id`;
- `klasifikasi_id`;
- `klasifikasi_kode_snapshot`;
- `klasifikasi_nama_snapshot`;
- `status_berkas`;
- `status_arsip`;
- `nomor_spm`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- `closed_at`;
- `closed_by`;
- `item_count`;
- `workflow_item_count`;
- `manual_item_count`;
- `total_nominal_realisasi`;
- `created_at`;
- `updated_at`.

Supported query filters:

- `status_arsip`;
- `status_berkas`;
- `klasifikasi_id`;
- metadata-only `search`;
- `limit`;
- `offset`.

`OPEN` folders may have `status_arsip=null`. Old `CLOSED` folders may also have `status_arsip=null`; the read model treats this as transitional unknown state instead of crashing.

## Folder Detail DTO

Folder detail returns the same safe folder metadata plus an item list.

Each item includes:

- `item_id`;
- `source_type`;
- source title/name;
- source date;
- source nominal when safely present;
- source creator display name when safely available;
- attachment count and `has_attachments`;
- lightweight `WORKFLOW` provenance: status, current step, fungsi, kegiatan;
- lightweight `MANUAL` provenance: category name and keterangan;
- safe warning labels for missing source or unavailable attachment metadata.

The detail DTO does not include physical paths, storage roots, file tokens, signed token internals, raw logical paths, raw SQL, raw DB rows, or transitional `canonical_arsip_id` bridge values.

## Source Compatibility

`berkas_arsip_item.source_type` controls source lookup:

- `WORKFLOW` reads from `dokumen_transaksi`;
- `MANUAL` reads from `manual_arsip`.

The transitional `canonical_arsip_id` bridge may exist on item rows, but this read model does not treat `arsip.arsip` as the primary authority for folder-first pages.

`arsip.arsip` remains transitional compatibility for existing old pages and file-access surfaces until folder-first replacements are ready.

## Non-Goals

Phase 13N does not:

- add browser UI pages;
- add API routes;
- modify `src/routeTree.gen.ts`;
- change close/finalize behavior;
- change workflow `Pengklasifikasian Dokumen` behavior;
- change `Penambahan Dokumen` behavior;
- stop transitional `arsip.arsip` writes;
- de-transitionalize old archive pages;
- implement folder-level lifecycle transitions;
- implement `DIMUSNAHKAN` file-access blocking;
- change preview/download/file-access behavior;
- delete physical files;
- mutate or delete database rows;
- backfill existing data;
- change schema or migrations;
- change packages or env files;
- change storage helpers;
- modify historical Supabase artifacts.

## Follow-Up Recommendation

Recommended next phase:

```text
13O - Folder-first pages using read model
```

Phase 13O should add UI/API wrappers around this helper, keep server-side `KEPALA_SUB_BAGIAN_UMUM` authorization authoritative, and continue avoiding de-transitionalization until replacement pages are ready and human-reviewed.

Later separate phases should handle folder-level lifecycle movement, folder item preview/download, `DIMUSNAHKAN` blocking, old page cleanup, and physical destruction.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-read-model.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase src/routeTree.gen.ts
git diff -- src/routes src/lib/storage src/db
```
