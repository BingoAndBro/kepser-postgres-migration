# Phase 12M.1 - Unified Archive Query Service

Date: 2026-05-24

Status: implemented pending human review. This phase adds an internal read-only query helper and mocked unit tests only. It does not add routes, UI, lifecycle APIs, aggregate/export, migrations, schema changes, live reports, live backfill, cleanup, seeds, route generation, or broad tests.

## Scope And Boundary

Phase 12M.1 starts the unified archive read layer for future Arsip Aktif, Inaktif, and Usul Musnah pages.

New helper:

```text
src/lib/archive/unified-archive-query.ts
```

Primary export:

```text
createUnifiedArchiveQueryReader(database)
getUnifiedArchiveList(options?)
```

The helper is dependency-injected for mocked tests and future internal callers. It is read-only and selects canonical archive parent rows from `arsip.arsip`.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary for any future route caller. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive access remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Canonical Source Model

The query service uses `arsip.arsip` as the primary source.

Rules:

- `source_type='WORKFLOW'` rows use `arsip.dokumen_id` as the source reference.
- `source_type='MANUAL'` rows use a left join from `manual_arsip.canonical_arsip_id = arsip.id` only to expose the safe Manual Archive source id and attachment count.
- Unlinked legacy `manual_arsip` rows are not silently included.
- Existing legacy/unlinked Manual Archive rows remain remediation/report scope from Phases 12L.16 through 12L.19.
- The helper does not join workflow document tables because `dokumen_id` is already present on the canonical row.

## Unified DTO Fields

The list DTO is safe metadata only:

```text
UnifiedArchiveListRow {
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
  hasWorkflowDocument
  hasManualSource
  sourceReferenceId
  attachmentCount
  warnings
}
```

The DTO does not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, tokens, signed URL internals, raw attachment metadata, SQL details, SQL parameters, env values, DB URLs, session/cookie values, password data, secrets, or raw DB rows.

`nominalRealisasi` preserves the existing database/schema convention and is not formatted to Rupiah. Formatting belongs to UI or export layers.

## Query Options

Supported options:

```text
UnifiedArchiveQueryOptions {
  statusArsip?
  sourceType?
  klasifikasiId?
  limit?
  offset?
  search?
}
```

Behavior:

- default `limit` is 100;
- maximum `limit` is 500;
- invalid or less-than-one limits fall back to the default;
- offset is non-negative and capped;
- `statusArsip`, `sourceType`, and `klasifikasiId` are applied as simple filters;
- default ordering is stable newest-first by canonical archive timestamps, then id;
- no transaction wrapper is opened.

Search is intentionally deferred in this phase. Implementing search through broad `LIKE` scans across canonical text columns is too risky without a separately approved indexing/search policy. If a caller passes `search`, the helper records `deferredQueryOptions: ['search']` in the summary and does not apply a broad text scan.

## Source Integrity Warnings

Rows may include controlled warning labels:

- `MISSING_MANUAL_SOURCE`: `source_type='MANUAL'` but no `manual_arsip` row is found by `canonical_arsip_id`.
- `WORKFLOW_WITHOUT_DOKUMEN_ID`: `source_type='WORKFLOW'` but `dokumen_id` is null.
- `MANUAL_WITH_DOKUMEN_ID`: `source_type='MANUAL'` but `dokumen_id` is not null.
- `UNKNOWN_SOURCE_TYPE`: source type is not one of the supported canonical constants.

Warnings are report signals only. The helper does not auto-fix, relink, backfill, clear links, create canonical rows, or mutate source rows.

## Attachment Count Policy

Attachment output is count-only:

- WORKFLOW rows may count `lampiran_snapshot` length when it is already available as an array or JSON array.
- MANUAL rows may count grouped `manual_arsip_attachment` rows by joined Manual Archive source id.
- The helper does not read or return filenames, logical paths, physical paths, storage roots, file URLs, tokens, signed URL internals, content types, sizes, or raw attachment metadata.
- Attachment counts are not permission to cleanup, delete, consolidate, move, rename, or rewrite files.

## Read-Only Guarantee

The helper uses SELECT-only read calls:

- select canonical `arsip.arsip` rows;
- left join `manual_arsip` for linked Manual Archive source id only;
- select grouped Manual Archive attachment counts only for source ids present in the current result set.

The helper must not call:

- `insert`;
- `update`;
- `delete`;
- `transaction`.

Mocked tests include mutation methods that fail if called.

## What Is Intentionally Not Changed

This phase does not:

- wire the helper to UI pages;
- add public API routes;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- modify workflow archive routes;
- implement unified list/detail UI;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- include unlinked legacy Manual Archive rows in unified canonical reads;
- run a live DB report;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files, generated routes, `db/`, `drizzle/`, or `supabase/`.

## Future Cleanup Note

Old development seed data and related storage files from pre-consolidation Manual Archive work may be cleaned in a later dedicated development cleanup phase after unified query, list, and detail behavior is stable.

This phase does not perform cleanup. Any future cleanup must be controlled, reference-protected, and must not print physical paths, storage roots, tokens, env values, secrets, logical paths, or raw file metadata.

## Validation Commands

Focused validation for this phase:

```bash
git diff --check
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

Recommended immediate next phase:

```text
Phase 12M.2 - Unified Archive List Page Integration
```

That phase should wire Arsip Aktif/Inaktif/Usul Musnah pages to the unified query service behind server-side `KEPALA_SUB_BAGIAN_UMUM` authorization. It should keep file access, lifecycle mutation, aggregate/export, attachment consolidation, legacy cleanup, migrations, and live backfill separate unless explicitly approved.

## Risks And Open Decisions

Risks:

- search is deferred, so future UI search must wait for an indexing/search policy;
- legacy unlinked Manual Archive rows remain absent from unified canonical lists until remediation or a separate compatibility decision;
- source integrity warnings expose safe labels but do not fix data quality;
- attachment counts are safe metadata only and do not prove cleanup eligibility;
- future route callers must add server-side RBAC and must not trust `dms_active_role`.

Open decisions:

- whether unified pages should show `DIMUSNAHKAN` rows by default or hide them from operational views;
- whether search should use trigram indexes, full-text search, or exact-prefix filters;
- whether future unified detail needs a dedicated canonical-to-source relationship column;
- when to run a live read-only report and how to handle legacy unlinked rows;
- when to schedule the dedicated development cleanup phase.
