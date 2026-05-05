# Section 01: SQL Migration

## Context

Ini adalah langkah pertama dalam implementasi. Tidak ada yang bergantung pada section ini, sehingga aman untuk dimulai kapan saja.

## Objective

Menambahkan kolom `nominal_realisasi` dan `is_non_material` ke tabel `dokumen_transaksi`, serta `nominal_realisasi` ke tabel `arsip`.

## Prerequisites

- None (step pertama)

## Implementation Steps

### 1.1 Buat File Migration

Buat file baru di `supabase/migrations/016_nominal_realisasi.sql`

### 1.2 Tulis SQL dengan Pattern Idempotent

Gunakan `ADD COLUMN IF NOT EXISTS` untuk memastikan migration bisa di-run ulang tanpa error.

```sql
-- ============================================================
-- Migration: 016_nominal_realisasi.sql
-- Deskripsi: Add nominal_realisasi dan is_non_material columns
-- Dibuat: 2026-05-04
-- Bergantung pada: -
--============================================================

-- Tambah kolom ke dokumen_transaksi
ALTER TABLE dokumen_transaksi
  ADD COLUMN IF NOT EXISTS nominal_realisasi DECIMAL(15,2) DEFAULT 0;

ALTER TABLE dokumen_transaksi
  ADD COLUMN IF NOT EXISTS is_non_material BOOLEAN DEFAULT false;

-- Tambah kolom ke arsip
ALTER TABLE arsip
  ADD COLUMN IF NOT EXISTS nominal_realisasi DECIMAL(15,2);

-- Constraint untuk ensure nominal >= 0 (opsional, tapi recommended)
ALTER TABLE dokumen_transaksi
  ADD CONSTRAINT dokumen_nominal_realisasi_positive
  CHECK (nominal_realisasi IS NULL OR nominal_realisasi >= 0);
```

### 1.3 Verifikasi Migration

- Pastikan syntax SQL benar
- Pastikan tidak ada typo pada nama kolom/tabel
- Pastikan constraint tidak bentrok dengan yang sudah ada

## Files to Create/Modify

- `supabase/migrations/016_nominal_realisasi.sql` — Create

## Test Stubs

- [ ] Migration bisa di-run tanpa error pada fresh database
- [ ] Kolom `nominal_realisasi` (DECIMAL 15,2) ada di tabel `dokumen_transaksi`
- [ ] Kolom `is_non_material` (BOOLEAN DEFAULT false) ada di tabel `dokumen_transaksi`
- [ ] Kolom `nominal_realisasi` (DECIMAL 15,2) ada di tabel `arsip`
- [ ] CHECK constraint `dokumen_nominal_realisasi_positive` memastikan nominal >= 0
- [ ] Migration bisa di-run ulang tanpa error (idempotent)

## Definition of Done

- [ ] File migration ada di `supabase/migrations/016_nominal_realisasi.sql`
- [ ] SQL bisa di-execute tanpa error
- [ ] Semua kolom baru ada di database
- [ ] Constraint positif berfungsi
- [ ] Idempotent: re-run tidak menyebabkan error