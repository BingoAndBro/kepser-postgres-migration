# Phase 13R - Folder-First CSV Export For Berkas And Berkas Items

Date: 2026-05-30

Status: implemented pending targeted test and human retest.

## Phase Status

Phase 13R adds bounded read-only CSV export on the folder-first archive pages.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## List-Level Export

`/arsiparis/berkas` now provides a client-side `Export CSV` action for the currently visible folder-first sections:

- `Berkas Terbuka`;
- `Pemberkasan Arsip Aktif`.

The export uses the same safe DTO data already fetched by the page from `GET /api/arsiparis/berkas`. It does not add a new export API route and does not query the database directly.

The list CSV includes user-facing folder metadata only:

- section label;
- Jenis Pembayaran label;
- folder/archive status labels;
- document counts;
- total nominal;
- Nomor SPM;
- closed/updated dates.

## Detail Item-Level Export

`/arsiparis/berkas/$id` now provides `Export Daftar Dokumen CSV` near `Daftar Dokumen Dalam Berkas`.

The export uses the same safe detail DTO already fetched by the page from `GET /api/arsiparis/berkas/$id`. It includes both `WORKFLOW` and `MANUAL` items with user-facing metadata:

- source label;
- document name;
- document date;
- creator display name when available;
- nominal;
- attachment count;
- workflow or manual provenance summary;
- safe warning labels.

## CSV Safety Rules

The CSV helper:

- escapes comma, quote, newline, and carriage-return cells;
- doubles quotes inside quoted cells;
- converts `null` and `undefined` to empty cells;
- prefixes spreadsheet formula-dangerous cells with an apostrophe;
- treats cells starting with `=`, `+`, `-`, `@`, tab, carriage return, newline, or spaces before formula prefixes as unsafe for direct spreadsheet evaluation;
- uses UTF-8 output with BOM to match the existing archive export convention.

## Export Boundary

CSV output must not include:

- raw `berkas_id`;
- raw `item_id` or `item_file_key`;
- raw `canonical_arsip_id`, `dokumen_id`, or `manual_arsip_id`;
- raw `klasifikasi_id`;
- raw `created_by` or `closed_by` UUIDs;
- physical paths;
- logical paths;
- storage roots;
- URLs;
- file tokens or signed-token internals;
- attachment paths;
- raw attachment metadata;
- SQL details;
- env values;
- cookies, sessions, secrets, password hashes, or tokens;
- file content.

## Empty State

Export buttons are disabled when there is no data to export and show:

```text
Tidak ada data untuk diekspor.
```

## Non-Goals

Phase 13R does not:

- add export API routes;
- add raw row dump endpoints;
- change lifecycle transition semantics;
- change close/finalize behavior;
- change preview/download behavior;
- change storage helpers;
- delete physical files;
- implement physical destruction;
- mutate existing database rows;
- stop transitional `arsip.arsip` writes;
- de-transitionalize old archive model;
- backfill data;
- add schema or migrations;
- change packages or env files;
- change Supabase runtime behavior.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm only `Berkas Terbuka` and `Pemberkasan Arsip Aktif` sections are visible.
4. Click `Export CSV`.
5. Confirm the downloaded CSV contains only user-facing folder metadata and no raw IDs, paths, URLs, tokens, storage roots, or file content.
6. Open `/arsiparis/berkas/$id`.
7. Click `Export Daftar Dokumen CSV`.
8. Confirm `WORKFLOW` and `MANUAL` rows show user-friendly provenance and no internal item keys, IDs, file paths, URLs, tokens, or file content.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-csv.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
