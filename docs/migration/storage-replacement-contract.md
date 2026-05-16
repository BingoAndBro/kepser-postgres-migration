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

## Phase 6D.9 Controlled Enablement Strategy Note

Phase 6D.9 added `docs/migration/controlled-raw-preview-enablement-strategy.md` as a planning-only guardrail before any UI/helper caller uses `useInternal=true`.

The accepted strategy is conservative: keep `useInternal=true` manual/test-only for now, treat raw-path preview surfaces as the only later controlled candidates, keep download/document/role/archive/upload surfaces Supabase-backed, require matching local files or local upload replacement before caller enablement, and define fallback/rollback/manual verification before any runtime caller change. No runtime storage behavior changed.

## Phase 6E.1 Local Upload Planning Note

Phase 6E.1 added `docs/migration/local-upload-replacement-planning.md` as the planning document for future local filesystem upload replacement.

The plan keeps `/api/upload` path and response compatibility central, documents the current `/api/upload` underscore pending path and `AttachmentEditor` dash pending path, recommends local `dms_session` ownership semantics for local uploads, and sequences upload helper foundation before route wiring, `AttachmentEditor` migration, pending-to-formal moves, delete/remove behavior, archive destruction deletion, and caller-level internal preview enablement.

No runtime upload behavior changed. Supabase Storage remains the active upload implementation, and no existing Supabase Storage files were migrated, copied, downloaded, backfilled, or synced.

## Phase 6E.2 Local Upload Helper Foundation Note

Phase 6E.2 added `src/lib/storage/local-upload.ts`, focused unit tests, and `docs/migration/local-upload-helper-foundation.md`.

The helper is server-only and isolated from runtime routes/components. It validates upload file metadata, sanitizes client filenames, validates `kelengkapan_id`, generates compatible underscore pending logical paths, resolves write targets internally through the local path foundation, and writes small upload buffers with no-overwrite semantics. Helper results expose logical metadata only and do not expose physical filesystem paths.

No `/api/upload` behavior changed. UI callers, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, route generation, Supabase Storage retirement, and Supabase Storage file migration remain future work.

## Phase 6E.3 Local Upload Route Wiring Plan Note

Phase 6E.3 added `docs/migration/local-upload-route-wiring-plan.md` as a planning-only route wiring contract for a future `/api/upload` local implementation.

The plan preserves `/api/upload`, `multipart/form-data` fields `file`, `kelengkapan_id`, and `nama_dokumen`, success status `201`, response shape `{ url, nama, kelengkapan_id, uploaded_at }`, logical-path-only responses, and underscore pending path compatibility. It recommends using `getLocalServerSession(request)` during the implementation phase so the local file owner segment comes from the local session user id.

No runtime upload behavior changed. `/api/upload` remains Supabase-backed. UI callers, `AttachmentEditor`, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, route generation, auth runtime changes, Supabase Storage retirement, and Supabase Storage file migration remain future work.

## Phase 6E.4 Local Upload Route Implementation Note

Phase 6E.4 switched `POST /api/upload` internals to local filesystem upload using `src/lib/storage/local-upload.ts`.

The route now uses local `dms_session` authorization through `getLocalServerSession(request)`, derives the owner segment from the local session user id, writes only newly uploaded files to local filesystem storage, and returns the existing compatible `201 { url, nama, kelengkapan_id, uploaded_at }` shape. The returned `url` remains a logical storage path and no physical path or storage root is returned.

UI callers, `AttachmentEditor`, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, route generation, Supabase Storage retirement, and Supabase Storage file/data migration remain future work.

## Phase 6E.6 Pending-To-Formal Move Planning Note

Phase 6E.6 added `docs/migration/pending-to-formal-local-move-planning.md` as a planning-only contract for later local filesystem pending-to-formal move behavior.

The plan inventories the current Supabase `.move(...)` surfaces, route/helper metadata behavior, dash and underscore pending path formats, formal UUID path semantics, submit `temp-id` compatibility, local owner/session direction, filesystem move safety, DB/file partial-failure risks, mixed Supabase/local storage policy, and route-specific future test strategy. It explicitly keeps `AttachmentEditor` migration, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default migration, internal URL default enablement, and Supabase Storage retirement out of scope.

No runtime source code changed. No local move helper, submit/rename/resubmit behavior, upload behavior, route tree change, DB schema change, auth/session change, or Supabase Storage migration/copy/download/backfill/sync was added.

## Phase 6E.7 Local Move Helper Foundation Note

Phase 6E.7 added `src/lib/storage/local-pending-move.ts`, focused unit tests, and `docs/migration/local-pending-move-helper-foundation.md`.

The helper is server-only and isolated from runtime routes/components. It validates supported source logical paths, recognizes both underscore `/api/upload` pending paths and dash `AttachmentEditor` pending paths, leaves formal paths unchanged, generates UUID-based formal target logical paths, resolves physical paths internally under the local storage root, and moves local files with no-overwrite semantics.

Helper results expose only logical metadata. Physical filesystem paths and the storage root are not returned. The helper does not call Supabase APIs and does not fetch, copy, download, backfill, or sync Supabase Storage files.

Submit, `rename-pending`, update, resubmit, delete/remove, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, internal URL default enablement, UI caller migration, and Supabase Storage retirement remain future work.

## Phase 6E.8 Rename-Pending Route Planning Note

Phase 6E.8 added `docs/migration/rename-pending-local-move-route-planning.md` as a planning-only contract for future local filesystem wiring of:

```text
POST /api/dokumen/rename-pending
```

The plan preserves endpoint path, request compatibility with `{ dokId, lampiranUrls, userId }`, and success shape `{ success: true, renamed, errors? }`. It recommends future local `dms_session` authorization, document ownership validation, treating body `userId` as compatibility input only, using the Phase 6E.7 helper for local pending moves, supporting both underscore and dash pending path variants when files exist locally, and reporting missing or unsupported local sources without Supabase fallback.

No runtime source code changed. The route remains Supabase-backed until a later implementation phase. Submit, update, resubmit, upload, `AttachmentEditor`, delete/remove, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, internal URL default enablement, route tree changes, and Supabase Storage retirement remain future work.

## Phase 6E.9 Rename-Pending Route Implementation Note

Phase 6E.9 switched only `POST /api/dokumen/rename-pending` storage move internals to local filesystem movement through `src/lib/storage/local-pending-move.ts`.

The route now uses local `dms_session` authorization through `getLocalServerSession(request)`, validates body `userId` against the local session as compatibility input, preserves the existing document ownership check, supports local underscore and dash pending paths, and returns the compatible `{ success: true, renamed, errors? }` success shape with logical paths only. Missing local source files are reported as controlled local storage failures and do not trigger Supabase fetch, copy, download, backfill, or sync.

Submit, update, PPK resubmit, `/api/upload`, `AttachmentEditor`, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, internal URL default enablement, route tree changes, and Supabase Storage retirement remain future work.

## Phase 6E.10 Rename-Pending Runtime Smoke Handoff Note

Phase 6E.10 added `docs/migration/rename-pending-runtime-smoke-handoff.md` as verification and handoff documentation for the Phase 6E.9 route runtime state.

The smoke handoff confirms that `POST /api/dokumen/rename-pending` keeps the same endpoint path, request shape `{ dokId, lampiranUrls, userId }`, and success shape `{ success: true, renamed, errors? }`; uses local `dms_session`; treats body `userId` as compatibility input that must match the session; keeps document ownership checking; returns logical-only paths; skips formal and safe unsupported paths; and reports missing local files without Supabase fallback.

No runtime source code or storage behavior changed in Phase 6E.10. Submit, update, PPK resubmit, upload behavior, `AttachmentEditor`, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download defaults, internal URL default enablement, route tree changes, DB schema changes, auth/session runtime changes, and Supabase Storage migration/copy/download/backfill/sync remain out of scope.

## Current Supabase Storage Behavior Summary

- Bucket name: `dokumen-lampiran`.
- `/api/upload` now uploads newly submitted files to local filesystem storage and returns `url`, `nama`, `kelengkapan_id`, and `uploaded_at`.
- `AttachmentEditor` also performs direct browser Supabase Storage upload/remove in some revision flows.
- `POST /api/dokumen/rename-pending` now moves local pending files to formal logical paths.
- Submit/resubmit/update flows still use their existing Supabase-backed pending move behavior.
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
