# Implementation Plan: 02 — Master Data Management

## Overview

Component ini membangun tiga jenis master data: Departemen/Fungsi, Kegiatan per fungsi, dan Kelengkapan Dokumen per kegiatan. Semua operasi CRUD dilakukan oleh ADMIN via API endpoints, sementara komponen lain hanya membaca data master via helper functions. Data master disimpan di Supabase PostgreSQL dengan Drizzle ORM untuk type safety.

## Architecture

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts          ← extend dengan master data tables
│   └── master-data.ts         ← NEW: read-only helper functions
├── routes/
│   ├── api/
│   │   ├── master-fungsi.ts            ← GET, POST (ADMIN)
│   │   ├── master-fungsi.$id.ts        ← PATCH, DELETE (ADMIN)
│   │   ├── master-kegiatan.ts          ← GET, POST (ADMIN)
│   │   ├── master-kegiatan.$id.ts      ← PATCH, DELETE (ADMIN)
│   │   ├── master-kelengkapan.ts       ← GET, POST (ADMIN)
│   │   └── master-kelengkapan.$id.ts   ← PATCH, DELETE (ADMIN)
│   └── admin/
│       └── master-data/
│           ├── index.tsx                ← redirect ke /admin/master-data/fungsi
│           ├── fungsi.tsx               ← Halaman list & CRUD fungsi
│           ├── kegiatan.tsx             ← Halaman list & CRUD kegiatan
│           └── kelengkapan.tsx          ← Halaman configure kelengkapan
```

## Data Flow

1. **Read (all roles)**: Client → API GET → Supabase query (is_active=true filter) → JSON response
2. **Write (ADMIN only)**: Admin UI → API POST/PATCH/DELETE → Supabase mutation → JSON response
3. **Helpers**: Components (Spec 03-05) → `master-data.ts` helpers → Supabase query

## Implementation Steps

### Step 1: Extend Drizzle Schema

Tambahkan tiga tabel baru ke `src/lib/db/schema.ts`. Semua tabel pakai pattern yang sama dengan tabel `roles` yang sudah ada — `pgTable`, `uuid`, `text`, `timestamp`, `boolean`, dengan soft delete via `is_active`.

`masterFungsi`: id (uuid PK), nama (text NOT NULL UNIQUE), deskripsi (text nullable), isActive (boolean DEFAULT true), createdAt (timestamp).

`masterKegiatan`: id (uuid PK), fungsiId (uuid FK ke masterFungsi), nama (text NOT NULL), deskripsi (text nullable), isActive (boolean DEFAULT true), createdAt (timestamp).

`masterKelengkapanDokumen`: id (uuid PK), kegiatanId (uuid FK ke masterKegiatan), isKetuaTim (boolean NOT NULL), namaDokumen (text NOT NULL), required (boolean DEFAULT true), createdAt (timestamp).

Export types untuk setiap tabel: `MasterFungsi`, `NewMasterFungsi`, dll.

### Step 2: Create SQL Migration for Master Data Tables

Buat file `supabase/migrations/002_master_data.sql` dengan CREATE TABLE statements yang mirror Drizzle schema. Ini diperlukan agar Drizzle studio dan migration tooling bekerja, dan sebagai dokumentasi schema yang jelas. Seed data juga masuk di migration yang sama.

Seed data mencakup 6 fungsi BPS (Sosial, Distribusi, Neraca, Produksi, Umum, IPDS) + kegiatan contoh per fungsi (SAKERNAS, SUSENAS, PODES, dll) + kelengkapan SAKERNAS untuk Ketua Tim dan Anggota.

### Step 3: Create Master Data Helper Functions

Buat `src/lib/master-data.ts` dengan read-only helper functions yang dipakai komponen lain:

`getAllFungsi()` — SELECT dari master_fungsi WHERE is_active = true ORDER BY nama.

`getKegiatanByFungsi(fungsiId)` — SELECT dari master_kegiatan WHERE fungsi_id = fungsiId AND is_active = true ORDER BY nama. Jika fungsiId null/undefined, return semua kegiatan aktif.

`getKelengkapanByKegiatan(kegiatanId, isKetuaTim)` — SELECT dari master_kelengkapan_dokumen WHERE kegiatan_id = kegiatanId AND is_ketua_tim = isKetuaTim ORDER BY nama_dokumen.

`getAllKegiatan()` — SELECT semua kegiatan aktif (tanpa filter fungsi).

`getAllKelengkapan()` — SELECT semua kelengkapan aktif.

### Step 4: Create API Endpoints for Fungsi

`GET /api/master-fungsi`: List semua fungsi aktif. Tidak perlu auth (semua role bisa baca). Return array of fungsi objects. Query params opsional: none.

`POST /api/master-fungsi`: Create fungsi baru. Body: { nama, deskripsi? }. Validasi: nama tidak kosong, tidak duplikat. ADMIN only (cek via session). Return fungsi yang baru dibuat.

`PATCH /api/master-fungsi/[id]`: Update fungsi. Body: { nama?, deskripsi? }. ADMIN only. Validasi: nama tidak duplikat jika diupdate. Return fungsi yang diupdate.

`DELETE /api/master-fungsi/[id]`: Soft delete (is_active = false). ADMIN only. Return success. Relasi ke kegiatan tetap — kegiatan tidak di-delete tapi tidak akan muncul di dropdown (karena difilter is_active).

### Step 5: Create API Endpoints for Kegiatan

`GET /api/master-kegiatan`: List semua kegiatan aktif. Opsional query param: ?fungsi_id=x. Return array of kegiatan objects dengan nested fungsi info.

`POST /api/master-kegiatan`: Create kegiatan baru. Body: { fungsi_id, nama, deskripsi? }. Validasi: fungsi_id valid, nama tidak kosong. ADMIN only. Return kegiatan baru.

`PATCH /api/master-kegiatan/[id]`: Update kegiatan. Body: { fungsi_id?, nama?, deskripsi? }. ADMIN only. Return kegiatan updated.

`DELETE /api/master-kegiatan/[id]`: Soft delete. ADMIN only. Kelengkapan terkait tidak di-delete tapi tidak muncul.

### Step 6: Create API Endpoints for Kelengkapan

`GET /api/master-kelengkapan`: List kelengkapan. Query params: ?kegiatan_id=x. Return array dengan nested kegiatan + fungsi info.

`POST /api/master-kelengkapan`: Create kelengkapan. Body: { kegiatan_id, is_ketua_tim, nama_dokumen, required? }. ADMIN only. Validasi: kegiatan_id valid, is_ketua_tim boolean, nama_dokumen tidak kosong. Return kelengkapan baru.

`PATCH /api/master-kelengkapan/[id]`: Update kelengkapan. Body: { is_ketua_tim?, nama_dokumen?, required? }. ADMIN only. Return updated.

`DELETE /api/master-kelengkapan/[id]`: Hard delete (MVP tidak ada alasan untuk soft delete kelengkapan — jika kegiatan di-soft delete, kelengkapan terkait tidak akan muncul karena difilter). ADMIN only.

### Step 7: Create Admin Pages — Fungsi

Halaman `src/routes/admin/master-data/fungsi.tsx` dengan:

Header: judul "Departemen Fungsi", tombol "Tambah Fungsi".

Table dengan kolom: No, Nama, Deskripsi, Jumlah Kegiatan, Status, Aksi.

Fitur: Create modal (nama + deskripsi), Edit modal, Delete dengan konfirmasi, Search/filter nama.

Respons: Fetch dari GET /api/master-fungsi, POST ke POST endpoint, PATCH ke PATCH endpoint, DELETE ke DELETE endpoint.

### Step 8: Create Admin Pages — Kegiatan

Halaman `src/routes/admin/master-data/kegiatan.tsx` dengan:

Fitur: Filter dropdown Fungsi (dari /api/master-fungsi), Table kegiatan (nama, fungsi, deskripsi, jumlah kelengkapan), Create/Edit/Delete, Pagination jika > 50 items.

### Step 9: Create Admin Pages — Kelengkapan

Halaman `src/routes/admin/master-data/kelengkapan.tsx` dengan:

Fitur: Dropdown pilih Kegiatan (reactive based on fungsi filter), Display dua section: "Kelengkapan Ketua Tim" dan "Kelengkapan Anggota", Checkbox list dengan nama dokumen + required toggle, Add/Edit/Delete per item.

### Step 10: Admin Master Data Layout & Navigation Update

Update `AppLayout.tsx` NAV_CONFIG untuk ADMIN — route `/admin/master-data/user`, `/admin/master-data/fungsi`, `/admin/master-data/kegiatan`, `/admin/master-data/kelengkapan`.

Tambahkan tab navigation di halaman admin atau redirect dari `/admin/master-data` ke `/admin/master-data/fungsi`.

## Edge Cases & Error Handling

**Duplicate nama**: POST/PATCH untuk fungsi dan kegiatan harus cek nama duplikat dalam 1 parent yang sama. Return 409 Conflict dengan message "Nama sudah ada".

**Delete fungsi dengan kegiatan**: Soft delete fungsi → kegiatan terkait tidak di-delete tapi tidak muncul di dropdown. Beri warning di UI saat hapus: "Fungsi akan di-nonaktifkan. Kegiatan terkait tidak akan muncul di dropdown tapi data tetap tersimpan."

**Delete kegiatan dengan kelengkapan**: Soft delete kegiatan → kelengkapan tidak di-delete tapi tidak muncul. Warning yang sama.

**Empty states**: Semua table harus punya empty state yang informatif — "Belum ada fungsi. Tambahkan fungsi pertama." Bukan halaman kosong.

**Network errors**: Semua API calls harus handle error dan tampilkan toast/alert. Jangan silent fail.

**Validation errors**: Return 400 dengan detail field yang gagal validasi. UI harus highlight field yang error.

## Integration Points

- **Spec 03 (Submit Flow)**: Panggil `getAllFungsi()`, `getKegiatanByFungsi(fungsiId)`, `getKelengkapanByKegiatan(kegiatanId, isKetuaTim)` saat form ajukan dokumen
- **Spec 01 (Auth)**: ADMIN role sudah ada di guard functions
- **Spec 04-05**: Tidak langsung integrate tapi assume master data tersedia saat dibaca

## Migration / Compatibility Notes

- Schema baru ditambahkan via `002_master_data.sql` — jalankan manual di Supabase
- Seed data di-append di migration yang sama
- Tidak ada breaking change pada existing API atau UI
- `masterFungsi`, `masterKegiatan`, `masterKelengkapanDokumen` tables baru

## Open Questions

1. **Pagination**: MVP tanpa pagination untuk fungsi (biasanya < 10) dan kegiatan (biasanya < 50). Tambahkan jika needed.
2. **Urutan kelengkapan**: MVP urutan alfabet. Drag-drop bisa ditambahkan di iterasi berikutnya.
