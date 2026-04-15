# Section 07: Admin Page — Kegiatan CRUD

## Context

Sama pattern-nya dengan Section 06, tapi untuk kegiatan yang terikat pada fungsi.

## Objective

`src/routes/admin/master-data/kegiatan.tsx` — halaman list + CRUD kegiatan dengan filter fungsi.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 04** (API endpoints)
- Files/modules yang harus sudah tersedia:
  - Section 06 pattern (reuse)
  - `src/routes/api/master-fungsi.ts` (for dropdown)
  - `src/routes/api/master-kegiatan.ts` (for kegiatan CRUD)

## Implementation Steps

### 7a. Create Route File

`src/routes/admin/master-data/kegiatan.tsx`:

Header: judul "Master Kegiatan", breadcrumb, tombol "Tambah Kegiatan".

### 7b. Filter Fungsi Dropdown

Fetch daftar fungsi dari `/api/master-fungsi` saat mount. Dropdown untuk filter berdasarkan fungsi. Dropdown di-table toolbar.

### 7c. Table Component

Kolom: No, Nama Kegiatan, Fungsi (badge/label), Deskripsi, Jumlah Kelengkapan, Status, Aksi.

### 7d. Create/Edit Modal

- Field Fungsi: Select dropdown dari daftar fungsi (required)
- Field Nama: Input text (required)
- Field Deskripsi: textarea (optional)

### 7e. Delete

Soft delete. Warning: "Kegiatan akan dinonaktifkan. Kelengkapan terkait tidak akan dihapus tapi tidak akan tampil di dropdown."

## Files to Create/Modify

- `src/routes/admin/master-data/kegiatan.tsx` — **CREATE**: full CRUD page

## Test Stubs

- Fungsi dropdown populates
- Filter by fungsi works
- Create/edit dengan fungsi selection
- Soft delete with warning

## Definition of Done

- [ ] Halaman menampilkan list kegiatan
- [ ] Filter dropdown fungsi berfungsi
- [ ] Create/edit: pilih fungsi + nama + deskripsi
- [ ] Soft delete dengan warning
- [ ] Build succeeds
