# Implementation Plan: SPEC 07 — Chairman Assignment

## Overview

Fitur ini memungkinkan admin untuk assign user sebagai "Ketua Tim" (Chairman) pada kegiatan tertentu. Sistem secara otomatis mendeteksi apakah user chairman atau anggota berdasarkan `ketua_tim_assignments` table, menampilkan badge di Ajukan Dokumen, dan mengatur menu "Laporan Kegiatan" hanya untuk chairman.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  AppLayout.tsx                                                   │
│  ├── Cek /api/users/me/ketua-tim saat mount                     │
│  ├── Conditionally render "Laporan Kegiatan" menu                │
│  └── Pass chairman status ke child components                   │
│                                                                  │
│  Ajukan Dokumen (pegawai/dokumen/aju.tsx)                        │
│  ├── User pilih kegiatan                                         │
│  ├── Fetch /api/users/me/is-ketua-tim/[kegiatan_id]             │
│  ├── Auto-set is_ketua_tim berdasarkan response                  │
│  ├── Tampilkan badge "Ketua Tim" / "Anggota"                    │
│  └── Hilangkan toggle button peran manual                       │
│                                                                  │
│  Master User (admin/master-data/user.tsx)                       │
│  ├── Tampilkan kolom "Kegiatan Ketua Tim"                       │
│  ├── Edit popup: section "Kegiatan sebagai Ketua Tim"            │
│  │   ├── Chip kegiatan yang di-assign (dengan X untuk remove)   │
│  │   ├── Dropdown "Tambah Kegiatan" (kegiatan tanpa chairman)    │
│  │   └── Confirmation dialog saat replace chairman              │
│  └── Create popup: section opsional chairman assignment         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  /api/ketua-tim/                                                │
│  ├── GET  → List semua assignments (ADMIN)                     │
│  ├── POST → Create assignment (ADMIN)                          │
│  │           Validation: kegiatan_id belum punya chairman       │
│  │           Jika sudah ada: return 409 + data chairman lama    │
│  └── DELETE /[id] → Remove assignment (ADMIN)                  │
│                                                                  │
│  /api/ketua-tim/user/[user_id]                                  │
│  └── GET → Get semua kegiatan chairman user tertentu (ADMIN)   │
│                                                                  │
│  /api/ketua-tim/kegiatan/[kegiatan_id]                          │
│  └── GET → Get chairman kegiatan tertentu (ADMIN)               │
│                                                                  │
│  /api/users/me/ketua-tim                                        │
│  └── GET → Get kegiatan chairman current user (Authenticated)   │
│                                                                  │
│  /api/users/me/is-ketua-tim/[kegiatan_id]                       │
│  └── GET → Cek apakah current user chairman di kegiatan         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
├─────────────────────────────────────────────────────────────────┤
│  Tabel: ketua_tim_assignments                                    │
│  ├── id (UUID, PK)                                              │
│  ├── user_id (UUID, FK → auth.users)                            │
│  ├── kegiatan_id (UUID, FK → master_kegiatan)                   │
│  ├── created_at (TIMESTAMPTZ)                                   │
│  ├── created_by (UUID, FK → auth.users)                         │
│  ├── UNIQUE(kegiatan_id) — 1 kegiatan = 1 chairman              │
│  └── Indexes: user_id, kegiatan_id                              │
│                                                                  │
│  Functions:                                                     │
│  ├── is_user_chairman(p_user_id, p_kegiatan_id) → BOOLEAN       │
│  └── get_user_chairman_kegiatan(p_user_id) → TABLE              │
│                                                                  │
│  RLS:                                                           │
│  ├── SELECT: authenticated                                       │
│  ├── INSERT/UPDATE/DELETE: ADMIN only                            │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Database Migration
**What:** Buat tabel `ketua_tim_assignments` dan helper functions

**Why:** Fondasi data untuk seluruh fitur. Tanpa ini, tidak ada tempat menyimpan chairman assignments.

**How:**
- Buat `014_chairman_assignment.sql`
- Create table dengan UNIQUE(kegiatan_id) constraint
- Create indexes untuk query performance
- Create RLS policies (SELECT for authenticated, ALL for ADMIN)
- Create helper functions `is_user_chairman()` dan `get_user_chairman_kegiatan()`

**Files affected:**
- `supabase/migrations/014_chairman_assignment.sql`

**Dependencies:** Tidak ada (baseline)

---

### Step 2: API Endpoints - Chairman Assignment CRUD
**What:** Implementasi API endpoints untuk CRUD operations pada chairman assignments

**Why:** Admin butuh ability untuk create, read, delete assignments. API ini akan digunakan oleh Master User page.

**How:**
- Create `/api/ketua-tim/index.ts` untuk GET (list) dan POST (create)
- Create `/api/ketua-tim/[id].ts` untuk DELETE
- Create `/api/ketua-tim/user/[user_id].ts` untuk get user assignments
- Create `/api/ketua-tim/kegiatan/[kegiatan_id].ts` untuk get kegiatan chairman
- Validation: cek apakah kegiatan sudah punya chairman (return 409 + data lama)
- Authorization: semua endpoints ADMIN only, kecuali GET by user yang menggunakan getServerSession

**Files affected:**
- `src/routes/api/ketua-tim/index.ts`
- `src/routes/api/ketua-tim/[id].ts`
- `src/routes/api/ketua-tim/user/[user_id].ts`
- `src/routes/api/ketua-tim/kegiatan/[kegiatan_id].ts`

**Dependencies:** Step 1 (migration harus selesai)

---

### Step 3: API Endpoints - User Chairman Check
**What:** Implementasi endpoints untuk user mengecek status chairman mereka sendiri

**Why:** Frontend butuh ability untuk cek apakah current user chairman di kegiatan tertentu, dan mendapat list kegiatan chairman untuk menu visibility.

**How:**
- Create `/api/users/me/ketua-tim` → return `{ is_ketua_tim: boolean, kegiatan: [...] }`
- Create `/api/users/me/is-ketua-tim/[kegiatan_id]` → return `{ is_ketua_tim: boolean }`
- Authenticated users only

**Files affected:**
- `src/routes/api/users/me/ketua-tim.ts` (edit if exists, or create)
- `src/routes/api/users/me/is-ketua-tim/[kegiatan_id].ts`

**Dependencies:** Step 1 (functions harus ada)

---

### Step 4: Update Master User Page - Display
**What:** Update tabel Master User untuk menampilkan kolom "Kegiatan Ketua Tim"

**Why:** Admin perlu melihat siapa chairman di kegiatan apa saat view list user.

**How:**
- Fetch chairman assignments saat load user list
- Tampilkan chip/badge per kegiatan di kolom baru
- Jika user tidak punya chairman: tampilkan "-"
- Gunakan endpoint `/api/ketua-tim/user/[user_id]` per user, atau batch fetch

**Files affected:**
- `src/routes/admin.master-data.user.tsx`

**Dependencies:** Step 2 (API endpoints)

---

### Step 5: Update Master User Page - Edit/Create Dialog
**What:** Update Edit User dialog dengan section "Kegiatan sebagai Ketua Tim"

**Why:** Admin perlu ability untuk add/remove chairman assignments dari halaman yang sama.

**How:**
- Add section di Edit User dialog:
  - Chip kegiatan yang sudah di-assign (dengan button X untuk remove)
  - Dropdown "Tambah Kegiatan" — hanya tampilkan kegiatan yang belum punya chairman
  - Info text: "Satu kegiatan hanya boleh memiliki 1 ketua tim"
- Handle confirmation dialog saat kegiatan sudah punya chairman:
  - Show dialog: "Apakah anda yakin menunjuk 'X' sebagai chairman kegiatan 'Y'? Ini akan menggantikan 'Z'"
  - If confirmed: delete old assignment, create new
- Add section yang sama di Create User dialog (optional)

**Files affected:**
- `src/routes/admin.master-data.user.tsx`

**Dependencies:** Step 2 (API endpoints), Step 4

---

### Step 6: Update AppLayout - Conditional Menu
**What:** Update navigation untukconditionally render "Laporan Kegiatan"

**Why:** Menu harus hanya tampil untuk user yang punya hak chairman, sesuai spec.

**How:**
- Saat AppLayout mount, fetch `/api/users/me/ketua-tim`
- Simpan result di state `chairmanKegiatan`
- Conditionally add "Laporan Kegiatan" ke NAV_CONFIG jika `chairmanKegiatan.length > 0`
- Jika user logout/login, refetch data

**Files affected:**
- `src/components/layout/AppLayout.tsx`

**Dependencies:** Step 3 (API endpoint)

---

### Step 7: Update Ajukan Dokumen - Auto-detect & Badge
**What:** Update halaman Ajukan Dokumen untuk auto-detect peran dan tampilkan badge

**Why:** User harus tahu apakah mereka chairman atau anggota di kegiatan yang dipilih, dan sistem harus auto-set peran.

**How:**
- Remove toggle button "Ketua Tim / Anggota" (manual selection dihapus)
- Setelah user pilih kegiatan di step 3/4:
  - Fetch `/api/users/me/is-ketua-tim/[kegiatan_id]`
  - Auto-set `is_ketua_tim` state berdasarkan response
- Tampilkan badge setelah kegiatan dipilih:
  - Jika `is_ketua_tim = true`: Badge hijau "🏆 Anda adalah Ketua Tim di kegiatan ini"
  - Jika `is_ketua_tim = false`: Badge biru "🏅 Anda adalah Anggota di kegiatan ini"
- Badge hilang di step Upload (hanya tampil setelah pilih kegiatan, hilang setelah lanjut)
- Update step label: hapus step "Peran dalam Kegiatan" (otomatis)

**Files affected:**
- `src/routes/pegawai/dokumen/aju.tsx`

**Dependencies:** Step 3 (API endpoint)

---

### Step 8: Update Ajukan Dokumen - Form Submission
**What:** Update form submission untuk auto-set `is_ketua_tim` berdasarkan kegiatan

**Why:** Pastikan dokumen submitted dengan role yang benar (chairman/anggota).

**How:**
- Remove user selection untuk `is_ketua_tim`
- Saat submit, cek `is_ketua_tim` state (sudah di-set otomatis)
- Submit dengan `is_ketua_tim = true/false` sesuai auto-detect
- Validation: pastikan `is_ketua_tim` tidak null/undefined

**Files affected:**
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/lib/schemas/dokumen.ts` (update schema if needed)

**Dependencies:** Step 7

---

### Step 9: Update Laporan Kegiatan - Permission Check
**What:** Pastikan halaman Laporan Kegiatan hanya bisa diakses oleh chairman

**Why:** Security — user tidak seharusnya bisa akses halaman yang bukan haknya.

**How:**
- Di page component, fetch `/api/users/me/ketua-tim`
- Jika `kegiatan.length === 0`, redirect atau show "Access denied"
- Atau handle di route level dengan guard

**Files affected:**
- `src/routes/pegawai/laporan/kegiatan.tsx`

**Dependencies:** Step 3 (API endpoint)

---

### Step 10: Drizzle Schema Update (Optional)
**What:** Update Drizzle schema untuk include `ketua_tim_assignments` table

**Why:** Jika project menggunakan Drizzle untuk type-safe database operations.

**How:**
- Add table definition in `src/lib/db/schema.ts`
- Add any helper functions if needed

**Files affected:**
- `src/lib/db/schema.ts`

**Dependencies:** Step 1 (migration)

---

## Edge Cases & Error Handling

| Edge Case | Handling |
|-----------|----------|
| Kegiatan sudah punya chairman saat assign | Return 409 Conflict dengan data chairman lama, frontend show confirmation dialog |
| User mencoba assign dirinya sendiri | Validasi di API, check `user_id !== current_user_id` |
| kegiatan_id tidak valid | Return 400 dengan message yang jelas |
| Concurrent assignment (two admins) | UNIQUE constraint akan reject, handle dengan retry atau show error |
| User tidak ada di kegiatan chairman manapun | Badge "Anggota" selalu tampil |
| User chairman di banyak kegiatan | Auto-set sesuai kegiatan yang dipilih |

## Integration Points

| Component | Integration |
|-----------|-------------|
| `ketua_tim_assignments` → `master_kegiatan` | FK constraint, cascade delete |
| `ketua_tim_assignments` → `auth.users` | FK constraint, cascade delete |
| Ajukan Dokumen → Badge | Fetch ke API, auto-set state |
| AppLayout → Menu | Fetch ke API, conditional render |
| Master User → Edit Dialog | CRUD via API endpoints |

## Migration / Compatibility Notes

1. **Backward compatible:** Perubahan ini tidak break existing functionality
2. **Data migration:** Tidak ada data migration needed — tabel baru kosong
3. **Feature flag:** Tidak perlu feature flag — langsung aktifkan

## Open Questions (Resolved)

1. **Auto-detect vs manual:** ✓ Auto-detect menggunakan API check
2. **Chairman bisa submit sebagai anggota:** ✓ Tidak di kegiatannya sendiri, ya di kegiatan lain
3. **Badge location:** ✓ Hanya di Ajukan Dokumen
4. **Replace chairman:** ✓ Dengan confirmation dialog
5. **Unlimited assignments:** ✓ No limit
6. **User max chairman:** ✓ No limit

---

*Plan version: 1.0*
*Created: 2026-05-03*