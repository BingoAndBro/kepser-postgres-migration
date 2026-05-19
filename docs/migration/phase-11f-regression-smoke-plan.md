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

## Phase 11G Handoff

Recommended next phase:

```text
Phase 11G  Backup/Restore, LAN Deployment, And Operations Hardening
```

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
