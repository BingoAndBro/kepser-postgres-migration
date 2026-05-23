# Section 06: Master Klasifikasi Arsip CRUD API

## Context
Section 01 (DB Migration) sudah selesai. Tabel `master_klasifikasi_arsip` sudah ada.

## Objective
Membuat CRUD API untuk master klasifikasi arsip: GET list, POST create, PATCH update, DELETE soft-delete.

## Prerequisites
- Section 01 selesai
- Pattern: mengikuti `src/routes/api/master-fungsi.ts`

## Implementation Steps

### 1. Buat `src/routes/api/arsiparis/klasifikasi/index.ts`

**GET** — list semua klasifikasi aktif
- Public access (semua authenticated user bisa baca untuk dropdown)
- Return: `{ klasifikasi: [{ id, nama, deskripsi }] }`

**POST** — create klasifikasi baru
- Auth: Kepala Sub Bagian Umum only
- Body: `{ nama: string, deskripsi?: string }`
- Validate: nama unique, tidak kosong
- Return: created row

### 2. Buat `src/routes/api/arsiparis/klasifikasi/[id].ts`

**PATCH** — update klasifikasi
- Auth: Kepala Sub Bagian Umum only
- Body: `{ nama?: string, deskripsi?: string }`
- Validate: nama unique jika di-update

**DELETE** — soft delete
- Auth: Kepala Sub Bagian Umum only
- Update `is_active = false` (soft delete)

## Files to Create

- `src/routes/api/arsiparis/klasifikasi/index.ts`
- `src/routes/api/arsiparis/klasifikasi/[id].ts`

## Test Stubs

- [ ] GET mengembalikan semua klasifikasi aktif
- [ ] POST membuat klasifikasi baru (Kepala Sub Bagian Umum only)
- [ ] PATCH update klasifikasi (Kepala Sub Bagian Umum only)
- [ ] DELETE soft delete (Kepala Sub Bagian Umum only)
- [ ] GET bisa diakses tanpa role check (public dropdown)
- [ ] POST/PATCH/DELETE returns 403 jika bukan Kepala Sub Bagian Umum

## Definition of Done

- [ ] CRUD berfungsi dengan benar
- [ ] Soft delete diterapkan
- [ ] Role check diterapkan (GET public, mutation Kepala Sub Bagian Umum only)
- [ ] Test stubs pass
