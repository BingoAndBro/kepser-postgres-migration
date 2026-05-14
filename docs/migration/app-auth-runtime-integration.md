# Phase 5F App Auth Runtime Integration

Date: 2026-05-14.

## Purpose

Phase 5F switches the browser auth runtime boundary for the login page, `AppLayout`, logout, and central role switching from Supabase browser auth to the local custom auth API boundary implemented in Phase 5E and Phase 5E.1.

This phase is intentionally narrow. It does not migrate non-auth API authorization, storage, workflow/FSM behavior, archive behavior, database schema, seeds, or generated routes.

## Files Changed

Created:

- `docs/migration/app-auth-runtime-integration.md`

Modified:

- `src/routes/login.tsx`
- `src/components/layout/AppLayout.tsx`
- `docs/migration/auth-api-compatibility-implementation.md`
- `docs/migration/custom-session-auth-foundation.md`
- `docs/migration/open-decisions.md`

## Login Page Integration

`src/routes/login.tsx` now submits the existing email/password form to:

```text
POST /api/auth/login
```

The login page no longer calls Supabase browser `signInWithPassword` or performs direct browser reads of `user_status` and `user_roles`.

On success, the page uses the returned `{ user, roles, activeRole }` payload to update client auth state with the existing authenticated shape, then preserves the existing redirect behavior:

- `ADMIN` -> `/admin`
- non-admin roles -> `/`

The server response sets `dms_session` and `dms_active_role`; the login page does not read, write, or store `dms_session`.

Generic invalid credential behavior remains `Email atau password salah`. Inactive-user behavior is now represented by the local login API error message.

## AppLayout Session Bootstrap

`src/components/layout/AppLayout.tsx` now bootstraps auth through:

```text
GET /api/auth/session
```

It treats this response as unauthenticated:

```ts
{ session: null, roles: [], activeRole: null }
```

When authenticated, it maps the local response to the same client auth-state semantics used by navigation:

- `status: 'authenticated'`
- `userId`
- `email`
- `roles`
- `activeRole`
- `isReady: true`

`AppLayout` no longer uses Supabase browser `getSession`, `getUser`, `onAuthStateChange`, or direct browser reads of `user_status` and `user_roles` for the primary auth bootstrap.

## Auth-State Impact

`src/lib/auth-state.ts` did not need exported API changes.

The existing session-storage-backed client auth state remains a per-tab UI cache only. It stores user id, email, roles, active role, and readiness state. It does not store raw session tokens, token hashes, or `dms_session`.

## Logout Handling

The central `AppLayout` logout handler now calls:

```text
POST /api/auth/logout
```

After the request returns, the handler clears the client auth state and navigates to `/login`. The local logout API remains responsible for revoking the current session and clearing both `dms_session` and `dms_active_role`.

## Role-Switch Handling

The central `AppLayout` role-switch handler now calls:

```text
POST /api/auth/role-switch
```

The handler updates client auth state from the returned `{ success: true, activeRole }` payload and redirects to the default route for the returned role. It no longer writes `dms_active_role` directly before server validation.

## Still Supabase-Backed

These remain intentionally Supabase-backed or not yet migrated:

- non-auth API authorization helpers and route internals
- Supabase Auth Admin user-management paths
- document, workflow, report, archive, and storage APIs
- Supabase storage upload, preview, download, and signed URL behavior
- `src/lib/auth.ts` and Supabase client/helper files as compatibility reference

The app has not fully retired Supabase Auth. This phase only removes selected browser-runtime auth dependencies from login, layout bootstrap, logout, and role switching.

## Intentionally Not Implemented

- non-auth API migration to local session authorization
- server-side authorization migration for document/master/archive APIs
- local filesystem storage
- upload/preview/download replacement
- workflow/FSM behavior changes
- archive lifecycle behavior changes
- CSRF protection
- login rate limiting
- remember-me request shape changes
- DB migration, generation, or seed execution
- password hash helper execution
- route tree generation

## Validation Run

Focused auth helper tests:

```bash
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

Result: 3 test files passed, 17 tests passed.

The first sandboxed attempt failed with `spawn EPERM` while Vitest/esbuild loaded config. The same focused command passed after explicit escalation for the test process.

Whitespace check:

```bash
git diff --check
```

Result: passed, with Git CRLF conversion warnings only.

Manual verification still recommended:

- visit `/login`
- login with a local seeded development user
- verify `dms_session` exists as an HttpOnly cookie
- verify `dms_active_role` exists
- verify `AppLayout` loads authenticated state from `/api/auth/session`
- verify role switch calls `/api/auth/role-switch` and redirects to the role default route
- verify logout calls `/api/auth/logout`, clears session cookies, and returns to `/login`
- verify unauthenticated `/api/auth/session` redirects or blocks as before

## Phase 5G Regression Note

Phase 5G performed focused regression grep checks against the Phase 5F browser/runtime boundary and created `docs/migration/auth-regression-and-retirement-plan.md`.

The checks confirmed that `/login` and `AppLayout` no longer import Supabase browser auth for the primary auth runtime, that `AppLayout` bootstraps through `GET /api/auth/session`, and that browser code does not read or store `dms_session`. The new Phase 5G doc also records the manual verification checklist and the remaining Supabase Auth retirement order.

Non-auth APIs remain legacy. In particular, API routes outside `/api/auth/*` still generally use Supabase server auth helpers, Supabase Auth Admin lookup, or Supabase Storage behavior until later migration phases.

## Risks And Open Items

- Non-auth APIs still expect the legacy Supabase-backed server auth boundary, so authenticated pages can still hit Supabase-backed API authorization gaps until later phases migrate those routes.
- The old Supabase auth-state event subscription is removed from `AppLayout`; cross-tab sign-out refresh behavior should be revisited when broader local auth regression tests are added.
- Cookie-auth CSRF and login rate limiting remain open before production use.
- Supabase Auth Admin replacement remains open.
- Storage replacement and signed preview/download compatibility remain open.
