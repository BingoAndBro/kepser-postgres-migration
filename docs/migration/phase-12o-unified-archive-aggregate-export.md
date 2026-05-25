# Phase 12O - Unified Archive Aggregate And Export

Date: 2026-05-25

Status: implemented for review. This phase adds metadata-only aggregate and CSV export capability for unified canonical archive rows.

## 1. Scope And Boundary

In scope:

- read-only aggregate API for unified canonical archive rows;
- metadata-only CSV export API for unified canonical archive rows;
- small export entry points on `/arsiparis/aktif`, `/arsiparis/inaktif`, and `/arsiparis/usul-musnah`;
- focused unit tests for aggregate/export behavior and route authorization failures;
- route generation for the new static API route files.

Out of scope:

- no file content export;
- no file URLs, signed URLs, file tokens, logical paths, physical paths, storage roots, or raw attachment metadata;
- no lifecycle behavior change;
- no preview/download behavior change;
- no physical deletion helper wiring;
- no audit table/schema or audit writes;
- no migrations, Drizzle schema changes, package changes, seed changes, Supabase runtime behavior, or storage cleanup.

## 2. Aggregate Behavior

New API:

```text
GET /api/arsiparis/arsip/aggregate
```

The response returns safe count metadata only:

- total canonical archive count;
- counts by `status_arsip`: `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`;
- counts by `source_type`: `WORKFLOW` and `MANUAL`;
- counts by status and source type pair;
- unknown source type count for defensive reporting.

The aggregate does not include archive rows, attachment rows, file metadata, paths, URLs, tokens, SQL details, env values, session/cookie values, or secrets.

## 3. Export Behavior

New API:

```text
GET /api/arsiparis/arsip/export
```

Supported query params:

- `status=AKTIF|INAKTIF|USUL_MUSNAH|DIMUSNAHKAN|ALL`
- `source=WORKFLOW|MANUAL|ALL`

Omitted filters are treated as `ALL`.

The export uses the existing unified archive list reader and a conservative maximum of 500 rows, aligned to `UNIFIED_ARCHIVE_QUERY_MAX_LIMIT`. If the result reaches the cap, response headers mark the export as truncated:

```text
X-Archive-Export-Truncated: true
```

This avoids an unbounded local/internal export path. A larger/full export remains a future human-approved decision if operational data volume requires it.

## 4. CSV Metadata-Only Policy

CSV response headers:

```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="arsip-unified-export.csv"
Cache-Control: no-store
```

Filename is static and does not include user input.

Columns:

- `ID Arsip`
- `Nama Arsip`
- `Nomor Surat`
- `Status Arsip`
- `Sumber Arsip`
- `Klasifikasi`
- `Tanggal Arsip`
- `Retensi Aktif`
- `Retensi Inaktif`
- `Dibuat oleh`
- `Diarsipkan oleh`
- `Nominal Realisasi`
- `Jumlah Lampiran`
- `Tanggal dibuat`
- `Terakhir diperbarui`

The CSV writer:

- emits UTF-8 with BOM for Excel-friendly local/internal use;
- quotes values containing comma, quote, CR, or LF;
- doubles internal quotes;
- prefixes spreadsheet-dangerous values that start with `=`, `+`, `-`, or `@`;
- maps unsafe URL/path/token-like export text to safe fallback labels.

## 5. UI Integration

Added small `Export CSV` links on:

- `/arsiparis/aktif` to `/api/arsiparis/arsip/export?status=AKTIF`;
- `/arsiparis/inaktif` to `/api/arsiparis/arsip/export?status=INAKTIF`;
- `/arsiparis/usul-musnah` to `/api/arsiparis/arsip/export?status=USUL_MUSNAH`.

Existing row `Detail` links remain pointed to:

```text
/arsiparis/arsip/$id
```

No destroyed list page is added.

## 6. Authorization Policy

Both new APIs require:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` role checked server-side.

Expected failures:

- unauthenticated requests return `401`;
- non-Kasubag and ADMIN-only requests return `403`.

The APIs do not rely on `dms_active_role`.

## 7. Sensitive Fields Excluded

Aggregate and export intentionally exclude:

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

Actor fields use display names when safely resolved. Missing actor ids export `Tidak tersedia`; unresolved actor ids export `Pengguna tidak ditemukan`. Raw actor UUIDs are not exported as actor labels.

## 8. What Is Intentionally Not Changed

This phase does not:

- modify lifecycle transitions;
- add destructive UI or API behavior;
- wire the Phase 12N.10 physical deletion helper;
- add audit writes;
- add export packages;
- add XLSX/PDF output;
- change preview/download/file access;
- include unlinked legacy Manual Archive rows outside the canonical unified query;
- create migrations;
- modify Drizzle schema;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- run DB migrations or seeds;
- perform cleanup.

## 9. Validation

Focused validation for implementation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-aggregate.test.ts
pnpm test tests/unit/arsiparis/unified-archive-export.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- db
git diff -- drizzle
git diff -- supabase
git diff -- src/routeTree.gen.ts
```

## 10. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/aktif`.
3. Confirm the page loads and `Detail` links still open `/arsiparis/arsip/$id`.
4. Click `Export CSV`.
5. Expected: CSV downloads or opens and contains metadata only.
6. Repeat for `/arsiparis/inaktif` and `/arsiparis/usul-musnah`.
7. Confirm exported CSV does not contain file paths, URLs, signed tokens, storage roots, raw metadata, SQL, env values, secrets, or file contents.
8. Call `/api/arsiparis/arsip/aggregate` as Kasubag and confirm counts look plausible.
9. Login as ADMIN-only if a test account exists; aggregate/export APIs should return `403`.

## 11. Next Roadmap Item

Proceed next to:

```text
Phase 12P-dev - Development data/storage cleanup
```

Keep cleanup, physical deletion, audit persistence, full export, and package-based export formats as separate human-approved work.
