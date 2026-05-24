# Phase 12L.16 - Existing Manual Archive Remediation And Backfill Plan

Date: 2026-05-24

Status: planned pending human review. This phase is report-first, planning-only, and docs-only. It does not run a live database report, mutate rows, create canonical `MANUAL` rows, backfill existing Manual Archive rows, create routes, change UI, create migrations, modify schema, run route generation, run tests, or perform cleanup.

## Scope And Boundary

Phase 12L.16 defines a human-reviewed remediation and future backfill plan for existing `arsip.manual_arsip` rows that may not yet have linked canonical `arsip.arsip` rows with `source_type='MANUAL'`.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current state:

- Phase 12L.14 creates linked canonical `MANUAL` rows only for new Manual Archive POST creates.
- Phase 12L.15 syncs PATCH edits only for linked `AKTIF` Manual Archive rows.
- Unlinked legacy `AKTIF` rows remain source-only and are not canonicalized on PATCH.
- Existing non-`AKTIF` rows remain locked for metadata edit and are deferred from early canonicalization.
- Manual Archive attachments remain source-specific and are not consolidated.
- Lifecycle unification, unified archive list/detail, aggregate/export, cleanup, and storage changes do not exist yet.

## Target Population

The remediation target population is existing Manual Archive source rows that need review before any future canonical backfill or cleanup. A future report must classify at least these cases:

1. `manual_arsip` rows where the canonical parent link is absent.
2. `manual_arsip` rows where the canonical parent link is present but the referenced canonical row is missing.
3. `manual_arsip` rows where the canonical parent link is present but the referenced canonical row does not use `source_type='MANUAL'`.
4. `manual_arsip` rows missing metadata required by the current canonical helper:
   - `nama`
   - `nomor_surat`
   - `tanggal_diarsipkan`
   - `klasifikasi_id`
   - `klasifikasi_kode_snapshot`
   - `klasifikasi_nama_snapshot`
   - `retensi_aktif`
   - `retensi_inaktif`
   - `masa_aktif_berakhir`
   - `masa_inaktif_berakhir`
   - `archived_by`
   - `created_by`
   - `nominal_realisasi`
   - `status_arsip`
5. `manual_arsip` rows with non-`AKTIF` lifecycle status.
6. `manual_arsip` rows with attachment records that must remain protected from cleanup or destructive handling.

This target definition is a planning boundary only. It does not approve executing a report, selecting live rows, updating metadata, creating canonical rows, or deleting any row or file.

## Report Buckets

A future read-only report should use controlled, non-sensitive bucket labels. Report output must not include file paths, storage roots, tokens, raw SQL, SQL parameters, environment values, secrets, raw attachment metadata, or file contents.

### READY_FOR_CANONICALIZATION

Complete `AKTIF` source row where:

- the canonical parent link is absent;
- all helper-required metadata is complete;
- `nominal_realisasi` is a positive integer-compatible value;
- lifecycle is `AKTIF`;
- the row is eligible for the early AKTIF-only canonical helper.

This bucket does not mean automatic execution is approved. It means a later human-approved backfill helper may process the row.

### NEEDS_HUMAN_METADATA

Source row is missing or has unusable metadata required for canonicalization, including missing or invalid:

- name;
- letter number;
- archive date;
- classification id or snapshots;
- retention labels or calculated retention end dates;
- archive actor;
- creator;
- nominal amount.

Rows in this bucket must be corrected or explicitly approved before canonical creation. Do not invent formal values.

### LINKED_OK

Source row has a canonical parent link, the linked canonical row exists, and the linked row uses `source_type='MANUAL'`.

Future processing should verify this state and avoid creating a duplicate canonical row.

### LINKED_BROKEN

Source row has a canonical parent link, but the linked canonical row is missing.

This bucket requires human review. Do not create a replacement row or clear the source link automatically.

### LINKED_WRONG_SOURCE_TYPE

Source row has a canonical parent link, but the linked row is not `source_type='MANUAL'`.

This bucket requires human review. Do not reinterpret the linked row, update its source type, or create a new canonical row automatically.

### NON_AKTIF_DEFERRED

Source row status is `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN`.

These rows must not be canonicalized by the early AKTIF-only helper. They need a separate lifecycle unification policy before any canonical backfill.

### NOMINAL_INVALID

Source row has `nominal_realisasi` that is null, zero, negative, decimal-policy-invalid, non-numeric, or otherwise incompatible with the current Manual Archive API boundary.

Do not auto-fill nominal values. Human correction or a specific approved policy is required before canonicalization.

### ATTACHMENT_REVIEW_REQUIRED

Source row has one or more attachment records, or the report cannot prove attachment count safely.

This bucket does not block canonical parent creation by itself, because attachments remain source-specific. It requires protection during future cleanup, detail, file-access, and destructive-work phases.

## Backfill Strategy Options

### Option 1 - Manual Correction First, Then Per-Row Canonicalization For Ready Rows Only

Approach:

- generate a read-only report;
- humans correct missing metadata through approved channels;
- process only `READY_FOR_CANONICALIZATION` rows in a later backfill helper;
- skip linked, broken-link, wrong-source-type, and non-`AKTIF` rows unless separate policies are approved.

Evaluation:

- Data quality: strongest, because formal fields are corrected before canonical authority is created.
- User trust: strongest, because operators can review ambiguous archive metadata instead of receiving invented values.
- Auditability: strongest, because remediation decisions can be recorded before mutation.
- Implementation risk: moderate, because the future helper must be transactional and retry-safe but can stay narrow.
- Reporting completeness: good over time, dependent on human correction throughput.
- Cleanup risk: lowest, because cleanup remains separate and reference-protected.
- Operational burden: highest near-term, because humans must review and correct rows.

### Option 2 - Auto-Fill Placeholders For Missing Fields, Then Canonicalize

Approach:

- generate placeholders for missing metadata;
- canonicalize more rows automatically;
- defer human cleanup of placeholder quality.

Evaluation:

- Data quality: weak, because placeholder values can become false formal archive metadata.
- User trust: weak, because archive users may see values that look official but were invented.
- Auditability: weak unless every placeholder rule and row is explicitly approved and traceable.
- Implementation risk: high, because broad placeholder logic can corrupt semantics at scale.
- Reporting completeness: superficially high, but quality is misleading.
- Cleanup risk: high, because placeholder canonical rows may later be mistaken as safe final state.
- Operational burden: lower initially, higher later when placeholders must be corrected.

Important constraint:

- The value `TEST` was previously approved only for explicitly scoped existing workflow archive rows missing `nama_arsip`.
- That approval does not apply to Manual Archive runtime, Manual Archive canonicalization, or Manual Archive backfill.
- Do not use `TEST` or any other placeholder for Manual Archive fields unless a later human decision explicitly approves the exact value, field, and row scope.

### Option 3 - Leave Legacy Rows Source-Only Forever And Canonicalize Only New Rows

Approach:

- keep existing unlinked Manual Archive rows permanently source-only;
- rely on Phase 12L.14+ behavior for new rows;
- build future unified reports with mixed canonical and legacy adapters.

Evaluation:

- Data quality: preserves legacy source state without inventing data, but leaves permanent inconsistency.
- User trust: mixed, because some rows participate in canonical flows and others require legacy handling.
- Auditability: good for avoiding risky mutation, weak for long-term unified archive semantics.
- Implementation risk: low for data mutation, higher for every future read/query/export path.
- Reporting completeness: weaker unless unified readers permanently support legacy source-only rows.
- Cleanup risk: lower for backfill, higher long-term because cleanup must preserve two authority models.
- Operational burden: lower now, higher long-term through permanent compatibility complexity.

## Selected Recommendation

Recommended strategy: Option 1.

Manual correction first, then a later human-approved per-row canonicalization helper for `READY_FOR_CANONICALIZATION` rows only.

Reasons:

- it avoids inventing formal archive metadata;
- it aligns with the current AKTIF-only canonical helper boundary;
- it preserves human trust in letter numbers, classification, retention, actors, dates, and nominal values;
- it keeps broken links and wrong source types out of automated repair;
- it prevents early canonicalization of lifecycle states that do not yet have unified lifecycle policy;
- it keeps cleanup and attachment consolidation out of the backfill phase.

Option 2 should be rejected unless humans explicitly approve exact placeholder values and row scopes in a later decision document. Option 3 is acceptable only if humans decide permanent legacy compatibility is cheaper than remediation, but it should be treated as a long-term product and reporting tradeoff, not as successful canonical migration.

## Future Safe Backfill Procedure

A future backfill phase must remain report-first and must be separately approved before implementation or execution.

Recommended procedure:

1. Generate a read-only report with controlled labels and safe counts only.
2. Human reviewers inspect report buckets and decide which rows may proceed.
3. Humans correct missing metadata through UI, API, or manual database work only if explicitly approved and recorded.
4. For `READY_FOR_CANONICALIZATION` rows:
   - load the source row by id;
   - verify `status_arsip='AKTIF'`;
   - verify the canonical parent link is still absent;
   - validate required metadata with the Manual Archive canonical helper;
   - build canonical insert values with the Manual Archive canonical helper;
   - insert one canonical `arsip.arsip` row with `source_type='MANUAL'`;
   - update the source row with the new canonical parent link;
   - commit canonical insert and source link update in one database transaction.
5. For linked rows:
   - verify the linked canonical row exists;
   - verify `source_type='MANUAL'`;
   - do not recreate or relink.
6. For broken links:
   - report `LINKED_BROKEN`;
   - require human review;
   - do not guess a replacement.
7. For wrong source type:
   - report `LINKED_WRONG_SOURCE_TYPE`;
   - require human review;
   - do not modify source type automatically.
8. For non-`AKTIF` rows:
   - report `NON_AKTIF_DEFERRED`;
   - defer until lifecycle unification policy exists.
9. Do not touch attachments except to count them safely and protect their references.
10. Do not clean up old rows, attachment records, tables, test data, or files in the backfill phase.

## Attachment Protection Policy

Manual Archive attachment records remain authoritative for Manual Archive attachments during remediation and backfill planning.

Rules:

- canonical parent creation must not move, rename, delete, rewrite, or re-upload files;
- canonical rows must not store file paths, storage roots, file URLs, signed URL internals, token values, file contents, or raw attachment metadata;
- future unified detail must remain source-aware when resolving Manual Archive attachments;
- cleanup must protect source attachment references and canonical parent references before any destructive work is considered;
- attachment count can be used as a safe report signal, but it must not be treated as permission to delete or consolidate anything;
- `DIMUSNAHKAN` access blocking remains mandatory, including stale preview/download access.

## Failure And Idempotency Rules

Future backfill must be retry-safe.

Rules:

- if a canonical parent link already exists, verify the linked row before doing anything else;
- if the linked row exists and has `source_type='MANUAL'`, treat the row as already linked and do not create another canonical row;
- if the linked row is missing, report `LINKED_BROKEN` and do not auto-fix;
- if the linked row has the wrong source type, report `LINKED_WRONG_SOURCE_TYPE` and do not auto-fix;
- if helper validation fails, report `NEEDS_HUMAN_METADATA` or `NOMINAL_INVALID` with controlled labels only;
- if canonical insert succeeds but source link update fails, the database transaction must roll back the canonical insert;
- never create duplicate canonical rows for one Manual Archive source row;
- do not trust client role state for authorization in any future backfill UI/API;
- any future mutation route or helper must require authenticated server-side authorization for the approved operational role.

## Future Phase Split

Recommended next phases:

1. `Phase 12L.17 - Read-Only Existing Manual Archive Remediation Report Helper`
   - Add an internal, read-only helper that classifies existing Manual Archive rows into the controlled buckets above.
   - Do not add public API, UI, mutation, backfill, cleanup, route generation, schema changes, or live report execution by default.
2. `Phase 12L.18 - Human-Reviewed Per-Row Canonicalization Helper For READY Rows`
   - Add a DB-aware transactional helper for rows explicitly approved from the report.
   - Process only `READY_FOR_CANONICALIZATION` rows.
   - Do not process broken links, wrong source type, non-`AKTIF` rows, or cleanup.
3. `Phase 12M.1 - Unified Archive Query Service`
   - Add source-aware unified read services only after new and remediated canonical `MANUAL` behavior is stable.
4. `Phase 12M.2 - Unified Archive List Pages`
   - Add UI surfaces backed by the unified query service.
5. `Phase 12M.3 - Unified Detail Page With Source Split`
   - Add source-aware detail and attachment resolution without exposing paths or tokens.
6. `Phase 12N - Lifecycle API Unification`
   - Define whether source or canonical lifecycle state is authoritative and update both sides safely if needed.
7. `Phase 12O - Aggregate And Export`
   - Add metadata-only aggregate/export behavior after unified reads and lifecycle semantics are stable.
8. `Phase 12P - Transitional Cleanup`
   - Only after report-first verification, reference protection, human approval, and stable unified behavior.

Safer split note:

- Do not combine `12L.17` and `12L.18` unless humans explicitly approve the combined risk. Read-only classification and mutation/backfill have different failure modes and should remain separate by default.

## What Is Intentionally Not Changed

This phase does not:

- modify source code;
- modify tests;
- run the live compatibility report;
- run any live database query;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- create canonical `MANUAL` rows;
- backfill existing Manual Archive rows;
- canonicalize existing rows;
- modify attachment upload, preview, or download behavior;
- modify workflow archive routes;
- create public API or UI;
- implement unified archive list/detail UI;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files or lockfiles;
- modify generated routes;
- delete rows, tables, test data, attachment records, or storage files;
- perform cleanup.

## Risks And Open Decisions

Risks:

- legacy rows may remain source-only until humans correct metadata and approve backfill;
- broken canonical links can indicate partial historical failure and must not be repaired by guessing;
- wrong source type links can corrupt archive identity if changed automatically;
- non-`AKTIF` rows need lifecycle policy before canonicalization;
- attachment references must remain protected even when canonical parent rows are created;
- permanent legacy compatibility remains costly if backfill is deferred indefinitely;
- any future backfill helper that is not transaction-safe can create orphan canonical rows or duplicate links.

Open decisions before mutation/backfill:

- exact approval workflow and reviewer role for report buckets;
- whether a dedicated canonical-to-source relationship column is needed before unified detail depends on reverse lookup;
- concurrency strategy for per-row canonicalization;
- whether non-`AKTIF` rows should ever be backfilled before lifecycle unification;
- how to handle rows with broken links or wrong source type after human review;
- whether decimal legacy nominal values should be rejected, rounded, or corrected manually under a documented policy;
- retention and classification correction ownership for legacy rows;
- cleanup eligibility rules after canonicalization is complete.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.17 - Read-Only Existing Manual Archive Remediation Report Helper
```

That phase should implement only a safe internal report helper that classifies existing Manual Archive rows into controlled buckets. It should not run live reports by default, add routes/UI, mutate rows, create canonical rows, backfill data, change schemas, touch attachments, run migrations, or perform cleanup.
