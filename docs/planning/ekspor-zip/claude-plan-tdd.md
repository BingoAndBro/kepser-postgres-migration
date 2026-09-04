# Test Stubs: Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

Fase 6 dari `deep-plan`. Stub bahasa natural per step dari `claude-plan.md` — bukan kode test. Kode test ditulis saat implementasi section terkait.

---

## Tests for: Step 0 — Izin dependensi `archiver`

### Happy Path
- [ ] `pnpm install` sukses setelah `archiver` + `@types/archiver` ditambah; `pnpm-lock.yaml` ter-update tanpa mengubah dependensi lain.
- [ ] `pnpm test` (baseline, belum ada kode fitur) tetap hijau setelah instalasi — tidak ada breaking change dari dependensi baru.

### Edge Cases
- [ ] Tidak ada test otomatis untuk langkah ini (perubahan paket) — verifikasi manual: `git diff -- package.json pnpm-lock.yaml` hanya memuat `archiver`/`@types/archiver`, tidak ada dependensi lain yang ikut ter-bump.

### Error Cases
- Tidak relevan (bukan kode runtime).

---

## Tests for: Step 1 — Modul fondasi `document-zip.ts`

### Happy Path
- [ ] `buildZipPlan` dengan 2 entri dokumen (masing-masing 1-2 file) menghasilkan `folderPath` + nama file final sesuai input, tanpa perubahan urutan.
- [ ] `buildZipPlan` menghasilkan teks `DAFTAR_ISI.txt` yang memuat: timestamp, `requesterLabel`/`requesterRole`, `sourceDescription`, daftar dokumen yang masuk (nama folder + jumlah file), bagian "dilewati" kosong bila semua entri valid.
- [ ] `streamDocumentZip` dengan 1 file kecil nyata (di direktori sementara, `deps.root` di-inject) menghasilkan `Response` berstatus 200, header `Content-Type: application/zip`, `Content-Disposition` memuat nama file ZIP yang disanitasi, `Cache-Control: no-store`.
- [ ] Struktur folder RP-05 (`<folder dokumen>/<file>`) dan RP-02 (`<nama berkas>/<folder dokumen>/<file>`) sama-sama dihasilkan benar dari kontrak generik yang sama (hierarki ditentukan sepenuhnya oleh `folderPath` yang dikirim pemanggil).
- [ ] Prefiks nama folder dokumen WORKFLOW = `YYYY-MM-DD_<judul disanitasi>_<8 char pertama id>`; format tanggal diambil dari `tanggal.slice(0,10)`, bukan `Date` mentah dengan timezone shift.
- [ ] Prefiks nama folder dokumen MANUAL = `[Manual] <judul disanitasi>_<8 char pertama id>`.
- [ ] Nama folder induk berkas RP-02 = `<nomor_spm disanitasi> - <klasifikasi disanitasi>`.

### Edge Cases
- [ ] Dua file dalam satu `folderPath` dengan `namaAman` identik → file kedua diberi suffix `" (2)"`, file ketiga `" (3)"`, dst; urutan suffix mengikuti urutan di array `files[]`.
- [ ] Entri dengan `files: []` (dokumen/item tanpa lampiran) → tidak menghasilkan folder di ZIP, tapi **muncul** di bagian "dilewati" `DAFTAR_ISI.txt` dengan alasan "tanpa lampiran".
- [ ] `nomorSpm` kosong/`null` saat memanggil `buildBerkasParentFolderName` → hasil `"[Tanpa Nomor SPM] - <klasifikasi>"`.
- [ ] `judul` dokumen mengandung karakter tak aman (`/`, `\`, emoji, kontrol) → tersanitasi lewat `sanitizeStoragePathSegment`, tidak melempar, tidak menghasilkan segmen kosong (fallback nama generik bila hasil sanitasi kosong total).
- [ ] File hilang (`fs.stat` melempar `ENOENT`) saat `streamDocumentZip` → entri dilewati, dicatat di `DAFTAR_ISI.txt` bagian "dilewati" dengan alasan "file tidak ditemukan", ZIP tetap selesai dengan file lain yang valid.
- [ ] File > 250 MB (mock `fs.stat` mengembalikan `size` besar) → dilewati, dicatat dengan alasan "melebihi 250 MB", tidak pernah masuk `createReadStream`.
- [ ] `DAFTAR_ISI.txt` adalah entri **pertama** yang ditulis ke archive (diverifikasi lewat urutan pemanggilan `archive.append` di test, bukan hanya isi akhir ZIP).
- [ ] `DAFTAR_ISI.txt` **tidak** memuat `logicalPath` mentah, path fisik, root storage, atau token — hanya nama folder/file aman + alasan skip (assert negatif: `daftarIsiText` tidak mengandung substring root storage dev/test).

### Error Cases
- [ ] `entries.length > 500` → `buildZipPlan`/`streamDocumentZip` melempar error typed (mis. `DocumentZipTooManyEntriesError`) **sebelum** menyentuh filesystem sama sekali (assert `fs.stat`/`createReadStream` tidak pernah dipanggil).
- [ ] `archiver` memancarkan event `error` fatal (disimulasikan lewat mock) → stream dihentikan, promise/`Response` yang dikembalikan mencerminkan kegagalan (tidak diam-diam sukses dengan ZIP kosong).
- [ ] Root storage tidak valid / `resolvePhysicalStoragePath` melempar (percobaan path traversal via `logicalPath` yang dimanipulasi) → entri tersebut ditolak sama seperti file hilang (dilewati + dicatat), **bukan** melempar ke atas dan menggagalkan seluruh ekspor, dan **bukan** membaca file di luar root.

---

## Tests for: Step 2 — Resolver non-HTTP `document-file-access.ts`

### Happy Path
- [ ] `resolveDocumentLampiranLogicalPathForExport({ documentId, lampiranIndex })` untuk dokumen valid, lampiran valid → `{ ok: true, logicalPath }` sama persis dengan yang dihasilkan jalur token existing untuk dokumen+index yang sama.
- [ ] Perilaku `createDocumentLampiranAccessUrlResponse` dan `resolveDocumentLampiranAccessForToken` (jalur token existing) **tidak berubah** setelah refactor — test regresi memakai test existing yang sudah ada, dipastikan tetap hijau.

### Edge Cases
- [ ] Dokumen anggota berkas `CLOSED` + `DIMUSNAHKAN` → `{ ok: false, status: 410, message: 'Data file sudah dimusnahkan' }`, konsisten pesan existing.
- [ ] `lampiranIndex` di luar rentang `lampiran_urls` → `{ ok: false, status: 404 }`.
- [ ] Dua panggilan berturutan untuk `documentId` yang sama (index berbeda) di dalam satu request endpoint export → hanya **satu** query DB (diverifikasi lewat spy pada memoization Map di endpoint pemanggil, Step 8/9's test, bukan test modul ini).

### Error Cases
- [ ] `documentId` bukan UUID valid / tidak ditemukan → `{ ok: false, status: 404 }`, tidak melempar exception tak tertangani.
- [ ] `lampiran_urls` berisi entri `url` malformed (bukan logical path aman) → entri tersebut `{ ok: false }`, tidak membocorkan alasan detail parsing internal ke pemanggil.

---

## Tests for: Step 3 — Resolver non-HTTP `berkas-arsip-file-access.ts`

### Happy Path
- [ ] `resolveBerkasArsipItemAttachments(berkasId, itemId)` untuk item `WORKFLOW` dengan 3 lampiran → mengembalikan array 3 `{ logicalPath, namaAman }`, `namaAman` sama persis dengan `downloadFilename` yang dihasilkan endpoint download existing untuk masing-masing index.
- [ ] Untuk item `MANUAL` dengan 2 attachment → mengembalikan array 2 `{ logicalPath, namaAman }` dari `manual_arsip_attachment`, urutan sama seperti `getManualAttachmentByIndex` existing (`createdAt, id`).
- [ ] Perilaku `createBerkasArsipItemAttachmentFileResponse` (jalur download/preview existing) **tidak berubah** setelah refactor — test existing tetap hijau.

### Edge Cases
- [ ] Item `WORKFLOW` tanpa lampiran (`lampiran_urls` kosong) → array kosong `[]` (bukan error).
- [ ] Item `MANUAL` dengan 0 attachment row → array kosong `[]`.
- [ ] Folder `status_arsip = DIMUSNAHKAN` → resolver menolak seluruh item di folder itu (tidak parsial), konsisten guard existing.

### Error Cases
- [ ] `berkasId`/`itemId` tidak match (item bukan milik berkas tsb) → hasil kosong/error terkontrol, tidak melempar exception tak tertangani ke endpoint pemanggil.
- [ ] `source_type` tidak dikenali (bukan `WORKFLOW`/`MANUAL`) → ditolak dengan aman (tidak crash), sama seperti perilaku existing `createBerkasArsipItemAttachmentFileResponse`.

---

## Tests for: Step 4 — Test unit fondasi (`document-zip.test.ts`)

*(Step ini **adalah** penulisan test — stub di atas untuk Step 1 menjadi checklist utamanya. Tambahan khusus file test:)*

### Happy Path
- [ ] File test berada di `tests/unit/export/document-zip.test.ts`, dijalankan otomatis oleh `pnpm test` (`vitest.config.ts` include pattern `tests/**/*.test.ts` sudah mencakupnya tanpa config tambahan).

### Edge Cases
- [ ] Test `buildZipPlan` tidak menyentuh filesystem sama sekali (tidak ada `fs`/`os.tmpdir` di describe block-nya) — dipisah tegas dari describe block `streamDocumentZip` yang boleh pakai direktori sementara.

### Error Cases
- Tercakup di stub Step 1 (kasus `> 500`, file hilang, dsb).

---

## Tests for: Step 5 — Sinkron `AGENTS.md`

### Happy Path
- [ ] Tidak ada test otomatis (perubahan dokumentasi) — verifikasi manual: bagian *Storage And File Rules* memuat kebijakan ekspor ZIP (otorisasi, sanitasi nama, batas 500/250MB, larangan bocor path/token, `DIMUSNAHKAN` tetap blokir); daftar *API utama* KSBU/Pegawai memuat 3 route baru.

### Edge Cases / Error Cases
- Tidak relevan.

---

## Tests for: Step 6 — Endpoint `GET /api/arsiparis/berkas/$id/export-zip`

### Happy Path
- [ ] Berkas `CLOSED`, `status_arsip` bukan `DIMUSNAHKAN`, sesi valid role `KEPALA_SUB_BAGIAN_UMUM` → `Response` 200, `Content-Type: application/zip`, `Content-Disposition` memuat nama berkas tersanitasi.
- [ ] Struktur folder ZIP hasil = `<nomor_spm> - <klasifikasi>/<folder dokumen>/<file>` untuk tiap item, sesuai `source_type` (WORKFLOW pakai prefiks tanggal, MANUAL pakai `[Manual]`).
- [ ] `nomor_spm` `null` → folder induk `"[Tanpa Nomor SPM] - <klasifikasi>"`.

### Edge Cases
- [ ] Berkas dengan 0 item → ZIP tetap terbentuk, hanya berisi `DAFTAR_ISI.txt` yang menyatakan tidak ada dokumen.
- [ ] Item tanpa attachment → dilewati (tidak ada folder kosong), tercatat.

### Error Cases
- [ ] Tanpa sesi → `401`.
- [ ] Sesi role bukan `KEPALA_SUB_BAGIAN_UMUM` (termasuk `ADMIN`) → `403`.
- [ ] `berkasId` bukan UUID / tidak ditemukan → `404`.
- [ ] `status_berkas = OPEN` → `409` dengan pesan "belum ditutup".
- [ ] `status_arsip = DIMUSNAHKAN` → `410` dengan pesan "Data file sudah dimusnahkan".
- [ ] Berkas dengan > 500 item (kasus ekstrem/buatan di test) → `413` dengan pesan jumlah spesifik, **sebelum** resolver attachment dipanggil (assert resolver tidak pernah dipanggil).
- [ ] Tidak ada baris baru di `berkas_arsip_activity` setelah ekspor sukses (assert count query aktivitas tetap sama sebelum/sesudah) — menegaskan keputusan interview #10.

---

## Tests for: Step 7 — Tombol + dialog RP-02

### Happy Path
- [ ] Tombol "Ekspor ZIP" tampil di `/arsiparis/berkas/$id` untuk berkas `CLOSED` non-`DIMUSNAHKAN`.
- [ ] Klik tombol membuka dialog konfirmasi berisi jumlah dokumen + Nomor SPM + Klasifikasi.
- [ ] Klik "Ekspor Sekarang" memicu unduhan (navigasi/`<a download>` ke endpoint export-zip) dan dialog tertutup.
- [ ] Klik "Batal" menutup dialog tanpa memicu request.

### Edge Cases
- [ ] Tombol disembunyikan/disabled dengan tooltip alasan untuk berkas `OPEN` atau `DIMUSNAHKAN`.

### Error Cases
- [ ] Endpoint mengembalikan error (mis. sesi kedaluwarsa di tengah) → UI menampilkan pesan gagal yang aman (tidak menampilkan teks backend mentah), dialog bisa ditutup/diulang.

---

## Tests for: Step 8 — Endpoint `POST /api/laporan/saya.export-zip`

### Happy Path
- [ ] Body `{ dokumen_ids: [...] }` berisi id dokumen milik user, status `COMPLETED`/`TERSIMPAN` → `Response` 200 `application/zip`, struktur `<folder dokumen>/<file>` per dokumen.
- [ ] `DAFTAR_ISI.txt` mencantumkan `sourceDescription` yang menandakan ini hasil filter laporan saya.

### Edge Cases
- [ ] Salah satu `dokumen_ids` menunjuk dokumen tanpa lampiran → dilewati, tercatat, dokumen lain tetap masuk.
- [ ] `dokumen_ids` berisi id duplikat → hasil ZIP tidak menduplikasi folder dokumen yang sama.

### Error Cases
- [ ] Tanpa sesi → `401`.
- [ ] Same-origin gagal → ditolak sebelum otorisasi/DB disentuh.
- [ ] `dokumen_ids: []` → `400` dari Zod (`min(1)`), sebelum query DB.
- [ ] `dokumen_ids` berisi id dokumen **milik user lain** → diabaikan diam-diam (tidak muncul di ZIP/manifest sebagai "milik user lain" secara eksplisit — cukup tidak ada di manapun; assert tidak ada indikasi keberadaan dokumen tsb di response).
- [ ] `dokumen_ids` berisi id dokumen berstatus selain `COMPLETED`/`TERSIMPAN` (mis. `DRAFT`) → diabaikan diam-diam.
- [ ] `dokumen_ids.length` = 501 (semua id valid & benar milik user) → `413` dengan pesan jumlah spesifik, **sebelum** query DB dijalankan (assert query dokumen tidak pernah dipanggil).
- [ ] Tidak ada baris baru di tabel activity manapun setelah ekspor sukses (kebijakan "tanpa jejak DB", sama seperti RP-05 umum).

---

## Tests for: Step 9 — Endpoint `POST /api/laporan/kegiatan.export-zip`

*(Cermin Step 8, beda authorization boundary.)*

### Happy Path
- [ ] User adalah Ketua Tim untuk kegiatan X, `dokumen_ids` berisi dokumen kegiatan X (termasuk dokumen **milik anggota tim lain**, bukan hanya milik dirinya) → semua masuk ZIP.

### Edge Cases
- [ ] `dokumen_ids` campuran dari kegiatan yang dipimpin dan **tidak** dipimpin user → hanya dokumen dari kegiatan yang dipimpin yang masuk, sisanya diabaikan diam-diam.

### Error Cases
- [ ] User bukan Ketua Tim kegiatan manapun (`ketuaTimAssignments` kosong) → hasil ZIP kosong (hanya `DAFTAR_ISI.txt`) atau `403`/`404` awal — **putuskan konsisten dengan perilaku `GET /api/laporan/kegiatan` existing** saat implementasi (existing mengembalikan `{ dokumen: [], isKetuaTim: false }` alih-alih error; endpoint export sebaiknya mengikuti pola sama: bukan Ketua Tim → ZIP kosong dengan `DAFTAR_ISI.txt` yang menyatakan tidak ada dokumen berhak, bukan `403`, supaya tidak membocorkan info assignment lewat kode status berbeda).
- [ ] `dokumen_ids.length` = 501 → `413` sebelum query DB (sama seperti Step 8).
- [ ] Tanpa sesi → `401`; same-origin gagal → ditolak.

---

## Tests for: Step 10 — Tombol + dialog RP-05 (dua halaman)

### Happy Path
- [ ] `/pegawai/laporan/saya`: tombol "Ekspor Semua File (ZIP)" aktif mengikuti `filtered.length` (badge/teks jumlah update saat filter berubah).
- [ ] Klik tombol → dialog jumlah dokumen + catatan "mengikuti filter aktif" → konfirmasi → `fetch POST` dengan `dokumen_ids = filtered.map(d => d.id)` → unduhan ter-trigger via blob.
- [ ] `/pegawai/laporan/kegiatan`: tombol serupa aktif mengikuti `selectedDocuments.length` pada kegiatan yang sedang dilihat, bukan seluruh daftar kegiatan.

### Edge Cases
- [ ] `filtered.length` (atau `selectedDocuments.length`) > 500 → dialog otomatis berubah jadi pesan "persempit filter" tanpa tombol "Ekspor Sekarang".
- [ ] `filtered.length` = 0 → tombol disabled (tidak ada yang bisa diekspor).
- [ ] State loading selama fetch berlangsung → tombol disabled, teks berubah, tidak bisa diklik ganda (tidak memicu request dobel).

### Error Cases
- [ ] `fetch` gagal (network/500) → pesan error aman ditampilkan, tidak menampilkan body respons mentah, dialog bisa dicoba ulang.

---

## Tests for: Step 11 — Route constants + route generation

### Happy Path
- [ ] Setelah route generation, `src/routeTree.gen.ts` memuat 3 entri baru sesuai path file route yang dibuat; `git diff -- src/routeTree.gen.ts` **hanya** menambah 3 route ini, tidak ada perubahan tak terduga ke route lain.

### Edge Cases
- [ ] Bila section-02 dan section-03 regenerasi terpisah (paralel) → regenerasi kedua (siapa pun yang commit belakangan) dijalankan ulang dari state terbaru `main`, bukan hand-merge diff.

### Error Cases
- Tidak relevan (langkah build tooling, bukan logika aplikasi).

---

## Tests for: Step 12 — Test otorisasi & integrasi per endpoint

*(Stub sudah tercakup di Step 6, 8, 9 — file ini murni penempatan: `tests/unit/arsiparis/berkas-export-zip.test.ts` untuk Step 6, `tests/unit/laporan/export-zip.test.ts` untuk Step 8+9.)*

### Happy Path / Edge Cases / Error Cases
- Lihat stub Step 6 (RP-02) dan Step 8 + Step 9 (RP-05) di atas — dikumpulkan ulang jadi dua file test saat implementasi.
