# Section 01: Fondasi Ekspor ZIP (RP-07)

## Context

Belum ada implementasi ZIP apa pun di codebase ini. Dua file resolver file existing (`src/lib/storage/document-file-access.ts` untuk dokumen lepas, `src/lib/archive/berkas-arsip-file-access.ts` untuk item berkas) hanya punya jalur HTTP/token (`Response` per satu lampiran, baca `readFile()` penuh). Helper penamaan (`buildFormalFilename`, `resolveWorkflowAttachmentReference`) dan guard path (`assertSafeLogicalStoragePath`, `resolvePhysicalStoragePath`) sudah matang dan dipakai ulang, bukan ditulis ulang.

## Objective

Di akhir section ini tersedia: (1) modul `src/lib/export/document-zip.ts` yang bisa merakit ZIP streaming dari kontrak generik `{ folderPath, files }[]`, teruji penuh untuk kasus struktur folder/anti-tabrakan/skip/batas 500/isi `DAFTAR_ISI.txt`; (2) jalur non-HTTP di kedua file resolver existing yang mengembalikan `logicalPath`/`{ logicalPath, namaAman }` tanpa token, siap dipanggil endpoint RP-02/RP-05 di section berikutnya; (3) `AGENTS.md` sudah mendokumentasikan kebijakan ekspor ZIP sebelum ada perilaku baru yang berjalan.

## Prerequisites

- Section(s) yang harus selesai dulu: tidak ada (section pertama).
- Files/modules yang harus sudah tersedia: `src/lib/storage/local-storage-paths.ts` (`assertSafeLogicalStoragePath`, `resolvePhysicalStoragePath`, `getLocalStorageRoot`, `sanitizeStoragePathSegment`), `src/lib/file-helpers.ts` (`buildFormalFilename`), `src/lib/archive/berkas-arsip-attachment-names.ts` (`resolveWorkflowAttachmentReference`) — semua sudah ada di codebase, tidak perlu dibuat.

## Implementation Steps

Rujuk `../claude-plan.md` Step 0 – Step 5 untuk detail penuh. Ringkas urutan kerja:

1. **Izin paket** (Step 0): tambah `archiver` + `@types/archiver` ke `package.json`, jalankan `pnpm install`. Commit terpisah, hanya berisi `package.json` + `pnpm-lock.yaml`.
2. **Modul `document-zip.ts`** (Step 1): tulis `buildZipPlan(entries, options)` murni (tanpa I/O — hitung nama folder/file final + suffix anti-tabrakan + pisahkan "masuk" vs "dilewati (tanpa lampiran)" + susun teks `DAFTAR_ISI.txt`), lalu `streamDocumentZip(entries, options, deps?)` tipis (`fs.stat` per file → skip jika hilang/`ENOENT`/`ENOTDIR`/`>250MB`, catat ke manifest final → `archiver` → `PassThrough` → `Readable.toWeb()` → `Response`). Tambah 3 helper penamaan folder (`buildWorkflowDocumentFolderName`, `buildManualDocumentFolderName`, `buildBerkasParentFolderName`) berbasis `sanitizeStoragePathSegment` existing. `DAFTAR_ISI.txt` ditulis **pertama** ke archive. `entries.length > 500` → `throw` error typed sebelum I/O apa pun.
3. **Resolver `document-file-access.ts`** (Step 2): ekspor jalur baru (mis. `resolveDocumentLampiranLogicalPathForExport({ documentId, lampiranIndex })`) yang menggabungkan `loadDocumentAccessContext` + `resolveDocumentLampiranReference` existing, dikembalikan sebagai `FileReferenceResult` tanpa token. **Tidak** mengulang cek role — otorisasi kepemilikan/kegiatan tetap tanggung jawab endpoint pemanggil (section-03). Jalur token existing (`createDocumentLampiranAccessUrlResponse`, `resolveDocumentLampiranAccessForToken`) tidak boleh berubah perilaku.
4. **Resolver `berkas-arsip-file-access.ts`** (Step 3): tambah fungsi orkestrasi baru (mis. `resolveBerkasArsipItemAttachments(berkasId, itemId)`) yang mengembalikan **semua** `{ logicalPath, namaAman }` satu item sekaligus (WORKFLOW lewat `resolveWorkflowAttachmentReference` per index; MANUAL lewat query baru `manualArsipAttachment` semua baris satu `manualArsipId`, method baru di `BerkasArsipFileAccessRepository`). Jalur download/preview existing (`createBerkasArsipItemAttachmentFileResponse`) tidak boleh berubah perilaku.
5. **Test fondasi** (Step 4): `tests/unit/export/document-zip.test.ts` — semua kasus di stub Step 1 (`../claude-plan-tdd.md`). Test `buildZipPlan` murni (tanpa filesystem); test `streamDocumentZip` pakai direktori sementara + `deps.root` injection, mengikuti pola `tests/unit/storage/*`/`tests/unit/arsiparis/*` existing.
6. **Sinkron `AGENTS.md`** (Step 5): tambah butir kebijakan ekspor ZIP ke *Storage And File Rules* (otorisasi atas file yang sudah lolos role peminta, sanitasi nama konsisten preview/download, batas 500/250MB didokumentasikan, `DAFTAR_ISI.txt` tak boleh memuat path/root/token, `DIMUSNAHKAN` tetap blokir). Tambah 3 route API baru ke daftar *API utama* KSBU/Pegawai (path sudah ditentukan plan: `berkas/$id/export-zip`, `laporan/saya.export-zip`, `laporan/kegiatan.export-zip`) — meski route filenya baru dibuat di section-02/03, dokumentasinya boleh ditulis sekarang karena kontrak path sudah dikunci di plan ini.

## Files to Create/Modify

- `package.json`, `pnpm-lock.yaml` — tambah `archiver`, `@types/archiver`.
- `src/lib/export/document-zip.ts` — **baru**. `buildZipPlan`, `streamDocumentZip`, helper penamaan folder, tipe `DocumentZipEntry`/`DocumentZipTooManyEntriesError`.
- `src/lib/storage/document-file-access.ts` — tambah ekspor resolver non-HTTP, tanpa mengubah fungsi existing.
- `src/lib/archive/berkas-arsip-file-access.ts` — tambah fungsi orkestrasi + method repository baru, tanpa mengubah fungsi existing.
- `tests/unit/export/document-zip.test.ts` — **baru**.
- `AGENTS.md` — bagian *Storage And File Rules* + daftar *API utama*.

## Test Stubs (dari claude-plan-tdd.md)

Salin penuh dari `../claude-plan-tdd.md`:
- **Tests for: Step 0** — verifikasi manual `pnpm install` + diff paket.
- **Tests for: Step 1** — seluruh checklist `buildZipPlan`/`streamDocumentZip` (Happy Path, Edge Cases, Error Cases) — ini bagian terbesar section ini.
- **Tests for: Step 2** — resolver `document-file-access.ts`, termasuk regresi jalur token existing.
- **Tests for: Step 3** — resolver `berkas-arsip-file-access.ts`, termasuk regresi jalur download/preview existing.
- **Tests for: Step 4** — penempatan file test + pemisahan describe block murni vs filesystem.
- **Tests for: Step 5** — verifikasi manual dokumentasi.

## Definition of Done

- [ ] `pnpm install` sukses; `git diff -- package.json pnpm-lock.yaml` hanya memuat `archiver`/`@types/archiver`.
- [ ] `buildZipPlan` murni, tanpa import `node:fs`/`node:stream` di jalur eksekusinya (hanya dipakai `streamDocumentZip`).
- [ ] Semua checklist Step 1–4 di `claude-plan-tdd.md` hijau di `pnpm test`.
- [ ] Regresi: seluruh test existing yang menyentuh `document-file-access.ts`/`berkas-arsip-file-access.ts`/preview/download tetap hijau tanpa diubah.
- [ ] `AGENTS.md` memuat kebijakan ekspor ZIP + 3 route API baru sebelum section-02/03 mulai mengimplementasikan endpoint sungguhan.
- [ ] Tidak ada perubahan ke `src/db/schema/**`, `drizzle/*.sql`, atau `src/routeTree.gen.ts` di section ini (route generation baru terjadi di section-02/03 saat file route benar-benar ada).
- [ ] Section-02 dan section-03 bisa mulai tanpa perlu membaca ulang kode `document-zip.ts`/resolver — cukup kontrak fungsi yang diekspos (didokumentasikan di `claude-plan.md` Step 1–3).
