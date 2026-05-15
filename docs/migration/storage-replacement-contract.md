# Storage Replacement Contract

This contract defines the target behavior for replacing Supabase Storage with local filesystem storage. It is documentation only and does not implement storage.

## Phase 6A Planning Contract

Phase 6A added a current-behavior inventory and compatibility contract at:

- `docs/migration/storage-replacement-planning-contract.md`

Use the Phase 6A document as the detailed implementation reference for current endpoint paths, request/response shapes, observed pending/formal path variants, `AttachmentEditor` direct browser storage behavior, archive snapshot/destruction behavior, diagnostics/orphan cleanup behavior, and open partial-failure decisions. This file remains the higher-level storage replacement contract.

## Phase 6B Foundation Note

Phase 6B added isolated server-only local storage path helpers in `src/lib/storage/local-storage-paths.ts` plus focused unit tests. The helpers prepare root resolution, logical path validation, safe physical path resolution, filename/path-segment sanitization, ownership checks, and pending/formal classification.

No runtime storage behavior changed in Phase 6B. Upload, preview, download, signed-token, move, delete, archive destruction, diagnostics, orphan cleanup, and route/component wiring remain future work. No existing Supabase Storage files or data were migrated, copied, downloaded, backfilled, or synced.

## Phase 6C Token Contract Note

Phase 6C added the internal preview/download token compatibility contract in `docs/migration/internal-preview-download-token-contract.md`.

The contract preserves current `{ signedUrl }` response expectations by defining future internal API URLs for preview/download access, token claims, expiry, signing and verification rules, authorization revalidation, `DIMUSNAHKAN` blocking, and filename/content-disposition parity. No runtime routes, upload behavior, preview/download behavior, token helpers, file streaming, storage implementation, or Supabase Storage data migration were added in Phase 6C.

## Phase 6D.1 Token Helper Foundation Note

Phase 6D.1 added the isolated server-only token helper in `src/lib/storage/file-access-token.ts` plus focused unit tests.

The helper signs and verifies non-JWT tokens with the wire format `v1.<base64url-canonical-json-payload>.<base64url-hmac-sha256-signature>`, validates allowed claims, rejects expired/tampered/malformed tokens, and rejects unsupported or sensitive claims. It is not imported by runtime routes/components and does not implement `/api/files/access`, file streaming, upload behavior, preview/download replacement, storage root resolution, or Supabase Storage file/data migration.

## Phase 6D.2 Internal Access Foundation Note

Phase 6D.2 added `src/lib/storage/internal-file-access.ts` as a server-only service foundation for the future internal access route. It verifies the Phase 6D.1 token, expects a local server session from future route wiring, validates supported logical-path tokens, performs owner/role compatibility checks, and resolves the local physical path only for root-containment validation.

No route file was registered because `src/routeTree.gen.ts` must not be touched in this phase. No existing preview/download endpoints were wired, and file streaming remains intentionally unimplemented.

## Phase 6D.3 Route Registration Note

Phase 6D.3 added and registered:

```text
GET /api/files/access?token=<opaque-token>
```

The route is a thin wrapper around `getLocalServerSession(request)`, `getFileTokenSecret()`, and `handleInternalFileAccessRequest(...)`. It makes the internal access route reachable, but existing preview/download/upload endpoints remain Supabase-backed. File streaming, document/archive token access, `DIMUSNAHKAN` handling for token streaming, upload replacement, move/delete behavior, and Supabase Storage data migration remain future work.

## Phase 6D.5 Internal URL Builder Note

Phase 6D.5 added `src/lib/storage/internal-file-access-url.ts` as an isolated server-only helper for building relative internal file access URLs:

```text
/api/files/access?token=<opaque-token>
```

The helper accepts a validated file access token payload and an explicit signing secret, delegates token signing to the Phase 6D.1 token helper, and uses `URLSearchParams` for safe query construction. It is not imported by existing preview/download/upload endpoints yet. It does not read env, call filesystem APIs, perform authorization, stream files, replace Supabase signed URLs, migrate Supabase Storage files, or change runtime endpoint behavior.

## Phase 6D.7 Local Streaming Foundation Note

Phase 6D.7 added local file content responses in `src/lib/storage/internal-file-access.ts` for raw logical-path tokens only. The service still verifies the signed token, requires a local server session from the route, validates logical path safety, resolves through the local storage path helper, enforces root containment, and applies existing raw-path owner/role compatibility before any file read.

Document/archive/status-check tokens remain unsupported and continue to return the generic 501 unsupported-token behavior. `DIMUSNAHKAN` checks for document/archive tokens, upload replacement, pending-to-formal local moves, delete/remove behavior, and Supabase Storage file migration remain future work.

## Phase 6D.8 Runtime Verification Note

Phase 6D.8 added focused runtime verification for the opt-in raw logical-path preview flow in `tests/unit/storage/raw-preview-internal-url-runtime.test.ts` and documented the result in `docs/migration/raw-preview-internal-url-runtime-verification.md`.

The verified path is limited to `GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true` returning a compatible internal `{ signedUrl, filename }` response and the internal access service returning local file content when a matching local file exists. The default raw preview request remains Supabase-backed, `useInternal=true` remains opt-in only, normal UI callers remain unchanged, and no download/document/role/archive/upload endpoint behavior was changed.

## Current Supabase Storage Behavior Summary

- Bucket name: `dokumen-lampiran`.
- `/api/upload` uploads files using Supabase admin storage and returns `url`, `nama`, `kelengkapan_id`, and `uploaded_at`.
- `AttachmentEditor` also performs direct browser Supabase Storage upload/remove in some revision flows.
- Submit/resubmit/update flows move pending files to formal paths.
- Preview/download endpoints return Supabase signed URLs.
- Archive destruction removes files and sets archive status to `DIMUSNAHKAN`.
- Admin storage endpoints analyze and clean orphaned bucket files.

## Target Local Filesystem Behavior

- Storage root: `storage/`.
- Files live outside any public/static folder.
- Files must never be exposed as static public files.
- All upload, preview, download, move, delete, analyze, cleanup, and destruction behavior must go through API/server code.
- Server authorization must happen before file access.

## Storage Root

Accepted root:

```text
storage/
```

Recommended logical areas:

```text
storage/temp/
storage/documents/
```

Exact internal folder structure remains an implementation detail, but API behavior and stored metadata must stay compatible.

## API-Only Preview And Download

All preview/download behavior must go through existing API routes:

- `/api/dokumen/$id/preview/$lampiranIndex`
- `/api/dokumen/$id/download/$lampiranIndex`
- `/api/ppk/dokumen/$id/preview/$lampiranIndex`
- `/api/ppk/dokumen/$id/download/$lampiranIndex`
- `/api/bendahara/dokumen/$id/preview/$lampiranIndex`
- `/api/bendahara/dokumen/$id/download/$lampiranIndex`
- `/api/dokumen/preview-url`
- `/api/dokumen/download-url`

These routes must authenticate and authorize before returning or streaming file access.

## Pending Upload Compatibility

Current behavior to preserve:

- Upload requires authenticated user.
- Upload validates document metadata fields.
- Upload validates MIME type and size.
- Response includes `url`, `nama`, `kelengkapan_id`, and `uploaded_at`.
- Pending paths are later moved/renamed into formal document paths.

Current path formats to support during transition:

- `{userId}/{kelengkapanId}_{timestamp}_{filename}`
- `{userId}/{timestamp}-{random}-{filename}`

Target implementation may store files internally under `storage/temp/`, but stored path references must remain compatible with existing metadata and helpers until all callers are migrated.

## Formal Document File Compatibility

Formal path compatibility:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

Formal paths must remain stable after submit/resubmit. Display filenames can continue to be generated from document metadata rather than physical path names.

## Archive Snapshot Compatibility

- `arsip.lampiran_snapshot` must preserve the attachment metadata needed for archive detail pages.
- Snapshot paths must remain resolvable until archive destruction.
- After destruction, preview/download must not expose original files even if a stale file exists on disk.

## `DIMUSNAHKAN` Access Behavior

Preserve current behavior:

- If archive status is `DIMUSNAHKAN`, original file preview/download should fail.
- Existing endpoints use 410-style behavior for destroyed archive access.
- Destruction should clear or invalidate snapshot/file references according to current archive lifecycle behavior.

## Signed URL Replacement Options

Option A: Direct streaming from existing preview/download endpoints.

- Simpler server-side control.
- May require UI/helper changes if they expect `{ signedUrl }`.

Option B: Preserve `{ signedUrl }` response shape with internal signed URL endpoint.

- Better transition compatibility.
- The returned URL points to an internal API route, not a public file path.
- Token verifies action, expiry, and file reference before streaming.

## Recommended Signed-Token Decision

Accepted transition direction:

- Preserve API response shape returning `{ signedUrl }` while current UI expects it.
- `signedUrl` must point to an internal API route.
- `signedUrl` must never expose a raw filesystem path.
- Token should be short-lived.
- Token should be signed with a server-only secret.
- Token should include file reference/path identifier, action (`preview` or `download`), expiry, and user/session scope where practical.
- Token may include nonce/jti if replay tracking is needed.

## Path Traversal Prevention Rules

Implementation must:

- Never map arbitrary user input directly to filesystem paths.
- Reject absolute paths.
- Normalize and resolve candidate paths.
- Verify resolved path stays under configured storage root.
- Use server-generated canonical relative paths.
- Treat raw `url` query endpoints as high-risk and validate strictly.
- Avoid returning filesystem paths in client-visible responses.

## MIME Validation Rules

Preserve current allowed upload types unless changed by separate decision:

- PDF
- DOC
- DOCX
- XLS
- XLSX

Validation should check:

- Declared MIME type.
- Extension allowlist.
- File signature where practical.

## File Size Validation Rules

Current `/api/upload` limit:

- 2 MB per file.

Target behavior:

- Preserve the 2 MB limit during parity migration.
- Later changes require an explicit decision.
- Keep limits centralized in configuration/constants when implementation begins.

## Move/Delete Failure Handling Recommendation

Recommended behavior:

- Treat DB metadata and file operations as a coordinated workflow.
- For move failures, abort the request and do not persist metadata that points to missing files.
- For delete failures after successful DB update, log warning and mark/report orphan cleanup need.
- For destructive archive deletion, update archive state only after deletion strategy is clear, or record enough state to retry safely.
- Build cleanup tools with dry-run first.

Rationale:

Supabase Storage operations are not transactional with database writes. Local filesystem replacement must make partial failure behavior explicit.

## Backup Consistency Between DB And Files

Backup sets must include:

- PostgreSQL dump.
- `storage/` archive.
- Timestamp tying DB and file backup together.
- App/migration version metadata where practical.

Restore validation must include:

- DB restore succeeds.
- `storage/` restore path matches configured storage root.
- Existing document preview/download works.
- Destroyed archive files remain inaccessible.
- Orphan analysis does not flag expected active files as missing.

## Validation Checklist

- `/api/upload` returns compatible payload.
- Pending file path behavior is compatible.
- Submit/resubmit moves pending files to formal references.
- Preview endpoints return compatible `{ signedUrl }` or equivalent accepted response.
- Download endpoints return compatible `{ signedUrl }` or equivalent accepted response.
- Returned signed URLs point to internal API routes only.
- Unauthorized preview/download returns 401/403 as appropriate.
- Missing file behavior matches current user-facing errors.
- `DIMUSNAHKAN` files return destroyed/unavailable behavior.
- Path traversal attempts fail.
- MIME and size validation reject invalid uploads.
- Orphan cleanup can run safely after local storage exists.
