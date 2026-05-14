# Phase 5E Auth API Compatibility Implementation

Date: 2026-05-13.

## Purpose

Phase 5E implements the local custom-auth compatibility layer behind the existing auth API endpoint paths:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

This phase preserves endpoint paths and response shapes while replacing those three route internals with local PostgreSQL, Drizzle, Argon2id password verification, and hashed opaque session tokens.

## Files Changed

Created:

- `src/lib/auth/local-auth-service.ts`
- `src/lib/auth/session-cookies.ts`
- `src/lib/auth/role-resolution.ts`
- `tests/unit/auth/session-cookies.test.ts`
- `tests/unit/auth/role-resolution.test.ts`
- `docs/migration/auth-api-compatibility-implementation.md`

Modified:

- `src/routes/api/auth/login.ts`
- `src/routes/api/auth/logout.ts`
- `src/routes/api/auth/session.ts`
- `docs/migration/custom-session-auth-foundation.md`
- `docs/migration/session-token-repository-foundation.md`
- `docs/migration/open-decisions.md`

## Compatibility Notes

Existing request and response shapes found before implementation:

- Login request: `{ email, password }`
- Login success response: `{ user: { id, email, userName? }, roles, activeRole }`
- Login invalid JSON response: `{ error: 'Invalid JSON body' }`
- Login validation failure response: `{ error: 'Validasi gagal', details }`
- Login credential failure response: `{ error: 'Email atau password salah', code }`
- Logout request: no required JSON body
- Logout success response: `{ success: true }`
- Session request: `GET`
- Session unauthenticated response: `{ session: null, roles: [], activeRole: null }`
- Session authenticated response: `{ session: { userId, email, userName? }, roles, activeRole }`

The implementation keeps those success and unauthenticated shapes. Invalid credential failures keep the generic message and return `code: 'invalid_credentials'`.

## Login Behavior

`POST /api/auth/login` now:

- parses JSON and validates with the existing `loginSchema`
- normalizes email with trim/lowercase before lookup
- queries local `auth.users`
- rejects inactive users
- verifies passwords with `src/lib/auth/password.ts`
- returns a generic credential failure for missing users or password mismatch
- loads roles from local `auth.user_roles` joined to `auth.roles`
- rejects users with no roles
- rejects `ADMIN` combined with any other role
- resolves active role with primary-role behavior
- creates an `auth.sessions` row through the Phase 5D repository
- stores only `token_hash`
- sets `dms_session` and `dms_active_role` cookies

The current request schema does not include `rememberMe`, so Phase 5E always uses the standard 8-hour session duration.

## Logout Behavior

`POST /api/auth/logout` now:

- reads `dms_session`
- hashes the raw token in request memory
- revokes only the matching current session
- clears `dms_session`
- clears `dms_active_role`
- returns `{ success: true }`

Logout remains idempotent for missing, invalid, expired, or already-revoked sessions.

## Session Behavior

`GET /api/auth/session` now:

- reads `dms_session`
- hashes the raw token in request memory
- resolves the session through `findSessionByTokenHash`
- rejects missing, expired, revoked, unknown, and inactive-user sessions
- validates the assigned role set
- reads `dms_active_role`
- accepts active role only when it belongs to the authenticated user
- falls back to primary role when the active-role cookie is missing or invalid
- returns the existing `{ session, roles, activeRole }` shape

The active-role cookie remains UX state only and is not trusted as authorization proof.

## Cookie Behavior

`dms_session`:

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Secure` in production or HTTPS
- contains only the opaque raw session token

`dms_active_role`:

- readable by client JavaScript for compatibility
- `SameSite=Lax`
- `Path=/`
- 30-day max age on login
- cleared on logout

No raw session token, token hash, password, password hash, or database URL is logged or printed by the implementation.

## Still Supabase-Backed

Phase 5E intentionally does not migrate:

- `src/routes/login.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/lib/auth-state.ts`
- non-auth API routes
- Supabase Auth Admin user-management paths
- Supabase-backed workflow, archive, and storage behavior

The primary browser auth runtime still uses Supabase until Phase 5F rewires client auth bootstrap/login behavior.

## Phase 5E.1 Role-Switch Note

Phase 5E.1 migrated the existing `POST /api/auth/role-switch` endpoint internals to the local custom session boundary.

The route now validates `dms_session` through the hashed-token session repository, validates the requested `activeRole` against the authenticated user's assigned local roles, rejects ADMIN role switching, and sets only the readable `dms_active_role` UX cookie on success.

With this change, `login`, `logout`, `session`, and `role-switch` form the local auth API boundary. `AppLayout`, `src/routes/login.tsx`, and `src/lib/auth-state.ts` are still not switched to that boundary.

## Phase 5F Browser Runtime Integration Note

Phase 5F wires the browser runtime paths to the local auth API boundary:

- `src/routes/login.tsx` now posts credentials to `POST /api/auth/login`.
- `src/components/layout/AppLayout.tsx` now bootstraps authenticated UI state from `GET /api/auth/session`.
- the central logout handler now calls `POST /api/auth/logout`.
- the central role-switch handler now calls `POST /api/auth/role-switch`.

The browser login/layout paths no longer use Supabase browser auth for primary login, session bootstrap, logout, or role switching. Client auth-state exports were not changed; they are populated from the existing auth API response shapes.

Remaining gaps are intentionally unchanged: non-auth APIs still expect the legacy Supabase-backed authorization boundary, Supabase Auth Admin replacement remains open, and full Supabase Auth runtime retirement is not claimed.

## Intentionally Not Implemented

- non-auth API authorization migration
- CSRF protection
- rate limiting
- remember-me request shape expansion
- storage replacement
- non-auth API migration
- DB migration, generation, or seed execution
- password hash helper execution

## Validation Run

Focused auth helper tests:

```bash
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

Result: 3 test files passed, 17 tests passed.

The first sandboxed attempt failed with `spawn EPERM` while Vitest/esbuild loaded config. The same focused command passed after explicit escalation for the test process.

## Risks And Open Items

- `src/routes/login.tsx` still bypasses `/api/auth/login`; Phase 5F must decide and implement the runtime switch.
- `AppLayout` still uses Supabase browser auth and direct role/status reads; Phase 5F must switch bootstrap to `/api/auth/session`.
- Non-auth API routes still expect Supabase sessions and will not authorize local `dms_session` until later phases.
- Cookie-auth CSRF and login rate limiting remain required before production use.
