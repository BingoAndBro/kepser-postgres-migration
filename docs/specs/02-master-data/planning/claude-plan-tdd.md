# Test Stubs: 02 — Master Data Management

## Tests for: Step 1 — Drizzle Schema

### Happy Path
- [ ] Schema `masterFungsi` punya field: id (uuid PK), nama (text), deskripsi (text nullable), isActive (boolean), createdAt (timestamp)
- [ ] Schema `masterKegiatan` punya field: id, fungsiId (FK), nama, deskripsi, isActive, createdAt
- [ ] Schema `masterKelengkapanDokumen` punya field: id, kegiatanId (FK), isKetuaTim, namaDokumen, required, createdAt
- [ ] Types export: `MasterFungsi`, `NewMasterFungsi`, `MasterKegiatan`, `NewMasterKegiatan`, `MasterKelengkapan`, `NewMasterKelengkapan`

### Edge Cases
- [ ] Unique constraint pada nama di `masterFungsi`
- [ ] Foreign key dari `masterKegiatan.fungsiId` ke `masterFungsi.id`
- [ ] Foreign key dari `masterKelengkapanDokumen.kegiatanId` ke `masterKegiatan.id`

---

## Tests for: Step 3 — Master Data Helpers

### Happy Path
- [ ] `getAllFungsi()` return array fungsi aktif, sorted by nama
- [ ] `getKegiatanByFungsi(id)` return array kegiatan untuk fungsi tertentu
- [ ] `getKelengkapanByKegiatan(id, true)` return kelengkapan Ketua Tim
- [ ] `getKelengkapanByKegiatan(id, false)` return kelengkapan Anggota
- [ ] Helper return empty array jika tidak ada data

### Edge Cases
- [ ] `getAllFungsi()` hanya return is_active = true
- [ ] `getKelengkapanByKegiatan(id, isKetuaTim)` filter correct
- [ ] Helper tidak throw jika Supabase error — return empty array

---

## Tests for: Step 4 — Fungsi API Endpoints

### Happy Path
- [ ] GET /api/master-fungsi → 200 + array fungsi aktif
- [ ] POST /api/master-fungsi (ADMIN) → 201 + fungsi baru
- [ ] PATCH /api/master-fungsi/[id] (ADMIN) → 200 + fungsi updated
- [ ] DELETE /api/master-fungsi/[id] (ADMIN) → 200, is_active = false

### Auth Cases
- [ ] GET tanpa session → 200 (public read)
- [ ] POST tanpa session → 401
- [ ] POST non-ADMIN → 403

### Validation Cases
- [ ] POST dengan nama kosong → 400 + error
- [ ] POST dengan nama duplikat → 409 Conflict
- [ ] PATCH nama duplikat → 409 Conflict
- [ ] PATCH id tidak ada → 404
- [ ] DELETE id tidak ada → 404

---

## Tests for: Step 5 — Kegiatan API Endpoints

### Happy Path
- [ ] GET /api/master-kegiatan → 200 + all kegiatan aktif
- [ ] GET /api/master-kegiatan?fungsi_id=x → 200 + filtered kegiatan
- [ ] POST /api/master-kegiatan (ADMIN) → 201 + kegiatan baru
- [ ] PATCH /api/master-kegiatan/[id] (ADMIN) → 200 + updated
- [ ] DELETE /api/master-kegiatan/[id] (ADMIN) → 200, is_active = false

### Auth Cases
- [ ] GET tanpa session → 200 (public read)
- [ ] POST tanpa session → 401
- [ ] POST non-ADMIN → 403

### Validation Cases
- [ ] POST dengan fungsi_id tidak valid → 400
- [ ] POST dengan nama kosong → 400
- [ ] DELETE kegiatan yang punya kelengkapan → 200 (soft delete, kelengkapan tetap)

---

## Tests for: Step 6 — Kelengkapan API Endpoints

### Happy Path
- [ ] GET /api/master-kelengkapan → 200 + all kelengkapan
- [ ] GET /api/master-kelengkapan?kegiatan_id=x → 200 + filtered
- [ ] POST /api/master-kelengkapan (ADMIN) → 201 + kelengkapan baru
- [ ] PATCH /api/master-kelengkapan/[id] (ADMIN) → 200 + updated
- [ ] DELETE /api/master-kelengkapan/[id] (ADMIN) → 200 (hard delete)

### Auth Cases
- [ ] POST non-ADMIN → 403
- [ ] PATCH non-ADMIN → 403
- [ ] DELETE non-ADMIN → 403

### Validation Cases
- [ ] POST kegiatan_id tidak ada → 400
- [ ] POST nama_dokumen kosong → 400
- [ ] POST is_ketua_tim bukan boolean → 400

---

## Tests for: Step 7-9 — Admin Pages (UI)

### Happy Path
- [ ] Halaman fungsi menampilkan table dengan data dari API
- [ ] Tombol "Tambah Fungsi" membuka modal create
- [ ] Modal create punya field Nama (wajib) dan Deskripsi (opsional)
- [ ] Submit create → API POST → table refresh → success toast
- [ ] Tombol edit di row → modal edit pre-filled
- [ ] Submit edit → API PATCH → table refresh
- [ ] Tombol hapus di row → konfirmasi dialog → API DELETE → table refresh
- [ ] Empty state tampil jika tidak ada data

### Error Cases
- [ ] API error → toast error dengan message
- [ ] Validation error → highlight field yang error
- [ ] Duplicate nama → error message "Nama sudah ada"

---

## Tests for: Integration

### Happy Path
- [ ] Seed data 6 fungsi tampil di dropdown fungsi di halaman submit dokumen (Spec 03)
- [ ] Pilih fungsi → dropdown kegiatan terfilter
- [ ] Pilih kegiatan → checklist kelengkapan muncul sesuai is_ketua_tim
- [ ] ADMIN bisa CRUD semua master data tanpa error

### Edge Cases
- [ ] Soft delete fungsi → kegiatan fungsi tidak muncul di dropdown
- [ ] Soft delete kegiatan → kelengkapan tidak muncul
- [ ] Semua kelengkapan required → submit disabled sampai semua terisi
