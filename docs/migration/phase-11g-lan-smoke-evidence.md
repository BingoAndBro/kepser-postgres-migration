# Phase 11G.4 - LAN Binding And Client Smoke Evidence

Date/status: 2026-05-21, human LAN HTTP retest recorded after 11G.4a and 11G.4b; bounded 11G.4 LAN smoke evidence is PASS.

This document records Phase 11G.4 LAN binding and client smoke evidence for the clean local DMS target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime, package, helper, fallback, old-data recovery, or old-file recovery.

The original 11G.4 evidence template was prepared without LAN binding, firewall change, network/interface discovery, package command, dev/preview server command, endpoint call, Docker command, database command, backup/restore command, build, test, route generation, deployment, cleanup, source change, or runtime change by Codex. Phase 11G.4a then made a narrow auth-cookie compatibility fix and documentation update only. Phase 11G.4b then made a narrow browser temporary-ID compatibility fix for LAN HTTP. Codex still did not run LAN binding, firewall, network, app endpoint, Docker, database, backup/restore, build, preview/dev server, E2E, route generation, deployment, cleanup, migration, or seed commands.

## Evidence Source

| Source type | Status | Notes |
|---|---|---|
| Human LAN binding notes | Provided as redacted summary | LAN HTTP was intentionally served on `http://<SERVER_LAN_IP>:<APP_PORT>` with explicit trusted HTTP cookie mode. |
| Human firewall notes | Not separately recorded | No firewall command/output was stored in docs; PostgreSQL broad LAN exposure remained disallowed. |
| Human client-device smoke notes | Final retest provided | Human retest confirmed login/session/logout/preview-download basics plus Ajukan/Revisi additional kelengkapan compatibility after 11G.4b. |
| Screenshots | Not provided | No screenshot evidence was embedded. |
| Terminal output | Not stored | Operator-reported behavior was summarized without storing sensitive values. |

Evidence source summary: operator first reported that HTTP LAN login did not persist `dms_session`; 11G.4a fixed that cookie issue. Human retest after 11G.4a reported LAN login works, `dms_session` and `dms_active_role` are stored, refresh keeps login, `/api/auth/session` authenticates, logout clears `dms_session`, and valid preview/download works. A new 11G.4b blocker was then reported: adding additional kelengkapan in Ajukan/Revisi flow throws `crypto.randomUUID is not a function` over HTTP LAN. Final human retest after 11G.4b confirmed the LAN HTTP form blocker is gone, Ajukan/Revisi additional kelengkapan works, duplicate validation still works, preview/download still works, non-admin admin denial still works, PostgreSQL remains not broadly exposed, and no idle request loop or unbounded resource growth was observed.

## Serving And Binding Summary

| Item | Recorded value | Evidence status | Notes |
|---|---|---|---|
| Date/time | 2026-05-21 final human retest recorded | Recorded | Exact clock time not stored. |
| Operator | Human operator, redacted | Recorded | Non-identifying label only. |
| Source branch | `migration/postgres-local` | Recorded from git status | Branch only; no runtime command executed. |
| Source commit | Not recorded | Not required for bounded PASS | Safe commit label was not included. |
| Serving mode | Existing LAN HTTP serving mode | Recorded at high level | Exact command not stored. |
| App binding used | LAN host binding | Recorded | Redacted as `http://<SERVER_LAN_IP>:<APP_PORT>`. |
| App port used | `<APP_PORT>` | Recorded safely | Exact value intentionally omitted. |
| `APP_URL` handling | Not recorded | Not required | URL itself was redacted. |
| Firewall rule changed | Not recorded | Informational only | No firewall output was stored. |
| Firewall scope | Not recorded | Informational only | No broad PostgreSQL exposure was allowed. |
| PostgreSQL LAN exposure | No / not broadly exposed | PASS | Bounded PASS depends on this remaining true. |
| Server hostname/static IP plan | `<SERVER_LAN_IP>` used | Recorded safely | Redacted label only. |
| Client device | Redacted human LAN client | Recorded safely | Personal device name omitted. |
| Client browser | Browser not recorded | Not required | Functional evidence was sufficient. |
| LAN result | PASS for bounded smoke | Recorded | Not production or go-live approval. |

## Client Smoke Checks

| Check | Result | Evidence status | Notes |
|---|---|---|---|
| Client can open app URL | PASS | Final retest recorded | App served and reachable at `http://<SERVER_LAN_IP>:<APP_PORT>`. |
| Login works from LAN client | PASS | Final retest recorded | Credentials/cookie values not stored. |
| Authenticated session persists across refresh/navigation | PASS | Final retest recorded | `dms_session` remained stored across navigation/refresh. |
| Role dashboard loads | PASS | Final retest recorded indirectly | Authenticated navigation remained usable during smoke. |
| Document list loads | PASS | Final retest recorded indirectly | No list-loading blocker was reported in final smoke. |
| Preview valid file works | PASS | Final retest recorded | Representative valid file smoke passed. |
| Download valid file works | PASS with expected HTTP warning | Final retest recorded | Blob warning over insecure HTTP was not a functional blocker. |
| Unauthorized route/API behavior remains correct | PASS | Final retest recorded | `/api/auth/session` authenticated only with valid session. |
| Admin-only route denied for non-admin | PASS | Final retest recorded | Non-admin access to `/admin` remained denied. |
| Logout works from LAN client | PASS | Final retest recorded | `dms_session` cleared. |
| Ajukan/Revisi additional kelengkapan works | PASS after 11G.4b | Final retest recorded | Additional kelengkapan works in both Ajukan and Revisi. |
| No mixed-origin/cookie issue observed | PASS with bounded HTTP limitation | Final retest recorded | Session cookie compatibility worked; blob warning documented separately. |
| No severe console error | PASS | Final retest recorded | `crypto.randomUUID is not a function` no longer appeared. |
| No severe performance lag | PASS | Final retest recorded | No severe lag or idle request loop was observed. |

## Safety And Security Checks

| Check | Result | Evidence status | Notes |
|---|---|---|---|
| PostgreSQL port not exposed broadly to LAN | PASS | Final retest recorded | Broad PostgreSQL LAN exposure remained disallowed. |
| Only app port intentionally opened | Not recorded | Informational only | Not required for this redacted bounded summary. |
| No secrets printed in logs/screenshots | PASS | Final retest recorded | Cookie values and env values were not stored. |
| `dms_session` remains HttpOnly | PASS | Final retest recorded | Presence/behavior only; no value recorded. |
| `dms_active_role` remains UX-only, not authorization proof | PASS | Final retest recorded | Non-admin `/admin` denial remained effective. |
| Unauthenticated protected page/API behavior remains 401/redirect/login | PASS | Final retest recorded indirectly | Valid session was required for `/api/auth/session`; logout cleared the session. |
| Non-admin admin API/page behavior remains denied | PASS | Final retest recorded | Server-side denial still held. |

## Classification Rules

PASS requires all of the following bounded evidence:

- app intentionally bound for LAN or LAN-equivalent smoke;
- another trusted LAN client can open the app;
- login works from that LAN client;
- authenticated session persists across refresh/navigation;
- role dashboard and at least one document list load;
- preview/download of a representative valid file works, or a limitation is explicitly documented and accepted;
- unauthorized/admin denial remains correct;
- logout works;
- PostgreSQL is not broadly exposed to LAN;
- no severe console, performance, cookie, or mixed-origin issue is observed;
- no secrets, env values, DB URLs, storage roots, cookies, tokens, file tokens, password hashes, private device identifiers, or sensitive physical paths are stored in evidence.

PARTIAL applies when evidence is incomplete, same-machine-only, lacks a second LAN client, omits preview/download, omits firewall scope, or leaves security checks incomplete.

FAIL/BLOCKER applies when the intentionally bound app cannot be reached by the client, login fails due to cookie/origin behavior, data pages fail, preview/download fails for a valid file, unauthorized/admin denial is broken, PostgreSQL is exposed broadly without approved reason, or severe cookie/session/security/performance/console issues are observed.

Current classification: `PASS for bounded LAN smoke after 11G.4a and 11G.4b human retest`.

Rationale: 11G.4a fixed the LAN HTTP session-cookie blocker and 11G.4b fixed the LAN HTTP browser `crypto.randomUUID` compatibility blocker. Final human retest confirmed session persistence, logout clearing, preview/download behavior, non-admin admin denial, Ajukan/Revisi additional kelengkapan compatibility, duplicate validation, and lack of broad PostgreSQL LAN exposure. This PASS is bounded to trusted LAN smoke only and does not imply production readiness, release readiness, operational certification, or go-live approval.

## Phase 11G.4a - LAN HTTP Session Cookie Compatibility Fix

Status: implemented and human-retested as working for trusted HTTP LAN smoke.

Root cause:

- The app was accessed as `http://<SERVER_LAN_IP>:<APP_PORT>`.
- `POST /api/auth/login` returned 200 and issued `Set-Cookie` for `dms_session`.
- The `dms_session` cookie included `Secure`, so a browser using plain HTTP LAN did not store it.
- The readable `dms_active_role` cookie did store, but that cookie is UX state only and is not authorization proof.
- Result: the user stayed on or returned to `/login` after correct credentials because `/api/auth/session` had no stored `dms_session` to validate.

Fix summary:

- `src/lib/auth/session-cookies.ts` now supports explicit `DMS_SESSION_COOKIE_SECURE` control.
- Unset/default behavior remains secure-by-default for production/HTTPS-compatible serving: `Secure` is used in production or HTTPS/proxy-HTTPS requests.
- `DMS_SESSION_COOKIE_SECURE=true` forces `Secure`.
- `DMS_SESSION_COOKIE_SECURE=false` intentionally allows trusted HTTP LAN/local mode to issue `dms_session` without `Secure`.
- `HttpOnly=true`, `SameSite=Lax`, `Path=/`, and current session duration are preserved.
- Logout and password-change clearing use the same session-cookie option source, so clearing is compatible with both secure and trusted HTTP LAN modes.

Security note:

- `DMS_SESSION_COOKIE_SECURE=false` is only for trusted HTTP LAN/local smoke or internal deployment.
- Do not expose HTTP LAN mode to the public internet.
- Final/best-practice deployment should prefer HTTPS plus `Secure=true` or the secure default.
- `dms_active_role` remains UX state only; server/API authorization must continue to validate `dms_session` and assigned roles.

Required manual retest after 11G.4a:

1. Stop the current server.
2. Open a fresh terminal.
3. Confirm `DATABASE_URL` and `DMS_LOCAL_STORAGE_ROOT` restore overrides are not active without printing values.
4. Set explicit trusted HTTP LAN cookie mode, for example `$env:DMS_SESSION_COOKIE_SECURE="false"`.
5. Start the app for LAN HTTP using the existing serving mode and host binding.
6. Open `http://<SERVER_LAN_IP>:<APP_PORT>/login`.
7. Login with a valid user.
8. Confirm `dms_session` is stored in Application Cookies without printing its value.
9. Confirm `/api/auth/session` authenticates.
10. Refresh or navigate to the dashboard and confirm the session persists.
11. Logout and confirm `dms_session` is cleared.
12. Change password and confirm the current session is revoked/cleared.
13. Confirm non-admin access to admin page/API remains denied.
14. Confirm PostgreSQL remains not exposed to LAN.

Retest result summary:

- Human retest used explicit `DMS_SESSION_COOKIE_SECURE=false` for trusted HTTP LAN mode.
- LAN login succeeded and Application Cookies contained both `dms_session` and `dms_active_role` without storing the session cookie value in docs.
- Refresh/navigation preserved login, `/api/auth/session` authenticated, and logout cleared `dms_session`.
- Final recommendation remains HTTPS plus secure cookie behavior for serious/final deployment.

## Phase 11G.4b - LAN HTTP Browser API Compatibility Fix

Status: implemented and human-retested as working for trusted HTTP LAN smoke.

Root cause:

- Ajukan/Revisi additional kelengkapan created temporary `user-custom-*` client row IDs with direct `crypto.randomUUID()`.
- In HTTP LAN browser context, `crypto.randomUUID` may be unavailable because it is restricted to secure contexts such as HTTPS or localhost.
- The failing IDs are temporary client-side form identities for React row tracking and `lampiranUrls[].kelengkapan_id`; they are not authentication, authorization, CSRF, password reset, session, or file-access tokens.

Fix summary:

- Added `src/lib/utils/client-id.ts` with `createClientId(prefix?: string)`.
- The helper tries `globalThis.crypto?.randomUUID?.()`, then `globalThis.crypto?.getRandomValues(...)`, then timestamp plus `Math.random` only as a non-security last resort.
- `KelengkapanChecklist` and `AttachmentEditor` now use `createClientId('user-custom')` for additional kelengkapan client row IDs.
- Duplicate additional kelengkapan validation remains name-based and unchanged.
- Request payload and response shapes remain unchanged.

Security note:

- The fallback helper is only for ephemeral client-side row identity.
- Do not use it for session tokens, file-access tokens, CSRF tokens, password-reset tokens, authorization decisions, or persisted authoritative entity IDs.
- LAN HTTP compatibility does not replace the preferred long-term HTTPS deployment posture.

Required manual retest after 11G.4b:

1. Start LAN HTTP with `DMS_SESSION_COOKIE_SECURE=false`.
2. Login from `http://<SERVER_LAN_IP>:<APP_PORT>`.
3. Open Ajukan Dokumen.
4. Add additional kelengkapan.
5. Confirm no `crypto.randomUUID is not a function` error.
6. Submit a valid document if safe, or stop before submit if only testing form behavior.
7. Open Revisi flow if available.
8. Add additional kelengkapan in Revisi.
9. Confirm duplicate validation still works.
10. Confirm preview/download remains working.
11. Confirm logout still clears `dms_session`.

Retest result summary:

- Ajukan Dokumen additional kelengkapan now works over HTTP LAN.
- Revisi Dokumen additional kelengkapan now works over HTTP LAN.
- `crypto.randomUUID is not a function` no longer appears.
- Duplicate validation still works.
- Preview/download still works after the 11G.4b fix.
- The temporary client ID fallback remains non-security only.

## Human Evidence Checklist

The operator should perform these checks manually and provide redacted results. These are human-only steps; Codex must not run them.

1. Stop any restore-target terminal from the prior backup/restore drill and reopen a normal terminal.
2. Confirm temporary restore environment overrides are gone without printing values.
3. Confirm the app is pointed at the intended normal local PostgreSQL and local storage configuration without printing values.
4. Start the selected app serving mode intentionally for LAN smoke using safe placeholders such as `<HOST_BIND>`, `<APP_PORT>`, and `<APP_URL>`.
5. Treat host binding and firewall exposure as temporary operational setup unless separately approved.
6. Open only the app port on the trusted/private network if a firewall change is required.
7. Do not expose PostgreSQL broadly to the LAN.
8. From another trusted LAN client, open `<APP_URL>`.
9. Login from the LAN client and navigate/refresh to confirm session persistence.
10. Open one role dashboard and at least one representative document list.
11. Add additional kelengkapan in Ajukan and Revisi where available.
12. Preview and download one representative valid uploaded file.
13. Confirm unauthenticated protected access still redirects or returns the expected denial category.
14. Confirm non-admin access to an admin page/API remains denied.
15. Logout from the LAN client and confirm the session is cleared.
16. Check for severe console errors, mixed-origin/cookie issues, and severe perceived lag.
17. Record results using redacted labels such as `<SERVER_LAN_IP>`, `<APP_PORT>`, `<CLIENT_DEVICE>`, and `<APP_URL>`.

## Evidence To Provide

The next update should include:

- date/time;
- operator label;
- source branch;
- source commit;
- serving mode;
- app binding used;
- app port used as a safe placeholder or non-sensitive value;
- `APP_URL` handling status only;
- firewall rule changed yes/no/not recorded;
- firewall scope;
- PostgreSQL LAN exposure yes/no/not recorded;
- server hostname/static IP plan recorded/pending/not recorded;
- client device label and browser;
- client smoke results for all checks above;
- safety/security results for all checks above;
- blockers or deviations.

## Decision

Decision classification: `PASS for bounded LAN smoke after 11G.4a and 11G.4b human retest`.

Rationale: the combined 11G.4a and 11G.4b fixes were retested by a human over trusted HTTP LAN and the bounded smoke checks passed. This classification excludes production readiness, release readiness, operational certification, and go-live approval.

## Next Phase

```text
11G.5 - Cookie Auth, CSRF, Rate-Limit Security Review
```

11G.4 is now sufficiently recorded to advance to 11G.5. This PASS remains bounded LAN smoke validation only and does not imply production readiness, release readiness, operational certification, or go-live approval.

## Evidence Handling Rules

- Do not store secrets, env values, DB URLs, storage roots, password hashes, session tokens, file tokens, cookie values, or sensitive physical storage paths.
- Do not store personally identifying device names, usernames, or user-specific hostnames.
- If evidence includes sensitive values, record them as `redacted` or `provided privately by operator, not stored in docs`.
- Do not embed raw screenshots that expose sensitive values, local paths, cookies, tokens, private IPs, or personal device identifiers.
- Use placeholders such as `<SERVER_LAN_IP>`, `<APP_PORT>`, `<CLIENT_DEVICE>`, and `<APP_URL>`.
- Same-machine-only validation must not be classified as PASS for LAN smoke evidence.
- Prefer minimal app-port firewall scope over broad inbound allow rules.
- Do not claim LAN readiness, production readiness, release readiness, operational certification, or go-live approval from this evidence.
