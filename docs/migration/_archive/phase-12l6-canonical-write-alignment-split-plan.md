# Phase 12L.6 - Manual/Workflow Canonical Write Alignment Split Plan

Date: 2026-05-24

Status: planning implemented pending human review. This phase is docs-only and decision/planning-only. It does not implement canonical write alignment, run the live compatibility reader, mutate rows, create migrations, modify schema, add routes, add UI, modify helpers, run route generation, run broad tests/builds, or perform cleanup.

## Scope And Boundary

Phase 12L.6 converts the Phase 12L.5 remediation policy into a concrete split plan for future canonical archive write alignment.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and must not be used as authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current write boundaries remain unchanged:

- Workflow archive rows still write to `arsip.arsip`.
- Manual Archive rows still write to `arsip.manual_arsip`.
- Manual Archive attachments still write to `arsip.manual_arsip_attachment`.
- Attachment models remain separate.
- No canonical Manual Archive parent rows are created.
- No workflow/manual dual-write is introduced.
- No backfill, cleanup, table deletion, storage deletion, lifecycle unification, aggregate/export, preview/download change, or upload change is included.

## Selected Order Recommendation

Recommended order:

```text
1. Workflow archive canonical write alignment.
2. Retention and Manual Archive metadata design.
3. Manual Archive canonical write alignment.
4. Report-first existing-data backfill/canonical parent creation.
```

This selects Option 1: workflow archive write alignment first.

Workflow-first does not require resolving Manual Archive metadata gaps because workflow rows already write to `arsip.arsip`, already have a workflow document relationship, already collect `nomor_surat`, already collect retention labels and retention end dates, already preserve `status_arsip`, already preserve workflow attachment snapshots, and already participates in the existing lifecycle behavior. The remaining workflow gaps are bounded to canonical metadata population on the existing parent row.

Manual Archive canonical write alignment must not happen yet. Manual Archive still lacks required `nomor_surat`, mandatory canonical classification, retention fields/policy, and an approved `tanggal_diarsipkan` policy for canonical rows.

### Option 1 - Workflow Archive Write Alignment First

Risk: lowest of the three options. It updates the existing workflow archive parent path instead of creating a second parent model or forcing Manual Archive into incomplete canonical rows.

Dependencies:

- Resolve workflow-only `nama_arsip` policy.
- Accept and validate classification id from the workflow archive form/API.
- Populate classification snapshots from `master_klasifikasi_arsip`.
- Decide whether `created_by` equals `archived_by`.

Data completeness:

- Stronger than Manual Archive today because workflow already has `dokumen_id`, `nomor_surat`, retention labels, retention dates, archive actor/date, lifecycle status, nominal value, and attachment snapshot.
- Missing canonical fields are mostly additive fields on the same row.

UI impact:

- Small and workflow-scoped.
- The current workflow archive UI already has classification id in client state but posts only classification name. Future alignment should post `klasifikasi_id`; no unified list/detail UI is required.

Need for schema changes:

- No schema change is expected if Phase 12L.2 migration is already accepted/applied.
- Future stricter constraints remain deferred until report-first backfill verifies existing rows.

Relation to existing lifecycle behavior:

- Preserves existing workflow lifecycle behavior on `arsip.arsip`.
- Does not add Manual Archive lifecycle unification.

Relation to attachment behavior:

- Preserves `lampiran_snapshot`.
- Does not consolidate attachment tables or change file access.

Testing scope:

- Targeted API/unit coverage for workflow archive creation payload validation and inserted canonical fields.
- No broad E2E/build by default unless the future phase explicitly requests it.

### Option 2 - Manual Archive Write Alignment First

Risk: highest. It would create canonical `MANUAL` rows before the source has complete canonical metadata.

Dependencies:

- Add and require `nomor_surat`.
- Require canonical `klasifikasi_id`.
- Design retention labels, retention end dates, and calculation/input policy.
- Decide `tanggal_diarsipkan` semantics.
- Decide idempotency and duplicate prevention between `manual_arsip` and canonical `arsip.arsip`.
- Decide whether `manual_arsip` remains source/staging or is eventually replaced.

Data completeness:

- Incomplete today. `manual_arsip.nama` can map to `nama_arsip`, `created_by` can be a candidate for `diarsipkan_oleh`, and positive nominal is already required at API/UI boundary for new rows, but `nomor_surat` and retention are not present.

UI impact:

- Material. The create/edit form and API would need new required fields and wording changes before canonical rows can be created.

Need for schema changes:

- Likely yes for Manual Archive source data, unless a future phase stores all missing values only on canonical `arsip.arsip`. That approach would still need a source-to-canonical linkage/idempotency design.

Relation to existing lifecycle behavior:

- Manual Archive lifecycle APIs are not implemented yet. Creating canonical rows now could create lifecycle ownership ambiguity.

Relation to attachment behavior:

- Manual Archive attachments remain source-specific. A canonical parent would need a clear lookup strategy back to `manual_arsip_attachment`.

Testing scope:

- Larger than workflow-first because it touches create/edit validation, source/canonical identity, attachment preservation, and possibly UI forms.

Recommendation: do not choose this option now.

### Option 3 - Shared Canonical Archive Write Helper First

Risk: medium. A helper can reduce duplicate validation later, but a generic insert abstraction before source rules are stable can hide source-specific constraints.

Dependencies:

- Needs both workflow and Manual Archive canonical field policies to avoid an over-general helper.
- Manual Archive policies are not ready.

Data completeness:

- Workflow data is close to complete.
- Manual data is incomplete.

UI impact:

- None if helper-only, but it would not by itself align any write path.

Need for schema changes:

- No immediate schema change if helper-only.

Relation to existing lifecycle behavior:

- Helper-only does not change lifecycle behavior.
- A too-generic helper could accidentally make `WORKFLOW` and `MANUAL` relationship rules easier to misuse.

Relation to attachment behavior:

- Helper should not handle attachments in this stage because attachment models remain separate.

Testing scope:

- Focused unit tests for helper validation.
- Still needs later source-specific integration tests.

Recommendation: do not build a generic shared insert helper before workflow alignment. Prefer source-specific mapping/input builders when a source is aligned.

## Workflow Write Alignment Plan

Future workflow alignment should update only the workflow archive creation path. It must not change Manual Archive writes, list/detail UI, lifecycle APIs, preview/download behavior, upload behavior, cleanup, backfill, migrations, route generation, package files, or attachment model.

Future workflow canonical write fields:

- `source_type`: write explicitly as `WORKFLOW`, even though the database default is already `WORKFLOW`.
- `dokumen_id`: required and must remain the workflow document transaction id.
- `nama_arsip`: required for canonical rows. Candidate policy is to derive from the workflow document title at archive time only if humans approve document title as the canonical archive name. Otherwise add explicit archive-time input in a later scoped phase.
- `nomor_surat`: preserve existing required workflow archive form/API field.
- `klasifikasi_id`: required for canonical rows. The workflow archive UI already selects a master classification node, but the current POST payload sends only classification name. Future alignment should submit `klasifikasi_id`.
- `klasifikasi_kode_snapshot`: populate from `master_klasifikasi_arsip.kode` at archive time.
- `klasifikasi_nama_snapshot`: populate from `master_klasifikasi_arsip.nama` at archive time.
- legacy free-text `klasifikasi`: preserve during transition as compatibility/display text, preferably set from selected master classification name. Do not treat legacy free text as canonical classification after alignment.
- `retensi_aktif`: preserve existing required field.
- `retensi_inaktif`: preserve existing required field.
- `masa_aktif_berakhir`: preserve existing required field.
- `masa_inaktif_berakhir`: preserve existing required field.
- `archived_at`: continue as transitional `tanggal_diarsipkan`; rely on server timestamp unless a future policy explicitly changes archive date semantics.
- `archived_by`: continue as transitional `diarsipkan_oleh` from the authenticated server session user.
- `created_by`: recommended future policy is to set equal to `archived_by` for newly created workflow archive parent rows, pending human approval.
- `nominal_realisasi`: preserve from the workflow document/archive domain. Keep Material/Non-Material rules unchanged.
- `status_arsip`: preserve current `AKTIF` creation behavior and existing lifecycle values.
- `lampiran_snapshot`: preserve current behavior unchanged.
- `metadata`: supplemental only. Do not store core fields, file access data, tokens, paths, storage roots, or canonical-only required values solely in metadata.

Future workflow alignment blockers:

- Decide whether `nama_arsip` can always derive from document title or must be explicit archive-time input.
- Confirm workflow archive API/UI should post `klasifikasi_id` and server should derive name/code snapshots from `master_klasifikasi_arsip`.
- Confirm current retention fields remain required and acceptable as canonical retention metadata for workflow rows.
- Confirm `created_by` may equal `archived_by` for new workflow archive parent rows.
- Decide how to report existing workflow rows that still have only legacy free-text `klasifikasi`.

## Manual Archive Write Alignment Plan

Future Manual Archive canonical write alignment must remain separate from workflow alignment. It must not be implemented until missing canonical metadata and policies are resolved.

Future Manual Archive canonical write fields:

- `source_type`: `MANUAL`.
- `dokumen_id`: must be null.
- `nama_arsip`: map from current Manual Archive `nama`; UI/API labels should move toward `Nama Arsip`.
- `nomor_surat`: must be added and required before canonical `MANUAL` rows are created. No placeholder such as `Tanpa Nomor` is approved by this phase.
- `klasifikasi_id`: must be mandatory and selected from `master_klasifikasi_arsip`.
- `klasifikasi_kode_snapshot`: populate from `master_klasifikasi_arsip.kode`.
- `klasifikasi_nama_snapshot`: populate from `master_klasifikasi_arsip.nama`.
- `retensi_aktif`: missing today and must be designed before full canonical `MANUAL` rows.
- `retensi_inaktif`: missing today and must be designed before full canonical `MANUAL` rows.
- `masa_aktif_berakhir`: missing today and must be designed before full canonical `MANUAL` rows.
- `masa_inaktif_berakhir`: missing today and must be designed before full canonical `MANUAL` rows.
- `tanggal_diarsipkan`: policy unresolved. Candidates are current `manual_arsip.tanggal`, `created_at`, or a new explicit archive date. This phase does not choose one.
- `diarsipkan_oleh`: candidate is `created_by`, unless a future explicit archive actor policy is added.
- `created_by`: preserve existing server-authenticated creator.
- `nominal_realisasi`: required positive integer greater than 0 at API/UI boundary.
- `status_arsip`: preserve current lifecycle value.
- `manual_arsip_category`: remains source-specific metadata and must not be treated as the archival classification hierarchy.
- Manual attachments: remain source-specific under `manual_arsip_attachment` for now.
- Manual preview/download: remains source-specific and must continue to revalidate role, parent/attachment ownership, lifecycle status, allowed content type, and local storage containment.

Future Manual Archive alignment blockers:

- `nomor_surat` schema/API/UI decision.
- Required `klasifikasi_id` API/UI decision and migration path for existing optional classification rows.
- Retention schema/API/UI and calculation/input policy.
- `tanggal_diarsipkan` policy.
- Canonical parent creation idempotency and duplicate prevention.
- Attachment preservation and lookup strategy from canonical parent to current Manual Archive attachment rows.
- Decision whether `manual_arsip` remains a staging/source table during transition or is eventually replaced by canonical `arsip.arsip`.
- Report-first remediation for legacy null/non-positive nominal rows.

## Shared Helper Decision

Do not build a broad shared `insertCanonicalArchiveParent(...)` helper before workflow alignment.

Recommended future helper shape:

```text
createCanonicalArchiveParentInputForWorkflow(...)
createCanonicalArchiveParentInputForManual(...)
```

Source-specific input builders are safer than a single generic insert helper at this stage because they:

- keep `WORKFLOW` and `MANUAL` relationship rules explicit;
- avoid accidental insertion of `MANUAL` rows with workflow-only fields or `WORKFLOW` rows without `dokumen_id`;
- make tests easier to scope per source;
- avoid hiding Manual Archive blockers behind optional fields;
- leave attachment behavior source-specific.

A lower-level insert helper may be considered later only after both source-specific input builders and requiredness rules are stable.

The next phase should build workflow-specific alignment only, not shared helper only and not shared helper plus Manual Archive alignment.

## Retention Ordering Decision

Retention implementation is not part of this phase.

Ordering decision:

```text
Workflow alignment may proceed first using existing workflow retention fields.
Manual Archive canonical write alignment must wait until retention design exists.
Retention metadata design should happen after workflow alignment and before Manual Archive canonical write alignment.
```

Reason:

- Workflow already collects `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, and `masa_inaktif_berakhir`.
- Manual Archive does not have equivalent retention fields or a final policy.
- Creating canonical `MANUAL` rows without retention would either weaken canonical requiredness or create false/incomplete archive authority.

Recommended future retention phase:

```text
Phase 12L.8 - Retention Metadata Design For Manual Archive Canonical Write Alignment
```

The exact number may shift if Phase 12L.7 is used for workflow alignment, but retention must remain its own separate phase before Manual Archive canonical write alignment.

## Backfill And Existing Data Policy

Future existing-data work remains report-first and human-reviewed.

Workflow existing rows:

- Existing `arsip.arsip` workflow rows need report-first backfill for `nama_arsip`, `klasifikasi_id`, classification snapshots, and `created_by`.
- Existing rows with legacy free-text classification must be reported and mapped only under an approved deterministic or human-reviewed policy.
- Existing missing `nomor_surat`, retention, archive actor/date, or document relationship gaps require human review/input.

Manual Archive existing rows:

- Existing `manual_arsip` rows need report-first canonical parent creation planning.
- Existing rows missing `nomor_surat`, classification, retention, positive nominal, or date/actor policy must not be auto-created as canonical `MANUAL` rows.
- Attachment rows must remain linked to their current Manual Archive parent until a canonical attachment/link strategy is approved.

Global existing-data rules:

- No automatic mutation.
- No automatic canonical parent creation.
- No dual-write for existing rows.
- No row deletion.
- No table deletion.
- No file move or rename.
- No storage cleanup.
- No old Manual Archive test data deletion.
- Treat old rows/files/tables only as future cleanup candidates after reference-protected verification and explicit human approval.

## Immediate Next Phase Recommendation

Recommended next phase:

```text
Phase 12L.7 - Workflow Archive Canonical Write Alignment Plan/Implementation
```

This is the safest next phase because workflow alignment can be isolated from Manual Archive blockers. It should align only the workflow archive creation path to write canonical fields on the existing `arsip.arsip` row, with targeted tests and no Manual Archive canonical parent creation.

Phase 12L.7 must explicitly decide or confirm these workflow-only items before implementation:

- `nama_arsip` derived from document title versus explicit archive-time input;
- posting and validating `klasifikasi_id`;
- deriving classification code/name snapshots server-side;
- setting `created_by` from the same authenticated server actor as `archived_by`.

Manual Archive canonical write alignment remains blocked until `nomor_surat`, required classification, retention policy, and `tanggal_diarsipkan` policy are resolved.

Implementation note as of 2026-05-24: Phase 12L.7 implements workflow-only canonical write alignment. New workflow archive writes now submit and validate `klasifikasi_id`, derive classification snapshots server-side, derive `nama_arsip` from workflow document metadata, write explicit `source_type='WORKFLOW'`, set `created_by` from `dokumen_transaksi.created_by`, and keep `archived_by` as the authenticated `KEPALA_SUB_BAGIAN_UMUM` session user. Manual Archive write alignment, existing-row backfill, lifecycle unification, retention redesign, preview/download changes, upload changes, migrations, and cleanup remain out of scope.

## What Is Intentionally Not Changed

This phase does not:

- update workflow archive runtime writes;
- update Manual Archive create/edit runtime writes;
- create canonical `MANUAL` rows;
- dual-write;
- backfill existing rows;
- run the DB compatibility reader against live data;
- add routes;
- add UI;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- implement lifecycle APIs;
- implement retention calculations;
- implement aggregate/export;
- consolidate attachment tables;
- delete old tables;
- delete Manual Archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior;
- modify source code, tests, generated routes, package files, `db/`, `drizzle/`, or `supabase/`.

## Risks And Open Decisions

Workflow open decisions:

- Whether workflow `nama_arsip` can derive from document title for new writes.
- Whether the workflow archive UI/API must add explicit `nama_arsip` instead.
- Whether `created_by` may equal `archived_by` for workflow archive parent creation.
- How to handle existing rows that still have legacy free-text classification.

Manual Archive open decisions:

- `nomor_surat` schema/API/UI design.
- Mandatory classification UI/API and remediation path for existing optional/null classification rows.
- Retention fields, calculation/input rules, and review owner.
- `tanggal_diarsipkan` policy.
- Canonical parent creation idempotency and duplicate prevention.
- Attachment preservation and canonical lookup strategy.
- Whether `manual_arsip` remains a source/staging table during transition or is eventually replaced.

Cross-source open decisions:

- When stricter database constraints for `WORKFLOW`/`MANUAL` relationships become safe.
- When unified list/detail reads should replace workflow-only lifecycle list APIs.
- What future cleanup candidate verification must prove before any destructive action is proposed.
