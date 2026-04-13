# Spec: 04 — Approval Flow (PPK → Bendahara)

## Overview
Alur persetujuan berjenjang: PPK memvalidasi dokumen yang diajukan pegawai → jika valid, diteruskan ke Bendahara untuk approve pencairan → jika Bendahara approve, status menjadi `COMPLETED`. Termasuk alur tolak berjenjang: PPK tolak (kembali ke USER) dan Bendahara tolak (kembali ke PPK).

---

## Background / Konteks
Ini adalah core workflow dari aplikasi. Tanpa fitur ini, dokumen hanya bisa diajukan tapi tidak pernah diproses. Alur persetujuan PPK → Bendahara adalah satu-satunya jalan untuk mengubah status dari `DRAFT` ke `COMPLETED`.

---

## User Stories
- Sebagai **PPK**, saya ingin melihat semua dokumen yang masuk untuk divalidasi, agar saya bisa memprosesnya tepat waktu.
- Sebagai **PPK**, saya ingin melihat detail dokumen beserta lampirannya, agar saya bisa menilai kelayakan dokumen.
- Sebagai **PPK**, saya ingin approve dokumen jika sudah valid, agar bisa diteruskan ke Bendahara.
- Sebagai **PPK**, saya ingin menolak dokumen jika ada masalah, dengan mengisi catatan revisi, agar pegawai tahu apa yang harus diperbaiki.
- Sebagai **PPK**, saya ingin resubmit dokumen yang ditolak Bendahara, agar bisa diproses ulang.
- Sebagai **Bendahara**, saya ingin melihat semua dokumen yang sudah divalidasi PPK, agar saya bisa approve pencairan.
- Sebagai **Bendahara**, saya ingin approve dokumen, agar status menjadi COMPLETED.
- Sebagai **Bendahara**, saya ingin menolak dokumen dengan catatan, agar PPK bisa memperbaikinya.

---

## Scope — Termasuk
- **PPK Inbox:** list dokumen dengan `status = IN_PPK_VALIDATION`
- **PPK Detail:** lihat detail + lampiran + catatan submit
- **PPK Approve:** set status → `IN_BENDAHARA_APPROVAL`, `current_step = 'BENDAHARA'`
- **PPK Reject:** set status → `NEED_REVISION`, `revision_target = 'USER'`, simpan catatan wajib
- **PPK Resubmit (Bendahara tolak):** edit lampiran jika perlu + resubmit → `IN_BENDAHARA_APPROVAL`
- **Bendahara Inbox:** list dokumen dengan `status = IN_BENDAHARA_APPROVAL`
- **Bendahara Detail:** lihat detail + lampiran + hasil validasi PPK
- **Bendahara Approve:** set status → `COMPLETED`, `current_step = null`
- **Bendahara Reject:** set status → `NEED_REVISION`, `revision_target = 'PPK'`, simpan catatan wajib
- Audit trail di `log_aktivitas` untuk setiap aksi (approve/reject/resubmit)
- Filter & sort inbox per role

---

## Scope — Tidak Termasuk
- Notifikasi email/ Push saat dokumen masuk ke inbox
- Delegasi PPK / Bendahara (satu user = satu role)
- Preview PDF di browser (download only)
- Dashboard statistik (ditunda ke fase monitoring)

---

## Data / Model / Schema

### Tabel `dokumen_transaksi` (relevant fields)
```typescript
dokumen_transaksi: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul: text NOT NULL,
  fungsi_id: uuid REFERENCES master_fungsi(id),
  kegiatan_jenis_id: uuid REFERENCES master_kegiatan(id),
  is_ketua_tim: boolean NOT NULL DEFAULT false,
  status: StatusDokumen NOT NULL DEFAULT 'DRAFT',
  current_step: CurrentStep DEFAULT null,  // 'PPK' | 'BENDAHARA'
  revision_target: RevisionTarget DEFAULT null,  // 'USER' | 'PPK'
  revision_notes: text DEFAULT null,      // Catatan penolakan
  lampiran_urls: jsonb DEFAULT '[]',
  created_by: uuid REFERENCES auth.users(id),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Tabel `log_aktivitas` (relevant fields)
```typescript
log_aktivitas: {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id: uuid NOT NULL REFERENCES dokumen_transaksi(id),
  user_id: uuid NOT NULL REFERENCES auth.users(id),
  aksi: text NOT NULL,  // 'SUBMIT' | 'PPK_APPROVE' | 'PPK_REJECT' | 'BENDAHARA_APPROVE' | 'BENDAHARA_REJECT' | 'RESUBMIT_PPK'
  catatan: text,         // Wajib saat REJECT
  step_urutan: integer,  // Untuk tracking, bukan FSM
  timestamp: timestamp DEFAULT now()
}
```

---

## Alur Pengguna (User Flow)

### PPK Validate & Approve
```
1. PPK buka "PPK Inbox" → lihat list dokumen dengan status IN_PPK_VALIDATION
       ↓
2. Klik dokumen → halaman detail
       ↓
3. PPK lihat:
   - Info dokumen (fungsi, kegiatan, judul, is_ketua_tim)
   - Waktu diajukan + nama pegawai
   - Daftar lampiran (download links)
       ↓
4. PPK aksi:
   A. Approve (Valid)
      → klik "Setujui"
      → sistem: status = 'IN_BENDAHARA_APPROVAL', current_step = 'BENDAHARA'
      → logged: aksi = 'PPK_APPROVE'
      → redirect ke inbox + notifikasi "Dokumen diteruskan ke Bendahara"
       ──────────────────────
   B. Reject (Tidak Valid)
      → klik "Tolak"
      → modal: wajib isi "Catatan Revisi"
      → sistem: status = 'NEED_REVISION', revision_target = 'USER', revision_notes = <isi form>
      → logged: aksi = 'PPK_REJECT'
      → redirect ke inbox + notifikasi "Dokumen dikembalikan ke pegawai"
```

### PPK Resubmit (Bendahara tolak)
```
1. PPK buka "PPK Inbox" → lihat dokumen dengan:
   - status = 'NEED_REVISION'
   - revision_target = 'PPK'
       ↓
2. Klik "Lihat" → halaman detail
       ↓
3. Tampilkan:
   - Catatan penolakan Bendahara (read-only)
   - Form edit lampiran (sama seperti submit awal)
       ↓
4. PPK perbaiki file jika perlu, atau langsung resubmit
       ↓
5. Klik "Resubmit ke Bendahara"
       ↓
6. Sistem: status = 'IN_BENDAHARA_APPROVAL', current_step = 'BENDAHARA'
   → logged: aksi = 'RESUBMIT_PPK'
```

### Bendahara Approve
```
1. Bendahara buka "Bendahara Inbox" → lihat list dengan status IN_BENDAHARA_APPROVAL
       ↓
2. Klik dokumen → halaman detail
       ↓
3. Bendahara lihat:
   - Info dokumen + hasil validasi PPK (tanggal, nama PPK)
   - Daftar lampiran (download links)
       ↓
4. Bendahara aksi:
   A. Approve
      → klik "Setujui Pencairan"
      → sistem: status = 'COMPLETED', current_step = null
      → logged: aksi = 'BENDAHARA_APPROVE'
      → redirect ke inbox + notifikasi "Dokumen selesai, menunggu arsip dari Arsiparis"
       ──────────────────────
   B. Reject
      → klik "Tolak"
      → modal: wajib isi "Catatan Penolakan"
      → sistem: status = 'NEED_REVISION', revision_target = 'PPK', revision_notes = <isi form>
      → logged: aksi = 'BENDAHARA_REJECT'
      → redirect ke inbox + notifikasi "Dokumen dikembalikan ke PPK"
```

---

## API / Server Functions

```typescript
// src/routes/api/ppk/inbox.ts
// GET /api/ppk/inbox   — list dokumen dengan status = IN_PPK_VALIDATION

// src/routes/api/ppk/dokumen/[id].ts
// GET /api/ppk/dokumen/[id]       — detail dokumen

// POST /api/ppk/dokumen/[id]/approve
//   → validasi role = PPK
//   → status = IN_BENDAHARA_APPROVAL, current_step = 'BENDAHARA'
//   → INSERT log_aktivitas (aksi = 'PPK_APPROVE')

// POST /api/ppk/dokumen/[id]/reject
//   Body: { catatan: string }
//   → validasi role = PPK
//   → validasi catatan tidak kosong
//   → status = NEED_REVISION, revision_target = 'USER', revision_notes = catatan
//   → INSERT log_aktivitas (aksi = 'PPK_REJECT')

// src/routes/api/ppk/resubmit/[id].ts
// POST /api/ppk/resubmit/[id]
//   → validasi: status = NEED_REVISION AND revision_target = 'PPK'
//   → validasi role = PPK
//   → UPDATE lampiran_urls jika ada perubahan
//   → status = IN_BENDAHARA_APPROVAL, current_step = 'BENDAHARA'
//   → INSERT log_aktivitas (aksi = 'RESUBMIT_PPK')

// src/routes/api/bendahara/inbox.ts
// GET /api/bendahara/inbox  — list dokumen dengan status = IN_BENDAHARA_APPROVAL

// src/routes/api/bendahara/dokumen/[id].ts
// GET /api/bendahara/dokumen/[id]   — detail dokumen + log validasi PPK

// POST /api/bendahara/dokumen/[id]/approve
//   → validasi role = BENDAHARA
//   → status = COMPLETED, current_step = null
//   → INSERT log_aktivitas (aksi = 'BENDAHARA_APPROVE')

// POST /api/bendahara/dokumen/[id]/reject
//   Body: { catatan: string }
//   → validasi role = BENDAHARA
//   → validasi catatan tidak kosong
//   → status = NEED_REVISION, revision_target = 'PPK', revision_notes = catatan
//   → INSERT log_aktivitas (aksi = 'BENDAHARA_REJECT')
```

---

## UI / Frontend

### Routes
```
/ppk/inbox              → list dokumen PPK
/ppk/dokumen/[id]       → detail + aksi approve/reject

/bendahara/inbox        → list dokumen Bendahara
/bendahara/dokumen/[id] → detail + aksi approve/reject
```

### PPK Pages

**1. PPK Inbox (`/ppk/inbox`)**
- Table: judul, fungsi, kegiatan, pegawai, tanggal diajukan, aksi
- Filter: fungsi, tanggal
- Status badge: IN_PPK_VALIDATION (kuning)
- Sort: terbaru di atas
- Empty state: "Tidak ada dokumen untuk divalidasi"

**2. PPK Detail (`/ppk/dokumen/[id]`)**
- Info header: judul, fungsi, kegiatan, nama pegawai, tanggal
- Badge: status (kuning IN_PPK_VALIDATION)
- Section lampiran: list download links
- 2 tombol aksi: [Setujui] [Tolak]
- Modal tolak: textarea "Catatan Revisi" (wajib, min 10 karakter)

**3. PPK Resubmit (Bendahara tolak)**
- Jika `status = NEED_REVISION` AND `revision_target = 'PPK'`:
  - Halaman detail tampilkan catatan Bendahara (read-only)
  - Section lampiran dengan tombol edit/upload
  - Tombol [Resubmit ke Bendahara]
  - Empty state jika bukan PPK yang harus resubmit

### Bendahara Pages

**1. Bendahara Inbox (`/bendahara/inbox`)**
- Table: judul, fungsi, kegiatan, pegawai, tanggal diajukan, tanggal validasi PPK, aksi
- Filter: fungsi, tanggal
- Badge: IN_BENDAHARA_APPROVAL (biru)
- Sort: terbaru di atas

**2. Bendahara Detail (`/bendahara/dokumen/[id]`)**
- Info header: judul, fungsi, kegiatan, pegawai
- Badge: IN_BENDAHARA_APPROVAL (biru)
- Section hasil validasi PPK: nama PPK, tanggal approve
- Section lampiran: download links
- 2 tombol aksi: [Setujui Pencairan] [Tolak]
- Modal tolak: textarea "Catatan Penolakan" (wajib)

### Komponen UI
- `InboxTable` — reusable table untuk PPK & Bendahara
- `ApprovalActions` — 2 tombol approve/reject
- `RejectModal` — modal dengan textarea catatan (wajib)
- `LogHistory` — timeline/log aktivitas di halaman detail
- `ValidationBadge` — badge "Divalidasi oleh [nama PPK] pada [tanggal]"

---

## Logic / Business Rules
- **Role check:** Setiap endpoint validasi role server-side. Non-PPK tidak bisa akses `/ppk/*`, non-Bendahara tidak bisa akses `/bendahara/*`.
- **Catatan wajib saat tolak:** Form tolak tidak bisa di-submit tanpa catatan (min 10 karakter).
- **Ownership PPK resubmit:** Hanya PPK yang approve originalmente yang bisa resubmit? (Asumsi: tidak perlu, semua PPK bisa resubmit dokumen yang kembali dari Bendahara.)
- ** Tidak bisa approve dokumen sendiri:** PPK/Bendahara tidak bisa approve dokumen yang dia ajukan (jika dia juga punya role PEGAWAI).
- **current_step tracking:** Kolom `current_step` ('PPK' | 'BENDAHARA' | null) membedakan step agar UI bisa menampilkan badge yang tepat.

---

## Dependensi
- **Bergantung pada:** Komponen 01 (Auth & RBAC) + Komponen 02 (Master Data) + Komponen 03 (Submit Flow)
- **Dibutuhkan oleh:** Komponen 05 (Arsip Flow) — karena COMPLETED → ARCHIVED

---

## Definition of Done
- [ ] PPK Inbox menampilkan dokumen IN_PPK_VALIDATION dengan benar
- [ ] PPK bisa lihat detail + lampiran dokumen
- [ ] PPK Approve → status IN_BENDAHARA_APPROVAL, logged, redirect
- [ ] PPK Reject → catatan wajib, status NEED_REVISION target USER, logged
- [ ] PPK tidak bisa approve/reject jika bukan role PPK
- [ ] Bendahara Inbox menampilkan dokumen IN_BENDAHARA_APPROVAL dengan benar
- [ ] Bendahara bisa lihat detail + hasil validasi PPK
- [ ] Bendahara Approve → status COMPLETED, logged, redirect
- [ ] Bendahara Reject → catatan wajib, status NEED_REVISION target PPK, logged
- [ ] PPK bisa resubmit dokumen yang ditolak Bendahara
- [ ] Resubmit hanya bisa jika NEED_REVISION + revision_target = PPK
- [ ] Semua aksi logged di log_aktivitas
- [ ] Halaman detail menampilkan log history
