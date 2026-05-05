# Section 02: Drizzle Schema Update

## Context

Setelah SQL migration (Section 01) berhasil di-run, Drizzle schema perlu di-update agar TypeScript types sesuai dengan database state yang baru.

## Objective

Update `src/lib/db/schema.ts` untuk menambahkan field `nominalRealisasi` dan `isNonMaterial` ke tabel yang relevan.

## Prerequisites

- Section 01 (SQL Migration) harus selesai
- Database sudah memiliki kolom baru

## Implementation Steps

### 2.1 Baca Schema Existing

Buka `src/lib/db/schema.ts` dan identifikasi:
- Tabel `dokumenTransaksi` — cari di mana columns didefinisikan
- Tabel `arsip` — cari di mana columns didefinisikan
- Pattern yang digunakan untuk numeric columns

### 2.2 Update Tabel dokumenTransaksi

Tambahkan field baru dengan pattern yang sudah ada:

```typescript
// Di dalam definisi tabel dokumenTransaksi
nominalRealisasi: numeric('nominal_realisasi', { precision: 15, scale: 2 }),
isNonMaterial: boolean('is_non_material').default(false),
```

**Catatan:** `.default(false)` untuk boolean akan menghasilkan default value di Drizzle.

### 2.3 Update Tabel arsip

Tambahkan field:

```typescript
// Di dalam definisi tabel arsip
nominalRealisasi: numeric('nominal_realisasi', { precision: 15, scale: 2 }),
```

### 2.4 Verifikasi Types

Pastikan Drizzle generate types atau infer yang dihasilkan sesuai expectation:
- `nominalRealisasi`: number | null
- `isNonMaterial`: boolean

## Files to Create/Modify

- `src/lib/db/schema.ts` — Modify (tambah field ke dokumenTransaksi dan arsip)

## Test Stubs

- [ ] Schema `dokumenTransaksi` punya field `nominalRealisasi`
- [ ] Schema `dokumenTransaksi` punya field `isNonMaterial`
- [ ] Schema `arsip` punya field `nominalRealisasi`
- [ ] Type inference correctly typed as number | null untuk nominalRealisasi
- [ ] Type inference correctly typed as boolean untuk isNonMaterial
- [ ] Drizzle generate types match database columns

## Definition of Done

- [ ] Field `nominalRealisasi` ada di schema `dokumenTransaksi`
- [ ] Field `isNonMaterial` ada di schema `dokumenTransaksi`
- [ ] Field `nominalRealisasi` ada di schema `arsip`
- [ ] Schema bisa di-compile tanpa error
- [ ] Types sesuai dengan expectation