# Phase 11G.5 - Cookie Auth, CSRF, Rate-Limit Security Review

Date: 2026-05-21.

Status: review complete for the bounded 11G.5 scope. No runtime source, tests, package files, env files, DB migrations, seeds, firewall/network settings, backup/restore commands, route generation, or commits were changed or run by this phase.

This review covers the clean local DMS target:

- local PostgreSQL plus Drizzle;
- local `dms_session` cookie auth;
- local filesystem storage;
- no active Supabase runtime fallback.

This review does not claim the system is secure in an absolute sense. It records current posture, residual risk, and follow-up requirements for 11G.6/11H.

## Scope And Non-Goals

Reviewed areas:

- `dms_session` cookie attributes and clearing behavior;
- `DMS_SESSION_COOKIE_SECURE` behavior for trusted HTTP LAN versus HTTPS/final deployment;
- logout and password-change session revocation behavior;
- state-changing API CSRF exposure;
- login, password-change, upload, workflow, admin cleanup, and destructive-route brute-force/rate-limit posture;
- sensitive route session/RBAC posture;
- file-access posture, including `DIMUSNAHKAN` blocking.

Non-goals:

- no CSRF framework implementation;
- no app-layer rate-limit implementation;
- no auth redesign;
- no route generation;
- no DB/schema/seed/package/env changes;
- no E2E, build, dev server, preview server, firewall/network, or backup/restore commands;
- no LAN readiness, production readiness, release readiness, operational certification, or go-live approval claim.

## Cookie Auth Review

`dms_session` current behavior:

| Attribute | Current posture | Review note |
|---|---|---|
| Cookie name | `dms_session` | Dedicated opaque session cookie. |
| Token content | Opaque 32-byte random token encoded base64url | No user id, role, expiry, or readable claims in the cookie. |
| Storage | Raw token in browser cookie; SHA-256 base64url token hash in DB | Raw token is not stored in DB. |
| HttpOnly | Yes | `createSessionCookieHeader()` sets `HttpOnly`; client code should not read it. |
| SameSite | `Lax` | Reduces common cross-site POST risk but is not complete CSRF protection. |
| Secure | Controlled by `DMS_SESSION_COOKIE_SECURE`, production mode, HTTPS URL, or `x-forwarded-proto=https` | See deployment split below. |
| Path | `/` | Applies to all app/API routes. |
| Max-Age | 8 hours standard; 30 days for remember-me | Constants are `SESSION_DURATION_SECONDS` and `REMEMBER_ME_DURATION_SECONDS`. Current login route does not visibly wire a remember-me request in this review. |

`DMS_SESSION_COOKIE_SECURE` behavior:

| Setting | Behavior | Allowed use |
|---|---|---|
| unset | `Secure` when `NODE_ENV=production`, request URL is HTTPS, or `x-forwarded-proto=https`; otherwise no `Secure` in non-production HTTP | Default local/dev behavior with secure production/HTTPS posture. |
| `true` | Always sets `Secure` | HTTPS/final deployment preference. |
| `false` | Omits `Secure` | Trusted HTTP LAN/local testing only. Must not be exposed to public or untrusted networks. |

Cookie clearing and revocation:

- `POST /api/auth/logout` revokes the current session by token hash when a token is present, then clears both `dms_session` and `dms_active_role`.
- `POST /api/users/me/change-password` verifies the current password, updates the Argon2id hash, revokes all user sessions through `revokeAllUserSessions(userId)`, and clears `dms_session` plus `dms_active_role`.
- Admin password reset also revokes all sessions for the target user.
- Clearing uses the same session-cookie option source as creation, which preserves HTTP LAN clearing compatibility after 11G.4a.

Authorization boundary:

- `dms_active_role` remains readable UX state only.
- Server/API authorization uses local session validation plus assigned roles from the server-side session record.
- Route checks use `getLocalServerSession()` and role helpers such as `hasLocalRole()`, not `dms_active_role` as proof of authorization.

## CSRF Review

Overall finding: state-changing routes rely on `SameSite=Lax`, method selection, JSON/form-data parsing, Zod/schema validation, server-side session revalidation, ownership/status checks, and RBAC. The required audit did not find an app-wide CSRF token mechanism or explicit `Origin`/`Referer` validation for state-changing API routes. `SameSite=Lax` is helpful but is not complete CSRF protection for all browser flows.

| Category | Cookie-auth state change | Current mitigation | Residual risk | Recommendation |
|---|---:|---|---|---|
| Auth login | No existing session required; sets cookies | POST, JSON parse, Zod, generic invalid credential error | Medium because no rate limit and login CSRF/session-confusion is not explicitly addressed | Accept for trusted LAN review; add login rate-limit and same-origin strategy before 11H/wider rollout. |
| Auth logout and role switch | Yes | POST, session lookup, assigned-role validation for role switch, cookie clearing | Medium; no explicit CSRF token/origin check | Accept for trusted LAN only; add origin/CSRF strategy before 11H/wider rollout. |
| Self password change | Yes | POST, session required, current-password verification, Zod/user validation, all-session revocation, cookie clearing | Medium to High; sensitive state change has no explicit CSRF token/origin check | Needs narrow follow-up before 11H/wider rollout. |
| Admin password reset and user lifecycle | Yes | ADMIN role required, JSON parsing, request validation, self-deactivation guard | High impact if admin is CSRFed; no explicit CSRF token/origin check | P1 before 11H/wider rollout. |
| Pegawai document create/update/submit/delete | Yes | Session required, `PEGAWAI` role, owner checks, status checks, FSM where applicable, Zod validation | Medium; no explicit CSRF token/origin check | Accept as trusted-LAN residual risk; add origin/CSRF strategy before wider rollout. |
| Upload and pending cleanup | Yes | Session required, owner/path validation, file type/size checks, safe logical path checks | Medium to High due storage write/delete abuse and no throttling | Needs rate-limit and CSRF/origin follow-up before 11H/wider rollout. |
| PPK/Bendahara approve/reject/kembalikan/resubmit | Yes | Session required, role checks, status checks, FSM transitions, Zod validation where body exists, audit log insert | Medium; workflow actions are high-integrity but role-bound | P2/P1 depending deployment exposure; origin/CSRF strategy before wider rollout. |
| Arsip archive/lifecycle/destruction | Yes | Session required, `ARSIPARIS` role, status checks, transactions, audit log insert, safe file delete checks | High for destruction paths; no explicit CSRF token/origin check | P1 before 11H/wider rollout. |
| Admin/master-data CRUD and Ketua Tim assignment | Yes | ADMIN role required for most admin APIs; Zod/manual validation; uniqueness and domain checks | High impact for admin mutation | P1 before 11H/wider rollout. |
| Admin storage diagnostics cleanup | Yes, destructive cleanup is on `GET` when query flags disable dry-run | ADMIN role required, dry-run default, explicit query flags, protected referenced paths, logical-path-only responses | High because state change via GET is weak against CSRF/link navigation compared with POST plus origin/CSRF checks | P1 before 11H/wider rollout; targeted follow-up should move destructive cleanup behind POST or add strong origin/CSRF protection. |
| File access token streaming | No DB state change | Session required, signed token, expiry, safe path resolution, no-store/nosniff | Low for CSRF as read-only; authorization caveats below | Keep document-token revalidation; harden raw logical-path compatibility before final. |

Accepted trusted-LAN residual risk:

- For bounded trusted HTTP LAN smoke/review, current `SameSite=Lax` plus server-side RBAC is an acceptable temporary residual risk if clients are trusted and the app is not exposed beyond the trusted LAN.
- This is not acceptable as a final browser-accessible deployment posture without a deliberate CSRF/origin strategy.

Recommended CSRF strategy before 11H or wider rollout:

- Add a centralized same-origin guard for cookie-authenticated state-changing routes using `Origin` first and `Referer` fallback where appropriate.
- Keep method discipline: destructive/state-changing operations should not use `GET`.
- Consider a CSRF token or double-submit design for sensitive form/API mutations if same-origin checks are insufficient for the final serving topology.
- Make exemptions explicit for routes that must remain cross-origin, if any.

## Rate-Limit And Brute-Force Review

Overall finding: the required audit did not find an active app-layer throttling/rate-limit mechanism in current `src` runtime routes. Reverse proxy, firewall, Docker, and LAN controls can reduce exposure, but they should not be the only app-layer story for final/wider deployment.

| Surface | Current status | Existing mitigation | Risk | Recommended follow-up |
|---|---|---|---|---|
| Login brute force | Absent | Generic invalid credential message; Argon2id password verification | High before wider rollout | App-layer login rate-limit by account/IP, optional delay/backoff, audit logging; reverse-proxy rate-limit as defense in depth. |
| Password change | Absent | Requires authenticated session and current password; revokes all sessions on success | Medium | Per-user/session throttle and audit failed attempts. |
| Admin reset password/create user | Absent | ADMIN role required; password length validation; session/RBAC | Medium to High | Admin mutation throttling/audit logging; consider re-auth for destructive admin actions later. |
| Upload | Absent | Auth required, file type/size checks, owner/path validation | Medium to High | Per-user upload rate-limit, daily/rolling quota, storage usage audit. |
| Workflow actions | Absent | Role/status/FSM checks and audit trail | Medium | Optional per-user action throttling and duplicate-action/idempotency checks. |
| Archive destruction and admin cleanup | Absent | Role checks, dry-run defaults for cleanup, safe path checks | High impact | Add explicit confirmation workflow, POST-only mutation, origin/CSRF guard, audit logging, and conservative throttling. |
| File-access URL issuing/streaming | Absent | Session required, signed token expiry, session binding for document tokens | Medium | Rate-limit token issuance/streaming per session/user if exposed beyond trusted LAN. |

## Sensitive Route And RBAC Review

Positive findings:

- Local auth routes use `dms_session` and hashed session-token lookup; invalid, expired, revoked, inactive-user, or malformed sessions fail closed.
- Most sensitive state-changing APIs directly call `getLocalServerSession()` and role helpers.
- Admin routes reviewed require `ADMIN` server-side for user management, Ketua Tim assignment, storage diagnostics, and cleanup.
- Pegawai document routes enforce `PEGAWAI` plus ownership for user-owned writes/deletes.
- PPK/Bendahara workflow routes enforce assigned role and document status before FSM transitions.
- Arsip lifecycle routes enforce `ARSIPARIS` plus archive/document status preconditions.
- File-access document-token routes bind token use to current session/user where payload includes `subjectUserId` and `sessionId`.
- Document-specific preview/download routes re-load document/archive state and block `DIMUSNAHKAN` with `410`.
- The required Supabase grep found no active `@supabase`, Supabase client factory, or `supabase.*` runtime/package matches in `src`, `tests`, `package.json`, or `pnpm-lock.yaml`.

Findings and caveats:

- Phase 11H.2c converted destructive admin cleanup to POST-only semantics pending human retest. `GET /api/admin/cleanup-orphan-files` is now dry-run/report-only, including when destructive query flags are supplied.
- Raw logical-path preview/download compatibility routes (`/api/dokumen/preview-url` and `/api/dokumen/download-url`) authorize owners and broad workflow roles by path knowledge, but do not perform document/archive status revalidation and do not independently block `DIMUSNAHKAN`. Document-specific file routes do block `DIMUSNAHKAN`; raw compatibility routes should be narrowed or status-aware before final/wider rollout.
- No explicit origin/referer/CSRF token enforcement was found for state-changing routes.
- No app-layer throttling/rate-limit mechanism was found.
- Some high-impact reads and token issuance routes are GET by design; this is acceptable for read-only behavior only if they remain non-mutating and authorization is revalidated.
- Error logging reviewed generally avoids printing secrets, tokens, password hashes, DB URLs, storage roots, and physical paths. Several logs include route params or logical identifiers; keep this acceptable only if future changes avoid physical path/token/env output.

## Risks And Recommendations

| Classification | Finding | Recommendation |
|---|---|---|
| P1 before 11H/wider rollout | Destructive admin cleanup could be triggered by GET query flags and has no explicit app-wide CSRF/origin protection. | Phase 11H.2c makes destructive cleanup POST-only pending human retest. Separate CSRF/origin strategy remains unresolved. |
| P1 before 11H/wider rollout | Raw logical-path preview/download routes do not revalidate archive status and can bypass the stronger `DIMUSNAHKAN` block used by document-token routes if a valid role knows a path. | Narrow raw compatibility routes to owner-only or require document-token/status-aware access before final. |
| P1 before 11H/wider rollout | No explicit CSRF/origin strategy for cookie-authenticated state-changing routes. | Add centralized same-origin validation and/or CSRF token strategy before broader browser-accessible deployment. |
| P1 before 11H/wider rollout | No login brute-force throttling. | Add app-layer login rate-limit/backoff and audit logging; use reverse-proxy limits only as defense in depth. |
| P2 before final release | Upload, file-token issuance, workflow, archive, and admin mutations have no app-layer throttling. | Add scoped per-user/session/IP limits and audit events by risk surface. |
| P2 before final release | High-impact admin/account changes do not require re-authentication or step-up confirmation. | Consider re-auth/confirm flows after CSRF/rate-limit foundation. |
| P3 backlog | Remember-me request shape is not visibly wired in the reviewed login route. | Confirm UI/API contract later; do not change in 11G.5. |
| Accepted trusted-LAN residual risk | Trusted HTTP LAN can use `DMS_SESSION_COOKIE_SECURE=false` for smoke/internal testing. | Keep bounded to trusted LAN/local only; prefer HTTPS plus `Secure` for serious/final deployment. |

## Accepted And Deferred Decisions

Accepted for 11G.5/11G.6 handoff:

- No runtime security changes are made in 11G.5.
- Proceeding to 11G.6 is acceptable only as operations rollback and handoff documentation, with the P1/P2 security items above carried forward.
- Trusted HTTP LAN residual risk remains bounded and temporary.

Deferred before 11H/wider rollout:

- CSRF/origin enforcement strategy.
- Login and sensitive-route app-layer rate limits.
- POST-only or strongly guarded destructive admin cleanup.
- Raw logical-path preview/download narrowing or status-aware revalidation.
- Final HTTPS/`Secure` cookie deployment decision.

Forward status: Phase 11H.2 is now recorded in `docs/migration/phase-11h-p1-security-gate-decision.md`. Phase 11H.2c implements destructive admin cleanup hardening pending human retest. The remaining 11G.5 P1 findings remain P1 and are not accepted or downgraded by that implementation.

## Next Phase Recommendation

If no new runtime blocker is reported by the human, the current recommended phase after the 11H.2 framework record is:

```text
Phase 11H.2d - Raw Logical-Path File Access Hardening
```

unless a blocker remains in 11H.2c human retest.

11G.6 has carried the P1/P2 security findings into `docs/migration/phase-11g-rollback-release-handoff.md`, and 11H.0 records the final gate sequence in `docs/migration/phase-11h-final-readiness-plan.md`. Neither document approves production, release, operational certification, or go-live by itself. Later 11H phases remain human-controlled and must implement, explicitly accept, defer, or block on the remaining P1 findings before any honest final readiness claim.

If the human wants to harden before 11G.6 instead of recording the handoff first, use narrow follow-up phases:

- `11G.5a - CSRF Origin Check Foundation`
- `11G.5b - Login Rate Limit Foundation`
- `11G.5c - Sensitive Admin/File-Access Route Hardening`

## What Is Not Claimed

- Not production readiness.
- Not release readiness.
- Not operational certification.
- Not go-live approval.
- Not LAN readiness beyond the already bounded 11G.4 smoke evidence.
- Not comprehensive penetration testing.
- Not proof that every route is secure against CSRF or brute force.
- Not proof that reverse proxy, firewall, HTTPS, backup, or rollback operations are configured.
