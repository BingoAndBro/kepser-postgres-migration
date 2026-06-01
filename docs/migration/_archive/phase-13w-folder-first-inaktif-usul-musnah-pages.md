# Phase 13W - Folder-First Inaktif And Usul Musnah Page Integration

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13W moves the existing dedicated lifecycle list pages to the folder-first read surface:

- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`

The canonical parent for new runtime remains `arsip.berkas_arsip`, with source items in `arsip.berkas_arsip_item`. Existing old `arsip.arsip` rows are preserved as historical compatibility data.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Arsip Inaktif Page

`/arsiparis/inaktif` now reads folder-first berkas through:

```text
GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=INAKTIF
```

The page displays folder-friendly metadata:

- Jenis Pembayaran;
- Status Berkas;
- Status Arsip;
- Jumlah Dokumen;
- Dokumen Workflow;
- Dokumen Manual;
- Total Nominal;
- Nomor SPM;
- Tanggal Ditutup;
- Detail.

The `Detail` action links to:

```text
/arsiparis/berkas/$id
```

The `Usulkan Musnah` action reuses the existing folder lifecycle API:

```text
POST /api/arsiparis/berkas/$id/lifecycle
action = propose_destruction
```

After success, the list refreshes and the row leaves the Inaktif page.

## Usul Musnah Page

`/arsiparis/usul-musnah` now reads folder-first berkas through:

```text
GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=USUL_MUSNAH
```

The page displays the same folder-friendly metadata as the Inaktif page and links details to `/arsiparis/berkas/$id`.

The `Musnahkan Data` action reuses the existing folder lifecycle API:

```text
POST /api/arsiparis/berkas/$id/lifecycle
action = approve_destruction
confirmation = MUSNAHKAN DATA FILE
```

The browser UI keeps the stricter typed confirmation phrase:

```text
MUSNAHKAN DATA FILE
```

The confirmation copy states that status becomes `Dimusnahkan`, preview/download file access will be blocked, physical files are not deleted in this phase, and metadata remains.

After success, the list refreshes and the row leaves the Usul Musnah page. There is no navigation to a destroyed-list page.

## Dimusnahkan No-List Policy

Phase 13W does not add a general `Dimusnahkan` list page or section.

`DIMUSNAHKAN` remains status-only in this phase. Metadata remains, and folder item preview/download remains blocked by the existing folder item file-access behavior with safe user-facing copy.

## Legacy Canonical Compatibility

Old canonical `arsip.arsip` rows are not deleted, migrated, or backfilled.

The dedicated Inaktif and Usul Musnah pages are now folder-first authority for new runtime lifecycle visibility. Old canonical rows remain historical compatibility data through preserved authorized compatibility contexts such as:

```text
/arsiparis/arsip/$id
```

The old read-only list APIs are not removed in this phase.

## Not Changed

Phase 13W does not:

- create routes;
- regenerate or manually edit `src/routeTree.gen.ts`;
- change schema, Drizzle models, or migrations;
- backfill data;
- delete or mutate old canonical rows;
- change workflow classification writes;
- change manual document create writes;
- change close berkas behavior;
- change folder lifecycle semantics beyond calling the existing API from the two pages;
- change folder item preview/download behavior;
- change `DIMUSNAHKAN` blocking;
- implement physical deletion;
- delete physical files;
- change storage code;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/inaktif`.
3. Confirm only `CLOSED/INAKTIF` folder-first berkas rows appear.
4. Click `Detail` and confirm it opens `/arsiparis/berkas/$id`.
5. Click `Usulkan Musnah`, confirm the status-only prompt, and confirm the row leaves Inaktif.
6. Open `/arsiparis/usul-musnah`.
7. Confirm the moved row appears as `CLOSED/USUL_MUSNAH`.
8. Click `Musnahkan Data` and confirm the exact typed phrase is required.
9. Confirm the copy says preview/download will be blocked, physical files are not deleted, and metadata remains.
10. Submit and confirm the row leaves Usul Musnah without navigating to a Dimusnahkan list.
11. Confirm `/arsiparis/berkas` still shows only `Berkas Terbuka` and `Pemberkasan Arsip Aktif`.
12. Confirm a known old canonical detail URL at `/arsiparis/arsip/$id` still resolves for historical rows.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/auth/roles-navigation.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
