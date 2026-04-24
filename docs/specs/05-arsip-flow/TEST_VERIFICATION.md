# Test & Verification Guide: SPEC 05 — Arsip Flow (Arsiparis)

## Overview
Full arsiparis workflow UI: dashboard, inbox, dokumen detail, arsip lifecycle pages, klasifikasi CRUD, public arsip search, and auto-transition cron.

---

## Prerequisites
- App running at localhost:3000 (or deployed)
- Supabase database connected with arsip tables migrated (005_arsip.sql)
- User account with ARSIPARIS role assigned
- Login credentials

---

## Test Cases

### [TC-01] Arsiparis Dashboard — Real Stats

**Tujuan:** Verifikasi dashboard menampilkan jumlah real dari database

**Langkah:**
1. Login sebagai ARSIPARIS
2. Navigasi ke `/arsiparis`
3. Lihat statistik cards

**Ekspektasi:**
- Card "Menunggu Arsip" menampilkan jumlah dari `/api/arsiparis/inbox`
- Card "Arsip Aktif" menampilkan jumlah dari `/api/arsiparis/aktif`
- Card "Verifikasi Penyusutan" menampilkan jumlah dari `/api/arsiparis/verifikasi-penyusutan`
- Card "Arsip Inaktif" menampilkan jumlah dari `/api/arsiparis/inaktif`
- Card "Usul Musnah" menampilkan jumlah dari `/api/arsiparis/usul-musnah`

**Status:** ⬜ Belum diuji

---

### [TC-02] Pemberkasan Arsip — Inbox List

**Tujuan:** Verifikasi halaman inbox menampilkan dokumen COMPLETED yang belum diarsipkan

**Langkah:**
1. Login sebagai ARSIPARIS
2. Klik "Pemberkasan Arsip" di sidebar
3. Atau navigasi langsung ke `/arsiparis/inbox`

**Ekspektasi:**
- Table menampilkan kolom: No, Judul, Fungsi, Kegiatan, Tahun, Tanggal Approve, Aksi
- Filter fungsi berfungsi
- Empty state ditampilkan jika tidak ada data
- Loading spinner saat fetch
- Tombol aksi (eye icon) navigasi ke `/arsiparis/dokumen/[id]`

**Status:** ⬜ Belum diuji

---

### [TC-03] Detail Dokumen — Preview Lampiran

**Tujuan:** Verifikasi preview lampiran dalam modal iframe

**Langkah:**
1. Dari halaman inbox, klik tombol eye pada salah satu dokumen
2. Klik icon eye pada salah satu lampiran
3. Tekan ESC untuk menutup

**Ekspektasi:**
- Modal muncul dengan iframe preview
- Tombol X dan ESC menutup modal
- Download button membuka file di tab baru

**Status:** ⬜ Belum diuji

---

### [TC-04] Form Arsipkan — Submit dengan Validasi

**Tujuan:** Verifikasi form archive dengan semua field mandatory

**Langkah:**
1. Di halaman detail dokumen
2. Klik "Arsipkan" tanpa mengisi form
3. Lihat pesan error
4. Isi semua field (nomor surat, klasifikasi, retensi)
5. Klik "Arsipkan"

**Ekspektasi:**
- Validasi error muncul untuk field mandatory
- Setelah submit: redirect ke `/arsiparis/inbox`
- Dokumen tidak muncul lagi di inbox (sudah diarsipkan)
- Badge "Sudah Diarsipkan" muncul di halaman detail

**Status:** ⬜ Belum diuji

---

### [TC-05] Tidak Diarsipkan — Skip Dokumen

**Tujuan:** Verifikasi tombol "Tidak Diarsipkan" dengan konfirmasi

**Langkah:**
1. Di halaman detail dokumen yang belum diarsipkan
2. Klik tombol "Tidak Diarsipkan"
3. Modal konfirmasi muncul
4. Opsional: isi catatan
5. Klik "Ya, Tidak Diarsipkan"

**Ekspektasi:**
- Modal konfirmasi dengan warning muncul
- Redirect ke `/arsiparis/inbox` setelah submit
- Dokumen tidak muncul di inbox (ditandai is_ditolak=true)

**Status:** ⬜ Belum diuji

---

### [TC-06] Retensi Auto-Calculation

**Tujuan:** Verifikasi auto-calculate masa aktif dan inaktif berakhir

**Langkah:**
1. Di halaman detail dokumen, scroll ke form archive
2. Pilih retensi aktif: "5 Tahun"
3. Pilih retensi inaktif: "3 Tahun"
4. Lihat field "Masa Aktif Berakhir" dan "Masa Inaktif Berakhir"

**Ekspektasi:**
- Masa Aktif Berakhir = tanggal archive + 5 tahun (readonly)
- Masa Inaktif Berakhir = Masa Aktif Berakhir + 3 tahun (readonly)

**Status:** ⬜ Belum diuji

---

### [TC-07] Daftar Arsip Aktif — Pindahkan ke Verifikasi Penyusutan

**Tujuan:** Verifikasi aksi pindahkan arsip aktif

**Langkah:**
1. Navigasi ke `/arsiparis/aktif`
2. Klik tombol pindahkan (arrow) pada salah satu baris
3. Modal konfirmasi muncul
4. Klik "Ya, Pindahkan"

**Ekspektasi:**
- Arsip berpindah ke tahap VERIFIKASI_PENYUSUTAN
- Record tidak muncul lagi di Daftar Arsip Aktif
- Muncul di halaman Verifikasi Penyusutan

**Status:** ⬜ Belum diuji

---

### [TC-08] Verifikasi Penyusutan — Setujui / Tolak

**Tujuan:** Verifikasi aksi Setujui dan Tolak pada verifikasi penyusutan

**Langkah:**
1. Navigasi ke `/arsiparis/verifikasi-penyusutan`
2. Pilih record dengan status "MENUNGGU"
3. Klik tombol Setujui (centang hijau)
4. Klik "Setujui" pada modal
5. Refresh halaman
6. Pilih record lain, klik Tolak (X merah)
7. Isi alasan, klik "Tolak"

**Ekspektasi:**
- Setujui: arsip menjadi INAKTIF, badge berubah hijau
- Tolak: arsip kembali ke AKTIF, badge berubah merah
- Tombol aksi hilang untuk record yang sudah decided

**Status:** ⬜ Belum diuji

---

### [TC-09] Daftar Arsip Inaktif — Usulkan Musnah

**Tujuan:** Verifikasi aksi usulkan pemusnahan

**Langkah:**
1. Navigasi ke `/arsiparis/inaktif`
2. Klik tombol trash pada salah satu baris
3. Modal warning muncul
4. Klik "Ya, Usulkan"

**Ekspektasi:**
- Arsip berpindah ke tahap USUL_MUSNAH
- Warning tentang penghapusan permanen ditampilkan
- Muncul di halaman Usul Musnah

**Status:** ⬜ Belum diuji

---

### [TC-10] Usul Musnah — Setujui dengan Warning

**Tujuan:** Verifikasi aksi Setujui Musnah dengan konfirmasi destructive

**Langkah:**
1. Navigasi ke `/arsiparis/usul-musnah`
2. Pilih record MENUNGGU
3. Klik tombol Setujui Musnah
4. Baca warning besar tentang penghapusan permanen
5. Klik "Ya, Musnahkan"

**Ekspektasi:**
- Arsip dihapus PERMANEN dari database
- File lampiran dihapus dari storage
- Record tidak ada di halaman mana pun

**Status:** ⬜ Belum diuji

---

### [TC-11] Master Klasifikasi — CRUD

**Tujuan:** Verifikasi klasifikasi CRUD operations

**Langkah:**
1. Navigasi ke `/arsiparis/klasifikasi`
2. Klik [+ Tambah Klasifikasi]
3. Isi nama dan deskripsi, klik Simpan
4. Edit salah satu klasifikasi
5. Hapus satu klasifikasi

**Ekspektasi:**
- Tambah: klasifikasi baru muncul di table
- Edit: perubahan tersimpan
- Hapus: klasifikasi dinonaktifkan (is_active=false)
- Error jika nama duplikat

**Status:** ⬜ Belum diuji

---

### [TC-12] Pencarian Arsip — Public Search

**Tujuan:** Verifikasi halaman pencarian arsip untuk semua user

**Langkah:**
1. Login sebagai PEGAWAI (atau role lain)
2. Navigasi ke `/arsip` (atau klik "Cari Arsip" di sidebar)
3. Gunakan filter: fungsi, kegiatan, tahun, kata kunci
4. Klik "Cari"
5. Klik salah satu row untuk lihat detail

**Ekspektasi:**
- Filter berfungsi
- Pagination berfungsi
- Empty state jika tidak ada hasil
- Navigasi ke detail arsip berfungsi

**Status:** ⬜ Belum diuji

---

### [TC-13] Detail Arsip — Preview & Download

**Tujuan:** Verifikasi halaman detail arsip public

**Langkah:**
1. Dari halaman pencarian arsip, klik salah satu arsip
2. Lihat semua metadata arsip
3. Preview lampiran
4. Download lampiran

**Ekspektasi:**
- Metadata lengkap ditampilkan (nomor surat, klasifikasi, retensi, dll)
- Status badge dengan warna yang sesuai
- Preview iframe berfungsi
- Download berfungsi

**Status:** ⬜ Belum diuji

---

### [TC-14] Navigasi Sidebar — ARSIPARIS

**Tujuan:** Verifikasi sidebar ARSIPARIS dengan semua menu items

**Langkah:**
1. Login sebagai ARSIPARIS
2. Lihat sidebar kiri

**Ekspektasi:**
- Menu items: Dashboard, Pemberkasan Arsip, Daftar Arsip Aktif, Verifikasi Penyusutan, Daftar Arsip Inaktif, Usul Musnah, Master Klasifikasi, Cari Arsip
- Semua link navigasi berfungsi
- Active menu item highlighted

**Status:** ⬜ Belum diuji

---

### [TC-15] Auto-Transition Cron (Manual Test)

**Tujuan:** Verifikasi Edge Function auto-transition berjalan idempotent

**Langkah (manual di Supabase):**
1. Buat arsip dengan masa_aktif_berakhir = today (atau yesterday)
2. Jalankan Edge Function `arsip-retensi` secara manual
3. Check: arsip berpindah ke VERIFIKASI_PENYUSUTAN
4. Jalankan lagi: idempotent, tidak ada duplikat

**Ekspektasi:**
- Fase 1: AKTIF expired → VERIFIKASI_PENYUSUTAN
- Fase 2: INAKTIF expired → USUL_MUSNAH
- UNIQUE constraint prevents duplicate
- Log aktivitas created untuk setiap transition
- Response JSON dengan timestamp, processed counts, errors

**Status:** ⬜ Belum diuji

---

## Bug yang Ditemukan

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | | | | |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan
