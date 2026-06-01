# Phase 12L.1b - Unified Archive Database Consolidation Plan

Date: 2026-05-24

Status: planning implemented pending human review. No source code, schema, migration, route generation, test, build, seed, storage, or data cleanup change is included in this phase.

## Boundary

This phase records the database/domain-model correction plan for converging workflow archive and Manual Archive into one canonical archive parent model.

The active data path remains local PostgreSQL plus Drizzle. The auth boundary remains local `dms_session`; `dms_active_role` is UX-only and must not be used as authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Archive operations remain assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Current-State Inventory

Workflow archive currently uses `arsip.arsip` as a workflow-coupled archive table. It requires a document transaction reference and stores archive lifecycle metadata such as `nomor_surat`, free-text `klasifikasi`, retention labels, active/inactive end dates, archive actor/date fields, status, destruction metadata, nominal value, and a workflow attachment snapshot.

Workflow archive lifecycle is implemented around the existing archive status values:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

The workflow archive flow currently:

- creates an archive row from a `COMPLETED` workflow document;
- moves the workflow document to `ARCHIVED`;
- appends workflow audit activity;
- moves archive records from `AKTIF` to `INAKTIF`;
- creates an `arsip_usul_musnah` row when moving `INAKTIF` to `USUL_MUSNAH`;
- marks the archive `DIMUSNAHKAN` when a pending destruction proposal is approved;
- clears the workflow attachment snapshot and attempts scoped file deletion during destruction approval.

Manual Archive currently uses separate tables:

- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

Manual Archive currently has parent create/list/detail APIs, required positive integer nominal at API/UI boundary, attachment upload with explicit attachment title, authorized preview/download APIs, UI preview/download modal, and `PATCH` parent metadata edit limited to `status_arsip='AKTIF'`.

Manual Archive lifecycle values are already aligned by name with workflow archive status values, but lifecycle transition APIs are not implemented yet. Manual Archive retention fields, aggregate/export behavior, and cleanup behavior are not implemented yet.

Current archive list pages for `AKTIF`, `INAKTIF`, and `USUL_MUSNAH` are workflow-only. They join archive rows to workflow/process metadata such as document title, function, activity, workflow proposal state, and workflow destruction proposal fields. This leaks process-approval concepts into archive list tables and prevents Manual Archive from participating naturally in the same lists.

Manual Archive has a separate `Penambahan Arsip` page. That page displays Manual Archive metadata such as name, date, category, classification, description, nominal, status, update date, and attachment actions. It does not participate in the existing archive lifecycle list pages.

File models are currently separate:

- workflow archive preserves a document attachment snapshot on the workflow archive row;
- Manual Archive stores attachment rows under the Manual Archive attachment table;
- workflow preview/download revalidates document/archive state before issuing file access;
- Manual Archive preview/download directly revalidates assigned role, parent/attachment ownership, current lifecycle state, allowed stored content type, and local storage containment before serving bytes.

Admin storage diagnostics and cleanup currently protect workflow document attachment references and workflow archive snapshots. Manual Archive attachment references are not yet integrated into that protection model, so cleanup must not be expanded destructively until canonical archive and attachment reference protection are explicitly designed and tested.

## Target Canonical Archive Model

Use one canonical archive parent model for both workflow and Manual Archive rows. The recommended discriminator is:

```ts
source_type: 'WORKFLOW' | 'MANUAL'
```

Do not use `is_manual_archive` as the primary discriminator. A typed source value is clearer in queries, safer in migrations, less error-prone than inverted booleans, and easier to evolve if another source is added later.

The canonical archive parent should support these columns or equivalent Drizzle fields:

- `id`
- `source_type`
- `dokumen_transaksi_id`, nullable overall
- `nama_arsip`
- `nomor_surat`
- `klasifikasi_id`
- `klasifikasi_kode_snapshot`
- `klasifikasi_nama_snapshot`
- `retensi_aktif`
- `retensi_inaktif`
- `masa_aktif_berakhir`
- `masa_inaktif_berakhir`
- `tanggal_diarsipkan`
- `diarsipkan_oleh`
- `nominal_realisasi`
- `status_arsip`
- safe supplemental `metadata` JSON if needed
- `created_by`
- `created_at`
- `updated_at`

Recommended requiredness after consolidation:

- Required for every canonical archive row: `source_type`, `nama_arsip`, `nomor_surat`, `klasifikasi_id`, `klasifikasi_nama_snapshot`, `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, `masa_inaktif_berakhir`, `tanggal_diarsipkan`, `diarsipkan_oleh`, `status_arsip`, `created_by`, `created_at`, and `updated_at`.
- Required only for `WORKFLOW`: `dokumen_transaksi_id`.
- Must be null for `MANUAL`: `dokumen_transaksi_id`.
- Required at Manual Archive create/edit API boundary during the transition: positive integer `nominal_realisasi` greater than 0.
- For workflow rows, `nominal_realisasi` should preserve the existing workflow value and retain Material/Non-Material rules from the document domain.

The target model should reference `master_klasifikasi_arsip` by id. Free-text classification should be replaced by classification id plus code/name snapshots for historical display resilience.

`metadata` must remain supplemental only. It must not become the only storage for archive name, letter number, classification, retention fields, file access data, nominal value, lifecycle status, actor ids, or dates.

## Metadata Standardization

Workflow archive must collect and store `nama_arsip`. During backfill, a conservative default can derive it from the workflow document title, but future edits or a targeted data-quality phase may allow human correction.

Manual Archive must collect and store `nomor_surat`. Existing rows should be migrated in a controlled backfill phase, with missing values reported first and corrected by human entry or a documented placeholder policy only if approved.

Manual Archive field `nama` should be treated as `nama_arsip` in the canonical domain. UI labels should become `Nama Arsip`, and DB naming should move toward `nama_arsip`.

Klasifikasi arsip should become mandatory for both sources. During migration, existing manual rows with missing classification and existing workflow rows with only free-text classification need report-first handling before a NOT NULL or equivalent check is enforced.

Archive list pages for `AKTIF`, `INAKTIF`, and `USUL_MUSNAH` should display archive metadata only, such as archive name, letter number, classification, lifecycle status, archive date, retention dates, and source label if useful. Workflow/process metadata such as function, activity, request type, workflow title, approval chain, and activity log should move to detail view and be shown only when `source_type='WORKFLOW'`.

## Attachment Strategy

Option A is one canonical archive attachment table for both workflow and Manual Archive attachments.

Benefits:

- simpler long-term detail UI and export/query surface;
- one attachment count/query model;
- one cleanup protection model;
- one lifecycle file-access guard path.

Costs and risks:

- higher migration complexity because workflow archive stores a snapshot while Manual Archive stores attachment rows;
- high risk around file access behavior, especially stale access and `DIMUSNAHKAN` blocking;
- cleanup behavior would need careful protection for both existing sources before any destructive action;
- workflow destruction currently mutates the snapshot and attempts file deletion, which does not map cleanly to immediate row migration;
- more difficult to keep compatibility while old data and new data coexist.

Option B is to keep workflow attachment snapshot and Manual Archive attachment rows separate for now, and unify them only through read services/detail adapters.

Benefits:

- lower migration risk;
- preserves existing file access semantics;
- avoids immediate file reference migration;
- lets canonical parent consolidation proceed independently;
- keeps `DIMUSNAHKAN` blocking source-specific until shared behavior is proven;
- allows cleanup protection to be expanded explicitly before any destructive cleanup phase.

Costs:

- detail UI and services need source-specific attachment adapters;
- aggregate/export must be careful not to count attachment children as archive rows;
- longer transition period with two attachment models.

Recommendation: use a phased bridge. First consolidate the canonical archive parent model. Keep attachment models separate temporarily. Add source-aware attachment adapters for detail display and file access. Consider a canonical attachment table only in a later phase after parent reads/writes, lifecycle behavior, and cleanup protection are stable.

Do not recommend immediate file reference migration or file movement.

## Remaining Phases

### Phase 12L.2 - Canonical Archive Schema Foundation

Create a narrow schema/migration design for the canonical archive parent. Define source discriminator, nullable workflow document reference, archive metadata fields, classification FK/snapshots, retention fields, lifecycle status, audit actor/date fields, indexes, and transitional constraints.

This phase should not change runtime writes, UI pages, lifecycle behavior, file access, cleanup, export, route generation, or old table deletion.

Implementation note as of 2026-05-24: Phase 12L.2 extends existing `arsip.arsip` as the canonical parent foundation instead of creating a new table. The migration draft adds `source_type`, loosens `dokumen_id` nullability for future Manual Archive rows, adds canonical name/classification/snapshot/metadata/audit scaffolding, and keeps Manual Archive rows in `arsip.manual_arsip` until a later controlled migration/backfill phase.

### Phase 12L.3 - Compatibility Read Service And Backfill Plan

Design and implement compatibility read services or database views that can read existing workflow archive rows and Manual Archive rows into one safe archive DTO before old tables are removed.

Backfill planning must report missing or ambiguous fields, including workflow `nama_arsip`, workflow classification id mapping, Manual Archive `nomor_surat`, Manual Archive classification gaps, retention gaps, and duplicate candidates.

### Phase 12L.4 - Workflow Archive Write Alignment

Update the workflow archive creation path to write canonical archive parent rows for `source_type='WORKFLOW'`.

Workflow rows must preserve the document transaction relation, lifecycle status, nominal value, attachment snapshot semantics, audit logging, and file access behavior. Workflow archive must add `nama_arsip` and classification id/snapshot behavior without broadening authorization.

### Phase 12L.5 - Manual Archive Write Alignment

Update Manual Archive create/edit behavior to write the canonical archive parent for `source_type='MANUAL'`.

Manual rows must not require a workflow document reference. Manual create/edit must require `nama_arsip`, `nomor_surat`, mandatory classification, positive integer nominal, and standardized retention metadata at the API boundary. Existing Manual Archive attachment upload and preview/download should remain source-specific during this phase.

### Phase 12L.6 - Unified Archive Query Service

Add a unified archive query service for `AKTIF`, `INAKTIF`, and `USUL_MUSNAH` list pages.

The service should return archive metadata only by default and must not expose file internals, file URLs, storage roots, token internals, SQL details, or secrets. It should use assigned-role server authorization and must not rely on `dms_active_role`.

### Phase 12L.7 - Unified List Pages

Update `AKTIF`, `INAKTIF`, and `USUL_MUSNAH` pages to use the unified query service.

List columns should be archive-domain columns only. Move function, activity, request-chain, workflow approval, and activity-log concepts out of list tables.

### Phase 12L.8 - Unified Detail Page With Source Split

Create a unified detail surface with an archive metadata section for all rows.

Show workflow/process metadata only when `source_type='WORKFLOW'`. Show Manual Archive-only metadata only when `source_type='MANUAL'`. Attachment display should use source-aware adapters and continue to enforce lifecycle and authorization on the server.

### Phase 12L.9 - Lifecycle API Unification

Unify lifecycle APIs so both `WORKFLOW` and `MANUAL` archive rows can move through:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

This phase must preserve server RBAC, same-origin protection for unsafe methods, safe responses, and `DIMUSNAHKAN` file access blocking. Workflow audit logging must remain append-only. Manual Archive lifecycle audit behavior needs an explicit design before implementation.

### Phase 12L.10 - Retention Metadata, Calculation, Display, And Backfill

Keep retention work separated into subphases:

- schema fields and compatibility defaults;
- calculation rules for active/inactive end dates;
- API validation and response shapes;
- UI display and user input;
- controlled backfill for existing rows.

Do not combine retention backfill with lifecycle API unification or cleanup.

### Phase 12L.11 - Aggregate Classification And Metadata-Only Export

Build aggregate classification pages and Excel export after canonical parent reads are stable.

Export must be metadata-only by default. One canonical archive parent row counts as one archive/report regardless of attachment count. Export must not include file contents, file access URLs, token internals, storage roots, storage references, SQL details, or secrets.

### Phase 12L.12 - Transitional Cleanup

Only after compatibility reads, backfill verification, lifecycle behavior, file access behavior, and cleanup protection are stable, run a separate cleanup phase.

Cleanup must be report-first. Do not delete old Manual Archive rows, old attachments, old workflow snapshots, seed data, test files, or local storage files automatically. Any destructive cleanup must require explicit human approval, scoped candidates, dry-run output, and protection for referenced active archive files.

## Backward Compatibility

Existing Manual Archive rows and attachments should remain in place until migration is complete and verified. They should be mapped or migrated to canonical archive rows in a controlled phase. File references must remain valid. Cleanup should only happen after report-first verification and explicit approval. No broad file delete is allowed.

Existing workflow archive rows should preserve document transaction relation, lifecycle status, nominal value, attachment snapshot behavior, and file access semantics. `nama_arsip` can be backfilled from document title as a conservative default. `nomor_surat` should preserve existing values where present. Classification should be mapped from existing text to `master_klasifikasi_arsip` where possible; unmapped rows require report-first remediation.

Compatibility read services/views should exist before deleting, renaming, or deprecating old Manual Archive or workflow archive tables. Deletion of old tables is not part of the near-term implementation path.

## Risk Analysis

High-risk areas:

- schema migration and data backfill for two currently separate archive models;
- duplicate archive rows during dual-write or transition phases;
- list pages mixing old and new sources inconsistently;
- file access and stale access after `DIMUSNAHKAN`;
- cleanup protection gaps for Manual Archive attachments;
- workflow audit log expectations versus Manual Archive audit needs;
- lifecycle status mismatch between canonical parent and source-specific proposal rows;
- retention date calculation and backfill correctness;
- export aggregate correctness and attachment overcounting;
- nominal consistency between workflow Material/Non-Material rules and Manual Archive required nominal rules;
- route tree churn if route files are added or renamed in the same phase as schema work;
- unsafe cleanup of old manual seed/data/files.

Open decisions:

- how existing Manual Archive rows without `nomor_surat` should be remediated;
- whether workflow `nama_arsip` should always derive from document title or require explicit archive-time input;
- whether `manual_arsip_category` remains as source-specific metadata after canonical parent migration;
- whether old workflow free-text classification should be preserved as a supplemental legacy snapshot during backfill;
- what audit table or event model Manual Archive lifecycle actions should use;
- when, if ever, to migrate attachments into one canonical attachment table.

## Recommended Immediate Next Phase

Recommended next implementation phase:

```text
Phase 12L.2 - Canonical Archive Schema Foundation
```

This should be narrow. It should design and implement only the canonical archive parent schema foundation and migration draft, with documentation and focused schema checks. It should not update archive writes, UI, lifecycle APIs, preview/download, cleanup, aggregate/export, route generation, or package files.

This narrow phase reduces risk because the highest-impact decision is the parent data model. Attachment migration, lifecycle behavior, retention calculations, and cleanup are all safer after the parent schema and compatibility mapping are reviewed.

## Validation Scope For This Phase

This planning phase should validate only:

- worktree isolation;
- markdown diff sanity;
- protected diff absence for source, schema, package, generated route, DB, migration, historical Supabase, and env-protected files.

Do not run tests, builds, E2E, route generation, DB migrations, seeds, storage cleanup, package manager commands, or destructive file commands for this phase.
