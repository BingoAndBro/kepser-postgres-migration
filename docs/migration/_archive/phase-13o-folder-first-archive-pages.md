# Phase 13O - Folder-First Archive Pages Using Read Model

Date: 2026-05-29

Status: implemented pending targeted test and human review.

## Phase Status

Phase 13O adds a bounded folder-first archive page foundation for Kepala Sub Bagian Umum users.

This phase creates read-only UI/API surfaces for active archive folders and folder detail. It does not change write behavior, archive lifecycle mutation behavior, workflow classification behavior, manual document creation behavior, close-folder behavior, schema, migrations, storage helpers, file access, package files, env files, seeds, cleanup behavior, physical files, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Routes And Pages Added

New browser pages:

- `/arsiparis/berkas` - folder-first active archive list.
- `/arsiparis/berkas/$id` - folder-first detail page with a lightweight item list.

New read-only API wrappers:

- `GET /api/arsiparis/berkas`
- `GET /api/arsiparis/berkas/$id`

The existing legacy/transitional pages remain available:

- `/arsiparis/aktif`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/arsip/$id`

Navigation for the Kepala Sub Bagian Umum active archive entry now points to `/arsiparis/berkas` with label `Pemberkasan Arsip Aktif`. The old `/arsiparis/aktif` route is retained as a compatibility page.

## Read Model Usage

The new API wrappers use the Phase 13N folder-first read model:

- list page API delegates to `listBerkasArsipFolders()`;
- detail page API delegates to `getBerkasArsipDetail()`;
- `berkas_arsip` plus `berkas_arsip_item` remain the primary read authority for the new pages;
- source metadata is enriched through the existing read model from workflow/manual source tables.

The new folder-first pages do not use `arsip.arsip` as the primary authority.

## Authorization Boundary

The new API wrappers require:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` server-side;
- no `ADMIN` substitute.

`dms_active_role` is not used as authorization proof.

## UI Scope

### List Page

The list page is scoped to active finalized folders by requesting:

- `status_berkas = CLOSED`;
- `status_arsip = AKTIF`.

It shows:

- `Jenis Pembayaran`;
- `Status Berkas`;
- `Status Arsip`;
- `Nomor SPM`;
- `Jumlah Dokumen`;
- `Dokumen Workflow`;
- `Dokumen Manual`;
- `Total Nominal`;
- `Tanggal Ditutup`;
- detail link.

### Detail Page

The detail page shows:

- folder metadata panel;
- status badges with friendly Indonesian labels;
- retention metadata;
- item counts and total nominal;
- folder warnings for transitional states.

### Item Rows/Cards

The item list uses lightweight cards and shows:

- source type label: `Workflow` or `Manual`;
- title/name;
- nominal if available;
- source date if available;
- creator display name if available;
- attachment count;
- workflow provenance: status, fungsi, kegiatan;
- manual provenance: category and keterangan snippet;
- safe warnings when source data is missing or transitional.

No full old individual archive detail page is embedded in the new detail page.

## Not Changed

Phase 13O does not:

- delete old archive pages;
- redirect old archive pages;
- stop transitional `arsip.arsip` writes;
- de-transitionalize workflow or manual writes;
- change Pengklasifikasian Dokumen behavior;
- change Penambahan Dokumen behavior;
- change close/finalize behavior;
- add lifecycle mutations for `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN`;
- add preview/download actions;
- change file-access behavior;
- implement `DIMUSNAHKAN` blocking;
- delete physical files;
- mutate database rows;
- backfill data;
- add schema or migrations;
- change packages, env files, storage helpers, or historical Supabase artifacts.

## Route Tree Status

New TanStack route files were added, so `src/routeTree.gen.ts` must be generated through the normal TanStack route generator. The generated file must not be edited manually.

## Follow-Up Recommendation

Recommended follow-ups:

- review the Phase 13O.1 runtime smoke report in `docs/migration/phase-13o1-runtime-smoke-folder-first-archive-pages.md`;
- human smoke the new folder-first active list and detail pages;
- add folder-first Inaktif and Usul Musnah pages after active page review;
- add folder-level lifecycle action UI only in a separate phase;
- implement folder-aware preview/download and `DIMUSNAHKAN` blocking in a separate file-access phase;
- clean up old individual archive pages only after folder-first replacements are reviewed.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
pnpm test tests/unit/auth/roles-navigation.test.ts
pnpm test tests/unit/arsiparis/berkas-arsip-read-model.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/lib/storage src/db
git diff -- src/routeTree.gen.ts
```
