# Research: 01-auth-rbac-foundation

## Fase 1: Research Findings

Tanggal: 2026-04-09
Spec: docs/specs/01-auth-rbac-foundation/spec.md

---

## 1a. Codebase Research

### Tech Stack yang Ditemukan

**Framework:** TanStack Start (latest) — SSR dengan file-based routing.
- Routing via `createFileRoute()` dari `@tanstack/react-router`
- `routeTree.gen.ts` di-generate otomatis oleh TanStack Router plugin
- Root route di `src/routes/__root.tsx` — menggunakan `shellComponent` (RootDocument)
- Tidak ada middleware SSR eksplisit yang terdeteksi di codebase saat ini

**Package.json:** Tidak ada `@supabase/supabase-js`, `drizzle-orm`, atau `zod` di dependencies. Ini adalah MVP awal — Supabase client belum terinstall.

**Routing saat ini:**
```
/               → src/routes/index.tsx  (InboxScreen)
/arsiparis/     → src/routes/arsiparis.index.tsx
/admin/workflow → src/routes/admin.workflow.tsx
```

**Komponen UI yang tersedia:** Card, Button, Table, Input, Select, Avatar, Dialog, Badge/StatusBadge — semua dari shadcn/ui pattern.

**Auth state:** Tidak ada auth provider atau Supabase client setup. `.env` hanya berisi `FIRECRAWL_API_KEY`.

**AppLayout:** Hardcoded user name "Kak Tami" dengan initials "KT". Navigasi hardcoded dengan NAV_ITEMS statis. Role-based nav belum diimplementasi.

---

### Research dari Dokumentasi External (TanStack Start + Supabase Auth)

**TanStack Start Auth Pattern:**
- Tidak ada built-in auth middleware di TanStack Start v1.x
- Server functions (`createFileRoute` dengan `loader`/`beforeLoad`) bisa digunakan sebagai auth guard
- Cookie-based session adalah pendekatan standar untuk SSR auth di TanStack Start
- `beforeLoad` hook di route bisa digunakan sebagai route-level access control

**TanStack Start Route Guards:**
```typescript
// Pattern yang bisa dipakai untuk SSR auth guard
createFileRoute('/admin/...')({
  beforeLoad: async ({ context }) => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    const role = await getUserRole(session.user.id)
    if (!role.includes('ADMIN')) throw error({ code: 403, message: 'Forbidden' })
  }
})
```

**Supabase Auth + TanStack Start:**
- `@supabase/ssr` package menyediakan SSR-aware Supabase client (cookie-based)
- `createServerClient` untuk server-side operations
- `createBrowserClient` untuk client-side
- Session management via cookies — cookie `sb-access-token` dan `sb-refresh-token`
- `supabase.auth.getSession()` → `supabase.auth.getUser()` pattern di server

**RLS Patterns untuk user_roles:**
- RLS不支持 direct cross-table join
- Spec sudah mengantisipasi ini: gunakan function-based policy
- Pattern: buat helper function `get_user_roles(user_id)` lalu gunakan di RLS policy

---

## 1b. Kesimpulan Research

### What Already Exists:
- TanStack Start setup dengan routing file-based
- shadcn/ui components (Card, Button, Table, dll)
- AppLayout shell dengan BPS branding
- Vitest untuk testing

### What Needs to Be Built:
- Supabase client setup (server + browser)
- Auth server functions (login, logout, session)
- Route-level SSR guards
- Role management helpers (`getUserRole`, `hasRole`, `requireRole`)
- Login page UI
- Role switcher di AppLayout
- Drizzle schema untuk `roles` dan `user_roles`
- SQL migration untuk RLS policies
- Seed data untuk 5 roles

### Gaps yang Teridentifikasi:
1. `.env` belum punya `SUPABASE_URL` dan `SUPABASE_ANON_KEY`
2. Tidak ada Drizzle ORM setup (package.json kosong dari dependencies db)
3. Tidak ada `supabase` atau `@supabase/ssr` di dependencies
4. Tidak ada Zod di dependencies (needed untuk input validation)

### Konflik Spec vs Codebase:
- Spec menyebut "Seed data 5 role berhasil di-insert" — tapi tidak ada migration file SQL
- Spec menyebut route `/dokumen/*` → PEGAWAI akses — route ini belum ada di codebase
- Spec menyebut "Redirect logic after login: detect primary role" — belum ada routing logic ini

---

## 1c. Web Research Topics

Web research TIDAK diperlukan untuk spec ini. Pattern Supabase Auth + TanStack Start sudah well-documented dan spec cukup jelas. Lanjut ke interview.
