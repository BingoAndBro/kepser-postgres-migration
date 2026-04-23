# Synthesized Spec: Spec 04 — Approval Flow (PPK → Bendahara)

## Problem Statement

Dokumen yang diajukan pegawai harus mendapat persetujuan dua jenjang (PPK dan Bendahara) sebelum status menjadi COMPLETED. Tanpa fitur ini, dokumen hanya bisa diajukan tapi tidak pernah diproses ke tahap selesai.

## Goals

1. PPK bisa melihat daftar dokumen yang masuk (`IN_PPK_VALIDATION`), validasi, approve, atau reject dengan catatan
2. PPK bisa resubmit dokumen yang ditolak Bendahara, dengan opsi hapus/upload ulang lampiran yang salah
3. Bendahara bisa melihat daftar dokumen yang sudah divalidasi PPK (`IN_BENDAHARA_APPROVAL`), approve, atau reject dengan catatan
4. Semua aksi (approve/reject/resubmit) logged ke `log_aktivitas`
5. Preview dokumen inline di halaman detail (tanpa download)

## Non-Goals (Explicit Exclusions)

- Notifikasi email/push saat dokumen masuk
- Delegasi PPK/Bendahara ke user lain
- Dashboard statistik / analytics

## Context & Constraints

- FSM sudah diimplementasi (`src/lib/fsm.ts`) — HARUS dipakai, tidak boleh direct status update
- `log_aktivitas` adalah append-only — hanya INSERT, tidak UPDATE/DELETE
- Auth: server-side dengan `getServerSession()` + role check
- Preview: signed URL 15 menit (bukan 1 jam seperti download)
- Storage bucket `dokumen-lampiran` dengan path `[user_id]/[kelengkapan_id]_[timestamp]_[filename]`
- Tidak ada Drizzle ORM — menggunakan Supabase client (PostgREST) dengan helper functions di `src/lib/dokumen-helpers.ts`

## Key Decisions Made

1. **Server-side filtering** — filter fungsi/tanggal dilakukan di API route, tidak di browser
2. **PPK resubmit with lampiran edit** — PPK bisa hapus file yang salah + upload baru saat resubmit, file lama tetap di storage
3. **15-minute preview** — signed URL untuk iframe preview expire dalam 15 menit (15 menit vs 1 jam untuk download)
4. **Reuse existing helpers** — `getDokumenById`, `updateDokumenStatus`, `insertLog` dipakai ulang, tidak buat yang baru
5. **No new schemas** — menambah schema ke `src/lib/schemas/dokumen.ts` yang sudah ada

## Assumptions

1. RLS policies `dokumen_transaksi` sudah mengizinkan PPK dan Bendahara melihat dokumen di step masing-masing (via `userHasApproverRole`)
2. User dengan role PPK sudah punya record di `user_roles` dengan `role.nama = 'PPK'`
3. Dokumen dalam status `IN_PPK_VALIDATION` hanya bisa diapprove/reject oleh user dengan role PPK
4. Dokumen dalam status `IN_BENDAHARA_APPROVAL` hanya bisa diapprove/reject oleh user dengan role BENDAHARA

## Open Questions

1. ~~Filter dilakukan di server atau client?~~ → **Server-side**
2. ~~PPK resubmit: bisa edit lampiran atau tidak?~~ → **Ya, bisa hapus file lama + upload baru**
3. ~~Preview signed URL expiry?~~ → **15 menit**
4. Apakah perlu inbox count badge di sidebar? → Spec tidak menyebutkan, ditunda