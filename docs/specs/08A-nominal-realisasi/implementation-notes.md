# Implementation Notes: 08A — Nominal Realisasi Foundation

## What Was Built

Fondasi database dan API untuk menyimpan `nominal_realisasi` pada dokumen transaksi. Kolom baru ini menjadi fondasi untuk seluruh fitur di spec 08 (08B-08E).

## Files Created/Modified

### Created
| File | Deskripsi |
|------|-----------|
| `supabase/migrations/016_nominal_realisasi.sql` | SQL migration untuk menambah kolom |
| `src/routes/api/dokumen/$id.nominal.ts` | Endpoint PATCH untuk update nominal |

### Modified
| File | Deskripsi |
|------|-----------|
| `src/lib/db/schema.ts` | Tambah `nominalRealisasi` dan `isNonMaterial` |
| `src/lib/schemas/dokumen.ts` | Tambah Zod schemas dan validation helper |
| `src/lib/dokumen-helpers.ts` | Update DokumenRow type dan CRUD functions |
| `src/routes/api/dokumen/submit.ts` | Validasi nominal saat submit + propagasi |
| `src/routes/api/arsiparis/dokumen.$id.archive.ts` | Copy nominal ke arsip saat archive |

## Key Decisions

1. **is_non_material** adalah flag manual oleh user saat submit
2. **nominal_realisasi** input manual, bukan kalkulasi
3. **Default database** adalah 0 untuk Material (via body parsing)
4. **Validation logic** di-handle oleh `validateNominalForMaterial()` helper

## API Changes

### POST /api/dokumen/submit
- Body新增: `nominal_realisasi` (number, nullable), `is_non_material` (boolean)
- Validasi: Material = wajib nominal > 0
- Schema: `createAndSubmitDokumenSchema` (replaces `createDokumenSchema`)

### PATCH /api/dokumen/$id/nominal (NEW)
- Authorization: creator, arsiparis, SUPERADMIN, ADMIN
- Body: `{ nominal_realisasi?, is_non_material? }`
- Audit log: aksi = `UPDATE_NOMINAL`

### POST /api/arsiparis/dokumen/$id/archive
- Propagasi: `nominal_realisasi` di-copy ke tabel arsip

## How to Use

1. **Run migration** di Supabase:
   ```bash
   psql -f supabase/migrations/016_nominal_realisasi.sql
   ```

2. **Submit dokumen** dengan field baru:
   ```json
   {
     "fungsiId": "uuid",
     "kegiatanJenisId": "uuid",
     "isKetuaTim": false,
     "tahun": 2026,
     "tanggal": "2026-05-04",
     "lampiranUrls": [...],
     "nominal_realisasi": 100000,
     "is_non_material": false
   }
   ```

3. **Update nominal** via endpoint baru:
   ```json
   PATCH /api/dokumen/[id]/nominal
   { "nominal_realisasi": 150000 }
   ```

## Known Deviations from Plan

1. **Schema default:** Tidak menggunakan `.default(0)` di Drizzle karena type incompatibility. Default 0 di-handle di application layer (submit handler).
2. **File naming:** Endpoint nominal menggunakan `$id.nominal.ts` (bukan `[id]/nominal.ts`) sesuai existing pattern project.

## Commits

(nama commit akan di-generate setelah user melakukan commit)

---

## Next Steps (Spec 08B-08E)

Dengan fondasi ini selesai, spec lain dapat dimulai:

- **08B (Arsip Manual):** Gunakan schema dan validation yang sama untuk arsip manual
- **08C (Non-Material):** Logic sudah di-implementasi di `validateNominalForMaterial`
- **08D (Export Excel):** Baca `nominal_realisasi` dari database
- **08E (Kinerja):** Agregasi `nominal_realisasi` untuk laporan