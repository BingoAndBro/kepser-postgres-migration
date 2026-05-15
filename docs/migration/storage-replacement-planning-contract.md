# Phase 6A Storage Replacement Planning Contract

Date: 2026-05-14.

## Purpose

Phase 6A inventories the current Supabase Storage surface and locks the compatibility contract for later local filesystem storage implementation.

This phase is planning, audit, and documentation only. It does not implement local upload, preview, download, signed-token, file move, file delete, archive destruction, diagnostics, orphan cleanup, database schema changes, API migration, workflow changes, or runtime behavior changes.

The original Supabase-backed storage behavior remains the behavioral reference until local replacement parity is verified.

## Current Supabase Storage Surface

Bucket:

- `dokumen-lampiran`

Current active storage surfaces found by audit:

- `POST /api/upload` uploads pending attachments with the Supabase admin client.
- `src/components/dokumen/AttachmentEditor.tsx` uploads and removes pending files directly from the browser Supabase client in edit/revision/resubmit flows.
- `src/lib/dokumen/storage.ts` centralizes pending-to-formal movement through `syncDocumentAttachments()` and orphan deletion through `deleteOrphanFiles()`.
- `POST /api/dokumen/submit` moves dash-format pending paths before creating the document row.
- `POST /api/dokumen/rename-pending` moves pending paths into formal document paths for an existing document.
- `PATCH /api/dokumen/$id` moves pending files and schedules old/replaced files for fire-and-forget deletion.
- `PATCH /api/ppk/resubmit/$id` and `POST /api/ppk/resubmit/$id` move pending files and schedule old/replaced files for fire-and-forget deletion.
- Role preview/download endpoints return Supabase signed URLs.
- Raw storage-path preview/download endpoints under `/api/dokumen/preview-url` and `/api/dokumen/download-url` return Supabase signed URLs for a `url` query parameter after authorization checks.
- `POST /api/arsiparis/dokumen/$id/archive` snapshots `dokumen_transaksi.lampiran_urls` into `arsip.lampiran_snapshot`.
- `PATCH /api/arsiparis/usul-musnah/$id` removes files referenced by `lampiran_snapshot`, sets `status_arsip='DIMUSNAHKAN'`, and clears the snapshot.
- `GET /api/admin/analyze-storage` lists Supabase Storage and compares bucket paths against `dokumen_transaksi.lampiran_urls`.
- `GET /api/admin/cleanup-orphan-files` lists Supabase Storage and removes unreferenced bucket paths.

No `getPublicUrl` usage was found. No `createSignedUrls` usage was found. Single-file `createSignedUrl` is the active signed URL path.

## Path Semantics To Preserve

Current stored attachment metadata shape:

```ts
{
  kelengkapan_id: string
  nama: string
  url: string
  uploaded_at: string
}
```

The `url` field stores the logical Supabase Storage object path directly. Later local filesystem storage must preserve the logical path semantics in DB metadata even if the physical filesystem layout differs.

### Pending Paths

Canonical pending path from `POST /api/upload`:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

Observed direct browser pending path from `AttachmentEditor`:

```text
{userId}/{timestamp}-{random}-{filename.ext}
```

Current pending detection in `src/lib/utils/file.ts`, `src/lib/dokumen/storage.ts`, `src/routes/api/dokumen/submit.ts`, `src/routes/api/dokumen/rename-pending.ts`, and `src/routes/api/admin/cleanup-orphan-files.ts` recognizes only the dash filename pattern:

```text
{userId}/{13-digit timestamp}-{alphanumeric random}-{filename.ext}
```

The underscore upload API path is therefore an observed active upload format, while dash-format is the canonical "pending file" detector for current move/cleanup helpers. This mismatch must be preserved or reconciled explicitly in Phase 6B/6C before implementation changes behavior.

### Formal Paths

Formal attachment path:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

Observed special case:

- `POST /api/dokumen/submit` currently moves dash-format pending files to `{userId}/temp-id/{uuid}.{ext}` before creating the real document row.

This `temp-id` behavior is current runtime behavior and must be treated as a compatibility risk. Later implementation must either preserve it until workflow mutation migration or explicitly document and test any compatibility mapping.

### Archive Snapshot Paths

`POST /api/arsiparis/dokumen/$id/archive` copies the current `dokumen_transaksi.lampiran_urls` array into `arsip.lampiran_snapshot`.

Archive detail routes read `lampiran_snapshot` rather than `dokumen_transaksi.lampiran_urls` for archived file metadata. Snapshot paths must remain resolvable until archive destruction. After destruction, snapshot/file references must not allow file access.

### Ownership Semantics

`storagePathBelongsToUser(path, userId)` treats the first path segment as the owner user id. Raw-path preview/download endpoints and `rename-pending` rely on this ownership convention. Local filesystem replacement must keep user-id logical namespaces and must not expose raw absolute filesystem paths.

## API Compatibility Requirements

All future storage implementation must preserve current endpoint paths, methods, request shapes, response shapes, UI behavior, status categories relied on by the UI, auth behavior, role behavior, active-role behavior, workflow status behavior, and stored metadata semantics.

### Upload

Endpoint:

```text
POST /api/upload
```

Request shape:

- `multipart/form-data`
- `file`: `File`, required
- `kelengkapan_id`: UUID or `user-custom-{uuid}`, required
- `nama_dokumen`: string, required

Current validation:

- Requires authenticated session.
- Allows MIME types: PDF, DOC, DOCX, XLS, XLSX.
- Maximum file size: 2 MB.
- Sanitizes filename with `[^a-zA-Z0-9._-] -> _`.
- Sanitizes `kelengkapan_id` with `[^a-zA-Z0-9.-] -> _`.

Success response:

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

Error behavior:

- `401 { "error": "Unauthorized" }`
- `400 { "error": "Invalid form data" }`
- `400 { "error": "File tidak ditemukan" }`
- `400 { "error": "kelengkapan_id dan nama_dokumen wajib diisi" }`
- `400 { "error": "ID kelengkapan tidak valid" }`
- `400 { "error": "Tipe file tidak diizinkan. Gunakan: PDF, DOC, DOCX, XLS, XLSX" }`
- `400 { "error": "Ukuran file maksimal 2MB" }`
- `400 { "error": "Gagal membaca file" }`
- `500 { "error": "Gagal mengunggah file. Silakan coba lagi." }`

Storage side effect:

- Writes a pending object to `dokumen-lampiran` and returns the storage object path.

### AttachmentEditor Direct Browser Upload/Delete

Surface:

- `src/components/dokumen/AttachmentEditor.tsx`

Current behavior:

- Uses `getBrowserClient()`.
- Reads browser Supabase session for `session.user.id`.
- Uploads pending files directly to Supabase Storage with `cacheControl: '3600'` and `upsert: false`.
- Uses dash pending path `{userId}/{timestamp}-{random}-{filename.ext}`.
- Removes pending files directly from browser storage on reset and cancel.
- Preview uses `GET /api/dokumen/preview-url?url=...`.
- Download also uses the preview signed URL helper and then fetches the signed URL as a blob.

Compatibility requirement:

- Later local storage must move this behavior behind API routes while preserving UI outcomes. Phase 6A does not change it.

### Raw Path Preview

Endpoint:

```text
GET /api/dokumen/preview-url?url={logicalPath}
```

Request shape:

- Query `url`, required.

Auth/role behavior:

- Requires authenticated session.
- Calls `canAccessStoragePath()`.
- Access is allowed if the first path segment matches the current user id, or if the user has `PPK`, `BENDAHARA`, or `ARSIPARIS`.

Success response:

```json
{
  "signedUrl": "supabase-signed-url",
  "filename": "derived filename"
}
```

Error behavior:

- `401 { "error": "Unauthorized" }`
- `400 { "error": "URL parameter required" }`
- `403 { "error": "Anda tidak memiliki akses" }`
- `500 { "error": "Gagal membuat link pratinjau" }`

Storage side effect:

- None. Generates a 900 second Supabase signed URL.

Local replacement risk:

- This endpoint accepts a raw logical path query. Filesystem implementation must validate and normalize it strictly and must never join this value directly into a filesystem path.

### Raw Path Download

Endpoint:

```text
GET /api/dokumen/download-url?url={logicalPath}&docId={id}&docDate={yyyy-mm-dd?}&lampName={name}&lampIndex={index?}
```

Request shape:

- Query `url`, required.
- Query `docId`, required.
- Query `lampName`, required.
- Query `docDate`, optional.
- Query `lampIndex`, optional.

Auth/role behavior:

- Same as raw path preview through `canAccessStoragePath()`.

Success response:

```json
{
  "signedUrl": "supabase-signed-url"
}
```

Current filename behavior:

- Derives original filename from underscore or dash pending path variants.
- Builds download filename as `{docIdFirst8}_{originalNameWithoutExt}_{docDate?}.{ext}`.
- Calls Supabase signed URL with download filename and 900 second expiry.

Error behavior:

- `401 { "error": "Unauthorized" }`
- `400 { "error": "URL parameter required" }`
- `403 { "error": "Anda tidak memiliki akses" }`
- `400 { "error": "docId and lampName parameters required" }`
- `500 { "error": "Gagal membuat link unduh" }`

Storage side effect:

- None. Generates a 900 second Supabase signed URL with download metadata.

### Role Preview/Download

Endpoints:

```text
GET /api/dokumen/$id/preview/$lampiranIndex
GET /api/dokumen/$id/download/$lampiranIndex
GET /api/ppk/dokumen/$id/preview/$lampiranIndex
GET /api/ppk/dokumen/$id/download/$lampiranIndex
GET /api/bendahara/dokumen/$id/preview/$lampiranIndex
GET /api/bendahara/dokumen/$id/download/$lampiranIndex
```

Request shape:

- Path `id`: document id.
- Path `lampiranIndex`: zero-based index into `lampiran_urls`.

Auth/role behavior:

- Pegawai route requires authenticated session and owner or approver role.
- PPK route requires authenticated session and `PPK` role.
- Bendahara route requires authenticated session and `BENDAHARA` role.
- All checked routes block access when the archive row has `status_arsip='DIMUSNAHKAN'`.

Success response:

```json
{
  "signedUrl": "supabase-signed-url"
}
```

Current expiry:

- Preview: 900 seconds.
- Download: 3600 seconds.

Current error behavior:

- `401 { "error": "Unauthorized" }`
- `403 { "error": "Anda tidak memiliki akses" }` or `403 { "error": "Akses ditolak" }`
- `404 { "error": "Dokumen tidak ditemukan" }`
- `404 { "error": "Lampiran tidak ditemukan" }`
- `410 { "error": "File asli tidak tersedia ... arsip telah dimusnahkan" }`
- `404 { "error": "File tidak ditemukan" }` for some object-not-found cases.
- `500 { "error": "Gagal membuat link pratinjau" }` or `500 { "error": "Gagal membuat link download" }`

Compatibility note:

- `src/lib/file-helpers.ts` accepts optional `filename` in the JSON, but current role endpoints generally return only `{ signedUrl }`. Future replacement should preserve `{ signedUrl }` unless the callers are migrated in the same verified phase.

### Submit/Resubmit Pending-To-Formal Move

Surfaces:

```text
POST /api/dokumen/submit
POST /api/dokumen/$id/submit
POST /api/dokumen/rename-pending
PATCH /api/dokumen/$id
PATCH /api/ppk/resubmit/$id
POST /api/ppk/resubmit/$id
```

Current behavior:

- `POST /api/dokumen/submit` validates the combined create/submit payload, moves dash pending paths to `{userId}/temp-id/{uuid}.{ext}`, creates the document, updates status, and inserts a log.
- `POST /api/dokumen/$id/submit` only transitions an existing document; it does not move files.
- `POST /api/dokumen/rename-pending` accepts `{ dokId, lampiranUrls, userId }`, verifies the user and document owner, moves dash pending files to `{userId}/{dokId}/{uuid}.{ext}`, and returns renamed paths.
- `PATCH /api/dokumen/$id`, `PATCH /api/ppk/resubmit/$id`, and `POST /api/ppk/resubmit/$id` use `syncDocumentAttachments()` to move dash pending files to `{userId}/{dokumenId}/{uuid}.{ext}` and track old/replaced paths for deletion.

Representative request shapes:

```ts
// /api/dokumen/rename-pending
{
  dokId: string
  lampiranUrls: LampiranUrl[]
  userId: string
}

// /api/dokumen/$id PATCH
{
  lampiranUrls?: LampiranUrl[]
  judul?: string
  tahun?: number
  fungsiId?: string
  kegiatanId?: string
  tanggal?: string
  nominalRealisasi?: number | null
  keteranganDetail?: string | null
}

// /api/ppk/resubmit/$id PATCH/POST
{
  lampiranUrls?: LampiranUrl[]
  nominalRealisasi?: number | null
}
```

Representative success responses:

```json
{ "success": true }
```

```json
{
  "success": true,
  "renamed": [{ "oldPath": "old", "newPath": "new" }]
}
```

```json
{
  "dokumen": {}
}
```

Current move error behavior:

- Move failures generally return `500` with `{ error: "...", details: { failedPath, newPath, reason } }` or a storage-derived message.
- `syncDocumentAttachments()` throws on move failure before DB update.
- Deletes of old/replaced files are fire-and-forget after DB updates in several routes.

Storage side effects:

- Move pending logical paths into formal logical paths.
- Queue old/replaced/deleted logical paths for removal.

### Delete/Remove Attachment And Document Files

Current deletion surfaces:

- `AttachmentEditor` removes pending files directly on reset/cancel.
- `deleteOrphanFiles()` removes tracked old/replaced paths after updates.
- `DELETE /api/dokumen/$id` deletes non-material `TERSIMPAN` document rows and then removes each `lampiran_urls` file fire-and-forget.
- `GET /api/admin/cleanup-orphan-files` deletes unreferenced bucket files.
- `PATCH /api/arsiparis/usul-musnah/$id` removes files from archive `lampiran_snapshot`.

Compatibility requirement:

- Later local deletion must preserve user-visible responses and must define retry/orphan handling before replacing runtime behavior.

### Archive Snapshot

Endpoint:

```text
POST /api/arsiparis/dokumen/$id/archive
```

Request shape:

```ts
{
  nomor_surat: string
  klasifikasi: string
  retensi_aktif: '1 Tahun' | '3 Tahun' | '5 Tahun' | '10 Tahun' | 'Permanen'
  retensi_inaktif: '1 Tahun' | '3 Tahun' | '5 Tahun' | '10 Tahun' | 'Permanen'
  masa_aktif_berakhir: string
  masa_inaktif_berakhir: string
  catatan_arsiparis?: string
}
```

Success response:

```json
{
  "success": true,
  "message": "Dokumen berhasil diarsipkan"
}
```

Storage side effect:

- No file copy is performed.
- Current `lampiran_urls` metadata is copied into `arsip.lampiran_snapshot`.

Compatibility requirement:

- Snapshot references must remain logical paths and remain resolvable until destruction.

### Archive Destruction Delete

Endpoint:

```text
PATCH /api/arsiparis/usul-musnah/$id
```

Request shape:

```json
{ "aksi": "SETUJUI" }
```

Success response:

```json
{
  "success": true,
  "message": "Arsip berhasil dimusnahkan"
}
```

Current behavior:

- Requires `ARSIPARIS`.
- Requires `arsip_usul_musnah.status='MENUNGGU'`.
- Reads files from `arsip.lampiran_snapshot`.
- Attempts to remove each file with Supabase admin storage.
- Logs deletion failures as warnings but continues.
- Updates `arsip_usul_musnah.status='DISETUJUI'`.
- Sets `arsip.status_arsip='DIMUSNAHKAN'`.
- Clears `arsip.lampiran_snapshot` to `[]`.
- Sets `musnah_at`, `musnah_by`, and `musnah_catatan`.
- Inserts append-only `log_aktivitas`.

Compatibility requirement:

- `DIMUSNAHKAN` must block preview/download even if a stale file still exists.
- Later local deletion policy must decide whether archive state updates may proceed when file deletion partially fails.

### Diagnostics And Orphan Cleanup

Endpoint:

```text
GET /api/admin/analyze-storage
```

Success response:

```json
{
  "summary": {
    "total_folders": 0,
    "total_storage_files": 0,
    "total_orphan_files": 0,
    "total_referenced_files": 0
  },
  "folder_details": {},
  "orphan_paths": [],
  "referenced_paths_count": 0
}
```

Endpoint:

```text
GET /api/admin/cleanup-orphan-files
```

Documented query params in code comments:

- `pending_only=true`
- `dry_run=true`

Observed current implementation:

- The route comments mention `pending_only` and `dry_run`, but the current code does not apply those parameters.
- It deletes all unreferenced bucket files found by scanning one folder level below the bucket root.

Success responses:

```json
{
  "message": "Tidak ada file orphan",
  "deleted_count": 0
}
```

```json
{
  "message": "Cleanup berhasil",
  "deleted_count": 0,
  "orphan_paths": []
}
```

Error behavior:

- `401 { "error": "Unauthorized" }`
- `403 { "error": "Akses ditolak ... hanya admin" }`
- `500 { "error": "Gagal mengambil dokumen" }`
- `500 { "error": "Gagal mengambil file storage", "details": ... }`
- `500 { "error": "Gagal menghapus file", "details": ... }`

Compatibility requirement:

- Future local cleanup must be safer than the current dangerous implementation, but any response or UI-facing behavior change must be documented and tested in its implementation phase.

## Local Filesystem Target Contract

Planned local filesystem principles for Phase 6B and later:

- Storage root comes from environment/config, not a hardcoded absolute path.
- The storage root must be outside public/static serving.
- The app must never expose the storage root as a public static directory.
- Files are accessed only through API routes or server-side helpers.
- Clients must never receive raw absolute filesystem paths.
- Preserve logical storage paths in `dokumen_transaksi.lampiran_urls` and `arsip.lampiran_snapshot`.
- Treat DB logical paths and physical filesystem paths as separate concepts.
- Keep user and document logical namespaces: `{userId}/...` and `{userId}/{dokumenId}/...`.
- Sanitize filenames and path segments.
- Normalize and resolve all filesystem candidates.
- Reject absolute paths and path traversal attempts.
- Verify resolved filesystem paths stay under the configured storage root.
- Do not trust raw path query params.
- Centralize MIME, extension, and size limits.
- Keep Supabase code until local storage parity is verified.

This contract does not decide the exact physical layout. A future implementation may use `storage/temp/` and `storage/documents/` internally, but stored metadata must remain compatible with current logical paths unless a compatibility mapping is explicitly designed and tested.

## Preview/Download Replacement Contract

Future direction:

- Supabase signed URLs will be replaced by internal API streaming or internal short-lived signed file-access tokens.
- Preserve caller response shape where current UI expects `{ signedUrl }`.
- Any returned `signedUrl` should point to an internal API route, not a public filesystem path.
- The token or route must not expose an absolute filesystem path.
- Authorization must be server-side and role-aware.
- Token access must still protect destroyed archives.
- `DIMUSNAHKAN` files must not be served even if stale files remain on disk.
- Token expiry should preserve current semantics where practical: 900 seconds for preview/raw-path links and 3600 seconds for role download links, unless a later contract intentionally changes this.
- Preview should set safe content type and inline disposition where streaming is used.
- Download should set safe content disposition and sanitized filename.

Open implementation decision:

- Whether preview/download endpoints eventually stream directly, keep `{ signedUrl }` permanently, or use a transition where `{ signedUrl }` points to an internal streaming endpoint.

## Move/Delete/Partial Failure Policy

Current Supabase Storage and database writes are not transactional together. Local filesystem storage will have the same class of DB/file coordination risk unless an explicit compensating policy is implemented.

Required future decisions:

- Pending-to-formal move should be atomic as far as possible on one filesystem volume.
- Move behavior must be idempotent where clients retry after a timeout.
- If file move fails before DB update, do not persist DB metadata pointing to missing files.
- If DB update fails after a file move, define whether to roll the file back, record a cleanup task, or leave a recoverable orphan.
- If delete fails after DB update, record enough information for retry or orphan cleanup.
- Archive destruction must decide whether `DIMUSNAHKAN` is written before or after file delete success.
- Archive destruction must decide how partial file delete failures are surfaced, logged, and retried.
- Orphan cleanup should support dry-run before deletion.
- Cleanup must compare filesystem logical paths against both `dokumen_transaksi.lampiran_urls` and active archive snapshots where applicable.
- `log_aktivitas` remains append-only. Do not update or delete audit rows to repair storage failures.
- Failure logs must not print secrets, signed tokens, raw session tokens, token hashes, password hashes, DB URLs, env values, or absolute storage roots.

Phase 6A leaves these as open implementation details.

## Phase 6B Foundation Note

Phase 6B added isolated local filesystem storage foundation helpers and focused unit tests:

- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `docs/migration/local-filesystem-storage-foundation.md`

The helper module covers lazy root resolution, logical path normalization, path traversal prevention, safe physical path resolution under a configured root, filename/path-segment sanitization, owner-segment checks, and classification for the observed dash pending, upload API pending, and formal path formats.

Phase 6B did not change runtime storage behavior. It did not wire local filesystem storage into upload, preview, download, signed-token generation, file streaming, move, delete, archive destruction, diagnostics, orphan cleanup, workflow mutations, API routes, or client components.

No existing Supabase Storage files or data were migrated, copied, downloaded, backfilled, or synced. Implementation wiring remains future Phase 6D+ work.

## Phase 6C Token Contract Note

Phase 6C created `docs/migration/internal-preview-download-token-contract.md` to lock the internal preview/download token and URL compatibility model before runtime implementation.

The contract defines a future internal `{ signedUrl }` target such as `/api/files/access?token=<opaque-token>`, allowed token claims, avoided sensitive claims, HMAC-based signing direction, required expiry, authorization revalidation, `DIMUSNAHKAN` blocking, filename/content-disposition parity, and revocation limitations.

Phase 6C did not add runtime route wiring, token helper code, upload/preview/download replacement, file streaming, move/delete behavior, archive destruction deletion, diagnostics, orphan cleanup, DB schema changes, or existing Supabase Storage file migration/copy/download/sync. Internal signed-token implementation remains future work.

## Phase 6D.2 Internal Access Foundation Note

Phase 6D.2 added a server-only validation service for future internal file access:

- `src/lib/storage/internal-file-access.ts`
- `tests/unit/storage/internal-file-access.test.ts`
- `docs/migration/internal-file-access-route-foundation.md`

The service verifies Phase 6D.1 tokens, requires future route wiring to pass a local `dms_session`-validated session, supports only raw `logicalPath` tokens, applies owner/role compatibility checks, validates logical paths, resolves paths under the local storage root for containment, and returns 501 because streaming is intentionally not implemented.

The actual `GET /api/files/access` route file was deferred because route registration would require `src/routeTree.gen.ts` generation. Existing preview/download endpoints remain Supabase-backed and unchanged.

## Phase 6D.3 Route Registration Note

Phase 6D.3 added `src/routes/api/files/access.ts` and registered `/api/files/access` in `src/routeTree.gen.ts` through the normal TanStack build/generation path. The route passes the request, local server session, and file token secret into the Phase 6D.2 service.

Existing preview/download endpoints remain Supabase-backed and unchanged. No upload replacement, pending-to-formal move behavior, delete/remove behavior, archive destruction file deletion, storage diagnostics/orphan cleanup, local file streaming, document/archive token authorization, or Supabase Storage file migration was added.

## Backup/Restore Considerations

After local filesystem storage exists, PostgreSQL backup alone is insufficient.

Backup sets must include:

- PostgreSQL dump.
- Local storage files.
- A timestamp tying DB and file backup together.
- App/migration version metadata where practical.
- Storage root configuration used by that backup.

Restore requirements:

- Restore must preserve logical storage paths referenced by `lampiran_urls` and `lampiran_snapshot`.
- Archive snapshots must remain resolvable after restore until destruction.
- `DIMUSNAHKAN` archives must remain inaccessible after restore.
- Restore validation should test preview/download for active document files and archived files.
- Orphan analysis after restore must not flag valid active files as missing due to path mapping drift.

## Phase 6B/6C/6D Recommendation

Recommended next storage subphases:

1. Phase 6B: Local Filesystem Storage Foundation
   - Add isolated config/path normalization helpers and tests.
   - Do not wire runtime routes until path safety is verified.

2. Phase 6C: Internal Preview/Download Token Contract
   - Completed as documentation-only contract work.
   - Defines token claims, expiry, signing algorithm, secret config direction, access route shape, reauthorization expectations, `DIMUSNAHKAN` blocking, and filename/content-disposition parity.
   - Preserves `{ signedUrl }` compatibility while clients still expect it.

3. Phase 6D: Upload/Preview/Download Compatibility Implementation
   - Migrate `/api/upload`, raw-path preview/download, and role preview/download internals behind existing endpoint paths.
   - Keep request and response shapes stable.

4. Phase 6E: Move/Delete/Archive/Cleanup Compatibility Implementation
   - Migrate pending-to-formal moves, update/resubmit sync, archive destruction deletes, diagnostics, and orphan cleanup.
   - Add focused regression checks before workflow mutation migration expands.

5. Phase 6F: Storage Regression And Supabase Storage Retirement Plan
   - Verify parity, document remaining gaps, and only then plan Supabase Storage retirement.

## Validation Scope For Phase 6A

Phase 6A validation is documentation-only:

- `git status --short --branch` at start and end.
- Targeted grep/audit commands for storage usage.
- Read current route/helper behavior.
- `git diff --check`.
- Confirm `src/routeTree.gen.ts` unchanged.

No build, dev server, full test, DB migration/generate/seed, password hash helper, route generation, codegen, or storage runtime script is part of this phase.
