# Test Stubs: 01-auth-rbac-foundation

Tanggal: 2026-04-09
Plan: docs/specs/01-auth-rbac-foundation/planning/claude-plan.md

> Catatan: Ini adalah test *stubs* — deskripsi dalam bahasa natural, bukan kode implementasi. Kode test ditulis saat implementasi.

---

## Tests for: Step 1 — Install Dependencies

### Happy Path
- [ ] `pnpm add @supabase/supabase-js @supabase/ssr` berhasil tanpa error
- [ ] `pnpm add drizzle-orm zod` berhasil tanpa error
- [ ] `pnpm add -D drizzle-kit` berhasil tanpa error
- [ ] `package.json` berisi semua dependencies baru
- [ ] `drizzle.config.ts` bisa di-import tanpa error
- [ ] `.env.example` ada dan berisi placeholder `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Error Cases
- [ ] Jika salah satu package gagal install → `pnpm install` failed dengan exit code != 0
- [ ] Jika `.env` belum ada `SUPABASE_URL` → aplikasi memberikan warning yang jelas saat startup

---

## Tests for: Step 2 — SQL Migration & Drizzle Schema

### Happy Path
- [ ] `src/lib/db/schema.ts` export `roles` dan `user_roles` table schemas
- [ ] `src/lib/db/schema.ts` export `Role` dan `UserRole` types
- [ ] `pnpm drizzle-kit generate` menghasilkan file migration di `drizzle/`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi CREATE TABLE untuk `roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi CREATE TABLE untuk `user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi SECURITY DEFINER function `get_user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi RLS policies untuk `user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi INSERT seed untuk 5 roles (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN)
- [ ] UNIQUE constraint `user_roles(user_id, role_id)` ada

### Edge Cases
- [ ] Duplicate role name INSERT → gagal (UNIQUE constraint)
- [ ] Same user_id + role_id INSERT → gagal (UNIQUE constraint)

### Error Cases
- [ ] Jika migration SQL dijalankan dua kali → IDEMPOTENT (tidak error karena IF NOT EXISTS)
- [ ] Jika function `get_user_roles` dihapus → RLS policy tetap mencari function (akan fail-safe dengan error yang jelas)

---

## Tests for: Step 3 — Supabase Server Client

### Happy Path
- [ ] `createServerClient(event)` mengembalikan Supabase client yang bisa call `getSession()`
- [ ] `createBrowserClient()` mengembalikan Supabase client yang bisa call `getSession()` (client-side)
- [ ] `supabase.ts` bisa dipilih otomatis server vs browser berdasarkan environment
- [ ] `supabase-admin.ts` menggunakan service role key dan tidak bisa di akses dari browser

### Edge Cases
- [ ] Jika `SUPABASE_URL` tidak ada di env → `createServerClient` throw dengan helpful error message
- [ ] Jika cookies tidak ada → `getSession()` mengembalikan `{ data: { session: null } }`
- [ ] Jika session expired → `getSession()` memanggil refresh otomatis → jika refresh gagal → return null

---

## Tests for: Step 4 — Auth Helpers

### Happy Path
- [ ] `getSession(event)` mengembalikan `Session | null`
- [ ] `getUserRole(supabaseServer, userId)` mengembalikan array Role yang benar (bisa 1+, bisa kosong)
- [ ] `hasRole(supabaseServer, userId, 'ADMIN')` → true jika user punya role ADMIN
- [ ] `hasRole(supabaseServer, userId, 'ADMIN')` → false jika user tidak punya role ADMIN
- [ ] `requireRole(supabaseServer, userId, 'ADMIN')` → tidak throw jika user punya ADMIN
- [ ] `requireAnyRole(supabaseServer, userId, ['ADMIN', 'ARSIPARIS'])` → tidak throw jika user punya salah satu

### Error Cases
- [ ] `requireRole(supabaseServer, userId, 'ADMIN')` → throw 403 jika user tidak punya ADMIN
- [ ] `requireRole(supabaseServer, userId, 'ADMIN')` → throw 403 jika userId tidak valid (user dihapus)
- [ ] `requireAnyRole(supabaseServer, userId, [])` → throw 400 "At least one role required"
- [ ] `getUserRole(supabaseServer, null)` → throw 400 "userId is required"

### Edge Cases
- [ ] User punya 3 role (PEGAWAI, PPK, ADMIN) → `getUserRole` return 3 role
- [ ] User dihapus dari semua role → `getUserRole` return array kosong `[]`, `hasRole` semua false

---

## Tests for: Step 5 — Login Page

### Happy Path
- [ ] Navigasi ke `/login` menampilkan form email + password
- [ ] Submit dengan email + password valid → login berhasil → redirect ke `/`
- [ ] ADMIN login → redirect ke `/admin` (bukan `/`)
- [ ]ADMIN login → redirect ke `/admin` (bukan `/`)
- [ ] Setelah login berhasil, cookie `active_role` di-set
- [ ] `active_role` cookie value = primary role (PEGAWAI untuk user baru)

### Error Cases
- [ ] Submit dengan email + password salah → tampilkan "Email atau password salah"
- [ ] Submit dengan email yang belum verifikasi → tampilkan "Silakan cek email untuk verifikasi link"
- [ ] Submit dengan email kosong → form validation error
- [ ] Submit dengan password kosong → form validation error
- [ ] Submit saat loading → tidak ada duplicate request

### Edge Cases
- [ ] Jika sudah logged in, navigasi ke `/login` → redirect ke `/`
- [ ] Jika ADMIN logged in, navigasi ke `/login` → redirect ke `/admin`

---

## Tests for: Step 6 — Route Guards (beforeLoad Hooks)

### Happy Path
- [ ] Navigasi ke `/` tanpa session → redirect ke `/login`
- [ ] Navigasi ke `/arsiparis/` sebagai ARSIPARIS → halaman terlihat
- [ ] Navigasi ke `/admin/workflow` sebagai ADMIN → halaman terlihat
- [ ] Navigasi ke `/arsiparis/` sebagai PEGAWAI → 403 Forbidden
- [ ] Navigasi ke `/admin/workflow` sebagai BENDAHARA → 403 Forbidden
- [ ] Navigasi ke `/admin/workflow` sebagai ADMIN yang juga punya ARSIPARIS → 403 Forbidden (ADMIN harus murni)
- [ ] Navigasi ke `/api/auth/login` → public (tidak redirect)
- [ ] Navigasi ke `/` sebagai authenticated user → halaman terlihat (tanpa redirect)

### Error Cases
- [ ] Navigasi ke protected route tanpa session → redirect ke `/login` (bukan 401 JSON)
- [ ] Navigasi ke role-protected route tanpa role → throw 403 error
- [ ] Navigasi ke role-protected route saat session expired → redirect ke `/login`

### Edge Cases
- [ ] User punya multi-role [PEGAWAI, ARSIPARIS] navigasi ke `/arsiparis/` → diizinkan
- [ ] Placeholder `/ppk` route guard → bisa diakses oleh PPK
- [ ] Placeholder `/bendahara` route guard → bisa diakses oleh BENDAHARA
- [ ] Placeholder `/dokumen` route guard → bisa diakses oleh PEGAWAI, PPK, BENDAHARA, ARSIPARIS (tidak ADMIN)

---

## Tests for: Step 7 — AppLayout Role Switcher + Dynamic Sidebar

### Happy Path
- [ ] AppLayout header menampilkan nama user dari session
- [ ] AppLayout header menampilkan initials user dari session
- [ ] User dengan 1 role → display role name tanpa dropdown
- [ ] User dengan 2+ role → dropdown muncul di kanan atas dengan semua role
- [ ] Klik role di dropdown → UI refresh, sidebar berubah sesuai role
- [ ] ADMIN login → tidak ada dropdown, hanya display "ADMIN"
- [ ] Sidebar navigation berubah berdasarkan active role
- [ ] Logout button → clear session → redirect ke `/login`

### Error Cases
- [ ] Session tidak ada / expired → AppLayout tidak crash, tampilkan minimal info atau redirect
- [ ] Switch role ke role yang tidak dimiliki → tidak ada perubahan (dropdown hanya menampilkan role yang dimiliki)
- [ ] Click logout saat ada request in-flight → logout tetap berjalan (tidak block)

### Edge Cases
- [ ] User punya multi-role [PEGAWAI, PPK] → dropdown menampilkan "PEGAWAI" dan "PPK"
- [ ] Active role adalah PPK → sidebar menampilkan navigasi PPK (future placeholder)
- [ ] Switch role dari PPK ke PEGAWAI → sidebar refresh ke navigasi PEGAWAI
- [ ] Active role tidak valid (role dihapus dari user) → fallback ke PEGAWAI

### Persistence
- [ ] Reload halaman → active role tetap sama (cookie persistence)
- [ ] Buka tab baru → active role di tab baru = last active role (cookie shared)

---

## Tests for: Step 8 — Server Functions for Auth Operations

### Happy Path
- [ ] `POST /api/auth/login` dengan credentials valid → return `{ user, session }`
- [ ] `POST /api/auth/logout` → session cleared, return 200
- [ ] `GET /api/auth/session` sebagai authenticated user → return `{ session, roles, activeRole }`
- [ ] `GET /api/auth/session` sebagai anonymous → return 401
- [ ] `POST /api/auth/role-switch` dengan role valid → cookie updated, return 200
- [ ] `POST /api/auth/role-switch` dengan role yang tidak dimiliki → return 403

### Error Cases
- [ ] `POST /api/auth/login` dengan credentials invalid → return 401
- [ ] `POST /api/auth/role-switch` dengan role yang tidak ada di daftar user → return 403
- [ ] `GET /api/auth/session` tanpa auth cookie → return 401
- [ ] `POST /api/auth/login` dengan invalid email format → return 400 dengan Zod error

### Edge Cases
- [ ] `POST /api/auth/role-switch` ke role yang sama → still succeed, no-op
- [ ] `POST /api/auth/role-switch` saat ADMIN (tidak seharusnya punya dropdown) → return 403
- [ ] Concurrent `role-switch` requests dari 2 tab → last-write-wins, cookie contains last valid role

---

## Integration Tests (End-to-End)

### Happy Path
- [ ] ADMIN login → redirect `/admin/workflow` → bisa lihat workflow config
- [ ] ARSIPARIS login → redirect `/` → bisa navigasi ke `/arsiparis/`
- [ ] PEGAWAI login → redirect `/` → tidak bisa akses `/arsiparis/` (403) → tidak bisa akses `/admin/workflow` (403)
- [ ] PEGAWAI + PPK multi-role login → dropdown muncul → switch ke PPK → bisa akses PPK route (future)

### Edge Cases
- [ ] Login → logout → login lagi dengan user berbeda → role state clean
- [ ] Login sebagai ADMIN → logout → login sebagai PEGAWAI → session fully replaced (no role bleed)
- [ ] RLS enforcement: User A tidak bisa SELECT role User B di `user_roles` table langsung (hanya bisa baca miliknya sendiri)

---

## Regression Tests (Existing Functionality)

- [ ] Halaman `/` tetap bisa di-render jika tidak ada auth errors (SSR dengan placeholder session)
- [ ] shadcn/ui components (Card, Button, Table) tetap berfungsi
- [ ] AppLayout BPS branding (header dengan BPS logo + text) tetap ada
- [ ] Navigation links tetap berfungsi untuk non-protected routes
- [ ] Build tidak broken setelah perubahan di spec ini
