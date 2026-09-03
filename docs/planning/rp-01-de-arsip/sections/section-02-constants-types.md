# Section 02 — Konstanta, Tipe, Label Activity

## Context

Section-01 sudah menyinkronkan dokumen konstitusi. Sekarang siapkan konstanta yang
dipakai silang oleh semua layer: route constants (untuk navigasi & halaman), helper
status, dan label activity. **Nilai enum & event type tidak berubah** (dipakai DB
CHECK constraint — target tanpa migrasi).

## Objective

- `archive-status.ts`: helper resting-status + komentar deprecated `INAKTIF`,
  `ARCHIVE_STATUS_VALUES` **utuh**.
- `routes.ts` grup KSBU: `INAKTIF` dihapus, `USUL_MUSNAH` → `PEMBERSIHAN`
  (`/arsiparis/pembersihan`), tambah `BERKAS_TERTUTUP` (`/arsiparis/berkas/tertutup`).
- `berkas-arsip-activity.ts`: `BERKAS_ACTIVITY_EVENT_LABELS` di-relabel; `..._TYPES`
  **utuh**.

## Prerequisites

- Section 01 selesai.
- Catatan: setelah section ini, `tsc` akan merah di `inaktif/index.tsx`,
  `navigation.ts`, `arsiparis/index.tsx` sampai section-05/06 (lihat plan
  "Build-red windows"). Ini disengaja.

## Implementation Steps

1. **`src/lib/constants/archive-status.ts`:**
   - Biarkan `ARCHIVE_STATUS_VALUES`, `ARCHIVE_STATUS`, `BERKAS_ARCHIVE_STATUS_*`
     apa adanya.
   - Tambah `export const BERKAS_RESTING_STATUS = 'AKTIF' as const` (tipe
     `StatusArsip`).
   - Tambah komentar blok di atas `ARCHIVE_STATUS_VALUES`:
     `// 'INAKTIF' dipertahankan untuk kompat DB CHECK constraint. Sejak RP-01`
     `// nilai ini TIDAK dipakai di alur lifecycle berkas.`
2. **`src/lib/constants/routes.ts` grup `KEPALA_SUB_BAGIAN_UMUM` (±ln 31-37):**
   - Hapus baris `INAKTIF: '/arsiparis/inaktif',`.
   - Ganti `USUL_MUSNAH: '/arsiparis/usul-musnah',` →
     `PEMBERSIHAN: '/arsiparis/pembersihan',`.
   - Tambah `BERKAS_TERTUTUP: '/arsiparis/berkas/tertutup',` (setelah `BERKAS_AKTIF`).
   - Biarkan `BERKAS_AKTIF: '/arsiparis/berkas'`.
3. **`src/lib/archive/berkas-arsip-activity.ts`:**
   - `BERKAS_ACTIVITY_EVENT_TYPES` **tidak diubah**.
   - `BERKAS_ACTIVITY_EVENT_LABELS`:
     - `BERKAS_DIPINDAHKAN_KE_INAKTIF`: `'Berkas dipindahkan ke Inaktif (usang)'`
       (event ini tak lagi ditulis runtime — cukup tandai).
     - `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH`: `'Berkas diusulkan untuk pembersihan'`.
     - `BERKAS_DIMUSNAHKAN`: `'File berkas dibersihkan'`.
     - `METADATA_ARSIP_AKTIF_DIPERBARUI`: biarkan
       `'Metadata arsip aktif diperbarui'` (dipakai juga `cancel_proposal`).
4. **Grep & catat** (belum tentu diperbaiki di section ini — biarkan TS error jadi
   penanda): `grep -rn "KEPALA_SUB_BAGIAN_UMUM.INAKTIF\|KEPALA_SUB_BAGIAN_UMUM.USUL_MUSNAH" src/`.

## Files to Create/Modify

- `src/lib/constants/archive-status.ts` — helper + komentar.
- `src/lib/constants/routes.ts` — grup KSBU: remove/rename/add.
- `src/lib/archive/berkas-arsip-activity.ts` — 3 label.

## Test Stubs

(`../claude-plan-tdd.md` "Tests for: Step 2".)
- [ ] `BERKAS_RESTING_STATUS === 'AKTIF'`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM.PEMBERSIHAN === '/arsiparis/pembersihan'`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM.BERKAS_TERTUTUP === '/arsiparis/berkas/tertutup'`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM` tanpa key `INAKTIF` & `USUL_MUSNAH`.
- [ ] `BERKAS_ACTIVITY_EVENT_LABELS.BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH` = "Berkas
      diusulkan untuk pembersihan".
- [ ] `BERKAS_ACTIVITY_EVENT_LABELS.BERKAS_DIMUSNAHKAN` = "File berkas dibersihkan".
- [ ] **Regression:** `ARCHIVE_STATUS_VALUES` isi & urutan tak berubah.
- [ ] **Regression:** `BERKAS_ACTIVITY_EVENT_TYPES` 8 nilai tak berubah.

## Definition of Done

- [x] Tiga file src diubah sesuai langkah (`archive-status.ts` +
      `BERKAS_RESTING_STATUS` + komentar; `routes.ts` grup KSBU remove/rename/add;
      `berkas-arsip-activity.ts` 3 label).
- [x] Test hijau — `tests/unit/arsiparis/rp01-de-arsip-constants.test.ts` (6 tests).
- [x] `ARCHIVE_STATUS_VALUES` & `BERKAS_ACTIVITY_EVENT_TYPES` tak berubah
      (2 regression test lulus).
- [x] TS error hanya di `src/config/navigation.ts` (2 ref) & `src/routes/arsiparis/index.tsx`
      (2 ref) — ditangani section 05 & 06f. `inaktif/index.tsx` tidak memakai
      konstanta rute (dihapus section-05).

## Deviasi dari rencana

- Nama file test: `tests/unit/arsiparis/rp01-de-arsip-constants.test.ts` (baru,
  fokus RP-01) alih-alih memperluas test navigasi yang ada. Test navigasi
  (`roles-navigation.test.ts`) & label lain tetap ditangani section-09.
