# Section 01 — Dokumen Konstitusi (docs-first)

## Context

Belum ada perubahan kode. Invariant `AGENTS.md` "Update docs before behavior
changes" mengharuskan dokumen hukum repo diperbarui **sebelum/bersamaan** kode.
Semua section berikutnya mengasumsikan `AGENTS.md` sudah menggambarkan target RP-01.

## Objective

`AGENTS.md` dan `docs/migration/README.md` mencerminkan:
- lifecycle berkas sesudah-tutup 2 tahap (`AKTIF → USUL_MUSNAH → DIMUSNAHKAN`) +
  aksi `cancel_proposal` (`USUL_MUSNAH → AKTIF`); `INAKTIF` deprecated dari alur
  (nilai enum & CHECK dibiarkan, tanpa migrasi);
- Form Tutup Berkas satu field "Masa Simpan Minimal";
- route `/arsiparis/inaktif` dihapus, `/arsiparis/usul-musnah` →
  `/arsiparis/pembersihan`, `/arsiparis/berkas/tertutup` ditambah;
- frasa konfirmasi `MUSNAHKAN DATA FILE` → `BERSIHKAN FILE BERKAS`;
- route generation diizinkan untuk 3 route di atas.

## Prerequisites

- Section: none.
- Baca: `docs/rencana-perubahan.md` RP-01 bagian J, `AGENTS.md` bagian Arsip
  Lifecycle / Status Berkas / Behavioral Rules 5 / Route And Ownership Map,
  `docs/migration/README.md`.

## Implementation Steps

1. **`AGENTS.md` › `### Arsip Lifecycle` (±ln 343):** tambah paragraf/bullet:
   runtime folder-first (RP-01) memakai `AKTIF → USUL_MUSNAH → DIMUSNAHKAN` +
   `cancel_proposal`; `INAKTIF` tidak lagi dipakai di alur; nilai enum `INAKTIF`,
   `USUL_MUSNAH`, `DIMUSNAHKAN` dan CHECK constraint dibiarkan (tanpa migrasi).
   Tandai blok alur 4-tahap lama sebagai "superseded for folder-first runtime by
   RP-01".
2. **`AGENTS.md` › `### Status Berkas` (±ln 377, 393):** ubah "Close-folder requires
   `Nomor SPM`, active retention, and inactive retention" → "requires `Nomor SPM`
   and a single `Masa Simpan Minimal` retention label; `retensi_inaktif` /
   `masa_inaktif_berakhir` remain nullable legacy columns and are written `null`."
   Sesuaikan baris Phase 13S/13S.1 yang menyebut `retensi_aktif` + `retensi_inaktif`.
3. **`AGENTS.md` › `### Behavioral Rules › 5. Arsip Flow` (±ln 628):** sesuaikan
   deskripsi transisi; `Musnahkan Data` → `Bersihkan File`; `MUSNAHKAN DATA FILE` →
   `BERSIHKAN FILE BERKAS`. Sebutkan aksi `cancel_proposal` memakai event aktivitas
   yang sudah ada (`METADATA_ARSIP_AKTIF_DIPERBARUI`) sehingga tanpa migrasi CHECK
   `event_type`.
4. **`AGENTS.md` › `## Route And Ownership Map › ### Kepala Sub Bagian Umum`
   (±ln 962-963):** hapus `/arsiparis/inaktif`; ganti `/arsiparis/usul-musnah` →
   `/arsiparis/pembersihan`; tambah `/arsiparis/berkas/tertutup`.
5. **`AGENTS.md`:** tambah satu baris ringkas "RP-01" di area lifecycle/route:
   "RP-01 = relabel + lifecycle 2-tahap, tanpa migrasi; route generation diizinkan
   untuk `/arsiparis/inaktif` (hapus), `/arsiparis/usul-musnah` →
   `/arsiparis/pembersihan`, `/arsiparis/berkas/tertutup` (baru)."
6. **`docs/migration/README.md` › `## Active Runtime Summary` (±ln 47-52):** daftar
   surface — hapus `/arsiparis/inaktif`; `/arsiparis/usul-musnah` →
   `/arsiparis/pembersihan`; tambah `/arsiparis/berkas/tertutup`.
7. **`docs/migration/README.md` › `## Removed Or Deprecated Surfaces` (±ln 77-88):**
   tambah `/arsiparis/inaktif removed (RP-01)`,
   `/arsiparis/usul-musnah renamed -> /arsiparis/pembersihan (RP-01)`.
8. **`docs/migration/README.md` blok "Future frontend redesign should start
   from..." (±ln 113-116):** sinkron daftar route.
9. **Jangan** sentuh `docs/penjelasan-proyek.md` di section ini (→ section-10).

## Files to Create/Modify

- `AGENTS.md` — bagian Arsip Lifecycle, Status Berkas, Behavioral Rules 5, Route
  And Ownership Map.
- `docs/migration/README.md` — Active Runtime Summary, Removed Or Deprecated
  Surfaces, blok frontend redesign.

## Test Stubs

(Verifikasi manual — lihat `../claude-plan-tdd.md` "Tests for: Step 1".)
- [ ] `AGENTS.md` menyebut "single `Masa Simpan Minimal`", tidak lagi "inactive
      retention" untuk close-folder.
- [ ] `AGENTS.md` Route Map KSBU: `/arsiparis/inaktif` absen,
      `/arsiparis/pembersihan` + `/arsiparis/berkas/tertutup` ada.
- [ ] `AGENTS.md` memuat `BERSIHKAN FILE BERKAS`, tidak lagi `MUSNAHKAN DATA FILE`
      di Behavioral Rules 5.
- [ ] `docs/migration/README.md` Active/Removed surfaces sinkron.
- [ ] `git diff --name-only` = hanya `AGENTS.md` + `docs/migration/README.md`.

## Definition of Done

- [x] Titik `AGENTS.md` diperbarui, konsisten satu sama lain:
      `### Arsip Lifecycle` (diagram 2-tahap + 2 bullet RP-01), `### Status Berkas`
      (close-folder 1 field + catatan Phase 13S), `### 5. Arsip Flow` (diagram +
      bullet RP-01 dengan frasa `BERSIHKAN FILE BERKAS`), `### Kepala Sub Bagian
      Umum` (route list + paragraf route generation).
- [x] `docs/migration/README.md` diperbarui: Active Runtime Summary, Removed Or
      Deprecated Surfaces, Frontend Redesign Preparation.
- [x] Tidak ada perubahan di file lain (`git diff --name-only` =
      `AGENTS.md` + `docs/migration/README.md`).
- [x] Semua verifikasi manual centang.
- [x] n/a — section pertama.

## Deviasi dari rencana

- Historical Phase-note bullets (13W/13W.1/13W.2/13Y.2/14B/14C/14F) yang menyebut
  `MUSNAHKAN DATA FILE` / `/arsiparis/inaktif` / `/arsiparis/usul-musnah`
  **tidak** ditulis ulang — sesuai "Historical Docs Policy" di
  `docs/migration/README.md`. RP-01 consolidated bullets menjadi otoritas terkini
  dan menyatakan supersede. Lihat `code-reviews/section-01-review.md`.
