# Phase 6E.9 Rename-Pending Local Move Route Implementation

Date: 2026-05-16.

## Scope

Phase 6E.9 switches only the internals of:

```text
POST /api/dokumen/rename-pending
```

from Supabase Storage `.move(...)` to local filesystem pending-to-formal movement through the Phase 6E.7 helper.

The endpoint path, HTTP method, request compatibility, success response shape, and route role in the workflow are preserved.

## Files Changed

- `src/routes/api/dokumen/rename-pending.ts`
- `tests/unit/storage/rename-pending-local-route.test.ts`
- `docs/migration/rename-pending-local-move-route-implementation.md`

Small status references were also updated in the migration planning docs.

## Implementation Notes

- The route now uses `getLocalServerSession(request)` as the session and owner authority.
- The body `userId` field remains accepted only for compatibility and must match the local session user id.
- The existing document ownership gate remains in place by reading the target document and requiring `dokumen.created_by` to match the local session user id.
- Body parsing now uses a route-local Zod schema while preserving the existing visible invalid-body response categories.
- Supported local pending paths are moved with `moveLocalPendingFileToFormal(...)`.
- Both `/api/upload` underscore pending paths and dash pending paths are supported when the source file exists locally.
- Already formal paths and safe unsupported paths remain skipped, matching the prior practical route contract of returning only moved pending mappings.
- Successful responses still return logical paths only:

```json
{
  "success": true,
  "renamed": [
    {
      "oldPath": "logical/source/path.pdf",
      "newPath": "logical/formal/path.pdf"
    }
  ]
}
```

## Error Behavior

Preserved compatibility:

- Missing local session returns `401 { "error": "Unauthorized" }`.
- Invalid JSON returns `400 { "error": "Invalid request body" }`.
- Missing `dokId` or invalid/missing `lampiranUrls` returns `400 { "error": "Missing dokId or lampiranUrls" }`.
- Body/session user mismatch returns `403 { "error": "Anda tidak memiliki akses" }`.
- Missing document returns `404 { "error": "Dokumen tidak ditemukan" }`.
- Document owner mismatch returns `403 { "error": "Anda tidak memiliki akses" }`.

Local storage failures return controlled JSON and do not expose physical paths or the storage root. Missing local files are reported as local storage failures and do not trigger Supabase fallback.

## Mixed Storage Policy

The route moves only local files that exist under the configured local storage root.

It does not fetch, copy, download, backfill, or sync Supabase Storage files. Existing Supabase-backed files and `AttachmentEditor` direct-browser Supabase uploads can still be missing locally during the mixed-storage transition.

## Explicitly Not Implemented

Phase 6E.9 does not implement:

- submit local move behavior;
- update route local move behavior;
- PPK resubmit local move behavior;
- `/api/upload` changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction local deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL enablement by default;
- route tree changes;
- database scripts or schema changes;
- Supabase Storage migration, copy, download, backfill, or sync;
- Supabase dependency removal.

## Validation

Focused tests run:

```powershell
pnpm test tests/unit/storage/rename-pending-local-route.test.ts tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- First sandboxed run failed before tests started because Vitest could not spawn the Vite/esbuild config worker (`spawn EPERM`).
- The same focused command was rerun with approved escalation.
- Escalated run passed.
- 3 test files passed.
- 48 tests passed.

The focused route test covers unauthorized access, invalid body handling, compatibility `userId` mismatch, document not found, document owner mismatch, underscore pending moves, dash pending moves, formal/unsupported skips, source owner mismatch, missing local source errors, no-overwrite target errors, partial failure behavior, and physical path/storage root non-exposure.
