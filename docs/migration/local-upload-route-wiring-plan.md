# Phase 6E.3 Local Upload Route Wiring Plan

Date: 2026-05-15.

## 1. Phase Scope

Phase 6E.3 is documentation and planning only. It defines how a later implementation phase should replace the current Supabase-backed `/api/upload` route internals with the Phase 6E.2 local upload helper.

No runtime behavior changed in this phase. `/api/upload` remains Supabase-backed. No UI upload caller changed.

This phase does not implement local upload wiring, multipart parsing changes, auth/session runtime changes, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, route generation, database schema changes, or Supabase Storage file/data migration.

## 2. Current `/api/upload` Behavior

Endpoint:

```text
POST /api/upload
```

Current route file:

```text
src/routes/api/upload.ts
```

Request shape:

- `multipart/form-data`
- `file`: required browser `File`
- `kelengkapan_id`: required string
- `nama_dokumen`: required string

Response shape on success:

```json
{
  "url": "logical/storage/path",
  "nama": "Nama Dokumen",
  "kelengkapan_id": "uuid-or-user-custom-uuid",
  "uploaded_at": "iso timestamp"
}
```

Success status:

- `201`

Current validation rules:

- Authenticated session is required.
- Form data must parse successfully with `request.formData()`.
- `file` must be a `File`.
- `kelengkapan_id` and `nama_dokumen` must be present.
- `kelengkapan_id` must be either a UUID or `user-custom-{uuid}`.
- Allowed MIME types are PDF, DOC, DOCX, XLS, and XLSX.
- Maximum file size is 2 MB.
- Current server filename sanitization replaces characters outside `[a-zA-Z0-9._-]` with `_`.
- Current server `kelengkapan_id` path sanitization replaces characters outside `[a-zA-Z0-9.-]` with `_`, after validation.

Current auth/session mechanism:

- The route creates a request-scoped Supabase server client from request cookies.
- It calls `getServerSession(supabase)` from `src/lib/auth.ts`.
- If no session exists, it returns `401 { "error": "Unauthorized" }`.

Current Supabase admin storage usage:

- The route creates a Supabase admin client with `createAdminClient()`.
- It writes to the `dokumen-lampiran` bucket.
- It calls `.upload(path, fileContent, { contentType: file.type, upsert: false })`.
- Supabase storage errors are logged server-side and returned to the client as a generic upload failure.

Current logical path format:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

Caller assumptions from `FileUploadButton`:

- `src/components/dokumen/FileUploadButton.tsx` validates the same 2 MB limit and allowed MIME types before sending.
- It builds `FormData` with `file`, `kelengkapan_id`, and `nama_dokumen`.
- It calls `fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })`.
- It expects JSON on both success and failure.
- On success, it constructs `LampiranUrl` from `json.kelengkapan_id`, `json.nama`, `json.url`, and `json.uploaded_at`.
- On failure, it displays `json.error` when available.
- No caller-side path parsing should be required for the upload response.

## 3. Required Compatibility Contract For Future Local Wiring

Future local route wiring must preserve:

- Endpoint path remains `/api/upload`.
- HTTP method remains `POST`.
- Request shape remains `multipart/form-data` with `file`, `kelengkapan_id`, and `nama_dokumen`.
- Response shape remains `{ url, nama, kelengkapan_id, uploaded_at }`.
- Success status remains `201`.
- Returned `url` remains a logical storage path only.
- No physical filesystem path is returned.
- No storage root is returned.
- The first logical path segment remains the authenticated owner user id.
- The upload API underscore pending path format remains compatible:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

- File validation preserves or strengthens current behavior: PDF, DOC, DOCX, XLS, XLSX; 2 MB maximum; filename safety; MIME/extension consistency if using the helper.
- No UI caller change should be required for `FileUploadButton`.
- `upsert: false` behavior must be preserved as local no-overwrite behavior.
- Client-visible responses and logs must not expose secrets, tokens, hashes, DB URLs, environment values, storage roots, physical filesystem paths, Supabase signed URLs, or generated internal signed URLs.

The known underscore-vs-dash pending path mismatch is a compatibility risk, not a cleanup opportunity in this route phase. `/api/upload` currently returns underscore pending paths, while several move helpers primarily detect dash pending paths. A later move phase must preserve or explicitly reconcile that behavior with tests.

## 4. Auth/Session Wiring Decision

Option A: keep Supabase `getServerSession(supabase)` temporarily.

- Pro: matches the current `/api/upload` route implementation.
- Pro: smaller diff if other storage routes still depend on Supabase Auth.
- Con: local upload files would use the Supabase Auth user id as the owner segment.
- Con: local preview/internal access already uses local `dms_session` for token consumption.
- Con: owner mismatch can break local-file access for newly uploaded files if local user ids differ from Supabase user ids.
- Con: it extends mixed-auth behavior in a storage-sensitive route.

Option B: switch `/api/upload` to `getLocalServerSession(request)`.

- Pro: aligns the local file owner segment with the local custom session user id.
- Pro: matches the target auth runtime and current local `AppLayout`/login direction.
- Pro: avoids silently writing local files under obsolete Supabase user namespaces.
- Pro: lets future internal raw preview for newly uploaded files use the same owner segment.
- Con: route tests must assert that the error body remains compatible enough for current callers.
- Con: mixed runtime routes that still use Supabase Auth will not automatically share ownership assumptions.

Recommendation for the actual implementation phase:

- Use `getLocalServerSession(request)` for `/api/upload` local wiring.
- Map missing local session to the current upload route response: `401 { "error": "Unauthorized" }`.
- Derive `ownerUserId` only from the local server session.
- Do not accept owner id from the request body, query string, filename, or client metadata.
- Document that local uploads use fresh local user ids only. Do not preserve old Supabase Auth user ids unless a future explicit data migration decision changes scope.

## 5. Local Helper Usage Plan

A later route implementation should use the Phase 6E.2 helper in this order:

1. Read and validate the local server session.
2. Parse `request.formData()`.
3. Validate `file` is a `File`.
4. Validate `kelengkapan_id` and `nama_dokumen` are strings.
5. Call `validateLocalUploadFileMetadata(...)` with:

```text
{ name: file.name, type: file.type, size: file.size }
```

6. Call `validateLocalUploadKelengkapanId(...)` for `kelengkapan_id`, or rely on `createLocalUploadDescriptor(...)` after separately mapping validation errors.
7. Call `createLocalUploadDescriptor(...)` with:

```text
file metadata
kelengkapanId
ownerUserId from server session
```

8. Read file bytes with `file.arrayBuffer()` only after metadata size/type validation passes.
9. Call `writeLocalUploadContent(...)` with:

```text
logicalPath: descriptor.logicalPath
content: file ArrayBuffer
expectedBytes: file.size
```

10. Return the current-compatible response:

```json
{
  "url": "descriptor.logicalPath",
  "nama": "nama_dokumen",
  "kelengkapan_id": "descriptor.kelengkapanId",
  "uploaded_at": "new ISO timestamp"
}
```

The route should not expose the helper's internal physical write target. The route should not import or use Supabase storage for the local path after the actual implementation phase switches it.

## 6. Multipart/FormData Handling Plan

Later implementation considerations:

- Use `await request.formData()` inside a `try/catch`.
- If parsing fails, preserve `400 { "error": "Invalid form data" }`.
- Read `formData.get('file')`.
- Require `file instanceof File`; otherwise return `400 { "error": "File tidak ditemukan" }`.
- Read `formData.get('kelengkapan_id')` and `formData.get('nama_dokumen')`.
- Treat non-string or empty `kelengkapan_id`/`nama_dokumen` as missing required fields.
- Keep the current missing-field error compatible: `400 { "error": "kelengkapan_id dan nama_dokumen wajib diisi" }`.
- Check metadata before reading bytes so oversize files are rejected before buffering content.
- The current 2 MB limit makes `file.arrayBuffer()` acceptable for parity implementation.
- Pass `expectedBytes: file.size` to `writeLocalUploadContent(...)` so metadata and content length must match.
- Do not log file contents.
- Do not log request bodies.
- Do not log generated internal URLs or tokens.
- Avoid logging logical paths unless a future logging policy explicitly permits sanitized relative identifiers.
- Keep errors JSON-shaped because `FileUploadButton` calls `res.json()` before checking `res.ok`.

## 7. Error And Status Compatibility

Current likely status codes and JSON errors from `/api/upload`:

- `401 { "error": "Unauthorized" }`
- `400 { "error": "Invalid form data" }`
- `400 { "error": "File tidak ditemukan" }`
- `400 { "error": "kelengkapan_id dan nama_dokumen wajib diisi" }`
- `400 { "error": "ID kelengkapan tidak valid" }`
- `400 { "error": "Tipe file tidak diizinkan. Gunakan: PDF, DOC, DOCX, XLS, XLSX" }`
- `400 { "error": "Ukuran file maksimal 2MB" }`
- `400 { "error": "Gagal membaca file" }`
- `500 { "error": "Gagal mengunggah file. Silakan coba lagi." }`

Target later error mapping:

- Unauthorized: keep `401 { "error": "Unauthorized" }`.
- Missing file: keep `400 { "error": "File tidak ditemukan" }`.
- Missing `kelengkapan_id` or `nama_dokumen`: keep `400 { "error": "kelengkapan_id dan nama_dokumen wajib diisi" }`.
- Invalid `kelengkapan_id`: keep `400 { "error": "ID kelengkapan tidak valid" }`.
- Invalid filename or unsafe filename: return `400` with a generic upload/file validation error; avoid exposing rejected path details.
- Invalid MIME type or extension: keep or map to `400 { "error": "Tipe file tidak diizinkan. Gunakan: PDF, DOC, DOCX, XLS, XLSX" }`.
- Oversize metadata or content: keep `400 { "error": "Ukuran file maksimal 2MB" }`.
- File read failure: keep `400 { "error": "Gagal membaca file" }`.
- Local no-overwrite conflict: map to current-compatible `500 { "error": "Gagal mengunggah file. Silakan coba lagi." }` unless a later explicit contract accepts a `409`.
- Local write failure: map to `500 { "error": "Gagal mengunggah file. Silakan coba lagi." }`.

All error responses and logs must avoid physical paths, storage roots, env values, secrets, session tokens, token hashes, password hashes, Supabase signed URLs, and generated internal signed URLs.

## 8. Security Requirements

Future route implementation must enforce:

- No physical filesystem path in response JSON.
- No storage root in response JSON.
- No physical path or storage root in user-visible errors.
- Owner segment comes from server session only.
- Client input must never choose the owner segment.
- No traversal writes.
- No absolute path writes.
- No URL/protocol path writes.
- No network/protocol-relative path writes.
- No overwrite of existing local files.
- No direct public/static serving of local files.
- No Supabase signed URL leakage.
- No internal file-access token or generated internal signed URL leakage.
- No file content logging.
- No request-body logging for multipart uploads.
- No existing Supabase Storage file migration, copy, download, backfill, or sync.
- Local storage starts empty.
- Only newly uploaded local files after route wiring will exist locally.

## 9. Boundary With Other Storage Phases

This route wiring should not include `AttachmentEditor` direct browser upload migration.

Reason: `AttachmentEditor` currently performs browser Supabase Storage upload/delete, uses dash pending paths, previews through raw preview helpers, and performs pending cleanup on reset/cancel. It needs a separate API-backed design to preserve edit/revision/resubmit behavior.

This route wiring should not include pending-to-formal moves.

Reason: submit, update, PPK resubmit, and `rename-pending` move behavior has separate DB/file partial-failure risks and currently detects mainly dash pending paths.

This route wiring should not include delete/remove.

Reason: pending cleanup, replaced-file cleanup, non-material document deletion, and old-file deletion are separate lifecycle operations with retry/orphan implications.

This route wiring should not include archive destruction deletion.

Reason: archive destruction must preserve `DIMUSNAHKAN` access blocking and decide partial deletion behavior before replacing Supabase removal.

This route wiring should not include diagnostics/orphan cleanup.

Reason: local orphan cleanup must compare filesystem paths against document and archive references, preferably with dry-run behavior, and should not be mixed with first upload wiring.

This route wiring should not include default preview/download migration.

Reason: current default preview/download behavior remains Supabase-backed, while internal raw preview is opt-in only. Default caller enablement must wait until local file availability and lifecycle behavior are understood.

This route wiring should not include document/archive token authorization.

Reason: `/api/files/access` currently supports raw logical-path access behavior for the verified opt-in path. Document/archive token authorization, `DIMUSNAHKAN` checks for those token types, and role endpoint parity remain separate work.

Known compatibility risk:

- `/api/upload` creates underscore pending paths.
- `AttachmentEditor` creates dash pending paths.
- Current pending detectors and move helpers primarily recognize dash pending paths.
- The route implementation phase must preserve the `/api/upload` underscore path unless a later move-compatibility phase deliberately changes and tests pending detection behavior.

## 10. Required Tests For Future Implementation

When `/api/upload` is actually wired to local storage, add focused tests for:

- Unauthorized request returns `401` and compatible JSON.
- Missing form fields return compatible `400` JSON.
- Invalid or missing `file` field returns compatible `400` JSON.
- Invalid `kelengkapan_id` returns compatible `400` JSON.
- Disallowed MIME type returns compatible `400` JSON.
- Disallowed extension or MIME/extension mismatch returns compatible `400` JSON.
- Oversize file metadata returns compatible `400` JSON.
- Content-length mismatch returns compatible `400` JSON.
- Successful upload returns `201`.
- Successful upload returns exactly the expected response shape `{ url, nama, kelengkapan_id, uploaded_at }`.
- Returned `url` is a logical path.
- Logical path uses the authenticated local user id as owner segment.
- Logical path preserves underscore pending path compatibility.
- File is written under a test storage root.
- Response does not expose physical path or storage root.
- Error responses do not expose physical path or storage root.
- Existing file collision preserves no-overwrite semantics.
- FileUploadButton compatibility if caller-level tests exist.
- Preview/internal URL behavior for a newly uploaded local file may be tested later, but internal preview must not become default unless explicitly enabled.

Do not run build, dev, full test, full typecheck, DB scripts, auth hash scripts, route generation, or storage migration scripts as part of this planning phase.

## 11. Explicitly Not Implemented

Phase 6E.3 does not implement:

- Runtime code changes.
- `/api/upload` local wiring.
- Upload response changes.
- UI caller changes.
- `AttachmentEditor` migration.
- Pending-to-formal move changes.
- Delete/remove changes.
- Archive destruction deletion.
- Diagnostics/orphan cleanup.
- Preview/download default changes.
- Internal URL default enablement.
- Supabase Storage migration, copy, download, backfill, or sync.
- Route tree changes.
- DB schema changes.
- Auth/session runtime changes.
- Multipart parsing runtime changes.
- Supabase Storage retirement.

## 12. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.4 /api/upload Local Route Implementation
```

Strict boundaries for that phase:

- Modify only `/api/upload` route internals and focused tests needed for that route.
- Preserve endpoint path.
- Preserve request shape.
- Preserve response shape.
- Preserve success status `201`.
- Use the Phase 6E.2 local upload helper.
- Use local `dms_session` through `getLocalServerSession(request)`.
- Derive owner segment from server session only.
- Do not change UI callers except tests.
- Do not implement pending-to-formal moves.
- Do not migrate `AttachmentEditor`.
- Do not implement delete/remove.
- Do not implement archive destruction deletion.
- Do not implement diagnostics/orphan cleanup.
- Do not change preview/download defaults.
- Do not enable internal URLs by default.
- Do not migrate, copy, download, backfill, or sync Supabase Storage files.

Another planning phase is not required before `/api/upload` route implementation if Phase 6E.4 stays this narrow. A separate planning phase is still recommended before migrating `AttachmentEditor`, move/delete behavior, archive destruction deletion, diagnostics/orphan cleanup, or preview/download defaults.

## Phase 6E.4 Follow-Up Note

Phase 6E.4 implemented this plan in `src/routes/api/upload.ts` and documented the result in `docs/migration/local-upload-route-implementation.md`.

The route now uses local `dms_session` authorization through `getLocalServerSession(request)`, writes newly uploaded files through `writeLocalUploadContent(...)`, preserves the `201 { url, nama, kelengkapan_id, uploaded_at }` response shape, and keeps returned paths logical-only. No UI caller, `AttachmentEditor`, pending move, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download default, route tree, database, or Supabase Storage data migration work was added.

## 13. Validation Performed

Commands run:

```powershell
Get-Content -Raw AGENTS.md
Get-Content -Raw docs\migration\README.md
Get-Content -Raw docs\migration\migration-constraints.md
Get-Content -Raw docs\migration\migration-roadmap.md
Get-Content -Raw docs\migration\phase-plan.md
Get-Content -Raw docs\migration\open-decisions.md
Get-Content -Raw docs\migration\storage-replacement-contract.md
Get-Content -Raw docs\migration\storage-replacement-planning-contract.md
Get-Content -Raw docs\migration\local-upload-replacement-planning.md
Get-Content -Raw docs\migration\local-upload-helper-foundation.md
Get-Content -Raw docs\migration\local-filesystem-storage-foundation.md
Get-Content -Raw docs\migration\controlled-raw-preview-enablement-strategy.md
```

Result: confirmed this phase must be docs/planning-only and that `/api/upload`, UI callers, pending moves, deletes, archive destruction, diagnostics, and preview/download defaults remain unwired.

```powershell
Get-Content -Raw src\routes\api\upload.ts
Get-Content -Raw src\lib\storage\local-upload.ts
Get-Content -Raw tests\unit\storage\local-upload.test.ts
Get-Content -Raw src\lib\auth\local-server-auth.ts
Get-Content -Raw src\lib\auth.ts
Get-Content -Raw src\components\dokumen\FileUploadButton.tsx
Get-Content -Raw src\components\dokumen\KelengkapanChecklist.tsx
Get-Content -Raw src\components\dokumen\AttachmentEditor.tsx
Get-Content -Raw src\routes\api\dokumen\submit.ts
Get-Content -Raw src\routes\api\dokumen\rename-pending.ts
Get-Content -Raw src\lib\dokumen\storage.ts
Get-Content -Raw src\lib\utils\file.ts
Get-Content -Raw src\lib\storage\local-storage-paths.ts
Get-Content -Raw src\routes\api\dokumen\preview-url.ts
Get-Content -Raw src\lib\storage-client.ts
```

Result: confirmed current upload behavior, local helper capabilities, Supabase vs local auth helper differences, caller assumptions, direct `AttachmentEditor` storage behavior, dash-vs-underscore pending mismatch, and opt-in internal raw preview status.

```powershell
rg -n "createFileRoute\('/api/upload'\)|fetch\('/api/upload'|FormData|kelengkapan_id|nama_dokumen|uploaded_at|\.upload\(|createAdminClient|getServerSession|getLocalServerSession|FileUploadButton|KelengkapanChecklist|MAX_FILE_SIZE|ALLOWED_FILE_TYPES|LOCAL_UPLOAD_MAX_BYTES|createLocalUploadDescriptor|writeLocalUploadContent" src tests docs
rg --files tests | rg "upload|storage|preview|file"
rg -n "fetch\('/api/upload'|/api/upload|new FormData|formData\(|createLocalUploadDescriptor|writeLocalUploadContent|LOCAL_UPLOAD_MAX_BYTES|ALLOWED_TYPES|MAX_SIZE" src tests docs\migration
rg -n "isPendingFile|isStoragePathPending|pending-upload-api|pending-dash|kelengkapanId_" src tests docs\migration
rg -n "AttachmentEditor|FileUploadButton|fetch\('/api/upload'|supabase\.storage|\.remove\(|\.move\(" src\components src\routes\api src\lib tests
rg -n "preview-url|download-url|useInternal|/api/files/access|signedUrl" src\routes\api src\components src\lib tests\unit\storage docs\migration
```

Result: discovered the upload route, FileUploadButton caller, AttachmentEditor direct Supabase upload/delete, move/delete surfaces, storage tests, pending path classifiers, and preview/internal URL surfaces documented above.

```powershell
git status --short --branch
git diff --name-only -- src\routeTree.gen.ts
```

Result before documentation edits: branch was `## migration/postgres-local`; `src/routeTree.gen.ts` had no diff.

Final validation after documentation edits:

```powershell
git diff --check
git status --short --branch
git diff --name-only -- src\routeTree.gen.ts
```

Result: `git diff --check` passed. Git reported line-ending normalization warnings for existing tracked docs touched in this phase. Final status showed only migration documentation changes and the new route wiring plan document. `src/routeTree.gen.ts` had no diff.
