# Interview Transcript — RP-01

Fase 2 deep-plan. Pertanyaan yang jawabannya mengubah rencana implementasi.
Sumber pertanyaan: brief user + temuan `claude-research.md` §8.

---

## Q1 — Data lama berstatus `INAKTIF` di DB dev/seed

**Jawaban:** **Reset DB dev + hapus seed INAKTIF.**

Implikasi plan:
- Read-model **tidak** perlu jalur kompatibilitas `INAKTIF → AKTIF`. Cabang
  `INAKTIF` cukup dihapus dari label/format/read-model.
- `status_arsip_counts` cukup berhenti mengeluarkan bucket `INAKTIF` (atau
  membiarkannya 0). Tidak ada normalisasi.
- Seed (`src/db/seed/*`) ternyata **tidak** membuat baris `berkas_arsip` sama
  sekali (hanya master-data, roles, users). Jadi baris `INAKTIF` yang ada adalah
  data runtime dev. "Reset" = pembersihan DB dev terkontrol atas baris
  `berkas_arsip.status_arsip = 'INAKTIF'` (atau reset penuh tabel arsip folder-first),
  mengikuti pola `docs/migration/phase-15l3c5b-controlled-dev-archive-data-reset-plan.md`.
- Langkah reset ini **manual oleh manusia**, dicatat di plan sebagai prasyarat dev,
  bukan kode. Nilai enum `INAKTIF` di CHECK constraint tetap dibiarkan (tanpa migrasi).

## Q2 — Event aktivitas untuk aksi baru `cancel_proposal`

**Jawaban:** **Pakai event yang sudah ada: `METADATA_ARSIP_AKTIF_DIPERBARUI`.**

Implikasi plan:
- Tidak ada perubahan `BERKAS_ACTIVITY_EVENT_TYPES` dan tidak ada migrasi CHECK
  constraint `berkas_arsip_activity_event_type_check`.
- `transitionBerkasArchiveStatus` / `eventTypeForBerkasLifecycleStatus` dibuat
  **action-aware**: `cancel_proposal` → `METADATA_ARSIP_AKTIF_DIPERBARUI` (bukan
  memetakan dari status tujuan `AKTIF`, yang akan salah jadi `BERKAS_DITUTUP`).
- Label `METADATA_ARSIP_AKTIF_DIPERBARUI` tetap generik ("Metadata arsip aktif
  diperbarui") — cukup untuk konteks pembatalan usulan. Bila ingin label lebih
  spesifik nanti, itu perubahan label murni tanpa migrasi.

## Q3 — Navigasi "Berkas Aktif" KSBU

**Jawaban:** **2 item menu terpisah — "Berkas Terbuka" + "Berkas Tertutup".**

Implikasi plan:
- Dua entri navigasi harus punya `to` berbeda supaya active-state tidak dobel.
- Pendekatan: pertahankan `/arsiparis/berkas` sebagai halaman **"Berkas Terbuka"**;
  tambah route baru **`/arsiparis/berkas/tertutup`** (`src/routes/arsiparis/berkas/tertutup.tsx`)
  untuk **"Berkas Tertutup"** (daftar `CLOSED/AKTIF` + kolom Umur Berkas + badge
  Jatuh Tempo + aksi "Usulkan Pembersihan" per baris & batch).
  - Segmen statis `tertutup` tidak bentrok dengan `$id` (id selalu UUID).
  - Keduanya memakai `GET /api/arsiparis/berkas` dengan filter berbeda
    (`status_berkas=OPEN&status_arsip=null` vs `status_berkas=CLOSED&status_arsip=AKTIF`).
- `routes.ts`: tambah `BERKAS_TERTUTUP: '/arsiparis/berkas/tertutup'`. `BERKAS_AKTIF`
  tetap menunjuk `/arsiparis/berkas` (isinya kini hanya seksi Terbuka).
- Route generation dijalankan (route baru + route hapus + route rename dalam satu
  regen).

## Q4 — Tombol batch "Usulkan Semua yang Jatuh Tempo"

**Jawaban:** **Masuk scope RP-01.**

Implikasi plan:
- Ditempatkan di halaman **Berkas Tertutup**.
- **Tanpa endpoint batch baru.** Klien mengumpulkan `berkas_id` semua baris berbadge
  "Jatuh Tempo", menampilkan satu dialog konfirmasi ("N berkas akan diusulkan untuk
  pembersihan"), lalu memanggil `POST /api/arsiparis/berkas/$id/lifecycle`
  (`action: 'propose_destruction'`) berurutan/paralel-terbatas per berkas.
- Ringkasan hasil: toast "X berhasil, Y gagal"; kegagalan sebagian tidak
  membatalkan yang sukses; daftar di-refresh setelah selesai.
- Aksi per-baris "Usulkan Pembersihan" tetap ada (jalur utama).

## Q5 — Peringatan "belum pernah diekspor" sebelum "Bersihkan File" (RP-01 langkah 8)

**Jawaban:** **Dibuat sebagai flag/no-op dulu; diaktifkan penuh setelah RP-02.**

Implikasi plan:
- Sediakan titik-sisip di UI dialog "Bersihkan File" (`berkas/$id.tsx` +
  halaman Pembersihan) berupa komponen/props peringatan yang **default tidak
  merender apa-apa** (belum ada sumber data `terakhir_diekspor_at`).
- Tidak menambah kolom DB, tidak mengubah endpoint. Hanya struktur UI + komentar
  `// RP-02: aktifkan peringatan "belum pernah diekspor" di sini`.
- Bukan blok keras → tidak memicu kebutuhan `terakhir_diekspor_at` (sesuai default
  RP-02).

---

## Keputusan turunan (tidak perlu ditanya lagi)

- **String `Data file sudah dimusnahkan`** (backend + allowlist parsing UI +
  test + AGENTS.md Storage Rules) **tidak diubah** di RP-01. Biaya besar & risiko
  regresi allowlist. Relabel hanya permukaan yang jelas milik RP-01. Dicatat di
  plan sebagai *Non-scope / Open question kecil*.
- **Frasa internal `HAPUS FILE FISIK ARSIP`** (`berkas-arsip-physical-destruction.ts`,
  server-only, tidak user-facing) **tidak diubah** — menghindari update test tanpa
  manfaat user. Dicatat sebagai non-scope kecil.
- **`closeBerkasMetadataSchema`**: karena `.strict()`, section Zod/API dan section
  UI dialog harus landing berdekatan. Strategi: schema **menerima `retensi_inaktif`
  opsional lalu mengabaikannya** selama transisi, ATAU kedua section dikerjakan
  dalam urutan langsung tanpa jeda rilis. Plan memilih: **hapus `retensi_inaktif`
  dari schema + kerjakan section-04 (Zod/API) dan section-06 (UI dialog) dalam satu
  rangkaian**, dengan section-06 diverifikasi tidak lagi mengirim field itu.
- **Identifier internal** (`retensi_aktif` key, `masa_aktif_berakhir` kolom, route
  `/arsiparis`, nama tabel/enum) dipertahankan. `masa_aktif_berakhir` dipakai ulang
  sebagai penyimpan `tanggal_jatuh_tempo`.
- **Route generation** dijalankan via `pnpm dev`/`pnpm build` (plugin
  `@tanstack/router-plugin`); tidak ada CLI khusus; diff diverifikasi manual.
