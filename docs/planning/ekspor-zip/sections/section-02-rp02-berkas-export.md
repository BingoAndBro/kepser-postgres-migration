# Section 02: RP-02 — Ekspor Satu Berkas Penuh ke ZIP (KSBU)

## Context

Section-01 sudah menyediakan `src/lib/export/document-zip.ts` (`streamDocumentZip`) dan resolver non-HTTP `resolveBerkasArsipItemAttachments` di `src/lib/archive/berkas-arsip-file-access.ts`. `AGENTS.md` sudah mendokumentasikan kebijakan ekspor ZIP. Halaman `/arsiparis/berkas/$id` dan endpoint `GET /api/arsiparis/berkas/$id` (DTO detail berkas + items) sudah ada dan tidak perlu diubah strukturnya — section ini hanya menambah.

## Objective

Di akhir section ini, Kepala Sub Bagian Umum bisa membuka `/arsiparis/berkas/$id` untuk berkas `CLOSED` non-`DIMUSNAHKAN`, klik "Ekspor ZIP", konfirmasi di dialog, dan mendapat unduhan `.zip` berisi seluruh lampiran berkas tersebut, terstruktur `[Nomor SPM] - [Klasifikasi]/[folder dokumen]/[file]`.

## Prerequisites

- Section(s) yang harus selesai dulu: **section-01**.
- Files/modules yang harus sudah tersedia: `src/lib/export/document-zip.ts` (`streamDocumentZip`, helper `buildWorkflowDocumentFolderName`/`buildManualDocumentFolderName`/`buildBerkasParentFolderName`), `src/lib/archive/berkas-arsip-file-access.ts` (`resolveBerkasArsipItemAttachments`), `src/lib/archive/berkas-arsip-api.ts` (`requireBerkasArsipApiSession`, `parseBerkasIdParam` — sudah ada, dipakai ulang).

## Implementation Steps

Rujuk `../claude-plan.md` Step 6, 7, 11 (bagian RP-02), 12 (bagian RP-02) untuk detail penuh. Ringkas urutan kerja:

1. **Endpoint** `src/routes/api/arsiparis/berkas/$id/export-zip.ts` (baru), `GET`:
   - `requireBerkasArsipApiSession(request)` → sesi + role `KEPALA_SUB_BAGIAN_UMUM` (`ADMIN` bukan pengganti).
   - `parseBerkasIdParam(params.id)`.
   - Muat berkas (`nomor_spm`, `klasifikasi_nama_snapshot`, `status_berkas`, `status_arsip`) + `items[]` — pakai service/read-model yang sama dengan endpoint detail `$id.ts`.
   - Guard: `status_berkas !== 'CLOSED'` → `409`; `status_arsip === 'DIMUSNAHKAN'` → `410 Data file sudah dimusnahkan`.
   - Guard jumlah: `items.length > 500` → `413` + pesan spesifik jumlah, **sebelum** resolver attachment dipanggil.
   - Per item: `resolveBerkasArsipItemAttachments(berkasId, itemId)` → `files[]`; `folderPath = buildBerkasParentFolderName(...) + '/' + (WORKFLOW ? buildWorkflowDocumentFolderName(...) : buildManualDocumentFolderName(...))`. `nomor_spm` kosong → fallback `"[Tanpa Nomor SPM] - <klasifikasi>"`.
   - `streamDocumentZip(entries, { requesterRole: 'KEPALA_SUB_BAGIAN_UMUM', sourceDescription: 'Nomor SPM ' + nomorSpm, ... })` → kembalikan `Response`.
   - Log aplikasi (`console.*`) mencatat `berkasId` + aktor + jumlah dokumen. **Tidak** menulis `berkas_arsip_activity` (keputusan interview #10).
2. **Tombol + dialog** di `src/routes/arsiparis/berkas/$id.tsx`: tombol "Ekspor ZIP" di header aksi (tampil hanya untuk `CLOSED` non-`DIMUSNAHKAN`, disabled+tooltip untuk kondisi lain). Klik → dialog konfirmasi (jumlah dokumen, Nomor SPM, Klasifikasi, tombol Batal/Ekspor Sekarang) → konfirmasi memicu navigasi/`<a download>` ke endpoint (GET murni, tidak perlu `fetch`+`blob`).
3. **Route generation**: setelah file route dibuat, jalankan `pnpm dev`/`pnpm build` agar `src/routeTree.gen.ts` memuat route baru. Jangan hand-edit.
4. **Test**: `tests/unit/arsiparis/berkas-export-zip.test.ts` (baru) — seluruh checklist Step 6 di `claude-plan-tdd.md`.

## Files to Create/Modify

- `src/routes/api/arsiparis/berkas/$id/export-zip.ts` — **baru**.
- `src/routes/arsiparis/berkas/$id.tsx` — tombol + dialog konfirmasi.
- `src/lib/constants/routes.ts` — tambah path route baru bila pola existing menaruhnya di sana (cek konsistensi dengan entri `KEPALA_SUB_BAGIAN_UMUM` yang sudah ada sebelum menambah).
- `src/routeTree.gen.ts` — regenerasi (bukan edit manual).
- `tests/unit/arsiparis/berkas-export-zip.test.ts` — **baru**.

## Test Stubs (dari claude-plan-tdd.md)

Salin penuh dari `../claude-plan-tdd.md`:
- **Tests for: Step 6** — endpoint (Happy Path, Edge Cases, Error Cases: 401/403/404/409/410/413, tanpa baris activity baru).
- **Tests for: Step 7** — tombol + dialog (tampil/disabled sesuai status, konfirmasi memicu unduhan, batal tidak memicu request, error state aman).
- **Tests for: Step 11** (bagian RP-02) — diff `routeTree.gen.ts` terbatas ke route ini.

## Definition of Done

- [ ] Endpoint `GET /api/arsiparis/berkas/$id/export-zip` mengembalikan ZIP valid untuk berkas `CLOSED` non-`DIMUSNAHKAN`, struktur folder sesuai spec.
- [ ] Guard `409`/`410`/`401`/`403`/`404`/`413` semua teruji.
- [ ] Tidak ada baris baru di `berkas_arsip_activity` setelah ekspor — diverifikasi test.
- [ ] Tombol "Ekspor ZIP" + dialog konfirmasi berfungsi di `/arsiparis/berkas/$id`, disabled untuk status yang tidak boleh diekspor.
- [ ] `src/routeTree.gen.ts` diff hanya menambah route ini (plus route section-03 bila regenerasi terjadi setelah keduanya ada).
- [ ] Smoke test manual: unduh ZIP nyata dari berkas dengan campuran item WORKFLOW+MANUAL, buka, verifikasi struktur folder + `DAFTAR_ISI.txt`.
- [ ] `pnpm test` hijau (termasuk test baru section ini + tidak ada regresi ke test berkas existing).
