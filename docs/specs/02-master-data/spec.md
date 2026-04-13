# Spec: 02 — Master Data Management

## Overview
Kelola data master: Fungsi (departemen), Jenis Kegiatan per fungsi, dan Kelengkapan Dokumen per kegiatan × role (Ketua Tim vs Anggota). Semua melalui UI Admin. Data ini menjadi fondasi bagi komponen 03-05.

---

## Background / Konteks
Tanpa master data, komponen lain tidak bisa jalan. Pegawai perlu pilih fungsi & kegiatan saat ajukan dokumen, dan sistem perlu tahu kelengkapan dokumen apa yang harus diupload. Semua itu ditentukan di sini.

---

## User Stories
- Sebagai **Admin**, saya ingin menambah/mengedit/menghapus fungsi (Sosial, Distribusi, Neraca, dll), agar data organisasi akurat.
- Sebagai **Admin**, saya ingin menambah/mengedit/menghapus jenis kegiatan per fungsi (Sakernas, Susenas, PODES, dll), agar kelengkapan dokumen bisa dikonfigurasi per kegiatan.
- Sebagai **Admin**, saya ingin mengkonfigurasi kelengkapan dokumen per kegiatan × role (Ketua Tim vs Anggota), agar sistem tahu dokumen apa yang wajib diupload.
- Sebagai **sistem**, saya ingin API yang bisa dipakai komponen lain untuk membaca master data.

---

## Scope — Termasuk
- Halaman CRUD untuk `master_fungsi` — list, create, edit, soft delete
- Halaman CRUD untuk `master_kegiatan` — list (filterable per fungsi), create, edit, soft delete
- Halaman CRUD untuk `master_kelengkapan_dokumen` — configure per kegiatan + is_ketua_tim
- Seed data awal (6 fungsi + contoh kegiatan + contoh kelengkapan)
- API server functions untuk read-only access oleh komponen lain
- Navigasi Admin: sidebar menu "Master Data" → sub-menu Fungsi / Kegiatan / Kelengkapan

---

## Scope — Tidak Termasuk
- Import/export master data (CSV/Excel) — ditunda
- Validasi relasi (misal: tidak bisa hapus fungsi yang punya kegiatan) — handled via soft delete + warning, bukan hard constraint
- Master data versioning — ditunda

---

## Data / Model / Schema

### Tabel `master_fungsi`
```typescript
master_fungsi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL UNIQUE,   // "Sosial", "Distribusi", "Neraca", "Produksi", "Umum", "IPDS"
  deskripsi: text,
  is_active: boolean DEFAULT true,  // soft delete
  created_at: timestamp DEFAULT now()
}
```

### Tabel `master_kegiatan`
```typescript
master_kegiatan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fungsi_id: uuid NOT NULL REFERENCES master_fungsi(id),
  nama: text NOT NULL,           // "SAKERNAS", "SUSENAS", "PODES"
  deskripsi: text,
  is_active: boolean DEFAULT true,  // soft delete
  created_at: timestamp DEFAULT now()
}
```

### Tabel `master_kelengkapan_dokumen`
```typescript
master_kelengkapan_dokumen: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id: uuid NOT NULL REFERENCES master_kegiatan(id),
  is_ketua_tim: boolean NOT NULL,  // true = untuk Ketua Tim, false = untuk Anggota
  nama_dokumen: text NOT NULL,     // "Laporan", "Form Permintaan", "KAK", "Surat Keterangan Kendaraan Dinas"
  required: boolean DEFAULT true,
  created_at: timestamp DEFAULT now()
}
```

### Seed Data Awal

**Fungsi:**
| Nama | Deskripsi |
|------|-----------|
| Sosial | Bidang Sosial |
| Distribusi | Bidang Distribusi |
| Neraca | Bidang Neraca |
| Produksi | Bidang Produksi |
| Umum | Bidang Umum |
| IPDS | Bidang IPDS |

**Contoh Kegiatan per Fungsi:**
| Fungsi | Kegiatan |
|--------|----------|
| Sosial | SAKERNAS, SUSENAS, PODES |
| Distribusi | Survei Harga, Survei Perdagangan |
| Neraca | Neraca Pengeluaran Konsumsi |
| Produksi | Survei Produksi |
| Umum | Administrasi |
| IPDS | Pengolahan Data |

**Contoh Kelengkapan (SAKERNAS):**
| is_ketua_tim | Nama Dokumen | Required |
|--------------|-------------|----------|
| false | Laporan | true |
| false | KAK | true |
| true | Laporan | true |
| true | KAK | true |
| true | Form Permintaan | true |
| true | Surat Keterangan Kendaraan Dinas | true |

---

## API / Server Functions

```typescript
// src/routes/api/master-fungsi.ts
// GET /api/master-fungsi          — list semua fungsi aktif
// POST /api/master-fungsi         — create fungsi (ADMIN only)
// PATCH /api/master-fungsi/[id]    — update fungsi (ADMIN only)
// DELETE /api/master-fungsi/[id]  — soft delete (ADMIN only, is_active = false)

// src/routes/api/master-kegiatan.ts
// GET /api/master-kegiatan                — list semua kegiatan aktif
// GET /api/master-kegiatan?fungsi_id=x   — filter by fungsi
// POST /api/master-kegiatan               — create kegiatan (ADMIN only)
// PATCH /api/master-kegiatan/[id]         — update kegiatan (ADMIN only)
// DELETE /api/master-kegiatan/[id]        — soft delete (ADMIN only)

// src/routes/api/master-kelengkapan.ts
// GET /api/master-kelengkapan?kegiatan_id=x    — list kelengkapan per kegiatan
// POST /api/master-kelengkapan                  — create kelengkapan (ADMIN only)
// PATCH /api/master-kelengkapan/[id]            — update (ADMIN only)
// DELETE /api/master-kelengkapan/[id]            — delete (ADMIN only)
```

### Helper Functions
```typescript
// src/lib/master-data.ts
getAllFungsi(): Promise<MasterFungsi[]>
getKegiatanByFungsi(fungsiId: string): Promise<MasterKegiatan[]>
getKelengkapanByKegiatan(kegiatanId: string, isKetuaTim: boolean): Promise<KelengkapanDokumen[]>
// READ helpers ini bisa dipakai oleh komponen 03, 04, 05
```

---

## UI / Frontend

### Routes
```
/admin/master-data              → redirect ke /admin/master-data/fungsi
/admin/master-data/fungsi       → list & CRUD fungsi
/admin/master-data/kegiatan     → list & CRUD kegiatan (filterable per fungsi)
/admin/master-data/kelengkapan  → configure kelengkapan per kegiatan
```

### UI Components
- `MasterDataLayout` — wrapper dengan sidebar sub-menu "Fungsi | Kegiatan | Kelengkapan"
- `DataTable` — reusable table dengan kolom aksi (edit/delete)
- `CreateModal` / `EditModal` — modal untuk create/edit
- `FilterBar` — filter kegiatan berdasarkan fungsi
- `KelengkapanConfig` — UI khusus: pilih kegiatan → tampilkan checklist kelengkapan (Ketua Tim + Anggota)

---

## Logic / Business Rules
- **Soft delete:** DELETE endpoint set `is_active = false`, bukan hapus baris. Lookup master data selalu filter `is_active = true`.
- **Relasi fungsi-kegiatan:** Jika fungsi di-soft-delete, kegiatan terkait tetap ada tapi tidak akan muncul di dropdown (karena difilter `is_active`).
- **Relasi kegiatan-kelengkapan:** Jika kegiatan di-soft-delete, kelengkapan terkait tetap ada tapi tidak muncul.
- Admin tidak bisa buat дубликат `nama` di tabel yang sama dalam 1 fungsi yang sama.

---

## Dependensi
- **Bergantung pada:** Komponen 01 (Auth & RBAC) — Admin UI butuh auth + role check
- **Dibutuhkan oleh:** Komponen 03, 04, 05 — semua butuh read master data

---

## Definition of Done
- [ ] CRUD fungsi berfungsi: list, create, edit, soft delete
- [ ] CRUD kegiatan berfungsi: list, create, edit, soft delete, filter by fungsi
- [ ] CRUD kelengkapan berfungsi: configure per kegiatan × role
- [ ] Seed data 6 fungsi + contoh kegiatan + kelengkapan SAKERNAS ter-seed
- [ ] API read-only helpers bisa dipakai komponen lain
- [ ] ADMIN bisa akses semua halaman master data; non-ADMIN dapat 403
- [ ] Soft delete tidak menghilangkan data (is_active = false)
