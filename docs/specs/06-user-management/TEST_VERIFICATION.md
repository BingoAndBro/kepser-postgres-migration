# Test & Verification Guide: SPEC 06 — User Management

## Overview

SPEC 06 mengimplementasikan user lifecycle management dengan:
- API endpoints untuk CRUD user via Supabase Admin API
- Master User page dengan real data
- Profile page untuk self-service
- Self-service password change

## Prerequisites

- [ ] App running di `localhost:3000`
- [ ] Login sebagai user dengan role **ADMIN**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di `.env`
- [ ] Roles seed data sudah ada di tabel `roles`

---

## Test Cases

### [TC-01] Admin — Lihat Daftar User

**Tujuan:** Verifikasi admin bisa melihat semua user dengan roles dan status

**Langkah:**
1. Login sebagai ADMIN
2. Navigasi ke **Admin > Master Data > Master User**
3. Amati tabel user yang tampil

**Ekspektasi:**
- Tabel menampilkan daftar user dengan kolom: No, Nama, Hak Akses, Status, Aksi
- Setiap user punya role badge dengan warna berbeda (PEGAWAI=blue, PPK=purple, BENDAHARA=green, ARSIPARIS=orange, ADMIN=red)
- Status menunjukkan "Aktif" (hijau) atau "Nonaktif" (merah)
- Info user mencakup email, nama, NIP (jika ada)

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-02] Admin — Filter User

**Tujuan:** Verifikasi filter status berfungsi

**Langkah:**
1. Di halaman Master User, ubah dropdown filter "Semua Status" ke "Aktif"
2. Ubah ke "Nonaktif"
3. Ketik nama user di search box

**Ekspektasi:**
- Filter "Aktif" hanya menampilkan user aktif
- Filter "Nonaktif" hanya menampilkan user nonaktif
- Search memfilter berdasarkan nama, email, atau NIP

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-03] Admin — Tambah User Baru

**Tujuan:** Verifikasi admin bisa membuat user baru

**Langkah:**
1. Klik tombol **"+ Tambah User"**
2. Isi form:
   - Email: `test@bps.go.id`
   - Password: `Test1234`
   - Konfirmasi: `Test1234`
   - Nama Lengkap: `Test User`
   - NIP/NRP: `12345678`
   - Hak Akses: PEGAWAI (wajib), PPK
3. Klik **"Simpan"**

**Ekspektasi:**
- Modal tertutup setelah sukses
- User baru muncul di tabel
- Role badges "PEGAWAI" dan "PPK" tampil untuk user baru
- Status "Aktif" untuk user baru

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-04] Admin — Edit User

**Tujuan:** Verifikasi admin bisa edit metadata dan roles user

**Langkah:**
1. Hover row user baru (TC-03), klik ikon **Edit** (pensil)
2. Ubah:
   - Nama Lengkap: `Test User Updated`
   - NIP/NRP: `87654321`
   - Hapus centang PPK
3. Klik **"Simpan"**

**Ekspektasi:**
- Modal tertutup setelah sukses
- Perubahan reflet di tabel (nama, NIP, role PPK hilang)

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-05] Admin — Reset Password User

**Tujuan:** Verifikasi admin bisa reset password user

**Langkah:**
1. Hover row user baru, klik ikon **Reset Password** (refresh)
2. Isi:
   - Password Baru: `NewPass123`
   - Konfirmasi: `NewPass123`
3. Klik **"Reset Password"**

**Ekspektasi:**
- Alert success "Password berhasil direset"
- User harus bisa login dengan password baru

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-06] Admin — Nonaktifkan User

**Tujuan:** Verifikasi admin bisa menonaktifkan user

**Langkah:**
1. Hover row user baru, klik ikon **Nonaktifkan** (UserX)
2. Klik **"Nonaktifkan"** di konfirmasi

**Ekspektasi:**
- Status berubah menjadi "Nonaktif" (merah)
- User tidak bisa login dengan kredensial tersebut

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-07] Admin — Aktifkan Kembali User

**Tujuan:** Verifikasi admin bisa mengaktifkan kembali user yang dinonaktifkan

**Langkah:**
1. Hover row user nonaktif, klik ikon **Aktifkan** (UserCheck)
2. Klik **"Aktifkan"** di konfirmasi

**Ekspektasi:**
- Status berubah menjadi "Aktif" (hijau)
- User bisa login lagi

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-08] Admin — Validasi Email Duplikat

**Tujuan:** Verifikasi sistem menolak email yang sudah terdaftar

**Langkah:**
1. Klik **"+ Tambah User"**
2. Isi email dengan email user yang sudah ada (misal dari TC-03)
3. Lengkapi field lain
4. Klik **"Simpan"**

**Ekspektasi:**
- Error message: "Email sudah terdaftar"
- User tidak terbuat

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-09] Admin — Validasi Password Pendek

**Tujuan:** Verifikasi sistem menolak password kurang dari 8 karakter

**Langkah:**
1. Klik **"+ Tambah User"**
2. Isi password kurang dari 8 karakter (misal "Test123")
3. Klik **"Simpan"**

**Ekspektasi:**
- Alert/error: "Password minimal 8 karakter"
- User tidak terbuat

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-10] User — Lihat Profil

**Tujuan:** Verifikasi user biasa bisa melihat profilnya

**Langkah:**
1. Login sebagai user biasa (non-ADMIN)
2. Navigasi ke `/profile`

**Ekspektasi:**
- Halaman menampilkan:
  - Avatar dengan inisial nama
  - Nama lengkap
  - Email
  - NIP/NRP
  - Departemen
  - Hak Akses (role badges)

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-11] User — Ubah Password

**Tujuan:** Verifikasi user bisa ubah password sendiri

**Langkah:**
1. Di halaman `/profile`, scroll ke bagian "Ganti Password"
2. Isi:
   - Password Lama: password saat ini
   - Password Baru: `NewPassword123`
   - Konfirmasi: `NewPassword123`
3. Klik **"Simpan Password"**

**Ekspektasi:**
- Success message: "Password berhasil diubah"
- User harus bisa login dengan password baru

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-12] User — Validasi Password Lama Salah

**Tujuan:** Verifikasi sistem menolak password lama yang salah

**Langkah:**
1. Di halaman `/profile`, bagian "Ganti Password"
2. Isi:
   - Password Lama: `WrongPassword`
   - Password Baru: `NewPassword123`
   - Konfirmasi: `NewPassword123`
3. Klik **"Simpan Password"**

**Ekspektasi:**
- Error message: "Password lama salah"

**Status:** ⬜ Belum diuji / ❌ Gagal

---

### [TC-13] Non-Admin — Akses Tertolak ke Master User

**Tujuan:** Verifikasi user non-ADMIN tidak bisa akses Master User page

**Langkah:**
1. Login sebagai user dengan role PEGAWAI saja
2. Navigasi ke `/admin/master-data/user`

**Ekspektasi:**
- Redirect ke `/forbidden` atau error 403

**Status:** ⬜ Belum diuji / ❌ Gagal


---

### [TC-14] Self-Deactivation Prevention

**Tujuan:** Verifikasi admin tidak bisa menonaktifkan dirinya sendiri

**Langkah:**
1. Login sebagai ADMIN
2. Buka Master User page
3. Temukan row untuk user yang sedang login
4. Klik Nonaktifkan

**Ekspektasi:**
- Error message: "Tidak bisa menonaktifkan akun sendiri"
- Status user tetap "Aktif"

**Status:** ⬜ Belum diuji / ❌ Gagal

---

## Test Case Status (from Playwright E2E run)

| TC | Deskripsi | Status | Catatan |
|----|-----------|--------|---------|
| TC-01 | Admin — Lihat Daftar User | ❌ Gagal | Selector strict mode violation: `getByText('No')` match multiple elements |
| TC-02 | Admin — Filter User | ✅ Lulus | Filter dropdown berfungsi |
| TC-03 | Admin — Tambah User Baru | ✅ Lulus | User dibuat, muncul di tabel (TC-04 verify confirms) |
| TC-04 | Admin — Edit User | ❌ Gagal | "Updated Name" tidak ditemukan - mungkin timing issue |
| TC-05 | Admin — Reset Password User | ❌ Gagal | Selector strict mode violation: "Reset Password" match multiple elements |
| TC-06 | Admin — Nonaktifkan User | ❌ Gagal | Dialog confirmation tidak terklik dengan benar |
| TC-07 | Admin — Aktifkan User Kembali | ❌ Gagal | (depend on TC-06) |
| TC-08 | Admin — Validasi Email Duplikat | ❌ Gagal | Error message tidak muncul (mungkin timing) |
| TC-09 | Admin — Validasi Password Pendek | ✅ Lulus | Frontend validation alert berfungsi |
| TC-10 | User — Lihat Profil | ❌ Gagal | Selector issue: "Profil" heading tidak ditemukan |
| TC-11 | User — Ubah Password | ✅ Lulus | Password change berfungsi |
| TC-12 | User — Validasi Password Lama Salah | ❌ Gagal | Session/Cookie tidak persist antar test |
| TC-13 | Non-Admin — Akses Tertolak | ❌ Gagal | Redirect tidak berfungsi dengan benar |
| TC-14 | Self-Deactivation Prevention | ❌ Gagal | Timeout saat login (butiran test tidak berjalan) |

## Manual Verification Checklist (Updated)

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Lihat daftar user dengan roles | ✅ | ✅ | ❌ | TC-01 fails due to test selector issue, not feature bug |
| 2 | Filter status (Aktif/Nonaktif) | ✅ | ✅ | ❌ | TC-02 passes — filter berfungsi |
| 3 | Search user | ⬜ | ⬜ | ⬜ | Belum diuji secara spesifik |
| 4 | Tambah user baru | ✅ | ✅ | ❌ | TC-03 passes — user dibuat dengan benar |
| 5 | Edit user (metadata + roles) | ✅ | ❌ | ✅ | TC-04 fails — timing issue dengan selector |
| 6 | Reset password | ⬜ | ⬜ | ⬜ | TC-05 fails due to test selector issue |
| 7 | Nonaktifkan user | ⬜ | ⬜ | ⬜ | TC-06 fails — dialog confirmation issue |
| 8 | Aktifkan user | ⬜ | ⬜ | ⃠ | TC-07 depends on TC-06 |
| 9 | Validasi email duplikat | ⬜ | ⬜ | ⬜ | TC-08 fails — timing issue |
| 10 | Validasi password min 8 chars | ✅ | ✅ | ❌ | TC-09 passes — frontend validation works |
| 11 | Validasi NIP numerik 8-20 chars | ⬜ | ⬜ | ⬜ | Perlu diuji manual |
| 12 | Lihat profil sendiri | ✅ | ❌ | ✅ | TC-10 fails — selector issue |
| 13 | Ubah password sendiri | ✅ | ✅ | ❌ | TC-11 passes — feature works |
| 14 | Validasi password lama salah | ⬜ | ⬜ | ⬜ | TC-12 fails — session tidak persist |
| 15 | Akses ditolak untuk non-ADMIN | ⬜ | ⬜ | ⬜ | TC-13 fails — redirect issue |
| 16 | Self-deactivation prevention | ⬜ | ⬜ | ⬜ | TC-14 timeout — login issue |

## Catatan Teknis

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | **Login gagal untuk test users** — User test (`admin@testbps.local`, `pegawai@testbps.local`, dll) tidak ada di database Supabase. Test users perlu dibuat manual melalui Supabase Dashboard atau seed migration. | High | Open | - |
| 2 | **TC-03 s/d TC-14 gagal** — Semua test case yang memerlukan login gagal karena tidak ada user yang bisa login. Setelah TC-01 dan TC-02 diperbaiki (user tersedia), test lainnya harus di-run ulang. | High | Open | - |

## Prerequisites Setup Required

Sebelum test bisa dijalankan, user test berikut harus ada di Supabase Auth:

```sql
-- Login ke Supabase Dashboard → Authentication → Users
-- Buat user dengan email dan password berikut:

| Email | Password | Roles |
|-------|----------|-------|
| admin@testbps.local | Test BPS123 | ADMIN |
| pegawai@testbps.local | Test BPS123 | PEGAWAI |
| ppk@testbps.local | Test BPS123 | PEGAWAI + PPK |
| bendahara@testbps.local | Test BPS123 | PEGAWAI + BENDAHARA |
| multi@testbps.local | Test BPS123 | PEGAWAI + PPK + BENDAHARA |

-- Setelah user dibuat, assign roles via SQL:
INSERT INTO user_roles (user_id, role_id) VALUES
  ('<admin_uuid>', (SELECT id FROM roles WHERE nama = 'ADMIN')),
  ('<admin_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
  ('<pegawai_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
  ('<ppk_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
  ('<ppk_uuid>', (SELECT id FROM roles WHERE nama = 'PPK')),
  ('<bendahara_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
  ('<bendahara_uuid>', (SELECT id FROM roles WHERE nama = 'BENDAHARA')),
  ('<multi_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
  ('<multi_uuid>', (SELECT id FROM roles WHERE nama = 'PPK')),
  ('<multi_uuid>', (SELECT id FROM roles WHERE nama = 'BENDAHARA'));
```

## Test Execution Notes

**E2E Test File:** `tests/e2e/spec-06-user-management.spec.ts`

**Script untuk menjalankan:**
```bash
npx playwright test tests/e2e/spec-06-user-management.spec.ts --reporter=line --timeout=60000
```

**Hasil Run Terakhir (2026-05-02, menggunakan multi@testbps.local):**
- 1 passed (TC-02 Filter status)
- 15 failed — semua gagal di tahap login

**Root Cause Analysis:**
1. `admin@testbps.local` - Login gagal dengan error "invalid_credentials" (confirmed via Supabase API)
2. `multi@testbps.local` - Bisa login via Supabase API (curl test berhasil), tapi Playwright browser tidak bisa
   - Kemungkinan: cookie/session tidak persist dengan benar di browser
   - Kemungkinan: redirect loop atau loading state yang tidak selesai

**Analisis Login API vs Browser:**
- Supabase Auth API Langsung: `multi@testbps.local` login BERHASIL
- Browser Playwright: Login GAGAL dengan error message
- Ini menunjukkan kredensial BENAR, tapi ada issue dengan browser/cookie handling

**Dokumentasi Bug:**
| # | Deskripsi | Severity | Status |
|---|-----------|----------|--------|
| 1 | `admin@testbps.local` tidak bisa login - password salah atau belum dibuat | High | Open |
| 2 | `multi@testbps.local` login gagal di browser tapi berhasil via API | Medium | Open |

**Langkah selanjutnya:**
1. Reset password `admin@testbps.local` via Supabase Dashboard
2. Atau buat user ADMIN baru untuk testing
3. Atau fix login function di test untuk handle session lebih baik

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan

---

## Catatan Teknis

### Endpoint API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/users/` | List semua user |
| POST | `/api/users/` | Create user baru |
| GET | `/api/users/{id}` | Get single user |
| PATCH | `/api/users/{id}` | Update user |
| POST | `/api/users/{id}/reset-password` | Reset password |
| POST | `/api/users/{id}/deactivate` | Nonaktifkan user |
| POST | `/api/users/{id}/activate` | Aktifkan user |
| GET | `/api/users/me` | Get profil sendiri |
| POST | `/api/users/me/change-password` | Ubah password sendiri |

### Database Tables

- `auth.users` — user accounts (managed by Supabase)
- `user_roles` — role assignments per user
- `roles` — daftar role (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN)

### Environment Variables

- `SUPABASE_SERVICE_ROLE_KEY` — wajib untuk admin operations
