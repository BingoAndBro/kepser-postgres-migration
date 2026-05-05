# Spec: 08E — Role Penanggung Jawab Kinerja

## Overview
Menambahkan role baru "Penanggung Jawab Kinerja" yang memiliki akses eksklusif ke menu "Laporan Kinerja". Menu ini menampilkan seluruh dokumen dengan status "Selesai" (COMPLETED) tanpa terkecuali, termasuk Non-Material. Laporan disajikan dalam bentuk hierarki: Fungsi → Kegiatan → Detail Dokumen, dengan agregasi nominal per fungsi dan kegiatan.

---

## Background / Konteks
Sistem saat ini sudah punya "Laporan Saya" (milik pegawai sendiri) dan "Laporan Kegiatan" (milik kepala fungsi). Role baru ini khusus untuk penanggung jawab kinerja yang butuh visibility ke **seluruh dokumen selesai** di organisasi, tidak terbatas pada fungsi tertentu.

Laporan hierarkis:
- **Fungsi** — summary per fungsi (jumlah dokumen, total nominal)
- **Kegiatan** — summary per kegiatan di dalam fungsi
- **Detail** — list dokumen per kegiatan dengan filter tambahan

---

## User Stories
- Sebagai **Penanggung Jawab Kinerja**, saya ingin lihat seluruh dokumen dengan status "Selesai", agar saya bisa monitoring kinerja secara keseluruhan.
- Sebagai **Penanggung Jawab Kinerja**, saya ingin filter berdasarkan Fungsi, Kegiatan, Jenis, Detail, Tahun, Tanggal, Pengaju, dan Kategori, agar laporan sesuai kebutuhan.
- Sebagai **Penanggung Jawab Kinerja**, saya ingin lihat agregasi nominal per Fungsi dan Kegiatan, agar tahu total anggaran per unit.
- Sebagai **sistem**, saya ingin Non-Material juga masuk Laporan Kinerja, agar laporan lengkap.

---

## Scope — Termasuk
- **Role "PENANGGUNG_JAWAB_KINERJA":**
  - Role baru dengan menu tunggal "Laporan Kinerja"
  - Tidak punya menu lain (arsiparis, approval, dll)
- **Menu Laporan Kinerja:**
  - Hierarki: Fungsi → Kegiatan → Detail Dokumen
  - Agregasi per Fungsi: jumlah dokumen, total nominal
  - Agregasi per Kegiatan: jumlah dokumen, total nominal
  - Detail dokumen dengan nominal_realisasi
- **Filter:**
  - Fungsi (dropdown)
  - Kegiatan (dropdown, reactive)
  - Jenis Permintaan (dropdown)
  - Detail Permintaan / Leaf Node (dropdown)
  - Tahun (input)
  - Tanggal Range (dari - sampai)
  - Pengaju (dropdown/list user)
  - Kategori: Material / Non-Material (toggle)
- **Data lengkap:**
  - Seluruh dokumen status COMPLETED
  - Termasuk Non-Material
  - Termasuk dokumen dari semua fungsi

---

## Scope — Tidak Termasuk
- Export Excel di menu ini (ada di spec 08D)
- Approval/review dokumen
- CRUD arsip
- Akses ke menu role lain

---

## User Flow

### Akses Laporan Kinerja
```
1. User login dengan role PENANGGUNG_JAWAB_KINERJA
       ↓
2. Landing page → Langsung ke "Laporan Kinerja"
       ↓
3. Default view: Summary per Fungsi
   ┌─────────────────────────────────────────────────────────────────┐
   │ Laporan Kinerja                                                  │
   ├─────────────────────────────────────────────────────────────────┤
   │ Filter: [Fungsi ▼] [Kegiatan ▼] [Jenis ▼] ... [Terapkan]        │
   ├─────────────────────────────────────────────────────────────────┤
   │ FUNGSI                      │ JUMLAH │ TOTAL NOMINAL           │
   ├──────────────────────────────┼────────┼──────────────────────────┤
   │ 📁 Sosial                   │ 25     │ Rp 250.000.000          │
   │ 📁 Distribusi               │ 18     │ Rp 180.000.000          │
   │ 📁 Neraca                   │ 12     │ Rp 120.000.000          │
   └──────────────────────────────┴────────┴──────────────────────────┘
       ↓
4. Klik Fungsi "Sosial" → Drill down ke Kegiatan
   ┌─────────────────────────────────────────────────────────────────┐
   │ 📁 Sosial >                                                        │
   ├─────────────────────────────────────────────────────────────────┤
   │ KEGIATAN                    │ JUMLAH │ TOTAL NOMINAL           │
   ├──────────────────────────────┼────────┼──────────────────────────┤
   │ 📁 SAKERNAS                  │ 15     │ Rp 150.000.000          │
   │ 📁 SUSENAS                   │ 10     │ Rp 100.000.000          │
   └──────────────────────────────┴────────┴──────────────────────────┘
       ↓
5. Klik Kegiatan "SAKERNAS" → Detail Dokumen
   ┌─────────────────────────────────────────────────────────────────┐
   │ 📁 Sosial > 📁 SAKERNAS >                                          │
   ├─────────────────────────────────────────────────────────────────┤
   │ Filter tambahan: [Pengaju ▼] [Tahun ▼] [Kategori ▼] [🔍 Cari]    │
   ├─────────────────────────────────────────────────────────────────┤
   │ NO │ TANGGAL  │ JUDUL         │ PENGAJU   │ NOMINAL   │ STATUS │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1  │ 15/01/25 │ Honorarium..  │ Budi S.   │ 5.000.000 │ DONE   │
   │ 2  │ 20/01/25 │ Perjalanan..   │ Siti R.   │ 10.000.000│ DONE   │
   │ 3  │ 25/01/25 │ Kehadiran     │ Ahmad K.  │ -         │ DONE ♻ │
   │    │          │ (Non-Material) │           │           │        │
   └──────────────────────────────────────────────────────────────────┘
   ♻ = Non-Material indicator
       ↓
6. Klik nomor dokumen → Detail popup/modal
   - Info lengkap dokumen
   - Preview lampiran (if any)
```

---

## Data / Model / Schema

### Tabel `roles` (existing + addition)
```typescript
roles: {
  // existing... PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN
  'PENANGGUNG_JAWAB_KINERJA': 'Penanggung Jawab Kinerja'
}
```

### Query Agregasi
```sql
-- Summary per Fungsi
SELECT
  mf.id as fungsi_id,
  mf.nama as fungsi,
  COUNT(DISTINCT dt.id) as jumlah_dokumen,
  SUM(dt.nominal_realisasi) as total_nominal
FROM dokumen_transaksi dt
JOIN master_kegiatan mk ON dt.kegiatan_id = mk.id
JOIN master_fungsi mf ON mk.fungsi_id = mf.id
WHERE dt.status = 'COMPLETED'
GROUP BY mf.id, mf.nama
ORDER BY mf.nama;

-- Summary per Kegiatan
SELECT
  mk.id as kegiatan_id,
  mk.nama as kegiatan,
  COUNT(DISTINCT dt.id) as jumlah_dokumen,
  SUM(dt.nominal_realisasi) as total_nominal
FROM dokumen_transaksi dt
JOIN master_kegiatan mk ON dt.kegiatan_id = mk.id
WHERE dt.status = 'COMPLETED'
  AND mk.fungsi_id = ?
GROUP BY mk.id, mk.nama
ORDER BY mk.nama;

-- Detail Dokumen
SELECT
  dt.id, dt.judul, dt.tanggal, dt.nominal_realisasi,
  dt.is_non_material, u.nama as pengaju
FROM dokumen_transaksi dt
JOIN master_kegiatan mk ON dt.kegiatan_id = mk.id
JOIN auth.users u ON dt.created_by = u.id
WHERE dt.status = 'COMPLETED'
  AND mk.fungsi_id = ?
  AND mk.id = ?
ORDER BY dt.tanggal DESC;
```

---

## API / Server Functions

```typescript
// src/routes/api/laporan-kinerja/summary-fungsi.ts
// GET /api/laporan-kinerja/summary-fungsi
//   Query: ?tahun?, ?dari?, ?sampai?, ?kategori?
//   → summary semua fungsi: { fungsi_id, fungsi, jumlah_dokumen, total_nominal }

// src/routes/api/laporan-kinerja/summary-kegiatan/[fungsi_id].ts
// GET /api/laporan-kinerja/summary-kegiatan/[fungsi_id]
//   Query: ?tahun?, ?dari?, ?sampai?, ?kategori?
//   → summary kegiatan di fungsi: { kegiatan_id, kegiatan, jumlah_dokumen, total_nominal }

// src/routes/api/laporan-kinerja/dokumen.ts
// GET /api/laporan-kinerja/dokumen
//   Query: ?fungsi_id, ?kegiatan_id, ?jenis_id?, ?detail_id?, ?tahun?, ?dari?, ?sampai?, ?pengaju_id?, ?kategori?
//   → list dokumen dengan filter lengkap
//   → return: { items, total, grand_total_nominal }

// src/routes/api/laporan-kinerja/dokumen/[id].ts
// GET /api/laporan-kinerja/dokumen/[id]
//   → detail dokumen + lampiran (untuk popup/modal)
```

---

## UI / Frontend

### Routes
```
/penanggung-jawab-kinerja                    → Landing: Redirect ke /laporan-kinerja
/penanggung-jawab-kinerja/laporan-kinerja    → Halaman utama laporan kinerja
```

### Pages

**1. Laporan Kinerja (`/penanggung-jawab-kinerja/laporan-kinerja`)**
- Header: "Laporan Kinerja" + periode info
- Filter Bar (collapsible):
  - Fungsi (dropdown, "Semua Fungsi" default)
  - Kegiatan (dropdown, reactive, "Semua Kegiatan" default)
  - Jenis Permintaan (dropdown, "Semua Jenis" default)
  - Detail/Lampiran (dropdown, reactive)
  - Tahun (input number)
  - Tanggal: dari - sampai (date picker)
  - Pengaju (searchable dropdown)
  - Kategori: Material / Non-Material / Semua (radio button)
  - Tombol: [Terapkan Filter] [Reset]
- Content Area: Tree view (Fungsi → Kegiatan → Dokumen)

**2. Summary View - Fungsi (default)**
- Card/list per fungsi:
  - Nama Fungsi
  - Jumlah Dokumen (badge)
  - Total Nominal
  - Icon panah untuk drill-down
- Footer: Grand Total semua fungsi

**3. Summary View - Kegiatan**
- Breadcrumb: Fungsi > Kegiatan
- Card/list per kegiatan:
  - Nama Kegiatan
  - Jumlah Dokumen
  - Total Nominal
- Link/button "Kembali ke Fungsi"

**4. Detail View - Dokumen**
- Breadcrumb: Fungsi > Kegiatan > Detail
- Filter tambahan: Pengaju, Kategori
- Table dokumen:
  - No, Tanggal, Judul, Pengaju, Nominal, Kategori Badge
- Pagination
- Total nominal di footer

**5. Detail Dokumen Modal**
- Info: Judul, Fungsi, Kegiatan, Jenis, Tanggal, Pengaju
- Nominal: Rp X (atau "Non-Material")
- Lampiran: list dengan preview/download
- Badge: Material / Non-Material

### Komponen UI
- `TreeView` — Fungsi → Kegiatan → Dokumen navigation
- `FilterBar` — reusable filter component
- `SummaryCard` — card untuk summary agregasi
- `DokumenTable` — table dengan pagination
- `DokumenDetailModal` — popup detail dokumen
- `KategoriBadge` — badge Material / Non-Material
- `NominalDisplay` — format currency dengan "-" untuk null

---

## Logic / Business Rules
- **Seluruh dokumen COMPLETED:** Query TIDAK filter berdasarkan fungsi tertentu — semua fungsi masuk
- **Termasuk Non-Material:** Query INCLUDE `is_non_material = true`
- **Nominal NULL = "-":** Tampilkan "-" untuk Non-Material yang tidak punya nominal
- **Filter Kategori:** Jika filter "Material" → exclude `is_non_material = true`. Jika "Non-Material" → hanya `is_non_material = true`. Jika "Semua" → include all.
- **Breadcrumb navigation:** User harus bisa navigate back
- **Default view:** Summary per Fungsi saat pertama buka

---

## Dependensi
- **Bergantung pada:** Spec 08A (Nominal Realisasi), Spec 08C (Non-Material)
- **Dibutuhkan oleh:** —

---

## Definition of Done
- [ ] Role PENANGGUNG_JAWAB_KINERJA tersedia di sistem
- [ ] User dengan role ini hanya bisa akses menu "Laporan Kinerja"
- [ ] Default view: Summary per Fungsi dengan jumlah dokumen + total nominal
- [ ] Klik Fungsi → drill down ke Summary per Kegiatan
- [ ] Klik Kegiatan → drill down ke Detail Dokumen
- [ ] Filter berfungsi (Fungsi, Kegiatan, Jenis, Detail, Tahun, Tanggal, Pengaju, Kategori)
- [ ] Dokumen Non-Material tampil di laporan dengan badge indicator
- [ ] Dokumen Non-Material tidak punya nominal (tampilkan "-")
- [ ] Grand Total nominal tampil di footer
- [ ] Breadcrumb navigation berfungsi
- [ ] Detail dokumen bisa di-popup/modal
- [ ] Semua filter reactive (ketika fungsi dipilih, kegiatan ter-filter)