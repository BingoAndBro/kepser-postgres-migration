# AGENTS.md - Project Constitution: DMS (Dynamic Document Workflow Management System)
> File ini adalah hukum kerja repo. Semua perubahan schema, routing, workflow, dan boundary data harus mengacu ke file ini. Jika realita aplikasi berubah, update file ini dulu, baru update kode.

---

## North Star
> Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh pihak yang berwenang.

Tujuan MVP tetap sama: menghapus kebingungan status dokumen, memperjelas inbox per role, dan menjaga jejak audit dari submit sampai arsip atau pemusnahan.

---

## Runtime Reality Check

Kondisi aplikasi per 2026-05-12:

- Framework tetap `TanStack Start`, tetapi root route saat ini memakai `ssr: false`.
- Runtime aktual lebih dekat ke SPA client-heavy daripada SSR penuh.
- Auth bootstrap utama terjadi di `src/components/layout/AppLayout.tsx` melalui Supabase browser client.
- Enforcement akses tetap harus ada di server route/API, walaupun layout juga melakukan guard client-side.
- Source of truth schema saat ini tersebar:
  - `supabase/migrations/` = sumber kebenaran database yang paling lengkap
  - `src/lib/db/schema.ts` = mirror Drizzle parsial, belum mencakup semua tabel produksi

Konstitusi ini mengikuti kondisi aktual repo, bukan rencana lama.

---

## Tech Stack

| Layer | Teknologi | Status |
|---|---|---|
| Framework | TanStack Start | aktif |
| Router | TanStack React Router file-based | aktif |
| Language | TypeScript | wajib |
| Database | Supabase PostgreSQL | aktif |
| Auth | Supabase Auth | aktif |
| Storage | Supabase Storage | aktif |
| ORM | Drizzle ORM | parsial untuk mirror schema |
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
- commit `pnpm-lock.yaml`
- referensi praktik: `docs/pnpm-best-practices.md`

---

## Canonical Domain Model

### Role

Role yang dipakai aplikasi:

```ts
type Role = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS' | 'ADMIN'
```

Canonical constants ada di:

- `src/lib/constants/roles.ts`
- `src/lib/types/auth.ts`

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

Catatan penting:

- `TERSIMPAN` dipakai untuk dokumen Non-Material yang selesai disimpan tanpa masuk alur approval material.
- Transisi FSM formal tetap dipusatkan di `src/lib/fsm.ts`.
- `TERSIMPAN` saat ini dihasilkan oleh handler submit Non-Material, bukan oleh `transition()` FSM umum.

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

Catatan:

- migrasi lama pernah mengenal `VERIFIKASI_PENYUSUTAN`
- status itu sudah dihapus oleh migrasi berikutnya
- kode dan endpoint aktif sekarang bergerak langsung:
  - `AKTIF -> INAKTIF`
  - `INAKTIF -> USUL_MUSNAH`
  - `USUL_MUSNAH -> DIMUSNAHKAN` atau kembali ke `INAKTIF`

---

## Database Source Of Truth

Urutan prioritas saat membaca atau mengubah schema:

1. `supabase/migrations/`
2. endpoint dan helper yang memakai tabel tersebut
3. `src/lib/db/schema.ts`

Jangan menganggap `src/lib/db/schema.ts` sudah lengkap. Tabel produksi yang sudah dipakai aplikasi lebih banyak daripada yang dimirror di Drizzle.

### Tabel yang Sudah Aktif di Repo

#### RBAC dan User

- `roles`
- `user_roles`
- `user_status`

#### Master Data Dokumen

- `master_fungsi`
- `master_kegiatan`
- `master_kelengkapan_dokumen`
- `master_jenis_permintaan`
- `master_kategori_permintaan`
- `master_detail_permintaan`
- `master_jenis_dokumen`
- `ketua_tim_assignments`

#### Workflow Dokumen

- `dokumen_transaksi`
- `log_aktivitas`

#### Arsip

- `arsip`
- `master_klasifikasi_arsip`
- `arsip_usul_musnah`

### Catatan Schema Penting

- `ketua_tim_assignments` saat ini unik per `kegiatan_id`, bukan unik `(user_id, kegiatan_id)`
- `dokumen_transaksi` sudah memuat:
  - `nominal_realisasi`
  - `is_non_material`
  - `jenis_dokumen_id`
  - chain material: `jenis_permintaan_id`, `kategori_permintaan_id`, `detail_permintaan_id`
- `arsip` sudah memuat metadata retensi dan lifecycle:
  - `retensi_aktif`
  - `retensi_inaktif`
  - `masa_aktif_berakhir`
  - `masa_inaktif_berakhir`
  - `status_arsip`
  - `lampiran_snapshot`
  - `musnah_at`
  - `musnah_by`
  - `musnah_catatan`
  - `nominal_realisasi`
- `log_aktivitas` tetap append-only secara kontrak

---

## Architectural Invariants

1. **Schema truth lives in migrations first.**
   - Ubah `supabase/migrations/` dulu untuk perubahan database.
   - Setelah itu baru sinkronkan helper, Zod schema, dan mirror Drizzle bila perlu.

2. **FSM is the only legal source for status transitions.**
   - Semua transisi `dokumen_transaksi.status` harus memakai `src/lib/fsm.ts`.
   - Tidak boleh ada update status manual tanpa reasoning yang setara dengan FSM.
   - Jika ada state baru, update constants, types, tests, dan file ini.

3. **Audit trail is sacred.**
   - `log_aktivitas` append-only.
   - Tidak boleh ada `UPDATE` atau `DELETE` ke tabel ini.

4. **Zod at every boundary.**
   - Input request, payload mutasi, dan response shape yang penting harus divalidasi oleh schema di `src/lib/schemas/`.

5. **No magic strings.**
   - Route path gunakan constants di `src/lib/constants/routes.ts`
   - Role gunakan constants di `src/lib/constants/roles.ts`
   - Table name gunakan constants di `src/lib/constants/tables.ts` bila menyentuh shared code

6. **Secrets only in env.**
   - Tidak ada hardcoded secret di `src/`
   - Gunakan `.env`

7. **Server is the authority for RBAC.**
   - Client boleh menyembunyikan UI.
   - Keputusan final akses harus diverifikasi di server handler atau helper server.

8. **Prefer server/API boundaries for new work.**
   - Repo saat ini masih punya beberapa helper browser yang baca/tulis Supabase langsung.
   - Untuk fitur baru, utamakan API route atau server helper kecuali ada alasan kuat mempertahankan pola lama.

9. **Update docs before behavior changes.**
   - Jika SOP atau workflow berubah, update dokumen terkait di `docs/` dan `AGENTS.md` sebelum atau bersamaan dengan kode.

---

## Behavioral Rules

### 1. Auth dan Active Role

- user login lewat Supabase Auth
- role aktif disimpan di cookie `dms_active_role`
- helper auth utama:
  - `src/lib/auth.ts`
  - `src/lib/auth-state.ts`
- bootstrap auth client-side terjadi di `src/components/layout/AppLayout.tsx`
- `ADMIN` tetap diperlakukan sebagai akun dedicated

### 2. Role Switcher

- jika user punya lebih dari satu role, role bisa diganti dari header
- route default per role ditentukan oleh:
  - `src/lib/constants/routes.ts`
  - `src/config/navigation.ts`

### 3. Workflow Material

Alur approval material:

```text
DRAFT
-> IN_PPK_VALIDATION
-> IN_BENDAHARA_APPROVAL
-> COMPLETED
-> ARCHIVED
```

Penolakan:

- PPK reject -> `NEED_REVISION` target `USER`
- Bendahara reject -> `NEED_REVISION` target `PPK`
- PPK dapat `KEMBALIKAN` dokumen revisi-target-PPK kembali ke Pegawai

### 4. Workflow Non-Material

Dokumen Non-Material saat ini mengikuti shortcut:

```text
DRAFT -> TERSIMPAN
```

Implikasi:

- tidak masuk approval PPK/Bendahara
- tetap disimpan sebagai dokumen transaksi
- tetap bisa tampil di laporan tertentu

### 5. Arsip Flow

Setelah dokumen `COMPLETED`:

- Arsiparis dapat mengarsipkan -> dokumen menjadi `ARCHIVED`, record `arsip` dibuat dengan `status_arsip='AKTIF'`
- Arsiparis juga memiliki aksi skip di FSM, tetapi dokumen tetap `COMPLETED`
- lifecycle lanjutan dikelola pada tabel `arsip`

### 6. Ketua Tim

- status ketua tim berasal dari `ketua_tim_assignments`
- satu kegiatan hanya punya satu ketua tim aktif
- user bisa menjadi ketua tim untuk banyak kegiatan
- permission laporan kegiatan dan badge tertentu bergantung pada assignment ini

---

## Canonical File Structure

Struktur aktual repo yang relevan:

```text
D:\GitHub\mvp\
|-- AGENTS.md
|-- task_plan.md
|-- findings.md
|-- progress.md
|-- REFACTORING_PLAN.md
|-- README.md
|-- SETUP.md
|-- docs/
|   |-- routing-sop.md
|   |-- src-architecture-summary.md
|   |-- ringkasan_arsitektur.md
|   |-- pnpm-best-practices.md
|   |-- drizzle-zod-best-practices.md
|   `-- specs/
|-- supabase/
|   |-- migrations/
|   `-- functions/
|       `-- arsip-retensi/
|-- tests/
|   |-- e2e/
|   `-- unit/
|-- src/
|   |-- router.tsx
|   |-- routeTree.gen.ts
|   |-- styles.css
|   |-- config/
|   |   `-- navigation.ts
|   |-- hooks/
|   |-- components/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- dokumen/
|   |   |   `-- form/
|   |   |-- laporan/
|   |   |-- layout/
|   |   `-- ui/
|   |-- lib/
|   |   |-- api-client.ts
|   |   |-- api-mutation.ts
|   |   |-- auth.ts
|   |   |-- auth-state.ts
|   |   |-- guards.ts
|   |   |-- fsm.ts
|   |   |-- dokumen-helpers.ts
|   |   |-- storage-client.ts
|   |   |-- user-helpers.ts
|   |   |-- master-data.ts
|   |   |-- master-data/
|   |   |-- dokumen/
|   |   |-- constants/
|   |   |-- db/
|   |   |-- schemas/
|   |   |-- types/
|   |   `-- utils/
|   `-- routes/
|       |-- __root.tsx
|       |-- index.tsx
|       |-- login.tsx
|       |-- forbidden.tsx
|       |-- profile.tsx
|       |-- dokumen/
|       |-- pegawai/
|       |-- ppk/
|       |-- bendahara/
|       |-- arsiparis/
|       |-- admin.tsx
|       |-- admin.index.tsx
|       |-- admin.master-data.*.tsx
|       `-- api/
|           |-- auth/
|           |-- dokumen/
|           |-- ppk/
|           |-- bendahara/
|           |-- arsiparis/
|           |-- users/
|           |-- ketua-tim/
|           `-- admin/
`-- .tmp/
```

### Route Notes

- route root memakai `src/routes/__root.tsx` dengan `ssr: false`
- `src/routes/dokumen/*` adalah jalur legacy/kompatibilitas menuju flow Pegawai
- halaman admin memakai pola flat file:
  - `admin.master-data.user.tsx`
  - `admin.master-data.fungsi.tsx`
  - dst

---

## Route and Ownership Map

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

### Arsiparis

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
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`

---

## Storage Patterns

Pola path storage lampiran masih dua tahap:

```text
Pending:
{userId}/{timestamp}-{random}-{filename.ext}

Formal:
{userId}/{dokumenId}/{uuid.ext}
```

Aturan:

- file boleh upload ke path pending
- submit atau resubmit harus memindahkan file ke path formal
- snapshot lampiran saat arsip disimpan di tabel `arsip.lampiran_snapshot`
- akses preview/download harus memperhatikan arsip yang sudah `DIMUSNAHKAN`

Helper sentral:

- `src/lib/dokumen-helpers.ts`
- `src/lib/storage-client.ts`
- `src/lib/utils/file.ts`
- `src/lib/file-helpers.ts`

---

## Testing Expectations

Sebelum menganggap perubahan aman:

- jalankan unit test yang relevan dengan `pnpm test`
- untuk perubahan workflow atau auth utama, prioritaskan cek:
  - `tests/fsm.test.ts`
  - `tests/e2e/submit-flow.spec.ts`
  - `tests/e2e/approval-flow.spec.ts`
  - `tests/e2e/spec-06-user-management.spec.ts`

Jika tidak sempat menjalankan test, nyatakan secara eksplisit.

---

## Practical Rules For Future Changes

1. Jika menambah tabel baru:
   - buat migration Supabase
   - update AGENTS ini
   - update Zod schema/helper yang terdampak
   - mirror ke Drizzle bila tabel itu memang perlu dipakai dari layer tersebut

2. Jika menambah status baru:
   - update `src/lib/constants/document-status.ts`
   - update `src/lib/fsm.ts`
   - update test FSM
   - update page badge/filter yang bergantung pada status
   - update file ini

3. Jika mengubah route:
   - update `src/lib/constants/routes.ts`
   - update `src/config/navigation.ts`
   - update legacy redirect bila masih perlu backward compatibility
   - update file ini

4. Jika mengubah arsip lifecycle:
   - cek migration dan function `supabase/functions/arsip-retensi/index.ts`
   - cek endpoint aktif/inaktif/usul-musnah
   - cek behavior download preview setelah musnah

5. Jika mengubah auth atau role resolution:
   - cek `AppLayout`
   - cek `auth.ts`
   - cek `user_status`
   - cek API role checks

---

## Status

- Last updated: 2026-05-12
- App mode: Active development
- Architecture mode: TanStack Start SPA-heavy with Supabase-backed server routes
- Constitution accuracy target: synced to current repo structure and implemented features

## graphify

This project may have a Graphify knowledge graph at `graphify-out/`.

Rules:
- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture/codebase exploration.
- If `graphify-out/wiki/index.md` exists, use it as the first navigation map before reading many raw source files.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` when `graphify-out/graph.json` exists.
- If Graphify output does not exist or is stale, fall back to targeted `git grep`, direct file reads, and the project roadmap/constitution.
- Do not treat Graphify as the sole authority for security-sensitive work. Verify auth, RBAC, storage, workflow, and file-access behavior directly in source files before making changes.
- After modifying code files in a Graphify-enabled session, run `graphify update .` when practical to keep the graph current.
