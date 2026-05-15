# Phase 6D.3 File Access Route Registration Foundation

Date: 2026-05-15.

## Purpose

Phase 6D.3 registers the internal file access route:

```text
GET /api/files/access?token=<opaque-token>
```

The route is reachable through TanStack Router and delegates to the Phase 6D.2 server-only access service. It does not replace existing preview/download endpoints and does not stream local files yet.

## Files Added

- `src/routes/api/files/access.ts`
- `docs/migration/file-access-route-registration-foundation.md`

## Files Changed

- `src/routeTree.gen.ts`
- `docs/migration/internal-file-access-route-foundation.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/phase-plan.md`
- `docs/migration/open-decisions.md`

## Route Wiring

The route wrapper calls:

- `getLocalServerSession(request)`
- `getFileTokenSecret()`
- `handleInternalFileAccessRequest({ request, session, secret })`

The route does not parse the token itself. Token parsing, token validation, session-aware authorization, logical path validation, and root-containment checks remain centralized in `src/lib/storage/internal-file-access.ts`.

If the route wrapper catches an unexpected configuration or service error, it returns:

```json
{ "error": "File access is not available" }
```

with status `500` and `Cache-Control: no-store`.

## Route Tree Registration

The route was registered by running the normal project build path:

```powershell
pnpm build
```

The first sandboxed run failed with `spawn EPERM` while Vite/esbuild loaded config. The same command was rerun with approved escalation and completed successfully.

The `src/routeTree.gen.ts` diff was reviewed and was limited to adding `/api/files/access`.

## Intentionally Not Implemented

- existing `/api/dokumen/preview-url` internal URL wiring
- existing `/api/dokumen/download-url` internal URL wiring
- role preview/download endpoint internal URL wiring
- upload replacement
- pending-to-formal move behavior
- delete/remove behavior
- archive destruction file deletion
- storage diagnostics/orphan cleanup
- local file streaming
- document/archive token authorization
- `DIMUSNAHKAN` handling for token streaming
- workflow/FSM/archive runtime changes
- DB schema changes
- Supabase Storage file migration, copy, download, backfill, or sync

Existing preview/download/upload endpoints remain Supabase-backed after this phase.
