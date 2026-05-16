# Phase 6E.8 Rename-Pending Local Move Route Planning

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.8 is documentation and planning only. It defines how a later implementation phase should replace the current Supabase-backed `POST /api/dokumen/rename-pending` storage move behavior with local filesystem move behavior.

No runtime source code changed in this phase. The `rename-pending` local route wiring is not implemented in this phase.

This phase does not change submit, update, resubmit, upload, UI caller, `AttachmentEditor`, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download, auth/session runtime, database schema, route generation, or Supabase Storage behavior.

## 2. Current `rename-pending` Behavior

Current route:

```text
POST /api/dokumen/rename-pending
```

Current route file:

```text
src/routes/api/dokumen/rename-pending.ts
```

Current request body:

```ts
{
  dokId: string
  lampiranUrls: any[]
  userId: string
}
```

Current success response:

```ts
{
  success: true
  renamed: { oldPath: string; newPath: string }[]
  errors?: { path: string; error: string }[]
}
```

Current auth/session mechanism:

- Creates a request-scoped Supabase server client from request cookies.
- Calls `getServerSession(supabase)` from `src/lib/auth.ts`.
- Returns `401 { error: 'Unauthorized' }` if no Supabase session exists.

Current authorization behavior:

- Parses JSON manually.
- Requires `dokId` to be present.
- Requires `lampiranUrls` to be an array.
- Requires body `userId` to equal `session.user.id`.
- Fetches the target document with `getDokumenById(admin, dokId)`.
- Returns `404 { error: 'Dokumen tidak ditemukan' }` if the document is missing.
- Requires `dokumen.created_by` to equal `session.user.id`.
- For each pending path, verifies the first logical path segment belongs to `session.user.id` through `storagePathBelongsToUser(...)`.
- Returns `403 { error: 'Anda tidak memiliki akses' }` for body user mismatch, document owner mismatch, or pending path owner mismatch.

Current Supabase move behavior:

- Uses `createAdminClient()`.
- Calls `admin.storage.from('dokumen-lampiran').move(oldPath, newPath)`.
- Generates `newPath` as `{userId}/{dokId}/{crypto.randomUUID()}.{ext}`.
- Uses the file extension extracted from `lamp.url`.
- Does not fetch, download, copy, or backfill files; it asks Supabase Storage to move the object.

Current path detection behavior:

- Route-local `isPendingPath(url)` checks only the filename segment.
- It recognizes dash pending filenames matching `^\d{13}-[a-zA-Z0-9]+-.+$`.
- It does not recognize `/api/upload` underscore pending filenames.
- It does not call the newer local `classifyStoragePath(...)` or `classifyLocalPendingMovePath(...)` helpers.

Current skipped path behavior:

- If `lamp.url` is missing, the route skips it.
- If `lamp.url` is not dash-pending, the route skips it.
- Already formal paths are therefore skipped and are not returned in `renamed`.
- Underscore `/api/upload` pending paths are currently skipped because the detector is dash-only.
- Safe but unsupported paths are also skipped if they do not match the dash pending regex.

Current error/status behavior visible in source:

- Invalid JSON body returns `400 { error: 'Invalid request body' }`.
- Missing `dokId` or non-array/missing `lampiranUrls` returns `400 { error: 'Missing dokId or lampiranUrls' }`.
- Unauthorized returns `401 { error: 'Unauthorized' }`.
- Access failure returns `403 { error: 'Anda tidak memiliki akses' }`.
- Missing document returns `404 { error: 'Dokumen tidak ditemukan' }`.
- Supabase move failure immediately returns `500` with:

```ts
{
  error: `Gagal memproses file: ${error.message}`,
  details: {
    failedPath: oldPath,
    newPath,
    reason: error.message,
  },
}
```

Current partial-failure behavior:

- The route loops per file.
- It appends successful moves to `renamed`.
- It appends a failing path to `errors`, but immediately returns `500`, so the normal success response with `errors` is not reached for move failures.
- If earlier files moved and a later file fails, the route does not roll earlier moves back.

Current DB mutation behavior:

- The route does not directly update `dokumen_transaksi.lampiran_urls`.
- It only reads the document for existence and ownership, moves storage objects, and returns the mapping from old paths to new paths.

## 3. Required Compatibility Contract For Future Local Wiring

A later local implementation must preserve this endpoint contract unless a separate reviewed compatibility decision changes it:

- Endpoint path remains `/api/dokumen/rename-pending`.
- HTTP method remains `POST`.
- Request shape remains compatible with `{ dokId, lampiranUrls, userId }`.
- `dokId` remains accepted.
- `lampiranUrls` remains accepted as the attachment metadata array.
- `userId` should remain accepted as compatibility input even if local code derives authority from session.
- Success response remains compatible with `{ success: true, renamed, errors? }`.
- Success response should use logical storage paths only.
- Returned `renamed[].oldPath` and `renamed[].newPath` must never expose physical filesystem paths or storage roots.
- Error responses must remain JSON-shaped.
- The route should not directly mutate document metadata unless the current behavior is intentionally changed in a separately reviewed phase.
- Already formal paths should remain skipped and should not be moved again, matching the current practical route contract.
- The future implementation may choose to return unchanged formal paths only if that is explicitly documented and tested; the current route does not do that.
- Unsupported paths and missing local source paths must have an explicit policy.
- The route must not fetch, copy, download, backfill, or sync any Supabase Storage file.
- The route must not silently convert Supabase-backed metadata into local paths.

Recommended compatibility default:

- Keep `renamed` as moved-file mappings only.
- Keep formal paths skipped and absent from `renamed`.
- For safe unsupported paths, skip them only if doing so preserves current behavior and does not hide local storage migration failures.
- For paths classified as local pending but missing from local filesystem, report a controlled per-file error or fail the request; do not attempt a Supabase fallback.

## 4. Auth And Ownership Plan

Current route:

- Uses Supabase `getServerSession(supabase)`.
- Treats body `userId` as required.
- Requires body `userId` to match `session.user.id`.
- Uses document `created_by` to verify the session user owns the document.
- Checks pending path owner by comparing the first path segment to the Supabase session user id.

Future local route:

- Should use `getLocalServerSession(request)` from `src/lib/auth/local-server-auth.ts`.
- Should use the `dms_session` cookie as the local session authority.
- Should derive the owner segment from `session.userId` or `session.user.id`, not from request body.
- Should treat body `userId` as compatibility input only.
- If body `userId` is retained, it should be validated against the local session user id and fail with an access error if mismatched.
- Should verify the target document belongs to the local session user before moving files.
- Should not trust any client-provided owner segment in `lampiranUrls`.
- Should validate each source path owner segment against the local session user id before filesystem operations.
- Should never use a path owner segment as proof of authorization without document ownership validation.

Document ownership validation remains required because a client could provide a path with the current user's owner segment but a `dokId` for another user's document.

This phase does not implement the local auth/session switch.

## 5. Local Helper Usage Plan

Phase 6E.7 added the helper foundation:

```ts
moveLocalPendingFileToFormal(...)
classifyLocalPendingMovePath(...)
```

Recommended later usage:

1. Validate request JSON and compatibility fields.
2. Resolve local session through `getLocalServerSession(request)`.
3. Validate body `userId` against local session if body `userId` is retained.
4. Fetch and validate document ownership.
5. Iterate over `lampiranUrls`.
6. For each attachment, classify `lamp.url` with `classifyLocalPendingMovePath(...)`.
7. Skip missing URL values and already formal paths according to the current contract.
8. Move supported pending paths with `moveLocalPendingFileToFormal({ sourceLogicalPath, ownerUserId: session.userId, dokumenId: dokId })`.
9. Append `{ oldPath: result.sourceLogicalPath, newPath: result.targetLogicalPath }` for `action: 'moved'`.
10. Preserve no-overwrite behavior from the helper.
11. Return logical paths only.

Relevant helper error codes:

- `missing-source`: source logical path is supported but no local file exists at that logical path.
- `target-exists`: generated target already exists; do not overwrite.
- `unsupported-source-path`: source is safe but not a supported pending/formal move path.
- `owner-mismatch`: source owner segment does not match expected owner.
- `invalid-source-path`: source path is unsafe.
- `invalid-document-id`, `invalid-owner-id`, `invalid-target-path`, `invalid-target-uuid`: route input or generated target safety failure.
- `source-not-file`: source exists but is not a regular file.
- `move-failed`: generic local filesystem move failure.

Recommended response behavior:

- Keep partial per-file errors in an `errors` array only for non-fatal per-file failures if the route chooses partial success.
- Treat auth, body validation, document lookup, and document owner mismatch as fatal pre-loop failures.
- Treat `owner-mismatch` and unsafe path errors as fatal or controlled `403`/`400` errors, not silent skips.
- Treat `missing-source`, `unsupported-source-path`, and `target-exists` as controlled storage errors.

Do not add route code in this phase.

## 6. Pending Path Handling

The later implementation must deliberately handle both active pending variants.

Underscore `/api/upload` pending path:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

- This format is produced by the current local `POST /api/upload`.
- These files can exist locally for newly uploaded files.
- Future `rename-pending` local wiring should support this format so newly uploaded local files can be formalized.

Dash `AttachmentEditor` pending path:

```text
{userId}/{timestamp}-{random}-{filename.ext}
```

- This format is recognized by the helper.
- The current `AttachmentEditor` still writes these files through browser Supabase Storage.
- Until `AttachmentEditor` is migrated, dash pending metadata may point to files that do not exist locally.
- If the dash pending file exists locally in tests or future local producer flows, the helper can move it.
- If it does not exist locally, the route must report or skip it according to a documented policy without fetching from Supabase.

Formal path:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

- Formal paths should not be moved again.
- Current `rename-pending` skips formal paths because they are not dash-pending.
- Recommended default is to keep this skip behavior.

Safe unknown paths:

- Safe but unsupported paths should not be moved.
- Current route skips unknown paths if they do not match the dash pending regex.
- Future route should avoid silently hiding local storage failures; unsupported pending-looking paths should be reported clearly.

Missing local source:

- A missing local source must not trigger Supabase download, copy, backfill, or sync.
- Missing local source should be surfaced as a controlled storage outcome so mixed-storage gaps are visible.

## 7. Error And Status Mapping Plan

Current visible inventory:

| Condition | Current status/body |
|---|---|
| Missing session | `401 { error: 'Unauthorized' }` |
| Invalid JSON | `400 { error: 'Invalid request body' }` |
| Missing `dokId` or `lampiranUrls` not array | `400 { error: 'Missing dokId or lampiranUrls' }` |
| Body `userId` mismatch | `403 { error: 'Anda tidak memiliki akses' }` |
| Document not found | `404 { error: 'Dokumen tidak ditemukan' }` |
| Document owner mismatch | `403 { error: 'Anda tidak memiliki akses' }` |
| Pending path owner mismatch | `403 { error: 'Anda tidak memiliki akses' }` |
| Supabase move failure | `500 { error, details: { failedPath, newPath, reason } }` |
| No pending paths | `200 { success: true, renamed: [], errors: undefined }` |

Recommended later local mapping:

| Condition | Recommended status/body |
|---|---|
| Unauthorized local session | Preserve `401 { error: 'Unauthorized' }` for this route if possible. |
| Invalid body | Preserve current `400` messages where possible; consider Zod in implementation but keep response compatibility. |
| Body `userId` and session mismatch | Preserve `403 { error: 'Anda tidak memiliki akses' }`. |
| Document not found | Preserve `404 { error: 'Dokumen tidak ditemukan' }`. |
| Document owner mismatch | Preserve `403 { error: 'Anda tidak memiliki akses' }`. |
| Source owner mismatch | Preserve `403 { error: 'Anda tidak memiliki akses' }`. |
| Unsafe source path | Prefer `400 { error: 'Path lampiran tidak valid' }` or compatible generic error. |
| Unsupported source path | Either skip safe unknown paths to preserve current behavior, or include controlled per-file error. Do not move. |
| Missing local source | Controlled `500` storage failure or per-file `errors` entry. Do not fetch from Supabase. |
| Target exists | Controlled `500` storage failure or per-file `errors` entry. Do not overwrite. |
| Generic move failure | Preserve JSON shape and avoid physical path/root details. |

Compatibility warning:

- Current move failure returns `details.failedPath` and `details.newPath` as logical paths. A future route can preserve this logical-only details shape for fatal move failure.
- Do not include physical paths, storage roots, tokens, session values, DB URLs, env values, signed URLs, or file contents in any client response.

## 8. Mixed Storage State Policy

The future route must obey the mixed-storage policy:

- Local route code can only move files that actually exist locally.
- Newly uploaded files through local `/api/upload` can exist locally.
- Old Supabase Storage files are not locally available.
- `AttachmentEditor` dash files may still be Supabase-backed until that component is migrated.
- Missing local source must be reported or skipped clearly.
- Missing local source must not trigger automatic Supabase fetch, copy, download, backfill, or sync.
- The implementation must not silently convert Supabase-backed metadata into local formal paths.
- Existing Supabase Storage remains a reference during migration, not a source to hydrate local storage.
- Local filesystem target starts clean and should use new local seed data and newly uploaded local files only.

## 9. Partial Failure Policy

Current route behavior is not all-or-nothing:

- It loops over files.
- It can move earlier files before a later move fails.
- It aborts on the first move failure with `500`.
- It does not roll back earlier successful moves.
- It returns `{ success: true, renamed, errors? }` only when no fatal move failure occurs.

Future local route choices:

Option A: Abort on first per-file move failure.

- Closest to current behavior.
- Keeps error handling simple.
- Leaves the same partial-move risk if earlier files moved.
- Needs clear documentation and tests for earlier moved files when a later file fails.

Option B: Continue on per-file move errors and return `200 { success: true, renamed, errors }`.

- Makes use of the existing optional `errors` success field.
- Allows UI/client to receive partial information.
- May be a behavior change if current callers expect a failed request for move failure.

Option C: Preflight all local paths before moving, then move all.

- Reduces partial failure risk.
- Still cannot eliminate runtime filesystem races.
- More conservative for local route implementation.

Recommended conservative behavior for Phase 6E.9:

- Abort before the loop for fatal auth, body, document lookup, and document ownership errors.
- Pre-classify and preflight all local pending paths before moving where practical.
- Preserve current skip behavior for already formal paths.
- Prefer abort-on-first fatal move failure to preserve current status semantics unless route tests prove callers tolerate partial success.
- If per-file `errors` is used, keep it limited to safe, non-fatal compatibility cases and document the behavior precisely.
- Do not update document metadata in this route, so DB/file rollback is not part of this route; however, moved files can still be partial if the route fails mid-loop.

## 10. Test Strategy For Future Implementation

Future route-level tests should cover:

- Unauthorized request returns the compatible unauthorized response.
- Invalid JSON body returns `400`.
- Missing `dokId` returns `400`.
- Missing or non-array `lampiranUrls` returns `400`.
- Body `userId` and local session mismatch returns `403`.
- Document not found returns `404`.
- Document owner mismatch returns `403`.
- Source path owner mismatch returns `403`.
- Underscore pending local file moves successfully.
- Dash pending local file moves successfully when the file exists locally.
- Already formal path is skipped or unchanged according to the selected compatibility contract.
- Safe unsupported path is skipped or reported according to the selected compatibility contract.
- Missing local source returns a controlled error without Supabase fallback.
- Target exists returns a controlled no-overwrite error.
- Partial error response shape is preserved if partial success is selected.
- Response paths are logical-only.
- No physical path or storage root appears in success or error JSON.
- No Supabase download, copy, backfill, or sync path exists.
- Route does not call Supabase Storage `.move(...)` after local migration.
- Route does not mutate document metadata.
- `src/routeTree.gen.ts` has no route-tree change for this existing endpoint.

Future helper-level coverage already exists for:

- `pending-upload-api` classification.
- `pending-dash` classification.
- formal no-op behavior.
- owner validation.
- `missing-source`.
- `target-exists`.
- `unsupported-source-path`.
- logical-only results.

Manual verification for the later implementation should use only new local files uploaded through `/api/upload` or explicit local test fixtures. It must not use migrated, copied, downloaded, backfilled, or synced Supabase Storage files.

## 11. Boundaries With Other Phases

Out of scope for this phase and for the next narrow route implementation unless explicitly approved:

| Boundary | Why separate |
|---|---|
| Submit route local move wiring | Combined create+submit has `temp-id` behavior, document creation, FSM transition, and audit logging. It has different DB/file consistency risks. |
| Update route local move wiring | `PATCH /api/dokumen/$id` persists `lampiran_urls` and schedules replaced-file deletion. It needs DB/file partial-failure and cleanup policy. |
| PPK resubmit local move wiring | PPK resubmit combines role checks, revision status constraints, optional attachment updates, and FSM transition in the `POST` path. |
| `AttachmentEditor` migration | It is still a browser Supabase upload/delete producer. Moving it behind API routes changes UI upload/delete behavior and auth ownership semantics. |
| Delete/remove behavior | Pending cleanup, replaced-file cleanup, non-material document delete, and orphan cleanup have destructive semantics and need separate retry/orphan policy. |
| Archive destruction deletion | Destruction updates archive lifecycle state and `lampiran_snapshot`; it must preserve `DIMUSNAHKAN` access blocking. |
| Diagnostics/orphan cleanup | Filesystem scanning and deletion need dry-run-safe behavior and comparison against document metadata and archive snapshots. |
| Preview/download default migration | Preview/download requires authorization, token/streaming behavior, content headers, and destroyed-archive checks. |
| Internal URL default enablement | Caller enablement depends on local file availability and fallback/rollback policy. |
| Supabase Storage retirement | Supabase remains as reference until storage parity is verified. |

## 12. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.9 Rename-Pending Local Move Route Implementation
```

This should proceed only after this plan is reviewed.

Recommended Phase 6E.9 bounds:

- Change only `src/routes/api/dokumen/rename-pending.ts` unless focused route tests require test helpers.
- Add focused route tests for the local `rename-pending` contract.
- Update migration docs after implementation.
- Do not change submit.
- Do not change update.
- Do not change resubmit.
- Do not change `/api/upload`.
- Do not change `AttachmentEditor`.
- Do not change delete/remove.
- Do not change archive destruction.
- Do not change diagnostics/orphan cleanup.
- Do not change preview/download.
- Do not change `src/routeTree.gen.ts`.

Another helper phase is not required before Phase 6E.9 because Phase 6E.7 already added the isolated local pending move helper and focused tests. If implementation discovers that route-level document ownership needs a local Drizzle read helper that does not exist yet, add the smallest server-only read helper or defer the route implementation rather than broad-refactoring domain reads.

## 13. Explicitly Not Implemented

This phase does not implement:

- runtime source changes;
- `rename-pending` route wiring;
- submit changes;
- update changes;
- resubmit changes;
- upload behavior changes;
- UI caller changes;
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

## 14. Validation Performed

Files read for this planning phase:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/migration-constraints.md`
- `docs/migration/migration-roadmap.md`
- `docs/migration/phase-plan.md`
- `docs/migration/open-decisions.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/local-filesystem-storage-foundation.md`
- `docs/migration/local-upload-replacement-planning.md`
- `docs/migration/local-upload-helper-foundation.md`
- `docs/migration/local-upload-route-implementation.md`
- `docs/migration/local-upload-runtime-smoke-handoff.md`
- `docs/migration/pending-to-formal-local-move-planning.md`
- `docs/migration/local-pending-move-helper-foundation.md`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/lib/storage/local-pending-move.ts`
- `tests/unit/storage/local-pending-move.test.ts`
- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/lib/dokumen/storage.ts`
- `src/lib/utils/file.ts`
- `src/lib/auth/local-server-auth.ts`
- `src/lib/auth.ts`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/FileUploadButton.tsx`

Commands run:

```powershell
git status --short --branch
```

Result: initial status was clean on branch `migration/postgres-local`.

```powershell
rg -n "rename-pending|createFileRoute\('/api/dokumen/rename-pending'\)|renamed|errors" src tests docs\migration
rg -n "\.move\(|\.remove\(|storage\.from" src tests docs\migration
rg -n "getServerSession|getLocalServerSession|userId|dokId|lampiranUrls" src tests docs\migration
rg -n "pending-upload-api|pending-dash|isPendingFile|classifyStoragePath|moveLocalPendingFileToFormal|target-exists|missing-source|unsupported-source-path|AttachmentEditor" src tests docs\migration
```

Result: confirmed current `rename-pending` route registration, Supabase `.move(...)` surfaces, remaining `.remove(...)` boundaries, Supabase/local auth helper split, pending path classifiers, local helper tests, and `AttachmentEditor` boundaries documented above.

```powershell
rg -n "rename-pending" tests
```

Result: no matches. There are currently no focused `rename-pending` tests.

```powershell
rg -n "lampiranUrls|move|pending-upload-api|pending-dash" tests\unit tests\e2e
```

Result: found current storage helper/path tests and upload route tests; no dedicated `rename-pending` route test was found.

```powershell
rg -n "storage\.from|\.remove\(|AttachmentEditor" src\routes\api\arsiparis src\routes\api\admin src\routes\api\dokumen src\components\dokumen
```

Result: confirmed delete/remove and archive/diagnostics boundaries remain separate from `rename-pending`.

```powershell
rg -n "useInternal|preview-url|download-url|files/access" src tests docs\migration
```

Result: confirmed raw internal preview remains opt-in and preview/download surfaces remain separate from this phase.

Final validation after documentation edits:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result:

- `git diff --check` passed with no whitespace errors; Git emitted line-ending normalization warnings for existing tracked docs touched in this phase.
- `git diff --name-only -- src\routeTree.gen.ts` returned no output, so `src/routeTree.gen.ts` has no diff.
- Final status showed documentation-only changes:

```text
## migration/postgres-local
 M docs/migration/local-pending-move-helper-foundation.md
 M docs/migration/open-decisions.md
 M docs/migration/pending-to-formal-local-move-planning.md
 M docs/migration/phase-plan.md
 M docs/migration/storage-replacement-contract.md
?? docs/migration/rename-pending-local-move-route-planning.md
```
