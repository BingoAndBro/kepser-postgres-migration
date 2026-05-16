# Phase 6E.13 Submit Move Plan Builder Helper Foundation

Date: 2026-05-16.

## Scope

Phase 6E.13 adds an isolated server-only helper foundation for planning submit attachment moves.

This phase does not wire `POST /api/dokumen/submit`, does not change route behavior, does not move files, does not inspect filesystem state, and does not call Supabase Storage.

## Files Added

- `src/lib/storage/submit-move-plan.ts`
- `tests/unit/storage/submit-move-plan.test.ts`

## Helper Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

It builds a logical submit move plan from explicit inputs:

- server-authoritative owner user id;
- target document segment, defaulting to `temp-id`;
- ordered attachment metadata;
- optional target UUID factory for deterministic tests.

The returned plan contains:

- ordered entries for every attachment;
- planned `{ oldPath, newPath }` move mappings;
- planned attachment metadata with only `url` changed for planned moves;
- blocking issue codes for unsafe, unsupported, owner-mismatched, or invalid inputs;
- logical paths only.

## Planning Semantics

Supported planned move sources:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
{userId}/{timestamp}-{random}-{filename.ext}
```

Supported unchanged source:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

Default submit target:

```text
{userId}/temp-id/{uuid}.{ext}
```

The helper can also plan a real document-id target when a later route/write phase proves that ordering safe. Choosing real document ids remains a future route/workflow decision.

## Guardrails

- No route imports this helper in this phase.
- No runtime route file changed.
- No filesystem module is imported by the helper.
- No storage root is read or resolved.
- No file existence checks are performed.
- No file is moved, copied, renamed, deleted, downloaded, backfilled, or synced.
- No Supabase client or Supabase Storage helper is imported.
- Safe but unclear path semantics are classified as unsupported blocking outcomes.
- Physical filesystem paths and storage roots are not returned.

## Mixed Storage Policy

The helper only plans logical paths. It does not prove that any planned source exists locally.

Future submit route wiring must still perform full request, auth, role, master-data, attachment, local source, and target preflight before moving files. Missing local sources must not trigger Supabase fallback.

## Explicitly Not Implemented

Phase 6E.13 does not implement:

- submit route wiring;
- submit local move behavior;
- submit auth migration;
- local document write bridge;
- filesystem movement;
- local file existence checks;
- update route local move behavior;
- PPK resubmit local move behavior;
- upload behavior changes;
- `rename-pending` behavior changes;
- UI behavior changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download behavior changes;
- internal URL enablement by default;
- Supabase Storage migration, copy, download, backfill, or sync;
- route tree changes;
- database scripts or schema changes;
- dependency changes.

## Tests

Focused test:

```powershell
pnpm test tests/unit/storage/submit-move-plan.test.ts
```

Result:

- First sandboxed run failed before tests started because Vitest could not spawn the config/esbuild worker (`spawn EPERM`).
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- 1 test file passed.
- 6 tests passed.

Combined focused regression:

```powershell
pnpm test tests/unit/storage/submit-move-plan.test.ts tests/unit/storage/local-storage-paths.test.ts tests/unit/storage/local-pending-move.test.ts
```

Result:

- Escalated rerun passed.
- 3 test files passed.
- 43 tests passed.

Coverage:

- underscore pending path planning;
- dash pending path planning;
- default `temp-id` target planning;
- optional real document-id target planning;
- already formal unchanged planning;
- safe unsupported path blocking;
- unsafe path, owner mismatch, missing URL, invalid extension, invalid owner, invalid document, and invalid UUID outcomes;
- logical-only result assertions.

## Recommended Next Phase

Do not wire this helper into `POST /api/dokumen/submit` yet.

Recommended next work remains a local submit document/write compatibility bridge or a route-specific implementation plan that proves local `dms_session` ids, master-data reads, document creation, status update, and append-only audit writes are in the same local data domain before any local file movement is enabled.
