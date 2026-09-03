# Section 08 — Sweep Label Sisa + CSV

## Context

Perubahan besar sudah landing (section 03–07). Section ini menutup string kearsipan
yang tercecer dan menyelesaikan header/filename CSV. RP-01 langkah 8 mensyaratkan
sapuan `grep` eksplisit sebagai bagian Definition of Done.

## Objective

- `berkas-arsip-csv.ts`: header "Cara Pembayaran" + kolom "Umur Berkas"; konstanta
  filename disesuaikan.
- `berkas-klasifikasi-eligibility.ts`, `manual-arsip.ts`: label.
- `grep` istilah lama bersih kecuali sisa yang diizinkan.
- Test CSV & eligibility hijau.

## Prerequisites

- Section 03, 06, 07 selesai (DTO `umur_berkas` ada; halaman memakai CSV).

## Implementation Steps

1. **`src/lib/archive/berkas-arsip-csv.ts`:**
   - `FOLDER_LIST_HEADERS` (±ln 58-61): `'Jenis Pembayaran'` → `'Cara Pembayaran'`;
     tambah `'Umur Berkas'` (nilai baris dari DTO `umur_berkas`, format
     "<n> hari" / "-" bila `null`).
   - Konstanta filename:
     - `BERKAS_INAKTIF_LIST_CSV_FILENAME` — hapus (halaman hilang) atau biarkan
       tak terpakai bila dependensi lain; utamakan hapus + rapikan import.
     - `BERKAS_USUL_MUSNAH_LIST_CSV_FILENAME` → `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME`
       (atau tambah alias, lalu ganti pemakai di `pembersihan/index.tsx`).
     - Tambah `BERKAS_TERTUTUP_LIST_CSV_FILENAME` (dipakai `berkas/tertutup.tsx`).
   - Label status arsip di baris data via `formatBerkasArchiveStatusLabel` — sudah
     otomatis "Tersimpan"/"Usul Pembersihan"/"File Dibersihkan".
   - **Pertahankan** escaping formula-injection & metadata-only (tanpa ID/path/token).
2. **`src/lib/archive/berkas-klasifikasi-eligibility.ts`:** teks "Jenis Pembayaran"
   → "Cara Pembayaran".
3. **`src/lib/manual-arsip.ts`:** referensi `INAKTIF` / "musnah" / retensi ganda —
   relabel / sederhanakan bila user-facing.
4. **Sapuan grep** — jalankan & bereskan sisa non-allowlist:
   ```
   grep -rn "Jenis Pembayaran" src/
   grep -rn "Pengarsipan\|Master Klasifikasi Arsip\|Arsip Aktif\|Arsip Inaktif" src/
   grep -rn "Usul Musnah\|Musnahkan Data\|Dimusnahkan" src/
   grep -rn "INAKTIF" src/
   grep -rn "retensi_inaktif\|masaInaktifBerakhir\|masa_inaktif" src/
   ```
5. **Sisa yang BOLEH tetap ada** (jangan diubah):
   - `ARCHIVE_STATUS_VALUES` memuat `'INAKTIF'` (+ komentar).
   - `BERKAS_ACTIVITY_EVENT_TYPES` memuat `BERKAS_DIPINDAHKAN_KE_INAKTIF`.
   - Kolom `retensiInaktif` / `masaInaktifBerakhir` di `src/db/schema/arsip/*`.
   - Repo write yang set kolom itu `null`.
   - String `Data file sudah dimusnahkan` (allowlist parsing UI + AGENTS.md + test).
   - Frasa internal `HAPUS FILE FISIK ARSIP`
     (`berkas-arsip-physical-destruction.ts`, server-only).

## Files to Create/Modify

- `src/lib/archive/berkas-arsip-csv.ts`
- `src/lib/archive/berkas-klasifikasi-eligibility.ts`
- `src/lib/manual-arsip.ts`
- file lain yang muncul di grep (label saja)
- `tests/unit/arsiparis/berkas-arsip-csv.test.ts`
- `tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts`

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 8".
- [ ] `FOLDER_LIST_HEADERS` memuat "Cara Pembayaran" (bukan "Jenis Pembayaran") &
      "Umur Berkas".
- [ ] Baris data status = "Tersimpan"/"Usul Pembersihan"/"File Dibersihkan".
- [ ] Escaping & metadata-only tetap (tanpa ID/path/token).
- [ ] Konstanta `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME` &
      `BERKAS_TERTUTUP_LIST_CSV_FILENAME` ada; `BERKAS_INAKTIF_LIST_CSV_FILENAME`
      tidak dipakai halaman manapun.
- [ ] `berkas-klasifikasi-eligibility` pesan "Cara Pembayaran".
- [ ] (manual) `grep "Jenis Pembayaran" src/` → nol.
- [ ] (manual) `grep "Usul Musnah\|Musnahkan Data\|Master Klasifikasi Arsip" src/` → nol.
- [ ] (manual) `grep "INAKTIF" src/` → hanya `archive-status.ts`,
      `berkas-arsip-activity.ts`, `db/schema/**`.

## Definition of Done

- [ ] CSV header + filename disesuaikan; test CSV hijau.
- [ ] Grep gate bersih (kecuali sisa yang diizinkan).
- [ ] String `Data file sudah dimusnahkan` & `HAPUS FILE FISIK ARSIP` tidak diubah.
- [ ] Tidak ada regresi section 03–07.
