# Section 10: Klasifikasi CRUD + Public Arsip Pages UI

## Context
Section 06 (Klasifikasi CRUD API) dan Section 07 (Arsip Search API) sudah selesai.

## Objective
Membuat 3 halaman UI:
- `/arsiparis/klasifikasi` — CRUD table master klasifikasi arsip
- `/arsip` — halaman pencarian arsip untuk semua user
- `/arsip/[id]` — detail arsip untuk semua user

## Prerequisites
- Section 06, Section 07 selesai (API ready)

## Implementation Steps

### 1. Buat `src/routes/arsiparis/klasifikasi.tsx` — Klasifikasi CRUD

- PageLayout dengan title "Master Klasifikasi Arsip"
- Tombol [+ Tambah Klasifikasi] di header
- Table columns: Nama Klasifikasi, Deskripsi, Aksi (Edit, Hapus)
- Empty state saat tidak ada data

**Modal Tambah/Edit:**
- Header: "Tambah Klasifikasi" / "Edit Klasifikasi"
- Input: Nama Klasifikasi (text, wajib)
- Textarea: Deskripsi (opsional)
- Footer: [Batal] [Simpan]
- Submit: POST atau PATCH ke `/api/arsiparis/klasifikasi`

**Modal Hapus:**
- Header: "Hapus Klasifikasi?"
- Text: "Klasifikasi akan dinonaktifkan. Dokumen yang sudah menggunakan klasifikasi ini tidak terpengaruh."
- Footer: [Batal] [Hapus]

### 2. Buat `src/routes/arsip/index.tsx` — Arsip Search

Halaman search untuk semua user (PEGAWAI, PPK, Bendahara, Arsiparis, ADMIN).

**Layout:** 2 kolom — sidebar filter + main content hasil

**Sidebar filter:**
- Filter Fungsi (dropdown — fetch dari `/api/master-fungsi`)
- Filter Kegiatan (dropdown, reactive — ter-filter oleh fungsi)
- Filter Tahun (input number)
- Filter Kata Kunci (input text — search di nomor surat + judul)
- Tombol [Cari]
- Tombol [Reset]

**Main content:**
- Table columns: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip
- Empty state: "Tidak ada arsip yang sesuai filter"
- Loading state
- Pagination (20 per halaman)
- Klik row → navigasi ke `/arsip/[id]`

**Initial load:** Tampilkan semua arsip (tanpa filter) — 20 item pertama.

### 3. Buat `src/routes/arsip/[id]/index.tsx` — Arsip Detail

- Back button → navigasi ke `/arsip`
- PageLayout dengan title: nomor surat

**Metadata section:**
- Nomor Surat
- Klasifikasi
- Retensi Aktif / Retensi Inaktif
- Masa Aktif/Inaktif Berakhir
- Status Arsip (badge)
- Tanggal Diarsipkan
- Diarsipkan Oleh (nama)
- Catatan Arsiparis (jika ada)

**Info dokumen section:**
- Judul
- Fungsi
- Kegiatan
- Tahun
- Pegawai (yang membuat)

**Lampiran section:**
- List lampiran dengan preview + download
- Reuse preview pattern (iframe modal)
- Download button per file

## Files to Create

- `src/routes/arsiparis/klasifikasi.tsx`
- `src/routes/arsip/index.tsx`
- `src/routes/arsip/[id]/index.tsx`

## Test Stubs

- [ ] Klasifikasi: CRUD table berfungsi
- [ ] Klasifikasi: modal tambah/edit/hapus berfungsi
- [ ] Arsip search: filter sidebar berfungsi
- [ ] Arsip search: results table dengan pagination
- [ ] Arsip search: empty state
- [ ] Arsip detail: semua metadata ditampilkan
- [ ] Arsip detail: preview + download berfungsi
- [ ] Arsip detail: back button navigasi ke search

## Definition of Done

- [ ] Klasifikasi CRUD berfungsi lengkap
- [ ] Arsip search dengan semua filter berfungsi
- [ ] Pagination berfungsi
- [ ] Arsip detail menampilkan semua info
- [ ] Preview dan download berfungsi
- [ ] Navigasi antar halaman berfungsi
- [ ] Test stubs pass