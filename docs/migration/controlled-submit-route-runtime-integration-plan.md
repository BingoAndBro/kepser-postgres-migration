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

## Practical Sequence After 6G.2

1. Phase 6G.2 local auth/dry-run boundary in submit route.
2. Phase 6G.3 local preflight wiring in submit route without DB writes or moves.
3. Phase 6G.4 local DB transaction wiring with movement still disabled or guarded.
4. Phase 6G.5 controlled local file movement with explicit failure handling.

Do not add another planning-only phase unless a concrete blocker is found.

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

## No Longer Blockers

- Old Supabase Storage files not being local is not a blocker because data and files are intentionally not migrated.
- Lack of production data migration is not a blocker for this clean local target.
- Fear of losing old files is not a blocker because the local migration target uses new seed data and newly uploaded local files only.

## Still Blocked

- Exact local route response mapping.
- Live local DB write verification.
- File movement failure behavior.
- Append-log failure parity.
- Target conflict route status/message.

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
