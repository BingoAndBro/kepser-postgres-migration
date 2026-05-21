# Phase 11G Operations Hardening Plan

Date prepared: 2026-05-21.

Status: Phase 11G.6 rollback/release handoff is prepared in `docs/migration/phase-11g-rollback-release-handoff.md`. Phase 11G.5 security posture review is recorded in `docs/migration/phase-11g-security-review.md`. Phase 11G.4 bounded LAN smoke is PASS after 11G.4a and 11G.4b human retest, Phase 11G.3 backup/restore drill evidence is PASS for the bounded drill, and Phase 11G.2a clean preview performance evidence is recorded. No backup, restore, LAN binding, firewall change, security implementation, performance implementation, package change, DB command, route generation, deployment command, Lighthouse run, build, preview, broad test, cleanup, or release decision is performed by this document.

This plan breaks Phase 11G into small reviewable subphases before any operational drill or LAN exposure. The local target remains local PostgreSQL plus Drizzle, local `dms_session` auth, and local filesystem storage. Old Supabase data and old Supabase Storage files are not recovered, copied, downloaded, backfilled, synced, or used as fallback.

## Subphase Sequence

| Phase | Name | Scope | Exit condition |
|---|---|---|---|
| 11G.0 | Operational Hardening Breakdown Planning | Docs-only planning and lightweight audits. | 11G subphases, guardrails, and next phase are documented. |
| 11G.1 | Operational Readiness Runbook And Backup/Restore Plan | Create runbook and evidence templates only. No actual backup/restore. | Human has a reviewed procedure and evidence template to execute later. |
| 11G.2 | Preview Performance Baseline And Asset Hygiene Planning | Clean no-extension Lighthouse baseline and asset/performance classification procedure only. | Baseline procedure and evidence template are documented. |
| 11G.2a | Human Clean Preview Performance Baseline Evidence | Human runs clean no-extension Lighthouse; Codex records evidence only. | Official baseline evidence, provenance, and next recommendation are recorded. |
| 11G.3 | Human-Run Backup/Restore Drill Evidence | Human executes backup/restore into a clean local target; Codex records evidence only. | Restore evidence, validation checks, and blockers are recorded. |
| 11G.4 | LAN Binding And Client Smoke Evidence | Human intentionally binds app to LAN and tests from another trusted LAN client. | Host/port/firewall/client smoke evidence is recorded without broad PostgreSQL exposure. |
| 11G.4a | LAN HTTP Session Cookie Compatibility Fix | Narrow auth-cookie helper fix for trusted HTTP LAN mode only. | `DMS_SESSION_COOKIE_SECURE=false` can omit `Secure` for HTTP LAN while HTTPS/production-like defaults remain secure. |
| 11G.4b | LAN HTTP Browser API Compatibility Fix | Narrow client-side temporary ID fallback for additional kelengkapan over HTTP LAN. | Ajukan/Revisi additional kelengkapan no longer depends directly on `crypto.randomUUID()` in HTTP LAN browser contexts. |
| 11G.5 | Cookie Auth, CSRF, Rate-Limit Security Review | Review-only first pass over cookie-auth and state-changing routes. | Review complete in `phase-11g-security-review.md`; P1/P2 hardening items are carried to 11G.6/11H handoff. |
| 11G.6 | Operations Rollback And Release Handoff | Consolidate rollback plan, operator checklist, known accepted risks, and 11H inputs. | Phase 11H has evidence, open blockers, and accepted risks to review. |
| 11H | Final Release Readiness Gate And Supabase Retirement Decision | Human go/no-go decision. | Human records the final decision; no automatic certification. |

The structure above preserves the existing 11G direction but splits operational work before execution. This is safer than combining planning, backup/restore, LAN exposure, firewall changes, and security implementation in one phase.

## Phase Boundaries

### 11G.0 Current Phase

Allowed:

- Update planning docs.
- Record the subphase sequence.
- Classify performance, backup/restore, LAN, security, rollback, and deferred items.
- Run lightweight Git/text audits only.

Forbidden:

- Runtime source changes, tests, package/env changes, DB schema/migrations/seeds/scripts, route generation, deployment, backup, restore, firewall, Docker, package, preview/dev server, and E2E commands.
- `.env` or `.env.migration` inspection, printing, editing, staging, or committing.
- Production readiness, LAN readiness, backup/restore completion, release readiness, or go-live approval claims.

### 11G.1 Runbook And Backup/Restore Plan

Output should be a human-executable runbook and evidence template, not an executed drill.

11G.1 runbook:

- `docs/migration/phase-11g-backup-restore-runbook.md`

The runbook defines operator prerequisites, required backup artifacts, PostgreSQL dump and restore command templates, local storage archive/copy templates, metadata manifest template, restore-to-clean-target flow, DB/storage alignment checks, `DIMUSNAHKAN` access validation, storage diagnostics dry-run validation, rollback pairing rules, and the evidence log for Phase 11G.3.

The plan must cover:

- PostgreSQL dump.
- Local storage backup.
- Backup timestamp and version metadata.
- App commit hash.
- Environment/config reference by name only, without printing secrets or physical storage roots.
- Restore validation checklist.
- DB/storage logical-path alignment.
- `DIMUSNAHKAN` preview/download/file-access blocking after restore.
- Admin storage diagnostics dry-run/report-only after restore.
- No old Supabase data/file recovery.

### 11G.2 Performance Baseline And Asset Hygiene Planning

The recent Lighthouse results are environment-dependent evidence, not final deployment performance proof. The official baseline should be recorded from a clean browser profile with extensions disabled.

11G.2 plan:

- `docs/migration/phase-11g-performance-baseline-plan.md`

The plan defines clean-browser baseline conditions, human-only baseline command templates, an operationally manageable role/page matrix, metrics to record, evidence table, asset hygiene classification, cache/compression classification, TBT/main-thread classification, internal decision thresholds, and the handoff choice between a human-run 11G.2a baseline evidence phase and 11G.3 backup/restore drill evidence.

11G.2a evidence status:

- `docs/migration/phase-11g-performance-baseline-plan.md` now contains a `Phase 11G.2a - Human Clean Preview Performance Baseline Evidence` section.
- Evidence is recorded from the 2026-05-21 human-provided clean preview Lighthouse results.
- Recorded pages are `/login`, `/pegawai`, `/ppk`, `/bendahara/selesai`, `/arsiparis`, and `/admin/master-data/user`.
- Performance scores are all between 97 and 99; Accessibility scores are all between 92 and 96; Best Practices is 100 on all provided pages; SEO is 92 on all provided pages.
- Missing metrics such as FCP, LCP, TBT, CLS, request count, and transfer size remain `not recorded` rather than inferred.
- Earlier Lighthouse scores in the 70s are now treated as likely environment or extension/test-condition noise unless reproduced again under clean no-extension conditions.
- Recommendations from the recorded evidence are: proceed to 11G.3, keep `/bps-logo.png` as optional P2 asset hygiene, and do not open 11G.2c from the current evidence.

Minimum role/page coverage:

- one Pegawai page;
- one Admin page;
- one Arsiparis page;
- one workflow inbox page.

Classification rules:

- Performance baseline is planned before final 11G/11H decision.
- It does not block 11G.1 docs/runbook work.
- It may justify a small later implementation slice for asset hygiene only if the baseline confirms easy wins.
- Browser extensions must be excluded from the official baseline.
- `pnpm preview` cache/compression findings are deployment-server concerns unless reproduced in the final serving setup.
- Large `/bps-logo.png` is a likely real asset hygiene item.
- Admin/role dashboard TBT around 400-600 ms and main-thread work remain P2 unless a clean preview baseline repeatedly shows Performance below 60, TBT above 1000 ms, severe lag, idle request loops, or unbounded heap/listener/DOM growth.
- Performance score at or above 75 on clean preview can be acceptable as internal LAN input if no severe lag, request loop, or unbounded growth is present.
- Accessibility should ideally be at or above 90 on main target pages, or remaining issues should be documented.
- No image optimization, caching/compression change, code splitting, or dashboard performance implementation belongs to 11G.2.

### 11G.3 Backup/Restore Drill Evidence

The human executes the selected backup and restore commands against a clean local target. Codex may update docs from human-provided evidence only.

Dedicated evidence log:

- `docs/migration/phase-11g-backup-restore-evidence.md`

Current 11G.3 status:

- Evidence source: human manual notes and summarized terminal output.
- Backup evidence: PostgreSQL dump created, `pg_restore -l` validation passed, storage backup created, manifest created, package metadata reference recorded, non-secret config key names recorded, backup location operator-held/redacted.
- Restore evidence: clean local target, clean DB before restore, PostgreSQL restore completed, storage restore completed, app pointed to restored target without printing values, app started in dev mode, login/list/preview/download checks passed, diagnostics and cleanup dry-run reviewed, destructive cleanup avoided.
- DB/storage alignment evidence: selected `dokumen_transaksi.lampiran_urls` align, cleanup dry-run did not list referenced files as orphan, missing referenced files were classified carefully and not auto-cleaned.
- Decision classification: `PASS` for the bounded backup/restore drill.
- Next recommendation: `Phase 11G.4 - LAN Binding And Client Smoke Evidence`.

Evidence template:

| Item | Evidence | Result | Notes |
|---|---|---|---|
| Source commit hash | TODO | TODO |  |
| Backup timestamp | TODO | TODO |  |
| PostgreSQL dump created | TODO | TODO |  |
| Storage archive created | TODO | TODO |  |
| Restore target confirmed clean | TODO | TODO |  |
| Database restored | TODO | TODO |  |
| Storage restored | TODO | TODO |  |
| Login works | TODO | TODO |  |
| Document list works | TODO | TODO |  |
| Valid preview/download works | TODO | TODO |  |
| `DIMUSNAHKAN` access blocked | TODO | TODO |  |
| DB/storage logical paths align | TODO | TODO |  |
| Storage diagnostics dry-run completed | TODO | TODO |  |

### 11G.4 LAN Binding And Client Smoke Evidence

The human intentionally binds the app to a LAN-reachable host/interface and tests from another trusted LAN client.

Dedicated evidence log:

- `docs/migration/phase-11g-lan-smoke-evidence.md`

Current 11G.4 status:

- Evidence source: final human LAN HTTP retest summary provided after 11G.4a and 11G.4b.
- Serving/binding evidence: app was served on `http://<SERVER_LAN_IP>:<APP_PORT>` with LAN host binding and explicit trusted HTTP cookie mode.
- Firewall evidence: not separately recorded in docs, but PostgreSQL remained not broadly exposed.
- Another-device client smoke evidence: login/session/logout/preview-download basics worked; Ajukan/Revisi additional kelengkapan also worked after 11G.4b; duplicate validation still worked.
- Security/safety evidence: non-admin `/admin` denial still worked, no destructive cleanup was run, and no idle request loop or unbounded resource growth was observed.
- Decision classification: `PASS for bounded LAN smoke after 11G.4a and 11G.4b human retest`.
- Next recommendation: `11G.5 - Cookie Auth, CSRF, Rate-Limit Security Review`.

11G.4a root cause and fix:

- Root cause: HTTP LAN login response set `dms_session` with `Secure`, so the browser did not store it for `http://<SERVER_LAN_IP>:<APP_PORT>`.
- Compatibility fix: `src/lib/auth/session-cookies.ts` accepts explicit `DMS_SESSION_COOKIE_SECURE=false` to omit `Secure` for trusted HTTP LAN/local mode.
- Secure default preserved: when unset, production or HTTPS/proxy-HTTPS requests still issue `dms_session` with `Secure`; `DMS_SESSION_COOKIE_SECURE=true` forces `Secure`.
- Clearing compatibility preserved: logout and password-change session clearing use the same option source.
- Security boundary preserved: `dms_session` remains `HttpOnly`; `dms_active_role` remains UX state only and not authorization proof.

11G.4b root cause and fix:

- Root cause: Ajukan/Revisi additional kelengkapan used direct browser `crypto.randomUUID()` for temporary `user-custom-*` row IDs, which can be unavailable over HTTP LAN because it requires a secure browser context.
- Compatibility fix: `src/lib/utils/client-id.ts` adds `createClientId(...)` for non-security ephemeral client IDs using `randomUUID`, then `getRandomValues`, then timestamp plus `Math.random` as a last resort.
- Runtime scope: only `KelengkapanChecklist` and `AttachmentEditor` additional kelengkapan IDs were changed.
- Security boundary preserved: the helper must not be used for sessions, file-access tokens, CSRF, password reset, authorization, or authoritative persisted entity IDs.

Planning must include:

- Host/port binding.
- Static IP or hostname strategy.
- Firewall allowlist for the app port only on trusted/private network.
- No broad PostgreSQL exposure by default.
- Client-device smoke from another LAN device.
- Logs and screenshots that do not expose secrets, DB URLs, token values, password hashes, cookie values, file tokens, env values, or physical storage roots.
- If serving over trusted HTTP LAN, set `DMS_SESSION_COOKIE_SECURE=false` explicitly and record only that the key was set, not unrelated env values.
- Confirm `dms_session` is stored without printing its value, `/api/auth/session` authenticates, refresh/navigation preserves login, logout clears the session, password-change revokes/clears the current session, and non-admin admin denial still works.
- Confirm adding additional kelengkapan in Ajukan/Revisi does not throw `crypto.randomUUID is not a function`, duplicate validation still works, and payload/response shapes remain compatible.
- If download opens a `blob:http://...` warning over insecure HTTP, classify it as an expected limitation of trusted HTTP LAN mode rather than a functional blocker, and keep final deployment guidance on HTTPS plus secure cookies.

Evidence template:

| Item | Evidence | Result | Notes |
|---|---|---|---|
| Server host/IP or hostname recorded safely | TODO | TODO | Do not include secrets. |
| App port intentionally selected | TODO | TODO |  |
| Firewall app-port allowlist reviewed | TODO | TODO |  |
| PostgreSQL not broadly exposed | TODO | TODO |  |
| Client device opens app | TODO | TODO |  |
| Login from client device works | TODO | TODO |  |
| Role dashboard opens from client device | TODO | TODO |  |
| Preview/download from client device works | TODO | TODO |  |

Same-machine-only validation cannot be classified as PASS for 11G.4. The current PASS is bounded to recorded LAN smoke validation only and does not imply production readiness, release readiness, operational certification, or go-live approval.

### 11G.5 Cookie Auth, CSRF, Rate-Limit Security Review

Dedicated review:

- `docs/migration/phase-11g-security-review.md`

Current 11G.5 status:

- Review classification: complete for the bounded documentation/security posture scope.
- No runtime security changes were implemented.
- No P0/P1 blocker was found that prevents starting 11G.6 rollback/handoff documentation.
- P1 before 11H/wider rollout: explicit CSRF/origin strategy for cookie-authenticated state-changing routes.
- P1 before 11H/wider rollout: app-layer login brute-force/rate-limit foundation.
- P1 before 11H/wider rollout: harden destructive admin storage cleanup because destructive mode is currently a GET route with query flags.
- P1 before 11H/wider rollout: narrow or status-revalidate raw logical-path preview/download compatibility routes so they cannot bypass `DIMUSNAHKAN` protections.
- P2 before final release: add scoped throttling/audit coverage for upload, file-token issuance, workflow, archive, and admin mutations.

This is review-only first. Any CSRF, rate-limit, admin cleanup, or file-access hardening implementation must be a later approved implementation phase.

Review checklist:

- `dms_session` is `HttpOnly`.
- SameSite and Secure posture are documented for HTTP LAN versus HTTPS LAN.
- Logout invalidates the server session and clears cookies.
- Password change/reset invalidates relevant sessions.
- Unauthenticated POST requests are rejected.
- Non-admin access to admin routes is denied server-side.
- State-changing cookie-auth routes are inventoried and CSRF posture is classified.
- Login, password reset/change, upload, and other sensitive routes have brute-force/rate-limit posture classified.
- Security posture does not rely on Supabase Auth protections.
- Trusted HTTP LAN residual risk is documented as temporary and bounded.

### 11G.6 Rollback And 11H Handoff

Dedicated handoff:

- `docs/migration/phase-11g-rollback-release-handoff.md`

Current 11G.6 status:

- Handoff documentation is prepared.
- Evidence inventory links 11G.2a, 11G.3, 11G.4, and 11G.5 without overclaiming what each evidence item proves.
- Rollback guidance covers app source, PostgreSQL dump restore, storage archive restore, config rollback, LAN deployment rollback, and DB/storage pairing rules.
- Operator handoff checklist includes branch/commit, backup id, DB dump, storage archive, manifest, restore drill, LAN smoke, security review, P1 acceptance/scheduling, HTTPS decision, `DMS_SESSION_COOKIE_SECURE`, no old Supabase recovery, and no Supabase fallback.
- 11H release-input checklist separates completed evidence, unresolved P1s, P2/P3 backlog, residual risks, and explicit human decisions.
- 11G.5 P1 security items remain P1 before 11H/wider rollout and are not implicitly accepted by documentation completion.
- Supabase retirement handoff distinguishes active runtime/package retirement from historical docs references.
- Decision classification is `complete` for docs handoff only.

The handoff consolidates:

- App rollback procedure.
- Database restore rollback procedure.
- Storage restore rollback procedure.
- Backup set selection rules.
- Operator checklist.
- Known accepted risks.
- Evidence inventory for 11H.
- Explicit blockers or deferred items.

11G.6 does not approve deployment by itself. Phase 11H remains a human-controlled final decision and must address or explicitly accept the P1 security findings.

## Priority Classification

| Priority | Item | Notes |
|---|---|---|
| P1 before 11H | Backup/restore drill | Must include DB plus storage restore and validation evidence. |
| P1 before 11H | LAN client smoke | Must prove intentional app access from another trusted LAN client. |
| P1 before 11H | Rollback plan | Must cover app, DB, and storage. |
| P1 before 11H | Cookie-auth security review | Must include CSRF/rate-limit posture and server-side denial checks. |
| P1 before 11H | CSRF/origin strategy | SameSite=Lax is not complete protection for cookie-authenticated state-changing routes. |
| P1 before 11H | Login rate-limit foundation | Current app-layer throttling is absent; reverse proxy/firewall limits are defense in depth only. |
| P1 before 11H | Sensitive admin/file-access hardening | Destructive admin cleanup should not remain GET-triggered for final/wider rollout; raw logical-path file access needs status-aware `DIMUSNAHKAN` protection or narrowing. |
| P1/P2 depending clean baseline | Performance baseline and asset hygiene | Baseline is required before final decision; implementation depends on clean evidence. |
| P2/P3 | Admin TBT optimization | P2 only if clean preview shows meaningful lag; otherwise backlog. |
| P2/P3 | Broader accessibility polish | Beyond already fixed findings unless new concrete blockers appear. |
| P2/P3 | `DIMUSNAHKAN` missing-file diagnostics refinement | Keep runtime access blocking as the P1 invariant; diagnostics polish can follow. |
| P2/P3 | Route naming cleanup beyond `/pegawai` canonical alignment | No `/pegawai/dokumen` rename in 11G. |

## Guardrails

- Keep 11G subphases small enough to review and commit independently.
- Produce execution prompts/checklists before executing operational commands.
- Do not expose PostgreSQL to LAN unless an explicit operational requirement and separate security review approve it.
- Do not treat Lighthouse scores from an extension-heavy browser or preview-only serving setup as final performance proof.
- Do not reintroduce Supabase packages, helpers, fallbacks, or old data/file recovery.
- Do not print env values, secrets, DB URLs, storage roots, session tokens, file tokens, cookie values, or password hashes.
- Do not claim backup/restore, LAN, production, release, or go-live readiness before human evidence and Phase 11H decision.

## Next Recommended Phase

```text
Phase 11H.0 - Final Readiness Gate Planning And Decision Matrix
```

Rationale: the clean preview baseline is recorded, the human-run backup/restore drill is recorded as PASS for bounded operational recovery validation, final human LAN smoke after 11G.4a/11G.4b is recorded as PASS for the bounded LAN smoke gate, 11G.5 documented cookie-auth, CSRF, rate-limit, sensitive-route, and residual-risk posture without runtime security changes, and 11G.6 has consolidated rollback, operator handoff, evidence inventory, and P1/P2 security follow-ups. 11H.0 records the final gate sequence and decision matrix in `docs/migration/phase-11h-final-readiness-plan.md`; it does not make a final release decision. HTTP blob download warnings over insecure LAN remain an expected limitation of trusted HTTP mode and reinforce the recommendation for HTTPS plus secure cookies in serious/final deployment. Phase 11H is human-controlled and is not automatically approved by 11G.6 or 11H.0.
