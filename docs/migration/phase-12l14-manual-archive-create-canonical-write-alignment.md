# Phase 12L.14 - Manual Archive Create Canonical Write Alignment

Date: 2026-05-24

Status: implemented pending human review and manual runtime retest. Phase 12L.9 migration must be reviewed and applied locally before runtime smoke testing reaches the database boundary.

## Scope And Boundary

Phase 12L.14 wires the Phase 12L.13 pure helper into Manual Archive `POST /api/arsiparis/manual-arsip` only.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive create remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

This phase starts creating canonical `arsip.arsip` rows with `source_type='MANUAL'` for new Manual Archive parent creates. Existing Manual Archive rows are not backfilled or canonicalized.

## Transaction Behavior

Manual Archive create now performs these database writes in one Drizzle transaction:

1. insert the source `arsip.manual_arsip` row with validated Phase 12L.10 metadata;
2. build canonical insert values from the inserted source row using the Phase 12L.13 helper;
3. insert canonical `arsip.arsip` with `source_type='MANUAL'`;
4. update the inserted source row with `manual_arsip.canonical_arsip_id = arsip.id`;
5. commit all three DB writes together.

If canonical insert or source link update fails, the transaction fails and the source insert is rolled back with the rest of the transaction.

No filesystem operation runs inside this transaction. Attachment upload remains separate.

## Canonical MANUAL Field Mapping

The canonical row copies safe metadata from the inserted source row:

| Canonical `arsip.arsip` field | Manual Archive source |
| --- | --- |
| `source_type` | `MANUAL` |
| `dokumen_id` | `null` |
| `nama_arsip` | `manual_arsip.nama` |
| `nomor_surat` | `manual_arsip.nomor_surat` |
| `klasifikasi_id` | `manual_arsip.klasifikasi_id` |
| `klasifikasi_kode_snapshot` | `manual_arsip.klasifikasi_kode_snapshot` |
| `klasifikasi_nama_snapshot` | `manual_arsip.klasifikasi_nama_snapshot` |
| `retensi_aktif` | `manual_arsip.retensi_aktif` |
| `retensi_inaktif` | `manual_arsip.retensi_inaktif` |
| `masa_aktif_berakhir` | `manual_arsip.masa_aktif_berakhir` |
| `masa_inaktif_berakhir` | `manual_arsip.masa_inaktif_berakhir` |
| `archived_at` | `manual_arsip.tanggal_diarsipkan` as UTC midnight |
| `archived_by` | `manual_arsip.archived_by` |
| `created_by` | `manual_arsip.created_by` |
| `nominal_realisasi` | `manual_arsip.nominal_realisasi` |
| `status_arsip` | `AKTIF` |
| `metadata` | safe helper value, currently `{}` |

The canonical row does not store logical paths, physical paths, storage roots, file URLs, preview/download URLs, token values, signed token internals, raw attachment metadata, SQL details, env values, DB URLs, session values, password data, or secrets.

## Attachment Partial-Success Behavior

Parent create still completes before attachment upload. Attachment upload remains a separate follow-up `POST /api/arsiparis/manual-arsip/$id/attachments`.

If attachment upload later fails, the committed source `manual_arsip` row and canonical `arsip.arsip` `MANUAL` row remain. No filesystem cleanup or parent rollback is added by this phase.

Manual Archive attachment upload, preview, and download behavior remains source-specific.

## PATCH/Edit Sync

PATCH edit behavior is intentionally unchanged. `PATCH /api/arsiparis/manual-arsip/$id` continues to update the source row only while `status_arsip='AKTIF'`.

This creates a known drift risk after a canonicalized Manual Archive source row is edited. Canonical sync on edit remains a future Phase 12L.15 decision.

## Existing Rows And Backfill

This phase does not backfill, canonicalize, remediate, or clean up existing `manual_arsip` rows.

Existing rows with `canonical_arsip_id IS NULL` remain report-first remediation candidates for a later human-reviewed phase.

## Migration Precondition

Phase 12L.9 migration must be applied locally before runtime smoke testing this phase.

If the migration is not applied, unit tests with mocks may pass, but real browser/API creates can fail at the DB boundary because required Manual Archive source columns or `canonical_arsip_id` may not exist.

This phase does not run migrations, seeds, live DB reports, route generation, broad builds, or E2E tests.

## What Is Intentionally Not Changed

This phase does not:

- modify Manual Archive UI;
- modify Manual Archive PATCH edit behavior;
- backfill existing `manual_arsip` rows;
- canonicalize existing rows;
- run the live DB compatibility report;
- implement unified archive list/detail UI;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows, tables, test data, storage files, or historical Supabase artifacts;
- modify attachment upload, preview, or download behavior;
- modify workflow archive routes;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files, generated route files, `db/`, `drizzle/`, or `supabase/`.

## Manual Retest Instructions

Precondition: Phase 12L.9 migration is applied locally.

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/penambahan-arsip`.
3. Create Manual Archive with all required metadata and no attachments.
4. Verify source row exists in `arsip.manual_arsip`.
5. Verify canonical row exists in `arsip.arsip` with `source_type='MANUAL'`.
6. Verify `manual_arsip.canonical_arsip_id` points to the canonical row.
7. Verify canonical row has no `dokumen_id`.
8. Verify canonical row has no file paths, tokens, or URLs.
9. Create Manual Archive with one attachment row.
10. Verify attachment upload still works and remains in `arsip.manual_arsip_attachment`.
11. Verify no workflow archive behavior changed.
12. Verify no cleanup or backfill occurred.

## Risks And Open Decisions

Risks:

- canonical insert is now part of the create contract, so canonical write failure fails the parent create;
- attachment upload remains separate, so source plus canonical parent may exist before attachments or after attachment upload failure;
- PATCH edit currently updates only the source row, so canonical projection drift is possible;
- existing rows still need human-reviewed remediation before backfill;
- runtime smoke tests depend on the Phase 12L.9 migration being applied.

Open decisions:

- whether Phase 12L.15 should sync `AKTIF` PATCH edits to canonical rows, block edits after canonicalization, or keep source-only edits until lifecycle unification;
- whether a future dedicated `source_manual_arsip_id` column is needed on `arsip.arsip`;
- exact report-first remediation and retry-safe backfill strategy for existing rows;
- whether canonical archive date should remain timestamp-at-UTC-midnight or later use a true date-only field.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.15 - Manual Archive edit and canonical sync policy
```

That phase should decide and implement how source `AKTIF` edits interact with canonical `MANUAL` rows. It should remain separate from existing-row backfill, lifecycle unification, unified list/detail UI, aggregate/export, attachment consolidation, and cleanup.

Implementation note as of Phase 12L.15: Manual Archive `PATCH /api/arsiparis/manual-arsip/$id` now syncs `AKTIF` linked source rows to their canonical `arsip.arsip` `MANUAL` row in one DB transaction. Unlinked legacy rows remain source-only and are not canonicalized on PATCH.
