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
- `manual_arsip_category` is separate from `master_klasifikasi_arsip`; `master_klasifikasi_arsip` remains the archival classification hierarchy.
- One `manual_arsip` parent row represents one report/archive record. `manual_arsip_attachment` child rows must not be counted as additional reports in future aggregates.
- Manual archive attachments are optional, and the schema supports many attachments per parent row.
- `manual_arsip_attachment.judul_lampiran` is the official attachment title column; existing rows are backfilled from `original_filename` by Phase 12J.2a.
- `manual_arsip.nominal_realisasi` is nullable at the DB layer; future API/UI may enforce requiredness only after business confirmation.
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
- `nominal_realisasi` is nullable in the database for flexibility; API/UI requiredness remains a future business-rule decision.
- File attachment is optional, and one parent row may have many attachment child rows.
- Each manual archive attachment has official title column `judul_lampiran`; Phase 12J.2a backfills existing values from `original_filename`.
- After Phase 12J.2b, the manual archive attachment upload API requires one explicit `judul_lampiran` title per uploaded file and must not fall back from `original_filename`.
- One `manual_arsip` parent row counts as one report regardless of attachment count.
- Lifecycle values are `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`.
- Phase 12G adds schema/data-model foundation only. Do not add runtime UI/API/upload/preview/download/lifecycle/export behavior unless a future phase explicitly scopes it.
- Phase 12H adds minimal runtime API foundation for category list, parent list, create-without-upload, and detail. It does not add UI, upload, preview/download, file tokens, lifecycle transitions, aggregate report, Excel export, hard delete, schema changes, migrations, or seed changes.
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
- `/arsiparis/klasifikasi`
- `/arsiparis/search`

API utama:

- `/api/arsiparis/inbox`
- `/api/arsiparis/dokumen.$id`
- `/api/arsiparis/dokumen.$id.archive`
- `/api/arsiparis/aktif`
- `/api/arsiparis/aktif.$id`
- `/api/arsiparis/aktif.$id/pindahkan`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/inaktif.$id`
- `/api/arsiparis/inaktif.$id/musnahkan`
- `/api/arsiparis/usul-musnah`
- `/api/arsiparis/usul-musnah.$id`
- `/api/arsiparis/search`
- `/api/arsiparis/klasifikasi/*`
- `/api/arsiparis/manual-arsip/categories`
- `/api/arsiparis/manual-arsip`
- `/api/arsiparis/manual-arsip/$id`

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

- Last updated: 2026-05-23
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
