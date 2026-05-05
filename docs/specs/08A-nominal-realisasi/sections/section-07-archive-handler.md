# Section 07: Archive Handler Update

## Context

Saat dokumen diarsipkan, `nominal_realisasi` harus di-copy ke tabel `arsip`. Spec menyebutkan propagasi ini perlu diimplementasi.

## Objective

Update handler archive untuk meng-copy `nominal_realisasi` dari `dokumen_transaksi` ke `arsip`.

## Prerequisites

- Section 01 (SQL Migration) harus selesai
- Section 02 (Drizzle Schema) harus selesai

## Implementation Steps

### 7.1 Identifikasi Handler Archive

Buka `src/routes/api/arsiparis/dokumen.[id].archive.ts` atau cari file yang menangani archive dokumen.

### 7.2 Get Dokumen dengan Nominal

Pastikan data yang di-fetch include nominal_realisasi:

```typescript
const { data: dok } = await supabase
  .from('dokumen_transaksi')
  .select('id, judul, created_by, nominal_realisasi, is_non_material')
  .eq('id', params.id)
  .single()
```

### 7.3 Include dalam Insert Payload

Saat insert ke tabel `arsip`, tambahkan `nominal_realisasi`:

```typescript
const arsipInsert = {
  dokumen_id: dok.id,
  nomor_surat: body.nomor_surat,
  // ... existing fields
  nominal_realisasi: dok.nominal_realisasi,  // ADD THIS
}
```

### 7.4 Handle Null Case

Jika `nominal_realisasi` NULL (dokumen Non-Material), tetap include NULL dalam insert. Database akan handle sesuai default di schema.

### 7.5 Update Lampiran Snapshot (jika ada)

Jika handler juga membuat snapshot lampiran, pastikan snapshot tidak perlu di-modifikasi untuk nominal — itu adalah lampiran dokumen, bukan field numerik.

## Files to Create/Modify

- `src/routes/api/arsiparis/dokumen.[id].archive.ts` — Modify

## Test Stubs

- [ ] Dokumen Material dengan nominal tersimpan ke arsip dengan nominal yang sama
- [ ] Dokumen Non-Material dengan null nominal tersimpan dengan null
- [ ] Dokumen dengan nominal 0 tersimpan dengan 0
- [ ] Arsip baru punya field nominal_realisasi yang sesuai dengan dokumen
- [ ] Dokumen tanpa nominal (NULL) tetap bisa diarsipkan

## Definition of Done

- [ ] Archive handler meng-copy nominal_realisasi ke arsip
- [ ] Dokumen Material dan Non-Material sama-sama bisa diarsipkan
- [ ] Snapshot arsip tidak affected (field ini bukan lampiran)
- [ ] Test stubs untuk propagasi nominal