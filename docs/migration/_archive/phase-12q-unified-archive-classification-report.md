# Phase 12Q - Unified Archive Classification Report

> Historical note: This document is retained for traceability. Current archive runtime authority is folder-first `berkas_arsip` / `berkas_arsip_item` after Phase 14K. Do not treat this document as current implementation authority without checking `docs/migration/README.md` and `AGENTS.md`.

Date: 2026-05-26

Status: implemented for review. This phase adds a metadata-only classification report for unified canonical archive rows.

Phase 12Q.1 follow-up: `docs/migration/phase-12q1-classification-report-detail-drilldown.md` adds a metadata-only `Detail` drilldown from each classification row to a canonical archive list for that classification, without per-archive detail actions, preview/download behavior, lifecycle mutation, export, schema change, cleanup, or Supabase runtime behavior.

## 1. Scope And Boundary

In scope:

- read-only classification report helper for canonical `arsip.arsip` rows;
- Kasubag-only API route `GET /api/arsiparis/arsip/classification-report`;
- user-facing page `/arsiparis/laporan-klasifikasi`;
- Kasubag navigation entry;
- focused unit tests for helper grouping, nominal policy, safe output, and route auth.

Out of scope:

- no schema change, migration, seed, package change, cleanup, lifecycle change, preview/download change, physical deletion wiring, XLSX/PDF export, storage behavior change, or Supabase runtime behavior.

## 2. Report Goal

The report helps `KEPALA_SUB_BAGIAN_UMUM` review total archive count and total nominal realisasi by archive classification across all unified canonical archive statuses:

- `AKTIF`;
- `INAKTIF`;
- `USUL_MUSNAH`;
- `DIMUSNAHKAN`.

The report counts `WORKFLOW` and `MANUAL` canonical archives together for `totalArsip`, and separately reports source/status subtotals.

## 3. Data Source Policy

The report reads from canonical `arsip.arsip` rows only. It may use safe joined workflow document metadata only to validate whether `nominal_realisasi` is material workflow data.

Unlinked legacy `manual_arsip` rows are not included. Attachment rows, file metadata, file paths, and storage helpers are not part of the report.

## 4. Nominal Realisasi Policy

`totalNominalRealisasi` includes only safely available `WORKFLOW` material archive nominal values.

Rules:

- `MANUAL` archives do not add nominal;
- non-material workflow documents do not add nominal;
- missing, null, invalid, or unverifiable nominal values count as `0`;
- totals are returned as strings to avoid float-shaped API ambiguity.

## 5. API Behavior

API:

```text
GET /api/arsiparis/arsip/classification-report
```

Response:

```json
{
  "report": {
    "rows": [],
    "totals": {
      "totalArsip": 0,
      "totalWorkflow": 0,
      "totalManual": 0,
      "totalNominalRealisasi": "0.00"
    }
  }
}
```

Optional filters:

- `status=AKTIF|INAKTIF|USUL_MUSNAH|DIMUSNAHKAN|ALL`;
- `source=WORKFLOW|MANUAL|ALL`.

Omitted filters are treated as `ALL`. Invalid filters return `400`.

## 6. UI Behavior

New page:

```text
/arsiparis/laporan-klasifikasi
```

The page displays:

- summary cards for total arsip, workflow, manual, and nominal realisasi;
- a table grouped by classification code/name;
- source and status subtotals;
- a short note that nominal realisasi is counted from workflow/material archives only.

No chart, file action, preview/download action, or export dependency is added.

## 7. Authorization Policy

The API requires:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` role checked server-side.

Expected failures:

- unauthenticated requests return `401`;
- ADMIN-only and non-Kasubag users return `403`.

The API does not rely on `dms_active_role`.

## 8. Sensitive Fields Excluded

The helper/API/UI intentionally exclude:

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

- modify lifecycle transitions;
- add destructive UI or API behavior;
- wire physical file deletion;
- add audit writes;
- add CSV/XLSX/PDF export for this report;
- change preview/download/file access;
- include unlinked legacy Manual Archive rows;
- create migrations;
- modify Drizzle schema;
- modify package files;
- modify `db/`, `drizzle/`, or historical `supabase/` artifacts;
- run DB migrations, seeds, cleanup, broad build, or E2E.

## 10. Validation

Targeted validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-classification-report.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
pnpm test tests/unit/arsiparis/unified-archive-export.test.ts
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

## 11. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/laporan-klasifikasi`.
3. Confirm summary cards load.
4. Confirm table groups archives by classification.
5. Confirm total arsip includes `WORKFLOW` and `MANUAL`.
6. Confirm total nominal realisasi only reflects `WORKFLOW` material archives.
7. Confirm no file paths, URLs, tokens, storage roots, raw metadata, SQL/env/secrets appear.
8. Login as ADMIN-only if a test account exists; API should return `403`.

## 12. Next Recommendation

Review the classification report with real local data, then decide whether a separate human-approved phase should add CSV export for this report or additional filters.
