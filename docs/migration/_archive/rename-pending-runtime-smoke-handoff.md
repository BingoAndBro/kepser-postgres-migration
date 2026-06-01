# Phase 6E.10 Rename-Pending Runtime Smoke Verification And Handoff

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.10 is verification and handoff only after the Phase 6E.9 `rename-pending` runtime change.

No runtime source code changed in this phase. No storage behavior changed in this phase.

This phase verifies and documents the current bounded state of:

```text
POST /api/dokumen/rename-pending
```

It does not implement submit, update, PPK resubmit, upload, UI, `AttachmentEditor`, delete/remove, archive destruction deletion, diagnostics/orphan cleanup, preview/download, route tree, database schema, auth/session runtime, or Supabase Storage migration behavior.

## 2. Current Verified Runtime State

Verified current state:

- `POST /api/dokumen/rename-pending` now uses local `dms_session` authorization through `getLocalServerSession(request)`.
- Body `userId` is compatibility input only and must match the local session user id.
- Document ownership check remains required before any file move; the route still reads the target document through the existing document helper and requires `dokumen.created_by` to match the local session user id.
- The route moves local pending files through `moveLocalPendingFileToFormal(...)`.
- The endpoint path remains `/api/dokumen/rename-pending`.
- The request shape remains `{ dokId, lampiranUrls, userId }`.
- The success shape remains `{ success: true, renamed, errors? }`.
- Returned `renamed[].oldPath` and `renamed[].newPath` values are logical storage paths only.
- Already formal paths and safe unsupported paths are skipped.
- Missing local source files are reported as controlled local storage failures.
- Missing local source files do not trigger Supabase fetch, copy, download, backfill, sync, or fallback.
- No Supabase Storage file migration, backfill, sync, copy, or download exists.

Safe now:

- Newly uploaded local pending files can be moved by `rename-pending` when they exist locally and the local session owns both the request and the document.
- Underscore `/api/upload` pending paths and dash pending paths are supported by the local move helper when the source file exists locally.
- Already formal and safe unsupported paths are not moved by this route.
- Route responses continue to expose only logical paths, not filesystem locations.

Not safe to infer from this phase:

- Submit local move parity is not verified.
- Update local move parity is not verified.
- PPK resubmit local move parity is not verified.
- Preview/download local default parity is not verified.
- Delete/remove, archive destruction deletion, and diagnostics/orphan cleanup are not verified.

## 3. Automated Verification

Focused command run:

```powershell
pnpm test tests/unit/storage/rename-pending-local-route.test.ts tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- First sandboxed run failed before tests started while Vitest loaded config with `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- Test files: 3 passed.
- Tests: 48 passed.

Covered focused test files:

- `tests/unit/storage/rename-pending-local-route.test.ts`
- `tests/unit/storage/local-pending-move.test.ts`
- `tests/unit/storage/local-storage-paths.test.ts`

## 4. Manual Runtime Smoke Checklist

Use placeholders only. Do not record real environment values, database URLs, physical filesystem paths, storage roots, cookies, tokens, generated internal signed URLs, Supabase signed URLs, or uploaded file contents.

Checklist:

1. Ensure the app is running in the local migration environment.
2. Log in as a local seeded user through the normal browser login flow.
3. Open the normal create-document UI that uses `FileUploadButton`.
4. Upload one allowed small file through the normal create-document UI.
5. Capture the returned logical pending `url` from the upload response as `<logicalPendingPath>`.
6. Call or trigger `POST /api/dokumen/rename-pending` with `{ dokId, lampiranUrls, userId }`, where `lampiranUrls` contains `<logicalPendingPath>` and `userId` is the local session user id placeholder.
7. Verify the response uses `{ success: true, renamed }`.
8. Verify `renamed[].oldPath` and `renamed[].newPath` are logical-only values.
9. Verify no physical path or storage root is shown in the UI or network response.
10. Verify the local pending source is moved to the formal target manually using only placeholders such as `<localStorageRoot>/<logicalPendingPath>` and `<localStorageRoot>/<logicalFormalPath>` in notes.
11. Verify already formal paths are skipped according to the current contract.
12. Verify safe unsupported paths are skipped according to the current contract.
13. Verify default preview/download remains Supabase-backed unless explicitly using the opt-in internal raw preview path.
14. Do not mark submit move behavior as verified because it remains out of scope.
15. Do not mark update move behavior as verified because it remains out of scope.
16. Do not mark PPK resubmit move behavior as verified because it remains out of scope.

## 5. Known Limitations After Phase 6E.9

- Submit route local move behavior is not implemented.
- Update route local move behavior is not implemented.
- PPK resubmit local move behavior is not implemented.
- `AttachmentEditor` still uses Supabase browser storage for direct upload and pending cleanup.
- Delete/remove behavior is not implemented locally.
- Archive destruction deletion is not implemented locally.
- Storage diagnostics and orphan cleanup are not implemented locally.
- Preview/download defaults remain Supabase-backed.
- Existing Supabase Storage files are not locally available.
- Local `rename-pending` only works for files that exist locally.

## 6. Compatibility Risks

- Mixed storage state is expected during the migration.
- Dash `AttachmentEditor` pending paths may still be Supabase-backed and missing locally.
- Underscore `/api/upload` pending paths are local only for new uploads after the local upload route change.
- The route still uses document ownership reads through the existing document helper, so broader local document read migration remains future work.
- Partial failure risk remains if earlier files move before a later file fails.
- Submit, update, and PPK resubmit may still expect Supabase-backed move behavior.

## 7. Rollback Criteria

Stop rollout or rollback the `rename-pending` storage route change if any of these appear:

- The route returns a different response shape.
- Body/session user mismatch is not blocked.
- Document owner mismatch is not blocked.
- A physical path or storage root is exposed.
- The route attempts Supabase fetch, copy, download, backfill, or sync.
- Local files are moved outside the storage root.
- A missing local source silently succeeds.
- Submit, update, or resubmit regression appears outside the known gap.
- Preview/download regression appears.

## 8. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.11 Submit Local Move Compatibility Planning
```

Do not jump directly to broad implementation.

Reasoning:

- Submit touches document creation.
- Submit touches FSM status behavior.
- Submit currently has `temp-id` storage-path compatibility behavior.
- Submit writes audit logs.
- Submit persists attachment metadata.
- Submit has DB/file partial-failure risks that are broader than `rename-pending`.
- Submit is more complex than `rename-pending` because it combines validation, file movement, document creation, workflow transition, status update, and audit insertion.
- Submit needs a route-specific plan before runtime implementation.

Direct implementation is not recommended as the next phase.

Follow-up: Phase 6E.11 completed that planning in `docs/migration/submit-local-move-compatibility-planning.md`. It did not implement submit local move behavior and recommends a submit preflight/bridge planning phase unless route implementation can be proven safely bounded.

## 9. Explicitly Not Implemented

Phase 6E.10 does not implement:

- runtime source changes;
- submit local move behavior;
- update local move behavior;
- PPK resubmit local move behavior;
- upload behavior changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL default enablement;
- Supabase Storage migration, copy, download, backfill, or sync;
- route tree changes;
- DB schema changes;
- auth/session runtime changes.

## 10. Validation Performed

Files read for verification:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/migration-constraints.md`
- `docs/migration/migration-roadmap.md`
- `docs/migration/phase-plan.md`
- `docs/migration/open-decisions.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/pending-to-formal-local-move-planning.md`
- `docs/migration/local-pending-move-helper-foundation.md`
- `docs/migration/rename-pending-local-move-route-planning.md`
- `docs/migration/rename-pending-local-move-route-implementation.md`
- `docs/migration/local-upload-route-implementation.md`
- `docs/migration/local-upload-runtime-smoke-handoff.md`
- `src/routes/api/dokumen/rename-pending.ts`
- `tests/unit/storage/rename-pending-local-route.test.ts`
- `src/lib/storage/local-pending-move.ts`
- `tests/unit/storage/local-pending-move.test.ts`
- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `src/routes/api/upload.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/FileUploadButton.tsx`

Initial status command:

```powershell
git status --short --branch
```

Result: branch was `migration/postgres-local` with no initial file changes reported.

Focused search commands:

```powershell
rg -n "createFileRoute\('/api/dokumen/rename-pending'\)" src tests docs\migration
rg -n "getLocalServerSession" src tests docs\migration
rg -n "moveLocalPendingFileToFormal" src tests docs\migration
rg -n "classifyLocalPendingMovePath" src tests docs\migration
rg -n "storage\.from" src tests docs\migration
rg -n "\.move\(" src tests docs\migration
rg -n "\.remove\(" src tests docs\migration
rg -n "rename-pending" src tests docs\migration
rg -n "submit" src\routes\api\dokumen src\routes\api\ppk src\components\dokumen tests\unit\storage docs\migration
rg -n "temp-id" src tests docs\migration
rg -n "AttachmentEditor" src tests docs\migration
rg -n "preview-url" src tests docs\migration
rg -n "download-url" src tests docs\migration
rg -n "useInternal" src tests docs\migration
rg -n "routeTree\.gen\.ts" src tests docs\migration
rg -n "\.upload\(" src\components src\routes\api src\lib tests docs\migration
```

Search results summary:

- Confirmed `createFileRoute('/api/dokumen/rename-pending')` remains registered at the same endpoint.
- Confirmed `rename-pending` imports and calls `getLocalServerSession`.
- Confirmed `rename-pending` imports and calls `classifyLocalPendingMovePath(...)` and `moveLocalPendingFileToFormal(...)`.
- Confirmed remaining Supabase `.move(...)` runtime matches are in `src/routes/api/dokumen/submit.ts` and `src/lib/dokumen/storage.ts`, not in `rename-pending`.
- Confirmed Supabase `.remove(...)` runtime surfaces remain in `AttachmentEditor`, document delete/helper cleanup, admin cleanup, and archive destruction routes.
- Confirmed `temp-id` remains a submit compatibility concern.
- Confirmed `AttachmentEditor` remains a Supabase browser upload/delete producer.
- Confirmed `useInternal=true` remains limited to tests/docs and the opt-in raw preview route path.
- Confirmed preview/download default route surfaces remain present and are not changed by this phase.

Focused test command:

```powershell
pnpm test tests/unit/storage/rename-pending-local-route.test.ts tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- Sandboxed attempt failed with `spawn EPERM` before tests started.
- Escalated rerun passed.
- 3 test files passed.
- 48 tests passed.

Final validation commands after this document and status references were created:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result:

- `git diff --check` passed. Git emitted line-ending normalization warnings for touched migration docs.
- `git diff --name-only -- src\routeTree.gen.ts` returned no output, so `src/routeTree.gen.ts` has no diff.
- Final status showed documentation-only changes:

```text
## migration/postgres-local
 M docs/migration/open-decisions.md
 M docs/migration/phase-plan.md
 M docs/migration/storage-replacement-contract.md
?? docs/migration/rename-pending-runtime-smoke-handoff.md
```
