---
name: db-fsm-guard
description: >
  Enforces database integrity rules, FSM state transition constraints, and Supabase RLS policies
  for the DMS (Document Management System) project. This skill is a mandatory guardrail that MUST
  be consulted whenever code touches database operations (Drizzle schema, queries, migrations),
  document status transitions, Row-Level Security policies, Supabase Storage, or audit trail
  (log_aktivitas) writes. Use this skill whenever: writing or modifying Drizzle ORM schema files,
  creating server functions that query or mutate the database, implementing document workflow
  transitions (DRAFT → IN_PPK_VALIDATION → IN_PPSPM_APPROVAL → COMPLETED → ARCHIVED),
  adding or updating Supabase RLS policies, working with Supabase Storage uploads/downloads,
  writing to the log_aktivitas audit trail, or creating Zod schemas for database-bound data.
  Even if the task seems simple like "add a column" or "update a status", always check this skill
  first — the DMS has strict architectural invariants that are easy to violate accidentally.
---

# DB & FSM Guard — DMS Integrity Skill

This skill exists because AI-generated database code optimizes for the "happy path" and lacks
knowledge of your specific security architecture. Studies show AI models frequently produce code
that looks functionally correct but fails defensively — they flatten distinctions around access
control and state, producing silent logic failures and boundary bypasses.

**Your DMS has 8 Architectural Invariants defined in `AGENTS.md`. This skill enforces them.**

---

## When This Skill Activates

Check this skill whenever you are about to:
- Write or modify any file in `src/lib/db/`
- Write Drizzle queries (`db.select`, `db.insert`, `db.update`, `db.delete`)
- Touch `dokumen_transaksi.status` or `dokumen_transaksi.current_step`
- Write to `log_aktivitas`
- Create or modify Supabase RLS policies
- Write server functions that mutate database state
- Create Zod schemas in `src/lib/schemas/` for DB-bound data

---

## Part 1: FSM (Finite State Machine) — Document Status Transitions

### The Law

> **AGENTS.md Invariant #8:** Transisi status `dokumen_transaksi.status` hanya melalui fungsi
> state machine di `src/lib/fsm.ts`. Tidak ada manual update status di luar fungsi ini.

### Valid Transitions (Exhaustive List)

```
DRAFT ──────────────────→ IN_PPK_VALIDATION       (by: PEGAWAI, action: SUBMIT)
IN_PPK_VALIDATION ──────→ IN_PPSPM_APPROVAL   (by: PPK, action: APPROVE)
IN_PPK_VALIDATION ──────→ NEED_REVISION           (by: PPK, action: REJECT, revision_target='USER')
IN_PPSPM_APPROVAL ──→ COMPLETED               (by: PPSPM, action: APPROVE)
IN_PPSPM_APPROVAL ──→ NEED_REVISION           (by: PPSPM, action: REJECT, revision_target='PPK')
NEED_REVISION ──────────→ IN_PPK_VALIDATION       (by: PEGAWAI, action: RESUBMIT, when revision_target='USER')
NEED_REVISION ──────────→ IN_PPSPM_APPROVAL   (by: PPK, action: RESUBMIT, when revision_target='PPK')
COMPLETED ──────────────→ ARCHIVED                 (by: ARSIPARIS, action: ARCHIVE)
```

**No other transitions are valid. Any code attempting an unlisted transition is a bug.**

### How to Implement FSM Code

All status transitions MUST go through `src/lib/fsm.ts`. The file must export:

```typescript
// src/lib/fsm.ts — THE ONLY place status transitions happen

import type { StatusDokumen, CurrentStep, RevisionTarget, RoleName } from './types/auth'

interface TransitionResult {
  success: boolean
  newStatus: StatusDokumen
  newCurrentStep: CurrentStep | null
  newRevisionTarget: RevisionTarget | null
  error?: string
}

// This is the ONLY function that determines the next state
export function transition(
  currentStatus: StatusDokumen,
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT' | 'ARCHIVE',
  actorRole: RoleName,
  revisionTarget?: RevisionTarget
): TransitionResult { /* ... */ }
```

### ❌ NEVER Do This

```typescript
// WRONG — direct status update outside fsm.ts
await db.update(dokumenTransaksi)
  .set({ status: 'COMPLETED' })  // ← VIOLATION: bypasses FSM
  .where(eq(dokumenTransaksi.id, docId))

// WRONG — inline transition logic in a route handler
if (doc.status === 'IN_PPK_VALIDATION') {
  doc.status = 'IN_PPSPM_APPROVAL'  // ← VIOLATION: logic outside fsm.ts
}
```

### ✅ Always Do This

```typescript
import { transition } from '~/lib/fsm'

// CORRECT — use FSM function, then persist
const result = transition(doc.status, 'APPROVE', activeRole)
if (!result.success) {
  throw new Error(result.error)
}

await db.update(dokumenTransaksi)
  .set({
    status: result.newStatus,
    currentStep: result.newCurrentStep,
    revisionTarget: result.newRevisionTarget,
    updatedAt: new Date(),
  })
  .where(eq(dokumenTransaksi.id, docId))
```

---

## Part 2: Audit Trail — log_aktivitas

### The Law

> **AGENTS.md Invariant #7:** Tabel `log_aktivitas` adalah append-only.
> Tidak ada operasi UPDATE/DELETE pada tabel ini.

### Rules

1. **ONLY INSERT.** Never write `db.update(logAktivitas)` or `db.delete(logAktivitas)`.
2. **Every status transition = one log entry.** Whenever `transition()` succeeds,
   immediately insert a log entry.
3. **Rejection requires `catatan`.** If `aksi === 'REJECT'`, the `catatan` field is mandatory.
   Validate this with Zod before insert.

### ❌ NEVER Do This

```typescript
// VIOLATION — updating audit trail
await db.update(logAktivitas).set({ catatan: 'edited' }).where(...)

// VIOLATION — deleting audit trail
await db.delete(logAktivitas).where(...)
```

### ✅ Always Do This

```typescript
// CORRECT — append only
await db.insert(logAktivitas).values({
  dokumenId: docId,
  userId: session.user.id,
  aksi: 'APPROVE',
  catatan: catatan ?? null,  // mandatory if aksi === 'REJECT'
  stepUrutan: stepNumber,
})
```

---

## Part 3: Drizzle ORM Schema Patterns

### DMS Schema Convention

Every table in the DMS follows this pattern. Read `references/schema-patterns.md` for
the complete reference of all 9 tables.

```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const myTable = pgTable('my_table', {
  // Always: uuid PK with defaultRandom
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys: always explicit references with onDelete strategy
  parentId: uuid('parent_id').notNull()
    .references(() => parentTable.id, { onDelete: 'cascade' }),

  // Text fields
  nama: text('nama').notNull(),

  // Boolean with explicit default
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps: always withTimezone
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Always export inferred types
export type MyTable = typeof myTable.$inferSelect
export type NewMyTable = typeof myTable.$inferInsert
```

### Schema Checklist (Before Every Schema Change)

Before modifying `src/lib/db/schema.ts`, verify:

- [ ] PK is `uuid('id').primaryKey().defaultRandom()`
- [ ] All FKs have explicit `onDelete` strategy (`cascade`, `restrict`, or `set null`)
- [ ] All timestamps use `{ withTimezone: true }`
- [ ] `$inferSelect` and `$inferInsert` types are exported
- [ ] Column names use `snake_case` in DB (the string parameter)
- [ ] Property names use `camelCase` in TypeScript
- [ ] No `auth.users` FK — use plain `uuid('user_id')` with comment explaining why

### Migration Workflow

```bash
# 1. Edit schema in src/lib/db/schema.ts
# 2. Generate migration SQL
pnpm drizzle-kit generate

# 3. Review generated SQL in drizzle/ folder before applying
# 4. Push to database
pnpm drizzle-kit push

# NEVER skip step 3 — always review generated SQL
```

---

## Part 4: Supabase RLS Policies

### The Law

> **AGENTS.md Invariant #9:** Pengecekan role RBAC selalu terjadi di server
> (server function / middleware SSR), bukan di client-side.

RLS is the **second line of defense** after server-side guards. Every table that stores
user-specific data MUST have RLS enabled.

### RLS Policy Template per Role

```sql
-- Enable RLS on the table
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- PEGAWAI: can only see/edit own records
CREATE POLICY "pegawai_select_own" ON my_table
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = created_by);

CREATE POLICY "pegawai_insert_own" ON my_table
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- PPK/PPSPM/ARSIPARIS: can see records assigned to their step
-- (Implement via role check in user_roles table)
CREATE POLICY "approver_select" ON dokumen_transaksi
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.nama IN ('PPK', 'PPSPM', 'ARSIPARIS')
    )
  );

-- ADMIN: full access (separate authenticated admin account)
CREATE POLICY "admin_full_access" ON my_table
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.nama = 'ADMIN'
    )
  );
```

### RLS Checklist (Before Every New Table)

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is set
- [ ] SELECT policy exists — no table should be world-readable
- [ ] INSERT policy uses `WITH CHECK`, not just `USING`
- [ ] UPDATE policy has both `USING` (who can see it) and `WITH CHECK` (what they can write)
- [ ] DELETE policy exists or is explicitly denied
- [ ] `log_aktivitas` has NO delete policy (append-only enforcement at DB level)
- [ ] Policies use `(SELECT auth.uid())` not `auth.uid()` — subquery form is more performant

---

## Part 5: Supabase Error Handling

AI models frequently ignore database error handling. In DMS, these are the errors you MUST handle:

### Common Supabase/PostgREST Errors

```typescript
import { PostgresError } from 'postgres'

// Pattern: wrap every DB operation in try-catch
try {
  const result = await db.insert(dokumenTransaksi).values(data).returning()
  return { success: true, data: result[0] }
} catch (error) {
  // RLS violation — user trying to access unauthorized data
  if (error instanceof PostgresError && error.code === '42501') {
    return { success: false, error: 'Anda tidak memiliki akses untuk operasi ini.' }
  }
  // Unique constraint violation
  if (error instanceof PostgresError && error.code === '23505') {
    return { success: false, error: 'Data sudah ada.' }
  }
  // FK constraint violation
  if (error instanceof PostgresError && error.code === '23503') {
    return { success: false, error: 'Data referensi tidak ditemukan.' }
  }
  // Unknown error — log and return generic message
  console.error('[DB_ERROR]', error)
  return { success: false, error: 'Terjadi kesalahan sistem.' }
}
```

### Error Codes Quick Reference

| Code | Meaning | DMS Context |
|------|---------|-------------|
| `42501` | RLS violation | User not authorized for this row |
| `23505` | Unique violation | Duplicate role assignment, duplicate nama |
| `23503` | FK violation | Referenced record doesn't exist |
| `23514` | Check violation | Column constraint failed |
| `42P01` | Table not found | Schema mismatch — run migration |

---

## Part 6: Zod Validation at Every Boundary

> **AGENTS.md Invariant #3:** Semua input API dan output harus divalidasi dengan Zod schema
> di `src/lib/schemas/`.

### Pattern: Form → Server Function → DB

```typescript
// 1. Define Zod schema in src/lib/schemas/dokumen.ts
export const submitDokumenSchema = z.object({
  judul: z.string().min(3, 'Judul minimal 3 karakter'),
  fungsiId: z.string().uuid('Fungsi tidak valid'),
  kegiatanJenisId: z.string().uuid('Kegiatan tidak valid'),
  isKetuaTim: z.boolean(),
  lampiranUrls: z.array(z.object({
    nama: z.string(),
    url: z.string().url(),
    tipe: z.string(),
    ukuran: z.number(),
  })).default([]),
})

// 2. Validate in server function (NEVER trust client data)
export const submitDokumen = createServerFn({ method: 'POST' })
  .validator((data: unknown) => submitDokumenSchema.parse(data))
  .handler(async ({ data }) => {
    // data is now typed and validated
  })

// 3. Use same schema for form validation on client (optional, UX only)
```

---

## Quick Decision Tree

When you're about to write database code, ask yourself:

```
Am I changing dokumen_transaksi.status?
  YES → Use src/lib/fsm.ts, NOT direct update
  NO  → Continue

Am I writing to log_aktivitas?
  YES → INSERT only. Never UPDATE/DELETE.
  NO  → Continue

Am I creating a new table?
  YES → Follow schema checklist (Part 3)
       → Write RLS policies (Part 4)
       → Export types ($inferSelect, $inferInsert)
  NO  → Continue

Am I writing a DB query in a server function?
  YES → Wrap in try-catch (Part 5)
       → Validate input with Zod (Part 6)
       → Check: does query filter by user/role? (RLS)
  NO  → Continue

Am I modifying schema.ts?
  YES → Run `pnpm drizzle-kit generate` after
       → Review generated SQL before `pnpm drizzle-kit push`
  NO  → Done
```

---

## References

For detailed patterns and the complete table definitions from AGENTS.md, read:
- `references/schema-patterns.md` — All 9 DMS tables with Drizzle definitions
- `AGENTS.md` (project root) — The full project constitution

For Drizzle ORM and Supabase documentation:
- Use best practice markdown that already been made in `docs` folder
- Or if that not exist, use `creating-best-practices` skill with Context7 for latest API reference
