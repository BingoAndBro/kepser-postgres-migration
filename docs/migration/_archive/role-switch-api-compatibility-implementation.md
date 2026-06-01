# Phase 5E.1 Role-Switch API Compatibility Implementation

Date: 2026-05-14.

## Purpose

Phase 5E.1 migrates only the internals of the existing role-switch endpoint to the local custom session boundary created in Phase 5E.

The endpoint path remains:

```text
POST /api/auth/role-switch
```

This phase does not switch `AppLayout`, the login page, client auth-state, non-auth APIs, storage, workflow, or archive behavior.

## Compatibility Notes

Existing request and response shapes found before implementation:

- Request body: `{ activeRole }`
- Success response: `{ success: true, activeRole }`
- Invalid JSON response: `{ error: 'Invalid JSON body' }` with status 400
- Validation failure response: `{ error: 'Validasi gagal', details }` with status 400
- Missing or invalid auth response: `{ error: 'Not authenticated' }` with status 401
- ADMIN role-switch rejection: `{ error: 'ADMIN tidak bisa switch role — akun dedicated' }` with status 403
- Unassigned role rejection: `{ error: "Role '<role>' tidak tersedia untuk akun Anda" }` with status 403

The migrated route preserves the same endpoint path, request field name, success shape, and primary error shapes/status categories.

## Local Session Validation

`POST /api/auth/role-switch` now:

- reads only the `dms_session` cookie for authentication
- hashes the raw session token in request memory with `hashSessionToken`
- resolves the session through `findSessionByTokenHash`
- rejects missing, malformed, unknown, expired, revoked, or inactive-user sessions as unauthenticated
- validates assigned roles with `validateAssignedRoles`
- does not use Supabase server auth
- does not import from `#/lib/auth`

The route does not trust `dms_active_role` as authorization proof.

## Role Validation

The route continues to parse the target role through the existing `roleSwitchSchema`, so the body field remains `activeRole` and only canonical roles are accepted.

After local session validation, the route:

- rejects invalid local role assignments
- rejects any session whose assigned roles include `ADMIN`
- rejects target roles that are not assigned to the authenticated local user
- allows only assigned non-admin roles to become active

## Cookie Behavior

On success, the route sets only:

```text
dms_active_role=<activeRole>; Path=/; Max-Age=2592000; SameSite=Lax
```

The active role cookie remains readable by client JavaScript for UX compatibility and remains a UX state cookie only.

The route does not set, rotate, clear, or expose `dms_session`.

## Still Supabase-Backed

After this phase, these paths remain intentionally Supabase-backed or not yet integrated with local auth:

- `src/components/layout/AppLayout.tsx`
- `src/routes/login.tsx`
- `src/lib/auth-state.ts`
- non-auth API routes
- Supabase Auth Admin user-management paths
- Supabase-backed workflow, archive, and storage behavior

## Intentionally Not Implemented

- AppLayout/client auth-state runtime switch
- login page runtime switch
- CSRF protection
- rate limiting
- local filesystem storage
- non-auth API migration to local auth
- workflow/FSM behavior changes
- document/archive behavior changes
- DB migration, generation, or seed execution
- password hash helper execution

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

Result: passed.

## Risks And Open Items For Phase 5F

- `AppLayout` still uses Supabase browser auth and direct role/status reads.
- `src/routes/login.tsx` still bypasses `/api/auth/login`.
- Client auth state is not yet bootstrapped from `/api/auth/session`.
- Non-auth APIs still do not authorize local `dms_session`.
- Cookie-auth CSRF and rate limiting remain open before production use.
