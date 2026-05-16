# Phase 6F.9 Submit DB/File Compensation Policy Foundation

Date: 2026-05-16.

## Purpose And Scope

Phase 6F.9 adds a route-independent submit DB/file compensation policy decision model.

The helper models what a later `POST /api/dokumen/submit` runtime orchestration must do around request/auth/master/role checks, submit move planning, file preflight, local DB transaction, and file movement failures.

This phase is policy/helper foundation only. It does not implement runtime rollback or compensation.

## Files Added

- `src/lib/dokumen/submit-db-file-compensation.ts`
- `tests/unit/dokumen/submit-db-file-compensation.test.ts`
- `docs/migration/submit-db-file-compensation-policy-foundation.md`

## Submit Route Status

`POST /api/dokumen/submit` remains unchanged and unwired.

It is still not wired to:

- local `dms_session` submit auth;
- the local submit write bridge;
- the local submit repository;
- the local submit Drizzle adapter;
- the submit move planner;
- the submit file preflight helper;
- local route disk checks;
- local filesystem movement;
- runtime DB/file compensation.

## Policy Summary

The accepted policy direction is conservative:

- request, auth, master-data, role, required-lampiran, and Ketua Tim checks must happen before file preflight in a future route phase;
- build the submit move plan before file preflight;
- preserve `temp-id` as the default submit planning target;
- run submit file preflight before DB writes and before file movement;
- if preflight fails, do not write DB and do not move files;
- if the DB transaction fails, do not move files;
- if the DB transaction succeeds, file movement must succeed fully before route success is safe;
- file movement failure after DB success is not a partial success;
- partial file movement failure requires explicit compensation/recovery classification;
- compensation failure remains unsafe and must not be reported as rollback success;
- no external storage fallback is allowed;
- physical paths, storage roots, env values, tokens, signed URLs, and file contents must not be exposed;
- `log_aktivitas` remains append-only.

## Recommended Ordering

Recommended future route ordering remains:

1. Parse and validate request payload.
2. Validate local session, role compatibility, master data, required lampiran, and Ketua Tim assignment.
3. Build the submit move plan with `temp-id` as the default target.
4. Run submit file preflight with injected source and target checks.
5. Abort before DB and files if preflight fails.
6. Run one local DB transaction for document create, status update, and append-only audit insert.
7. Abort before files if the DB transaction fails.
8. Run file movement only after DB transaction success if a later runtime phase explicitly approves that ordering.
9. Return success only if file movement succeeds fully.
10. If file movement fails after DB success, return a controlled failure path after explicit compensation/recovery behavior is approved.

## Policy Outcome Matrix

| Input state | Outcome category |
|---|---|
| Preflight failed | `abort-before-db`, `abort-before-files` |
| Preflight succeeded, DB not started | `abort-before-files` until DB transaction runs |
| DB transaction failed | `abort-before-files` |
| DB transaction succeeded, files not moved yet | `proceed-to-files`, not route success |
| DB transaction succeeded, file movement succeeded | `safe-success` |
| DB transaction succeeded, file movement failed | `require-compensation`, `unsafe-to-return-success` |
| DB transaction succeeded, partial file movement failure | `require-compensation`, `unsafe-to-return-success` |
| Compensation failed after file movement failure | `unsafe-to-return-success` remains true |

## DB Failure Behavior

DB transaction failure after successful preflight must block file movement.

The helper classifies this as `abort-before-files`. It does not attempt DB retry, route response selection, rollback, or any real database operation.

## File Move Failure After DB Success

File movement failure after DB transaction success is never classified as safe success.

The helper classifies this as `require-compensation` plus `unsafe-to-return-success`. A later runtime phase must define the actual recovery behavior before submit route wiring can move files.

## Partial Move Failure Behavior

Partial file movement failure is treated as at least as unsafe as full movement failure.

The helper marks the file movement guard as `partial-failure`, requires compensation classification, and blocks route success.

## Compensation And Recovery Requirement

This phase does not implement compensation.

It only classifies when compensation would be required. Later runtime wiring remains blocked until an approved submit-specific strategy defines what happens to DB rows, metadata visibility, audit logs, and moved or unmoved logical files after post-DB file movement failure.

No background job, retry queue, recovery worker, or orphan cleanup framework is introduced in this phase.

## Explicitly Not Implemented

This phase does not implement:

- submit route wiring;
- filesystem movement;
- DB writes;
- runtime DB/file compensation;
- real rollback against files;
- route disk preflight wiring;
- a filesystem-backed default checker;
- Supabase fallback;
- Supabase calls;
- DB scripts, migrations, or seeds;
- route generation;
- Supabase Storage migration, copy, download, backfill, or sync.

## Remaining Blockers Before Submit Route Wiring

- Runtime submit route is not wired to local `dms_session`.
- Runtime submit route is not wired to the local submit write bridge, repository, or Drizzle adapter.
- Runtime submit route is not wired to the submit move planner or file preflight helper.
- Runtime route disk preflight is not wired.
- Runtime filesystem movement is not implemented.
- A concrete post-DB file-move compensation/recovery strategy is still unapproved.
- Missing local file route status/message remains unresolved.
- Unsupported safe logical path route policy remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains the default submit planning target.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused validation for this phase:

```powershell
git status --short --branch
pnpm test tests/unit/dokumen/submit-db-file-compensation.test.ts
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\storage\submit-move-plan.ts
git diff -- src\lib\storage\local-pending-move.ts
git diff -- src\lib\dokumen\submit-file-preflight.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
git diff -- src\lib\dokumen\local-submit-write-bridge.ts
git diff -- src\lib\dokumen\local-submit-repository.ts
git diff -- tests\unit\dokumen\submit-route-parity.test.ts
git diff -- tests\unit\dokumen\submit-file-preflight.test.ts
Select-String -Path src\lib\dokumen\submit-db-file-compensation.ts -Pattern "supabase|createClient|storage\.from|node:fs|fs\.|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|DMS_LOCAL_STORAGE_ROOT|routeTree|src/routes|components/|db\.|drizzle|getLocalStorageRoot|resolvePhysicalStoragePath" -CaseSensitive:$false
Select-String -Path tests\unit\dokumen\submit-db-file-compensation.test.ts -Pattern "supabase|createClient|storage\.from|node:fs|fs\.|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|DMS_LOCAL_STORAGE_ROOT|routeTree|src/routes|components/|db\.|drizzle|getLocalStorageRoot|resolvePhysicalStoragePath" -CaseSensitive:$false
```

Result summary is recorded in the implementation final response.

## Confirmation

This phase does not claim submit has migrated.

This phase does not claim route preflight is wired.

This phase does not claim filesystem movement is implemented.

This phase does not claim DB/file compensation is implemented at runtime.

This phase does not claim rollback is implemented against real files.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.
