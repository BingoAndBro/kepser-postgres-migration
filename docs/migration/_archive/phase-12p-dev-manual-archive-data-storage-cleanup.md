# Phase 12P-dev - Development Manual Archive Data/Storage Cleanup

Date: 2026-05-25

Status: implemented for review. This phase adds an internal helper for human-controlled local/development cleanup of invalid Manual Archive metadata and its disposable physical files.

## 1. Scope And Boundary

In scope:

- internal helper `cleanupInvalidManualArchiveDevData`;
- dry-run by default;
- explicit execute mode with exact confirmation phrase;
- invalid/unlinked Manual Archive source row detection;
- safe physical file deletion for invalid Manual Archive attachment files only;
- metadata deletion for invalid `manual_arsip_attachment` and `manual_arsip` rows only;
- focused unit tests with mocked DB/storage.

Out of scope:

- no UI route, public API route, scheduler, cron, route generation, schema change, migration, seed, package change, broad storage scan, canonical archive deletion, WORKFLOW deletion, preview/download change, export/aggregate change, or classification report menu.

This is local/development cleanup only. It is not production cleanup guidance.

## 2. Why Cleanup Is Needed Before 12Q

Phase 12Q will add the Unified Archive Classification Report. That report is expected to count archive rows and sum `nominal_realisasi` by classification across canonical `arsip.arsip` rows for `WORKFLOW` and `MANUAL`.

Old invalid Manual Archive source rows that are unlinked, broken-linked, or wrong-source can confuse developer review and local smoke testing before the report is built. Phase 12P-dev gives a controlled way to remove that disposable development residue while preserving canonical archive data.

## 3. Invalid Data Definition

Candidate invalid Manual Archive data:

- `manual_arsip` rows with `canonical_arsip_id` null;
- `manual_arsip` rows whose `canonical_arsip_id` points to no existing `arsip.arsip` row;
- `manual_arsip` rows linked to a canonical row whose `source_type` is not `MANUAL`;
- `manual_arsip_attachment` rows that belong to those invalid Manual Archive rows.

The helper accepts a bounded `limit` for the primary Manual Archive scan.

## 4. Protected Data Definition

Protected data:

- every `arsip.arsip` canonical row;
- every canonical `WORKFLOW` archive and its `lampiran_snapshot` references;
- every valid Manual Archive row linked to an existing canonical `source_type='MANUAL'` row;
- every attachment row for valid linked Manual Archive rows;
- every file reference found in canonical archive metadata or valid linked Manual Archive attachments.

Protected references are used internally only and are not returned.

## 5. Dry-Run Behavior

Dry-run is the default:

```ts
cleanupInvalidManualArchiveDevData()
```

Dry-run:

- identifies invalid Manual Archive rows;
- identifies candidate attachment files;
- performs safety planning through injected or local storage adapters with `dryRun: true`;
- returns safe counts and warning labels;
- deletes no physical files;
- deletes no metadata rows.

## 6. Execute Confirmation Behavior

Execution requires:

```ts
cleanupInvalidManualArchiveDevData({
  dryRun: false,
  confirm: 'HAPUS DATA ARSIP MANUAL DEV INVALID',
})
```

Missing or wrong confirmation returns:

```text
status='rejected'
warnings=['INVALID_CONFIRMATION']
```

No DB or storage work is performed on rejected execution.

## 7. Physical File Deletion Safety

The helper deletes only file candidates from invalid Manual Archive attachment rows.

Safety rules:

- logical paths are normalized with existing local storage path helpers;
- unsafe/traversal/root-escape candidates are skipped;
- physical paths are resolved only through local storage helpers;
- root containment is checked with `lstat` and `realpath`;
- symlinks and non-file targets are rejected;
- files referenced by canonical archive metadata or valid linked Manual Archive attachments are skipped;
- missing files count as already missing;
- delete failures are counted with controlled warning labels.

The helper does not scan the whole storage root.

## 8. Metadata Deletion Safety

Execution order:

1. identify invalid Manual Archive rows;
2. build protected canonical reference set;
3. delete eligible candidate files outside DB transaction;
4. delete invalid attachment rows and invalid Manual Archive rows in a DB transaction when available.

Filesystem deletion is not placed inside the DB transaction. If any file deletion fails or a candidate path is unsafe for a Manual Archive row, that row and its attachment metadata are kept and the result is `partial`.

Canonical `arsip.arsip` rows are never deleted.

## 9. Safe Report DTO

The helper returns only safe counts and controlled warnings:

```ts
{
  mode: 'dry_run' | 'execute',
  status: 'completed' | 'partial' | 'rejected' | 'failed',
  scannedManualRows: number,
  invalidManualRows: number,
  deletedManualRows: number,
  scannedAttachmentRows: number,
  deletedAttachmentRows: number,
  attemptedFileDeleteCount: number,
  deletedFileCount: number,
  alreadyMissingFileCount: number,
  skippedFileCount: number,
  failedFileDeleteCount: number,
  protectedReferenceCount: number,
  warnings: string[],
}
```

The DTO excludes physical paths, logical paths, storage roots, file tokens, signed URLs, raw rows, raw attachment metadata, SQL, env values, DB URLs, session/cookie values, and secrets.

## 10. What Is Intentionally Not Changed

This phase does not:

- add routes or UI buttons;
- change routeTree;
- change canonical archive lifecycle;
- change preview/download/file access;
- change aggregate/export behavior;
- add the classification report menu;
- delete canonical `arsip.arsip` rows;
- delete WORKFLOW archive data;
- delete valid Manual Archive canonical data;
- scan the whole storage root;
- run cleanup automatically;
- add scheduler/cron;
- add package dependencies;
- modify package files;
- create schema/migration changes;
- touch `db/`, `drizzle/`, or historical `supabase/` artifacts;
- reintroduce old file recovery behavior.

## 11. Validation

Targeted validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/dev-manual-archive-cleanup.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
pnpm test tests/unit/arsiparis/unified-archive-export.test.ts
pnpm test tests/unit/arsiparis/unified-archive-physical-destruction.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- db
git diff -- drizzle
git diff -- supabase
git diff -- src/routeTree.gen.ts
```

Do not run broad build, E2E, DB migrations, seeds, route generation, or real destructive cleanup for this phase.

## 12. Manual/Developer Verification

1. Do not run execute mode against valuable data.
2. Run the helper in dry-run first.
3. Inspect safe counts only.
4. For execute testing, use disposable local/development invalid Manual Archive rows and disposable files only.
5. Confirm valid canonical `arsip.arsip` rows remain.
6. Confirm valid linked Manual Archive rows remain.
7. Confirm WORKFLOW archive rows/files remain.
8. Confirm files referenced by canonical archive data remain.
9. Confirm invalid Manual Archive metadata and disposable files are removed only after exact confirmation.
10. Confirm no path, token, storage root, SQL, env value, session/cookie value, or secret appears.

## 13. Next Roadmap Item

Proceed next to:

```text
Phase 12Q - Unified Archive Classification Report
```

Goal: report total archive count and total `nominal_realisasi` by archive classification across canonical `WORKFLOW` and `MANUAL` archives.
