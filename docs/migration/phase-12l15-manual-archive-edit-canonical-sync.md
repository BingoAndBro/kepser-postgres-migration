# Phase 12L.15 - Manual Archive Edit Canonical Sync

Date: 2026-05-24

Status: implemented pending human review and manual runtime retest. Phase 12L.9 migration must be reviewed and applied locally before runtime smoke testing reaches the database boundary.

## Scope And Boundary

Phase 12L.15 defines and implements Manual Archive `PATCH /api/arsiparis/manual-arsip/$id` behavior after Phase 12L.14 canonical `MANUAL` create alignment.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive edit remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

This phase changes only Manual Archive parent metadata edit behavior. Attachment upload, preview, download, lifecycle APIs, existing-row backfill, UI, migrations, schema, workflow archive routes, aggregate/export, and cleanup remain out of scope.

## Linked-Row PATCH Sync Policy

For `AKTIF` Manual Archive source rows where `manual_arsip.canonical_arsip_id` is non-null:

1. the request is validated with the existing full metadata PATCH schema;
2. active Manual Archive category is revalidated;
3. active canonical classification is revalidated;
4. classification snapshots are derived server-side;
5. retention end dates are recalculated server-side;
6. the source `manual_arsip` row is updated;
7. the linked canonical `arsip.arsip` row is updated in the same DB transaction.

The canonical update is guarded by both:

- `arsip.id = manual_arsip.canonical_arsip_id`;
- `arsip.source_type = 'MANUAL'`.

If the linked canonical row is missing or has the wrong `source_type`, the PATCH fails safely and the transaction rolls back the source update. The route returns the existing safe generic update failure response and does not expose linked id details, SQL, storage details, tokens, paths, env values, or raw DB errors.

## Unlinked Legacy Source-Only Policy

For `AKTIF` Manual Archive source rows where `manual_arsip.canonical_arsip_id` is null:

- PATCH preserves the existing source-only edit behavior;
- PATCH does not create a canonical `arsip.arsip` row;
- PATCH does not set `canonical_arsip_id`;
- the row remains a transitional legacy/report-first remediation candidate.

This is intentional because existing Manual Archive rows are not backfilled or canonicalized in this phase.

## Canonical Update Field Mapping

For linked rows, the canonical `MANUAL` row is updated from the updated source row:

| Canonical `arsip.arsip` field | Updated Manual Archive source |
| --- | --- |
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
| `archived_by` | existing source `archived_by` |
| `created_by` | existing source `created_by` |
| `nominal_realisasi` | `manual_arsip.nominal_realisasi` |
| `status_arsip` | `manual_arsip.status_arsip` |
| `metadata` | safe helper value, currently `{}` |

The PATCH source update does not change `created_by`, `archived_by`, `canonical_arsip_id`, `status_arsip`, attachment rows, upload behavior, preview behavior, or download behavior.

Canonical update values must not include attachment paths, logical paths, physical paths, storage roots, file URLs, preview/download URLs, tokens, SQL details, env values, DB URLs, session values, password data, or secrets.

## Transaction And Failure Behavior

Linked row transaction:

1. load the source row and confirm `status_arsip='AKTIF'`;
2. validate request data and compute source update values;
3. in one DB transaction, update the source row;
4. build canonical update values from the updated source row;
5. update the linked canonical row guarded by `id` and `source_type='MANUAL'`;
6. if the canonical update affects no row, throw a controlled internal failure and roll back the source update.

Unlinked rows preserve source-only update behavior and do not create canonical rows.

Non-`AKTIF` rows preserve the existing safe conflict response. `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN` remain locked for parent metadata edit.

## What Is Intentionally Not Changed

This phase does not:

- modify Manual Archive UI;
- create canonical `MANUAL` rows on PATCH;
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

## Migration Precondition

Phase 12L.9 migration must be applied locally before runtime smoke testing this phase.

If the migration is not applied, unit tests with mocks may pass, but real browser/API PATCH behavior can fail at the DB boundary because required Manual Archive source columns or `canonical_arsip_id` may not exist.

This phase does not run migrations, seeds, live DB reports, route generation, broad builds, or E2E tests.

## Manual Retest Instructions

Precondition: Phase 12L.9 migration is applied locally.

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Create a new Manual Archive so it has `canonical_arsip_id`.
3. PATCH/edit the `AKTIF` source row through direct API with changed metadata.
4. Verify the source `manual_arsip` row updates.
5. Verify the linked canonical `arsip.arsip` row with `source_type='MANUAL'` updates with mirrored metadata.
6. Verify `created_by`, `archived_by`, and `canonical_arsip_id` remain stable.
7. Verify attachment upload, preview, and download still work.
8. Try editing a non-`AKTIF` row if test data exists; expect a conflict response.
9. Verify no existing-row backfill, cleanup, migration, or canonicalization occurred.

## Risks And Open Decisions

Risks:

- linked PATCH now treats canonical sync failure as a full edit failure;
- unlinked legacy rows can still diverge from canonical reporting because they do not have canonical rows yet;
- runtime smoke testing depends on the Phase 12L.9 migration being applied;
- rollback is provided by DB transaction semantics and should be verified against the real local PostgreSQL runtime.

Open decisions:

- report-first remediation and retry-safe backfill strategy for existing unlinked rows;
- whether future lifecycle APIs keep `manual_arsip` authoritative or move authority to canonical `arsip.arsip`;
- whether a future dedicated `source_manual_arsip_id` column is needed on `arsip.arsip`;
- whether canonical archive date should remain timestamp-at-UTC-midnight or later use a true date-only field.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.16 - Existing Manual Archive remediation and backfill plan
```

That phase should remain report-first and human-reviewed. It should not be combined with cleanup, lifecycle unification, unified list/detail UI, aggregate/export, attachment consolidation, migrations, or storage changes unless explicitly approved.
