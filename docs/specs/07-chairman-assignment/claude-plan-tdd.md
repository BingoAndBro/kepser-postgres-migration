# Test Stubs: SPEC 07 — Chairman Assignment

## Overview

Dokumen ini berisi test stubs untuk setiap step implementasi. Test stubs ditulis dalam bahasa natural, bukan kode implementasi.

---

## Tests for: Step 1 - Database Migration

### Happy Path
- [ ] Migration berhasil tanpa error
- [ ] Tabel `ketua_tim_assignments` terbuat dengan kolom yang benar (id, user_id, kegiatan_id, created_at, created_by)
- [ ] UNIQUE constraint pada kegiatan_id berfungsi
- [ ] Indexes terbuat untuk user_id dan kegiatan_id
- [ ] RLS policies terbuat untuk SELECT (authenticated) dan ALL (ADMIN)
- [ ] Function `is_user_chairman()` return true untuk user yang chairman
- [ ] Function `is_user_chairman()` return false untuk user yang bukan chairman
- [ ] Function `get_user_chairman_kegiatan()` return semua kegiatan chairman user
- [ ] Function `get_user_chairman_kegiatan()` return empty array untuk user tanpa chairman

### Edge Cases
- [ ] Cascade delete works: saat user dihapus, assignments ikut terhapus
- [ ] Cascade delete works: saat kegiatan dihapus, assignments ikut terhapus

### Error Cases
- [ ] Migration fail jika extension belum ada (expected: extension created automatically)
- [ ] UNIQUE constraint prevent duplicate kegiatan_id

---

## Tests for: Step 2 - API Endpoints CRUD

### Happy Path
- [ ] GET `/api/ketua-tim` return semua assignments (ADMIN)
- [ ] GET `/api/ketua-tim` return empty array jika tidak ada assignments
- [ ] POST `/api/ketua-tim` dengan data valid berhasil membuat assignment
- [ ] POST `/api/ketua-tim` return 201 dengan assignment data
- [ ] DELETE `/api/ketua-tim/[id]` berhasil hapus assignment
- [ ] DELETE `/api/ketua-tim/[id]` return 204 setelah delete berhasil
- [ ] GET `/api/ketua-tim/user/[user_id]` return semua kegiatan chairman user tertentu

### Edge Cases
- [ ] GET `/api/ketua-tim` dengan user non-ADMIN return 403
- [ ] POST dengan kegiatan_id yang sudah punya chairman return 409 dengan data chairman lama
- [ ] POST dengan user_id yang tidak valid return 400
- [ ] POST dengan kegiatan_id yang tidak valid return 400
- [ ] DELETE dengan id yang tidak ada return 404

### Error Cases
- [ ] Unauthorized request return 401
- [ ] Invalid UUID format return 400

---

## Tests for: Step 3 - User Chairman Check API

### Happy Path
- [ ] GET `/api/users/me/ketua-tim` return `{ is_ketua_tim: true, kegiatan: [...] }` jika user chairman
- [ ] GET `/api/users/me/ketua-tim` return `{ is_ketua_tim: false, kegiatan: [] }` jika user bukan chairman
- [ ] GET `/api/users/me/is-ketua-tim/[kegiatan_id]` return `{ is_ketua_tim: true }` jika user chairman di kegiatan itu
- [ ] GET `/api/users/me/is-ketua-tim/[kegiatan_id]` return `{ is_ketua_tim: false }` jika user bukan chairman di kegiatan itu

### Edge Cases
- [ ] kegiatan_id tidak valid return 400
- [ ] User tidak login return 401

### Error Cases
- [ ] Database error return 500 dengan proper error message

---

## Tests for: Step 4 - Master User Table Display

### Happy Path
- [ ] Tabel Master User menampilkan kolom "Kegiatan Ketua Tim"
- [ ] User dengan chairman menampilkan chip/badge per kegiatan
- [ ] User tanpa chairman menampilkan "-"
- [ ] Data fetched saat page load

### Edge Cases
- [ ] User chairman di banyak kegiatan menampilkan semua chip
- [ ] Long kegiatan nama truncate dengan ellipsis

### Error Cases
- [ ] API fail menampilkan error state dengan retry button

---

## Tests for: Step 5 - Master User Edit/Create Dialog

### Happy Path
- [ ] Edit User dialog menampilkan section "Kegiatan sebagai Ketua Tim"
- [ ] Chip kegiatan yang di-assign tampil dengan button X untuk remove
- [ ] Click X pada chip berhasil remove assignment
- [ ] Dropdown "Tambah Kegiatan" hanya menampilkan kegiatan tanpa chairman
- [ ] Select kegiatan di dropdown berhasil add assignment
- [ ] Create User dialog menampilkan section opsional chairman assignment
- [ ] Info text "Satu kegiatan hanya boleh memiliki 1 ketua tim" tampil

### Edge Cases
- [ ] Select kegiatan yang sudah punya chairman (confirm dialog appears)
- [ ] Confirmation dialog menampilkan nama chairman lama
- [ ] Confirm replacement → old assignment deleted, new created
- [ ] Cancel replacement → no changes made

### Error Cases
- [ ] Add assignment fail → show error toast, revert UI
- [ ] Remove assignment fail → show error toast, revert UI

---

## Tests for: Step 6 - AppLayout Conditional Menu

### Happy Path
- [ ] User dengan chairman assignments melihat menu "Laporan Kegiatan"
- [ ] User tanpa chairman assignments TIDAK melihat menu "Laporan Kegiatan"
- [ ] Menu visibility check dilakukan saat mount
- [ ] Menu refresh saat user logout/login

### Edge Cases
- [ ] User chairman di kegiatan yang kemudian dihapus → menu tetap visible (until refresh)

### Error Cases
- [ ] API fail → menu tidak tampil (fail gracefully)

---

## Tests for: Step 7 - Ajukan Dokumen Auto-detect & Badge

### Happy Path
- [ ] Toggle button "Ketua Tim / Anggota" tidak lagi ada
- [ ] Setelah pilih kegiatan, badge "🏆 Anda adalah Ketua Tim" tampil (jika chairman)
- [ ] Setelah pilih kegiatan, badge "🏅 Anda adalah Anggota" tampil (jika bukan chairman)
- [ ] Badge muncul setelah fetch API selesai
- [ ] is_ketua_tim state auto-set berdasarkan kegiatan yang dipilih

### Edge Cases
- [ ] Ganti kegiatan → badge update sesuai kegiatan baru
- [ ] User chairman di kegiatan A, pilih kegiatan B (bukan chairman) → badge "Anggota"

### Error Cases
- [ ] API fail → default ke "Anggota" (fail gracefully)
- [ ] Loading state tampil saat fetch badge data

---

## Tests for: Step 8 - Ajukan Dokumen Form Submission

### Happy Path
- [ ] Submit dokumen dengan is_ketua_tim = true jika user chairman di kegiatan
- [ ] Submit dokumen dengan is_ketua_tim = false jika user bukan chairman di kegiatan
- [ ] User tidak bisa override is_ketua_tim (no toggle)

### Edge Cases
- [ ] Submit saat kegiatan belum dipilih → prevent (kegitan required)
- [ ] Browser back dari step upload → badge masih tampil dengan role yang sama

### Error Cases
- [ ] Submit fail → error message, form state preserved

---

## Tests for: Step 9 - Laporan Kegiatan Permission Check

### Happy Path
- [ ] User chairman bisa akses halaman Laporan Kegiatan
- [ ] Data dokumen kegiatan tampil dengan benar
- [ ] Filter berfungsi dengan benar

### Edge Cases
- [ ] User bukan chairman mengakses URL langsung → redirect ke halaman error
- [ ] User chairman tidak ada kegiatan (rare edge) → redirect ke halaman error

### Error Cases
- [ ] API fail → error state dengan retry

---

## Tests for: Step 10 - Drizzle Schema Update (Optional)

### Happy Path
- [ ] Schema include `ketua_tim_assignments` table definition
- [ ] Types generated correctly
- [ ] Migrations sync dengan database schema

### Error Cases
- [ ] Schema out of sync → migration warning

---

*Test stubs version: 1.0*
*Created: 2026-05-03*