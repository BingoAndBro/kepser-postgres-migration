# Phase 6E.4 /api/upload Local Route Implementation

Date: 2026-05-15.

## Scope

Phase 6E.4 switches only the internals of:

```text
POST /api/upload
```

from Supabase Storage upload to local filesystem upload through the Phase 6E.2 helper.

The endpoint path, HTTP method, multipart request field names, success status, and success response shape remain compatible:

```json
{
  "url": "logical/storage/path",
  "nama": "Nama Dokumen",
  "kelengkapan_id": "uuid-or-user-custom-uuid",
  "uploaded_at": "iso timestamp"
}
```

Success status remains `201`.

## Files Changed

- `src/routes/api/upload.ts`
- `tests/unit/storage/upload-route-local.test.ts`

## Implementation Notes

- The route now uses `getLocalServerSession(request)` as the upload authority.
- The first logical path segment is derived from the authenticated local session user id.
- No `userId` value from form data, query params, filenames, or client metadata is trusted.
- The route still accepts `multipart/form-data` fields `file`, `kelengkapan_id`, and `nama_dokumen`.
- The route uses `createLocalUploadDescriptor(...)` to validate file metadata, validate `kelengkapan_id`, sanitize filenames, and generate the compatible underscore pending path.
- The route uses `writeLocalUploadContent(...)` to write under the configured local storage boundary with no-overwrite semantics.
- Returned `url` remains a logical storage path only.
- Physical filesystem paths and storage roots are not returned in success or error JSON.

Compatible pending path format remains:

```text
{localUserId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

## Preserved Error Shape

The route keeps the existing JSON error style and key user-facing messages where current callers depend on them:

- `401 { "error": "Unauthorized" }`
- `400 { "error": "Invalid form data" }`
- `400 { "error": "File tidak ditemukan" }`
- `400 { "error": "kelengkapan_id dan nama_dokumen wajib diisi" }`
- `400 { "error": "ID kelengkapan tidak valid" }`
- `400 { "error": "Tipe file tidak diizinkan. Gunakan: PDF, DOC, DOCX, XLS, XLSX" }`
- `400 { "error": "Ukuran file maksimal 2MB" }`
- `400 { "error": "Gagal membaca file" }`
- `500 { "error": "Gagal mengunggah file. Silakan coba lagi." }`

The helper now also rejects unsafe filenames. Those return `400 { "error": "File tidak valid" }`.

## Explicitly Not Implemented

Phase 6E.4 does not implement:

- UI caller changes.
- `AttachmentEditor` direct browser upload migration.
- Pending-to-formal local moves.
- Delete/remove behavior.
- Archive destruction local deletion.
- Admin storage diagnostics or orphan cleanup replacement.
- Preview/download default changes.
- Internal URL enablement by default.
- Document/archive token authorization.
- Supabase Storage file migration, copy, download, backfill, or sync.
- Database scripts or schema changes.
- Route generation.
- Supabase Storage dependency removal.

## Compatibility Risk Left Open

`/api/upload` continues to create underscore pending paths, while `AttachmentEditor` still creates dash pending paths through browser Supabase Storage. Existing pending-to-formal move behavior is still not migrated in this phase and remains a separate storage lifecycle task.

Local storage starts empty. Only files uploaded after this phase through `/api/upload` exist in local filesystem storage.

## Validation

Focused tests added:

```powershell
pnpm test tests/unit/storage/upload-route-local.test.ts tests/unit/storage/local-upload.test.ts
```

Result: passed, 2 test files and 24 tests.

The first sandboxed attempt failed before tests started because Vitest could not spawn its config bundling worker (`spawn EPERM`). The same focused command passed when rerun with approved escalation.

Additional guardrail checks:

```powershell
rg -n "supabase|createAdminClient|createServerSupabaseClient|getServerSession|storage\.from|\.upload\(" src/routes/api/upload.ts
git diff --name-only -- src/routeTree.gen.ts
git diff --check
```

Result: the upload route grep returned no matches, which is expected; `src/routeTree.gen.ts` had no diff; `git diff --check` passed. Git reported line-ending normalization warnings for existing tracked files touched in this phase.
