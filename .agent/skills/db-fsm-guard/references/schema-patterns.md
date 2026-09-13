# DMS Schema Patterns — Complete Table Reference

> Source of truth: `AGENTS.md` → Data Schema section.
> This file is a reference for the `db-fsm-guard` skill.

---

## Enum Types (TypeScript Constants)

```typescript
// src/lib/types/dokumen.ts

// Document status — FSM states
export const STATUS_DOKUMEN = [
  'DRAFT',
  'IN_PPK_VALIDATION',
  'IN_PPSPM_APPROVAL',
  'NEED_REVISION',
  'COMPLETED',
  'ARCHIVED',
] as const
export type StatusDokumen = typeof STATUS_DOKUMEN[number]

// Revision target — who needs to fix it
export const REVISION_TARGET = ['USER', 'PPK'] as const
export type RevisionTarget = typeof REVISION_TARGET[number]

// Current approval step
export const CURRENT_STEP = ['PPK', 'PPSPM'] as const
export type CurrentStep = typeof CURRENT_STEP[number]
```

---

## Table 1: `roles`

```typescript
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull().unique(),
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** ADMIN full access. Authenticated users can SELECT.

---

## Table 2: `user_roles`

```typescript
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),  // NO FK to auth.users — Supabase manages this
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdRoleIdUnique: unique().on(table.userId, table.roleId),
}))
```

**RLS:** Users can SELECT own roles. ADMIN can INSERT/DELETE.

---

## Table 3: `master_fungsi`

```typescript
export const masterFungsi = pgTable('master_fungsi', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull().unique(),
  deskripsi: text('deskripsi'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** Authenticated can SELECT active fungsi. ADMIN can INSERT/UPDATE.

---

## Table 4: `master_kegiatan`

```typescript
export const masterKegiatan = pgTable('master_kegiatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  fungsiId: uuid('fungsi_id').notNull().references(() => masterFungsi.id, { onDelete: 'restrict' }),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** Authenticated can SELECT. ADMIN can INSERT/UPDATE.
**onDelete:** `restrict` — cannot delete fungsi that has kegiatan.

---

## Table 5: `master_kelengkapan_dokumen`

```typescript
export const masterKelengkapanDokumen = pgTable('master_kelengkapan_dokumen', {
  id: uuid('id').primaryKey().defaultRandom(),
  kegiatanId: uuid('kegiatan_id').notNull().references(() => masterKegiatan.id, { onDelete: 'cascade' }),
  isKetuaTim: boolean('is_ketua_tim').notNull(),
  namaDokumen: text('nama_dokumen').notNull(),
  required: boolean('required').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** Authenticated can SELECT. ADMIN can INSERT/UPDATE/DELETE.
**onDelete:** `cascade` — deleting kegiatan removes its kelengkapan.

---

## Table 6: `kegiatan` (Project Container)

```typescript
export const kegiatan = pgTable('kegiatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi'),
  createdBy: uuid('created_by').notNull(),  // NO FK to auth.users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** Creator can SELECT/UPDATE own. PPK/PPSPM can SELECT all.

---

## Table 7: `dokumen_transaksi` ⚠️ FSM-PROTECTED

```typescript
export const dokumenTransaksi = pgTable('dokumen_transaksi', {
  id: uuid('id').primaryKey().defaultRandom(),
  kegiatanId: uuid('kegiatan_id').references(() => kegiatan.id),
  kelengkapanId: uuid('kelengkapan_id').references(() => masterKelengkapanDokumen.id),
  judul: text('judul').notNull(),
  fungsiId: uuid('fungsi_id').references(() => masterFungsi.id),
  kegiatanJenisId: uuid('kegiatan_jenis_id').references(() => masterKegiatan.id),
  isKetuaTim: boolean('is_ketua_tim').notNull().default(false),
  status: text('status').$type<StatusDokumen>().notNull().default('DRAFT'),
  currentStep: text('current_step').$type<CurrentStep>(),
  revisionTarget: text('revision_target').$type<RevisionTarget>(),
  lampiranUrls: jsonb('lampiran_urls').default([]),
  createdBy: uuid('created_by').notNull(),  // NO FK to auth.users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

⚠️ **WARNING:** The `status`, `currentStep`, and `revisionTarget` columns are FSM-protected.
NEVER update them directly. Always use `src/lib/fsm.ts` → `transition()`.

---

## Table 8: `log_aktivitas` 🔒 APPEND-ONLY

```typescript
export const logAktivitas = pgTable('log_aktivitas', {
  id: uuid('id').primaryKey().defaultRandom(),
  dokumenId: uuid('dokumen_id').notNull().references(() => dokumenTransaksi.id),
  userId: uuid('user_id').notNull(),  // NO FK to auth.users
  aksi: text('aksi').notNull(),  // SUBMIT, APPROVE, REJECT, RESUBMIT, ARCHIVE
  catatan: text('catatan'),      // MANDATORY when aksi === 'REJECT'
  stepUrutan: integer('step_urutan'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
})
```

🔒 **SACRED:** INSERT ONLY. No UPDATE. No DELETE. Ever.
**RLS:** No DELETE policy. Users can SELECT logs for their documents. ADMIN can SELECT all.

---

## Table 9: `arsip`

```typescript
export const arsip = pgTable('arsip', {
  id: uuid('id').primaryKey().defaultRandom(),
  dokumenId: uuid('dokumen_id').notNull().unique().references(() => dokumenTransaksi.id),
  nomorSurat: text('nomor_surat'),
  klasifikasi: text('klasifikasi'),
  retensi: text('retensi'),
  catatanArsiparis: text('catatan_arsiparis'),
  archivedBy: uuid('archived_by'),  // NO FK to auth.users
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**RLS:** ARSIPARIS can INSERT/SELECT. Authenticated users can SELECT their archived docs.

---

## onDelete Strategy Summary

| FK Relationship | Strategy | Reason |
|---|---|---|
| `user_roles.role_id → roles` | `cascade` | Deleting role removes assignments |
| `master_kegiatan.fungsi_id → master_fungsi` | `restrict` | Cannot delete fungsi with kegiatan |
| `master_kelengkapan.kegiatan_id → master_kegiatan` | `cascade` | Kelengkapan belongs to kegiatan |
| `dokumen_transaksi.kegiatan_id → kegiatan` | *(nullable)* | Optional grouping |
| `log_aktivitas.dokumen_id → dokumen_transaksi` | *(no cascade)* | Audit trail is sacred |
| `arsip.dokumen_id → dokumen_transaksi` | *(no cascade)* | Archive must persist |
