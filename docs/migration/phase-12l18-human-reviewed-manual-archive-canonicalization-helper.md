# Phase 12L.18 - Human-Reviewed Manual Archive Canonicalization Helper

Date: 2026-05-24

Status: implemented pending human review. This phase adds an internal mutation-capable helper foundation and mocked unit tests only. It does not run a live database report, execute live backfill, add routes, add UI, add CLI/scheduler behavior, create migrations, change schema, execute seeds, run route generation, or perform cleanup.

## Scope And Boundary

Phase 12L.18 adds a narrowly scoped helper for exactly one explicitly approved existing Manual Archive source row.

The helper may canonicalize a row only if it is still classified as `READY_FOR_CANONICALIZATION` at execution time. The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary for any future runtime caller. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive work remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Helper Purpose

New helper:

```text
src/lib/archive/manual-archive-canonicalization-backfill.ts
```

Primary export:

```text
canonicalizeReadyManualArchiveRowForReview(input)
```

The helper is dependency-injected so tests and future internal callers can supply a DB/transaction object. It reuses:

- the Phase 12L.17 remediation classifier;
- the existing Manual Archive canonical write planner and insert-value mapping.

The helper is not called by existing create/edit APIs, routes, UI, report readers, CLI commands, schedulers, or automatic flows.

## Human-Reviewed READY-Only Rule

The helper requires an explicit `manualArsipId` and `approvedByUserId`. Approval metadata is not stored in this phase.

At execution time, the helper re-loads the current source row and verifies:

- the source row exists;
- `status_arsip='AKTIF'`;
- `canonical_arsip_id` is still null;
- all canonical helper-required fields are complete;
- `nominal_realisasi` is valid and positive;
- classification id and snapshots exist;
- `archived_by` and `created_by` exist;
- the classifier includes `READY_FOR_CANONICALIZATION`;
- the classifier does not include blocking buckets:
  `NEEDS_HUMAN_METADATA`, `LINKED_BROKEN`, `LINKED_WRONG_SOURCE_TYPE`,
  `NON_AKTIF_DEFERRED`, or `NOMINAL_INVALID`.

`ATTACHMENT_REVIEW_REQUIRED` is preserved as a warning bucket and does not block canonical parent creation by itself.

## Transaction Behavior

For ready rows only, the helper performs one transaction:

1. re-load the source row and safe attachment count inside the transaction;
2. re-classify the current row;
3. verify the row is still ready and still unlinked;
4. build canonical `MANUAL` insert values with the existing canonical helper;
5. insert one `arsip.arsip` row with `source_type='MANUAL'`;
6. update `manual_arsip.canonical_arsip_id` with guards:
   `id = manualArsipId`, `canonical_arsip_id IS NULL`, and `status_arsip='AKTIF'`;
7. throw a controlled error if the guarded source-link update affects no row.

The canonical insert and source-link update are committed or rolled back together by DB transaction semantics.

## Non-Ready And Already-Linked Behavior

If the row is missing, incomplete, non-`AKTIF`, nominal-invalid, linked-broken, linked-wrong-source, or otherwise no longer ready, the helper returns `status: 'not_ready'` with controlled bucket and missing-field labels when available. It does not mutate anything.

If `canonical_arsip_id` already points to an existing canonical row with `source_type='MANUAL'`, the helper returns `status: 'already_linked'` and does not create another canonical row.

If `canonical_arsip_id` is present but the linked canonical row is missing or has the wrong source type, the helper returns `not_ready` and does not auto-fix, relink, clear the source link, or create a replacement row.

## Attachment Protection Policy

Manual Archive attachments remain source-specific.

This helper:

- may read only a safe attachment count;
- preserves `ATTACHMENT_REVIEW_REQUIRED` as a warning bucket;
- does not read or return attachment file paths;
- does not move, rename, delete, rewrite, re-upload, or consolidate files;
- does not update attachment rows;
- does not add preview/download/file-token behavior.

Canonical rows created by the helper do not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, token values, signed URL internals, raw attachment metadata, SQL details, env values, DB URLs, session values, password data, or secrets.

## Approval Metadata

`approvedByUserId` is required as an execution precondition so future callers cannot accidentally treat the helper as an automatic report processor.

`approvalNote` is accepted for future caller-side audit context, but this phase does not store approval metadata in `manual_arsip`, `arsip.arsip`, canonical metadata, log tables, or any new schema field.

Durable approval audit remains future work if humans decide a route, CLI, or operational procedure should call this helper.

## What Is Intentionally Not Changed

This phase does not:

- call the helper from runtime routes;
- add public API, UI, CLI, scheduler, or automatic report processing;
- run a live DB report;
- run live backfill;
- automatically process all `READY_FOR_CANONICALIZATION` rows;
- mutate any real database data by default;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- modify attachment upload, preview, or download behavior;
- modify workflow archive routes;
- process linked rows, broken links, wrong-source links, or non-`AKTIF` rows;
- process rows with `NEEDS_HUMAN_METADATA` or `NOMINAL_INVALID`;
- cleanup rows, tables, test data, attachment records, or storage files;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files, generated routes, `db/`, `drizzle/`, or `supabase/`.

## Validation

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/manual-archive-canonicalization-backfill.test.ts
pnpm test tests/unit/arsiparis/manual-archive-remediation-report.test.ts
pnpm test tests/unit/arsiparis/manual-archive-canonical.test.ts
```

The mocked tests cover:

- ready row canonicalization;
- non-ready no-op behavior;
- non-`AKTIF` no-op behavior;
- already-linked no-op behavior;
- broken/wrong-source link no-op behavior;
- controlled transaction failure when source-link update fails;
- attachment warning preservation without path leakage;
- safe result shape without path, token, storage, SQL, env, or secret fields.

## Risks And Open Decisions

Risks:

- this is now mutation-capable helper code, so future callers must preserve explicit human approval and server-side authorization;
- transaction rollback is asserted through mocked transaction boundaries, but real rollback semantics still need local PostgreSQL runtime smoke testing before any live use;
- legacy rows can still become stale between report review and helper execution, so re-classification at execution time remains mandatory;
- broken links and wrong source types still require human remediation policy;
- non-`AKTIF` rows remain deferred until lifecycle unification policy exists;
- durable approval audit is not implemented.

Open decisions:

- exact human approval workflow and reviewer role;
- whether future execution should be a guarded internal CLI, admin-only maintenance route, or manual operator script;
- whether approval audit should use an existing audit table or a new schema field/table;
- whether decimal legacy nominal values remain acceptable or require manual correction before live use;
- how to remediate broken links and wrong source types after human review;
- when to run a live read-only report and how to select the first test row.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.19 - Human-Reviewed Dry-Run Harness For One Manual Archive READY Row
```

That phase should still avoid broad backfill. It should define the human approval artifact, load exactly one approved row, provide a dry-run mode first, and only then consider a separately approved live execution path with server-side authorization, durable audit, and operator-visible rollback expectations.
