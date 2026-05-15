# Phase 6D.8 Raw Preview Internal URL Runtime Verification

Date: 2026-05-15.

## Scope

Phase 6D.8 verifies the already-wired opt-in raw logical-path preview flow end to end:

```text
GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true
```

This phase adds focused tests and documentation only. It does not enable internal URLs for normal UI callers by default and does not broaden storage replacement to downloads, document-detail routes, role routes, archive routes, upload, pending-to-formal moves, delete behavior, archive destruction, or cleanup.

## Verified Opt-In Flow

The verified runtime path is:

1. The raw preview endpoint receives `url={logicalPath}&useInternal=true`.
2. The endpoint performs the existing session check and raw storage-path authorization before creating any internal URL.
3. The endpoint returns the compatible response shape:

```json
{ "signedUrl": "/api/files/access?token=<opaque-token>", "filename": "derived-filename" }
```

4. The token is extracted by the client/browser as part of the returned internal URL.
5. `GET /api/files/access?token=<opaque-token>` can return local file content through `handleInternalFileAccessRequest(...)` when a local session is supplied and a matching local file exists.

The final local file response is verified only after token validation, local session presence, supported raw logical-path token checks, logical path safety validation, root-containment resolution, owner/role compatibility authorization, and local file existence all pass.

Successful file responses keep safe headers:

- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- inferred `Content-Type`
- inline `Content-Disposition` for preview tokens

## Default Behavior Remains Supabase-Backed

The default raw preview request remains unchanged:

```text
GET /api/dokumen/preview-url?url={logicalPath}
```

Without `useInternal=true`, the endpoint still calls Supabase Storage signed URL generation and returns the existing compatible shape:

```json
{ "signedUrl": "supabase-signed-url", "filename": "derived-filename" }
```

Normal UI callers were not changed in this phase.

## Negative Runtime Verification

Focused tests verify:

- a generated internal URL is rejected by `/api/files/access` when no local session is supplied;
- a generated internal URL returns a generic `404` when the matching local file is absent;
- `useInternal=true` does not generate a token before the raw preview endpoint session check passes;
- `useInternal=true` does not generate a token before the raw preview endpoint path authorization check passes.

Error responses do not include token values, physical filesystem paths, storage roots, environment values, database URLs, Supabase signed URLs, or secrets.

## Local Storage Availability

Local storage starts empty. This verification proves the runtime path for files that already exist locally at matching logical paths. It does not imply existing Supabase Storage files are available locally.

No Supabase Storage migration, copy, download, backfill, or sync was performed.

## Not Changed

This phase does not change:

- default raw preview behavior;
- normal UI callers;
- raw download behavior;
- document preview/download routes;
- PPK or Bendahara preview/download routes;
- Arsiparis/archive routes;
- upload behavior;
- pending-to-formal local move behavior;
- delete/remove behavior;
- archive destruction deletion;
- token format;
- route tree registration.

Document/archive token authorization remains future work. `DIMUSNAHKAN` checks for document/archive token streaming remain future work.

## Tests

Added:

```text
tests/unit/storage/raw-preview-internal-url-runtime.test.ts
```

The test covers the opt-in endpoint response shape, internal URL prefix, in-memory token extraction, final local file response through the internal access service, Supabase-backed default behavior, missing-session rejection, missing-file rejection, and pre-token authorization blocking.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6D.9 Controlled Raw Preview Enablement Strategy
```

That phase should stay conservative. It should define when and how raw preview internal URLs may be used by selected callers, including local-file availability expectations, fallback policy, manual verification steps, and rollback criteria. It should not jump directly into broad document/archive token work, upload replacement, or archive destruction behavior.
