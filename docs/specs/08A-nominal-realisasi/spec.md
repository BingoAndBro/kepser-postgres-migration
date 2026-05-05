# Spec: 08A — Nominal Realisasi Foundation

## Overview
Menambahkan field `nominal_realisasi` ke tabel `dokumen_transaksi` sebagai fondasi untuk seluruh fitur terkait nominal di sistem. Field ini WAJIB diisi untuk dokumen Material, dan menjadi basis agregasi untuk laporan dan export.

---

## Background / Konteks
Seluruh fitur di spec 08 (08A-08E) bergantung pada field `nominal_realisasi`. Spec ini adalah fondasi yang harus selesai terlebih dahulu sebelum spec lainnya.

Benang merah `nominal_realisasi`:
- **08A (Foundation):** Tambah field ke database + API
- **08B (Penambahan Arsip):** Arsiparis WAJIB isi nominal saat tambah arsip manual
- **08C (Non-Material):** Dokumen Non-Material TIDAK wajib nominal
- **08D (Export Excel):** Kolom nominal di export + agregasi per klasifikasi
- **08E (Penanggung Jawab):** Agregasi nominal di laporan kinerja

---

## User Stories
- Sebagai **sistem**, saya ingin menyimpan nominal_realisasi di dokumen, agar bisa di-agregasi dan di-export.
- Sebagai **sistem**, saya ingin validasi nominal_realisasi WAJIB untuk dokumen Material, agar tidak ada data yang hilang.

---

## Scope — Termasuk
- Tambah kolom `nominal_realisasi` ke tabel `dokumen_transaksi` (DECIMAL)
- Tambah kolom `nominal_realisasi` ke tabel `arsip` (untuk arsip yang diarsipkan dari dokumen + arsip manual)
- Update API submit dokumen untuk menerima `nominal_realisasi`
- Update validasi: nominal_realisasi WAJIB untuk dokumen Material
- Update Drizzle schema dan migration

---

## Scope — Tidak Termasuk
- UI form untuk nominal_realisasi (ada di spec 03 dan 08B)
- Agregasi nominal (ada di spec 08D dan 08E)
- Validasi Non-Material (ada di spec 08C)

---

## Data / Model / Schema

### Tabel `dokumen_transaksi` (additions)
```typescript
dokumen_transaksi: {
  // ... existing fields
  nominal_realisasi: decimal(15,2),  // NULL = Non-Material, NOT NULL = Material
  is_non_material: boolean DEFAULT false,  // Flag untuk dokumen Non-Material
}
```

### Tabel `arsip` (additions)
```typescript
arsip: {
  // ... existing fields
  nominal_realisasi: decimal(15,2),  // Copy dari dokumen atau diinput manual
}
```

---

## Migration SQL
```sql
-- Migration: 013_nominal_realisasi.sql
ALTER TABLE dokumen_transaksi
  ADD COLUMN nominal_realisasi DECIMAL(15,2),
  ADD COLUMN is_non_material BOOLEAN DEFAULT false;

ALTER TABLE arsip
  ADD COLUMN nominal_realisasi DECIMAL(15,2);
```

---

## API / Server Functions

```typescript
// POST /api/dokumen
// Body: { ..., nominal_realisasi?: decimal, is_non_material?: boolean }
// → validasi: jika !is_non_material, nominal_realisasi WAJIB

// PATCH /api/dokumen/[id]
// Body: { nominal_realisasi?: decimal }
// → validasi: jika !is_non_material, nominal_realisasi WAJIB
```

---

## Logic / Business Rules
- **Wajib untuk Material:** `nominal_realisasi` HARUS terisi untuk dokumen dengan `is_non_material = false`
- **Opsional untuk Non-Material:** `nominal_realisasi` BISA NULL untuk dokumen dengan `is_non_material = true`
- **Propagasi ke Arsip:** Saat dokumen diarsipkan, `nominal_realisasi` di-copy ke tabel `arsip`

---

## Dependensi
- **Bergantung pada:** Spec 01 (Auth), Spec 03 (Submit Flow)
- **Dibutuhkan oleh:** Spec 08B, 08C, 08D, 08E

---

## Definition of Done
- [ ] Kolom `nominal_realisasi` dan `is_non_material` ada di schema dokumen_transaksi
- [ ] Kolom `nominal_realisasi` ada di schema arsip
- [ ] Migration SQL bisa di-run tanpa error
- [ ] API submit menerima dan menyimpan nominal_realisasi
- [ ] Validasi: Material = WAJIB nominal, Non-Material = OPSIONAL