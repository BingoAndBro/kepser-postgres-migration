# Phase 6D.1 File Access Token Helper Foundation

Date: 2026-05-14.

## Purpose

Phase 6D.1 adds the isolated server-only token signing and verification primitive for future internal preview/download URLs.

This phase does not implement `/api/files/access`, file streaming, upload behavior, pending-to-formal moves, delete behavior, archive destruction file deletion, storage diagnostics, Supabase Storage replacement, runtime route wiring, client/component wiring, database schema changes, or any Supabase Storage file/data migration.

## Files Added

- `src/lib/storage/file-access-token.ts`
- `tests/unit/storage/file-access-token.test.ts`
- `docs/migration/file-access-token-helper-foundation.md`

## Helper API Summary

The new server-only helper exports:

- `FileAccessTokenPurpose`
- `FileAccessTokenPayload`
- `signFileAccessToken(payload, secret)`
- `verifyFileAccessToken(token, secret, now?)`
- `assertValidFileAccessTokenPayload(payload, now?)`
- `isFileAccessTokenPurpose(value)`

The module starts with:

```ts
// Server-only module. Do not import from client components.
```

It does not import Supabase helpers, local storage root helpers, runtime routes, or broad barrels.

## Token Wire Format

The token is not JWT. The exact wire format is:

```text
v1.<base64url-canonical-json-payload>.<base64url-hmac-sha256-signature>
```

Signing input:

```text
v1.<base64url-canonical-json-payload>
```

The payload is serialized as canonical JSON using a fixed claim order before base64url encoding. Verification recomputes the HMAC-SHA256 signature with the server-provided secret and compares signatures with `timingSafeEqual`.

The payload is client-visible after base64url decoding and must never contain secrets, absolute physical filesystem paths, storage roots, raw session tokens, token hashes, password hashes, DB URLs, env values, Supabase signed URLs, or signing secrets.

## Implemented Claim Validation

The helper accepts only the Phase 6C claim set:

- `version: 1`
- `purpose: 'preview' | 'download'`
- `expiresAt`
- `issuedAt`
- `logicalPath`
- `documentId`
- `lampiranIndex`
- `archiveId`
- `subjectUserId`
- `sessionId`
- `downloadFilename`
- `contentDisposition: 'inline' | 'attachment'`
- `statusCheck: 'document' | 'archive'`

Validation rejects:

- malformed payloads
- unsupported token versions
- unsupported purposes
- expired tokens during verification
- missing file reference claims
- document tokens without a `lampiranIndex`
- unsupported claims
- explicitly sensitive claims such as storage root, physical path, raw session-token, token-hash, signed-URL, password-hash, env, DB URL, and signing-secret style fields
- unsafe string values that look like URLs, traversal, or filesystem paths
- preview tokens requesting attachment disposition
- download tokens requesting inline disposition

## Intentionally Not Implemented

- `/api/files/access`
- internal signed URL response generation
- file streaming
- upload route behavior
- preview/download endpoint replacement
- Supabase signed URL replacement in runtime routes
- pending-to-formal move behavior
- delete/remove behavior
- archive destruction file deletion
- storage diagnostics/orphan cleanup
- production storage directory creation
- storage root reads or physical path resolution
- database schema changes
- workflow/FSM/archive behavior changes
- Supabase Storage file/data migration, copy, download, backfill, or sync

## Validation Scope

Required focused test:

```powershell
pnpm test tests/unit/storage/file-access-token.test.ts
```

Diff whitespace check:

```powershell
git diff --check
```

Runtime wiring audit:

```powershell
rg -n "file-access-token|signFileAccessToken|verifyFileAccessToken|/api/files/access" src -g "!src/lib/storage/file-access-token.ts"
```

For the audit command, no output means no runtime `src/` route/component imports were added in this phase.

## Phase 6D Follow-Up Note

A later runtime phase may use this helper to return compatible internal URLs such as:

```text
{ "signedUrl": "/api/files/access?token=<opaque-token>" }
```

That later phase must still revalidate current session, role/owner authorization, document or archive state, logical path safety, file root containment, and `DIMUSNAHKAN` blocking before streaming any file.

## Phase 6D.2 Follow-Up Note

Phase 6D.2 added `src/lib/storage/internal-file-access.ts` as a server-only service foundation that uses `verifyFileAccessToken(token, secret)` for future internal file access. The route file itself was deferred because adding `GET /api/files/access` would require `src/routeTree.gen.ts` generation, which is forbidden in this phase.

The helper is used only by this internal access service foundation. Existing preview/download endpoints still return Supabase-backed signed URLs, and endpoint wiring remains future work.

## Phase 6D.3 Follow-Up Note

Phase 6D.3 added and registered the route file `src/routes/api/files/access.ts`. The route delegates to the Phase 6D.2 service and does not change token format, token validation, existing preview/download endpoint behavior, upload behavior, or file streaming status.
