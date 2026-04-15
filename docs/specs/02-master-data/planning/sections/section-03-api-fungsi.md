# Section 03: API — Master Fungsi CRUD

## Context

Admin butuh REST API untuk manage fungsi. Semua endpoint mengikuti pattern API yang sudah ada di codebase (`src/routes/api/auth/*.ts`).

## Objective

Empat endpoint CRUD untuk `master_fungsi`: GET list, POST create, PATCH update, DELETE soft-delete.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 01** (schema harus ada di Supabase)
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (with masterFungsi table)
  - Pattern dari `src/routes/api/auth/role-switch.ts`

## Implementation Steps

### 3a. GET /api/master-fungsi

`src/routes/api/master-fungsi.ts` — GET handler:

1. Create Supabase client dari request cookie (pattern yang sama dengan session endpoint)
2. Query `master_fungsi` WHERE `is_active = true` ORDER BY `nama` ASC
3. Return 200 dengan JSON array

### 3b. POST /api/master-fungsi

Tambahkan POST handler di file yang sama:

1. Parse JSON body: `{ nama, deskripsi? }`
2. Validasi: nama required dan tidak kosong → 400
3. Cek session + role ADMIN → 401/403 jika tidak authorized
4. Cek nama duplikat (SELECT WHERE nama = X AND is_active = true) → 409
5. INSERT ke master_fungsi
6. Return 201 dengan data yang baru dibuat

### 3c. PATCH & DELETE /api/master-fungsi/[id]

`src/routes/api/master-fungsi.$id.ts`:

PATCH:
1. Parse body: `{ nama?, deskripsi? }`
2. Auth: session + ADMIN role
3. Cek record exists → 404
4. Validasi nama duplikat jika nama diupdate → 409
5. UPDATE
6. Return 200

DELETE (soft delete):
1. Auth: session + ADMIN role
2. Cek exists → 404
3. UPDATE `is_active = false`
4. Return 200

### Zod Schema

Tambahkan di `src/lib/schemas/master-data.ts`:

```typescript
import { z } from 'zod'

export const createFungsiSchema = z.object({
  nama: z.string().min(1, 'Nama tidak boleh kosong').max(255),
  deskripsi: z.string().max(500).optional(),
})

export const updateFungsiSchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  deskripsi: z.string().max(500).optional(),
})
```

## Files to Create/Modify

- `src/lib/schemas/master-data.ts` — **CREATE**: Zod schemas
- `src/routes/api/master-fungsi.ts` — **CREATE**: GET + POST
- `src/routes/api/master-fungsi.$id.ts` — **CREATE**: PATCH + DELETE

## Test Stubs

- GET → 200 array
- POST valid → 201
- POST without session → 401
- POST non-ADMIN → 403
- POST duplicate nama → 409
- PATCH → 200
- PATCH not found → 404
- DELETE → 200 (is_active = false)

## Definition of Done

- [ ] GET /api/master-fungsi returns aktif fungsi
- [ ] POST creates fungsi (ADMIN only)
- [ ] PATCH updates fungsi (ADMIN only)
- [ ] DELETE soft-deletes fungsi (ADMIN only)
- [ ] All validation works (empty nama, duplicate, auth)
- [ ] Build succeeds
