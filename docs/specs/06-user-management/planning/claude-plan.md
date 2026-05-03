# Implementation Plan: SPEC 06 User Management

## Overview

SPEC 06 mengimplementasikan full user lifecycle management dengan:
- API endpoints untuk CRUD user via Supabase Admin API
- Master User page dengan real data (replace mock)
- Profile page untuk self-service
- Self-service password change

Approach: reuse existing patterns (auth helpers, guards, supabase-admin client) + Supabase Admin API untuk user management.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│ Master User Page          │ Profile Page                      │
│ (/admin/master-data/user) │ (/profile)                        │
└────────────┬──────────────┴───────────────┬───────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────────────────────────────────────────┐
│                     API Routes                              │
├────────────────────────────────────────────────────────────┤
│ Admin APIs (ADMIN guard)      │ User APIs (requireAuth)     │
│ POST /api/users              │ GET /api/users/me            │
│ GET  /api/users              │ POST /api/users/me/change-pw │
│ GET  /api/users/[id]        │                              │
│ PATCH /api/users/[id]       │                              │
│ POST /api/users/[id]/reset  │                              │
│ POST /api/users/[id]/deact  │                              │
│ POST /api/users/[id]/act    │                              │
└────────────┬────────────────┴──────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│                    Supabase Layer                          │
├──────────────────────────┬─────────────────────────────────┤
│  Regular Client         │  Admin Client (service role)    │
│  (RLS policies apply)   │  (bypass RLS)                   │
├──────────────────────────┴─────────────────────────────────┤
│ auth.users    │ user_roles   │ roles                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Admin: Create User**
```
Admin fills form → POST /api/users
  → validate input
  → supabaseAdmin.auth.admin.createUser()
  → insert user_roles entries
  → return created user
```

**Admin: List Users**
```
Admin opens page → GET /api/users
  → supabaseAdmin.auth.admin.listUsers()
  → get roles from user_roles table
  → return enriched list
```

**User: Change Password**
```
User fills form → POST /api/users/me/change-password
  → verify old password via signInWithPassword
  → update password via supabase.auth.updateUser()
  → return success
```

## Implementation Steps

### Step 1: Database Migration
**What:** Buat migration untuk tabel yang dibutuhkan.

**Why:** Menyiapkan schema untuk user metadata dan role management.

**How:**
1. Buat migration file `supabase/migrations/013_user_management.sql`
2. Migration membuat RLS policies untuk user_roles table
3. Tidak ada tabel baru — semua sudah ada dari Spec 01

**Files affected:**
- `supabase/migrations/013_user_management.sql` — RLS policies untuk user_roles

**Dependencies:** Spec 01 tables (user_roles, roles)

---

### Step 2: Admin API — User CRUD
**What:** Implementasi API endpoints untuk user management.

**Why:** Core functionality — admin perlu bisa CRUD user.

**How:**
1. Buat `src/routes/api/users/index.ts` — GET list, POST create
2. Buat `src/routes/api/users/$id.ts` — GET one, PATCH update
3. Gunakan `guardRole('ADMIN')` untuk proteksi
4. Pakai `createAdminClient()` untuk semua operations
5. Sync antara `auth.users` metadata dan `user_roles` table

**Files affected:**
- `src/routes/api/users/index.ts` — create, list
- `src/routes/api/users/$id.ts` — read, update, delete
- `src/routes/api/users/$id/reset-password.ts` — admin reset
- `src/routes/api/users/$id/deactivate.ts` — admin deactivate
- `src/routes/api/users/$id/activate.ts` — admin reactivate

**Dependencies:** Step 1 (migration)

---

### Step 3: User API — Self-Service
**What:** Implementasi API untuk profile dan password change.

**Why:** User perlu bisa lihat profil dan ganti password sendiri.

**How:**
1. Buat `src/routes/api/users/me.ts` — GET profile
2. Buat `src/routes/api/users/me/change-password.ts` — POST change password
3. Pakai `requireAuth()` — session verification
4. Verify old password dengan `signInWithPassword`

**Files affected:**
- `src/routes/api/users/me.ts`
- `src/routes/api/users/me/change-password.ts`

**Dependencies:** Step 2 (API infrastructure)

---

### Step 4: Master User Page — Real Data
**What:** Update Master User page untuk pakai real API.

**Why:** Replace mock data dengan real data dari database.

**How:**
1. Modify `src/routes/admin.master-data.user.tsx`
2. Fetch data dari `/api/users` saat mount
3. Add state untuk loading, error, users list
4. Update table untuk display role badges
5. Add modals untuk create/edit user
6. Connect ke API endpoints

**Files affected:**
- `src/routes/admin.master-data.user.tsx` — major rewrite

**Dependencies:** Step 2 (API endpoints working)

---

### Step 5: Profile Page
**What:** Buat halaman profile untuk self-service.

**Why:** User perlu bisa lihat profil dan ganti password sendiri.

**How:**
1. Buat `src/routes/profile.tsx`
2. SSR fetch profile dari `/api/users/me`
3. Display user info dalam card layout
4. Add inline form untuk change password
5. Connect ke `/api/users/me/change-password`

**Files affected:**
- `src/routes/profile.tsx` — new file
- `src/routeTree.gen.ts` — auto-generated

**Dependencies:** Step 3 (user API working)

---

### Step 6: Validation & Error Handling
**What:** Implementasi validasi input dan error handling.

**Why:** Pastikan data yang masuk valid dan user mendapat feedback yang jelas.

**How:**
1. Server-side validation untuk semua inputs
2. Email format validation
3. Password min 8 chars
4. NIP/NRP numerik + length check
5. Role minimum check (PEGAWAI mandatory)
6. Proper error responses (400, 409, 422)

**Files affected:**
- All API route files — validation logic

**Dependencies:** Steps 2, 3

---

### Step 7: Testing & Polish
**What:** End-to-end testing dan UI polish.

**Why:** Pastikan semua flows work dan UI responsive.

**How:**
1. Manual testing untuk setiap flow
2. Test create user → login dengan user baru
3. Test edit user → verify metadata updated
4. Test deactivate → verify user can't login
5. Test activate → verify user can login again
6. Test password change → verify old pw works, new pw works
7. UI polish — loading states, error messages

**Files affected:** All modified files

**Dependencies:** Steps 1-6

---

## Edge Cases & Error Handling

### Duplicate Email
- Supabase Auth return error `« Email already exists »`
- API catch dan return 409 Conflict
- UI show error message "Email sudah terdaftar"

### Self-Deactivation
- Check: `session.user.id !== targetUserId`
- If same: return 400 Bad Request + message "Tidak bisa menonaktifkan akun sendiri"

### Role Removal Last Role
- Before remove, check if user has other roles
- If PEGAWAI is last role: reject with message "User harus punya minimal 1 role"

### Password Mismatch
- Client-side: show error before submit
- Server-side: double-check confirmation matches

### Concurrent Deactivation
- Race condition unlikely but possible
- Supabase Auth handle atomically
- UI show success message regardless

### Network Error
- API timeout: return 504 Gateway Timeout
- Client retry with exponential backoff
- UI show "Gagal memuat data" with retry button

---

## Integration Points

### With Spec 01 (Auth & RBAC)
- Reuse `guardRole()` and `requireAuth()` guards
- Reuse `getUserRole()` and `hasRole()` helpers
- Extend `user_roles` table for role assignments

### With Spec 07 (Chairman Assignment)
- Master User page akan extend dengan kolom "Kegiatan Ketua Tim"
- Detail User page akan punya section untuk chairman assignments
- API endpoints `/api/users` dan `/api/users/[id]` perlu include kegiatan data

### With Frontend Components
- Dialog components untuk modals (create, edit, reset password)
- Button components dengan variants (destructive, outline)
- Input components untuk forms
- Table components untuk user list

---

## Migration / Compatibility Notes

### Breaking Changes
- Master User page akan load dari real API (break mock display)
- Existing mock users akan di-replace dengan real users from auth.users

### Data Migration
- Migration untuk RLS policies
- No data migration needed — existing data compatible

### Rollback Plan
- If issues: revert to mock data page (git checkout)
- API endpoints are additive — no breaking change to existing features

---

## Open Questions (during implementation)

1. **Pagination** — Simple prev/next atau numbered pages?
   - Decision: Numbered pagination (1, 2, 3, ...) with 10 items per page

2. **Filter by role** — Apakah perlu filter dropdown di Master User table?
   - Decision: Ya, filter by status (Aktif/Nonaktif)

3. **Sort** — Sort by nama, email, atau created_at?
   - Decision: Sort by nama (default), clickable headers

4. **Activity log** — Apakah perlu log setiap action di audit trail?
   - Decision: Tidak untuk MVP — future enhancement
