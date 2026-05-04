# Section 08: Ajukan Dokumen - Form Submission

## Context

Setelah Section 07 (badge) selesai, kita perlu update form submission untuk memastikan dokumen submitted dengan `is_ketua_tim` yang sudah auto-set oleh sistem.

## Objective

Update `src/routes/pegawai/dokumen/aju.tsx` untuk:
1. Submit dengan `is_ketua_tim` dari state (sudah auto-set)
2. User tidak bisa override atau change peran
3. Validation pastikan `is_ketua_tim` tidak null/undefined saat submit

## Prerequisites

- Section(s) yang harus selesai dulu: **07 (Ajukan Dokumen Badge)**
- Files/modules yang harus sudah tersedia:
  - `src/routes/pegawai/dokumen/aju.tsx` (with badge implementation)
  - Zod schema di `src/lib/schemas/dokumen.ts`

## Implementation Steps

### 8.1 Read Existing Submit Logic

Find the form submit handler in aju.tsx.

### 8.2 Update Submit Handler

```typescript
async function handleSubmit() {
  // ... existing validation ...

  // is_ketua_tim sudah auto-set dari checkChairmanStatus
  // User tidak bisa override, jadi langsung gunakan state

  const submitData = {
    fungsiId: fungsiId,
    kegiatanJenisId: kegiatanId,
    isKetuaTim: is_ketua_tim, // Use the auto-detected value
    tahun: parseInt(tahun),
    tanggal: formatDateForSubmit(tanggal),
    lampiranUrls: lampiranUrls,
    // ... other fields
  }

  // Validate with schema
  const result = createDokumenSchema.safeParse(submitData)
  if (!result.success) {
    setError(result.error.flatten().fieldErrors)
    return
  }

  // Submit to API
  // ...
}
```

### 8.3 Update Zod Schema (If Needed)

Schema sudah punya `isKetuaTim: z.boolean()` dari existing code. Tidak perlu change.

```typescript
// src/lib/schemas/dokumen.ts (existing)
export const createDokumenSchema = z.object({
  fungsiId: z.string().uuid('ID fungsi tidak valid'),
  kegiatanJenisId: z.string().uuid('ID kegiatan tidak valid'),
  isKetuaTim: z.boolean(), // Already exists, no change needed
  tahun: z.number().int().min(2000).max(2100, 'Tahun tidak valid'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  lampiranUrls: z.array(lampiranUrlSchema).default([]),
})
```

### 8.4 Add Safety Check

```typescript
// Safety check: is_ketua_tim harus selalu terdefinisi sebelum submit
if (typeof is_ketua_tim !== 'boolean') {
  setError('Peran belum ditentukan. Silakan pilih kegiatan terlebih dahulu.')
  return
}
```

### 8.5 Update Success Flow

Jika ada redirection atau success message yang mention peran:

```typescript
// Show different message based on role
const successMessage = is_ketua_tim
  ? 'Dokumen berhasil diajukan sebagai Ketua Tim. Dokumen akan tampil di Laporan Kegiatan.'
  : 'Dokumen berhasil diajukan. Dokumen akan tampil di Laporan Saya.'
```

## Files to Modify

- `src/routes/pegawai/dokumen/aju.tsx` — Update submit handler
- `src/lib/schemas/dokumen.ts` — No change needed (already has isKetuaTim)

## Test Stubs

### Happy Path
- [ ] Submit dengan is_ketua_tim = true jika user chairman di kegiatan
- [ ] Submit dengan is_ketua_tim = false jika user bukan chairman di kegiatan
- [ ] User tidak bisa override is_ketua_tim

### Edge Cases
- [ ] Submit saat kegiatan belum dipilih → prevent (kegiatan required)
- [ ] Browser back dari step upload → badge still shows with correct role

### Error Cases
- [ ] Submit fail → error message, form state preserved

## Definition of Done

- [ ] Submit uses auto-detected is_ketua_tim value
- [ ] User cannot override peran
- [ ] Safety check prevents submit without role determined
- [ ] Success message reflects correct role