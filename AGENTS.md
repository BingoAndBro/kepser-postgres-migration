# AGENTS.md — Project Constitution: DMS (Dynamic Document Workflow Management System)
> **⚠️ File ini adalah HUKUM.** Semua kode, keputusan routing, dan perubahan schema HARUS mengacu pada file ini. Update file ini SEBELUM mengupdate kode.

---

## 🎯 North Star (MVP)
> **Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh siapapun yang berwenang.**
>
> MVP Goal: **Menghapus kebingungan** — tidak ada lagi "dokumen ini sudah sampai mana?", "siapa yang belum approve?". Semua digantikan satu **Inbox** yang jelas dan satu **status** yang terpusat.

---

## 📐 Tech Stack (MVP — LOCKED)

| Layer | Teknologi | Catatan |
|---|---|---|
| **Framework** | TanStack Start (SSR) | File-based routing, server functions built-in |
| **Language** | TypeScript | Type safety di seluruh stack |
| **Database** | Supabase (PostgreSQL) | Managed DB, RLS built-in |
| **Auth** | Supabase Auth | JWT + RLS native |
| **File Storage** | Supabase Storage | 1GB free tier, cukup untuk MVP |
| **ORM** | Drizzle ORM | Type-safe query, schema-as-code |
| **UI Components** | shadcn/ui | Headless + styled, copy-paste |
| **Validation** | Zod | Schema validation: form → API → DB |
| **Hosting** | Vercel | Deploy TanStack Start MVP |
| **Package Manager**| pnpm | Wajib digunakan untuk semua instalasi dan command eksekusi proyek |

> **Catatan Migrasi Post-MVP:** File Storage akan dipindah ke Cloudflare R2, hosting ke Cloudflare Workers.

### Perintah Package Manager

> **WAJIB: Gunakan `pnpm` untuk SEMUA operasi package manager.**

```bash
# Install semua dependencies (setelah clone / setelah lockfile berubah)
pnpm install

# Menambah paket BARU ke project
pnpm add <nama-paket>    # dependency regular
pnpm add -D <nama-paket> # devDependency (contoh: pnpm add -D vitest)
pnpm add -g <nama-paket> # global install (jarang — contoh: pnpm add -g supabase)

# Menghapus paket
pnpm remove <nama-paket>

# Menjalankan script
pnpm dev      # development server
pnpm build    # production build
pnpm test     # run tests
```

- ❌ **Jangan** gunakan `npm install` atau `yarn add` — selalu `pnpm`
- ✅ Selalu commit `pnpm-lock.yaml` ke git (BUKAN `package-lock.json`)
- ✅ Reference lengkap: `docs/pnpm-best-practices.md`

---

## 🗂️ Data Schema (MVP — 9 Tabel Inti)

### Enum: Status Dokumen (FSM) — MVP Hardcoded Flow
```typescript
// Status dokumen: alur berjenjang PPK → Bendahara → Arsiparis
type StatusDokumen =
  | 'DRAFT'                        // Belum diajukan
  | 'IN_PPK_VALIDATION'            // Sedang divalidasi PPK
  | 'IN_BENDAHARA_APPROVAL'        // Sedang disetujui Bendahara
  | 'NEED_REVISION'                // Ditolak — ada target di bawah
  | 'COMPLETED'                    // Selesai semua persetujuan
  | 'ARCHIVED'                     // Sudah diarsipkan Arsiparis

// Sub-status untuk tracking posisi NEED_REVISION
type RevisionTarget = 'USER' | 'PPK'
```

### Enum: Role Static (MVP — Tidak Perlu Workflow Builder)
```typescript
// Role di-hardcode, tidak bisa diedit admin di MVP
type Role = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS' | 'ADMIN'
```

### Enum: Step Approval Berjenjang
```typescript
// Track step saat ini (untuk membedakan IN_PPK_VALIDATION vs IN_BENDAHARA_APPROVAL)
type CurrentStep = 'PPK' | 'BENDAHARA'
```

---

### Tabel 1: `roles`
> Daftar peran dinamis dalam organisasi.

```typescript
roles: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL UNIQUE,          // e.g., "Kepala Seksi", "Arsiparis"
  deskripsi: text,
  created_at: timestamp DEFAULT now()
}
```

### Tabel 2: `user_roles`
> Mapping user Supabase Auth ke role. Satu user bisa punya banyak role.

```typescript
user_roles: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id: uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at: timestamp DEFAULT now(),
  UNIQUE(user_id, role_id)
}
```

### Tabel 3: `master_fungsi`
> Fungsi / Departemen dalam organisasi (BPS).

```typescript
master_fungsi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL UNIQUE,   // e.g., "Sosial", "Distribusi", "Neraca", "Produksi", "Umum", "IPDS"
  deskripsi: text,
  is_active: boolean DEFAULT true,
  created_at: timestamp DEFAULT now()
}
```

### Tabel 4: `master_kegiatan`
> Jenis kegiatan per fungsi.

```typescript
master_kegiatan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fungsi_id: uuid NOT NULL REFERENCES master_fungsi(id),
  nama: text NOT NULL,          // e.g., "SAKERNAS", "SUSENAS", "PODES"
  deskripsi: text,
  is_active: boolean DEFAULT true,
  created_at: timestamp DEFAULT now()
}
```

### Tabel 5: `master_kelengkapan_dokumen`
> Kelengkapan dokumen yang dibutuhkan per kegiatan × role (Ketua Tim vs Anggota).

```typescript
master_kelengkapan_dokumen: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id: uuid NOT NULL REFERENCES master_kegiatan(id),
  is_ketua_tim: boolean NOT NULL,   // true = untuk Ketua Tim, false = untuk Anggota
  nama_dokumen: text NOT NULL,       // e.g., "Laporan", "Form Permintaan", "KAK"
  required: boolean DEFAULT true,
  created_at: timestamp DEFAULT now()
}
```

### Tabel 6: `kegiatan`
> "Folder" / project container untuk dokumen-dokumen terkait (legacy — dipertahankan untuk grouping).
> "Folder" / project container untuk dokumen-dokumen terkait.

```typescript
kegiatan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul: text NOT NULL,
  deskripsi: text,
  created_by: uuid NOT NULL REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now()
}
```

### Tabel 7: `dokumen_transaksi`
> Transaksi dokumen yang sedang berjalan.

```typescript
dokumen_transaksi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id: uuid REFERENCES kegiatan(id),
  kelengkapan_id: uuid REFERENCES master_kelengkapan_dokumen(id),
  judul: text NOT NULL,
  fungsi_id: uuid REFERENCES master_fungsi(id),            // Fungsi/departemen pengaju
  kegiatan_jenis_id: uuid REFERENCES master_kegiatan(id),  // Jenis kegiatan
  is_ketua_tim: boolean NOT NULL DEFAULT false,            // Apakah submitter Ketua Tim
  status: StatusDokumen NOT NULL DEFAULT 'DRAFT',
  current_step: CurrentStep DEFAULT null,   // 'PPK' | 'BENDAHARA' — null saat DRAFT/COMPLETED/ARCHIVED
  revision_target: RevisionTarget DEFAULT null,  // 'USER' | 'PPK' — hanya saat NEED_REVISION
  lampiran_urls: jsonb DEFAULT '[]',   // Array of { nama, url, tipe, ukuran }
  created_by: uuid NOT NULL REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Tabel 8: `log_aktivitas`
> Audit trail — **APPEND ONLY**. Tidak ada UPDATE/DELETE.

```typescript
log_aktivitas: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id: uuid NOT NULL REFERENCES dokumen_transaksi(id),
  user_id: uuid NOT NULL REFERENCES auth.users(id),
  aksi: text NOT NULL,                 // e.g., "SUBMIT", "APPROVE", "REJECT", "REVISION_SENT"
  catatan: text,                       // Wajib diisi jika aksi = REJECT
  step_urutan: integer,                // Step ke berapa saat aksi dilakukan
  timestamp: timestamp DEFAULT now()
}
```

### Tabel 9: `arsip`
> Metadata arsip final untuk dokumen yang sudah COMPLETED dan di-approve Arsiparis.

```typescript
arsip: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id: uuid NOT NULL UNIQUE REFERENCES dokumen_transaksi(id),
  nomor_surat: text,                   // Diisi Arsiparis
  klasifikasi: text,                   // Diisi Arsiparis
  retensi: text,                       // e.g., "5 Tahun"
  catatan_arsiparis: text,
  archived_by: uuid REFERENCES auth.users(id),
  archived_at: timestamp DEFAULT now()
}
```

---

## 🔒 Architectural Invariants (HUKUM — Tidak Boleh Dilanggar)

1. **Data-First Rule:** Tidak ada page/component yang dibangun sebelum data shape-nya didefinisikan di sini.
2. **Layer Separation:**
   - Data fetching → `src/routes/` (server functions) atau `src/lib/`
   - Presentasi → `src/ui/` (komponen dumb)
   - Business logic → `src/components/` (komponen smart)
3. **Zod di Setiap Boundary:** Semua input API dan output harus divalidasi dengan Zod schema di `src/lib/schemas/`.
4. **SOP Before Code:** Jika logic berubah, update SOP di `docs/` terlebih dahulu sebelum ubah kode.
5. **No Magic Strings:** Semua route path, nama tabel DB, dan env var key harus didefinisikan sebagai typed constants.
6. **`.env` Keys Only:** Semua secrets di `.env`. Tidak ada secret hardcoded di `src/`.
7. **Audit Trail Sacred:** Tabel `log_aktivitas` adalah append-only. Tidak ada operasi UPDATE/DELETE pada tabel ini.
8. **FSM Strict:** Transisi status `dokumen_transaksi.status` hanya melalui fungsi state machine di `src/lib/fsm.ts`. Tidak ada manual update status di luar fungsi ini.
9. **Role Resolution di Server:** Pengecekan role RBAC selalu terjadi di server (server function / middleware SSR), bukan di client-side.

---

## ⚙️ Behavioral Rules (MVP)

### 1. RBAC — Role-Based Access Control
- Setiap user memiliki satu atau lebih Role (via tabel `user_roles`)
- **Setiap user BARU otomatis punya role PEGAWAI** — ini role default
- Role di-hardcode: PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN
- **Role Switcher:** Jika user punya > 1 role, ada dropdown di kanan atas (profile icon) untuk switch antar role
- **ADMIN tidak punya dropdown role** — akun dedicated, login terpisah
- Active role disimpan di session/client state, dipakai untuk middleware & sidebar
- Halaman dan aksi dikunci berdasarkan Role (middleware SSR)
- Supabase RLS = garis pertahanan kedua di level database

### 2. Workflow Berjenjang (PPK → Bendahara → Arsiparis)
- Alur di-hardcode — **tidak ada workflow builder** di MVP
- Tahapan tidak bisa diloncati:
  - DRAFT → IN_PPK_VALIDATION (oleh PEGAWAI)
  - IN_PPK_VALIDATION → IN_BENDAHARA_APPROVAL (oleh PPK, setelah validasi)
  - IN_BENDAHARA_APPROVAL → COMPLETED (oleh BENDAHARA, setelah approve)
  - COMPLETED → ARCHIVED (oleh ARSIPARIS, setelah arsip)
- Tracking step saat ini via kolom `current_step` ('PPK' | 'BENDAHARA')

### 3. Aturan Penolakan (Tolak Berjenjang)
- PPK menolak → `NEED_REVISION` dengan `revision_target = 'USER'` → USER perbaiki & resubmit
- Bendahara menolak → `NEED_REVISION` dengan `revision_target = 'PPK'` → PPK perbaiki & resubmit langsung ke Bendahara
- Catatan revisi **wajib** diisi saat menolak — form tidak bisa di-submit tanpa catatan
- Tolakan tidak mengubah `current_step` — tetap di step yang menolak

### 4. Audit Trail
- Setiap aksi = satu INSERT baru ke `log_aktivitas`
- **Tidak ada UPDATE atau DELETE** di tabel ini

### 5. Metadata Inheritance
- Informasi dari tahapan awal (judul, jenis form, assignee) otomatis diwarisi ke tahapan berikutnya
- User tidak perlu mengisi ulang konteks yang sudah ada

---

## 📁 Canonical File Structure

```
d:\GitHub\mvp\
├── AGENTS.md              ← Project Constitution (file ini) — HUKUM
├── task_plan.md           ← PRD / Blueprint / Phase Checklist
├── findings.md            ← Research, API constraints, discoveries
├── progress.md            ← Active task log, error history
├── DMS_PRD_TechStack.md   ← PRD sumber (referensi, jangan diubah)
├── .env                   ← Secrets (tidak pernah di-commit)
├── docs/                  ← Layer 1: SOPs
│   ├── routing-sop.md
│   ├── drizzle-schema.md
│   └── supabase-rls.md
├── src/
│   ├── routes/            ← TanStack file-based routes & server functions
│   ├── components/        ← Smart components (feature logic)
│   ├── ui/                ← Dumb/presentational components (shadcn/ui)
│   └── lib/
│       ├── db/            ← Drizzle schema & client
│       ├── schemas/       ← Zod schemas
│       ├── fsm.ts         ← Document status FSM (SATU-SATUNYA tempat transisi status)
│       └── supabase.ts    ← Supabase client (server & client)
└── .tmp/                  ← Scratch/intermediates (tidak di-commit)
```

---

*Last updated: 2026-04-01 | Phase: Protocol 0 — Initialization Complete | Status: READY FOR PHASE 1*
