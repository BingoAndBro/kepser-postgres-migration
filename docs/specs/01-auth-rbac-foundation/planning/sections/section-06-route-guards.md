# Section 06: Route Guards (beforeLoad Hooks)

## Context

Section 04 (auth helpers) sudah selesai, jadi semua tools yang dibutuhkan route guards sudah tersedia. Section ini memodifikasi semua existing routes untuk menambahkan SSR route guards, dan membuat placeholder routes untuk `/ppk`, `/bendahara`, dan `/dokumen`.

TanStack Start `beforeLoad` hook berjalan di server sebelum komponen di-render. Ini memastikan user tidak bisa mengakali akses kontrol via curl/Postman/manipulasi client.

---

## Objective

Pada akhir section ini:
- `src/routes/__root.tsx` — global beforeLoad yang redirect ke `/login` jika tidak authenticated
- `src/routes/index.tsx` — beforeLoad untuk authenticated check
- `src/routes/arsiparis.index.tsx` — beforeLoad `guardRole('ARSIPARIS')`
- `src/routes/admin.workflow.tsx` — beforeLoad `guardRole('ADMIN')`
- `src/routes/ppk.tsx` — placeholder route dengan `guardRole('PPK')`
- `src/routes/bendahara.tsx` — placeholder route dengan `guardRole('BENDAHARA')`
- `src/routes/dokumen.tsx` — placeholder route dengan `guardAnyRole(['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS'])`

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-04-auth-helpers.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/guards.ts` (`requireAuth`, `guardRole`, `guardAnyRole`)
  - All existing route files (`__root.tsx`, `index.tsx`, `arsiparis.index.tsx`, `admin.workflow.tsx`)

---

## Implementation Steps

### 1. Modifikasi `src/routes/__root.tsx` — Global beforeLoad

Root route adalah parent semua route. Modifikasi `beforeLoad` di sini untuk cover semua route yang belum punya beforeLoad sendiri. Public routes (`/login`, `/api/auth/*`) di-exclude.

```typescript
import { createRootRoute, Link, Outlet, HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/devtools'
import { AppLayout } from '../components/layout/AppLayout'
import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){...})()` // existing

export const Route = createRootRoute({
  head: () => ({ /* existing meta/links */ }),
  shellComponent: RootDocument,
  beforeLoad: async ({ event, location, redirect }) => {
    // Public routes — skip auth check
    const publicPaths = ['/login', '/api/auth/']
    if (publicPaths.some(p => location.pathname.startsWith(p))) {
      return
    }

    // API routes — hanya check auth (role checked per endpoint)
    if (location.pathname.startsWith('/api/') && !location.pathname.startsWith('/api/auth/')) {
      const { requireAuth } = await import('#/lib/guards')
      await requireAuth(event)
      return
    }

    // Page routes — require auth, let individual routes handle role checks
    // Root beforeLoad hanya memastikan user authenticated
    // Role-specific checks ada di masing-masing route
    const { requireAuth } = await import('#/lib/guards')
    await requireAuth(event)
  }
})

// ... rest of existing code unchanged
```

### 2. Modifikasi `src/routes/index.tsx` — Auth Check

Index route `/` accessible oleh semua authenticated users (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN). ADMIN yang mengakses `/` akan redirect ke `/admin`.

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
// ... existing imports

export const Route = createFileRoute('/')({
  component: InboxScreen,
  beforeLoad: async ({ event, redirect }) => {
    // Ini adalah fallback — root __root.tsx beforeLoad sudah menjalankan requireAuth
    // Tapi kita tambahkan juga di sini untuk kejelasan
    // Sekali lagi check tidak masalah (stateless, tidak ada side effect)

    // ADMIN yang mengakses / → redirect ke /admin
    // (karena admin tidak perlu inbox, mereka butuh admin panel)
    const { getActiveRoleFromCookie, getPrimaryRole, getUserRole } = await import('#/lib/auth')
    const { createServerSupabaseClient } = await import('#/lib/supabase-server')

    const supabase = createServerSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const roles = await getUserRole(supabase, session.user.id)
      const primaryRole = getPrimaryRole(roles)
      if (primaryRole === 'ADMIN') {
        throw redirect({ to: '/admin' })
      }
    }
  }
})

// ... existing InboxScreen component unchanged
```

### 3. Modifikasi `src/routes/arsiparis.index.tsx` — ARSIPARIS Guard

```typescript
import { createFileRoute } from '@tanstack/react-router'
// ... existing imports

export const Route = createFileRoute('/arsiparis/')({
  component: ArsiparisScreen,
  beforeLoad: async ({ event }) => {
    const { guardRole } = await import('#/lib/guards')
    await guardRole(event, 'ARSIPARIS')
  }
})

// ... existing ArsiparisScreen component unchanged
```

### 4. Modifikasi `src/routes/admin.workflow.tsx` — ADMIN Guard

```typescript
import { createFileRoute } from '@tanstack/react-router'
// ... existing imports

export const Route = createFileRoute('/admin/workflow')({
  component: WorkflowBuilderScreen,
  beforeLoad: async ({ event }) => {
    const { guardRole } = await import('#/lib/guards')
    await guardRole(event, 'ADMIN')
  }
})

// ... existing WorkflowBuilderScreen component unchanged
```

### 5. Buat Placeholder Routes

Placeholder routes ini adalah route files minimal yang hanya ada untuk:
1. Route tree generation (TanStack Router perlu file untuk generate routes)
2. Route guard pattern yang bisa dipakai kapan saja
3. Dokumentasi bahwa route ini exists dan sudah di-lockdown

#### `src/routes/ppk.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/ppk')({
  component: PpkPlaceholder,
  beforeLoad: async ({ event }) => {
    const { guardRole } = await import('#/lib/guards')
    await guardRole(event, 'PPK')
  }
})

function PpkPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ruang PPK</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Halaman ini akan dikembangkan di iterasi berikutnya.
          Dokumen yang memerlukan validasi PPK akan muncul di sini.
        </p>
      </CardContent>
    </Card>
  )
}
```

#### `src/routes/bendahara.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/bendahara')({
  component: BendaharaPlaceholder,
  beforeLoad: async ({ event }) => {
    const { guardRole } = await import('#/lib/guards')
    await guardRole(event, 'BENDAHARA')
  }
})

function BendaharaPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ruang Bendahara</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Halaman ini akan dikembangkan di iterasi berikutnya.
          Dokumen yang memerlukan persetujuan Bendahara akan muncul di sini.
        </p>
      </CardContent>
    </Card>
  )
}
```

#### `src/routes/dokumen.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/dokumen')({
  component: DokumenPlaceholder,
  beforeLoad: async ({ event }) => {
    const { guardAnyRole } = await import('#/lib/guards')
    await guardAnyRole(event, ['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS'])
  }
})

function DokumenPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumen</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Halaman ini akan dikembangkan di iterasi berikutnya.
          Daftar dan detail dokumen akan muncul di sini.
        </p>
      </CardContent>
    </Card>
  )
}
```

### 6. Handle 403 Error Display

Modifikasi error handling di root route atau buat error component untuk menampilkan halaman 403 yang user-friendly.

TanStack Start menggunakan `MatchRoute` atau `router.dispatch` untuk error boundaries. Untuk MVP, tambahkan custom `errorComponent` di root route:

```typescript
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        <AppLayout>
          {children}
        </AppLayout>
        {/* ... */}
        <Scripts />
      </body>
    </html>
  )
}

function ErrorComponent({ error }: { error: Error | unknown }) {
  const is403 = error instanceof Error && error.message.startsWith('403:')
  const is401 = error instanceof Error && error.message.startsWith('401:')

  if (is403) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-4xl font-bold text-destructive mb-2">403</h1>
        <p className="text-lg text-muted-foreground">Akses Ditolak</p>
        <p className="text-muted-foreground mt-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    )
  }

  if (is401) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-4xl font-bold text-destructive mb-2">401</h1>
        <p className="text-lg text-muted-foreground">Tidak Terautentikasi</p>
        <p className="text-muted-foreground mt-2">
          Silakan login terlebih dahulu.
        </p>
      </div>
    )
  }

  return null // fallback ke default error handling
}
```

---

## Files to Create/Modify

- `src/routes/__root.tsx` — modifikasi (beforeLoad global)
- `src/routes/index.tsx` — modifikasi (beforeLoad ADMIN redirect)
- `src/routes/arsiparis.index.tsx` — modifikasi (beforeLoad ARSIPARIS)
- `src/routes/admin.workflow.tsx` — modifikasi (beforeLoad ADMIN)
- `src/routes/ppk.tsx` — baru (placeholder)
- `src/routes/bendahara.tsx` — baru (placeholder)
- `src/routes/dokumen.tsx` — baru (placeholder)

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] Navigasi ke `/` tanpa session → redirect ke `/login`
- [ ] Navigasi ke `/arsiparis/` sebagai ARSIPARIS → halaman terlihat
- [ ] Navigasi ke `/admin/workflow` sebagai ADMIN → halaman terlihat
- [ ] Navigasi ke `/arsiparis/` sebagai PEGAWAI → 403 Forbidden
- [ ] Navigasi ke `/admin/workflow` sebagai BENDAHARA → 403 Forbidden
- [ ] Navigasi ke `/admin/workflow` sebagai ADMIN yang juga punya ARSIPARIS → 403 Forbidden
- [ ] Navigasi ke `/api/auth/login` → public (tidak redirect)
- [ ] Navigasi ke `/` sebagai authenticated user → halaman terlihat

### Error Cases
- [ ] Navigasi ke protected route tanpa session → redirect ke `/login`
- [ ] Navigasi ke role-protected route tanpa role → throw 403 error
- [ ] Navigasi ke role-protected route saat session expired → redirect ke `/login`

### Edge Cases
- [ ] User punya multi-role [PEGAWAI, ARSIPARIS] navigasi ke `/arsiparis/` → diizinkan
- [ ] Placeholder `/ppk` route guard → bisa diakses oleh PPK
- [ ] Placeholder `/bendahara` route guard → bisa diakses oleh BENDAHARA
- [ ] Placeholder `/dokumen` route guard → bisa diakses oleh PEGAWAI, PPK, BENDAHARA, ARSIPARIS (tidak ADMIN)

---

## Definition of Done

- [ ] `__root.tsx` sebelum route apapun, check auth (skip public paths)
- [ ] `/login` public — tidak ada redirect
- [ ] `/api/auth/*` public — tidak ada redirect
- [ ] Semua page routes (non-`/api/auth`) butuh authenticated user
- [ ] `/arsiparis/*` hanya bisa diakses ARSIPARIS (403 jika tidak)
- [ ] `/admin/*` hanya bisa diakses ADMIN (403 jika tidak)
- [ ] `/ppk/*` hanya bisa diakses PPK (403 jika tidak)
- [ ] `/bendahara/*` hanya bisa diakses BENDAHARA (403 jika tidak)
- [ ] `/dokumen/*` bisa diakses PEGAWAI, PPK, BENDAHARA, ARSIPARIS (403 jika ADMIN atau non-authenticated)
- [ ] ADMIN redirect ke `/admin` saat akses `/`
- [ ] Halaman 403 user-friendly (bukan blank page atau default browser error)
- [ ] Route guard pattern sudah tested dan reusable
