# Phase 6F.10 Submit Runtime Wiring Readiness Boundary Plan

Date: 2026-05-16.

## 1. Purpose And Scope

This phase is a readiness and boundary planning phase only.

It reviews whether the existing submit foundations are safe to compose before any runtime migration of:

```text
POST /api/dokumen/submit
```

`POST /api/dokumen/submit` remains unchanged and legacy Supabase-backed after this phase.

This phase does not implement:

- runtime submit wiring;
- local submit auth wiring;
- local repository or Drizzle adapter wiring into the route;
- runtime DB writes;
- filesystem movement;
- route disk preflight;
- runtime DB/file compensation;
- rollback against real files;
- Supabase fallback;
- Supabase Storage migration, copy, download, backfill, or sync.

No DB scripts, migrations, seeds, route generation, dev server, build, full test suite, full typecheck, or auth hash script are part of this phase.

## 2. Foundation Inventory

| Foundation | Current artifact | Readiness status | Notes |
|---|---|---|---|
| Submit route parity tests | `tests/unit/dokumen/submit-route-parity.test.ts` and `docs/migration/submit-route-parity-test-harness-foundation.md` | Ready as regression gate | Covers current legacy response/status behavior with mocks only. It does not prove local runtime wiring. |
| Submit move planner | `src/lib/storage/submit-move-plan.ts` | Ready as logical planner | Plans underscore pending, dash pending, formal unchanged, unsupported, invalid, and `temp-id` targets. It does not check disk or move files. |
| Submit file preflight helper | `src/lib/dokumen/submit-file-preflight.ts` | Ready only with caveats | Requires injected source and target checkers. No default filesystem checker exists or should be added casually. |
| Submit DB/file compensation policy helper | `src/lib/dokumen/submit-db-file-compensation.ts` | Ready only as decision model | Classifies outcomes. It is not runtime rollback, compensation, retry, or recovery. |
| Local submit write bridge | `src/lib/dokumen/local-submit-write-bridge.ts` | Ready as route-independent bridge foundation | Preserves material and non-material workflow shapes through an injected repository. Not route-wired. |
| Local submit repository | `src/lib/dokumen/local-submit-repository.ts` | Ready as injected-adapter repository foundation | Maps bridge payloads to local Drizzle-shaped rows and response-compatible documents. Does not import live DB. |
| Local submit Drizzle adapter | `src/lib/dokumen/local-submit-drizzle-adapter.ts` | Ready only with caveats | Implements injected Drizzle-shaped adapter and a future live factory. It has not been used by the route or verified against live DB in this phase. |
| Local auth/session helper | `src/lib/auth/local-server-auth.ts` | Ready for selected non-auth API migrations | Resolves `dms_session`, roles, and active role. Submit-specific route use still needs response parity and role-policy decisions. |
| Local storage/path/move helpers | `src/lib/storage/local-storage-paths.ts`, `src/lib/storage/local-upload.ts`, `src/lib/storage/local-pending-move.ts` | Ready in their existing bounded surfaces | Upload and `rename-pending` have local runtime wiring. Submit movement remains unwired. |
| Current upload runtime | `src/routes/api/upload.ts` | Locally wired for new uploads | New upload files are local and use local user-id owner segments. Historical Supabase Storage files are not local. |
| Current rename-pending runtime | `src/routes/api/dokumen/rename-pending.ts` | Locally wired for existing-document moves | Uses local `dms_session`, local document ownership checks, and local moves. It is not a submit substitute. |

## 3. Readiness Matrix

| Component | Classification | Reason |
|---|---|---|
| Current legacy `POST /api/dokumen/submit` route | Not ready for local runtime replacement | It still uses Supabase session, Supabase master reads, Supabase Storage `.move(...)`, Supabase-backed create/status/audit helpers, and route-local `temp-id` behavior. |
| Submit route parity tests | Ready for route composition gate | They lock current response/status behavior and must pass before and after any future route wiring. |
| Submit move planner | Ready for route composition, not execution | Safe to compose into a future orchestrator/helper because it is logical-only. It cannot authorize movement by itself. |
| Submit file preflight helper | Ready only with caveats | It can be composed only when a route-approved logical-path source/target checker exists. It must fail closed without injected checkers. |
| Submit DB/file policy helper | Ready only with caveats | It can inform orchestration, but it does not perform compensation or make post-DB file failure safe. |
| Local submit write bridge | Ready for composition in a route-independent orchestrator | It proves actor/master/write transaction shapes, but its stricter append-log transaction behavior remains a parity decision before route success. |
| Local submit repository | Ready for composition behind injected adapter | It maps route-needed write data but still needs route-level error/status mapping. |
| Local submit Drizzle adapter | Ready only with caveats | Useful for a future composition helper. Direct runtime use needs DB error mapping, live DB verification approval, and parity tests. |
| Local auth/session helper | Ready only with submit-specific caveats | `dms_active_role` is UX state only; server session and assigned roles must remain authoritative. ADMIN-only submit compatibility is blocked. |
| Local upload runtime | Ready producer for new local files | Submit must still handle missing historical/Supabase-backed files as controlled failures without fallback. |
| Local rename-pending runtime | Ready for its own endpoint only | It does not prove combined create+submit DB/file ordering. |
| Runtime route disk checker for submit | Not ready for route composition | No approved submit route disk checker exists. Do not add a filesystem-backed default checker in this phase. |
| Runtime filesystem movement in submit | Blocked | DB/file ordering and post-DB file failure recovery are not approved. |
| Runtime DB/file compensation | Blocked | Existing helper is policy-only and explicitly not runtime rollback. |

## 4. Runtime Boundary Decision

Direct `src/routes/api/dokumen/submit.ts` runtime wiring is still blocked.

The first runtime-adjacent phase may:

- add a submit-specific route composition or orchestrator boundary helper outside `src/routes/api/dokumen/submit.ts`;
- compose existing pure foundations behind injected dependencies;
- define route-compatible outcome mapping for existing issue codes;
- keep all behavior test-only or helper-only;
- avoid live DB, disk checks, file moves, Supabase fallback, and route imports.

The first runtime-adjacent phase must not:

- modify `src/routes/api/dokumen/submit.ts`;
- switch submit auth to `getLocalServerSession(request)`;
- import the live local submit repository/adapter into the route;
- call `createLiveLocalSubmitDrizzleAdapter()` from the route;
- add submit route disk checks;
- execute local filesystem moves;
- return success after DB success unless file movement success is proven;
- add Supabase Storage fallback for missing local files;
- change endpoint path, request payload, response shape, status codes, UI behavior, role behavior, FSM behavior, archive behavior, or logical storage semantics.

Do not combine auth migration, repository writes, disk preflight, file movement, and compensation in one phase. That would make failure policy and regression root-cause analysis too broad.

The conservative next direction is a route-independent submit runtime orchestrator boundary helper, not direct submit route wiring.

## 5. Required Sequencing Before Real Submit Route Migration

Recommended bounded sequence:

1. Phase 6F.11 Submit Runtime Orchestrator Boundary Helper Foundation.
   Add a pure or injected-dependency helper that composes actor, payload, move-plan, preflight-result, write-plan, and DB/file policy outcome mapping without importing `submit.ts`, without disk checks, without file movement, and without live DB execution by default.

2. Phase 6F.12 Submit Route Disk Preflight Checker Foundation.
   Add an explicit submit-specific source/target checker that uses logical paths only at its public boundary and internally verifies local source existence and target non-existence. Keep it unwired from `submit.ts`.

3. Phase 6F.13 Submit Composition Harness Or Test-Only Runtime Branch.
   Exercise the orchestrator with fake auth, fake repository, fake checker, and fake move executor. Keep route behavior unchanged. Add tests for response mapping, ordering, and failure policy.

4. Phase 6F.14 Controlled Submit Route Migration.
   Only after the previous phases pass, edit `src/routes/api/dokumen/submit.ts` in a narrow phase. Keep parity tests blocking. Do not enable filesystem movement unless post-DB file failure recovery is concrete and tested.

If direct `submit.ts` wiring is proposed before these phases, the proposal must prove why route response parity, missing-file behavior, append-log failure parity, disk preflight, DB/file compensation, and mixed-storage behavior are already safe. They are not proven safe in the current repo state.

## 6. Response Parity Preservation Plan

The existing route parity tests must pass before and after any submit runtime change:

```powershell
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
```

Blocking parity gates:

- invalid or missing JSON body returns `400 { error: 'Invalid JSON body' }`;
- schema validation failure returns `400 { error: 'Validasi gagal', details }`;
- material missing or invalid `nominal_realisasi` returns the current 400 message;
- missing session returns `401 { error: 'Unauthorized' }`;
- missing required lampiran returns the current 400 message;
- empty `lampiranUrls` returns the current 400 message;
- missing kegiatan returns `400 { error: 'Kegiatan tidak ditemukan' }`;
- missing Ketua Tim assignment returns the current 403 message;
- storage move failure preserves logical `details.failedPath`, `details.newPath`, and `details.reason` shape when movement is in scope;
- create failure returns route-compatible 500;
- update-status failure returns route-compatible 500;
- material success returns `201 { success: true, dokumen }` with `IN_PPK_VALIDATION`, `current_step='PPK'`, and `revision_target=null`;
- non-material success returns `201 { success: true, dokumen }` with `TERSIMPAN`, `current_step=null`, and `revision_target=null`;
- audit action remains `SUBMIT` for material and `STORE` for non-material;
- `step_urutan` remains `1`;
- underscore pending current-route behavior remains explicit;
- already formal path non-move behavior remains explicit;
- returned `insertLog(...)` error-object parity remains explicit unless an approved phase intentionally changes it.

Open parity gaps:

- thrown audit insert failure behavior is not yet a blocking test;
- missing local file route status/message is unresolved;
- target-already-exists route status/message is unresolved;
- unsupported safe logical path route policy is unresolved;
- local auth role failure mapping for non-PEGAWAI or ADMIN-only actors is unresolved against current submit behavior;
- local DB adapter error mapping to route messages is unresolved;
- future underscore pending movement is a behavior expansion relative to the current dash-only submit route and must be explicitly tested.

## 7. Storage And Missing-File Boundary

No Supabase fallback is allowed.

Missing local file policy:

- missing local source must fail before DB writes;
- missing local source must fail before file moves;
- missing local source must not fetch, copy, download, backfill, sync, or migrate anything from Supabase Storage;
- missing local source responses must not expose physical paths, storage roots, tokens, hashes, env values, signed URLs, generated internal signed URLs, or file contents.

Move-required preflight policy:

- every move-required operation must have an injected source existence check;
- every move-required operation must have an injected target availability check;
- missing checkers must fail closed;
- source and target checks receive logical paths at the public boundary;
- physical path resolution, if later implemented inside a checker, must remain hidden from route responses.

`temp-id` remains the default submit planning target until explicitly changed by a separate approved phase.

Historical Supabase Storage files are not locally available. Verification should use clean local seed data and newly uploaded local files only.

## 8. DB/File Ordering Boundary

The accepted boundary remains:

- preflight failure aborts before DB writes and before file moves;
- DB transaction failure aborts before file moves;
- DB success plus full file movement success is the only safe success;
- DB success plus file failure is not success;
- DB success plus partial file failure is not success;
- DB success plus file failure requires explicit compensation/recovery;
- compensation helper output is not runtime rollback;
- audit logs remain append-only and must not be updated or deleted to repair storage failures.

The current local bridge/repository foundations place document create, status update, and append-only audit insert inside one local transaction. That is stricter than current legacy submit behavior for returned audit helper error objects. This difference remains a route parity decision before real route wiring.

## 9. Auth And Repository Boundary

`dms_active_role` is UX state only. The server must validate `dms_session`, assigned roles, and route authorization. Client-side role state must not authorize submit.

Submit actor boundary:

- local submit actor must come from server-validated `dms_session`;
- actor must have `PEGAWAI` compatibility unless a later approved phase deliberately changes submit rules;
- ADMIN-only accounts must not become submit-compatible by accident;
- creator id, audit user id, Ketua Tim assignment user id, and storage owner segment must all belong to the same local identity domain.

Repository boundary:

- local submit repository/adapter use must preserve current request and response shapes;
- material submit must remain `DRAFT -> IN_PPK_VALIDATION`, `current_step='PPK'`, `revision_target=null`, audit `SUBMIT`, `step_urutan=1`;
- non-material submit must remain `TERSIMPAN`, `current_step=null`, `revision_target=null`, audit `STORE`, `step_urutan=1`;
- `lampiran_urls` remains the existing logical metadata array shape;
- `log_aktivitas` remains append-only.

## 10. Protected Files

The following files must remain untouched until a later phase explicitly approves a narrower change:

- `src/routes/api/dokumen/submit.ts`
- `src/routeTree.gen.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/upload.ts`
- `src/lib/storage/submit-move-plan.ts`
- `src/lib/storage/local-pending-move.ts`
- `src/lib/storage/local-upload.ts`
- `src/lib/storage/local-storage-paths.ts`
- `src/lib/dokumen/submit-file-preflight.ts`
- `src/lib/dokumen/submit-db-file-compensation.ts`
- `src/lib/dokumen/local-submit-write-bridge.ts`
- `src/lib/dokumen/local-submit-repository.ts`
- `src/lib/dokumen/local-submit-drizzle-adapter.ts`
- `tests/unit/dokumen/submit-route-parity.test.ts`
- `tests/unit/dokumen/submit-file-preflight.test.ts`
- `tests/unit/dokumen/submit-db-file-compensation.test.ts`
- UI files
- preview/download endpoints
- archive destruction routes
- delete/remove routes
- diagnostics/orphan cleanup routes

## 11. Remaining Blockers

Submit route wiring remains blocked by:

- runtime submit local auth composition;
- runtime submit repository/adapter composition;
- route disk preflight checker;
- actual file movement execution policy;
- concrete post-DB file failure recovery;
- append-log failure parity;
- missing local file route status/message;
- target-already-exists route status/message;
- unsupported safe logical path policy;
- temp-id decision beyond the current default;
- historical Supabase files not locally available;
- AttachmentEditor still being able to produce Supabase-backed dash pending files;
- future underscore pending submit movement being a behavior expansion relative to the current legacy route;
- local DB adapter error-to-response mapping;
- ADMIN-only and non-PEGAWAI route response mapping;
- Supabase cannot be removed.

## 12. Recommended Next Phase

Recommended next phase:

```text
Phase 6F.11 Submit Runtime Orchestrator Boundary Helper Foundation
```

This should still avoid editing:

```text
src/routes/api/dokumen/submit.ts
```

Reasoning:

- the foundations are individually useful, but runtime submit needs a submit-specific ordering and outcome boundary before route code changes;
- direct route wiring would combine auth migration, DB writes, file preflight, file movement policy, and compensation decisions at once;
- an orchestrator boundary helper can prove composition order, response mapping, and failure classification with injected dependencies and tests;
- the route parity test remains the regression gate while the production route stays unchanged;
- this keeps the next implementation incremental and reversible.

The next phase should not create a generic orchestration framework, dependency injection container, workflow engine, broad runtime abstraction layer, feature-flag system, or unrelated architecture rewrite. Keep it submit-specific and migration-bounded.

## 13. Validation Results

This phase is docs-only. No helper code was added, so no helper unit test or helper audit command was required.

Validation commands run:

```powershell
git status --short --branch
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
```

Result summary:

- Initial `git status --short --branch` was clean on `migration/postgres-local`.
- Final validation results are recorded in the task final response.
- No focused tests were required because this phase added documentation only and did not claim new test behavior.

## Explicit Non-Claims

This phase does not claim submit has migrated.

This phase does not claim route preflight is wired.

This phase does not claim filesystem movement is implemented.

This phase does not claim runtime DB/file compensation is implemented.

This phase does not claim rollback is implemented against real files.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.

## 14. Phase 6F.11 Follow-Up Note

Phase 6F.11 added the route-independent submit runtime orchestrator boundary helper described in `docs/migration/submit-runtime-orchestrator-boundary-helper-foundation.md`.

The helper composes only injected or already-resolved stage outputs. It classifies payload, actor/role, master/permission, move-plan, preflight, DB transaction, file movement, and compensation policy states without importing the submit route, without calling live auth, without executing live database work, without checking disk, and without moving files.

Direct `src/routes/api/dokumen/submit.ts` wiring remains blocked. Runtime route disk preflight, filesystem movement, runtime DB/file compensation, rollback against real files, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain future work.
