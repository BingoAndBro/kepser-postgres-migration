# Spec: 08D — Export Excel & Agregasi per Klasifikasi

## Overview
Fitur export arsip ke Excel berdasarkan klasifikasi arsip, dengan agregasi total nominal per klasifikasi. Laporan menunjukkan jumlah arsip, total nominal realisasinya, dan detail per arsip.

---

## Background / Konteks
Setelah ada field `nominal_realisasi`, dibutuhkan fitur untuk melihat agregasi nominal per klasifikasi arsip. Fitur ini berguna untuk:
- Laporan keuangan per klasifikasi arsip
- Monitoring total nominal per kategori dokumen
- Export ke Excel untuk audit/arsip fisik

Agregasi dihitung berdasarkan: **1 laporan = 1 dokumen/arisp**, bukan berdasarkan jumlah kelengkapan dokumen.

---

## User Stories
- Sebagai **Arsiparis**, saya ingin export arsip ke Excel berdasarkan klasifikasi, agar bisa digunakan untuk laporan audit.
- Sebagai **Arsiparis**, saya ingin lihat agregasi total nominal per klasifikasi, agar tahu total anggaran per kategori.
- Sebagai **sistem**, saya ingin menghitung agregat per klasifikasi berdasarkan 1 laporan = 1 dokumen, agar data akurat.

---

## Scope — Termasuk
- **Export Excel per Klasifikasi:**
  - Pilih klasifikasi arsip dari dropdown
  - Pilih range tanggal (opsional)
  - Tombol "Export Excel"
  - File Excel berisi: Header klasifikasi + tanggal export + data agregasi
- **Agregasi Nominal:**
  - Total arsip per klasifikasi
  - Total nominal per klasifikasi
  - Grand total semua klasifikasi
- **Preview sebelum export:**
  - Tampilkan summary dulu sebelum export
  - Jumlah arsip, total nominal
- **Arsip Manual masuk agregasi:**
  - Arsip dari spec 08B (Penambahan Arsip Manual) juga masuk hitungan
  - Tandai indicator "Arsip Manual" di hasil

---

## Scope — Tidak Termasuk
- Export per fungsi/kegiatan (itu ada di spec 08E)
- Scheduled/auto-export via email
- Export format lain (CSV, PDF)

---

## User Flow

### Export Arsip per Klasifikasi
```
1. Arsiparis buka menu "Export Arsip"
       ↓
2. Filter:
   - Klasifikasi Arsip (dropdown, wajib)
   - Range Tanggal (dari - sampai, opsional)
   - Kategori Dokumen (dropdown, opsional, untuk arsip manual)
       ↓
3. Klik "Tampilkan"
       ↓
4. Sistem:
   → Query arsip WHERE klasifikasi = ? AND tanggal BETWEEN ? AND ?
   → Calculate agregasi: COUNT(*), SUM(nominal_realisasi)
       ↓
5. Tampilkan Preview:
   ┌─────────────────────────────────────────────────────────────┐
   │ Klasifikasi: Klasifikasi I - UP                              │
   │ Jumlah Arsip: 15                                            │
   │ Total Nominal: Rp 125.000.000                               │
   └─────────────────────────────────────────────────────────────┘

   Table Preview:
   ┌──────────────────────────────────────────────────────────────┐
   │ No │ Nama Arsip      │ Tanggal   │ Nominal     │ Jenis      │
   ├────┼─────────────────┼───────────┼─────────────┼────────────┤
   │ 1  │ Honorarium...   │ 15/01/25  │ 5.000.000   │ Dokumen    │
   │ 2  │ Perjalanan...   │ 20/01/25  │ 10.000.000  │ Dokumen    │
   │ 3  │ Pembelian ATK   │ 25/01/25  │ 500.000     │ Manual     │
   └──────────────────────────────────────────────────────────────┘
       ↓
6. Klik "Export Excel"
       ↓
7. Sistem generate + download file .xlsx
```

### Agregasi Keseluruhan
```
1. Arsiparis buka halaman agregasi
       ↓
2. Pilih range tahun (opsional)
       ↓
3. Sistem hitung:
   - Per klasifikasi: COUNT, SUM(nominal)
   - Grand total: SUM semua klasifikasi
       ↓
4. Tampilkan summary table:
   ┌──────────────────────────────────────────────────────────────┐
   │ Klasifikasi           │ Jumlah Arsip │ Total Nominal        │
   ├───────────────────────┼──────────────┼──────────────────────┤
   │ Klasifikasi I - UP    │ 15           │ Rp 125.000.000       │
   │ Klasifikasi II - GUP  │ 8            │ Rp 80.000.000        │
   │ Klasifikasi III - ... │ ...          │ ...                  │
   ├───────────────────────┼──────────────┼──────────────────────┤
   │ GRAND TOTAL           │ 50           │ Rp 500.000.000       │
   └──────────────────────────────────────────────────────────────┘
```

---

## Data / Model / Schema

### Query untuk Agregasi
```sql
-- Agregasi per klasifikasi
SELECT
  a.klasifikasi,
  COUNT(*) as jumlah_arsip,
  SUM(a.nominal_realisasi) as total_nominal
FROM arsip a
WHERE a.is_ditolak = false
  AND a.status_arsip IN ('AKTIF', 'INAKTIF')
GROUP BY a.klasifikasi
ORDER BY a.klasifikasi;

-- Detail per klasifikasi
SELECT
  a.id, a.nama, a.tanggal, a.nominal_realisasi,
  a.is_manual_entry,
  k.nama as kategori
FROM arsip a
LEFT JOIN kategori_dokumen_arsip k ON a.kategori_id = k.id
WHERE a.klasifikasi = ?
ORDER BY a.tanggal DESC;
```

---

## API / Server Functions

```typescript
// src/routes/api/arsiparis/agregasi.ts
// GET /api/arsiparis/agregasi
//   Query: ?tahun?, ?dari?, ?sampai?
//   → agregasi per klasifikasi: { klasifikasi, jumlah_arsip, total_nominal }
//   → grand_total: { jumlah_arsip, total_nominal }

// GET /api/arsiparis/agregasi/[klasifikasi]
//   Query: ?dari?, ?sampai?, ?kategori_id?
//   → detail arsip per klasifikasi
//   → return: arsip list dengan nominal

// GET /api/arsiparis/export/[klasifikasi]
//   Query: ?dari?, ?sampai?
//   → generate Excel file
//   → Content-Disposition: attachment; filename="arsip-[klasifikasi]-[tanggal].xlsx"
//   → Library: xlsx (SheetJS) atau exceljs

// POST /api/arsiparis/export-batch
//   Body: { klasifikasi_ids: uuid[] }
//   → export multiple klasifikasi dalam 1 file (multiple sheets)
```

---

## UI / Frontend

### Routes
```
/arsiparis/agregasi             → Halaman agregasi + export
/arsiparis/export               → Halaman export per klasifikasi
```

### Pages

**1. Agregasi Arsip (`/arsiparis/agregasi`)**
- Filter: Tahun (dropdown), Range Tanggal (date picker)
- Tombol: [Tampilkan]
- Summary Table: Klasifikasi | Jumlah Arsip | Total Nominal
- Footer: GRAND TOTAL row
- Tombol: [Export Semua ke Excel]

**2. Export per Klasifikasi (`/arsiparis/export`)**
- Filter Sidebar:
  - Klasifikasi Arsip (dropdown, wajib)
  - Range Tanggal (date range picker)
  - Kategori Dokumen (dropdown, untuk arsip manual)
- Tombol: [Tampilkan] [Export Excel]
- Preview Table:
  - Kolom: No, Nama Arsip, Tanggal, Nominal, Kategori, Jenis (Dokumen/Manual)
  - Summary: Jumlah Arsip, Total Nominal
- Empty state: "Tidak ada arsip untuk klasifikasi ini"

### Excel Output Format
```
┌─────────────────────────────────────────────────────────────────┐
│                    LAPORAN ARSIP PER KLASIFIKASI                 │
│ Klasifikasi: Klasifikasi I - UP                                  │
│ Tanggal Export: 15 Mei 2025                                      │
│ Period: 1 Januari 2025 - 31 Desember 2025                      │
├─────────────────────────────────────────────────────────────────┤
│ No │ Nama Arsip          │ Tanggal   │ Nominal     │ Jenis      │
├─────────────────────────────────────────────────────────────────┤
│ 1  │ Honorarium Staff   │ 15/01/25  │ 5.000.000   │ Dokumen    │
│ 2  │ Perjalanan Dinas   │ 20/01/25  │ 10.000.000  │ Dokumen    │
├─────────────────────────────────────────────────────────────────┤
│                              Jumlah: 2         │ 15.000.000     │
└─────────────────────────────────────────────────────────────────┘
```

### Komponen UI
- `AgregasiSummaryTable` — table agregasi dengan grand total
- `ExportPreview` — preview data sebelum export
- `ExportButton` — button dengan loading state
- `DateRangePicker` — date range selector

---

## Logic / Business Rules
- **1 Laporan = 1 Arsip:** Agregasi dihitung berdasarkan jumlah record di tabel `arsip`, bukan jumlah kelengkapan dokumen
- **Exclude ditolak:** Arsip dengan `is_ditolak = true` TIDAK masuk agregasi
- **Nominal NULL = 0:** Jika nominal NULL, treat sebagai 0 dalam agregasi
- **Arsip Manual termasuk:** Arsip dari spec 08B (is_manual_entry = true) masuk dalam hitungan
- **Date range inclusive:** Tanggal dari dan sampai inclusive
- **Grand Total:** Selalu tampil di footer table agregasi

---

## Dependensi
- **Bergantung pada:** Spec 08A (Nominal Realisasi), Spec 08B (Penambahan Arsip)
- **Dibutuhkan oleh:** —

---

## Definition of Done
- [ ] Arsiparis bisa lihat agregasi per klasifikasi (jumlah arsip + total nominal)
- [ ] Arsiparis bisa lihat grand total semua klasifikasi
- [ ] Arsiparis bisa export Excel per klasifikasi
- [ ] Excel format sesuai template (header info + table data + summary)
- [ ] Arsip manual (is_manual_entry = true) masuk dalam agregasi
- [ ] Arsip yang ditolak (is_ditolak = true) TIDAK masuk agregasi
- [ ] Filter tahun dan range tanggal berfungsi
- [ ] Arsip dengan nominal NULL dihitung sebagai 0