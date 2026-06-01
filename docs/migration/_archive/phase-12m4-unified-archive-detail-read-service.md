# Phase 12M.4 - Unified Archive Detail Read Service

Date: 2026-05-24

Status: implemented pending human review. This phase adds an internal dependency-injected read-only detail helper and mocked unit tests only. It does not add routes, UI, preview/download actions, lifecycle mutation, search, aggregate/export, cleanup, backfill, migrations, schema changes, route generation, live reports, or broad tests.

Implementation note after Phase 12M.5: the read service is now consumed by the read-only canonical detail API/page at `/api/arsiparis/arsip/$id` and `/arsiparis/arsip/$id`. Attachment metadata display, preview/download actions, lifecycle mutation, cleanup, backfill, migrations, schema changes, and source-link mutation remain deferred to later phases.

## Scope And Boundary

Phase 12M.4 implements the read service planned by Phase 12M.3 for one canonical archive id from `arsip.arsip`.

New helper:

```text
src/lib/archive/unified-archive-detail.ts
```

Primary exports:

```text
createUnifiedArchiveDetailReader(database)
getUnifiedArchiveDetail(archiveId)
```

The helper is dependency-injected for mocked tests and future internal callers. The direct helper lazily imports the active local Drizzle `db`, matching the Phase 12M.1 unified list service pattern.

The active data path remains local PostgreSQL plus Drizzle. Active Supabase runtime/package dependency remains retired; historical Supabase artifacts remain and are not changed by this phase.

## Safe DTO Fields

The service returns:

```text
UnifiedArchiveDetailResult =
  | { status: 'found'; detail: UnifiedArchiveDetail }
  | { status: 'not_found' }
```

Safe common detail fields:

```text
id
sourceType
statusArsip
namaArsip
nomorSurat
klasifikasiId
klasifikasiKodeSnapshot
klasifikasiNamaSnapshot
tanggalArsip
retensiAktif
retensiInaktif
masaAktifBerakhir
masaInaktifBerakhir
nominalRealisasi
createdBy
archivedBy
createdAt
updatedAt
warnings
source
```

The DTO does not include attachment lists in this phase.

The DTO must not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, tokens, signed URL internals, raw attachment metadata, raw JSON snapshots, SQL details, SQL parameters, environment values, DB URLs, session/cookie values, password data, secrets, or raw DB rows.

## WORKFLOW Source Policy

For `source_type='WORKFLOW'`, the service reads canonical archive metadata first, then reads safe workflow source metadata only when `dokumen_id` exists.

Safe workflow source fields:

```text
sourceType
dokumenId
judulDokumen
isNonMaterial
workflowStatus
fungsiNama
kegiatanNama
tahun
createdBy
```

The service does not include workflow edit data, approval internals, file paths, attachment snapshots, preview URLs, download URLs, or raw workflow rows.

If `dokumen_id` is missing, the service returns the common archive detail with `source=null` and `WORKFLOW_WITHOUT_DOKUMEN_ID`.

If the workflow row cannot be found, the service returns the common archive detail with `source=null` and `WORKFLOW_SOURCE_NOT_FOUND`.

## MANUAL Source Policy

For `source_type='MANUAL'`, the service reads the linked source row by:

```text
manual_arsip.canonical_arsip_id = arsip.id
```

Safe Manual Archive source fields:

```text
sourceType
manualArsipId
nama
keterangan
categoryId
categoryName
tanggalDokumenSumber
tanggalDiarsipkan
createdBy
archivedBy
```

The service may join `manual_arsip_category` for `categoryName`. It does not read attachment rows, attachment paths, raw metadata JSON, file internals, or create/update canonical links.

If the Manual Archive source row cannot be found, the service returns the common archive detail with `source=null` and controlled missing-source warnings.

## Warnings Policy

Warnings are safe controlled labels only:

```text
UNKNOWN_SOURCE_TYPE
MISSING_MANUAL_SOURCE
WORKFLOW_WITHOUT_DOKUMEN_ID
MANUAL_WITH_DOKUMEN_ID
WORKFLOW_SOURCE_NOT_FOUND
MANUAL_SOURCE_NOT_FOUND
SOURCE_METADATA_INCOMPLETE
```

Warnings are report/display signals only. The service does not auto-fix, relink, backfill, clear links, create canonical rows, update source rows, delete data, or expose SQL/path/token diagnostics.

## Read-Only Guarantee

The reader performs SELECT-only work:

1. Select one canonical `arsip.arsip` row by id.
2. If `WORKFLOW`, optionally select safe metadata from `dokumen_transaksi` plus safe master data names.
3. If `MANUAL`, optionally select safe metadata from `manual_arsip` plus category name.
4. Return a safe DTO.

The helper must not call:

```text
insert
update
delete
transaction
```

Mocked tests include mutation methods that fail if called.

## Authorization Note For Future Route/Page

This phase is service-only and does not add a route, API, or page, so route authorization is not implemented here.

Future Phase 12M.5 route/page/API integration must enforce:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM`;
- no authorization from `dms_active_role`;
- `ADMIN`-only rejected for operational archive detail access;
- server/API RBAC as authoritative.

## What Is Intentionally Not Changed

This phase does not:

- add `/arsiparis/arsip/$id`;
- add routes or pages;
- modify `src/routeTree.gen.ts`;
- run route generation;
- modify existing status-specific detail pages;
- add preview/download actions;
- change existing preview/download endpoints;
- add attachment metadata display;
- implement lifecycle mutation;
- implement destruction mutation;
- implement search;
- implement aggregate/export;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run a live DB report;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema;
- modify migration files;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`.

## Validation Commands

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

Do not run broad build/E2E, DB migrations/seeds, route generation, live reports, live backfill, or cleanup for this phase.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12M.5 - Unified Archive Detail Page Integration
```

That phase should wire a read-only route/page/API to the detail service at the recommended canonical route `/arsiparis/arsip/$id`, where `$id` is `arsip.arsip.id`. It must keep preview/download actions, source-aware attachment metadata display, lifecycle mutation, search, aggregate/export, cleanup, backfill, migrations, and schema changes separately scoped unless explicitly approved.

## Risks And Open Decisions

Risks:

- legacy unlinked Manual Archive rows remain absent from unified canonical detail until remediation/backfill is separately approved;
- source integrity warnings expose safe labels but do not repair data quality;
- user display names are not joined in this first service, so source actor fields are ids only;
- attachment metadata is intentionally absent until a source-aware attachment policy is implemented;
- future route callers must add server-side RBAC and must not trust `dms_active_role`.

Open decisions:

- exact read-only detail page layout and warning wording;
- whether `DIMUSNAHKAN` rows are reachable by direct detail URL in the first UI phase;
- whether workflow attachments use snapshot index semantics or a new source-aware attachment abstraction;
- when to run a live read-only report and how to handle legacy unlinked rows;
- when to schedule the dedicated development cleanup phase.
