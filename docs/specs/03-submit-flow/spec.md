# Spec: 03 — Submit Flow (Pegawai)

## Overview
Alur pegawai mengajukan dokumen: pilih fungsi → pilih kegiatan → tentukan role (Ketua Tim atau bukan) → upload lampiran sesuai kelengkapan → submit. Termasuk tracking status dokumen yang sudah diajukan dan resubmit jika ditolak PPK.

---

## Background / Konteks
Ini adalah titik awal seluruh siklus persetujuan. Pegawai adalah actor utama yang memulai flow. Tanpa fitur ini, tidak ada dokumen yang sampai ke PPK untuk divalidasi.

---

## User Stories
- Sebagai **Pegawai**, saya ingin mengajukan dokumen dengan memilih fungsi dan kegiatan yang sesuai, agar dokumen saya masuk ke alur persetujuan yang benar.
- Sebagai **Pegawai**, saya ingin tahu kelengkapan dokumen apa yang harus saya upload berdasarkan kegiatan dan status saya (Ketua Tim atau bukan), agar tidak ada yang terlewat.
- Sebagai **Pegawai**, saya ingin melihat daftar dokumen yang sudah saya ajukan beserta statusnya, agar saya bisa melacak progresso.
- Sebagai **Pegawai**, saya ingin memperbaiki dan resubmit dokumen yang ditolak PPK, agar bisa melewati proses persetujuan.

---

## Scope — Termasuk
- Halaman "Ajukan Dokumen" — multi-step form:
  1. Pilih Fungsi (dropdown dari `master_fungsi`)
  2. Pilih Kegiatan (dropdown, terfilter berdasarkan fungsi yang dipilih)
  3. Tanya "Apakah anda Ketua Tim dari kegiatan ini?" — toggle Ya/Tidak
  4. Tampilkan kelengkapan dokumen berdasarkan kegiatan + jawaban di step 3 (checklist + upload per dokumen)
  5. Review & Submit
- Upload lampiran via Supabase Storage
- Simpan `lampiran_urls` sebagai JSONB di `dokumen_transaksi`
- Halaman "Dokumen Saya" — list semua dokumen yang pernah diajukan oleh user aktif (status, tanggal, fungsi, kegiatan)
- Halaman detail dokumen — lihat isi + status + history
- Resubmit flow — jika status `NEED_REVISION` dengan `revision_target = 'USER'`, pegawai bisa edit lampiran dan resubmit
- Validasi: semua lampiran required harus terisi sebelum bisa submit
- Set `current_step = 'PPK'` saat submit berhasil

---

## Scope — Tidak Termasuk
- Edit dokumen setelah submit (selain resubmit dari NEED_REVISION)
- Multiple files per kelengkapan dokumen
- Preview file PDF di browser (link download ke Supabase Storage only)
- Notifikasi email/ Push saat status berubah (ditunda)

---

## Data / Model / Schema

### Tabel `dokumen_transaksi` (relevant fields)
```typescript
dokumen_transaksi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul: text NOT NULL,                   // judul kegiatan / nama dokumen
  fungsi_id: uuid REFERENCES master_fungsi(id),
  kegiatan_jenis_id: uuid REFERENCES master_kegiatan(id),
  is_ketua_tim: boolean NOT NULL DEFAULT false,
  status: StatusDokumen NOT NULL DEFAULT 'DRAFT',
  current_step: CurrentStep DEFAULT null, // 'PPK' saat IN_PPK_VALIDATION
  revision_target: RevisionTarget DEFAULT null,
  revision_notes: text DEFAULT null,      // Catatan penolakan dari PPK
  lampiran_urls: jsonb DEFAULT '[]',      // Array of { nama, url, kelengkapan_id }
  created_by: uuid REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Enum Status (dari AGENTS.md)
```typescript
type StatusDokumen = 'DRAFT' | 'IN_PPK_VALIDATION' | 'IN_BENDAHARA_APPROVAL' | 'NEED_REVISION' | 'COMPLETED' | 'ARCHIVED'
type RevisionTarget = 'USER' | 'PPK'
type CurrentStep = 'PPK' | 'BENDAHARA'
```

### Struktur `lampiran_urls` JSONB
```typescript
type LampiranUrl = {
  kelengkapan_id: string,   // ID dari master_kelengkapan_dokumen
  nama: string,             // Nama dokumen, e.g. "Laporan"
  url: string,              // URL Supabase Storage
  uploaded_at: string       // ISO timestamp
}
```

---

## Alur Pengguna (User Flow)

### Submit Baru
```
1. Pegawai klik "Ajukan Dokumen"
       ↓
2. Pilih Fungsi → dropdown
       ↓
3. Pilih Kegiatan → dropdown (terfilter berdasarkan fungsi)
       ↓
4. Toggle "Apakah anda Ketua Tim?" → Ya / Tidak
       ↓
5. Sistem tampilkan kelengkapan dokumen:
   - Jika "Ya": tampilkan checklist untuk Ketua Tim
   - Jika "Tidak": tampilkan checklist untuk Anggota
   Setiap item: [checkbox] [Nama Dokumen] [Upload File] → wajib terisi
       ↓
6. Pegawai upload semua file yang required
       ↓
7. Review — tampilkan ringkasan (fungsi, kegiatan, role, daftar lampiran)
       ↓
8. Klik "Ajukan"
       ↓
9. Sistem: status = 'IN_PPK_VALIDATION', current_step = 'PPK'
   → redirect ke "Dokumen Saya" dengan notifikasi "Dokumen berhasil diajukan"
```

### Resubmit (NEED_REVISION dari PPK)
```
1. Pegawai buka "Dokumen Saya" → lihat dokumen berstatus "Butuh Revisi"
       ↓
2. Klik "Lihat" → halaman detail
       ↓
3. Klik "Perbaiki & Resubmit"
       ↓
4. Sistem tampilkan form edit dengan:
   - Catatan penolakan dari PPK (read-only)
   - Kelengkapan dokumen (sama seperti submit awal)
   - File yang sudah terupload tetap ditampilkan
       ↓
5. Pegawai upload/perbaiki file yang bermasalah
       ↓
6. Klik "Resubmit"
       ↓
7. Sistem: status = 'IN_PPK_VALIDATION', current_step = 'PPK'
   → logged di log_aktivitas
```

---

## API / Server Functions

```typescript
// src/routes/api/dokumen/index.ts
// GET /api/dokumen              — list dokumen saya (created_by = user aktif)
// POST /api/dokumen              — create dokumen baru → IN_PPK_VALIDATION

// src/routes/api/dokumen/[id].ts
// GET /api/dokumen/[id]         — detail dokumen (owner only)

// PATCH /api/dokumen/[id]       — update (edit lampiran) — hanya jika NEED_REVISION target USER

// src/routes/api/dokumen/[id]/submit.ts
// POST /api/dokumen/[id]/submit — submit / resubmit → IN_PPK_VALIDATION

// src/routes/api/upload.ts
// POST /api/upload              — upload file ke Supabase Storage
//   Body: FormData { file, kelengkapan_id, nama_dokumen }
//   Returns: { url: string, nama: string, uploaded_at: string }
```

### Validation Rules
- Submit: semua lampiran required (`required = true`) harus ada URL di `lampiran_urls`
- Resubmit: hanya boleh jika `status = 'NEED_REVISION'` DAN `revision_target = 'USER'`
- Upload: hanya boleh tipe file PDF/DOC/DOCX/XLS/XLSX, max 10MB per file

---

## UI / Frontend

### Routes
```
/dokumen                      → redirect ke /dokumen/saya
/dokumen/saya                 → list dokumen saya
/dokumen/aju                  → form ajukan dokumen baru
/dokumen/[id]                 → detail dokumen
/dokumen/[id]/edit            → edit & resubmit (jika applicable)
```

### Pages

**1. Halaman "Dokumen Saya"**
- Table/list: judul, fungsi, kegiatan, status badge, tanggal, aksi
- Filter: status, fungsi, tanggal
- Status badge warna: DRAFT (abu), IN_PPK_VALIDATION (kuning), NEED_REVISION (merah), IN_BENDAHARA_APPROVAL (biru), COMPLETED (hijau), ARCHIVED (grey)
- Tombol "Ajukan Dokumen Baru" di atas

**2. Form Ajukan Dokumen (Multi-step)**
- Step indicator: 1-Fungsi → 2-Kegiatan → 3-Ketua Tim? → 4-Unggah → 5-Review
- Step 1: Dropdown fungsi
- Step 2: Dropdown kegiatan (reactive berdasarkan step 1)
- Step 3: Toggle Ya/Tidak "Apakah anda Ketua Tim?"
- Step 4: Checklist kelengkapan + upload button per item (jika belum upload, button disabled)
- Step 5: Review summary → tombol "Ajukan"

**3. Halaman Detail Dokumen**
- Info: judul, fungsi, kegiatan, is_ketua_tim, status, current_step, tanggal
- Jika `NEED_REVISION`: tampilkan `revision_notes` dari PPK
- Daftar lampiran: link download per file
- Tombol "Perbaiki & Resubmit" (hanya jika `status = NEED_REVISION` AND `revision_target = 'USER'`)

### Komponen UI
- `StepIndicator` — показує прогрес кроку
- `KelengkapanChecklist` — checklist + upload per item (conditional Ketua Tim vs Anggota)
- `FileUploadButton` — upload file, show filename + size setelah upload
- `StatusBadge` — badge dengan warna sesuai status
- `DocumentCard` — card untuk list view

---

## Logic / Business Rules
- **Kelengkapan dinamis:** Ketika pegawai pilih kegiatan + Ketua Tim toggle, sistem fetch `master_kelengkapan_dokumen` dengan `kegiatan_id` + `is_ketua_tim` yang sesuai
- **Submit lock:** Dokumen tidak bisa disubmit jika ada lampiran required yang belum terisi
- **Revision lock:** Hanya bisa resubmit jika `status = NEED_REVISION` AND `revision_target = 'USER'`. Jika `revision_target = 'PPK'`, pegawai tidak bisa resubmit
- **Ownership check:** Pegawai hanya bisa melihat/mengedit dokumen miliknya sendiri
- **Storage URL generation:** File di-upload ke Supabase Storage, URL disimpan di `lampiran_urls`

---

## Dependensi
- **Bergantung pada:** Komponen 01 (Auth & RBAC) + Komponen 02 (Master Data)
- **Dibutuhkan oleh:** Komponen 04 (Approval Flow PPK→Bendahara)

---

## Definition of Done
- [ ] Form ajukan dokumen — semua 5 step berfungsi (fungsi → kegiatan → ketua tim → upload → review)
- [ ] Kelengkapan dokumen berubah sesuai kegiatan + jawaban Ketua Tim
- [ ] Upload file berfungsi — URL tersimpan di `lampiran_urls`
- [ ] Submit validasi: tidak bisa submit jika ada lampiran required yang kosong
- [ ] Submit: status menjadi `IN_PPK_VALIDATION`, `current_step = 'PPK'`
- [ ] Halaman "Dokumen Saya": list dokumen saya dengan status badge
- [ ] Halaman detail dokumen menampilkan semua info + lampiran
- [ ] Resubmit flow: bisa edit & resubmit jika `NEED_REVISION` target `USER`
- [ ] Resubmit tidak bisa jika target `PPK`
- [ ] Tidak bisa akses dokumen orang lain
- [ ] Non-PEGAWAI role tidak bisa akses halaman ini
