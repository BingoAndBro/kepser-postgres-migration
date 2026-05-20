# Phase 11F Regression, Smoke, And Release-Hardening Plan

Date prepared: 2026-05-19.

Status: planning/report template only. Execution results must be filled by the human after running commands and manual smoke checks.

This plan covers the clean local PostgreSQL + Drizzle + local `dms_session` auth + local filesystem storage target. It does not authorize runtime fixes, DB scripts, route generation, package changes, env edits, old Supabase data/file migration, or automatic heavy validation.

## Execution Order

Recommended smoke order:

1. P0 auth/session.
2. P0 document workflow.
3. P0 archive/destruction.
4. P0 storage/security.
5. P1 admin/user-management.
6. P1 role UI pages.
7. P2 broader build/E2E and operational hardening review.

## Test Inventory

Must-run before release:

| Priority | File/command | Coverage | Notes |
|---|---|---|---|
| P0 | `pnpm test` | Full Vitest suite | Minimum required human-run regression command. |
| P0 | `tests/fsm.test.ts` | FSM legal transitions, rejection targets, archive transition guards | Included by `pnpm test`; can be run focused if triaging workflow failures. |
| P0 | `tests/unit/auth/*.test.ts` | session token, cookie policy, active-role resolution | Important for local `dms_session` auth. |
| P0 | `tests/unit/storage/*.test.ts` | local upload, pending move, file access token/internal access, raw preview, rename-pending | Important for local filesystem storage and signed internal access. |
| P0 | `tests/unit/dokumen/*.test.ts` | submit runtime, preflight, DB/file compensation, local submit repository/adapter, route parity | Important for submit and attachment movement. |

Recommended focused tests:

| Priority | Command | Coverage |
|---|---|---|
| P1 | `pnpm test tests/fsm.test.ts` | Workflow transition triage. |
| P1 | `pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts` | Auth/session triage. |
| P1 | `pnpm test tests/unit/storage/file-access-token.test.ts tests/unit/storage/internal-file-access.test.ts tests/unit/storage/upload-route-local.test.ts tests/unit/storage/rename-pending-local-route.test.ts` | File access/upload/move triage. |
| P1 | `pnpm test tests/unit/dokumen/submit-runtime-orchestrator.test.ts tests/unit/dokumen/submit-route-parity.test.ts tests/unit/dokumen/submit-file-preflight.test.ts tests/unit/dokumen/submit-db-file-compensation.test.ts` | Submit regression triage. |

Optional heavy/E2E:

| Priority | Command | Coverage | Preconditions |
|---|---|---|---|
| P2 | `pnpm build` | Vite/TanStack build and route integration | Human-only; inspect whether generated files changed. |
| P2 | `pnpm test tests/e2e/submit-flow.spec.ts` | Pegawai submit/revision UI smoke | Requires running app, local DB, local seed data, and browser environment. |
| P2 | `pnpm test tests/e2e/approval-flow.spec.ts` | PPK/Bendahara approval UI smoke | Same as above. |
| P2 | `pnpm test tests/e2e/spec-06-user-management.spec.ts` | Admin user management UI smoke | Same as above. |

Manual-only smoke:

| Priority | Domain | Coverage |
|---|---|---|
| P0 | Auth/session | login, logout, reload, role switch, inactive user, password-change session revocation. |
| P0 | Workflow | material submit, non-material submit, revision, PPK, Bendahara. |
| P0 | Archive/destruction | archive, lifecycle, `DIMUSNAHKAN`, stale token denial. |
| P0 | Storage/security | upload, pending-to-formal, preview/download, path traversal, wrong owner, no physical path leak. |
| P1 | Admin/user management | list/create/update/roles/status/reset/change-password/no hard delete. |
| P1 | UI rendering | Pegawai, PPK, Bendahara, Arsiparis, Admin pages plus redirects. |

Playwright config exists at `playwright.config.ts`; it uses `tests/e2e`, Chromium, one worker, no retries, HTML reporter, and `PLAYWRIGHT_BASE_URL` defaulting to `http://localhost:3000`. There is no dedicated `test:e2e` package script; the available package scripts are `pnpm test` and `pnpm build` for this plan.

## Regression Command Plan

Minimum required human-run validation:

```powershell
pnpm test
```

Optional build after tests:

```powershell
pnpm build
```

Optional focused E2E if the human has started the app and prepared local test data:

```powershell
pnpm test tests/e2e/submit-flow.spec.ts
pnpm test tests/e2e/approval-flow.spec.ts
pnpm test tests/e2e/spec-06-user-management.spec.ts
```

Supabase cleanup audit commands:

```powershell
git grep -n "@supabase\|createServerSupabaseClient\|createAdminClient\|getBrowserClient\|createBrowserClient\|supabase\.auth\|auth.admin\|supabase\.from\|supabase\.storage\|storage\.from\|SupabaseClient" -- src tests package.json pnpm-lock.yaml
git grep -n "ENV_KEYS\.SUPABASE\|ENV_KEYS\.VITE_SUPABASE\|SUPABASE_URL\|SUPABASE_ANON_KEY\|SUPABASE_SERVICE_ROLE_KEY\|VITE_SUPABASE_URL\|VITE_SUPABASE_ANON_KEY" -- src tests
```

Expected audit interpretation:

| Result | Interpretation |
|---|---|
| No active source/test/package matches | Expected after Phase 11E. |
| Historical docs matches only | Not a blocker. |
| `.env` variable names still present | Human-controlled cleanup item, not automatic. Do not print values. |
| Runtime/package/env constants reappear | Blocker until investigated. |

Do not mark any command passed unless the human actually runs it and records the result.

## Manual Smoke Checklist

### P0 Auth/Session

| Check | Result | Notes |
|---|---|---|
| Login with active local user succeeds. | TODO |  |
| Invalid login fails generically without leaking credential details. | TODO |  |
| Logout clears authenticated UI and server session. | TODO |  |
| Browser reload preserves session through `/api/auth/session`. | TODO |  |
| Role switch succeeds only for assigned non-admin roles. | TODO |  |
| Inactive user is rejected. | TODO |  |
| Admin reset-password revokes target sessions. | TODO |  |
| Self change-password revokes current-user sessions. | TODO |  |
| `dms_active_role` is UX only; server rejects unauthorized role access. | TODO |  |

### P1 Admin/User Management

| Check | Result | Notes |
|---|---|---|
| Admin user list loads. | TODO |  |
| Create user succeeds with local password provisioning path. | TODO |  |
| Update user profile succeeds. | TODO |  |
| Update roles succeeds for valid non-admin combinations. | TODO |  |
| ADMIN mixed with non-admin roles is rejected. | TODO |  |
| Activate/deactivate works; deactivated user cannot login. | TODO |  |
| Reset password works and revokes sessions. | TODO |  |
| Self change password works and revokes sessions. | TODO |  |
| No hard-delete user behavior is exposed. | TODO |  |

### P0 Pegawai/Dokumen

| Check | Result | Notes |
|---|---|---|
| Pegawai document list loads. | TODO |  |
| Submit Material creates `IN_PPK_VALIDATION` with `current_step='PPK'`. | TODO |  |
| Submit Non-Material creates `TERSIMPAN`. | TODO |  |
| Non-Material rejects meaningful `nominal_realisasi`. | TODO |  |
| Edit draft/non-material saved document works where allowed. | TODO |  |
| Pegawai revision flow from PPK rejection works. | TODO |  |
| Upload files through local `/api/upload`. | TODO |  |
| Cancel/reset pending cleanup works without deleting formal files. | TODO |  |
| Preview/download works for authorized user. | TODO |  |

### P0 PPK

| Check | Result | Notes |
|---|---|---|
| Inbox loads `IN_PPK_VALIDATION` items. | TODO |  |
| Approve moves to Bendahara step. | TODO |  |
| Reject sets `NEED_REVISION` target `USER`. | TODO |  |
| Kembalikan sends PPK-targeted revision back to Pegawai. | TODO |  |
| Resubmit PPK-targeted revision works. | TODO |  |
| Wrong role is denied at server/API. | TODO |  |

### P0 Bendahara

| Check | Result | Notes |
|---|---|---|
| Inbox loads `IN_BENDAHARA_APPROVAL` items. | TODO |  |
| Approve moves to `COMPLETED`. | TODO |  |
| Reject sets `NEED_REVISION` target `PPK`. | TODO |  |
| Completed docs show correctly. | TODO |  |
| Wrong role is denied at server/API. | TODO |  |

### P0 Arsiparis/Archive

| Check | Result | Notes |
|---|---|---|
| Inbox/completed docs load. | TODO |  |
| Archive completed doc creates archive `AKTIF` and doc `ARCHIVED`. | TODO |  |
| `AKTIF -> INAKTIF` works. | TODO |  |
| `INAKTIF -> USUL_MUSNAH` works. | TODO |  |
| Destructive approval sets `DIMUSNAHKAN`. | TODO |  |
| `DIMUSNAHKAN` blocks preview/download/file access. | TODO |  |
| Stale internal file token fails after destruction. | TODO |  |
| Storage diagnostics/orphan cleanup dry-run is safe if routes remain available. | TODO |  |
| Orphan cleanup deletion path deletes only confirmed orphan formal files. | TODO |  |

### P0 Storage/File Access

| Check | Result | Notes |
|---|---|---|
| Upload local pending file succeeds. | TODO |  |
| Pending file renames/moves to formal path. | TODO |  |
| Missing old Supabase-backed file fails cleanly without fallback. | TODO | Expected limitation, not blocker. |
| Path traversal is rejected. | TODO |  |
| Wrong owner is denied. | TODO |  |
| Role-compatible preview/download works. | TODO |  |
| Filename and content-disposition are sane. | TODO |  |
| Responses do not leak physical paths, env values, secrets, tokens, DB URLs, or storage roots. | TODO |  |

### P1 UI Pages

| Check | Result | Notes |
|---|---|---|
| Pegawai pages render. | TODO |  |
| PPK pages render. | TODO |  |
| Bendahara pages render. | TODO |  |
| Arsiparis pages render. | TODO |  |
| Admin pages render. | TODO |  |
| Forbidden/login redirects work. | TODO |  |

## Known Expected Migration Limitations

- Missing old Supabase-backed files should fail cleanly without Supabase fallback.
- Historical Supabase docs/spec references may remain and are not blockers by themselves.
- `.env` and `.env.migration` are human-controlled; do not edit or print values during regression planning.
- Final go-live decisions remain human-controlled after reviewing executed test and smoke results.
- Backup/restore, CSRF/rate-limit, LAN deployment, and broader operational hardening are deferred to Phase 11G unless a regression blocker makes them urgent.

## Stop/Go Criteria

Commit-ready criteria:

- Documentation plan is complete and clearly separates planned validation from executed validation.
- No runtime source, tests, package files, env files, route tree, DB, Drizzle, Supabase, migrations, seeds, or scripts changed.
- Lightweight diff/protected-file audit is clean.

Release-candidate criteria:

- `pnpm test` passed in the target local environment.
- Human either ran `pnpm build` successfully or explicitly accepted build as skipped with rationale.
- P0 manual smoke checks passed or every failure has a documented non-blocking rationale.
- Supabase runtime/package/env-constant audit is clean for active source/tests/package files.
- No secrets, env values, physical paths, raw tokens, token hashes, password hashes, DB URLs, or storage roots leaked during validation.

Must-fix blocker criteria:

- Any auth bypass or server-side RBAC bypass.
- Any unauthorized role access accepted because of `dms_active_role`.
- Any `DIMUSNAHKAN` preview/download/file access, including stale internal token access.
- Any Supabase runtime/package/env-constant dependency reappears in active `src`, `tests`, `package.json`, or `pnpm-lock.yaml`.
- Any package/env secret leak.
- Any Non-Material document accepts meaningful `nominal_realisasi`.
- Any path traversal or wrong-owner file access succeeds.
- Any response exposes physical storage paths, storage root, env values, secrets, raw session tokens, token hashes, password hashes, or DB URLs.
- Any workflow transition creates an invalid status/current_step/revision_target combination.

Rollback/stash criteria:

- If regression uncovers a blocker and no scoped fix phase is approved, stop and document the blocker; do not hide a fix in Phase 11F.
- If heavy validation generates unapproved file changes such as route tree or build artifacts, inspect and revert/stash only with human approval.
- If package/env/DB/runtime files changed during this planning phase, stop and classify as a process violation before continuing.

Non-blocker examples:

- Missing old Supabase-backed files fail cleanly without fallback.
- Historical Supabase migration/spec docs still mention Supabase.
- Optional E2E skipped because app/DB/browser environment was not prepared, as long as the skip is recorded.

## Regression Report Template

Copy and fill this section after execution.

```markdown
# Phase 11F Regression Execution Report

Date:
Branch: migration/postgres-local
Commit hash:
Executor:
Environment:
DB state:
Storage root state:
App URL / LAN URL:

## Commands Run

| Priority | Command | Result | Notes |
|---|---|---|---|
| P0 | pnpm test | TODO pass/fail/skipped |  |
| P1 | pnpm build | TODO pass/fail/skipped |  |
| P2 | pnpm test tests/e2e/submit-flow.spec.ts | TODO pass/fail/skipped |  |
| P2 | pnpm test tests/e2e/approval-flow.spec.ts | TODO pass/fail/skipped |  |
| P2 | pnpm test tests/e2e/spec-06-user-management.spec.ts | TODO pass/fail/skipped |  |
| P0 | Supabase runtime/package grep | TODO pass/fail/skipped |  |
| P0 | Supabase env constants grep | TODO pass/fail/skipped |  |

## Manual Smoke Results

| Priority | Domain | Result | Evidence/notes |
|---|---|---|---|
| P0 | Auth/session | TODO pass/fail/skipped |  |
| P1 | Admin/user management | TODO pass/fail/skipped |  |
| P0 | Pegawai/dokumen | TODO pass/fail/skipped |  |
| P0 | PPK | TODO pass/fail/skipped |  |
| P0 | Bendahara | TODO pass/fail/skipped |  |
| P0 | Arsiparis/archive | TODO pass/fail/skipped |  |
| P0 | Storage/file access | TODO pass/fail/skipped |  |
| P1 | UI pages/redirects | TODO pass/fail/skipped |  |

## Bugs Found

| ID | Severity | Blocker? | Domain | Summary | Repro | Recommended fix phase |
|---|---|---|---|---|---|---|
| TODO | P0/P1/P2 | yes/no |  |  |  |  |

## Known Expected Limitations

- Missing old Supabase-backed files fail cleanly without fallback by design.
- Historical Supabase docs/spec references are retained by design.
- Backup/restore, LAN, CSRF/rate-limit, and operational hardening are deferred unless separately executed.

## Decision

Rollback/stash decision:
Final verdict: GO / NO-GO / GO WITH NON-BLOCKING RISKS / NEEDS FIX PHASE
Human approver:
```

## Phase 11F.1 P0 Blocker Triage

Date: 2026-05-19.

Status: targeted fix implemented for the reported PPK detail and Pegawai document-log 404 blocker. Downstream PPK, Bendahara, Arsiparis, archive/destruction, and storage/file-access smoke remain unverified until the human reruns the manual workflow.

Regression evidence:

- After successful Pegawai Material submit, `GET /api/ppk/dokumen/{id}` returned `404 { "error": "Dokumen tidak ditemukan" }` even though the same document appeared in `GET /api/ppk/inbox`.
- For the same document, `GET /api/dokumen/{id}/log` returned `404 { "error": "Dokumen tidak ditemukan" }`.

Root cause:

- The PPK detail route and document log route used a malformed UUID validator that omitted the fourth UUID segment hyphen. Valid document IDs were rejected before the database lookup, making existing accessible documents look missing.
- This was an ID guard issue, not a log-row absence issue. Existing accessible documents with zero `log_aktivitas` rows must return `200 { logs: [] }`.

Fix summary:

- Corrected the UUID validators in `src/routes/api/ppk/dokumen/$id.ts` and `src/routes/api/dokumen.$id.log.ts`.
- Applied the same narrow UUID-guard correction to downstream detail endpoints `src/routes/api/bendahara/dokumen/$id.ts` and `src/routes/api/arsiparis/dokumen.$id.ts` so the manual workflow does not hit the same detail-page blocker immediately after PPK approval/archive handoff.
- Added focused route-handler regression coverage in `tests/unit/dokumen/ppk-detail-and-log-route.test.ts`.
- Preserved response contracts: invalid/missing documents still return `404`, unauthenticated requests still return `401`, unauthorized requests still return `403`, and successful log lookup can return an empty `logs` array.

Manual retest required:

1. Submit Material as Pegawai.
2. Confirm the document appears in PPK inbox.
3. Open PPK detail for the same document.
4. Confirm PPK detail no longer returns 404.
5. Confirm Pegawai document log no longer returns 404 for the same accessible document.
6. Continue PPK approve/reject smoke.
7. Continue Bendahara and Arsiparis smoke.

Phase 11F.1b follow-up:

- Corrected the same malformed UUID guard in `src/routes/api/dokumen/$id.nominal.ts`.
- Added focused route-handler coverage that verifies a valid UUID reaches the document lookup and an invalid UUID is rejected before lookup.
- No nominal business rules, Non-Material nominal rules, RBAC predicates, response shapes, transactions, or audit logging were changed.

## Phase 11F.2 Regression Follow-up

Date: 2026-05-19.

Human retest after Phase 11F.1/11F.1b:

- Pegawai activity log is safe after the UUID guard fix.
- PPK validation, approve, reject, validated-list, preview, and download flows passed manual retest.
- Bendahara approval and rejection passed manual retest.
- Laporan Saya and Laporan Kegiatan passed manual retest.
- Arsiparis/archive/destruction and storage/file-access smoke remain unverified.

Follow-up fixes:

- Pegawai Revisi Dokumen list now includes the same status/current-step display pattern used by Dokumen Diajukan for revision-status documents.
- Pegawai revisi detail `Batal` now returns to `/pegawai/revisi` instead of `/pegawai/dokumen`.
- Activity log display now maps persisted `PPK_APPROVE` and `PPK_REJECT` audit actions to friendly labels without changing stored audit action names.
- Phase 11F.2b tightened the Revisi Dokumen list parity further: the row/action table now follows Dokumen Diajukan's revision-row rendering pattern, and `/pegawai/revisi` disables intent preloading to avoid the TanStack Router `_nonReactive` preload race observed during manual smoke.

Manual retest required:

1. Open Pegawai Revisi Dokumen.
2. Confirm the `_nonReactive` console error is gone.
3. Confirm revision documents show status/current-step display consistently with Dokumen Diajukan.
4. Open a revision document and click `Batal`; confirm it returns to the revisi context.
5. Confirm PPK approve/reject logs show friendly labels.
6. Continue Arsiparis/archive/destruction and storage/file-access smoke.

## Phase 11F.3 Regression Execution Report

Date: 2026-05-19.

Status: regression execution report recorded. Phase 11F is not complete because a production-like preview runtime blocker remains.

Environment:

- Local PostgreSQL.
- Local `dms_session` auth.
- Local filesystem storage.
- `.env` and `.env.migration` remain human-controlled.
- Old Supabase production/current data and old Supabase Storage files are intentionally not migrated, copied, downloaded, backfilled, synced, or recovered. Missing old Supabase-backed files must fail cleanly without Supabase fallback.

## Commands Run

| Priority | Command | Result | Notes |
|---|---|---|---|
| P0 | `pnpm test` | PASS | 25 test files, 290 tests. |
| P1 | `pnpm build` | PASS | Build completed. Earlier `src/routeTree.gen.ts` build/line-ending side effect was restored/kept clean. |
| P0 | Supabase runtime/package grep | PASS | No active runtime/package matches reported. |
| P0 | Supabase env constants grep | PASS | No active `src`/`tests` matches reported. |
| P0 | `pnpm preview` | FAIL | Runtime failed after successful build: `Error: Could not resolve "pg-native" imported by "pg". Is it installed?` |
| P1 | Long-session performance audit | BLOCKED | Needs production-like preview runtime first to distinguish dev-only slowdown from production/runtime behavior. |
| P2 | Playwright/E2E | SKIPPED | Not run automatically in Phase 11F. |

## Manual Smoke Results

| Priority | Domain | Result | Evidence/notes |
|---|---|---|---|
| P0 | Auth/session | PASS | Admin and Pegawai login passed in manual smoke. |
| P1 | Admin/user management | PASS | Admin login, user list, create, edit, deactivate, reactivate, and reset-password passed. |
| P0 | Pegawai/dokumen | PASS | Login, submit, preview/download, Laporan Saya, and Laporan Kegiatan passed. Pegawai activity log is safe after the UUID guard fix. |
| P0 | Pegawai revisi | PASS | Revisi page fixes were retested and committed by human. `Batal` returns to `/pegawai/revisi`; display parity and console error are considered resolved by latest human confirmation. |
| P0 | PPK | PASS | Validation, approve/reject, preview/download passed after UUID guard fix. Friendly PPK log labels passed. |
| P0 | Bendahara | PASS | Approval and rejection passed. |
| P0 | Arsiparis/archive | PARTIAL/BLOCKED | Downstream continuation still depends on resolving preview/runtime blocker and follow-up regression where needed. |
| P0 | Storage/file access | PARTIAL/BLOCKED | Preview/download passed in scoped manual smoke, but production-like preview runtime is blocked by `pg-native`. |
| P1 | UI pages/redirects | PARTIAL | Core workflow usable; known backlog remains below. |

## Bugs Found / Backlog Classification

| ID | Severity | Blocker? | Domain | Summary | Recommended fix phase |
|---|---|---|---|---|---|
| 11F3-001 | P0 | yes | Production preview/runtime | `pnpm preview` fails at runtime because `pg` imports unresolved optional `pg-native`. Blocks production-like performance testing. | Phase 11F.4a |
| 11F3-002 | P1 | no, blocked by P0 | Performance | Long `pnpm dev` session accumulated thousands of requests and became slow. Observed `/__tsd/console-pipe/sse` and `/__tsd/console-pipe`; these are diagnostic clues, not confirmed root cause. | After Phase 11F.4a |
| 11F3-003 | P1 | no | Auth/UI | Logout network returns 200 but UI keeps loading. | Backlog |
| 11F3-004 | P1 | no | RBAC/UX | Fixed pending human retest: Admin access to `/pegawai/dokumen` should redirect to forbidden before the page fetches `/api/dokumen`. | Phase 11F.5g |
| 11F3-005 | P1 | no | Arsiparis master data | Fixed pending human retest: Master Klasifikasi second child save button loading. | Phase 11F.5b |
| 11F3-006 | P2 | no | Auth/UX | Password change should auto logout after success. | Backlog |
| 11F3-007 | P2 | no | Master data validation | Fixed pending human retest: Master Kelengkapan duplicate validation. | Phase 11F.5c |
| 11F3-008 | P2 | no | Document form validation | Fixed pending human retest: Ajukan/revisi kelengkapan tambahan duplicate validation. | Phase 11F.5c |
| 11F3-009 | P2 | no | Master data UI | Kategori/Detail filter and add-form prefill consistency. | Backlog |
| 11F3-010 | P2 | no | Dev logging | Guard dev log mentions ARSIPARIS for PEGAWAI+PPK user. | Backlog |
| 11F3-011 | P2 | no | Accessibility | `aria-hidden` focus warning in Admin Master User. | Backlog |
| 11F3-012 | P3 | no | Route naming/design | `/pegawai/dokumen` vs `/pegawai/inbox` naming cleanup. | Future design cleanup |

## Current Verdict

Final verdict: NEEDS FIX PHASE.

Rationale:

- Core workflow regression is mostly PASS within the human-observed scope.
- Production-like runtime validation is blocked by `pnpm preview` failing on `pg-native` optional dependency resolution.
- Long-session performance concern cannot be classified as dev-only or production/runtime until preview runs.
- Phase 11F is not complete.
- Phase 11G is not ready.

## Phase 11F.4a Handoff

Recommended next phase:

```text
Phase 11F.4a  Production Preview Runtime Blocker: pg-native Optional Dependency Resolution
```

Phase 11F.4a should:

- Reproduce and inspect the `pnpm preview` runtime failure after successful build.
- Prefer runtime/bundler analysis before expanding dependency footprint with `pg-native` installation.
- Determine whether the `pg` optional native import should be externalized, conditionally avoided, or otherwise handled for TanStack Start preview/runtime packaging.
- Preserve package/env/routeTree/DB guardrails unless the human explicitly approves a scoped package or build-config fix.
- After preview works, rerun production-like smoke and then reassess the long-session performance concern.

## Phase 11F.4a Production Preview Runtime Blocker: pg-native Optional Dependency Resolution

Date: 2026-05-19.

Status: targeted `pg-native` blocker fix implemented. Full production-preview UI validation is not complete because a separate page-render blocker is now visible.

Original blocker:

- `pnpm build` passed, but `pnpm preview` failed at runtime with `Error: Could not resolve "pg-native" imported by "pg". Is it installed?`
- The failure came from `.output/server/_libs/pg.mjs` before the app could be meaningfully exercised in production-like preview.

Root cause:

- The app uses `src/db/client.ts` with `Pool` from `pg` and Drizzle's `drizzle-orm/node-postgres` adapter.
- Upstream `pg` declares `pg-native` as an optional peer dependency and normally loads it only through the native branch (`pg.native` or `NODE_PG_FORCE_NATIVE`).
- Nitro/Rollup bundled `pg` into `.output/server/_libs/pg.mjs`; Vite converted the unresolved optional peer into an eager generated throw. That made a lazy optional dependency path fail during server module evaluation.

Fix:

- Updated `vite.config.ts` to externalize only `pg-native` in Nitro's server Rollup config.
- This preserves the normal JavaScript `pg` client path and leaves the optional native require inside `pg`'s native branch instead of installing or bundling `pg-native`.
- No DB connection semantics, Drizzle schema, queries, migrations, seeds, scripts, package files, env files, route generation, or Supabase fallback behavior were changed.

Validation:

- `pnpm build`: PASS.
- Built output inspection: PASS. `.output/server/_libs/pg.mjs` no longer contains Vite's generated `Could not resolve "pg-native"` throw; the optional native branch remains as `require("pg-native")`.
- `pnpm preview`: PASS for the original blocker. Preview started without the `pg-native` crash. Port `3000` was already in use, so preview selected `http://localhost:3001/`.
- DB-backed route sanity: PASS. `GET /api/master-fungsi` returned `200` from preview and exercised the local PostgreSQL/Drizzle path.
- Root page probe: FAIL with a separate runtime error, `jsxDevRuntimeExports.jsxDEV is not a function`, from the built `RootDocument`. This is not the `pg-native` optional dependency failure and should be handled as a separate production-preview UI blocker before claiming full preview smoke or performance audit completion.

Current verdict:

- `11F3-001` is fixed for the `pg-native` optional dependency resolution blocker.
- Production-like preview is still not fully usable for UI smoke because of the separate JSX dev-runtime page-render failure.
- Long-session performance audit remains blocked until the new preview UI blocker is resolved and UI routes can be exercised in preview.

Recommended next phase:

```text
Phase 11F.4b  Production Preview UI Runtime Blocker: JSX Dev Runtime In SSR Output
```

## Phase 11F.4b Production Preview Runtime Blocker: jsxDEV RootDocument Failure

Date: 2026-05-19.

Status: targeted preview UI runtime fix implemented. Long-session performance audit is still not complete; preview is now unblocked for the next validation slice.

Blocker:

- After Phase 11F.4a fixed the `pg-native` crash, `pnpm preview` could start but `GET /` returned `500`.
- Runtime error: `jsxDevRuntimeExports.jsxDEV is not a function`.
- The failure surfaced from built `RootDocument` in the server SSR output.

Root cause:

- The production SSR build emitted JSX as `jsxDEV(...)` calls while the bundled production React dev-runtime exposed `jsxDEV` as `undefined`.
- The error was not caused by the `pg-native` externalization. The `pg-native` fix remained necessary and the built output still only leaves `require("pg-native")` in `pg`'s optional native branch.
- Devtools code was removed by `@tanstack/devtools-vite` during build, so the runtime failure was a JSX transform mismatch rather than active TanStack Devtools UI remaining in `RootDocument`.

Fix:

- Added explicit Vite `esbuild.jsxDev: false` so production client/SSR builds emit `jsx/jsxs` from `react/jsx-runtime` instead of `jsxDEV`.
- Kept the Phase 11F.4a Nitro externalization for `pg-native`.
- No app routes, DB connection semantics, Drizzle schema, queries, migrations, seeds, scripts, package files, env files, route generation, or Supabase fallback behavior were changed.

Validation:

- `pnpm build`: PASS.
- Built output inspection: PASS. Server SSR chunks now import `jsxRuntimeExports` and use `jsx/jsxs`; no `jsxDEV` references remain in server SSR chunks.
- `pnpm preview`: PASS on fixed port `http://localhost:3017/` for validation.
- `GET /`: PASS, returned `200`.
- `GET /api/master-fungsi`: PASS, returned `200` and confirmed local PostgreSQL/Drizzle still works in preview.
- `pg-native` crash did not reappear.
- `jsxDEV` crash did not reappear.

Current verdict:

- The Phase 11F.4a `pg-native` runtime blocker remains fixed.
- The Phase 11F.4b `jsxDEV` RootDocument blocker is fixed.
- Production-like preview can now be used for follow-up smoke and long-session performance validation.
- Do not claim long-session performance audit is complete until that follow-up validation is actually executed.

## Phase 11F.4c Production Preview Follow-up Smoke And Long-Session Performance Validation

Date: 2026-05-20.

Status: bounded audit and production-preview HTTP probe complete. Manual Chrome DevTools login/role-switch long-session validation was not run in this pass and remains pending, so this section is not final performance certification.

Scope actually executed:

- Source/runtime audit only; no runtime source fix was made.
- `pnpm build` was run and passed.
- `pnpm preview` was run through a temporary PowerShell job on fixed validation port `http://127.0.0.1:3018/`.
- HTTP probes were run against preview, not a browser DevTools session.
- No DB scripts, migrations, seeds, route generation, package install/remove/update, Playwright/E2E, env edits, source edits, or commit were run.

Preview probe results:

| Check | Result | Notes |
|---|---|---|
| Preview port | PASS | Fixed port `3018`. |
| `GET /` | PASS | Returned `200`. |
| `GET /api/auth/session` | PASS | Returned `200` before and after a 60-second idle wait. |
| `GET /api/master-fungsi` | PASS | Returned `200`; local PostgreSQL/Drizzle preview path still works. |
| Direct `/__tsd/console-pipe` probe | PASS/ABSENT | Returned `404` in preview. |
| Built output grep for `__tsd`, `console-pipe`, TanStack devtools runtime names, and JSX dev-runtime names | PASS/ABSENT | No matches found in `.output` or Nitro SSR output. |
| Idle behavior | LIMITED PASS | The preview server stayed running after 60 seconds idle. This HTTP-only probe did not show a preview crash or request-loop symptom, but it cannot observe browser-initiated background requests. |

Manual preview checks not executed in this pass:

- Browser Network panel with Preserve log off.
- Authenticated login flow request count.
- Role switch request count.
- Ajukan Dokumen browser request count for `/api/master-fungsi`.
- Logout/login browser request count.
- DevTools-closed perceived lag.
- CPU, JS heap, DOM node, and event listener before/after measurements.

Devtools and dev-mode classification:

- Active source still imports and renders TanStack devtools in `src/routes/__root.tsx`.
- `pnpm build` reported `[@tanstack/devtools-vite] Removed devtools code from: /src/routes/__root.tsx`.
- Preview output grep found no `__tsd`, `console-pipe`, `TanStackDevtools`, `TanStackRouterDevtools`, `react/jsx-dev-runtime`, `jsxDEV`, or `jsxDevRuntimeExports` matches.
- A direct preview request to `/__tsd/console-pipe` returned `404`.
- Current classification for `/__tsd/console-pipe` and `/__tsd/console-pipe/sse`: dev-only tooling overhead, not a proven production-preview runtime issue.

Repeated request and duplicate fetch audit:

- `AppLayout` fetches `/api/auth/session` once on mount through `fetchSession()`, then fetches `/api/users/me/ketua-tim` after a valid session. Role switch uses `/api/auth/role-switch` and then assigns `window.location.href`, which causes a full app reload and a new session bootstrap. Repeated `/api/auth/session` around login/logout/role switching is therefore expected unless it continues while idle.
- Route/page data loading is mostly `useEffect` + `apiFetch`/`fetch`, not TanStack Query. No `useQuery`, `useSuspenseQuery`, `queryFn`, `retry`, `staleTime`, `gcTime`, or `enabled:` usage was found in the audited active source paths.
- Ajukan Dokumen has one mount-time `/api/master-fungsi` effect in `src/routes/pegawai/dokumen/aju.tsx`; no route loader for the same endpoint was found. A two-call observation in `pnpm dev` is most likely React/dev remount or tooling behavior unless reproduced in preview browser smoke.
- `KelengkapanChecklist` fetches `/api/master-kelengkapan` when the upload step mounts and when its document-chain props change; this is navigation/step-driven, not an idle loop.
- Several list pages intentionally refetch when filters change, for example PPK/Bendahara/Arsiparis inbox/list pages and report filters.
- Current duplicate-fetch classification: non-blocking P1 optimization candidate, not a blocker, unless manual preview smoke proves severe lag or idle repeated calls.

Listener/timer audit:

- No active `setInterval`, `EventSource`, or `WebSocket` usage was found in `src/routes`, `src/components`, or `src/lib`.
- Audited `addEventListener` usage has matching `removeEventListener` cleanup in the same effect for storage, keyboard, mousedown, and modal/viewer handlers.
- Timeout usage is one-shot UI cleanup or abort/revoke behavior; no uncontrolled timer loop was found.
- Current leak classification: no proven memory/listener leak from source audit. Manual heap/DOM/listener measurements remain pending.

Supabase cleanup audit:

- Active grep over `src`, `tests`, `package.json`, and `pnpm-lock.yaml` found no `@supabase/*` runtime/package matches.
- Active grep over `src` and `tests` found no Supabase env constant matches.
- Nitro preview still prints env variable names loaded from `.env` in preview mode, including historical Supabase names, but no values were printed by this audit and active source/package grep remains clean.

Process/protected-file notes:

- Initial worktree already had `.env` modified before this audit.
- Initial `git diff --check` failed due whitespace in `.env`; this was not edited or repaired in this phase.
- Build did not modify `src/routeTree.gen.ts`, package files, DB, Drizzle, Supabase, source, or tests.

Performance classification:

- `pnpm dev` long-session slowdown remains plausibly dev-only tooling overhead plus expected Chrome Network accumulation, especially for the `/__tsd/console-pipe*` requests.
- Bounded preview validation is stable for unauthenticated root/session/master-data probes and does not show a preview startup crash, `pg-native` regression, JSX dev-runtime regression, or direct `__tsd` endpoint.
- No real preview/runtime request loop was proven.
- No real memory/listener leak was proven.
- Duplicate navigation fetches remain a P1 optimization item, not a blocker based on current evidence.

Go/no-go rule for 11G:

- Phase 11G is not blocked by the Phase 11F.4c bounded audit because no preview blocker was found.
- Phase 11G may proceed with documented non-blocking performance follow-up if the human accepts that browser DevTools long-session checks remain pending, but Phase 11F.5 is the recommended post-smoke stabilization slice first if the human wants fewer visible bugs before LAN hardening.
- If a manual authenticated preview session later shows API calls continuing while idle, unbounded heap/listener/DOM growth, or severe preview navigation lag, stop Phase 11G and open `Phase 11F.4d Targeted Preview Performance Fix`.
- This does not claim final release readiness or final scalability/performance certification; final 11G/11H approval remains human-controlled.

## Phase 11F.5 Post-Smoke Stabilization Planning

Date: 2026-05-20.

Status: docs-only planning section. No runtime bugs are fixed here, and 11G is not complete.

Purpose:

- Split the remaining human-smoke and Lighthouse findings into safe, bounded stabilization subphases before LAN/operations hardening.
- Keep severity based on operational impact and internal DMS tolerance, not Lighthouse/UI perfection alone.
- Preserve the rule that `.env` and `.env.migration` are human-controlled and must not be printed, modified, or committed.
- Avoid new product features before 11H, or at least before a human 11G/11H decision explicitly accepts them.
- Do not rename or redesign `/pegawai/dokumen` versus `/pegawai/inbox` in this stabilization pass.

Severity classification:

| ID | Severity | Domain | Summary | Recommended subphase |
|---|---|---|---|---|
| 11F5-001 | P1 before LAN if fewer bugs are desired | Auth/UI | Fixed pending human retest: logout success now clears authenticated UI/loading state and redirects to login after the logout API returns. | 11F.5a |
| 11F5-002 | P1 before LAN if fewer bugs are desired | Auth/session UX | Fixed pending human retest: successful self password change revokes all current-user sessions, clears auth cookies/client state, and redirects to login. | 11F.5a |
| 11F5-003 | P1 before LAN if fewer bugs are desired | Arsiparis master data | Fixed pending human retest: Master Klasifikasi add/edit/delete modal save state now clears after success, validation/API errors, thrown exceptions, and refresh failures. | 11F.5b |
| 11F5-004 | P1 before LAN if fewer bugs are desired | Master data validation | Fixed pending human retest: Master Kelengkapan rejects duplicate active rows in the same kegiatan, ketua-tim flag, and request-chain leaf/scope. | 11F.5c |
| 11F5-005 | P1 before LAN if feasible | Document form validation | Fixed pending human retest: Ajukan/Revisi/PPK resubmit additional kelengkapan duplicate names are blocked with normalized comparison. | 11F.5c |
| 11F5-006 | P1 storage safety | Attachment replacement cleanup | Fixed pending human retest: old formal files are deleted only after successful edit/revisi/PPK resubmit persistence and only when no current document/archive reference protects them. | 11F.5d |
| 11F5-006b | P1 storage safety | Superseded pending replacement cleanup | Fixed pending human retest: multiple replacement attempts in one edit session now track and clean superseded pending uploads without deleting old formal files before persistence. | 11F.5d.1 |
| 11F5-007 | P1/P2 depending on human tolerance | Forbidden UX/RBAC UX | Fixed pending human retest: `/pegawai/dokumen` now has a blocking assigned-PEGAWAI route wrapper check before child document-list fetch. | 11F.5g |
| 11F5-008 | P2 polish before final release | Master data UI | Kategori Permintaan filter layout should match Master Kegiatan. | 11F.5e |
| 11F5-009 | P2 polish before final release | Master data UI | Kategori add form should prefill jenis permintaan from active filter. | 11F.5e |
| 11F5-010 | P2 polish before final release | Master data UI | Detail Permintaan has the same filter/prefill consistency issue as Kategori. | 11F.5e |
| 11F5-011 | P2 audit/polish | Guard logging | Fixed pending human retest: guard logs now label required route roles separately from actual user roles and active UX role. | 11F.5g |
| 11F5-012 | P2 polish before final release | Accessibility | Missing accessible names, contrast, heading order, duplicate link purpose, and manual focus/landmark checks. | 11F.5f |
| 11F5-013 | P2 optimization unless severe preview lag is reproduced | Performance | Admin Lighthouse TBT around 430ms. | 11F.5f or later optimization |
| 11F5-014 | P3 future cleanup | Route naming/design | `/pegawai/dokumen` versus `/pegawai/inbox` naming cleanup. | Defer |
| 11F5-015 | P1 route/default UX | Pegawai canonical dashboard route | Fixed pending human retest: `/pegawai` now renders the Pegawai dashboard, and `/` remains a role-default compatibility redirect. | 11F.5h |

Subphase plan:

| Phase | Goal | Allowed scope | Non-goals | Primary files to inspect | Validation gates | Manual smoke checklist | Must not change |
|---|---|---|---|---|---|---|---|
| 11F.5a Logout UI Loading And Password Change Auto Logout | Fix logout loading and force reauth after successful self password change. | Auth UI state, auth-state cleanup, logout/change-password client handling, existing auth API response handling if needed. | No auth model redesign, no session weakening, no password-policy feature work, no DB/package/env/routeTree changes. | `AppLayout`, `auth-state`, login/profile/change-password UI, `/api/auth/logout`, change-password API. | Logout clears loading; successful password change revokes current session; failed password change keeps session. | Login/logout/reload; change password; confirm authenticated request fails until login. | DB, migrations, seeds, packages, env, route tree, Supabase, unrelated auth flows. |
| 11F.5b Master Klasifikasi Save Loading Fix | Ensure classification save exits loading for second-child/error paths. | Narrow Arsiparis classification UI and existing classification API handling. | No archive lifecycle redesign or tree schema rewrite. | Arsiparis klasifikasi UI and `/api/arsiparis/klasifikasi/*`. | First child and second child save paths finish; error path clears loading. | Add child, add sibling/second child, attempt invalid duplicate/error path, reload tree. | Archive lifecycle, storage, DB migrations/seeds, packages, env, route tree. |
| 11F.5c Kelengkapan Duplicate Validation | Prevent duplicates according to current business expectations. | Narrow UI/server validation for Master Kelengkapan and Ajukan/Revisi additional kelengkapan. | No generalized validation framework or DB unique-index migration. | Admin Master Kelengkapan UI/API, Pegawai Ajukan/Revisi forms, submit/revisi validation schemas. | Duplicate same-leaf ketua-tim kelengkapan rejected; duplicate additional kelengkapan rejected; valid flows still work. | Try duplicate/non-duplicate master entries; try duplicate additional kelengkapan in Ajukan/Revisi; submit valid document. | DB schema, global validation architecture, route names, workflow statuses, audit behavior. |
| 11F.5d Attachment Replacement Old File Cleanup | Delete superseded local formal files only after successful edit/revisi/save/resubmit persistence. | Attachment replacement lifecycle in `AttachmentEditor`, Pegawai edit/revisi, PPK resubmit routes, and tiny local cleanup helper/test coverage. | No broad storage redesign, global orphan cleanup redesign, archive lifecycle redesign, DB schema, route generation, package/env, or Supabase fallback. | `AttachmentEditor`, `/api/dokumen/$id`, `/api/ppk/resubmit/$id`, local storage helpers. | Old file remains before submit and on failure; old replaced formal file is removed only after DB success; protected current/archive references are not deleted. | Replace and cancel; replace and submit; force validation failure; repeat PPK resubmit if available; confirm archive behavior unchanged. | Env, packages, route tree, DB/migrations/seeds, Supabase folders, archive destruction semantics. |
| 11F.5d.1 Superseded Pending Replacement Cleanup | Clean pending replacement files superseded before submit/cancel. | Session-scoped pending upload tracking in `AttachmentEditor`, existing pending cleanup API, and focused helper tests. | No broad upload-session manager, global orphan cleanup framework, DB schema, route generation, package/env, Supabase fallback, or archive lifecycle redesign. | `AttachmentEditor`, pending cleanup helper/tests, existing `/api/upload?cleanup=pending`. | Replacing A then B cleans A or keeps it tracked for cancel/submit cleanup; cancel/reset removes all session pending uploads; failed submit preserves the current pending replacement and old formal file. | Replace with A, replace with B, cancel; repeat and submit; force failed submit; repeat PPK resubmit if available. | Env, packages, route tree, DB/migrations/seeds, Supabase folders, old formal pre-persistence deletion. |
| 11F.5e Kategori/Detail Master Data Consistency | Align Kategori/Detail filters and add-form prefill with Master Kegiatan. | UI-only layout and form-state consistency. | No API rewrite, hierarchy redesign, route rename, or broad admin redesign. | Admin Master Kegiatan, Kategori, Detail pages and shared admin UI components. | Active parent filter preselects add form; reset/edit behavior remains compatible. | Filter Kategori and add; filter Detail and add; clear filters; edit/deactivate where supported. | API paths, DB schema, route tree, package/env, unrelated pages. |
| 11F.5f Accessibility And Lighthouse Polish | Reduce accessibility findings with narrow semantic/focus fixes. | Button/link labels, contrast, heading order, identical link purpose, focus/landmark checks; bounded Admin TBT classification. | No broad UI redesign or performance architecture rewrite. | Lighthouse-flagged pages, shared button/link/dialog/layout components. | Accessibility findings reduced or documented; keyboard and focus behavior safe; TBT remains classified unless severe lag appears. | Lighthouse target Admin page; keyboard-tab login/Admin/master-data; modal focus trap/return. | Workflow behavior, RBAC visibility, API contracts, route names, DB/package/env/routeTree. |
| 11F.5g Forbidden UX And Guard Dev Log Cleanup | Clean unauthorized route UX and misleading guard logs without weakening RBAC. | Client/page forbidden handling and guard/dev log cleanup. | No RBAC broadening, no ADMIN submit compatibility, no hiding 403 by granting data, no route rename. | `AppLayout`, guards, navigation config, `/pegawai/dokumen` page, `/api/dokumen` only for verification. | Admin gets clean forbidden UX; server still rejects unauthorized API; logs show actual roles only. | Admin opens `/pegawai/dokumen`; PEGAWAI+PPK role switch logs; direct unauthorized API check. | Server RBAC except confirmed bug fix, role model, route names, DB/package/env/routeTree. |
| 11F.5h Pegawai Canonical Route Alignment | Make `/pegawai` the canonical Pegawai dashboard/default route. | Existing Pegawai dashboard route ownership, default-route constants, login/role-switch redirects, and root compatibility redirect. | No `/pegawai/dokumen` rename, no RBAC broadening, no route generation, no API/DB/storage/package/env changes. | Root route, existing `/pegawai` parent route, navigation/default-route config, login redirect. | `/pegawai` renders Pegawai dashboard for assigned PEGAWAI; `/` redirects by active/assigned role; Admin/non-Pegawai get forbidden; unauthenticated users go to login. | Login as PEGAWAI/Admin/PPK/Bendahara/Arsiparis; open `/pegawai` and `/`; switch PEGAWAI/PPK active role; confirm no blank page or loop. | API routes, server RBAC, route tree, DB/migrations/seeds/scripts, package/env files, Supabase fallback. |
| 11F.6 Final Post-Stabilization Regression Recap | Record post-stabilization state before 11G. | Docs/report plus lightweight validation evidence. | No production certification, no LAN deployment claim, no backup/restore completion claim. | Migration docs and validation outputs. | `pnpm test`/`pnpm build` if runtime phases ran; preview probes if build/runtime changed; protected-file audit clean. | Auth, admin, Pegawai, PPK, Bendahara, Arsiparis, storage/file access, forbidden UX, accessibility touched pages. | Do not convert recap into 11G evidence or final release authority. |

Performance and accessibility guardrails:

- Preview performance is not currently a blocker based on 11F.4c.
- Duplicate fetches and Admin TBT are optimization candidates unless authenticated preview smoke proves severe user-visible lag.
- Accessibility stabilization should prefer narrow semantic, ARIA, focus, contrast, heading, and label fixes over broad UI redesign.

Recommended next phase:

```text
Phase 11F.6 Final Post-Stabilization Regression Recap after human retest acceptance
```

## Phase 11F.5a Logout UI Loading And Password Change Auto Logout

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser retest. Do not claim full Phase 11F.5 complete.

Fix summary:

- Logout now clears the loading state after the confirmed logout API response, clears client authenticated state, clears the readable active-role UX cookie, and redirects to `/login`.
- Logout no longer clears authenticated client state when the logout API call fails; the user remains in the existing authenticated UI instead of creating a fake client-only logout.
- Successful self-service password change now keeps the existing response body shape, but also returns `Set-Cookie` headers that clear `dms_session` and `dms_active_role`.
- The self-service password policy remains all-session revocation through `revokeAllUserSessions(userId)` after a successful hash update.
- The profile page clears per-tab client auth state only after a successful password-change response and redirects to `/login?password_changed=1`.
- Failed password-change validation/API responses keep the current session and show the existing safe error path.

Manual retest checklist:

1. Login as a normal local user.
2. Click logout.
3. Confirm network logout returns `200`.
4. Confirm UI leaves the loading state.
5. Confirm the user reaches login/unauthenticated UI.
6. Reload browser and confirm still unauthenticated.
7. Login again.
8. Change password with invalid current password or invalid input.
9. Confirm a safe error is shown and the user remains authenticated.
10. Change password successfully.
11. Confirm the user is forced to login/reauthenticate.
12. Reload browser and confirm auth is not silently preserved.
13. Try an authenticated page/API after password change before login; confirm access requires login.
14. Login with the new password and confirm access works.

Known follow-up note:

- Already-open tabs may still show stale client-rendered UI until reload or their next authenticated request, but the server-side session rows are revoked and protected APIs should require login after the successful password change.

## Phase 11F.5b Master Klasifikasi Save Loading Fix

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser retest. Do not claim full Phase 11F.5 complete.

Root cause:

- The Master Klasifikasi add/edit/delete modals stay mounted even when closed because they return `null` while preserving React hook state.
- The successful mutation paths called `onSuccess()` and closed the modal without clearing the modal-level `loading` flag.
- Reopening the add-child modal for the same parent could reuse the preserved `loading=true` state, leaving `Simpan` permanently disabled/spinning before the next submit.

Fix summary:

- Add, edit, and delete modal mutation handlers now clear their modal loading state in `finally`.
- Modal open state now resets stale error/loading state, so retries and same-parent second-child additions start from a clean form state.
- Successful saves now await the tree refresh before closing the modal, and the refreshed tree is used when preserving the current selection.
- Classification API database validation/write paths now return controlled JSON for duplicate, invalid parent, missing node, unauthorized, and server-error paths instead of allowing pre-write database errors to escape.
- Endpoint paths, request payloads, normal success shapes, duplicate/validation error shapes, and ADMIN/ARSIPARIS authorization semantics are preserved.

Manual retest checklist:

1. Login as Arsiparis or another allowed user.
2. Open `/arsiparis/klasifikasi`.
3. Add a child classification.
4. Confirm save completes and `Simpan` leaves loading state.
5. Add another child under the same parent.
6. Confirm save completes or fails with visible feedback and loading clears.
7. Add a sibling if applicable.
8. Try duplicate name or duplicate kode if the UI permits it.
9. Confirm duplicate/error feedback appears and loading clears.
10. Retry after a failed save and confirm the dialog remains usable.
11. Reload the page and confirm the classification tree remains consistent.
12. Confirm archive lifecycle pages are not affected.

Validation note:

- No focused automated UI test was added because this is a modal hook-state/browser interaction and the existing test harness does not expose a low-risk targeted classification UI test. Manual browser retest is required.

## Phase 11F.5c Kelengkapan Duplicate Validation

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser retest. Do not claim full Phase 11F.5 complete.

Root cause:

- Master Kelengkapan POST/PATCH validated required fields and request-chain consistency, but did not check existing rows for the same normalized name in the same kegiatan, ketua-tim flag, and chain scope.
- Ajukan, Pegawai Revisi, and PPK resubmit allowed multiple user-created `user-custom-*` kelengkapan labels with equivalent names when whitespace/case differed.
- Submit/revisi/resubmit request schemas validated individual lampiran rows but did not validate duplicate additional kelengkapan names across the submitted `lampiranUrls` array.

Fix summary:

- Added scoped name normalization for kelengkapan duplicate checks: trim, collapse repeated whitespace, and lowercase.
- `POST /api/master-kelengkapan` and `PATCH /api/master-kelengkapan/$id` now reject duplicates in the same kegiatan, ketua-tim flag, and exact request-chain scope with `409 { error: 'Kelengkapan sudah ada untuk detail permintaan dan tipe ini' }`.
- The Admin Master Kelengkapan modal performs a safe loaded-list duplicate pre-check for faster feedback, while server validation remains authoritative.
- Ajukan Dokumen blocks duplicate user-added kelengkapan names in `KelengkapanChecklist`.
- Pegawai Revisi and PPK resubmit block duplicate user-added kelengkapan names in `AttachmentEditor`.
- Submit, update/revisi, and PPK resubmit request schemas now reject duplicate `user-custom-*` lampiran names without changing payload field names or response shapes.
- Existing `lampiran_urls` parsing remains lenient for stored historical data; duplicate validation is applied at request boundaries, not response parsing.

Focused automated validation:

- `pnpm test tests/unit/kelengkapan-duplicate-validation.test.ts` passed.

Manual retest checklist:

1. Login as Admin.
2. Open `/admin/master-data/kelengkapan`.
3. Select fungsi, kegiatan, and a complete request-chain leaf.
4. Add a Ketua Tim kelengkapan, then attempt the same name with different case or extra spaces in the same leaf/scope.
5. Confirm duplicate is rejected with clear feedback and `Simpan` leaves loading state.
6. Try the same normalized name under a different allowed scope, for example a different chain leaf or different ketua-tim flag, if current data allows it.
7. Confirm valid non-duplicate Master Kelengkapan still saves.
8. Login as Pegawai.
9. Open Ajukan Dokumen and add duplicate additional kelengkapan names with case/space variations.
10. Confirm duplicates are prevented before submit with clear feedback.
11. Submit a valid Material document after validation changes.
12. Open Pegawai Revisi and attempt duplicate additional kelengkapan names.
13. Confirm duplicates are prevented and a valid revisi can still be submitted.
14. If PPK resubmit is available, attempt duplicate additional kelengkapan names there too and confirm prevention.
15. Confirm preview, download, upload, pending cleanup, and file movement behavior remain unchanged.

## Phase 11F.5d Attachment Replacement Old File Cleanup

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser/storage retest. Do not claim full Phase 11F.5 complete.

Root cause:

- `AttachmentEditor` correctly uploaded a replacement to a pending local path and kept the old formal file during editing.
- Server update/resubmit routes formalized pending replacements and persisted new `lampiran_urls`, but did not clean up the old formal path that was no longer referenced after successful persistence.
- Existing cancel/reset cleanup was pending-only, so it did not cause the data-loss risk; the gap was missing post-success cleanup.

Fix summary:

- Added a local replaced-attachment cleanup helper that compares old persisted attachment paths with newly persisted paths.
- Cleanup runs only after successful Pegawai edit/revisi DB update or PPK save/resubmit transaction.
- Cleanup deletes only safe local `formal` paths that are no longer referenced.
- Cleanup loads a DB reference guard from current `dokumen_transaksi.lampiran_urls` and retained `arsip.lampiran_snapshot` before deleting, so current document metadata and archive snapshots protect files.
- Missing old local files are treated as a no-op, and unsafe, pending, or legacy/protocol-like paths are skipped without Supabase fallback.
- Cleanup warnings include only safe counts/codes and document id/context, not physical paths or storage roots.

Focused automated validation:

- `pnpm test tests/unit/storage/local-attachment-replacement-cleanup.test.ts` passed.

Manual retest checklist:

1. Count current files for a test document/storage scope.
2. Login as Pegawai.
3. Open edit/revisi for a document with one existing file.
4. Replace that file with a new file.
5. Do not submit; cancel/reset if available.
6. Confirm the old file still exists and remains previewable.
7. Repeat replacement and submit successfully.
8. Confirm the document now points to the new file.
9. Confirm the old replaced file is removed from local storage or cleanup evidence shows it is gone.
10. Confirm total file count does not increase when replacing one file without adding kelengkapan.
11. Confirm preview/download for the new file works.
12. Confirm a missing old local file does not break submit.
13. Confirm failed validation/submit does not delete the old file.
14. If PPK resubmit can replace files, repeat replacement there.
15. Confirm archive and `DIMUSNAHKAN` behavior is unaffected.

## Phase 11F.5d.1 Superseded Pending Replacement Cleanup

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser/storage retest. Do not claim full Phase 11F.5 complete.

Root cause:

- `AttachmentEditor` tracked pending replacements in `pendingFiles: Map<docId, PendingFile>`, so selecting replacement B for the same attachment overwrote replacement A.
- Cancel/reset cleanup only iterated the latest `pendingFiles` values, and the submit payload includes only the current `lampiranUrls` state, so superseded pending uploads were no longer visible to cleanup.
- This was a pending-upload lifecycle gap; old formal file cleanup from 11F.5d remained correctly post-persistence only.

Fix summary:

- Added session-scoped pending upload URL tracking for every upload response created during one editor session.
- Replacing the same attachment again now cleans the previous pending URL when it is no longer referenced by current form state.
- Reset and cancel cleanup now operate on all session-created pending URLs, not only the latest `pendingFiles` map entries.
- Submit attempts clean definitely unreferenced superseded pending URLs before persistence so immediate post-save navigation cannot strand them.
- Submit success clears session tracking; submit failure preserves the old formal file and the currently selected pending replacement for retry.
- Pending deletion still goes through `POST /api/upload?cleanup=pending`, which rejects formal, unsafe, owner-mismatched, and unsupported paths before filesystem mutation.

Focused automated validation:

- `pnpm test tests/unit/storage/pending-upload-session.test.ts tests/unit/storage/local-attachment-replacement-cleanup.test.ts` passed.

Manual retest checklist:

1. Start with a document that has one existing formal file.
2. Open edit/revisi.
3. Replace file with file A.
4. Without submit/reset, replace again with file B.
5. Confirm storage does not retain file A after cleanup point, or confirm cancel/submit cleanup removes A.
6. Cancel/reset.
7. Confirm old formal file remains previewable.
8. Confirm both pending file A and pending file B are removed.
9. Repeat: replace with A, replace with B, then submit successfully.
10. Confirm document points to B/new persisted file.
11. Confirm old formal file is removed after success.
12. Confirm superseded pending A is removed.
13. Confirm no extra pending files remain.
14. Confirm preview/download for new file works.
15. Try failed validation/submit after multiple replacements.
16. Confirm old formal file remains and current pending behavior remains retry-safe.
17. If PPK resubmit supports file replacement, repeat the multiple-replacement flow there.

## Phase 11F.5d.2 Admin Storage Orphan Cleanup Diagnostics Hardening

Date: 2026-05-20.

Status: targeted fix implemented; pending human admin/storage retest. Do not claim full Phase 11F.5 complete.

Root cause:

- The admin cleanup route reported pending local files but intentionally excluded them from cleanup candidates through `pending_only=true`, leaving old pending leftovers from earlier tests as report-only even when clearly unreferenced.
- The diagnostics helper classified pending files but did not expose age/eligibility information, so the route could not distinguish old orphan pending leftovers from files that may still belong to an active edit/revisi/resubmit session.

Fix summary:

- Storage analysis still compares local logical filesystem paths against current `dokumen_transaksi.lampiran_urls` and retained `arsip.lampiran_snapshot` references before classifying anything as orphan.
- Analyze responses remain logical-path-only and now include pending path age details, default pending eligibility counts, `eligible_pending_paths`, and `recent_pending_paths`.
- Cleanup keeps `dry_run=true` by default.
- Non-pending formal orphan cleanup remains available with `dry_run=false`.
- Pending cleanup is opt-in only and requires `dry_run=false`, `include_pending=true`, `confirm=true`, and `min_age_minutes` eligibility. The default minimum age is 1440 minutes.
- `pending_only=true` scopes cleanup/reporting to pending candidates; without the explicit pending deletion flags it remains report-only.
- Missing files are no-op, unsafe/unsupported paths are skipped safely, and failures report safe logical paths/codes only.

Safe usage examples:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/analyze-storage" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cleanup-orphan-files?dry_run=true" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cleanup-orphan-files?pending_only=true&dry_run=true" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cleanup-orphan-files?dry_run=false" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cleanup-orphan-files?pending_only=true&include_pending=true&min_age_minutes=1440&dry_run=false&confirm=true" -WebSession $session
```

Manual retest checklist:

1. Login as Admin.
2. Call `/api/admin/analyze-storage`.
3. Confirm the response shows logical paths only.
4. Call `/api/admin/cleanup-orphan-files?dry_run=true`.
5. Confirm no files are deleted.
6. Call `/api/admin/cleanup-orphan-files?pending_only=true&dry_run=true`.
7. Confirm recent pending files are reported/skipped and not deleted by default.
8. Create or identify an old orphan test file only if it is safe and unreferenced.
9. Run destructive formal cleanup only with `dry_run=false`.
10. Run destructive pending cleanup only with `pending_only=true&include_pending=true&min_age_minutes=1440&dry_run=false&confirm=true`.
11. Confirm referenced document files remain.
12. Confirm archive snapshot referenced files remain, including retained `DIMUSNAHKAN` snapshots.
13. Confirm `deleted_count` matches actual deleted local files.
14. Confirm no physical paths, storage roots, env values, secrets, tokens, hashes, DB URLs, or file contents appear in responses or logs.

## Phase 11F.5e Kategori/Detail Master Data Consistency

Date: 2026-05-20.

Status: targeted fix implemented; pending human admin UI retest. Do not claim full Phase 11F.5 complete.

Root cause:

- Master Kegiatan already prefilled its parent field from the active filter when opening the add dialog.
- Kategori Permintaan always defaulted the add dialog to the first Jenis Permintaan instead of the active Jenis filter.
- Detail Permintaan kept filter controls visually different from the Master Kegiatan pattern and could clear the loaded kategori list when no Jenis filter was active, which made add defaults and edit parent resolution depend on stale/incomplete UI state.

Fix summary:

- Kategori Permintaan filter controls now follow the Master Kegiatan filter row pattern, with the parent dropdown first and search second.
- Kategori add mode now preselects the active Jenis filter when present, otherwise it falls back to the existing first-Jenis default.
- Detail Permintaan filter controls now follow the same parent-dropdown-first pattern for Jenis, Kategori, then search.
- Detail add mode now preselects the active Kategori filter when present, derives the matching Jenis from that kategori, or uses the active Jenis filter with the first matching kategori.
- Detail keeps the full kategori list available for add/edit parent resolution, while the filter UI still clears invalid kategori filters when the Jenis filter changes.
- Edit mode remains row-sourced: Kategori edit uses the row's `jenis_permintaan_id`, and Detail edit uses the row's `kategori_permintaan_id` plus the kategori's actual Jenis.
- No API routes, request payload fields, response shapes, DB schema, storage, auth, route generation, package files, or env files were changed.

Manual retest checklist:

1. Login as Admin.
2. Open Master Kegiatan and observe the parent-filter-first layout pattern.
3. Open Kategori Permintaan.
4. Filter Kategori by one Jenis Permintaan.
5. Click Tambah.
6. Confirm Jenis Permintaan is preselected from the active filter.
7. Submit a valid Kategori or cancel safely.
8. Clear the Jenis filter.
9. Click Tambah again and confirm the default Jenis state is sensible.
10. Edit an existing Kategori and confirm its parent Jenis matches the row, not a stale active filter.
11. Delete/deactivate Kategori if currently supported and confirm behavior is unchanged.
12. Open Detail Permintaan.
13. Filter by Jenis, then optionally by Kategori.
14. Click Tambah.
15. Confirm parent fields are preselected consistently from the active filter context.
16. Clear filters and confirm add form default state is sensible.
17. Edit an existing Detail and confirm parent fields match the row, not stale filter state.
18. Delete/deactivate Detail if currently supported and confirm behavior is unchanged.

## Phase 11F.5f Accessibility And Lighthouse Polish

Date: 2026-05-20.

Status: targeted accessibility polish implemented; pending human Lighthouse and keyboard retest. Do not claim full accessibility compliance until browser evidence is recorded.

Root cause / findings addressed:

- Several icon-only controls in shared layout, admin master-data tables, role document lists, attachment previews, and custom archive/classification dialogs had either no accessible name or a generic repeated name.
- Admin table row actions were hidden with opacity until mouse hover, which made keyboard focus less discoverable even when the controls were technically tabbable.
- Layout branding/navigation labels used heading tags, which could pollute document heading order before the page title.
- Admin master-data page titles were visually top-level headings but used `h2`.
- Some repeated "Lihat detail" / "Lihat" links had identical accessible purpose without row context.
- A few obvious status/success text classes used low-contrast gray/green combinations.
- Admin Lighthouse TBT around 430ms remains classified as P2 optimization unless severe authenticated preview lag is reproduced.

Fix summary:

- Added row-specific `aria-label` values to admin master-data edit/delete/reset/status action buttons.
- Added row-specific labels to repeated document/archive detail and report links.
- Added accessible labels to shared header notification/settings/search, user menu, role switcher, pagination icon buttons, and attachment/preview close controls.
- Made admin table hover-only action groups visible on keyboard focus with `focus-within:opacity-100`.
- Converted decorative layout headings in the header/sidebar to non-heading elements and promoted admin master-data page titles to `h1`.
- Added `role="menu"`/`role="menuitem"` semantics to simple user/role dropdowns and `role="dialog" aria-modal="true"` to touched custom preview/classification modals.
- Improved obvious low-contrast success/status text from pale green/gray to darker existing utility colors.
- No API routes, DB schema, storage, auth, package files, env files, route generation, or workflow behavior changed.

Manual retest checklist:

1. Login as Admin in preview.
2. Run Lighthouse on the Admin page that previously scored low.
3. Confirm "buttons do not have an accessible name" findings are reduced on Admin/master-data pages.
4. Confirm contrast findings are reduced for success/status text touched by this phase.
5. Inspect heading order on Admin/master-data pages; page title should be the top-level heading.
6. Tab through header search, notification/settings buttons, role switcher, user menu, Admin dashboard, and Admin master-data tables.
7. Confirm row action buttons become visible when keyboard focus reaches them.
8. Open add/edit/delete/reset dialogs and confirm close/cancel/save buttons are keyboard reachable.
9. Open archive/document preview dialogs touched by this phase and confirm the close button has a meaningful accessible label.
10. Confirm repeated "Lihat" / "Lihat detail" actions announce row-specific document/archive context.
11. Confirm visual hierarchy remains recognizable and no layout redesign occurred.
12. Record post-fix Accessibility and Performance scores.
13. If Admin TBT remains around 430ms but no severe lag exists, keep it as a P2 optimization backlog item.

Known remaining non-blockers:

- Custom non-library modals received labels and modal roles where touched, but full focus-trap/return behavior still requires human keyboard retest.
- Broader app-wide heading normalization outside the targeted Admin/master-data and touched preview surfaces remains deferred unless Lighthouse identifies a concrete page/node.
- Admin TBT was not rewritten in this phase; no architecture-level performance work was attempted.

## Phase 11F.5g Forbidden UX And Guard Dev Log Cleanup

Date: 2026-05-20.

Status: targeted fix implemented; pending human browser retest. Do not claim full Phase 11F complete.

Root cause / findings addressed:

- `/pegawai/dokumen` had only a layout wrapper, while PPK/Bendahara/Arsiparis role areas had parent route guards or client role checks.
- The Pegawai document list fetched `/api/dokumen` directly after mount, so an Admin session could reach the page-level fetch path and render the API's correct `403` as a raw page error.
- The server/API behavior was already correct: `GET /api/dokumen` uses local `dms_session`, requires assigned `PEGAWAI`, and filters rows by `created_by=session.user.id`.
- Guard dev logs used ambiguous role labels, so a required route role such as `ARSIPARIS` could be misread as an actual user role.

Fix summary:

- Added a `/pegawai/dokumen` parent route guard using the existing `guardRole(PEGAWAI)` pattern.
- Added a blocking client assigned-role check in the same Pegawai document wrapper before rendering child routes, preventing the document-list child from fetching `/api/dokumen` before the route eligibility check resolves.
- Unauthorized users are redirected to `/forbidden`; missing sessions still redirect to `/login`.
- Multi-role users with assigned `PEGAWAI` remain eligible for `/pegawai/dokumen` even when their active UX role is another assigned role.
- Guard logs now distinguish `userRoles`, `activeUxRole`, and `requiredRouteRole`; they do not label required route roles as actual user roles.
- `GET /api/dokumen` was audited only and left unchanged, so direct unauthorized API calls still return `403`.

Phase 11F.5g.1 follow-up:

- Human retest confirmed Admin now sees the forbidden page for `/pegawai/dokumen` and guard logs label `requiredRouteRole`, `userRoles`, and `activeUxRole` clearly.
- The same retest found a React warning about state updates before mount during the forbidden redirect transition.
- Root cause was the 11F.5g Pegawai wrapper's async `/auth/session` fallback calling local `setIsCheckingRole(false)` after the route transition path could already be moving away from the component.
- The wrapper now uses the already-bootstrapped client auth state synchronously and performs only redirect side effects from `useEffect`; it no longer fetches auth or updates local state.
- Unauthorized and not-yet-authorized states render only the local loading indicator, so child document routes still do not fetch `/api/dokumen` while a redirect is pending.

Manual retest checklist:

1. Login as Admin.
2. Open `/pegawai/dokumen`.
3. Confirm clean forbidden UX, preferably redirect to `/forbidden`.
4. Confirm the page no longer renders raw `/api/dokumen` fetch error.
5. Directly call `/api/dokumen` as Admin and confirm server still rejects with `403`.
6. Login as PEGAWAI and open `/pegawai/dokumen`.
7. Confirm Pegawai page still works.
8. Login as a PEGAWAI+PPK user if available.
9. Switch roles between PEGAWAI and PPK.
10. Inspect guard/dev logs.
11. Confirm logs mention only actual roles under `userRoles`, active UX role under `activeUxRole`, and required route roles under `requiredRouteRole`.
12. Confirm logs do not misleadingly say the user has ARSIPARIS.
13. Open `/ppk/inbox`, `/bendahara/inbox`, and `/arsiparis/inbox` with unauthorized users where feasible.
14. Confirm clean forbidden behavior remains.
15. Confirm console no longer shows `Can't perform a React state update on a component that hasn't mounted yet`.
16. Confirm no console errors/regressions.

Validation note:

- No focused automated test was added because the existing test inventory has auth helper and API/storage route tests but no low-risk React route wrapper harness for this client redirect race. Manual browser retest is required.

## Phase 11F.5h Pegawai Canonical Route Alignment

Date: 2026-05-20.

Status: targeted fix implemented; pending human route/browser retest. Do not claim full Phase 11F complete.

Root cause:

- `/` rendered the Pegawai dashboard directly and was still configured as the `PEGAWAI` default route.
- `/pegawai` existed only as a parent `Outlet` route, so opening it directly had no index content and appeared blank.
- Login success still sent all non-Admin users to `/`, so Pegawai never used the explicit role-dashboard path as the canonical route.

Fix summary:

- `ROLE_DEFAULT_ROUTE.PEGAWAI` now points to `/pegawai`.
- The existing `/pegawai` parent route now guards assigned `PEGAWAI`, renders the same `DashboardShell`/`StatsBento` dashboard at exact `/pegawai`, and preserves `Outlet` behavior for `/pegawai/*`.
- `/` now acts as a compatibility redirect that prefers a valid active UX role and otherwise falls back to the stable assigned-role order.
- Login success and role-switch defaults now use the default-route mapping so PEGAWAI lands on `/pegawai`, while PPK, Bendahara, Arsiparis, and Admin keep their explicit dashboard roots.
- `/pegawai/dokumen` route names and API/server RBAC were not changed.
- `src/routeTree.gen.ts` was not regenerated or modified.

Manual retest checklist:

1. Login as PEGAWAI.
2. Open `/pegawai`.
3. Confirm Pegawai dashboard displays and is not blank.
4. Open `/`.
5. Confirm it redirects to `/pegawai` or otherwise lands on the proper PEGAWAI default without blank page.
6. Login as Admin.
7. Open `/pegawai`.
8. Confirm clean `/forbidden` UX.
9. Open `/pegawai/dokumen`.
10. Confirm clean `/forbidden` UX and no raw `/api/dokumen` fetch error.
11. Directly call `/api/dokumen` as Admin and confirm 403.
12. Login as PPK, Bendahara, and Arsiparis where feasible.
13. Open `/` and confirm default redirects remain `/ppk`, `/bendahara`, `/arsiparis` respectively.
14. Login as PEGAWAI+PPK if available.
15. Switch active role and confirm role switch redirects use `/pegawai` for PEGAWAI and `/ppk` for PPK.
16. Confirm no redirect loop.
17. Confirm browser refresh on `/pegawai` works.
18. Confirm sidebar/navigation active state remains sensible.
19. Confirm no React warning or console errors.

Validation note:

- No focused automated test was added because this pass changed client route composition/default redirects and no low-risk route-render test harness exists in the current inventory. Manual browser retest is required.

## Phase 11F.6 Final Post-Stabilization Regression Recap

Date: 2026-05-20.

Status: post-stabilization recap complete for documentation purposes only. This is not Phase 11G, not final production certification, not LAN deployment approval, not backup/restore completion, and not final go-live readiness.

Validation scope:

- Codex ran only lightweight git/doc audits for this recap.
- `pnpm test`, `pnpm build`, preview/dev server, DB scripts, migrations, seeds, route generation, package commands, and E2E were not run by Codex in this phase.
- Earlier `pnpm test` PASS, `pnpm build` PASS, preview root/API probes, and active Supabase runtime/package/env-constant grep PASS remain recorded as prior human-run or prior phase evidence, not new 11F.6 agent-run validation.
- Human should run `pnpm test` after runtime changes and should run `pnpm build` before 11G. Preview root/API probes should remain stable before 11G if the human runs them.

11F.5 subphase outcomes:

| Subphase | Outcome |
|---|---|
| 11F.5a Logout UI Loading And Password Change Auto Logout | Implemented, human retested, and committed. |
| 11F.5b Master Klasifikasi Save Loading Fix | Implemented, human retested, and committed. |
| 11F.5c Kelengkapan Duplicate Validation | Implemented, tested/manual smoke accepted, and committed. |
| 11F.5d Attachment Replacement Old File Cleanup | Implemented, storage retested, and committed. |
| 11F.5d.1 Superseded Pending Replacement Cleanup | Implemented, storage retested, and committed; commit history groups this with the 11F.5d attachment cleanup commit. |
| 11F.5d.2 Admin Storage Orphan Cleanup Diagnostics Hardening | Implemented, dry-run/destructive cleanup retested, and committed; commit subject appears as admin storage orphan cleanup hardening. |
| 11F.5d.2b Pending-only dry-run response/message consistency | Human-reported implemented, retested, and committed as part of the admin storage cleanup hardening follow-up. |
| 11F.5e Kategori/Detail Master Data Consistency | Implemented, human retested, and committed. |
| 11F.5f Accessibility And Lighthouse Polish | Implemented, human retested, and committed. |
| 11F.5g Forbidden UX And Guard Dev Log Cleanup | Implemented, human retested, and committed. |
| 11F.5g.1 Pegawai Guard Redirect React Warning Cleanup | Implemented, human retested, and committed. |
| 11F.5h Pegawai Canonical Route Alignment | Implemented, human retested, and committed. |

Remaining classification:

| Priority | Scope | Status |
|---|---|---|
| P1 / 11G required | Backup/restore plan and test; LAN deployment runbook; operational env sanity without printing secrets; local storage backup/restore; local DB backup/restore; firewall/host/port/LAN access; CSRF/rate-limit/security review if planned; release rollback checklist. | Deferred to Phase 11G. |
| P1 / 11H required | Final release readiness gate; final Supabase retirement decision/handoff; production/go-live decision. | Deferred to Phase 11H and human-controlled. |
| P2/P3 deferred | Admin TBT optimization unless severe preview lag reproduces; broader app-wide accessibility polish beyond fixed Lighthouse findings; route naming cleanup beyond `/pegawai` canonical alignment if any remains; missing referenced file diagnostics refinement for `DIMUSNAHKAN` archive snapshots if still relevant. | Deferred; do not overclaim perfect accessibility, impossible bugs, or complete performance certification. |

Protected-file audit:

- `.env` and `.env.migration` are human-controlled and were not inspected, printed, edited, staged, or committed by this docs phase.
- `src/routeTree.gen.ts` must remain unchanged.
- Package files, DB/drizzle/supabase folders, source runtime files, tests, migrations, seeds, and scripts must remain unchanged for 11F.6.
- Historical Supabase references in docs remain migration history. Active source/runtime/package Supabase fallback/package/helper reintroduction remains forbidden.
- No old Supabase data/file migration, copy, download, backfill, sync, or recovery happened in this phase.

Next recommended phase:

```text
Phase 11G — Backup/Restore, LAN Deployment, And Operations Hardening
```

Phase 11G is not complete. Backup/restore, LAN deployment, CSRF/rate-limit review, operational hardening, and final release authority remain human-controlled. Do not start new product features before 11G/11H unless the human explicitly reprioritizes.

## Phase 11G Handoff

Deferred hardening phase after accepted 11F.5 stabilization state:

```text
Phase 11G  Backup/Restore, LAN Deployment, And Operations Hardening
```

Phase 11G is allowed after the bounded 11F.4c preview audit if the human accepts the remaining 11F.5 retest state, but the recommended next phase is now 11F.6 recap after human retest acceptance. Phase 11G is not complete until backup/restore, LAN, and security-hardening evidence is recorded.

Phase 11G should cover:

- Backup/restore drill for local PostgreSQL.
- Storage root backup and restore strategy.
- Backup metadata tying DB dump, storage archive, app commit, and env/config names together.
- Env secret rotation plan.
- Session and file token secret validation.
- LAN base URL, host binding, cookie `Secure` and `SameSite`, and firewall review.
- CSRF and rate-limit review for cookie-auth state-changing routes.
- Logging and error leakage review.
- Admin bootstrap and password provisioning runbook.
- Database migration/seeding runbook for the local target.
- Rollback runbook for app, DB, and storage.

Recommended final gate after Phase 11G:

```text
Phase 11H  Final Release Decision Or Production Readiness Gate
```

Phase 11H should be the human-controlled go/no-go decision after executed regression, backup/restore, LAN, and security-hardening evidence is available.
