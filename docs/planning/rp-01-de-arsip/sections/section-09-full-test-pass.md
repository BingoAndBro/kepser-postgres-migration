# Section 09 — Full Test Pass

## Context

Semua perubahan kode landing (section 01–08). RP-01 bagian I menyebut ±12 file test
memakai istilah lama. Section ini memastikan `pnpm test` hijau seluruhnya dan tidak
ada regresi di domain yang tak tersentuh (`dokumen`, `fsm`, `storage`).

## Objective

`pnpm test` (`vitest run`) hijau; test yang menegakkan perilaku/istilah lama
diperbarui menegakkan perilaku baru.

## Prerequisites

- Section 01–08 selesai.

## Implementation Steps

1. Jalankan `pnpm test`. Catat kegagalan per file.
2. Perbaiki file test yang menyebut istilah/perilaku lama:
   - `tests/unit/arsiparis/berkas-arsip-service.test.ts` — transisi `mark_inactive`
     dihapus; tambah `AKTIF→USUL_MUSNAH`, `cancel_proposal`, event assertion.
   - `tests/unit/arsiparis/berkas-arsip-schema.test.ts` — `closeBerkasMetadataSchema`
     satu field; enum aksi.
   - `tests/unit/arsiparis/berkas-arsip-read-model.test.ts` — field umur/jatuh
     tempo; tanpa `INAKTIF`.
   - `tests/unit/arsiparis/berkas-arsip-api.test.ts` — filter status; DTO baru.
   - `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts` — judul seksi
     "Pemberkasan Arsip Aktif" pindah ke ekspektasi `/arsiparis/berkas/tertutup`;
     tombol baru.
   - `tests/unit/arsiparis/berkas-arsip-csv.test.ts` — header kolom.
   - `tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts` — frasa
     **internal** `HAPUS FILE FISIK ARSIP` tetap; bila ada assertion user-facing
     `MUSNAHKAN DATA FILE`, ganti `BERSIHKAN FILE BERKAS`.
   - `tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts` — "Cara
     Pembayaran".
   - `tests/unit/arsiparis/manual-arsip-route.test.ts`,
     `tests/unit/arsiparis/workflow-archive-route.test.ts` — label.
   - `tests/unit/arsiparis/berkas-activity-dev-reset.test.ts` — bila mengecek nilai
     `INAKTIF`.
   - `tests/unit/components/ui-foundation.test.ts` — label `StatusBadge`.
   - `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts` — kartu
     dashboard KSBU.
3. `tests/e2e/**`: cari spec yang menavigasi `/arsiparis/inaktif` atau
   `/arsiparis/usul-musnah`; update path & label. **Jalankan E2E hanya bila diminta
   manusia** (AGENTS.md Testing Expectations).
4. Pastikan suite `tests/unit/dokumen/**`, `tests/fsm.test.ts`,
   `tests/unit/storage/**` tetap hijau (tak tersentuh RP-01).
5. `git diff --stat` — konfirmasi tidak ada perubahan di `src/db/**`,
   `drizzle/**`, `package.json`, `pnpm-lock.yaml`. `src/routeTree.gen.ts` hanya 3
   route (section-05).

## Files to Create/Modify

- File test di atas (dan turunannya yang gagal saat run).

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 9".
- [ ] `pnpm test` hijau seluruhnya.
- [ ] Test lama `mark_inactive`-valid → menegakkan penolakan.
- [ ] Judul seksi Arsip Aktif dipindah ke ekspektasi halaman Tertutup.
- [ ] Frasa internal destruction tetap; frasa user-facing diganti.
- [ ] Nol regresi di `dokumen` / `fsm` / `storage`.

## Definition of Done

- [ ] `pnpm test` exit 0.
- [ ] Diff test hanya menyangkut istilah/perilaku RP-01.
- [ ] Tidak ada perubahan schema/migrasi/package.
- [ ] E2E diperbarui bila ada & bila diminta.
