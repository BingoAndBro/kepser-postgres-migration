# Section 08: Auth API Routes

## Context

Section 04 (auth helpers) sudah selesai. Section ini membuat API server functions untuk operasi auth yang bisa dipakai oleh frontend atau tools eksternal (Postman, mobile app, dll).

Spec.md menyebut `POST /api/auth/login`, `POST /api/auth/logout`, `getSession()`, dan `role-switch`. API routes ini melengkapi login page yang sudah dibuat di Section 05.

> Note: API routes ini parallelizable dengan Section 05 dan 07 — tidak ada ketergantungan langsung. Mereka hanya butuh Section 04 (auth helpers).

---

## Objective

Pada akhir section ini:
- `src/routes/api/auth/login.ts` — POST: authenticate user, set active_role cookie, return session + roles
- `src/routes/api/auth/logout.ts` — POST: clear session, clear active_role cookie
- `src/routes/api/auth/session.ts` — GET: return current session, all roles, active role
- `src/routes/api/auth/role-switch.ts` — POST: switch active role, update cookie
- `src/lib/schemas/auth.ts` — Zod schemas untuk semua API input/output

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-04-auth-helpers.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/supabase-server.ts`
  - `src/lib/auth.ts` (helpers)
  - `src/lib/types/auth.ts` (RoleName, AppSession)
  - `src/lib/guards.ts`

---

## Implementation Steps

### 1. Buat `src/lib/schemas/auth.ts`

Zod schemas untuk semua API input validation.

```typescript
import { z } from 'zod'

// Login
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
export type LoginInput = z.infer<typeof loginSchema>

// Role switch
export const roleSwitchSchema = z.object({
  activeRole: z.enum(['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN']),
})
export type RoleSwitchInput = z.infer<typeof roleSwitchSchema>

// Session response (untuk GET /api/auth/session)
export const sessionResponseSchema = z.object({
  session: z.object({
    userId: z.string(),
    email: z.string(),
    userName: z.string().optional(),
  }).nullable(),
  roles: z.array(z.string()),
  activeRole: z.string().nullable(),
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>

// Login response
export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    userName: z.string().optional(),
  }),
  roles: z.array(z.string()),
  activeRole: z.string(),
})
export type LoginResponse = z.infer<typeof loginResponseSchema>
```

### 2. Buat `src/routes/api/auth/login.ts`

TanStack Start server function untuk login via API (alternative ke login page).

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { loginSchema } from '#/lib/schemas/auth'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getPrimaryRole, getUserRole, setActiveRoleCookie } from '#/lib/auth'
import type { RoleName } from '#/lib/types/auth'

export const Route = createFileRoute('/api/auth/login')({
  post: async ({ request, event }) => {
    // 1. Parse dan validate input
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return new Response(JSON.stringify({
        error: 'Validasi gagal',
        details: result.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email, password } = result.data

    // 2. Login via Supabase Auth
    const supabase = createServerSupabaseClient(event)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return new Response(JSON.stringify({
        error: 'Email atau password salah',
        code: error.code,
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Get roles
    const roles = await getUserRole(supabase, data.user.id)
    const activeRole: RoleName = getPrimaryRole(roles)

    // 4. Set active_role cookie
    setActiveRoleCookie(event, activeRole)

    // 5. Return response
    return new Response(JSON.stringify({
      user: {
        id: data.user.id,
        email: data.user.email,
        userName: data.user.user_metadata?.user_name as string | undefined,
      },
      roles,
      activeRole,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 3. Buat `src/routes/api/auth/logout.ts`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { clearActiveRoleCookie } from '#/lib/auth'

export const Route = createFileRoute('/api/auth/logout')({
  post: async ({ event }) => {
    const supabase = createServerSupabaseClient(event)

    // Clear active_role cookie
    clearActiveRoleCookie(event)

    // Sign out dari Supabase (clears session cookies)
    await supabase.auth.signOut()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 4. Buat `src/routes/api/auth/session.ts`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getUserRole, getActiveRoleFromCookie, getPrimaryRole } from '#/lib/auth'
import type { RoleName } from '#/lib/types/auth'

export const Route = createFileRoute('/api/auth/session')({
  get: async ({ event }) => {
    const supabase = createServerSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new Response(JSON.stringify({ session: null, roles: [], activeRole: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const roles = await getUserRole(supabase, session.user.id)
    const cookieRole = getActiveRoleFromCookie(event)
    const activeRole: RoleName = cookieRole && roles.includes(cookieRole) ? cookieRole : getPrimaryRole(roles)

    return new Response(JSON.stringify({
      session: {
        userId: session.user.id,
        email: session.user.email,
        userName: session.user.user_metadata?.user_name as string | undefined,
      },
      roles,
      activeRole,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 5. Buat `src/routes/api/auth/role-switch.ts`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { roleSwitchSchema } from '#/lib/schemas/auth'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getUserRole, setActiveRoleCookie } from '#/lib/auth'
import type { RoleName } from '#/lib/types/auth'

export const Route = createFileRoute('/api/auth/role-switch')({
  post: async ({ request, event }) => {
    // 1. Parse dan validate input
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = roleSwitchSchema.safeParse(body)
    if (!result.success) {
      return new Response(JSON.stringify({
        error: 'Validasi gagal',
        details: result.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { activeRole } = result.data

    // 2. Verify user punya role tersebut
    const supabase = createServerSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userRoles = await getUserRole(supabase, session.user.id)

    // ADMIN tidak boleh switch role (ADMIN dedicated)
    if (session && userRoles.includes('ADMIN')) {
      return new Response(JSON.stringify({
        error: 'ADMIN tidak bisa switch role — akun dedicated',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!userRoles.includes(activeRole as RoleName)) {
      return new Response(JSON.stringify({
        error: `Role '${activeRole}' tidak tersedia untuk akun Anda`,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Update cookie
    setActiveRoleCookie(event, activeRole as RoleName)

    return new Response(JSON.stringify({ success: true, activeRole }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## Files to Create/Modify

- `src/lib/schemas/auth.ts` — baru (Zod schemas)
- `src/routes/api/auth/login.ts` — baru
- `src/routes/api/auth/logout.ts` — baru
- `src/routes/api/auth/session.ts` — baru
- `src/routes/api/auth/role-switch.ts` — baru

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] `POST /api/auth/login` dengan credentials valid → return `{ user, session }`
- [ ] `POST /api/auth/logout` → session cleared, return 200
- [ ] `GET /api/auth/session` sebagai authenticated user → return `{ session, roles, activeRole }`
- [ ] `GET /api/auth/session` sebagai anonymous → return `{ session: null, roles: [], activeRole: null }` (200, not 401 — untuk convenience)
- [ ] `POST /api/auth/role-switch` dengan role valid → cookie updated, return 200
- [ ] `POST /api/auth/role-switch` dengan role yang tidak dimiliki → return 403

### Error Cases
- [ ] `POST /api/auth/login` dengan credentials invalid → return 401
- [ ] `POST /api/auth/role-switch` dengan role yang tidak ada di daftar user → return 403
- [ ] `GET /api/auth/session` tanpa auth cookie → return `{ session: null, ... }` (200)
- [ ] `POST /api/auth/login` dengan invalid email format → return 400 dengan Zod error details
- [ ] `POST /api/auth/login` dengan missing password → return 400

### Edge Cases
- [ ] `POST /api/auth/role-switch` ke role yang sama → still succeed, no-op
- [ ] `POST /api/auth/role-switch` saat ADMIN → return 403 "ADMIN tidak bisa switch role"
- [ ] Concurrent `role-switch` requests → last-write-wins pada cookie
- [ ] `POST /api/auth/login` saat sudah logged in → tetap succeed (return session info)
- [ ] `GET /api/auth/session` saat ADMIN → return `{ session, roles: ['ADMIN'], activeRole: 'ADMIN' }`

---

## Definition of Done

- [ ] `src/lib/schemas/auth.ts` ada dengan semua Zod schemas
- [ ] `POST /api/auth/login` — validate input, authenticate, set cookie, return JSON
- [ ] `POST /api/auth/logout` — clear cookie, sign out, return 200
- [ ] `GET /api/auth/session` — return session + roles + activeRole (public — no auth required)
- [ ] `POST /api/auth/role-switch` — validate role, verify ownership, update cookie, return 200
- [ ] Semua endpoint handle errors dengan appropriate HTTP status codes
- [ ] Semua input divalidasi dengan Zod schema
- [ ] ADMIN tidak bisa role-switch (403 response)
- [ ] API responses memiliki `Content-Type: application/json`
- [ ] CORS headers jika diperlukan (untuk mobile app access)
