# Spec: 08C — Non-Material Documents

## Overview
Fitur dokumen "Non-Material" adalah jenis permintaan khusus yang TIDAK memerlukan persetujuan PPK maupun Bendahara. Dokumen langsung berstatus "Selesai" setelah diajukan. Tidak ada field `nominal_realisasi`, dan upload dokumen adalah opsional dengan judul kustom.

---

## Background / Konteks
Dokumen Non-Material adalah jenis permintaan yang tidak terkait dengan anggaran/fisik. Contoh: kehadiran, tugas tambahan, dll. Karena tidak ada nominal yang harus dihitung, maka:

- TIDAK perlu persetujuan PPK (verifikasi anggaran)
- TIDAK perlu persetujuan Bendahara (konfirmasi pembayaran)
- Langsung Selesai setelah diajukan

Flow dokumen biasa (Material):
```
DRAFT → IN_PPK_VALIDATION → IN_BENDAHARA_APPROVAL → COMPLETED → ARCHIVED
              (Wajib Nominal)        (Wajib Nominal)
```

Flow dokumen Non-Material:
```
DRAFT → COMPLETED (langsung, tanpa approval)
       (Tidak wajib nominal)
```

---

## User Stories
- Sebagai **Pegawai**, saya ingin mengajukan dokumen Non-Material, agar kegiatan non-anggaran tetap bisa terekam di sistem.
- Sebagai **sistem**, saya ingin dokumen Non-Material langsung selesai tanpa proses approval, agar alur lebih efisien.
- Sebagai **sistem**, saya ingin dokumen Non-Material TIDAK wajib nominal_realisasi, agar tidak ada data kosong.
- Sebagai **Pegawai**, saya ingin upload dokumen opsional dengan judul kustom, agar saya bisa melampirkan bukti pendukung jika ada.
- Sebagai **sistem**, saya ingin dokumen Non-Material TIDAK masuk ke Arsiparis, agar arsiparis tidak terganggu dengan dokumen yang tidak perlu diarsipkan.

---

## Scope — Termasuk
- **Opsi "Non-MATERIAL" di dropdown Jenis Permintaan:**
  - Taruh di paling atas dengan highlight (misal: background berbeda)
- **Flow Non-Material:**
  - Pilih Fungsi → Kegiatan → **Non-MATERIAL**
  - Tidak ada field `nominal_realisasi`
  - Langsung ke step upload dokumen
  - Upload dokumen **OPSIONAL** dengan judul kustom (bisa lebih dari 1)
  - Submit → langsung status `COMPLETED`
- **Section "Dokumen Pendukung (Opsional)":**
  - Untuk dokumen Material: section di bawah daftar kelengkapan dokumen
  - Pegawai bisa tambah sendiri judul dokumen + upload file
- **Kelengkapan dokumen Non-Material:**
  - Tidak ada daftar kelengkapan wajib
  - Hanya ada section "Dokumen Pendukung (Opsional)" dengan judul kustom

---

## Scope — Tidak Termasuk
- Filter/category "Non-Material" di halaman arsiparis (tetap muncul tapi arsiparis bisa skip)
- Aggregasi nominal untuk Non-Material (karena tidak ada nominal)
- Export Non-Material terpisah (masuk ke export gabungan)

---

## User Flow

### Ajukan Dokumen Non-Material
```
1. Pegawai buka "Ajukan Dokumen"
       ↓
2. Pilih Fungsi → Kegiatan
       ↓
3. Pilih Jenis Permintaan → **"Non-MATERIAL"** (di paling atas, di-highlight)
       ↓
4. Tidak ada field nominal_realisasi
       ↓
5. Section "Kelengkapan Dokumen":
   - Tidak ada daftar kelengkapan wajib
   - Hanya ada section "Dokumen Pendukung (Opsional)" dengan judul kustom
   - Pegawai bisa tambah sendiri: [Judul Dokumen] + [Upload File]
       ↓
6. Klik "Ajukan"
       ↓
7. Sistem:
   → UPDATE dokumen_transaksi SET status = 'COMPLETED', is_non_material = true
   → (nominal_realisasi = NULL)
   → INSERT log_aktivitas (aksi = 'SUBMIT_NON_MATERIAL')
       ↓
8. Redirect ke halaman success + toast "Dokumen berhasil diajukan"
```

### Ajukan Dokumen Material (dengan Dokumen Pendukung Opsional)
```
1. Pegawai buka "Ajukan Dokumen"
       ↓
2. Pilih Fungsi → Kegiatan → Jenis Permintaan (Honorarium, dll)
       ↓
3. Isi field: Judul, Tanggal, Keterangan, **Nominal Realisasi (WAJIB)**
       ↓
4. Kelengkapan Dokumen:
   - Daftar kelengkapan wajib (dari master)
   - Section "Dokumen Pendukung (Opsional)":
     → Bisa tambah judul dokumen kustom + upload file
     → Boleh kosong
       ↓
5. Klik "Ajukan"
       ↓
6. Sistem:
   → UPDATE dokumen_transaksi SET status = 'IN_PPK_VALIDATION'
   → INSERT log_aktivitas (aksi = 'SUBMIT')
       ↓
7. Redirect ke halaman success
```

---

## Data / Model / Schema

### Tabel `dokumen_transaksi` (relevan)
```typescript
dokumen_transaksi: {
  // ... existing fields
  nominal_realisasi: decimal(15,2) NULL,  // NULL untuk Non-Material
  is_non_material: boolean DEFAULT false,
}
```

### Tabel `dokumen_pendukung` (NEW — untuk dokumen opsional dengan judul kustom)
```typescript
dokumen_pendukung: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id: uuid REFERENCES dokumen_transaksi(id),
  judul: text NOT NULL,              // Judul kustom dari user
  file_url: text,
  file_name: text,
  created_at: timestamp DEFAULT now()
}
```

---

## API / Server Functions

```typescript
// POST /api/dokumen
// Body: {
//   ..., is_non_material: boolean, nominal_realisasi?: decimal,
//   dokumen_pendukung: [{ judul: string, file?: File }]
// }
// → validasi: jika is_non_material = true
//   → nominal_realisasi = NULL
//   → status = 'COMPLETED' langsung
// → validasi: jika is_non_material = false
//   → nominal_realisasi WAJIB
//   → status = 'IN_PPK_VALIDATION'

// GET /api/dokumen/[id]
// → include dokumen_pendukung

// PATCH /api/dokumen/[id]
// → update dokumen_pendukung jika ada
```

---

## UI / Frontend

### Routes (Update)
```
/pegawai/aju                     → Form ajukan dokumen (update)
/pegawai/dokumen/[id]            → Detail dokumen (update)
```

### Update di Form Ajukan Dokumen

**1. Dropdown Jenis Permintaan:**
- Tampilkan "Non-MATERIAL" di paling atas
- Style highlight: background warning/accent berbeda
- OnSelect: hide nominal_realisasi field

**2. Section Kelengkapan Dokumen (Material):**
```
┌─────────────────────────────────────────────────────────────┐
│ Kelengkapan Dokumen                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. [x] Surat Tugas      [Upload File]                       │
│ 2. [x] Daftar Hadir     [Upload File]                       │
│ 3. [x] Laporan          [Upload File]                       │
├─────────────────────────────────────────────────────────────┤
│ + Tambah Dokumen Pendukung (Opsional)                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Judul Dokumen: [________________] [Upload File]     │   │
│   │ [+ Tambah Lagi]                                      │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**3. Section Kelengkapan Dokumen (Non-Material):**
```
┌─────────────────────────────────────────────────────────────┐
│ Dokumen Pendukung (Opsional)                                │
├─────────────────────────────────────────────────────────────┤
│ + Tambah Dokumen                                            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Judul Dokumen: [________________] [Upload File]    │   │
│   │ [+ Tambah Lagi]                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│ ⚠ Tidak ada kelengkapan dokumen wajib untuk Non-Material    │
└─────────────────────────────────────────────────────────────┘
```

### Update di Daftar Laporan

**Laporan Saya, Laporan Kegiatan:**
- Filter: Sertakan toggle/checkbox "Termasuk Non-Material" (default: checked)
- Badge indicator untuk dokumen Non-Material

---

## Logic / Business Rules
- **Non-Material langsung Selesai:** status = 'COMPLETED' saat submit, tanpa lewat IN_PPK_VALIDATION dan IN_BENDAHARA_APPROVAL
- **Tidak ada nominal:** nominal_realisasi = NULL untuk is_non_material = true
- **Dokumen pendukung opsional:** Untuk Non-Material, hanya ada section opsional dengan judul kustom
- **Tidak masuk arsiparis:** Query arsiparis inbox harus exclude is_non_material = true
- **Tetap masuk laporan:** Non-Material masuk ke Laporan Saya, Laporan Kegiatan, Laporan Kinerja
- **Dokumen Pendukung bisa untuk Material:** Section opsional dengan judul kustom juga tersedia untuk dokumen Material

---

## Dependensi
- **Bergantung pada:** Spec 08A (Nominal Realisasi Foundation), Spec 03 (Submit Flow)
- **Dibutuhkan oleh:** Spec 08D (Export Excel), Spec 08E (Penanggung Jawab Kinerja)

---

## Definition of Done
- [ ] Opsi "Non-MATERIAL" ada di paling atas dropdown Jenis Permintaan dengan highlight
- [ ] Pilih Non-Material → tidak ada field nominal_realisasi
- [ ] Pilih Non-Material → tidak ada daftar kelengkapan wajib
- [ ] Pilih Non-Material → hanya ada "Dokumen Pendukung (Opsional)" dengan judul kustom
- [ ] Submit Non-Material → status langsung COMPLETED (tanpa approval PPK/Bendahara)
- [ ] Dokumen pendukung dengan judul kustom berfungsi
- [ ] Non-Material TIDAK masuk inbox arsiparis
- [ ] Non-Material MASUK ke Laporan Saya, Laporan Kegiatan
- [ ] Dokumen Material tetap punya section "Dokumen Pendukung (Opsional)"
- [ ] Semua aksi logged di log_aktivitas