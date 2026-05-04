# Section 10: Drizzle Schema Update (Optional)

## Context

Jika project menggunakan Drizzle ORM untuk type-safe database operations, kita perlu update schema untuk include `ketua_tim_assignments` table.

## Objective

Update Drizzle schema untuk:
1. Add `ketua_tim_assignments` table definition
2. Update related types if needed

## Prerequisites

- Section(s) yang harus selesai dulu: **01 (Database Migration)**
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (existing Drizzle schema)

## Implementation Steps

### 10.1 Read Existing Schema

Check existing Drizzle schema structure.

### 10.2 Add Table Definition

```typescript
// src/lib/db/schema.ts

import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ... existing tables ...

// New table: ketua_tim_assignments
export const ketuaTimAssignments = pgTable('ketua_tim_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  kegiatanId: uuid('kegiatan_id').notNull().references(() => masterKegiatan.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => authUsers.id),
}, (table) => [
  // Unique constraint: 1 kegiatan = 1 chairman
  {
    name: 'ketua_tim_kegiatan_unique',
    fields: [table.kegiatanId],
  },
])

// Relations
export const ketuaTimAssignmentsRelations = relations(ketuaTimAssignments, ({ one }) => ({
  user: one(authUsers, {
    fields: [ketuaTimAssignments.userId],
    references: [authUsers.id],
    relationName: 'ketuaTimAssignmentsUser',
  }),
  kegiatan: one(masterKegiatan, {
    fields: [ketuaTimAssignments.kegiatanId],
    references: [masterKegiatan.id],
    relationName: 'ketuaTimAssignmentsKegiatan',
  }),
  createdByUser: one(authUsers, {
    fields: [ketuaTimAssignments.createdBy],
    references: [authUsers.id],
    relationName: 'ketuaTimAssignmentsCreatedBy',
  }),
}))

// Type exports
export type KetuaTimAssignment = typeof ketuaTimAssignments.$inferSelect
export type NewKetuaTimAssignment = typeof ketuaTimAssignments.$inferInsert
```

### 10.3 Update Exports

```typescript
// Export new table and types
export { ketuaTimAssignments, ketuaTimAssignmentsRelations }
export type { KetuaTimAssignment, NewKetuaTimAssignment }
```

## Files to Modify

- `src/lib/db/schema.ts` — Add table definition and relations

## Test Stubs

### Happy Path
- [ ] Schema include `ketua_tim_assignments` table definition
- [ ] Types generated correctly
- [ ] Relations defined properly

### Error Cases
- [ ] Schema out of sync with database → drizzle-kit push warning

## Definition of Done

- [ ] Table definition added to schema
- [ ] Relations defined
- [ ] Types exportable
- [ ] Migrations sync with database

## Notes

- This section is optional — if project doesn't use Drizzle or doesn't need type-safe queries for this table, skip
- The API layer uses Supabase client directly, not Drizzle, so this is only needed if you want type-safe access in other parts of the app