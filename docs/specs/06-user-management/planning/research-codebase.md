# Research: SPEC 06 User Management

## Codebase Research Findings

### 1. Existing Patterns & Infrastructure

**Auth & Role System (Spec 01):**
- `src/lib/auth.ts` — `getUserRole()`, `hasRole()`, `getPrimaryRole()` sudah ada
- `src/lib/guards.ts` — `requireAuth()`, `guardRole()`, `guardAnyRole()` SSR guards
- `src/lib/supabase-admin.ts` — sudah ada fungsi `createAdminClient()` untuk server-side admin operations
- Role static: `['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN']`

**Existing API Structure:**
- Pattern API routes: `src/routes/api/[module]/[action].ts`
- Semua menggunakan `createFileRoute()` dengan SSR handlers
- Helper pattern: `createServerSupabaseClient()` untuk cookie-based auth
- Response format: `Response.json({ data })`

**User Management (Existing):**
- `src/routes/admin.master-data.user.tsx` — Mock data page, belum terhubung ke real API
- No `/api/users` endpoints yet
- No `/api/users/me` endpoint yet

### 2. Available Abstractions

**Components:**
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` — sudah ada
- `Button` dengan variant `destructive`
- `Input` — sudah ada
- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell` — sudah ada

**Helpers:**
- `src/lib/dokumen-helpers.ts` — pattern untuk Supabase queries
- `src/lib/auth.ts` — session + role management
- `createServerSupabaseClient()` — untuk SSR data fetching
- `createAdminClient()` — untuk admin operations

### 3. Architecture Constraints

**Security:**
- Service role key HARUS di server-side only (`supabase-admin.ts`)
- Semua admin endpoints harus pakai `guardRole('ADMIN')`
- Self-service endpoints harus pakai `requireAuth()` + verify own account

**Supabase Admin API:**
- `supabaseAdmin.auth.admin.createUser()` — untuk create user
- `supabaseAdmin.auth.admin.updateUserById()` — untuk update metadata & deactivate
- `supabaseAdmin.auth.admin.listUsers()` — untuk list semua user
- Metadata di `auth.users.raw_user_meta_data`
- Status: `disabled_at` null = aktif, non-null = dinonaktifkan

**RLS Policies:**
- Table `user_roles` butuh RLS policy untuk read by user
- Admin operations bypass RLS (via service role)

### 4. File Structure Convention

```
src/routes/
├── api/
│   ├── auth/          # Auth-related APIs
│   ├── users/         # User management APIs ← BARU
│   ├── master-fungsi/ # Master data APIs
│   └── ...
└── routes/
    ├── admin.master-data.user.tsx   # Existing mock page
    ├── profile.tsx                  # Profile page ← BARU
    └── ...
```

### 5. Migration Pattern (from other specs)

- Migrations di `supabase/migrations/`
- Naming: `XXX_description.sql`
- Current highest: `012` (dari BRAINSTORM file)
- Next: `013` untuk user management

## Web Research

**Not needed** — Supabase Admin API sudah well-documented dan familiar di codebase.

## Summary

SPEC 06 adalah implementasi CRUD user management standard dengan:
- Supabase Admin API untuk admin operations
- Existing guards dan auth helpers bisa dipakai ulang
- UI components sudah tersedia
- Pattern sudah established di codebase
