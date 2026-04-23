# Implementation Plan: Spec 04 — Approval Flow (PPK → Bendahara)

## Overview

Implementasi alur persetujuan dua jenjang: PPK memvalidasi dokumen dari pegawai → jika valid, diteruskan ke Bendahara → jika Bendahara approve, status menjadi COMPLETED. Termasuk reject dengan catatan wajib dan resubmit oleh PPK dengan opsi edit lampiran.

Arsitektur: API routes (server-side) untuk semua mutation + page components (client-side) untuk inbox list dan detail.

---

## Architecture

```
Pages (client-side, fetch ke API):
  /ppk/inbox        → list IN_PPK_VALIDATION
  /ppk/tervalidasi  → list IN_BENDAHARA_APPROVAL (sudah PPK approve)
  /ppk/ditolak      → list NEED_REVISION (rejected by PPK, target=USER)
  /ppk/revisi       → list NEED_REVISION (rejected by Bendahara, target=PPK)
  /ppk/dokumen/[id] → detail + approve/reject actions
  /bendahara/inbox  → list IN_BENDAHARA_APPROVAL
  /bendahara/ditolak → list NEED_REVISION (rejected by Bendahara, target=PPK)
  /bendahara/selesai → list COMPLETED
  /bendahara/dokumen/[id] → detail + approve/reject actions

API Routes (server-side):
  /api/ppk/inbox                          GET
  /api/ppk/dokumen/[id]                   GET
  /api/ppk/dokumen/[id]/approve           POST
  /api/ppk/dokumen/[id]/reject            POST
  /api/ppk/resubmit/[id]                  POST (with optional lampiran update)
  /api/bendahara/inbox                   GET
  /api/bendahara/dokumen/[id]            GET
  /api/bendahara/dokumen/[id]/approve     POST
  /api/bendahara/dokumen/[id]/reject      POST

Helpers (existing):
  src/lib/fsm.ts           → transition() untuk semua status change
  src/lib/dokumen-helpers.ts → getDokumenById, updateDokumenStatus, insertLog
  src/lib/schemas/dokumen.ts → Zod schemas (add new ones)

New helper:
  src/lib/approval-helpers.ts → getDokumenListForRole(), filterByFungsiTanggal()
```

---

## Implementation Steps

### Step 1: Zod Schemas for Approval

**What:** Tambahkan Zod schemas untuk approval actions ke `src/lib/schemas/dokumen.ts`

**Why:** Validasi input di API boundary adalah mandatory (AGENTS.md Invariant #3). Approve tidak butuh body, reject butuh body dengan catatan wajib min 10 karakter.

**How:**
- `approveDokumenSchema` — empty object, strict()
- `rejectDokumenSchema` — { catatan: z.string().min(10) }
- `resubmitDokumenSchema` — { lampiranUrls?: LampiranUrl[] }

**Files affected:** `src/lib/schemas/dokumen.ts`

---

### Step 2: PPK Inbox API + Page

**What:** List dokumen dengan status IN_PPK_VALIDATION. Filter by fungsi + tanggal (server-side). Sort by created_at DESC.

**Why:** Inbox adalah landing page utama PPK. Server-side filter lebih efisien untuk data besar.

**How:**
- API route `GET /api/ppk/inbox` — query dokumen_transaksi where status='IN_PPK_VALIDATION', join fungsi+kegiatan, filter by optional query params (fungsi_id, start_date, end_date), order by created_at DESC
- Page `/ppk/inbox` — fetch API, render table dengan columns: No, Judul, Fungsi, Kegiatan, Pegawai, Tanggal Ajuan, Aksi (Lihat). Empty state jika tidak ada.
- Reuse table pattern dari `dokumen/saya.tsx`
- Status badge: IN_PPK_VALIDATION → kuning "Validasi PPK"

**Files affected:**
- `src/routes/api/ppk/inbox.ts` (new)
- `src/routes/ppk/inbox.tsx` (new)

---

### Step 3: PPK Detail Page + Approve/Reject

**What:** Halaman detail dokumen PPK (readonly info + lampiran list) dengan 2 tombol aksi. Reject pakai modal dengan textarea catatan wajib.

**Why:** PPK harus bisa lihat detail lengkap sebelum approve/reject. Modal untuk reject memastikan catatan selalu terisi.

**How:**
- API route `GET /api/ppk/dokumen/[id]` — fetch dokumen, verify role=PPK, verify status IN_PPK_VALIDATION, join user info (nama pegawai), join fungsi+kegiatan, join lampiran_urls
- Page `/ppk/dokumen/[id]` — render dokumen info, workflow indicator, lampiran list (dengan preview button + download button), tombol Setujui + Tolak
- Preview button → signed URL 15 menit → iframe modal
- Download button → signed URL 1 jam → trigger download
- Reject modal: overlay, textarea "Catatan Revisi" (required, min 10 char), tombol "Batal" + "Tolak Dokumen"
- Toast notification after action

**Files affected:**
- `src/routes/api/ppk/dokumen/$id.ts` (new)
- `src/routes/ppk/dokumen/$id.tsx` (new)

---

### Step 4: PPK Approve/Reject Actions

**What:** POST handlers untuk approve dan reject. FSM transition + DB update + log entry.

**Why:** Core approval workflow. Must use FSM, not direct status update.

**How:**
- `POST /api/ppk/dokumen/[id]/approve`:
  1. Auth + role check (PPK)
  2. Fetch dokumen, verify status = IN_PPK_VALIDATION
  3. Call `transition('IN_PPK_VALIDATION', 'APPROVE', 'PPK')`
  4. `updateDokumenStatus()` with newStatus='IN_BENDAHARA_APPROVAL', currentStep='BENDAHARA'
  5. `insertLog()` with aksi='PPK_APPROVE', stepUrutan=2
  6. Return success + redirect hint

- `POST /api/ppk/dokumen/[id]/reject`:
  1. Auth + role check (PPK)
  2. Validate body: { catatan } (min 10 char)
  3. Fetch dokumen, verify status = IN_PPK_VALIDATION
  4. Call `transition('IN_PPK_VALIDATION', 'REJECT', 'PPK', 'USER')`
  5. `updateDokumenStatus()` with newStatus='NEED_REVISION', revisionTarget='USER', revisionNotes=catatan
  6. `insertLog()` with aksi='PPK_REJECT', catatan, stepUrutan=1
  7. Return success

**Files affected:**
- `src/routes/api/ppk/dokumen/$id/approve.ts` (new)
- `src/routes/api/ppk/dokumen/$id/reject.ts` (new)

---

### Step 5: PPK Resubmit (from Bendahara Reject)

**What:** Halaman untuk PPK resubmit dokumen yang ditolak Bendahara. PPK bisa edit lampiran (hapus + upload baru) lalu resubmit.

**Why:** Dokumen yang ditolak Bendahara kembali ke PPK. PPK harus bisa perbaiki lampiran yang salah berdasarkan catatan Bendahara.

**How:**
- API route `POST /api/ppk/resubmit/[id]`:
  1. Auth + role check (PPK)
  2. Fetch dokumen, verify status=NEED_REVISION AND revision_target='PPK'
  3. Optional: update lampiran_urls if provided in body
  4. Call `transition('NEED_REVISION', 'RESUBMIT_PPK', 'PPK', 'PPK')`
  5. `updateDokumenStatus()` with newStatus='IN_BENDAHARA_APPROVAL', currentStep='BENDAHARA'
  6. `insertLog()` with aksi='RESUBMIT_PPK', stepUrutan=2

- Page `/ppk/revisi` — list dokumen NEED_REVISION where revision_target='PPK'. Table pattern similar to inbox but with "Lihat" button that leads to resubmit page.
- Page `/ppk/dokumen/[id]/resubmit` — show Bendahara's rejection notes (readonly), lampiran list with delete + upload buttons, tombol "Resubmit ke Bendahara"

**Files affected:**
- `src/routes/api/ppk/resubmit/$id.ts` (new)
- `src/routes/ppk/revisi.tsx` (new)
- `src/routes/ppk/dokumen/$id/resubmit.tsx` (new)

---

### Step 6: Bendahara Inbox API + Page

**What:** List dokumen dengan status IN_BENDAHARA_APPROVAL. Include info siapa PPK yang memvalidasi + kapan.

**Why:** Bendahara perlu tahu siapa PPK yang sudah approve sebelum dia approve.

**How:**
- API route `GET /api/bendahara/inbox` — query where status='IN_BENDAHARA_APPROVAL', join fungsi+kegiatan, join logs to find PPK_APPROVE entry for validation info (nama PPK, tanggal approve)
- Page `/bendahara/inbox` — similar table to PPK inbox but add column "Divalidasi oleh" + "Tanggal Validasi"
- Status badge: IN_BENDAHARA_APPROVAL → biru "Persetujuan Bendahara"

**Files affected:**
- `src/routes/api/bendahara/inbox.ts` (new)
- `src/routes/bendahara/inbox.tsx` (new)

---

### Step 7: Bendahara Detail Page + Approve/Reject

**What:** Halaman detail untuk Bendahara. Include hasil validasi PPK (nama + tanggal). Actions: Setujui Pencairan + Tolak.

**Why:** Bendahara approve = dokumen selesai. Perlu lihat hasil validasi PPK sebagai konteks.

**How:**
- API route `GET /api/bendahara/dokumen/[id]` — similar to PPK detail but include PPK validation info from log_aktivitas
- Page `/bendahara/dokumen/[id]` — dokumen info, validation badge "Divalidasi oleh [PPK] pada [tanggal]", lampiran list with preview+download, tombol Setujui Pencairan + Tolak
- Reject modal: textarea "Catatan Penolakan" (required, min 10 char)

**Files affected:**
- `src/routes/api/bendahara/dokumen/$id.ts` (new)
- `src/routes/bendahara/dokumen/$id.tsx` (new)

---

### Step 8: Bendahara Approve/Reject Actions

**What:** POST handlers untuk approve dan reject oleh Bendahara.

**Why:** Core bendahara workflow.

**How:**
- `POST /api/bendahara/dokumen/[id]/approve`:
  1. Auth + role check (BENDAHARA)
  2. Fetch, verify status=IN_BENDAHARA_APPROVAL
  3. `transition('IN_BENDAHARA_APPROVAL', 'APPROVE', 'BENDAHARA')`
  4. `updateDokumenStatus()` → COMPLETED, currentStep=null
  5. `insertLog()` with aksi='BENDAHARA_APPROVE', stepUrutan=2
  6. Return success

- `POST /api/bendahara/dokumen/[id]/reject`:
  1. Auth + role check (BENDAHARA)
  2. Validate body: { catatan } min 10 char
  3. Fetch, verify status=IN_BENDAHARA_APPROVAL
  4. `transition('IN_BENDAHARA_APPROVAL', 'REJECT', 'BENDAHARA', 'PPK')`
  5. `updateDokumenStatus()` → NEED_REVISION, revisionTarget='PPK', revisionNotes=catatan
  6. `insertLog()` with aksi='BENDAHARA_REJECT', catatan, stepUrutan=1
  7. Return success

**Files affected:**
- `src/routes/api/bendahara/dokumen/$id/approve.ts` (new)
- `src/routes/api/bendahara/dokumen/$id/reject.ts` (new)

---

### Step 9: PPK Tervalidasi & Ditolak Pages

**What:** List pages untuk status lain PPK (tervalidasi=IN_BENDAHARA_APPROVAL, ditolak=NEED_REVISION target=USER).

**Why:** Navigasi lengkap untuk PPK melihat semua dokumen yang pernah diproses.

**How:**
- `/ppk/tervalidasi` → fetch API getDocumentsByStatus(['IN_BENDAHARA_APPROVAL', 'COMPLETED', 'ARCHIVED']) for PPK's processed docs
- `/ppk/ditolak` → fetch documents NEED_REVISION where revision_target='USER' (dokumen PPK tolak kembali ke pegawai)

**Files affected:**
- `src/routes/ppk/tervalidasi.tsx` (new)
- `src/routes/ppk/ditolak.tsx` (new)

---

### Step 10: Bendahara Ditolak & Selesai Pages

**What:** List pages untuk Bendahara.

**How:**
- `/bendahara/ditolak` → documents NEED_REVISION where revision_target='PPK' (dokumen Bendahara tolak kembali ke PPK)
- `/bendahara/selesai` → documents COMPLETED

**Files affected:**
- `src/routes/bendahara/ditolak.tsx` (new)
- `src/routes/bendahara/selesai.tsx` (new)

---

## Edge Cases & Error Handling

1. **Double approve/reject** — Jika dokumen sudah tidak sesuai status, return 400 "Dokumen sudah tidak bisa diproses pada tahap ini"
2. **Non-PPK accessing PPK endpoint** — return 401/403
3. **Non-Bendahara accessing Bendahara endpoint** — return 401/403
4. **Reject without catatan** — Zod validation fails, return 400 with error
5. **Catatan kurang dari 10 karakter** — Zod validation fails, return 400 "Catatan minimal 10 karakter"
6. **PPK resubmit non-revision doc** — return 400 "Dokumen tidak dalam status perlu revisi"
7. **Preview URL expired** — signed URL di-generate on-demand per request (15 menit), modal harus refresh URL jika expired
8. **Concurrent actions** — tidak ada locking, tapi error message jelas jika status sudah berubah

---

## Integration Points

- **Spec 03 (Submit Flow):** Spec 04 menggunakan hasil submit dari Spec 03. Dokumen baru masuk IN_PPK_VALIDATION setelah pegawai submit.
- **Spec 05 (Arsip Flow):** Spec 04 menghasilkan status COMPLETED yang akan digunakan Spec 05 untuk archivе.
- **FSM (`src/lib/fsm.ts`):** Satu-satunya tempat untuk status transition. Dipakai di semua approve/reject/resubmit handlers.
- **log_aktivitas:** Append-only audit trail. Semua aksi approval logged.
- **Storage (`dokumen-lampiran`):** Preview dan download signed URL dari storage bucket yang sama.
- **Nav Config (`AppLayout.tsx`):** Sudah mendefinisikan route paths. Pages yang baru harus "built" (bukan "soon").

---

## Migration / Compatibility Notes

Tidak ada migration baru yang dibutuhkan. Schema `dokumen_transaksi` dan `log_aktivitas` sudah cukup untuk semua flow Spec 04.

Yang perlu diverifikasi: RLS policies pada `dokumen_transaksi` sudah mengizinkan PPK dan Bendahara melihat dokumen di step masing-masing.

---

## Open Questions (remaining)

1. ~~Filter server-side atau client-side?~~ → Server-side
2. ~~PPK resubmit: bisa edit lampiran?~~ → Ya, bisa hapus + upload baru
3. ~~Preview URL expiry?~~ → 15 menit
4. Apakah inbox count badge muncul di sidebar? → Ditunda, tidak ada di spec
5. Dokumen yang di-resubmit oleh PPK apakah perlu notifikasi ke Bendahara? → Spec tidak menyebutkan, jadi tidak