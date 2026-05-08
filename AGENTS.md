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
> Kelengkapan dokumen yang dibutuhkan per kegiatan × chain permintaan × role (Ketua Tim vs Anggota).

```typescript
master_kelengkapan_dokumen: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id: uuid NOT NULL REFERENCES master_kegiatan(id),
  is_ketua_tim: boolean NOT NULL,   // true = untuk Ketua Tim, false = untuk Anggota
  nama_dokumen: text NOT NULL,       // e.g., "Laporan", "Form Permintaan", "KAK"
  required: boolean DEFAULT true,
  // Chain filters (nullable - null means applies to all)
  jenis_permintaan_id: uuid REFERENCES master_jenis_permintaan(id),
  kategori_permintaan_id: uuid REFERENCES master_kategori_permintaan(id),
  detail_permintaan_id: uuid REFERENCES master_detail_permintaan(id),
  created_at: timestamp DEFAULT now()
}
```

### Tabel 6: `kegiatan`
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

### Tabel 6b: `ketua_tim_assignments`
> Mapping user ke kegiatan sebagai Ketua Tim.

```typescript
ketua_tim_assignments: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES auth.users(id),
  kegiatan_id: uuid NOT NULL REFERENCES master_kegiatan(id),
  created_at: timestamp DEFAULT now(),
  UNIQUE(user_id, kegiatan_id)
}
```

### Tabel 6c: `master_jenis_permintaan`
> Jenis permintaan untuk dokumen Material (hierarki level 1).

```typescript
master_jenis_permintaan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL,    // e.g., "Surat Perintah", "Kwitansi", "Daftar Gaji"
  created_at: timestamp DEFAULT now()
}
```

### Tabel 6d: `master_kategori_permintaan`
> Kategori permintaan (hierarki level 2), milik satu Jenis.

```typescript
master_kategori_permintaan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_permintaan_id: uuid NOT NULL REFERENCES master_jenis_permintaan(id),
  nama: text NOT NULL,    // e.g., "Honorarium", "Transport"
  created_at: timestamp DEFAULT now()
}
```

### Tabel 6e: `master_detail_permintaan`
> Detail permintaan (hierarki level 3), milik satu Kategori.

```typescript
master_detail_permintaan: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori_permintaan_id: uuid NOT NULL REFERENCES master_kategori_permintaan(id),
  nama: text NOT NULL,    // e.g., "Translok>8", "SBSN"
  created_at: timestamp DEFAULT now()
}
```

### Tabel 6f: `master_jenis_dokumen`
> Jenis dokumen untuk Non-Material.

```typescript
master_jenis_dokumen: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama: text NOT NULL,    // e.g., "Rapat", "Notulen", "Undangan"
  created_at: timestamp DEFAULT now()
}
```

### Tabel 7: `dokumen_transaksi`
> Transaksi dokumen yang sedang berjalan.

```typescript
dokumen_transaksi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul: text NOT NULL,
  fungsi_id: uuid REFERENCES master_fungsi(id),            // Fungsi/departemen pengaju
  kegiatan_jenis_id: uuid REFERENCES master_kegiatan(id),  // Jenis kegiatan
  is_ketua_tim: boolean NOT NULL DEFAULT false,            // Apakah submitter Ketua Tim
  tahun: integer,
  tanggal: text,                                          // Format: YYYY-MM-DD
  status: StatusDokumen NOT NULL DEFAULT 'DRAFT',
  current_step: CurrentStep DEFAULT null,   // 'PPK' | 'BENDAHARA' — null saat DRAFT/COMPLETED/ARCHIVED
  revision_target: RevisionTarget DEFAULT null,  // 'USER' | 'PPK' — hanya saat NEED_REVISION
  revision_notes: text,                       // Catatan revisi saat ditolak
  lampiran_urls: jsonb DEFAULT '[]',           // Array of { kelengkapan_id, nama, url, uploaded_at }
  nominal_realisasi: numeric(15,2),            // Nominal untuk dokumen Material
  is_non_material: boolean DEFAULT false,       // true = Non-Material, false = Material
  jenis_dokumen_id: uuid,                     // Untuk Non-Material
  keterangan_detail: text,                     // Keterangan tambahan
  jenis_permintaan_id: uuid,                  // Untuk Material (chain permintaan)
  kategori_permintaan_id: uuid,
  detail_permintaan_id: uuid,
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
│   ├── routeTree.gen.ts    ← Generated TanStack route tree
│   ├── router.tsx         ← Main router config
│   ├── routes/            ← TanStack file-based routes & server functions
│   │   ├── index.tsx     ← Landing/login page
│   │   ├── login.tsx
│   │   ├── forbidden.tsx
│   │   ├── profile.tsx
│   │   ├── dokumen/       ← Public/pegawai dokumen routes
│   │   ├── pegawai/      ← Pegawai role routes
│   │   ├── ppk/          ← PPK role routes
│   │   ├── bendahara/     ← Bendahara role routes
│   │   ├── arsiparis/     ← Arsiparis role routes
│   │   ├── admin/         ← Admin role routes (master data)
│   │   └── api/          ← REST API endpoints
│   │       ├── auth/       ← Auth endpoints (login, logout, session)
│   │       ├── dokumen/   ← Dokumen CRUD & submit
│   │       ├── ppk/       ← PPK endpoints (inbox, approve, reject)
│   │       ├── bendahara/ ← Bendahara endpoints
│   │       ├── arsiparis/ ← Arsiparis endpoints
│   │       ├── master-*/  ← Master data CRUD
│   │       └── admin/     ← Admin endpoints (cleanup, analyze)
│   ├── components/
│   │   ├── auth/          ← Auth components (RoleSwitcher, UserMenu)
│   │   ├── dashboard/     ← Dashboard layout (PageLayout, StatsBento)
│   │   ├── dokumen/       ← Document components (AttachmentEditor, AttachmentViewer, etc.)
│   │   ├── layout/        ← Layout components (AppLayout)
│   │   ├── laporan/       ← Laporan components (HierarchicalFilter)
│   │   └── ui/            ← shadcn/ui components
│   └── lib/
│       ├── db/            ← Drizzle schema & client
│       ├── schemas/       ← Zod schemas (dokumen.ts, auth.ts, master-data.ts)
│       ├── fsm.ts         ← Document status FSM (SATU-SATUNYA tempat transisi status)
│       ├── auth.ts         ← Auth helpers (getServerSession)
│       ├── guards.ts       ← Route guards (role-based access)
│       ├── supabase.ts    ← Supabase client factory
│       ├── supabase-server.ts ← Server-side Supabase client
│       ├── supabase-browser.ts ← Browser Supabase client
│       ├── supabase-admin.ts   ← Admin Supabase client (bypass RLS)
│       ├── dokumen-helpers.ts  ← Dokumen CRUD & storage helpers
│       ├── file-helpers.ts     ← File operations (legacy, ada duplikasi)
│       ├── storage-client.ts  ← Storage operations (getSignedUrl, download)
│       ├── master-data.ts     ← Master data helpers
│       ├── user-helpers.ts     ← User/role helpers
│       ├── utils.ts           ← Utility functions (cn, formatDate, etc.)
│       ├── utils/tahun.ts     ← Tahun utilities
│       └── types/
│           ├── auth.ts    ← Auth types
│           ├── fsm.ts     ← FSM types
│           └── user.ts    ← User types
└── .tmp/                  ← Scratch/intermediates (tidak di-commit)
```

---

## 🔧 Key Implementation Patterns

### Storage Path Pattern
```
PENDING files: {userId}/{timestamp}-{random}-{filename}.{ext}
  → Format: 1778064971564-caqghvva3no-Daftar_Absensi.pdf
  → Diproses saat upload, sebelum submit

FORMAL files: {userId}/{dokId}/{uuid}.{ext}
  → Format: 5bf798f0-d824-468f-9985-b8964f883d5a/bb6a9668-.../3c86de66.pdf
  → Setelah submit, file di-rename dari PENDING ke formal
```

### Centralized Helpers
```typescript
// dokumen-helpers.ts
syncDocumentAttachments()   ← Rename PENDING files + track old files for deletion
deleteOrphanFiles()         ← Delete orphaned files from storage
isStoragePathPending()       ← Check if path is PENDING format
buildDokumenFilename()       ← Build display filename (kelengkapan_leafNode_kegiatan_tanggal)
buildStorageFilename()       ← Build filename based on storage path type

// storage-client.ts
getSignedUrl()                ← Get signed URL from storage path
downloadWithSignedUrl()       ← Download file with signed URL
formatDateTime()             ← Format ISO date to Indonesian format
```

### Workflow: Submit → Resubmit
```
Pegawai Ajukan → PATCH /api/dokumen/submit (create)
              → POST /api/dokumen/$id/submit (submit FSM)

PPK Tolak → NEED_REVISION:USER
Pegawai Revisi → PATCH /api/dokumen/$id (update lampiran)
              → POST /api/dokumen/$id/submit (resubmit FSM)

Bendahara Tolak → NEED_REVISION:PPK
PPK Resubmit → PATCH /api/ppk/resubmit/$id (update lampiran)
             → POST /api/ppk/resubmit/$id (resubmit FSM)
```

---

*Last updated: 2026-05-06 | Phase: Protocol 1 — Core Features Complete | Status: ACTIVE DEVELOPMENT*
