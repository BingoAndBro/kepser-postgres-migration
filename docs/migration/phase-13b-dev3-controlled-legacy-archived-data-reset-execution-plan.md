# Phase 13B-dev.3 - Controlled Legacy Archived Data Reset Execution Plan

Date: 2026-05-29

Status: docs/design only. This phase creates a controlled execution plan for a later local-development legacy archive reset. It does not execute cleanup, mutate database rows, delete physical files, add routes, add UI, add a helper, run migrations, run seeds, inspect live database rows, or change runtime behavior.

This is not production readiness, not public rollout approval, not go-live approval, not operational certification, not security certification, and not compliance validation.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog. This phase does not claim Supabase is fully removed from the repository and does not approve any Supabase fallback.

## 1. Phase Status

Phase 13B-dev.3 is documentation and execution-plan design only.

This phase:

- performs no cleanup execution;
- performs no database mutation;
- deletes no database rows;
- updates no database rows;
- inserts no database rows;
- deletes no physical files;
- adds no reset helper, route, API, UI, scheduler, migration, seed, package change, route generation, or runtime wiring;
- does not inspect live database rows.

The future reset remains local-development only and destructive only after a separate implementation phase and a human-run confirmation-gated execute phase.

## 2. Input Analyze Result

Phase 13B-dev.2 completed a live analyze/dry-run against the local development database and returned safe aggregate counts only:

```json
{
  "archiveRowsCandidateCount": 8,
  "archiveAttachmentSnapshotCandidateCount": 3,
  "archivedWorkflowDocumentCandidateCount": 4,
  "archivedWorkflowAttachmentMetadataCandidateCount": 4,
  "manualArchiveRowsCandidateCount": 4,
  "manualArchiveAttachmentCandidateCount": 3,
  "lifecycleOrProposalRowsCandidateCount": 1,
  "logRowsPotentiallyAffectedCount": 25,
  "workflowDocumentRowsPreservedCount": 6,
  "masterDataPreservedCount": 75,
  "physicalFileDeletionPlanned": false,
  "cleanupExecutionAllowedInThisPhase": false,
  "warnings": [
    "ATTACHMENT_METADATA_COUNTS_ARE_METADATA_ROW_COUNTS_NOT_FILE_COUNTS",
    "CLEANUP_EXECUTION_DISABLED_IN_THIS_PHASE",
    "LOG_ROWS_ARE_PROTECTED_BY_DEFAULT_AND_COUNTED_ONLY_AS_POTENTIALLY_AFFECTED",
    "PHYSICAL_FILE_DELETION_OUT_OF_SCOPE"
  ]
}
```

This document intentionally includes no row ids, raw rows, logical paths, physical paths, storage roots, SQL parameters, environment values, database URLs, session values, cookies, tokens, password hashes, or secrets.

## 3. Reset Goal

The reset goal is to clear old local-development Phase 12 archive and finalized archived document data so Phase 13 folder-first archive filing can start from a clean development dataset.

Phase 13 changes archive timing:

```text
document classified first -> placed into open folder/berkas -> folder closed/finalized -> archive lifecycle starts
```

Old Phase 12 data already represents finalized item-level archive rows, old Manual Archive rows, lifecycle/proposal state, and archived workflow source documents. Keeping it in the local development database can make Phase 13 folder-first testing ambiguous. The future reset should remove only the approved disposable legacy archive set while preserving active workflow, auth, master, and storage boundaries.

## 4. Candidate Reset Set

The future reset candidate set is conceptual and must remain source/status scoped:

- old canonical archive rows from the Phase 12 archive model;
- archive snapshot metadata tied to candidate canonical archive rows;
- lifecycle/proposal rows tied to candidate canonical archive rows;
- old archived workflow source documents tied to candidate workflow archive rows;
- workflow attachment metadata tied only to those archived source documents;
- old Manual Archive source rows that conflict with the Phase 13 Penambahan Dokumen flow;
- Manual Archive attachment metadata tied only to those candidate Manual Archive source rows.

Candidate selection must not become a blind delete of all archive or document rows. Future implementation should continue returning only safe aggregate counts.

## 5. Protected Data Set

The reset must preserve:

- users;
- roles;
- user_roles;
- sessions and auth data;
- master data;
- fungsi;
- kegiatan;
- ketua_tim_assignments;
- non-archived workflow documents;
- `DRAFT` documents;
- `IN_PPK_VALIDATION` documents;
- `IN_BENDAHARA_APPROVAL` documents;
- `NEED_REVISION` documents;
- `COMPLETED` documents;
- `TERSIMPAN` documents;
- active document attachment metadata tied to preserved documents;
- `manual_arsip_category`;
- `master_klasifikasi_arsip`;
- env files;
- package files;
- `src/routeTree.gen.ts`;
- physical files and storage.

Auth/RBAC and master tables are preserved because they are required for local development identity, authorization, workflow testing, and Phase 13 classification/folder work.

## 6. log_aktivitas Policy

`dokumen.log_aktivitas` is protected by default and append-only by application contract.

Because the future reset may delete legacy archived workflow source documents, FK constraints may require special handling. Current Drizzle schema review shows `log_aktivitas.dokumen_id` references `dokumen_transaksi.id` with cascade delete, while the application contract still protects logs by default.

Phase 13B-dev.3 does not approve broad audit deletion. A future implementation phase must inspect actual FK behavior before executing any reset and must report only safe aggregate log counts.

If logs block deletion or would be affected by deleting candidate archived workflow source documents, the preferred dev-only policy options are:

- Option A: delete only log rows tied to candidate archived source documents as a narrow dev-reset exception.
- Option B: keep archived source documents but mark them excluded from Phase 13 if logs cannot be touched.
- Option C: use an FK-safe reset strategy if schema allows preserving logs while deleting candidate archived source documents.

Recommended option: Option A, but only for a future explicitly approved dev-reset execution phase. This recommendation fits the Phase 13 goal of clearing old archived workflow source documents and matches the current FK behavior, where deleting candidate archived source documents would affect only their tied logs through the document relationship. The future helper must pre-count affected logs, execute inside a guarded transaction, return `deletedLogRowsCount`, and keep the exception narrow to candidate archived source documents only.

If a future reviewer rejects any log deletion, fall back to Option B and preserve the archived source documents while excluding them from Phase 13 folder-first surfaces.

## 7. Proposed FK-Safe Execution Order

Based on Drizzle schema review, the safest conceptual order for a future transaction is:

1. Reload and lock/re-evaluate the candidate set after confirmation, using the same discriminator as analyze mode.
2. Delete candidate lifecycle/proposal rows tied to candidate canonical archive rows.
3. Delete candidate Manual Archive attachment metadata rows tied to candidate Manual Archive source rows.
4. Delete candidate Manual Archive source rows, after their attachments are gone.
5. Delete candidate canonical archive rows, after proposal/lifecycle rows and candidate Manual Archive source links are gone or safely nullable.
6. Delete candidate archived workflow source documents tied to candidate workflow archive rows.
7. Let only the narrowly approved candidate log rows be deleted if FK cascade requires it and the future execute phase explicitly approves Option A; otherwise preserve source documents under Option B.

Notes:

- `arsip_usul_musnah.arsip_id` uses `no action`, so proposal/lifecycle rows must be handled before canonical archive rows.
- `manual_arsip_attachment.manual_arsip_id` uses `no action`, so Manual Archive attachments must be handled before Manual Archive rows.
- `manual_arsip.canonical_arsip_id` is nullable with `set null`, but candidate Manual Archive rows should still be removed before canonical rows for clearer accounting.
- `arsip.dokumen_id` uses `no action`, so canonical workflow archive rows must be removed before candidate archived workflow documents.
- `log_aktivitas.dokumen_id` currently cascades from document deletion, but application policy requires explicit future approval before relying on that cascade.

No physical file operation belongs in this order.

## 8. Confirmation Gate

A future execute phase must require this exact confirmation phrase:

```text
RESET LEGACY ARCHIVE DEV DATA FOR PHASE 13
```

Missing, empty, case-changed, whitespace-altered, or otherwise wrong confirmation must reject before any database mutation or file work. Analyze mode must never require confirmation because it must remain read-only.

## 9. Expected Future Execute Result Shape

A future execute helper should return safe aggregate counts only:

```ts
type Phase13LegacyArchiveDevResetExecutionResult = {
  deletedArchiveRowsCount: number
  deletedArchiveSnapshotMetadataCount: number
  deletedArchivedWorkflowDocumentsCount: number
  deletedArchivedWorkflowAttachmentMetadataCount: number
  deletedManualArchiveRowsCount: number
  deletedManualArchiveAttachmentRowsCount: number
  deletedLifecycleOrProposalRowsCount: number
  deletedLogRowsCount?: number
  logRowsPreservedCount?: number
  physicalFileDeletionPerformed: false
  warnings: string[]
}
```

The future result must not include ids, raw rows, logical paths, physical paths, storage roots, SQL, SQL parameters, env values, database URLs, session values, cookie values, tokens, password hashes, or secrets.

## 10. Rollback And Backup Reminder

This reset is destructive local-development work. Before any future execute phase, the human operator must ensure a local backup, snapshot, or export exists if they care about the legacy archive data.

Phase 13B-dev.3 does not run backup commands, does not inspect database connection settings, and does not print environment values or database URLs.

## 11. Physical Files

Physical file deletion is out of scope for the future execution helper described here.

Required policy:

- no physical file deletion in the execution helper;
- `physicalFileDeletionPerformed` must remain `false`;
- database reset may create orphan files;
- storage orphan analyze/cleanup is a separate future phase;
- physical cleanup must not leak paths or storage roots;
- physical cleanup must continue protecting active document attachments and any retained archive/file references.

## 12. Validation Plan For Future Implementation

A later implementation phase should include the smallest relevant validation only:

- targeted unit test for the exact confirmation gate;
- targeted unit test proving analyze mode performs no mutation;
- targeted unit test for the safe output shape;
- human-run analyze before execute;
- human-run execute only after exact confirmation;
- analyze after execute to verify remaining safe aggregate counts;
- no broad build, broad test, E2E, dev server, migrations, seeds, route generation, cleanup execution, or storage cleanup unless explicitly approved.

## 13. Next Recommended Phases

Recommended next phases:

- `13B-dev.4` - Implement Confirmation-Gated DB Reset Helper at `src/lib/archive/phase13-legacy-archive-dev-reset-execution.ts`. This implementation phase adds the internal helper and targeted unit tests only; it must not run execute/reset against the live database.
- `13B-dev.5` - Human-Run Controlled Execute.
- `13B-dev.6` - Post-Reset Analyze And Storage Orphan Planning.

Phase 13B-dev.3 does not automatically approve moving to execution.

## 14. Open Risks

Open risks before future execution:

- the current candidate discriminator is count-oriented and must be revalidated at execution time;
- deleting archived workflow source documents can affect tied `log_aktivitas` rows through FK behavior, so the future phase needs explicit approval for the narrow dev-only exception;
- preserving logs while deleting archived workflow source documents may not be possible with the current schema without changing the reset strategy;
- Manual Archive rows linked to canonical archive rows need transaction-safe ordering to avoid partial cleanup;
- physical files may become orphaned after metadata reset and require separate storage planning;
- this is local-development guidance only and must not be treated as production cleanup guidance.

## 15. Validation For This Phase

Required validation for Phase 13B-dev.3:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- docs/migration/phase-13b-dev3-controlled-legacy-archived-data-reset-execution-plan.md
git diff -- docs/migration/phase-13b-controlled-legacy-archive-dev-data-reset.md
```

Do not run broad build, broad tests, E2E, dev server, route generation, migrations, seeds, cleanup execution, storage cleanup, or live database mutation for this phase.
