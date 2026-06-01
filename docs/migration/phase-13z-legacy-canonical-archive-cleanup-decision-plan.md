# Phase 13Z - Legacy Canonical Archive Cleanup Decision Plan

> Historical note: This document is retained for traceability. Current archive runtime authority is folder-first `berkas_arsip` / `berkas_arsip_item` after Phase 14K. Do not treat this document as current implementation authority without checking `docs/migration/README.md` and `AGENTS.md`.

Date: 2026-05-30

Status: planning/audit only.

## Phase Status

Phase 13Z audits the remaining legacy canonical archive surfaces after the folder-first archive lifecycle work. It does not implement cleanup.

This phase does not change runtime behavior, routes, route generation, schema, migrations, package files, env files, storage behavior, database rows, physical files, Supabase runtime behavior, search behavior, report behavior, export behavior, lifecycle behavior, or cleanup scripts.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain. This phase does not claim Supabase is fully removed from the repository and does not add any Supabase fallback.

## Current Authority

Folder-first runtime authority:

- `arsip.berkas_arsip` is the archive/folder parent for new runtime.
- `arsip.berkas_arsip_item` is the item membership table for `WORKFLOW` and `MANUAL` source items.
- Folder lifecycle authority is `berkas_arsip.status_arsip`.
- New workflow classification and manual document creation no longer create new `arsip.arsip` rows.

Legacy compatibility authority:

- Existing `arsip.arsip` rows remain historical compatibility data.
- Existing `manual_arsip.canonical_arsip_id` and `berkas_arsip_item.canonical_arsip_id` bridge values remain compatibility metadata.
- Legacy canonical helpers and APIs must not become the primary runtime lifecycle authority again.

## Audit Summary

| Surface | Code path | Current primary source | Runtime usage observed | Classification | Decision |
|---|---|---|---|---|---|
| `/arsiparis/aktif` | `src/routes/arsiparis/aktif/index.tsx` | none; redirect only | Browser route redirects to `/arsiparis/berkas` | Redirect to folder-first | Keep redirect. Do not restore old canonical active list. |
| `/arsiparis/arsip/$id` | `src/routes/arsiparis/arsip/$id.tsx` | `arsip.arsip` via detail API | Historical canonical detail page; still has canonical lifecycle UI | Keep read-only historical compatibility, then remove mutation affordances later | Keep route. Future phase should relabel as legacy history and make it metadata/read-only unless a row maps safely to folder-first. |
| `GET /api/arsiparis/arsip/$id` | `src/routes/api/arsiparis/arsip/$id.ts` | `arsip.arsip` | Canonical detail and canonical attachment action endpoint | Keep read-only historical compatibility | Keep for historical rows. Future hardening should ensure old file actions do not bypass folder-first destroyed-folder policy. |
| `POST /api/arsiparis/arsip/$id/lifecycle` | `src/routes/api/arsiparis/arsip/$id/lifecycle.ts` | mutates `arsip.arsip`; syncs linked `manual_arsip` | Only legacy canonical detail UI should call it | Remove in later implementation or hard-disable after UI cleanup | Not folder-first authority. Future phase should stop exposing canonical lifecycle mutation for active runtime. |
| `GET /api/arsiparis/aktif` | `src/routes/api/arsiparis/aktif.ts` | `arsip.arsip` through `getUnifiedArchiveList` | Old read-only active canonical list API | Soft-deprecate API | Keep temporarily for compatibility/tests. Prefer `/api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF` for new folder-first data. |
| `GET /api/arsiparis/inaktif` | `src/routes/api/arsiparis/inaktif.ts` | `arsip.arsip` through `getUnifiedArchiveList` | Dashboard count still calls it; folder page does not | Soft-deprecate API | Keep temporarily, but future dashboard stats should move to folder-first API. |
| `GET /api/arsiparis/usul-musnah` | `src/routes/api/arsiparis/usul-musnah.ts` | `arsip.arsip` through `getUnifiedArchiveList` | Dashboard count still calls it; folder page does not | Soft-deprecate API | Keep temporarily, but future dashboard stats should move to folder-first API. |
| `/arsiparis/search` | `src/routes/arsiparis/search.tsx` | canonical search API | Search page links active rows to `/arsiparis/arsip/$id`; inactive/proposed detail links are not folder-first | Leave untouched for now | Decide separately whether search is historical canonical search or folder-first runtime search. Do not change in 13Z. |
| `GET /api/arsiparis/search` | `src/routes/api/arsiparis/search.ts` | direct `arsip.arsip` plus workflow document join | Workflow-centric historical archive search | Leave untouched for now | Future folder-first search alignment should replace or split this. Existing API can remain historical compatibility until then. |
| `/arsiparis/laporan-klasifikasi` | `src/routes/arsiparis/laporan-klasifikasi.tsx` | canonical classification report API | Canonical report page | Soft-deprecate report authority | Keep temporarily as historical canonical report. Plan folder-first report alignment before removal. |
| `GET /api/arsiparis/arsip/classification-report` | `src/routes/api/arsiparis/arsip/classification-report.ts` | `arsip.arsip` | Canonical metadata report | Soft-deprecate API | Keep until folder-first classification report exists. |
| `GET /api/arsiparis/arsip/classification-report-detail` | `src/routes/api/arsiparis/arsip/classification-report-detail.ts` | `arsip.arsip` | Canonical drilldown | Soft-deprecate API | Keep until folder-first drilldown exists. |
| `GET /api/arsiparis/arsip/aggregate` | `src/routes/api/arsiparis/arsip/aggregate.ts` | `arsip.arsip` | Canonical aggregate API | Soft-deprecate API | Keep as compatibility/report API only. Do not treat as folder-first count source. |
| `GET /api/arsiparis/arsip/export` | `src/routes/api/arsiparis/arsip/export.ts` | `arsip.arsip` | Canonical metadata CSV export | Soft-deprecate API | Keep until folder-first export replaces it. Do not add new callers for folder-first pages. |
| Unified archive read/detail helpers | `src/lib/archive/unified-archive-query.ts`, `unified-archive-detail.ts`, `unified-archive-file-actions.ts` | `arsip.arsip` | Backing old canonical APIs | Keep read-only historical compatibility | Keep while old canonical route/API remains. Add no new folder-first runtime dependencies. |
| Unified archive lifecycle helper | `src/lib/archive/unified-archive-lifecycle.ts` | canonical lifecycle planner | Used by old canonical lifecycle API | Remove later or freeze as legacy-only | Do not use for folder-first lifecycle. Future phase can retire with the old canonical lifecycle API. |
| Unified archive report/export helpers | `src/lib/archive/unified-archive-aggregate-export.ts`, `unified-archive-classification-report.ts`, `unified-archive-classification-detail.ts` | `arsip.arsip` | Backing canonical reports/export | Soft-deprecate | Keep until folder-first report/export equivalents exist. |
| Unified archive physical deletion helper | `src/lib/archive/unified-archive-physical-destruction.ts` | `arsip.arsip` and `lampiran_snapshot` | Prior-art/internal helper; not the folder-first physical deletion target | Leave untouched for now | Do not wire to runtime cleanup. Folder-first physical deletion remains the only current destructive target. |
| Manual archive canonicalization/remediation helpers | `manual-archive-canonical*`, `manual-archive-remediation-report.ts` | old canonical/manual linkage | Historical/remediation utilities | Leave untouched for now | Do not run or remove without a later human-approved remediation phase. |
| Phase 13 legacy archive dev reset helpers | `phase13-legacy-archive-dev-reset-*` | old development legacy rows | Dev-only/reset helper surface | Leave untouched for now | Do not run cleanup scripts. Re-audit before any future deletion phase. |
| Manual archive edit compatibility sync | `src/lib/manual-arsip.ts` linked-row PATCH paths | existing `manual_arsip.canonical_arsip_id` | Compatibility for old linked rows | Keep historical compatibility | Preserve for existing old rows until canonical remediation policy changes. New creates should remain de-transitionalized. |

## Recommendation For `/arsiparis/arsip/$id`

Keep `/arsiparis/arsip/$id` for old canonical `arsip.arsip` rows as historical compatibility.

Preferred later behavior:

- relabel the page as old archive history, for example `Riwayat arsip lama`;
- keep metadata readable for authorized `KEPALA_SUB_BAGIAN_UMUM`;
- remove or hide canonical lifecycle actions;
- do not make the page a primary navigation target;
- do not use it as the detail target for new folder-first runtime items;
- if a canonical row can be mapped safely to a folder-first berkas, consider a visible link or redirect only after a separate mapping policy is approved.

Do not remove this route in the planning phase.

## Recommendation For Old List APIs

The old list APIs are read-only but canonical:

- `GET /api/arsiparis/aktif`
- `GET /api/arsiparis/inaktif`
- `GET /api/arsiparis/usul-musnah`

Recommended policy:

- soft-deprecate all three as compatibility APIs;
- keep them temporarily for old tests, old callers, and historical canonical rows;
- avoid adding new folder-first callers;
- move the Arsiparis dashboard `inaktif` and `usul-musnah` counts to folder-first berkas APIs in a later implementation phase;
- remove only after source search confirms no runtime caller and tests/docs have moved.

## Search, Report, And Export Policy

Search:

- `/arsiparis/search` and `GET /api/arsiparis/search` still surface old canonical `arsip.arsip` rows and are workflow-centric.
- If the product intent is historical archive lookup, they can remain canonical compatibility with clearer copy and safe legacy detail links.
- If the product intent is current folder-first runtime search, plan a future folder-first search API/page alignment.
- Do not implement search behavior changes in 13Z.

Reports/export:

- Classification report, classification drilldown, aggregate, and canonical CSV export still use `arsip.arsip`.
- Keep them as historical canonical reports until folder-first report/export equivalents exist.
- Do not use old canonical aggregate/export APIs as folder-first operational counts.
- Any folder-first export must keep the Phase 13R safety rule: metadata only, no raw IDs, paths, URLs, tokens, storage roots, raw attachment metadata, SQL details, env/session/cookie/secret values, or file content.

## Legacy Physical Deletion Policy

Do not target legacy `arsip.arsip` physical deletion in the next cleanup implementation.

The current destructive target is folder-first:

- candidates come from current `berkas_arsip_item` membership plus source tables;
- metadata and logical references are preserved;
- `DIMUSNAHKAN` blocks preview/download;
- responses return safe counts/categories only.

The old canonical physical deletion helper can remain as prior art for safe path handling and idempotent missing-file semantics, but it must not be wired into runtime cleanup unless a later human-approved legacy cleanup phase explicitly broadens scope.

## Risks

- Old canonical detail still exposes lifecycle UI/API that mutates `arsip.arsip`, which conflicts with folder-first lifecycle authority.
- Old canonical file actions may not present the newer folder-first destroyed-file UX if a legacy canonical row overlaps with a destroyed folder-first berkas.
- Dashboard counts for `inaktif` and `usul-musnah` still call old canonical list APIs even though the corresponding pages are folder-first.
- Search is still canonical/workflow-centric and may not represent folder-first runtime state.
- Canonical reports/export can underrepresent or misrepresent new de-transitionalized folder-first rows because new runtime no longer writes `arsip.arsip`.
- Removing APIs before caller/test migration would break compatibility and historical access.

## Non-Goals

This phase does not:

- delete `/arsiparis/arsip/$id`;
- remove old APIs;
- add redirects;
- mutate or delete `arsip.arsip` rows;
- delete old canonical metadata;
- delete physical files;
- change search behavior;
- change reports/export;
- change schemas, migrations, package files, env files, storage code, route registration, or `src/routeTree.gen.ts`;
- run migrations, seeds, dev server, build, broad tests, E2E, cleanup scripts, or destructive DB/file commands.

## Recommended Next Phase

Recommended next phase:

```text
Phase 14A - Legacy Canonical Route/API Soft Deprecation And Folder-First Search/Report Alignment Plan
```

Scope should be implementation-ready but still narrow:

1. Make `/arsiparis/arsip/$id` visibly historical and metadata/read-only.
2. Stop exposing canonical lifecycle actions from the legacy detail page.
3. Soft-deprecate canonical list/report/export APIs through docs/tests and avoid new callers.
4. Move Arsiparis dashboard lifecycle counts to folder-first APIs.
5. Decide whether `/arsiparis/search` remains historical canonical search or becomes folder-first runtime search.

Do not combine Phase 14A with data deletion, physical deletion, schema/migration work, route removal, or Supabase historical artifact cleanup.

## Validation For This Phase

Required validation:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```

Expected changed files are this planning document and `AGENTS.md` only.
