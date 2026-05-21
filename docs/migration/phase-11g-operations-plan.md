# Phase 11G Operations Hardening Plan

Date prepared: 2026-05-21.

Status: Phase 11G.1 docs/runbook update. Phase 11G.0 created the subphase breakdown. Phase 11G.1 adds the backup/restore runbook link and keeps execution deferred. No backup, restore, LAN binding, firewall change, security implementation, performance implementation, package change, DB command, route generation, deployment command, or release decision is performed by this document.

This plan breaks Phase 11G into small reviewable subphases before any operational drill or LAN exposure. The local target remains local PostgreSQL plus Drizzle, local `dms_session` auth, and local filesystem storage. Old Supabase data and old Supabase Storage files are not recovered, copied, downloaded, backfilled, synced, or used as fallback.

## Subphase Sequence

| Phase | Name | Scope | Exit condition |
|---|---|---|---|
| 11G.0 | Operational Hardening Breakdown Planning | Docs-only planning and lightweight audits. | 11G subphases, guardrails, and next phase are documented. |
| 11G.1 | Operational Readiness Runbook And Backup/Restore Plan | Create runbook and evidence templates only. No actual backup/restore. | Human has a reviewed procedure and evidence template to execute later. |
| 11G.2 | Preview Performance Baseline And Asset Hygiene Planning | Clean no-extension Lighthouse baseline and asset/performance classification only. | Baseline table records role dashboard scores and decides whether asset hygiene is a tiny later implementation phase. |
| 11G.3 | Human-Run Backup/Restore Drill Evidence | Human executes backup/restore into a clean local target; Codex records evidence only. | Restore evidence, validation checks, and blockers are recorded. |
| 11G.4 | LAN Binding And Client Smoke Evidence | Human intentionally binds app to LAN and tests from another trusted LAN client. | Host/port/firewall/client smoke evidence is recorded without broad PostgreSQL exposure. |
| 11G.5 | Cookie Auth, CSRF, Rate-Limit Security Review | Review-only first pass over cookie-auth and state-changing routes. | CSRF/rate-limit posture and gaps are documented; implementation requires a later approved phase. |
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

Baseline table template:

| Route | Browser profile | Performance | Accessibility | FCP | LCP | TBT | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| `/pegawai` | Clean/no extensions | TODO | TODO | TODO | TODO | TODO |  |
| `/ppk` | Clean/no extensions | TODO | TODO | TODO | TODO | TODO |  |
| `/bendahara` | Clean/no extensions | TODO | TODO | TODO | TODO | TODO |  |
| `/arsiparis` | Clean/no extensions | TODO | TODO | TODO | TODO | TODO |  |
| `/admin` | Clean/no extensions | TODO | TODO | TODO | TODO | TODO |  |

Classification rules:

- Performance baseline is planned before final 11G/11H decision.
- It does not block 11G.1 docs/runbook work.
- It may justify a small later 11G.2 implementation slice for asset hygiene only if the baseline confirms easy wins.
- Browser extensions must be excluded from the official baseline.
- `pnpm preview` cache/compression findings are deployment-server concerns unless reproduced in the final serving setup.
- Large `/bps-logo.png` is a likely real asset hygiene item.
- Admin/role dashboard TBT and main-thread work remain P2 unless a clean preview baseline reproduces severe lag, idle request loops, or unbounded heap/listener/DOM growth.
- No image optimization, caching/compression change, code splitting, or dashboard performance implementation belongs to 11G.0.

### 11G.3 Backup/Restore Drill Evidence

The human executes the selected backup and restore commands against a clean local target. Codex may update docs from human-provided evidence only.

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

Planning must include:

- Host/port binding.
- Static IP or hostname strategy.
- Firewall allowlist for the app port only on trusted/private network.
- No broad PostgreSQL exposure by default.
- Client-device smoke from another LAN device.
- Logs and screenshots that do not expose secrets, DB URLs, token values, password hashes, cookie values, file tokens, env values, or physical storage roots.

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

### 11G.5 Cookie Auth, CSRF, Rate-Limit Security Review

This is review-only first. Any CSRF or rate-limit implementation must be a later approved implementation phase.

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

### 11G.6 Rollback And 11H Handoff

Output should consolidate:

- App rollback procedure.
- Database restore rollback procedure.
- Storage restore rollback procedure.
- Backup set selection rules.
- Operator checklist.
- Known accepted risks.
- Evidence inventory for 11H.
- Explicit blockers or deferred items.

11G.6 does not approve deployment by itself. Phase 11H remains a human-controlled final decision.

## Priority Classification

| Priority | Item | Notes |
|---|---|---|
| P1 before 11H | Backup/restore drill | Must include DB plus storage restore and validation evidence. |
| P1 before 11H | LAN client smoke | Must prove intentional app access from another trusted LAN client. |
| P1 before 11H | Rollback plan | Must cover app, DB, and storage. |
| P1 before 11H | Cookie-auth security review | Must include CSRF/rate-limit posture and server-side denial checks. |
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
Phase 11G.2 - Preview Performance Baseline And Asset Hygiene Planning
```

The established 11G sequence places the clean no-extension performance baseline before the human-run backup/restore drill. The first actual backup/restore execution should remain Phase 11G.3 after the runbook is reviewed and 11G.2 records the preview-performance baseline plan.
