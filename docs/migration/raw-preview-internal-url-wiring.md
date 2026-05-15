# Phase 6D.6 Raw Logical-Path Preview Internal URL Wiring

Date: 2026-05-15.

## Scope

Phase 6D.6 wires only the raw logical-path preview endpoint:

```text
GET /api/dokumen/preview-url?url={logicalPath}
```

No download, document-detail, PPK, Bendahara, Arsiparis/archive, upload, move, delete, archive destruction, or cleanup endpoint is changed in this phase.

## Default Behavior

The default request remains Supabase-backed:

```text
GET /api/dokumen/preview-url?url={logicalPath}
```

The endpoint still requires the existing Supabase-backed session check, still calls `canAccessStoragePath(...)`, still generates a Supabase Storage signed URL with a 900 second expiry, and still returns:

```json
{ "signedUrl": "signed-url", "filename": "derived-filename" }
```

The `filename` derivation remains the existing path-leaf split behavior.

## Internal URL Opt-In

Internal URL generation is opt-in only:

```text
GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true
```

After the same current session and `canAccessStoragePath(...)` checks pass, the endpoint may return:

```json
{ "signedUrl": "/api/files/access?token=<opaque-token>", "filename": "derived-filename" }
```

The response shape remains `{ signedUrl, filename }`. Existing UI callers that do not pass `useInternal=true` continue to receive Supabase-backed signed URLs.

The generated token is raw logical-path based and uses:

- `version: 1`
- `purpose: preview`
- `logicalPath: {logicalPath}`
- `contentDisposition: inline`
- `issuedAt: current time in milliseconds`
- `expiresAt: issuedAt + 900 seconds`

The route reads the signing secret only through `getFileTokenSecret()` and builds the URL through `createInternalFileAccessUrl(...)`.

## Failure Behavior

If internal URL creation fails when `useInternal=true`, the endpoint returns:

```json
{ "error": "Gagal membuat URL preview" }
```

with status `500`.

It does not silently fall back to Supabase in the opt-in path. The default non-internal path remains unchanged and continues to use Supabase signed URL generation.

## Still Not Implemented

Local file streaming is still not implemented. `/api/files/access` may validate a token successfully and still return `501`.

This phase does not implement:

- download endpoint wiring;
- document-detail endpoint wiring;
- PPK or Bendahara endpoint wiring;
- Arsiparis/archive endpoint wiring;
- upload replacement;
- pending-to-formal local move behavior;
- delete/remove behavior;
- archive destruction local deletion;
- document/archive token authorization;
- `DIMUSNAHKAN` token-streaming checks;
- Supabase Storage file migration, copy, download, backfill, or sync.

Future phases must implement local streaming and token-use authorization before internal URLs are enabled for normal UI callers.
