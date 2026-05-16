# Phase 6F.11 Submit Runtime Orchestrator Boundary Helper Foundation

Date: 2026-05-16.

## Purpose And Scope

This phase adds a submit-specific runtime orchestration boundary helper outside the route.

The helper models the ordering and outcome classification needed before a later controlled migration of:

```text
POST /api/dokumen/submit
```

`POST /api/dokumen/submit` remains unchanged, legacy Supabase-backed, and unwired to this helper.

This phase does not implement runtime route wiring, route disk preflight, filesystem movement, live PostgreSQL writes, runtime DB/file compensation, rollback against real files, Supabase fallback, route generation, DB scripts, migrations, seeds, or Supabase Storage migration/copy/download/backfill/sync.

## Files Added

- `src/lib/dokumen/submit-runtime-orchestrator.ts`
- `tests/unit/dokumen/submit-runtime-orchestrator.test.ts`
- `docs/migration/submit-runtime-orchestrator-boundary-helper-foundation.md`

## Helper Design Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

It is route-independent and submit-specific. It accepts already-resolved boundary snapshots instead of instantiating runtime services:

- validated payload boundary;
- actor/session compatibility boundary;
- master-data and permission boundary;
- submit move plan result;
- submit file preflight result;
- local write transaction result state;
- optional file movement result state;
- compensation policy state;
- explicit injected dependency readiness flags.

The helper does not call live auth, live database, live Drizzle adapter factories, filesystem APIs, storage root helpers, route modules, UI modules, environment helpers, or Supabase clients.

## Orchestrator Stage Model

Implemented stages:

- `parse-and-validate`
- `auth-and-role`
- `master-and-permission`
- `move-plan`
- `preflight`
- `db-transaction`
- `file-movement`
- `compensation-policy`
- `success`
- `blocked`

The exported functions are:

- `createSubmitRuntimeOrchestrationPlan(input)`
- `classifySubmitRuntimeOrchestrationOutcome(input)`
- `validateSubmitRuntimeOrchestrationReadiness(input)`

The stage plan is explicit and ordered. It is not a generic workflow engine, plugin system, reducer system, service locator, feature flag system, or dependency injection container.

## Dependency Injection Boundary

The helper represents future runtime dependencies as injected capabilities or resolved stage results:

- actor resolver output or actor object;
- request validation output;
- master/permission validation output;
- move plan builder output;
- preflight output;
- write transaction result;
- optional file movement result;
- compensation policy decision/readiness.

Missing required dependency flags block before the stage that would consume the dependency. The helper does not instantiate or import the live implementation for any dependency.

## Outcome Categories And Semantics

Implemented outcome categories:

- `blocked-before-auth`
- `blocked-before-db`
- `blocked-before-files`
- `ready-for-db`
- `ready-for-files`
- `compensation-required`
- `safe-success`
- `unsafe-to-return-success`
- `blocked-by-missing-dependency`

No partial-success category exists.

Semantics:

- missing payload validation blocks before auth, DB, and files;
- missing actor/session blocks before auth, DB, and files;
- ADMIN-only or non-submit-compatible actors block before DB and files;
- missing master/permission result blocks before DB and files;
- move-plan issues block before DB and files;
- preflight failure blocks before DB and files;
- missing preflight for move-required plans blocks before DB and files;
- DB transaction failure blocks before files;
- DB success plus move-required file movement not started is only `ready-for-files`, not route success;
- DB success plus file movement success is `safe-success`;
- DB success plus file movement failure is `compensation-required` and `unsafe-to-return-success`;
- move-required plans cannot become `safe-success` when file movement is intentionally not injected;
- formal/no-move-required-only plans may reach `safe-success` after DB success without file movement.

## DB/File Ordering Summary

The helper preserves the conservative ordering from Phase 6F.9:

1. validate payload;
2. validate actor/session and submit role compatibility;
3. validate master data, required lampiran, and permissions;
4. build the submit move plan, with `temp-id` still the default planning target;
5. run file preflight before any DB write and before any file movement;
6. run the local write transaction only after preflight succeeds;
7. block file movement when the DB transaction fails;
8. return success only after DB success plus file movement success for move-required plans;
9. classify post-DB file movement failures as unsafe and compensation-required.

Formal/no-move-required-only plans still require DB success, but they do not require file movement success because there is no move stage to execute.

## Storage And Missing-File Boundary

The helper consumes preflight results only. It does not check disk, resolve physical paths, create a filesystem-backed checker, move files, copy files, delete files, or read storage roots.

Missing local files remain controlled preflight failures before DB and files. No Supabase fallback is represented in the outcome model.

Historical Supabase Storage files are not assumed to exist locally.

## Auth And Role Boundary

The actor boundary is explicit and injected.

Submit compatibility must be resolved before the helper can proceed past `auth-and-role`. ADMIN-only and non-submit-compatible actors block before DB and files. Client-side active-role state remains insufficient for submit authorization.

## No Runtime DB/Write/File Movement

This phase does not execute database calls, live Drizzle adapter calls, file checks, file moves, route disk preflight, or runtime compensation.

The helper output is a classification model only. It does not make route responses and does not change endpoint behavior.

## Tests Implemented

Focused tests cover:

- missing actor/session blocks before DB and files;
- ADMIN-only and non-submit-compatible actors block before DB and files;
- move plan issues block before DB and files;
- preflight failure blocks before DB and files;
- missing preflight dependency for move-required plans blocks before DB and files;
- DB transaction failure blocks before files;
- DB success with file movement not started is not route success;
- DB success plus file movement success is `safe-success`;
- DB success plus file movement failure is compensation-required or unsafe, not success;
- formal/no-move-required-only plans can reach `safe-success` after DB success without file movement;
- no external storage fallback outcome exists;
- serialized outputs avoid physical paths, storage roots, env names, tokens, signed URLs, and file contents;
- helper does not mutate input;
- implementation strings avoid route, Supabase, DB client, Drizzle, filesystem, storage-root, and env integration markers;
- stage planning remains explicit and non-executing.

## Remaining Blockers Before Submit Route Wiring

- `POST /api/dokumen/submit` is still not wired to local `dms_session`.
- Submit route response mapping from orchestrator categories to HTTP status/body is not implemented.
- Runtime route disk preflight checker is not wired.
- Runtime filesystem movement is not implemented.
- Runtime DB/file compensation and rollback are not implemented.
- Missing local file route status/message remains unresolved.
- Target-already-exists route status/message remains unresolved.
- Unsupported safe logical path route policy remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains the default submit planning target.
- Historical Supabase Storage files are not locally available.
- `AttachmentEditor` can still produce Supabase-backed dash pending files.
- Supabase cannot be removed.

## Validation Results

Focused validation for this phase:

```powershell
git status --short --branch
pnpm test tests/unit/dokumen/submit-runtime-orchestrator.test.ts
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/dokumen/submit-db-file-compensation.test.ts
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\storage\submit-move-plan.ts
git diff -- src\lib\storage\local-pending-move.ts
git diff -- src\lib\dokumen\submit-file-preflight.ts
git diff -- src\lib\dokumen\submit-db-file-compensation.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
git diff -- src\lib\dokumen\local-submit-write-bridge.ts
git diff -- src\lib\dokumen\local-submit-repository.ts
git diff -- tests\unit\dokumen\submit-route-parity.test.ts
git diff -- tests\unit\dokumen\submit-file-preflight.test.ts
git diff -- tests\unit\dokumen\submit-db-file-compensation.test.ts
Select-String -Path src\lib\dokumen\submit-runtime-orchestrator.ts -Pattern "supabase|createClient|storage\.from|node:fs|fs\.|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|DMS_LOCAL_STORAGE_ROOT|routeTree|src/routes|components/|db\.|drizzle|getLocalStorageRoot|resolvePhysicalStoragePath" -CaseSensitive:$false
Select-String -Path tests\unit\dokumen\submit-runtime-orchestrator.test.ts -Pattern "supabase|createClient|storage\.from|node:fs|fs\.|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|DMS_LOCAL_STORAGE_ROOT|routeTree|src/routes|components/|db\.|drizzle|getLocalStorageRoot|resolvePhysicalStoragePath" -CaseSensitive:$false
```

Result summary:

- Initial `git status --short --branch` was clean on `migration/postgres-local`.
- The first sandboxed `pnpm test tests/unit/dokumen/submit-runtime-orchestrator.test.ts` run failed before tests started because Vitest/esbuild hit `spawn EPERM`.
- The focused orchestrator test was rerun with approved escalation. The first escalated run exposed one test assertion mismatch in the new test, then the corrected rerun passed.
- `pnpm test tests/unit/dokumen/submit-runtime-orchestrator.test.ts` passed: 1 test file, 16 tests.
- `pnpm test tests/unit/dokumen/submit-file-preflight.test.ts` passed: 1 test file, 11 tests.
- `pnpm test tests/unit/dokumen/submit-db-file-compensation.test.ts` passed: 1 test file, 11 tests.
- `pnpm test tests/unit/dokumen/submit-route-parity.test.ts` passed: 1 test file, 16 tests.
- `git diff --check` exited successfully and reported only existing line-ending normalization warnings for edited migration docs.
- `git diff --name-only` listed only tracked migration doc edits; new untracked files are visible in final git status.
- Guarded diffs for protected route/storage/write/test files returned no output.
- The required `Select-String` audits on the new helper and new test returned no matches.

## Explicit Confirmations

This phase does not claim submit has migrated.

This phase does not claim route preflight is wired.

This phase does not claim filesystem movement is implemented.

This phase does not claim runtime DB/file compensation is implemented.

This phase does not claim rollback is implemented against real files.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.

## Phase 6F.12 Follow-Up Note

Phase 6F.12 added the isolated submit disk preflight checker foundation described in `docs/migration/submit-disk-preflight-checker-foundation.md`.

The checker can later satisfy the source and target existence checker boundary consumed by `preflightSubmitFiles(...)`, but it remains unwired from `POST /api/dokumen/submit`. It validates logical paths, resolves physical paths internally through existing local storage path helpers, and performs only read-only `stat(...)` checks. Route disk preflight wiring, filesystem movement, runtime DB/file compensation, rollback against real files, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain future work.
