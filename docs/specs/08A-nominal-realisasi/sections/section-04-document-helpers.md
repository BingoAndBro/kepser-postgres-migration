# Section 04: Document Helpers Update

## Context

Helper functions di `src/lib/dokumen-helpers.ts` adalah abstraction layer untuk operasi database. Update ini memastikan komponen lain bisa menggunakan field baru melalui helper.

## Objective

Update helper functions untuk menerima dan memproses `nominalRealisasi` dan `isNonMaterial`.

## Prerequisites

- Section 02 (Drizzle Schema) harus selesai

## Implementation Steps

### 4.1 Baca Helper Existing

Buka `src/lib/dokumen-helpers.ts` dan identifikasi:
- Function `createDokumen` — bagaimana dokumen baru dibuat
- Function `updateDokumen` — bagaimana dokumen diupdate
- Function `getDokumenById` — apa yang dikembalikan

### 4.2 Update createDokumen

Tambahkan parameter baru dan pastikan di-include di insert:

```typescript
interface CreateDokumenPayload {
  // ... existing fields
  nominalRealisasi?: number | null
  isNonMaterial?: boolean
}

async function createDokumen(
  supabase: SupabaseClient,
  payload: CreateDokumenPayload
) {
  // ... existing logic
  
  const insertPayload = {
    // ... existing fields
    nominal_realisasi: payload.nominalRealisasi ?? 0,
    is_non_material: payload.isNonMaterial ?? false,
  }
  
  const { data, error } = await supabase
    .from('dokumen_transaksi')
    .insert(insertPayload)
    .select()
    .single()
  
  // ...
}
```

### 4.3 Update updateDokumen

Tambahkan parameter baru untuk update:

```typescript
interface UpdateDokumenPayload {
  // ... existing fields
  nominalRealisasi?: number | null
  isNonMaterial?: boolean
}

async function updateDokumen(
  supabase: SupabaseClient,
  id: string,
  payload: UpdateDokumenPayload
) {
  // ... existing logic
  
  const updatePayload: Record<string, any> = {
    // ... existing fields
  }
  
  if (payload.nominalRealisasi !== undefined) {
    updatePayload.nominal_realisasi = payload.nominalRealisasi
  }
  
  if (payload.isNonMaterial !== undefined) {
    updatePayload.is_non_material = payload.isNonMaterial
  }
  
  const { data, error } = await supabase
    .from('dokumen_transaksi')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()
  
  // ...
}
```

### 4.4 Update getDokumenById (jika perlu)

Pastikan return type/include field baru di response. Biasanya sudah otomatis karena Drizzle/Supabase type inference.

## Files to Create/Modify

- `src/lib/dokumen-helpers.ts` — Modify

## Test Stubs

- [ ] `createDokumen` accept dan store nominalRealisasi
- [ ] `createDokumen` accept dan store isNonMaterial
- [ ] `updateDokumen` accept dan update nominalRealisasi
- [ ] `getDokumenById` return object dengan nominalRealisasi
- [ ] Helper functions handle undefined/null gracefully

## Definition of Done

- [ ] `createDokumen` bisa menerima dan menyimpan nominalRealisasi
- [ ] `createDokumen` bisa menerima dan menyimpan isNonMaterial
- [ ] `updateDokumen` bisa menerima dan update nominalRealisasi
- [ ] Type definitions sesuai dengan implementation
- [ ] Tidak ada breaking change pada existing code