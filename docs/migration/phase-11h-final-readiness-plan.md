# Phase 11H.0 - Final Readiness Gate Planning And Decision Matrix

Date prepared: 2026-05-21.

Status: planning complete for 11H.0, with 11H.1 Supabase retirement audit recorded in `docs/migration/phase-11h-final-supabase-audit.md` and the 11H.2 P1 security gate decision framework recorded in `docs/migration/phase-11h-p1-security-gate-decision.md`. Phase 11H.2b, 11H.2c, and 11H.2d are implemented pending human retest; CSRF/origin remains pending. This document does not make a final release decision, does not approve go-live, does not claim production readiness, and does not claim LAN readiness.

The local target remains:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime fallback;
- no old Supabase data or file recovery expected.

## Scope And Non-Goals

Allowed in 11H.0:

- define the safe 11H subphase sequence;
- create the final readiness decision matrix;
- carry forward 11G.5 and 11G.6 P1 gates without downgrading;
- select the next recommended phase.

Not allowed in 11H.0:

- no final go-live approval;
- no production readiness claim;
- no release readiness claim;
- no runtime source changes;
- no tests, package, env, DB, migration, seed, route generation, firewall, network, backup, restore, cleanup, or Supabase cleanup commands;
- no CSRF, rate-limit, admin cleanup, or file-access hardening implementation;
- no commit.

## 11H Subphase Sequence

| Phase | Name | Scope | Exit condition |
|---|---|---|---|
| 11H.0 | Final Readiness Gate Planning And Decision Matrix | Docs-only gate planning and decision matrix. | Subphase plan, matrix, and next recommended phase are documented. |
| 11H.1 | Final Supabase Runtime/Package/Env/Docs Audit | Read-only audit of source, tests, package files, env handling, docs, `supabase/`, DB, and Drizzle references. | Active runtime/package/env/docs classifications are recorded without printing env values. |
| 11H.2 | P1 Security Gate Decision | Human decision point for unresolved 11G.5 P1 gates. | Each P1 is implemented, accepted for bounded trusted LAN-only risk, deferred with release classification impact, or blocks final readiness. |
| 11H.2a | CSRF/Origin Protection Follow-up | Runtime implementation only if the human chooses implementation. | Cookie-authenticated state-changing routes have the approved same-origin/CSRF strategy. |
| 11H.2b | Login Rate-Limit/Brute-Force Follow-up | Runtime implementation only if the human chooses implementation. | Login brute-force protection foundation is implemented and validated. |
| 11H.2c | Destructive Admin Cleanup Hardening | Runtime implementation selected by the human and implemented pending retest. | Destructive cleanup is POST-only; GET remains dry-run/report-only. |
| 11H.2d | Raw Logical-Path File Access Hardening | Runtime implementation only if the human chooses implementation. | Raw logical-path preview/download cannot bypass `DIMUSNAHKAN` policy. |
| 11H.3 | Final Release Handoff Classification | Final classification after 11H.1 and 11H.2 decisions. | Human records complete, partial, blocked, or deferred classification without overclaiming. |

Implementation follow-up phases 11H.2a through 11H.2d are decision-dependent. They must not be forced by 11H.0, and they must not be bundled into the planning phase.

## Decision Matrix

### 1. Final Supabase Retirement Classification

| Decision item | Options | 11H.0 default classification | 11H requirement |
|---|---|---|---|
| Active runtime dependency | retired / partial / blocker | Tentatively retired from current source audit inputs. | 11H.1 must verify no active runtime match in `src` or route/runtime helpers. |
| Package dependency | retired / partial / blocker | Tentatively retired from current package grep inputs. | 11H.1 must verify no `@supabase/*` package dependency in `package.json` or `pnpm-lock.yaml`. |
| Env references | human-controlled / cleanup required / blocker | Human-controlled. | Do not print `.env` or `.env.migration`; classify key names only if needed. |
| Docs references | historical allowed / cleanup required / blocker | Historical references allowed when clearly migration history. | 11H.1 must separate current-runtime claims from historical migration traceability. |
| `supabase/` folder | historical allowed / remove later / blocker | Historical folder allowed unless release policy changes. | Do not claim folder removal unless a human chooses that policy. |

### 2. Release Readiness Classification

| Classification | Meaning | Allowed language |
|---|---|---|
| complete | All required evidence is accepted and P1 decisions are resolved or explicitly accepted within final constraints. | "11H handoff classification complete" only if the human records it. |
| partial | Core local target works but some evidence, P1 decision, or operational item remains bounded or incomplete. | "partial handoff" with exact caveats. |
| blocked | A blocker prevents honest final handoff. | "blocked by `<item>`". |
| deferred | Human chooses not to classify final readiness yet. | "deferred pending `<item>`". |

11H.0 does not choose one of these as the final release classification.

### 3. P1 Security Gate Options

| P1 gate | Option A | Option B | Option C | Option D |
|---|---|---|---|---|
| CSRF/origin strategy | Implement before 11H.3. | Accept bounded trusted LAN-only risk. | Defer release classification. | Block final readiness. |
| Login rate-limit/brute-force foundation | Implement before 11H.3. | Accept bounded trusted LAN-only risk. | Defer release classification. | Block final readiness. |
| Destructive admin cleanup hardening | Implement before 11H.3. | Accept bounded trusted LAN-only risk. | Defer release classification. | Block final readiness. |
| Raw logical-path file-access hardening | Implement before 11H.3. | Accept bounded trusted LAN-only risk. | Defer release classification. | Block final readiness. |

No P1 gate is downgraded by 11H.0. If the human accepts bounded risk, the final classification must say exactly which deployment boundary makes that risk acceptable.

### 4. Deployment Posture Decision

| Posture | Meaning | Gate impact |
|---|---|---|
| HTTPS plus Secure cookie | Preferred final posture. `dms_session` uses `Secure`; `DMS_SESSION_COOKIE_SECURE=true` or secure default is compatible. | Strongest candidate for final/wider deployment after P1 decisions. |
| Temporary trusted HTTP LAN | `DMS_SESSION_COOKIE_SECURE=false`, internal trusted clients only, no public internet exposure. | Bounded operational posture only; cannot be described as broader rollout readiness. |
| Not approved for broader rollout | Human declines final deployment posture or P1/evidence decisions remain unresolved. | Final readiness is blocked or deferred. |

### 5. Backup/Restore/LAN Evidence Acceptance

| Evidence | Accept as bounded | Additional drill required | Not accepted |
|---|---|---|---|
| 11G.2a clean preview Lighthouse | Accept for operational input if 11H.1 finds no contradiction. | Require final-serving or expanded route evidence if human wants stronger coverage. | Reject only if evidence is invalidated. |
| 11G.3 backup/restore drill | Accept as bounded paired DB/storage restore evidence. | Require another drill for active rollback, larger data, or post-backup divergence. | Reject only if evidence is invalidated. |
| 11G.4 trusted LAN smoke | Accept as bounded trusted LAN smoke. | Require wider browser/device/topology smoke if human wants broader deployment. | Reject if final posture requires evidence not covered. |

### 6. Go/No-Go Language Rules

- Do not use "production ready" unless P1 decisions are resolved and the human explicitly records that classification.
- Do not claim release readiness from 11H.0.
- Do not claim go-live approval from docs alone.
- Do not treat 11G.3 PASS as rollback approval for every future active-environment overwrite.
- Do not treat 11G.4 PASS as LAN readiness or public-network safety.
- Do not treat trusted HTTP LAN as approval for broader rollout.

## P1 Security Carry-Forward

11H.0 carries forward these 11G.5/11G.6 P1 gates unchanged:

- CSRF/origin strategy for cookie-authenticated state-changing routes.
- Login rate-limit/brute-force foundation. 11H.2b is implemented pending human retest with an in-memory local-process limiter.
- Destructive admin cleanup hardening because destructive cleanup could be GET-triggered by query flags. 11H.2c is implemented pending human retest.
- Raw logical-path file-access narrowing or status revalidation so `DIMUSNAHKAN` access blocking cannot be bypassed.

These gates must be implemented, explicitly accepted with bounded trusted LAN-only constraints, deferred with release classification impact, or treated as final readiness blockers.

## Required 11H.1 Audit Inputs

11H.1 should rerun and record:

- `git status --short --branch`;
- `git diff --check`;
- `git diff --name-only`;
- final Supabase source/runtime/package grep;
- docs overclaim grep;
- protected diff checks for `.env`, `.env.migration`, `src`, `tests`, package files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`;
- classification of historical docs and `supabase/` folder references.

Do not print env values, secrets, DB URLs, storage roots, password hashes, session tokens, cookie values, CSRF tokens, file tokens, or physical paths.

## 11H.0 Exit Criteria

11H.0 exits when:

- safe 11H subphase plan is created;
- decision matrix is created;
- P1 security gates are carried forward without downgrading;
- no final release decision is made;
- next recommended phase is selected.

Current 11H.0 classification:

```text
planning complete
```

This classification means only that gate planning is ready for human review and the next audit phase. It is not a release readiness classification.

## Next Recommended Phase

```text
Phase 11H.2a - CSRF/Origin Protection Follow-up
```

Rationale: 11H.1 found no active runtime/package Supabase blocker and classified remaining Supabase references as historical, cleanup backlog, human-controlled env handling, or `supabase/` traceability artifacts. 11H.2 then recorded the human-controlled P1 security decision framework. The human selected incremental implementation; 11H.2b has implemented login rate-limit/brute-force protection pending human retest, 11H.2c has implemented destructive admin cleanup hardening pending human retest, and 11H.2d has implemented raw logical-path file-access hardening pending human retest. The next recommended phase is 11H.2a unless a blocker remains in 11H.2b, 11H.2c, or 11H.2d retest. This is not a release readiness claim.

## Phase 11H.1 Audit Result

Date: 2026-05-21.

Dedicated audit doc:

- `docs/migration/phase-11h-final-supabase-audit.md`

11H.1 classification:

```text
Supabase is retired from active runtime/package dependency; historical docs and supabase/ artifacts remain for traceability unless human policy chooses cleanup.
```

Remaining cleanup backlog includes source comments/type-only residue, `.env.example` Supabase key names, stale historical docs/spec wording, stale E2E expectations, and the human retention policy for `supabase/` historical artifacts. These are not active runtime/package blockers.

P1 gates remain unresolved except for 11H.2b, 11H.2c, and 11H.2d implementation pending human retest:

- CSRF/origin strategy;
- login rate-limit/brute-force foundation implemented pending human retest;
- destructive admin cleanup hardening implemented pending human retest;
- raw logical-path file-access narrowing or status revalidation for `DIMUSNAHKAN` implemented pending human retest.

## Phase 11H.2 Decision Framework Result

Date: 2026-05-21.

Dedicated decision record:

- `docs/migration/phase-11h-p1-security-gate-decision.md`

11H.2 classification:

```text
decision framework recorded, 11H.2b/11H.2c/11H.2d implemented pending human retest, CSRF/origin decision pending
```

Current human decision status:

| P1 gate | Current human decision | Release classification impact |
|---|---|---|
| CSRF/origin strategy | decision pending | Final readiness remains unresolved while pending. |
| Login rate-limit/brute-force foundation | implementation selected and implemented pending human retest | Final readiness remains unresolved until human retest is reviewed and remaining P1 gates are resolved or explicitly accepted/deferred. |
| Destructive admin cleanup hardening | implementation selected and implemented pending human retest | Final readiness remains unresolved until human retest is reviewed and remaining P1 gates are resolved or explicitly accepted/deferred. |
| Raw logical-path file-access hardening | implementation selected and implemented pending human retest | Final readiness remains unresolved until human retest is reviewed and remaining P1 gates are resolved or explicitly accepted/deferred. |

11H.2b implemented runtime hardening only for login rate-limit/brute-force protection, 11H.2c implemented runtime hardening only for destructive admin cleanup, and 11H.2d implemented runtime hardening only for raw logical-path file access. 11H.2 did not accept bounded risk, did not downgrade P1 items, and did not make a final readiness decision. The preferred final posture remains HTTPS plus `Secure` `dms_session` cookies. Trusted HTTP LAN remains bounded/internal only and is not public or wider rollout approval.
