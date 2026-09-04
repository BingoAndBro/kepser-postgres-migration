# Interview — Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

Fase 2 dari `deep-plan`. Status masuk (dari user, sudah final sebelum interview dimulai):

- **RP-07**: `Disetujui`, semua keputusan lintas-RP terkunci (lib `archiver`, struktur folder, batas 500/250MB, `DAFTAR_ISI.txt`, dialog konfirmasi, resolver aman). **Tidak dibuka ulang.**
- **RP-05**: final, tidak ada yang diinterview.
- **RP-02**: 3 item terbuka kecil.

Pertanyaan diajukan lewat `AskUserQuestion` (1 putaran, 4 pertanyaan — 1 web-research + 3 RP-02).

---

## Q0 — Web research

**Tanya:** Perlu riset web soal integrasi `archiver` + streaming `Response` di TanStack Start/nitro-nightly, atau langsung lanjut dari riset codebase?

**Jawab:** **Ya, riset dulu.**

**Hasil:** lihat `research-web.md`. Kesimpulan: pendekatan `archiver` → `PassThrough` → `Readable.toWeb()` → `new Response(webStream, { headers })` dikonfirmasi valid dan merupakan pola paling portabel untuk server route TanStack Start di atas nitro-nightly (Node lokal, bukan edge runtime). Event `warning` (file hilang) ditangani sebagai skip; event `error` fatal. Verifikasi manual (`pnpm dev` + unduh ZIP nyata) tetap wajib saat implementasi section-01 — riset menegaskan pendekatan, bukan pengganti smoke test.

---

## Q1 — RP-02 item terbuka #1: kolom `terakhir_diekspor_at`

**Tanya:** Tambah kolom `terakhir_diekspor_at` di `berkas_arsip` (butuh migrasi kecil)?

**Opsi:**
- Tidak tambah kolom (Recommended) — default spec RP-02, tanpa migrasi, peringatan RP-01 langkah 8 tetap soft/opsional.
- Tambah kolom, aktifkan blok keras — migrasi `terakhir_diekspor_at timestamptz null`, mengaktifkan penuh peringatan "belum pernah diekspor" sebagai blocking warning.

**Jawab:** **Tidak tambah kolom (Recommended).**

**Keputusan final:** RP-02 **tidak** menambah kolom `terakhir_diekspor_at`. Tidak ada migrasi DB untuk keperluan ini. Peringatan "belum pernah diekspor" di RP-01 langkah 8 **tetap non-scope** untuk keluarga fitur ini (RP-01 sudah menandainya opsional/sinkron-dengan-RP-02; sekarang eksplisit: tidak diaktifkan sebagai blok keras karena data historis "kapan terakhir diekspor" tidak disimpan). Jika kelak dibutuhkan, itu jadi RP terpisah dengan migrasi sendiri.

---

## Q2 — RP-02 item terbuka #2: event aktivitas `BERKAS_DIEKSPOR`

**Tanya:** Bagaimana mencatat aktivitas ekspor berkas, mengingat CHECK constraint `event_type` membatasi ke 8 nilai literal?

**Opsi:**
- Tanpa activity row (Recommended) — konsisten RP-05 ("tanpa jejak DB, log aplikasi saja"), tanpa migrasi.
- Pakai event generik existing (`METADATA_ARSIP_AKTIF_DIPERBARUI` + catatan) — tanpa migrasi, kurang presisi.
- Tambah nilai `BERKAS_DIEKSPOR` — migrasi kecil ALTER CHECK + update konstanta, event paling presisi.

**Jawab:** **Tanpa activity row (Recommended).**

**Keputusan final:** `GET /api/arsiparis/berkas/$id/export-zip` **tidak** menulis baris ke `berkas_arsip_activity`. Ekspor dicatat lewat log aplikasi server biasa (`console.*` dengan `berkasId`, aktor, jumlah dokumen — pola yang sama dipakai di RP-05). Ini menyelaraskan RP-02 dengan RP-05 (satu kebijakan audit untuk seluruh keluarga fitur ekspor: metadata-only, tanpa jejak DB baru) dan menghindari migrasi CHECK constraint sepenuhnya. Tidak ada perubahan ke `src/db/schema/arsip/berkas-arsip.ts` atau `berkas-arsip-activity.ts` untuk RP-02.

---

## Q3 — RP-02 item terbuka #3: fallback penamaan folder induk saat `nomor_spm` NULL

**Tanya:** RP-07 mengunci pola nama folder induk `[Nomor SPM] - [Klasifikasi]` dan item MANUAL `[Manual] [judul]_id8/`. `berkasArsip.nomorSpm` nullable di skema (data lama/manual bisa `null`). Bagaimana fallback?

**Opsi:**
- `"[Tanpa Nomor SPM] - [Klasifikasi]"` (Recommended) — placeholder eksplisit, aman-dibaca manusia, tidak membocorkan id internal.
- `"[id8 berkas] - [Klasifikasi]"` — pakai 8 karakter pertama UUID berkas, lebih unik tapi kurang bermakna.

**Jawab:** **`"[Tanpa Nomor SPM] - [Klasifikasi]"` (Recommended).**

**Keputusan final:**
- Pola folder induk RP-02 dikonfirmasi: `<nama berkas>/<folder dokumen>/<file kelengkapan>` dengan `<nama berkas> = sanitize(nomor_spm) + " - " + sanitize(klasifikasi_nama_snapshot)`.
- Fallback saat `nomor_spm` `null`/kosong: `<nama berkas> = "[Tanpa Nomor SPM] - " + sanitize(klasifikasi_nama_snapshot)`.
- Item MANUAL dalam berkas: `[Manual] <judul manual disanitasi>_<id 8-char>/` — dikonfirmasi persis seperti draft RP-07/RP-02, tidak diubah.

---

## Kesimpulan interview

Tidak ada pertanyaan kritis tersisa yang mengubah rencana implementasi secara signifikan. RP-02 sekarang punya keputusan lengkap untuk 3 item yang sebelumnya `Draft`; siap disintesis ke `claude-spec.md`.
