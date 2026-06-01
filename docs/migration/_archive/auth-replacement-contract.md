# Auth Replacement Contract

This contract defines the target auth behavior for replacing Supabase Auth. It is documentation only and does not implement the auth layer.

## Current Supabase Auth Behavior Summary

- `src/routes/login.tsx` signs in directly with `supabase.auth.signInWithPassword`.
- `src/components/layout/AppLayout.tsx` bootstraps auth with browser `auth.getSession`, `auth.getUser`, `auth.onAuthStateChange`, `user_status`, and `user_roles`.
- `/api/auth/session` returns `{ session, roles, activeRole }` using Supabase server auth.
- `/api/auth/role-switch` validates role membership and blocks ADMIN switching.
- `/api/users/*` and `src/lib/user-helpers.ts` rely on Supabase Auth Admin APIs for user list/create/update/password reset.
- Some server paths still use or alias `getSession()`, even though `src/lib/auth.ts` marks it as unverified for server-side security.

## Target Custom Auth Behavior

- Use custom email/password login.
- Store users and password hashes in local PostgreSQL.
- Use argon2id for password hashing.
- Create opaque server-side sessions after successful login.
- Store only hashed session tokens in PostgreSQL.
- Use API/server authorization as the security boundary.
- Keep client-side RBAC as UX only.

## User Table Strategy

Target schema belongs under PostgreSQL schema `auth`.

The user model must support:

- Stable UUID primary key.
- Email login identity.
- Password hash and password metadata.
- User metadata currently needed by UI and reports, including names and profile fields.
- Active/inactive status equivalent to current `user_status`.
- Created/updated timestamps.
- Admin user-management operations currently served by Supabase Auth Admin.

Accepted direction:

- Use UUID primary keys for local users and seed users.
- Fresh deterministic UUIDs may be used for seed data.
- Preserve UUID-based ownership and foreign-key semantics.
- Do not import or preserve actual old Supabase user UUID values unless a future explicit data migration decision changes this.

## Role Table Strategy

Roles remain:

- `PEGAWAI`
- `PPK`
- `BENDAHARA`
- `ARSIPARIS`
- `ADMIN`

Role mapping must preserve current `roles` and `user_roles` behavior:

- A user may have multiple non-admin roles.
- New non-admin users should include `PEGAWAI` where current behavior expects it.
- `ADMIN` is a dedicated role and must not be combined with other roles.
- Server-side role lookup must replace PostgREST nested select behavior such as `role:roles(nama)`.

## Session Table Strategy

The session model must support:

- Session ID or UUID primary key.
- User ID foreign key.
- Hashed session token.
- Created timestamp.
- Expires timestamp.
- Revoked timestamp or equivalent invalidation flag.
- Remember-me marker or derived expiration.
- Optional metadata such as user agent and IP address if useful for audit/hardening.

Default expiration:

- Standard session: 8 hours.
- Remember-me session: 30 days.

## Cookie Strategy

Session cookie:

- Must contain only the opaque raw session token or an equivalent opaque reference.
- Must be `HttpOnly`.
- Must use `SameSite=Lax` by default.
- Must use `Secure` when HTTPS is active.
- May omit `Secure` only in explicitly configured trusted HTTP LAN/local mode with `DMS_SESSION_COOKIE_SECURE=false`.
- `DMS_SESSION_COOKIE_SECURE=true` forces `Secure`; unset keeps the default production/HTTPS-compatible secure behavior.
- Must not contain user ID, role, email, or expiry data.

Active role cookie:

- May remain readable by client code if needed for UX compatibility.
- Must not be trusted as authorization by itself.
- Server must validate active role against the authenticated user's roles on every privileged action.

## Active Role Strategy

- Preserve `dms_active_role` behavior unless a later explicit compatibility task changes it.
- `/api/auth/session` should return the validated effective active role.
- If cookie role is missing or invalid, server should fall back to primary role.
- ADMIN users must not receive role-switch behavior.

## ADMIN Role Exclusivity

- `ADMIN` remains a dedicated account mode.
- `ADMIN` must not be combined with `PEGAWAI`, `PPK`, `BENDAHARA`, or `ARSIPARIS`.
- Role switch must reject ADMIN switching.
- Admin endpoints must validate ADMIN server-side.

## Login Behavior Compatibility

Login must preserve:

- Existing `/login` UX.
- Invalid credential error behavior from the user's perspective.
- Inactive account rejection behavior.
- Active role initialization.
- Redirect behavior: ADMIN to `/admin`, non-admin to the current default route.
- Existing `/api/auth/login` path and response shape where used.

Target direction:

- `src/routes/login.tsx` should eventually call the custom auth API instead of Supabase browser auth.
- `/api/auth/login` should create a session, set the session cookie, set or return active role, and return compatible user/role data.

## Logout Behavior Compatibility

Logout must:

- Revoke the current server-side session.
- Clear the session cookie.
- Clear the active-role cookie.
- Clear client auth state.
- Preserve redirect to login behavior.

## Session Bootstrap Via `/api/auth/session`

Accepted direction:

- `/api/auth/session` becomes the canonical bootstrap endpoint for `AppLayout`.
- `AppLayout` should no longer depend on Supabase browser `getSession`, `getUser`, or `onAuthStateChange` after auth migration.
- The endpoint should return a compatible shape containing session/user data, roles, and active role.

## Password Hashing With Argon2id

- Use argon2id for password hashing.
- Parameters must be configurable for the deployment server.
- Never store plaintext passwords.
- Never use fast hashes such as SHA-256 for passwords.

## Session Token Hashing

- Generate high-entropy opaque tokens.
- Store only token hashes in the database.
- Compare hashes using timing-safe comparison patterns where applicable.
- Raw token should exist only in the cookie and request handling memory.

## Password Change Behavior Recommendation

Recommended decision:

- Verify current password using argon2id.
- Update password hash.
- Revoke all other active sessions for that user.
- Keep the current session only if implementation rotates it immediately; otherwise revoke all sessions and require re-login.

Rationale:

Current Supabase behavior verifies old password via sign-in and updates the password. Local auth must be explicit about session invalidation because Supabase no longer provides hidden session semantics.

## User Management Replacement For Supabase Auth Admin

Replace `auth.admin.*` usage with local admin services:

- List users from local `auth` tables.
- Create users with argon2id password hash.
- Update profile metadata.
- Reset password by replacing password hash and revoking sessions.
- Activate/deactivate via local status field/table.
- Join roles/status in local queries.

Critical compatibility:

- Preserve admin list response fields currently used by UI.
- Preserve duplicate email errors.
- Preserve default PEGAWAI behavior.
- Preserve user status behavior from `user_status`.

## Risks

- `AppLayout` currently depends on browser auth events for refresh/sign-out behavior.
- Login currently bypasses `/api/auth/login`.
- User metadata currently lives in Supabase Auth user metadata.
- Supabase Auth Admin list behavior is used for report/archive name enrichment.
- Active role cookie is readable and must not become a security boundary.
- LAN HTTP affects whether `Secure` cookies can be used before HTTPS is decided.

## Validation Checklist

- Login success and invalid credential behavior match current UI.
- Inactive users are blocked and redirected with current UX.
- `/api/auth/session` returns compatible session/roles/activeRole shape.
- Role switch validates membership and rejects ADMIN switching.
- Logout revokes session and clears cookies/client state.
- Password change validates old password and applies chosen session revocation behavior.
- Admin can list/create/update/reset/deactivate/reactivate users.
- Server/API authorization works without client-side RBAC.
- Direct API access with missing/invalid session returns 401.
- Direct API access with wrong role returns 403.
