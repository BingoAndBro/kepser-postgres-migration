# Section 04: Auth Helpers Library

## Context

Section 03 sudah selesai — Supabase clients sudah tersedia. Sekarang kita perlu membuat auth helpers yang将是 semua auth logic di aplikasi. Helper ini dipakai oleh route guards, server functions, dan komponen React.

Ini adalah layer business logic untuk auth. Setelah ini selesai, semua section lain bisa dimulai secara parallel.

---

## Objective

Pada akhir section ini:
- `src/lib/types/auth.ts` — typed Role enum, User type, Session helpers
- `src/lib/auth.ts` — semua auth helper functions: `getSession`, `getUserRole`, `hasRole`, `requireRole`, `requireAnyRole`, `getPrimaryRole`, `getActiveRoleFromCookie`, `setActiveRoleCookie`
- Semua helper typed dan bisa digunakan di server dan client contexts

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-03-supabase-clients.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/supabase-server.ts`
  - `src/lib/supabase-browser.ts`
  - `src/lib/db/schema.ts`

---

## Implementation Steps

### 1. Buat Typed Role Definitions di `src/lib/types/auth.ts`

Sesuai AGENTS.md dan spec.md, role di-hardcode untuk MVP.

```typescript
// Role enum — hardcoded untuk MVP
export const ROLE_NAMES = ['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN'] as const

export type RoleName = typeof ROLE_NAMES[number]

// Extend Supabase User type
export interface AppUser {
  id: string
  email: string
  userName?: string // dari user_metadata
  createdAt: string
}

// App session — Supabase session + app-specific data
export interface AppSession {
  user: AppUser
  // roles adalah semua role yang dimiliki user
  roles: RoleName[]
  // activeRole adalah role yang sedang aktif (dari cookie)
  activeRole: RoleName
  // primaryRole adalah role default (first by created_at, atau PEGAWAI)
  primaryRole: RoleName
}

// Role display info untuk UI
export interface RoleInfo {
  nama: RoleName
  deskripsi: string
  icon?: string
}

// Role display labels (untuk UI)
export const ROLE_DISPLAY: Record<RoleName, string> = {
  PEGAWAI: 'Pegawai',
  PPK: 'Pejabat Pembuat Komitmen',
  BENDAHARA: 'Bendahara',
  ARSIPARIS: 'Arsiparis',
  ADMIN: 'Administrator',
}
```

### 2. Buat Cookie Helpers di `src/lib/auth.ts`

Cookies untuk menyimpan active role. Dipisah untuk kejelasan.

```typescript
import type { RequestEvent } from '@tanstack/react-start/server'
import type { RoleName } from './types/auth'

export const ACTIVE_ROLE_COOKIE = 'dms_active_role'

export function getActiveRoleFromCookie(event: RequestEvent): RoleName | null {
  return event.cookie.get(ACTIVE_ROLE_COOKIE)?.value as RoleName | null
}

export function setActiveRoleCookie(event: RequestEvent, role: RoleName): void {
  event.cookie.set(ACTIVE_ROLE_COOKIE, role, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false, // Perlu dibaca di client untuk role switcher
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearActiveRoleCookie(event: RequestEvent): void {
  event.cookie.delete(ACTIVE_ROLE_COOKIE)
}
```

### 3. Implement Auth Helpers di `src/lib/auth.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RoleName, AppSession } from './types/auth'
import { getActiveRoleFromCookie, setActiveRoleCookie } from './cookie'

/**
 * Ambil session dari Supabase server client
 * Return null jika tidak ada session aktif
 */
export async function getSession(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Ambil semua role yang dimiliki user
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<RoleName[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role:roles(nama)')
    .eq('user_id', userId)

  if (error || !data) return []

  // Extract role names from joined data
  const roleNames = data
    .map((row: any) => row.role?.nama as RoleName | undefined)
    .filter((n): n is RoleName => n !== undefined)

  return roleNames
}

/**
 * Cek apakah user punya role tertentu
 */
export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  role: RoleName
): Promise<boolean> {
  const roles = await getUserRole(supabase, userId)
  return roles.includes(role)
}

/**
 * Cek apakah user punya SALAH SATU dari roles
 */
export async function hasAnyRole(
  supabase: SupabaseClient,
  userId: string,
  roles: RoleName[]
): Promise<boolean> {
  if (roles.length === 0) return false
  const userRoles = await getUserRole(supabase, userId)
  return roles.some(r => userRoles.includes(r))
}

/**
 * Throw 403 jika user tidak punya role
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  role: RoleName
): Promise<void> {
  if (!(await hasRole(supabase, userId, role))) {
    throw new Error(`403:${role}`)
  }
}

/**
 * Throw 403 jika user tidak punya SALAH SATU dari roles
 */
export async function requireAnyRole(
  supabase: SupabaseClient,
  userId: string,
  roles: RoleName[]
): Promise<void> {
  if (roles.length === 0) {
    throw new Error('400:At least one role required')
  }
  if (!(await hasAnyRole(supabase, userId, roles))) {
    throw new Error(`403:${roles.join('|')}`)
  }
}

/**
 * Tentukan primary role: first by created_at ASC
 * Jika tidak ada role → return PEGAWAI sebagai fallback
 */
export function getPrimaryRole(roles: RoleName[]): RoleName {
  if (roles.length === 0) return 'PEGAWAI'
  // Priority order: PEGAWAI > PPK > BENDAHARA > ARSIPARIS > ADMIN
  const priority: RoleName[] = ['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN']
  for (const r of priority) {
    if (roles.includes(r)) return r
  }
  return roles[0]
}

/**
 * Bangun AppSession dari Supabase session + role data
 */
export async function buildAppSession(
  supabase: SupabaseClient,
  event: RequestEvent
): Promise<AppSession | null> {
  const session = await getSession(supabase)
  if (!session) return null

  const roles = await getUserRole(supabase, session.user.id)
  const primaryRole = getPrimaryRole(roles)

  // activeRole dari cookie, fallback ke primary role
  const cookieRole = getActiveRoleFromCookie(event)
  const activeRole = cookieRole && roles.includes(cookieRole) ? cookieRole : primaryRole

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      userName: session.user.user_metadata?.user_name as string | undefined,
      createdAt: session.user.created_at ?? '',
    },
    roles,
    activeRole,
    primaryRole,
  }
}
```

### 4. Buat Route Guard Helper Functions

Wrapper functions yang throw TanStack Start errors (bukan generic Error) untuk kompatibilitas dengan route beforeLoad hooks.

```typescript
import { redirect, notFound, serverError } from '@tanstack/react-router'
import type { RequestEvent } from '@tanstack/react-start/server'
import type { RoleName } from './types/auth'
import { createServerSupabaseClient } from './supabase-server'
import { buildAppSession, hasRole, hasAnyRole } from './auth'

/**
 * SSR route guard: require authenticated user
 * Throw redirect ke /login jika tidak ada session
 */
export async function requireAuth(event: RequestEvent) {
  const supabase = createServerSupabaseClient(event)
  const session = await getSession(supabase)
  if (!session) {
    throw redirect({ to: '/login' })
  }
  return session
}

/**
 * SSR route guard: require specific role
 * Throw 403 jika tidak punya role
 */
export async function guardRole(event: RequestEvent, role: RoleName): Promise<void> {
  const session = await requireAuth(event)
  const supabase = createServerSupabaseClient(event)
  const hasTheRole = await hasRole(supabase, session.user.id, role)
  if (!hasTheRole) {
    throw serverError(403, `Akses ditolak. Anda memerlukan role ${role}.`)
  }
}

/**
 * SSR route guard: require any of the specified roles
 * Throw 403 jika tidak punya satupun role
 */
export async function guardAnyRole(event: RequestEvent, roles: RoleName[]): Promise<void> {
  const session = await requireAuth(event)
  const supabase = createServerSupabaseClient(event)
  const hasAny = await hasAnyRole(supabase, session.user.id, roles)
  if (!hasAny) {
    throw serverError(403, `Akses ditolak. Anda memerlukan salah satu role: ${roles.join(', ')}.`)
  }
}
```

> Note: `serverError` di TanStack Start menggunakan format yang sedikit berbeda dari `redirect`. Untuk 403, gunakan `new Response(null, { status: 403 })` atau buat custom error factory.

---

## Files to Create/Modify

- `src/lib/types/auth.ts` — baru
- `src/lib/auth.ts` — baru (cookie helpers + auth functions)
- `src/lib/guards.ts` — baru (route guard wrappers)

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] `getSession(supabase)` mengembalikan `Session | null`
- [ ] `getUserRole(supabase, userId)` mengembalikan array Role yang benar
- [ ] `hasRole(supabase, userId, 'ADMIN')` → true jika user punya ADMIN
- [ ] `hasRole(supabase, userId, 'ADMIN')` → false jika user tidak punya ADMIN
- [ ] `requireRole(supabase, userId, 'ADMIN')` → tidak throw jika user punya ADMIN
- [ ] `requireAnyRole(supabase, userId, ['ADMIN', 'ARSIPARIS'])` → tidak throw jika user punya salah satu

### Error Cases
- [ ] `requireRole(supabase, userId, 'ADMIN')` → throw 403 jika user tidak punya ADMIN
- [ ] `requireRole(supabase, userId, 'ADMIN')` → throw 403 jika userId tidak valid
- [ ] `requireAnyRole(supabase, userId, [])` → throw 400 "At least one role required"
- [ ] `getUserRole(supabase, null)` → throw error "userId is required"

### Edge Cases
- [ ] User punya 3 role → `getUserRole` return 3 role
- [ ] User dihapus dari semua role → `getUserRole` return array kosong, `hasRole` semua false
- [ ] `getPrimaryRole([])` → return 'PEGAWAI'
- [ ] `getPrimaryRole(['ADMIN'])` → return 'ADMIN'
- [ ] `getPrimaryRole(['PPK', 'PEGAWAI'])` → return 'PEGAWAI' (priority)

---

## Definition of Done

- [ ] `src/lib/types/auth.ts` export `RoleName`, `AppUser`, `AppSession`, `ROLE_DISPLAY`
- [ ] `src/lib/auth.ts` export semua auth helper functions
- [ ] `src/lib/auth.ts` export `ACTIVE_ROLE_COOKIE`, cookie helper functions
- [ ] `src/lib/guards.ts` export `requireAuth`, `guardRole`, `guardAnyRole`
- [ ] `buildAppSession` bisa membangun AppSession dari Supabase session + roles + cookie
- [ ] `getPrimaryRole` menangani edge case role kosong (return PEGAWAI)
- [ ] `guardRole` throw dengan 403 status code
- [ ] Semua functions typed dengan TypeScript (tidak ada `any`)
- [ ] Auth helpers tidak memiliki side effects (stateless, semua input sebagai parameter)
