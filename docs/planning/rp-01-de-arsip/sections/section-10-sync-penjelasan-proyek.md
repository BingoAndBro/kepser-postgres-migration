# Section 10 — Sinkron `docs/penjelasan-proyek.md` (PB-6)

## Context

Kode & test sudah final (section 01–09). `docs/penjelasan-proyek.md` PB-6 sudah
memakai framing baru tetapi masih memuat baris "Status sekarang vs target" dan
menandai sebagian label sebagai "target". Section ini menyamakan label PB-6 dengan
kondisi kode yang sekarang **berlaku**.

## Objective

PB-6 tidak lagi menyesatkan: label = kondisi runtime; "target" → "berlaku";
"Status sekarang vs target" → past-tense atau dihapus. Menu KSBU di PB-6 sama
persis dengan `src/config/navigation.ts`.

## Prerequisites

- Section 01–09 selesai.

## Implementation Steps

1. **PB-6.2** (±ln 281) baris "Status sekarang vs target" → past-tense:
   "Sebelum RP-01 form meminta retensi aktif + inaktif dan menulis
   `status_arsip='AKTIF'`; sejak RP-01 satu field 'Masa Simpan Minimal'."
   (atau hapus baris bila sudah tidak relevan).
2. **PB-6.3** (±ln 292) baris "Status sekarang vs target" → past-tense: lifecycle
   kini 2 tahap (`Usul Pembersihan → File Dibersihkan`), `INAKTIF` dibuang dari
   alur, kolom Umur/Jatuh Tempo & tombol "Batalkan Usulan" sudah ada.
3. **Tabel penamaan PB-6** (±ln 307-322): ubah judul kolom / catatan dari "target"
   → "berlaku". Pastikan baris `/arsiparis/usul-musnah → /arsiparis/pembersihan`
   dan `/arsiparis/inaktif (dihapus)` mencerminkan realita.
4. **Baris "Menu Kepala Sub Bagian Umum (target)"** (±ln 324): hapus kata
   "(target)"; samakan urutan & label dengan `navigation.ts` final
   (Dashboard · Pengklasifikasian Dokumen · Penambahan Dokumen · Berkas Terbuka ·
   Berkas Tertutup · Pembersihan Berkas · Master Klasifikasi Dokumen · System).
5. **PB-6.4** — biarkan referensi RP-02/RP-05 (belum selesai).
6. **(Opsional, boleh oleh manusia saat merge)** `docs/rencana-perubahan.md`:
   ubah status RP-01 di tabel & header section jadi `Selesai`; pindahkan ringkasan
   sesuai instruksi file itu, sisakan jejak.
7. `git diff --name-only` → hanya `docs/penjelasan-proyek.md`
   (+ opsional `docs/rencana-perubahan.md`).

## Files to Create/Modify

- `docs/penjelasan-proyek.md` — PB-6.2, PB-6.3, tabel penamaan, menu KSBU.
- (opsional) `docs/rencana-perubahan.md` — status RP-01.

## Test Stubs

(Verifikasi manual — `../claude-plan-tdd.md` "Tests for: Step 10".)
- [ ] PB-6.2 / PB-6.3 tidak lagi memakai konstruksi "sekarang ... target ...".
- [ ] Tabel penamaan PB-6 tanpa kata "target" untuk label yang sudah berlaku.
- [ ] Menu KSBU PB-6 identik dengan `navigation.ts`.
- [ ] `git diff` section ini hanya menyentuh docs.

## Definition of Done

- [ ] PB-6 sinkron dengan kode final.
- [ ] Tidak ada perubahan kode di section ini.
- [ ] (bila diambil) status RP-01 diperbarui di `docs/rencana-perubahan.md`.
- [ ] Tidak ada regresi section 01–09.
