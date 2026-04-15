# 📄 Dynamic Document Workflow Management System (DMS)
### Product Requirements Document — Versi Lengkap & Jelas

---

> [!IMPORTANT]
> Dokumen ini hadir dalam **dua versi**: **Detail** (arsitektur produksi penuh) dan **MVP** (versi awal yang pragmatis). Gunakan versi MVP untuk sprint pertama, lalu migrate ke versi Detail saat skala organisasi bertambah.

---

## 🏗️ 1. Tech Stack

> [!IMPORTANT]
> **Package Manager Eksklusif:** Seluruh instalasi library, penambahan modul, dan eksekusi command operasi project (seperti menjalankan aplikasi) **WAJIB menggunakan `pnpm`**. Hindari penggunaan `npm` atau `yarn`.

### 🔵 Versi MVP (Deploy Cepat, Supabase-Only)

| Layer | Teknologi | Alasan |
|---|---|---|
| **Framework** | TanStack Start (Fullstack SSR) | File-based routing, server functions built-in, TypeScript-first |
| **Language** | TypeScript | Type safety di seluruh stack |
| **Database** | Supabase (PostgreSQL) | Managed DB, free tier 500MB, RLS built-in |
| **Auth** | Supabase Auth | JWT + RLS bawaan, integrasi native |
| **File Storage** | Supabase Storage | Built-in, cukup untuk MVP (1GB free tier) |
| **ORM** | Drizzle ORM | Type-safe query, schema-as-code, ringan |
| **UI Components** | shadcn/ui | Headless + styled, copy-paste, tidak lock-in |
| **Validation** | Zod | Schema validation end-to-end (form → API → DB) |
| **Hosting** | Vercel atau Netlify | Deploy mudah untuk TanStack Start di MVP |
| **Package Manager**| pnpm | Wajib digunakan untuk semua instalasi dan command eksekusi proyek |

> [!NOTE]
> Di MVP, **semua I/O** (database, auth, file lampiran PDF) melewati satu platform: **Supabase**. Sangat sederhana untuk di-debug dan dikelola.

---

### 🟣 Versi Detail (Arsitektur Produksi Penuh)

| Layer | Teknologi | Alasan |
|---|---|---|
| **Framework** | TanStack Start (Fullstack SSR) | Sama seperti MVP |
| **Language** | TypeScript | Sama seperti MVP |
| **Database** | Supabase (PostgreSQL) | Primary database, RLS untuk multi-tenant |
| **Auth** | Supabase Auth | Sama seperti MVP |
| **File Storage** | **Cloudflare R2** | 10GB free tier, zero egress fee — jauh lebih hemat untuk file PDF masif |
| **ORM** | Drizzle ORM | Sama seperti MVP |
| **UI Components** | shadcn/ui | Sama seperti MVP |
| **Validation** | Zod | Sama seperti MVP |
| **Hosting** | **Cloudflare Workers** | Edge computing, low latency, satu ekosistem dengan R2 |
| **Package Manager**| pnpm | Sama seperti MVP |
| **CDN & Cache** | Cloudflare CDN | Otomatis bawaan Cloudflare Workers |

> [!TIP]
> Pola arsitektur Detail: **Metadata file** (nama, URL, tipe, ukuran) disimpan di **Supabase JSONB**, sementara **binary file** (PDF, docx) disimpan di **Cloudflare R2**. Ini adalah hybrid architecture standar industri.

---

## 🎯 2. Lima Pertanyaan Arsitektur Fundamental

---

### ❓ Pertanyaan 1 — North Star
**"What is the singular desired outcome of the application?"**

---

#### ✅ Versi MVP
> **Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh siapapun yang berwenang.**

Pada MVP, North Star-nya adalah: **menghapus kebingungan**. Tidak ada lagi "dokumen ini sudah sampai mana?" atau "siapa yang belum approve?". Semua digantikan oleh satu Inbox yang jelas dan satu status yang terpusat.

---

#### 🔮 Versi Detail
> **Mentransformasi setiap proses birokrasi organisasi menjadi alur kerja digital yang dapat dirancang, dieksekusi, dilacak, dan diaudit secara mandiri oleh Admin — tanpa satu baris kode pun.**

North Star versi Detail menargetkan **autonomy**. Admin bukan hanya pengguna, tetapi "arsitek proses". Mereka bisa menciptakan jenis dokumen baru, merangkai alur persetujuan yang kompleks, dan mengarsipkan hasilnya — semua melalui UI, bukan melalui developer.

---

### ❓ Pertanyaan 2 — Integrations
**"Which external services do we need?"**

---

#### ✅ Versi MVP — Integrasi Minimal

```
┌─────────────────────────────────────┐
│           SUPABASE (All-in-One)     │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │   PostgreSQL DB  │ │
│  └──────────┘  └──────────────────┘ │
│  ┌──────────────────────────────┐   │
│  │         Storage (1GB)        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
         Hosting: Vercel/Netlify
```

| Layanan | Tujuan | Status |
|---|---|---|
| Supabase Auth | Login, session, JWT | ✅ Wajib |
| Supabase PostgreSQL | Seluruh data aplikasi | ✅ Wajib |
| Supabase Storage | Upload file lampiran | ✅ Wajib |
| Vercel / Netlify | Hosting web app | ✅ Wajib |

---

#### 🔮 Versi Detail — Integrasi Hybrid

```
┌─────────────────┐      ┌──────────────────┐
│    SUPABASE     │      │   CLOUDFLARE     │
│                 │      │                  │
│  Auth + JWT     │      │  R2 Storage      │
│  PostgreSQL DB  │      │  (PDF/Files)     │
│  JSONB Metadata │─────▶│                  │
│                 │      │  Workers (HOST)  │
└─────────────────┘      └──────────────────┘
```

| Layanan | Tujuan | Status |
|---|---|---|
| Supabase Auth | Login, session, JWT, RLS policy | ✅ Wajib |
| Supabase PostgreSQL | Seluruh data struktural + metadata file | ✅ Wajib |
| Cloudflare R2 | Binary file storage (PDF, docx) — 10GB gratis | ✅ Wajib |
| Cloudflare Workers | Hosting edge TanStack Start | ✅ Wajib |
| Cloudflare CDN | Cache aset statis otomatis | 🎁 Bonus otomatis |

> [!NOTE]
> Tidak ada integrasi pihak ketiga lain yang diperlukan. Tidak ada email service, tidak ada payment gateway. Sistem ini adalah internal tool murni.

---

### ❓ Pertanyaan 3 — Source of Truth
**"Where does the primary data live?"**

---

#### ✅ Versi MVP

**Sumber kebenaran tunggal: Supabase PostgreSQL.**

Semua data — dari desain form, konfigurasi workflow, transaksi dokumen, hingga log audit — hidup di satu database PostgreSQL yang dikelola Supabase. File lampiran juga ada di Supabase Storage (blob), dengan referensinya disimpan di kolom DB.

**Tabel Inti MVP:**

```
master_kelengkapan_dokumen → Daftar dokumen yang wajib diunggah per kegiatan
workflow_definitions   → Konfigurasi alur & tahapan
workflow_steps         → Detail setiap langkah (aksi, role, revisi target)
kegiatan              → "Folder" kegiatan / project container
dokumen_transaksi     → Transaksi dokumen berjalan (dengan file lampiran)
log_aktivitas         → Audit trail (append-only, tidak bisa dihapus)
roles                 → Daftar peran dinamis
user_roles            → Mapping user ke role
arsip                 → Metadata arsip final
```

---

#### 🔮 Versi Detail

**Sumber kebenaran dibagi secara deliberate menjadi dua:**

| Jenis Data | Tempat | Format |
|---|---|---|
| Data struktural (form, workflow, status, log) | **Supabase PostgreSQL** | Relasional + JSONB |
| Binary files (PDF, docx, gambar) | **Cloudflare R2** | Object Storage |
| Referensi file | **Supabase PostgreSQL** | URL / key dalam kolom JSONB |
| Session & identitas | **Supabase Auth** | JWT |

> [!IMPORTANT]
> File di Cloudflare R2 **tidak bisa diakses langsung** oleh publik. Akses hanya melalui **pre-signed URL** yang di-generate oleh server (Cloudflare Workers), yang memvalidasi JWT Supabase terlebih dahulu. Ini memastikan keamanan file dokumen internal.

---

### ❓ Pertanyaan 4 — Delivery Payload
**"How and where should the final result/UI be delivered?"**

---

#### ✅ Versi MVP

**Delivery:** Web Application (SSR) yang dapat diakses melalui browser desktop.

```
Browser (Desktop) 
    ↓ HTTPS
TanStack Start SSR (Vercel/Netlify)
    ↓ Server Functions
Supabase (DB + Storage)
```

- **Format UI:** Server-Side Rendered HTML + shadcn/ui components
- **Interaktivitas:** React islands untuk form dinamis & inbox real-time
- **Responsivitas:** Desktop-first (target pengguna ~30 orang di kantor)
- **Output dokumen akhir:** URL / link ke file PDF yang disimpan di Supabase Storage, dapat dibuka di browser
- **Notifikasi:** Inbox in-app (tidak ada push notification atau email di MVP)

---

#### 🔮 Versi Detail

**Delivery:** Web Application (SSR) dengan edge rendering untuk performa maksimal.

```
Browser (Desktop/Tablet)
    ↓ HTTPS via Cloudflare CDN
TanStack Start (Cloudflare Workers — Edge SSR)
    ↓ JWT validation
Supabase DB ← → Cloudflare R2
```

- **Format UI:** Edge-rendered SSR + shadcn/ui
- **File Output:** Pre-signed URL dari Cloudflare R2 (expire dalam 1 jam) untuk download aman
- **Notifikasi:** Opsional di masa depan — Supabase Realtime untuk update Inbox tanpa refresh
- **Future:** Mobile-responsive progressif, namun bukan prioritas

---

### ❓ Pertanyaan 5 — Behavioral Rules
**"How should the system 'act'?"**

---

#### ✅ Versi MVP — Aturan Perilaku Inti

**1. RBAC — Role-Based Access Control**
- Setiap user memiliki satu atau lebih Role
- Halaman dan aksi dikunci berdasarkan Role (middleware SSR)
- Supabase RLS (Row Level Security) menjadi garis pertahanan kedua di level database

**2. Workflow Sequentiality (Urutan Ketat)**
- Tahapan N+1 tidak bisa dibuka sebelum tahapan N selesai
- Status dokumen adalah FSM (Finite State Machine): `DRAFT → IN_REVIEW → NEED_REVISION → COMPLETED`
- Transisi status hanya bisa dilakukan oleh Role yang ditugaskan di tahapan tersebut

**3. Aturan Penolakan (Rejection)**
- Penolakan hanya bisa dilakukan pada tahapan bertipe `APPROVE`
- Approver **wajib** mengisi "Catatan Revisi" (form tidak bisa di-submit tanpa catatan)
- Target revisi (tahapan yang dituju) sudah dikonfigurasi Admin saat desain workflow, bukan pilihan Approver

**4. Audit Trail — Append-Only**
- Setiap aksi menciptakan satu baris baru di tabel `log_aktivitas`
- Tidak ada `UPDATE` atau `DELETE` di tabel ini, hanya `INSERT`
- Kolom: `id, user_id, dokumen_id, aksi, catatan, timestamp`

**5. Metadata Inheritance**
- Informasi dari tahapan awal (judul kegiatan, jenis form, assignee) otomatis diwarisi ke tahapan berikutnya
- User tidak perlu mengisi ulang konteks yang sudah ada

---

#### 🔮 Versi Detail — Aturan Perilaku Tambahan

Semua aturan MVP berlaku, **ditambah:**

**6. Keamanan File (R2 Pre-signed URL)**
- File tidak pernah diekspos via URL publik permanen
- Setiap request file meng-generate pre-signed URL dengan TTL 1 jam
- Server memvalidasi JWT Supabase sebelum mengeluarkan pre-signed URL R2

**7. Admin Sandboxing**
- Admin bisa mengedit `master_kegiatan` dan `master_kelengkapan_dokumen` yang belum pernah digunakan
- Template/Workflow yang sudah memiliki transaksi aktif **tidak bisa diedit**, hanya bisa di-deprecate dan digantikan versi baru (versioning)

**8. Arsiparis Gate**
- Dokumen `COMPLETED` tidak langsung menjadi arsip
- Harus melewati review Arsiparis: tambah metadata (nomor surat, klasifikasi, retensi)
- Hanya setelah Arsiparis `APPROVE` dokumen menjadi `ARCHIVED` dan bisa dicari

**9. Multi-Trigger Policy**
- Workflow yang bersifat Ad-Hoc bisa dimulai oleh semua user yang memiliki Role yang sesuai
- Workflow Pre-Alur hanya bisa dimulai oleh user yang secara eksplisit di-assign oleh pimpinan
- Satu user tidak bisa memiliki dua instance aktif dari workflow yang sama secara bersamaan (bisa dikonfigurasi per workflow)

---

## 📦 3. PRD Ringkas — Scope Per Fase

### Fase 1 — Fondasi (MVP Sprint 1)
- [ ] Auth: Login/Logout via Supabase Auth
- [ ] CRUD Master Kegiatan dan Kelengkapan Dokumen
- [ ] CRUD Workflow Builder (+ step configuration, role assignment, revisi target)
- [ ] Inbox Tugas — tampilkan tugas sesuai Role user
- [ ] Eksekusi dokumen: Upload File Lampiran → simpan URL ke `dokumen_transaksi.lampiran_urls`
- [ ] Transisi status tahapan (FSM dasar)

### Fase 2 — Siklus Hidup (MVP Sprint 2)
- [ ] Fitur Penolakan + wajib isi Catatan Revisi
- [ ] Audit Trail (`log_aktivitas`) — append-only logging
- [ ] Upload file lampiran via Supabase Storage
- [ ] Polish UI/UX: loading states, empty states, error handling

### Fase 3 — Penyelesaian (MVP Sprint 3)
- [ ] Modul Arsiparis: Inbox, penambahan metadata, approval final
- [ ] Fitur pencarian dokumen arsip (full-text search PostgreSQL)
- [ ] Dashboard monitoring Admin (status seluruh dokumen)

### Fase 4 — Migrasi ke Detail (Post-MVP)
- [ ] Migrasi file storage dari Supabase Storage → Cloudflare R2
- [ ] Deploy ke Cloudflare Workers
- [ ] Implementasi pre-signed URL untuk keamanan file
- [ ] Template versioning untuk workflow yang sudah aktif

---

> [!TIP]
> **Untuk mulai coding:** Salin bagian "Aturan Perilaku MVP" dan "Tabel Inti MVP" ke dalam prompt Cursor/Copilot Anda. Mulai dari skema Drizzle untuk 9 tabel inti, lalu generate server functions Supabase-nya.
