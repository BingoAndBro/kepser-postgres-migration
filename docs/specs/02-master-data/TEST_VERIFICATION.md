
# Test & Verification Guide — Component 02: Master Data Management

## Overview

Komponen ini membangun fondasi data master: Fungsi/Bidang BPS, Kegiatan per fungsi, dan Kelengkapan Dokumen per kegiatan. Semua operasi CRUD dilakukan oleh ADMIN. Specs 03-05 akan bergantung pada data ini.

---

## Prerequisites

1. `.env` sudah terisi dengan kredensial Supabase asli
2. Migration `001_auth_rbac.sql` sudah dijalankan (Spec 01)
3. **Migration `002_master_data.sql` sudah dijalankan** di Supabase Dashboard → SQL Editor
4. Login sebagai user dengan role **ADMIN**

---

## Prasyarat Testing

Jalankan migration SQL ini di Supabase Dashboard → SQL Editor:

```sql
-- Copy seluruh isi dari supabase/migrations/002_master_data.sql
-- lalu paste dan execute
```

Seed data yang harus sudah ada setelah migration:
- **6 Fungsi**: Sosial, Distribusi, Neraca, Produksi, Umum, IPDS
- **10 Kegiatan**: SAKERNAS, SUSENAS, PODES (Sosial), Survei Harga Konsumen, Survei Perdagangan Luar Negeri (Distribusi), Neraca Konsumsi Rumah Tangga (Neraca), Survei Produksi Tanaman Pangan, SEP (Produksi), Administrasi Perkantoran (Umum), Pengolahan Data Statistik (IPDS)
- **9 Kelengkapan SAKERNAS**: 6 untuk Ketua Tim, 3 untuk Anggota

---

## Test Cases

### [TC-01] Master User Page — Load & Display

**Tujuan:** Halaman Master User bisa diakses dan menampilkan data user.

**Langkah:**
1. Login sebagai ADMIN
2. Di sidebar, klik **Master User** (menu MANAGEMENT)
3. Perhatikan halaman yang tampil

**Ekspektasi:**
- ✅ Redirect ke `/admin/master-data/user`
- ✅ Halaman menampilkan tabel user dengan kolom: No, Nama, Email, Departemen, Role, Status, Aksi
- ✅ Ada tombol **Tambah User** di kanan atas
- ✅ Filter dropdown "Semua Departemen" dan "Semua Role" terlihat
- ✅ Search bar terlihat

**Status:** ⬜ Belum diuji

---

### [TC-02] Departemen Fungsi Page — Load & Display

**Tujuan:** Halaman Fungsi menampilkan daftar fungsi dari database.

**Langkah:**
1. Login sebagai ADMIN
2. Klik **Departemen Fungsi** di sidebar
3. Perhatikan halaman

**Ekspektasi:**
- ✅ Redirect ke `/admin/master-data/fungsi`
- ✅ Breadcrumb: "Admin / Master Data / Departemen Fungsi"
- ✅ Tabel menampilkan 6 fungsi BPS (Sosial, Distribusi, Neraca, Produksi, Umum, IPDS)
- ✅ Kolom: No, Nama, Deskripsi, Jumlah Kegiatan, Aksi
- ✅ Tombol **Tambah Fungsi** terlihat
- ✅ Search bar berfungsi

**Status:** ⬜ Belum diuji

---

### [TC-03] Create Fungsi — Success

**Tujuan:** ADMIN bisa menambah fungsi baru.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Klik tombol **Tambah Fungsi**
3. Isi:
   - Nama: `Statistik`
   - Deskripsi: `Bidang Statistik — pengelolaan data dan indikator statistik`
4. Klik **Tambah**

**Ekspektasi:**
- ✅ Modal tertutup setelah submit
- ✅ Tabel refresh dan menampilkan fungsi baru "Statistik"
- ✅ Tidak ada pesan error
- ✅ Jumlah kegiatan = 0

**Status:** ⬜ Belum diuji

---

### [TC-04] Create Fungsi — Duplicate Nama

**Tujuan:** Sistem menolak nama fungsi duplikat.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Klik **Tambah Fungsi**
3. Isi Nama: `Sosial` (sudah ada)
4. Klik **Tambah**

**Ekspektasi:**
- ✅ Error message muncul: `"Nama fungsi "Sosial" sudah ada"`
- ✅ Modal tidak tertutup
- ✅ Fungsi tidak di-duplicate
- ✅ Tabel tetap 6 fungsi (tidak bertambah)

**Status:** ⬜ Belum diuji

---

### [TC-05] Create Fungsi — Nama Kosong

**Tujuan:** Validasi nama wajib terisi.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Klik **Tambah Fungsi**
3. Kosongkan field Nama
4. Klik **Tambah**

**Ekspektasi:**
- ✅ Error: "Nama tidak boleh kosong"
- ✅ Submit tidak terjadi

**Status:** ⬜ Belum diuji

---

### [TC-06] Edit Fungsi

**Tujuan:** ADMIN bisa mengubah nama/deskripsi fungsi.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Arahkan cursor ke row "Sosial" — tombol aksi muncul
3. Klik ikon **Edit** (pensil)
4. Ubah Nama jadi `Sosial dan Kependudukan`
5. Klik **Simpan**

**Ekspektasi:**
- ✅ Modal tertutup
- ✅ Nama berubah di tabel
- ✅ Deskripsi tidak berubah

**Status:** ⬜ Belum diuji

---

### [TC-07] Nonaktifkan Fungsi

**Tujuan:** ADMIN bisa menonaktifkan (soft delete) fungsi.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Klik ikon **Hapus** (trash) di row "Umum"
3. Baca dialog konfirmasi
4. Klik **Nonaktifkan**

**Ekspektasi:**
- ✅ Dialog tertutup
- ✅ Fungsi "Umum" tidak lagi muncul di tabel
- ✅ Jumlah fungsi jadi 5

**Ekspektasi (Konsekuensi):**
- ✅ Fungsi "Umum" tidak muncul di dropdown Fungsi di halaman Kegiatan
- ✅ Kegiatan "Administrasi Perkantoran" tidak hilang dari DB, tapi tidak tampil di dropdown

**Status:** ⬜ Belum diuji

---

### [TC-08] Master Kegiatan Page — Load & Display

**Tujuan:** Halaman Kegiatan menampilkan daftar dengan filter fungsi.

**Langkah:**
1. Klik **Master Kegiatan** di sidebar
2. Perhatikan halaman

**Ekspektasi:**
- ✅ Breadcrumb: "Admin / Master Data / Master Kegiatan"
- ✅ Dropdown filter "Semua Fungsi" terlihat (dengan 5 opsi aktif + 1 nonaktif tidak muncul)
- ✅ Tabel menampilkan 9 kegiatan (Umum sudah tidak ada)
- ✅ Kolom: No, Nama Kegiatan, Fungsi, Deskripsi, Aksi
- ✅ Tombol **Tambah Kegiatan** visible (disabled jika tidak ada fungsi aktif)

**Status:** ⬜ Belum diuji

---

### [TC-09] Filter Kegiatan by Fungsi

**Tujuan:** Filter dropdown berfungsi.

**Langkah:**
1. Buka halaman **Master Kegiatan**
2. Pilih **Sosial** dari dropdown "Semua Fungsi"

**Ekspektasi:**
- ✅ Tabel hanya menampilkan SAKERNAS, SUSENAS, PODES (3 kegiatan Sosial)
- ✅ Filter aktif (dropdown tetap di "Sosial")

**Status:** ⬜ Belum diuji

---

### [TC-10] Create Kegiatan — Success

**Tujuan:** ADMIN bisa menambah kegiatan baru.

**Langkah:**
1. Pastikan filter fungsi = "Sosial" (atau pilih salah satu)
2. Klik **Tambah Kegiatan**
3. Isi:
   - Fungsi: "Distribusi" (ubah dari dropdown)
   - Nama: `Survei Biaya Hidup`
   - Deskripsi: `Pengumpulan data biaya hidup rumah tangga`
4. Klik **Tambah**

**Ekspektasi:**
- ✅ Modal tertutup
- ✅ Kegiatan baru muncul di tabel (mungkin di bawah tergantung sorting)

**Status:** ⬜ Belum diuji

---

### [TC-11] Create Kegiatan — Duplicate dalam Fungsi

**Tujuan:** Tidak bisa ada duplikat nama kegiatan dalam satu fungsi.

**Langkah:**
1. Pastikan filter fungsi = "Sosial"
2. Klik **Tambah Kegiatan**
3. Isi: Fungsi = "Sosial", Nama = `SAKERNAS` (sudah ada)
4. Klik **Tambah**

**Ekspektasi:**
- ✅ Error: `"Kegiatan "SAKERNAS" sudah ada di fungsi "Sosial""`
- ✅ Modal tidak tertutup

**Status:** ⬜ Belum diuji

---

### [TC-12] Nonaktifkan Kegiatan

**Tujuan:** Soft delete kegiatan tidak menghapus kelengkapan.

**Langkah:**
1. Pilih fungsi "Sosial", cari kegiatan "PODES"
2. Klik ikon **Hapus**
3. Baca dialog — seharusnya warning tentang kelengkapan
4. Klik **Nonaktifkan**

**Ekspektasi:**
- ✅ PODES hilang dari tabel
- ✅ Kelengkapan PODES (jika ada) tetap di DB

**Status:** ⬜ Belum diuji

---

### [TC-13] Kelengkapan Dokumen — Load & Cascade Dropdown

**Tujuan:** Pilih fungsi → kegiatan ter-filter → kelengkapan tampil.

**Langkah:**
1. Klik **Kelengkapan Dokumen** di sidebar
2. Pilih fungsi: **Sosial**
3. Pilih kegiatan: **SAKERNAS**

**Ekspektasi:**
- ✅ Setelah pilih fungsi Sosial → dropdown kegiatan menampilkan SAKERNAS, SUSENAS, PODES
- ✅ Setelah pilih SAKERNAS → dua section muncul:
  - "Kelengkapan Ketua Tim" (6 item)
  - "Kelengkapan Anggota" (3 item)
- ✅ Item "WAJIB" ditandai dengan badge orange

**Status:** ⬜ Belum diuji

---

### [TC-14] Kelengkapan — Tambah Item

**Tujuan:** ADMIN bisa menambah dokumen kelengkapan baru.

**Langkah:**
1. Di section "Kelengkapan Ketua Tim", klik **Tambah**
2. Modal terbuka
3. Isi: Nama Dokumen = `Daftar Hadir`
4. Checkbox "Wajib" biarkan checked
5. Klik **Tambah**

**Ekspektasi:**
- ✅ Modal tertutup
- ✅ Item baru muncul di list
- ✅ Badge "WAJIB" terlihat

**Status:** ⬜ Belum diuji

---

### [TC-15] Kelengkapan — Edit Item

**Tujuan:** ADMIN bisa edit nama dan status required.

**Langkah:**
1. Di "Kelengkapan Ketua Tim", arahkan cursor ke item "Surat Tugas"
2. Klik ikon **Edit**
3. Ubah Nama jadi `Surat Tugas Resmi`
4. Uncheck "Wajib"
5. Klik **Simpan**

**Ekspektasi:**
- ✅ Item berubah di list
- ✅ Badge "WAJIB" hilang (karena unchecked)
- ✅ Icon berubah dari CheckCircle2 ke Circle

**Status:** ⬜ Belum diuji

---

### [TC-16] Kelengkapan — Hapus Item

**Tujuan:** ADMIN bisa hapus dokumen kelengkapan.

**Langkah:**
1. Cari item yang baru ditambahkan "Daftar Hadir"
2. Klik ikon **Hapus** (trash)
3. Dialog konfirmasi tampil
4. Klik **Hapus**

**Ekspektasi:**
- ✅ Item hilang dari list
- ✅ (Hard delete — data benar-benar dihapus dari DB)

**Status:** ⬜ Belum diuji

---

### [TC-17] Auth — Non-ADMIN Tidak Bisa Create/Edit/Delete

**Tujuan:** Hanya ADMIN yang bisa mutate data master.

**Langkah:**
1. Login sebagai user PEGAWAI (bukan ADMIN)
2. Buka DevTools → Network
3. Buka `http://localhost:3000/api/master-fungsi`
4. Kirim POST request (via fetch/curl) dengan body `{ "nama": "Test" }`

**Ekspektasi:**
- ✅ GET `/api/master-fungsi` → 200 (public read)
- ✅ POST `/api/master-fungsi` → 401 Unauthorized

**Langkah alternatif (via UI):**
1. Login sebagai PEGAWAI
2. Buka `/admin/master-data/fungsi` (seharusnya redirect ke `/forbidden`)

**Status:** ⬜ Belum diuji

---

### [TC-18] Seed Data — Semua Data Awal Ada

**Tujuan:** Seed migration membuat data awal yang cukup.

**Langkah:**
1. Buka halaman **Departemen Fungsi**
2. Hitung jumlah fungsi
3. Buka halaman **Master Kegiatan**
4. Filter fungsi = Sosial → hitung kegiatan
5. Buka halaman **Kelengkapan Dokumen**
6. Pilih Sosial → SAKERNAS → hitung kelengkapan

**Ekspektasi:**
- ✅ Fungsi = 6 (Sosial, Distribusi, Neraca, Produksi, Umum, IPDS)
- ✅ Kegiatan Sosial = 3 (SAKERNAS, SUSENAS, PODES)
- ✅ Kelengkapan SAKERNAS Ketua Tim = 6
- ✅ Kelengkapan SAKERNAS Anggota = 3

**Status:** ⬜ Belum diuji

---

### [TC-19] Non-ADMIN User Cannot Access Admin Pages

**Tujuan:** Halaman master data hanya untuk ADMIN.

**Langkah:**
1. Login sebagai PEGAWAI (single role)
2. Buka DevTools → Network
3. Kirim request POST ke `/api/master-fungsi` dengan cookie session PEGAWAI

**Ekspektasi:**
- ✅ Response: 403 Forbidden
- ✅ Message: `"Hanya ADMIN yang bisa..."`

**Status:** ⬜ Belum diuji

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Master User page load | ⬜ | ⬜ | ⬜ | |
| 2 | Departemen Fungsi page + seed data | ⬜ | ⬜ | ⬜ | |
| 3 | Create fungsi (success) | ⬜ | ⬜ | ⬜ | |
| 4 | Create fungsi (duplicate nama) | ⬜ | ⬜ | ⬜ | |
| 5 | Create fungsi (nama kosong) | ⬜ | ⬜ | ⬜ | |
| 6 | Edit fungsi | ⬜ | ⬜ | ⬜ | |
| 7 | Nonaktifkan fungsi (soft delete) | ⬜ | ⬜ | ⬜ | |
| 8 | Konsekuensi: fungsi tidak muncul di dropdown kegiatan | ⬜ | ⬜ | ⬜ | |
| 9 | Master Kegiatan page + seed data | ⬜ | ⬜ | ⬜ | |
| 10 | Filter kegiatan by fungsi | ⬜ | ⬜ | ⬜ | |
| 11 | Create kegiatan (success) | ⬜ | ⬜ | ⬜ | |
| 12 | Create kegiatan (duplicate dalam fungsi) | ⬜ | ⬜ | ⬜ | |
| 13 | Nonaktifkan kegiatan (kelengkapan tidak ikut hilang) | ⬜ | ⬜ | ⬜ | |
| 14 | Kelengkapan cascade dropdown (fungsi → kegiatan) | ⬜ | ⬜ | ⬜ | |
| 15 | Kelengkapan Ketua Tim + Anggota display | ⬜ | ⬜ | ⬜ | |
| 16 | Tambah item kelengkapan | ⬜ | ⬜ | ⬜ | |
| 17 | Edit item kelengkapan | ⬜ | ⬜ | ⬜ | |
| 18 | Hapus item kelengkapan | ⬜ | ⬜ | ⬜ | |
| 19 | Non-ADMIN: read accessible | ⬜ | ⬜ | ⬜ | |
| 20 | Non-ADMIN: write forbidden (403) | ⬜ | ⬜ | ⬜ | |
| 21 | Seed data: 6 fungsi | ⬜ | ⬜ | ⬜ | |
| 22 | Seed data: kegiatan per fungsi | ⬜ | ⬜ | ⬜ | |
| 23 | Seed data: kelengkapan SAKERNAS | ⬜ | ⬜ | ⬜ | |
| 24 | Build succeeds | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| — | — | — | — | — |

---

## Catatan Debugging

| Masalah | Penyebab Potensial |
|---|---|
| Seed data tidak muncul | Migration `002_master_data.sql` belum dijalankan di Supabase |
| Dropdown fungsi kosong | master_fungsi table kosong atau semua fungsi is_active=false |
| Kegiatan tidak muncul setelah pilih fungsi | master_kegiatan.fungsi_id tidak cocok dengan master_fungsi.id |
| Create/update gagal dengan 500 | Supabase connection error atau RLS policy issue |
| Duplicate error tidak muncul | Validasi duplikat di server tidak jalan |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan
