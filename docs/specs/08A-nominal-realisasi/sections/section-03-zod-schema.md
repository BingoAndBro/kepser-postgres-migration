# Section 03: Zod Validation Schema

## Context

Zod schema digunakan untuk memvalidasi input dari client sebelum diproses oleh business logic. Section ini tidak bergantung pada Drizzle schema, sehingga bisa dikerjakan paralelo dengan Section 02.

## Objective

Buat/update Zod schema untuk memvalidasi input `nominal_realisasi` dan `is_non_material`.

## Prerequisites

- None (bisa parallel dengan Section 02)

## Implementation Steps

### 3.1 Identifikasi Schema Existing

Buka `src/lib/schemas/dokumen.ts` dan lihat pattern yang sudah ada untuk validation schemas.

### 3.2 Buat atau Update Schema

Tambahkan schema baru atau extend existing schema:

```typescript
// Schema untuk update nominal_realisasi
export const updateNominalSchema = z.object({
  nominal_realisasi: z.number()
    .min(0, 'Nominal tidak boleh negatif')
    .max(999999999999, 'Nominal terlalu besar')
    .nullable()
    .optional(),
  is_non_material: z.boolean()
    .optional(),
})

// Schema untuk submit dokumen (extend jika sudah ada)
export const submitDokumenSchema = z.object({
  // ... existing fields
  nominal_realisasi: z.number()
    .min(0, 'Nominal tidak boleh negatif')
    .max(999999999999, 'Nominal terlalu besar')
    .nullable()
    .optional(),
  is_non_material: z.boolean()
    .default(false),
})
```

### 3.3 Export Schema

Pastikan schema di-export sehingga bisa digunakan di handler.

### 3.4 Tambah Validation Helper

Opsional: buat helper function untuk validasi Material requirement:

```typescript
export function validateNominalForMaterial(
  isNonMaterial: boolean | undefined,
  nominalRealisasi: number | null | undefined
): { valid: boolean; error?: string } {
  if (isNonMaterial) {
    return { valid: true }
  }
  
  if (nominalRealisasi === null || nominalRealisasi === undefined || nominalRealisasi <= 0) {
    return { 
      valid: false, 
      error: 'Nominal_realisasi wajib untuk dokumen Material' 
    }
  }
  
  return { valid: true }
}
```

## Files to Create/Modify

- `src/lib/schemas/dokumen.ts` — Modify (tambah/update schema)

## Test Stubs

- [ ] `updateNominalSchema.parse({ nominal_realisasi: 100000 })` passes
- [ ] `updateNominalSchema.parse({ nominal_realisasi: 0 })` passes
- [ ] `updateNominalSchema.parse({ nominal_realisasi: null })` passes
- [ ] `updateNominalSchema.parse({ is_non_material: true })` passes
- [ ] `nominal_realisasi: -100` returns error "Nominal tidak boleh negatif"
- [ ] `nominal_realisasi: 999999999999999` returns error "Nominal terlalu besar"
- [ ] `is_non_material: "yes"` returns type error

## Definition of Done

- [ ] Schema `updateNominalSchema` ada dan bisa digunakan
- [ ] Schema `submitDokumenSchema` (jika di-extend) bisa validasi field baru
- [ ] Helper `validateNominalForMaterial` ada dan berfungsi
- [ ] Schema bisa di-compile tanpa error