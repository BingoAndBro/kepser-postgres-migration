# Phase 11H.2 - P1 Security Gate Decision

Date prepared: 2026-05-21.

Status: decision framework recorded; CSRF/origin protection implemented and human-smoked; login rate-limit/brute-force foundation implemented and human-smoked; destructive admin cleanup hardening implemented and human-smoked; raw logical-path file-access hardening implemented and human-smoked.

This phase records the human-controlled decision framework for unresolved P1 security gates carried from Phase 11G.5 and Phase 11G.6. Phase 11H.2a now implements the selected CSRF/origin protection foundation, Phase 11H.2b implements the selected login rate-limit/brute-force foundation, Phase 11H.2c implements the selected destructive admin cleanup hardening, and Phase 11H.2d implements the selected raw logical-path file-access hardening. This document still does not accept any P1 risk by omission, does not downgrade any P1 item, and does not make a final release handoff decision.

The local target remains:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime or package dependency;
- no old Supabase data or file recovery expected.

## Scope And Non-Goals

Allowed in 11H.2:

- record the current issue, risk, affected surfaces, mitigations, options, decision status, required follow-up phase, and release classification impact for each unresolved P1 gate;
- update migration decision docs and forward links;
- preserve the P1 security gates without downgrade.

Not allowed in the original framework-only 11H.2 record:

- no CSRF implementation;
- no Origin or Referer middleware implementation;
- no rate-limit implementation;
- no additional destructive admin cleanup route implementation beyond the selected Phase 11H.2c hardening recorded below;
- no raw logical-path file-access hardening implementation before the selected Phase 11H.2d follow-up recorded below;
- no runtime source, test, package, env, DB, Drizzle, Supabase folder, route-generation, firewall/network, backup/restore, storage cleanup, or commit changes;
- no final readiness, production readiness, LAN readiness, release readiness, operational certification, or go-live approval claim.

Phase 11H.2a, Phase 11H.2b, Phase 11H.2c, and Phase 11H.2d are the human-selected runtime follow-up exceptions for CSRF/origin protection, login rate-limit/brute-force protection, destructive admin cleanup hardening, and raw logical-path file-access hardening. They do not authorize unrelated runtime changes.

## Decision Policy

Accepted bounded risk requires explicit human-reviewed operational risk acceptance. It cannot be inferred from silence, omission, or documentation completion.

If a P1 item is accepted as bounded risk, the exact deployment boundary must be stated. Trusted HTTP LAN means internal trusted clients only, no public internet exposure, no broader rollout approval, and no reuse as a public deployment posture. Preferred final posture remains HTTPS plus `Secure` `dms_session` cookies.

Phase 11H.2 initially recorded no explicit human disposition for the four P1 items. On 2026-05-21, the human selected incremental P1 implementation and chose Phase 11H.2c Destructive Admin Cleanup Hardening as the first follow-up, then selected Phase 11H.2d Raw Logical-Path File Access Hardening, then selected Phase 11H.2b Login Rate-Limit/Brute-Force Follow-up. On 2026-05-22, the human selected Phase 11H.2a CSRF/Origin Protection Follow-up.

The CSRF/origin, login rate-limit, destructive admin cleanup, and raw logical-path file-access items are now:

```text
implementation selected, implemented, and human-smoked
```

11H.3 uses this human-smoked status as bounded operational evidence for a partial / bounded release handoff. It is not temporary public approval and does not authorize production readiness, operational certification, broad LAN readiness, or go-live.

## P1 Decision Matrix

| P1 item | Current human decision | Required next phase if implementation is selected | Release classification impact |
|---|---|---|---|
| CSRF/origin strategy | implementation selected, implemented, and human-smoked | Phase 11H.2a - CSRF/Origin Protection Follow-up | Supports bounded internal/local/LAN handoff; not a full CSRF token framework. |
| Login rate-limit/brute-force foundation | implementation selected, implemented, and human-smoked | Phase 11H.2b - Login Rate-Limit/Brute-Force Follow-up | Supports bounded local single-process handoff; persistent/distributed limits remain future hardening. |
| Destructive admin cleanup hardening | implementation selected, implemented, and human-smoked | Phase 11H.2c - Destructive Admin Cleanup Hardening | Supports bounded handoff; destructive cleanup remains operator-controlled. |
| Raw logical-path file-access hardening | implementation selected, implemented, and human-smoked | Phase 11H.2d - Raw Logical-Path File Access Hardening | Supports bounded handoff; `DIMUSNAHKAN` revalidation remains the access authority. |

## 1. CSRF/Origin Strategy

Previous issue:

- No app-wide CSRF token or explicit `Origin`/`Referer` validation was found in 11G.5.
- Cookie-authenticated state-changing routes relied on `SameSite=Lax`, method restrictions, validation, session/RBAC revalidation, and status/owner checks.

11H.2a implementation status:

- `src/lib/security/same-origin.ts` adds a centralized server-only unsafe-method guard.
- Unsafe methods are `POST`, `PUT`, `PATCH`, and `DELETE`.
- Safe methods `GET`, `HEAD`, and `OPTIONS` are not blocked only because `Origin` is absent; this assumes those routes remain non-mutating.
- For unsafe requests, `Origin` must match an allowed same-origin expectation. Allowed origins are derived from `request.url`, valid server-side `APP_URL` when configured, `X-Forwarded-Host` plus `X-Forwarded-Proto` when present, and `Host` with the request URL protocol.
- If `Origin` is absent, `Referer` is accepted only when it parses to one of the allowed origins.
- Unsafe requests with cross-origin `Origin`, invalid `Origin`, cross-origin `Referer`, or missing both `Origin` and `Referer` return generic `403 { "error": "Permintaan tidak diizinkan" }`.
- The guard is applied to all currently inventoried unsafe handlers under `src/routes/api/**`, including login, logout, role switch, password change, document mutations, upload/pending cleanup, PPK/Bendahara workflow mutations, Arsiparis archive/lifecycle/destructive mutations, admin/master-data/user/Ketua Tim mutations, and admin cleanup.
- `POST /api/auth/login` is protected because it creates a session and can otherwise support login-CSRF/session-confusion abuse.
- No CSRF token framework, package dependency, DB schema change, route generation, Supabase fallback, or auth/RBAC redesign was added.
- Strict missing-header rejection is a deliberate foundation choice. Some non-browser tools or privacy configurations that omit both `Origin` and `Referer` must send a same-origin `Origin` header or use an allowed same-origin `Referer`.

Risk summary:

- Browser-based cookie-authenticated state changes remain exposed to CSRF-style risks that `SameSite=Lax` does not fully eliminate.
- High-impact actions include password changes, admin user operations, document workflow mutations, archive lifecycle actions, upload/pending cleanup, and destructive cleanup.

Affected surfaces:

- Auth logout and role switch.
- Self-service password change.
- Admin user/password/master-data/Ketua Tim mutations.
- Pegawai document create/update/submit/delete.
- PPK/Bendahara approval, rejection, kembalikan, and resubmit actions.
- Arsip archive/lifecycle/destruction actions.
- Upload and pending cleanup routes.
- Destructive admin cleanup when armed.

Current mitigation after 11H.2a:

- `dms_session` is `HttpOnly`.
- `SameSite=Lax` is set.
- State-changing routes use unsafe methods and now have explicit same-origin protection.
- Server routes revalidate session, assigned roles, ownership, document/archive status, and request payloads where applicable.

Decision options:

- A. Implement Phase 11H.2a CSRF/Origin Protection Follow-up before 11H.3.
- B. Accept bounded trusted-LAN-only risk with explicit written constraints.
- C. Defer final release classification.
- D. Block final readiness.

Current human decision:

```text
implementation selected, implemented, and human-smoked
```

Required next phase if implementation is selected:

```text
Phase 11H.2a - CSRF/Origin Protection Follow-up
```

Release classification impact:

- This P1 item is no longer decision-pending and is recorded as human-smoked for bounded 11H.3 classification.
- 11H.3 may use this as bounded operational evidence, not as comprehensive browser-security certification.
- This is a bounded same-origin foundation, not comprehensive browser-security certification.

## 2. Login Rate-Limit/Brute-Force Foundation

Previous issue:

- No active app-layer login throttling was found in 11G.5.

11H.2b implementation status:

- `POST /api/auth/login` now applies an app-layer in-memory limiter before local credential verification.
- The limiter key uses normalized email/identifier plus request IP when available, with identifier-only or IP-only fallback when one side is unavailable.
- The policy allows 5 failed attempts per key within 10 minutes, then returns `429` with a `Retry-After` header during a 15-minute cooldown.
- Failed attempts are recorded for failed local login results only. Successful login clears the key before threshold.
- Rate-limited requests are blocked before password verification, so correct credentials remain blocked until cooldown expiry.
- Invalid login responses remain generic and do not distinguish missing user from wrong password. The login route now also maps failed local-auth results to the same generic credential body instead of exposing account-state details.
- The limiter stores no passwords, password hashes, session tokens, cookies, env values, storage roots, DB URLs, file tokens, or physical paths.
- In-memory limiter state is bounded and pruned. It resets on process restart and is not distributed across multiple app instances.

Risk summary:

- Login is reachable before authentication and is the primary brute-force surface.
- Generic credential errors and Argon2id password hashing help, but they are not a throttling or lockout strategy.
- Severity depends on deployment exposure, but absence of app-layer throttling remains P1 before final/wider rollout.

Affected surfaces:

- Login endpoint and login form.
- Potentially password change and admin password/user management actions as later scoped throttling backlog.

Current mitigation after 11H.2b:

- Passwords use Argon2id.
- Login returns generic invalid-credential behavior.
- The login route has a minimal local-process rate-limit/cooldown foundation.
- Local/LAN placement and firewall/reverse-proxy controls may reduce exposure, but they are not app-layer protection.

Decision options:

- A. Implement Phase 11H.2b Login Rate-Limit/Brute-Force Follow-up before 11H.3.
- B. Accept bounded trusted-LAN-only risk with explicit written constraints for trusted LAN/internal use and low-exposure deployment only.
- C. Defer final release classification.
- D. Block final readiness.

Current human decision:

```text
implementation selected, implemented, and human-smoked
```

Implementation phase:

```text
Phase 11H.2b - Login Rate-Limit/Brute-Force Follow-up
```

Release classification impact:

- This P1 item is no longer decision-pending and is recorded as human-smoked for bounded 11H.3 classification.
- The in-memory limiter remains local-process only and is not persistent or distributed.
- The in-memory limiter is sufficient as a local single-process foundation for the current local/LAN target, but stronger reverse-proxy and/or persistent distributed throttling may be required later depending on final deployment topology.

## 3. Destructive Admin Cleanup Hardening

Previous issue:

- Destructive admin cleanup can currently be triggered via GET query flags.

11H.2c implementation status:

- `GET /api/admin/cleanup-orphan-files` is now non-destructive and always behaves as dry-run/report, even when `dry_run=false` appears in the query string.
- Destructive cleanup now requires `POST /api/admin/cleanup-orphan-files` with JSON body intent.
- POST destructive cleanup requires `dry_run=false` and `confirm=true`.
- Pending cleanup still additionally requires `include_pending=true`, `confirm=true`, and age eligibility through `min_age_minutes`.
- Missing destructive intent defaults to safe dry-run behavior; invalid POST body values return `400`.
- Existing local `dms_session` and assigned `ADMIN` authorization remain required.
- Response payloads continue to use logical storage paths and summary fields; no physical paths or storage roots are exposed.

Risk summary:

- Destructive file cleanup is high-impact.
- GET-triggered destructive behavior is weak against accidental link navigation and CSRF-style browser flows compared with POST-only mutation semantics plus origin/CSRF protection.
- Current dry-run defaults and ADMIN checks reduce risk but do not resolve the method/CSRF concern.

Affected surfaces:

- Admin storage diagnostics and orphan cleanup flow.
- Any operator workflow that arms cleanup with destructive query flags.

Current mitigation after 11H.2c:

- Route requires assigned `ADMIN`.
- GET cleanup is dry-run/report-only.
- POST cleanup defaults to dry-run/report-only unless destructive intent is explicit in the JSON body.
- Formal orphan deletion requires POST body `dry_run=false` and `confirm=true`.
- Pending deletion requires POST body `dry_run=false`, `include_pending=true`, `confirm=true`, and age eligibility.
- Cleanup protects referenced document paths and retained archive snapshots, skips unsupported/pending categories unless explicitly armed, and avoids physical path disclosure.

Decision options:

- A. Implement Phase 11H.2c Destructive Admin Cleanup Hardening before 11H.3.
- B. Accept bounded risk only if the admin-only route remains unexposed, procedure-controlled, and internal/trusted.
- C. Defer final release classification.
- D. Block final readiness.

Current human decision:

```text
implementation selected, implemented, and human-smoked
```

Implementation phase:

```text
Phase 11H.2c - Destructive Admin Cleanup Hardening
```

Release classification impact:

- This P1 item is no longer decision-pending and is recorded as human-smoked for bounded 11H.3 classification.
- This implementation remains separate from the app-wide same-origin guard and does not by itself prove complete CSRF coverage.
- This implementation does not add the separate app-wide CSRF/origin strategy and does not resolve the raw logical-path file-access P1.

## 4. Raw Logical-Path File-Access Hardening

Previous issue:

- Raw logical-path preview/download compatibility routes do not independently revalidate archive status like document-token routes do.
- Concern: `DIMUSNAHKAN` policy must not be bypassed by stale/raw access.

11H.2d implementation status:

- `GET /api/dokumen/preview-url?url=...` and `GET /api/dokumen/download-url?url=...` now call centralized raw logical-path authorization before issuing internal `{ signedUrl }` tokens.
- `/api/files/access?token=...` now revalidates raw logical-path tokens at token-use time against current local PostgreSQL document/archive references.
- Any current archive reference with `status_arsip='DIMUSNAHKAN'`, including archives associated with a referenced document or direct `arsip.lampiran_snapshot` references, returns `410` and blocks file streaming.
- Stale raw tokens are not sufficient after archive state changes because the access route re-queries current authoritative state before reading the local file.
- Pending-upload raw paths remain owner/session-scoped; workflow roles do not gain cross-user pending access by path knowledge.
- Non-referenced raw paths are owner-scoped only. Workflow-role raw compatibility remains only for paths that are currently governed by readable document/archive metadata.
- Token payload shape remains minimal and context-free for Phase 9B compatibility; no physical path, storage root, DB URL, env value, secret, cookie value, or token internals are added to the payload or response.

Risk summary:

- Document-token routes revalidate document/archive status and block destroyed archive access.
- Raw logical-path compatibility can authorize by path ownership or broad role knowledge without independent archive status revalidation.
- A stale or known logical path must not bypass `DIMUSNAHKAN` access policy.

Affected surfaces:

- Raw logical-path preview URL compatibility route.
- Raw logical-path download URL compatibility route.
- Internal file-access tokens issued from raw logical-path requests.

Current mitigation after 11H.2d:

- Raw access still requires a local session.
- Logical paths are validated.
- Path traversal and root containment checks exist.
- Raw token use performs current document/archive status revalidation.
- Existing role compatibility is narrowed to current readable governed document/archive references.
- Pending and otherwise ungoverned paths are owner-scoped.
- Document-specific file-access routes block `DIMUSNAHKAN`.

Decision options:

- A. Implement Phase 11H.2d Raw Logical-Path File Access Hardening before 11H.3.
- B. Accept bounded risk only if raw compatibility routes are constrained and not used for destroyed archives.
- C. Defer final release classification.
- D. Block final readiness.

Current human decision:

```text
implementation selected, implemented, and human-smoked
```

Implementation phase:

```text
Phase 11H.2d - Raw Logical-Path File Access Hardening
```

Release classification impact:

- This P1 item is no longer decision-pending and is recorded as human-smoked for bounded 11H.3 classification.
- This implementation remains separate from the 11H.2a same-origin guard.
- This implementation remains separate from the 11H.2a same-origin guard.

## Current 11H.2 Classification

```text
decision framework recorded, 11H.2a/11H.2b/11H.2c/11H.2d implemented and human-smoked
```

Rationale: the P1 matrix is recorded, the human selected incremental implementation, and the CSRF/origin foundation, login rate-limit/brute-force foundation, destructive admin cleanup, and raw logical-path file-access runtime changes are implemented and human-smoked.

## Release Classification Impact

No final readiness decision is made by this phase.

11H.3 classification impact:

- final release handoff classification is partial / bounded;
- 11H.3 may proceed only as a bounded governance handoff, not final readiness approval for public production;
- trusted HTTP LAN evidence remains bounded smoke input only;
- trusted HTTP LAN is not public or wider rollout approval;
- preferred final posture remains HTTPS plus `Secure` `dms_session` cookies.

## Next Recommended Phase

```text
Human-controlled maintenance/backlog governance
```

after the 11H.3 final classification in `docs/migration/phase-11h-final-release-classification.md`.

## What Is Not Claimed

- Not security certification.
- Not penetration testing completion.
- Not final release approval.
- Not production readiness.
- Not LAN readiness.
- Not release readiness.
- Not operational certification.
- Not go-live approval.
- Not acceptance of bounded risk.
- Not comprehensive CSRF/security certification.
