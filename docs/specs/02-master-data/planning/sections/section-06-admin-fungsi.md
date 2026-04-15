# Section 06: Admin Page — Fungsi CRUD

## Context

Admin perlu UI untuk mengelola fungsi. Halaman list + modal create/edit/delete.

## Objective

`src/routes/admin/master-data/fungsi.tsx` — halaman dengan table + modal CRUD untuk fungsi.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 03** (API endpoints)
- Files/modules yang harus sudah tersedia:
  - `src/components/ui/Button`, `Dialog`, `Select`, `Input`, `Label`, `Table`
  - `src/routes/api/master-fungsi.ts` (API endpoints)
  - `src/components/dashboard/DashboardShell.tsx` (from Spec 01 work)

## Implementation Steps

### 6a. Create Route File

`src/routes/admin/master-data/fungsi.tsx`:

Import: Button, Dialog components, Input, Label, Table components, Icons (Plus, Edit, Trash2, Search), getBrowserClient.

Halaman layout:
1. Wrap dengan DashboardShell atau buat header custom
2. Header: judul "Departemen Fungsi", breadcrumb "Admin / Master Data / Fungsi", tombol "Tambah Fungsi"

### 6b. State Management

Gunakan React useState untuk:
- `fungsi` array (data dari API)
- `isLoading` boolean
- `searchQuery` string
- `isModalOpen` boolean
- `editingItem` (null = create, object = edit)
- `deleteConfirm` (null = no delete, object = confirm delete)

### 6c. Data Fetching

useEffect: fetch dari `/api/master-fungsi`. Filter locally dengan searchQuery.

### 6d. Table Component

Table dengan kolom: No, Nama, Deskripsi, Jumlah Kegiatan, Status (Aktif/Nonaktif), Aksi.

Kolom Aksi: Edit button (pencil icon) + Delete button (trash icon).

### 6e. Create/Edit Modal

Dialog dengan:
- Judul: "Tambah Fungsi" atau "Edit Fungsi"
- Field Nama (Input, required)
- Field Deskripsi (Input textarea, optional)
- Footer: Cancel button + Save button

Submit → POST atau PATCH API → refresh data → close modal.

### 6f. Delete Confirmation

Simple confirmation: Dialog dengan text "Yakin hapus fungsi X?" + Cancel + Delete buttons.

Delete → DELETE API → refresh data.

### 6g. Empty State

"If functions.length === 0" → tampilkan card dengan icon + text "Belum ada fungsi. Tambahkan fungsi pertama." + tombol "Tambah Fungsi".

### 6h. Toast Notifications

Gunakan simple state-based alerts atau `alert()` untuk MVP. Tidak perlu toast library tambahan.

## Files to Create/Modify

- `src/routes/admin/master-data/fungsi.tsx` — **CREATE**: full CRUD page

## Test Stubs

- Page loads and fetches data
- Create modal opens and submits successfully
- Edit pre-fills data and submits
- Delete confirmation works
- Empty state displays correctly
- Error handling shows alerts

## Definition of Done

- [ ] Halaman menampilkan list fungsi dari API
- [ ] Search/filter berfungsi
- [ ] Create modal: validasi nama wajib, submit POST
- [ ] Edit modal: pre-filled, submit PATCH
- [ ] Delete: konfirmasi + DELETE API
- [ ] Empty state tampil jika tidak ada data
- [ ] Build succeeds
