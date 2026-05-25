# Phase 12M.5 - Unified Archive Detail Page Integration

Date: 2026-05-25

Status: implemented pending human review. This phase adds a read-only unified archive detail API and page for canonical `arsip.arsip` rows. It keeps attachment metadata display, preview/download, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, and seed/storage cleanup out of scope.

Implementation note after Phase 12M.6: the unified detail service/page now display source-aware safe attachment metadata for `WORKFLOW` and linked `MANUAL` rows. Preview/download actions, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, source-link mutation, and route generation remain deferred.

## Scope And Boundary

Phase 12M.5 wires the Phase 12M.4 internal detail service into a narrow route/page/API integration.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive access remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

Active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Route, API, And Page Added

New canonical detail page:

```text
/arsiparis/arsip/$id
```

New canonical detail API:

```text
GET /api/arsiparis/arsip/$id
```

`$id` is the canonical `arsip.arsip.id`, not a workflow document id, not a Manual Archive source id, and not an `arsip_usul_musnah` proposal id.

The API calls:

```text
getUnifiedArchiveDetail(id)
```

from `src/lib/archive/unified-archive-detail.ts` and returns only the safe DTO from that service.

## Authorization Behavior

The API:

- requires a valid local `dms_session`;
- returns `401` when unauthenticated;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- returns `403` for non-Kasubag users, including `ADMIN`-only users;
- does not authorize from `dms_active_role`;
- validates `$id` as a UUID and returns safe `404` for invalid or missing rows;
- avoids logging raw error details.

The page fetches detail data from the authorized API. The existing `/arsiparis` route guard remains UX/client-side support only; the API is the authoritative data boundary.

## Displayed Common Metadata

The page displays common canonical metadata from the safe DTO:

- Nama Arsip
- Nomor Surat
- Status Arsip
- Sumber
- Klasifikasi Arsip code and name snapshot
- Tanggal Arsip
- Retensi Aktif
- Retensi Inaktif
- Masa Aktif Berakhir
- Masa Inaktif Berakhir
- Nominal Realisasi
- Created By
- Archived By
- Created At
- Updated At
- source warnings, when present

Fallback labels are safe UI strings such as `-`, `Sumber tidak dikenal`, and `Metadata sumber belum lengkap`.

## Displayed WORKFLOW Source Metadata

For `sourceType='WORKFLOW'`, the page displays a read-only section labeled:

```text
Metadata Dokumen Persetujuan
```

Displayed source fields:

- Dokumen ID
- Judul Dokumen
- Material/Non-Material indicator
- Workflow Status
- Fungsi
- Kegiatan
- Tahun
- Created By

The page does not show workflow edit controls, approval mutation controls, or workflow approval internals as main metadata.

## Displayed MANUAL Source Metadata

For `sourceType='MANUAL'`, the page displays a read-only section labeled:

```text
Metadata Arsip Manual
```

Displayed source fields:

- Nama
- Keterangan
- Kategori
- Tanggal Dokumen/Sumber
- Tanggal Diarsipkan
- Created By
- Archived By

The page does not show workflow fields for Manual Archive rows and does not show attachment rows in this phase.

## Warning Display Policy

Controlled warning labels are mapped to novice-friendly UI text:

```text
UNKNOWN_SOURCE_TYPE -> Jenis sumber arsip tidak dikenal
MISSING_MANUAL_SOURCE -> Data sumber manual belum lengkap
WORKFLOW_WITHOUT_DOKUMEN_ID -> Dokumen workflow belum terhubung
MANUAL_WITH_DOKUMEN_ID -> Arsip manual memiliki relasi dokumen tidak lazim
WORKFLOW_SOURCE_NOT_FOUND -> Metadata dokumen persetujuan tidak ditemukan
MANUAL_SOURCE_NOT_FOUND -> Metadata arsip manual tidak ditemukan
SOURCE_METADATA_INCOMPLETE -> Metadata sumber belum lengkap
```

Warnings are display-only signals. The page/API do not repair links, backfill rows, create canonical rows, update source rows, delete data, or expose diagnostics.

## DIMUSNAHKAN Metadata-Only Behavior

If the service returns a `DIMUSNAHKAN` archive row, the page may show metadata and displays:

```text
Arsip telah dimusnahkan. Metadata dapat dilihat, tetapi akses file tidak tersedia.
```

No file access is implemented by this phase. The page does not show preview or download actions.

## List Detail-Link Behavior

The unified list pages now include a small read-only `Detail` link:

- `/arsiparis/aktif`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`

Each link targets:

```text
/arsiparis/arsip/$id
```

where `$id` is the canonical `arsip.arsip.id` already returned by the Phase 12M.2 unified list APIs.

## What Is Intentionally Not Changed

This phase does not:

- implement source-aware attachment metadata display;
- add attachment section placeholders;
- add preview/download buttons;
- change existing preview/download endpoints;
- modify Manual Archive attachment upload/preview/download behavior;
- modify workflow archive preview/download behavior;
- implement lifecycle mutation;
- implement destruction mutation;
- implement edit/delete actions;
- implement search;
- implement aggregate/export;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run a live DB report;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema;
- modify drizzle migration files;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`.

The API/page must not expose logical paths, physical filesystem paths, storage roots, file URLs, preview/download URLs, tokens, signed URL internals, raw attachment metadata, raw JSON snapshots, SQL details, SQL parameters, environment values, session/cookie values, password data, secrets, or raw DB rows.

## Route Generation Note

This phase adds new TanStack file-based route files, so `src/routeTree.gen.ts` must be generated by the normal TanStack route generation process. The file must not be edited manually.

If generated routeTree output contains unrelated route changes, stop and review before accepting it.

## Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/aktif`, `/arsiparis/inaktif`, or `/arsiparis/usul-musnah`.
3. Click `Detail` on a WORKFLOW archive row.
4. Expected: `/arsiparis/arsip/$id` shows common archive metadata and workflow source metadata.
5. Click `Detail` on a linked MANUAL archive row if data exists.
6. Expected: page shows common archive metadata and Manual Archive source metadata.
7. Directly open a nonexistent archive id.
8. Expected: safe not found.
9. If a `DIMUSNAHKAN` row exists, directly open its detail URL.
10. Expected: metadata-only note; no file access actions.
11. Confirm no preview/download/lifecycle/edit/delete buttons.
12. Confirm no path/token/storage root/SQL/env/secrets/raw attachment metadata appears.
13. Login as an `ADMIN`-only account if available.
14. Expected: no operational detail access.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12M.6 - Source-Aware Detail Attachment Metadata Display
```

That phase should add safe source-aware attachment metadata only after confirming the abstraction for WORKFLOW archive snapshots versus Manual Archive attachment rows. It should still keep preview/download actions, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, and seed/storage cleanup out of scope unless explicitly approved.
