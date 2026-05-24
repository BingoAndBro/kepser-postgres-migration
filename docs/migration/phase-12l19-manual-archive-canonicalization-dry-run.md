# Phase 12L.19 - Manual Archive Canonicalization Dry-Run

Date: 2026-05-24

Status: implemented pending human review. This phase adds an internal read-only dry-run helper and mocked unit tests only. It does not run a live database report, execute live backfill, call the live mutation helper, add routes, add UI, add CLI/scheduler behavior, create migrations, change schema, execute seeds, run route generation, or perform cleanup.

## Scope And Boundary

Phase 12L.19 adds a narrowly scoped dry-run harness for exactly one explicitly human-approved `arsip.manual_arsip` row.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary for any future runtime caller. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive work remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Dry-Run Helper Purpose

New helper:

```text
src/lib/archive/manual-archive-canonicalization-dry-run.ts
```

Primary export:

```text
dryRunManualArchiveCanonicalizationForReview(input)
```

The helper lets a reviewer inspect whether one specific source row would be eligible for canonical `MANUAL` parent creation. It uses dependency injection, reloads the current row by `manualArsipId`, classifies it with the Phase 12L.17 remediation classifier, and builds a safe preview with the existing Manual Archive canonical write planner.

The helper is internal only. It is not wired to routes, UI, CLI commands, schedulers, report readers, live reports, automatic backfill, or runtime create/edit flows.

## Approved Single-Row READY-Only Behavior

The helper requires `approvedByUserId` before any database work. `approvalNote` is accepted only as caller context and is not stored.

At execution time, dry-run verifies the current row state:

- the source row exists;
- `status_arsip='AKTIF'`;
- `canonical_arsip_id` is null;
- required metadata is complete;
- `nominal_realisasi` is valid and positive;
- classification id and classification snapshots exist;
- `archived_by` and `created_by` exist;
- the classifier includes `READY_FOR_CANONICALIZATION`;
- blocking buckets are absent:
  `NEEDS_HUMAN_METADATA`, `LINKED_BROKEN`, `LINKED_WRONG_SOURCE_TYPE`,
  `NON_AKTIF_DEFERRED`, and `NOMINAL_INVALID`.

Results:

- ready unlinked rows return `status: 'would_canonicalize'`;
- already linked rows with an existing canonical `source_type='MANUAL'` row return `status: 'already_linked'`;
- missing, broken-link, wrong-source, non-`AKTIF`, metadata-incomplete, nominal-invalid, or otherwise blocked rows return `status: 'not_ready'`.

## Safe Preview Fields

For `would_canonicalize`, the dry-run result may include only safe canonical insert preview fields:

- `sourceType`
- `dokumenId`
- `namaArsip`
- `nomorSurat`
- `klasifikasiId`
- `klasifikasiKodeSnapshot`
- `klasifikasiNamaSnapshot`
- `retensiAktif`
- `retensiInaktif`
- `masaAktifBerakhir`
- `masaInaktifBerakhir`
- `archivedAt`
- `archivedBy`
- `createdBy`
- `nominalRealisasi`
- `statusArsip`
- `metadata = {}`

The result must not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, tokens, signed URL internals, raw attachment metadata, SQL details, SQL parameters, env values, DB URLs, session/cookie values, password data, secrets, or raw DB rows.

## No Mutation Guarantee

The dry-run helper does not call:

- `canonicalizeReadyManualArchiveRowForReview()`;
- `insert`;
- `update`;
- `delete`;
- `transaction`.

It does not insert canonical rows, update `manual_arsip.canonical_arsip_id`, write `log_aktivitas`, store approval metadata, mutate canonical metadata, run a live report, process all READY rows, or cleanup data/files.

The unit tests use a mocked database with mutation methods that fail if called.

## Attachment Protection Policy

Manual Archive attachments remain source-specific.

This dry-run helper:

- may read only a safe attachment count;
- preserves `ATTACHMENT_REVIEW_REQUIRED` as a warning;
- does not let attachment count block `would_canonicalize` by itself;
- does not read or return attachment filenames, logical paths, physical paths, storage roots, file URLs, tokens, or raw metadata;
- does not move, rename, delete, rewrite, re-upload, consolidate, or update attachment rows/files.

## What Is Intentionally Not Changed

This phase does not:

- call the live mutation helper;
- add public API, routes, UI, CLI, scheduler, or automatic report processing;
- run a live DB report;
- run live backfill;
- automatically process all `READY_FOR_CANONICALIZATION` rows;
- mutate any database rows;
- create canonical `MANUAL` rows;
- update source links;
- process broken links, wrong-source links, non-`AKTIF` rows, metadata-incomplete rows, or nominal-invalid rows;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- modify attachment upload, preview, or download behavior;
- modify workflow archive routes;
- implement unified archive list/detail UI;
- implement lifecycle APIs;
- implement aggregate/export;
- cleanup rows, tables, test data, attachment records, or storage files;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files, generated routes, `db/`, `drizzle/`, or `supabase/`.

## Validation Commands

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/manual-archive-canonicalization-dry-run.test.ts
pnpm test tests/unit/arsiparis/manual-archive-canonicalization-backfill.test.ts
pnpm test tests/unit/arsiparis/manual-archive-remediation-report.test.ts
pnpm test tests/unit/arsiparis/manual-archive-canonical.test.ts
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

Do not run broad build/E2E, DB migrations/seeds, route generation, live reports, or live backfill for this phase.

## Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.20 - Human Approval Artifact And Operator Procedure For One Manual Archive READY Dry-Run
```

That phase should define the approval artifact, reviewer role, operator procedure, and durable audit expectations before any live execution path is considered. A later live mutation path should remain separate, require server-side authorization for the approved operational role, preserve one-row execution, and continue to reject broken links, wrong-source links, non-`AKTIF` rows, missing metadata, invalid nominal values, attachment mutation, cleanup, and broad backfill.

## Risks And Open Decisions

Risks:

- dry-run output can become stale if the source row changes after review;
- future callers must not treat `approvedByUserId` as authorization by itself;
- dry-run still depends on mocked read-only tests until a separately approved local PostgreSQL smoke procedure exists;
- attachment counts are only a review signal and do not prove attachment cleanup safety;
- legacy broken links, wrong source types, and non-`AKTIF` rows still require separate human remediation policy.

Open decisions:

- exact reviewer role and approval artifact;
- durable approval audit location and retention;
- whether future execution should be a guarded internal CLI, maintenance route, or manual operator script;
- how to present stale-row revalidation failures to operators;
- when to run a live read-only report and how to pick the first real dry-run row;
- whether decimal legacy nominal values remain acceptable or require manual correction before live use.
