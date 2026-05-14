# Phase 6D.2 Internal File Access Route Foundation

Date: 2026-05-14.

## Purpose

Phase 6D.2 adds the safe server-side foundation for a future internal file access route that will eventually serve local preview/download URLs.

This phase keeps existing Supabase-backed preview/download runtime behavior unchanged. No current preview/download endpoint, upload endpoint, mutation API, workflow/FSM behavior, database schema, or UI behavior was wired to the new foundation.

No existing Supabase Storage files or data were migrated, copied, downloaded, backfilled, or synced.

## Files Added

- `src/lib/storage/internal-file-access.ts`
- `tests/unit/storage/internal-file-access.test.ts`
- `docs/migration/internal-file-access-route-foundation.md`

## Files Changed

- `docs/migration/file-access-token-helper-foundation.md`
- `docs/migration/internal-preview-download-token-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/open-decisions.md`
- `docs/migration/phase-plan.md`

## Route Status

The preferred future route remains:

```text
GET /api/files/access?token=<opaque-token>
```

The route file was deferred in this phase. Existing TanStack API routes are registered through `src/routeTree.gen.ts`, and project rules forbid route generation and manual edits to that file. Adding `src/routes/api/files/access.ts` without routeTree generation would create a misleading inert route file.

The routeTree update and route file should be added in a later human-approved phase that explicitly permits route generation or an accepted route registration change.

## Service Foundation

The new server-only service:

- reads query parameter `token`;
- verifies tokens with `verifyFileAccessToken(token, secret)`;
- provides `getFileTokenSecret()` for lazy `DMS_FILE_TOKEN_SECRET` reads;
- accepts an already-resolved local session so route wiring can call `getLocalServerSession(request)` server-side;
- supports only `logicalPath` token access in this phase;
- validates logical paths with `assertSafeLogicalStoragePath()`;
- resolves paths with `resolvePhysicalStoragePath()` under the local storage root;
- never returns filesystem paths or roots in responses;
- does not import Supabase helpers;
- does not query document/archive tables;
- does not stream files yet.

`getFileTokenSecret()` has no development fallback. A missing secret throws a clear non-secret configuration error.

## Supported Token Behavior

Supported in Phase 6D.2:

- valid `logicalPath` tokens;
- owner access when the first logical path segment equals `session.userId`;
- raw-path compatibility role access for `PPK`, `BENDAHARA`, and `ARSIPARIS`;
- `preview` and `download` purposes as already validated by the token helper;
- validation-only response after checks pass.

Successful validation currently returns:

```text
501 Local file streaming is not implemented yet
```

This is intentional. The foundation proves token/session/path/authorization checks without serving files.

## Unsupported Token Behavior

Unsupported in Phase 6D.2:

- `documentId` plus `lampiranIndex` tokens;
- `archiveId` tokens;
- tokens requiring `statusCheck`;
- archive `DIMUSNAHKAN` rechecks;
- document/lampiran DB authorization;
- local file streaming;
- file existence checks;
- content type inference;
- `Content-Disposition` handling.

Document/archive token access returns 501 rather than approximating authorization. This avoids unsafe access while broad local document/archive reads are not ready.

## Session Revalidation

The future route must call `getLocalServerSession(request)` and pass the result into the service. Token verification alone is not authorization.

Current service behavior:

- missing token: 400;
- invalid or expired token: 401;
- valid token without local session: 401.

The service does not read `dms_session` in client code. Session revalidation remains server-only through the local auth helper when route wiring is added.

## Authorization Policy

Phase 6D.2 implements only conservative raw logical-path authorization:

- owner allowed if `logicalPath` first segment equals `session.userId`;
- `PPK`, `BENDAHARA`, and `ARSIPARIS` allowed for raw-path compatibility;
- non-owner `PEGAWAI` rejected with 403;
- document/archive authorization is not approximated.

This mirrors current raw-path preview/download compatibility without claiming role-specific document/archive parity.

## Logical And Physical Path Safety

The service validates logical paths with the Phase 6B helper, then resolves the physical filesystem path under the local storage root with the Phase 6B root-containment helper.

Responses never include:

- the token value;
- the signing secret;
- absolute filesystem paths;
- storage root values;
- DB URLs;
- env values;
- session tokens or hashes;
- password hashes;
- signed URLs.

The resolved server-side path is used only as a containment validation step in this phase.

## Streaming Status

Streaming is intentionally not implemented in Phase 6D.2.

Reasons:

- no current endpoint is wired to the foundation yet;
- local storage target is still empty by product decision;
- document/archive authorization is not ready;
- avoiding partial file-serving behavior is safer than serving raw logical-path files prematurely.

Future streaming must add file existence checks, safe content type inference, inline preview disposition, attachment download disposition, sanitized filenames, and destroyed-archive blocking where relevant.

## Response Categories

Current foundation responses:

- `400 { "error": "Token parameter required" }`
- `401 { "error": "Invalid or expired token" }`
- `401 { "error": "Unauthorized" }`
- `403 { "error": "Akses ditolak" }`
- `500 { "error": "File access path is not available" }`
- `501 { "error": "Token type is not supported by this access route foundation yet" }`
- `501 { "error": "Local file streaming is not implemented yet" }`

All responses use `Cache-Control: no-store`.

## Tests Run

Focused tests:

```powershell
pnpm test tests/unit/storage/file-access-token.test.ts
pnpm test tests/unit/storage/internal-file-access.test.ts
```

Initial sandboxed runs failed with `spawn EPERM` while Vitest/esbuild loaded config. The same focused tests were rerun with approved escalation so Vitest could spawn its worker process.

Result:

- `tests/unit/storage/file-access-token.test.ts`: passed, 13 tests.
- `tests/unit/storage/internal-file-access.test.ts`: passed, 10 tests.

## Intentionally Not Implemented

- route file `src/routes/api/files/access.ts`;
- routeTree generation;
- existing preview/download endpoint wiring;
- upload route replacement;
- pending-to-formal move behavior;
- delete/remove behavior;
- archive destruction file deletion;
- storage diagnostics/orphan cleanup;
- local file streaming;
- document/archive authorization approximation;
- DB schema changes;
- workflow/FSM/archive runtime behavior changes;
- mutation API migration;
- Supabase Storage file/data migration, copy, download, backfill, or sync.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6D.3 Route Registration And Preview/Download Wiring Plan
```

That phase should either approve routeTree generation for `GET /api/files/access` or choose a different supported route registration strategy, then wire existing preview/download endpoints only after route availability and response compatibility are verified.
