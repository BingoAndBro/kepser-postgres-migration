# Phase 12Q.1 - Classification Report Detail Drilldown

Date: 2026-05-26

Status: implemented for review. This phase adds a metadata-only drilldown from the unified archive classification report.

## 1. Scope And Boundary

In scope:

- `Detail` action from each `/arsiparis/laporan-klasifikasi` classification row;
- read-only detail API for one classification bucket;
- read-only detail page for archives inside that classification bucket;
- missing-classification drilldown support;
- focused helper/API tests.

Out of scope:

- no schema change, migration, seed, package change, lifecycle change, preview/download change, cleanup, physical deletion, export, or Supabase runtime behavior.

## 2. User Goal

`KEPALA_SUB_BAGIAN_UMUM` can open a classification row and view the canonical archives grouped inside that classification, without leaving the report context or exposing per-archive file/detail actions.

## 3. Report Detail Action Behavior

The classification report table adds an `Aksi` column with a `Detail` action.

Link behavior:

- rows with `klasifikasiId` open `/arsiparis/laporan-klasifikasi/detail?klasifikasiId=<uuid>`;
- rows without classification open `/arsiparis/laporan-klasifikasi/detail?missing=true`.

The report summary cards and existing grouping columns remain unchanged.

## 4. Detail API Behavior

API:

```text
GET /api/arsiparis/arsip/classification-report-detail
```

Supported query:

- `klasifikasiId=<uuid>`; or
- `missing=true`.

Optional filters remain bounded:

- `status=AKTIF|INAKTIF|USUL_MUSNAH|DIMUSNAHKAN|ALL`;
- `source=WORKFLOW|MANUAL|ALL`.

Omitted filters mean all statuses and all sources.

The API requires local `dms_session` and assigned `KEPALA_SUB_BAGIAN_UMUM` server-side. Unauthenticated requests return `401`; ADMIN-only and non-Kasubag users return `403`.

## 5. Detail Page Behavior

Page:

```text
/arsiparis/laporan-klasifikasi/detail
```

The page displays:

- breadcrumb: `Kepala Sub Bagian Umum > Laporan Klasifikasi Arsip > Detail Klasifikasi`;
- title: `Daftar Arsip Klasifikasi`;
- classification code and name;
- summary cards for total archive, workflow, manual, and nominal totals;
- table columns for archive name, letter number, archive status, source, archive date, nominal realisasi, and attachment count;
- back link to `/arsiparis/laporan-klasifikasi`;
- empty state when no canonical rows match.

The page intentionally does not show per-archive `Detail` actions.

## 6. Missing Classification Behavior

The missing-classification drilldown uses the same report bucket policy: canonical archive rows where classification id and classification snapshots are missing/blank.

Display labels:

- `Kode Klasifikasi: Tidak tersedia`;
- `Nama Klasifikasi: Tidak tersedia`.

## 7. Nominal Policy

`nominalRealisasi` is returned only for safely available `WORKFLOW` material archive rows.

Rules:

- `MANUAL` archive rows show no nominal value in the drilldown table;
- non-material workflow rows show no nominal value;
- total nominal realisasi sums only displayed workflow/material nominal values;
- totals are returned as strings to avoid float-shaped API ambiguity.

## 8. Sensitive Field Exclusions

The helper, API, and UI intentionally exclude:

- file contents;
- file URLs;
- signed URLs;
- file tokens;
- logical paths;
- physical paths;
- storage roots;
- raw attachment metadata;
- raw DB rows;
- SQL and SQL params;
- env values and DB URLs;
- session/cookie values;
- secrets.

## 9. What Is Intentionally Not Changed

This phase does not:

- add per-archive detail actions to the drilldown table;
- change archive lifecycle behavior;
- change preview/download/file access;
- add cleanup behavior;
- add CSV/XLSX/PDF export;
- include unlinked legacy Manual Archive rows;
- modify Drizzle schema or migrations;
- modify package files;
- modify `db/`, `drizzle/`, or historical `supabase/` artifacts.

## 10. Validation

Targeted validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-classification-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-classification-report.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- db
git diff -- drizzle
git diff -- supabase
```

## 11. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/laporan-klasifikasi`.
3. Confirm each classification row has `Aksi > Detail`.
4. Click `Detail`.
5. Confirm the detail page shows only archives from the selected classification.
6. Confirm the table has no per-archive `Detail` action.
7. Confirm `WORKFLOW` and `MANUAL` archives can appear together.
8. Confirm nominal totals only include `WORKFLOW` material archives.
9. Confirm the missing-classification row works if data exists.
10. Confirm no paths, URLs, tokens, storage roots, raw metadata, SQL/env/secrets appear.
11. Login as ADMIN-only if a test account exists; API should return `403`.
