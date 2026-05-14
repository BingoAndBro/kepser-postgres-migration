# Phase 5G Auth Regression And Retirement Plan

Date: 2026-05-14.

## Purpose

Phase 5G performs focused regression checks for the local custom-auth browser/runtime boundary after Phase 5F and records the remaining Supabase Auth retirement plan.

This phase is audit and documentation only. It does not migrate non-auth APIs, storage, workflow, archive behavior, database schema, seed data, generated routes, or Supabase dependencies.

## Initial Worktree Status

Initial command:

```powershell
git status --short --branch
```

Result:

```text
## migration/postgres-local
```

The worktree started clean.

## Files Reviewed

The audit reviewed the migration docs, current auth runtime files, local auth helper/repository files, Supabase helper files, package scripts, existing narrow auth unit tests, selected E2E auth setup patterns, navigation/sidebar logout and role-switch wiring, and API client/mutation helper usage.

Key runtime files checked:

- `src/routes/login.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/lib/auth-state.ts`
- `src/routes/api/auth/login.ts`
- `src/routes/api/auth/logout.ts`
- `src/routes/api/auth/session.ts`
- `src/routes/api/auth/role-switch.ts`
- `src/lib/auth/local-auth-service.ts`
- `src/lib/auth/session-cookies.ts`
- `src/lib/auth/session-token.ts`
- `src/lib/auth/session-repository.ts`
- `src/lib/auth/role-resolution.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/supabase-server.ts`

## Audit Commands And Findings

No Supabase browser auth dependency was found in the Phase 5F browser auth boundary:

```powershell
git grep -n "getBrowserClient" -- src/routes/login.tsx src/components/layout/AppLayout.tsx
git grep -n "supabase.auth" -- src/routes/login.tsx src/components/layout/AppLayout.tsx
git grep -n "dms_session" -- src/routes/login.tsx src/components/layout/AppLayout.tsx src/lib/auth-state.ts
git grep -n "from '#/lib/auth'" -- src/routes/login.tsx src/components/layout/AppLayout.tsx
```

Result: no matches. Exit code 1 is expected for these no-match checks.

Legacy non-auth API authorization still depends on Supabase-backed helpers:

```powershell
git grep -n "getServerSession" -- src/routes/api
git grep -n "createServerSupabaseClient" -- src/routes/api
```

Finding: many non-auth API routes still import `getServerSession` from `#/lib/auth` and create request-scoped Supabase server clients. This is expected until the non-auth API authorization migration phase.

Remaining Supabase Auth calls were found in legacy helpers and user/admin paths:

```powershell
git grep -n "supabase.auth" -- src/routes/api src/lib
git grep -n "auth.admin\|listUsers\|createUser\|updateUserById\|deleteUser\|generateLink" -- src/lib src/routes/api
```

Findings:

- `src/lib/auth.ts` still wraps Supabase `auth.getSession()` and `auth.getUser()` for legacy server authorization.
- `src/lib/user-helpers.ts` still uses Supabase Auth Admin for user list/create/update behavior.
- selected report/archive/log/user-management routes still use Supabase Auth Admin lookup or password APIs.
- `src/routes/api/users/me/change-password.ts` still verifies and updates password through Supabase Auth.

Browser and storage Supabase usage remains outside the auth runtime boundary:

```powershell
git grep -n "getBrowserClient" -- src
git grep -n "storage\.from\|createSignedUrl\|createSignedUrls\|\.upload(\|\.move(\|\.remove(" -- src/routes/api src/lib src/components
```

Findings:

- `/login` and `AppLayout` are no longer in the `getBrowserClient` result set.
- direct browser Supabase remains in document/admin/report/role pages and components that have not been migrated.
- Supabase Storage upload, move, remove, preview, download, and signed URL behavior remains active.

Client storage check:

```powershell
git grep -n "localStorage\|sessionStorage" -- src/routes/login.tsx src/components/layout/AppLayout.tsx src/lib/auth-state.ts
```

Finding: only `src/lib/auth-state.ts` uses `sessionStorage`, and it stores client UI auth state only. It does not store `dms_session`, raw session tokens, or token hashes.

Active role compatibility check:

```powershell
git grep -n "dms_active_role" -- src/routes/login.tsx src/components/layout/AppLayout.tsx src/lib/auth-state.ts src/routes/api/auth
```

Finding: `AppLayout` still clears the readable `dms_active_role` UX cookie during local logout cleanup. Local auth API routes set, validate, or clear active role server-side as expected. The active role cookie remains UX state only.

## Local Auth Runtime Boundary Status

Confirmed:

- `/login` uses `POST /api/auth/login` through `apiMutation`.
- `/login` no longer imports Supabase browser auth.
- `/login` does not read, write, or store `dms_session`.
- `AppLayout` bootstraps through `GET /api/auth/session`.
- `AppLayout` no longer imports Supabase browser auth for primary bootstrap.
- `AppLayout` does not read `dms_session` client-side.
- central logout uses `POST /api/auth/logout`.
- central role switch uses `POST /api/auth/role-switch`.
- `src/lib/auth-state.ts` stores only UI auth state in `sessionStorage`.
- `dms_active_role` remains readable UX state and is not authorization proof.

Expected mixed-runtime behavior:

- `AppLayout` still calls `/api/users/me/ketua-tim` after session bootstrap, and that endpoint remains Supabase-backed.
- non-auth API requests from authenticated pages can still fail or diverge until those routes validate local `dms_session`.

## Focused Tests

Command run:

```powershell
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

First sandboxed result:

- failed while Vitest loaded config because esbuild hit `spawn EPERM`.

Rerun with explicit approval for the same focused test process:

- 3 test files passed.
- 17 tests passed.

No E2E tests were run. They intentionally remain planned separately because current E2E flows can hit mixed Supabase/local-auth gaps.

No new tests were added. Existing pure-helper coverage was sufficient for this focused audit phase.

## Manual Verification Checklist

Use local seeded development users without recording real passwords, password hashes, token values, cookie values, or database URLs in notes.

- Open `/login` and confirm the page renders.
- Submit a valid local seeded development user and confirm navigation leaves `/login`.
- Submit the same email with an incorrect password and confirm the login page shows the generic invalid credential error.
- Later, simulate or seed an inactive user and confirm login is rejected with inactive-user UX.
- After successful login, inspect browser cookies and confirm `dms_session` exists and is `HttpOnly`.
- Confirm `dms_active_role` exists after login and is client-readable.
- Confirm `GET /api/auth/session` returns authenticated session data, assigned roles, and active role.
- Reload after login and confirm the app remains authenticated through `/api/auth/session`.
- Switch role from the header and confirm the network request is `POST /api/auth/role-switch`.
- Confirm role switch updates the active role and navigates to the role default route.
- Logout from the header/menu and confirm the network request is `POST /api/auth/logout`.
- Confirm logout clears `dms_session` and `dms_active_role`.
- Reload after logout and confirm the app stays unauthenticated and returns to `/login`.
- Confirm `localStorage` and `sessionStorage` do not contain raw session tokens, token hashes, password hashes, or cookie values.
- Expect non-auth API gaps until the next API authorization migration phase.

## Remaining Supabase Auth Dependencies

Already local-auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/role-switch`
- `/login` browser submit flow
- `AppLayout` browser session bootstrap
- central logout
- central role switch

Still Supabase-backed:

- non-auth API authorization through `getServerSession` from `src/lib/auth.ts`
- request-scoped Supabase server client creation through `createServerSupabaseClient`
- Supabase Auth Admin user-management helpers in `src/lib/user-helpers.ts`
- user profile/status and password-change APIs that still depend on Supabase Auth identity/password behavior
- document, workflow, report, archive, upload, preview, and download APIs that call legacy auth helpers
- report/archive/log user-name enrichment paths that use Supabase Auth Admin lookup
- browser direct Supabase access outside `/login` and `AppLayout`

Still Supabase Storage-backed:

- pending upload
- attachment edit upload/delete
- pending-to-formal move behavior
- preview/download signed URL behavior
- archive destruction storage deletes
- storage diagnostics and orphan cleanup

## Retirement Order Recommendation

Recommended next sequence:

1. Use the Phase 5H local server auth helper bridge for the first non-auth API authorization migrations, preserving endpoint contracts and response shapes.
2. Migrate read-only non-auth API authorization to local `dms_session`, starting with low-risk profile/current-user and role-support endpoints before domain lists.
3. Migrate read-only data APIs by domain to local auth and Drizzle while preserving response shapes.
4. Migrate mutation APIs carefully, with workflow/FSM and audit checks before each domain is considered done.
5. Replace Supabase Auth Admin user management with local auth admin services.
6. Retire Supabase Auth runtime only after all auth, user-management, and non-auth authorization paths no longer require Supabase sessions or Auth Admin.
7. Replace Supabase Storage runtime and signed URLs with local filesystem storage and internal signed-token/streaming behavior.
8. Remove Supabase dependencies only after full DB/auth/storage parity and manual workflow verification.

This recommendation keeps the existing roadmap structure and places the Phase 5H auth-helper compatibility bridge before broad read/write API migration.

## Phase 5H Helper Bridge Note

Phase 5H added `src/lib/auth/local-server-auth.ts`, an isolated server-only helper bridge for future non-auth API migrations. The helper resolves local `dms_session` through the existing hashed session-token repository, validates assigned roles, resolves `dms_active_role` only after membership checks, and provides narrow 401/403 response helpers.

No proof route was migrated. Broad non-auth API authorization migration remains future work, including the `AppLayout` support endpoint `/api/users/me/ketua-tim`.

Usage guidance and the recommended first route migration order are documented in `docs/migration/local-server-auth-helper-bridge.md`.

## Phase 5I Support Endpoint Note

Phase 5I migrated the first two low-risk current-user Ketua Tim support endpoints to local `dms_session` authorization:

- `GET /api/users/me/ketua-tim`
- `GET /api/users/me/is-ketua-tim/$kegiatanId`

These routes no longer require a legacy Supabase server session and now use Drizzle reads against `master.ketua_tim_assignments` and `master.master_kegiatan`. This reduces the `AppLayout` support gap because `/api/users/me/ketua-tim` is called immediately after local auth bootstrap.

`GET /api/users/me` was migrated in Phase 5J after its profile/role response shape was reviewed against `/profile` and `/pegawai/laporan/kegiatan`. Broad non-auth API authorization, read-only domain API migration, mutation API migration, Supabase Auth Admin replacement, and storage replacement remain open.

## Phase 5J Current User Profile API Note

Phase 5J migrated:

- `GET /api/users/me`

The endpoint now validates local `dms_session` through `getLocalServerSession(request)` and reads profile metadata from local `auth.users` via Drizzle while preserving the existing `{ user: { id, email, metadata, roles } }` response shape and `401 { error: 'Unauthorized' }` unauthorized body.

Remaining mixed-runtime risks after Phase 5J:

- `POST /api/users/me/change-password` still depends on legacy Supabase Auth password behavior.
- admin user-management/Auth Admin endpoints still depend on Supabase Auth Admin helpers.
- report, document, workflow, archive, upload, preview, and download APIs still generally depend on legacy Supabase authorization/data/storage behavior.
- read-only domain API migration and mutation API migration remain future phases.
- storage and signed URL replacement remain future phases.

## Known Mixed-Runtime Risks

- Local login creates `dms_session`, but non-auth API routes still generally expect Supabase-authenticated server clients.
- Authenticated pages can render from local auth state and then fail when a legacy non-auth API checks Supabase Auth; Phase 5I only removed this risk from the two current-user Ketua Tim support endpoints.
- `AppLayout` no longer listens to Supabase browser auth events, so cross-tab sign-out/refresh behavior needs local-auth regression coverage later.
- Supabase Auth Admin still owns user-management and password-change behavior outside the local login path.
- Storage, preview, download, and archive destruction still depend on Supabase Storage and signed URLs.
- CSRF and rate limiting remain open before production use of cookie auth.
- Remember-me request shape support remains open.

## Intentionally Not Implemented

- non-auth API migration
- storage migration
- workflow/FSM changes
- archive lifecycle changes
- Supabase removal
- dependency removal
- DB schema, migration, generation, or seed changes
- password hash helper execution
- route generation
- E2E tests
- broad refactors

## Validation Summary

Required focused checks completed:

- initial `git status --short --branch`
- focused grep/audit checks listed above
- focused auth helper tests

Follow-up checks for the final task summary:

- `git diff --check`
- final `git status --short --branch`
- confirm `src/routeTree.gen.ts` did not change
