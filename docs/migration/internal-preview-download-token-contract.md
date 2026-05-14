# Phase 6C Internal Preview/Download Token Contract

Date: 2026-05-14.

## Purpose

Phase 6C defines the internal preview/download signed-token and URL compatibility contract before any local storage runtime implementation is wired.

This phase does not change preview, download, upload, file streaming, pending-to-formal moves, delete behavior, archive destruction, route behavior, client behavior, workflow behavior, database schema, or Supabase Storage usage. The current Supabase-backed behavior remains the runtime reference until local replacement parity is verified.

No existing Supabase Storage files or data are migrated, copied, downloaded, backfilled, or synced as part of this contract.

## Current Supabase Signed URL Behavior

Current signed URL generation uses Supabase Storage bucket `dokumen-lampiran` and returns client-consumed JSON containing `signedUrl`.

Current surfaces:

- `GET /api/dokumen/preview-url?url={logicalPath}` returns `{ signedUrl, filename }`.
- `GET /api/dokumen/download-url?url={logicalPath}&docId={id}&docDate={date?}&lampName={name}&lampIndex={index?}` returns `{ signedUrl }`.
- `GET /api/dokumen/$id/preview/$lampiranIndex` returns `{ signedUrl }`.
- `GET /api/dokumen/$id/download/$lampiranIndex` returns `{ signedUrl }`.
- `GET /api/ppk/dokumen/$id/preview/$lampiranIndex` returns `{ signedUrl }`.
- `GET /api/ppk/dokumen/$id/download/$lampiranIndex` returns `{ signedUrl }`.
- `GET /api/bendahara/dokumen/$id/preview/$lampiranIndex` returns `{ signedUrl }`.
- `GET /api/bendahara/dokumen/$id/download/$lampiranIndex` returns `{ signedUrl }`.

No separate Arsiparis preview/download API route files are currently present. Arsiparis detail pages call the Pegawai document preview route and still expect a JSON `signedUrl`.

Observed expiry:

- Raw path preview URL: 900 seconds.
- Raw path download URL: 900 seconds.
- Role preview URLs: 900 seconds.
- Role download URLs: 3600 seconds.

Authorization and state checks:

- Raw path preview/download requires an authenticated session and `canAccessStoragePath()`.
- Raw path access is allowed when the first logical path segment is the current user id, or the user has `PPK`, `BENDAHARA`, or `ARSIPARIS`.
- Pegawai role routes allow the document owner or an approver role.
- PPK routes require `PPK`.
- Bendahara routes require `BENDAHARA`.
- Checked role routes block archive rows with `status_arsip='DIMUSNAHKAN'` and return destroyed/unavailable behavior, currently using HTTP 410 in those checks.

Filename behavior:

- Raw preview derives a display filename from the logical path leaf and returns it as `filename`.
- Raw download derives the original filename from underscore and dash pending path variants, then asks Supabase to generate a download URL with a download filename.
- Raw download filename shape is `{docIdFirst8}_{originalNameWithoutExt}_{docDate?}.{ext}`.
- Role preview/download callers mostly build display/download names client-side using document metadata helpers. Role endpoints generally return only `{ signedUrl }`, while helpers tolerate optional `filename`.

Caller expectation:

- Client helpers and components expect `signedUrl` to be fetchable or iframe-loadable by the browser.
- Current callers do not expect public filesystem paths.
- Future local replacement must preserve the JSON response shape where current callers expect `{ signedUrl }`.

## Compatibility Goal

The future local storage replacement must preserve:

- Existing endpoint paths.
- Existing request shapes.
- Existing response shapes, especially `{ signedUrl }`.
- Existing UI behavior and role behavior.
- Existing logical storage path semantics stored in lampiran metadata and archive snapshots.
- Existing download filename and content-disposition outcomes.
- Existing `DIMUSNAHKAN` blocking behavior.

The replacement `signedUrl` must point to an internal API URL, not a public static file and not a filesystem path. The app must never expose absolute physical filesystem paths in tokens, responses, logs, documentation examples, or tests.

## Proposed Internal Signed URL Shape

Future endpoints that currently return Supabase signed URLs should return an internal URL in the same field:

```text
{ "signedUrl": "/api/files/access?token=<opaque-token>" }
```

This phase does not implement `/api/files/access` or any equivalent access route.

Contract rules:

- The returned URL is an internal API route.
- The token is opaque to clients.
- Clients must treat the URL as a temporary bearer-like access URL.
- The token must not contain an absolute physical filesystem path.
- The token must not contain a storage root.
- The token must not contain a raw session token, token hash, password hash, DB URL, env value, Supabase signed URL, or signing secret.
- If a future implementation uses a signed base64 payload instead of a server-stored opaque token, it still must not include absolute physical paths or secrets, and the payload should be treated as client-visible.

Recommended route shape remains conceptual until implementation:

```text
GET /api/files/access?token=<opaque-token>
```

If a different internal route is chosen later, current preview/download endpoint paths and response shapes must still remain compatible.

## Token Claims Contract

Allowed token claims are limited to what is needed to re-resolve and re-authorize file access:

- `version`: token contract version.
- `purpose`: `preview` or `download`.
- `logicalPath`: logical storage path, only when the source endpoint is already raw-path based or when needed for compatibility.
- `documentId`: document id when the source is document/lampiran based.
- `lampiranIndex`: zero-based attachment index when the source is document/lampiran based.
- `archiveId`: optional archive context id when future archive-specific access requires it.
- `subjectUserId`: optional user binding for the user who requested the signed URL.
- `sessionId`: optional session binding if the implementation can bind safely without exposing raw session credentials.
- `issuedAt`: issued-at timestamp.
- `expiresAt`: required expiry timestamp.
- `downloadFilename`: optional sanitized filename for download responses.
- `contentDisposition`: optional `inline` or `attachment`.
- `statusCheck`: optional context indicating document/archive state must be rechecked before streaming.

Claims to avoid:

- Absolute physical filesystem path.
- Storage root.
- Public/static file path.
- Raw session token.
- Session token hash.
- Password hash.
- DB URL.
- Env values.
- Signing secret.
- Supabase signed URL.
- User password or credential material.
- Broad serialized document rows when `documentId` plus re-query is sufficient.

Preferred design:

- For role document routes, prefer `documentId` plus `lampiranIndex` over a standalone logical path so the access route can re-read current document metadata.
- For raw path routes, include a validated logical path and the original requester context, then revalidate the logical path and authorization again on access.
- Keep token payload small and purpose-specific.

## Signing And Verification Contract

Future implementation can use Node `crypto` without adding dependencies.

Recommended direction:

- Use HMAC-SHA256 or an equivalent Node crypto HMAC for token signing.
- Store the signing secret in server-only config, for example `DMS_FILE_TOKEN_SECRET`.
- Require the signing secret in production.
- If a development/test fallback is ever allowed, it must be explicit, documented, server-only, and never suitable for production.
- Use timing-safe comparison for signature checks.
- Require `expiresAt`.
- Reject expired tokens.
- Reject malformed tokens.
- Reject unknown token versions.
- Reject unknown purposes.
- Reject missing required claims.
- Do not print token values, signatures, signing secrets, env values, session tokens, token hashes, password hashes, DB URLs, or absolute filesystem paths.

Token verification output should return only a validated typed payload or a generic failure reason appropriate for server handling. Detailed parse/signature errors should not leak sensitive internals to clients.

This phase does not implement token signing or verification helpers.

## Authorization Revalidation Contract

Token verification alone is not authorization.

The future internal access route must:

- Validate token signature and expiry.
- Re-resolve the current local session if the access URL relies on cookie auth.
- Or validate an embedded user/session binding if a later implementation chooses session-bound tokens.
- Re-check role and owner access through the current server authorization rules.
- Re-read document/lampiran metadata for document-based tokens.
- Re-check archive state before serving.
- Block `DIMUSNAHKAN` even if a stale local file still exists.
- Validate the logical path with local storage path helpers.
- Resolve the physical file path only on the server.
- Ensure the resolved physical file path remains under the configured storage root.
- Return existing-compatible error categories where callers depend on them.

Recommended compatibility model:

- The endpoint that creates a `signedUrl` performs the same authorization it performs today.
- The internal access route performs a second authorization and state check at token use time.
- Short expiry limits stale-token exposure, but state rechecks are what preserve destroyed-archive blocking.

## Filename And Content-Disposition Contract

Current filename semantics must be preserved.

Raw download:

- Continue deriving the original filename from both pending path variants:
  - `{owner}/{kelengkapanId}_{timestamp}_{originalName.ext}`
  - `{owner}/{timestamp}-{random}-{originalName.ext}`
- Continue building a download filename from document id, original filename, optional document date, and extension.
- Preserve the observed shape `{docIdFirst8}_{originalNameWithoutExt}_{docDate?}.{ext}`.

Role download:

- Preserve client-side fallback naming based on document metadata helpers unless a future route intentionally returns a compatible `filename`.
- If the access route sets `Content-Disposition`, it must use the same sanitized filename that current clients would expect.

Preview:

- Preview responses should use inline disposition when safe.
- Preview should set a safe content type based on validated metadata or file type checks.
- Preview should not force attachment download unless the file type cannot be safely previewed.

Download:

- Download responses should use attachment disposition.
- The filename must be sanitized.
- The filename must not include path separators, traversal segments, absolute paths, storage roots, secrets, tokens, or env values.

Filename helper extraction and refactoring remain future implementation work. Phase 6C does not change filename behavior.

## Expiry Contract

Future defaults should match current observed behavior where practical:

- Raw path preview: 900 seconds.
- Raw path download: 900 seconds.
- Role preview: 900 seconds.
- Role download: 3600 seconds.

Expiry must be encoded in the token and enforced by the access route. Expiry may become configurable later, but response compatibility and security are more important than broad configuration in the first implementation.

## Revocation And Invalidation Limitations

Stateless signed tokens are hard to revoke before expiry. This is acceptable for the compatibility phase only if:

- Expiry remains short.
- The access route re-checks current authorization.
- The access route re-checks document/archive state.
- `DIMUSNAHKAN` blocks access even when an unexpired token exists.

If stronger revocation is required later, a persisted token record, nonce table, denylist, or session-bound token strategy can be considered. That is not part of Phase 6C and should not be added before the basic compatibility route is designed and tested.

## Phase 6D Readiness

Before any runtime wiring in a future implementation phase, confirm:

- Token helper tests exist if a helper module is added.
- Token payloads never include absolute physical paths or storage roots.
- Signing secret is server-only and never exposed through client env.
- Existing preview/download endpoint paths remain unchanged.
- Existing request shapes remain unchanged.
- Existing `{ signedUrl }` response shape remains unchanged.
- Internal access URL points only to an API route.
- Access route revalidates current session, role/owner access, logical path safety, file root containment, and archive state.
- `DIMUSNAHKAN` access tests cover stale-token attempts.
- Filename parity tests cover raw underscore pending, raw dash pending, formal document paths, preview inline behavior, and download attachment behavior.
- No Supabase Storage files or data are migrated, copied, downloaded, backfilled, or synced.

Recommended next phase:

```text
Phase 6D Upload/Preview/Download Compatibility Implementation
```

Phase 6D should start with isolated token helper tests and access-route contract tests before replacing any Supabase signed URL generation in runtime routes.
