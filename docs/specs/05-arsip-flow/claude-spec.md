# Synthesized Spec: 05 — Arsip Flow (Arsiparis)

## Problem Statement
Aplikasi DMS (Document Management System) sudah memiliki alur approval dokumen (PEGAWAI → PPK → Bendahara → COMPLETED). Sekarang perlu tahap akhir: **Arsiparis mengarsipkan dokumen yang sudah COMPLETED**, kemudian mengelola lifecycle arsip (aktif → verifikasi penyusutan → inaktif → usul musnah). Juga perlu halaman pencarian arsip yang bisa diakses semua user.

## Goals
1. Arsiparis bisa mengarsipkan atau menolak mengarsipkan dokumen yang sudah COMPLETED
2. Arsip memiliki lifecycle otomatis berdasarkan masa retensi (aktif → verifikasi → inaktif → musnah)
3. Arsiparis bisa memicu pemindahan manual ("Pindahkan Sekarang") kapan saja
4. Semua user bisa mencari dan melihat detail arsip

## Non-Goals (Explicit Exclusions)
- Edit dokumen setelah diarsipkan
- Export arsip (CSV/Excel)
- Hak akses per arsip (semua authenticated user bisa lihat semua arsip)
- Kategori arsip kustom (klasifikasi dari master data)

## Context & Constraints
- Tech stack: TanStack Start + Supabase + Tailwind v4 + TypeScript
- Auth pattern: role check via `user_roles` table dengan `user_roles.role.nama` join
- FSM sudah support `ARCHIVE` dan `SKIP` action dari status `COMPLETED`
- Preview pattern: iframe modal dengan signed URL 15 menit
- Log activity: semua state change harus di-log di `log_aktivitas`
- Cron: Supabase Edge Function dengan pg_cron schedule

## Key Decisions Made
1. **`status_arsip` di denormalized di tabel `arsip`** — query filter lebih cepat
2. **UNIQUE constraint pada `arsip_id` di sub-tables** — hanya satu record aktif per arsip per tahap
3. **Preview endpoint baru di `/api/arsip/[id]/preview/[filename]`** — scope jelas, reuse logic existing
4. **Cron auth: pg_cron internal** — tidak perlu secret key external
5. **RLS:**
   - `arsip`: SELECT = all authenticated, INSERT = ARSIPARIS/ADMIN
   - `arsip_verifikasi_penyusutan` & `arsip_usul_musnah`: SELECT/UPDATE = ARSIPARIS/ADMIN
   - `master_klasifikasi_arsip`: SELECT = all, INSERT/UPDATE/DELETE = ADMIN/ARSIPARIS
6. **Tidak bisa cancel dari VERIFIKASI_PENYUSUTAN** — harus tunggu decide
7. **Nomor surat uniqueness**: warning only, no DB constraint

## Assumptions
- Dokumen yang sudah diarsipkan (ARCHIVED) tidak bisa diedit
- Jika arsip akan dimusnahkan, file di storage dihapus tapi record `dokumen_transaksi` tetap ada
- Semua authenticated user bisa preview dan download arsip (tidak perlu role check khusus)

## Open Questions
- Tidak ada. Semua clarified via interview.