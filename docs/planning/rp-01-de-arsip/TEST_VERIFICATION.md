# Test & Verification Guide: RP-01 — De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

## Overview

RP-01 mengganti bahasa kearsipan resmi dengan istilah "berkas / masa simpan / pembersihan",
memangkas lifecycle berkas tertutup dari 4 tahap (`AKTIF → INAKTIF → USUL_MUSNAH →
DIMUSNAHKAN`) jadi 2 tahap (`Tersimpan → Usul Pembersihan → File Dibersihkan`, dengan
"Batalkan Usulan"), menyederhanakan form Tutup Berkas jadi satu field "Masa Simpan
Minimal", dan menambah kolom **Umur Berkas** + badge **Jatuh Tempo** (dihitung saat
halaman dibuka, tanpa scheduler).

## Status otomatis

- `pnpm test` (vitest): **811 pass / 1 skipped** (skip = source-shape guard yang sengaja
  di-`it.skip` untuk ditulis ulang pasca-RP-01).
- `npx tsc --noEmit`: file yang disentuh RP-01 bersih. Sisa error tsc (~44) bawaan lama
  di `admin.tsx`, `guards.ts`, `storage/*`, `supabase/functions/*`, fixture test —
  **bukan** RP-01, gate proyek adalah `pnpm test`.

## Prerequisites

- App jalan di `http://localhost:3000` (`pnpm dev`).
- **Reset DB dev** atas baris `berkas_arsip.status_arsip = 'INAKTIF'` (keputusan K1),
  mengikuti `docs/migration/phase-15l3c5b-controlled-dev-archive-data-reset-plan.md`.
  Setelah reset seharusnya tidak ada berkas berstatus `INAKTIF`.
- Login sebagai user dengan role **`KEPALA_SUB_BAGIAN_UMUM`**.
- Minimal 1 berkas `OPEN` berisi dokumen, dan beberapa berkas `CLOSED` dengan
  `status_arsip = 'AKTIF'` (idealnya salah satunya `closed_at` lama supaya jatuh tempo).

---

## Test Cases

### [TC-01] Navigasi & route KSBU

**Tujuan:** menu dan route sesuai RP-01.

**Langkah:**
1. Login KSBU, buka sidebar grup **PEMBERKASAN**.
2. Perhatikan daftar & urutan item.
3. Buka manual `http://localhost:3000/arsiparis/inaktif`.
4. Buka `http://localhost:3000/arsiparis/pembersihan`.
5. Buka `http://localhost:3000/arsiparis/berkas/tertutup`.

**Ekspektasi:**
- Item menu berurutan: **Pengklasifikasian Dokumen · Penambahan Dokumen · Berkas
  Terbuka · Berkas Tertutup · Pembersihan Berkas · Master Klasifikasi Dokumen**.
- **Tidak ada** item "Daftar Arsip Inaktif" atau "Usul Musnah".
- `/arsiparis/inaktif` → tidak ada (404 / redirect), bukan halaman lama.
- `/arsiparis/pembersihan` dan `/arsiparis/berkas/tertutup` merender halaman.

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-02] Halaman "Berkas Terbuka" (`/arsiparis/berkas`)

**Tujuan:** halaman fokus ke berkas `OPEN` saja.

**Langkah:**
1. Buka menu **Berkas Terbuka**.
2. Perhatikan judul, subjudul, dan isi tabel.
3. Cek tidak ada toggle filter status (`Semua / Terbuka / Arsip Aktif`).

**Ekspektasi:**
- Judul **"Berkas Terbuka"**; hanya berkas `status_berkas = OPEN` yang tampil.
- Tidak ada seksi / baris berkas tertutup.
- Placeholder pencarian: "Cari Cara Pembayaran..." (bukan "Jenis Pembayaran").
- Ekspor CSV: file `daftar-berkas-terbuka.csv`.

**Status:** ⬜ / ✅ / ❌

---

### [TC-03] Halaman "Berkas Tertutup" — kolom & aksi per baris

**Tujuan:** kolom Umur Berkas, badge Jatuh Tempo, aksi "Usulkan Pembersihan".

**Langkah:**
1. Buka menu **Berkas Tertutup**.
2. Perhatikan kolom tabel dan urutan baris.
3. Untuk berkas yang `closed_at`-nya sudah melewati `tanggal_jatuh_tempo`, cek badge.
4. Klik **"Usulkan Pembersihan"** pada satu baris → konfirmasi bila ada.

**Ekspektasi:**
- Ada kolom **"Umur Berkas"** (nilai `<n> hari`).
- Baris yang jatuh tempo menampilkan badge merah **"Jatuh Tempo"**.
- Urutan default: **terlama ditutup dulu** (server `closed_at ASC`).
- Setelah "Usulkan Pembersihan": toast sukses, baris hilang dari daftar (pindah ke
  status `USUL_MUSNAH`).

**Status:** ⬜ / ✅ / ❌

---

### [TC-04] Batch "Usulkan Semua yang Jatuh Tempo"

**Tujuan:** batch propose dengan ringkasan & tahan kegagalan sebagian.

**Langkah:**
1. Di **Berkas Tertutup**, pastikan ada ≥ 1 baris "Jatuh Tempo".
2. Klik **"Usulkan Semua yang Jatuh Tempo"**.
3. Dialog muncul menyebut jumlah **N berkas** → klik **"Usulkan Semua"**.
4. (Opsi negatif) matikan network sebentar / pakai berkas yang statusnya sudah berubah
   di tab lain, lalu ulangi untuk memicu kegagalan sebagian.

**Ekspektasi:**
- Tombol **disabled** bila tidak ada baris jatuh tempo.
- Dialog menyebut jumlah berkas yang akan diusulkan.
- Setelah eksekusi: toast ringkasan `"X berkas berhasil diusulkan"` (+ `", Y gagal"`
  bila ada). Kegagalan sebagian **tidak** membatalkan yang sukses; daftar di-refetch.

**Status:** ⬜ / ✅ / ❌

---

### [TC-05] Form "Tutup Berkas" — satu field retensi

**Tujuan:** hanya "Masa Simpan Minimal", preview satu tanggal, payload tanpa
`retensi_inaktif`.

**Langkah:**
1. Buka berkas `OPEN` berisi dokumen → detail → **"Tutup Berkas"**.
2. Perhatikan field pada modal.
3. Isi Nomor SPM + pilih "Masa Simpan Minimal" (mis. `5 Tahun`).
4. Perhatikan preview tanggal.
5. Submit → konfirmasi.
6. (Opsional) buka DevTools → Network → lihat body `POST /api/arsiparis/berkas/$id/close`.

**Ekspektasi:**
- Hanya **satu** dropdown retensi berlabel **"Masa Simpan Minimal"** (tidak ada
  "Retensi Inaktif").
- Preview menampilkan satu tanggal **"Tanggal Jatuh Tempo"** (bukan "Masa Aktif/Inaktif
  Berakhir").
- Body request berisi `{ nomor_spm, retensi_aktif, closed_at? }` — **tanpa**
  `retensi_inaktif`. (Server `.strict()` menolak bila `retensi_inaktif` dikirim.)
- Toast: "Berkas berhasil ditutup dan tersimpan."

**Status:** ⬜ / ✅ / ❌

---

### [TC-06] Detail berkas — aksi lifecycle 2 tahap

**Tujuan:** `AKTIF` → "Usulkan Pembersihan"; `USUL_MUSNAH` → "Bersihkan File" +
"Batalkan Usulan".

**Langkah:**
1. Buka detail berkas `CLOSED` + `status_arsip = AKTIF`.
2. Perhatikan panel "Aksi Kontrol Berkas" & metadata.
3. Klik **"Usulkan Pembersihan"** → konfirmasi.
4. Perhatikan redirect.
5. Buka detail berkas `USUL_MUSNAH`.
6. Perhatikan tombol yang tersedia.
7. Klik **"Batalkan Usulan"** → konfirmasi ringan (tanpa ketik) → cek status kembali.
8. Ulangi ke `USUL_MUSNAH`, klik **"Bersihkan File"** → modal minta ketik frasa.

**Ekspektasi:**
- `AKTIF`: tombol **"Usulkan Pembersihan"** (bukan "Jadikan Inaktif"/"Usulkan Musnah").
- Setelah usul: redirect ke **`/arsiparis/pembersihan`** (bukan `/arsiparis/usul-musnah`
  atau `/arsiparis/inaktif`).
- `USUL_MUSNAH`: ada **"Bersihkan File"** dan **"Batalkan Usulan"**.
- "Batalkan Usulan": dialog ringan, tanpa ketik-persis; status kembali ke Tersimpan.
- "Bersihkan File": modal judul **"Bersihkan File Berkas"**, wajib ketik persis
  **`BERSIHKAN FILE BERKAS`**; tombol konfirmasi disabled sampai frasa benar.
- Metadata detail menampilkan **"Masa Simpan Minimal"**, **"Umur Berkas"**, **"Tanggal
  Jatuh Tempo"** (tidak ada "Retensi Inaktif" / "Masa Inaktif Berakhir").
- Slot peringatan ekspor kosong (`data-testid="export-warning-slot"`, belum aktif — RP-02).
- String **"Data file sudah dimusnahkan"** pada berkas `DIMUSNAHKAN` **tidak berubah**.

**Status:** ⬜ / ✅ / ❌

---

### [TC-07] Halaman "Pembersihan Berkas" (`/arsiparis/pembersihan`)

**Tujuan:** relabel toggle + aksi per baris + kolom Umur Berkas.

**Langkah:**
1. Buka menu **Pembersihan Berkas**.
2. Perhatikan judul & toggle status.
3. Pada tab **"Usulan Pembersihan"**, cek kolom & tombol per baris.
4. Uji **"Batalkan Usulan"** dan **"Bersihkan File"** dari baris (sama seperti TC-06).
5. Pindah ke tab **"Sudah Dibersihkan"** → baris harus read-only.

**Ekspektasi:**
- Judul **"Pembersihan Berkas"**; toggle **"Usulan Pembersihan" / "Sudah Dibersihkan"**
  (bukan "Usul Musnah" / "Arsip Dimusnahkan").
- Tab Usulan: kolom **"Umur Berkas"**, tombol **"Bersihkan File"** + **"Batalkan
  Usulan"** per baris.
- Tab Sudah Dibersihkan: tidak ada tombol aksi lifecycle.
- Ekspor CSV: file `daftar-pembersihan-berkas.csv`.

**Status:** ⬜ / ✅ / ❌

---

### [TC-08] Dashboard KSBU (`/arsiparis`)

**Tujuan:** kartu "Arsip Inaktif" hilang; relabel.

**Langkah:**
1. Buka **Dashboard** KSBU.
2. Perhatikan kartu statistik & quick actions.

**Ekspektasi:**
- Kartu: **Berkas Terbuka · Berkas Tertutup · Usul Pembersihan** (tidak ada "Arsip
  Inaktif").
- Action row memakai **"Usul Pembersihan"** / **"Menunggu Pembersihan File"**,
  link ke `/arsiparis/pembersihan`.
- Quick actions: ada **Berkas Tertutup**; "Pembersihan Berkas"; "Master Klasifikasi
  Dokumen". Tidak ada link `/arsiparis/usul-musnah` atau `/arsiparis/inaktif`.

**Status:** ⬜ / ✅ / ❌

---

### [TC-09] Sapuan label "Cara Pembayaran" & judul klasifikasi

**Tujuan:** istilah lama hilang dari permukaan KSBU.

**Langkah:**
1. Telusuri: `/arsiparis/inbox`, `/arsiparis/penambahan-arsip`, `/arsiparis/klasifikasi`,
   detail dokumen `/arsiparis/dokumen/$id`.
2. Cari teks "Jenis Pembayaran".
3. Cek judul halaman Klasifikasi.

**Ekspektasi:**
- Tidak ada lagi teks **"Jenis Pembayaran"** — semua jadi **"Cara Pembayaran"**.
- Judul halaman Klasifikasi: **"Master Klasifikasi Dokumen"** (bukan "...Arsip").

**Status:** ⬜ / ✅ / ❌

---

### [TC-10] CSV export — header baru

**Tujuan:** header CSV berkas memuat "Cara Pembayaran" + "Umur Berkas".

**Langkah:**
1. Dari **Berkas Tertutup** atau **Pembersihan Berkas**, klik **Ekspor CSV**.
2. Buka file yang terunduh.

**Ekspektasi:**
- Baris header memuat kolom **`Cara Pembayaran`** (bukan `Jenis Pembayaran`) dan
  **`Umur Berkas`** (nilai `<n> hari` / `-`).
- Label status baris: `Tersimpan` / `Usul Pembersihan` / `File Dibersihkan`.
- Tidak ada ID mentah, path, token, atau isi file di CSV.

**Status:** ⬜ / ✅ / ❌

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | Navigasi & route KSBU (TC-01) | ⬜ | ⬜ | ⬜ | |
| 2 | Halaman Berkas Terbuka (TC-02) | ⬜ | ⬜ | ⬜ | |
| 3 | Berkas Tertutup: Umur + Jatuh Tempo + Usulkan (TC-03) | ⬜ | ⬜ | ⬜ | |
| 4 | Batch "Usulkan Semua yang Jatuh Tempo" (TC-04) | ⬜ | ⬜ | ⬜ | |
| 5 | Form Tutup Berkas 1 field (TC-05) | ⬜ | ⬜ | ⬜ | |
| 6 | Detail: lifecycle 2 tahap + Batalkan Usulan (TC-06) | ⬜ | ⬜ | ⬜ | |
| 7 | Halaman Pembersihan Berkas (TC-07) | ⬜ | ⬜ | ⬜ | |
| 8 | Dashboard KSBU (TC-08) | ⬜ | ⬜ | ⬜ | |
| 9 | Sapuan "Cara Pembayaran" + judul klasifikasi (TC-09) | ⬜ | ⬜ | ⬜ | |
| 10 | CSV header baru (TC-10) | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi Bug | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | — | — | — | — |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan
