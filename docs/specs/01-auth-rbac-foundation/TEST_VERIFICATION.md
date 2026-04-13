# Test Verification Guide — Component 01: Auth & RBAC Foundation

## Prasyarat

1. `.env` sudah terisi dengan kredensial Supabase asli
2. Migration `001_auth_rbac.sql` sudah dijalankan di Supabase
3. Minimal 2 user tes sudah dibuat di Supabase Auth + role assignment

### Seed Data yang Harus Ada di Supabase

**Roles (otomatis dari migration):**
| ID (placeholder, cek dari Supabase) | Nama |
|---|---|
| — | PEGAWAI |
| — | PPK |
| — | BENDAHARA |
| — | ARSIPARIS |
| — | ADMIN |

**Test Users yang Perlu Dibuat Manual di Supabase Dashboard:**

| Email | Password | Roles |
|---|---|---|
| `pegawai@testbps.local` | `Test BPS123` | PEGAWAI |
| `ppk@testbps.local` | `Test BPS123` | PEGAWAI + PPK |
| `bendahara@testbps.local` | `Test BPS123` | PEGAWAI + BENDAHARA |
| `multi@testbps.local` | `Test BPS123` | PEGAWAI + PPK + BENDAHARA |
| `admin@testbps.local` | `Test BPS123` | ADMIN |

> Format email harus valid (tanpa spasi). Pakai domain `testbps.local` sebagai placeholder.
> Setelah buat user di Supabase Auth Dashboard, assign role dengan INSERT ke tabel `user_roles`:
> ```sql
> INSERT INTO user_roles (user_id, role_id) VALUES
>   ('<user_uuid>', (SELECT id FROM roles WHERE nama = 'PEGAWAI')),
>   ('<user_uuid>', (SELECT id FROM roles WHERE nama = 'PPK'));
> ```

---
## Test Case 01 — Login Correct Credentials

**Langkah:**
1. Buka `http://localhost:3000/login`
2. Masukkan email `pegawai@test BPS` dan password `Test BPS123`
3. Klik tombol "Masuk"
4. Perhatikan redirect URL

**Ekspektasi:**
- ✅ Redirect ke `http://localhost:3000/` (bukan /admin)
- ✅ Sidebar navigation terlihat (bukan halaman kosong)
- ✅ Tidak ada error message
- ✅ Cookie `dms_active_role=PEGAWAI` tersimpan di browser DevTools → Application → Cookies

---

## Test Case 02 — Login Wrong Password

**Langkah:**
1. Buka `http://localhost:3000/login`
2. Masukkan email `pegawai@test BPS` dan password `salahpassword`
3. Klik tombol "Masuk"

**Ekspektasi:**
- ✅ Tetap di halaman `/login`
- ✅ Muncul pesan error "Email atau password salah"
- ✅ Tidak ada redirect ke `/`
- ✅ Cookie `dms_active_role` TIDAK dibuat

---

## Test Case 03 — Login Non-existent User

**Langkah:**
1. Buka `http://localhost:3000/login`
2. Masukkan email `orangtidakada@test BPS` dan password `Test BPS123`
3. Klik tombol "Masuk"

**Ekspektasi:**
- ✅ Tetap di halaman `/login`
- ✅ Muncul pesan error "Email atau password salah"

---

## Test Case 04 — ADMIN Auto-redirect

**Langkah:**
1. Buka browser fresh (incognito/private window)
2. Login dengan `admin@test BPS` dan password `Test BPS123`
3. Perhatikan URL setelah login

**Ekspektasi:**
- ✅ Langsung redirect ke `http://localhost:3000/admin`
- ✅ Sidebar navigation untuk ADMIN terlihat (hanya menu terkait admin)
- ✅ Role switcher TIDAK muncul di header (ADMIN tidak bisa switch)

---

## Test Case 05 — Role Switcher Multi-role User

**Langkah:**
1. Login dengan `multi@test BPS`
2. Lihat header右上 — cari dropdown role switcher
3. Klik dropdown, lihat opsi yang tersedia

**Ekspektasi:**
- ✅ Dropdown role switcher TERLIHAT di header
- ✅ Terdapat 3 opsi: PEGAWAI, PPK, BENDAHARA (sesuai role user)
- ✅ Opsi aktif saat ini ada checkmark (✓)
- ✅ ADMIN TIDAK muncul di dropdown meskipun ada di enum schema

---

## Test Case 06 — Switch Role via Switcher

**Langkah:**
1. Login dengan `multi@test BPS`
2. Pastikan active role saat ini adalah PEGAWAI (default)
3. Klik dropdown role switcher
4. Pilih opsi "PPK"
5. Perhatikan perubahan

**Ekspektasi:**
- ✅ Setelah klik, page auto-reload (`window.location.reload()`)
- ✅ URL berubah sesuai menu PPK (atau `/ppk` jika belum ada halaman detail)
- ✅ Sidebar berubah menampilkan menu PPK
- ✅ Cookie `dms_active_role` berubah menjadi `PPK`
- ✅ Checkmark berpindah ke opsi PPK di dropdown

---

## Test Case 07 — Active Role Persistence

**Langkah:**
1. Login sebagai `ppk@test BPS`
2. Switch role ke PPK (jika belum)
3. Buka DevTools → Application → Cookies → `dms_active_role`
4. Copy value cookie, catat
5. Tekan F5 (refresh page)
6. Lihat apakah role tetap sama

**Ekspektasi:**
- ✅ Setelah refresh, sidebar tetap menunjukkan menu PPK
- ✅ Tidak ada redirect/change yang tidak diharapkan
- ✅ Cookie `dms_active_role=PPK` tetap ada

---

## Test Case 08 — Protected Route: PPK Page (Wrong Role)

**Langkah:**
1. Login sebagai `bendahara@test BPS` (role: PEGAWAI + BENDAHARA)
2. Buka `http://localhost:3000/ppk`

**Ekspektasi:**
- ✅ Redirect ke `/forbidden`
- ✅ Muncul halaman 403 dengan tombol "Kembali ke Beranda"
- ✅ Tidak bisa mengakses halaman PPK

---

## Test Case 09 — Protected Route: PPK Page (Correct Role)

**Langkah:**
1. Login sebagai `ppk@test BPS`
2. Buka `http://localhost:3000/ppk`

**Ekspektasi:**
- ✅ Bisa mengakses halaman PPK tanpa error
- ✅ Sidebar menunjukkan menu PPK aktif
- ✅ Tidak redirect ke `/forbidden`

---

## Test Case 10 — Protected Route: Bendahara Page

**Langkah:**
1. Login sebagai `ppk@test BPS` (role: PEGAWAI + PPK)
2. Buka `http://localhost:3000/bendahara`

**Ekspektasi:**
- ✅ Redirect ke `/forbidden` (karena tidak punya role BENDAHARA)

---

## Test Case 11 — Protected Route: Arsiparis Page

**Langkah:**
1. Login sebagai `pegawai@test BPS` (role: PEGAWAI only)
2. Buka `http://localhost:3000/arsiparis`

**Ekspektasi:**
- ✅ Redirect ke `/forbidden`

---

## Test Case 12 — Logout Flow

**Langkah:**
1. Login dengan `pegawai@test BPS`
2. Klik tombol logout (logout icon di header/sidebar)
3. Perhatikan perubahan halaman

**Ekspektasi:**
- ✅ Redirect ke `/login`
- ✅ Cookie `dms_active_role` di-delete (DevTools → Application → Cookies, cookie harus hilang atau expire)
- ✅ Tidak bisa langsung akses `http://localhost:3000/` tanpa login ulang

---

## Test Case 13 — Unauthenticated Access to Protected Route

**Langkah:**
1. Buka browser fresh (incognito/private window)
2. Langsung kunjungi `http://localhost:3000/`
3. Jangan login, langsung akses

**Ekspektasi:**
- ✅ Redirect ke `/login`
- ✅ Tidak ada konten halaman utama yang terlihat tanpa login

---

## Test Case 14 — Role Switcher Not Visible for Single Role

**Langkah:**
1. Login sebagai `pegawai@test BPS` (role: PEGAWAI only)
2. Lihat header右上

**Ekspektasi:**
- ✅ Role switcher dropdown TIDAK muncul
- ✅ Hanya navbar/login info yang terlihat

---

## Test Case 15 — ADMIN Cannot Switch Role

**Langkah:**
1. Login sebagai `admin@test BPS`
2. Lihat header右上

**Ekspektasi:**
- ✅ Role switcher TIDAK muncul meskipun mungkin punya multi-role
- ✅ ADMIN tidak bisa switch role (akun dedicated)

---

## Test Case 16 — API: Session Endpoint

**Langkah:**
1. Login sebagai `pegawai@test BPS`
2. Buka DevTools → Network tab
3. Reload halaman (untuk trigger session fetch)
4. Cari request ke `/api/auth/session`
5. Lihat Response

**Ekspektasi:**
- ✅ Response JSON berisi `session`, `roles`, `activeRole`
- ✅ `session.userId` tidak null
- ✅ `roles` array berisi minimal `["PEGAWAI"]`
- ✅ `activeRole` adalah salah satu dari roles

---

## Test Case 17 — API: Role Switch Validation

**Langkah:**
1. Login sebagai `pegawai@test BPS` (PEGAWAI only)
2. Buka DevTools → Application → Cookies
3. Edit cookie `dms_active_role` menjadi `PPK` secara manual
4. Reload halaman
5. Buka DevTools → Network → cari request ke `/api/auth/session`

**Ekspektasi:**
- ✅ Server mendeteksi cookie mismatch — `activeRole` di response akan fallback ke `getPrimaryRole(roles)` = `PEGAWAI` (karena PPK tidak ada di roles user)
- ✅ Tidak ada security bypass — user tidak bisa meng-set cookie ke role yang bukan miliknya

---

## Test Case 18 — Cross-tab Sync (Bonus)

**Langkah:**
1. Buka dua tab dengan `http://localhost:3000/`
2. Login di Tab 1 sebagai `multi@test BPS`
3. Switch role ke PPK di Tab 1
4. Di Tab 2, switch role ke BENDAHARA
5. Lihat apakah Tab 1 mendeteksi perubahan

**Ekspektasi:**
- ✅ Jika implementasi cross-tab sync via `storage` event listener aktif, Tab 1 akan reload otomatis saat Tab 2 mengubah cookie

---

## Catatan Debugging

| Masalah | Penyebab Potensial |
|---|---|
| Login gagal terus | Supabase Email Auth belum di-enable di Dashboard → Authentication → Providers |
| Cookie tidak persist | SameSite=Strict mungkin blocking di localhost; cek DevTools |
| Redirect loop | `beforeLoad` guard tidak redirect ke `/login` dengan benar |
| Role switch tidak reload | `handleRoleSwitch` tidak pakai `window.location.reload()` |
| Session API timeout | `createServerSupabaseClient` salah inisialisasi |

---

## Checklist Final — Component 01 Done

- [ ] Semua 15 test case PASS
- [ ] Tidak ada error di DevTools Console
- [ ] Tidak ada error di Network tab (kecuali favicon)
- [ ] Migration SQL sudah dijalankan
- [ ] Test users sudah dibuat di Supabase
- [ ] Cookie `dms_active_role` berfungsi dengan benar
- [ ] Role switcher hanya muncul untuk multi-role user
- [ ] ADMIN tidak bisa switch role
- [ ] Protected routes redirect dengan benar
