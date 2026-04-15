# Section 04: API — Master Kegiatan CRUD

## Context

Sama persis pattern-nya dengan Section 03, tapi untuk `master_kegiatan`. Kegiatan terikat pada fungsi, jadi perlu validasi fungsi_id.

## Objective

Empat endpoint CRUD untuk `master_kegiatan`: GET list (with optional fungsi_id filter), POST create, PATCH update, DELETE soft-delete.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 01**
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (with masterKegiatan table)
  - `src/lib/schemas/master-data.ts` (from Section 03)

## Implementation Steps

### 4a. GET /api/master-kegiatan

`src/routes/api/master-kegiatan.ts` — GET handler:

1. Create Supabase client
2. Parse query param: `fungsi_id` (optional)
3. Build query: SELECT mk.*, mf.nama as fungsi_nama FROM master_kegiatan mk LEFT JOIN master_fungsi mf ON mk.fungsi_id = mf.id WHERE mk.is_active = true
4. Jika `fungsi_id` ada: tambahkan filter `AND mk.fungsi_id = fungsi_id`
5. ORDER BY mk.nama ASC
6. Return 200 dengan JSON array

### 4b. POST /api/master-kegiatan

POST handler:

1. Parse body: `{ fungsi_id, nama, deskripsi? }`
2. Validasi: fungsi_id required (UUID valid), nama required tidak kosong
3. Cek fungsi_id exists dan aktif → 400 jika tidak ada
4. Cek session + ADMIN role → 401/403
5. INSERT
6. Return 201

### 4c. PATCH & DELETE /api/master-kegiatan/[id]

`src/routes/api/master-kegiatan.$id.ts`:

PATCH: validate exists, validate fungsi_id jika diupdate, check nama duplikat dalam fungsi yang sama, UPDATE.

DELETE: soft delete (is_active = false). ADMIN only.

### Zod Schema

Tambahkan di `src/lib/schemas/master-data.ts`:

```typescript
export const createKegiatanSchema = z.object({
  fungsi_id: z.string().uuid('ID fungsi tidak valid'),
  nama: z.string().min(1, 'Nama tidak boleh kosong').max(255),
  deskripsi: z.string().max(500).optional(),
})

export const updateKegiatanSchema = z.object({
  fungsi_id: z.string().uuid().optional(),
  nama: z.string().min(1).max(255).optional(),
  deskripsi: z.string().max(500).optional(),
})
```

## Files to Create/Modify

- `src/lib/schemas/master-data.ts` — **MODIFY**: add kegiatan schemas
- `src/routes/api/master-kegiatan.ts` — **CREATE**: GET + POST
- `src/routes/api/master-kegiatan.$id.ts` — **CREATE**: PATCH + DELETE

## Test Stubs

- GET → 200 array with fungsi info
- GET with fungsi_id filter → 200 filtered
- POST → 201
- POST invalid fungsi_id → 400
- DELETE → 200 (soft delete)

## Definition of Done

- [ ] GET returns kegiatan with fungsi info
- [ ] GET accepts fungsi_id filter
- [ ] POST creates kegiatan (ADMIN only)
- [ ] Soft delete works
- [ ] Build succeeds
