# Phase 11G.2 Preview Performance Baseline And Asset Hygiene Plan

Date prepared: 2026-05-21.

Status: docs/planning-only. This plan defines how the human should collect clean preview Lighthouse evidence and how 11G/11H should classify performance, asset, cache, compression, and main-thread findings. Codex did not run Lighthouse, build, preview, tests, DB commands, Docker commands, firewall commands, backup/restore commands, package commands, deployment commands, route generation, or runtime profiling for this phase.

## Purpose And Scope

Phase 11G.2 turns recent fluctuating Lighthouse observations into a repeatable baseline process for the clean local target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime/package/helper fallback;
- no old Supabase data or file recovery.

The output of this phase is the plan and evidence template. Actual evidence belongs to a later human-run phase.

## Non-Goals And Safety Warnings

- Do not treat this document as proof that performance is fixed or accepted.
- Do not run Lighthouse from an extension-heavy daily browser profile and treat the result as official.
- Do not paste secrets, DB URLs, env values, cookie values, session tokens, file tokens, password hashes, or physical storage roots into evidence.
- Do not include real local physical paths in screenshots or notes.
- Do not compare dev-mode Lighthouse and preview/final-serving Lighthouse as equal evidence.
- Do not optimize images, replace assets, rewrite code, change bundles, add packages, change cache headers, change compression, change server topology, or alter runtime behavior in 11G.2.
- Do not expose PostgreSQL to LAN as part of performance baseline work.
- Do not claim production, LAN, release, or final approval from this plan.

The thresholds below are internal operational guidance for this local/LAN handoff, not contractual SLA, public certification, or external web-performance standard.

## Why Prior Lighthouse Scores Fluctuated

Recent preview Lighthouse scores ranged from the 90s in earlier checks to the 70s and 80s in later role/admin dashboard checks. That fluctuation is plausible because:

- browser extensions can inject scripts, requests, and diagnostics into Lighthouse traces;
- VPN, proxy, technology-profiler, password-manager, or analytics/debug extensions can add noise;
- `pnpm preview` serving may not match the final LAN serving topology for cache and compression headers;
- thermal throttling, heavy background tasks, low battery mode, antivirus scans, and unstable machine load can distort CPU timing;
- first-load behavior can differ from warm-cache or warmed-app behavior;
- role, account, and data shape can change dashboard work and request counts.

The official baseline must therefore be clean, repeatable, and recorded with environment notes.

## Clean Baseline Environment

Official baseline evidence should use:

- a production build served by `pnpm preview` or by the chosen final LAN serving method;
- a clean browser profile or incognito/private window with extensions disabled;
- no VPN, proxy, browser technology-profiler, Wappalyzer-style, debugging, or traffic-modifying extensions;
- one active tab where feasible;
- stable machine conditions: plugged in, no thermal throttling where possible, no heavy background jobs;
- the same role, user, dataset, and route state for repeated runs;
- a first run that may be discarded as warm-up;
- at least 3 runs per target page;
- median result, or best-of-consistent result only when the repeated scores are tightly clustered.

Avoid cherry-picking an isolated unusually high score. If three runs are scattered, record the spread and classify the page as unstable evidence.

## Manual Baseline Procedure

The human operator runs these commands manually if `pnpm preview` remains the selected baseline serving mode:

```powershell
pnpm build
pnpm preview
```

Then:

1. Open the preview URL shown by the command, such as `<PREVIEW_URL>`.
2. Open Chrome DevTools Lighthouse from the clean browser profile.
3. Log in as the intended role using the approved human-controlled credential channel.
4. Navigate directly to the target URL.
5. Let the page settle.
6. Run Lighthouse manually.
7. Repeat at least 3 times per target page.
8. Record the evidence table without secrets or physical paths.

If the final LAN serving method is selected before 11H, repeat the critical pages with that serving method and classify `pnpm preview` results as preliminary.

## Role/Page Matrix

Initial matrix:

| Role/context | URL | Required? | Notes |
|---|---|---:|---|
| Public/login | `/login` | Recommended | Captures unauthenticated shell, logo asset, form accessibility. |
| Pegawai | `/pegawai` | Required minimum option | Pegawai dashboard. |
| Pegawai | `/pegawai/dokumen` | Recommended | Workflow document list. |
| PPK | `/ppk` | Recommended | PPK dashboard. |
| PPK | `/ppk/inbox` | Required minimum option | Workflow inbox candidate. |
| Bendahara | `/bendahara` | Recommended | Bendahara dashboard. |
| Bendahara | `/bendahara/inbox` | Required minimum option | Workflow inbox candidate. |
| Arsiparis | `/arsiparis` | Required minimum option | Arsiparis dashboard. |
| Arsiparis | `/arsiparis/inbox` | Recommended | Archive intake/workflow inbox. |
| Arsiparis | `/arsiparis/aktif` | Recommended | Archive list and filters. |
| Admin | `/admin` | Required minimum option | Admin dashboard. |
| Admin | `/admin/master-data/user` | Recommended | User-management data table. |
| Admin | `/admin/master-data/kegiatan` | Recommended | Master-data page. |
| Admin | `/admin/master-data/kategori` | Recommended | Master-data page. |
| Admin | `/admin/master-data/detail` | Recommended | Master-data page. |

The human may reduce the initial run if time is limited, but the minimum baseline must include:

- one Pegawai page;
- one Admin page;
- one Arsiparis page;
- one workflow inbox page.

Expanded route coverage can remain future optional work.

## Metrics To Record

Record these fields per run:

- Performance score;
- Accessibility score;
- Best Practices score if available;
- SEO score if relevant;
- FCP;
- LCP;
- TBT;
- CLS;
- Speed Index;
- transfer size and resource size;
- number of requests;
- extension noise present or absent;
- top Lighthouse diagnostics;
- console warnings/errors;
- whether the app felt laggy to the human operator.

When results fluctuate, record all runs and use the median for the decision column.

## Asset Hygiene Classification

`/bps-logo.png` large size is likely a real asset hygiene item because it is an app asset, appears on visible shell/login surfaces, and is not explained away by extension noise.

11G.2 does not replace, resize, recompress, delete, or redesign the image.

If the clean baseline still flags `/bps-logo.png`, recommend a later tiny approved phase:

```text
11G.2a - Optimize Static Logo Asset
```

Acceptable improvement options for that later phase:

- resize the image to the rendered dimensions;
- use WebP, AVIF, or optimized PNG if compatible with the app target;
- preserve visual quality;
- preserve branding appearance and avoid visual identity redesign;
- verify the app still displays the logo correctly on login and shell/sidebar surfaces.

Do not delete or replace assets in 11G.2.

## Cache And Compression Classification

`pnpm preview` cache and compression findings may not represent the final LAN serving setup. They should be classified as deployment-server concerns unless reproduced in the chosen final serving topology.

11G.4 or 11G.6 should decide the final serving topology and where cache/compression headers are owned, for example app server, static server, or reverse proxy.

Do not implement server, proxy, header, cache, compression, or deployment-topology changes in 11G.2.

## TBT And Main-Thread Classification

Admin/role dashboard TBT around 400-600 ms is P2 optimization backlog unless clean preview shows severe lag.

Escalate to P1 only if clean no-extension baseline repeatedly shows one or more of:

- Performance score below 60;
- TBT above 1000 ms;
- request loop while the page is idle;
- unbounded heap, listener, or DOM growth;
- severe user-perceived lag in preview or final serving.

Otherwise keep dashboard TBT and main-thread work as deferred optimization backlog. P2 means deferred optimization backlog, not permanent acceptance without future review.

## Decision Thresholds

Practical internal LAN guidance:

| Finding | Classification |
|---|---|
| Accessibility score `>= 90` on main target pages | Desired; remaining issues can be documented. |
| Accessibility score `< 90` | Document the concrete remaining findings; fix only if they are severe or user-blocking before 11H. |
| Performance score `>= 75` on clean preview | Can be acceptable for internal LAN input if there is no severe lag, request loop, or unbounded growth. |
| Performance score `< 60` repeatedly on clean preview | Open a targeted fix phase before 11H. |
| TBT `> 1000 ms` repeatedly on clean preview | Open a targeted fix phase before 11H. |
| Large `/bps-logo.png` still flagged | Open tiny asset hygiene phase if safe and easy. |
| Cache/compression only on `pnpm preview` | Deployment-server concern unless reproduced in final serving setup. |
| Extension-source diagnostics present | Discard or mark as invalid official evidence. |
| Severe human-perceived lag | Investigate before 11H even if score is borderline. |

These thresholds are release-gate inputs for internal operations review, not external certification.

## Evidence Table Template

| Date/time | Machine/browser | Extension status | Serving mode | Role | URL | Run # | Performance | Accessibility | FCP | LCP | TBT | CLS | Requests | Transfer/resource size | Top findings | Decision | Notes |
|---|---|---|---|---|---|---:|---:|---:|---|---|---|---|---:|---|---|---|---|
| TODO | `<MACHINE_BROWSER>` | Clean/no extensions | `pnpm preview` or `<FINAL_SERVING_MODE>` | TODO | TODO | 1 | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | No secrets or physical paths. |
| TODO | `<MACHINE_BROWSER>` | Clean/no extensions | `pnpm preview` or `<FINAL_SERVING_MODE>` | TODO | TODO | 2 | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO |  |
| TODO | `<MACHINE_BROWSER>` | Clean/no extensions | `pnpm preview` or `<FINAL_SERVING_MODE>` | TODO | TODO | 3 | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | Record median/consistent decision. |

Evidence notes:

- Use placeholders for machine labels if screenshots reveal local usernames or paths.
- Redact URL query tokens, cookies, file tokens, and file paths.
- Store screenshots only after verifying they do not reveal secrets or physical roots.

## Follow-Up Phase Decision

Recommended next phase after this docs-only 11G.2:

```text
11G.2a - Human Clean Preview Performance Baseline Evidence
```

Rationale: recent Lighthouse concern is active enough that human-run clean evidence should be recorded before treating backup/restore drill evidence as the next operational input. If the human chooses to prioritize backup/restore first, the established alternative remains:

```text
11G.3 - Human-Run Backup/Restore Drill Evidence
```

Implementation follow-ups should be opened only from clean evidence:

- tiny asset hygiene phase if `/bps-logo.png` remains a confirmed large static asset finding;
- targeted performance investigation only for repeated clean severe lag, repeated Performance below 60, repeated TBT above 1000 ms, idle request loops, or unbounded growth;
- deployment-server header/topology phase for cache/compression if reproduced in the final serving setup.

## Handoff To 11G.3

11G.3 remains the human-run backup/restore drill evidence phase. Before or during 11G.3, the operator should record whether 11G.2a performance evidence is complete, deferred, or blocked.

Do not let a missing performance implementation phase imply that backup/restore evidence is complete or that final 11H approval is automatic. 11H remains human-controlled after evidence and blockers are reviewed.
