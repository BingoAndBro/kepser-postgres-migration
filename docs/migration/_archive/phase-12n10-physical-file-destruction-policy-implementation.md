# Phase 12N.10 - Physical File Destruction Policy & Implementation

Date: 2026-05-25

Status: implemented for review. This phase adds an internal source-aware helper for physical file deletion of canonical archives that are already `DIMUSNAHKAN`.

## 1. Scope And Boundary

Phase 12N.10 adds a guarded internal helper:

```text
src/lib/archive/unified-archive-physical-destruction.ts
```

The helper is source-aware for canonical `arsip.arsip` rows with `source_type='WORKFLOW'` or `source_type='MANUAL'`. It is intentionally not wired to public UI, public API routes, scheduler, cron, broad cleanup, route generation, migrations, seeds, or live storage cleanup.

## 2. Final Business Goal

The final business goal is:

```text
DIMUSNAHKAN archives should eventually remove physical files from storage to prevent storage growth, while preserving archive metadata.
```

Archive metadata remains the record of what existed and why it was destroyed. File contents may be deleted only after the archive has already reached terminal lifecycle status.

## 3. Current Implementation Behavior

The new helper deletes physical files only when the canonical archive row is already:

```text
status_arsip='DIMUSNAHKAN'
```

It does not call lifecycle mutation, does not approve destruction, and does not run inside the `approve_destruction` transaction. Existing preview/download behavior remains status-based and must continue returning safe `410` responses for stale file action links after `DIMUSNAHKAN`.

## 4. Helper Behavior

Exported helper:

```ts
destroyPhysicalFilesForDestroyedArchive(input)
```

Supported input:

- `archiveId`
- optional `approvedByUserId` / `actorId` for future call sites, not persisted in this phase
- optional `dryRun`
- optional injected database adapter for tests/manual internal use
- optional injected storage adapter for tests/manual internal use

The default storage adapter uses local filesystem storage only. No Supabase runtime fallback or old file recovery behavior exists.

## 5. Status Guard

The helper reloads the canonical archive row by `arsip.arsip.id`.

Behavior:

- missing row returns `not_found`
- non-`DIMUSNAHKAN` row returns `not_destroyed`
- only `DIMUSNAHKAN` rows are eligible for physical deletion
- user input cannot override the status guard

`AKTIF`, `INAKTIF`, and `USUL_MUSNAH` archives are never physically deleted by this helper.

## 6. WORKFLOW Deletion Policy

For `source_type='WORKFLOW'`, the helper uses `arsip.lampiran_snapshot` as the file candidate reference.

Rules:

- read snapshot metadata only
- resolve candidates through local logical-path safety checks
- delete only candidates that pass storage-root containment checks
- preserve `lampiran_snapshot`
- preserve `dokumen_transaksi`
- preserve the canonical archive row
- do not clear or rewrite attachment metadata

Invalid or unsafe snapshot candidates are skipped with controlled warning labels only.

## 7. MANUAL Deletion Policy

For `source_type='MANUAL'`, the helper loads the linked source row through:

```text
manual_arsip.canonical_arsip_id = arsip.arsip.id
```

Then it loads linked `manual_arsip_attachment` rows for that source and deletes only their safe local logical-path candidates.

Rules:

- preserve `manual_arsip`
- preserve `manual_arsip_attachment`
- preserve `canonical_arsip_id`
- do not clear attachment metadata fields
- if the Manual Archive source row is missing, return `skipped` with `MANUAL_SOURCE_MISSING`

One `manual_arsip` parent remains one archive/report row regardless of attachment count.

## 8. Path Safety Policy

Physical deletion uses local filesystem storage helpers and containment checks:

- logical paths are normalized through `assertSafeLogicalStoragePath`
- physical paths are resolved through `resolvePhysicalStoragePath`
- deletion checks use `lstat`
- symlinks/reparse-like non-file targets are rejected by policy
- resolved target paths must remain under the configured storage root
- missing files count as already missing and do not make the whole operation fatal

The helper does not expose physical paths, storage roots, logical paths, filenames, tokens, raw attachment metadata, SQL, env values, session/cookie values, or secrets in its return DTO.

## 9. Metadata Preservation Policy

This phase does not:

- clear `lampiran_snapshot`
- delete `manual_arsip_attachment` rows
- delete `arsip.arsip` rows
- delete `manual_arsip` rows
- delete `dokumen_transaksi` rows
- update nominal/business metadata
- clear file metadata fields
- write file deletion status to the database

No schema field currently persists physical deletion status. The helper returns a safe outcome only.

## 10. No-audit Limitation

Phase 12N.9 planned archive-native audit, but no audit schema/table exists yet.

Therefore Phase 12N.10 does not write audit rows. The helper returns safe counts and controlled warnings only. A future audit implementation may persist attempted, deleted, failed, skipped, and already-missing counts without paths or raw metadata.

## 11. Safe Result DTO

The helper returns:

```ts
{
  status: 'completed' | 'partial' | 'skipped' | 'not_found' | 'not_destroyed' | 'failed',
  archiveId,
  sourceType,
  attemptedCount,
  deletedCount,
  alreadyMissingCount,
  failedCount,
  skippedCount,
  warnings,
}
```

The DTO intentionally excludes:

- physical paths
- logical paths
- storage roots
- filenames or path fragments
- file tokens or signed token internals
- raw attachment metadata
- raw DB rows
- SQL and SQL params
- env values and secrets

## 12. Tests And Validation

Focused unit tests:

```text
tests/unit/arsiparis/unified-archive-physical-destruction.test.ts
```

Coverage includes:

- missing canonical archive
- non-`DIMUSNAHKAN` guard
- WORKFLOW snapshot deletion candidates
- WORKFLOW metadata preservation
- MANUAL linked attachment candidates
- MANUAL row preservation
- missing Manual Archive source
- already-missing files
- unsafe traversal/root-escape candidate rejection
- partial failure reporting
- no-leak DTO assertions
- no Supabase import
- stale preview/download `410` behavior

Required targeted validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-physical-destruction.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
```

Do not run broad build, E2E, DB migrations, seeds, route generation, or real destructive cleanup for this phase.

## 13. Manual Retest / Developer Verification Notes

Do not run real deletion against valuable data.

If a later human-controlled local-dev smoke is approved:

1. Use a disposable `DIMUSNAHKAN` canonical archive only.
2. Use disposable files only.
3. Run the helper against that single archive id.
4. Verify metadata remains visible.
5. Verify stale preview/download remains `410`.
6. Verify only the disposable archive file is removed.
7. Verify no path, token, storage root, SQL, env value, session/cookie value, or secret is printed.

## 14. What Is Intentionally Not Changed

This phase does not:

- add public UI button
- add public API route
- add scheduler or cron
- add broad storage cleanup
- scan the whole storage root
- delete files for `AKTIF`, `INAKTIF`, or `USUL_MUSNAH`
- delete files during `mark_inactive` or `propose_destruction`
- change `approve_destruction` UI
- modify lifecycle route behavior
- modify legacy proposal routes
- implement `cancel_proposal`
- implement `restore_active`
- implement transition out of `DIMUSNAHKAN`
- clear `lampiran_snapshot`
- delete metadata rows
- modify Drizzle schema or migrations
- create audit table
- write audit rows
- modify package files
- touch `db/`, `drizzle/`, or `supabase/`
- modify `src/routeTree.gen.ts`
- run route generation
- reintroduce Supabase runtime behavior

## 15. Next Roadmap Item

Proceed next to the existing roadmap item:

```text
Phase 12N.11 - Legacy Proposal Route Compatibility Cleanup Plan
```

Do not add extra roadmap phases unless a human explicitly approves changing the roadmap.

Implementation note after 12N.11:

- Phase 12N.11 documents a compatibility cleanup plan for old proposal-based destruction routes. The legacy proposal approval route remains runtime-unchanged and should not be treated as the authoritative unified destruction path because it is proposal-id based, WORKFLOW-oriented, clears snapshot metadata, and directly deletes files outside the 12N.10 source-aware helper policy.
