# Section 03: RP-05 — Ekspor Massal Dokumen Laporan Terfilter ke ZIP (Pegawai / Ketua Tim)

## Context

Section-01 sudah menyediakan `src/lib/export/document-zip.ts` (`streamDocumentZip`) dan resolver non-HTTP `resolveDocumentLampiranLogicalPathForExport` di `src/lib/storage/document-file-access.ts`. `AGENTS.md` sudah mendokumentasikan kebijakan ekspor ZIP. Halaman `/pegawai/laporan/saya` (dengan `filtered` hasil `useMemo`) dan `/pegawai/laporan/kegiatan` (dengan `selectedDocuments` per kegiatan terpilih), serta endpoint `GET /api/laporan/saya` dan `GET /api/laporan/kegiatan`, sudah ada dan tidak perlu diubah strukturnya — section ini hanya menambah.

## Objective

Di akhir section ini: pegawai bisa klik "Ekspor Semua File (ZIP)" di `/pegawai/laporan/saya` dan mendapat `.zip` berisi seluruh lampiran dokumen yang lolos filter aktif (`filtered`); Ketua Tim bisa melakukan hal serupa di `/pegawai/laporan/kegiatan` atas dokumen kegiatan yang sedang dilihat (`selectedDocuments`), termasuk dokumen milik anggota tim lain. Kedua endpoint mengulang otorisasi penuh di server — tidak percaya daftar id dari klien begitu saja.

## Prerequisites

- Section(s) yang harus selesai dulu: **section-01**.
- Files/modules yang harus sudah tersedia: `src/lib/export/document-zip.ts` (`streamDocumentZip`, `buildWorkflowDocumentFolderName`), `src/lib/storage/document-file-access.ts` (`resolveDocumentLampiranLogicalPathForExport`), `src/lib/file-helpers.ts` (`buildFormalFilename` — sudah ada), `src/lib/security/same-origin.ts` (`requireSameOrigin` — sudah ada).

## Implementation Steps

Rujuk `../claude-plan.md` Step 8, 9, 10, 11 (bagian RP-05), 12 (bagian RP-05) untuk detail penuh. Ringkas urutan kerja:

1. **Zod schema** `src/lib/schemas/export.ts` (baru): `{ dokumen_ids: z.array(z.uuid()).min(1).max(2000) }` — `max(2000)` murni pengaman anti-abuse payload, **bukan** aturan bisnis 500 (itu dicek terpisah, lihat langkah 2).
2. **Endpoint** `src/routes/api/laporan/saya.export-zip.ts` (baru), `POST`:
   - `requireSameOrigin(request)` → sesi lokal (`getLocalServerSession`).
   - Parse body dengan skema Zod di atas.
   - **Guard 500 segera setelah parse, sebelum query DB**: `parsed.data.dokumen_ids.length > 500` → `413` dengan pesan jumlah spesifik.
   - Query ulang: `WHERE id IN (dokumen_ids) AND created_by = session.user.id AND status IN ('COMPLETED', 'TERSIMPAN')` — id yang tak lolos diabaikan diam-diam.
   - Per dokumen hasil query: untuk tiap index `lampiran_urls`, `resolveDocumentLampiranLogicalPathForExport({ documentId, lampiranIndex })` (memoization per `documentId` dalam satu request — satu query `loadDocumentAccessContext` dipakai ulang untuk semua index dokumen itu) → `logicalPath`; `namaAman = buildFormalFilename(dok, lamp)`; `folderPath = buildWorkflowDocumentFolderName({ id, judul, tanggal })`.
   - `streamDocumentZip(entries, { requesterRole: 'PEGAWAI', sourceDescription: 'Laporan Saya (filter aktif klien)', ... })`.
   - Log aplikasi, **tanpa** menulis DB.
3. **Endpoint** `src/routes/api/laporan/kegiatan.export-zip.ts` (baru), `POST` — struktur identik langkah 2, tapi otorisasi lewat `ketuaTimAssignments` (muat `kegiatanIds` yang dipimpin `session.user.id`, query dokumen `kegiatan_jenis_id IN (kegiatanIds)`). Bukan Ketua Tim kegiatan manapun → ikuti pola `GET /api/laporan/kegiatan` existing (bukan `403`, cukup hasil kosong) — putuskan & dokumentasikan konsisten saat implementasi.
4. **Tombol + dialog** di `src/routes/pegawai/laporan/saya.tsx`: tombol "Ekspor Semua File (ZIP)" dekat teks "N Dokumen Ditemukan", aktif atas `filtered`. Dialog: jumlah + catatan "mengikuti filter aktif" + Batal/Ekspor Sekarang; `filtered.length > 500` → pesan "persempit filter" tanpa tombol lanjut. Konfirmasi → `fetch POST` `{ dokumen_ids: filtered.map(d => d.id) }` → terima blob → trigger unduhan (`URL.createObjectURL` + `<a download>` sementara, pola serupa `downloadRoleFile`).
5. **Tombol + dialog** di `src/routes/pegawai/laporan/kegiatan.tsx`: sama seperti langkah 4, tapi aktif atas `selectedDocuments` (kegiatan yang sedang dilihat), bukan seluruh `kegiatanRows`.
6. **Route generation**: setelah kedua file route dibuat, jalankan `pnpm dev`/`pnpm build`.
7. **Test**: `tests/unit/laporan/export-zip.test.ts` (baru, mencakup dua endpoint) — seluruh checklist Step 8 & 9 di `claude-plan-tdd.md`.

## Files to Create/Modify

- `src/lib/schemas/export.ts` — **baru**.
- `src/routes/api/laporan/saya.export-zip.ts` — **baru**.
- `src/routes/api/laporan/kegiatan.export-zip.ts` — **baru**.
- `src/routes/pegawai/laporan/saya.tsx` — tombol + dialog.
- `src/routes/pegawai/laporan/kegiatan.tsx` — tombol + dialog.
- `src/lib/constants/routes.ts` — tambah path route baru bila pola existing menaruhnya di sana.
- `src/routeTree.gen.ts` — regenerasi (bukan edit manual).
- `tests/unit/laporan/export-zip.test.ts` — **baru**.

## Test Stubs (dari claude-plan-tdd.md)

Salin penuh dari `../claude-plan-tdd.md`:
- **Tests for: Step 8** — endpoint `laporan/saya.export-zip` (id milik user lain diabaikan diam-diam, `dokumen_ids: []` → 400, 501 id → 413 sebelum query DB, tanpa baris activity baru).
- **Tests for: Step 9** — endpoint `laporan/kegiatan.export-zip` (dokumen anggota tim lain masuk, dokumen kegiatan lain diabaikan, bukan Ketua Tim → hasil kosong bukan error).
- **Tests for: Step 10** — tombol + dialog kedua halaman (badge jumlah, batas 500, state loading, error state aman).
- **Tests for: Step 11** (bagian RP-05) — diff `routeTree.gen.ts` terbatas ke 2 route ini.

## Definition of Done

- [x] Endpoint `POST /api/laporan/saya.export-zip` mengembalikan ZIP valid hanya untuk dokumen milik peminta, mengabaikan id yang tidak berhak.
- [x] Endpoint `POST /api/laporan/kegiatan.export-zip` mengembalikan ZIP valid untuk dokumen kegiatan yang dipimpin peminta (termasuk milik anggota tim lain), mengabaikan dokumen kegiatan lain.
- [x] Guard 500 dokumen ditegakkan dari `dokumen_ids.length` mentah **sebelum** query DB dijalankan (diverifikasi test: `db.select` tidak pernah dipanggil saat guard aktif).
- [x] `requireSameOrigin` aktif di kedua endpoint; tanpa sesi → `401`; body kosong → `400`.
- [x] Tidak ada baris baru di tabel activity manapun setelah ekspor sukses — tidak ada endpoint yang menyentuh tabel activity apa pun (tidak ada import service mutasi).
- [x] Tombol "Ekspor Semua File (ZIP)" berfungsi di kedua halaman, mengikuti `filtered`/`selectedDocuments` secara real-time, batas 500 menampilkan pesan "persempit filter" tanpa tombol lanjut.
- [ ] **Belum dijalankan**: `src/routeTree.gen.ts` regenerasi (`pnpm dev`/`pnpm build`) — kedua route file sudah ada tapi belum terdaftar di route tree.
- [ ] Smoke test manual: ekspor dari `/pegawai/laporan/saya` dengan filter aktif, dan dari `/pegawai/laporan/kegiatan` sebagai Ketua Tim atas dokumen anggota tim lain — belum dilakukan (perlu app berjalan).
- [ ] **Belum dijalankan**: `pnpm test` — implementer diminta tidak menjalankan test/commit sendiri di sesi ini; user akan menjalankan `pnpm test` dan `git commit` secara manual.

## Implementation Notes (aktual)

- **Memoization per-dokumen (Step 2/Step 8)**: `src/lib/storage/document-file-access.ts` menambah 2 export tipis baru — `loadDocumentAccessContextForExport(documentId)` dan `resolveDocumentLampiranReferenceFromContext(context, lampiranIndex)` — membungkus fungsi privat existing (`loadDocumentAccessContext`/`resolveDocumentLampiranReference`) tanpa mengubah perilakunya. `resolveDocumentLampiranLogicalPathForExport` (section-01) sendiri tidak mendukung reuse context lintas index, jadi endpoint RP-05 memakai dua fungsi baru ini secara langsung (lewat helper bersama, lihat berikutnya) untuk memuat context sekali per dokumen dan dipakai ulang untuk semua `lampiranIndex` dokumen itu.
- **Helper bersama baru** (tidak ada di daftar file plan asli, ditambahkan karena kedua endpoint section ini "struktur identik" per plan): `src/lib/export/laporan-zip-entries.ts` — `buildLaporanZipEntries(rows)` (resolusi entries + memoization di atas) dan `buildLaporanExportZipFilename`/`resolveKegiatanFilenamePart` (penamaan file ZIP). Menghindari duplikasi logika antara `saya.export-zip.ts` dan `kegiatan.export-zip.ts`.
- **Kolom `jenis_dokumen_nama`**: plan tidak menyebutnya eksplisit, tapi `buildFormalFilename` butuh field ini untuk dokumen `is_non_material`. Ditambah `leftJoin(masterJenisDokumen, ...)` di kedua query (pola sama seperti `src/routes/api/dokumen.$id.ts`), karena `GET /api/laporan/saya`/`kegiatan` existing tidak men-select-nya.
- **Ketua Tim bukan pemimpin kegiatan manapun**: endpoint `kegiatan.export-zip` mengembalikan ZIP kosong (hanya `DAFTAR_ISI.txt`, status 200) — bukan `403`/`404` — meniru persis `GET /api/laporan/kegiatan` existing yang mengembalikan `{ dokumen: [], isKetuaTim: false }`. Ini keputusan eksplisit yang diminta plan Step 9.
- **`requesterRole` untuk kegiatan.export-zip**: dipakai `'PEGAWAI'` (bukan role terpisah "Ketua Tim" — role itu tidak ada di `ROLES` constants, kepemimpinan kegiatan adalah assignment terpisah, bukan role sesi).
- **UI**: tombol + dialog dipakai bersama lewat komponen baru `src/components/laporan/ExportZipDialog.tsx` (tidak ada di daftar file plan, ditambahkan untuk menghindari duplikasi dialog antara `saya.tsx` dan `kegiatan.tsx`). Unduhan lewat `fetch` + `Blob` + `downloadZipBlob`/`extractContentDispositionFilename` baru di `src/lib/file-helpers.ts`.
- **Test**: `tests/unit/laporan/export-zip.test.ts` — mock `buildLaporanZipEntries` dan `streamDocumentZip` (bukan DB `document-file-access.ts` mentah) supaya test endpoint fokus ke guard/otorisasi/query construction, bukan mengulang test resolver section-01. Plus describe block source-shape untuk UI (pola sama seperti section-02).
- **Belum dijalankan oleh implementer**: route generation (`pnpm dev`/`pnpm build`), `pnpm test`, dan `git commit` — sesuai permintaan user di sesi ini, semua diserahkan ke user.
