# Spec: 01 — Auth & RBAC Foundation

## Overview
Fondasi autentikasi dan role-based access control. Semua user login via Supabase Auth, dan akses ke halaman/fitur dikunci berdasarkan Role yang dimiliki user (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN).

---

## Background / Konteks
Tanpa auth, tidak ada akses kontrol. Tanpa RBAC, semua user bisa akses tudo. Fondasi ini menjadi pondasi semua komponen lain — jika ini salah, semua komponen downstream akan terpengaruh.

---

## User Stories
- Sebagai **Pegawai**, saya ingin login dengan email/password saya, agar saya bisa mengakses aplikasi sesuai role saya.
- Sebagai **Admin**, saya ingin mengelola user dan role mereka, agar aplikasi tetap akurat.
- Sebagai **sistem**, saya ingin setiap halaman dicek role-nya di server, agar user tidak bisa mengakali akses via curl/Postman.

---

## Scope — Termasuk
- Login / Logout via Supabase Auth
- Middleware SSR: proteksi halaman berdasarkan role
- RLS policies: data user hanya bisa dibaca oleh user itu sendiri
- Seed data awal: 5 role static (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN)
- Helper `getUserRole()` di server untuk cek role di server functions
- Halaman `/login` (tanpa register — admin yang provision user)
- Dashboard sederhana per role (redirect after login)

---

## Scope — Tidak Termasuk
- Register / Signup oleh user sendiri (admin yang buat user)
- Edit profile / change password (ditunda ke iterasi berikutnya)
- MFA / SSO (ditunda ke fase production)
- Session refresh token manual (handled by Supabase SDK)

---

## Perubahan yang Diperlukan

### Data / Model / Schema

**Tabel `roles`** (seed only, tidak ada CRUD di MVP):
```sql
INSERT INTO roles (nama, deskripsi) VALUES
  ('PEGAWAI', 'Role dasar — semua pegawai punya role ini'),
  ('PPK', 'Pejabat Pembuat Komitmen — validasi dokumen'),
  ('BENDAHARA', 'Bendahara — approve pencairan'),
  ('ARSIPARIS', 'Arsiparis — arsipkan dokumen'),
  ('ADMIN', 'Administrator — kelola user & master data');
```

**Tabel `user_roles`** (supabase auth.users → roles mapping):
```typescript
user_roles: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id: uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at: timestamp DEFAULT now(),
  UNIQUE(user_id, role_id)
}
```

**RLS Policies untuk `user_roles`:**
- SELECT: user bisa baca role miliknya sendiri
- INSERT: hanya ADMIN
- DELETE: hanya ADMIN

**RLS Policies untuk `auth.users` (profile):**
- SELECT: user baca profil dirinya sendiri
- UPDATE: user update profil dirinya sendiri (nama, dll)

### API / Server Functions

```typescript
// src/routes/api/auth/login.ts
// POST /api/auth/login → redirect ke dashboard

// src/routes/api/auth/logout.ts
// POST /api/auth/logout → clear session

// src/lib/auth.ts
getUserRole(userId: string): Promise<Role[]>
hasRole(userId: string, role: Role): Promise<boolean>
requireRole(userId: string, role: Role): void | throws 403
requireAnyRole(userId: string, roles: Role[]): void | throws 403
getSession(): Promise<Session | null>
```

### Middleware SSR (TanStack Start)

```
/login              → public (redirect if already logged in)
/                   → redirect based on primary role
/admin/*            → ADMIN only
/arsiparis/*        → ARSIPARIS only
/ppk/*              → PPK only
/bendahara/*        → BENDAHARA only
/dokumen/*          → PEGAWAI (dan PPK, BENDAHARA, ARSIPARIS)
/api/auth/*         → public
/api/*              → authenticated (role checked per endpoint)
```

### UI / Frontend
- `/login` — halaman login dengan email + password
- `AppLayout` — sidebar navigasi yang berubah sesuai role aktif
- Redirect logic setelah login: detect primary role → navigate ke halaman yang sesuai

### Role Switcher (Multi-Role Dropdown)
- **Kondisi:** User punya lebih dari satu role (misal: PEGAWAI + PPK)
- **Lokasi:** Pojok kanan atas — ikon profile + label role aktif
- **Behavior:** Klik → dropdown menampilkan semua role yang dimiliki user → pilih role → UI refresh menampilkan halaman sesuai role tersebut
- **Contoh:** PPK yang juga PEGAWAI — dropdown menampilkan "PEGAWAI" dan "PPK"
- **ADMIN tidak punya dropdown** — akun ADMIN adalah akun terpisah, bukan role switching
- **Session simpan `active_role`**: role yang sedang aktif disimpan di localStorage atau session, agar saat reload halaman role tetap konsisten

### Logic / Business Rules
- **Every user dibuat dengan role PEGAWAI secara default** — semua pegawai otomatis punya akses dasar
- **Multi-role:** user bisa punya 1 atau lebih role — role switcher muncul jika user punya > 1 role
- **ADMIN:** akun dedicated, login terpisah, tidak punya dropdown role, hanya bisa akses `/admin/*`
- **Active role** disimpan di session/client state, dipakai untuk middleware dan sidebar
- Route access check: user boleh akses route X jika **salah satu** dari role-nya mengizinkan


---

## Dependensi
- **Bergantung pada:** —
- **Dibutuhkan oleh:** Komponen 02, 03, 04, 05 — semua butuh auth

---

## Definition of Done
- [ ] Login page bisa login dengan email/password Supabase Auth
- [ ] Logout clear session dan redirect ke /login
- [ ] Role switcher dropdown muncul di kanan atas jika user punya > 1 role
- [ ] Switch role → sidebar & halaman berubah sesuai role aktif
- [ ] Role aktif bertahan setelah reload halaman
- [ ] Halaman `/admin/*` mengembalikan 403 untuk non-ADMIN
- [ ] Halaman `/arsiparis/*` mengembalikan 403 untuk non-ARSIPARIS
- [ ] `getUserRole()` mengembalikan array role yang benar
- [ ] `requireRole()` throw 403 jika user tidak punya role
- [ ] RLS policy: user hanya bisa baca data miliknya
- [ ] Seed data 5 role berhasil di-insert
- [ ] ADMIN login → langsung ke `/admin`, tanpa dropdown role
- [ ] User baru (PEGAWAI) yang di-promote PPK → punya 2 role, dropdown berfungsi

---

## Estimasi Kompleksitas
**Rendah** —主要是 Supabase Auth + RLS + middleware. Pattern sudah well-documented di TanStack Start + Supabase.

---

## Catatan / Risiko
- **Risiko:** Konfigurasi Supabase URL + anon key harus ada di `.env` sebelum testing. Pastikan `.env.example` sudah dibuat.
- **Asumsi:** Setiap pegawai akan di-provision oleh admin secara manual. Tidak ada self-registration.
- **Catatan:** RLS untuk tabel `user_roles` perlu join — Supabase RLS不支持 direct join antar tabel, jadi gunakan function-based policy.
