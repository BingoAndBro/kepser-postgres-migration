# SPEC 06: User Management

## Overview

Memberikan kemampuan penuh kepada ADMIN untuk mengelola user accounts dalam aplikasi DMS BPS — termasuk create, edit, deactivate, reactivate, dan reset password. Setiap user juga dapat mengganti password mereka sendiri secara self-service.

---

## Background / Konteks

Spec 01 (Auth & RBAC Foundation) membangun fondasi login dan role-based access. Spec 02 (Master Data) membangun fondasi data operasional. Aplikasi sudah punya 5 test user accounts yang dibuat manual melalui Supabase Dashboard.

Kondisi saat ini:
- **Create user** → harus ke Supabase Dashboard Authentication
- **Master User page** → mock data, tidak terhubung ke `auth.users`
- **No admin user management** dalam aplikasi
- **No self-service password change**

Spec 06 menutup gap ini sehingga admin bisa mengelola seluruh user lifecycle langsung dari dalam aplikasi, tanpa bergantung pada Supabase Dashboard.

---

## User Stories

- Sebagai **ADMIN**, saya ingin **membuat user baru** dengan email, password, nama lengkap, NIP/NRP, departemen, dan role, agar user bisa langsung login dan bekerja.
- Sebagai **ADMIN**, saya ingin **melihat daftar semua user** dengan role dan status mereka, agar saya bisa mengelola user secara terpusat.
- Sebagai **ADMIN**, saya ingin **mengedit metadata dan role** user yang sudah ada, agar data user tetap akurat.
- Sebagai **ADMIN**, saya ingin **menonaktifkan user** yang sudah tidak aktif, agar mantan pegawai tidak bisa login.
- Sebagai **ADMIN**, saya ingin **mengaktifkan kembali user** yang sebelumnya dinonaktifkan, agar user bisa login lagi jika dibutuhkan.
- Sebagai **ADMIN**, saya ingin **reset password** user, agar user yang lupa password bisa akses ulang tanpa kehilangan akun.
- Sebagai **USER** (seluruh role), saya ingin **mengganti password sendiri**, agar saya bisa menjaga keamanan akun saya.
- Sebagai **USER**, saya ingin **melihat profil saya** (nama, email, NIP, departemen, role), agar saya tahu informasi akun saya.

---

## Scope — Termasuk

### Admin: User Lifecycle Management
- [x] **Create user** — email, password, nama_lengkap (wajib), nip_nrp (wajib), departemen (opsional), role assignment
- [x] **View all users** — tabel dengan nama, email, departemen, role(s), status (Aktif/Nonaktif), tanggal dibuat
- [x] **Edit user** — ubah nama_lengkap, nip_nrp, departemen, dan role(s)
- [x] **Deactivate user** — disable di Supabase Auth, `user_roles` tetap utuh (audit trail)
- [x] **Reactivate user** — enable kembali di Supabase Auth
- [x] **Reset password** — admin set password baru untuk user

### User: Self-Service
- [x] **View profile** — tampilkan nama, email, NIP, departemen, role(s)
- [x] **Change password** — user ubah password sendiri (wajib isi password lama + password baru + konfirmasi)

### Data & API
- [x] **Supabase Admin API integration** — `supabase-admin` client untuk operasi server-side
- [x] **Metadata storage** — `auth.users` `user_metadata` field untuk nama_lengkap, nip_nrp, departemen
- [x] **API endpoints** — CRUD operations via `/api/users` (read all), `/api/users/[id]` (read/update/delete), `/api/users/[id]/reset-password`, `/api/users/[id]/activate`, `/api/users/[id]/deactivate`
- [x] **UI page** — `/admin/master-data/user` dengan real data dari database

### Auth Security
- [x] **Password policy** — minimal 8 karakter
- [x] **ADMIN-only guards** — semua user management API dilindungi middleware ADMIN
- [x] **Self-service guards** — user hanya bisa change-password untuk akunnya sendiri

---

## Scope — Tidak Termasuk

- [ ] User self-register / invite via email link
- [ ] User edit profile fields sendiri (nama, NIP, departemen)
- [ ] Bulk user creation
- [ ] Import user dari CSV
- [ ] User delete (hard delete dari auth.users — tidak didukung Supabase)
- [ ] Login via SSO / OAuth
- [ ] Two-factor authentication (2FA)
- [ ] Login activity / session management per user

---

## Perubahan yang Diperlukan

### Data / Model / Schema

**`auth.users` metadata** (field `raw_user_meta_data` di Supabase):
```typescript
interface UserMetadata {
  nama_lengkap: string   // wajib saat create
  nip_nrp: string       // wajib saat create
  departemen?: string   // opsional — label tekstual, bukan FK ke master_fungsi
}
```

**Tabel `user_roles`** — sudah ada dari Spec 01, tidak ada perubahan schema.

**Default role logic:**
- Saat create user baru → otomatis assign role **PEGAWAI** (selalu) + role yang dipilih admin
- Admin tidak bisa membuat user tanpa role PEGAWAI

**User status:**
- `is_active` = dari `auth.users` `disabled_at` field
- `disabled_at` = null → user aktif
- `disabled_at` != null → user dinonaktifkan

### API / Endpoints / Server Functions

#### Admin Endpoints (ADMIN only)

```
GET    /api/users
  → List semua user dengan role(s) dan status
  → Response: { users: [{ id, email, metadata, roles, isActive, createdAt }] }

POST   /api/users
  → Create user baru
  → Body: { email, password, nama_lengkap, nip_nrp, departemen?, roles[] }
  → Uses: supabaseAdmin.auth.admin.createUser()
  → Creates: auth.users record + user_roles entries
  → Validation: email unique, email format, password min 8 chars, roles valid

GET    /api/users/[id]
  → Get single user detail dengan role(s)
  → Response: { user: { id, email, metadata, roles, isActive, createdAt } }

PATCH  /api/users/[id]
  → Update user metadata & roles
  → Body: { nama_lengkap?, nip_nrp?, departemen?, roles[]? }
  → Uses: supabaseAdmin.auth.admin.updateUserById() untuk metadata
  → Sync: update/delete user_roles table entries

POST   /api/users/[id]/reset-password
  → Reset password user
  → Body: { password }
  → Uses: supabaseAdmin.auth.admin.updateUserById()
  → Validation: password min 8 chars

POST   /api/users/[id]/deactivate
  → Nonaktifkan user
  → Uses: supabaseAdmin.auth.admin.updateUserById({ disabled: true })
  → Note: user_roles TIDAK dihapus (audit trail)

POST   /api/users/[id]/activate
  → Aktifkan kembali user
  → Uses: supabaseAdmin.auth.admin.updateUserById({ disabled: false })
  → Note: user_roles tetap utuh

DELETE /api/users/[id]
  → Not supported by Supabase Auth — akan return 405 Method Not Allowed
  → Catat di API bahwa hard delete tidak mungkin dilakukan
```

#### User Self-Service Endpoints (authenticated user, own account only)

```
GET    /api/users/me
  → Get profile user saat ini
  → Response: { user: { id, email, metadata, roles } }
  → Uses: requireAuth() — session user

POST   /api/users/me/change-password
  → Ganti password sendiri
  → Body: { currentPassword, newPassword }
  → Uses: supabase.auth.updateUser({ password: newPassword })
  → Validation: currentPassword harus match, newPassword min 8 chars, newPassword != currentPassword
```

### UI / Frontend

#### Halaman: `/admin/master-data/user`

**Perubahan dari UI mock saat ini:**
1. **Ganti mock data → real API fetch** — `/api/users` untuk load data
2. **Kolom tabel:**
   - No | Nama Lengkap | Email | NIP/NRP | Departemen | Role(s) | Status | Aksi
   - `Nama Lengkap` dari `user_metadata.nama_lengkap`
   - `NIP/NRP` dari `user_metadata.nip_nrp`
   - `Departemen` dari `user_metadata.departemen`
   - `Role(s)` dari `user_roles` join → tampilkan badge per role
   - `Status` → badge hijau "Aktif" / merah "Nonaktif"
   - `Aksi` → Edit (pensil), Reset Password, Deactivate/Activate, Hapus (disabled + tooltip)
3. **Filter dropdown:**
   - Semua Status (Aktif / Nonaktif / Semua)
   - Search bar → filter by nama atau email
4. **Toolbar:**
   - Tombol **Tambah User** (buka modal)
   - Pagination
5. **Dialog/Modal — Tambah User:**
   - Field: Email, Password, Konfirmasi Password, Nama Lengkap, NIP/NRP, Departemen (opsional)
   - Checkbox role(s) — PEGAWAI checked & disabled (selalu ada), PPK, BENDAHARA, ARSIPARIS
   - Validation: semua field required (kecuali departemen), password min 8 chars, konfirmasi password match, email format valid, nip_nrp format (numerik)
6. **Dialog/Modal — Edit User:**
   - Field: Nama Lengkap, NIP/NRP, Departemen
   - Checkbox role(s) — PEGAWAI disabled (tidak bisa dihapus), role lain toggleable
   - Tampilkan email (read-only)
7. **Dialog — Reset Password:**
   - Field: Password Baru, Konfirmasi Password
   - Info text: "Password akan langsung berlaku. User harus login dengan password baru."
8. **Dialog — Konfirmasi Deactivate:**
   - Text: "User tidak akan bisa login. Role user tetap tersimpan."
   - Tombol: "Batal", "Nonaktifkan"
9. **Dialog — Konfirmasi Activate:**
   - Text: "User akan bisa login kembali."
   - Tombol: "Batal", "Aktifkan"

#### Halaman: `/profile` (route baru)

**Accessible oleh semua authenticated user:**
- Header: Avatar (inisial nama), Nama Lengkap, Role badge
- Info card: Email, NIP/NRP, Departemen, Tanggal Bergabung
- Section "Keamanan":
  - Tombol "Ganti Password" → inline form atau modal
  - Form: Password Lama, Password Baru, Konfirmasi Password Baru
- Note: Role(s) tampil tapi read-only (tidak bisa diedit sendiri)

#### Route Guards

```
/api/users/*          → ADMIN only (via guardRole)
/api/users/me/*      → Authenticated user (requireAuth)
/admin/master-data/user → ADMIN only (SSR guard)
```

### Logic / Business Rules

1. **Email uniqueness** — cek `auth.users` sebelum create. Jika email sudah ada, return error 409 Conflict.
2. **Role PEGAWAI mandatory** — setiap user harus punya PEGAWAI. Admin tidak bisa membuat user tanpa PEGAWAI. Checkbox PEGAWAI selalu checked dan disabled di UI.
3. **Role change tidak boleh kosong** — user harus punya minimal 1 role. Jika admin remove PEGAWAI dari user yang punya role lain, tetap harus punya minimal 1 role.
4. **Deactivate tidak hapus roles** — `user_roles` entries tetap ada. User yang diaktifkan kembali langsung punya role yang sama.
5. **Deactivate admin tidak boleh deactivate dirinya sendiri** — validasi di server: `auth.uid() !== targetUserId` saat deactivate.
6. **Reset password requires admin** — hanya ADMIN yang bisa reset. User biasa harus via self-service change password.
7. **Password validation** — min 8 karakter, no further complexity requirements (MVP).
8. **Self-service: current password verification** — pakai `signInWithPassword` untuk verifikasi password lama sebelum `updateUser`.

---

## Dependensi

- **Bergantung pada:** Spec 01 — Supabase Auth (`supabase` + `supabase-admin` client), session management, `requireAuth()`, `guardRole()`, RLS policies di `user_roles`
- **Dibutuhkan oleh:** Spec 03, 04, 05 — semua alur dokumen butuh user accounts yang bisa di-manage oleh admin

---

## Technical Notes

### Supabase Admin API

Diperlukan `supabaseAdmin` client terpisah dari `supabase` regular client. Admin client menggunakan `service_role` key, bypass RLS:

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

Service role key harus ada di `.env`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Metadata vs user_roles

| Data | Storage |
|---|---|
| Email | `auth.users.email` |
| Password | `auth.users` (managed by Supabase) |
| Nama Lengkap | `auth.users.raw_user_meta_data.nama_lengkap` |
| NIP/NRP | `auth.users.raw_user_meta_data.nip_nrp` |
| Departemen | `auth.users.raw_user_meta_data.departemen` |
| Role(s) | `user_roles` table + `roles` table |
| Status Aktif | `auth.users.disabled_at` (null = aktif) |

### User Roles Display

Tampilkan role sebagai badge chip dengan warna berbeda:
- PEGAWAI → blue
- PPK → purple
- BENDAHARA → green
- ARSIPARIS → orange
- ADMIN → red

Jika user punya > 1 role, tampilkan semua badge di kolom Role.

---

## Definition of Done

- [ ] Admin bisa create user dengan semua field (email, password, nama, NIP, departemen, roles)
- [ ] Admin bisa lihat daftar semua user dengan status real-time
- [ ] Admin bisa edit user metadata dan roles
- [ ] Admin bisa deactivate user (tidak bisa login, roles tetap)
- [ ] Admin bisa reactivate user (bisa login lagi)
- [ ] Admin bisa reset password user
- [ ] User bisa ganti password sendiri (dengan verifikasi password lama)
- [ ] User bisa lihat profilnya sendiri
- [ ] Soft delete (deactivate) tidak menghilangkan data audit trail (user_roles tetap)
- [ ] ADMIN tidak bisa deactivate diri sendiri
- [ ] Duplicate email dicegah saat create
- [ ] Password validation (min 8 chars) diterapkan di server
- [ ] Semua API endpoint dilindungi guard yang sesuai
- [ ] Master User page menggunakan real data (bukan mock)
- [ ] UI menampilkan status Aktif/Nonaktif dengan benar
- [ ] Role badge display berfungsi dengan warna berbeda
- [ ] Build succeeds tanpa error

---

## Estimasi Kompleksitas

**Sedang** — Implementation menggunakan Supabase Admin API yang well-documented. Pattern CRUD standar. Yang perlu atenção khusus:
1. Integração `supabaseAdmin` client dengan env variable baru
2. Sync antara `auth.users` metadata dan `user_roles` table saat create/update
3. Handle edge case: user deactivate diri sendiri, duplicate email, role removal edge case
4. Mengganti UI mock page dengan real data fetch

---

## Catatan / Risiko

1. **Supabase Auth limitation** — tidak ada hard delete user. `DELETE /api/users/[id]` akan return 405. Ini perlu di-communicate ke admin UI (tombol Hapus disabled dengan tooltip).
2. **Service role key security** — `SUPABASE_SERVICE_ROLE_KEY` bypass semua RLS. HARUS di server-side only, tidak boleh di-expose ke client. Semua endpoint user management harus server functions / API routes, bukan client-side calls.
3. **Deactivate ≠ delete** — karena tidak ada hard delete, user yang "dihapus" sebenarnya hanya dinonaktifkan. Mereka masih ada di `auth.users` dan `user_roles`. Ini fine untuk MVP karena audit trail terjaga.
4. **Reactivate edge case** — user yang dinonaktifkan, lalu admin menghapus role PEGAWAI-nya di `user_roles`, saat diaktifkan kembali tetap tidak punya PEGAWAI (bisa jadi tidak punya role sama sekali). Perlu validasi atau warning.
5. **Password dalam response** — password tidak pernah muncul di response API manapun. Reset password confirmation hanya bilang "password sudah di-reset", tidak disclose password-nya.
