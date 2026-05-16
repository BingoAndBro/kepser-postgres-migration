# Phase 6E.7 Local Pending-To-Formal Move Helper Foundation

Date: 2026-05-16.

## Scope

Phase 6E.7 adds an isolated server-only helper foundation for future local filesystem pending-to-formal moves.

This phase does not wire submit, `rename-pending`, update, resubmit, upload, UI callers, preview/download, delete/remove, archive destruction, diagnostics, route generation, database scripts, or Supabase Storage migration.

## Files Added

- `src/lib/storage/local-pending-move.ts`
- `tests/unit/storage/local-pending-move.test.ts`

## Helper Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

It provides isolated primitives for:

- classifying local move source paths as `pending-upload-api`, `pending-dash`, `formal`, or `unsupported`;
- validating source logical paths through the existing local path safety helper;
- validating owner segments and requiring the first logical path segment to match the expected owner;
- generating UUID-based formal target logical paths in `{ownerId}/{dokumenId}/{uuid}.{ext}` format;
- preserving `temp-id` as a safe document segment for later submit compatibility planning;
- leaving already formal paths unchanged;
- resolving physical paths internally under the local storage root before file operations;
- moving local files with no-overwrite semantics;
- returning logical metadata only.

## Move Semantics

The move primitive handles both active pending variants:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
{userId}/{timestamp}-{random}-{filename.ext}
```

Formal targets keep the current UUID-based shape:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

Already formal paths return an `unchanged` result and do not touch the filesystem.

The helper does not implement transactional database/file orchestration. Future route phases must decide rollback and partial-failure policy at the route boundary before persisting metadata.

## Filesystem Safety

The helper validates logical paths before resolving physical paths. Physical source and target paths are resolved only inside the helper through the local storage path foundation.

No helper result returns physical filesystem paths or the storage root.

The move implementation uses no-overwrite target creation semantics. It creates target directories only after the target path has been resolved under the storage root. If a copy/unlink path is needed, partial target cleanup is attempted before returning a generic helper error.

## Mixed Storage Policy

Missing local source files return a controlled `missing-source` helper error. The helper does not fetch, copy, download, backfill, or sync files from Supabase.

This is intentional because the local filesystem target starts clean and only newly uploaded local files should exist there.

## Explicitly Not Implemented

Phase 6E.7 does not implement:

- route wiring;
- submit behavior changes;
- `rename-pending` behavior changes;
- update/resubmit behavior changes;
- upload behavior changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction local deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL default enablement;
- database schema or script changes;
- route tree changes;
- Supabase Storage migration, copy, download, backfill, or sync.

## Tests

Focused test added:

```powershell
pnpm test tests/unit/storage/local-pending-move.test.ts
```

This test covers path classification, owner validation, target generation, `temp-id` target generation, formal no-op behavior, underscore pending moves, dash pending moves, missing local source errors, target-exists/no-overwrite behavior, and physical path non-exposure.

Focused validation run:

```powershell
pnpm test tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result after the no-overwrite race-safety fix: passed, 2 test files and 37 tests.

The first sandboxed run failed before tests started because Vitest could not spawn its config bundling worker (`spawn EPERM`). The same focused command passed when rerun with approved escalation.

## Phase 6E.8 Follow-Up Note

Phase 6E.8 added `docs/migration/rename-pending-local-move-route-planning.md` as a planning-only contract for using this helper in a later `POST /api/dokumen/rename-pending` route implementation.

The plan recommends using `classifyLocalPendingMovePath(...)` and `moveLocalPendingFileToFormal(...)` only after local session, body compatibility, document ownership, and source owner checks pass. It keeps route wiring out of scope for Phase 6E.8 and recommends Phase 6E.9 for the narrow implementation.

## Phase 6E.9 Follow-Up Note

Phase 6E.9 wired this helper into `POST /api/dokumen/rename-pending` only. Other move surfaces remain unwired and must not be treated as complete until submit, update, and PPK resubmit have their own focused phases.

## Phase 6E.11 Follow-Up Note

Phase 6E.11 documented the submit route compatibility plan for using this helper later. The plan keeps submit unwired, treats `temp-id` as a compatibility risk, and recommends preflight/bridge work before using `moveLocalPendingFileToFormal(...)` in `POST /api/dokumen/submit`.

## Phase 6E.12 Follow-Up Note

Phase 6E.12 documented the submit local move preflight/bridge decision in `docs/migration/submit-local-move-preflight-bridge-planning.md`. The helper remains suitable for local pending moves and `temp-id` target planning, but submit route wiring remains blocked until local session identity and document/master/status/audit write compatibility are proven.
