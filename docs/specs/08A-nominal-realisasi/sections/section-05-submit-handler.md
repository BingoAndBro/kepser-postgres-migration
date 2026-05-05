# Section 05: Submit Handler Update

## Context

Endpoint submit adalah entry point utama untuk membuat dokumen. Validasi nominal harus terjadi di sini agar tidak ada dokumen Material tanpa nominal. Bergantung pada Section 01, 02, dan 03.

## Objective

Update handler submit dokumen untuk menerima dan memvalidasi field baru (`is_non_material` dan `nominal_realisasi`).

## Prerequisites

- Section 01 (SQL Migration) harus selesai
- Section 02 (Drizzle Schema) harus selesai
- Section 03 (Zod Schema) harus selesai

## Implementation Steps

### 5.1 Identifikasi Handler Submit

Buka `src/routes/api/dokumen/submit.ts` atau cari file yang menangani submit dokumen.

### 5.2 Parse Request Body

Tambahkan parsing untuk field baru:

```typescript
const body = await request.json()
const { 
  // ... existing fields
  nominal_realisasi,
  is_non_material,
} = body
```

### 5.3 Tambah Validation Logic

Gunakan helper dari Section 03 atau inline validation:

```typescript
// Validation: Material = wajib nominal
if (!is_non_material) {
  if (nominal_realisasi === null || nominal_realisasi === undefined || nominal_realisasi <= 0) {
    return Response.json(
      { error: 'Nominal_realisasi wajib untuk dokumen Material' },
      { status: 400 }
    )
  }
}
```

### 5.4 Update Insert Payload

Pastikan field baru di-include saat insert ke database:

```typescript
const insertPayload = {
  // ... existing fields
  nominal_realisasi: is_non_material ? null : nominal_realisasi,
  is_non_material: is_non_material ?? false,
}
```

### 5.5 Handle Backward Compatibility

Jika request tidak mengirim field baru, gunakan default:
- `is_non_material`: false
- `nominal_realisasi`: 0

Ini memastikan existing form (tanpa field baru) tetap bisa submit.

## Files to Create/Modify

- `src/routes/api/dokumen/submit.ts` — Modify

## Test Stubs

- [ ] Submit dengan `is_non_material: true, nominal_realisasi: null` berhasil
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: 100000` berhasil
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: null` return 400
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: 0` return 400
- [ ] Submit tanpa field baru tetap bisa create dokumen (backward compat)
- [ ] Dokumen tersimpan dengan nominal_realisasi yang dikirim

## Definition of Done

- [ ] Handler menerima dan memproses `nominal_realisasi`
- [ ] Handler menerima dan memproses `is_non_material`
- [ ] Validasi: dokumen Material wajib nominal (> 0)
- [ ] Dokumen Non-Material boleh null nominal
- [ ] Backward compatibility dengan existing form
- [ ] Test stubs untuk happy path dan error cases