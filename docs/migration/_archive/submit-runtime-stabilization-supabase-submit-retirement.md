# Phase 6G.6 Submit Runtime Stabilization And Supabase Submit Path Retirement

Date: 2026-05-16.

## Purpose And Scope

This phase stabilizes the runtime path for:

```text
POST /api/dokumen/submit
```

The route is now locally backed for the clean local PostgreSQL plus local filesystem target. This is submit-route-only. It does not remove Supabase globally, does not migrate other write endpoints, and does not make old Supabase Storage files locally available.

## Default Submit Path

Default `POST /api/dokumen/submit` now uses the local submit runtime without requiring `useLocalDbSubmit=true`.

The default path preserves:

- endpoint path;
- request body shape;
- existing Zod payload validation;
- material `nominal_realisasi` validation;
- `201 { success: true, dokumen }` success shape;
- material `IN_PPK_VALIDATION` behavior;
- non-material `TERSIMPAN` behavior;
- append-only audit insert through the local submit transaction path.

## Legacy Supabase Submit Path

The legacy Supabase submit execution branch was removed from `src/routes/api/dokumen/submit.ts`.

The route no longer imports or calls the submit-specific legacy helpers in this endpoint:

- `createServerSupabaseClient(...)`;
- `getServerSession(...)`;
- `createAdminClient(...)`;
- `createDokumen(...)`;
- `updateDokumenStatus(...)`;
- `insertLog(...)`;
- Supabase Storage `.move(...)`.

No diagnostic legacy branch was kept. There is no Supabase fallback from local submit failure.

## Temporary Query Params

Retained temporarily:

- `useLocalAuthDryRun=true`;
- `useLocalPreflightDryRun=true`.

These are diagnostics only. They return dry-run responses and do not write DB rows or move files.

`useLocalDbSubmit=true` is now redundant. It remains accepted as a harmless alias because all non-dry-run submit requests execute the local path.

## Runtime Ordering

The default local ordering is:

1. Parse JSON.
2. Validate the existing submit Zod schema.
3. Validate material `nominal_realisasi`.
4. Resolve local session with `getLocalServerSession(request)`.
5. Require PEGAWAI compatibility through `createLocalSubmitActorFromSession(...)`.
6. Build the submit move plan with `buildSubmitMovePlan(...)`, preserving the default `temp-id` target segment.
7. Run read-only local disk preflight through `preflightSubmitFiles(...)` and `createSubmitDiskPreflightChecker()`.
8. Abort before DB writes and file movement when preflight fails.
9. Run the local submit DB transaction through the bridge, repository, and Drizzle adapter stack.
10. Abort before file movement when the DB transaction fails.
11. Move preflight-approved local pending files through `moveLocalPendingFileToFormal(...)`.
12. Return `201 { success: true, dokumen }` only after DB success and full required file movement success.

## Failure Behavior

Default local failures remain controlled:

- missing local session returns `401 { error: 'Unauthorized' }`;
- ADMIN-only and non-PEGAWAI local actors return `403 { error: 'Akses ditolak' }`;
- preflight missing source, target conflict, unsupported path, or unsafe path returns non-success before DB write and before movement;
- local DB transaction failure returns `500 { error: 'Gagal mengajukan dokumen' }` before movement;
- movement failure after DB success returns non-success with `code: "local-file-movement-failed"` and `compensationRequired: true`;
- sensitive physical paths, storage roots, raw filesystem errors, tokens, hashes, DB URLs, env values, signed URLs, generated internal signed URLs, and file contents are not exposed.

## Partial Movement Behavior

Multi-file movement remains sequential.

If one or more files move and a later file fails:

- the route returns non-success, not `201`;
- `partialMovement` is `true`;
- `movedCount` records how many movement operations completed;
- `compensationRequired` is `true`.

This phase does not implement broad rollback, retry queues, cleanup workers, or recovery markers.

## Compensation And Recovery Limits

The route classifies post-DB file movement failure as compensation-required, but it does not claim DB rollback or file rollback. Operational recovery for partial DB/file success remains outside this phase.

## Outside This Phase

Still outside this submit phase:

- global Supabase removal;
- Supabase Auth Admin/user-management retirement;
- read API migration by domain;
- other workflow write endpoint migration;
- update/resubmit pending-to-formal movement;
- preview/download default migration;
- archive destruction local delete behavior;
- diagnostics/orphan cleanup migration;
- old Supabase Storage migration, copy, download, backfill, or sync;
- route generation.

## Validation Commands For Human

Codex did not run heavy tests in this phase. The human should run:

```powershell
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
pnpm test tests/unit/storage/local-pending-move.test.ts
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/dokumen/submit-disk-preflight-checker.test.ts
pnpm test tests/unit/dokumen/local-submit-write-bridge.test.ts
pnpm test tests/unit/dokumen/local-submit-repository.test.ts
pnpm test tests/unit/dokumen/local-submit-drizzle-adapter.test.ts
```

## Tests Not Run By Codex

Tests not run by Codex.

Only lightweight diff and grep/audit checks were run.

## Remaining Migration Phases

After this phase, the remaining planned work is still:

- Phase 7 read API migration by domain;
- Phase 8 write workflow API migration by domain;
- Phase 9 storage surface completion;
- Phase 10 admin/user management and Supabase runtime retirement;
- Phase 11 stabilization, regression, cleanup, and release readiness.

## Non-Claims

This phase does not claim:

- global Supabase runtime is removed;
- all storage surfaces are local;
- real DB/file rollback is implemented;
- old Supabase files are locally available;
- update/resubmit movement is complete;
- preview/download migration is complete.
