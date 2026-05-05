# Implementation Plan: 08A — Nominal Realisasi Foundation

## Overview

Fondasi database dan API untuk menyimpan `nominal_realisasi` pada dokumen transaksi. Implementasi meliputi: SQL migration untuk menambah kolom, update Drizzle schema, Zod validation schemas, dan API endpoint untuk submit/update nominal. Validasi business logic memastikan dokumen Material wajib punya nominal, sementara Non-Material bersifat opsional.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Form)                      │
│  - Toggle is_non_material                                   │
│  - Input nominal_realisasi (jika Material)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ POST /api/dokumen/submit
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Server Handler                       │
│  - Zod validation (body)                                   │
│  - Business logic: check is_non_material                    │
│  - Validate nominal_realisasi required for Material         │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐  ┌──────────────────────────────┐
│   dokumen_transaksi    │  │           arsip                │
│  - nominal_realisasi   │  │  - nominal_realisasi          │
│  - is_non_material     │  │    (copy dari dokumen atau     │
│                        │  │     input manual arsiparis)   │
└────────────────────────┘  └──────────────────────────────┘
```

### Data Flow

1. **Create dokumen (submit):** User set `is_non_material` + `nominal_realisasi` → API validasi → simpan ke `dokumen_transaksi`
2. **Update nominal:** User/PK/Arsiparis update `nominal_realisasi` → validasi role → update database
3. **Archive dokumen:** `nominal_realisasi` di-copy ke `arsip` saat `ARCHIVE` transition
4. **Arsip manual:** Arsiparis input `nominal_realisasi` langsung (opsional)

## Implementation Steps

### Step 1: SQL Migration

**What:** Tambahkan kolom `nominal_realisasi` dan `is_non_material` ke tabel terkait.

**Why:** Kolom-kolom ini belum ada di database. Migration adalah langkah pertama sebelum aplikasi bisa menggunakan field baru.

**How:**
- Buat file `016_nominal_realisasi.sql` di folder `supabase/migrations/`
- Gunakan pattern idempotent: `ADD COLUMN IF NOT EXISTS`
- Tambahkan CHECK constraint untuk memastikan nominal >= 0
- Format header dengan deskripsi dan timestamp

**Files affected:**
- `supabase/migrations/016_nominal_realisasi.sql` — new file

**Dependencies:** None (step pertama)

---

### Step 2: Update Drizzle Schema

**What:** Update TypeScript schema untuk mencerminkan kolom baru.

**Why:** Drizzle schema adalah source of truth untuk type-checking di seluruh aplikasi. Tanpa update ini, TypeScript tidak akan recognize kolom baru.

**How:**
- Edit `src/lib/db/schema.ts`
- Tambah field `nominalRealisasi` (numeric type) ke tabel `dokumenTransaksi`
- Tambah field `isNonMaterial` (boolean type) ke tabel `dokumenTransaksi`
- Tambah field `nominalRealisasi` ke tabel `arsip`
- Gunakan pattern yang sudah ada untuk numeric fields (precision: 15, scale: 2)

**Files affected:**
- `src/lib/db/schema.ts` — modify

**Dependencies:** Step 1 (migration harus bisa di-run terlebih dahulu)

---

### Step 3: Create Zod Validation Schema

**What:** Buat Zod schema untuk validasi input nominal_realisasi dan is_non_material.

**Why:** Schema validation memastikan data yang masuk sudah sesuai format sebelum diproses business logic. Menggunakan Zod sesuai pattern existing codebase.

**How:**
- Edit atau buat file di `src/lib/schemas/dokumen.ts`
- Tambah schema untuk update nominal:
  - `nominal_realisasi`: number, min 0, max 999999999999, nullable
  - `is_non_material`: boolean, default false
- Pattern: gunakan `z.object()` dengan field yang jelas dan error messages

**Files affected:**
- `src/lib/schemas/dokumen.ts` — modify

**Dependencies:** None (bisa parallel dengan step lain)

---

### Step 4: Update Submit Handler

**What:** Modifikasi endpoint submit dokumen untuk menerima dan memvalidasi field baru.

**Why:** Endpoint submit adalah entry point utama untuk membuat dokumen. Validasi nominal harus terjadi di sini agar tidak ada dokumen Material tanpa nominal.

**How:**
- Edit `src/routes/api/dokumen/submit.ts` (atau handler terkait)
- Tambah parsing `is_non_material` dan `nominal_realisasi` dari request body
- Tambahkan validation logic:
  - Jika `is_non_material = false` → `nominal_realisasi` harus ada dan > 0
  - Jika `is_non_material = true` → `nominal_realisasi` boleh null
- Simpan ke database dengan kolom baru

**Files affected:**
- `src/routes/api/dokumen/submit.ts` — modify

**Dependencies:** Step 1, 2, 3

---

### Step 5: Create Update Nominal Endpoint

**What:** Buat endpoint terpisah untuk update `nominal_realisasi` setelah dokumen dibuat.

**Why:** User mungkin perlu mengoreksi nominal setelah submit. Endpoint ini memungkinkan update dengan authorization check.

**How:**
- Buat `src/routes/api/dokumen/[id]/nominal.ts`
- Handler PATCH untuk update nominal_realisasi
- Validasi:
  - Role check: creator, arsiparis, atau superadmin
  - Jika dokumen bukan Non-Material, nominal harus terisi setelah update
- Insert log_aktivitas untuk audit trail

**Files affected:**
- `src/routes/api/dokumen/[id]/nominal.ts` — new file

**Dependencies:** Step 1, 2, 3

---

### Step 6: Update Archive Handler

**What:** Modifikasi handler archive untuk meng-copy nominal_realisasi ke tabel arsip.

**Why:** Spec menyebutkan propagasi ke arsip saat dokumen diarsipkan. Ini memastikan arsip memiliki data nominal yang sesuai.

**How:**
- Edit `src/routes/api/arsiparis/dokumen.[id].archive.ts`
- Saat insert ke tabel `arsip`, copy `nominal_realisasi` dari `dokumen_transaksi`
- Pastikan field ini ada di insert payload

**Files affected:**
- `src/routes/api/arsiparis/dokumen.[id].archive.ts` — modify

**Dependencies:** Step 1, 2

---

### Step 7: Create Document Update Helper

**What:** Update `dokumen-helpers.ts` untuk support field baru.

**Why:** Helper functions adalah abstraction layer untuk operasi database. Dengan update ini, komponen lain bisa menggunakan helper tanpa perlu tahu detail SQL.

**How:**
- Edit `src/lib/dokumen-helpers.ts`
- Update `updateDokumen` function untuk menerima parameter baru
- Update `createDokumen` function untuk menerima parameter baru

**Files affected:**
- `src/lib/dokumen-helpers.ts` — modify

**Dependencies:** Step 1, 2

---

## Edge Cases & Error Handling

1. **User kirim nominal negatif:**
   - Zod validation akan reject dengan error "Nominal tidak boleh negatif"
   - Return 400 dengan detail error

2. **User submit Material tanpa nominal:**
   - API check `is_non_material = false` dan `nominal_realisasi` is null/0
   - Return 400 dengan error "Nominal_realisasi wajib untuk dokumen Material"

3. **User set is_non_material = true tapi kirim nominal:**
   - Validasi pass (nominal opsional untuk Non-Material)
   - Simpan nominal yang dikirim (bisa berguna untuk reference)

4. **Update nominal pada dokumen yang sudah archived:**
   - Check status dokumen sebelum update
   - Jika ARCHIVED, return 400 "Tidak bisa update dokumen yang sudah diarsipkan"

5. **Concurrent update:**
   - Gunakan optimistic locking atau check current step
   - Jika dokumen sedang dalam proses approval, update mungkin perlu authorization khusus

6. **Existing documents dengan NULL nominal:**
   - Migration default 0, tapi existing data masih NULL
   - Validator tetap strict — user harus update agar bisa submit/proceed

---

## Integration Points

1. **Spec 08B (Arsip Manual):** Handler arsip manual akan menggunakan schema yang sama untuk validasi input nominal
2. **Spec 08C (Non-Material):** Logic validasi Material akan digunakan kembali
3. **Spec 08D (Export Excel):** Kolom nominal_realisasi akan dibaca dari database
4. **Spec 08E (Kinerja):** Aggregasi nominal akan dibaca dari database

---

## Migration / Compatibility Notes

1. **Backward compatibility:** Existing documents tetap bisa diakses. Kolom baru memiliki default values.
2. **No breaking change:** API lama tetap berfungsi. Field baru adalah optional addition.
3. **Migration order:** Pastikan migration di-run sebelum deployment code baru.
4. **Schema sync:** Drizzle schema harus di-sync dengan database state setelah migration.

---

## Open Questions

1. **Apakah perlu endpoint terpisah untuk toggle is_non_material?** — Saat ini di-handle saat submit/update. Jika perlu, bisa tambah dedicated endpoint.
2. **Apakah perlu history tracking untuk perubahan nominal?** — Sudah menggunakan log_aktivitas. Jika butuh detail lebih (misalnya: sebelum/sesudah), perlu enhancement.
3. **Apakah format input nominal perlu thousand separator handling?** — Frontend concern, tapi koordinasi dengan tim frontend diperlukan.

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/016_nominal_realisasi.sql` | Create | Database schema |
| `src/lib/db/schema.ts` | Modify | Drizzle types |
| `src/lib/schemas/dokumen.ts` | Modify | Zod validation |
| `src/lib/dokumen-helpers.ts` | Modify | DB helpers |
| `src/routes/api/dokumen/submit.ts` | Modify | Submit handler |
| `src/routes/api/dokumen/[id]/nominal.ts` | Create | Update nominal endpoint |
| `src/routes/api/arsiparis/dokumen.[id].archive.ts` | Modify | Archive handler |