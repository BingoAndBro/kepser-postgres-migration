# Phase 12L.8 - Manual Archive Retention Metadata Design

Date: 2026-05-24

Status: planned pending human review. This phase is design/planning-only and docs-only. It does not implement schema, migration, runtime write, API, UI, route, test, backfill, cleanup, upload, preview/download, lifecycle, aggregate/export, package, generated route, DB, drizzle, or Supabase changes.

## Scope And Boundary

Phase 12L.8 defines the Manual Archive retention metadata policy required before canonical `MANUAL` write alignment.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and must not be used as authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current write boundaries remain unchanged:

- workflow archive rows write to `arsip.arsip`;
- Manual Archive rows write to `arsip.manual_arsip`;
- Manual Archive attachments write to `arsip.manual_arsip_attachment`;
- no canonical `MANUAL` rows are created;
- no dual-write is introduced;
- no existing rows are mutated or backfilled.

## Current-State Inventory

### Workflow Archive Retention

Workflow archive currently stores retention metadata on `arsip.arsip`:

- `retensi_aktif`: text label;
- `retensi_inaktif`: text label;
- `masa_aktif_berakhir`: date-only end date;
- `masa_inaktif_berakhir`: date-only end date;
- `archived_at`: timestamp with default server/database timestamp, treated transitionally as `tanggal_diarsipkan`;
- `archived_by`: authenticated `KEPALA_SUB_BAGIAN_UMUM` session user, treated transitionally as `diarsipkan_oleh`;
- `created_by`: after Phase 12L.7, new workflow rows use `dokumen_transaksi.created_by`;
- `status_arsip`: canonical lifecycle value, initially `AKTIF`.

Workflow retention input is label-based. The current workflow UI and API use these labels:

```text
1 Tahun
3 Tahun
5 Tahun
10 Tahun
Permanen
```

The values are not stored as raw numbers. Existing code parses the first number from labels and handles `Permanen` as a special value that produces `9999-12-31`.

Important current-code nuance:

- the workflow UI calculates retention end dates from `dokumen.tanggal` when available, falling back to today's date;
- the workflow API validates retention labels and date-only strings but does not recalculate the end dates server-side;
- `archived_at` itself is still the server/database archive timestamp.

This means the current workflow behavior is compatible with stored retention labels and date-only end dates, but it is not a clean authoritative server-side calculation model.

### Manual Archive Fields And Gaps

Manual Archive currently stores parent rows in `arsip.manual_arsip`:

- `nama`: required Manual Archive name, intended to map to canonical `nama_arsip`;
- `tanggal`: required date-only field with generic UI label `Tanggal`;
- `keterangan`: required description;
- `nominal_realisasi`: nullable in DB for compatibility, required positive integer greater than 0 at API/UI boundary for new create/edit behavior;
- `category_id`: required Manual Archive category, separate from archival classification;
- `klasifikasi_id`: optional reference to `master_klasifikasi_arsip`;
- `klasifikasi_nama_snapshot`: nullable name snapshot only;
- `status_arsip`: lifecycle value, default `AKTIF`;
- `metadata`: supplemental safe JSON only;
- `created_by`: required server-authenticated creator;
- `created_at` and `updated_at`: system timestamps;
- lifecycle actor/date scaffolding: `inactivated_at`, `inactivated_by`, `proposed_destroy_at`, `proposed_destroy_by`, `destroyed_at`, and `destroyed_by`.

Manual Archive currently lacks:

- `nomor_surat`;
- required canonical `klasifikasi_id`;
- `klasifikasi_kode_snapshot`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- explicit `tanggal_diarsipkan`;
- explicit `archived_by` or `diarsipkan_oleh` field separate from `created_by`;
- canonical parent linkage/idempotency field for future `arsip.arsip` `MANUAL` rows.

`manual_arsip.tanggal` is currently a generic domain date. It should not be overloaded as official `tanggal_diarsipkan` unless a later human decision confirms that the field already means the official archive date for all Manual Archive records.

### Master Classification Retention

`master_klasifikasi_arsip` currently stores:

- `id`;
- `nama`;
- `deskripsi`;
- `is_active`;
- `created_at`;
- `parent_id`;
- `kode`.

It does not store active/inactive retention durations or permanent-retention policy fields. A classification-driven retention policy therefore cannot be implemented immediately without a separate master-data schema/API/UI phase.

## Target Canonical Manual Retention Fields

Future canonical `MANUAL` rows should populate the same canonical archive parent field family used by workflow rows:

- `source_type='MANUAL'`;
- `dokumen_id=null`;
- `nama_arsip`;
- `nomor_surat`;
- `klasifikasi_id`;
- `klasifikasi_kode_snapshot`;
- `klasifikasi_nama_snapshot`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- `archived_at`, as the transitional physical column for `tanggal_diarsipkan`;
- `archived_by`, as the transitional physical column for `diarsipkan_oleh`;
- `created_by`;
- `status_arsip`;
- `nominal_realisasi`;
- supplemental `metadata` only where needed.

Recommended transition storage:

- Source/manual table: add Manual Archive source fields first so create/edit can capture complete metadata before canonical `MANUAL` rows are created.
- Canonical table: later write-alignment phase copies validated Manual Archive metadata into `arsip.arsip` as the canonical parent row.
- Attachments: remain under `manual_arsip_attachment` until a separate attachment strategy phase. The canonical parent must retain a safe lookup path back to the Manual Archive source parent or approved link field.

Reason: adding all missing inputs directly only to canonical `arsip.arsip` while Manual Archive continues to use `manual_arsip` would create split ownership and idempotency risk. The safer transition is to capture source metadata first, then align canonical writes in a later phase.

## Retention Input And Calculation Options

### Option 1 - Fully Manual Input

Policy:

- Kasubag selects or enters `retensi_aktif` and `retensi_inaktif`.
- Kasubag manually sets `masa_aktif_berakhir` and `masa_inaktif_berakhir`.

Evaluation:

- User burden: highest, because users must understand both retention labels and resulting dates.
- Data quality: weakest by default, because dates can drift from selected labels.
- Implementation risk: low technically, because it resembles current workflow storage and avoids calculation logic.
- Schema needs: Manual Archive source needs four retention fields plus date policy fields.
- Migration/backfill impact: legacy rows still need human review; no safe automatic calculation if dates are manually authoritative.
- Consistency with workflow: partially consistent, because current workflow displays read-only calculated dates but allows API-provided dates.
- Wrong-policy risk: high, because manually entered dates can encode policy mistakes with formal-looking authority.

Assessment: not recommended as the short-term target because it maximizes human error without delivering clear policy consistency.

### Option 2 - Semi-Automatic Input

Policy:

- Kasubag selects `retensi_aktif` and `retensi_inaktif` from approved labels.
- System calculates `masa_aktif_berakhir` and `masa_inaktif_berakhir` from explicit `tanggal_diarsipkan`.
- End dates are stored as date-only `YYYY-MM-DD`.

Evaluation:

- User burden: moderate and operationally acceptable.
- Data quality: stronger than manual dates because labels and end dates are aligned.
- Implementation risk: moderate, requiring shared validation/calculation rules and server-side enforcement.
- Schema needs: Manual Archive source needs selected labels, calculated end dates, explicit `tanggal_diarsipkan`, and archive actor fields before canonical write alignment.
- Migration/backfill impact: existing rows still require report-first review; future rows can be complete once implemented.
- Consistency with workflow: close to workflow UI behavior but should improve it by requiring server-side calculation for Manual Archive.
- Wrong-policy risk: lower than fully manual input, but still depends on whether selected labels are correct for the archive classification.

Assessment: recommended as the immediate Manual Archive policy because it is the lowest-risk complete policy available without adding retention durations to master classification.

### Option 3 - Classification-Driven Retention

Policy:

- Retention durations come from `master_klasifikasi_arsip`.
- System calculates end dates from `tanggal_diarsipkan`.

Evaluation:

- User burden: lowest once master data is complete.
- Data quality: potentially strongest if classification retention policy is authoritative and maintained.
- Implementation risk: highest now, because current `master_klasifikasi_arsip` has no retention duration fields.
- Schema needs: master classification schema must gain retention policy fields, validation, admin UI/API, and migration/backfill rules.
- Migration/backfill impact: significant; existing classifications and rows need human-reviewed policy population.
- Consistency with workflow: not consistent with current workflow behavior, which uses label selection rather than classification-derived durations.
- Wrong-policy risk: high until classification retention metadata is reviewed and governed; a wrong master value could affect many rows.

Assessment: recommended only as a later hardening path after a separate `master_klasifikasi_arsip` retention-policy phase. It is not implementable now without expanding scope.

## Recommended Retention Policy

Recommended short-term policy for future Manual Archive canonical write alignment:

- Add explicit `tanggal_diarsipkan` input labeled `Tanggal Arsip`.
- Keep `manual_arsip.tanggal` as source document/date metadata unless humans explicitly redefine it.
- Rename archive-facing `nama` labels to `Nama Arsip`; map the source value to canonical `nama_arsip`.
- Require `nomor_surat` before canonical `MANUAL` row creation.
- Require `klasifikasi_id` from `master_klasifikasi_arsip` before canonical `MANUAL` row creation.
- Derive `klasifikasi_kode_snapshot` and `klasifikasi_nama_snapshot` server-side from the selected active classification.
- Require Kasubag to select `retensi_aktif` and `retensi_inaktif` from approved label options aligned with existing workflow labels.
- Calculate `masa_aktif_berakhir` and `masa_inaktif_berakhir` server-side from `tanggal_diarsipkan` and the selected retention labels.
- Store retention labels as text for compatibility with existing workflow `arsip.arsip` fields.
- Store calculated retention end dates as date-only fields.
- For Manual Archive, set both `created_by` and `archived_by`/`diarsipkan_oleh` from the current authenticated `KEPALA_SUB_BAGIAN_UMUM` session user at create/archive submission time, per the human domain decision.
- Preserve `status_arsip='AKTIF'` creation behavior.

Classification-driven retention should remain a future option only after `master_klasifikasi_arsip` supports reviewed retention policy metadata.

## Date Semantics

### Existing `manual_arsip.tanggal`

Current meaning: generic Manual Archive date shown as `Tanggal`.

Recommended future meaning: source document date or source/archive-domain date metadata. It should remain available for display and reports if needed, but it should not be the canonical archive action date by default.

Reason: current docs and code do not prove that `manual_arsip.tanggal` is the official date the archive was recorded. Overloading it would make existing data appear more authoritative than it is.

### Existing `manual_arsip.created_at`

Current meaning: system row creation timestamp.

Recommended future meaning: technical creation timestamp only.

Reason: it records when the system row was created, not necessarily the official archive date. It is useful for audit/order but should not drive retention policy.

### Future `tanggal_diarsipkan`

Recommended meaning: official archive date chosen/confirmed by Kasubag when filling Manual Archive canonical metadata.

Recommended storage during transition:

- add it to the Manual Archive source model in a future schema phase;
- copy it to canonical `arsip.arsip.archived_at` during canonical `MANUAL` write alignment, using the existing transitional column as `tanggal_diarsipkan`.

If `arsip.arsip.archived_at` remains a timestamp column, future implementation must define how a date-only `tanggal_diarsipkan` is converted to timestamp. Recommended convention is date-only semantics for business logic and a stable local-day or UTC-midnight representation only as storage detail, with API DTOs returning `YYYY-MM-DD` for retention calculations.

### Existing/Future `archived_at`

For canonical `arsip.arsip`, `archived_at` remains the transitional physical column used as `tanggal_diarsipkan`.

For Manual Archive source rows, do not add a second ambiguous `archived_at` name unless the implementation clearly distinguishes it from `created_at` and UI labels it as `Tanggal Arsip`.

## Calculation Rules Proposal

This section defines future conceptual rules only. No calculation is implemented in this phase.

Input labels:

```text
1 Tahun
3 Tahun
5 Tahun
10 Tahun
Permanen
```

Rules:

- Use date-only `YYYY-MM-DD` inputs and outputs for business retention fields.
- Validate selected retention labels against a central approved option set before writing.
- Do not assume retention labels are numeric; labels are stored as text and may contain non-numeric policy values.
- `masa_aktif_berakhir = tanggal_diarsipkan + retensi_aktif duration`.
- `masa_inaktif_berakhir = masa_aktif_berakhir + retensi_inaktif duration`.
- For numeric `N Tahun` labels, add `N` calendar years to the base date.
- Leap-day behavior must be explicitly tested in the implementation phase; recommended behavior is to rely on one central date helper and document its rollover result.
- If `retensi_aktif='Permanen'`, treat the archive as permanently active for retention-date purposes.
- If `retensi_inaktif='Permanen'`, treat inactive retention as permanent after active retention ends.

Recommended `Permanen` handling:

- Do not treat `Permanen` as a normal numeric duration.
- Prefer `null` for the end date that does not exist conceptually, if future schema/API can support nullable calculated dates.
- If compatibility with existing workflow date fields requires a sentinel, use `9999-12-31` only as an explicitly documented transitional sentinel.
- Do not produce `masa_inaktif_berakhir` for a permanent retention path unless the selected policy explicitly says the permanent phase still has an inactive end date.

Because existing workflow code already uses `9999-12-31` for `Permanen`, the lowest-risk short-term implementation may preserve that sentinel for compatibility. The policy should still document that `Permanen` is semantic permanence, not 999 years.

## Future Phase Split

Recommended future phases after this design:

1. Manual Archive retention schema foundation.
2. Manual Archive create/edit API validation for `nomor_surat`, required `klasifikasi_id`, `tanggal_diarsipkan`, `retensi_aktif`, and `retensi_inaktif`, with server-side calculation of retention end dates.
3. Manual Archive UI update for `Nama Arsip`, `Nomor Surat`, `Klasifikasi`, `Tanggal Arsip`, and retention inputs.
4. Manual Archive canonical `MANUAL` write alignment, including idempotency and duplicate-prevention rules.
5. Existing Manual Archive data remediation/backfill, report-first and human-reviewed.

These phases must remain separate. Do not combine schema, API, UI, canonical write alignment, and existing-data backfill into one phase.

## What Is Intentionally Not Changed

This phase does not:

- modify source code;
- modify tests;
- create migrations;
- modify Drizzle schema;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify Manual Archive create/edit APIs;
- modify workflow archive routes;
- modify UI;
- modify `src/routeTree.gen.ts`;
- modify `package.json` or `pnpm-lock.yaml`;
- create canonical `MANUAL` rows;
- dual-write;
- backfill existing rows;
- run the live DB compatibility reader;
- execute migrations or seeds;
- add routes;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- delete old tables;
- delete Manual Archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior.

## Risks And Open Decisions

Risks:

- Existing workflow calculation is client-side and date-base semantics differ from `archived_at`; copying that behavior blindly would preserve ambiguity.
- Existing retention labels are mixed textual policy labels, not normalized numeric durations.
- `Permanen` needs explicit semantic handling; treating it as just `999` years can create misleading lifecycle dates.
- Current `master_klasifikasi_arsip` cannot drive retention without a separate master-data policy/schema phase.
- Adding canonical `MANUAL` rows before source metadata and idempotency are designed could create duplicate archive parents.
- Existing Manual Archive rows still lack `nomor_surat`, required classification, and retention fields, so backfill remains human-reviewed.
- Attachment lookup must remain source-aware until an attachment strategy is approved.

Open decisions:

- Whether future `arsip.arsip.archived_at` should remain timestamp storage for `tanggal_diarsipkan` or whether a true date-only canonical column should be added later.
- Whether compatibility requires `9999-12-31` for all `Permanen` end dates or permits nullable end dates for semantic permanence.
- Whether `manual_arsip.tanggal` should be renamed or relabeled once explicit `tanggal_diarsipkan` exists.
- Whether source `manual_arsip` should store calculated end dates directly or store inputs only and rely on canonical `arsip.arsip` after write alignment.
- Whether later classification-driven retention should override user-selected retention or only provide defaults.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Manual Archive retention schema foundation
```

This next phase should add only the source/schema foundation needed to store future Manual Archive retention metadata and canonical-link/idempotency support if approved. It should not update APIs, UI, runtime writes, canonical `MANUAL` row creation, backfill, lifecycle, attachment behavior, aggregate/export, cleanup, route generation, packages, `db/`, `supabase/`, or broad tests.
