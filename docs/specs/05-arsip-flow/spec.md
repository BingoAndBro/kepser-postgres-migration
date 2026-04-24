# Spec: 05 — Arsip Flow (Arsiparis)

## Overview
Setelah Bendahara approve dan status menjadi `COMPLETED`, Arsiparis review dokumen dan menentukan apakah akan diarsipkan atau tidak. Jika ya, Arsiparis mengisi metadata arsip (nomor surat, klasifikasi, retensi) dan dokumen berstatus `ARCHIVED`. Jika tidak, dokumen tetap `COMPLETED` dan tidak masuk arsip. Termasuk juga pencarian dan download arsip oleh semua user.

---

## Background / Konteks
Ini adalah tahap akhir dari siklus dokumen. Dokumen yang `COMPLETED` belum tentu masuk arsip — Arsiparis yang memutuskan. Dokumen yang diarsipkan akan masuk ke sistem arsip dan bisa dicari oleh semua user.

Arsip memiliki lifecycle retensi:
1. **Arsip Aktif** — arsip yang masa retensi aktifnya belum habis
2. **Verifikasi Penyusutan** — tahap review oleh Arsiparis sebelum arsip dipindahkan dari aktif ke inaktif. Arsiparis perlu approve/validate penyusutan
3. **Arsip Inaktif** — arsip yang sudah disetujui masuk inaktif, masa retensi aktif sudah habis
4. **Usul Musnah** — arsip yang sudah masa retensi inaktif habis, siap diusul untuk dimusnahkan

Siklus arsip berjalan **otomatis** berdasarkan masa retensi:
- Saat `masa_aktif_berakhir` tercapai → arsip otomatis masuk tahap **Verifikasi Penyusutan**
- Saat masa inaktif aktif berakhir → arsip otomatis masuk **Arsip Inaktif**
- Saat `masa_inaktif_berakhir` tercapai → arsip otomatis masuk tahap **Usul Musnah**

Sebagai shortcut, Arsiparis bisa memicu pemindahan manual ("Pindahkan Sekarang") pada setiap tahap transisi, tanpa harus menunggu masa retensi habis. Hanya arsip dengan status **AKTIF** yang bisa dipindahkan ke Verifikasi Penyusutan, dan hanya arsip dengan status **INAKTIF** yang bisa dipindahkan ke Usul Musnah.

---

## User Stories
- Sebagai **Arsiparis**, saya ingin melihat semua dokumen yang sudah `COMPLETED` dan belum diarsipkan, agar saya bisa mereview satu per satu.
- Sebagai **Arsiparis**, saya ingin preview lampiran dokumen langsung di browser (tanpa download), agar review lebih cepat.
- Sebagai **Arsiparis**, saya ingin download lampiran dokumen untuk review, agar bisa menilai kelayakan arsip.
- Sebagai **Arsiparis**, saya ingin mengarsipkan dokumen dengan mengisi metadata (nomor surat, klasifikasi, retensi), agar dokumen tersimpan rapi di sistem arsip.
- Sebagai **Arsiparis**, saya ingin menolak mengarsipkan dokumen (skip arsip), agar dokumen yang tidak layak tidak masuk sistem arsip.
- Sebagai **Arsiparis**, saya ingin mereview arsip yang akan disusutkan (dipindahkan ke inaktif) dan menyetujui atau menolaknya, agar perpindahan sesuai prosedur.
- Sebagai **Arsiparis**, saya ingin memindahkan arsip aktif ke verifikasi penyusutan secara manual, agar tidak perlu tunggu masa retensi habis.
- Sebagai **Arsiparis**, saya ingin memindahkan arsip inaktif ke usul musnah secara manual, agar bisa memicu proses musnah kapan saja.
- Sebagai **sistem**, saya ingin memindahkan arsip secara otomatis saat masa retensi tercapai, agar siklus arsip berjalan tanpa perlu intervensi manual terus-menerus.
- Sebagai **semua user (PEGAWAI, PPK, Bendahara, Arsiparis)**, saya ingin mencari arsip berdasarkan fungsi, kegiatan, tahun, atau kata kunci, agar mudah menemukan dokumen yang sudah diarsipkan.
- Sebagai **semua user**, saya ingin download arsip dalam format PDF/file asli, agar bisa menggunakan dokumen arsip.

---

## Scope — Termasuk
- **Arsiparis Inbox:** list dokumen `COMPLETED` yang belum diarsipkan
- **Arsiparis Detail:** view dokumen + preview lampiran (inline PDF/image) + download + metadata form (kosong)
- **Arsiparis Archive:** isi metadata arsip (nomor surat, klasifikasi, retensi aktif, retensi inaktif) → status `ARCHIVED`
- **Arsiparis Skip:** tandai dokumen tidak diarsipkan → tetap `COMPLETED` (flag `is_arsip_ditolak` = true)
- **Daftar Arsip Aktif:** list arsip dengan status aktif (masa retensi aktif belum habis)
- **Verifikasi Penyusutan:** list arsip aktif yang sudah dipindahkan ke tahap verifikasi (otomatis berdasarkan masa retensi aktif, atau dipindahkan manual oleh Arsiparis). Arsiparis approve → masuk inaktif, tolak → kembali ke aktif
- **Daftar Arsip Inaktif:** list arsip yang sudah disetujui Arsiparis masuk ke inaktif (masa retensi aktif habis)
- **Usul Musnah:** list arsip yang sudah masa retensi inaktif habis (atau dipindahkan manual oleh Arsiparis), siap diusul dimusnahkan → Arsiparis bisa approve/hapus
- **Master Klasifikasi Arsip:** CRUD klasifikasi arsip (ADMIN atau ARSIPARIS bisa edit)
- **Arsip Search:** halaman pencarian arsip dengan filter (fungsi, kegiatan, tahun, kata kunci)
- **Arsip Detail:** view metadata arsip + preview + download lampiran
- **Download arsip:** semua user bisa download dokumen arsip
- **Preview Arsip:** preview inline (PDF/image) di halaman detail arsip — sama seperti yang sudah ada di role PEGAWAI, PPK, Bendahara
- **Pindahkan Sekarang:** shortcut trigger manual oleh Arsiparis — dari Arsip Aktif hanya bisa ke Verifikasi Penyusutan, dari Arsip Inaktif hanya bisa ke Usul Musnah. Ini bukan pengganti transisi otomatis via cron job.
- Filter & sort di semua list

---

## Scope — Tidak Termasuk
- Kategori arsip kustom (klasifikasi hardcoded atau dari master data)
- **Retensi otomatis:** transisi antar tahap (AKTIF → VERIFIKASI_PENYUSUTAN → INAKTIF → USUL_MUSNAH) berjalan otomatis berdasarkan `masa_aktif_berakhir` dan `masa_inaktif_berakhir`. cron job / scheduled function menangani trigger ini.
- Export arsip (CSV/Excel)
- Hak akses per arsip (semua user bisa lihat semua arsip)

---

## Data / Model / Schema

### Tabel `arsip`
```typescript
arsip: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id: uuid NOT NULL UNIQUE REFERENCES dokumen_transaksi(id),
  nomor_surat: text,                    // Diisi Arsiparis, e.g. "001/SAKERNAS/2025"
  klasifikasi: text,                   // e.g. "Klasifikasi VII", dari master_klasifikasi_arsip
  retensi_aktif: text,                 // Masa retensi arsip aktif, e.g. "5 Tahun"
  retensi_inaktif: text,               // Masa retensi arsip inaktif, e.g. "5 Tahun"
  masa_aktif_berakhir: date,            // Tanggal masa retensi aktif berakhir
  masa_inaktif_berakhir: date,         // Tanggal masa retensi inaktif berakhir
  status_arsip: text DEFAULT 'AKTIF',  // 'AKTIF' | 'VERIFIKASI_PENYUSUTAN' | 'INAKTIF' | 'USUL_MUSNAH'
  is_ditolak: boolean DEFAULT false,   // true = Arsiparis skip, tidak diarsipkan
  catatan_arsiparis: text,
  archived_by: uuid REFERENCES auth.users(id),
  archived_at: timestamp DEFAULT now()
}
```

### Tabel `master_klasifikasi_arsip`
```typescript
master_klasifikasi_arsip: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL UNIQUE,           // "Klasifikasi I" s/d "Klasifikasi VII"
  deskripsi: text,
  is_active: boolean DEFAULT true,
  created_at: timestamp DEFAULT now()
}
```

### Tabel `arsip_verifikasi_penyusutan`
```typescript
// Aracip yang akan dipindahkan dari AKTIF ke INAKTIF — butuh persetujuan Arsiparis
arsip_verifikasi_penyusutan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arsip_id: uuid NOT NULL REFERENCES arsip(id),
  status: text DEFAULT 'MENUNGGU',      // 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'
  catatan: text,
  dipindahkan_oleh: uuid REFERENCES auth.users(id),  // user yang trigger "Pindahkan Sekarang"
  decided_by: uuid REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  decided_at: timestamp
}
```

### Tabel `arsip_usul_musnah`
```typescript
// Arsip yang akan dimusnahkan — butuh persetujuan Arsiparis
arsip_usul_musnah: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arsip_id: uuid NOT NULL REFERENCES arsip(id),
  status: text DEFAULT 'MENUNGGU',      // 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'
  catatan: text,
  diusulkan_oleh: uuid REFERENCES auth.users(id),
  decided_by: uuid REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  decided_at: timestamp
}
```

### Tabel `dokumen_transaksi` (relevant fields)
```typescript
dokumen_transaksi: {
  // ... existing fields
  status: StatusDokumen NOT NULL,      // COMPLETED → ARCHIVED
  lampiran_urls: jsonb,                // Preview & download dari sini
}
```

---

## Alur Pengguna (User Flow)

### Arsiparis Review & Archive
```
1. Arsiparis buka "Arsiparis Inbox" → lihat list dokumen COMPLETED yang belum diarsipkan
       ↓
2. Klik dokumen → halaman detail
       ↓
3. Arsiparis view:
   - Info lengkap dokumen (fungsi, kegiatan, judul, pegawai, tanggal)
   - Hasil approve Bendahara (nama, tanggal)
   - Section lampiran (preview inline + download links)
   - Form metadata arsip (kosong)
       ↓
4. Arsiparis aksi:
   A. Arsipkan
      → isi: Nomor Surat, Klasifikasi, Retensi (wajib)
      → opsional: Catatan Arsiparis
      → klik "Arsipkan"
      → sistem: INSERT arsip, status = 'ARCHIVED', status_arsip = 'AKTIF'
      → logged di log_aktivitas
      → redirect inbox + notifikasi "Dokumen berhasil diarsipkan"
       ──────────────────────
   B. Tidak Diarsipkan (Skip)
      → klik "Tidak Diarsipkan"
      → konfirmasi: "Yakin tidak mengarsipkan dokumen ini?"
      → opsional: isi Catatan Arsiparis
      → sistem: INSERT arsip (is_ditolak = true), status tetap 'COMPLETED'
      → logged di log_aktivitas
      → redirect inbox
```

### Arsip Aktif Lifecycle (Retensi)

```
Arsip Aktif (masa_aktif_berakhir BELUM tercapai)
    │
    ├─→ [Auto: cron job] ──→ Verifikasi Penyusutan
    │                        (masa_aktif_berakhir tercapai)
    │
    └─→ [Pindahkan Sekarang] ──→ Verifikasi Penyusutan
                                  │
                         Arsip Inaktif
                    (masa_inaktif_berakhir BELUM tercapai)
                                  │
                    ├─→ [Auto: cron job] ──→ Usul Musnah
                    │                     (masa_inaktif_berakhir tercapai)
                    │
                    └─→ [Pindahkan Sekarang] ──→ Usul Musnah
```

Notes:
- Transisi berjalan otomatis berdasarkan masa retensi. cron job memindahkan arsip saat `masa_aktif_berakhir` tercapai → masuk Verifikasi Penyusutan, dan saat `masa_inaktif_berakhir` tercapai → masuk Usul Musnah.
- "Pindahkan Sekarang" adalah shortcut manual. Dari Arsip Aktif → hanya ke Verifikasi Penyusutan. Dari Arsip Inaktif → hanya ke Usul Musnah.
- Arsip yang sudah di-Verifikasi Penyusutan belum bisa masuk Usul Musnah langsung — harus lewat tahap Inaktif terlebih dahulu

### Verifikasi Penyusutan
```
1. Arsiparis buka daftar arsip aktif
       ↓
2. Klik tombol "Pindahkan Sekarang" pada arsip tertentu
       ↓
3. Modal konfirmasi:
   - Info arsip (nomor surat, judul)
   - Pilihan: akan dipindahkan ke "Verifikasi Penyusutan"
   - Opsional: Catatan
       ↓
4. Klik "Ya, Pindahkan"
       ↓
5. Sistem: INSERT arsip_verifikasi_penyusutan (status = 'MENUNGGU')
   UPDATE arsip SET status_arsip = 'VERIFIKASI_PENYUSUTAN'
   → logged di log_aktivitas
       ↓
6. Arsip muncul di halaman "Verifikasi Penyusutan"

7. Arsiparis review:
   A. Setujui
      → UPDATE arsip_verifikasi_penyusutan SET status = 'DISETUJUI', decided_by, decided_at
      → UPDATE arsip SET status_arsip = 'INAKTIF'
      → logged di log_aktivitas
       ──────────────────────
   B. Tolak
      → UPDATE arsip_verifikasi_penyusutan SET status = 'DITOLAK', decided_by, decided_at
      → UPDATE arsip SET status_arsip = 'AKTIF' (kembali ke aktif)
      → logged di log_aktivitas
```

### Usul Musnah
```
1. Arsiparis buka daftar arsip inaktif
       ↓
2. Klik tombol "Pindahkan Sekarang" pada arsip tertentu
       ↓
3. Modal konfirmasi:
   - Info arsip (nomor surat, judul)
   - Pilihan: akan diusul untuk dimusnahkan
   - Opsional: Catatan
       ↓
4. Klik "Ya, Usulkan"
       ↓
5. Sistem: INSERT arsip_usul_musnah (status = 'MENUNGGU')
   UPDATE arsip SET status_arsip = 'USUL_MUSNAH'
   → logged di log_aktivitas
       ↓
6. Arsip muncul di halaman "Usul Musnah"

7. Arsiparis review:
   A. Setujui
      → UPDATE arsip_usul_musnah SET status = 'DISETUJUI', decided_by, decided_at
      → DELETE arsip (hapus record dari database)
      → DELETE dokumen_transaksi lampiran dari storage
      → logged di log_aktivitas
       ──────────────────────
   B. Tolak
      → UPDATE arsip_usul_musnah SET status = 'DITOLAK', decided_by, decided_at
      → UPDATE arsip SET status_arsip = 'INAKTIF' (kembali ke inaktif)
      → logged di log_aktivitas
```

### Pencarian Arsip (Semua User)
```
1. User buka "Arsip" → halaman pencarian
       ↓
2. Isi filter (opsional):
   - Fungsi (dropdown)
   - Kegiatan (dropdown, terfilter fungsi)
   - Tahun (input / range)
   - Kata kunci (search di judul/nomor surat)
       ↓
3. Klik "Cari"
       ↓
4. Hasil: list arsip yang match
   - Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip
   - Link ke detail arsip
       ↓
5. Klik arsip → halaman detail arsip
   - Metadata lengkap
   - Preview lampiran (inline)
   - Tombol download lampiran
```

---

## API / Server Functions

```typescript
// src/routes/api/arsiparis/inbox.ts
// GET /api/arsiparis/inbox
//   → list dokumen dengan status = 'COMPLETED'
//   → LEFT JOIN arsip ON arsip.dokumen_id = dokumen.id WHERE arsip.id IS NULL
//   → exclude yang sudah ada di arsip (ditolak atau tidak)

// src/routes/api/arsiparis/dokumen/[id].ts
// GET /api/arsiparis/dokumen/[id]
//   → detail dokumen + hasil approve Bendahara + lampiran (untuk preview)

// POST /api/arsiparis/dokumen/[id]/archive
//   Body: { nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif, masa_aktif_berakhir, masa_inaktif_berakhir, catatan_arsiparis? }
//   → validasi role = ARSIPARIS
//   → validasi fields wajib (nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif) tidak kosong
//   → INSERT arsip (status_arsip = 'AKTIF')
//   → UPDATE dokumen_transaksi status = 'ARCHIVED'
//   → INSERT log_aktivitas (aksi = 'ARCHIVE')

// POST /api/arsiparis/dokumen/[id]/skip
//   Body: { catatan_arsiparis? }
//   → validasi role = ARSIPARIS
//   → INSERT arsip (is_ditolak = true)
//   → status tetap 'COMPLETED'
//   → INSERT log_aktivitas (aksi = 'ARCHIVE_SKIP')

// src/routes/api/arsiparis/aktif.ts
// GET /api/arsiparis/aktif
//   → list arsip dengan status_arsip = 'AKTIF'
//   → filter: ?fungsi_id, ?tahun, ?q

// src/routes/api/arsiparis/verifikasi-penyusutan.ts
// GET /api/arsiparis/verifikasi-penyusutan
//   → list arsip dengan status_arsip = 'VERIFIKASI_PENYUSUTAN'
//   → JOIN arsip_verifikasi_penyusutan
//   → filter: ?fungsi_id, ?tahun

// POST /api/arsiparis/verifikasi-penyusutan/pindahkan
//   Body: { arsip_id, catatan? }
//   → validasi role = ARSIPARIS
//   → validasi arsip.status_arsip = 'AKTIF'
//   → INSERT arsip_verifikasi_penyusutan (status = 'MENUNGGU')
//   → UPDATE arsip SET status_arsip = 'VERIFIKASI_PENYUSUTAN'
//   → INSERT log_aktivitas (aksi = 'PINDAHKAN_VERIFIKASI_PENYUSUTAN')

// POST /api/arsiparis/verifikasi-penyusutan/putuskan
//   Body: { verifikasi_id, aksi: 'SETUJUI' | 'TOLAK', catatan? }
//   → validasi role = ARSIPARIS
//   → validasi arsip_verifikasi_penyusutan.status = 'MENUNGGU'
//   → UPDATE arsip_verifikasi_penyusutan SET status, decided_by, decided_at
//   → UPDATE arsip SET status_arsip = 'INAKTIF' (jika SETUJUI) atau 'AKTIF' (jika TOLAK)
//   → INSERT log_aktivitas (aksi = 'VERIFIKASI_PENYUSUTAN_SETUJUI' / 'VERIFIKASI_PENYUSUTAN_TOLAK')

// src/routes/api/arsiparis/inaktif.ts
// GET /api/arsiparis/inaktif
//   → list arsip dengan status_arsip = 'INAKTIF'
//   → filter: ?fungsi_id, ?tahun

// src/routes/api/arsiparis/usul-musnah.ts
// GET /api/arsiparis/usul-musnah
//   → list arsip dengan status_arsip = 'USUL_MUSNAH'
//   → JOIN arsip_usul_musnah

// POST /api/arsiparis/usul-musnah/pindahkan
//   Body: { arsip_id, catatan? }
//   → validasi role = ARSIPARIS
//   → validasi arsip.status_arsip = 'INAKTIF'
//   → INSERT arsip_usul_musnah (status = 'MENUNGGU')
//   → UPDATE arsip SET status_arsip = 'USUL_MUSNAH'
//   → INSERT log_aktivitas (aksi = 'PINDAHKAN_USUL_MUSNAH')

// POST /api/arsiparis/usul-musnah/putuskan
//   Body: { musnah_id, aksi: 'SETUJUI' | 'TOLAK', catatan? }
//   → validasi role = ARSIPARIS
//   → validasi arsip_usul_musnah.status = 'MENUNGGU'
//   → UPDATE arsip_usul_musnah SET status, decided_by, decided_at
//   → if SETUJUI: DELETE arsip + hapus file dari storage
//   → if TOLAK: UPDATE arsip SET status_arsip = 'INAKTIF'
//   → INSERT log_aktivitas

// src/routes/api/cron/arsip-retensi.ts
// POST /api/cron/arsip-retensi (dijalankan via cron/scheduled function)
//   → Ambil semua arsip dengan status_arsip = 'AKTIF' WHERE masa_aktif_berakhir <= today
//   → INSERT arsip_verifikasi_penyusutan (status = 'MENUNGGU')
//   → UPDATE arsip SET status_arsip = 'VERIFIKASI_PENYUSUTAN'
//   → INSERT log_aktivitas
//   → Ambil semua arsip dengan status_arsip = 'INAKTIF' WHERE masa_inaktif_berakhir <= today
//   → INSERT arsip_usul_musnah (status = 'MENUNGGU')
//   → UPDATE arsip SET status_arsip = 'USUL_MUSNAH'
//   → INSERT log_aktivitas

// src/routes/api/arsiparis/klasifikasi.ts
// GET /api/arsiparis/klasifikasi
//   → list master klasifikasi arsip

// POST /api/arsiparis/klasifikasi
//   Body: { nama, deskripsi? }
//   → create klasifikasi (ADMIN only)

// PATCH /api/arsiparis/klasifikasi/[id]
//   → update klasifikasi (ADMIN only)

// DELETE /api/arsiparis/klasifikasi/[id]
//   → soft delete klasifikasi (ADMIN only)

// src/routes/api/arsip/index.ts
// GET /api/arsip
//   Query params: ?fungsi_id, ?kegiatan_id, ?tahun, ?q (keyword)
//   → list arsip WHERE is_ditolak = false
//   → JOIN dokumen_transaksi untuk dapat info

// GET /api/arsip/[id]
//   → detail arsip + metadata + lampiran

// GET /api/arsip/[id]/preview/[filename]
//   → serve preview file (inline PDF/image) — sama seperti endpoint preview di role lain

// src/routes/api/arsip/[id]/download/[filename]
// GET /api/arsip/[id]/download/[filename]
//   → validasi: user terautentikasi
//   → redirect ke signed URL Supabase Storage
```

---

## UI / Frontend

### Routes
```
/arsiparis                      → Dashboard Arsiparis (default landing)
/arsiparis/inbox                → list dokumen siap arsip (Pemberkasan Arsip)
/arsiparis/aktif                → daftar arsip aktif
/arsiparis/verifikasi-penyusutan → daftar arsip menunggu verifikasi penyusutan
/arsiparis/inaktif              → daftar arsip inaktif
/arsiparis/usul-musnah          → daftar arsip usul musnah
/arsiparis/klasifikasi          → master klasifikasi arsip
/arsiparis/dokumen/[id]         → detail + form archive/skip + preview lampiran

/arsip                          → halaman pencarian arsip (semua user)
/arsip/[id]                     → detail arsip + preview lampiran + download
```

### Arsiparis Pages

**1. Arsiparis Inbox (`/arsiparis/inbox`)**
- Table: nomor (opsional), judul, fungsi, kegiatan, pegawai, tanggal approve Bendahara, aksi
- Filter: fungsi, tanggal
- Empty state: "Tidak ada dokumen yang menunggu diarsipkan"

**2. Arsiparis Detail (`/arsiparis/dokumen/[id]`)**
- Info header: judul, fungsi, kegiatan, pegawai, tanggal diajukan, tanggal approve Bendahara
- Badge: COMPLETED (hijau)
- Section lampiran: **preview inline (PDF/image viewer)** + download links
- Form metadata arsip:
  - Nomor Surat (input, wajib)
  - Klasifikasi (select/dropdown dari `master_klasifikasi_arsip`, wajib)
  - Retensi Aktif (select: "1 Tahun", "3 Tahun", "5 Tahun", "10 Tahun", "Permanen", wajib)
  - Retensi Inaktif (select: "1 Tahun", "3 Tahun", "5 Tahun", "10 Tahun", "Permanen", wajib)
  - Masa Aktif Berakhir (auto-calculated)
  - Masa Inaktif Berakhir (auto-calculated)
  - Catatan Arsiparis (textarea, opsional)
- 2 tombol aksi: [Arsipkan] [Tidak Diarsipkan]

**3. Arsiparis Arsip Aktif (`/arsiparis/aktif`)**
- Table: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip, Masa Aktif Berakhir, Aksi
- Filter: fungsi, tahun, kata kunci
- Kolom Aksi: tombol [Pindahkan Sekarang] → membuka modal konfirmasi untuk memindahkan ke Verifikasi Penyusutan

**4. Verifikasi Penyusutan (`/arsiparis/verifikasi-penyusutan`)**
- Table: Nomor Surat, Judul, Tanggal Diajukan ke Verifikasi, Status (MENUNGGU/DISETUJUI/DITOLAK), Aksi
- Filter: fungsi, tahun
- Kolom Aksi: tombol [Setujui] dan [Tolak] per arsip dengan modal konfirmasi
- Jika DISETUJUI → arsip masuk Inaktif. Jika DITOLAK → arsip kembali ke Aktif

**5. Arsiparis Arsip Inaktif (`/arsiparis/inaktif`)**
- Table: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Jadi Inaktif, Masa Inaktif Berakhir, Aksi
- Filter: fungsi, tahun
- Kolom Aksi: tombol [Pindahkan Sekarang] → membuka modal konfirmasi untuk memindahkan ke Usul Musnah

**6. Usul Musnah (`/arsiparis/usul-musnah`)**
- Table: Nomor Surat, Judul, Tanggal Usul, Status (MENUNGGU/DISETUJUI/DITOLAK), Aksi
- Filter: fungsi, tahun
- Aksi: [Setujui Musnah] [Tolak] per arsip dengan modal konfirmasi
- Jika DISETUJUI → arsip dihapus permanen. Jika DITOLAK → arsip kembali ke Inaktif

**7. Master Klasifikasi (`/arsiparis/klasifikasi`)**
- Table: Kode, Nama Klasifikasi, Deskripsi, Aksi (edit/delete)
- CRUD sederhana

### Arsip Search Page

**Halaman Arsip (`/arsip`)**
- Search bar dengan filter sidebar:
  - Filter Fungsi (dropdown)
  - Filter Kegiatan (dropdown, reactive)
  - Filter Tahun (input number)
  - Filter Kata Kunci (input text)
- Tombol "Cari"
- Hasil list: table dengan kolom (Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip, Status)
- Pagination: 20 per halaman
- Empty state: "Tidak ada arsip yang sesuai"
- Note: menampilkan semua arsip (aktif, verifikasi penyusutan, inaktif, usul musnah) — filter bisa digunakan untuk fokus

**Detail Arsip (`/arsip/[id]`)**
- Metadata lengkap: Nomor Surat, Klasifikasi, Retensi, Tanggal Arsip, Arsiparis, Status Arsip
- Info dokumen: Judul, Fungsi, Kegiatan, Pegawai
- Section lampiran: **preview inline (PDF/image viewer)** + links download
- Tombol "Download Semua" (opsional)

### Komponen UI
- `ArchiveForm` — form metadata arsip (nomor surat, klasifikasi, retensi)
- `SkipConfirmDialog` — dialog konfirmasi skip
- `ArsipSearchForm` — sidebar filter + hasil list
- `ArsipTable` — reusable table untuk hasil pencarian
- `PreviewDokumen` — preview inline PDF/image viewer (sama dengan yang ada di PEGAWAI, PPK, Bendahara)
- `DownloadButton` — link download per lampiran
- `PindahkanModal` — modal konfirmasi "Pindahkan Sekarang" dengan pilihan tujuan dan opsional catatan
- `PutuskanModal` — modal konfirmasi Setujui/Tolak pada tahap verifikasi penyusutan dan usul musnah

---

## Logic / Business Rules
- **Arsip inbox:** Hanya dokumen `COMPLETED` yang belum punya record di tabel `arsip`. Jika sudah ada `arsip` (ditolak atau tidak), tidak muncul di inbox.
- **Skip tidak bisa di-undo:** Jika Arsiparis skip, dokumen tetap `COMPLETED` dan tidak bisa dikembalikan ke inbox.
- **Klasifikasi dari master:** Klasifikasi arsip sekarang dibaca dari tabel `master_klasifikasi_arsip` (bukan hardcoded).
- **Retensi lifecycle otomatis:** Transisi antar tahap (AKTIF → VERIFIKASI_PENYUSUTAN → INAKTIF → USUL_MUSNAH) berjalan otomatis via cron job berdasarkan `masa_aktif_berakhir` dan `masa_inaktif_berakhir`. Masa retensi dicatat dan dijadikan trigger.
- **Verifikasi Penyusutan:** Arsiparis harus approve sebelum arsip bisa masuk dari Aktif ke Inaktif. Jika ditolak, arsip kembali ke status Aktif.
- **Usul Musnah workflow:** Arsiparis memicu pemindahan dari Inaktif ke Usul Musnah. Arsiparis bisa menyetujui (delete/hapus fisik) atau menolak (arsip dipertahankan di Inaktif).
- **Pindahkan Sekarang:** Bisa dilakukan kapan saja oleh Arsiparis tanpa melihat masa retensi. Ini adalah trigger manual untuk mempercepat proses arsip.
- **Nomor surat unik:** Disarankan unik tapi MVP tidak dibuat unique constraint (beri warning jika duplikat).
- **Semua user bisa search arsip:** Tidak ada filter role untuk `/arsip`.
- **Preview dokumen:** Fitur preview inline PDF/image tersedia di halaman Arsiparis detail dokumen dan halaman detail arsip. Menggunakan komponen yang sama dengan yang sudah ada di role PEGAWAI, PPK, Bendahara.

---

## Dependensi
- **Bergantung pada:** Komponen 01 (Auth) + Komponen 02 (Master Data) + Komponen 04 (Approval Flow)
- **Dibutuhkan oleh:** — (final component)

---

## Definition of Done
- [ ] Arsiparis Inbox menampilkan dokumen COMPLETED yang belum diarsipkan
- [ ] Arsiparis bisa view detail + preview lampiran (inline PDF/image)
- [ ] Arsiparis bisa download lampiran
- [ ] Arsiparis Arsipkan: form wajib terisi (nomor surat, klasifikasi dari master, retensi aktif, retensi inaktif), INSERT arsip, status → ARCHIVED, status_arsip → AKTIF
- [ ] Arsiparis Skip: konfirmasi, INSERT arsip (is_ditolak=true), status tetap COMPLETED
- [ ] Skip tidak bisa di-undo
- [ ] Semua aksi logged di log_aktivitas
- [ ] Halaman Arsip (search) bisa filter by fungsi, kegiatan, tahun, kata kunci
- [ ] Hasil pencarian menampilkan metadata arsip lengkap + status arsip
- [ ] Preview inline lampiran berfungsi di halaman detail arsip (semua user)
- [ ] Semua user (termasuk PEGAWAI) bisa akses halaman Arsip
- [ ] Download lampiran berfungsi untuk semua user terautentikasi
- [ ] Non-ARSIPARIS tidak bisa akses /arsiparis/*
- [ ] Daftar Arsip Aktif menampilkan arsip aktif dengan filter + tombol "Pindahkan Sekarang"
- [ ] "Pindahkan Sekarang" di Aktif → membuat record di arsip_verifikasi_penyusutan + ubah status_arsip ke VERIFIKASI_PENYUSUTAN
- [ ] Halaman Verifikasi Penyusutan menampilkan arsip yang menunggu review
- [ ] Arsiparis bisa Setujui (masuk Inaktif) atau Tolak (kembali ke Aktif) di Verifikasi Penyusutan
- [ ] Cron job auto-transition: arsip AKTIF dengan masa_aktif_berakhir <= today → masuk Verifikasi Penyusutan
- [ ] Cron job auto-transition: arsip INAKTIF dengan masa_inaktif_berakhir <= today → masuk Usul Musnah
- [ ] "Pindahkan Sekarang" di Aktif → hanya ke Verifikasi Penyusutan (bukan langsung ke Usul Musnah)
- [ ] Daftar Arsip Inaktif menampilkan arsip inaktif + tombol "Pindahkan Sekarang"
- [ ] "Pindahkan Sekarang" di Inaktif → membuat record di arsip_usul_musnah + ubah status_arsip ke USUL_MUSNAH
- [ ] Usul Musnah workflow berfungsi (MENUNGGU → DISETUJUI/DITOLAK)
- [ ] Master Klasifikasi Arsip CRUD berfungsi
- [ ] Masa retensi auto-calculate saat arsipkan (sebagai referensi, bukan trigger)