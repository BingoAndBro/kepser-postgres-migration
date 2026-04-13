# Section 01: Install Dependencies

## Context

Ini adalah langkah awal yang diperlukan sebelum menulis kode auth. Tanpa dependencies yang benar, tidak ada yang bisa di-build. Spec ini adalah fondasi pertama — package.json belum memiliki Supabase, Drizzle, atau Zod.

---

## Objective

Pada akhir section ini:
- `package.json` berisi semua dependencies baru untuk auth infrastructure
- `drizzle.config.ts` ada dan ter-konfigurasi
- `.env` memiliki placeholder untuk `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `.env.example` dibuat sebagai template untuk developer lain

---

## Prerequisites

- Section(s) yang harus selesai dulu: none (ini section pertama)
- Files/modules yang harus sudah tersedia: none

---

## Implementation Steps

### 1. Install Supabase packages

Jalankan di root project:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

`@supabase/ssr` menyediakan SSR-aware Supabase client dengan cookie management built-in. Ini lebih baik daripada custom cookie handling manual.

### 2. Install Drizzle ORM dan Zod

```bash
pnpm add drizzle-orm zod
pnpm add -D drizzle-kit
```

`drizzle-orm` untuk type-safe database queries (sesuai AGENTS.md). `zod` untuk schema validation di setiap boundary.

### 3. Buat `drizzle.config.ts`

Buat file di root project:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle/',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

Note: `DATABASE_URL` di sini adalah Supabase Postgres connection string (bisa diambil dari Supabase dashboard → Settings → Database). Gunakan env variable, bukan hardcoded string.

### 4. Update `.env`

Tambahkan variabel ini ke `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-id:password@aws-your-region.compute-1.amazonaws.com:5432/postgres
```

Ganti placeholder values dengan credentials dari Supabase dashboard.

### 5. Buat `.env.example`

Buat file baru `.env.example` di root project — ini adalah template untuk developer lain dan akan di-commit:

```
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-id:password@aws-your-region.compute-1.amazonaws.com:5432/postgres
```

### 6. Buat `src/lib/db/` directory

Buat struktur folder untuk Drizzle schema:

```bash
mkdir -p src/lib/db
```

---

## Files to Create/Modify

- `package.json` — dependencies baru (auto-update dari pnpm add)
- `drizzle.config.ts` — baru (di root project)
- `.env` — tambahkan 4 variabel baru
- `.env.example` — baru (di root project)
- `src/lib/db/` — baru (directory kosong)

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] `pnpm add @supabase/supabase-js @supabase/ssr` berhasil tanpa error
- [ ] `pnpm add drizzle-orm zod` berhasil tanpa error
- [ ] `pnpm add -D drizzle-kit` berhasil tanpa error
- [ ] `package.json` berisi semua dependencies baru
- [ ] `drizzle.config.ts` bisa di-import tanpa error
- [ ] `.env.example` ada dan berisi placeholder `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`

### Error Cases
- [ ] Jika `.env` belum ada `SUPABASE_URL` → aplikasi memberikan warning yang jelas saat startup (bukan silent fail)

---

## Definition of Done

- [ ] `pnpm install` berhasil setelah packages ditambahkan
- [ ] `drizzle.config.ts` ada dan bisa dijalankan `pnpm drizzle-kit generate`
- [ ] `.env` memiliki `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- [ ] `.env.example` ada di root project dengan placeholder values
- [ ] `src/lib/db/` directory sudah ada
- [ ] Tidak ada TypeScript errors terkait import packages baru
