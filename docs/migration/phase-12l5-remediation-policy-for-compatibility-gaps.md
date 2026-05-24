# Phase 12L.5 - Human-Reviewed Remediation Policy For Compatibility Report Gaps

Date: 2026-05-24

Status: planning implemented pending human review. This phase is policy-only and docs-only. It does not execute the Phase 12L.4 reader against live data and does not mutate database rows, storage files, schema, routes, UI, package files, or generated files.

## Scope And Boundary

Phase 12L.5 defines the human-reviewed remediation policy for gaps reported by the Phase 12L.4 internal compatibility reader before any canonical archive write alignment, backfill, migration execution, cleanup, or lifecycle unification.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and must not be used as authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Phase 12L.2 extended `arsip.arsip` as the transitional canonical archive parent foundation. Phase 12L.3 added pure compatibility/report mappers. Phase 12L.4 added an internal server-side read-only DB compatibility reader that returns controlled report rows and summary counts only.

Current write boundaries remain unchanged:

- Workflow archive rows still write to `arsip.arsip`.
- Manual Archive rows still write to `arsip.manual_arsip`.
- Manual Archive attachments remain under the Manual Archive attachment table.
- Attachment models remain separate.
- No canonical Manual Archive parent rows are created.
- No workflow/manual write alignment has been implemented.
- No data backfill has been implemented.
- No unified list/detail UI has been implemented.
- No lifecycle unification has been implemented.
- No cleanup/table deletion/storage deletion has been implemented.

## Remediation Categories

Compatibility report gaps must be classified before any future mutation phase. The categories below are policy labels for human planning. They are not executable backfill instructions.

### AUTO_DERIVE_SAFE

Use only when a value can be derived from an existing stable field without interpretation, ambiguity, or domain judgment.

Examples:

- A workflow `nama_arsip` may derive from a stable workflow document title when the title exists and the organization accepts this as a display-quality default.
- A Manual Archive `nama` may map to canonical `nama_arsip` during future canonical parent creation.
- Existing canonical classification snapshots may be preserved when they already exist.

Even when a value is technically derivable, humans may still require review if data quality, formal naming, or archive policy matters.

### HUMAN_REVIEW_REQUIRED

Use when existing data may be sufficient but requires judgment before it is used for canonical archive state.

Examples:

- Workflow `nama_arsip` derived from document title where the title might be informal or incomplete.
- Workflow legacy free-text classification that may or may not match one `master_klasifikasi_arsip` row.
- Missing `created_by` where `archived_by` exists but the organization has not approved using the same actor.
- Missing archive actor/date where workflow logs might contain related activity but no approved inference rule exists.

### HUMAN_INPUT_REQUIRED

Use when no safe source value exists and a human must enter or correct the value.

Examples:

- Missing workflow `nomor_surat`.
- Missing Manual Archive `nomor_surat`.
- Manual Archive classification gaps when no deterministic master classification selection is approved.
- Manual Archive legacy null or non-positive `nominal_realisasi`.

Do not invent formal values. Placeholder values such as `Tanpa Nomor` or `Tidak Diketahui` require an explicit human-approved policy before they can be used.

### DEFER_UNTIL_SCHEMA_OR_UI

Use when the gap depends on a later schema, UI, calculation, or operational policy phase.

Examples:

- Retention labels or retention end dates that require a retention policy/calculation phase.
- Manual Archive canonical parent row creation that requires a later write-alignment/backfill phase.
- Attachment consolidation or a canonical attachment table strategy.
- Lifecycle unification for Manual Archive rows.

### DO_NOT_BACKFILL_AUTOMATICALLY

Use when automatic backfill would create false authority or corrupt archive semantics.

Examples:

- Do not auto-map workflow free-text classification to `master_klasifikasi_arsip` unless an exact deterministic mapping policy is approved.
- Do not invent letter numbers.
- Do not infer archive actor/date from unrelated workflow logs without an approved rule.
- Do not invent retention dates.
- Do not assign Manual Archive classification from source-specific category unless humans approve a deterministic mapping rule.

### CLEANUP_FORBIDDEN_UNTIL_VERIFIED

Use for any cleanup candidate involving old source rows, attachment rows, snapshots, or files.

Examples:

- Old Manual Archive parent rows.
- Manual Archive attachment rows.
- Workflow attachment snapshots.
- Local storage files.
- Seed/test-like rows that are still referenced or not yet proven unreferenced.

No row or file is safe to delete in this phase. Cleanup candidates only become eligible for a later phase after reference-protected verification and explicit human approval.

## Workflow Archive Remediation Policy

These rules apply to `WORKFLOW` compatibility rows from `arsip.arsip`.

### Missing `nama_arsip`

Policy category: `AUTO_DERIVE_SAFE` only when the joined workflow document title is present, stable, and accepted as the canonical archive name. Otherwise `HUMAN_REVIEW_REQUIRED`.

Rules:

- A future backfill may derive `nama_arsip` from the workflow document title only after humans approve this rule.
- Rows using a title fallback should remain reviewable because document titles may be informal, duplicated, or insufficient for archival naming.
- If no stable title exists, require human review/input.
- Do not derive names from attachment names, file metadata, storage paths, or logs.

### Missing `klasifikasi_id` Or Classification Snapshots

Policy category: `HUMAN_REVIEW_REQUIRED` or `HUMAN_INPUT_REQUIRED`; `DO_NOT_BACKFILL_AUTOMATICALLY` until deterministic mapping is approved.

Rules:

- Do not auto-map legacy free-text `klasifikasi` to `master_klasifikasi_arsip` unless humans approve an exact deterministic mapping policy.
- Legacy free-text classification should be reported as a controlled warning.
- Ambiguous classification requires human review.
- Missing code/name snapshots should be populated from the selected master classification only in a later approved mutation phase.
- Preserve legacy classification text as compatibility evidence until canonical mapping is reviewed.

### Missing `nomor_surat`

Policy category: `HUMAN_INPUT_REQUIRED`.

Rules:

- If the existing workflow archive `nomor_surat` is absent, require human input or an explicit approved placeholder policy.
- Do not invent letter numbers.
- Do not infer letter numbers from titles, attachment names, notes, or free-text metadata.

### Missing Retention Fields

Policy category: `DEFER_UNTIL_SCHEMA_OR_UI` and `DO_NOT_BACKFILL_AUTOMATICALLY`.

Rules:

- Defer remediation until a retention policy/schema/calculation phase exists.
- Do not invent `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, or `masa_inaktif_berakhir`.
- A later retention phase must define calculation inputs, rounding/date rules, manual override rules, and review responsibilities.

### Missing `archived_at` Or `archived_by`

Policy category: `HUMAN_REVIEW_REQUIRED`.

Rules:

- Missing archive actor/date requires human review before mutation.
- Do not infer actor/date from unrelated workflow logs without an explicit approved policy.
- If a future policy allows log-based reconstruction, it must define exact event types, tie-breakers, conflict handling, and audit notes.

### Missing `created_by`

Policy category: `HUMAN_REVIEW_REQUIRED`.

Rules:

- A future backfill may derive `created_by` from `archived_by` only if humans approve that equivalence for workflow archive parent creation.
- Without approval, missing `created_by` remains a review gap.
- Do not infer creator from active role, client-side state, or unrelated records.

### Inconsistent `source_type` Or `dokumen_id`

Policy category: `HUMAN_REVIEW_REQUIRED` and `DO_NOT_BACKFILL_AUTOMATICALLY`.

Rules:

- `source_type='WORKFLOW'` should eventually require a workflow document reference.
- Rows missing workflow document linkage must be reported first.
- Do not auto-fix `source_type` or document references without policy because this can change archive identity and lifecycle ownership.

## Manual Archive Remediation Policy

These rules apply to `MANUAL` compatibility rows from `arsip.manual_arsip`.

### Missing `canonical_archive_id`

Policy category: `DEFER_UNTIL_SCHEMA_OR_UI`.

Rules:

- Future canonical parent creation is required before Manual Archive rows participate as canonical archive parent rows.
- Do not create canonical parent rows in this phase.
- A later write-alignment/backfill phase must define idempotency, duplicate prevention, rollback posture, attachment preservation, and verification reports.

### Missing `nomor_surat`

Policy category: `HUMAN_INPUT_REQUIRED`.

Rules:

- Human input is required for missing Manual Archive `nomor_surat`.
- Do not invent numbers.
- If the organization allows `Tanpa Nomor`, document it as an explicit human decision before any mutation phase. This phase does not approve that placeholder.

### `nama_arsip`

Policy category: `AUTO_DERIVE_SAFE` for direct Manual Archive `nama` to canonical `nama_arsip` mapping, subject to human review for quality.

Rules:

- Existing Manual Archive `nama` can become canonical `nama_arsip` during future canonical parent creation.
- UI label should be `Nama Arsip` for canonical archive-facing surfaces.
- Empty or low-quality names remain human-reviewable.

### Missing `klasifikasi_id` Or Classification Snapshots

Policy category: `HUMAN_INPUT_REQUIRED` or `HUMAN_REVIEW_REQUIRED`; `DO_NOT_BACKFILL_AUTOMATICALLY` until deterministic mapping is approved.

Rules:

- Require human input or deterministic selection from `master_klasifikasi_arsip`.
- Do not auto-map from Manual Archive category unless humans approve an exact mapping rule.
- Missing snapshots should be populated from the selected master classification only in a later approved mutation phase.
- `manual_arsip_category` remains source-specific metadata and is not the archival classification hierarchy.

### Missing Retention Fields

Policy category: `DEFER_UNTIL_SCHEMA_OR_UI` and `DO_NOT_BACKFILL_AUTOMATICALLY`.

Rules:

- Defer retention remediation until the retention phase.
- Do not invent `retensi_aktif`, `retensi_inaktif`, or retention end dates.
- Future retention remediation must define whether values are calculated, manually entered, or selected from a classification-driven rule.

### `nominal_realisasi`

Policy category: `HUMAN_REVIEW_REQUIRED` for legacy gaps.

Rules:

- New Manual Archive create/edit APIs require a positive integer `nominal_realisasi` greater than 0.
- Legacy null, zero, negative, or non-numeric rows require human review and correction before canonical parent creation.
- Do not auto-fill a nominal value.
- One Manual Archive parent row continues to count as one archive/report regardless of attachment count.

### Attachment Preservation

Policy category: `CLEANUP_FORBIDDEN_UNTIL_VERIFIED`.

Rules:

- Manual Archive attachment rows must remain linked to their Manual Archive parent until the canonical attachment strategy is decided.
- Do not consolidate, delete, move, or rewrite attachment records in this phase.
- Do not delete local storage files.
- No file cleanup is allowed until the protection model includes Manual Archive attachments and current lifecycle state, including `DIMUSNAHKAN` blocking.

## Cleanup Prohibition

This phase prohibits cleanup and destructive changes.

Rules:

- No old `manual_arsip` rows are deleted.
- No Manual Archive attachment rows are deleted.
- No workflow attachment snapshots are cleared.
- No local storage files are deleted.
- No old tables are dropped or truncated.
- Cleanup must be report-first, candidate-specific, human-approved, and reference-protected.
- Use `cleanup candidate` wording only. Do not call any row or file safe to delete until a later reference-protected cleanup phase verifies it.
- Destructive cleanup is forbidden until canonical parent migration, attachment preservation, file access, and `DIMUSNAHKAN` handling are stable.

## Report Execution Review Process

The Phase 12L.4 compatibility reader should be used later only through an internal/read-only process approved by humans.

Recommended review process:

1. Run the compatibility report internally and read-only after explicit approval.
2. Inspect or export only safe identifiers, source type, lifecycle status, controlled missing-field labels, controlled warning labels, counts, and controlled archive labels.
3. Review counts by source type and lifecycle status.
4. Bucket each gap into one remediation category from this document.
5. Decide per-bucket policy before writing any mutation code.
6. Record any approved placeholder, deterministic mapping, actor/date reconstruction, or retention rule before implementation.
7. Do not run mutation/backfill until a separate approved backfill or write-alignment phase exists.

Report handling restrictions:

- Do not expose storage paths, file URLs, file contents, storage roots, token internals, SQL details, SQL params, env values, DB URLs, session values, password data, or secrets.
- Do not add a route, UI, public API, scheduled task, or CLI wrapper in this phase.
- Do not import or call the live compatibility report reader in this phase.

## What Is Intentionally Not Changed

This phase does not:

- add API routes;
- add UI;
- run the live DB compatibility reader;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- backfill database rows;
- create canonical Manual Archive parent rows;
- update workflow archive writes;
- update Manual Archive create/edit writes;
- implement unified list pages;
- modify Arsip Aktif/Inaktif/Usul Musnah pages;
- implement lifecycle APIs;
- implement retention calculations;
- implement aggregate/export behavior;
- consolidate attachment tables;
- delete old tables;
- delete Manual Archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior;
- modify package files or lockfiles;
- modify generated route files.

## Risks And Open Decisions

Open decisions before any mutation/backfill:

- Whether workflow `nama_arsip` derived from document title is acceptable by default or only after row-level review.
- Exact deterministic mapping policy, if any, from workflow legacy free-text classification to `master_klasifikasi_arsip`.
- Whether Manual Archive category can ever map to archival classification, and under what exact rule.
- Whether placeholders such as `Tanpa Nomor` are allowed, and which rows they may apply to.
- How missing archive actor/date should be reconstructed, if at all.
- Whether workflow `created_by` may derive from `archived_by`.
- Retention policy, calculation rules, and review owner.
- Canonical Manual Archive parent creation idempotency and duplicate prevention.
- Attachment strategy during and after canonical parent creation.
- Cleanup verification process and reference-protection scope.

## Next Phase Recommendation

Do not move directly into write alignment if the open decisions above remain unresolved after human review. The safer immediate next phase is a tiny decision phase:

```text
Phase 12L.6 - Manual/Workflow Canonical Write Alignment Split Plan
```

That phase should convert this policy into approved per-bucket decisions and split implementation into isolated write-alignment phases. If humans approve all required decisions during Phase 12L.5 review, Phase 12L.6 may instead proceed as workflow archive write alignment planning or implementation, with Manual Archive canonical parent creation kept separate unless explicitly approved.

Cross-reference as of Phase 12L.16: existing Manual Archive source rows now have a dedicated report-first remediation/backfill plan in `docs/migration/phase-12l16-existing-manual-archive-remediation-backfill-plan.md`. That plan keeps live report execution, mutation, canonical row creation, attachment changes, lifecycle unification, and cleanup out of scope.
