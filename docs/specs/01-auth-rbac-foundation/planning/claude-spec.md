# Synthesized Spec: 01-auth-rbac-foundation

## Problem Statement

Aplikasi DMS BPS Kepulauan Seribu memerlukan fondasi autentikasi dan role-based access control. Tanpa auth, tidak ada akses kontrol. Tanpa RBAC, semua user bisa akses semua halaman. Fondasi ini menjadi pondasi semua komponen downstream (spec 02, 03, 04, 05) — jika ini salah, semua downstream akan terpengaruh.

---

## Goals

1. Setiap user login via Supabase Auth dengan email/password.
2. Setiap halaman dicek role-nya di server (SSR guard) — user tidak bisa mengakali via curl/Postman.
3. Akses ke halaman/fitur dikunci berdasarkan Role (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN).
4. User dengan multi-role bisa switch antar role via dropdown di header.
5. Active role bertahan setelah reload halaman (SSR-compatible persistence).
6. RLS policy: data user hanya bisa dibaca oleh user itu sendiri.

---

## Non-Goals (Explicit Exclusions)

- Register/Signup oleh user sendiri (admin yang provision user).
- Edit profile / change password (ditunda ke iterasi berikutnya).
- MFA / SSO (ditunda ke fase production).
- Session refresh token manual (handled by Supabase SDK).
- Route pages untuk `/ppk/*`, `/bendahara/*` (ditunda ke spec lain).
- Workflow builder `/admin/workflow` — ini legacy mock UI, spec ini tidak menyentuh route tersebut.

---

## Context & Constraints

### Arsitektur dari AGENTS.md (HUKUM)
- **Framework:** TanStack Start (SSR), file-based routing via `createFileRoute()`
- **Database:** Supabase (PostgreSQL), RLS built-in
- **Auth:** Supabase Auth — JWT + RLS native
- **ORM:** Drizzle ORM (type-safe query, schema-as-code)
- **Validation:** Zod di setiap boundary
- **Route Guards:** `beforeLoad` hook di TanStack Start sebagai SSR auth guard
- **Layer Separation:** Data fetching → `src/routes/` (server functions), Presentasi → `src/components/`, Business logic → `src/components/`

### Codebase Existing
- TanStack Start sudah ter-setup dengan file-based routing
- shadcn/ui components tersedia (Card, Button, Table, dll)
- AppLayout dengan BPS branding sudah ada (hardcoded user name)
- Tidak ada Supabase client, tidak ada Drizzle, tidak ada Zod di dependencies
- `.env` hanya berisi `FIRECRAWL_API_KEY` — belum ada `SUPABASE_URL` dan `SUPABASE_ANON_KEY`

### Tech Stack Requirements (Baru)
Spec ini WAJIB menambah dependencies:
- `@supabase/supabase-js` (atau `@supabase/ssr` untuk SSR-aware client)
- `drizzle-orm` + `drizzle-kit` (ORM + migration)
- `zod` (validation)

---

## Key Decisions Made

### 1. Auth Flow
- Login via Supabase Auth email/password
- Server-side session via HTTP-only cookies (Supabase SSR pattern)
- `getSession()` di server → ambil dari `RequestEvent` context
- Login redirect: detect active role → redirect ke `/` (inbox universal) untuk non-ADMIN; ADMIN redirect ke `/admin`

### 2. Active Role Persistence
- Simpan `active_role` di Cookie (httpOnly: false, secure: true, sameSite: lax)
- Server baca cookie ini saat SSR untuk pre-render dengan role yang tepat
- **Tidak** menggunakan localStorage (tidak SSR-compatible)
- **Tidak** menggunakan `user_metadata` di Supabase (membutuhkan auth token refresh setiap switch)

### 3. Primary Role Determination
- Primary role = role pertama yang di-assign (first by created_at ASC)
- Default active role saat first login = PEGAWAI (role default)
- Jika user punya multi-role dan belum pilih active role → default ke PEGAWAI

### 4. ADMIN Handling
- ADMIN adalah akun dedicated — login dari `/login` biasa, tidak ada redirect khusus
- ADMIN tidak punya role switcher dropdown (karena cuma punya 1 role)
- ADMIN route check: hanya role ADMIN yang boleh akses `/admin/*`

### 5. RLS Strategy
- Gunakan `SECURITY DEFINER` function untuk cross-table role check
- `get_user_roles(user_id)` function → digunakan di RLS policies
- Drizzle ORM untuk schema definition + migration generation
- SQL migration file juga disediakan untuk execution via Supabase dashboard

### 6. Route Access Logic
- `/login` → public (redirect jika sudah logged in)
- `/` → authenticated (semua role)
- `/admin/*` → ADMIN only
- `/arsiparis/*` → ARSIPARIS only
- `/ppk/*` → PPK only (future)
- `/bendahara/*` → BENDAHARA only (future)
- `/dokumen/*` → PEGAWAI, PPK, BENDAHARA, ARSIPARIS (non-ADMIN authenticated)
- `/api/auth/*` → public
- `/api/*` → authenticated (role checked per endpoint)

---

## Assumptions

1. **Supabase project belum ada** — spec ini membuat SQL migration + Drizzle schema sebagai deliverables; owner akan execute migration manual atau via Supabase dashboard.
2. **Tidak ada Drizzle config** — akan dibuat `drizzle.config.ts` baru.
3. **ADMIN provisioning dilakukan manual** — seed SQL akan menyertakan satu user ADMIN placeholder (email yang di-assign ke admin).
4. **Route `/dokumen/*` tidak ada** — akan diimplementasi di spec lain (document workflow). Spec ini fokus ke auth infrastructure + route guard pattern.
5. **Role hierarchy tidak ada** — semua role adalah flat, tidak ada role yang "lebih tinggi" dari yang lain. Route access check adalah OR, bukan AND.

---

## Open Questions

1. **ADMIN user creation:** Apakah ADMIN credentials (email/password) di-seed juga, atau hanya role-nya? spec.md tidak menyebut seed ADMIN credentials.
   → **Jawaban sementara:** ADMIN credentials TIDAK di-seed otomatis. ADMIN provisioning dilakukan manual oleh super-admin setelah Supabase project dibuat.

2. **Route `/ppk/*`, `/bendahara/*`:** Spec ini tidak membuat route pages ini. Apakah route guard untuk role ini perlu dibuat sekarang?
   → **Jawaban sementara:** Ya — buat route guard pattern generik yang bisa dipakai kapan saja. Route pages itu diimplementasi nanti.

3. **Zod version:** Gunakan `zod` latest — sudah confirmed di AGENTS.md.

4. **Supabase SSR package:** Apakah gunakan `@supabase/ssr` atau `@supabase/supabase-js` dengan custom cookie handling?
   → **Jawaban sementara:** Gunakan `@supabase/ssr` karena sudah menyediakan cookie handling SSR-aware out-of-the-box.
