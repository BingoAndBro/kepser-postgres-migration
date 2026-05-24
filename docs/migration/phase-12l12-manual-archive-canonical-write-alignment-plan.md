# Phase 12L.12 - Manual Archive Canonical MANUAL Write Alignment Plan

Date: 2026-05-24

Status: planned pending human review. This phase is planning-only and docs-only. It does not implement canonical `MANUAL` writes, mutate rows, create routes, change UI, create migrations, modify schema, run route generation, run tests, execute DB reports, or perform cleanup.

## Scope And Boundary

Phase 12L.12 defines the future write-alignment plan for creating canonical `arsip.arsip` rows with `source_type='MANUAL'` from Manual Archive source rows.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current write boundaries remain unchanged:

- workflow archive rows write canonical `WORKFLOW` fields to `arsip.arsip`;
- Manual Archive parent rows write to `arsip.manual_arsip`;
- Manual Archive attachment rows write to the Manual Archive attachment table;
- no canonical `MANUAL` rows are created;
- no dual-write is introduced;
- no existing rows are backfilled;
- no lifecycle unification, unified list/detail UI, aggregate/export, attachment consolidation, cleanup, or storage change is implemented.

Transitional authority guard:

- canonical `MANUAL` rows must be treated as transitional projection records during early alignment phases;
- `manual_arsip` remains the operational source authority until lifecycle/query unification is explicitly implemented;
- early retry and sync logic must not assume the canonical row has replaced the source row.

## Current State Summary

Phase 12L.9 added nullable source fields to `manual_arsip` for future canonical alignment, including letter number, official archive date, retention labels, calculated retention end dates, classification code snapshot, archive actor, and canonical parent link.

Phase 12L.10 updated Manual Archive create/edit APIs to require the future-canonical metadata for new writes and to calculate retention dates server-side. It still leaves the canonical parent link null.

Phase 12L.11 updated the create UI to submit the required Phase 12L.10 metadata. Attachment upload still happens after the parent row exists.

Manual Archive currently supports parent-without-attachment. This is an important design constraint: canonical parent creation before attachment upload can be acceptable only if the future behavior documents that attachments remain optional and that attachment upload failure does not invalidate the parent archive record.

## Timing Option Analysis

### Option 1 - Create Canonical Row Immediately During Manual Archive POST Create

Meaning: the create API builds and inserts both the source `manual_arsip` row and the canonical `arsip.arsip` `MANUAL` row as part of the initial Manual Archive create behavior.

Idempotency:

- strong if implemented in one transaction with `manual_arsip.canonical_arsip_id` set before commit;
- weak if implemented as two unrelated operations because retries can create duplicate canonical rows.

Failure and rollback behavior:

- safest only if source insert, canonical insert, and source link update are one DB transaction;
- if canonical insert fails, the source parent should roll back too;
- attachment upload is still outside this transaction and must not be made DB-atomic with filesystem writes.

Source/canonical consistency:

- strong for new rows because the canonical projection is created from the same validated source input;
- existing rows remain separate and require later report-first handling.

User experience:

- lowest UX change because users keep one create action;
- a failed canonical insert would fail the create request even if the source row itself would have been valid.

Attachment timing:

- canonical parent may exist before attachments are uploaded;
- acceptable because current Manual Archive already allows parent-without-attachment;
- partial attachment upload failure must not roll back source plus canonical parent creation.

Compatibility with existing upload-after-parent flow:

- compatible if attachment upload remains a separate endpoint after parent creation;
- requires clear UI/API messaging that attachment failure is a separate recoverable step.

Lifecycle correctness:

- initially safe only if `manual_arsip.status_arsip='AKTIF'` is copied to the canonical row and `manual_arsip` remains authoritative;
- future lifecycle operations must prevent source/canonical drift before canonical lifecycle authority is selected.

Implementation risk:

- moderate;
- touches the create path and transaction boundaries but avoids new user actions.

### Option 2 - Create Source Row First, Then Create Canonical Row In The Same Transaction

Meaning: the create helper inserts `manual_arsip`, uses the inserted source row as the source of truth, inserts canonical `arsip.arsip`, updates `manual_arsip.canonical_arsip_id`, and commits all DB changes together.

Idempotency:

- strongest for new creates because the source row is linked to exactly one canonical row before commit;
- the non-null partial unique index on `manual_arsip.canonical_arsip_id` prevents one canonical row from being linked by multiple source rows;
- retry safety still requires later canonicalization helpers to check existing links before inserting.

Failure and rollback behavior:

- strongest among create-time options;
- if canonical insert or link update fails, rollback removes both the source row and the canonical row;
- no orphan source row is created by a canonical-write failure.

Source/canonical consistency:

- strongest because canonical mapping copies the actual inserted source row, not a parallel reconstruction from request data;
- the source row remains the operational authority during the transition.

User experience:

- same as existing create flow unless canonical insertion fails;
- failures are surfaced as create failures, which is acceptable because the canonical projection becomes part of the create contract in the implementation phase.

Attachment timing:

- attachment upload still happens after the parent exists;
- canonical parent can exist with zero attachments, which remains compatible with current optional attachment rules;
- partial upload failure is recoverable and should not roll back the committed source plus canonical parent.

Compatibility with existing upload-after-parent flow:

- best fit with current UI because parent creation remains the first step and upload remains the second step;
- no separate finalize button or route is required.

Lifecycle correctness:

- initially create only `AKTIF` canonical rows;
- treat `manual_arsip.status_arsip` as authoritative until unified lifecycle APIs exist;
- later lifecycle unification must update both source and canonical rows in one transaction or declare canonical authority explicitly.

Implementation risk:

- moderate but controlled;
- requires careful transaction code, mapping tests, retry tests, and safe unique-link handling;
- lower UX/API risk than adding a separate action.

### Option 3 - Create Source Row First, Then Use Separate Explicit Canonicalize/Finalize Action

Meaning: Manual Archive create continues to create only the source row. A later explicit server action creates the canonical `MANUAL` row and links it.

Idempotency:

- potentially strong if the action is written as retry-safe and checks `canonical_arsip_id` before inserting;
- repeated attempts must return or reuse the existing linked canonical row instead of creating a duplicate.

Failure and rollback behavior:

- canonical failure does not invalidate the already-created source row;
- safer for partial rollout but creates an intermediate state where new source rows may remain uncanonicalized.

Source/canonical consistency:

- weaker operationally because source and canonical creation can be separated by time, user action, or failure;
- requires dashboards/reports to identify rows awaiting canonicalization.

User experience:

- highest UX/API complexity;
- needs a new explicit action, state messaging, retry behavior, and probably an operator-facing queue or status indicator.

Attachment timing:

- can be delayed until after attachments if humans want a "finalize after upload" model;
- this is more controlled but conflicts with the current optional attachment model and adds workflow burden.

Compatibility with existing upload-after-parent flow:

- compatible only if the UI is changed to expose or automate finalization;
- otherwise users can create rows that never become canonical.

Lifecycle correctness:

- safer for controlled transition because lifecycle can remain entirely source-only until finalization;
- risk shifts to incomplete canonical coverage and stale pending rows.

Implementation risk:

- highest near-term product risk because it adds new API/UX states;
- lower data mutation blast radius if rolled out internally, but operationally more complex.

## Selected Recommendation

Recommended future implementation: Option 2.

Create the source `manual_arsip` row first, then create the canonical `arsip.arsip` row with `source_type='MANUAL'`, then update `manual_arsip.canonical_arsip_id`, all in one database transaction during Manual Archive POST create.

Reason:

- it preserves the current one-step parent create UX;
- it gives the safest source/canonical consistency for new rows;
- it uses the inserted `manual_arsip` row as the mapping authority;
- it is retry-safe when paired with `canonical_arsip_id` checks and the partial unique index;
- it avoids a new finalize action and the operational risk of unfinalized rows;
- it keeps attachment upload outside the DB transaction, matching current parent-first upload behavior.

Important limitation:

- attachment upload remains a later and separate action. A committed source plus canonical parent can exist with zero attachments or with later partial upload failure. This is acceptable because attachments are optional today and filesystem plus DB atomicity is intentionally out of scope.

Option 3 should be kept as a fallback only if humans decide canonicalization must happen after attachment review or formal user confirmation. That would require a separate phase for UX/API state design.

## Canonical MANUAL Field Mapping

Future canonical `arsip.arsip` `MANUAL` rows should copy fields from the inserted `manual_arsip` source row as follows:

| Canonical `arsip.arsip` field | Manual Archive source |
| --- | --- |
| `source_type` | constant `MANUAL` |
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
| `archived_at` | `manual_arsip.tanggal_diarsipkan` using the date-to-timestamp convention below |
| `archived_by` | `manual_arsip.archived_by` |
| `created_by` | `manual_arsip.created_by` |
| `nominal_realisasi` | `manual_arsip.nominal_realisasi` |
| `status_arsip` | `manual_arsip.status_arsip` |
| `metadata` | safe supplemental metadata only |

Date-to-timestamp convention:

- `manual_arsip.tanggal_diarsipkan` remains date-only business input;
- until a later schema adds a true date-only canonical archive date, copy it to canonical `archived_at` as a timestamp at `00:00:00` for that same date;
- API/read DTOs should continue treating this value as a date-only archive date for retention and display;
- do not substitute the current server timestamp for this mapping.

Metadata policy:

- `metadata` may include safe transitional linkage metadata such as the source Manual Archive id if humans approve it;
- if stored, that source id is transitional linkage metadata only and must not become long-term relational authority;
- prefer a future dedicated `source_manual_arsip_id` column if long-term direct source lookup from canonical rows becomes required.

Do not copy or store in canonical metadata:

- attachment storage path fields;
- physical storage paths;
- storage roots;
- file URLs;
- preview/download URLs;
- token values or token internals;
- file contents;
- SQL details, SQL params, env values, DB URLs, session values, password data, or secrets.

## Idempotency Policy

Future canonical write alignment must be retry-safe. Repeated canonicalization attempts must not create duplicate `MANUAL` canonical rows.

Rules:

- if `manual_arsip.canonical_arsip_id` is non-null, do not insert a second canonical row;
- if the linked canonical row exists and has `source_type='MANUAL'`, return or reuse that canonical id;
- if the linked canonical row is missing or has the wrong source type, fail safely and require human review instead of guessing;
- if canonical creation succeeds, update `manual_arsip.canonical_arsip_id` in the same transaction before commit;
- the existing non-null partial unique index on `manual_arsip.canonical_arsip_id` helps prevent one canonical row from being linked from multiple source rows;
- a future dedicated `source_manual_arsip_id` unique column on `arsip.arsip` is recommended if canonical-to-source lookup becomes a core runtime path;
- do not add that schema in this phase.

Recommended future helper posture:

- create a source-specific Manual Archive canonicalization helper rather than a broad generic insert helper;
- the helper should load and validate the source row, check the existing canonical link, insert the canonical row, update the source link, and return the canonical id;
- source-specific tests should cover duplicate retry, existing-link reuse, wrong-link failure, missing required source metadata, and rollback on insert/update error.

## Transaction And Failure Behavior

Desired future transaction for create-time alignment:

1. Validate the request through the existing Manual Archive API schema.
2. Validate `KEPALA_SUB_BAGIAN_UMUM` server-side role from the authenticated session.
3. Insert the `manual_arsip` source row with `status_arsip='AKTIF'`, complete required metadata, server-derived classification snapshots, server-calculated retention dates, `created_by`, and `archived_by`.
4. Insert canonical `arsip.arsip` with `source_type='MANUAL'` from the inserted source row.
5. Update `manual_arsip.canonical_arsip_id` to the canonical row id.
6. Commit source insert, canonical insert, and source link update together.
7. If any insert or update fails, rollback all three DB changes.

Desired future transaction for explicit retry/backfill canonicalization of one existing source row:

1. Load the source row with a row-level concurrency strategy appropriate for PostgreSQL.
2. Validate the source row is `AKTIF` for early alignment unless a later phase explicitly supports other lifecycle states.
3. Validate required source fields are complete.
4. If `canonical_arsip_id` is already linked, verify and reuse it.
5. Insert canonical row and update the source link in one transaction.
6. Commit together.
7. On failure, rollback both canonical insert and source link update.

Attachment transaction guard:

- attachment upload intentionally remains outside the source plus canonical DB transaction;
- do not attempt filesystem plus DB atomicity for attachment upload;
- if attachment upload partially fails after parent creation, keep the committed source plus canonical parent and let the user retry attachment upload while the source row remains `AKTIF`;
- any uploaded file whose DB metadata insert fails must follow the existing upload error-handling policy or a later explicit orphan-file cleanup policy, but not as part of canonical write alignment.

Failure response policy:

- use safe generic failure responses;
- do not expose storage internals, SQL details, env values, DB URLs, tokens, path values, or raw file metadata;
- log only safe structured error summaries.

## Attachment Strategy

Manual Archive attachments remain source-specific during canonical `MANUAL` write alignment.

Rules:

- the Manual Archive attachment table remains authoritative for attachment metadata and file reference state;
- existing Manual Archive upload, preview, and download APIs remain the only file-access path for Manual Archive attachments;
- canonical `arsip.arsip` `MANUAL` rows must not store attachment path fields, file URLs, storage roots, tokens, or file contents;
- unified detail later should fetch attachments through a source-aware adapter that starts from the canonical row, resolves the source Manual Archive row through approved linkage, and then loads source-specific attachments;
- cleanup must protect Manual Archive attachment references and canonical parent references before any destructive cleanup phase is considered;
- `DIMUSNAHKAN` file blocking must remain authoritative and must block stale access.

No attachment table consolidation is recommended in the write-alignment phase. Parent canonicalization and attachment unification are separate risks and should remain separate phases.

## Lifecycle Implications

Early canonical `MANUAL` write alignment should create only `AKTIF` canonical rows for new Manual Archive creates.

Lifecycle authority guard:

- `manual_arsip.status_arsip` should remain authoritative until unified lifecycle APIs exist;
- canonical `arsip.arsip.status_arsip` is a transitional projection copied from the source at creation time;
- source and canonical lifecycle values must not be allowed to drift once lifecycle updates are introduced.

Future lifecycle unification options:

- update `manual_arsip.status_arsip` and canonical `arsip.arsip.status_arsip` together in one transaction while source remains authoritative;
- or declare canonical `arsip.arsip` authoritative and make source lifecycle fields compatibility fields only.

Recommendation for early implementation:

- do not implement lifecycle sync in the write-alignment create phase;
- create only `AKTIF` canonical rows;
- keep edit behavior locked to `manual_arsip.status_arsip='AKTIF'`;
- defer `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN` sync to a later lifecycle unification phase.

## Existing Data And Backfill Policy

No automatic existing-data backfill is approved by this phase.

Rules:

- do not create canonical `MANUAL` rows for existing `manual_arsip` rows in the create-path alignment phase;
- use the Phase 12L.4 compatibility reader and Phase 12L.5 remediation policy as report-first inputs before backfill;
- existing rows missing required metadata require human review or correction before canonical parent creation;
- existing rows with null, zero, or invalid nominal values require human review and correction;
- existing rows with missing classification, retention, archive date, archive actor, or letter number must not be auto-canonicalized;
- existing rows should be canonicalized only in a separate report-first, retry-safe, human-reviewed backfill phase;
- no row, table, attachment, seed-like row, or storage file cleanup is allowed before verification and explicit human approval.

Backfill should not rely on source metadata stored only in canonical `metadata` as the durable relationship. If long-term bidirectional lookup is needed, use a future dedicated schema field approved in a separate schema phase.

## Recommended Implementation Split

Recommended future phases:

1. `Phase 12L.13 - Manual Archive canonical MANUAL write helper foundation`
   - Add source-specific mapping/helper tests and helper code for one source row.
   - Do not wire it into create path yet if humans want review of helper behavior first.
   - Validate retry safety, existing-link reuse, wrong-link failure, rollback behavior, safe metadata, and field mapping.

2. `Phase 12L.14 - Manual Archive create path canonical write alignment`
   - Wire the helper into Manual Archive POST create.
   - Insert source row, canonical row, and source link in one DB transaction.
   - Keep attachment upload separate.
   - Add targeted API/unit tests.

3. `Phase 12L.15 - Manual Archive edit and canonical sync policy`
   - Decide whether `AKTIF` edits before lifecycle unification update both source and canonical fields, source only, or are blocked after canonicalization.
   - Avoid silent drift between source and projection records.

4. `Phase 12L.16 - Existing Manual Archive remediation and backfill plan`
   - Run report-first review only after human approval.
   - Define exact remediation buckets and retry-safe per-row canonicalization.
   - Do not combine with cleanup.

5. `Phase 12M - Unified archive query/list/detail`
   - Add source-aware unified read services and UI only after new write alignment is stable.
   - Keep attachment access source-aware.
   - Defer lifecycle unification unless explicitly scoped.

If humans require no code-helper-only phase, Phase 12L.13 and 12L.14 may be combined only if the implementation remains narrow, reviewed, and covered by targeted tests. Do not combine with backfill, lifecycle unification, UI list/detail work, attachment consolidation, aggregate/export, or cleanup.

## What Is Intentionally Not Changed

This phase does not:

- modify source code;
- modify tests;
- modify Manual Archive create/edit APIs;
- modify Manual Archive UI;
- create canonical `MANUAL` rows;
- dual-write;
- backfill existing `manual_arsip` rows;
- run the live DB compatibility report;
- create routes;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify attachment upload;
- modify attachment preview/download;
- modify workflow archive routes;
- implement lifecycle APIs;
- implement unified archive list/detail UI;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows or tables;
- delete Manual Archive test data;
- delete storage files;
- modify package files, lockfiles, generated routes, DB folders, Drizzle migrations, or historical Supabase artifacts.

## Risks And Open Decisions

Risks:

- create-time canonical insertion makes canonical projection part of the create contract; a canonical insert failure will fail the whole parent create request;
- attachment upload remains separate, so source plus canonical rows can exist before attachments or after partial attachment failure;
- source/canonical lifecycle drift can occur if later lifecycle APIs update only one side;
- current `arsip.arsip.archived_at` is timestamp storage while Manual Archive archive date is date-only business data;
- storing source id in canonical metadata can become false authority if later code treats it as a relationship;
- existing rows still need human-reviewed remediation before backfill;
- a generic canonical insert helper could accidentally weaken source-specific constraints.

Open decisions:

- whether to store transitional source Manual Archive id in canonical `metadata` or wait for a future dedicated source id column;
- whether a future `source_manual_arsip_id` column should be added to `arsip.arsip` before unified detail/query depends on canonical-to-source lookup;
- exact concurrency mechanism for retry/backfill canonicalization of existing rows;
- whether Manual Archive `AKTIF` edits after canonicalization should update canonical rows immediately or remain source-only until a sync phase;
- whether `archived_at` should remain timestamp storage or be replaced/supplemented by a true date-only canonical archive date later;
- whether lifecycle unification will keep `manual_arsip` authoritative or make canonical `arsip.arsip` authoritative.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12L.13 - Manual Archive canonical MANUAL write helper foundation
```

That phase should implement only the source-specific mapping and transaction helper foundation with targeted tests. It should not add routes, change UI, create migrations, backfill existing rows, modify attachment upload/preview/download, unify lifecycle, implement aggregate/export, consolidate attachments, run route generation, or perform cleanup.

Implementation note as of Phase 12L.13: the source-specific pure helper foundation now exists in `src/lib/archive/manual-archive-canonical.ts` with focused unit coverage. It validates complete `AKTIF` Manual Archive source rows, builds canonical `MANUAL` insert values, returns existing-link reuse plans, maps `tanggal_diarsipkan` to UTC midnight for canonical `archived_at`, and keeps file/path/token/SQL/env/secret data out of canonical metadata. The helper is not wired into Manual Archive POST create yet and does not create canonical `MANUAL` rows during normal runtime.
