# findings.md — Research, API Constraints & Discoveries
> DMS MVP — Log semua temuan riset, constraint API, gotcha, dan discovery selama development.
> **Keputusan → `AGENTS.md`. Rencana → `task_plan.md`. Temuan → file ini.**

---

## 📦 Environment

| Property | Value |
|---|---|
| OS | Windows |
| Package Manager | pnpm |
| Workspace | `d:\GitHub\mvp` |
| Scaffold State | Green-field — hanya `.vscode` dan file MD yang ada |
| Node runtime | Belum diverifikasi (lakukan saat Phase 2: Link) |

---

## 🏗️ Tech Stack Notes

### TanStack Start
- Menggunakan file-based routing (mirip Next.js App Router tapi dengan TanStack Router)
- Server functions built-in menggunakan `createServerFn()`
- SSR dimulai dari `src/routes/__root.tsx`
- Perlu adapter Vinxi untuk Vercel deployment

### Drizzle ORM + Supabase PostgreSQL
- Drizzle menggunakan `drizzle-kit` untuk generate migrations
- Connection ke Supabase via `postgres` driver (bukan `@neondatabase/serverless`)
- Supabase RLS harus diaktifkan per tabel — Drizzle tidak generate RLS policies
- RLS policies ditulis manual di Supabase Dashboard atau via SQL migration

### Supabase Auth
- JWT disimpan di cookie oleh `@supabase/ssr` package
- SSR setup memerlukan `createServerClient` dari `@supabase/ssr`
- Middleware TanStack Start (di `app/middleware.ts`) untuk proteksi route

### shadcn/ui
- Bukan npm package — komponen di-copy ke `src/ui/` (copy-paste approach)
- Perlu setup `components.json` dan `tailwind.config.ts`
- Semua komponen shadcn menggunakan Tailwind CSS

---

## ⚠️ Known Constraints & Gotchas

*(Akan diisi saat Phase 2: Link dan Phase 3: Architect)*

---

## 🔍 Research Log

| Tanggal | Topik | Temuan |
|---|---|---|
| 2026-04-01 | PRD Review | 9 tabel inti, FSM 4 status, 3 sprint MVP dikonfirmasi dari DMS_PRD_TechStack.md |
| 2026-04-01 | Tech Stack | MVP: Supabase-only. Post-MVP: migrate ke Cloudflare R2 + Workers |

---

*Last updated: 2026-04-01 | Status: Phase 0 Complete*
