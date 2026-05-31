# Phase 14H - Remove Legacy Canonical Runtime Routes/APIs/Helpers

Date: 2026-05-31

Status: implemented pending targeted validation and human smoke.

## Scope

Phase 14H removes obsolete legacy canonical archive runtime code after the folder-first archive migration. This is runtime cleanup only. It does not drop or mutate database schema, rows, storage files, or physical deletion behavior.

Folder-first runtime authority remains:

- `arsip.berkas_arsip`
- `arsip.berkas_arsip_item`
- `dokumen.dokumen_transaksi` for `WORKFLOW` source metadata
- `arsip.manual_arsip` and `arsip.manual_arsip_attachment` for `MANUAL` source metadata
- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/api/arsiparis/berkas`
- `/api/arsiparis/berkas/$id`
- `/api/arsiparis/berkas/$id/items`
- `/api/arsiparis/berkas/$id/lifecycle`
- `/api/arsiparis/berkas/$id/close`

## Dashboard Count Migration

The archive dashboard no longer calls the removed canonical count APIs:

- `GET /api/arsiparis/inaktif`
- `GET /api/arsiparis/usul-musnah`

Dashboard counts now use the folder-first berkas list API with lifecycle filters:

- `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF`
- `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=INAKTIF`
- `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=USUL_MUSNAH`

The UI labels remain aligned to the folder-first archive surfaces.

## Removed Browser Routes

The following legacy canonical browser routes were removed:

- `/arsiparis/aktif`
- `/arsiparis/arsip/$id`
- `/arsiparis/search`

The prior compatibility redirects for `/arsiparis/aktif` and `/arsiparis/search` are intentionally removed in this development cleanup phase.

## Removed API Routes

The following legacy canonical API routes were removed:

- `GET /api/arsiparis/aktif`
- `GET /api/arsiparis/inaktif`
- `GET /api/arsiparis/usul-musnah`
- `GET /api/arsiparis/search`
- `GET /api/arsiparis/arsip/$id`
- `POST /api/arsiparis/arsip/$id/lifecycle`
- `GET /api/arsiparis/arsip/aggregate`
- `GET /api/arsiparis/arsip/export`

Folder-first APIs under `/api/arsiparis/berkas` remain active.

## Removed Helpers And Tests

The removed helpers only supported the deleted canonical runtime routes/APIs or old manual/canonical remediation flows:

- `unified-archive-*`
- `unified-compatibility*`
- manual archive canonicalization and remediation helpers
- canonical physical destruction helper
- canonical lifecycle/detail/query/export helpers
- Phase 13 legacy archive dev reset helpers
- `dev-manual-archive-cleanup.ts`

The corresponding unit tests were removed because their runtime targets no longer exist.

`dev-manual-archive-cleanup.ts` decision: deleted. It was a local-development cleanup helper coupled to old manual/canonical archive data and snapshot compatibility. It is not required to protect the current folder-first manual runtime, which keeps source metadata in `manual_arsip` plus `manual_arsip_attachment` and attaches rows to `berkas_arsip_item`.

## Protected Behavior

Unchanged:

- `dms_session` remains the auth boundary.
- Server/API RBAC remains authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` remains the archive/folder operation owner.
- `ADMIN` is not a substitute for archive operations.
- Folder-first lifecycle behavior is unchanged.
- `Musnahkan Data` behavior is unchanged.
- Folder-first physical file deletion helper behavior is unchanged.
- File access and destroyed-file handling are unchanged.
- `Data file sudah dimusnahkan` remains the destroyed-file UX copy.
- Safe local CSV exports remain on folder-first pages.
- Local folder-first filters remain page-local.
- Global `Cari Arsip` and `Laporan Klasifikasi` are not restored.
- Header search is unchanged.

## Schema Boundary

No schema or migration cleanup is included in Phase 14H.

Do not drop or modify yet:

- `arsip.arsip`
- `arsip.lampiran_snapshot`
- `arsip_usul_musnah`
- `canonical_arsip_id` columns
- Drizzle schema files
- Drizzle migrations

Phase 14I is the intended schema cleanup phase for dropping obsolete canonical schema/tables/columns after this runtime cleanup is validated.

## Supabase Boundary

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability/cleanup backlog. This phase does not modify `supabase/` and does not claim Supabase is fully removed from the repository.

## Manual Smoke Checklist

1. Open `/arsiparis` and verify archive counts render from folder-first data.
2. Open `/arsiparis/berkas` and verify active closed berkas rows render.
3. Open `/arsiparis/berkas/$id` and verify item list, local filter, preview/download buttons, and detail CSV export remain.
4. Open `/arsiparis/inaktif` and verify local filter, CSV export, and `Usulkan Musnah` action remain.
5. Open `/arsiparis/usul-musnah` and verify local filter, CSV export, and `Musnahkan Data` modal remain.
6. For a destroyed folder item, verify preview/download displays `Data file sudah dimusnahkan`.
7. Confirm `/arsiparis/aktif`, `/arsiparis/search`, and `/arsiparis/arsip/$id` are no longer registered runtime routes.
8. Confirm removed canonical API routes return normal route-not-found behavior in the deployed runtime.
