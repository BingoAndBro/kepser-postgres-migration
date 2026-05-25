# AGENTS.md - Project Constitution: DMS (Dynamic Document Workflow Management System)
> File ini adalah hukum kerja repo. Semua perubahan schema, routing, workflow, security boundary, storage, dan data boundary harus mengacu ke file ini. Jika realita aplikasi berubah, update file ini dulu atau bersamaan dengan kode/dokumen terkait.

---

## North Star

> Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh pihak yang berwenang.

Tujuan MVP tetap sama: menghapus kebingungan status dokumen, memperjelas inbox per role, dan menjaga jejak audit dari submit sampai arsip atau pemusnahan.

---

## Current Project Status

Kondisi aplikasi per 2026-05-22:

- Migrasi besar Supabase-to-local selesai sampai Phase 11H.3.
- Final classification 11H.3:

```text
Partial / bounded release handoff: local/LAN target is ready for human-controlled internal handoff, subject to deployment posture decisions and accepted limitations.
```

- Ini adalah human-controlled internal/local/LAN handoff yang bounded, bukan public production readiness, bukan go-live approval, bukan operational certification, bukan security certification, dan bukan compliance validation.
- Active runtime/package Supabase dependency retired untuk clean local target.
- Historical Supabase docs/tests/comments/.env-example references dan folder `supabase/` tetap ada sebagai traceability atau cleanup backlog.
- Jangan menulis atau menyimpulkan bahwa Supabase sudah fully removed from repository.
- No old Supabase data/file recovery, migration, copy, download, backfill, sync, or fallback is expected.
- Setelah 11H.3, recommended state adalah human-controlled maintenance/backlog governance.

Referensi utama:

- `docs/migration/phase-11h-final-release-classification.md`
- `docs/migration/phase-11h-final-readiness-plan.md`
- `docs/migration/phase-11h-final-supabase-audit.md`
- `docs/migration/phase-11h-p1-security-gate-decision.md`
- `docs/migration/phase-11g-rollback-release-handoff.md`
- `docs/migration/phase-11g-security-review.md`
- `docs/migration/deployment-target-contract.md`
- `docs/migration/local-deployment-notes.md`
- `docs/migration/open-decisions.md`
- `docs/migration/phase-12g-manual-archive-schema.md`
- `docs/migration/phase-12h-manual-archive-api-foundation.md`
- `docs/migration/phase-12j2d-manual-archive-required-nominal.md`
- `docs/migration/phase-12k-manual-archive-preview-download.md`
- `docs/migration/phase-12l-manual-archive-edit-aktif-only.md`
- `docs/migration/phase-12l2-canonical-archive-schema-foundation.md`
- `docs/migration/phase-12l3-compatibility-read-backfill-plan.md`
- `docs/migration/phase-12l4-report-only-db-compatibility-reader.md`
- `docs/migration/phase-12l5-remediation-policy-for-compatibility-gaps.md`
- `docs/migration/phase-12l7-workflow-archive-canonical-write-alignment.md`
- `docs/migration/phase-12l9-manual-archive-retention-schema-foundation.md`
- `docs/migration/phase-12l10-manual-archive-api-retention-validation.md`
- `docs/migration/phase-12l11-manual-archive-ui-required-metadata.md`
- `docs/migration/phase-12l14-manual-archive-create-canonical-write-alignment.md`
- `docs/migration/phase-12l15-manual-archive-edit-canonical-sync.md`
- `docs/migration/phase-12l16-existing-manual-archive-remediation-backfill-plan.md`
- `docs/migration/phase-12l17-read-only-manual-archive-remediation-report-helper.md`
- `docs/migration/phase-12l18-human-reviewed-manual-archive-canonicalization-helper.md`
- `docs/migration/phase-12l19-manual-archive-canonicalization-dry-run.md`
- `docs/migration/phase-12m1-unified-archive-query-service.md`
- `docs/migration/phase-12m2-unified-archive-list-page-integration.md`
- `docs/migration/phase-12m3-unified-archive-detail-policy.md`
- `docs/migration/phase-12m4-unified-archive-detail-read-service.md`
- `docs/migration/phase-12m5-unified-archive-detail-page-integration.md`
- `docs/migration/phase-12m6-source-aware-detail-attachment-metadata.md`
- `docs/migration/phase-12m6b-unified-detail-ui-label-dedup-cleanup.md`
- `docs/migration/phase-12m6c-unified-detail-actor-display-name-resolution.md`
- `docs/migration/phase-12m7-source-aware-preview-download-from-detail.md`
- `docs/migration/phase-12m8-unified-detail-file-access-smoke-review.md`
- `docs/migration/phase-12n1-unified-archive-lifecycle-policy-inventory.md`
- `docs/migration/phase-12n2-unified-archive-lifecycle-helper-foundation.md`
- `docs/migration/phase-12n3-unified-lifecycle-api-non-destructive.md`
- `docs/migration/phase-12n4-destruction-approval-policy-and-safety-plan.md`
- `docs/migration/phase-12n5-unified-approve-destruction-api-only.md`
- `docs/migration/phase-12n6-unified-lifecycle-detail-buttons-non-destructive.md`
- `docs/migration/phase-12n6b-unified-lifecycle-button-placement-redirect-ux.md`
- `docs/migration/phase-12n7-destruction-approval-ui-plan.md`
- `docs/migration/phase-12n8-unified-destruction-approval-ui.md`
- `docs/migration/phase-12n9-archive-native-destruction-audit-planning.md`
- `docs/migration/phase-12n10-physical-file-destruction-policy-implementation.md`
- `docs/migration/phase-12n11-legacy-proposal-route-compatibility-cleanup-plan.md`
- `docs/migration/phase-12n11b-legacy-proposal-route-removal-and-redirect-cleanup.md`

---

## Active Stack

| Layer | Teknologi | Status |
|---|---|---|
| Framework | TanStack Start | aktif |
| Router | TanStack React Router file-based | aktif |
| Language | TypeScript | wajib |
| Database | local PostgreSQL | aktif |
| ORM | Drizzle ORM | aktif |
| Auth | local `dms_session` auth | aktif |
| Storage | local filesystem storage | aktif |
| Validation | Zod | wajib di boundary |
| UI | React 19 + Tailwind CSS v4 + komponen UI lokal | aktif |
| Testing | Vitest + Playwright | aktif |
| Package Manager | pnpm | wajib |

### Package Manager Rules

Gunakan `pnpm` untuk semua operasi package manager.

```bash
pnpm install
pnpm add <paket>
pnpm add -D <paket>
pnpm remove <paket>
pnpm dev
pnpm build
pnpm test
```

Aturan:

- jangan gunakan `npm` atau `yarn`
- commit `pnpm-lock.yaml` hanya jika phase eksplisit mengizinkan package change
- referensi praktik: `docs/pnpm-best-practices.md`

---

## Supabase Retirement Boundary

Klasifikasi yang benar:

```text
Active runtime/package Supabase dependency retired.
Historical Supabase artifacts remain.
```

Yang retired:

- active runtime/package dependency untuk clean local target
- active `@supabase/*` package dependency
- active Supabase Auth/Database/Storage runtime fallback
- old Supabase data/file recovery expectation

Yang masih ada sebagai historical/cleanup backlog:

- historical migration docs/specs
- stale test references or expectations
- source comments/type residue
- `.env.example` Supabase key-name residue
- retained `supabase/` folder and legacy artifacts

Rules:

- Do not reintroduce Supabase packages, helpers, runtime clients, storage fallback, or old file/data recovery.
- Do not delete or modify `supabase/` unless a later human-approved cleanup phase explicitly allows it.
- Do not claim Supabase is fully removed from repository.
- Treat historical Supabase references as traceability unless the active runtime/package audit proves otherwise.

---

## Security Posture

### Auth Boundary

- `dms_session` is the auth boundary.
- `dms_session` is an opaque `HttpOnly` cookie backed by hashed session-token storage.
- `dms_active_role` is UX-only state and is not authorization proof.
- Server/API RBAC is authoritative.
- Client-side role hiding is a UX hint only.
- `ADMIN` is a dedicated role and must not be broadened into or combined with `PEGAWAI`, `PPK`, `BENDAHARA`, `KEPALA_SUB_BAGIAN_UMUM`, or `PENANGGUNG_JAWAB_KINERJA`.
- Passwords use Argon2id.
- Logout and password-change/reset session revocation behavior must remain server-authoritative.

### Same-Origin And CSRF

- Unsafe API methods are protected by centralized same-origin `Origin`/`Referer` validation.
- This is a bounded same-origin foundation, not a full CSRF token framework.
- Safe methods must remain non-mutating.
- A full CSRF token framework remains future hardening if deployment expands.

### Rate Limit

- Login has an in-memory/local-process brute-force foundation.
- The limiter is not persistent and not distributed.
- Persistent/distributed rate-limit and reverse-proxy throttling remain maintenance backlog if topology expands.
- Broader throttling for upload, workflow, archive, admin, password-change, and file-token routes remains backlog.

### Admin Cleanup

- Destructive admin cleanup requires `POST` with explicit destructive intent.
- `GET` cleanup is non-destructive dry-run/report-only.
- Cleanup must protect referenced active document paths and retained archive snapshots.
- Cleanup responses must not expose physical storage paths or storage roots.

### File Access

- Raw logical-path file access must revalidate current document/archive state.
- `DIMUSNAHKAN` must block preview/download/file access, including stale token/path access.
- File access token internals must not be printed.
- File access must not expose physical storage path/root.

### Deployment Posture

- HTTPS plus `Secure` `dms_session` remains the preferred final deployment posture.
- Trusted HTTP LAN with `DMS_SESSION_COOKIE_SECURE=false` is bounded/internal only.
- Trusted HTTP LAN is not public internet approval, broad LAN certification, or production posture.
- PostgreSQL should not be broadly exposed to LAN clients unless a future explicit operational decision allows it.

---

## Canonical Domain Model

### Role

Role yang dipakai aplikasi:

```ts
type Role = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'KEPALA_SUB_BAGIAN_UMUM' | 'ADMIN'
```

After Phase 12E.1 this is extended to:

```ts
type Role =
  | 'PEGAWAI'
  | 'PPK'
  | 'BENDAHARA'
  | 'KEPALA_SUB_BAGIAN_UMUM'
  | 'PENANGGUNG_JAWAB_KINERJA'
  | 'ADMIN'
```

Display label tambahan: `Penanggung Jawab Kinerja`.

Canonical constants ada di:

- `src/lib/constants/roles.ts`
- `src/lib/types/auth.ts`

Rules:

- Users can have multiple non-admin roles.
- `ADMIN` remains dedicated.
- `PENANGGUNG_JAWAB_KINERJA` has metadata-only access to Laporan Kinerja and is not inherited by `ADMIN`.
- Server-side role checks are mandatory.

### Status Dokumen

Status dokumen yang saat ini dikenal kode:

```ts
type StatusDokumen =
  | 'DRAFT'
  | 'IN_PPK_VALIDATION'
  | 'IN_BENDAHARA_APPROVAL'
  | 'NEED_REVISION'
  | 'COMPLETED'
  | 'TERSIMPAN'
  | 'ARCHIVED'
```

Catatan:

- `TERSIMPAN` dipakai untuk dokumen Non-Material yang selesai disimpan tanpa approval material.
- Transisi FSM formal tetap dipusatkan di `src/lib/fsm.ts`.
- `TERSIMPAN` dihasilkan oleh handler submit Non-Material, bukan oleh `transition()` FSM umum.

Canonical constants ada di:

- `src/lib/constants/document-status.ts`
- `src/lib/types/fsm.ts`
- `src/lib/fsm.ts`

### Current Step

```ts
type CurrentStep = 'PPK' | 'BENDAHARA' | null
```

### Revision Target

```ts
type RevisionTarget = 'USER' | 'PPK' | null
```

### Arsip Lifecycle

Lifecycle arsip setelah dokumen sudah `ARCHIVED`:

```ts
type StatusArsip = 'AKTIF' | 'INAKTIF' | 'USUL_MUSNAH' | 'DIMUSNAHKAN'
```

Alur aktif:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Catatan:

- migrasi lama pernah mengenal `VERIFIKASI_PENYUSUTAN`
- status itu sudah dihapus oleh migrasi berikutnya
- `DIMUSNAHKAN` must block preview/download/file access

---

## Database Source Of Truth

Current post-migration source-of-truth order:

1. Drizzle schema and migrations for local PostgreSQL.
2. Endpoint/helper behavior that uses those tables.
3. Historical Supabase migrations only as compatibility/provenance reference.

Do not treat `supabase/migrations/` as the active database authority after the local migration. They are retained historical artifacts unless a future cleanup policy changes that.

### Active Table Families

Auth/RBAC:

- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`

Master Data Dokumen:

- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_kelengkapan_dokumen`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.ketua_tim_assignments`

Workflow Dokumen:

- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`

Arsip:

- `arsip.arsip`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`
- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

### Schema Rules

- `ketua_tim_assignments` remains unique per `kegiatan_id`, not unique `(user_id, kegiatan_id)`.
- `dokumen_transaksi` includes `nominal_realisasi`, `is_non_material`, `jenis_dokumen_id`, and material request-chain columns.
- `nominal_realisasi` is only for Material documents.
- Non-Material documents do not have `nominal_realisasi`.
- `arsip.lampiran_snapshot` stores attachment metadata snapshot.
- `log_aktivitas` is append-only by contract.
- Manual archive for Penambahan Arsip uses separate tables and must not be forced into `dokumen_transaksi`.
- Phase 12L.2 extends `arsip.arsip` as the transitional canonical archive parent foundation with `source_type: 'WORKFLOW' | 'MANUAL'`; existing Manual Archive rows are not migrated into it yet.
- `arsip.arsip.dokumen_id` is nullable overall after Phase 12L.2 so future canonical `MANUAL` rows do not require `dokumen_transaksi`; current workflow archive writes still provide it.
- Strict `WORKFLOW`/`MANUAL` relationship checks for `dokumen_id` are future constraints after report-first backfill and write alignment.
- `manual_arsip_category` is separate from `master_klasifikasi_arsip`; `master_klasifikasi_arsip` remains the archival classification hierarchy.
- One `manual_arsip` parent row represents one report/archive record. `manual_arsip_attachment` child rows must not be counted as additional reports in future aggregates.
- Manual archive attachments are optional, and the schema supports many attachments per parent row.
- `manual_arsip_attachment.judul_lampiran` is the official attachment title column; existing rows are backfilled from `original_filename` by Phase 12J.2a.
- `manual_arsip.nominal_realisasi` remains nullable at the DB layer for compatibility, but Manual Archive create API/UI require a positive integer `nominal_realisasi` greater than 0.
- Manual archive file paths are logical storage paths only, never physical filesystem paths or storage roots.

---

## Architectural Invariants

1. **Local PostgreSQL/Drizzle is active.**
   - New DB work should update Drizzle schema/migrations first.
   - Historical Supabase migrations are reference only after local migration.

2. **FSM is the legal source for workflow transitions.**
   - All normal `dokumen_transaksi.status` transitions must match `src/lib/fsm.ts`.
   - Do not manually update status without FSM-equivalent reasoning and tests/docs.
   - If adding a state, update constants, types, FSM, tests, badges/filters, and this file.

3. **Audit trail is sacred.**
   - `log_aktivitas` append-only.
   - No `UPDATE` or `DELETE` to `log_aktivitas`.
   - Exception: the accepted scoped non-material `TERSIMPAN` document delete behavior may cascade logs only under the documented narrow conditions. Do not generalize it.

4. **Zod at every boundary.**
   - Request input, mutation payloads, and important response shapes should be validated by schema in `src/lib/schemas/` or equivalent local schema modules.

5. **No magic strings.**
   - Route paths use constants in `src/lib/constants/routes.ts` where shared.
   - Roles use constants in `src/lib/constants/roles.ts`.
   - Statuses use constants in `src/lib/constants/document-status.ts`.
   - Table names use constants in `src/lib/constants/tables.ts` when touching shared code.

6. **Secrets only in env.**
   - No hardcoded secret in `src/`.
   - Do not print env values, DB URLs, storage roots, password hashes, plaintext passwords, session tokens, cookie values, CSRF tokens, file tokens, signed file tokens, or physical paths.

7. **Server is the authority for RBAC.**
   - Client may hide UI.
   - Server handlers/helpers must make final access decisions.

8. **Prefer server/API boundaries for new work.**
   - Do not add new browser-direct DB/storage access.
   - Keep local filesystem access behind authorized API/server helpers.

9. **Update docs before behavior changes.**
   - If SOP, workflow, security posture, deployment posture, or storage behavior changes, update related docs and this file before or with code.

---

## Behavioral Rules

### 1. Auth And Active Role

- User login uses local auth and `dms_session`.
- Active role is stored in cookie `dms_active_role`.
- `dms_active_role` is readable UX state only.
- Helper auth utama:
  - `src/lib/auth.ts`
  - `src/lib/auth-state.ts`
- `AppLayout` bootstraps client auth state through local session APIs.
- `ADMIN` tetap diperlakukan sebagai akun dedicated.

### 2. Role Switcher

- If user has more than one non-admin role, role can be switched from header.
- Route default per role is defined by:
  - `src/lib/constants/routes.ts`
  - `src/config/navigation.ts`
- Role switch must be validated server-side against assigned roles.

### 3. Workflow Material

Alur approval material:

```text
DRAFT
-> IN_PPK_VALIDATION
-> IN_BENDAHARA_APPROVAL
-> COMPLETED
-> ARCHIVED
```

Rules:

- Material documents may use `nominal_realisasi`.
- For material workflow documents, report metadata including `nominal_realisasi` is locked once status is `COMPLETED`.
- PPK reject -> `NEED_REVISION`, `revision_target='USER'`.
- Bendahara reject -> `NEED_REVISION`, `revision_target='PPK'`.
- PPK `KEMBALIKAN` handles PPK-targeted revision back to Pegawai and must not be conflated with ordinary reject.
- `current_step` is `PPK`, `BENDAHARA`, or `null`.
- `revision_target` is `USER`, `PPK`, or `null`.

### 4. Workflow Non-Material

Dokumen Non-Material mengikuti shortcut:

```text
DRAFT -> TERSIMPAN
```

Rules:

- Does not enter PPK/Bendahara approval.
- Remains stored as document transaction.
- Can appear in selected reports.
- Does not have `nominal_realisasi`.
- `nominal_realisasi` must remain Material-only.

### 5. Arsip Flow

After document `COMPLETED`:

- Kepala Sub Bagian Umum can archive -> document becomes `ARCHIVED`, archive record is created with `status_arsip='AKTIF'`.
- Kepala Sub Bagian Umum skip action in FSM keeps document `COMPLETED`.
- Archive lifecycle continues on `arsip` table:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Rules:

- `arsip.lampiran_snapshot` stores attachment metadata snapshot.
- After Phase 12L.2, `arsip.arsip` is the transitional canonical archive parent foundation and uses `source_type='WORKFLOW'` for workflow archive rows. After Phase 12L.14, new Manual Archive POST creates also create canonical `source_type='MANUAL'` rows and link them through `manual_arsip.canonical_arsip_id`.
- After Phase 12L.7, new workflow archive writes explicitly populate canonical workflow fields on `arsip.arsip`, including derived `nama_arsip`, `klasifikasi_id`, classification snapshots from `master_klasifikasi_arsip`, `created_by` from `dokumen_transaksi.created_by`, and `archived_by` from the current `KEPALA_SUB_BAGIAN_UMUM` session user.
- `DIMUSNAHKAN` must block preview/download/file access.
- Destructive archive/file behavior must preserve authorization, audit logging, and safe file handling.

### 5A. Manual Archive / Penambahan Arsip

Manual archive uses separate tables:

- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

Rules:

- Manual archive does not depend on `dokumen_transaksi`.
- Manual archive does not extend workflow-coupled `arsip.arsip` as its primary model.
- Manual archive category is separate from `master_klasifikasi_arsip`.
- Initial canonical categories are `Pemeliharaan`, `Pengadaan`, and `Lain-lain`.
- `keterangan` is required.
- `nominal_realisasi` remains nullable in the database for compatibility; Manual Archive creation through API/UI requires a positive integer value greater than 0.
- File attachment is optional, and one parent row may have many attachment child rows.
- Each manual archive attachment has official title column `judul_lampiran`; Phase 12J.2a backfills existing values from `original_filename`.
- After Phase 12J.2b, the manual archive attachment upload API requires one explicit `judul_lampiran` title per uploaded file and must not fall back from `original_filename`.
- One `manual_arsip` parent row counts as one report regardless of attachment count.
- Lifecycle values are `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`.
- Phase 12G adds schema/data-model foundation only. Do not add runtime UI/API/upload/preview/download/lifecycle/export behavior unless a future phase explicitly scopes it.
- Phase 12H adds minimal runtime API foundation for category list, parent list, create-without-upload, and detail. It does not add UI, upload, preview/download, file tokens, lifecycle transitions, aggregate report, Excel export, hard delete, schema changes, migrations, or seed changes.
- Phase 12K.1 adds direct authorized preview/download API responses for manual archive attachments only. It does not add UI buttons, file tokens, signed URLs, lifecycle transitions, aggregate report, Excel export, attachment delete, schema changes, migrations, upload changes, or public/static serving.
- Phase 12L.1 adds parent metadata edit through `PATCH /api/arsiparis/manual-arsip/$id` only while `status_arsip='AKTIF'`. It does not add UI edit behavior, attachment edit/delete, lifecycle transitions, retention fields, aggregate report, Excel export, schema changes, migrations, preview/download changes, upload changes, or public/static serving.
- Manual Archive create and edit APIs require a positive integer `nominal_realisasi` greater than 0 even though the database column remains nullable for compatibility.
- Phase 12L.2 is schema foundation only: it does not change runtime writes, Manual Archive APIs, workflow archive creation, lifecycle APIs, preview/download, upload behavior, list pages, route generation, data backfill, table deletion, seed data, or storage files.
- Phase 12L.3 adds transitional compatibility/report DTO mapping and report-first backfill planning only. It does not change runtime writes, Manual Archive APIs, workflow archive creation, lifecycle APIs, preview/download, upload behavior, list pages, route generation, data backfill, table deletion, seed data, or storage files.
- Phase 12L.4 adds an internal read-only compatibility report reader only. Phase 12L.5 adds human-reviewed remediation policy only. Neither phase changes runtime writes, adds routes/UI, mutates rows, creates migrations, performs backfill, deletes rows/files, or performs cleanup.
- The canonical archive parent target uses `source_type` values `WORKFLOW` and `MANUAL`; attachment models remain separate temporarily.
- Phase 12L.9 adds nullable Manual Archive source fields for future `nomor_surat`, archive date, retention, classification code snapshot, archive actor, and canonical parent link/idempotency support. It does not update APIs/UI, create canonical `MANUAL` rows, calculate retention, backfill rows, or change lifecycle/file behavior.
- Phase 12L.10 updates Manual Archive create/edit API validation and server-side writes for `nomor_surat`, required `klasifikasi_id`, `tanggal_diarsipkan`, retention labels, server-calculated retention dates, server-derived classification snapshots, and `archived_by` on create. It does not update UI, create canonical `MANUAL` rows, backfill existing rows, execute migrations, or change attachment/lifecycle behavior.
- Phase 12L.11 updates `/arsiparis/penambahan-arsip` create UI to collect and submit the required Phase 12L.10 Manual Archive metadata. It does not add edit UI, create canonical `MANUAL` rows, backfill rows, change APIs, execute migrations, or change attachment/lifecycle behavior.
- Phase 12L.14 aligns Manual Archive POST create writes: new source rows create one canonical `arsip.arsip` row with `source_type='MANUAL'` and update `manual_arsip.canonical_arsip_id` in the same DB transaction. It does not change PATCH/edit sync, attachment upload/preview/download, existing-row backfill, lifecycle APIs, aggregate/export, migrations, schema, or UI.
- Phase 12L.15 aligns Manual Archive PATCH/edit for `AKTIF` rows that already have `canonical_arsip_id`: source metadata and the linked canonical `source_type='MANUAL'` row are updated in one DB transaction. `AKTIF` rows without `canonical_arsip_id` remain transitional legacy source-only edits; PATCH does not create canonical rows, set canonical links, backfill existing rows, or change attachment behavior.
- Phase 12L.16 defines a docs-only, report-first remediation/backfill plan for existing Manual Archive rows without valid canonical `MANUAL` parents. It does not run a live report, mutate rows, create canonical rows, change APIs/UI/schema, touch attachments, execute migrations, or perform cleanup.
- Phase 12L.17 adds an internal read-only Manual Archive remediation report helper with controlled bucket labels, safe DTO output, bounded select-only reader support, and mocked unit tests. It does not run a live DB report, mutate rows, create canonical rows, update source links, add API/UI, change schema, touch attachments, execute migrations, or perform cleanup.
- Phase 12L.18 adds an internal dependency-injected one-row canonicalization helper for explicitly human-approved rows that are still `READY_FOR_CANONICALIZATION` at execution time. It is not wired to routes, UI, CLI, scheduler, report readers, live reports, or automatic backfill, and it must not process linked, broken-link, wrong-source, non-`AKTIF`, metadata-incomplete, or nominal-invalid rows.
- Phase 12L.19 adds an internal dependency-injected dry-run helper for exactly one human-approved Manual Archive row. It requires `approvedByUserId` before DB work, reloads the current row, returns safe preview metadata only for rows that would canonicalize, and must not call the live mutation helper, insert, update, delete, transaction, routes, UI, CLI, scheduler, live reports, or automatic backfill.
- Phase 12M.1 adds an internal read-only unified archive query service for canonical `arsip.arsip` rows only. It does not include unlinked legacy `manual_arsip` rows, add routes/UI, mutate rows, backfill, cleanup, run live reports, or change attachment/file behavior.
- Phase 12M.2 wires existing Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages to the unified canonical archive query service behind server-side `KEPALA_SUB_BAGIAN_UMUM` API authorization. It is read-only/list-only and does not add unified detail pages, lifecycle mutation, preview/download, search, export, cleanup, backfill, migrations, or route generation.
- Phase 12M.3 defines a planning-only unified archive detail policy and recommends future canonical detail route `/arsiparis/arsip/$id`. It does not add routes/UI, route generation, preview/download actions, lifecycle changes, search, export, cleanup, backfill, migrations, schema changes, source-link mutation, or file-access behavior changes.
- Phase 12M.4 adds an internal dependency-injected read-only unified archive detail service for one canonical `arsip.arsip.id`. It does not add routes/UI, route generation, preview/download actions, attachment metadata display, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-link mutation, or file-access behavior changes.
- Phase 12M.5 wires a read-only canonical detail API/page at `/api/arsiparis/arsip/$id` and `/arsiparis/arsip/$id` using the Phase 12M.4 detail service, and adds list `Detail` links from unified archive list rows by canonical `arsip.arsip.id`. It does not add attachment metadata display, preview/download actions, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, or source-link mutation.
- Phase 12M.6 adds source-aware safe attachment metadata display to unified archive detail for `WORKFLOW` snapshot metadata and linked `MANUAL` attachment rows. It is metadata-only/read-only and does not add preview/download actions, file URLs, signed URLs, token generation, filesystem access, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-link mutation, or route generation.
- Phase 12M.6b cleans unified detail UI labels and removes duplicated actor/date metadata from source-specific sections. It is UI-only and does not change API/service behavior, DB queries, preview/download, lifecycle mutation, cleanup, backfill, migrations, schema, source-link mutation, or route generation.
- Phase 12M.6c resolves canonical archive actor ids to display names for unified detail `Dibuat oleh` and `Diarsipkan oleh` fields. It remains read-only and does not add preview/download, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-section actor duplication, or route generation.
- Phase 12M.7 adds source-aware Preview/Download actions from unified archive detail for available `WORKFLOW` and linked `MANUAL` attachments through authorized server routes. It does not expose paths, storage roots, file URLs, signed URLs, token internals, or raw attachment metadata; `DIMUSNAHKAN` hides actions and stale action URLs must fail server-side.
- Phase 12M.8 documents a source-boundary review and human-smoke compatibility checklist for unified detail file access after 12M.7/12M.7b. It is documentation-only, separates expected behavior from actual human-smoke results, and does not change runtime source, schema, migrations, route generation, package files, DB rows, or storage files.
- Phase 12N.1 documents the unified archive lifecycle route inventory and target policy only. It does not implement lifecycle mutation, add routes/UI, change preview/download/file access, mutate rows, delete files, create migrations, run backfill, or alter storage cleanup behavior. During transition, canonical `arsip.arsip.status_arsip` is the unified list/detail lifecycle authority, while linked Manual Archive source status remains an edit/upload/file guard and drift must fail closed before future mutation.
- Phase 12N.2 adds a pure unified archive lifecycle helper/planner and focused unit tests only. It defines allowed transition plans, rejects Manual Archive source/canonical status drift, treats `DIMUSNAHKAN` as terminal, and always plans `fileDeletion: false`; it does not add routes/UI, execute DB writes, create migrations, change file access, delete files, or write audit logs.
- Phase 12N.3 adds `POST /api/arsiparis/arsip/$id/lifecycle` for non-destructive unified lifecycle transitions only: `mark_inactive` and `propose_destruction`. It requires `dms_session`, assigned `KEPALA_SUB_BAGIAN_UMUM`, centralized same-origin validation, server-side row reload, planner validation, and guarded transaction updates. It does not add UI buttons, audit writes, proposal approval, `DIMUSNAHKAN`, file deletion, storage cleanup, migrations, schema changes, or legacy route replacement.
- Phase 12N.4 documents destruction approval policy and the `DIMUSNAHKAN` safety plan only. It does not implement `approve_destruction`, `DIMUSNAHKAN` mutation, proposal bridging, audit writes, UI buttons, file deletion, snapshot clearing, storage cleanup, migrations, schema changes, file-access changes, or legacy proposal route changes. Future canonical-only `approve_destruction` must be accepted as a domain decision because it bypasses legacy proposal governance.
- Phase 12N.5 adds `approve_destruction` to `POST /api/arsiparis/arsip/$id/lifecycle` for canonical-only `USUL_MUSNAH -> DIMUSNAHKAN` after exact confirmation phrase and required reason validation. It updates canonical WORKFLOW status only, syncs linked MANUAL canonical/source statuses in one guarded transaction, and intentionally does not write audit rows, bridge legacy proposals, delete files, clear snapshots, change UI, change file helpers, create migrations, or modify legacy proposal routes.
- Phase 12N.6 adds unified detail page lifecycle buttons for non-destructive actions only: `AKTIF -> INAKTIF` and `INAKTIF -> USUL_MUSNAH`. Manual Kasubag movement is allowed for operational exceptions and does not require waiting for a scheduler. It does not expose `approve_destruction` or a `Musnahkan` UI button, and does not change APIs, list pages, file access, audit, storage, migrations, schema, route generation, or legacy proposal routes.
- Phase 12N.6b refines the 12N.6 UI only: `Aksi Lifecycle` renders below `Lampiran Arsip`, `mark_inactive` success redirects to `/arsiparis/inaktif`, and `propose_destruction` success redirects to `/arsiparis/usul-musnah`. It does not change lifecycle API behavior or expose destructive UI.
- Phase 12N.7 documents the future destructive approval UI policy only. It recommends `Musnahkan Arsip` only for `USUL_MUSNAH` after separate human approval, requires exact phrase `SETUJUI PEMUSNAHAN ARSIP` plus trimmed non-empty reason, recommends staying on detail with refreshed `DIMUSNAHKAN` metadata unless a destroyed list exists, and does not add runtime UI, API, file-access, storage, audit, schema, migration, route generation, or legacy route changes.
- Phase 12N.8 exposes destructive `Musnahkan Arsip` UI on unified detail only for `USUL_MUSNAH`, requires exact phrase `SETUJUI PEMUSNAHAN ARSIP` plus trimmed non-empty reason, sends only `approve_destruction` to the existing unified lifecycle API, stays on detail and refetches metadata after success, and intentionally does not delete files, clear snapshots, delete attachment rows, write audit logs, change legacy proposal routes, modify schema, run migrations, or run route generation.
- Phase 12N.8b hardens lifecycle confirmation copy only for `AKTIF -> INAKTIF`, `INAKTIF -> USUL_MUSNAH`, and `USUL_MUSNAH -> DIMUSNAHKAN`: users are told status cannot be returned through the current feature, `DIMUSNAHKAN` blocks preview/download, metadata remains visible to authorized users, and physical file deletion/storage cleanup is a separate future phase. It does not change lifecycle API behavior, request bodies, redirects, file access helpers, audit, storage files, schema, migrations, package files, route generation, or legacy proposal routes.
- Phase 12N.9 plans archive-native destruction audit only. Future audit should be canonical `arsip.arsip` based, cover `WORKFLOW` and `MANUAL` archives consistently, preserve metadata for future physical file deletion, and exclude paths, storage roots, tokens, raw attachment metadata, raw DB rows, SQL details, env values, sessions/cookies, and secrets. It does not create schema/migrations, write audit rows, change lifecycle API/UI/file access, delete files, clear snapshots, delete attachment rows, or modify legacy proposal routes.
- Phase 12N.10 adds an internal/manual-use source-aware physical file destruction helper for canonical archives that are already `DIMUSNAHKAN`. It supports WORKFLOW `lampiran_snapshot` and linked MANUAL attachment rows, preserves archive metadata rows and attachment metadata, returns safe counts/warnings only, rejects unsafe paths, treats missing files idempotently, and does not add UI/API/scheduler, audit rows, schema/migrations, route generation, broad cleanup, or legacy proposal route changes.
- Phase 12N.11 plans legacy proposal route compatibility cleanup only. Legacy proposal approval remains runtime-unchanged but must not be treated as authoritative unified destruction because it is proposal-id based, WORKFLOW-oriented, clears `lampiran_snapshot`, and directly deletes files outside the 12N.10 source-aware helper policy. It does not modify routes, UI, APIs, schema, migrations, storage files, audit, route generation, or roadmap order.
- Phase 12N.11b removes the obsolete legacy status-specific archive detail and mutation routes that were replaced by unified canonical archive detail and lifecycle. Current list pages remain intact and must link to `/arsiparis/arsip/$id`; lifecycle mutation must go through `POST /api/arsiparis/arsip/$id/lifecycle`. This closes the old proposal-id destructive route surface without deleting DB rows, files, snapshots, schema, migrations, list APIs, or storage metadata.
- Manual Archive parent metadata edit is locked for `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`; locked edits must return a safe conflict response.
- Future file access must go through authorized server/API boundaries and must block `DIMUSNAHKAN`, including stale token/path access.
- Future aggregate/export behavior must be metadata-only by default and must not include file contents, file URLs, signed token internals, storage roots, or physical paths.

### 6. Ketua Tim

- Ketua Tim status comes from `ketua_tim_assignments`.
- One kegiatan has only one active ketua tim.
- A user can be ketua tim for many kegiatan.
- Laporan kegiatan permission and badges depend on this assignment.

### 7. Penanggung Jawab Kinerja

- `PENANGGUNG_JAWAB_KINERJA` has one main menu/page: Laporan Kinerja.
- Laporan Kinerja is metadata-only and includes final document statuses `COMPLETED`, `TERSIMPAN`, and `ARCHIVED`.
- Laporan Kinerja excludes `DRAFT`, `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, and `NEED_REVISION`.
- Laporan Kinerja does not provide preview, download, signed URL, file URL, attachment content, export, or detail actions by default.
- Server/API RBAC must require assigned `PENANGGUNG_JAWAB_KINERJA`; `dms_active_role` is not authorization proof.
- `ADMIN` remains dedicated and is not automatically treated as `PENANGGUNG_JAWAB_KINERJA`.

---

## Storage And File Rules

Local filesystem storage is active.

Rules:

- No Supabase Storage fallback.
- No old Supabase data/file migration, copy, download, backfill, sync, or recovery.
- Missing old files must fail cleanly.
- Files live outside public/static serving.
- Preview/download must go through authorized API routes.
- File access must prevent path traversal and root escape.
- File access must not expose physical storage path/root.
- File access token internals must not be printed.
- Referenced active document/archive files must be protected from cleanup.
- `DIMUSNAHKAN` must block stale token/path access.
- Admin diagnostics/cleanup should report logical paths and safe counts only.

Path semantics:

```text
Pending:
{userId}/{timestamp}-{random}-{filename.ext}

Formal:
{userId}/{dokumenId}/{uuid.ext}
```

Rules:

- File upload may create pending paths.
- Submit/resubmit/update movement must move pending files to formal paths where scoped.
- `arsip.lampiran_snapshot` keeps snapshot metadata at archive time.
- Download/preview must re-check current document/archive state.

Helper sentral:

- `src/lib/dokumen-helpers.ts`
- `src/lib/storage-client.ts`
- `src/lib/utils/file.ts`
- `src/lib/file-helpers.ts`
- `src/lib/storage/*`

Manual archive attachments:

- Store logical storage paths in `arsip.manual_arsip_attachment.logical_path`.
- Store official attachment titles in `arsip.manual_arsip_attachment.judul_lampiran`; do not rely on metadata JSON as the only title source.
- Do not store physical storage paths or roots.
- Do not add public/static serving.
- Do not add Supabase Storage fallback or old file/data recovery.
- Future preview/download must re-check authorization and current manual archive lifecycle state.

---

## Canonical File Structure

Struktur aktual repo yang relevan:

```text
AGENTS.md
docs/
  migration/
  specs/
supabase/
  migrations/
  functions/
tests/
  e2e/
  unit/
src/
  router.tsx
  routeTree.gen.ts
  styles.css
  config/
  db/
  hooks/
  components/
  lib/
    auth.ts
    auth-state.ts
    fsm.ts
    constants/
    db/
    dokumen/
    schemas/
    storage/
    types/
    utils/
  routes/
    __root.tsx
    index.tsx
    login.tsx
    forbidden.tsx
    profile.tsx
    dokumen/
    pegawai/
    ppk/
    bendahara/
    arsiparis/
    penanggung-jawab-kinerja/
    admin.tsx
    admin.index.tsx
    admin.master-data.*.tsx
    api/
```

Manual archive schema files:

- `src/db/schema/arsip/manual-arsip.ts`
- `drizzle/0003_manual_archive_schema.sql`
- `drizzle/0005_canonical_archive_schema_foundation.sql`

### Route Notes

- root route remains `src/routes/__root.tsx`.
- `src/routes/dokumen/*` is legacy/compatibility path toward Pegawai flow.
- admin pages use flat file pattern such as `admin.master-data.user.tsx`.
- Do not modify `src/routeTree.gen.ts` unless the phase explicitly allows route generation.

---

## Route And Ownership Map

### Pegawai

UI utama:

- `/`
- `/pegawai/dokumen`
- `/pegawai/dokumen/aju`
- `/pegawai/dokumen/$id`
- `/pegawai/dokumen/$id/edit`
- `/pegawai/dokumen/$id/revisi`
- `/pegawai/laporan/saya`
- `/pegawai/laporan/kegiatan`

API utama:

- `/api/dokumen`
- `/api/dokumen/submit`
- `/api/dokumen/$id`
- `/api/dokumen/$id/submit`
- `/api/upload`
- `/api/laporan/saya`
- `/api/laporan/kegiatan`

### PPK

UI utama:

- `/ppk`
- `/ppk/inbox`
- `/ppk/tervalidasi`
- `/ppk/ditolak`
- `/ppk/revisi`
- `/ppk/dokumen/$id`
- `/ppk/dokumen/$id/resubmit`

API utama:

- `/api/ppk/inbox`
- `/api/ppk/tervalidasi`
- `/api/ppk/ditolak`
- `/api/ppk/revisi`
- `/api/ppk/dokumen/$id`
- `/api/ppk/dokumen/$id/approve`
- `/api/ppk/dokumen/$id/reject`
- `/api/ppk/resubmit/$id`
- `/api/ppk/kembalikan/$id`

### Bendahara

UI utama:

- `/bendahara`
- `/bendahara/inbox`
- `/bendahara/ditolak`
- `/bendahara/selesai`
- `/bendahara/dokumen/$id`

API utama:

- `/api/bendahara/inbox`
- `/api/bendahara/ditolak`
- `/api/bendahara/selesai`
- `/api/bendahara/dokumen/$id`
- `/api/bendahara/dokumen/$id/approve`
- `/api/bendahara/dokumen/$id/reject`

### Kepala Sub Bagian Umum

Route namespace remains `/arsiparis` for compatibility; the internal role name is `KEPALA_SUB_BAGIAN_UMUM`.

UI utama:

- `/arsiparis`
- `/arsiparis/inbox`
- `/arsiparis/dokumen/$id`
- `/arsiparis/aktif`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/arsip/$id`
- `/arsiparis/klasifikasi`
- `/arsiparis/search`

API utama:

- `/api/arsiparis/inbox`
- `/api/arsiparis/dokumen.$id`
- `/api/arsiparis/dokumen.$id.archive`
- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`
- `/api/arsiparis/arsip/$id`
- `/api/arsiparis/arsip/$id/lifecycle`
- `/api/arsiparis/search`
- `/api/arsiparis/klasifikasi/*`
- `/api/arsiparis/manual-arsip/categories`
- `/api/arsiparis/manual-arsip`
- `/api/arsiparis/manual-arsip/$id`
- `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview`
- `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download`

### Penanggung Jawab Kinerja

UI utama:

- `/penanggung-jawab-kinerja`
- `/penanggung-jawab-kinerja/laporan-kinerja`

API utama:

- `/api/laporan/kinerja`

Rules:

- `/penanggung-jawab-kinerja/laporan-kinerja` is the default route for `PENANGGUNG_JAWAB_KINERJA`.
- The role has only the Laporan Kinerja navigation item.
- The API returns safe final-document metadata only, with a conservative default limit.
- The API must not expose physical paths, storage roots, signed token internals, file URLs, attachment contents, SQL, or secrets.

### Admin

UI utama:

- `/admin`
- `/admin/master-data/user`
- `/admin/master-data/fungsi`
- `/admin/master-data/kegiatan`
- `/admin/master-data/jenis`
- `/admin/master-data/jenis-dokumen`
- `/admin/master-data/kategori`
- `/admin/master-data/detail`
- `/admin/master-data/kelengkapan`

API utama:

- `/api/users/*`
- `/api/master-fungsi*`
- `/api/master-kegiatan*`
- `/api/master-jenis*`
- `/api/master-jenis-dokumen*`
- `/api/master-kategori*`
- `/api/master-detail*`
- `/api/master-kelengkapan*`
- `/api/ketua-tim/*`
- `/api/admin/analyze-storage`
- `/api/admin/cleanup-orphan-files`

---

## Central Modules

Kalau menyentuh domain inti, baca file-file ini dulu:

- `src/components/layout/AppLayout.tsx`
- `src/config/navigation.ts`
- `src/lib/auth.ts`
- `src/lib/auth-state.ts`
- `src/lib/fsm.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/master-data.ts`
- `src/lib/user-helpers.ts`
- `src/lib/security/same-origin.ts`
- `src/lib/storage/*`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/routes/api/files/access.ts`
- `src/routes/api/admin/cleanup-orphan-files.ts`

---

## Protected Files And Commands

Hard rules:

- Do not modify `.env` or `.env.migration`.
- Do not print secrets/env values, DB URLs, storage roots, password hashes, plaintext passwords, session tokens, cookie values, CSRF tokens, file tokens, signed file tokens, or physical paths.
- Do not modify `src/routeTree.gen.ts` unless the phase explicitly allows route generation.
- Do not modify `package.json` or `pnpm-lock.yaml` unless the phase explicitly allows package changes.
- Do not modify DB/drizzle/supabase folders unless the phase explicitly allows it.
- Do not run broad tests/build/E2E/DB scripts/route generation unless requested by the phase or human.
- Do not run firewall/network commands.
- Do not run backup/restore commands unless explicitly requested and scoped.
- Do not run destructive storage cleanup unless explicitly requested and scoped.
- Prefer lightweight audits and targeted tests.
- Use `pnpm` only.
- In PowerShell examples, quote paths containing `$`, for example `'src/routes/api/dokumen/$id/submit.ts'`.

Before documentation/governance edits that must stay isolated, run:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

If unrelated changes exist, stop and report that they must be committed, stashed, reverted, or explicitly approved before continuing.

---

## Commit And Review Policy

Rules:

- Do not commit unless the human explicitly asks.
- Do not approve a commit from Codex summary alone.
- Avoid `git add -A` unless all changes are confirmed in scope.
- If changes are too broad or out of scope, suggest stash/revert rather than mixing scopes.
- Never revert user changes unless explicitly requested.

Minimum review checks before asking for commit approval:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

Also check:

- protected file diffs
- relevant targeted diffs/tests
- package diff if package files changed
- route generation diff if routes changed
- docs and constitution alignment if behavior changed

Protected diff checks for migration/governance phases:

```bash
git diff -- .env .env.migration
git diff -- src
git diff -- tests
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

---

## Testing Expectations

Default:

- Prefer smallest relevant tests first.
- For workflow/auth/storage changes, run targeted unit/API checks where available.
- Do not run broad tests/build/E2E unless the phase or human requests it.
- If tests are not run, state that explicitly.

Relevant checks by area:

- FSM/workflow: `tests/fsm.test.ts`
- submit flow: `tests/e2e/submit-flow.spec.ts` when explicitly requested
- approval flow: `tests/e2e/approval-flow.spec.ts` when explicitly requested
- user management: `tests/e2e/spec-06-user-management.spec.ts` when explicitly requested
- storage/file helpers: targeted unit tests under `tests/unit/storage/`

---

## Wording Policy

Forbidden unless explicitly proven and human-approved:

- `production ready`
- `go-live approved`
- `go live approved`
- `fully secure`
- `Supabase fully removed from repository`
- `fully removed from repository`
- `LAN ready` as an absolute phrase

Preferred wording:

- `partial/bounded release handoff`
- `human-controlled internal handoff`
- `active Supabase runtime/package dependency retired`
- `historical Supabase artifacts remain`
- `implemented pending human retest`
- `implemented and human-smoked`
- `trusted HTTP LAN is bounded/internal only`
- `HTTPS plus Secure dms_session remains preferred final posture`

When describing 11H.3:

- Say what is allowed: bounded human-controlled internal/local/LAN handoff.
- Say what is not approved: public production, public internet exposure, go-live, operational certification, security certification, full Supabase repository removal.

---

## Practical Rules For Future Changes

1. If adding/changing DB schema:
   - Update Drizzle schema/migrations first.
   - Update docs and this file if behavior/governance changes.
   - Update Zod schema/helper/API logic.
   - Keep historical Supabase migrations as reference only unless a phase explicitly says otherwise.

2. If adding/changing status:
   - Update `src/lib/constants/document-status.ts`.
   - Update `src/lib/fsm.ts`.
   - Update FSM tests.
   - Update badges/filters/pages that depend on status.
   - Update this file.

3. If changing routes:
   - Update `src/lib/constants/routes.ts`.
   - Update `src/config/navigation.ts`.
   - Update legacy redirect/compatibility if needed.
   - Regenerate `src/routeTree.gen.ts` only when phase explicitly allows route generation.
   - Update this file.

4. If changing archive lifecycle:
   - Check active archive endpoints.
   - Check file-access behavior after `DIMUSNAHKAN`.
   - Check `arsip.lampiran_snapshot` preservation/destruction semantics.
   - Update docs and this file.

5. If changing auth/role resolution:
   - Check `AppLayout`.
   - Check `auth.ts`.
   - Check local session helpers.
   - Check server API role checks.
   - Preserve `dms_session` as auth boundary and `dms_active_role` as UX-only.

6. If changing storage/file access:
   - Preserve no static public storage serving.
   - Preserve no Supabase Storage fallback.
   - Revalidate authorization and current archive state.
   - Block `DIMUSNAHKAN`.
   - Avoid physical path/root/token leakage.

---

## Next Workstreams

Allowed future directions, each as separate scoped work:

- New product feature development after the post-migration handoff boundary is respected.
- Maintenance hardening:
  - HTTPS plus `Secure` cookie final posture
  - reverse proxy
  - persistent/distributed rate-limit
  - login audit/alerting
  - full CSRF token framework if deployment expands
  - broader throttling for upload/workflow/archive/admin/file-token routes
  - E2E and regression automation
- Historical Supabase cleanup:
  - `.env.example` Supabase key names
  - stale tests
  - old comments/type residue
  - docs wording
  - `supabase/` retention/removal policy
- Operations:
  - backup schedule and retention
  - periodic restore rehearsal
  - final HTTPS/certificate/reverse-proxy decision
  - archive scheduler replacement

Do not mix these workstreams unless the human explicitly approves a combined phase.

---

## Status

- Last updated: 2026-05-25
- App mode: Active development after local migration
- Architecture mode: TanStack Start SPA-heavy app with local PostgreSQL, Drizzle, local `dms_session` auth, and local filesystem storage
- Handoff mode: partial/bounded release handoff for human-controlled internal/local/LAN use
- Supabase mode: active runtime/package dependency retired; historical artifacts remain
- Constitution accuracy target: synced to post-11H.3 migration state and implemented features

---

## graphify

This project may have a Graphify knowledge graph at `graphify-out/`.

Rules:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture/codebase exploration.
- If `graphify-out/wiki/index.md` exists, use it as the first navigation map before reading many raw source files.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` when `graphify-out/graph.json` exists.
- If Graphify output does not exist or is stale, fall back to targeted `git grep`, direct file reads, and the project roadmap/constitution.
- Do not treat Graphify as the sole authority for security-sensitive work. Verify auth, RBAC, storage, workflow, and file-access behavior directly in source files before making changes.
- After modifying code files in a Graphify-enabled session, run `graphify update .` when practical to keep the graph current. Documentation-only changes do not require Graphify update unless the human requests it.
