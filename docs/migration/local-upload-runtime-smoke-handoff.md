# Phase 6E.5 Local Upload Runtime Smoke Verification And Handoff

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.5 is verification and handoff only after the Phase 6E.4 local upload runtime change.

No runtime source code changed in this phase. No storage behavior changed in this phase. This phase does not implement pending-to-formal moves, UI caller migration, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, or Supabase Storage data migration.

The purpose is to verify and document the current bounded state of `POST /api/upload` after it was switched to local filesystem writes in Phase 6E.4.

## 2. Current Verified Runtime State

Verified current state:

- `POST /api/upload` now authorizes through the local `dms_session` boundary by calling `getLocalServerSession(request)`.
- `POST /api/upload` writes newly uploaded files through the local upload helper in `src/lib/storage/local-upload.ts`.
- The endpoint path remains `/api/upload`.
- The request fields remain `file`, `kelengkapan_id`, and `nama_dokumen`.
- The success status remains `201`.
- The success response shape remains `{ url, nama, kelengkapan_id, uploaded_at }`.
- The returned `url` is a logical storage path only.
- The owner segment in the returned logical path is the local session `userId`.
- The route does not accept owner identity from form data, query params, filenames, or client metadata.
- No physical filesystem path or storage root is returned in the upload response.
- No Supabase Storage file migration, copy, download, backfill, or sync exists in this phase.

Local upload affects only newly uploaded files that pass through `POST /api/upload`. Existing Supabase Storage files are not available locally unless a future explicit data migration phase changes scope, which is currently forbidden.

## 3. Automated Verification

Focused command run:

```powershell
pnpm test tests/unit/storage/upload-route-local.test.ts tests/unit/storage/local-upload.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- First sandboxed run failed before tests started while loading Vitest config with `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated run passed.
- Test files: 3 passed.
- Tests: 48 passed.

Covered focused test files:

- `tests/unit/storage/upload-route-local.test.ts`
- `tests/unit/storage/local-upload.test.ts`
- `tests/unit/storage/local-storage-paths.test.ts`

## 4. Manual Runtime Smoke Checklist

Use placeholders only. Do not record real environment values, database URLs, physical filesystem paths, storage roots, cookies, tokens, generated internal signed URLs, Supabase signed URLs, or uploaded file contents.

Checklist:

1. Ensure the app is running in the local migration environment.
2. Log in as a local seeded user through the normal browser login flow.
3. Open the normal create-document UI that uses `FileUploadButton`.
4. Upload one allowed small file through the normal UI. Allowed file families are PDF, DOC, DOCX, XLS, and XLSX.
5. Verify the UI receives a successful upload response from `POST /api/upload`.
6. Verify the response status is `201`.
7. Verify the response JSON shape is `{ url, nama, kelengkapan_id, uploaded_at }`.
8. Verify the returned `url` is a logical path and starts with `<localUserId>/`.
9. Verify no physical path is shown in the UI or network response.
10. Verify no storage root is shown in the UI or network response.
11. Manually verify the local file exists under `<localStorageRoot>/<logicalPath>` using placeholders only in notes.
12. Verify default preview/download behavior is still Supabase-backed unless explicitly using the internal opt-in raw preview path.
13. Do not mark submit/move validation as passed in this smoke test, because pending-to-formal local move behavior is not implemented yet.

Do not continue this checklist into submit/resubmit/move validation as if it proves storage lifecycle parity. The upload runtime and pending-to-formal lifecycle are separate phases.

## 5. Known Limitations After Phase 6E.4

- `AttachmentEditor` still uses Supabase browser storage for direct edit/revision/resubmit upload and pending cleanup.
- Pending-to-formal local move behavior is not implemented.
- Submit, resubmit, and `rename-pending` flows may still attempt Supabase `.move(...)` behavior.
- Delete/remove behavior is not implemented locally.
- Archive destruction deletion is not implemented locally.
- Storage diagnostics and orphan cleanup are not implemented locally.
- Preview/download defaults remain Supabase-backed.
- Existing Supabase Storage files are not available locally.
- Local upload only affects new files uploaded through `/api/upload`.

## 6. Compatibility Risks

- `/api/upload` uses the underscore pending path format, while `AttachmentEditor` still uses the dash pending path format.
- Mixed storage state is expected: new `/api/upload` files are local, while older files and direct `AttachmentEditor` files may remain Supabase-backed.
- The submit/move phase must deliberately handle both pending formats.
- Local auth owner ids now define local upload owner segments, while remaining Supabase-backed routes may still use older Supabase-session assumptions.
- A local file can exist while DB/workflow state still depends on Supabase-era move behavior.
- Local raw preview can only serve files that exist locally; existing Supabase files are not present in the local filesystem target.

## 7. Rollback Criteria

Rollback or stop further storage rollout if any of these occur:

- `FileUploadButton` upload fails for valid files.
- `POST /api/upload` response shape differs from `{ url, nama, kelengkapan_id, uploaded_at }`.
- `POST /api/upload` success status differs from `201`.
- Returned `url` exposes a physical path or storage root.
- Files are written outside the configured local storage root.
- Owner segment does not match the local session user id.
- Unexpected preview/download regression appears in the default Supabase-backed path.
- Submit flow breaks in a way that is not explained by the known pending-to-formal local move gap.
- Any Supabase data or file migration, copy, download, backfill, or sync appears accidentally.

## 8. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.6 Pending-to-Formal Local Move Planning
```

Do not jump directly to broad implementation.

Reasoning:

- Move behavior touches create submit, update/resubmit, PPK resubmit, and `rename-pending`.
- The phase must account for both pending path formats: underscore upload API paths and dash `AttachmentEditor` paths.
- Submit currently has a `temp-id` compatibility behavior that must be preserved or explicitly replaced with tests.
- DB metadata updates and filesystem moves have partial-failure risks.
- Delete/orphan handling will be affected by move decisions, but should not be implemented blindly in the same step.
- Local upload now creates files locally, while several existing lifecycle routes still assume Supabase Storage moves.

Planning first is the safer next step.

## 9. Explicitly Not Implemented

Phase 6E.5 does not implement:

- runtime source changes;
- pending-to-formal local moves;
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
- `docs/migration/local-upload-replacement-planning.md`
- `docs/migration/local-upload-helper-foundation.md`
- `docs/migration/local-upload-route-wiring-plan.md`
- `docs/migration/local-upload-route-implementation.md`
- `docs/migration/local-filesystem-storage-foundation.md`
- `docs/migration/controlled-raw-preview-enablement-strategy.md`
- `src/routes/api/upload.ts`
- `src/lib/storage/local-upload.ts`
- `src/lib/storage/local-storage-paths.ts`
- `src/lib/auth/local-server-auth.ts`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/lib/dokumen/storage.ts`
- `tests/unit/storage/upload-route-local.test.ts`
- `tests/unit/storage/local-upload.test.ts`
- `tests/unit/storage/local-storage-paths.test.ts`

Commands run:

```powershell
git status --short --branch
```

Result: initial status was clean on branch `migration/postgres-local`.

```powershell
rg -n "createFileRoute\('/api/upload'\)" src tests docs\migration
rg -n "getLocalServerSession" src\routes\api\upload.ts src\lib\auth\local-server-auth.ts tests\unit\storage\upload-route-local.test.ts docs\migration
rg -n "createLocalUploadDescriptor|writeLocalUploadContent" src\routes\api\upload.ts src\lib\storage\local-upload.ts tests\unit\storage docs\migration
rg -n "fetch\('/api/upload'" src tests docs\migration
rg -n "AttachmentEditor" src tests docs\migration
rg -n "supabase\.storage" src\components src\routes\api src\lib tests
rg -n "\.move\(" src\components src\routes\api src\lib tests
rg -n "\.remove\(" src\components src\routes\api src\lib tests
rg -n "rename-pending|pending-upload-api|pending-dash" src tests docs\migration
rg -n "useInternal" src tests docs\migration
rg -n "preview-url" src tests docs\migration
rg -n "download-url" src tests docs\migration
rg -n "storage\.from\('dokumen-lampiran'\)|storage\.from\(STORAGE_BUCKET\)|dokumen-lampiran" src\routes\api\upload.ts src\components\dokumen\FileUploadButton.tsx src\components\dokumen\KelengkapanChecklist.tsx src\components\dokumen\AttachmentEditor.tsx src\routes\api\dokumen\submit.ts src\routes\api\dokumen\rename-pending.ts src\lib\dokumen\storage.ts
```

Result:

- Confirmed `createFileRoute('/api/upload')` remains in the upload route.
- Confirmed `/api/upload` uses `getLocalServerSession`.
- Confirmed `/api/upload` uses `createLocalUploadDescriptor(...)` and `writeLocalUploadContent(...)`.
- Confirmed `FileUploadButton` still posts to `/api/upload`.
- Confirmed `AttachmentEditor` remains present and still has Supabase browser storage upload/remove usage.
- Confirmed Supabase `.move(...)` remains in submit, `rename-pending`, and document storage helper surfaces.
- Confirmed Supabase `.remove(...)` remains in document storage helper, document delete/update cleanup, admin cleanup, `AttachmentEditor`, and archive destruction surfaces.
- Confirmed `useInternal=true` is still limited to tests/docs and the opt-in raw preview route path.
- Confirmed default preview/download endpoint surfaces remain present.
- Confirmed `src/routeTree.gen.ts` had no diff before documentation edits.

Focused test command:

```powershell
pnpm test tests/unit/storage/upload-route-local.test.ts tests/unit/storage/local-upload.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- Sandboxed attempt failed with `spawn EPERM` before tests started.
- Escalated rerun passed.
- 3 test files passed.
- 48 tests passed.

Final validation commands after this document was created:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result:

- `git diff --check` passed.
- `src/routeTree.gen.ts` had no diff.
- Final status showed only this new handoff document:

```text
## migration/postgres-local
?? docs/migration/local-upload-runtime-smoke-handoff.md
```
