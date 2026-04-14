# Spec: 05 — Arsip Flow (Arsiparis)

## Overview
Setelah Bendahara approve dan status menjadi `COMPLETED`, Arsiparis review dokumen dan menentukan apakah akan diarsipkan atau tidak. Jika ya, Arsiparis mengisi metadata arsip (nomor surat, klasifikasi, retensi) dan dokumen berstatus `ARCHIVED`. Jika tidak, dokumen tetap `COMPLETED` dan tidak masuk arsip. Termasuk juga pencarian dan download arsip oleh semua user.

---

## Background / Konteks
Ini adalah tahap akhir dari siklus dokumen. Dokumen yang `COMPLETED` belum tentu masuk arsip — Arsiparis yang memutuskan. Dokumen yang diarsipkan akan masuk ke sistem arsip dan bisa dicari oleh semua user.

---

## User Stories
- Sebagai **Arsiparis**, saya ingin melihat semua dokumen yang sudah `COMPLETED` dan belum diarsipkan, agar saya bisa mereview satu per satu.
- Sebagai **Arsiparis**, saya ingin download lampiran dokumen untuk review, agar bisa menilai kelayakan arsip.
- Sebagai **Arsiparis**, saya ingin mengarsipkan dokumen dengan mengisi metadata (nomor surat, klasifikasi, retensi), agar dokumen tersimpan rapi di sistem arsip.
- Sebagai **Arsiparis**, saya ingin menolak mengarsipkan dokumen (skip arsip), agar dokumen yang tidak layak tidak masuk sistem arsip.
- Sebagai **semua user (PEGAWAI, PPK, Bendahara, Arsiparis)**, saya ingin mencari arsip berdasarkan fungsi, kegiatan, tahun, atau kata kunci, agar mudah menemukan dokumen yang sudah diarsipkan.
- Sebagai **semua user**, saya ingin download arsip dalam format PDF/file asli, agar bisa menggunakan dokumen arsip.

---

## Scope — Termasuk
- **Arsiparis Inbox:** list dokumen `COMPLETED` yang belum diarsipkan
- **Arsiparis Detail:** view dokumen + lampiran + metadata (kosong)
- **Arsiparis Archive:** isi metadata arsip (nomor surat, klasifikasi, retensi aktif, retensi inaktif) → status `ARCHIVED`
- **Arsiparis Skip:** tandai dokumen tidak diarsipkan → tetap `COMPLETED` (flag `is_arsip_ditolak` = true)
- **Daftar Arsip Aktif:** list arsip dengan status aktif (masa retensi aktif belum habis)
- **Daftar Arsip Inaktif:** list arsip yang sudah masa retensi aktif habis, masuk ke status inaktif (auto-transition)
- **Usul Musnah:** list arsip yang sudah masa retensi inaktif habis, siap diusul dimusnahkan → Arsiparis bisa approve/hapus
- **Master Klasifikasi Arsip:** CRUD klasifikasi arsip (ADMIN atau ARSIPARIS bisa edit)
- **Arsip Search:** halaman pencarian arsip dengan filter (fungsi, kegiatan, tahun, kata kunci)
- **Arsip Detail:** view metadata arsip + download lampiran
- **Download arsip:** semua user bisa download dokumen arsip
- Filter & sort di semua list

---

## Scope — Tidak Termasuk
- Kategori arsip kustom (klasifikasi hardcoded atau dari master data)
- Retensi otomatis (auto-archive after X tahun)
- Export arsip (CSV/Excel)
- Preview PDF inline
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
  retensi_inaktif: text,                // Masa retensi arsip inaktif, e.g. "5 Tahun"
  masa_aktif_berakhir: date,            // Tanggal masa retensi aktif berakhir → otomatis masuk inaktif
  masa_inaktif_berakhir: date,          // Tanggal masa retensi inaktif berakhir → otomatis masuk usul musnah
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

### Tabel `arsip_usul_musnah`
```typescript
// Arsip yang sudah melewati masa retensi inaktif, siap diusul untuk dimusnahkan
arsip_usul_musnah: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arsip_id: uuid NOT NULL REFERENCES arsip(id),
  status: text DEFAULT 'MENUNGGU',     // 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'
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
  lampiran_urls: jsonb,                // Download dari sini
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
   - Section lampiran (download links)
   - Form metadata arsip (kosong)
       ↓
4. Arsiparis aksi:
   A. Arsipkan
      → isi: Nomor Surat, Klasifikasi, Retensi (wajib)
      → opsional: Catatan Arsiparis
      → klik "Arsipkan"
      → sistem: INSERT arsip, status = 'ARCHIVED'
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
//   → detail dokumen + hasil approve Bendahara + lampiran

// POST /api/arsiparis/dokumen/[id]/archive
//   Body: { nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif, masa_aktif_berakhir, masa_inaktif_berakhir, catatan_arsiparis? }
//   → validasi role = ARSIPARIS
//   → validasi fields wajib (nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif) tidak kosong
//   → INSERT arsip
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
//   → list arsip aktif (masa_aktif_berakhir > today)
//   → filter: ?fungsi_id, ?tahun, ?q

// src/routes/api/arsiparis/inaktif.ts
// GET /api/arsiparis/inaktif
//   → list arsip inaktif (masa_aktif_berakhir <= today AND masa_inaktif_berakhir > today)
//   → filter: ?fungsi_id, ?tahun

// src/routes/api/arsiparis/usul-musnah.ts
// GET /api/arsiparis/usul-musnah
//   → list arsip dengan masa_inaktif_berakhir <= today

// POST /api/arsiparis/usul-musnah
//   Body: { arsip_id, aksi: 'SETUJUI' | 'TOLAK', catatan? }
//   → validasi role = ARSIPARIS
//   → UPDATE arsip_usul_musnah

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

// src/routes/api/arsip/[id]/download/[filename]
// GET /api/arsip/[id]/download/[filename]
//   → validasi: user terautentikasi
//   → redirect ke signed URL Supabase Storage
```

---

## UI / Frontend

### Routes
```
/arsiparis                    → Dashboard Arsiparis (default landing)
/arsiparis/inbox              → list dokumen siap arsip (Pemberkasan Arsip)
/arsiparis/aktif              → daftar arsip aktif
/arsiparis/inaktif            → daftar arsip inaktif
/arsiparis/usul-musnah        → daftar arsip usul musnah
/arsiparis/klasifikasi        → master klasifikasi arsip
/arsiparis/dokumen/[id]       → detail + form archive/skip

/arsip                        → halaman pencarian arsip (semua user)
/arsip/[id]                   → detail arsip + download
```

### Arsiparis Pages

**1. Arsiparis Inbox (`/arsiparis/inbox`)**
- Table: nomor (opsional), judul, fungsi, kegiatan, pegawai, tanggal approve Bendahara, aksi
- Filter: fungsi, tanggal
- Empty state: "Tidak ada dokumen yang menunggu diarsipkan"

**2. Arsiparis Detail (`/arsiparis/dokumen/[id]`)**
- Info header: judul, fungsi, kegiatan, pegawai, tanggal diajukan, tanggal approve Bendahara
- Badge: COMPLETED (hijau)
- Section lampiran: download links
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
- Table: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip, Masa Aktif Berakhir
- Filter: fungsi, tahun, kata kunci

**4. Arsiparis Arsip Inaktif (`/arsiparis/inaktif`)**
- Table: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Jadi Inaktif, Masa Inaktif Berakhir
- Filter: fungsi, tahun

**5. Usul Musnah (`/arsiparis/usul-musnah`)**
- Table: Nomor Surat, Judul, Tanggal Usul, Status (MENUNGGU/DISETUJUI/DITOLAK), Aksi
- Aksi: [Setujui Musnah] [Tolak] per arsip dengan modal konfirmasi

**6. Master Klasifikasi (`/arsiparis/klasifikasi`)**
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
- Hasil list: table dengan kolom (Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip)
- Pagination: 20 per halaman
- Empty state: "Tidak ada arsip yang sesuai"

**Detail Arsip (`/arsip/[id]`)**
- Metadata lengkap: Nomor Surat, Klasifikasi, Retensi, Tanggal Arsip, Arsiparis
- Info dokumen: Judul, Fungsi, Kegiatan, Pegawai
- Section lampiran: links download
- Tombol "Download Semua" (opsional)

### Komponen UI
- `ArchiveForm` — form metadata arsip (nomor surat, klasifikasi, retensi)
- `SkipConfirmDialog` — dialog konfirmasi skip
- `ArsipSearchForm` — sidebar filter + hasil list
- `ArsipTable` — reusable table untuk hasil pencarian
- `DownloadButton` — link download per lampiran

---

## Logic / Business Rules
- **Arsip inbox:** Hanya dokumen `COMPLETED` yang belum punya record di tabel `arsip`. Jika sudah ada `arsip` (ditolak atau tidak), tidak muncul di inbox.
- **Skip tidak bisa di-undo:** Jika Arsiparis skip, dokumen tetap `COMPLETED` dan tidak bisa dikembalikan ke inbox.
- **Klasifikasi dari master:** Klasifikasi arsip sekarang dibaca dari tabel `master_klasifikasi_arsip` (bukan hardcoded).
- **Retensi lifecycle:** Setiap arsip punya retensi aktif + retensi inaktif. Saat masa retensi aktif habis → auto-masuk arsip inaktif. Saat masa retensi inaktif habis → auto-masuk daftar usul musnah. Trigger/cron job menangani transition ini.
- **Usul Musnah workflow:** Arsip di-usul-musnah secara otomatis saat masa inaktif berakhir. Arsiparis bisa menyetujui (delete/hapus fisik) atau menolak (arsip dipertahankan).
- **Nomor surat unik:** Disarankan unik tapi MVP tidak dibuat unique constraint (beri warning jika duplikat).
- **Semua user bisa search arsip:** Tidak ada filter role untuk `/arsip`.

---

## Dependensi
- **Bergantung pada:** Komponen 01 (Auth) + Komponen 02 (Master Data) + Komponen 04 (Approval Flow)
- **Dibutuhkan oleh:** — (final component)

---

## Definition of Done
- [ ] Arsiparis Inbox menampilkan dokumen COMPLETED yang belum diarsipkan
- [ ] Arsiparis bisa view detail + download lampiran
- [ ] Arsiparis Arsipkan: form wajib terisi (nomor surat, klasifikasi dari master, retensi aktif, retensi inaktif), INSERT arsip, status → ARCHIVED
- [ ] Arsiparis Skip: konfirmasi, INSERT arsip (is_ditolak=true), status tetap COMPLETED
- [ ] Skip tidak bisa di-undo
- [ ] Semua aksi logged di log_aktivitas
- [ ] Halaman Arsip (search) bisa filter by fungsi, kegiatan, tahun, kata kunci
- [ ] Hasil pencarian menampilkan metadata arsip lengkap
- [ ] Semua user (termasuk PEGAWAI) bisa akses halaman Arsip
- [ ] Download lampiran berfungsi untuk semua user terautentikasi
- [ ] Non-ARSIPARIS tidak bisa akses /arsiparis/*
- [ ] Daftar Arsip Aktif menampilkan arsip aktif dengan filter
- [ ] Daftar Arsip Inaktif menampilkan arsip inaktif
- [ ] Usul Musnah workflow berfungsi (MENUNGGU → DISETUJUI/DITOLAK)
- [ ] Master Klasifikasi Arsip CRUD berfungsi
- [ ] Masa retensi auto-calculate saat arsipkan
