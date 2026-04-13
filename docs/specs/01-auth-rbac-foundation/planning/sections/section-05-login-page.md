# Section 05: Login Page

## Context

Section 04 sudah selesai — auth helpers sudah tersedia. Sekarang kita bisa membuat login page. Ini adalah entry point untuk semua user, jadi perluUX yang bersih dengan error handling yang baik.

Login page harus:
1. Tampilkan form email + password
2. Handle login via Supabase Auth
3. Set `active_role` cookie saat login berhasil
4. Redirect based on active role (ADMIN → `/admin`, others → `/`)

---

## Objective

Pada akhir section ini:
- `src/routes/login.tsx` — halaman login dengan form email + password
- Redirect jika sudah logged in (ke `/` atau `/admin`)
- Error handling yang jelas untuk semua failure case
- Active role cookie di-set setelah login berhasil

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-04-auth-helpers.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/supabase-browser.ts`
  - `src/lib/auth.ts` (cookie helpers)
  - `src/lib/guards.ts`

---

## Implementation Steps

### 1. Buat Login Route dengan beforeLoad Guard

`src/routes/login.tsx`:

```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { getBrowserClient } from '#/lib/supabase-browser'
import { getPrimaryRole } from '#/lib/auth'
import { z } from 'zod'

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async ({ redirect }) => {
    // Jika sudah logged in → redirect
    const supabase = getBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Cek role untuk redirect yang tepat
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role:roles(nama)')
        .eq('user_id', session.user.id)
      const roleNames = roles?.map(r => r.role?.nama).filter(Boolean) ?? []
      const primaryRole = getPrimaryRole(roleNames as any)
      if (primaryRole === 'ADMIN') {
        throw redirect({ to: '/admin' })
      }
      throw redirect({ to: '/' })
    }
  }
})
```

### 2. Implement LoginPage Component

```typescript
function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    setIsLoading(true)
    try {
      const supabase = getBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Map Supabase error codes ke user-friendly messages
        if (authError.code === 'invalid_credentials') {
          setError('Email atau password salah')
        } else if (authError.code === 'user_not_found') {
          setError('Email atau password salah')
        } else if (authError.code === 'email_not_confirmed') {
          setError('Silakan verifikasi email Anda terlebih dahulu. Cek inbox atau folder spam.')
        } else {
          setError('Terjadi kesalahan saat login. Silakan coba lagi.')
        }
        return
      }

      // Login berhasil — redirect berdasarkan role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role:roles(nama)')
        .eq('user_id', data.user.id)

      const roleNames = roles?.map(r => r.role?.nama).filter(Boolean) ?? []
      const primaryRole = getPrimaryRole(roleNames as any)

      // Set active_role cookie (via client-side cookie set)
      document.cookie = `dms_active_role=${primaryRole}; path=/; max-age=${60*60*24*30}; samesite=lax`

      // Redirect
      if (primaryRole === 'ADMIN') {
        await navigate({ to: '/admin' })
      } else {
        await navigate({ to: '/' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/bps-logo.png" alt="BPS Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl text-center">Masuk</CardTitle>
          <CardDescription className="text-center">
            Gunakan akun您 Anda untuk mengakses sistem DMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@bps.go.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. Handle Root Route Redirect Based on Role

Modifikasi `src/routes/index.tsx` untuk menambahkan beforeLoad yang redirect berdasarkan active role:

```typescript
export const Route = createFileRoute('/')({
  component: InboxScreen,
  beforeLoad: async ({ event, redirect }) => {
    // Jika belum logged in → redirect ke /login
    const { requireAuth } = await import('#/lib/guards')
    const session = await requireAuth(event)

    // Cek apakah active_role cookie ada
    const { getActiveRoleFromCookie } = await import('#/lib/auth')
    const activeRole = getActiveRoleFromCookie(event)

    // ADMIN redirect ke /admin jika mereka coba akses root
    if (activeRole === 'ADMIN') {
      throw redirect({ to: '/admin' })
    }
    // Non-ADMIN stay di /
  }
})
```

> Note: Spec menyebut "redirect based on primary role" — tapi untuk simplicity, `/` adalah inbox universal untuk semua non-ADMIN role. ADMIN adalah special case karena mereka tidak perlu inbox workflow.

---

## Files to Create/Modify

- `src/routes/login.tsx` — baru
- `src/routes/index.tsx` — modifikasi (beforeLoad auth guard)

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] Navigasi ke `/login` menampilkan form email + password
- [ ] Submit dengan email + password valid → login berhasil → redirect ke `/`
- [ ] ADMIN login → redirect ke `/admin`
- [ ] Setelah login berhasil, cookie `dms_active_role` di-set
- [ ] `dms_active_role` cookie value = primary role

### Error Cases
- [ ] Submit dengan email + password salah → tampilkan "Email atau password salah"
- [ ] Submit dengan email yang belum verifikasi → tampilkan "Silakan verifikasi email Anda..."
- [ ] Submit dengan email kosong → form validation error
- [ ] Submit dengan password kosong → form validation error
- [ ] Submit saat loading → tidak ada duplicate request

### Edge Cases
- [ ] Jika sudah logged in, navigasi ke `/login` → redirect ke `/` atau `/admin`
- [ ] Jika ADMIN logged in, navigasi ke `/login` → redirect ke `/admin`

---

## Definition of Done

- [ ] `/login` route ada dan render form login
- [ ] Form validation dengan Zod schema
- [ ] Login berhasil → set cookie → redirect berdasarkan role
- [ ] Login gagal → error message yang user-friendly
- [ ] ADMIN redirect ke `/admin`, non-ADMIN redirect ke `/`
- [ ] Jika sudah logged in → redirect otomatis (tidak perlu logout manual)
- [ ] BPS branding/logo visible di login page
- [ ] Loading state saat login in progress
- [ ] Mobile-responsive layout
