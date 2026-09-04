# Synthesized Spec: Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

> Sumber: `docs/rencana-perubahan.md` RP-07 (`Disetujui`), RP-02 (`Draft`→ditutup di sini), RP-05 (`Draft`, final). Digabung jadi satu unit perencanaan karena RP-02 dan RP-05 berbagi satu fondasi (RP-07) dan tidak boleh punya dua implementasi ZIP berbeda.

## Problem Statement

Aplikasi ini menyimpan soft file dokumen & lampiran, tapi satu-satunya cara mengunduhnya adalah **satu lampiran per satu klik** (`preview`/`download` per index). Dua peran punya kebutuhan mengunduh **banyak file sekaligus, terstruktur per dokumen/berkas**, dalam satu aksi:

- **Kepala Sub Bagian Umum (RP-02):** ambil seluruh soft file **satu berkas tertutup** (per Nomor SPM) untuk keperluan tahunan (mis. diunggah manual ke aplikasi arsip nasional).
- **Pegawai / Ketua Tim (RP-05):** ambil seluruh soft file dari **dokumen laporan yang lolos filter aktif** di halaman `/pegawai/laporan/saya` atau `/pegawai/laporan/kegiatan`, untuk keperluan laporan bulanan (mis. diunggah manual ke kipApp).

Kedua kebutuhan ini identik secara teknis (rakit `.zip` streaming dari lampiran yang sudah divalidasi, per-dokumen jadi satu folder, nama file aman, batas ukuran, catatan file yang dilewati) — RP-07 mengunci satu fondasi bersama supaya tidak ada dua jalur ZIP yang divergen.

## Goals

1. Satu modul perakit ZIP streaming (`src/lib/export/document-zip.ts`) dipakai oleh dua konsumen (RP-02, RP-05) tanpa duplikasi logika folder/penamaan/batas/skip.
2. **KSBU** bisa mengunduh satu `.zip` berisi seluruh lampiran satu berkas tertutup dari `/arsiparis/berkas/$id`, terstruktur `[Nomor SPM] - [Klasifikasi]/[folder dokumen]/[file]`.
3. **Pegawai** bisa mengunduh satu `.zip` berisi seluruh lampiran dokumen yang lolos filter aktif di `/pegawai/laporan/saya`, terstruktur `[folder dokumen]/[file]`.
4. **Ketua Tim** bisa mengunduh satu `.zip` yang sama untuk dokumen kegiatan yang ia pimpin di `/pegawai/laporan/kegiatan`, dengan otorisasi ulang di server (bukan percaya id dari klien).
5. Batas keamanan operasional: maksimal 500 dokumen per ekspor (ditolak sebelum streaming dimulai), file tunggal > 250 MB dilewati, file fisik hilang dilewati — keduanya dicatat di `DAFTAR_ISI.txt` di root ZIP, ZIP tetap terbentuk.
6. Tidak ada perubahan skema DB / migrasi baru untuk seluruh keluarga fitur ini (lihat *Key Decisions Made*).

## Non-Goals (Explicit Exclusions)

- Integrasi/kirim otomatis ke sistem eksternal manapun (kipApp, aplikasi arsip nasional). Aplikasi tetap **internal & mandiri**; ZIP hanya dirakit di server lalu diunduh browser peminta.
- Kolom `terakhir_diekspor_at` / migrasi apa pun ke `berkas_arsip` (ditutup di interview — lihat *Key Decisions Made*).
- Event aktivitas `BERKAS_DIEKSPOR` / migrasi CHECK constraint `event_type` (ditutup di interview).
- Peringatan "belum pernah diekspor" (RP-01 langkah 8) sebagai blok keras — tetap non-scope karena tidak ada kolom pendukung.
- Cap total-byte per ekspor berbasis `stat` (di luar scope RP-07; hanya dipantau lewat log aplikasi).
- Konversi/format ulang isi file — ZIP membungkus file apa adanya.
- Job latar / penjadwalan ekspor; semua ekspor adalah aksi manusia sinkron.
- Perubahan filter/laporan/halaman berkas di luar penambahan tombol ekspor + dialog konfirmasi.
- Ekspor per dokumen tunggal (sudah ada lewat preview/download individual) — RP ini khusus ekspor **banyak file sekaligus**.

## Context & Constraints

- **Prinsip tetap aplikasi** (`rencana-perubahan.md` baris 12): internal & mandiri, tidak ada panggilan keluar. ZIP = output file murni.
- **AGENTS.md — package changes:** menambah `archiver` (+`@types/archiver`) ke `package.json`/`pnpm-lock.yaml` **butuh izin eksplisit**, langkah tersendiri, terpisah dari langkah lain.
- **AGENTS.md — docs before behavior:** bagian *Storage And File Rules* di `AGENTS.md` diperbarui bersamaan dengan kode fondasi (section-01), bukan sesudahnya.
- **AGENTS.md — route generation:** 3 route API baru (`berkas/$id/export-zip`, `laporan/saya.export-zip`, `laporan/kegiatan.export-zip`) menyentuh `src/routeTree.gen.ts` → route generation **eksplisit diizinkan** oleh plan ini, dijalankan lewat generator resmi (`pnpm dev`/`pnpm build`), tidak boleh hand-edit.
- **AGENTS.md — Storage/File Rules existing:** file access harus lewat helper terotorisasi, cegah path traversal/root escape, tidak membocorkan path fisik/root/token, `DIMUSNAHKAN` harus tetap memblokir akses file (termasuk untuk ekspor).
- **AGENTS.md — Same-Origin:** endpoint `POST` (RP-05) wajib `requireSameOrigin`. Endpoint `GET` (RP-02) tidak butuh cek same-origin tapi tetap wajib sesi + role.
- **Skema existing yang tidak berubah:** `berkasArsip.nomorSpm` nullable; `berkasArsipActivity.eventType` CHECK constraint 8 nilai literal; `manualArsipAttachment` (`logicalPath`, `judulLampiran`, `originalFilename` — semua `NOT NULL`).
- **Runtime:** TanStack Start server routes mengembalikan `Response` Web-standar di atas nitro-nightly/Node. `archiver` (Node `Readable`) dijembatani ke `Response` lewat `PassThrough` + `Readable.toWeb()` (dikonfirmasi riset web — lihat `research-web.md`).
- **Test:** `vitest`, `environment: 'node'`, direktori `tests/unit/**`. Direktori baru `tests/unit/export/`.

## Key Decisions Made

Dikunci di RP-07 (tidak dibuka ulang, lihat instruksi user):

1. Library ZIP = **`archiver`** (streaming, bukan `jszip`).
2. Struktur folder:
   - RP-05: `<folder dokumen>/<file kelengkapan>`
   - RP-02: `<nama berkas>/<folder dokumen>/<file kelengkapan>`
   - `<folder dokumen>` = `YYYY-MM-DD_<judul disanitasi>_<id 8-char>` (WORKFLOW) atau `[Manual] <judul manual disanitasi>_<id 8-char>` (MANUAL).
3. Batas: **500 dokumen** per ZIP (cek `COUNT` sebelum streaming, tolak HTTP 413 dengan pesan spesifik), file tunggal **> 250 MB dilewati**.
4. File fisik hilang/tak terbaca → dilewati, tidak menggagalkan ZIP.
5. `DAFTAR_ISI.txt` selalu ada di root: timestamp, identitas peminta (role), sumber (filter aktif RP-05 / Nomor SPM RP-02), daftar masuk, daftar dilewati + alasan.
6. Dokumen tanpa lampiran → dilewati (tak ada folder kosong), dicatat di `DAFTAR_ISI.txt`.
7. Dialog konfirmasi klien sebelum ekspor jalan (RP-02 & RP-05); jumlah > 500 → pesan "persempit filter" tanpa tombol lanjut.
8. Resolver lampiran pakai jalur folder-first aman existing (`document-file-access.ts` untuk WORKFLOW lepas, `berkas-arsip-file-access.ts` untuk item berkas WORKFLOW+MANUAL). Output ZIP tidak memuat path fisik/root/token.

Ditutup di interview (Fase 2, khusus RP-02):

9. **Tidak** ada kolom `terakhir_diekspor_at` — tanpa migrasi. Peringatan "belum diekspor" RP-01 langkah 8 tetap tidak diaktifkan sebagai blok keras.
10. **Tidak** ada baris `berkas_arsip_activity` untuk ekspor — cukup log aplikasi server (`console.*`), selaras dengan kebijakan audit RP-05 ("tanpa jejak DB"). Tidak ada perubahan CHECK constraint `event_type`.
11. Nama folder induk RP-02 = `sanitize(nomor_spm) + " - " + sanitize(klasifikasi_nama_snapshot)`; fallback saat `nomor_spm` `null`/kosong = `"[Tanpa Nomor SPM] - " + sanitize(klasifikasi_nama_snapshot)`. Item MANUAL dalam berkas = `[Manual] <judul manual disanitasi>_<id 8-char>/`.

Keputusan desain tambahan yang muncul dari riset (bukan perubahan RP-07, hanya detail implementasi):

12. `document-zip.ts` dipecah dua lapis: **`buildZipPlan()`** murni (tanpa I/O — terima daftar entri sudah-teresolusi + metadata, hasilkan rencana folder/nama-final/skip/isi `DAFTAR_ISI.txt`, sepenuhnya bisa diuji unit tanpa filesystem) dan **`streamDocumentZip()`** tipis (jalankan `fs.stat`/`createReadStream` per rencana, pipe ke `archiver`, kembalikan `Response`). Ini memenuhi permintaan test RP-07 (struktur, anti-tabrakan, skip, isi manifest) tanpa perlu benar-benar menulis/membaca ZIP di setiap test case.
13. Resolver non-HTTP yang diekspos mengikuti bentuk `(documentId, lampiranIndex) → logicalPath` (RP-05) dan `(berkasId, itemId, lampiranIndex) → { logicalPath, namaAman }` (RP-02) — cermin dari fungsi token/download yang sudah ada, hanya tanpa lapisan token/HTTP.

## Assumptions

- `berkasArsip.nomorSpm` diisi lewat form Tutup Berkas (RP-01); untuk berkas `CLOSED` hasil alur normal biasanya terisi. Fallback (#11) menjaga kasus data lama/manual yang lolos tanpa Nomor SPM.
- Volume dokumen per ekspor RP-05 (periode 1 bulan pegawai) jauh di bawah 500 — batas 500 adalah **pengaman**, bukan target penggunaan normal.
- Ukuran storage lokal LAN cukup cepat sehingga `fs.stat` per file (untuk cek >250MB) sebelum `createReadStream` tidak jadi bottleneck berarti pada skala ratusan dokumen.
- Tidak ada kebutuhan resume/pause unduhan — ZIP diunduh sekali jalan lewat browser (`<a download>`/navigasi langsung ke endpoint GET, atau `fetch` + `blob` untuk `POST`).
- `console.*` log aplikasi (bukan DB) dianggap cukup untuk audit ekspor pada fase ini (keputusan #10), konsisten dengan pola RP-05 yang sudah final.

## Open Questions

Tidak ada. Semua item terbuka RP-02 ditutup di interview (Fase 2). RP-05 dan RP-07 sudah final sejak awal.
