# Synthesized Spec: 03 — Submit Flow

## Problem Statement

Aplikasi DMS BPS perlu memberi kemampuan kepada pegawai untuk mengajukan dokumen dengan alur: pilih fungsi → pilih kegiatan → tentukan role (Ketua Tim) → upload lampiran sesuai kelengkapan → submit. Dokumen kemudian masuk ke alur persetujuan berjenjang (PPK → Bendahara → Arsiparis). Tanpa fitur ini, tidak ada dokumen yang bisa diproses.

## Goals

1. Pegawai bisa mengajukan dokumen baru melalui multi-step form (5 step)
2. Sistem menampilkan kelengkapan dinamis berdasarkan kegiatan + role (Ketua Tim vs Anggota)
3. File lampiran di-upload ke Supabase Storage dan tersimpan sebagai signed URL
4. Dokumen masuk alur persetujuan dengan status `IN_PPK_VALIDATION`
5. Pegawai bisa melihat daftar dokumen yang diajukan beserta statusnya
6. Pegawai bisa resubmit dokumen yang ditolak PPK

## Non-Goals

- Edit dokumen setelah submit (selain resubmit NEED_REVISION)
- Multiple files per kelengkapan
- Preview PDF di browser (download only)
- Notifikasi email/push saat status berubah
- Bulk submission

## Context & Constraints

- Spec 01 (Auth & RBAC) dan Spec 02 (Master Data) harus selesai lebih dulu
- FSM transitions HARUS lewat `src/lib/fsm.ts` — tidak boleh direct update status
- log_aktivitas adalah append-only — INSERT only, NO UPDATE/DELETE
- Semua input API harus divalidasi dengan Zod schema
- RBAC guards di server-side, bukan client-side
- Storage menggunakan signed URLs (private, on-demand generation)

## Key Decisions Made

1. **Judul auto**: `[Nama Kegiatan] [Tahun] [Nama Pegawai]` — contoh: "SAKERNAS 2026 Amara Setiadi"
2. **Tahun & Tanggal**: User input manual di Step 1 (Fungsi) — bukan auto dari system
3. **Year dropdown**: Range 5 tahun ke belakang + 2 tahun ke depan
4. **Tanggal**: Date picker (DD/MM/YYYY)
5. **1 ajuan = 1 dokumen_transaksi**: Banyak lampiran per dokumen (1 file per kelengkapan)
6. **Upload**: Direct upload via `supabaseAdmin.storage.from().upload()` — MVP simplicity
7. **Download**: Signed URL on-demand via `supabaseAdmin.storage.from().createSignedUrl()` — URL expire 1 jam
8. **Cleanup orphan files**: Supabase Database Trigger — DELETE dokumen_transaksi → auto-delete Storage files
9. **Resubmit**: Hanya bisa jika `status = NEED_REVISION` AND `revision_target = 'USER'`
10. **Storage path**: `[user_id]/[dokumen_id]/[kelengkapan_id]_[filename]`
11. **File types**: PDF, DOC, DOCX, XLS, XLSX, max 10MB per file

## Assumptions

1. Supabase Storage bucket `dokumen-lampiran` sudah dibuat dan RLS policies sudah diterapkan
2. Migration `003_dokumen_transaksi.sql` sudah dijalankan
3. FSM `transition()` function di `src/lib/fsm.ts` sudah ada dan exports `TransitionResult`
4. `supabaseAdmin` client sudah ada di `src/lib/supabase-admin.ts`
5. Auth guards (`requireAuth`, `guardRole`) sudah ada di `src/lib/auth.ts`

## Open Questions

- **Konfirmasi**: Apakah tahun dropdown cukup range 2020-2030 atau perlu lebih dinamis?
- **Konfirmasi**: Apakah user bisa cancel upload file di tengah-tengah (abort upload)?
- **Konfirmasi**: Apakah detail halaman perlu menampilkan preview/thumbnail untuk file non-PDF?
