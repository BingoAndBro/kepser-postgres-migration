# Section 02: API Core — Schemas, Helpers & Dokumen CRUD

## Context

Section 01 (DB Schema) sudah selesai. Tabel `dokumen_transaksi` dan `log_aktivitas` sudah ada di database. Sekarang butuh Zod schemas, Drizzle query helpers, dan API server functions untuk operasi CRUD + submit/resubmit.

## Objective

API endpoints untuk list, create, read, update dokumen + submit/resubmit action. Semua input divalidasi Zod, semua query pakai Drizzle ORM, semua akses dilindungi auth guards.

## Prerequisites

- Section 01 selesai (tabel + RLS)
- `src/lib/db/schema.ts` punya `dokumenTransaksi` + `logAktivitas`
- `src/lib/db/index.ts` (Drizzle client) ada
- `src/lib/auth.ts` punya `requireAuth()`, `guardRole()`
- `src/lib/fsm.ts` punya `transition()` function

## Implementation Steps

### 2a. Zod Schemas (`src/lib/schemas/dokumen.ts`)

Buat file baru dengan schema untuk dokumen:

```typescript
// lampiranUrlSchema — single lampiran entry
export const lampiranUrlSchema = z.object({
  kelengkapan_id: z.string().uuid(),
  nama: z.string().min(1),
  url: z.string(), // storage path
  uploaded_at: z.string(), // ISO timestamp
})

// createDokumenSchema — body untuk POST /api/dokumen
export const createDokumenSchema = z.object({
  fungsiId: z.string().uuid('ID fungsi tidak valid'),
  kegiatanJenisId: z.string().uuid('ID kegiatan tidak valid'),
  isKetuaTim: z.boolean(),
  tahun: z.number().int().min(2000).max(2100),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  lampiranUrls: z.array(lampiranUrlSchema).default([]),
})

// updateDokumenSchema — body untuk PATCH /api/dokumen/[id]
export const updateDokumenSchema = z.object({
  lampiranUrls: z.array(lampiranUrlSchema),
})

// submitDokumenSchema — body untuk POST /api/dokumen/[id]/submit
// Empty body — tidak ada data baru, hanya trigger state transition
export const submitDokumenSchema = z.object({}).strict()
```

### 2b. DB Helpers (`src/lib/db/helpers/dokumen.ts`)

Buat file helper dengan Drizzle queries:

```typescript
import { eq, desc } from 'drizzle-orm'
import { dokumenTransaksi, logAktivitas } from '../schema'

// getDokumenById — with relations (fungsi, kegiatan)
export async function getDokumenById(db: Database, id: string) { ... }

// getDokumenByUser — list user's own documents
export async function getDokumenByUser(db: Database, userId: string) { ... }

// createDokumen — insert new dokumen
export async function createDokumen(db: Database, data: InsertDokumen) { ... }

// updateDokumen — update lampiran_urls
export async function updateDokumen(db: Database, id: string, data: UpdateData) { ... }

// insertLog — append only
export async function insertLog(db: Database, data: InsertLog) { ... }
```

### 2c. GET /api/dokumen — List Dokumen Saya

Route: `src/routes/api/dokumen/index.ts`

```typescript
// GET handler
const getDokumenList = createServerFn({ method: 'GET' })
  .validator(/* no body */)
  .handler(async () => {
    const user = await requireAuth()
    const list = await getDokumenByUser(db, user.id)
    return { dokumen: list }
  })

// POST handler — Create DRAFT dokumen
const createDokumenHandler = createServerFn({ method: 'POST' })
  .validator(zodValidator(createDokumenSchema))
  .handler(async ({ data }) => {
    const user = await requireAuth()

    // Fetch kegiatan name for judul
    const kegiatan = await db.query.masterKegiatan.findFirst({...})
    const userName = user.user_metadata?.nama_lengkap || user.email

    // Judul: [Kegiatan] [Tahun] [Nama Pegawai]
    const judul = `${kegiatan.nama} ${data.tahun} ${userName}`

    const newDok = await createDokumen(db, {
      judul,
      fungsiId: data.fungsiId,
      kegiatanJenisId: data.kegiatanJenisId,
      isKetuaTim: data.isKetuaTim,
      tahun: data.tahun,
      tanggal: data.tanggal,
      lampiranUrls: data.lampiranUrls,
      createdBy: user.id,
      status: 'DRAFT',
    })

    return { dokumen: newDok }
  })
```

### 2d. GET/PATCH /api/dokumen/[id]

Route: `src/routes/api/dokumen/[id].ts`

```typescript
// GET — Detail dokumen (ownership check)
const getDokumenDetail = createServerFn({ method: 'GET' })
  .handler(async ({ params }) => {
    const user = await requireAuth()
    const dok = await getDokumenById(db, params.id)

    if (!dok) throw new Error('Dokumen tidak ditemukan')

    // Ownership check: own dokumen, atau approver role
    const isOwner = dok.createdBy === user.id
    const isApprover = await userHasApproverRole(user.id)

    if (!isOwner && !isApprover) {
      throw new Error('Anda tidak memiliki akses ke dokumen ini')
    }

    return { dokumen: dok }
  })

// PATCH — Update lampiran (NEED_REVISION target USER only)
const updateDokumenHandler = createServerFn({ method: 'PATCH' })
  .validator(zodValidator(updateDokumenSchema))
  .handler(async ({ data, params }) => {
    const user = await requireAuth()
    const dok = await getDokumenById(db, params.id)

    if (!dok) throw new Error('Dokumen tidak ditemukan')
    if (dok.createdBy !== user.id) throw new Error('Anda tidak memiliki akses')
    if (dok.status !== 'NEED_REVISION') throw new Error('Dokumen tidak bisa diedit')
    if (dok.revisionTarget !== 'USER') throw new Error('Dokumen ini perlu direvisi oleh PPK')

    const updated = await updateDokumen(db, params.id, {
      lampiranUrls: data.lampiranUrls,
      updatedAt: new Date(),
    })

    return { dokumen: updated }
  })
```

### 2e. POST /api/dokumen/[id]/submit — Submit & Resubmit

Route: `src/routes/api/dokumen/[id]/submit.ts`

```typescript
const submitDokumenHandler = createServerFn({ method: 'POST' })
  .handler(async ({ params }) => {
    const user = await requireAuth()
    const dok = await getDokumenById(db, params.id)

    if (!dok) throw new Error('Dokumen tidak ditemukan')
    if (dok.createdBy !== user.id) throw new Error('Anda tidak memiliki akses')

    let transitionResult: TransitionResult

    if (dok.status === 'DRAFT') {
      // Validasi: semua lampiran required harus terisi
      const requiredItems = await getKelengkapanRequired(dok.kegiatanJenisId, dok.isKetuaTim)
      const uploadedIds = dok.lampiranUrls.map(l => l.kelengkapan_id)
      const missing = requiredItems.filter(r => !uploadedIds.includes(r.id))
      if (missing.length > 0) {
        throw new Error(`Lampiran wajib belum lengkap: ${missing.map(m => m.namaDokumen).join(', ')}`)
      }

      transitionResult = transition(dok.status, 'SUBMIT', 'PEGAWAI')
    } else if (dok.status === 'NEED_REVISION' && dok.revisionTarget === 'USER') {
      transitionResult = transition(dok.status, 'RESUBMIT', 'PEGAWAI')
    } else {
      throw new Error('Dokumen tidak bisa disubmit dalam status ini')
    }

    if (!transitionResult.success) {
      throw new Error(transitionResult.error || 'Transisi status gagal')
    }

    // Update status
    await updateDokumen(db, params.id, {
      status: transitionResult.newStatus,
      currentStep: transitionResult.newCurrentStep,
      revisionTarget: transitionResult.newRevisionTarget,
      updatedAt: new Date(),
    })

    // Insert log
    await insertLog(db, {
      dokumenId: params.id,
      userId: user.id,
      aksi: dok.status === 'DRAFT' ? 'SUBMIT' : 'RESUBMIT',
      catatan: null,
      stepUrutan: 1,
    })

    return { success: true }
  })
```

## Files to Create/Modify

- `src/lib/schemas/dokumen.ts` — baru
- `src/lib/db/helpers/dokumen.ts` — baru
- `src/routes/api/dokumen/index.ts` — GET list + POST create
- `src/routes/api/dokumen/[id].ts` — GET + PATCH
- `src/routes/api/dokumen/[id]/submit.ts` — POST submit/resubmit

## Test Stubs (from TDD Plan)

- [ ] GET /api/dokumen returns list of user's own documents
- [ ] GET /api/dokumen returns empty array if no documents
- [ ] POST /api/dokumen creates DRAFT dokumen with correct judul
- [ ] POST /api/dokumen generates judul: "[Kegiatan] [Tahun] [Nama Pegawai]"
- [ ] GET /api/dokumen/[id] returns full document with relations
- [ ] PATCH /api/dokumen/[id] updates lampiran_urls
- [ ] POST /api/dokumen/[id]/submit transitions DRAFT → IN_PPK_VALIDATION
- [ ] POST /api/dokumen/[id]/submit inserts log_aktivitas entry
- [ ] Submit without required lampiran returns 400
- [ ] Non-owner accessing document returns 403

## Definition of Done

- [ ] All Zod schemas exported and used in server functions
- [ ] GET /api/dokumen returns typed list
- [ ] POST /api/dokumen creates dokumen with auto-generated judul
- [ ] GET /api/dokumen/[id] returns detail with ownership check
- [ ] PATCH /api/dokumen/[id] restricted to NEED_REVISION target USER
- [ ] POST /api/dokumen/[id]/submit handles both SUBMIT and RESUBMIT
- [ ] FSM transition called for all status changes
- [ ] log_aktivitas inserted on every submit/resubmit
- [ ] All error cases return appropriate HTTP status codes
- [ ] `pnpm build` succeeds
