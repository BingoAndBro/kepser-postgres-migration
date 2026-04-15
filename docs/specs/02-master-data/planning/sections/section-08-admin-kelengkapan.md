# Section 08: Admin Page — Kelengkapan Config

## Context

Ini bukan table CRUD biasa. Kelengkapan ditampilkan sebagai checklist per kegiatan × role. Admin mengkonfigurasi dokumen apa yang wajib ada untuk setiap kombinasi kegiatan + is_ketua_tim.

## Objective

`src/routes/admin/master-data/kelengkapan.tsx` — halaman configurator kelengkapan per kegiatan.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 05** (API endpoints)
- Files/modules yang harus sudah tersedia:
  - Section 07 pattern
  - `src/routes/api/master-kelengkapan.ts`

## Implementation Steps

### 8a. Create Route File

`src/routes/admin/master-data/kelengkapan.tsx`:

Header: judul "Kelengkapan Dokumen", breadcrumb.

### 8b. Step 1: Pilih Fungsi + Kegiatan

Dua dropdown berurutan:
1. Dropdown Fungsi (from `/api/master-fungsi`)
2. Dropdown Kegiatan (from `/api/master-kegiatan?fungsi_id=x`) — reactive, fetched saat fungsi dipilih

### 8c. Step 2: Display Kelengkapan Configuration

Setelah kegiatan dipilih, tampilkan dua section:

**Kelengkapan Ketua Tim** (is_ketua_tim = true):
- List item dengan checkbox "required"
- Input nama_dokumen per item
- Tombol "Tambah Item" untuk add baru
- Tombol hapus per item

**Kelengkapan Anggota** (is_ketua_tim = false):
- Same pattern

### 8d. Save Behavior

Tombol "Simpan Perubahan" di bawah.

Save: untuk setiap item baru → POST, setiap item yang diedit → PATCH, untuk setiap item yang di-delete → DELETE.

Gunakan optimistic UI atau sequential saves.

### 8e. Empty State

Jika belum ada kelengkapan untuk kegiatan tersebut, tampilkan placeholder dengan "Belum ada kelengkapan untuk kegiatan ini. Tambahkan item di bawah."

## Files to Create/Modify

- `src/routes/admin/master-data/kelengkapan.tsx` — **CREATE**: kelengkapan config page

## Test Stubs

- Fungsi + kegiatan dropdown cascade works
- Kelengkapan loads for selected kegiatan
- Add/edit/delete kelengkapan items
- Save persists to API

## Definition of Done

- [ ] Fungsi + Kegiatan cascade dropdown works
- [ ] Tampil kelengkapan Ketua Tim dan Anggota
- [ ] Add/edit/delete item per section
- [ ] Save ke API works
- [ ] Build succeeds
