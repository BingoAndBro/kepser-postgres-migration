# Phase 6G.1 Controlled Submit Route Runtime Integration Plan

Date: 2026-05-16.

## Purpose

Phase 6G starts controlled runtime integration for `POST /api/dokumen/submit`.

Foundation-only work should stop unless a real route integration blocker appears. The local target uses clean seed data and newly uploaded local files only, so preserving old Supabase Storage files is not a blocker.

## Current Submit Route Reality

`src/routes/api/dokumen/submit.ts` is still legacy Supabase-backed. It currently:

- parses and validates the create-and-submit payload;
- validates material `nominal_realisasi`;
- resolves auth through Supabase session helpers;
- reads required lampiran, kegiatan, Ketua Tim assignment, and leaf names through Supabase-backed helpers/queries;
- moves dash-style pending files through Supabase Storage `.move(...)` into `{userId}/temp-id/{uuid.ext}`;
- creates the document through `createDokumen(...)`;
- updates status through the Supabase admin client;
- appends audit through `insertLog(...)`;
- returns the existing `201 { success: true, dokumen }` success shape or current error shapes.

Exact surfaces to replace gradually:

- auth/session boundary;
- master/permission reads;
- required lampiran validation;
- move plan and preflight;
- local DB write;
- file movement;
- response mapping.

## Recommended Next Runtime Phase

Recommended next phase:

```text
Phase 6G.2 Submit Route Local Auth and Dry-Run Boundary Wiring
```

Phase 6G.2 should be the first actual edit to `src/routes/api/dokumen/submit.ts`, but it must stay minimal:

- edit `src/routes/api/dokumen/submit.ts` narrowly;
- add a dry-run/local-boundary branch or local auth boundary check inside the route;
- start using `getLocalServerSession(request)` only in a controlled way;
- preserve the current response shape;
- do not execute local DB writes yet;
- do not execute filesystem movement yet;
- keep route parity tests updated as needed;
- do not remove the Supabase route path yet unless explicitly proven safe.

This should not introduce a permanent dry-run runtime, feature flag system, generic orchestrator framework, DI container, or parallel submit implementation.

## Practical Sequence From 6G.2 Through 6G.6

1. Phase 6G.2 Submit Route Local Auth and Dry-Run Boundary Wiring.
   - Current phase if not yet accepted complete.
   - Narrow `src/routes/api/dokumen/submit.ts` edit only.
   - Local auth boundary/dry-run only.
   - No local DB write.
   - No filesystem movement.
2. Phase 6G.3 Submit Route Local Preflight Wiring.
   - Next phase after 6G.2.
   - Route uses local move plan, disk checker, and preflight for local files.
   - Missing local files fail cleanly before DB writes or file moves.
   - No local DB write yet.
   - No filesystem movement yet.
3. Phase 6G.4 Submit Route Local DB Transaction Wiring.
   - Route uses the local submit bridge, repository, and Drizzle adapter for document create/status/audit.
   - File movement remains disabled or guarded unless the route has a no-move path.
   - Preserve response shape and parity tests.
4. Phase 6G.5 Submit Route Controlled Local File Movement.
   - Route performs controlled local pending-to-formal or `temp-id` movement.
   - Movement requires explicit failure handling and must not return false success.
   - No Supabase fallback.
5. Phase 6G.6 Submit Runtime Stabilization and Supabase Submit Path Retirement.
   - Stabilize parity, focused smoke checks, and docs.
   - Remove or disable the legacy Supabase submit path only after the local path passes tests and smoke checks.
   - Do not remove Supabase dependencies globally.

Do not add another planning-only or helper-only phase unless a concrete blocker is found. It is acceptable to debug runtime integration during these phases instead of creating more preparatory phases.

## Runtime Integration Guardrails

- Route parity tests remain the gate.
- No Supabase fallback.
- Missing local files fail cleanly.
- No old Supabase file migration, copy, download, backfill, or sync.
- No broad refactor.
- Keep `temp-id` unless explicitly changed.
- `ADMIN`-only accounts must not become submit-compatible accidentally.
- Server session/RBAC is authoritative.
- Do not expose physical paths or storage roots.
- `dms_active_role` is UX state only; server session and assigned roles authorize submit.
- `log_aktivitas` remains append-only.

## No Longer Blockers

- Old Supabase Storage files not being local is not a blocker because data and files are intentionally not migrated.
- Lack of production data migration is not a blocker for this clean local target.
- Fear of losing old files is not a blocker because the local migration target uses new seed data and newly uploaded local files only.
- Missing old Supabase-backed files should be treated as controlled local failures when encountered.

## Still Blocked

- Local preflight route response mapping for missing files and target conflicts.
- Live local DB write verification in the route.
- Controlled file movement failure behavior.
- Append-log failure parity.
- Runtime DB/file compensation or recovery after post-DB file failure.
- Supabase submit path retirement.

## Validation Results

No unit tests were required because this phase is docs-only.

Validation commands run:

```powershell
git status --short --branch
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\dokumen\submit-runtime-orchestrator.ts
git diff -- src\lib\dokumen\submit-disk-preflight-checker.ts
git diff -- tests\unit\dokumen\submit-route-parity.test.ts
```

Result summary:

- `git status --short --branch` showed only this new untracked planning doc on `migration/postgres-local`.
- `git diff --check` exited successfully with no output.
- `git diff --name-only` returned no output because the only change is an untracked file.
- Guarded diffs for `src\routeTree.gen.ts`, `src\routes\api\dokumen\submit.ts`, `src\lib\dokumen\submit-runtime-orchestrator.ts`, `src\lib\dokumen\submit-disk-preflight-checker.ts`, and `tests\unit\dokumen\submit-route-parity.test.ts` returned no output.

## Phase 6G.2 Follow-Up Note

Phase 6G.2 added the local auth dry-run boundary described in `docs/migration/submit-route-local-auth-dry-run-boundary.md`.

The route now accepts only the temporary query parameter `useLocalAuthDryRun=true` for the dry-run branch. That branch validates the existing request payload, calls `getLocalServerSession(request)`, requires PEGAWAI role compatibility, blocks ADMIN-only and non-PEGAWAI actors, and returns a dry-run response that is not `{ success: true, dokumen }`.

Default `POST /api/dokumen/submit` behavior remains legacy Supabase-backed. Local DB writes, route disk preflight, filesystem movement, runtime DB/file compensation, Supabase fallback, DB scripts, route generation, and Supabase Storage migration/copy/download/backfill/sync remain future work.
