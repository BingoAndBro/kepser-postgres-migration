# Spec: 08B — Penambahan Arsip (Arsiparis)

## Overview
Fitur bagi Arsiparis untuk menambah arsip manual dengan kategori dokumen (Pemeliharaan, Pengadaan, dll). Dokumen ini tidak memiliki metadata fungsi/kegiatan/jenis seperti dokumen pegawai — hanya memiliki kategori dokumen dan klasifikasi arsip. Nominal_realisasi WAJIB diisi.

---

## Background / Konteks
Arsiparis mengelola arsip dari 2 sumber:
1. **Dokumen pegawai** — sudah ada metadata lengkap (fungsi, kegiatan, jenis), tinggal di-klasifikasi-kan
2. **Arsip manual** — ditambahkan sendiri oleh Arsiparis, hanya punya kategori dokumen + klasifikasi arsip

Untuk arsip manual, metadata seperti fungsi/kegiatan tidak relevan karena dokumen ini bukan hasil kegiatan BPS biasa (misal: pembelian ATK untuk pemeliharaan kantor).

---

## User Stories
- Sebagai **Arsiparis**, saya ingin menambah arsip baru secara manual, agar arsip yang bukan dari dokumen pegawai tetap bisa ter-record.
- Sebagai **Arsiparis**, saya ingin memilih kategori dokumen (Pemeliharaan, Pengadaan, dll), agar arsip terklasifikasi dengan benar.
- Sebagai **Arsiparis**, saya ingin mengelola master kategori dokumen, agar kategori bisa ditambah/diedit/dihapus sesuai kebutuhan.
- Sebagai **Arsiparis**, saya ingin mengisi nominal_realisasi WAJIB, agar nominal tetap ter-record.
- Sebagai **Arsiparis**, saya ingin melampirkan bukti dokumen (opsional), agar ada dokumentasi pendukung.
- Sebagai **sistem**, saya ingin dokumen langsung menjadi AKTIF setelah ditambahkan, agar tidak perlu proses approval.

---

## Scope — Termasuk
- **Master Kategori Dokumen Arsip:** CRUD kategori (Pemeliharaan, Pengadaan, dll) — dikelola Arsiparis
- **Penambahan Arsip Manual:**
  - Pilih kategori dokumen
  - Isi: Nama arsip, Tanggal, Keterangan (WAJIB), Nominal Realisasi (WAJIB)
  - Opsional: Bukti dokumen (file gambar/PDF)
  - Assign ke klasifikasi arsip (GUP, UP, TUP, dll)
  - Langsung jadi arsip AKTIF
- Filter & sort di daftar arsip
- Download bukti dokumen

---

## Scope — Tidak Termasuk
- Preview bukti dokumen (opsional, bisa ditambahkan nanti)
- Approval/verifikasi arsip manual (langsung AKTIF)
- Export arsip manual ke Excel (ada di spec 08D)

---

## Data / Model / Schema

### Tabel `kategori_dokumen_arsip` (NEW)
```typescript
kategori_dokumen_arsip: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL UNIQUE,           // "Pemeliharaan", "Pengadaan", dll
  deskripsi: text,
  is_active: boolean DEFAULT true,
  created_by: uuid REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Tabel `arsip` (additions untuk arsip manual)
```typescript
arsip: {
  // ... existing fields
  kategori_id: uuid REFERENCES kategori_dokumen_arsip(id),  // NULL = dari dokumen pegawai
  is_manual_entry: boolean DEFAULT false,  // true = arsip manual, false = dari dokumen
}
```

---

## User Flow

### Tambah Arsip Manual
```
1. Arsiparis buka menu "Tambah Arsip"
       ↓
2. Pilih Kategori Dokumen (dropdown dari master)
       ↓
3. Isi form:
   - Nama Arsip (text, wajib)
   - Tanggal (date, wajib, default: today)
   - Keterangan (textarea, wajib)
   - Nominal Realisasi (number, wajib)
   - Bukti Dokumen (file upload, opsional) — bisa gambar atau PDF
   - Klasifikasi Arsip (dropdown, wajib)
       ↓
4. Klik "Simpan"
       ↓
5. Sistem:
   → INSERT arsip (is_manual_entry = true, status_arsip = 'AKTIF')
   → Upload file ke storage (jika ada)
   → INSERT log_aktivitas (aksi = 'ADD_MANUAL_ARCHIVE')
       ↓
6. Redirect ke daftar arsip aktif + toast "Arsip berhasil ditambahkan"
```

### Kelola Kategori Dokumen
```
1. Arsiparis buka menu "Kategori Dokumen Arsip"
       ↓
2. Table: Nama, Deskripsi, Jumlah Arsip, Aksi
       ↓
3. Aksi:
   - Tambah: modal form (nama, deskripsi)
   - Edit: modal form pre-filled
   - Hapus: konfirmasi + soft delete (is_active = false)
```

---

## API / Server Functions

```typescript
// src/routes/api/arsiparis/kategori-dokumen.ts
// GET /api/arsiparis/kategori-dokumen
//   → list kategori WHERE is_active = true

// POST /api/arsiparis/kategori-dokumen
//   Body: { nama, deskripsi? }
//   → create kategori

// PATCH /api/arsiparis/kategori-dokumen/[id]
//   Body: { nama?, deskripsi? }
//   → update kategori

// DELETE /api/arsiparis/kategori-dokumen/[id]
//   → soft delete (is_active = false)

// src/routes/api/arsiparis/tambah-arsip.ts
// POST /api/arsiparis/tambah-arsip
//   Body: {
//     kategori_id: uuid,
//     nama: text,
//     tanggal: date,
//     keterangan: text,
//     nominal_realisasi: decimal,
//     klasifikasi: text,
//     bukti_dokumen?: file
//   }
//   → validasi role = ARSIPARIS
//   → validasi fields wajib terisi
//   → INSERT arsip (is_manual_entry = true, status_arsip = 'AKTIF')
//   → Upload file ke Supabase Storage
//   → INSERT log_aktivitas

// GET /api/arsiparis/manual
//   → list arsip WHERE is_manual_entry = true
//   → filter: ?kategori_id, ?tahun, ?q
```

---

## UI / Frontend

### Routes
```
/arsiparis                      → Dashboard (update: tampilkan stats arsip manual)
/arsiparis/kategori-dokumen     → CRUD master kategori dokumen arsip
/arsiparis/tambah               → Form tambah arsip manual
/arsiparis/manual               → List arsip manual
/arsiparis/dokumen/[id]         → Detail arsip (existing, perlu update)
```

### Pages

**1. Master Kategori Dokumen (`/arsiparis/kategori-dokumen`)**
- Table: Nama Kategori, Deskripsi, Jumlah Arsip, Aksi (edit/delete)
- Tombol [+ Tambah Kategori] → modal form
- Empty state: "Belum ada kategori dokumen. Tambahkan kategori pertama."
- Hapus: soft delete, tidak bisa dihapus jika ada arsip yang pakai

**2. Tambah Arsip Manual (`/arsiparis/tambah`)**
- Step/Form:
  1. Pilih Kategori Dokumen (dropdown, wajib)
  2. Isi Detail:
     - Nama Arsip (input, wajib)
     - Tanggal (date picker, wajib, default: today)
     - Keterangan (textarea, wajib)
     - Nominal Realisasi (number input, wajib, format currency)
     - Klasifikasi Arsip (dropdown dari master_klasifikasi_arsip, wajib)
  3. Bukti Dokumen (file upload, opsional, accept: image/*,.pdf)
- Tombol: [Batal] [Simpan]
- Validation feedback inline

**3. List Arsip Manual (`/arsiparis/manual`)**
- Table: Nama, Kategori, Tanggal, Nominal, Klasifikasi, Aksi (view/edit)
- Filter: Kategori, Tahun, Pencarian
- Badge indicator untuk arsip manual

### Komponen UI
- `KategoriDokumenTable` — table CRUD kategori
- `KategoriDokumenForm` — modal form tambah/edit kategori
- `TambahArsipManualForm` — form utama
- `FileUpload` — reusable upload component (image/PDF)

---

## Logic / Business Rules
- **Nominal wajib:** `nominal_realisasi` HARUS terisi untuk arsip manual
- **Langsung AKTIF:** Tidak ada proses approval — arsip langsung berstatus AKTIF
- **Bukti opsional:** File upload BISA kosong
- **Kategori tidak bisa dihapus jika dipakai:** Validasi foreign key sebelum soft delete
- **is_manual_entry = true:** Flag untuk membedakan arsip manual dari arsip hasil dokumen

---

## Dependensi
- **Bergantung pada:** Spec 08A (Nominal Realisasi Foundation), Spec 05 (Arsip Flow)
- **Dibutuhkan oleh:** Spec 08D (Export Excel)

---

## Definition of Done
- [ ] Arsiparis bisa CRUD master kategori dokumen arsip
- [ ] Arsiparis bisa tambah arsip manual dengan field: kategori, nama, tanggal, keterangan, nominal, klasifikasi
- [ ] Nominal Realisasi WAJIB terisi saat tambah arsip manual
- [ ] Bukti dokumen (file) adalah opsional
- [ ] Arsip langsung AKTIF setelah ditambahkan
- [ ] Arsip manual tampil di daftar arsip aktif
- [ ] Kategori tidak bisa dihapus jika ada arsip yang pakai
- [ ] Semua aksi logged di log_aktivitas
- [ ] Filter berfungsi (kategori, tahun, pencarian)