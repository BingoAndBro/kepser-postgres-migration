# Research: Implementation Plan Spec 08A (nominal_realisasi)

Tanggal: 2026-05-04
Purpose: Fondasi kode untuk implementasi fitur nominal_realisasi

---

## 1. Schema Drizzle / Struktur Database

### 1.1 Lokasi Schema
- **Drizzle schema**: D:\GitHub\mvp\src\lib\db\schema.ts
- **SQL migrations**: D:\GitHub\mvp\supabase\migrations\

### 1.2 Tabel dokumen_transaksi

Lokasi: supabase/migrations/003_dokumen_transaksi.sql + src/lib/db/schema.ts

**Schema columns**:
- id (uuid, PK)
- judul (text)
- fungsi_id (uuid, FK)
- kegiatan_jenis_id (uuid, FK)
- is_ketua_tim (boolean)
- status (text) - values: DRAFT, IN_PPK_VALIDATION, IN_BENDAHARA_APPROVAL, NEED_REVISION, COMPLETED, ARCHIVED
- current_step (text) - PPK, BENDAHARA, null
- revision_target (text) - USER, PPK, null
- revision_notes (text)
- lampiran_urls (text, JSON array)
- tahun (integer)
- tanggal (text, YYYY-MM-DD)
- created_by (uuid)
- created_at, updated_at (timestamp)

**Chain fields** (via dokumen-helpers.ts):
- jenis_permintaan_id (uuid, nullable)
- kategori_permintaan_id (uuid, nullable)
- detail_permintaan_id (uuid, nullable)

### 1.3 Tabel arsip

Lokasi: supabase/migrations/005_arsip.sql

**Schema columns**:
- id (uuid, PK)
- dokumen_id (uuid, FK to dokumen_transaksi)
- nomor_surat (text)
- klasifikasi (text)
- retensi_aktif, retensi_inaktif (text)
- masa_aktif_berakhir, masa_inaktif_berakhir (date)
- status_arsip (text) - AKTIF, VERIFIKASI_PENYUSUTAN, INAKTIF, USUL_MUSNAH
- is_ditolak (boolean)
- catatan_arsiparis (text)
- archived_by (uuid, FK to auth.users)
- archived_at (timestamp)
- lampiran_snapshot (jsonb) - added in migration 011
- created_at (timestamp)

### 1.4 Tabel log_aktivitas (audit trail)
- id, dokumen_id, user_id, aksi, catatan, step_urutan, timestamp
- Append-only: NO UPDATE/DELETE

---

## 2. API Server Functions

### 2.1 Submit Pattern

**Two-step submission**:
1. POST /api/dokumen/ - Create DRAFT dokumen
2. POST /api/dokumen/\/submit - Submit from DRAFT

**Combined submission**:
- POST /api/dokumen/submit - Create + submit dalam satu call

### 2.2 Struktur Handler

Lokasi: src/routes/api/

Pattern template:
`	ypescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { createAdminClient } from '#/lib/supabase-admin'
import { getServerSession } from '#/lib/auth'

function createClient(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const mockEvent = { request, cookie: { get: () => undefined, set: () => {}, delete: () => {} } } as any
  return createServerSupabaseClient(mockEvent, cookieHeader)
}

export const Route = createFileRoute('/api/...')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        // validation logic
      }
    }
  }
})
`

### 2.3 Validation Pattern

Gunakan Zod schemas dari src/lib/schemas/dokumen.ts:

`	ypescript
const parsed = createDokumenSchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 })
}
`

### 2.4 Kelengkapan Validation Pattern

`	ypescript
const requiredItems = await getKelengkapanRequired(supabase, kegiatanId, isKetuaTim, options)
const uploadedIds = lampiranUrls.map(l => l.kelengkapan_id)
const missing = requiredItems.filter(r => r.required && !uploadedIds.includes(r.id))

if (missing.length > 0) {
  return Response.json({ error: 'Lampiran wajib belum lengkap: ...' }, { status: 400 })
}
`

### 2.5 FSM Transition Pattern

`	ypescript
import { transition } from '#/lib/fsm'
import { updateDokumenStatus, insertLog } from '#/lib/dokumen-helpers'

const fsResult = transition(dok.status, 'SUBMIT', 'PEGAWAI')
if (!fsResult.success) {
  return Response.json({ error: fsResult.error || 'Transisi gagal' }, { status: 400 })
}

const admin = createAdminClient()
await updateDokumenStatus(admin, dok.id, {
  status: fsResult.newStatus,
  currentStep: fsResult.newCurrentStep,
  revisionTarget: fsResult.newRevisionTarget,
})

await insertLog(admin, {
  dokumenId: dok.id,
  userId: session.user.id,
  aksi: 'SUBMIT',
  stepUrutan: fsResult.stepUrutan,
})
`

### 2.6 Role Check Pattern

`	ypescript
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('role:roles(nama)')
  .eq('user_id', session.user.id)
const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
if (!roleNames.includes('BENDAHARA')) return Response.json({ error: 'Akses ditolak' }, { status: 403 })
`

### 2.7 Archive Handler Reference

src/routes/api/arsiparis/dokumen.\.archive.ts - contoh complete pattern dengan:
- Inline Zod schema validation
- Check existing arsip
- Snapshot lampiran_urls (JSON parse/stringify)
- FSM transition
- Insert arsip + update status + insert log

---

## 3. Migration Pattern

### 3.1 Lokasi
D:\GitHub\mvp\supabase\migrations\

### 3.2 Naming Convention
Format: NNN_nama_descriptive.sql
Contoh: 001_auth_rbac.sql, 003_dokumen_transaksi.sql, 015_add_fk_constraints.sql

### 3.3 Header Pattern
`sql
-- ============================================================
-- Migration: 015_add_fk_constraints.sql
-- Deskripsi: Add explicit FK constraint
-- Dibuat: 2026-05-01
-- ============================================================
`

### 3.4 Idempotent Pattern
- CREATE TABLE IF NOT EXISTS
- ALTER TABLE ADD COLUMN IF NOT EXISTS
- ON CONFLICT DO NOTHING untuk INSERT

### 3.5 Migration untuk Field Baru
`sql
ALTER TABLE arsip
  ADD COLUMN IF NOT EXISTS nominal_realisasi decimal(15,2);

-- Add check constraint
ALTER TABLE arsip
  ADD CONSTRAINT arsip_nominal_realisasi_positive
  CHECK (nominal_realisasi IS NULL OR nominal_realisasi >= 0);
`

### 3.6 Drizzle Schema Update
Update src/lib/db/schema.ts setelah SQL migration:
`	ypescript
export const arsip = pgTable('arsip', {
  // ... existing fields
  nominalRealisasi: numeric('nominal_realisasi', { precision: 15, scale: 2 }),
}, ...)
`

---

## 4. Validation Pattern

### 4.1 Zod Schemas

Lokasi: src/lib/schemas/

Pattern untuk field baru:
`	ypescript
export const updateNominalRealisasiSchema = z.object({
  nominal_realisasi: z.number()
    .min(0, 'Nominal tidak boleh negatif')
    .max(999999999999999, 'Nominal terlalu besar')
    .nullable()
})
`

### 4.2 Business Logic Validation
- Cek role yang boleh update (Bendahara/ADMIN?)
- Cek status dokumen (COMPLETED before archive?)
- Constraint nominal_realisasi <= nominal_permintaan?

---

## 5. Naming Conventions

### 5.1 Database
- Table name: snake_case (dokumen_transaksi, arsip)
- Column name: snake_case (lampiran_urls, nominal_realisasi)
- FK: <table>_id (dokumen_id, kegiatan_id)
- Index: idx_<table>_<column>

### 5.2 TypeScript
- File: kebab-case (dokumen-helpers.ts)
- Schema/Table: PascalCase (dokumenTransaksi, arsip)
- Column field: camelCase (lampiranUrls, nominalRealisasi)
- Type: PascalCase (DokumenRow, LampiranUrl)
- Function: camelCase (createDokumen, getDokumenById)
- Schema variable: camelCase (createDokumenSchema)

### 5.3 API Routes
Format: src/routes/api/<resource>/<action>.<method>.ts
Contoh:
- src/routes/api/dokumen/submit.ts
- src/routes/api/dokumen.\.submit.ts
- src/routes/api/arsiparis/dokumen.\.archive.ts

### 5.4 Migration Files
Format: NNN_<description>.sql
Padding zeros: 001, 002, ... 015, 016

---

## 6. Dokumen Helpers Reference

Lokasi: src/lib/dokumen-helpers.ts

### 6.1 Key Functions
- getDokumenById(supabase, id) - Get single dokumen with joins
- getDokumenByUser(supabase, userId) - Get user's documents
- createDokumen(supabase, payload) - Create DRAFT dokumen
- updateDokumen(supabase, id, payload) - Update lampiran/metadata
- updateDokumenStatus(supabase, id, payload) - Update status fields
- insertLog(supabase, payload) - Append audit log
- getKelengkapanRequired(supabase, kegiatanId, isKetuaTim, options)

### 6.2 JSON Handling Pattern
`	ypescript
// Parse from DB (string to array)
if (typeof raw.lampiran_urls === 'string') {
  lampiranUrls = JSON.parse(raw.lampiran_urls)
} else {
  lampiranUrls = raw.lampiran_urls
}

// Store to DB (array to string)
lampiran_urls: JSON.stringify(payload.lampiranUrls)
`

---

## 7. FSM Transitions

Lokasi: src/lib/fsm.ts, src/lib/types/fsm.ts

### 7.1 Valid Transitions
`
DRAFT --SUBMIT--> IN_PPK_VALIDATION
IN_PPK_VALIDATION --APPROVE--> IN_BENDAHARA_APPROVAL
IN_PPK_VALIDATION --REJECT--> NEED_REVISION (target: USER)
IN_BENDAHARA_APPROVAL --APPROVE--> COMPLETED
IN_BENDAHARA_APPROVAL --REJECT--> NEED_REVISION (target: PPK)
NEED_REVISION --RESUBMIT--> IN_PPK_VALIDATION
COMPLETED --ARCHIVE--> ARCHIVED
COMPLETED --SKIP--> COMPLETED
`

---

## 8. Supabase Client Patterns

### 8.1 Auth Client
`	ypescript
const supabase = createClient(request)
const session = await getServerSession(supabase)
`

### 8.2 Admin Client (bypass RLS)
`	ypescript
import { createAdminClient } from '#/lib/supabase-admin'
const admin = createAdminClient()
`

---

## 9. Existing Migration Summary

| File | Purpose |
|------|---------|
| 001_auth_rbac.sql | Roles, user_roles, RLS |
| 002_master_data.sql | master_fungsi, master_kegiatan, master_kelengkapan_dokumen |
| 003_dokumen_transaksi.sql | dokumen_transaksi, log_aktivitas |
| 005_arsip.sql | arsip, master_klasifikasi_arsip |
| 011_arsip_snapshot_musnah.sql | Add lampiran_snapshot |
| 012_klasifikasi_hierarchy.sql | Add parent_id, kode |
| 015_add_fk_constraints.sql | FK constraint to auth.users |

---

## 10. Implementation Checklist untuk 08A

1. **SQL Migration** - Tambah column (next: 016_nominal_realisasi.sql)
   - ALTER TABLE ADD COLUMN IF NOT EXISTS
   - Optional: CHECK constraint untuk validasi

2. **Drizzle Schema** - Update src/lib/db/schema.ts
   - Tambah nominalRealisasi ke schema

3. **Zod Schema** - Tambah validation di src/lib/schemas/
   - Pattern: z.number().min(0).nullable()

4. **API Handler** - Tambah endpoint
   - Pattern: src/routes/api/dokumen.\.nominal-realisasi.ts

5. **Validasi Business Logic**
   - Role check (Bendahara/ADMIN?)
   - Status check (dokumen valid untuk update?)
   - Constraint: nominal_realisasi <= nominal_permintaan?

6. **Snapshot Consideration**
   - Apakah perlu snapshot saat archive? (referensi lampiran_snapshot)

---

Generated by Claude Code - Research Agent
Date: 2026-05-04