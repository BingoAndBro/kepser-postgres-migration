# Section 02: Admin API — User CRUD

## Context

API endpoints untuk admin mengelola user lifecycle. Semua endpoints dilindungi dengan `guardRole('ADMIN')` dan menggunakan `createAdminClient()` untuk bypass RLS.

## Objective

Implementasi API routes untuk:
- List semua user dengan roles
- Create user baru
- Get single user
- Update user metadata dan roles
- Reset password
- Deactivate/activate user

## Prerequisites
- Section 01 (migration) harus selesai
- `src/lib/supabase-admin.ts` sudah ada
- `src/lib/guards.ts` sudah ada

## Implementation Steps

### 1. Buat API route files

**`src/routes/api/users/index.ts`** — GET list, POST create

```typescript
// GET: List all users dengan roles dan status
// POST: Create new user

import { createFileRoute } from '@tanstack/react-router'
import { createAdminClient } from '#/lib/supabase-admin'
import { guardRole } from '#/lib/guards'

export const Route = createFileRoute('/api/users')({
  server: {
    beforeLoad: async (event) => {
      await guardRole(event, 'ADMIN')
    },
    handlers: {
      GET: async () => {
        const admin = createAdminClient()
        // 1. Get all users from auth.users
        // 2. Get roles from user_roles table
        // 3. Return enriched list
      },
      POST: async ({ request }) => {
        // 1. Validate body
        // 2. Create user via admin.createUser()
        // 3. Insert user_roles
        // 4. Return created user
      }
    }
  }
})
```

**`src/routes/api/users/$id.ts`** — GET one, PATCH update

```typescript
// GET: Get single user
// PATCH: Update user metadata & roles
```

**`src/routes/api/users/$id/reset-password.ts`** — POST reset

```typescript
// POST: Reset password for user
// Body: { password }
// Uses: admin.updateUserById()
```

**`src/routes/api/users/$id/deactivate.ts`** — POST deactivate

```typescript
// POST: Deactivate user
// Check: session.user.id !== targetUserId
// Uses: admin.updateUserById({ disabled: true })
```

**`src/routes/api/users/$id/activate.ts`** — POST activate

```typescript
// POST: Activate user
// Uses: admin.updateUserById({ disabled: false })
```

### 2. Helper Functions

Buat `src/lib/user-helpers.ts` untuk shared logic:

```typescript
// getUsersWithRoles() — get all users dengan roles
// getUserWithRoles(id) — get single user dengan roles
// createUserWithRoles() — create user + roles
// updateUserRoles() — sync roles
```

### 3. Types

Tambahkan types di `src/lib/types/user.ts`:

```typescript
interface UserMetadata {
  nama_lengkap: string
  nip_nrp: string
  departemen?: string
}

interface UserWithRoles {
  id: string
  email: string
  metadata: UserMetadata
  roles: RoleName[]
  isActive: boolean
  createdAt: string
}
```

## Files to Create/Modify
- `src/routes/api/users/index.ts` — new
- `src/routes/api/users/$id.ts` — new
- `src/routes/api/users/$id/reset-password.ts` — new
- `src/routes/api/users/$id/deactivate.ts` — new
- `src/routes/api/users/$id/activate.ts` — new
- `src/lib/user-helpers.ts` — new
- `src/lib/types/user.ts` — new

## Test Stubs
- [ ] GET /api/users returns all users with roles
- [ ] POST /api/users creates new user
- [ ] GET /api/users/[id] returns single user
- [ ] PATCH /api/users/[id] updates user
- [ ] POST /api/users/[id]/reset-password resets password
- [ ] POST /api/users/[id]/deactivate deactivates user
- [ ] POST /api/users/[id]/activate activates user
- [ ] Non-admin gets 403
- [ ] Self-deactivation returns 400

## Definition of Done
- [ ] All API routes created and working
- [ ] GET list returns users with roles and status
- [ ] POST create creates user with roles
- [ ] PATCH update syncs metadata and roles
- [ ] POST reset-password updates password
- [ ] POST deactivate sets disabled_at
- [ ] POST activate clears disabled_at
- [ ] Validation errors return proper HTTP status
- [ ] Admin guard works correctly
