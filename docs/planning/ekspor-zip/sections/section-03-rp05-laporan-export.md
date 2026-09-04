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

- [ ] Endpoint `POST /api/laporan/saya.export-zip` mengembalikan ZIP valid hanya untuk dokumen milik peminta, mengabaikan id yang tidak berhak.
- [ ] Endpoint `POST /api/laporan/kegiatan.export-zip` mengembalikan ZIP valid untuk dokumen kegiatan yang dipimpin peminta (termasuk milik anggota tim lain), mengabaikan dokumen kegiatan lain.
- [ ] Guard 500 dokumen ditegakkan dari `dokumen_ids.length` mentah **sebelum** query DB dijalankan (diverifikasi test: query tidak pernah dipanggil saat guard aktif).
- [ ] `requireSameOrigin` aktif di kedua endpoint; tanpa sesi → `401`; body kosong → `400`.
- [ ] Tidak ada baris baru di tabel activity manapun setelah ekspor sukses.
- [ ] Tombol "Ekspor Semua File (ZIP)" berfungsi di kedua halaman, mengikuti `filtered`/`selectedDocuments` secara real-time, batas 500 menampilkan pesan "persempit filter" tanpa tombol lanjut.
- [ ] `src/routeTree.gen.ts` diff hanya menambah 2 route ini (plus route section-02 bila regenerasi terjadi setelah keduanya ada).
- [ ] Smoke test manual: ekspor dari `/pegawai/laporan/saya` dengan filter aktif, dan dari `/pegawai/laporan/kegiatan` sebagai Ketua Tim atas dokumen anggota tim lain — verifikasi struktur folder + `DAFTAR_ISI.txt` di kedua kasus.
- [ ] `pnpm test` hijau (termasuk test baru section ini + tidak ada regresi ke test laporan existing).
