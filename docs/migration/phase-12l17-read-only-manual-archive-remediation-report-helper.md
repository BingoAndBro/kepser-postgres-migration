# Phase 12L.17 - Read-Only Manual Archive Remediation Report Helper

Date: 2026-05-24

Status: implemented pending human review. This phase adds internal read-only helper logic and mocked unit tests only. It does not run a live database report, mutate rows, create canonical `MANUAL` rows, update source links, add routes, add UI, create migrations, change schema, execute seeds, run route generation, or perform cleanup.

## Scope And Boundary

Phase 12L.17 implements the report helper recommended by Phase 12L.16 for existing `arsip.manual_arsip` rows that may still be source-only or may have invalid canonical links.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative for any future caller. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

This helper is internal and report-only. It classifies rows for human review and future planning. It does not approve backfill or execute remediation.

## Helper Functions Added

New helper:

```text
src/lib/archive/manual-archive-remediation-report.ts
```

Exports:

- `classifyManualArchiveRemediationRow(input)`
- `summarizeManualArchiveRemediationRows(rows)`
- `createManualArchiveRemediationReportReader(database)`
- `getManualArchiveRemediationReport(options?)`
- `getManualArchiveRemediationReportForDatabase(database, options?)`
- controlled bucket, missing-field, and warning constants/types

The default DB reader is dependency-injected for tests and later internal callers. It is bounded to a default limit of 100 rows and a maximum limit of 500 rows.

## Controlled Bucket Labels

The helper uses only these controlled remediation buckets:

- `READY_FOR_CANONICALIZATION`
- `NEEDS_HUMAN_METADATA`
- `LINKED_OK`
- `LINKED_BROKEN`
- `LINKED_WRONG_SOURCE_TYPE`
- `NON_AKTIF_DEFERRED`
- `NOMINAL_INVALID`
- `ATTACHMENT_REVIEW_REQUIRED`

Linked rows are never classified as `READY_FOR_CANONICALIZATION`. Non-`AKTIF` rows are deferred from early canonicalization. Attachment review is a cleanup/file-protection warning and is not a blocker by itself.

## Safe DTO And Report Output

Report rows contain only safe metadata:

- `manualArsipId`
- `canonicalArsipId`
- `statusArsip`
- `buckets`
- `missingFields`
- `warnings`
- `attachmentCount`
- `createdAt`
- `tanggalDiarsipkan`
- `namaArsip`

The report does not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, token values, signed token internals, raw attachment metadata, SQL details, SQL parameters, environment values, DB URLs, session/cookie values, password data, secrets, or full raw DB rows.

## Classification Behavior

Linked source rows:

- existing link plus missing joined canonical row -> `LINKED_BROKEN`
- existing link plus joined canonical `source_type` other than `MANUAL` -> `LINKED_WRONG_SOURCE_TYPE`
- existing link plus joined canonical `source_type='MANUAL'` -> `LINKED_OK`

Unlinked rows:

- complete `AKTIF` metadata and valid nominal -> `READY_FOR_CANONICALIZATION`
- missing or unusable metadata -> `NEEDS_HUMAN_METADATA` plus controlled missing field labels
- invalid nominal -> `NOMINAL_INVALID`
- `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN` -> `NON_AKTIF_DEFERRED`

Nominal compatibility:

- null, zero, negative, and non-numeric values are invalid;
- positive DB numeric values are accepted, including decimal-like strings such as `250000.00`;
- this matches the current canonical helper's read/write compatibility with PostgreSQL numeric values;
- the helper does not auto-correct, round, rewrite, or approve a future mutation policy for decimal legacy rows.

## Read-Only Behavior

The DB reader uses only bounded `select` queries:

- select Manual Archive parent metadata from `arsip.manual_arsip`
- left join canonical `arsip.arsip` by `manual_arsip.canonical_arsip_id`
- select grouped attachment counts from `arsip.manual_arsip_attachment`

The helper does not call `insert`, `update`, `delete`, or `transaction`. It is not exposed through a route, UI, CLI wrapper, scheduled task, or public API by this phase.

## What Is Intentionally Not Changed

This phase does not:

- run a live DB report;
- mutate database rows;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- backfill existing Manual Archive rows;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- modify Manual Archive attachment upload behavior;
- modify Manual Archive preview/download behavior;
- modify workflow archive routes;
- add public API or routes;
- implement unified archive list/detail UI;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows, tables, test data, attachment records, or storage files;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files, generated route files, `db/`, `drizzle/`, or `supabase/`.

## Tests

Focused mocked unit tests cover:

- ready unlinked `AKTIF` row;
- linked `MANUAL` canonical row;
- broken canonical link;
- wrong canonical source type;
- non-`AKTIF` deferral;
- missing metadata labels;
- invalid nominal values;
- attachment review warning without path/token leakage;
- summary aggregation;
- safe DTO keys;
- select-only DB reader behavior.

## Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.18 - Human-Reviewed Per-Row Canonicalization Helper For READY Rows
```

That phase should remain separate and should only proceed after humans review the 12L.17 helper/report output. It should process only explicitly approved `READY_FOR_CANONICALIZATION` rows and should not process broken links, wrong source types, non-`AKTIF` rows, attachments, cleanup, lifecycle unification, aggregate/export, UI, routes, schema changes, or broad migrations unless separately approved.

Implementation note as of Phase 12L.18: an internal dependency-injected one-row canonicalization helper now exists for explicitly approved rows that are still `READY_FOR_CANONICALIZATION` at execution time. It is not wired to routes, UI, CLI, scheduler, report readers, live reports, or automatic backfill, and it does not process linked, broken-link, wrong-source, non-`AKTIF`, metadata-incomplete, or nominal-invalid rows.

## Risks And Open Decisions

Risks:

- the helper can classify rows but does not fix data quality issues;
- legacy unlinked rows remain source-only until a future approved mutation phase;
- broken links and wrong source types require human review and must not be repaired by guessing;
- non-`AKTIF` rows remain deferred until lifecycle unification policy exists;
- attachment references remain source-specific and must be protected in future cleanup/file phases.

Open decisions:

- who reviews and approves rows by bucket;
- whether decimal legacy nominal values should remain accepted for canonical helper compatibility or require manual correction before mutation;
- whether non-`AKTIF` Manual Archive rows should ever be canonicalized before lifecycle unification;
- how to remediate broken links or wrong source type links after human review;
- whether a dedicated canonical-to-source relationship column is needed before unified detail behavior.
