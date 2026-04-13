# Section 02: Database Schema & SQL Migration

## Context

Section 01 sudah selesai — dependencies ter-install, `drizzle.config.ts` ada, dan environment variables sudah di-set. Sekarang kita perlu mendefinisikan schema database untuk tabel `roles` dan `user_roles`, serta membuat SQL migration untuk RLS policies.

Ini adalah satu-satunya section yang menyentuh database langsung. Perlu hati-hati dengan idempotency — migration harus aman jika dijalankan lebih dari sekali.

---

## Objective

Pada akhir section ini:
- `src/lib/db/schema.ts` berisi Drizzle schema untuk `roles` dan `user_roles`
- `src/lib/db/index.ts` export db client
- `supabase/migrations/001_auth_rbac.sql` berisi SQL yang idempotent untuk membuat tabel dan RLS policies
- `pnpm drizzle-kit generate` menghasilkan migration file
- Seed data untuk 5 roles berhasil di-insert

---

## Prerequisites

- Section(s) yang harus selesai dulu: section-01-dependencies.md
- Files/modules yang harus sudah tersedia:
  - `drizzle.config.ts`
  - `src/lib/db/` directory

---

## Implementation Steps

### 1. Buat Drizzle Schema di `src/lib/db/schema.ts`

Gunakan Drizzle ORM untuk mendefinisikan schema. Sesuai AGENTS.md — "schema-as-code".

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull().unique(),
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => auth.users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdRoleIdUnique: unique().on(table.userId, table.roleId),
}))
```

> Note: Drizzle menggunakan `auth.users` sebagai reference ke Supabase auth.users. Ini adalah special Supabase schema yang sudah ada.

Export typed versions:

```typescript
export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
```

### 2. Buat SQL Migration di `supabase/migrations/001_auth_rbac.sql`

SQL migration ini menjalankan hal yang sama dengan Drizzle schema, tapi dalam format SQL murni untuk dieksekusi via Supabase dashboard atau CLI.

**Struktur file:**

```sql
-- =====================================================
-- 001_auth_rbac.sql
-- Auth & RBAC Foundation: roles, user_roles, RLS
-- =====================================================

-- Enable UUID extension (biasanya sudah ada, tapi aman untuk dijalankan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  deskripsi text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- TABLE: user_roles
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id)
);

-- =====================================================
-- SECURITY DEFINER FUNCTION: get_user_roles
-- Supabase RLS doesn't support direct cross-table join
-- This function enables RLS to check user's roles
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS SETOF roles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.* FROM roles r
  INNER JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
$$;

-- =====================================================
-- RLS: Enable Row Level Security
-- =====================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: roles
-- =====================================================
-- Everyone can read roles (needed for role display in UI)
CREATE POLICY roles_select ON roles
  FOR SELECT
  USING (true);

-- Only ADMIN can insert/update/delete roles
-- (Note: ADMIN check done via server function, not RLS alone)
-- For MVP, we allow INSERT/UPDATE/DELETE only from service role key
CREATE POLICY roles_admin_all ON roles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN')
  WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- =====================================================
-- RLS POLICIES: user_roles
-- =====================================================
-- User can SELECT their own role mappings
-- ADMIN can also SELECT all mappings (via get_user_roles function)
CREATE POLICY user_roles_select_own ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_roles_select_admin ON user_roles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr
    WHERE gr.nama = 'ADMIN'
  ));

-- INSERT only by ADMIN (server-side check required)
CREATE POLICY user_roles_insert_admin ON user_roles
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr
    WHERE gr.nama = 'ADMIN'
  ));

-- DELETE only by ADMIN
CREATE POLICY user_roles_delete_admin ON user_roles
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr
    WHERE gr.nama = 'ADMIN'
  ));

-- =====================================================
-- SEED DATA: 5 roles
-- =====================================================
INSERT INTO roles (nama, deskripsi) VALUES
  ('PEGAWAI', 'Role dasar — semua pegawai punya role ini'),
  ('PPK', 'Pejabat Pembuat Komitmen — validasi dokumen'),
  ('BENDAHARA', 'Bendahara — approve pencairan'),
  ('ARSIPARIS', 'Arsiparis — arsipkan dokumen'),
  ('ADMIN', 'Administrator — kelola user & master data')
ON CONFLICT (nama) DO NOTHING;
```

### 3. Buat `src/lib/db/index.ts`

Export database client untuk digunakan di aplikasi:

```typescript
import { drizzle } from 'drizzle-orm/...'
import * as schema from './schema'

// Note: Supabase uses connection pooler
// For SSR, use Supabase server client, not direct Drizzle connection
// This file is for reference schema only

export { schema }
export type Database = typeof schema
```

> Note: Untuk TanStack Start SSR, kita tidak menggunakan Drizzle connection langsung di server functions — kita menggunakan Supabase server client. File ini mainly untuk type exports dan potential future use cases.

### 4. Jalankan Drizzle Migration Generate

```bash
pnpm drizzle-kit generate
```

Ini akan menghasilkan file di `drizzle/` dengan Drizzle migration format. File ini adalah backup/documentation — SQL migration di `supabase/migrations/` adalah yang sebenarnya dijalankan.

### 5. Verify SQL bisa dijalankan

Review `supabase/migrations/001_auth_rbac.sql` — pastikan:
- Semua statement idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- Sequence logical: enable RLS setelah create tables
- Seed data memiliki `ON CONFLICT DO NOTHING` untuk aman dijalankan ulang

---

## Files to Create/Modify

- `src/lib/db/schema.ts` — baru
- `src/lib/db/index.ts` — baru
- `supabase/migrations/001_auth_rbac.sql` — baru
- `drizzle/` — generated output dari drizzle-kit (directory)

---

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] `src/lib/db/schema.ts` export `roles` dan `user_roles` table schemas
- [ ] `src/lib/db/schema.ts` export `Role` dan `UserRole` types
- [ ] `pnpm drizzle-kit generate` menghasilkan file migration di `drizzle/`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi CREATE TABLE untuk `roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi CREATE TABLE untuk `user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi SECURITY DEFINER function `get_user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi RLS policies untuk `user_roles`
- [ ] `supabase/migrations/001_auth_rbac.sql` berisi INSERT seed untuk 5 roles (PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN)
- [ ] UNIQUE constraint `user_roles(user_id, role_id)` ada

### Edge Cases
- [ ] Duplicate role name INSERT → gagal (UNIQUE constraint)
- [ ] Same user_id + role_id INSERT → gagal (UNIQUE constraint)

### Error Cases
- [ ] Jika migration SQL dijalankan dua kali → IDEMPOTENT (tidak error karena IF NOT EXISTS)
- [ ] Jika function `get_user_roles` dihapus → RLS policy tetap mencari function (akan fail-safe)

---

## Definition of Done

- [ ] `src/lib/db/schema.ts` ada dengan `roles` dan `userRoles` table definitions
- [ ] `src/lib/db/schema.ts` export typed versions
- [ ] `supabase/migrations/001_auth_rbac.sql` ada dan idempotent
- [ ] File SQL berisi semua: CREATE TABLE, RLS policies, function, seed data
- [ ] `pnpm drizzle-kit generate` menghasilkan output tanpa error
- [ ] Schema types bisa di-import di file lain tanpa TypeScript errors
- [ ] UNIQUE constraint pada `user_roles(user_id, role_id)` terdefinisi
