# Phase 12L.3 - Compatibility Read Service And Backfill Plan

Date: 2026-05-24

Status: implemented pending human review. This phase adds a transitional DTO type, pure mapper helpers, focused unit tests, and a report-first backfill plan. It does not add routes, database migrations, runtime write changes, UI integration, lifecycle unification, retention calculation, cleanup, aggregate/export behavior, route generation, seed changes, or storage changes.

## Boundary

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary, `dms_active_role` remains UX-only, and server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role; operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Phase 12L.2 extended existing `arsip.arsip` as the transitional canonical archive parent foundation. Current workflow archive runtime still writes workflow-oriented rows into `arsip.arsip`. Current Manual Archive runtime still writes rows into `arsip.manual_arsip`; those rows are not migrated, copied, dual-written, or linked to canonical parent rows in this phase.

## Compatibility DTO Target

The transitional compatibility/reporting DTO is:

```ts
type UnifiedArchiveCompatibilityRow = {
  source_type: 'WORKFLOW' | 'MANUAL'
  source_id: string
  canonical_archive_id: string | null
  dokumen_transaksi_id: string | null
  nama_arsip: string | null
  nomor_surat: string | null
  klasifikasi_id: string | null
  klasifikasi_kode_snapshot: string | null
  klasifikasi_nama_snapshot: string | null
  tanggal_diarsipkan: string | null
  diarsipkan_oleh: string | null
  retensi_aktif: string | null
  retensi_inaktif: string | null
  masa_aktif_berakhir: string | null
  masa_inaktif_berakhir: string | null
  nominal_realisasi: number | null
  status_arsip: 'AKTIF' | 'INAKTIF' | 'USUL_MUSNAH' | 'DIMUSNAHKAN'
  attachment_count: number
  missing_fields: string[]
  warnings: string[]
}
```

This is a transitional compatibility/reporting shape only. It is not the final UI DTO, final canonical archive API contract, or a license to merge write paths.

`missing_fields` and `warnings` must use controlled labels only. They must not include raw SQL, SQL params, physical paths, logical storage paths, filenames, file URLs, signed URL values, token internals, env values, DB URLs, storage roots, secrets, or raw attachment contents.

The implemented pure helpers live in `src/lib/archive/unified-compatibility.ts`.

## Workflow Mapping Rules

Workflow archive rows are mapped from existing `arsip.arsip` rows:

- `source_type`: `WORKFLOW`.
- `source_id`: `arsip.id`.
- `canonical_archive_id`: `arsip.id`.
- `dokumen_transaksi_id`: `arsip.dokumen_id`.
- `nama_arsip`: prefer `arsip.nama_arsip`; if absent, a caller may provide a joined workflow document title as a conservative fallback; if no reliable value exists, report `nama_arsip` as missing.
- `nomor_surat`: `arsip.nomor_surat`.
- `klasifikasi_id`: `arsip.klasifikasi_id`.
- `klasifikasi_kode_snapshot`: `arsip.klasifikasi_kode_snapshot`.
- `klasifikasi_nama_snapshot`: `arsip.klasifikasi_nama_snapshot`.
- legacy free-text `arsip.klasifikasi`: not copied into the canonical snapshot fields; if present without `klasifikasi_id`, report a controlled warning that mapping is required.
- `tanggal_diarsipkan`: transitional mapping from `arsip.archived_at`.
- `diarsipkan_oleh`: transitional mapping from `arsip.archived_by`.
- retention fields: existing `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, and `masa_inaktif_berakhir`.
- `nominal_realisasi`: existing `arsip.nominal_realisasi`, normalized to number or null.
- `status_arsip`: existing `arsip.status_arsip`.
- `attachment_count`: count of `arsip.lampiran_snapshot` entries when the snapshot is available.

Workflow report candidates:

- rows missing `nama_arsip`;
- rows using a joined document title fallback for `nama_arsip`;
- rows missing `klasifikasi_id`;
- rows missing classification code/name snapshots;
- rows with only legacy free-text `klasifikasi`;
- rows missing `nomor_surat`;
- rows missing retention values;
- rows missing archive actor/date;
- rows missing `created_by`;
- rows with inconsistent `source_type` and workflow document relationship.

## Manual Mapping Rules

Manual Archive rows are mapped from existing `arsip.manual_arsip` rows:

- `source_type`: `MANUAL`.
- `source_id`: `manual_arsip.id`.
- `canonical_archive_id`: `null` until a future canonical parent creation/backfill phase links or creates a parent row.
- `dokumen_transaksi_id`: `null`.
- `nama_arsip`: transitional mapping from `manual_arsip.nama`.
- `nomor_surat`: `null`, reported as missing because current Manual Archive schema does not have this field.
- `klasifikasi_id`: `manual_arsip.klasifikasi_id`.
- `klasifikasi_kode_snapshot`: unavailable in current Manual Archive schema unless a future query supplies it from a joined classification row.
- `klasifikasi_nama_snapshot`: `manual_arsip.klasifikasi_nama_snapshot` when available.
- `tanggal_diarsipkan`: transitional mapping from `manual_arsip.tanggal`. This preserves the current Manual Archive domain date in reports; it is not a final rule for future canonical write alignment.
- `diarsipkan_oleh`: transitional mapping from `manual_arsip.created_by`.
- retention fields: `null` and reported missing until a retention schema/backfill phase exists.
- `nominal_realisasi`: existing `manual_arsip.nominal_realisasi`, normalized to number or null.
- `status_arsip`: existing `manual_arsip.status_arsip`.
- `attachment_count`: caller-supplied count of `manual_arsip_attachment` rows. If the count is not joined by a later query service, the mapper emits a controlled warning and uses zero as the report placeholder.

Manual report candidates:

- rows missing `nomor_surat`;
- rows missing `klasifikasi_id`;
- rows missing classification snapshots;
- rows missing retention fields;
- rows missing positive `nominal_realisasi`, including older nullable data;
- rows requiring canonical archive parent row creation;
- attachment rows that must remain linked to their Manual Archive parent and protected from cleanup.

## Backfill Report Plan

The first DB-backed phase after this helper should be report-only:

1. Read workflow archive rows and any safe joined workflow title/classification metadata needed for conservative mapping.
2. Read Manual Archive parent rows and an attachment count per parent if the query is reviewed and low-risk.
3. Map both sources through the compatibility helpers.
4. Aggregate controlled `missing_fields` and `warnings` labels into summary counts.
5. Produce row-level IDs and category counts for human review without exposing file paths, file URLs, storage roots, token internals, SQL, env values, or secrets.
6. Do not auto-fix, auto-delete, auto-create canonical parent rows, migrate rows, move files, or modify source tables.

Workflow report buckets:

- `nama_arsip` missing;
- classification id missing;
- classification snapshots missing;
- legacy free-text classification present without canonical id;
- `nomor_surat` missing;
- retention fields missing;
- archive actor/date missing;
- `created_by` missing;
- `source_type` or `dokumen_id` inconsistent for `WORKFLOW`.

Manual report buckets:

- `nomor_surat` missing;
- classification id missing;
- classification snapshots missing;
- retention fields missing;
- positive nominal missing;
- canonical parent row required;
- attachment references requiring preservation.

Human review must decide remediation policy before any backfill. Acceptable later decisions may include human data entry, deterministic classification mapping rules, approved placeholder policy, or explicit row-by-row correction. No such policy is selected by this phase.

## Why No Mutation Or Backfill Is Performed

This phase is deliberately read/report-only because canonical archive consolidation touches two source models with different write paths, attachment semantics, lifecycle behavior, file-access guards, and cleanup protection.

Mutating data before report review would risk:

- duplicate canonical parent rows;
- incomplete Manual Archive mapping because `nomor_surat` and retention fields do not exist yet;
- unsafe classification assumptions from workflow free text;
- attachment overcounting or broken attachment ownership;
- cleanup protection gaps for Manual Archive attachment references;
- lifecycle state mismatches between workflow archive rows, Manual Archive rows, and future canonical rows.

## Tests

Focused tests cover:

- workflow rows with canonical fields mapping cleanly;
- workflow rows missing `nama_arsip`;
- workflow rows with legacy free-text classification but no canonical classification id;
- Manual Archive `nama` mapping to `nama_arsip`;
- Manual Archive missing `nomor_surat`;
- Manual Archive missing classification id/snapshots;
- old Manual Archive nullable/non-positive nominal detection;
- safe summary aggregation;
- no sensitive compatibility DTO leakage of path, token, env, storage root, or SQL-like content.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12L.4 - Report-Only DB Compatibility Reader
```

Keep it read-only. Add a server-side internal query service, not a public API route, that loads current workflow archive rows and Manual Archive rows, calls the pure compatibility mappers, and returns safe report counts plus safe row identifiers for human remediation review.

Do not proceed to workflow write alignment, Manual Archive write alignment, lifecycle unification, retention backfill, aggregate/export, UI integration, cleanup, or table deletion until the report output is reviewed and remediation policy is approved.
