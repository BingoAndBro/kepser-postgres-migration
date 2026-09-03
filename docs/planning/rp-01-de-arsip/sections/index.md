# Section Index — RP-01: De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

Basis: "Urutan kerja yang disarankan" RP-01 (10 langkah). Satu section = satu langkah.
Baca `../claude-plan.md` untuk konteks penuh; `../claude-plan-tdd.md` untuk test stub.

## Prasyarat lingkungan (manual, sekali)

- **Reset DB dev** atas baris `berkas_arsip.status_arsip = 'INAKTIF'** (keputusan K1),
  mengikuti pola `docs/migration/phase-15l3c5b-controlled-dev-archive-data-reset-plan.md`.
  Dilakukan manusia sebelum QA section-04/06. Tidak ada skrip baru.
- Fase implementasi **wajib** membaca `.agent/skills/ui-ux-pro-max/SKILL.md`
  (section-06, section-07) dan `.agent/skills/db-fsm-guard/SKILL.md`
  (section-03, section-04).

## Execution Order

Berurut 01 → 10. Alasan:
- **01 (docs) wajib pertama** — invariant "Update docs before behavior changes".
- **02 (konstanta)** memberi route/status constants untuk semua section berikut.
- **03 (helper/service) sebelum 04 (API)** — API menumpang tipe & fungsi service/read-model.
- **05 (route gen)** setelah constants (02) siap; menghasilkan `routeTree.gen.ts` sekali.
- **04 dan 06 harus berdekatan** — `closeBerkasMetadataSchema` `.strict()` (lihat
  "Build-red windows" di plan). 06 tidak boleh tertunda lama setelah 04.
- **07 (komponen bersama)** bisa paralel dengan 06.
- **08 (sweep) → 09 (pnpm test) → 10 (penjelasan-proyek)** penutup.

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | `section-01-docs-constitution.md` | Update `AGENTS.md` + `docs/migration/README.md` (lifecycle 2-tahap, 1 field retensi, route add/remove/rename, frasa `BERSIHKAN FILE BERKAS`) | — | No |
| 02 | `section-02-constants-types.md` | `archive-status.ts` helper + komentar, `routes.ts` (hapus INAKTIF, rename→PEMBERSIHAN, tambah BERKAS_TERTUTUP), `berkas-arsip-activity.ts` label | 01 | No |
| 03 | `section-03-backend-helpers.md` | `retention.ts` (`calculateBerkasDueDate`), `berkas-arsip-service.ts` (transisi + event action-aware), `berkas-arsip-read-model.ts` (umur/jatuh tempo, -INAKTIF), `page-format.ts` (label+aksi) + **test unit** | 02 | No |
| 04 | `section-04-zod-api-routes.md` | `schemas/berkas-arsip.ts` (1 field), `api/.../lifecycle.ts` (enum aksi), `api/.../berkas/index.ts` & `$id.ts` (whitelist umur/jatuh tempo), pesan "Cara Pembayaran" + **test** | 03 | No |
| 05 | `section-05-nav-route-generation.md` | `navigation.ts` (2 item menu + ikon), hapus `inaktif/`, rename `usul-musnah/`→`pembersihan/`, buat `berkas/tertutup.tsx` (stub), **route generation** + verifikasi diff | 02 | Yes (dengan 03/04) |
| 06 | `section-06-ui-pages.md` | Isi/relabel 10 halaman: Berkas Terbuka, Berkas Tertutup (baru), detail `$id`, `CloseBerkasDialog`, Pembersihan, dashboard KSBU, inbox, penambahan, klasifikasi, dokumen detail + **test halaman** | 03, 04, 05 | No |
| 07 | `section-07-shared-components.md` | `StatusBadge.tsx` (label status arsip, -INAKTIF), `StatsBento.tsx` (tile Inaktif hapus, relabel) + **test** | 02 | Yes (dengan 06) |
| 08 | `section-08-label-sweep-csv.md` | `berkas-arsip-csv.ts` (header "Cara Pembayaran" + "Umur Berkas", filename), `berkas-klasifikasi-eligibility.ts`, `manual-arsip.ts`, sapuan `grep` + **test csv** | 03, 06, 07 | No |
| 09 | `section-09-full-test-pass.md` | `pnpm test` (vitest run) hijau; perbaiki ±12 file test istilah lama; E2E bila diminta | 01–08 | No |
| 10 | `section-10-sync-penjelasan-proyek.md` | Sinkron label PB-6 `docs/penjelasan-proyek.md`; (opsional) status RP-01 → `Selesai` di `docs/rencana-perubahan.md` | 01–09 | No |

## Definition of Done keseluruhan (RP-01)

- [ ] `AGENTS.md` + `docs/migration/README.md` + `docs/penjelasan-proyek.md` sinkron.
- [ ] Lifecycle runtime: `AKTIF → USUL_MUSNAH → DIMUSNAHKAN` + `cancel_proposal`;
      `mark_inactive` ditolak.
- [ ] Form Tutup Berkas 1 field "Masa Simpan Minimal"; `retensi_inaktif` /
      `masa_inaktif_berakhir` = `null`, kolom & CHECK dibiarkan (tanpa migrasi).
- [ ] Kolom "Umur Berkas" + badge "Jatuh Tempo" (dihitung) di Berkas Tertutup &
      Pembersihan; urut terlama dulu.
- [ ] Batch "Usulkan Semua yang Jatuh Tempo" berfungsi (klien loop, ringkasan).
- [ ] `/arsiparis/inaktif` hilang; `/arsiparis/pembersihan` menggantikan
      `/arsiparis/usul-musnah`; `/arsiparis/berkas/tertutup` ada; `routeTree.gen.ts`
      diff terbatas 3 route.
- [ ] Dashboard KSBU tanpa "Arsip Inaktif"; "Usul Pembersihan".
- [ ] `grep` istilah lama bersih (kecuali sisa yang diizinkan: enum value,
      event-type mirror, kolom schema, string allowlist `Data file sudah dimusnahkan`).
- [ ] `pnpm test` hijau.
- [ ] Tidak ada migrasi baru; `src/db/schema/**` & `drizzle/*.sql` tak berubah.
