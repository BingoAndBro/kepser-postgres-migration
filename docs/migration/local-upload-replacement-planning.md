# Phase 6E.1 Local Upload Replacement Planning

Date: 2026-05-15.

## 1. Phase Scope

Phase 6E.1 is documentation and planning only. It defines how later phases should replace Supabase Storage upload behavior with local filesystem upload behavior while preserving current DMS behavior.

No runtime behavior changed in this phase. No upload route, UI caller, preview/download endpoint, pending-to-formal move, delete/remove behavior, archive destruction behavior, auth/session behavior, database schema, route tree, or storage data was changed.

Supabase upload remains active. The current Supabase-backed application remains the runtime reference until local storage parity is verified.

## 2. Current Upload Surface Inventory

### `POST /api/upload`

- File path: `src/routes/api/upload.ts`
- Caller/context: used by `src/components/dokumen/FileUploadButton.tsx`, which is embedded by `src/components/dokumen/KelengkapanChecklist.tsx` for the main create/submit upload flow.
- Request shape: `multipart/form-data` with `file`, `kelengkapan_id`, and `nama_dokumen`.
- Response shape: HTTP `201` with `{ url, nama, kelengkapan_id, uploaded_at }`.
- Current auth/session mechanism: Supabase server client created from request cookies, then `getServerSession(supabase)`.
- Current validation: `kelengkapan_id` must be a UUID or `user-custom-{uuid}`; MIME type allowlist is PDF, DOC, DOCX, XLS, XLSX; max size is 2 MB.
- Current path format: `{userId}/{kelengkapanId}_{timestamp}_{filename.ext}`.
- Current bucket/storage dependency: Supabase admin storage bucket `dokumen-lampiran`, `.upload(path, fileContent, { contentType, upsert: false })`.
- Upload replacement scope: in scope for the first upload replacement implementation, but only after an isolated local upload helper exists.

### `FileUploadButton` Browser Caller

- File path: `src/components/dokumen/FileUploadButton.tsx`
- Caller/context: reusable upload button for `KelengkapanChecklist`; used by the new document submission UI for admin kelengkapan and user-created supporting documents.
- Request shape: builds `FormData` with `file`, `kelengkapan_id`, and `nama_dokumen`; sends `fetch('/api/upload', { method: 'POST', credentials: 'include' })`.
- Response shape consumed: expects JSON fields `kelengkapan_id`, `nama`, `url`, and `uploaded_at`, then builds a `LampiranUrl`.
- Current auth/session mechanism: browser sends cookies; server route uses Supabase session.
- Current path format: inherits the `/api/upload` underscore pending path from the response.
- Current bucket/storage dependency: indirect through `/api/upload`.
- Upload replacement scope: in scope only as a compatibility consumer. It should not need a UI behavior change if `/api/upload` response compatibility is preserved.

### `AttachmentEditor` Direct Browser Upload And Delete

- File path: `src/components/dokumen/AttachmentEditor.tsx`
- Caller/context: edit/revision/resubmit attachment editor; supports replacing existing files, adding user-created supporting documents, reset, and cancel cleanup.
- Request shape: no API request for upload. It reads the selected browser `File` directly.
- Response shape: no server response. Supabase browser storage returns `data.path`; the component builds a `LampiranUrl` locally.
- Current auth/session mechanism: browser Supabase client plus `supabase.auth.getSession()` to read `session.user.id`.
- Current path format: `{userId}/{timestamp}-{random}-{filename.ext}`.
- Current bucket/storage dependency: browser Supabase Storage bucket `dokumen-lampiran`, `.upload(path, file, { cacheControl: '3600', upsert: false })`; reset/cancel call `.remove([pending.url])`.
- Upload replacement scope: in scope for storage replacement, but should be migrated after `/api/upload` local behavior is stable or behind a dedicated API-backed compatibility plan. Direct browser filesystem writes must not exist.

### Submit And Resubmit Pending-To-Formal Flow

- File paths: `src/routes/api/dokumen/submit.ts`, `src/routes/api/dokumen.$id.ts`, `src/routes/api/ppk/resubmit/$id.ts`, and `src/lib/dokumen/storage.ts`.
- Caller/context: create+submit, Pegawai revision/edit, and PPK resubmit flows consume `lampiranUrls` produced by upload surfaces.
- Request shape: JSON payloads containing `lampiranUrls` arrays with `{ kelengkapan_id, nama, url, uploaded_at }`.
- Response shape: varies by route, including `{ success: true, dokumen }`, `{ dokumen }`, or `{ success: true }`.
- Current auth/session mechanism: Supabase server session and role checks per route.
- Current path behavior: only dash pending paths are generally detected and moved. Moves produce `{userId}/{dokumenId}/{uuid}.{ext}`, while `POST /api/dokumen/submit` can move dash pending files to `{userId}/temp-id/{uuid}.{ext}` before document creation.
- Current bucket/storage dependency: Supabase admin storage bucket `dokumen-lampiran`, `.move(oldPath, newPath)`.
- Upload replacement scope: future phase. Do not combine initial local upload writing with broad move behavior changes unless the file/DB partial-failure policy is explicit and tested.

### `POST /api/dokumen/rename-pending`

- File path: `src/routes/api/dokumen/rename-pending.ts`
- Caller/context: compatibility endpoint for formalizing pending files for an existing document.
- Request shape: JSON `{ dokId, lampiranUrls, userId }`.
- Response shape: `{ success: true, renamed, errors? }` or error JSON.
- Current auth/session mechanism: Supabase server session; verifies body `userId` matches session user; verifies target document owner; verifies pending path owner.
- Current path behavior: detects dash pending paths and moves them to `{userId}/{dokId}/{uuid}.{ext}`.
- Current bucket/storage dependency: Supabase admin storage bucket `dokumen-lampiran`, `.move(oldPath, newPath)`.
- Upload replacement scope: future move phase, not the initial upload route replacement.

### Delete/Remove Surfaces

- File paths: `src/components/dokumen/AttachmentEditor.tsx`, `src/lib/dokumen/storage.ts`, `src/routes/api/dokumen.$id.ts`, `src/routes/api/ppk/resubmit/$id.ts`, and `src/routes/api/arsiparis/usul-musnah.$id.ts`.
- Caller/context: pending reset/cancel cleanup, replaced-file cleanup, non-material document delete, PPK resubmit cleanup, and archive destruction.
- Request shape: varies by route/UI action; storage paths come from existing `LampiranUrl.url` values.
- Response shape: varies by route; many deletes are fire-and-forget after DB updates.
- Current auth/session mechanism: Supabase session and route-specific owner/role checks.
- Current path behavior: removes logical paths stored in `lampiran_urls` or `lampiran_snapshot`.
- Current bucket/storage dependency: Supabase Storage `.remove([...])`.
- Upload replacement scope: future delete/remove phase. Local upload should not imply local deletion is already safe.

### Admin Diagnostics And Orphan Cleanup

- File paths: `src/routes/api/admin/analyze-storage.ts` and `src/routes/api/admin/cleanup-orphan-files.ts`.
- Caller/context: admin storage analysis and cleanup against current bucket contents.
- Request shape: `GET` requests; cleanup comments mention `pending_only=true` and `dry_run=true`, but current implementation does not apply those query parameters.
- Response shape: analyze returns `{ summary, folder_details, orphan_paths, referenced_paths_count }`; cleanup returns `{ message, deleted_count }` or `{ message, deleted_count, orphan_paths }`.
- Current auth/session mechanism: Supabase server session plus `ADMIN` role lookup.
- Current path behavior: lists one level below bucket root and compares bucket paths with `dokumen_transaksi.lampiran_urls`.
- Current bucket/storage dependency: Supabase admin storage bucket `dokumen-lampiran`, `.list()` and `.remove(orphanPaths)`.
- Upload replacement scope: future diagnostics/cleanup phase after local file lifecycle and archive snapshot rules are stable.

## 3. Current Path Semantics

Current stored attachment metadata shape remains:

```ts
{
  kelengkapan_id: string
  nama: string
  url: string
  uploaded_at: string
}
```

Known logical path formats:

- `POST /api/upload` pending path: `{userId}/{kelengkapanId}_{timestamp}_{filename.ext}`.
- `AttachmentEditor` direct browser pending path: `{userId}/{timestamp}-{random}-{filename.ext}`.
- Formal path: `{userId}/{dokumenId}/{uuid}.{ext}`.
- Special current behavior: `POST /api/dokumen/submit` can move dash pending files to `{userId}/temp-id/{uuid}.{ext}` before the real document id is available.
- Archive snapshot behavior: `arsip.lampiran_snapshot` stores logical path snapshots copied from current `dokumen_transaksi.lampiran_urls`.

Important compatibility risk: current pending detectors mostly recognize the dash format, while `/api/upload` writes the underscore format. Local upload planning must preserve this known behavior or change it only in a dedicated, tested move-compatibility phase.

## 4. Required Local Upload Compatibility Contract

Future local upload replacement must preserve these compatibility rules:

- Endpoint path remains `/api/upload`.
- HTTP method remains `POST`.
- Request shape remains compatible with current `multipart/form-data` fields: `file`, `kelengkapan_id`, and `nama_dokumen`.
- Success response remains compatible with `{ url, nama, kelengkapan_id, uploaded_at }`.
- Success status remains `201` unless a later contract explicitly documents otherwise.
- Returned `url` remains a logical storage path, not a physical filesystem path.
- Logical path semantics preserve the expected owner segment and pending path behavior.
- Local writes occur only under the configured local storage root.
- Physical filesystem path is never returned.
- Storage root is never returned.
- Absolute paths, URL-like paths, protocol-relative paths, Windows drive paths, dot segments, traversal, and empty segments are rejected before filesystem writes.
- Owner segment must be server-derived from the authenticated user/session, never accepted from client input.
- Logical path normalization must happen before safe physical path resolution.
- Filename sanitization must preserve enough compatibility for display while rejecting path separators, traversal markers, control characters, and names that become empty or meaningless after sanitization.
- `kelengkapan_id` validation must remain compatible with UUID and `user-custom-{uuid}` values.
- `upsert: false` semantics should be preserved by avoiding overwrite of existing local files.
- Max size and allowed type requirements should preserve or strengthen current behavior: PDF, DOC, DOCX, XLS, XLSX and 2 MB maximum during parity migration.
- Client-visible responses, logs, and docs must not include physical paths, storage roots, secrets, tokens, hashes, DB URLs, environment values, Supabase signed URLs, or generated internal signed URLs.

## 5. Auth And Authorization Considerations

Current `/api/upload` uses Supabase cookies and `getServerSession(supabase)`. Current `AttachmentEditor` direct upload uses the browser Supabase session directly.

The target local auth runtime uses the `dms_session` cookie and the server-only helper:

```ts
getLocalServerSession(request)
```

Safer phased recommendation:

- Replace `/api/upload` with local filesystem writing only after route-level auth behavior is explicitly chosen and tested.
- Prefer local `dms_session` authorization for the first local upload implementation, because the file owner segment must match the local user id used by later local preview/internal access.
- During mixed-runtime compatibility, do not let Supabase user ids and local user ids silently diverge in logical paths. If a transition phase still accepts Supabase sessions, document that it is a compatibility bridge and keep it isolated.
- Do not migrate `AttachmentEditor` direct upload at the same time as auth changes unless the direct browser storage behavior is moved behind a server route and local owner semantics are verified.
- Server-side authorization remains authoritative. Client-side file input and UI hiding are not security controls.

## 6. Local Filesystem Write Safety

Future implementation should use the existing local path helper foundation where appropriate and must add a write helper rather than open-coding filesystem writes in routes.

Required write safety:

- Ensure directory creation is contained inside the configured storage root.
- Resolve the target physical path only after logical path validation.
- Verify the resolved target remains under the storage root before creating directories or writing.
- Use a safe temporary write plus atomic rename when practical, especially if content is buffered or streamed in chunks.
- Direct write may be acceptable for the small 2 MB current limit only if partial write cleanup is handled.
- Avoid overwriting existing files unless a later phase explicitly allows that behavior.
- Use unique server-generated filenames/path suffixes.
- Validate declared MIME type and extension; add file signature checks later where practical.
- Do not trust client-provided filename for path safety, MIME truth, or content safety.
- Avoid logging physical paths, storage roots, generated tokens, signed URLs, or raw request/file contents.
- Avoid returning physical paths or storage roots.
- Handle partial write failures with generic client errors and server-side cleanup of temporary files if used.
- If local directory creation fails, do not persist metadata pointing to a missing file.

## 7. Pending-To-Formal Move Interaction

Upload replacement and pending-to-formal moves must be sequenced carefully because upload writes the first local file location, while submit/resubmit/update decide whether that logical path remains pending or becomes formal.

If local upload writes files but submit still attempts Supabase `.move(...)`, the app can produce metadata and local files that are out of sync with the current move implementation. Conversely, if move behavior changes before upload writes local files, existing Supabase-backed files will not exist locally because this migration does not copy or backfill storage.

Future work that remains out of scope for Phase 6E.1:

- Submit move behavior.
- Resubmit move behavior.
- `rename-pending` behavior.
- Delete/remove behavior.
- Archive destruction deletion.
- DB/file partial-failure policy.
- Retry/orphan cleanup policy.

Recommended rule: implement local upload first in isolation, then move pending-to-formal behavior in a separate phase with tests that prove both pending path variants and formal path output are compatible.

## 8. Preview/Internal URL Interaction

Local upload availability is the prerequisite for making internal raw preview useful for normal callers. Phase 6D.8 proved that an opt-in raw internal preview can stream a matching local file, but the local filesystem starts empty and no existing Supabase files are available locally.

Local upload replacement will allow newly uploaded files to exist locally at the logical paths stored in `lampiran_urls.url`. That unblocks controlled internal raw preview enablement for new local files, subject to fallback policy and caller-level verification.

Internal preview should remain manual/test-only until uploaded local files are reliably available and pending-to-formal behavior is understood. No default preview behavior changes in this phase. Normal raw preview without `useInternal=true` remains Supabase-backed.

## 9. Migration Data Policy

No Supabase Storage file migration, copy, download, backfill, or sync is part of Phase 6E.1 or the recommended initial upload replacement.

Local storage starts empty. Only newly uploaded files after local upload replacement will exist locally unless a future explicit data migration phase is approved.

This isolated migration project should use new local seed data and newly uploaded local files only. Do not preserve old Supabase Storage files or production/current data as part of this migration track.

## 10. Recommended Implementation Sequence

Conservative bounded phases:

1. Phase 6E.2: Local upload helper foundation, no route wiring. Add server-only write helpers and focused tests for safe directory creation, unique logical path generation, MIME/extension/size validation, no overwrite, partial write cleanup, and no physical path exposure.
2. Phase 6E.3: `/api/upload` local implementation behind explicit local migration scope. Preserve endpoint path, request shape, response shape, status codes, owner segment, underscore pending path compatibility, and current validation. Do not change UI callers in the same phase except as needed for tests.
3. Phase 6E.4: `AttachmentEditor` upload surface compatibility plan. Define how direct browser Supabase upload/delete moves behind API routes while preserving edit/revision/resubmit UI behavior.
4. Phase 6E.5: Pending-to-formal local move planning/implementation. Cover submit, update, PPK resubmit, and `rename-pending` with both pending path variants and `temp-id` compatibility.
5. Phase 6E.6: Delete/remove behavior planning/implementation. Cover pending reset/cancel cleanup, replaced-file cleanup, non-material document delete, archive destruction deletion, and admin cleanup dry-run policy.
6. Phase 6E.7: Controlled raw preview caller enablement for newly uploaded local files only. Keep download/document/role/archive endpoint migration separate until token authorization and `DIMUSNAHKAN` checks are complete.

Do not collapse these phases. Upload, move, delete, preview, archive destruction, and diagnostics have different failure modes.

## 11. Explicitly Not Implemented

Phase 6E.1 does not implement:

- Runtime code changes.
- Upload replacement.
- Preview/download default changes.
- UI caller changes.
- Pending-to-formal move changes.
- Delete/remove changes.
- Archive destruction deletion.
- Supabase Storage migration, copy, download, backfill, or sync.
- Route tree changes.
- DB schema changes.
- Auth/session changes.
- Document/archive token authorization.
- `DIMUSNAHKAN` token-streaming checks.
- Storage diagnostics/orphan cleanup replacement.
- Supabase Storage retirement.

## Phase 6E.2 Follow-Up Note

Phase 6E.2 added the isolated server-only helper foundation described in `docs/migration/local-upload-helper-foundation.md`.

The helper covers upload metadata validation, client filename sanitization, `kelengkapan_id` validation, compatible underscore pending logical path generation, and contained no-overwrite local writes. It remains unwired from `/api/upload` and does not implement pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, or Supabase Storage file migration.

## Phase 6E.3 Follow-Up Note

Phase 6E.3 added the route wiring plan described in `docs/migration/local-upload-route-wiring-plan.md`.

The plan keeps the future implementation bounded to `/api/upload` route internals, recommends local `dms_session` ownership via `getLocalServerSession(request)`, maps current multipart inputs to the Phase 6E.2 helper, and preserves the existing `/api/upload` request/response/status contract for `FileUploadButton`. It also keeps `AttachmentEditor`, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, internal URL default enablement, and Supabase Storage file migration out of scope.

## 12. Validation Performed

Commands run:

```powershell
git status --short --branch
```

Result: clean branch status at the start of this phase:

```text
## migration/postgres-local
```

```powershell
rg -n "POST /api/upload|createFileRoute\('/api/upload'\)|\.upload\(|dokumen-lampiran|FormData|multipart|lampiran_urls" src docs tests
rg -n "pending|rename-pending|remove\(\[|\.remove\(|storage\.from" src docs tests
rg -n "timestamp|random|kelengkapanId|file\.name|allowed|max|MAX_FILE_SIZE|ALLOWED_FILE_TYPES|ALLOWED_TYPES|MAX_SIZE" src docs tests
rg -n "analyze-storage|cleanup-orphan|orphan|deleteOrphanFiles|syncDocumentAttachments|lampiran_snapshot|DIMUSNAHKAN" src docs tests
rg -n "FileUploadButton|onReplace|onUpload=|handleUploaded|handleRemoved|/api/upload|rename-pending" src\components src\routes
```

Result: discovered the upload, direct browser upload, pending-to-formal, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/internal URL, and supporting UI caller surfaces documented above.

Additional files were read directly for source verification, including the upload route, attachment editor/viewer components, storage client/helper modules, submit/resubmit/rename routes, local path helper, internal file access service/route, admin diagnostics/cleanup, and archive destruction route.

Final whitespace/status validation for this documentation change:

```powershell
git diff --check
git status --short --branch
git diff --name-only -- src\routeTree.gen.ts
Select-String -Path 'docs\migration\local-upload-replacement-planning.md' -Pattern '[ \t]+$'
```

Result: `git diff --check` passed with no whitespace errors; Git emitted line-ending normalization warnings for existing tracked docs touched in this phase. Final status shows only documentation changes. `src/routeTree.gen.ts` had no diff. The trailing-whitespace check for this new document returned no matches.
