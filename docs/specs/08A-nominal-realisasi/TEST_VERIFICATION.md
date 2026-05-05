# Test & Verification Guide: 08A — Nominal Realisasi Foundation

## Overview

Fondasi untuk menyimpan `nominal_realisasi` pada dokumen transaksi. Implementasi meliputi:
- Kolom database baru (`nominal_realisasi`, `is_non_material`)
- Zod validation schemas
- API endpoint untuk submit dan update nominal

## Prerequisites

- Database migration `016_nominal_realisasi.sql` sudah di-run
- App running di `localhost:3000`
- Login credentials untuk testing (user biasa, arsiparis, admin)

---

## Test Cases

### [TC-01] Submit dokumen Material dengan nominal

**Tujuan:** Verifikasi dokumen Material wajib memiliki nominal > 0

**Langkah:**
1. Login sebagai pegawai
2. Buat dokumen baru dengan `nominal_realisasi: 100000` dan `is_non_material: false`
3. Submit dokumen

**Ekspektasi:**
- Dokumen berhasil dibuat dengan status `IN_PPK_VALIDATION`
- Field `nominal_realisasi` tersimpan = 100000
- Field `is_non_material` tersimpan = false

**Status:** ⬜ Belum diuji

---

### [TC-02] Submit dokumen Material TANPA nominal

**Tujuan:** Verifikasi validasi menolak dokumen Material tanpa nominal

**Langkah:**
1. Login sebagai pegawai
2. Buat dokumen baru dengan `nominal_realisasi: null` atau tidak dikirim, dan `is_non_material: false`
3. Submit dokumen

**Ekspektasi:**
- Error 400: "Nominal_realisasi wajib untuk dokumen Material"
- Dokumen TIDAK dibuat

**Status:** ⬜ Belum diuji

---

### [TC-03] Submit dokumen Material dengan nominal = 0

**Tujuan:** Verifikasi nominal 0 tidak dianggap valid untuk Material

**Langkah:**
1. Login sebagai pegawai
2. Buat dokumen baru dengan `nominal_realisasi: 0` dan `is_non_material: false`
3. Submit dokumen

**Ekspektasi:**
- Error 400: "Nominal_realisasi wajib untuk dokumen Material"
- Dokumen TIDAK dibuat

**Status:** ⬜ Belum diuji

---

### [TC-04] Submit dokumen Non-Material

**Tujuan:** Verifikasi dokumen Non-Material boleh tanpa nominal

**Langkah:**
1. Login sebagai pegawai
2. Buat dokumen baru dengan `nominal_realisasi: null` dan `is_non_material: true`
3. Submit dokumen

**Ekspektasi:**
- Dokumen berhasil dibuat
- Field `nominal_realisasi` = null
- Field `is_non_material` = true

**Status:** ⬜ Belum diuji

---

### [TC-05] Update nominal oleh creator

**Tujuan:** Verifikasi creator bisa update nominal pada dokumen miliknya

**Langkah:**
1. Login sebagai pegawai
2. Buat dokumen baru (dari TC-01 atau TC-04)
3. PATCH `/api/dokumen/[id]/nominal` dengan `{ nominal_realisasi: 150000 }`

**Ekspektasi:**
- Response: `{ success: true }`
- `nominal_realisasi` di-database berubah menjadi 150000
- Log aktivitas `UPDATE_NOMINAL` tercipta

**Status:** ⬜ Belum diuji

---

### [TC-06] Update nominal oleh arsiparis

**Tujuan:** Verifikasi arsiparis bisa update nominal dokumen milik orang lain

**Langkah:**
1. Login sebagai arsiparis
2. PATCH `/api/dokumen/[dokumen_id]/nominal` dengan `{ nominal_realisasi: 200000 }`

**Ekspektasi:**
- Response: `{ success: true }`
- Update berhasil (bukan 403 Forbidden)

**Status:** ⬜ Belum diuji

---

### [TC-07] Update nominal oleh user biasa (non-creator)

**Tujuan:** Verifikasi authorization — user biasa tidak bisa update

**Langkah:**
1. Login sebagai user B (bukan creator dokumen)
2. PATCH `/api/dokumen/[dokumen_id]/nominal` dengan `{ nominal_realisasi: 99999 }`

**Ekspektasi:**
- Response: 403 Forbidden "Akses ditolak"
- `nominal_realisasi` TIDAK berubah

**Status:** ⬜ Belum diuji

---

### [TC-08] Update nominal pada dokumen ARCHIVED

**Tujuan:** Verifikasi archived documents tidak bisa diupdate

**Langkah:**
1. Login sebagai arsiparis
2. PATCH `/api/dokumen/[archived_dokumen_id]/nominal` dengan `{ nominal_realisasi: 50000 }`

**Ekspektasi:**
- Response: 400 "Tidak bisa update dokumen yang sudah diarsipkan"

**Status:** ⬜ Belum diuji

---

### [TC-09] Archive dokumen propagasi nominal

**Tujuan:** Verifikasi nominal di-copy ke tabel arsip saat archive

**Langkah:**
1. Login sebagai arsiparis
2. Dokumen dengan `nominal_realisasi: 100000` berstatus COMPLETED
3. POST `/api/arsiparis/dokumen/[id]/archive`

**Ekspektasi:**
- Arsip berhasil dibuat
- Tabel `arsip` memiliki `nominal_realisasi: 100000` yang sama dengan dokumen

**Status:** ⬜ Belum diuji

---

### [TC-10] Backward compatibility — submit tanpa field baru

**Tujuan:** Verifikasi existing form (tanpa field baru) tetap bisa submit

**Langkah:**
1. Login sebagai pegawai
2. Submit dokumen TANPA field `nominal_realisasi` dan `is_non_material` di body

**Ekspektasi:**
- Dokumen berhasil dibuat
- `nominal_realisasi` default = 0
- `is_non_material` default = false

**Status:** ⬜ Belum diuji

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Submit Material + nominal | ⬜ | ⬜ | ⬜ | |
| 2 | Submit Material - nominal (reject) | ⬜ | ⬜ | ⬜ | |
| 3 | Submit Material nominal=0 (reject) | ⬜ | ⬜ | ⬜ | |
| 4 | Submit Non-Material | ⬜ | ⬜ | ⬜ | |
| 5 | Update nominal oleh creator | ⬜ | ⬜ | ⬜ | |
| 6 | Update nominal oleh arsiparis | ⬜ | ⬜ | ⬜ | |
| 7 | Update nominal ditolak (bukan creator) | ⬜ | ⬜ | ⬜ | |
| 8 | Update nominal pada archived (reject) | ⬜ | ⬜ | ⬜ | |
| 9 | Archive propagasi nominal | ⬜ | ⬜ | ⬜ | |
| 10 | Backward compatibility | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| - | - | - | - | - |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan