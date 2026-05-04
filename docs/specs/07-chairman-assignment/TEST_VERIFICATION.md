# Test & Verification Guide: SPEC 07 — Chairman Assignment (Ketua Tim)

## Overview

Implemented a complete chairman assignment system that allows admin to assign users as "Ketua Tim" (Chairman) for specific activities/kegiatans. The system auto-detects user role when submitting documents and conditionally shows/hides the "Laporan Kegiatan" menu.

## Prerequisites

- Supabase project with migrations applied (`014_chairman_assignment.sql`)
- Application running at `localhost:3000` (or deployed URL)
- Admin account logged in

---

## Test Cases

### [TC-01] Admin can assign user as Chairman for a kegiatan

**Tujuan:** Verify admin can create chairman assignment from Master User page

**Langkah:**
1. Login sebagai ADMIN
2. Navigate ke **Admin / Master Data / Master User**
3. Klik tombol **Edit** pada salah satu user
4. Di section "Kegiatan sebagai Ketua Tim", pilih kegiatan dari dropdown
5. Klik **Simpan**

**Ekspektasi:**
- User assignment created successfully
- Chip kegiatan tampil di section tersebut
- Tabel utama menampilkan chip kegiatan di kolom "Ketua Tim"

**Status:** ⬜ Belum diuji

---

### [TC-02] User sees "Laporan Kegiatan" menu when they are a chairman

**Tujuan:** Verify conditional menu visibility based on chairman status

**Langkah:**
1. Login sebagai user PEGAWAI yang punya chairman assignment
2. Perhatikan sidebar navigation

**Ekspektasi:**
- Menu "Laporan Kegiatan" terlihat di MANAGEMENT section

**Status:** ⬜ Belum diuji

---

### [TC-03] User does NOT see "Laporan Kegiatan" menu when not a chairman

**Tujuan:** Verify menu is hidden for non-chairman users

**Langkah:**
1. Login sebagai user PEGAWAI yang TIDAK punya chairman assignment
2. Perhatikan sidebar navigation

**Ekspektasi:**
- Menu "Laporan Kegiatan" TIDAK terlihat di sidebar

**Status:** ⬜ Belum diuji

---

### [TC-04] Ajukan Dokumen auto-detects chairman status

**Tujuan:** Verify badge shows correctly based on chairman assignment

**Langkah:**
1. Login sebagai user yang punya chairman assignment di kegiatan tertentu
2. Navigate ke **Ajukan Dokumen**
3. Pilih fungsi, kemudian pilih kegiatan (yang user adalah chairman-nya)
4. Lihat step "Peran dalam Kegiatan"

**Ekspektasi:**
- Badge hijau "🏆 Anda adalah Ketua Tim di kegiatan ini" tampil
- is_ketua_tim = true saat submit

**Status:** ⬜ Belum diuji

---

### [TC-05] Ajukan Dokumen shows "Anggota" for non-chairman

**Tujuan:** Verify badge shows correctly for non-chairman users

**Langkah:**
1. Login sebagai user PEGAWAI yang TIDAK chairman di kegiatan
2. Navigate ke **Ajukan Dokumen**
3. Pilih fungsi, kemudian pilih kegiatan (yang user BUKAN chairman-nya)
4. Lihat step "Peran dalam Kegiatan"

**Ekspektasi:**
- Badge biru "🏅 Anda adalah Anggota di kegiatan ini" tampil
- is_ketua_tim = false saat submit

**Status:** ⬜ Belum diuji

---

### [TC-06] Laporan Kegiatan page shows access denied for non-chairman

**Tujuan:** Verify permission check blocks non-chairman users

**Langkah:**
1. Login sebagai user PEGAWAI yang TIDAK punya chairman assignment
2. Navigate langsung ke `/pegawai/laporan/kegiatan`

**Ekspektasi:**
- Loading spinner tampil sebentar
- Access denied screen dengan "Akses Ditolak" message
- Tombol "Kembali ke Dashboard" terlihat

**Status:** ⬜ Belum diuji

---

### [TC-07] Laporan Kegiatan page shows documents for chairman

**Tujuan:** Verify authorized user can see documents

**Langkah:**
1. Login sebagai user yang punya chairman assignment
2. Submit dokumen sebagai chairman
3. Navigate ke `/pegawai/laporan/kegiatan`

**Ekspektasi:**
- Documents tampil di tabel
- Ringkasan jumlah dokumen dan jumlah pegawai terlihat
- "Anda" badge terlihat di baris user sendiri

**Status:** ⬜ Belum diuji

---

### [TC-08] Admin can remove chairman assignment

**Tujuan:** Verify admin can delete chairman assignment

**Langkah:**
1. Login sebagai ADMIN
2. Navigate ke **Admin / Master Data / Master User**
3. Klik Edit pada user dengan chairman assignment
4. Klik X pada chip kegiatan untuk remove

**Ekspektasi:**
- Assignment deleted
- Chip tidak lagi tampil di section tersebut
- Chip tidak lagi tampil di tabel utama

**Status:** ⬜ Belum diuji

---

### [TC-09] Admin can replace existing chairman

**Tujuan:** Verify confirmation dialog appears when replacing chairman

**Langkah:**
1. Login sebagai ADMIN
2. Buat User A sebagai chairman kegiatan X
3. Buka Edit dialog User B
4. Pilih kegiatan X dari dropdown

**Ekspektasi:**
- Dialog konfirmasi "Ganti Ketua Tim?" muncul
- Menampilkan info kegiatan dan chairman lama
- "Ya, Ganti" button menghapus User A dan assign User B

**Status:** ⬜ Belum diuji

---

## API Test Cases

### [API-01] GET /api/users/me/ketua-tim

**Tujuan:** Verify user chairman endpoint returns correct data

**Langkah:**
```bash
curl -X GET http://localhost:3000/api/users/me/ketua-tim \
  -H "Cookie: sb-access-token=xxx"
```

**Ekspektasi:**
```json
{
  "is_ketua_tim": true,
  "kegiatan": [{"id": "...", "nama": "..."}]
}
```

**Status:** ⬜ Belum diuji

---

### [API-02] GET /api/users/me/is-ketua-tim/$kegiatanId

**Tujuan:** Verify chairman check endpoint

**Langkah:**
```bash
curl -X GET http://localhost:3000/api/users/me/is-ketua-tim/{kegiatan_id} \
  -H "Cookie: sb-access-token=xxx"
```

**Ekspektasi:**
```json
{"is_ketua_tim": true}
```

**Status:** ⬜ Belum diuji

---

### [API-03] POST /api/ketua-tim returns 409 for duplicate

**Tujuan:** Verify UNIQUE constraint prevents duplicate chairman

**Langkah:**
```bash
curl -X POST http://localhost:3000/api/ketua-tim/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=xxx" \
  -d '{"user_id": "xxx", "kegiatan_id": "yyy"}'
```

**Ekspektasi:**
- First call: 201 with assignment
- Second call: 409 with error and existing_chairman info

**Status:** ⬜ Belum diuji

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Database migration ran successfully | ⬜ | ⬜ | ⬜ | |
| 2 | Helper functions work (is_user_chairman, get_user_chairman_kegiatan) | ⬜ | ⬜ | ⬜ | |
| 3 | Admin can assign chairman from Master User | ⬜ | ⬜ | ⬜ | |
| 4 | Admin can remove chairman assignment | ⬜ | ⬜ | ⬜ | |
| 5 | Confirmation dialog for chairman replacement | ⬜ | ⬜ | ⬜ | |
| 6 | "Laporan Kegiatan" menu visible for chairman | ⬜ | ⬜ | ⬜ | |
| 7 | "Laporan Kegiatan" menu hidden for non-chairman | ⬜ | ⬜ | ⬜ | |
| 8 | Ajukan Dokumen shows correct badge (Chairman vs Anggota) | ⬜ | ⬜ | ⬜ | |
| 9 | Submit uses auto-detected is_ketua_tim value | ⬜ | ⬜ | ⬜ | |
| 10 | Laporan Kegiatan shows access denied for non-chairman | ⬜ | ⬜ | ⬜ | |
| 11 | Laporan Kegiatan shows documents for chairman | ⬜ | ⬜ | ⬜ | |
| 12 | Drizzle schema sync with database | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | (No bugs reported yet) | - | - | - |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan