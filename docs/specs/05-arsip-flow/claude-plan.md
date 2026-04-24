# Implementation Plan: SPEC 05 — Arsip Flow (Arsiparis)

## Overview

Spesifikasi 05 menambahkan modul Arsiparis ke DMS. Dokumen yang sudah `COMPLETED` (sudah di-approve Bendahara) akan masuk ke inbox Arsiparis untuk direview. Arsiparis bisa memilih mengarsipkan (dengan mengisi metadata: nomor surat, klasifikasi, retensi) atau menolak. Arsip yang sudah diarsipkan memiliki lifecycle otomatis berdasarkan masa retensi — dari aktif ke verifikasi penyusutan, ke inaktif, ke usul musnah — dan bisa dipicu manual oleh Arsiparis kapan saja. Semua user bisa mencari dan melihat detail arsip.

Implementasi dimulai dari database (migration), lalu API endpoints, lalu UI pages, dan terakhir cron job untuk auto-transition.

---

## Architecture

### Komponen yang Dibuat

1. **Database** — 4 tabel baru + 1 trigger
2. **API Endpoints** — 15+ endpoint baru di `/api/arsiparis/` dan `/api/arsip/`
3. **UI Pages** — 8 halaman baru di `/arsiparis/` dan 2 di `/arsip/`
4. **Cron Job** — Supabase Edge Function untuk auto-transition
5. **Navigation** — Update `NAV_CONFIG` untuk ARSIPARIS

### Data Flow Utama

```
Dokumen COMPLETED
    │
    ├─→ ARSIPARIS INBOX → archive (INSERT arsip) → dok.status = ARCHIVED, arsip.status_arsip = AKTIF
    │                    → skip (INSERT arsip, is_ditolak=true)
    │
    ▼
Arsip AKTIF ──[auto: pg_cron / manual: Pindahkan Sekarang]──→ VERIFIKASI_PENYUSUTAN
                                                                │
                                                    ├─ SETUJUI → arsip.status_arsip = INAKTIF
                                                    └─ TOLAK   → arsip.status_arsip = AKTIF (kembali)
                                                            │
                                                            ▼
Arsip INAKTIF ──[auto: pg_cron / manual: Pindahkan Sekarang]──→ USUL_MUSNAH
                                                                    │
                                                        ├─ SETUJUI → DELETE arsip + hapus file storage
                                                        └─ TOLAK   → arsip.status_arsip = INAKTIF (kembali)
```

### Hubungan dengan Komponen Lain

- Bergantung pada: Komponen 01 (Auth), Komponen 02 (Master Data), Komponen 04 (Approval Flow)
- FSM `transition()` sudah support `ARCHIVE` dan `SKIP` — tidak perlu modify
- `log_aktivitas` sudah ada — reuse untuk audit trail arsip
- `dokumen-helpers.ts` sudah ada — reuse `insertLog()`, `getDokumenById()`

---

## Implementation Steps

### Step 1: Database Migration — Arsip Tables

**What:** Buat SQL migration untuk 4 tabel baru + RLS policies + master data seed.

**Why:** Fondasi data harus ada sebelum API dan UI bisa dibangun. Tabel `arsip` sebagai core, `master_klasifikasi_arsip` untuk klasifikasi, `arsip_verifikasi_penyusutan` dan `arsip_usul_musnah` sebagai queue.

**How:** SQL migration dengan naming convention `005_arsip.sql`. Buat tabel dengan kolom seperti di spec. Tambahkan RLS policies: `arsip` readable by all authenticated, writable by ARSIPARIS/ADMIN. Sub-tables readable/writable by ARSIPARIS/ADMIN. UNIQUE constraint pada `arsip_id` di sub-tables. Seed data untuk `master_klasifikasi_arsip` (Klasifikasi I–VII). juga seed role ARSIPARIS.

**Files affected:**
- `supabase/migrations/005_arsip.sql` — semua tabel baru + policies + seed
- `src/lib/db/schema.ts` — update Drizzle schema dengan tabel baru (opsional — tidak semua project pakai Drizzle schema di code, tergantung existing pattern)

**Dependencies:** Tidak ada — ini step pertama.

---

### Step 2: API — Arsiparis Inbox & Dokumen Detail

**What:** Endpoint untuk list inbox dan detail dokumen.

**Why:** Arsiparis perlu melihat dokumen yang sudah COMPLETED dan belum diarsipkan. Mirip pattern Bendahara inbox.

**How:**
- `GET /api/arsiparis/inbox` — query `dokumen_transaksi` WHERE status='COMPLETED' AND id NOT IN (SELECT dokumen_id FROM arsip). Include fungsi, kegiatan, created_by info. Filter by fungsi, date range.
- `GET /api/arsiparis/dokumen/[id]` — detail dokumen + lampiran_urls + hasil approve Bendahara (dari log_aktivitas). Include juga info apakah sudah ada record arsip.

**Files affected:**
- `src/routes/api/arsiparis/inbox.ts`
- `src/routes/api/arsiparis/dokumen.$id.ts`

**Dependencies:** Step 1 selesai (tabel arsip ada).

---

### Step 3: API — Arsipkan & Skip Dokumen

**What:** Endpoint untuk mengarsipkan dan menolak mengarsipkan dokumen.

**Why:** Aksi utama Arsiparis. Mengarsipkan butuh form dengan metadata, skip butuh konfirmasi.

**How:**
- `POST /api/arsiparis/dokumen/[id]/archive` — body: `{ nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif, masa_aktif_berakhir, masa_inaktif_berakhir, catatan_arsiparis? }`. Validate: role ARSIPARIS, fields wajib terisi. INSERT arsip (status_arsip='AKTIF'), UPDATE dokumen_transaksi status='ARCHIVED' via FSM transition, INSERT log_aktivitas (aksi='ARCHIVE').
- `POST /api/arsiparis/dokumen/[id]/skip` — body: `{ catatan_arsiparis? }`. Validate role. INSERT arsip (is_ditolak=true), log_aktivitas (aksi='ARCHIVE_SKIP'). Dokumen tetap COMPLETED.

**Files affected:**
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/routes/api/arsiparis/dokumen.$id.skip.ts`

**Dependencies:** Step 1 (arsip table), Step 2 (dokumen detail pattern).

---

### Step 4: API — Daftar Arsip (Aktif, Inaktif, Verifikasi, Usul Musnah)

**What:** Endpoint untuk list arsip di setiap tahap lifecycle.

**Why:** Arsiparis perlu melihat arsip aktif, inaktif, yang menunggu verifikasi penyusutan, dan yang menunggu usul musnah. Semua dengan filter dan pagination.

**How:**
- `GET /api/arsiparis/aktif` — list WHERE status_arsip='AKTIF'. Filter: fungsi_id, tahun, q (keyword di nomor_surat/judul). Include joined info (dokumen.judul, fungsi.nama, dll).
- `GET /api/arsiparis/inaktif` — list WHERE status_arsip='INAKTIF'. Filter: fungsi_id, tahun.
- `GET /api/arsiparis/verifikasi-penyusutan` — list WHERE status_arsip='VERIFIKASI_PENYUSUTAN'. JOIN arsip_verifikasi_penyusutan. Include status (MENUNGGU/DISETUJUI/DITOLAK).
- `GET /api/arsiparis/usul-musnah` — list WHERE status_arsip='USUL_MUSNAH'. JOIN arsip_usul_musnah. Include status.

**Files affected:**
- `src/routes/api/arsiparis/aktif.ts`
- `src/routes/api/arsiparis/inaktif.ts`
- `src/routes/api/arsiparis/verifikasi-penyusutan.ts`
- `src/routes/api/arsiparis/usul-musnah.ts`

**Dependencies:** Step 1.

---

### Step 5: API — Pindahkan Sekarang + Putuskan Verifikasi & Musnah

**What:** Endpoint untuk memicu pemindahan manual dan approve/tolak di setiap tahap.

**Why:** Core workflow. "Pindahkan Sekarang" dan proses decide di verifikasi penyusutan dan usul musnah.

**How:**
- `POST /api/arsiparis/verifikasi-penyusutan/pindahkan` — body: `{ arsip_id, catatan? }`. Validate: role ARSIPARIS, arsip.status_arsip='AKTIF', belum ada record arsip_verifikasi_penyusutan untuk arsip_id ini (UNIQUE constraint akan enforce). INSERT arsip_verifikasi_penyusutan (status='MENUNGGU'), UPDATE arsip.status_arsip='VERIFIKASI_PENYUSUTAN', log_aktivitas.
- `POST /api/arsiparis/verifikasi-penyusutan/putuskan` — body: `{ verifikasi_id, aksi: 'SETUJUI'|'TOLAK', catatan? }`. Validate: role, status='MENUNGGU'. UPDATE arsip_verifikasi_penyusutan (status, decided_by, decided_at). UPDATE arsip.status_arsip='INAKTIF' (SETUJUI) atau 'AKTIF' (TOLAK). Log aktivitas.
- `POST /api/arsiparis/usul-musnah/pindahkan` — body: `{ arsip_id, catatan? }`. Validate: arsip.status_arsip='INAKTIF'. INSERT arsip_usul_musnah, UPDATE arsip.status_arsip='USUL_MUSNAH', log.
- `POST /api/arsiparis/usul-musnah/putuskan` — body: `{ musnah_id, aksi: 'SETUJUI'|'TOLAK', catatan? }`. Validate: status='MENUNGGU'. SETUJUI: UPDATE arsip_usul_musnah, DELETE arsip, hapus file storage (loop lampiran_urls + delete dari Supabase Storage), log. TOLAK: UPDATE arsip_usul_musnah, UPDATE arsip.status_arsip='INAKTIF', log.

**Files affected:**
- `src/routes/api/arsiparis/verifikasi-penyusutan/pindahkan.ts`
- `src/routes/api/arsiparis/verifikasi-penyusutan/putuskan.ts`
- `src/routes/api/arsiparis/usul-musnah/pindahkan.ts`
- `src/routes/api/arsiparis/usul-musnah/putuskan.ts`

**Dependencies:** Step 1, Step 4 (list endpoints).

---

### Step 6: API — Master Klasifikasi Arsip (CRUD)

**What:** CRUD untuk master klasifikasi arsip.

**Why:** Klasifikasi arsip harus bisa di-manage oleh ADMIN atau ARSIPARIS.

**How:**
- `GET /api/arsiparis/klasifikasi` — list semua (public access, seperti master fungsi)
- `POST /api/arsiparis/klasifikasi` — create (ADMIN only)
- `PATCH /api/arsiparis/klasifikasi/[id]` — update (ADMIN only)
- `DELETE /api/arsiparis/klasifikasi/[id]` — soft delete (ADMIN only)

Pattern sama dengan `master-fungsi.ts`.

**Files affected:**
- `src/routes/api/arsiparis/klasifikasi/index.ts`
- `src/routes/api/arsiparis/klasifikasi/[id].ts`

**Dependencies:** Step 1.

---

### Step 7: API — Arsip Search (Public) + Preview + Download

**What:** Endpoint pencarian arsip dan preview/download untuk semua user.

**Why:** Spec bilang semua user bisa search dan download arsip. Preview inline juga harus tersedia.

**How:**
- `GET /api/arsip` — search arsip. Query params: fungsi_id, kegiatan_id, tahun, q. WHERE is_ditolak=false. Join dokumen_transaksi untuk dapat judul, fungsi, kegiatan. Pagination 20 per halaman.
- `GET /api/arsip/[id]` — detail arsip. Include arsip metadata + dokumen info + lampiran_urls.
- `GET /api/arsip/[id]/preview/[filename]` — preview lampiran. Auth check (authenticated user). Generate signed URL 15 menit, inline. Pattern sama dengan existing preview endpoint.
- `GET /api/arsip/[id]/download/[filename]` — download. Generate signed URL 1 jam, download flag. Pattern sama dengan existing download endpoint.

**Files affected:**
- `src/routes/api/arsip/index.ts`
- `src/routes/api/arsip/[id].ts`
- `src/routes/api/arsip/[id]/preview/[filename].ts`
- `src/routes/api/arsip/[id]/download/[filename].ts`

**Dependencies:** Step 1.

---

### Step 8: UI — Arsiparis Pages (Dashboard, Inbox, Detail)

**What:** Halaman Arsiparis: dashboard, inbox, detail dokumen.

**Why:** UI untuk Arsiparis bekerja. Langkah pertama sebelum halaman arsip lifecycle.

**How:** Page pattern mengikuti existing (PageLayout + table). Check BEST_PRACTICES.md untuk styling standard.
- `/arsiparis` — Dashboard. Stats (inbox count, aktif count, dll). Gunakan StatsBento atau card sederhana.
- `/arsiparis/inbox` — List dokumen COMPLETED belum diarsipkan. Table dengan kolom: judul, fungsi, kegiatan, pegawai, tanggal approve Bendahara, aksi (Lihat Detail). Filter: fungsi.
- `/arsiparis/dokumen/[id]` — Detail + preview lampiran (reuse preview pattern dari PPK) + form archive/skip. Form archive: nomor surat (text), klasifikasi (select dari master_klasifikasi_arsip), retensi aktif (select), retensi inaktif (select), masa aktif/inaktif berakhir (auto-calculated, readonly). Tombol [Arsipkan] [Tidak Diarsipkan].

**Files affected:**
- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`

**Dependencies:** Step 2, Step 3 (API ready).

---

### Step 9: UI — Arsiparis Arsip Lifecycle Pages

**What:** Halaman daftar arsip aktif, verifikasi penyusutan, inaktif, usul musnah.

**Why:** Mengelola lifecycle arsip.

**How:**
- `/arsiparis/aktif` — Table: nomor surat, judul, fungsi, kegiatan, tanggal arsip, masa aktif berakhir, aksi (Pindahkan Sekarang). Filter: fungsi, tahun, keyword.
- `/arsiparis/verifikasi-penyusutan` — Table: nomor surat, judul, tanggal diajukan, status (MENUNGGU badge), aksi (Setujui, Tolak). Modal konfirmasi untuk setiap aksi. Jika status SUDAH DISETUJUI/DITOLAK, tampilkan tapi tidak bisa aksi lagi.
- `/arsiparis/inaktif` — Table: nomor surat, judul, fungsi, kegiatan, tanggal jadi inaktif, masa inaktif berakhir, aksi (Pindahkan Sekarang).
- `/arsiparis/usul-musnah` — Table: nomor surat, judul, tanggal usul, status, aksi (Setujui Musnah, Tolak). Modal konfirmasi untuk setujui (warning: akan menghapus permanen).

**Files affected:**
- `src/routes/arsiparis/aktif.tsx`
- `src/routes/arsiparis/verifikasi-penyusutan.tsx`
- `src/routes/arsiparis/inaktif.tsx`
- `src/routes/arsiparis/usul-musnah.tsx`

**Dependencies:** Step 4, Step 5, Step 7.

---

### Step 10: UI — Arsiparis Klasifikasi + Public Arsip Pages

**What:** Halaman master klasifikasi + halaman pencarian arsip untuk semua user.

**Why:** ADMIN/ARSIPARIS perlu bisa manage klasifikasi. Semua user perlu bisa search arsip.

**How:**
- `/arsiparis/klasifikasi` — CRUD table. Kolom: nama klasifikasi, deskripsi, aksi (edit, hapus). Tambah tombol [+ Tambah]. Modal untuk form tambah/edit. Gunakan Dialog component.
- `/arsip` — Halaman search arsip. Sidebar dengan filter (fungsi, kegiatan, tahun, keyword). Hasil list table (nomor surat, judul, fungsi, kegiatan, tanggal arsip). Pagination 20.
- `/arsip/[id]` — Detail arsip. Metadata lengkap (nomor surat, klasifikasi, retensi, tanggal, status arsip, Arsiparis). Section lampiran dengan preview + download. Back button ke search.

**Files affected:**
- `src/routes/arsiparis/klasifikasi.tsx`
- `src/routes/arsip/index.tsx`
- `src/routes/arsip/[id]/index.tsx`

**Dependencies:** Step 6, Step 7.

---

### Step 11: Navigation Config Update

**What:** Update `NAV_CONFIG['ARSIPARIS']` di AppLayout.

**Why:** Menu sidebar untuk role Arsiparis harus lengkap.

**How:** Update `NAV_CONFIG` di `src/components/layout/AppLayout.tsx`. Tambahkan menu items:
- Dashboard → `/arsiparis`
- Pemberkasan Arsip → `/arsiparis/inbox`
- Daftar Arsip Aktif → `/arsiparis/aktif`
- Verifikasi Penyusutan → `/arsiparis/verifikasi-penyusutan`
- Daftar Arsip Inaktif → `/arsiparis/inaktif`
- Usul Musnah → `/arsiparis/usul-musnah`
- Master Klasifikasi → `/arsiparis/klasifikasi`

Gunakan icons yang sudah ada (Archive, FolderOpen, Trash2, Network, dll).

**Files affected:**
- `src/components/layout/AppLayout.tsx`

**Dependencies:** Step 8, Step 9, Step 10.

---

### Step 12: Supabase Edge Function — Cron Auto-Transition

**What:** Supabase Edge Function yang dijalankan via pg_cron untuk auto-transition arsip.

**Why:** Spec bilang lifecycle berjalan otomatis berdasarkan masa retensi. Fungsi ini yang trigger pemindahan.

**How:**
- Buat Edge Function di `supabase/functions/arsip-retensi/index.ts`.
- Fungsi ini query arsip WHERE status_arsip='AKTIF' AND masa_aktif_berakhir <= today AND belum punya arsip_verifikasi_penyusutan record aktif. Untuk setiap arsip: INSERT arsip_verifikasi_penyusutan, UPDATE status_arsip='VERIFIKASI_PENYUSUTAN', log.
- Fungsi ini juga query arsip WHERE status_arsip='INAKTIF' AND masa_inaktif_berakhir <= today AND belum punya arsip_usul_musnah record aktif. Untuk setiap arsip: INSERT arsip_usul_musnah, UPDATE status_arsip='USUL_MUSNAH', log.
- Schedule dengan pg_cron: `SELECT cron.schedule('check-arsip-retensi', '0 2 * * *', $$ SELECT net.http_post(...) $$);` — jalan setiap jam 2 pagi.
- Edge Function tidak perlu auth (dijalankan dari dalam Supabase via pg_cron). Tetap gunakan service_role client untuk bypass RLS.

**Files affected:**
- `supabase/functions/arsip-retensi/index.ts` — Edge Function
- `supabase/migrations/006_cron_arsip.sql` — pg_cron schedule

**Dependencies:** Step 1 (arsip tables), Step 4 (list endpoints) — tapi fungsi ini standalone dan tidak depend pada UI/API steps.

---

## Edge Cases & Error Handling

1. **Double pindahkan** — UNIQUE constraint pada arsip_id di sub-tables akan prevent duplicate. API harus handle constraint violation gracefully (return error: "Arsip sudah dipindahkan ke tahap ini").
2. **Concurrent decide** — Jika 2 request decide masuk bersamaan, database constraint + WHERE clause pada UPDATE akan handle. Return error jika record tidak ditemukan.
3. **File deletion gagal** — Jika hapus file storage gagal saat musnah, arsip record tetap dihapus tapi ada log error. Dokumen tetap ada, file orphan. Consider retry mechanism atau log untuk cleanup manual.
4. **Cron overlap** — pg_cron schedule harus di-set agar tidak overlap. Satu instance per hari sudah cukup.
5. **Arsip tidak ditemukan saat decide** — Always check existence before update. Return 404 if not found.
6. **Nomor surat duplikat** — Warning hanya di UI/API, tidak ada constraint. User harus aware.
7. **Masa retensi tidak diisi** — Field retensi_aktif dan retensi_inaktif WAJIB di form arsipkan. API validate.

---

## Integration Points

1. **FSM (`src/lib/fsm.ts`)** — Archive action sudah ada di FSM. SKIP action juga ada. Tidak perlu modify.
2. **dokumen-helpers.ts** — `insertLog()`, `getDokumenById()` bisa direuse. Tambahkan helper untuk arsip jika perlu.
3. **Auth** — Semua API endpoints yang protected harus validasi session + role. Pattern: get session, get user roles, check role.
4. **Storage** — Preview dan download pakai Supabase Storage bucket `dokumen-lampiran`. File deletion saat musnah juga ke bucket ini.
5. **Master Data** — `master_klasifikasi_arsip` menggunakan pattern yang sama dengan `master_fungsi` dan `master_kegiatan`.
6. **log_aktivitas** — Semua aksi state change logged. Aksi baru: `ARCHIVE`, `ARCHIVE_SKIP`, `PINDAHKAN_VERIFIKASI_PENYUSUTAN`, `VERIFIKASI_PENYUSUTAN_SETUJUI`, `VERIFIKASI_PENYUSUTAN_TOLAK`, `PINDAHKAN_USUL_MUSNAH`, `USUL_MUSNAH_SETUJUI`, `USUL_MUSNAH_TOLAK`.

---

## Migration / Compatibility Notes

1. **Backward compatible** — Tidak ada breaking change. Semua endpoint baru dan UI baru.
2. **RLS** — Pastikan RLS policies untuk tabel baru tidak blocking akses yang seharusnya di-allow. Test dengan berbagai role.
3. **Existing documents** — Dokumen yang sudah COMPLETED sebelum migration akan tetap di-inbox Arsiparis. Tidak ada migrasi data yang diperlukan.
4. **FSM** — Tidak ada perubahan ke FSM, tapi perlu verify bahwa `COMPLETED:ARCHIVE` dan `COMPLETED:SKIP` tetap valid dengan role ARSIPARIS.

---

## Open Questions (Resolved)

- Q1: Cron authentication → Supabase Edge Function + pg_cron (internal, no external secret needed)
- Q2-Q12: Semua resolved di claude-interview.md