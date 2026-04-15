# Section 05: API — Master Kelengkapan CRUD

## Context

Kelengkapan adalah checklist dokumen wajib per kegiatan × role (Ketua Tim vs Anggota). CRUD pattern sama, tapi ada tambahan validasi kegiatan_id.

## Objective

Empat endpoint CRUD untuk `master_kelengkapan_dokumen`: GET (filterable by kegiatan_id), POST create, PATCH update, DELETE.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 01**
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (with masterKelengkapanDokumen table)
  - `src/lib/schemas/master-data.ts` (from Section 03)

## Implementation Steps

### 5a. GET /api/master-kelengkapan

`src/routes/api/master-kelengkapan.ts` — GET handler:

1. Parse query: `kegiatan_id` (optional), `is_ketua_tim` (optional)
2. Query: SELECT mkd.*, mkg.nama as kegiatan_nama, mf.nama as fungsi_nama FROM master_kelengkapan_dokumen mkd JOIN master_kegiatan mkg ON mkd.kegiatan_id = mkg.id JOIN master_fungsi mf ON mkg.fungsi_id = mf.id WHERE mkg.is_active = true
3. Apply filters if present
4. Return 200

### 5b. POST /api/master-kelengkapan

POST handler:

1. Parse body: `{ kegiatan_id, is_ketua_tim, nama_dokumen, required? }`
2. Validasi: kegiatan_id UUID valid, is_ketua_tim boolean, nama_dokumen required
3. Cek kegiatan_id exists dan aktif → 400
4. Cek ADMIN role
5. INSERT
6. Return 201

### 5c. PATCH & DELETE /api/master-kelengkapan/[id]

`src/routes/api/master-kelengkapan.$id.ts`:

PATCH: update is_ketua_tim, nama_dokumen, required. ADMIN only.

DELETE: **hard delete** (karena kelengkapan tidak perlu soft delete — jika kegiatan di-soft delete, kelengkapannya tidak akan queryable). ADMIN only.

### Zod Schema

```typescript
export const createKelengkapanSchema = z.object({
  kegiatan_id: z.string().uuid('ID kegiatan tidak valid'),
  is_ketua_tim: z.boolean(),
  nama_dokumen: z.string().min(1, 'Nama dokumen tidak boleh kosong').max(255),
  required: z.boolean().default(true),
})

export const updateKelengkapanSchema = z.object({
  is_ketua_tim: z.boolean().optional(),
  nama_dokumen: z.string().min(1).max(255).optional(),
  required: z.boolean().optional(),
})
```

## Files to Create/Modify

- `src/lib/schemas/master-data.ts` — **MODIFY**: add kelengkapan schemas
- `src/routes/api/master-kelengkapan.ts` — **CREATE**: GET + POST
- `src/routes/api/master-kelengkapan.$id.ts` — **CREATE**: PATCH + DELETE

## Test Stubs

- GET → 200 array with kegiatan + fungsi info
- GET with kegiatan_id → 200 filtered
- GET with is_ketua_tim → 200 filtered
- POST → 201
- DELETE → 200 (hard delete)

## Definition of Done

- [ ] GET returns kelengkapan with kegiatan + fungsi info
- [ ] GET accepts kegiatan_id and is_ketua_tim filters
- [ ] POST creates kelengkapan (ADMIN only)
- [ ] Hard delete works
- [ ] Build succeeds
