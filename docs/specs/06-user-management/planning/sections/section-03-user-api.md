# Section 03: User API — Self-Service

## Context

API endpoints untuk user mengelola akun mereka sendiri. Tidak perlu ADMIN guard — cukup `requireAuth()` dan verify bahwa user mengakses akunnya sendiri.

## Objective

Implementasi API routes untuk:
- Get own profile
- Change password dengan verifikasi password lama

## Prerequisites
- Section 01 (migration) harus selesai
- `src/lib/auth.ts` sudah ada dengan `getSession()` dan `getUserRole()`

## Implementation Steps

### 1. Buat API route files

**`src/routes/api/users/me.ts`** — GET profile

```typescript
// GET: Get current user profile
// Response: { user: { id, email, metadata, roles } }

import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'
import { getUserRole } from '#/lib/auth'

export const Route = createFileRoute('/api/users/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get('cookie')
        const supabase = createServerSupabaseClient({ request, cookie: {} }, cookieHeader)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get roles
        const roles = await getUserRole(supabase, session.user.id)

        return Response.json({
          user: {
            id: session.user.id,
            email: session.user.email,
            metadata: {
              nama_lengkap: session.user.user_metadata?.nama_lengkap,
              nip_nrp: session.user.user_metadata?.nip_nrp,
              departemen: session.user.user_metadata?.departemen,
            },
            roles,
          }
        })
      }
    }
  }
})
```

**`src/routes/api/users/me/change-password.ts`** — POST change

```typescript
// POST: Change password
// Body: { currentPassword, newPassword }
// 1. Verify old password via signInWithPassword
// 2. Update password via updateUser()

import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'

export const Route = createFileRoute('/api/users/me/change-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify session
        // 2. Parse body { currentPassword, newPassword }
        // 3. Validate password min 8 chars
        // 4. Verify old password via signInWithPassword
        // 5. Update password via supabase.auth.updateUser()
        // 6. Return success
      }
    }
  }
})
```

## Files to Create/Modify
- `src/routes/api/users/me.ts` — new
- `src/routes/api/users/me/change-password.ts` — new

## Test Stubs
- [ ] GET /api/users/me returns own profile
- [ ] POST /api/users/me/change-password changes password
- [ ] Wrong old password returns 400
- [ ] Short new password returns 400
- [ ] Empty fields return 400
- [ ] Unauthenticated returns 401

## Definition of Done
- [ ] GET /api/users/me returns correct profile
- [ ] POST /api/users/me/change-password works
- [ ] Old password verification works
- [ ] New password min 8 chars enforced
- [ ] Unauthenticated request returns 401
