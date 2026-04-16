# Test & Verification Guide — Spec 03: Submit Flow (Pegawai)

## Overview

Spec 03 implements the Submit Flow for PEGAWAI role: multi-step document submission form, document list, detail view, and resubmit workflow.

## Prerequisites

- App running on `localhost:3000`
- Login credentials (PEGAWAI role)
- Storage bucket `dokumen-lampiran` created in Supabase (Public=OFF, File size limit=2MB)
- Migrations `003_dokumen_transaksi.sql` and `004_storage_rls_cleanup.sql` applied to Supabase
- Seed data: at least 1 Fungsi, 1 Kegiatan, and kelengkapan items for that kegiatan

---

## Test Cases

### [TC-01] Navigate to Dokumen Saya

**Tujuan:** Verify `/dokumen` redirects to `/dokumen/saya`

**Langkah:**
1. Login sebagai PEGAWAI
2. Navigate ke `/dokumen`

**Ekspektasi:**
- URL berubah ke `/dokumen/saya`
- Halaman list dokumen ditampilkan
- Empty state "Belum ada dokumen" terlihat

**Status:** ❌ Gagal — redirect tidak berjalan (URL tetap `/dokumen`)

---

### [TC-02] Ajukan Dokumen — Step 1 (Fungsi & Info Dasar)

**Tujuan:** User dapat mengisi informasi dasar dan memilih fungsi

**Langkah:**
1. Dari halaman `/dokumen/saya`, klik tombol "Ajukan Dokumen Baru"
2. Halaman `/dokumen/aju` terbuka dengan step 1 aktif
3. Pilih fungsi dari dropdown
4. Pilih tahun
5. Pilih tanggal

**Ekspektasi:**
- Dropdown fungsi menampilkan daftar fungsi
- Tahun default = tahun saat ini
- Tombol "Lanjut" aktif setelah semua field terisi

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-03] Ajukan Dokumen — Step 2 (Kegiatan)

**Tujuan:** Kegiatan difilter berdasarkan fungsi yang dipilih

**Langkah:**
1. Dari step 1, klik "Lanjut"
2. Pilih kegiatan dari dropdown

**Ekspektasi:**
- Dropdown kegiatan hanya menampilkan kegiatan untuk fungsi yang dipilih
- Loading state terlihat saat fetch kegiatan

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-04] Ajukan Dokumen — Step 3 (Peran)

**Tujuan:** User memilih role Ketua Tim atau Anggota

**Langkah:**
1. Dari step 2, klik "Lanjut"
2. Pilih "Anggota" atau "Ketua Tim"

**Ekspektasi:**
- Toggle visual dengan border aktif pada pilihan
- Catatan teks berubah sesuai pilihan

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-05] Ajukan Dokumen — Step 4 (Upload Lampiran)

**Tujuan:** User dapat mengunggah lampiran sesuai kelengkapan

**Langkah:**
1. Dari step 3, klik "Lanjut"
2. Checklist kelengkapan tampil
3. Klik "Unggah File" pada salah satu item WAJIB
4. Pilih file PDF < 2MB

**Ekspektasi:**
- Progress: uploading spinner → checkmark hijau
- Filename terlihat setelah upload berhasil
- Tombol "Hapus" terlihat
- Item berubah warna menjadi hijau setelah upload

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-06] Ajukan Dokumen — Upload Validation

**Tujuan:** Upload menolak file yang tidak valid

**Langkah:**
1. Step 4, klik "Unggah File"
2. Pilih file > 10MB
3. Pilih file .exe

**Ekspektasi:**
- File > 2MB: Error "Ukuran file maksimal 2MB"
- File .exe: Error "Tipe file tidak diizinkan"

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-07] Ajukan Dokumen — Submit Tanpa Lampiran

**Tujuan:** Submit gagal jika lampiran WAJIB belum diunggah

**Langkah:**
1. Isi step 1-3 tanpa upload apapun
2. Klik "Lanjut" ke step 4
3. Langsung klik "Lanjut" ke step 5
4. Klik "Ajukan Dokumen"

**Ekspektasi:**
- Error message: "Lampiran wajib belum lengkap: [nama kelengkapan]"

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-08] Ajukan Dokumen — Submit Berhasil

**Tujuan:** Submit berhasil dan redirect ke list

**Langkah:**
1. Lengkapi step 1-4 (upload minimal 1 lampiran WAJIB)
2. Klik "Lanjut" ke step 5
3. Review summary tampil dengan data yang benar
4. Klik "Ajukan Dokumen"

**Ekspektasi:**
- Loading spinner pada tombol
- Setelah berhasil: redirect ke `/dokumen/saya`
- Toast atau navigasi sukses
- Dokumen baru muncul di list dengan status "Validasi PPK"

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-09] Dokumen List — Filter & Search

**Tujuan:** Filter dan search bekerja dengan benar

**Langkah:**
1. Submit dokumen baru
2. Kembali ke `/dokumen/saya`
3. Ketik judul dokumen di search
4. Pilih filter status

**Ekspektasi:**
- Search memfilter berdasarkan judul, fungsi, atau kegiatan
- Filter status memfilter berdasarkan status dokumen

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-10] Dokumen List — Empty State

**Tujuan:** Empty state ditampilkan dengan benar

**Langkah:**
1. Login sebagai PEGAWAI baru tanpa dokumen

**Ekspektasi:**
- Ilustrasi + teks "Belum ada dokumen"
- Tombol CTA "Ajukan Dokumen Baru"

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-11] Dokumen Detail Page

**Tujuan:** Detail dokumen menampilkan semua informasi

**Langkah:**
1. Dari list, klik icon Eye pada salah satu dokumen
2. Halaman detail terbuka

**Ekspektasi:**
- Judul dokumen terlihat
- Status badge berwarna sesuai status
- Workflow timeline menunjukkan posisi saat ini
- Info grid (fungsi, kegiatan, tahun, tanggal, peran) terlihat
- Lampiran list dengan tombol download
- Tombol "Perbaiki & Ajukan Ulang" (jika NEED_REVISION)

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-12] Dokumen Detail — Download Lampiran

**Tujuan:** Download menghasilkan signed URL dan membuka file

**Langkah:**
1. Di halaman detail, klik tombol Download pada salah satu lampiran

**Ekspektasi:**
- File ter-download ke laptop user (bukan buka tab baru)
- Nama file sesuai dengan nama file asli yang diupload

**Status:** ✅ Lulus (diperbaiki — sebelumnya hanya buka tab baru, sekarang benar-benar download)

---

### [TC-13] Resubmit Workflow

**Tujuan:** Dokumen NEED_REVISION bisa di-resubmit

**Prasyarat:** Dokumen dalam status NEED_REVISION dengan revision_target='USER'

**Langkah:**
1. Buka detail dokumen NEED_REVISION
2. Klik "Perbaiki & Ajukan Ulang"
3. Halaman edit terbuka dengan catatan revisi
4. Upload ulang lampiran yang diperlukan
5. Klik "Ajukan Ulang"

**Ekspektasi:**
- Catatan revisi dari PPK terlihat
- Setelah resubmit: status berubah ke "Validasi PPK"
- log_aktivitas entry baru dengan aksi='RESUBMIT' tercatat
- Redirect ke `/dokumen/saya`

**Status:** ⏸️ Di-skip — tidak bisa diuji karena fitur approve/reject PPK oleh role PPK belum dibuat (Spec 04 belum diimplementasi). Untuk menguji, dokumen perlu masuk status NEED_REVISION terlebih dahulu, yang saat ini belum bisa terjadi tanpa alur PPK.

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Redirect /dokumen → /dokumen/saya | ⬜ | ⬜ | ⬜ | |
| 2 | Dokumen list page | ⬜ | ⬜ | ⬜ | |
| 3 | Empty state | ⬜ | ⬜ | ⬜ | |
| 4 | Search + filter | ⬜ | ⬜ | ⬜ | |
| 5 | Pagination | ⬜ | ⬜ | ⬜ | |
| 6 | Ajukan Dokumen form (all 5 steps) | ⬜ | ⬜ | ⬜ | |
| 7 | File upload with validation | ⬜ | ⬜ | ⃔ | |
| 8 | Submit creates dokumen + FSM transition | ⬜ | ⬜ | ⬜ | |
| 9 | Dokumen detail page | ⬜ | ⬜ | ⬜ | |
| 10 | Workflow timeline | ⬜ | ⬜ | ⬜ | |
| 11 | Download lampiran (signed URL → download to laptop) | ✅ | ✅ | ⬜ | |
| 12 | Activity log display | ⬜ | ⬜ | ⬜ | |
| 13 | Edit/Resubmit flow | ⏸️ | ⏸️ | ⏸️ | Di-skip — butuh fitur approve PPK (Spec 04) untuk bisa mendapat status NEED_REVISION |
| 14 | Double-submit prevention | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | | | Open | |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan
