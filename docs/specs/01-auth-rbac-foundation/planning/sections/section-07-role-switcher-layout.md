# Section 07: Role Switcher + Dynamic Sidebar in AppLayout

## Context

Section 04 (auth helpers) sudah selesai. Section ini memodifikasi `AppLayout` untuk menggantikan hardcoded user info dengan data dari session, menambahkan role switcher dropdown, dan membuat sidebar navigation dinamis berdasarkan active role.

AppLayout saat ini hardcoded dengan "Kak Tami" dan static NAV_ITEMS. Ini perlu berubah setelah auth foundation ter-install.

---

## Objective

Pada akhir section ini:
- `AppLayout` menggunakan data session (nama, email, role) — tidak ada lagi "Kak Tami" hardcoded
- `src/components/auth/RoleSwitcher.tsx` — komponen dropdown untuk multi-role users
- `src/components/auth/UserMenu.tsx` — komponen avatar + info user dengan role badge
- Dynamic sidebar navigation berdasarkan active role
- Logout functionality dengan redirect ke `/login`

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-04-auth-helpers.md
- Files/modules yang harus sudah tersedia:
  - `src/lib/auth.ts` (cookie helpers, ROLE_DISPLAY)
  - `src/lib/supabase-browser.ts` (getBrowserClient)
  - `src/lib/types/auth.ts` (RoleName, AppSession)
  - `src/components/layout/AppLayout.tsx` (existing)

---

## Implementation Steps

### 1. Buat `src/components/auth/RoleSwitcher.tsx`

Komponen dropdown yang muncul hanya jika user punya >1 role. ADMIN tidak punya dropdown.

```typescript
import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import type { RoleName } from '#/lib/types/auth'
import { ROLE_DISPLAY } from '#/lib/types/auth'

interface RoleSwitcherProps {
  userRoles: RoleName[]
  activeRole: RoleName
  onSwitch: (role: RoleName) => Promise<void> | void
}

export function RoleSwitcher({ userRoles, activeRole, onSwitch }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Jangan render jika hanya 1 role atau ADMIN
  if (userRoles.length <= 1 || activeRole === 'ADMIN') {
    return null
  }

  const handleSwitch = async (newRole: RoleName) => {
    setIsLoading(true)
    try {
      await onSwitch(newRole)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <span className="font-medium">{ROLE_DISPLAY[activeRole]}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-1 z-50 w-64 shadow-lg">
          <CardContent className="p-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Ganti Role
            </div>
            <div className="mt-1 space-y-0.5">
              {userRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    role === activeRole
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span>{ROLE_DISPLAY[role]}</span>
                  {role === activeRole && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backdrop untuk menutup dropdown saat klik di luar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
```

### 2. Buat `src/components/auth/UserMenu.tsx`

Komponen avatar dengan nama user dan role badge.

```typescript
import { LogOut, User as UserIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import type { RoleName } from '#/lib/types/auth'
import { ROLE_DISPLAY } from '#/lib/types/auth'

interface UserMenuProps {
  userName?: string
  email?: string
  activeRole: RoleName
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return '??'
}

export function UserMenu({ userName, email, activeRole }: UserMenuProps) {
  const initials = getInitials(userName, email)

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-sm font-medium text-white/90 leading-tight">
          {userName || email?.split('@')[0] || 'User'}
        </span>
        <span className="text-xs text-white/60 leading-tight">
          {ROLE_DISPLAY[activeRole]}
        </span>
      </div>
      <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white border border-white/20">
        {initials}
      </div>
    </div>
  )
}
```

### 3. Modifikasi `src/components/layout/AppLayout.tsx`

Modifikasi besar-besaran AppLayout untuk menggunakan session data dan role-based navigation.

#### Navigation Configuration per Role

```typescript
import { useEffect, useState } from 'react'
import { useRouter, Link, useRouterState } from '@tanstack/react-router'
import {
  Inbox,
  Settings,
  LogOut,
  Archive,
  FileText,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import type { RoleName } from '#/lib/types/auth'
import { RoleSwitcher } from '#/components/auth/RoleSwitcher'
import { UserMenu } from '#/components/auth/UserMenu'
import { Button } from '#/components/ui/button'
import { getBrowserClient } from '#/lib/supabase-browser'

// Navigation items per role
const NAV_CONFIG: Record<RoleName, Array<{ label: string; icon: typeof Inbox; to: string }>> = {
  PEGAWAI: [
    { label: 'Inbox', icon: Inbox, to: '/' },
    { label: 'Arsip Saya', icon: Archive, to: '/dokumen' },
  ],
  PPK: [
    { label: 'Inbox', icon: Inbox, to: '/' },
    { label: 'Validasi Dokumen', icon: CheckCircle, to: '/ppk' },
    { label: 'Arsip Saya', icon: Archive, to: '/dokumen' },
  ],
  BENDAHARA: [
    { label: 'Inbox', icon: Inbox, to: '/' },
    { label: 'Persetujuan Dana', icon: DollarSign, to: '/bendahara' },
    { label: 'Arsip Saya', icon: Archive, to: '/dokumen' },
  ],
  ARSIPARIS: [
    { label: 'Inbox', icon: Inbox, to: '/' },
    { label: 'Arsiparis', icon: Archive, to: '/arsiparis' },
  ],
  ADMIN: [
    { label: 'Workflow Config', icon: Settings, to: '/admin/workflow' },
    { label: 'Kelola User', icon: FileText, to: '/admin/users' }, // future
  ],
}
```

#### AppLayout Component with Session Fetching

```typescript
export function AppLayout({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()
  const router = useRouter()
  const [userRoles, setUserRoles] = useState<RoleName[]>([])
  const [activeRole, setActiveRole] = useState<RoleName>('PEGAWAI')
  const [userName, setUserName] = useState<string | undefined>()
  const [email, setEmail] = useState<string | undefined>()

  // Fetch session and roles on mount
  useEffect(() => {
    async function fetchSession() {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not logged in — redirect
        router.navigate({ to: '/login' })
        return
      }

      // Set user info
      setUserName(session.user.user_metadata?.user_name as string | undefined)
      setEmail(session.user.email ?? undefined)

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role:roles(nama)')
        .eq('user_id', session.user.id)

      const roleNames = rolesData
        ?.map(r => r.role?.nama as RoleName | undefined)
        .filter((n): n is RoleName => n !== undefined) ?? []

      setUserRoles(roleNames)

      // Set active role dari cookie atau default
      const cookieRole = document.cookie
        .split('; ')
        .find(c => c.startsWith('dms_active_role='))
        ?.split('=')[1] as RoleName | undefined

      const effectiveRole = cookieRole && roleNames.includes(cookieRole)
        ? cookieRole
        : roleNames[0] ?? 'PEGAWAI'

      setActiveRole(effectiveRole)
    }

    fetchSession()
  }, [])

  const handleRoleSwitch = async (newRole: RoleName) => {
    // Update cookie
    document.cookie = `dms_active_role=${newRole}; path=/; max-age=${60*60*24*30}; samesite=lax`
    setActiveRole(newRole)

    // Trigger cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'dms_active_role',
      newValue: newRole,
    }))

    // Reload untuk refresh semua state
    window.location.reload()
  }

  const handleLogout = async () => {
    const supabase = getBrowserClient()
    await supabase.auth.signOut()
    // Clear active_role cookie
    document.cookie = 'dms_active_role=; path=/; max-age=0'
    router.navigate({ to: '/login' })
  }

  // Navigation items untuk active role
  const navItems = NAV_CONFIG[activeRole] ?? NAV_CONFIG.PEGAWAI

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b-[5px] border-[#0096D9] bg-[#003B73] shadow-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/bps-logo.png" alt="BPS Logo" className="h-10 w-auto" />
            <div className="flex flex-col justify-center text-white italic">
              <span className="text-sm md:text-lg font-bold leading-tight tracking-wide">
                BADAN PUSAT STATISTIK
              </span>
              <span className="text-sm md:text-lg font-bold leading-tight tracking-wide">
                KABUPATEN KEPULAUAN SERIBU
              </span>
            </div>
          </div>

          {/* Right side: Role Switcher + User Menu */}
          <div className="flex items-center gap-3">
            <RoleSwitcher
              userRoles={userRoles}
              activeRole={activeRole}
              onSwitch={handleRoleSwitch}
            />
            <UserMenu
              userName={userName}
              email={email}
              activeRole={activeRole}
            />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="sticky top-[68px] z-20 flex w-64 h-[calc(100vh-68px)] flex-col border-r bg-background">
          <nav className="flex-1 space-y-1 p-4">
            <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const isActive = routerState.location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### 4. Handle Cross-Tab Role Sync

Tambahkan event listener di `AppLayout` untuk sync role change dari tab lain:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'dms_active_role' && e.newValue) {
      setActiveRole(e.newValue as RoleName)
    }
  }

  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [])
```

---

## Files to Create/Modify

- `src/components/auth/RoleSwitcher.tsx` — baru
- `src/components/auth/UserMenu.tsx` — baru
- `src/components/layout/AppLayout.tsx` — modifikasi besar-besaran

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] AppLayout header menampilkan nama user dari session
- [ ] AppLayout header menampilkan initials user dari session
- [ ] User dengan 1 role → display role name tanpa dropdown
- [ ] User dengan 2+ role → dropdown muncul di kanan atas dengan semua role
- [ ] Klik role di dropdown → UI refresh, sidebar berubah sesuai role
- [ ] ADMIN login → tidak ada dropdown, hanya display "ADMIN"
- [ ] Sidebar navigation berubah berdasarkan active role
- [ ] Logout button → clear session → redirect ke `/login`

### Error Cases
- [ ] Session tidak ada / expired → AppLayout redirect ke `/login`
- [ ] Switch role ke role yang tidak dimiliki → tidak ada perubahan (dropdown hanya menampilkan role yang dimiliki)
- [ ] Click logout saat ada request in-flight → logout tetap berjalan

### Edge Cases
- [ ] User punya multi-role [PEGAWAI, PPK] → dropdown menampilkan "PEGAWAI" dan "PPK"
- [ ] Active role adalah PPK → sidebar menampilkan navigasi PPK
- [ ] Switch role dari PPK ke PEGAWAI → sidebar refresh ke navigasi PEGAWAI
- [ ] Active role tidak valid (role dihapus dari user) → fallback ke PEGAWAI

### Persistence
- [ ] Reload halaman → active role tetap sama (cookie persistence)
- [ ] Buka tab baru → active role di tab baru = last active role (cookie shared)
- [ ] Cross-tab sync saat switch role di tab lain

---

## Definition of Done

- [ ] `RoleSwitcher` komponen ada dan hanya render jika user punya >1 role (non-ADMIN)
- [ ] `UserMenu` komponen ada dan menampilkan initials + role label
- [ ] `AppLayout` tidak ada "Kak Tami" hardcoded lagi
- [ ] Sidebar navigation berubah sesuai active role
- [ ] Role switcher dropdown menampilkan semua role dengan ROLE_DISPLAY labels
- [ ] ADMIN login → tidak ada dropdown role switcher
- [ ] Logout button → signOut → clear cookie → redirect ke `/login`
- [ ] Active role cookie di-set saat login dan saat switch role
- [ ] Cross-tab role sync berfungsi
- [ ] No TypeScript errors
- [ ] BPS branding tetap ada di header
