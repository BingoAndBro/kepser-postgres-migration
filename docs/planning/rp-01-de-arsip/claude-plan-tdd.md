# TDD Stubs — RP-01

Test *stubs* dalam bahasa natural. Kode test ditulis saat implementasi (vitest,
`pnpm test` = `vitest run`). Dikelompokkan per step/section plan. Checkbox = satu
kasus test.

Konvensi lokasi:
- Unit backend → `tests/unit/arsiparis/*.test.ts`
- Unit komponen → `tests/unit/components/*.test.ts`, `tests/unit/dashboard/*.test.ts`
- E2E → `tests/e2e/**` (hanya bila diminta manusia)

---

## Tests for: Step 1 — Dokumen konstitusi

Tidak ada test otomatis. Verifikasi manual:
- [ ] `AGENTS.md` tidak lagi menyebut "active retention and inactive retention" pada
      close-folder; menyebut "single `Masa Simpan Minimal`".
- [ ] `AGENTS.md` Route Map KSBU: `/arsiparis/inaktif` hilang,
      `/arsiparis/pembersihan` ada, `/arsiparis/berkas/tertutup` ada.
- [ ] `AGENTS.md` frasa `BERSIHKAN FILE BERKAS` menggantikan `MUSNAHKAN DATA FILE`
      di bagian Behavioral Rules 5.
- [ ] `docs/migration/README.md` Active Runtime Summary & Removed Or Deprecated
      Surfaces sinkron dengan 3 perubahan route.
- [ ] `git diff --name-only` hanya menyentuh `AGENTS.md` +
      `docs/migration/README.md` di section ini.

---

## Tests for: Step 2 — Konstanta, tipe, label activity

### Happy path
- [ ] `BERKAS_RESTING_STATUS === 'AKTIF'`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM.PEMBERSIHAN === '/arsiparis/pembersihan'`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM.BERKAS_TERTUTUP === '/arsiparis/berkas/tertutup'`.
- [ ] `BERKAS_ACTIVITY_EVENT_LABELS.BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH` = "Berkas
      diusulkan untuk pembersihan".
- [ ] `BERKAS_ACTIVITY_EVENT_LABELS.BERKAS_DIMUSNAHKAN` = "File berkas dibersihkan".

### Invariant (regression guard)
- [ ] `ARCHIVE_STATUS_VALUES` **masih** memuat `'INAKTIF'`, `'USUL_MUSNAH'`,
      `'DIMUSNAHKAN'`, `'AKTIF'` (urutan & isi tak berubah — dipakai DB CHECK).
- [ ] `BERKAS_ACTIVITY_EVENT_TYPES` **tak berubah** (8 nilai, termasuk
      `BERKAS_DIPINDAHKAN_KE_INAKTIF`).
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM` tidak lagi punya key `INAKTIF`.
- [ ] `ROUTES.KEPALA_SUB_BAGIAN_UMUM` tidak lagi punya key `USUL_MUSNAH`.

---

## Tests for: Step 3 — Helper backend + service lifecycle + read-model

File: `tests/unit/arsiparis/berkas-arsip-service.test.ts`,
`tests/unit/arsiparis/berkas-arsip-read-model.test.ts`,
(opsional) `tests/unit/**/retention*.test.ts`.

### 3a. `calculateBerkasDueDate` (retention.ts)
Happy path
- [ ] `{ closedAt: '2026-01-15', masaSimpan: '5 Tahun' }` → `'2031-01-15'`.
- [ ] `{ closedAt: '2024-02-29', masaSimpan: '1 Tahun' }` → `'2025-02-28'` (clamp
      hari akhir bulan).
Edge
- [ ] `masaSimpan: 'Permanen'` → `PERMANENT_RETENTION_SENTINEL_DATE` (`'9999-12-31'`).
Error
- [ ] `closedAt` bukan `YYYY-MM-DD` → throw.

### 3b. `nextStatusForBerkasLifecycleAction` (service)
Happy path
- [ ] `propose_destruction` + `AKTIF` → `USUL_MUSNAH`.
- [ ] `cancel_proposal` + `USUL_MUSNAH` → `AKTIF`.
- [ ] `approve_destruction` + `USUL_MUSNAH` → `DIMUSNAHKAN`.
Error / transisi ilegal
- [ ] `propose_destruction` + `INAKTIF` → throw `BERKAS_LIFECYCLE_INVALID`
      (jalur lama tidak lagi didukung).
- [ ] `propose_destruction` + `USUL_MUSNAH` → throw.
- [ ] `cancel_proposal` + `AKTIF` → throw.
- [ ] `cancel_proposal` + `DIMUSNAHKAN` → throw.
- [ ] `approve_destruction` + `AKTIF` → throw.
- [ ] aksi `'mark_inactive'` (string) → tak ada di tabel `allowed` → throw / type
      tidak menerima.

### 3c. Event action-aware (`eventTypeForBerkasLifecycleAction`)
- [ ] `propose_destruction` → `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH`.
- [ ] `cancel_proposal` → `METADATA_ARSIP_AKTIF_DIPERBARUI` (bukan `BERKAS_DITUTUP`).
- [ ] `approve_destruction` → `BERKAS_DIMUSNAHKAN`.
- [ ] `transitionBerkasArchiveStatus` dengan `action: 'cancel_proposal'` memanggil
      `appendBerkasActivity` dengan `eventType: 'METADATA_ARSIP_AKTIF_DIPERBARUI'`
      dan `metadataSnapshot.status_arsip === 'AKTIF'`.

### 3d. `closeBerkasArsip` / `buildCloseBerkasPlan` (satu field)
Happy path
- [ ] Metadata `{ nomor_spm, retensi_aktif: '5 Tahun', closed_at: '2026-01-15' }`
      → `masa_aktif_berakhir === '2031-01-15'`.
- [ ] `retensi_inaktif` dan `masa_inaktif_berakhir` yang ditulis = `null`.
- [ ] `appendBerkasActivity('BERKAS_DITUTUP')` metadataSnapshot tidak memuat nilai
      retensi inaktif non-null.
- [ ] `closed_at` tidak dikirim → dipakai `now` server (date-only).
Edge
- [ ] `retensi_aktif: 'Permanen'` → `masa_aktif_berakhir === '9999-12-31'`.
Error
- [ ] Berkas `OPEN` kosong → `BERKAS_EMPTY`.
- [ ] Berkas sudah `CLOSED` → `BERKAS_NOT_OPEN`.

### 3e. `updateActiveBerkasMetadata` (satu field, konsisten)
- [ ] Edit metadata `CLOSED/AKTIF` dengan `retensi_aktif` baru → `masa_aktif_berakhir`
      dihitung ulang dari `closed_at`; field inaktif tetap `null`.
- [ ] Status bukan `CLOSED/AKTIF` → `BERKAS_METADATA_NOT_EDITABLE`.

### 3f. Read-model — umur / jatuh tempo
Happy path
- [ ] Row `closed_at = today − 10 hari` → DTO `umur_berkas === 10`.
- [ ] Row `masa_aktif_berakhir = today − 1 hari` → `jatuh_tempo === true`,
      `tanggal_jatuh_tempo === masa_aktif_berakhir`.
- [ ] Row `masa_aktif_berakhir = today + 30 hari` → `jatuh_tempo === false`.
- [ ] Row `masa_aktif_berakhir = today` (tepat) → `jatuh_tempo === true`
      (`today ≥ due`).
Edge
- [ ] `masa_aktif_berakhir = '9999-12-31'` (Permanen) → `jatuh_tempo === false`.
- [ ] Row `status_berkas = 'OPEN'` → `umur_berkas === null`, `jatuh_tempo === false`.
- [ ] Row `CLOSED` tanpa `masa_aktif_berakhir` → `tanggal_jatuh_tempo === null`,
      `jatuh_tempo === false`, `umur_berkas` tetap terhitung.
- [ ] Perbandingan date-only (bukan timestamp) — row `masa_aktif_berakhir` = hari
      ini, "sekarang" jam 23:00 lokal → tetap `jatuh_tempo === true` (tak
      off-by-one).

### 3g. Read-model — tanpa INAKTIF
- [ ] `status_arsip_counts` untuk kumpulan row tanpa INAKTIF tidak memuat key
      `INAKTIF`.
- [ ] (bila diuji) row berstatus `INAKTIF` tidak dinormalisasi jadi `AKTIF` —
      dibiarkan apa adanya (label fallback), sesuai K1.

### 3h. Read-model — sort default
- [ ] Daftar `CLOSED` diberi 3 row `closed_at` acak → hasil terurut `closed_at`
      menaik (terlama dulu).
- [ ] Filter `due_only` (bila ada) → hanya row `jatuh_tempo === true`.

### 3i. `page-format`
- [ ] `formatBerkasArchiveStatusLabel('AKTIF')` → `'Tersimpan'`.
- [ ] `formatBerkasArchiveStatusLabel('USUL_MUSNAH')` → `'Usul Pembersihan'`.
- [ ] `formatBerkasArchiveStatusLabel('DIMUSNAHKAN')` → `'File Dibersihkan'`.
- [ ] `formatBerkasArchiveStatusLabel('INAKTIF')` → fallback "Status arsip tidak
      dikenal" (cabang dihapus).
- [ ] `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE === 'BERSIHKAN FILE BERKAS'`.
- [ ] `resolveBerkasLifecycleAction('CLOSED','AKTIF')` → aksi primer
      `propose_destruction`, label "Usulkan Pembersihan".
- [ ] `resolveBerkasLifecycleAction('CLOSED','USUL_MUSNAH')` → memuat aksi
      `approve_destruction` (label "Bersihkan File", `confirmationPhrase` =
      `'BERSIHKAN FILE BERKAS'`) **dan** `cancel_proposal` (label "Batalkan Usulan",
      tanpa `confirmationPhrase`).
- [ ] `resolveBerkasLifecycleAction('CLOSED','INAKTIF')` → `null` (tak ada aksi).
- [ ] Tidak ada aksi berlabel "Jadikan Inaktif" / "Musnahkan Data" / "Usulkan
      Musnah" di output manapun.

---

## Tests for: Step 4 — Zod + API routes

File: `tests/unit/arsiparis/berkas-arsip-schema.test.ts`,
`tests/unit/arsiparis/berkas-arsip-api.test.ts`.

### 4a. `closeBerkasMetadataSchema`
Happy path
- [ ] `{ nomor_spm: 'SPM-1', retensi_aktif: '5 Tahun' }` → valid; output
      `{ nomor_spm, retensi_aktif, closed_at: null }`.
- [ ] `{ ..., closed_at: '2026-01-15' }` → valid, `closed_at` diteruskan.
Error
- [ ] Menyertakan `retensi_inaktif: '3 Tahun'` → **ditolak** (`.strict()`).
- [ ] `retensi_aktif: 'X'` → pesan `'Masa Simpan Minimal tidak valid'`.
- [ ] `nomor_spm: ''` → pesan "Nomor SPM wajib diisi".

### 4b. `openBerkasRequestSchema`
- [ ] `klasifikasi_id` bukan UUID → pesan `'Cara pembayaran tidak valid'`.

### 4c. `lifecycleBodySchema` (route lifecycle)
- [ ] `{ action: 'propose_destruction' }` → valid.
- [ ] `{ action: 'cancel_proposal' }` → valid.
- [ ] `{ action: 'approve_destruction', confirmation: 'BERSIHKAN FILE BERKAS' }` →
      valid.
- [ ] `{ action: 'approve_destruction', confirmation: 'MUSNAHKAN DATA FILE' }` →
      ditolak.
- [ ] `{ action: 'mark_inactive' }` → ditolak (400 "Aksi lifecycle berkas tidak
      valid").

### 4d. `GET /api/arsiparis/berkas` (list)
- [ ] Response row memuat `umur_berkas`, `jatuh_tempo`, `tanggal_jatuh_tempo`.
- [ ] Response row **tidak** membocorkan field internal baru selain itu
      (whitelist `safeFolderListRow`).
- [ ] Filter `status_arsip=INAKTIF` → tetap diterima schema (nilai enum masih ada)
      tapi hasilnya kosong di DB dev pasca-reset; TIDAK error 500.
- [ ] `summary.status_arsip_counts` tidak memuat `INAKTIF` bila tak ada row.

### 4e. `GET /api/arsiparis/berkas/$id` (detail)
- [ ] DTO detail memuat `umur_berkas` / `jatuh_tempo` / `tanggal_jatuh_tempo`.
- [ ] Tidak ada cabang/label `INAKTIF`.

### 4f. Label pesan API lain
- [ ] `dokumen.$id.archive` / `manual-arsip` route: pesan/label memakai "Cara
      Pembayaran", bukan "Jenis Pembayaran".

---

## Tests for: Step 5 — Navigasi + route generation

### Navigasi
File: (baru bila belum ada) `tests/unit/**/navigation*.test.ts` atau perluas test
navigasi yang ada.
- [ ] Grup `KEPALA_SUB_BAGIAN_UMUM` memuat item berlabel "Berkas Terbuka" →
      `/arsiparis/berkas`.
- [ ] Memuat item "Berkas Tertutup" → `/arsiparis/berkas/tertutup`.
- [ ] Memuat item "Pembersihan Berkas" → `/arsiparis/pembersihan`.
- [ ] **Tidak** memuat item berlabel "Daftar Arsip Inaktif" atau ber-`to`
      `/arsiparis/inaktif`.
- [ ] **Tidak** memuat item ber-`to` `/arsiparis/usul-musnah`.
- [ ] Urutan item sesuai PB-6 (Pengklasifikasian · Penambahan · Berkas Terbuka ·
      Berkas Tertutup · Pembersihan · Master Klasifikasi).

### Route generation (verifikasi manual)
- [ ] `pnpm dev`/`pnpm build` dijalankan; `src/routeTree.gen.ts` teregenerasi.
- [ ] `git diff src/routeTree.gen.ts` hanya: `-/arsiparis/inaktif`,
      `-/arsiparis/usul-musnah`, `+/arsiparis/pembersihan`,
      `+/arsiparis/berkas/tertutup`. Nol perubahan route lain.
- [ ] `grep -rn "arsiparis/inaktif\|arsiparis/usul-musnah" src/` → hanya sisa yang
      diinginkan (idealnya nol).

---

## Tests for: Step 6 — Halaman UI

File: `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts` (+ test halaman lain
yang ada). Tes berbasis render/DOM atau "source assertion" mengikuti pola repo.

### 6a/6b. Berkas Terbuka + Berkas Tertutup
- [ ] Halaman `/arsiparis/berkas` menampilkan judul "Berkas Terbuka" dan **tidak**
      lagi menampilkan seksi "Pemberkasan Arsip Aktif".
- [ ] Halaman `/arsiparis/berkas/tertutup` menampilkan kolom "Umur Berkas".
- [ ] Baris dengan `jatuh_tempo === true` menampilkan badge "Jatuh Tempo".
- [ ] Baris berstatus `AKTIF` punya tombol "Usulkan Pembersihan".
- [ ] Tombol "Usulkan Semua yang Jatuh Tempo" **disabled** bila tak ada baris jatuh
      tempo, **enabled** bila ada ≥1.
- [ ] Klik "Usulkan Semua…" → dialog konfirmasi menyebut jumlah N berkas.
- [ ] Setelah batch: dipanggil `POST .../lifecycle` `action:'propose_destruction'`
      untuk tiap `berkas_id` jatuh tempo (mock fetch); toast ringkasan
      "X berhasil[, Y gagal]".
- [ ] Kegagalan 1 item tidak menghentikan sisanya (mock: item ke-2 reject).
- [ ] Teks memakai "Cara Pembayaran", bukan "Jenis Pembayaran".

### 6c. Detail `$id`
- [ ] Status `AKTIF` → tombol "Usulkan Pembersihan" (bukan "Jadikan Inaktif").
- [ ] Status `USUL_MUSNAH` → tombol "Bersihkan File" **dan** "Batalkan Usulan".
- [ ] Dialog "Bersihkan File" meminta ketik-persis `BERSIHKAN FILE BERKAS`;
      tombol submit disabled sampai cocok.
- [ ] "Batalkan Usulan" → `POST .../lifecycle` `action:'cancel_proposal'`, tanpa
      konfirmasi ketik.
- [ ] Redirect/target sukses tidak mengarah ke `/arsiparis/inaktif` atau
      `/arsiparis/usul-musnah`.
- [ ] Titik-sisip peringatan "belum pernah diekspor" ada di DOM tetapi tidak
      merender teks (stub) — mis. `data-testid="export-warning-slot"` kosong.
- [ ] String `Data file sudah dimusnahkan` (bila di-render via AttachmentViewer)
      **tidak berubah**.

### 6d. `CloseBerkasDialog`
- [ ] Tidak ada input berlabel "Retensi Inaktif".
- [ ] Label field retensi = "Masa Simpan Minimal".
- [ ] Preview menampilkan satu tanggal ("Tanggal Jatuh Tempo").
- [ ] Payload submit = `{ nomor_spm, retensi_aktif, closed_at? }` — **tanpa**
      `retensi_inaktif` (mock fetch, assert body).
- [ ] Dipakai dari list shortcut & detail — keduanya submit bentuk sama.

### 6e. Pembersihan Berkas (rename)
- [ ] Route `/arsiparis/pembersihan` merender; `/arsiparis/usul-musnah` tidak lagi
      terdaftar.
- [ ] Toggle: "Usulan Pembersihan" / "Sudah Dibersihkan".
- [ ] Baris `USUL_MUSNAH` punya "Bersihkan File" + "Batalkan Usulan"; kolom "Umur
      Berkas".
- [ ] Baris `DIMUSNAHKAN` tanpa tombol aksi.
- [ ] Judul halaman/menu "Pembersihan Berkas".

### 6f. Dashboard KSBU (`arsiparis/index.tsx`)
- [ ] Tidak ada kartu/teks "Arsip Inaktif".
- [ ] Kartu "Usul Pembersihan" (bukan "Usul Musnah"); link → `/arsiparis/pembersihan`.
- [ ] Tidak ada "Jenis Pembayaran".

### 6g–6j. inbox / penambahan-arsip / klasifikasi / dokumen detail
- [ ] Tidak ada string "Jenis Pembayaran".
- [ ] `klasifikasi.tsx` judul "Master Klasifikasi Dokumen".

---

## Tests for: Step 7 — Komponen bersama

File: `tests/unit/components/ui-foundation.test.ts`,
`tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts`.

### StatusBadge
- [ ] `<StatusBadge kind="arsip" value="AKTIF" />` → teks "Tersimpan".
- [ ] `value="USUL_MUSNAH"` → "Usul Pembersihan".
- [ ] `value="DIMUSNAHKAN"` → "File Dibersihkan".
- [ ] `value="INAKTIF"` → fallback "Status tidak dikenal" (entri map dihapus) /
      atau union TS tidak menerima "INAKTIF".
- [ ] Tone `AKTIF` tetap `success`.

### StatsBento
- [ ] Tidak merender tile "Arsip Inaktif".
- [ ] Tile "Usul Pembersihan" menggantikan "Usul Musnah".

---

## Tests for: Step 8 — Sweep label + CSV

File: `tests/unit/arsiparis/berkas-arsip-csv.test.ts`,
`tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts`.

### CSV
- [ ] `FOLDER_LIST_HEADERS` memuat "Cara Pembayaran" (bukan "Jenis Pembayaran").
- [ ] `FOLDER_LIST_HEADERS` memuat "Umur Berkas".
- [ ] Baris data status arsip = "Tersimpan" / "Usul Pembersihan" / "File
      Dibersihkan".
- [ ] Escaping formula-injection & metadata-only **tetap** (tak ada ID/path/token).
- [ ] Konstanta `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME` ada;
      `BERKAS_TERTUTUP_LIST_CSV_FILENAME` ada; referensi
      `BERKAS_INAKTIF_LIST_CSV_FILENAME` sudah tidak dipakai halaman manapun.

### eligibility
- [ ] `berkas-klasifikasi-eligibility` pesan memakai "Cara Pembayaran".

### Grep gate (verifikasi manual)
- [ ] `grep -rn "Jenis Pembayaran" src/` → nol.
- [ ] `grep -rn "Usul Musnah\|Musnahkan Data\|Master Klasifikasi Arsip\|Arsip Inaktif" src/` → nol.
- [ ] `grep -rn "INAKTIF" src/` → hanya `archive-status.ts` (nilai+komentar),
      `berkas-arsip-activity.ts` (event type mirror), `db/schema/**`.
- [ ] `grep -rn "retensi_inaktif\|masa_inaktif" src/` → hanya `db/schema/**` +
      repo write yang set `null`.

---

## Tests for: Step 9 — pnpm test hijau

- [ ] `pnpm test` (vitest run) hijau seluruhnya.
- [ ] Test lama yang menegakkan `mark_inactive` valid → diubah menegakkan penolakan.
- [ ] Test yang mengecek judul seksi "Pemberkasan Arsip Aktif" di `/arsiparis/berkas`
      → dipindah ke ekspektasi `/arsiparis/berkas/tertutup`.
- [ ] `berkas-arsip-physical-destruction.test.ts`: frasa **internal**
      `HAPUS FILE FISIK ARSIP` tetap; bila ada assertion `MUSNAHKAN DATA FILE`
      (user-facing), diganti `BERSIHKAN FILE BERKAS`.
- [ ] E2E (hanya bila diminta): spec yang membuka `/arsiparis/inaktif` /
      `/arsiparis/usul-musnah` diperbarui.
- [ ] Tidak ada regresi di suite `dokumen`/`fsm`/`storage` (tak tersentuh).

---

## Tests for: Step 10 — Sinkron penjelasan-proyek

Verifikasi manual:
- [ ] PB-6.2 / PB-6.3 "Status sekarang vs target" → past-tense / dihapus.
- [ ] Tabel penamaan PB-6 mencerminkan label yang **berlaku** (bukan "target").
- [ ] Menu KSBU di PB-6 sama persis dengan `navigation.ts`.
- [ ] `git diff` section ini hanya menyentuh `docs/penjelasan-proyek.md`
      (+ opsional `docs/rencana-perubahan.md` status RP-01).
