# Implementation Plan: 03 — Submit Flow

## Overview

Spec 03 membangun kemampuan submit dokumen dari sisi Pegawai. Secara garis besar:

1. **Database**: Tabel `dokumen_transaksi` + `log_aktivitas` + Supabase Storage bucket
2. **API Layer**: Server functions untuk CRUD dokumen + upload lampiran + download signed URL
3. **UI Layer**: 4 halaman baru — form multi-step, list dokumen saya, detail, edit-resubmit
4. **Logic Layer**: FSM transitions, kelengkapan dinamis, validasi submit

Arsitektur mengikuti pattern yang sudah ada di Spec 01-02: TanStack Start file-based routes, `createServerFn` untuk server logic, Zod untuk validation, Drizzle ORM untuk query, Supabase Auth untuk session.

---

## Architecture

```
Client (React)
  ├── /dokumen/saya           → Route: list dokumen saya
  ├── /dokumen/aju            → Route: multi-step form
  ├── /dokumen/[id]           → Route: detail dokumen
  └── /dokumen/[id]/edit      → Route: edit & resubmit

Server (TanStack Start)
  ├── /api/dokumen            → ServerFn: GET list, POST create
  ├── /api/dokumen/[id]       → ServerFn: GET detail, PATCH update
  ├── /api/dokumen/[id]/submit → ServerFn: POST submit/resubmit
  └── /api/upload             → ServerFn: POST upload file
  └── /api/dokumen/[id]/download/[index] → ServerFn: GET signed URL

Database (Supabase Postgres)
  ├── dokumen_transaksi        → Tabel utama
  ├── log_aktivitas           → Audit trail
  └── Storage: dokumen-lampiran → File attachments

Dependencies:
  ├── src/lib/fsm.ts          → FSM transitions (Spec 01 sudah ada)
  ├── src/lib/auth.ts         → Auth guards (Spec 01 sudah ada)
  ├── src/lib/supabase-admin.ts → Admin client (Spec 01 sudah ada)
  ├── src/lib/schemas/master-data.ts → Zod schemas (Spec 02 sudah ada)
  └── master_fungsi, master_kegiatan, master_kelengkapan_dokumen (Spec 02 sudah ada)
```

---

## Implementation Steps

### Step 1: Database Migration & Schema

**What:** Buat tabel `dokumen_transaksi`, `log_aktivitas`, dan Supabase Storage bucket + RLS policies.

**Why:** Fondasi data. Tanpa ini, tidak ada tempat menyimpan dokumen yang diajukan.

**How:**
1. Edit `src/lib/db/schema.ts` — tambahkan Drizzle definitions untuk `dokumenTransaksi` dan `logAktivitas`
2. Generate migration: `pnpm drizzle-kit generate` → buat `003_dokumen_transaksi.sql`
3. Review generated SQL, edit jika perlu
4. Apply: `pnpm drizzle-kit push` (dev) atau jalankan SQL di Supabase Dashboard
5. Buat Storage bucket via Supabase Dashboard → Storage → New Bucket `dokumen-lampiran` (private)
6. Tambah RLS policies untuk Storage bucket

**Files affected:**
- `src/lib/db/schema.ts` — tambah tabel dokumen_transaksi + log_aktivitas
- `supabase/migrations/003_dokumen_transaksi.sql` — generated migration
- RLS policies (via Supabase Dashboard atau raw SQL)

**Dependencies:** Spec 01 (auth.users FK) + Spec 02 (master_fungsi, master_kegiatan, master_kelengkapan FK)

---

### Step 2: Zod Schemas & DB Helpers

**What:** Buat Zod schemas untuk dokumen + lampiran, dan Drizzle query helpers.

**Why:** Semua API input harus divalidasi dengan Zod (AGENTS.md Invariant #3). DB helpers untuk reuse di berbagai server functions.

**How:**
1. Buat `src/lib/schemas/dokumen.ts`:
   - `createDokumenSchema` — validate input submit (fungsi_id, kegiatan_id, is_ketua_tim, tahun, tanggal)
   - `updateDokumenSchema` — validate lampiran update (lampiran_urls)
   - `submitDokumenSchema` — validate submit action
   - `lampiranUrlSchema` — validate single lampiran entry
2. Buat `src/lib/db/helpers/dokumen.ts`:
   - `getDokumenById(id)` — with relations (fungsi, kegiatan, lampiran)
   - `getDokumenByUser(userId)` — list user's documents
   - `createDokumen(data)` — insert with returning
   - `updateDokumen(id, data)` — update lampiran_urls
   - `insertLog(dokumenId, userId, aksi, catatan?)` — append log entry
3. Update `src/lib/schemas/master-data.ts` jika perlu menambah schema terkait

**Files affected:**
- `src/lib/schemas/dokumen.ts` — baru
- `src/lib/db/helpers/dokumen.ts` — baru
- `src/lib/db/schema.ts` — sudah diupdate di Step 1

**Dependencies:** Step 1 (tabel harus ada dulu)

---

### Step 3: API Endpoints — Dokumen CRUD & Submit

**What:** Server functions untuk list, create, get, update dokumen, plus submit/resubmit.

**Why:** Core API — semua UI membaca dan menulis melalui endpoints ini.

**How:**

**3a. GET /api/dokumen** — List dokumen saya
- Gunakan `requireAuth()` untuk dapat user session
- Query `db.query.dokumenTransaksi.findMany({ where: eq(createdBy, userId), with: { fungsi, kegiatan } })`
- Return array sorted by createdAt desc

**3b. POST /api/dokumen** — Create dokumen baru
- Validasi input dengan `createDokumenSchema`
- Judul auto: `[Nama Kegiatan] [Tahun] [Nama Pegawai]`
- Ambil `user_metadata.nama_lengkap` dari Supabase untuk nama pegawai
- Initial status = `DRAFT` (belum di-submit)
- Insert ke `dokumen_transaksi` → return created record

**3c. GET /api/dokumen/[id]** — Detail dokumen
- `requireAuth()` → check ownership (`created_by = userId`) atau user punya role approver
- Return full record dengan fungsi, kegiatan, lampiran_urls

**3d. PATCH /api/dokumen/[id]** — Update lampiran (resubmit prep)
- Cek: `status = NEED_REVISION` AND `revision_target = 'USER'` AND `created_by = userId`
- Update `lampiran_urls` + `updated_at`
- Jika validasi gagal, throw error yang jelas

**3e. POST /api/dokumen/[id]/submit** — Submit / Resubmit
- Cek status:
  - Jika `DRAFT` → validasi semua lampiran required terisi → FSM `transition(status, 'SUBMIT', 'PEGAWAI')`
  - Jika `NEED_REVISION` + `revision_target = 'USER'` → FSM `transition(status, 'RESUBMIT', 'PEGAWAI')`
  - Jika tidak → return error 400
- FSM return `{ success, newStatus, newCurrentStep }`
- Update status + current_step di DB
- Insert log_aktivitas entry: `aksi = 'SUBMIT'` atau `'RESUBMIT'`
- Return updated record

**Files affected:**
- `src/routes/api/dokumen/index.ts` — GET list + POST create
- `src/routes/api/dokumen/[id].ts` — GET + PATCH
- `src/routes/api/dokumen/[id]/submit.ts` — POST submit/resubmit

**Dependencies:** Step 1 (tabel) + Step 2 (schemas + helpers) + `src/lib/fsm.ts` (Spec 01)

---

### Step 4: API Endpoints — Upload & Download

**What:** Server function untuk upload file ke Supabase Storage + download via signed URL.

**Why:** File harus sampai ke Supabase Storage dengan path yang terstruktur, dan hanya bisa di-download via signed URL.

**How:**

**4a. POST /api/upload** — Upload file
- Terima `FormData`: `{ file: File, kelengkapan_id: string, dokumen_id: string, nama_dokumen: string }`
- Validasi: file type (PDF/DOC/DOCX/XLS/XLSX) + size (max 10MB)
- Generate path: `[userId]/[dokumenId]/[kelengkapanId]_[timestamp]_[originalName]`
- Upload via `supabaseAdmin.storage.from('dokumen-lampiran').upload(path, fileBuffer)`
- Return: `{ url: path, nama: nama_dokumen, kelengkapan_id, uploaded_at }`
- Simpan URL ini di client state (bukan langsung ke DB — DB di-update saat submit/resubmit)

**4b. GET /api/dokumen/[id]/download/[lampiranIndex]** — Download
- `requireAuth()` → check ownership atau approver
- Parse `lampiranIndex` dari URL params
- Ambil `lampiran_urls[parseInt(lampiranIndex)]`
- Generate signed URL: `supabaseAdmin.storage.from('dokumen-lampiran').createSignedUrl(lampiranUrl.url, 3600)` (1 jam)
- Return redirect ke signed URL

**4c. Orphan Cleanup (Supabase Trigger)**
```sql
-- Trigger: delete storage files when dokumen_transaksi is deleted
CREATE OR REPLACE FUNCTION cleanup_dokumen_lampiran()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete files from storage bucket based on path prefix
  PERFORM supabase_storage.rpc('delete_file', jsonb_build_object(
    'bucket', 'dokumen-lampiran',
    'path', OLD.id::text
  ));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dokumen_delete
  AFTER DELETE ON dokumen_transaksi
  FOR EACH ROW EXECUTE FUNCTION cleanup_dokumen_lampiran();
```

**Files affected:**
- `src/routes/api/upload.ts` — POST upload
- `src/routes/api/dokumen/[id]/download/[lampiranIndex].ts` — GET download

**Dependencies:** Step 1 (Storage bucket)

---

### Step 5: UI — Dokumen Saya (List Page)

**What:** Halaman list semua dokumen yang diajukan pegawai.

**Why:** Entry point utama. Pegawai perlu tahu dokumen mana yang sudah diajukan dan statusnya.

**How:**
1. Buat `src/routes/dokumen.saya.tsx` sebagai redirect ke `/dokumen/saya`
2. Buat `src/routes/dokumen/saya.tsx`:
   - Loader: fetch dari `/api/dokumen` (server function)
   - Table dengan kolom: No, Judul, Fungsi, Kegiatan, Status Badge, Tanggal, Aksi
   - Filter: dropdown status + dropdown fungsi
   - Search bar: filter by judul
   - Empty state: ilustrasi + "Belum ada dokumen. Ajukan dokumen pertama Anda."
   - Tombol "Ajukan Dokumen Baru" → link ke `/dokumen/aju`

**UI Pattern (dari ui-ux-pro-max):**
- Status badge dengan warna berbeda per status
- Table row hover → show action buttons
- Pagination (10 per page)
- Toast feedback saat action

**Files affected:**
- `src/routes/dokumen.saya.tsx` — redirect route
- `src/routes/dokumen/saya.tsx` — main list page

**Dependencies:** Step 3 (GET /api/dokumen)

---

### Step 6: UI — Ajukan Dokumen (Multi-Step Form)

**What:** Form ajukan dokumen baru dengan 5 step.

**Why:** Core interaction. Pegawai berinteraksi dengan form ini untuk setiap pengajuan.

**Step 1 — Fungsi & Info Dasar:**
- Dropdown Fungsi (from `master_fungsi`)
- Input Tahun: dropdown 5 tahun ke belakang + 2 tahun ke depan
- Input Tanggal: date picker (DD/MM/YYYY)
- Tombol "Lanjut" → navigasi ke step 2

**Step 2 — Kegiatan:**
- Dropdown Kegiatan (ter-filter by fungsi yang dipilih di step 1)
- Disabled sampai step 1 selesai
- Tombol "Lanjut" + "Kembali"

**Step 3 — Role:**
- Toggle "Apakah Anda Ketua Tim?" (Ya / Tidak)
- Info text: "Jika Ya, Anda perlu mengunggah kelengkapan untuk Ketua Tim. Jika Tidak, kelengkapan untuk Anggota."
- Tombol "Lanjut" + "Kembali"

**Step 4 — Upload Lampiran:**
- Fetch kelengkapan dari `/api/master-kelengkapan?kegiatan_id=X` (filter by is_ketua_tim)
- Tampilkan checklist: [ ] [Nama Kelengkapan] [Upload Button]
- Jika required=true → label "Wajib" badge orange
- Jika belum upload → button "Unggah File" enabled
- Jika sudah upload → show filename + size + icon check
- Validasi: semua yang required harus terisi sebelum bisa ke step 5

**Step 5 — Review:**
- Summary card: Fungsi, Kegiatan, Tahun, Tanggal, Role
- List lampiran yang diupload (filename, size, kelengkapan name)
- Tombol "Ajukan" + "Kembali ke Edit"

**Submit Flow:**
- Klik "Ajukan" → POST ke `/api/dokumen/[id]/submit`
- Loading state → disable button
- Success → toast "Dokumen berhasil diajukan" → redirect ke `/dokumen/saya`
- Error → toast error dengan pesan dari server

**Navigation:**
- Step indicator bar di atas (1-2-3-4-5)
- Steps hanya bisa diakses sequential (tidak bisa skip ke step 4 sebelum step 1-3 selesai)
- Client-side state management untuk form data antar step (React state / URL search params)

**Files affected:**
- `src/routes/dokumen.aju.tsx` — redirect ke `/dokumen/aju`
- `src/routes/dokumen/aju.tsx` — multi-step form page
- `src/components/dokumen/StepIndicator.tsx` — step progress bar
- `src/components/dokumen/KelengkapanChecklist.tsx` — checklist + upload per item
- `src/components/dokumen/FileUploadButton.tsx` — upload button dengan state
- `src/components/dokumen/ReviewSummary.tsx` — review card

**Dependencies:** Step 2 (Zod schemas) + Step 3 (API) + Step 4 (upload) + `src/lib/master-data.ts` (fetch fungsi/kegiatan/kelengkapan dari Spec 02)

---

### Step 7: UI — Detail Dokumen

**What:** Halaman detail dokumen dengan info lengkap + lampiran.

**Why:** Pegawai perlu lihat detail dokumen yang diajukan dan statusnya.

**How:**
- Loader: fetch dari `/api/dokumen/[id]`
- Info card: Judul, Fungsi, Kegiatan, Tahun, Tanggal, is_ketua_tim, Status Badge, Current Step
- Status timeline: visual alur dari DRAFT → IN_PPK_VALIDATION → ... → ARCHIVED
- Jika `status = NEED_REVISION` → tampilkan `revision_notes` dari PPK (box warning merah)
- Lampiran list: setiap item — nama kelengkapan, filename, size, tombol download (GET signed URL)
- Tombol "Perbaiki & Resubmit" (visible hanya jika `status = NEED_REVISION` AND `revision_target = 'USER'`)

**Files affected:**
- `src/routes/dokumen.$id.tsx` — detail page

**Dependencies:** Step 3 (GET /api/dokumen/[id]) + Step 4 (download endpoint)

---

### Step 8: UI — Edit & Resubmit

**What:** Halaman edit untuk resubmit dokumen NEED_REVISION.

**Why:** flow resmi dari spec — pegawai bisa memperbaiki dan resubmit.

**How:**
1. Loader: validasi dokumen milik user + `status = NEED_REVISION` + `revision_target = 'USER'`
   - Jika tidak valid → redirect ke `/dokumen/[id]`
2. Tampilkan revision_notes dari PPK (read-only, box info)
3. Step 4 (Upload) — pre-populated dengan file yang sudah ada (show filename)
4. User bisa upload ulang file yang perlu diperbaiki
5. Tombol "Resubmit" → POST `/api/dokumen/[id]/submit`
6. Success → redirect ke `/dokumen/saya` dengan toast

**Files affected:**
- `src/routes/dokumen.$id.edit.tsx` — edit & resubmit page
- Reuse komponen dari Step 6 (KelengkapanChecklist, FileUploadButton)

**Dependencies:** Step 3 (PATCH + submit endpoint) + Step 6 (upload components)

---

### Step 9: Dashboard Redirect & Landing Page

**What:** Setup redirect `/dokumen` → `/dokumen/saya` dan update landing PEGAWAI.

**Why:** Konsistensi routing. Pegawai yang login langsung ke dashboard perlu bisa submit.

**How:**
1. `src/routes/dokumen.tsx` → redirect `/dokumen` → `/dokumen/saya`
2. Check existing `/routes/index.tsx` — apakah sudah redirect PEGAWAI ke `/dokumen/saya` atau ada konten lain?
3. Update jika perlu

**Files affected:**
- `src/routes/dokumen.tsx` — redirect route
- `src/routes/index.tsx` — landing page (check/update)

**Dependencies:** Step 5

---

## Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Upload file > 10MB | Return error 400: "Ukuran file maksimal 10MB" |
| Upload file tipe tidak allowed | Return error 400: "Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, XLS, XLSX" |
| Submit tanpa lampiran required | Form validation: blokir submit, highlight missing items |
| Submit dokumen yang bukan miliknya | Auth guard: return 403 |
| Resubmit dokumen yang bukan miliknya | Auth guard: return 403 |
| Resubmit dokumen yang status-nya BUKAN NEED_REVISION | API: return 400: "Dokumen tidak bisa disubmit ulang" |
| Resubmit dokumen dengan target PPK (bukan USER) | API: return 400: "Dokumen ini perlu direvisi oleh PPK, bukan Anda" |
| User Batal upload di tengah | Orphan files tetap ada di Storage sampai cleanup trigger jalan |
| Upload gagal (network error) | Client-side: show toast error, user bisa retry |
| Duplicate submit (double-click) | Button disabled saat loading state |

## Integration Points

| With | How |
|---|---|
| Spec 01 (Auth) | `requireAuth()`, `guardRole()`, Supabase session |
| Spec 02 (Master Data) | Fetch fungsi/kegiatan/kelengkapan dari API yang sudah ada |
| Spec 04 (Approval) | Shared `dokumen_transaksi` table — Spec 04 membaca data yang di-submit di Spec 03 |
| FSM (`src/lib/fsm.ts`) | Submit = `transition(status, 'SUBMIT', 'PEGAWAI')`, Resubmit = `transition(status, 'RESUBMIT', 'PEGAWAI')` |
| log_aktivitas | Append only — setiap submit/resubmit insert 1 log entry |
| Supabase Storage | Upload ke `dokumen-lampiran` bucket, download via signed URL |

## Migration Notes

1. Migration `003_dokumen_transaksi.sql` harus di-review sebelum apply
2. Storage bucket RLS policies harus di-set dengan benar — salah RLS = file tidak bisa di-upload/download
3. Setelah migration, jalankan TEST_VERIFICATION.md untuk validasi

## Open Questions (Lihat claude-spec.md)

1. Apakah tahun dropdown cukup range 2020-2030 atau perlu lebih dinamis?
2. Apakah user bisa cancel upload di tengah (abort)?
3. Apakah detail halaman perlu thumbnail untuk file non-PDF?
