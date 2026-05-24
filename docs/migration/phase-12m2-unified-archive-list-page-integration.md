# Phase 12M.2 - Unified Archive List Page Integration

Date: 2026-05-24

Status: implemented pending human review. This phase wires existing Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages to the internal unified canonical archive query service from Phase 12M.1. The integration is read-only and list/UI-only.

## Scope And Boundary

This phase updates existing routes only:

- `/arsiparis/aktif`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`

The list APIs now call `getUnifiedArchiveList()` from `src/lib/archive/unified-archive-query.ts` and keep the existing API route URLs. The active data path remains local PostgreSQL plus Drizzle through the unified query helper.

This phase does not create new routes, regenerate `src/routeTree.gen.ts`, create migrations, change schema, run seeds, run live reports, perform backfill, or cleanup old data/files.

## Pages Wired

The existing list pages were wired to canonical archive list DTOs:

- Arsip Aktif list page reads canonical `AKTIF` rows.
- Arsip Inaktif list page reads canonical `INAKTIF` rows.
- Usul Musnah list page reads canonical `USUL_MUSNAH` rows.

The old list tables were workflow-document-centric and showed approval/workflow metadata such as fungsi, kegiatan, and old document title fields. The new list tables show archive metadata filled on canonical archive rows.

## Server-Side Authorization Behavior

The three list API handlers continue to enforce server-side authorization:

- Require a valid local `dms_session` through `getLocalServerSession(request)`.
- Require assigned `KEPALA_SUB_BAGIAN_UMUM` through server-side role membership.
- Do not authorize from `dms_active_role`.
- Do not treat `ADMIN` as operational archive access unless the account is also explicitly assigned `KEPALA_SUB_BAGIAN_UMUM`.

The `/arsiparis` route layout still provides the existing client/layout guard for UX routing, but the authoritative enforcement for list data remains on the server/API boundary.

## Status-To-Page Mapping

```text
/arsiparis/aktif        -> statusArsip = AKTIF
/arsiparis/inaktif      -> statusArsip = INAKTIF
/arsiparis/usul-musnah  -> statusArsip = USUL_MUSNAH
```

`DIMUSNAHKAN` is intentionally not included in these operational list pages.

## Displayed Columns

The list UI shows safe archive metadata:

- Nama Arsip
- Nomor Surat
- Klasifikasi Arsip from canonical snapshot code/name
- Tanggal Arsip
- Retensi Aktif
- Retensi Inaktif
- Masa Aktif Berakhir
- Masa Inaktif Berakhir
- Nominal Realisasi
- Sumber with friendly labels
- Jumlah Lampiran when known

Friendly source labels:

- `WORKFLOW` -> `Dokumen Persetujuan`
- `MANUAL` -> `Arsip Manual`

The UI does not display logical paths, physical paths, storage roots, file URLs, preview/download URLs, token internals, signed URL internals, raw attachment metadata, raw JSON snapshots, SQL details, env values, DB URLs, session/cookie values, or secrets.

## Source Warning Display Policy

Controlled source integrity warnings from the query helper are converted before display:

- `MISSING_MANUAL_SOURCE` -> `Data sumber manual belum lengkap`
- `WORKFLOW_WITHOUT_DOKUMEN_ID` -> `Dokumen workflow belum terhubung`
- `MANUAL_WITH_DOKUMEN_ID` -> `Arsip manual memiliki relasi dokumen tidak lazim`
- `UNKNOWN_SOURCE_TYPE` -> `Jenis sumber arsip tidak dikenal`

Warnings are small list badges only. They are not repair actions and do not expose raw diagnostic labels to normal users.

## Search Deferred Policy

Search remains deferred. The list pages do not present an active search field.

The old Arsip Aktif search input and fungsi filters on the three pages were removed from the list UI because the unified Phase 12M.1 query helper intentionally defers broad text search and does not provide workflow-only fungsi filters for canonical MANUAL rows.

## Legacy And Unlinked Manual Archive Behavior

Unified list pages read canonical `arsip.arsip` rows only.

Unlinked legacy `manual_arsip` rows are not included in these pages. They remain remediation/report scope from prior phases and must not be silently mixed into canonical operational lists.

If old Manual Archive rows appear missing, the expected explanation is that only linked canonical `MANUAL` rows are included by this integration.

## Future Development Cleanup Note

Old development seed data and related storage files from pre-consolidation Manual Archive work may be cleaned later in a dedicated development cleanup phase after unified list and detail behavior is stable.

This phase does not perform cleanup, delete files, delete rows, touch storage, run live reports, backfill data, create canonical `MANUAL` rows, or update `manual_arsip.canonical_arsip_id`.

## What Is Intentionally Not Changed

This phase does not:

- implement lifecycle mutation;
- implement unified detail pages;
- modify existing detail page internals;
- add preview/download behavior;
- add file tokens or signed URLs;
- modify Manual Archive create/edit APIs;
- modify Manual Archive upload/preview/download behavior;
- modify workflow archive creation routes;
- implement search;
- implement aggregate/export;
- implement cleanup;
- cleanup seed data or storage files;
- run live DB reports;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema;
- modify package files;
- modify `src/routeTree.gen.ts`;
- modify `db/`, `drizzle/`, or `supabase/`.

## Manual Retest Instructions

Requires the local app running.

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open Arsip Aktif page.
3. Confirm it shows canonical `AKTIF` rows from both `WORKFLOW` and linked `MANUAL` sources if data exists.
4. Open Arsip Inaktif page.
5. Confirm it shows canonical `INAKTIF` rows if data exists.
6. Open Usul Musnah page.
7. Confirm it shows canonical `USUL_MUSNAH` rows if data exists.
8. Confirm rows show friendly source labels.
9. Confirm no path/token/storage root/SQL/env/secrets/raw attachment metadata appears.
10. Confirm search is absent/disabled/deferred.
11. Login as `ADMIN`-only if a test account exists; expected no operational access to list data.
12. Confirm no lifecycle/edit/delete/preview/download behavior was added by this phase.

## Next Phase Recommendation

Follow-up after Phase 12M.3: the unified archive detail policy now recommends a future canonical detail route:

```text
/arsiparis/arsip/$id
```

The id should be canonical `arsip.arsip.id`. Existing status-specific detail routes should remain temporarily until the read-only unified detail service and page are implemented and reviewed.

Recommended next implementation phase:

```text
Phase 12M.4 - Unified Archive Detail Read Service
```

That phase should add an internal read-only canonical detail service only. Lifecycle mutation, preview/download, search, aggregate/export, cleanup, backfill, route generation, and UI integration should remain separately scoped unless explicitly approved.
