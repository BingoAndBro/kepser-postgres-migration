# Phase 14D - Folder-First Report/Export Alignment

Date: 2026-05-31

Status: implemented with targeted unit test validation pending/recorded in the phase result.

Superseded by Phase 14E for the `Laporan Klasifikasi` product surface: the classification report page, drilldown page, and their API routes are no longer active features. Keep this document as historical context for the short-lived 14D alignment only.

## Decision

Active archive report/export behavior must follow the folder-first runtime authority:

- `arsip.berkas_arsip` is the folder/archive parent.
- `arsip.berkas_arsip_item` is the reportable item membership list.
- `dokumen.dokumen_transaksi` enriches `WORKFLOW` items.
- `arsip.manual_arsip` enriches `MANUAL` items.

Existing canonical `arsip.arsip` report/export/aggregate helpers and APIs remain historical compatibility until a later scoped soft-deprecation/removal phase. They must not be treated as active folder-first runtime authority.

## Audit

| Surface | Route/API/helper | Authority before 14D | Active UI caller | Safe fields/leak posture | 14D outcome |
|---|---|---|---|---|---|
| Folder list CSV | `/arsiparis/berkas` using `berkas-arsip-csv.ts` | Folder-first safe list DTOs | Active | No raw ids, paths, URLs, tokens, storage roots, SQL/env/session/cookie values, raw rows, or file content | Preserved |
| Folder detail CSV | `/arsiparis/berkas/$id` using `berkas-arsip-csv.ts` | Folder-first safe detail DTOs | Active | No raw ids, item file keys, paths, URLs, tokens, storage roots, SQL/env/session/cookie values, raw rows, or file content | Preserved |
| Classification report page | `/arsiparis/laporan-klasifikasi` | Canonical API path backed by `arsip.arsip` | Removed by 14E | Metadata only | 14D switched it to folder-first helper; 14E removed the surface |
| Classification drilldown page | `/arsiparis/laporan-klasifikasi/detail` | Canonical API path backed by `arsip.arsip` | Removed by 14E | Metadata only, no file actions | 14D switched it to folder-first helper; 14E removed the surface |
| Classification report API | `GET /api/arsiparis/arsip/classification-report` | `arsip.arsip` via `unified-archive-classification-report.ts` | Removed by 14E | Metadata only | 14D retained the URL temporarily; 14E removed the route |
| Classification detail API | `GET /api/arsiparis/arsip/classification-report-detail` | `arsip.arsip` via `unified-archive-classification-detail.ts` | Removed by 14E | Metadata only | 14D retained the URL temporarily; 14E removed the route |
| Aggregate API | `GET /api/arsiparis/arsip/aggregate` | `arsip.arsip` | No active folder-first page caller observed | Aggregate counts only | Left as legacy/historical compatibility |
| Canonical CSV export API | `GET /api/arsiparis/arsip/export` | `arsip.arsip` via `getUnifiedArchiveList` | No active folder-first page caller observed | Metadata CSV, but includes canonical `ID Arsip` | Left as legacy/historical compatibility |
| Dashboard counts | `/arsiparis` page | Folder-first `/api/arsiparis/berkas` for active/inactive/proposed counts after prior phases | Active | Safe summary DTO | Confirmed no 14D change needed |
| Global archive search | `/arsiparis/search`, `GET /api/arsiparis/search` | Compatibility redirect/API only after 14B/14C | No active archive report/export caller | Deprecated canonical search API remains separate | Unchanged |

## Implementation

Added `src/lib/archive/berkas-arsip-report.ts`.

The helper returns metadata-only classification summaries and detail rows from:

- `berkas_arsip` folder metadata and lifecycle status;
- `berkas_arsip_item` item membership and source type;
- `dokumen_transaksi` workflow title/date/material nominal/attachment count metadata;
- `manual_arsip` manual title/date/nominal metadata;
- `manual_arsip_attachment` counts only.

The existing classification report API URLs were retained in 14D to avoid route generation, then removed in 14E:

- `GET /api/arsiparis/arsip/classification-report`
- `GET /api/arsiparis/arsip/classification-report-detail`

Despite the legacy URL segment, those active report endpoints now use the folder-first helper. The older `unified-archive-*` report/export helpers remain available for historical compatibility code and tests.

## Export Policy

Active runtime reports/exports must use safe DTO/display fields only.

Do not export or search:

- logical paths;
- physical paths;
- storage roots;
- signed URLs;
- file tokens;
- signed-token internals;
- `item_file_key` or bridge ids;
- raw document/manual/canonical ids unless a scoped routing policy explicitly requires a safe id;
- raw JSON rows;
- SQL details;
- env values;
- session/cookie values;
- secrets;
- file content.

Folder list CSV and folder detail CSV from Phase 13R/14C remain the active folder-first CSV surfaces. Filtered CSV behavior remains client-side and follows the rows currently visible after local filtering.

## DIMUSNAHKAN Policy

Reports and exports may include `DIMUSNAHKAN` metadata.

They must not imply file access is available:

- metadata remains visible to authorized users;
- preview/download remains blocked by file-access policy;
- physical files may already have been deleted by `Musnahkan Data`;
- no report/export includes file URLs, logical paths, physical paths, storage roots, or tokens.

## Boundaries

This phase does not:

- add routes or require `src/routeTree.gen.ts` changes;
- change schema, Drizzle migrations, or database rows;
- change lifecycle transitions;
- change `Musnahkan Data`;
- change physical deletion behavior;
- change file access behavior;
- reintroduce global/sidebar `Cari Arsip`;
- change header search;
- modify package/env files;
- modify historical Supabase artifacts;
- add Supabase runtime fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Historical Manual Smoke Checklist

This checklist applied only to the short-lived 14D surface and is superseded by Phase 14E removal.

1. Open `/arsiparis/laporan-klasifikasi`.
2. Confirm totals display folder-first berkas/document counts.
3. Confirm rows include Berkas, Terbuka, Dokumen, Workflow, Manual, Aktif, Inaktif, Usul Musnah, and Dimusnahkan metadata where data exists.
4. Open a row detail from `/arsiparis/laporan-klasifikasi/detail`.
5. Confirm detail rows show document metadata only and no preview/download/file URLs.
6. Confirm `Dimusnahkan` rows remain visible as metadata but do not expose file actions.
7. Open `/arsiparis/berkas` and confirm Export CSV still uses the filtered visible folder rows.
8. Open `/arsiparis/berkas/$id` and confirm Export Daftar Dokumen CSV still uses the filtered visible item rows.
9. Confirm `/arsiparis/search` still redirects to `/arsiparis/berkas`.
10. Confirm sidebar navigation still has no `Cari Arsip` / `Pencarian Arsip`.
