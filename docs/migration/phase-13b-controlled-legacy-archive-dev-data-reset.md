# Phase 13B-dev - Controlled Legacy Archive Dev Data Reset Planning And Helper Audit

Date: 2026-05-29

Status: planning/analyze foundation only. This phase audits the existing cleanup helper patterns and documents a future controlled development-only reset path for legacy Phase 12 archive data. It does not perform cleanup, inspect live database rows, delete physical files, add routes, change UI, run migrations, run seeds, change schema, change package files, or change Supabase runtime behavior.

This is not production readiness, not public rollout approval, not go-live approval, not operational certification, not security certification, and not compliance validation.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog. This phase does not claim Supabase is fully removed from the repository and does not approve any Supabase fallback.

## 1. Phase Status

Phase 13B-dev is documentation and cleanup-governance planning only.

This phase:

- performs no database cleanup or reset;
- deletes no database rows;
- deletes no storage files or physical files;
- runs no migration, seed, live report, cleanup script, or helper execution;
- adds no runtime route, UI, scheduler, or automatic cleanup wiring;
- changes no schema, Drizzle model, migration, package file, or route generation output;
- preserves the Phase 13A decision that legacy Phase 12 archive development data should be reset later only through a controlled human-approved process.

The intended future execution sequence remains:

```text
analyze -> show safe counts only -> explicit confirmation -> cleanup -> analyze again
```

Cleanup execution is not allowed in this phase.

## 2. Why A Reset Is Needed

Phase 13A changes the target archive domain from item-first archive rows to a folder-first flow:

```text
completed workflow document or manually added document
-> Pengklasifikasian Dokumen
-> Jenis Pembayaran
-> open folder/berkas
-> close/finalize folder
-> final archive metadata such as Nomor SPM and retention
-> folder-level archive lifecycle
```

Old Phase 12 archive data may confuse local development and smoke testing because it already represents finalized archive records, lifecycle state, unified detail behavior, classification reports, and old Manual Archive rows before the new folder/berkas model exists.

The human-approved development policy now includes legacy archived document data. Archived source documents from the old Phase 12 model may be included in a future controlled reset together with their archive rows so Phase 13 folder-first work starts from a clean local development dataset.

The reset is intended only for disposable local/development legacy archive data. It is not production cleanup guidance.

## 3. Existing Helper Audit

Reviewed helper patterns:

- `src/lib/archive/dev-manual-archive-cleanup.ts`
- `src/lib/archive/unified-archive-physical-destruction.ts`
- `src/lib/storage/local-storage-diagnostics.ts`
- `src/routes/api/admin/analyze-storage.ts`
- `src/routes/api/admin/cleanup-orphan-files.ts`

Findings:

- The Phase 12P-dev Manual Archive cleanup helper is dry-run-first and confirmation-gated, but it is scoped to invalid or unlinked `manual_arsip` rows and their attachment files. It intentionally protects canonical `arsip.arsip` rows and WORKFLOW data, so it is not a complete Phase 13 legacy archive reset helper.
- The unified physical destruction helper is scoped to physical file deletion for canonical archives already marked `DIMUSNAHKAN`. It is not a metadata reset helper and must not be reused to delete Phase 12 archive rows.
- The admin storage analyze/cleanup route is storage-oriented and admin-only. It protects referenced `dokumen_transaksi.lampiran_urls` and `arsip.lampiran_snapshot`, but it is not a Phase 13 archive metadata reset tool.
- None of the existing helpers can safely infer which `arsip.arsip` rows and archived source documents from the old Phase 12 model are disposable development data without a human-approved discriminator.

Helper decision for Phase 13B-dev planning:

- no new helper is added in this phase;
- no existing helper is extended in this phase;
- docs-only is safer because the reset must be candidate-based and source/status scoped, not a blind archive or document deletion;
- the approved policy is that old archived workflow source documents may be reset together with their old Phase 12 archive rows, while non-archived workflow documents are preserved;
- a later helper should be implemented only after the candidate-selection discriminator and FK-safe delete/reset order are approved.

Phase 13B-dev.1 implementation update:

- internal helper added at `src/lib/archive/phase13-legacy-archive-dev-reset-analysis.ts`;
- exported function: `analyzePhase13LegacyArchiveDevReset`;
- exported result type: `Phase13LegacyArchiveDevResetAnalysis`;
- helper status is analyze-only and development-only;
- output is restricted to safe aggregate counts and controlled warning labels;
- it returns no row ids, raw rows, filenames, logical paths, physical paths, storage roots, SQL parameters, env values, DB URLs, tokens, cookies, session values, password hashes, or secrets;
- it adds no route, API, UI, scheduler, cron, startup wiring, migration, seed, schema change, package change, route generation, or cleanup execution;
- `physicalFileDeletionPlanned` remains `false`;
- `cleanupExecutionAllowedInThisPhase` remains `false`;
- next phase should be a human-run analyze/dry-run and review of safe counts before any future reset execution phase is considered.

Phase 13B-dev.4 implementation update:

- internal execution helper added at `src/lib/archive/phase13-legacy-archive-dev-reset-execution.ts`;
- exported constant: `PHASE13_LEGACY_ARCHIVE_DEV_RESET_CONFIRMATION`;
- exported functions: `resetPhase13LegacyArchiveDevData` and `resetPhase13LegacyArchiveDevDataForDatabase`;
- exported result/type surface: `Phase13LegacyArchiveDevResetExecutionResult`, `Phase13LegacyArchiveDevResetExecutionMode`, `Phase13LegacyArchiveDevResetExecutionInput`, and `Phase13LegacyArchiveDevResetExecutionDatabase`;
- helper is server-only and development-only;
- analyze mode remains read-only and delegates to the Phase 13B-dev.1 analyze helper;
- execute mode exists only as an internal helper path and must not be run in Phase 13B-dev.4;
- execute mode requires the exact confirmation phrase `RESET LEGACY ARCHIVE DEV DATA FOR PHASE 13`;
- wrong or missing confirmation rejects before transaction or mutation;
- execute mode requires database transaction support and must not perform best-effort partial cleanup outside a transaction;
- execution output is aggregate-only and returns no ids, raw rows, paths, storage roots, SQL parameters, env values, database URLs, tokens, cookies, session values, password hashes, or secrets;
- `physicalFileDeletionPerformed` remains `false`;
- no route, API, UI, scheduler, cron, startup wiring, schema change, migration, seed, package change, route generation, live cleanup execution, or physical file deletion is added.

Phase 13B-dev.6 post-reset verification update:

- post-reset verification and storage orphan planning are documented in `docs/migration/phase-13b-dev6-post-reset-verification-and-storage-orphan-planning.md`;
- the post-reset DB analyze result reports zero legacy archive reset candidates from the database perspective;
- physical storage cleanup remains open as a separate explicit future phase;
- no reset execution, storage cleanup, route/API/UI/scheduler work, schema/migration change, package change, or physical file deletion is approved by Phase 13B-dev.6.

Phase 13B-dev.7 controlled storage cleanup update:

- controlled local-development formal orphan storage cleanup is documented in `docs/migration/phase-13b-dev7-controlled-storage-orphan-cleanup.md`;
- existing storage diagnostics and cleanup helpers removed formal orphan candidates after aggregate-only analysis;
- post-cleanup storage analyze reports zero formal orphan candidates, zero missing referenced files, and zero unsafe files;
- no database rows, routes, UI, scheduler behavior, schema, migrations, package files, or route generation output were changed.

## 4. Schema Boundary Summary

Relevant archive tables:

- `arsip.arsip` is the current canonical unified archive parent table with `source_type='WORKFLOW' | 'MANUAL'`.
- `arsip.arsip.lampiran_snapshot` stores WORKFLOW attachment metadata snapshots.
- `arsip.arsip_usul_musnah` references `arsip.arsip` and must be handled before deleting candidate canonical archive rows.
- `arsip.manual_arsip` stores old Manual Archive source rows and may link to canonical `arsip.arsip` through `canonical_arsip_id`.
- `arsip.manual_arsip_attachment` stores old Manual Archive attachment metadata and logical storage references.
- `arsip.manual_arsip_category` is master/category data for the old Manual Archive source model and must not be deleted blindly.

Relevant source tables and default boundaries:

- `dokumen.dokumen_transaksi` remains the workflow document source table. Non-archived rows remain needed for Phase 13 document classification testing by default.
- `dokumen.log_aktivitas` is append-only by application contract. Generic cleanup must not update or delete it; narrow dev-reset handling may be considered later only if FK constraints require it and the future helper phase explicitly approves it.
- `auth.users`, `auth.roles`, `auth.user_roles`, and `auth.sessions` are auth/RBAC tables and are outside the reset boundary.
- `master.*` tables, including fungsi, kegiatan, document/request master data, archive classification master data, and `ketua_tim_assignments`, are outside the reset boundary.

## 5. Potentially Resettable Later

The following may be reset later only after schema verification, human approval, and a safe candidate discriminator:

- canonical `arsip.arsip` rows that are explicitly classified as disposable old Phase 12 development archive data;
- `arsip.arsip.lampiran_snapshot` metadata only as part of deleting those candidate canonical rows;
- `arsip.arsip_usul_musnah` rows tied only to candidate canonical archive rows;
- archived workflow source document rows tied to old Phase 12 archive data and explicitly approved as disposable development data;
- attachment metadata tied only to those deleted archived source documents, subject to FK and schema validation;
- narrowly scoped `dokumen.log_aktivitas` rows tied only to deleted archived source documents if FK constraints require it and the future execution helper phase explicitly approves it;
- old `manual_arsip` rows that conflict with the Phase 13 Penambahan Dokumen direction and are explicitly approved as disposable development data;
- `manual_arsip_attachment` metadata rows tied only to approved candidate `manual_arsip` rows.

Candidate cleanup must respect foreign-key order:

```text
candidate proposal/lifecycle rows
-> candidate manual attachment metadata
-> candidate manual source rows
-> candidate canonical archive rows
-> candidate archived workflow attachment metadata, if schema-coupled
-> candidate archived workflow source documents
-> narrowly approved candidate log rows only if FK/order requires it
```

This order is planning guidance only. It is not an execution approval.

## 6. Must Not Be Touched Blindly

Future cleanup must not blindly delete, update, or reset:

- users;
- roles;
- user-role assignments;
- auth sessions;
- password hashes or auth metadata;
- master data;
- fungsi;
- kegiatan;
- `ketua_tim_assignments`;
- non-archived workflow documents needed for testing;
- document source rows still needed for Phase 13 classification testing;
- `DRAFT`, `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, `COMPLETED`, and `TERSIMPAN` documents, unless a later explicit phase approves a broader development dataset reset;
- active document attachment metadata;
- `dokumen.log_aktivitas`;
- `manual_arsip_category`;
- `master_klasifikasi_arsip`;
- `.env`;
- `.env.migration`;
- package files;
- `src/routeTree.gen.ts`;
- storage or physical files unless a future physical cleanup phase explicitly approves it.

Workflow archive rows require special care. The approved development-only policy is that candidate legacy archived document data may include `source_type='WORKFLOW'` archive rows and their archived source documents from the old Phase 12 model. This must remain candidate-based and status/source scoped; it must not become a blind deletion of all documents.

`log_aktivitas` remains protected by default. A narrow dev-reset exception may be designed later only if FK constraints require it, only for logs tied to deleted legacy archived source documents, and only if the future helper phase explicitly approves that handling.

## 7. Future Analyze Result Shape

A future analyze-only helper may return safe aggregate counts only, with no row ids, raw rows, SQL parameters, logical paths, physical paths, storage roots, env values, DB URLs, cookies, sessions, tokens, password hashes, or secrets.

Recommended safe result shape:

```ts
type Phase13LegacyArchiveDevResetAnalysis = {
  archiveRowsCandidateCount: number
  archiveAttachmentSnapshotCandidateCount: number
  archivedWorkflowDocumentCandidateCount: number
  archivedWorkflowAttachmentMetadataCandidateCount: number
  manualArchiveRowsCandidateCount: number
  manualArchiveAttachmentCandidateCount: number
  lifecycleOrProposalRowsCandidateCount: number
  logRowsPotentiallyAffectedCount: number
  workflowDocumentRowsPreservedCount: number
  masterDataPreservedCount: number
  physicalFileDeletionPlanned: false
  cleanupExecutionAllowedInThisPhase: false
  warnings: string[]
}
```

The analysis must be read-only and count-only. It must not inspect or return sensitive values.

## 8. Safety Protocol For Future Helper

If a later phase adds a helper, it must be internal/development-only and server-only. It must not be imported by client components and must not be wired to UI, routes, API, scheduler, cron, seed, migration, or automatic startup behavior.

Required behavior:

- default mode is analyze/dry-run;
- analyze returns safe aggregate counts only;
- execute/reset is a separate path;
- execute/reset requires this exact confirmation phrase:

```text
RESET LEGACY ARCHIVE DEV DATA FOR PHASE 13
```

- wrong or missing confirmation must reject before DB mutation or file work;
- execute/reset must delete or reset related archive rows and archived source document rows in FK-safe order;
- physical file deletion remains disabled unless a later explicit physical cleanup phase approves it;
- protected data counts must be reported only as aggregates;
- physicalFileDeletionPlanned must remain `false`;
- no row ids, raw rows, SQL parameters, storage roots, physical paths, logical paths, token internals, cookies, session values, env values, DB URLs, password hashes, or secrets may be returned or logged.

Recommended future helper modes:

```ts
type Phase13LegacyArchiveDevResetMode = 'analyze' | 'execute'
```

Execution must never run as part of Phase 13B-dev. Phase 13B-dev.4 implements the internal helper only; the next execution decision remains a separate human-run controlled phase after reviewing safe analyze output.

## 9. No Physical File Deletion

Physical file cleanup is not part of Phase 13B-dev.

Future archive metadata reset may make some files unreferenced, but physical storage cleanup must remain a separate explicitly approved phase because:

- file access policy must continue to block `DIMUSNAHKAN`;
- active document attachments must remain protected;
- archive snapshots may preserve metadata even when files are unavailable;
- local storage cleanup must avoid root/path leakage and unsafe deletion;
- a metadata reset and a physical cleanup have different rollback and audit risks.

For Phase 13B-dev:

```text
physicalFileDeletionPlanned: false
cleanupExecutionAllowedInThisPhase: false
```

## 10. Validation For This Phase

Required validation:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

For Phase 13B-dev.1 helper implementation, run the smallest targeted helper validation available. The intended targeted validation is:

```bash
pnpm exec vitest run tests/unit/arsiparis/phase13-legacy-archive-dev-reset-analysis.test.ts
```

Do not run broad build, broad test, E2E, dev server, route generation, migrations, seeds, cleanup execution, or live DB inspection for this phase.

## 11. Open Risks And Blockers

Open blockers before execution can be approved:

- no approved discriminator currently identifies exactly which canonical archive rows and archived source documents from the old Phase 12 model are disposable development data;
- exact FK delete/update order still needs source verification before helper implementation;
- log handling needs an explicit narrow future decision because `dokumen.log_aktivitas` is append-only by default and may be FK-coupled to deleted archived source documents;
- old Manual Archive source rows conflict with the Phase 13 Penambahan Dokumen direction, but a future bridge/reset decision must define whether to delete, preserve, or migrate them;
- physical file cleanup remains explicitly out of scope;
- broad audit/log deletion remains blocked.

## 12. Next Recommended Phase

Recommended next phase options:

1. `13B-dev.1` - implement internal analyze-only helper for legacy archived document data reset.
2. `13B-dev.2` - human-run analyze/dry-run using the helper from `13B-dev.1`, returning safe counts only.
3. `13B-dev.3` - docs-only controlled execution plan for disposable local development legacy archive data. See `docs/migration/phase-13b-dev3-controlled-legacy-archived-data-reset-execution-plan.md`.
4. `13B-dev.4` - implement confirmation-gated DB reset helper.
5. `13B-dev.5` - human-run controlled execute.
6. `13B-dev.6` - post-reset analyze and storage orphan planning.
7. `13B-dev.7` - controlled local-development formal storage orphan cleanup.

Do not automatically proceed to cleanup execution.
