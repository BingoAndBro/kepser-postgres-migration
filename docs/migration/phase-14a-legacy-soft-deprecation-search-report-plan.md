# Phase 14A - Legacy Soft Deprecation, Search, And Report Alignment Plan

> Historical note: This document is retained for traceability. Current archive runtime authority is folder-first `berkas_arsip` / `berkas_arsip_item` after Phase 14K. Do not treat this document as current implementation authority without checking `docs/migration/README.md` and `AGENTS.md`.

Date: 2026-05-30

Status: planning-only.

## Phase Status

Phase 14A plans the soft deprecation of remaining legacy canonical archive route/API surfaces and the alignment of search, dashboard counts, reports, and exports with the folder-first runtime archive authority.

This phase does not implement runtime behavior changes. It does not change routes, route generation, API behavior, search behavior, report/export behavior, dashboard counts, schema, migrations, package files, env files, storage behavior, database rows, physical files, Supabase runtime behavior, or cleanup scripts.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain. This phase does not claim Supabase is fully removed from the repository and does not add any Supabase fallback.

## Current Runtime Authority

Folder-first runtime authority:

- `arsip.berkas_arsip` is the archive/folder parent for new runtime.
- `arsip.berkas_arsip_item` is the item membership table for `WORKFLOW` and `MANUAL` source items.
- `WORKFLOW` source metadata comes from `dokumen.dokumen_transaksi`.
- `MANUAL` source metadata comes from `arsip.manual_arsip`.
- Folder lifecycle authority is `berkas_arsip.status_arsip`.
- `Musnahkan Data` on folder-first `USUL_MUSNAH` berkas moves the folder to `DIMUSNAHKAN` and invokes folder-first physical file deletion while preserving metadata and logical references.
- Folder-first and document-token file access must show `Data file sudah dimusnahkan` for authorized destroyed-file access.
- There is no general `Dimusnahkan` list page.

Legacy compatibility authority:

- Existing `arsip.arsip` rows remain historical compatibility data.
- Existing `manual_arsip.canonical_arsip_id` and `berkas_arsip_item.canonical_arsip_id` bridge values remain compatibility metadata.
- Legacy canonical helpers and APIs must not become the primary runtime lifecycle, search, report, dashboard, or physical deletion authority again.

## Audit Summary

Observed code and tests confirm the Phase 13Z classification still holds:

- `/arsiparis/aktif` redirects to `/arsiparis/berkas` and no longer renders the old canonical active list.
- `/arsiparis/inaktif` and `/arsiparis/usul-musnah` are folder-first pages that call `GET /api/arsiparis/berkas` with `status_berkas=CLOSED` plus the relevant `status_arsip`.
- `/arsiparis/berkas` and `/arsiparis/berkas/$id` have client-side CSV exports backed by folder-first safe DTOs.
- `/arsiparis/arsip/$id` remains a canonical `arsip.arsip` detail route and still exposes canonical lifecycle mutation UI.
- `GET /api/arsiparis/aktif`, `GET /api/arsiparis/inaktif`, and `GET /api/arsiparis/usul-musnah` remain read-only canonical list APIs through `getUnifiedArchiveList(...)`.
- `/arsiparis/search` and `GET /api/arsiparis/search` remain canonical/workflow-oriented search surfaces.
- `/arsiparis/laporan-klasifikasi`, `GET /api/arsiparis/arsip/classification-report`, `GET /api/arsiparis/arsip/classification-report-detail`, `GET /api/arsiparis/arsip/aggregate`, and `GET /api/arsiparis/arsip/export` remain canonical `arsip.arsip` report/export/aggregate surfaces.

## Search Audit

Current browser route:

- `/arsiparis/search`
- Source file: `src/routes/arsiparis/search.tsx`
- User-facing title: `Pencarian Arsip`
- Dashboard entry: Arsiparis dashboard search card navigates to `/arsiparis/search`.

Current API route:

- `GET /api/arsiparis/search`
- Source file: `src/routes/api/arsiparis/search.ts`
- Auth boundary: requires local `dms_session`.
- Role behavior: broad visibility for `ADMIN` or `KEPALA_SUB_BAGIAN_UMUM`; PPK/Ppspm/Pegawai receive role-filtered workflow-document visibility.

Current data sources:

- Base rows come from `arsip.arsip` where `is_ditolak=false`.
- Enrichment comes from `dokumen.dokumen_transaksi`, `master.master_fungsi`, and `master.master_kegiatan`.
- The API maps canonical archive ids as `id`.

Current result shape:

- `{ arsip, total, page, per_page }`.
- Rows include `id`, `nomor_surat`, `judul`, `fungsi_nama`, `kegiatan_nama`, `klasifikasi`, `archived_at`, and `status_arsip`.
- No raw logical paths, physical paths, storage roots, file tokens, signed token internals, SQL details, env values, cookies, session values, raw attachment metadata, or file content were observed in the DTO.
- The row `id` is a canonical `arsip.arsip.id`. That is not a path/token leak, but it is a raw legacy canonical identifier and should not be used as the new runtime archive search identifier after folder-first alignment.

Current link behavior:

- `AKTIF` rows link to `/arsiparis/arsip/$id`.
- `INAKTIF` rows attempt to link to `/arsiparis/inaktif/$id`.
- `USUL_MUSNAH` rows attempt to link to `/arsiparis/usul-musnah/$id`.
- `DIMUSNAHKAN` rows have no detail link.

Current destroyed metadata behavior:

- `DIMUSNAHKAN` canonical rows are searchable as metadata because the API does not filter out `status_arsip='DIMUSNAHKAN'`.
- Search does not provide file access.
- Search does not surface folder-first destroyed-file summaries. It can miss new folder-first destroyed metadata because new runtime no longer writes `arsip.arsip`.

Current search gaps:

- It is not folder-first and does not search `berkas_arsip` plus `berkas_arsip_item`.
- It underrepresents new de-transitionalized runtime data after Phase 13T and 13U because new workflow/manual archive operations no longer create new `arsip.arsip` rows.
- It uses workflow-document enrichment and cannot naturally represent manual-only folder items as first-class runtime search results.
- It links active canonical rows to historical detail, not folder-first detail.
- The inactive/proposed detail link branches are stale relative to the folder-first list pages because current `/arsiparis/inaktif` and `/arsiparis/usul-musnah` are list routes, not item-detail routes.
- Pagination total is based on all canonical `arsip.arsip` rows before later role/filter reduction, preserving old behavior but not ideal for a new search implementation.

## Recommended Search Policy

Recommended policy: Option A for the primary runtime search, with old canonical search preserved only as historical compatibility if needed.

Target behavior:

- `/arsiparis/search` should become folder-first runtime search.
- Search should use `berkas_arsip` plus `berkas_arsip_item` as primary authority.
- Search should enrich `WORKFLOW` items from `dokumen_transaksi` and `MANUAL` items from `manual_arsip`.
- Results should link to `/arsiparis/berkas/$id`.
- Results should include `OPEN/null`, `CLOSED/AKTIF`, `CLOSED/INAKTIF`, `CLOSED/USUL_MUSNAH`, and `CLOSED/DIMUSNAHKAN` metadata where appropriate.
- `DIMUSNAHKAN` metadata may remain searchable for authorized archive users, but search must not offer file access and detail/file surfaces must continue to block preview/download.
- API DTOs must not expose raw IDs except the folder id needed for routing, raw bridge ids, logical paths, physical paths, storage roots, URLs, tokens, signed token internals, raw attachment metadata, SQL details, env/session/cookie/secret values, raw rows, or file content.

Historical compatibility:

- If old canonical search remains necessary, keep it as a separate clearly labeled historical compatibility surface or query mode.
- Do not keep the primary `/arsiparis/search` experience canonical/workflow-oriented after folder-first search is implemented.

Why Option A instead of Option C:

- Option C gives the richest compatibility story but increases UI and policy complexity by presenting two archive authorities side by side.
- This project already has a clear folder-first runtime authority. The practical safer path is to make primary search folder-first, preserve `/arsiparis/arsip/$id` for old bookmarked rows, and only add a historical canonical section if humans later confirm old rows must remain searchable from the main search UI.

## Report, Export, And Aggregate Audit

| Surface | Route/API/helper | Current source | Current user | Fields/output | Current classification |
|---|---|---|---|---|---|
| Classification report page | `/arsiparis/laporan-klasifikasi` | `GET /api/arsiparis/arsip/classification-report` | `KEPALA_SUB_BAGIAN_UMUM` | per-classification counts by source/status and nominal totals | Canonical report; soft-deprecate as runtime authority |
| Classification report API | `GET /api/arsiparis/arsip/classification-report` | `arsip.arsip`, joined to `dokumen_transaksi` for material nominal semantics | `KEPALA_SUB_BAGIAN_UMUM` | grouped report rows and totals | Canonical `arsip.arsip` report |
| Classification detail API | `GET /api/arsiparis/arsip/classification-report-detail` | `arsip.arsip`, `dokumen_transaksi`, `manual_arsip`, `manual_arsip_attachment` | `KEPALA_SUB_BAGIAN_UMUM` | canonical archive items for one classification/missing bucket | Canonical drilldown |
| Aggregate API | `GET /api/arsiparis/arsip/aggregate` | `arsip.arsip` | `KEPALA_SUB_BAGIAN_UMUM` | counts by status/source and unknown source count | Canonical aggregate |
| Canonical CSV export API | `GET /api/arsiparis/arsip/export` | `arsip.arsip` through `getUnifiedArchiveList` plus actor display names | `KEPALA_SUB_BAGIAN_UMUM` | metadata CSV: archive id, name, surat number, status, source, classification, retention, actors, nominal, attachment count, timestamps | Canonical export; soft-deprecate |
| Folder list CSV | `/arsiparis/berkas` client export using `berkas-arsip-csv.ts` | safe folder-first list DTOs from `GET /api/arsiparis/berkas` | `KEPALA_SUB_BAGIAN_UMUM` | visible folder metadata and counts | Folder-first CSV already exists |
| Folder detail CSV | `/arsiparis/berkas/$id` client export using `berkas-arsip-csv.ts` | safe folder-first detail DTO from `GET /api/arsiparis/berkas/$id` | `KEPALA_SUB_BAGIAN_UMUM` | item source, title, date, actor display, nominal, attachment count, provenance, warnings | Folder-first CSV already exists |
| Compatibility/remediation reports | `manual-archive-remediation-report`, `manual-archive-canonicalization-*`, `unified-compatibility-reader` | old canonical/manual linkage | developer/human-reviewed maintenance only | safe remediation/report DTOs | Keep as internal maintenance helpers; not runtime report authority |

Current report/export gaps:

- Canonical reports and aggregate can undercount or misrepresent new runtime data because Phase 13T and 13U stopped creating new `arsip.arsip` rows for new workflow/manual archive items.
- Canonical CSV export includes canonical archive ids as `ID Arsip`. It is acceptable for historical export, but not a folder-first runtime export field.
- Folder-first CSV exports are client-side only and tied to visible list/detail DTOs. They are useful and safe, but they are not yet full replacements for server-side aggregate/classification report APIs.
- No folder-first classification report API exists yet.
- No folder-first aggregate API exists yet.

## Recommended Report/Export Policy

Target policy:

- Folder-first report/export should use `berkas_arsip` plus `berkas_arsip_item` as primary authority.
- Report enrichment should come from `dokumen_transaksi` for `WORKFLOW` items and `manual_arsip` for `MANUAL` items.
- Classification reports should group by `berkas_arsip.klasifikasi_id` plus classification snapshots, not `arsip.arsip.klasifikasi_id`.
- Lifecycle counts should group by `berkas_arsip.status_berkas` and `berkas_arsip.status_arsip`.
- `DIMUSNAHKAN` rows should remain reportable as metadata, but no report/export should expose preview/download links or file-access material.
- CSV exports should remain metadata-only and must not include raw bridge ids, raw document/manual ids, logical paths, physical paths, storage roots, URLs, tokens, signed token internals, raw attachment metadata, SQL details, env/session/cookie/secret values, raw rows, or file content.
- Existing folder-first CSV exports on `/arsiparis/berkas` and `/arsiparis/berkas/$id` should remain.
- Canonical report/export/aggregate APIs should be relabeled historical or soft-deprecated until folder-first equivalents exist and callers move.

## Dashboard Count Policy

Current dashboard count callers:

- `inbox`: `GET /api/arsiparis/inbox`.
- `aktif`: `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF`, using folder-first summary count.
- `inaktif`: `GET /api/arsiparis/inaktif`, using old canonical list count length.
- `usulMusnah`: `GET /api/arsiparis/usul-musnah`, using old canonical list count length.

Recommended policy:

- Keep active count folder-first.
- Move `inaktif` count to `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=INAKTIF`.
- Move `usulMusnah` count to `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=USUL_MUSNAH`.
- Use the folder-first API `summary.total_rows_returned` rather than array length after implementation.
- Keep old canonical count/list APIs as compatibility until no runtime callers remain.

## Legacy Route/API Soft Deprecation Policy

| Surface | Current use | Risk | Decision | Proposed implementation phase |
|---|---|---|---|---|
| `/arsiparis/arsip/$id` | Historical canonical detail for old `arsip.arsip` rows; still has lifecycle UI | Users may treat canonical detail as active runtime authority; lifecycle buttons mutate old authority | Keep route as read-only historical compatibility; relabel clearly; remove mutation affordances | 14E |
| `GET /api/arsiparis/arsip/$id` | Canonical detail and canonical attachment action endpoint | File actions could confuse historical/folder-first authority; must not bypass destroyed-folder policy | Keep read/detail compatibility; preserve file-access safety; avoid new primary callers | 14E or 14F |
| `POST /api/arsiparis/arsip/$id/lifecycle` | Canonical lifecycle mutation used by legacy detail UI | Mutates `arsip.arsip` and can conflict with folder lifecycle authority | Soft-deprecate after UI removal; then block or remove in a later scoped phase if no caller remains | 14E then 14F |
| `GET /api/arsiparis/aktif` | Old canonical active list API | New active dashboard/list should not depend on it | Soft-deprecate; keep temporary compatibility | 14F |
| `GET /api/arsiparis/inaktif` | Old canonical inactive list API; dashboard still calls it | Dashboard count is wrong for folder-first runtime | Replace dashboard caller with folder-first; keep API compatibility | 14B then 14F |
| `GET /api/arsiparis/usul-musnah` | Old canonical proposed-destruction list API; dashboard still calls it | Dashboard count is wrong for folder-first runtime | Replace dashboard caller with folder-first; keep API compatibility | 14B then 14F |
| `/arsiparis/search` | Canonical/workflow search page | Primary search omits new folder-first runtime rows | Replace primary behavior with folder-first search; optionally preserve historical mode separately | 14C |
| `GET /api/arsiparis/search` | Canonical/workflow search API | API name suggests runtime search while returning old authority | Replace or split; keep old canonical behavior only if clearly historical | 14C |
| `/arsiparis/laporan-klasifikasi` | Canonical classification report page | Report undercounts new folder-first runtime | Replace with folder-first report or relabel historical until replacement exists | 14D |
| `GET /api/arsiparis/arsip/classification-report` | Canonical classification report API | Underrepresents folder-first runtime | Soft-deprecate after folder-first report API exists | 14D then 14F |
| `GET /api/arsiparis/arsip/classification-report-detail` | Canonical classification drilldown API | Underrepresents folder-first runtime | Soft-deprecate after folder-first drilldown exists | 14D then 14F |
| `GET /api/arsiparis/arsip/aggregate` | Canonical aggregate API | Could be mistaken for operational counts | Keep compatibility only; do not use as dashboard source | 14D then 14F |
| `GET /api/arsiparis/arsip/export` | Canonical metadata CSV export | Exports old authority; includes canonical ids | Keep as historical export until folder-first server export exists or UI removes need | 14D then 14F |
| Canonical lifecycle mutation UI | Section in `/arsiparis/arsip/$id` | Conflicts with folder lifecycle authority | Hide/remove in implementation phase; keep page metadata-only | 14E |
| Canonical report/export helpers | `unified-archive-aggregate-export.ts`, `unified-archive-classification-report.ts`, `unified-archive-classification-detail.ts` | New development may reuse old authority by mistake | Mark legacy/historical in docs/tests; no new folder-first callers | 14D/14F |
| Legacy helpers/remediation utilities | compatibility/canonicalization/dev reset helpers | Accidental execution could mutate rows/files if run outside scope | Keep untouched; do not run; use only in human-approved maintenance phases | Separate maintenance phase |

## Canonical Lifecycle Mutation Policy

Old canonical lifecycle mutation conflicts conceptually with folder-first authority.

Recommended future behavior:

- Remove or hide canonical lifecycle mutation UI from `/arsiparis/arsip/$id`.
- Keep `/arsiparis/arsip/$id` as historical metadata/read-only compatibility for old canonical rows.
- Soft-deprecate `POST /api/arsiparis/arsip/$id/lifecycle` after UI caller removal.
- If no caller remains, either block it with a safe historical-read-only response or remove it in a later scoped route/API cleanup phase.
- Do not use canonical lifecycle mutation for folder-first transitions.
- Do not make `ADMIN` a substitute for assigned `KEPALA_SUB_BAGIAN_UMUM`.

No canonical lifecycle mutation changes are implemented in Phase 14A.

## Legacy Physical Deletion Policy

Keep the Phase 13X and 13Y decision:

- No legacy `arsip.arsip` physical deletion target for now.
- Folder-first physical deletion remains the destructive authority.
- Folder-first candidates come only from current `berkas_arsip_item` membership plus source tables.
- Legacy canonical rows remain metadata/historical compatibility only.
- Do not delete legacy physical files from `arsip.arsip.lampiran_snapshot` unless a later human-approved legacy cleanup phase explicitly broadens scope.
- Safe responses must not expose logical paths, physical paths, storage roots, tokens, signed token internals, SQL details, env values, cookies, sessions, raw rows, password hashes, or secrets.

## Future Implementation Roadmap

Recommended small phases:

| Phase | Name | Scope |
|---|---|---|
| 14B | Dashboard Counts Folder-First Alignment | Move Arsiparis dashboard `inaktif` and `usulMusnah` counts to `GET /api/arsiparis/berkas` with matching folder status filters. No route/API removal. |
| 14C | Folder-First Archive Search Implementation | Make primary `/arsiparis/search` and search API folder-first, linking to `/arsiparis/berkas/$id`; decide whether old canonical search remains a historical mode. |
| 14D | Folder-First Report/Export Alignment | Add or switch classification report, drilldown, aggregate, and any server export needs to folder-first authority; keep existing folder CSV exports safe. |
| 14E | Legacy Canonical Detail Read-Only Relabel And Lifecycle Mutation Removal | Relabel `/arsiparis/arsip/$id` as historical/read-only and remove canonical lifecycle UI. |
| 14F | Legacy API Soft Deprecation Cleanup | After caller search/test updates, mark/block/remove old canonical APIs in narrow scoped steps without deleting data. |

Reduced 3-phase alternative if humans prefer fewer phases:

| Phase | Name | Scope |
|---|---|---|
| 14B | Folder-First Read Alignment | Dashboard counts plus folder-first search. |
| 14C | Folder-First Reporting Alignment | Report/export/aggregate replacement. |
| 14D | Legacy Canonical Surface Soft Deprecation | Read-only relabel, lifecycle mutation removal, and old API compatibility cleanup. |

The smaller 5-phase roadmap is safer because dashboard counts, search, reports, legacy UI mutation removal, and API cleanup have different risk profiles and test needs.

## Non-Goals

Phase 14A does not:

- remove routes;
- remove APIs;
- redirect additional routes;
- rewrite search;
- rewrite reports/export;
- change dashboard counts;
- change lifecycle behavior;
- delete, backfill, or mutate database rows;
- delete physical files;
- target legacy `arsip.arsip` physical deletion;
- change schema, Drizzle models, migrations, package files, env files, storage code, route registration, or `src/routeTree.gen.ts`;
- run migrations, seeds, dev server, broad build, E2E, cleanup scripts, or destructive DB/file commands;
- modify Supabase historical artifacts;
- reintroduce Supabase runtime/package behavior.

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

Expected changed files:

- `AGENTS.md`
- `docs/migration/phase-14a-legacy-soft-deprecation-search-report-plan.md`
