# Phase 11G.2 Preview Performance Baseline And Asset Hygiene Plan

Date prepared: 2026-05-21.

Status: docs/planning plus recorded 11G.2a evidence. This plan defines how the human should collect clean preview Lighthouse evidence and how 11G/11H should classify performance, asset, cache, compression, and main-thread findings. Phase 11G.2a evidence is recorded as of 2026-05-21 from human-provided clean preview Lighthouse results. Codex did not run Lighthouse, build, preview, tests, DB commands, Docker commands, firewall commands, backup/restore commands, package commands, deployment commands, route generation, or runtime profiling for this phase.

## Purpose And Scope

Phase 11G.2 turns recent fluctuating Lighthouse observations into a repeatable baseline process for the clean local target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime/package/helper fallback;
- no old Supabase data or file recovery.

The output of Phase 11G.2 is the plan and evidence template. Phase 11G.2a now records the current human-run evidence set.

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
| Public/login | `/login` | Required minimum | Captures unauthenticated shell, logo asset, form accessibility. |
| Pegawai | `/pegawai` | Required minimum | Pegawai dashboard. |
| Pegawai | `/pegawai/dokumen` | Recommended | Workflow document list. |
| PPK | `/ppk` | Recommended | PPK dashboard. |
| PPK | `/ppk/inbox` | Required minimum candidate | Workflow inbox candidate. |
| Bendahara | `/bendahara` | Recommended | Bendahara dashboard. |
| Bendahara | `/bendahara/inbox` | Required minimum candidate | Workflow inbox candidate. |
| Arsiparis | `/arsiparis` | Required minimum candidate | Arsiparis dashboard. |
| Arsiparis | `/arsiparis/inbox` | Recommended | Archive intake/workflow inbox. |
| Arsiparis | `/arsiparis/aktif` | Recommended | Archive list and filters. |
| Admin | `/admin` | Required minimum candidate | Admin dashboard. |
| Admin | `/admin/master-data/user` | Recommended | User-management data table. |
| Admin | `/admin/master-data/kegiatan` | Recommended | Master-data page. |
| Admin | `/admin/master-data/kategori` | Recommended | Master-data page. |
| Admin | `/admin/master-data/detail` | Recommended | Master-data page. |

The human may reduce the initial run if time is limited, but the official minimum baseline must include:

- `/login`;
- `/pegawai`;
- one workflow inbox page such as `/ppk/inbox`, `/bendahara/inbox`, or `/arsiparis/inbox`;
- one Arsiparis page such as `/arsiparis` or `/arsiparis/aktif`;
- one Admin page such as `/admin` or `/admin/master-data/user`.

Recommended expanded matrix:

- `/pegawai/dokumen`;
- `/ppk`;
- `/bendahara`;
- `/arsiparis/inbox`;
- `/admin/master-data/kegiatan`;
- `/admin/master-data/kategori`;
- `/admin/master-data/detail`.

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
11G.2b - Optimize Static Logo Asset
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

## Phase 11G.2a - Human Clean Preview Performance Baseline Evidence

Date/status: 2026-05-21, evidence recorded and accepted for operational input.

Evidence status:

- Human provided clean preview Lighthouse results for `/login`, `/pegawai`, `/ppk`, `/bendahara/selesai`, `/arsiparis`, and `/admin/master-data/user`.
- Human reported `pnpm build` succeeded and `pnpm preview` was used for the measured baseline.
- Human reported no severe clean-preview lag, no repeated Performance below 60, no repeated TBT above 1000 ms, and no idle request loop or unbounded heap/listener/DOM growth in this evidence set.
- Build duration around 15.46s versus earlier builds around 13s is treated as normal local variance in this update, not as a performance blocker.

Evidence provenance/source:

| Evidence source | Status | Notes |
|---|---|---|
| Manual notes | Recorded | Human provided serving-mode and interpretation notes. |
| Copied Lighthouse summary | Recorded | Only provided page scores are recorded; missing metrics remain `not recorded`. |
| Screenshots | Recorded | Summarized only the visible metrics described by the human. |
| Browser/extension condition statement | Recorded | Human described these results as clean preview testing conditions versus prior noisy runs. |

Required human-run command template:

```powershell
pnpm build
pnpm preview
```

Human-run steps:

1. Run `pnpm build`.
2. Run `pnpm preview`.
3. Open the preview URL in a clean browser profile or incognito/private window with extensions disabled.
4. Log in through the approved human-controlled credential channel.
5. Navigate to each target page.
6. Let the page settle.
7. Run Lighthouse manually.
8. Run each target 3 times where feasible.
9. Record the median or consistent repeated score, plus any spread if results are unstable.

Test environment:

| Field | Value |
|---|---|
| Machine/browser | not recorded |
| Browser profile | clean preview testing conditions reported by human |
| Extension status | clean/no-extension conditions reported by human |
| Serving mode | `pnpm preview` |
| Dataset/user roles | mixed role baseline across provided URLs |
| Machine condition | no severe lag reported; build-time variance treated as normal local variance |

Minimum official run matrix:

| Role/context | URL | Required? | Evidence status |
|---|---|---:|---|
| Public/login | `/login` | Yes | Recorded |
| Pegawai | `/pegawai` | Yes | Recorded |
| Workflow inbox | `/ppk/inbox`, `/bendahara/inbox`, or `/arsiparis/inbox` | Yes, choose at least one | Not fully matched; nearest recorded workflow/admin pages were `/ppk` and `/bendahara/selesai` |
| Arsiparis | `/arsiparis` or `/arsiparis/aktif` | Yes, choose at least one | Recorded via `/arsiparis` |
| Admin | `/admin` or `/admin/master-data/user` | Yes, choose at least one | Recorded via `/admin/master-data/user` |

Recommended expanded run matrix:

| Role/context | URL | Evidence status |
|---|---|---|
| Pegawai document list | `/pegawai/dokumen` | Not recorded |
| PPK dashboard | `/ppk` | Recorded |
| Bendahara dashboard | `/bendahara` | Not recorded |
| Arsiparis inbox | `/arsiparis/inbox` | Not recorded |
| Admin kegiatan | `/admin/master-data/kegiatan` | Not recorded |
| Admin kategori | `/admin/master-data/kategori` | Not recorded |
| Admin detail | `/admin/master-data/detail` | Not recorded |

11G.2a result table:

| Date/time | Machine/browser | Extension status | Serving mode | Role | URL | Run # | Performance | Accessibility | FCP | LCP | TBT | CLS | Requests | Transfer/resource size | Top findings | Decision | Notes |
|---|---|---|---|---|---|---:|---:|---:|---|---|---|---|---:|---|---|---|---|
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | Public/login | `/login` | 1 | 99 | 92 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | Pegawai | `/pegawai` | 1 | 99 | 94 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | PPK | `/ppk` | 1 | 99 | 94 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | Bendahara | `/bendahara/selesai` | 1 | 97 | 96 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | Arsiparis | `/arsiparis` | 1 | 98 | 94 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |
| 2026-05-21 | not recorded | Clean/no-extension reported by human | `pnpm preview` | Admin | `/admin/master-data/user` | 1 | 99 | 96 | not recorded | not recorded | not recorded | not recorded | not recorded | not recorded | Clean baseline accepted | Best Practices 100; SEO 92. |

11G.2a decision:

```text
Next: Phase 11G.3 - Human-Run Backup/Restore Drill Evidence
```

Classification from recorded clean evidence:

- Clean browser/no-extension compliance: accepted for operational input based on the human-reported clean preview testing conditions.
- Performance: acceptable for internal LAN operational input. All provided pages scored between 97 and 99, with no severe clean-preview lag reported.
- Accessibility: acceptable for operational input. All provided pages scored between 92 and 96.
- Best Practices: 100 on all provided pages.
- SEO: 92 on all provided pages.
- Earlier Lighthouse scores in the 70s are now classified as likely environment-dependent or extension/test-condition noise unless reproduced again under clean no-extension conditions.
- Asset hygiene: `/bps-logo.png` remains an optional P2 asset hygiene item only. Current clean scores do not make it a blocker.
- Cache/compression: remains a deployment-server or final-serving concern unless reproduced in final serving setup.
- TBT/main-thread: no current blocker. No repeated TBT above 1000 ms, severe lag, idle request loop, or unbounded heap/listener/DOM growth was reported in this clean evidence.

## Follow-Up Phase Decision

Recommended next phase after this docs-only 11G.2:

```text
11G.3 - Human-Run Backup/Restore Drill Evidence
```

Rationale: the clean preview Lighthouse baseline is now recorded and acceptable for internal operational input. A separate performance investigation is not needed from the current evidence set, and backup/restore drill evidence is the next operational phase.

Optional future follow-ups:

- `11G.2b - Optimize Static Logo Asset` can be skipped for now or deferred as P2 unless the human wants asset cleanup before 11H.
- `11G.2c - Bounded Dashboard Performance Investigation` is not needed now.
- Deployment-server header or topology follow-up remains relevant only if cache/compression concerns reproduce in final serving.

## Handoff To 11G.3

11G.3 remains the human-run backup/restore drill evidence phase. Before or during 11G.3, the operator should record whether 11G.2a performance evidence is complete, deferred, or blocked.

Do not let a missing performance implementation phase imply that backup/restore evidence is complete or that final 11H approval is automatic. 11H remains human-controlled after evidence and blockers are reviewed.
