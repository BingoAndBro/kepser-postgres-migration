# Implementation Plan: 01-auth-rbac-foundation

## Overview

Spec ini membangun fondasi autentikasi dan role-based access control untuk aplikasi DMS BPS Kepulauan Seribu. Secara teknis, ini berarti: (1) instalasi dan konfigurasi Supabase client (SSR-aware), Drizzle ORM, dan Zod; (2) pembuatan SQL migration untuk tabel `roles`, `user_roles`, dan RLS policies; (3) pembuatan auth server functions dan route guards menggunakan `beforeLoad` hook TanStack Start; (4) pembuatan halaman `/login`; (5) modifikasi `AppLayout` untuk mendukung role switcher dropdown dan role-based sidebar; dan (6) pembuatan helper `auth.ts` yang reusable di seluruh aplikasi. Spec ini adalah fondasi, jadi tidak ada route pages baru untuk `/ppk/*`, `/bendahara/*`, atau `/dokumen/*` — hanya infrastruktur auth yang akan dipakai oleh spec downstream.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ LoginPage │  │ AppLayout  │  │ RoleSwitcher     │  │
│  │ /login    │  │ (sidebar)  │  │ (dropdown)       │  │
│  └────┬─────┘  └─────┬──────┘  └────────┬─────────┘  │
│       │              │                   │             │
│  ┌────▼──────────────▼───────────────────▼─────────┐  │
│  │         SupabaseBrowserClient (SSR)              │  │
│  │  - auth.signInWithPassword()                     │  │
│  │  - auth.getSession() → cookie persistence        │  │
│  │  - active_role cookie management                 │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ HTTP (cookies)
┌─────────────────────────▼─────────────────────────────────┐
│                     Server (Nitro / Vercel Edge)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    SupabaseServerClient (SSR cookie-aware)           │  │
│  │    - getSession() → get user from cookies            │  │
│  │    - auth.getUser() → verify JWT                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Auth Guards (beforeLoad hooks)                     │  │
│  │    - requireAuth() → 401 redirect /login            │  │
│  │    - requireRole(roles[]) → 403 forbidden           │  │
│  │    - requireAnyRole(roles[]) → 403 forbidden        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Auth Helpers (src/lib/auth.ts)                     │  │
│  │    - getSession() → Session | null                   │  │
│  │    - getUserRole(userId) → Role[]                    │  │
│  │    - hasRole(userId, role) → boolean                 │  │
│  │    - requireRole(userId, role) → void | throws      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ SQL / RLS
┌─────────────────────────▼─────────────────────────────────┐
│                  Supabase (PostgreSQL)                      │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ auth.users   │  │ roles         │  │ user_roles     │  │
│  │ (built-in)   │  │ (seed data)   │  │ (RLS policies)  │  │
│  └──────────────┘  └───────────────┘  └────────────────┘  │
│                                                               │
│  RLS: get_user_roles(user_id) SECURITY DEFINER function      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Install Dependencies

**What:** Install packages baru yang diperlukan untuk auth infrastructure.

**Why:** Spec ini adalah fondasi pertama — belum ada Supabase client, Drizzle, atau Zod. Tanpa ini, spec lain tidak bisa dibangun.

**How:**
1. Jalankan `pnpm add @supabase/supabase-js @supabase/ssr`
2. Jalankan `pnpm add drizzle-orm zod`
3. Jalankan `pnpm add -D drizzle-kit @types/pg`
4. Buat `drizzle.config.ts` di root project dengan konfigurasi untuk Supabase Postgres connection string dari `.env`
5. Update `.env` dengan placeholder `SUPABASE_URL` dan `SUPABASE_ANON_KEY` + buat `.env.example` dengan contoh nilai

**Files affected:**
- `package.json` — dependencies baru
- `drizzle.config.ts` — baru
- `.env` — variabel environment baru
- `.env.example` — baru

**Dependencies:** — (step ini berdiri sendiri)

---

### Step 2: Create SQL Migration & Drizzle Schema

**What:** Buat schema dan migration untuk tabel `roles`, `user_roles`, dan RLS policies.

**Why:** Tanpa tabel ini, tidak ada tempat menyimpan role mapping user. RLS policies juga perlu didefinisikan untuk security di level database.

**How:**
1. Buat Drizzle schema di `src/lib/db/schema.ts`:
   - `roles` table: id (uuid PK), nama (text UNIQUE), deskripsi (text), created_at
   - `user_roles` table: id (uuid PK), user_id (uuid FK → auth.users), role_id (uuid FK → roles), created_at, UNIQUE(user_id, role_id)
   - Export sebagai `Role` dan `UserRole` type
2. Buat SQL migration file di `supabase/migrations/001_auth_rbac.sql` (konvensi Supabase) yang berisi:
   - `CREATE TABLE roles (...)` — sama persis dengan schema Drizzle
   - `CREATE TABLE user_roles (...)` — sama persis
   - `CREATE OR REPLACE FUNCTION get_user_roles(user_id uuid) RETURNS SETOF roles SECURITY DEFINER` — function untuk RLS cross-table join
   - `ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY`
   - `CREATE POLICY user_roles_select ON user_roles FOR SELECT USING (auth.uid() = user_id OR EXISTS (...ADMIN check...))`
   - `CREATE POLICY user_roles_insert ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id)` — ADMIN check dilakukan via server function check
   - `CREATE POLICY user_roles_delete ON user_roles FOR DELETE USING (...)`
   - Seed INSERT untuk 5 roles
3. Jalankan `pnpm drizzle-kit generate` untuk menghasilkan migration file Drizzle

**Files affected:**
- `src/lib/db/schema.ts` — baru
- `src/lib/db/index.ts` — baru (export db client)
- `supabase/migrations/001_auth_rbac.sql` — baru
- `drizzle/` — generated migration output dari drizzle-kit

**Dependencies:** Step 1 (installer packages)

---

### Step 3: Setup Supabase Server Client

**What:** Buat Supabase client yang SSR-aware untuk digunakan di server functions.

**Why:** TanStack Start berjalan di server (Nitro/Vercel Edge). Supabase client harus menggunakan cookie-based session management, bukan localStorage. Client ini dipakai oleh semua server functions yang butuh auth.

**How:**
1. Buat `src/lib/supabase-server.ts` — createServerClient dari `@supabase/ssr`:
   - Inisialisasi dengan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari env
   - Cookie options: `name: 'sb-access-token'`, `lifeTime: 60 * 60`, `sameSite: 'lax'`
   - Export factory function `createServerClient(event: RequestEvent)`
2. Buat `src/lib/supabase-browser.ts` — createBrowserClient untuk client-side:
   - Export singleton `createBrowserClient()` tanpa event parameter
3. Buat `src/lib/supabase.ts` — unified export yang memilih server atau browser berdasarkan environment (use of `typeof window !== 'undefined'` check)
4. Buat `src/lib/supabase-admin.ts` — admin client untuk server-side operations yang butuh elevated privileges (seperti membaca semua user):
   - Menggunakan `SUPABASE_SERVICE_ROLE_KEY` dari env (bukan anon key)
   - **Tidak** digunakan di client-side atau exposed ke browser

**Files affected:**
- `src/lib/supabase-server.ts` — baru
- `src/lib/supabase-browser.ts` — baru
- `src/lib/supabase.ts` — baru
- `src/lib/supabase-admin.ts` — baru

**Dependencies:** Step 1

---

### Step 4: Create Auth Helpers (`src/lib/auth.ts`)

**What:** Buat helper functions untuk role checking dan session management.

**Why:** Helper ini将是 semua auth logic yang dipakai di route guards dan server functions. Having them in one place memastikan konsistensi dan makes testing easier.

**How:**
1. Buat enum/type `Role` dengan nilai: `'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS' | 'ADMIN'`
2. Implement `getSession(event)` — ambil session dari Supabase server client
3. Implement `getUserRole(supabaseServer, userId)` — query `user_roles` table + join `roles`, return `Role[]`
4. Implement `hasRole(supabaseServer, userId, role)` — boolean check
5. Implement `requireRole(supabaseServer, userId, role)` — throws 403 dengan message yang jelas jika tidak punya role
6. Implement `requireAnyRole(supabaseServer, userId, roles[])` — throws 403 jika tidak punya satupun role
7. Implement `getPrimaryRole(roles[])` — return role pertama (by created_at ASC) atau PEGAWAI sebagai default
8. Export semua helper sebagai named exports

**Files affected:**
- `src/lib/auth.ts` — baru
- `src/lib/types/auth.ts` — baru (typed Role, Session, User)

**Dependencies:** Step 2 (schema available), Step 3 (Supabase client)

---

### Step 5: Create Login Page (`/login`)

**What:** Buat halaman login dengan email + password menggunakan Supabase Auth.

**Why:** Ini adalah entry point untuk semua user. Harus ada before login — redirect yang tepat, error handling yang jelas, dan UI yang bersih.

**How:**
1. Buat `src/routes/login.tsx`:
   - Gunakan `createFileRoute('/login')` dari TanStack Router
   - State: `email`, `password`, `isLoading`, `error`
   - Form handling dengan `onSubmit` → `supabase.auth.signInWithPassword({ email, password })`
   - Error handling: tampilkan error message jika login gagal (invalid credentials, user not found, etc.)
   - Success: set `active_role` cookie → redirect berdasarkan role
2. Buat `beforeLoad` hook di route login:
   - Jika sudah logged in → redirect ke `/`
3. Buat cookie helper untuk `active_role`:
   - Write: set cookie dengan value `role` saat login berhasil
   - Read: parse active role dari cookie di server untuk SSR
   - Delete: clear cookie saat logout

**Files affected:**
- `src/routes/login.tsx` — baru
- `src/lib/auth.ts` — update (tambah cookie helpers)
- `src/routeTree.gen.ts` — auto-regenerated (akan update otomatis oleh TanStack Router plugin)

**Dependencies:** Step 3 (Supabase client), Step 4 (auth helpers)

---

### Step 6: Add Route Guards (beforeLoad Hooks)

**What:** Tambahkan SSR route guards untuk semua protected routes.

**Why:** Spec wymaga "sistem ingin setiap halaman dicek role-nya di server" — ini adalah implementasi untuk itu. TanStack Start `beforeLoad` hook dijalankan di server sebelum komponen di-render, jadi tidak bisa di-bypass oleh client-side manipulation.

**How:**
1. Modifikasi `src/routes/__root.tsx` — tambah `beforeLoad` global di root route:
   - Jika route adalah `/login` → skip
   - Jika route adalah `/api/auth/*` → skip
   - Jika belum logged in → redirect ke `/login`
2. Modifikasi `src/routes/index.tsx`:
   - Tambahkan `beforeLoad` yang memastikan user sudah authenticated (tanpa role check — `/` accessible semua authenticated users)
3. Modifikasi `src/routes/arsiparis.index.tsx`:
   - Tambahkan `beforeLoad` dengan `requireRole(supabaseServer, userId, 'ARSIPARIS')`
   - Jika gagal → throw 403 error
4. Modifikasi `src/routes/admin.workflow.tsx`:
   - Tambahkan `beforeLoad` dengan `requireRole(supabaseServer, userId, 'ADMIN')`
   - Jika gagal → throw 403 error
5. Buat route placeholder untuk `/ppk` dan `/bendahara` (kosong, hanya untuk route tree generation) dengan beforeLoad guards masing-masing — ini akan dipakai nanti tapi route guard pattern sudah tersedia
6. Buat route placeholder untuk `/dokumen` (kosong) dengan beforeLoad yang requireAnyRole(['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS'])

**Files affected:**
- `src/routes/__root.tsx` — modifikasi (beforeLoad global)
- `src/routes/index.tsx` — modifikasi (beforeLoad auth check)
- `src/routes/arsiparis.index.tsx` — modifikasi (beforeLoad ARSIPARIS check)
- `src/routes/admin.workflow.tsx` — modifikasi (beforeLoad ADMIN check)
- `src/routes/ppk.tsx` — baru (placeholder)
- `src/routes/bendahara.tsx` — baru (placeholder)
- `src/routes/dokumen.tsx` — baru (placeholder)

**Dependencies:** Step 4 (auth helpers)

---

### Step 7: Modifikasi AppLayout — Role Switcher + Dynamic Sidebar

**What:** Modifikasi AppLayout untuk mendukung role switcher dropdown dan role-based navigation.

**Why:** Spec wymaga sidebar navigasi yang berubah sesuai role aktif dan role switcher dropdown di pojok kanan atas. AppLayout saat ini hardcoded dengan "Kak Tami" dan static NAV_ITEMS.

**How:**
1. Modifikasi `src/components/layout/AppLayout.tsx`:
   - Hapus hardcoded user name "Kak Tami"
   - Ganti dengan data dari session (user.name, user.email)
   - Implement role switcher dropdown:
     - Fetch semua role user via server function (atau use loader data)
     - Jika `roles.length > 1` → render dropdown di kanan atas
     - Jika `roles.length === 1` → render display saja (tanpa dropdown)
     - Jika role === 'ADMIN' → render display tanpa dropdown (karena ADMIN tidak punya multi-role)
   - Implement dynamic sidebar navigation:
     - NAV_ITEMS berubah berdasarkan active role:
       - PEGAWAI: [Inbox]
       - PPK: [Inbox, /ppk/*] (future)
       - BENDAHARA: [Inbox, /bendahara/*] (future)
       - ARSIPARIS: [Inbox, Arsiparis]
       - ADMIN: [Workflow Config, User Management (future)]
   - Implement logout button → `supabase.auth.signOut()` → redirect ke `/login`
2. Buat `src/components/auth/RoleSwitcher.tsx` — komponen terpisah:
   - Props: `userRoles: Role[]`, `activeRole: Role`, `onSwitch: (role: Role) => void`
   - Dropdown dengan semua role yang dimiliki user
   - On select: update cookie `active_role` + reload atau re-render
3. Buat `src/components/auth/UserMenu.tsx`:
   - Avatar dengan initials
   - User name display
   - Role badge di bawah nama
   - Integrasi dengan RoleSwitcher

**Files affected:**
- `src/components/layout/AppLayout.tsx` — modifikasi besar-besaran
- `src/components/auth/RoleSwitcher.tsx` — baru
- `src/components/auth/UserMenu.tsx` — baru
- `src/lib/auth.ts` — update (session helpers yang dipakai AppLayout)

**Dependencies:** Step 4 (auth helpers), Step 5 (login page, cookie helpers)

---

### Step 8: Create Server Functions for Auth Operations

**What:** Buat API route untuk login dan logout sebagai alternative atau companion untuk client-side operations.

**Why:** Spec menyebut `POST /api/auth/login` dan `POST /api/auth/logout`. Ini memberikan API endpoints yang bisa dipakai oleh frontend atau tools lain (Postman, mobile app, dll).

**How:**
1. Buat `src/routes/api/auth/login.ts`:
   - TanStack Start server function (POST handler)
   - Validasi input dengan Zod schema: `{ email: z.string().email(), password: z.string().min(1) }`
   - Panggil `supabase.auth.signInWithPassword()`
   - On success: set `active_role` cookie → return `{ user, role }`
   - On failure: return 401 error
2. Buat `src/routes/api/auth/logout.ts`:
   - POST handler
   - Clear `active_role` cookie
   - Call `supabase.auth.signOut()`
   - Return success
3. Buat `src/routes/api/auth/session.ts`:
   - GET handler — return current session + all roles
   - Digunakan oleh frontend untuk hydrate state setelah page load
4. Buat `src/routes/api/auth/role-switch.ts`:
   - POST handler
   - Body: `{ activeRole: Role }`
   - Validasi: role harus ada di daftar role user
   - Update cookie `active_role`
   - Return success

**Files affected:**
- `src/routes/api/auth/login.ts` — baru
- `src/routes/api/auth/logout.ts` — baru
- `src/routes/api/auth/session.ts` — baru
- `src/routes/api/auth/role-switch.ts` — baru
- `src/lib/schemas/auth.ts` — baru (Zod schemas)

**Dependencies:** Step 3 (Supabase client), Step 4 (auth helpers)

---

## Edge Cases & Error Handling

### Login Failures
- **Invalid credentials:** Tampilkan "Email atau password salah" — tidak kasih tahu mana yang salah (security best practice)
- **User not found:** Same message — tidak bedakan dengan invalid credentials
- **Account not confirmed:** Tampilkan "Silakan cek email untuk verifikasi link" — satu-satunya case di mana message beda
- **Rate limiting:** Supabase Auth built-in rate limiting, tidak perlu implementasi manual

### Role Mismatch After Session Expiry
- Jika `active_role` cookie expired tapi session masih ada → fallback ke primary role (PEGAWAI)
- Jika semua role expired (user dihapus dari semua role) → logout + redirect `/login` dengan message "Akses Anda telah diubah"

### Multi-Tab Sync
- Saat switch role di satu tab → broadcast event ke tab lain → reload
- Gunakan `window.storage` event listener untuk cross-tab communication
- Fallback: jika tab lain tidak reload dalam 2 detik, handle manual refresh

### ADMIN Edge Case
- Jika ADMIN mencoba akses `/arsiparis/*` → 403 (expected)
- Jika ADMIN login dan punya multi-role (seharusnya tidak terjadi) → tetap hide dropdown, gunakan ADMIN role saja
- Route guard untuk ADMIN: cek role === 'ADMIN', reject semua role lain

### Supabase Auth Session Refresh
- `@supabase/ssr` handles automatic token refresh
- Jika refresh gagal → redirect ke `/login`
- Tidak ada manual refresh token logic di application code

---

## Integration Points

### With Spec 02 (Document Workflow)
- Spec 02 membutuhkan `getSession()` dan role checking
- Auth infrastructure sudah tersedia di `src/lib/auth.ts`
- Route `/dokumen/*` akan dibuat di spec 02 menggunakan pattern yang sama

### With Spec 03 (Workflow Engine)
- Workflow engine butuh role checking untuk determine siapa yang bisa approve/reject
- `hasRole(userId, role)` dan `requireRole(userId, role)` dipakai

### With Supabase Dashboard
- Migration SQL harus dijalankan manual di Supabase dashboard atau via CLI
- Seed data untuk roles akan otomatis ter-insert setelah migration

### With Vercel Deployment
- Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) harus di-set di Vercel dashboard
- Cookie domain harus configured untuk production

---

## Migration / Compatibility Notes

### Breaking Changes dari Before
- `AppLayout` tidak lagi hardcoded dengan "Kak Tami" — ini adalah breaking change visual
- Route `/` sekarang membutuhkan authenticated session — visitors akan di-redirect ke `/login`
- Route `/admin/workflow` sekarang butuh role ADMIN — visitors akan dapat 403

### Dari Mock Data ke Real Data
- `src/routes/arsiparis.index.tsx` menggunakan mock data — setelah spec ini, data akan berasal dari Supabase
- `src/routes/index.tsx` menggunakan mock data — akan diupdate di spec lain

### .env Changes
- `.env` sekarang WAJIB punya `SUPABASE_URL` dan `SUPABASE_ANON_KEY`
- Tanpa ini, aplikasi tidak akan bisa login (akan muncul error saat inisialisasi Supabase client)
- Buat `.env.example` dengan placeholder values

---

## Open Questions (Still Ambiguous)

1. **Session expiry handling:** Apakah ada custom redirect page untuk expired session, atau cukup redirect ke `/login` dengan query param `?reason=session_expired`?
2. **ADMIN initial credentials:** Apakah ada proses provisioning ADMIN account pertama kali? Atau diberikan credentials manual oleh super-admin?
3. **Login page branding:** Apakah `/login` perlu BPS branding yang sama dengan AppLayout, atau halaman login yang lebih sederhana?
4. **Error page design:** Apakah ada `/error/403` dan `/error/401` pages yang custom, atau cukup default browser error?
5. **Development Supabase setup:** Apakah ada instructions untuk local Supabase development, atau hanya production Supabase instance?
