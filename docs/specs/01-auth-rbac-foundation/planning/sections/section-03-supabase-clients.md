# Section 03: Supabase Clients (Server + Browser + Admin)

## Context

Section 02 sudah selesai — schema database sudah terdefinisi, SQL migration sudah dibuat. Sekarang kita perlu membuat Supabase client yang SSR-aware. TanStack Start berjalan di server (Nitro/Vercel Edge), jadi Supabase client harus menggunakan cookie-based session management.

Ini adalah layer yang menghubungkan aplikasi dengan Supabase backend.

---

## Objective

Pada akhir section ini:
- `src/lib/supabase-server.ts` — SSR-aware server client (createServerClient dari @supabase/ssr)
- `src/lib/supabase-browser.ts` — browser client (createBrowserClient dari @supabase/ssr)
- `src/lib/supabase.ts` — unified export yang memilih server atau browser berdasarkan environment
- `src/lib/supabase-admin.ts` — admin client dengan service role key untuk server-side elevated operations

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-02-db-schema.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts`
  - `.env` dengan `SUPABASE_URL` dan `SUPABASE_ANON_KEY`

---

## Implementation Steps

### 1. Buat `src/lib/supabase-browser.ts`

Browser client untuk client-side operations. Tidak perlu event parameter — menggunakan localStorage untuk token persistence.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}

// Singleton instance untuk use di seluruh client-side code
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
```

### 2. Buat `src/lib/supabase-server.ts`

Server client untuk SSR operations. Menggunakan cookies untuk session management. Cookie options mengikuti konvensi Supabase SSR.

```typescript
import { createServerClient } from '@supabase/ssr'
import type { RequestEvent } from '@tanstack/react-start/server'

export function createServerSupabaseClient(event: RequestEvent) {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return event.request.headers.get('cookie')?.split('; ') ?? []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookie.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              httpOnly: false, // Need to read in client for active_role
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )
}
```

> Note: `httpOnly: false` untuk cookie `active_role` agar bisa dibaca di client untuk role switcher. Semua cookie lain (auth tokens) tetap `httpOnly: true` oleh Supabase SSR.

### 3. Buat `src/lib/supabase.ts`

Unified export — pilih implementasi server atau browser berdasarkan environment check.

```typescript
// Unified client factory
// Pilih server atau browser client berdasarkan environment

let _browserClient: ReturnType<typeof import('./supabase-browser').createBrowserClient> | null = null

export function getSupabaseClient(options?: { serverEvent?: RequestEvent }) {
  if (typeof window === 'undefined') {
    // Server-side: harus ada server event
    if (!options?.serverEvent) {
      throw new Error(
        'getSupabaseClient() called on server without RequestEvent. ' +
        'Pass serverEvent from the route context.'
      )
    }
    return createServerSupabaseClient(options.serverEvent)
  } else {
    // Client-side
    if (!_browserClient) {
      _browserClient = createBrowserClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      )
    }
    return _browserClient
  }
}

// Re-export for convenience
export { createBrowserClient } from './supabase-browser'
export { createServerSupabaseClient } from './supabase-server'
```

### 4. Buat `src/lib/supabase-admin.ts`

Admin client untuk server-side operations yang butuh elevated privileges. Tidak boleh digunakan di client-side atau exposed ke browser.

```typescript
import { createClient } from '@supabase/supabase-js'

// Admin client — menggunakan service role key
// BUKAN untuk digunakan di client-side atau exposed ke browser
export function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. ' +
      'Admin client cannot be used without service role key.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

> Security: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Admin client HANYA boleh digunakan di server-side code (server functions, API routes). Jangan import ini di komponen React.

### 5. Buat TypeScript types untuk Supabase clients

Tambahkan types exports ke setiap file. TanStack Start's `RequestEvent` sudah memiliki cookie management.

---

## Files to Create/Modify

- `src/lib/supabase-server.ts` — baru
- `src/lib/supabase-browser.ts` — baru
- `src/lib/supabase.ts` — baru
- `src/lib/supabase-admin.ts` — baru

---

## Test Stubs (dari TDD plan)

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

## Definition of Done

- [ ] `src/lib/supabase-server.ts` ada dan exports `createServerSupabaseClient(event)`
- [ ] `src/lib/supabase-browser.ts` ada dan exports `getBrowserClient()` singleton
- [ ] `src/lib/supabase.ts` ada dan exports unified `getSupabaseClient()` factory
- [ ] `src/lib/supabase-admin.ts` ada dan exports `createAdminClient()` dengan service role key
- [ ] Semua clients menggunakan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari env (bukan hardcoded)
- [ ] Admin client throw jika `SUPABASE_SERVICE_ROLE_KEY` tidak ada
- [ ] Server client throw dengan helpful message jika digunakan tanpa `RequestEvent`
- [ ] TypeScript: tidak ada type errors saat importing clients
- [ ] Security: admin client tidak bisa di-import di React component files
