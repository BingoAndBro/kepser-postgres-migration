# Research — Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

> Fase 1 dari `deep-plan`. Input spec: `docs/rencana-perubahan.md` bagian RP-07 (fondasi, `Disetujui`), RP-02 (`Draft`), RP-05 (`Draft`).
> Semua keputusan lintas-RP sudah dikunci di RP-07 — riset ini memverifikasi bahwa kode existing mendukung keputusan itu, dan menemukan detail teknis yang belum tertulis.

---

## 1. Ringkasan: apa yang sudah ada vs apa yang baru

| Kebutuhan RP-07 | Sudah ada di codebase? | Catatan |
|---|---|---|
| Resolver lampiran WORKFLOW aman (logicalPath dari dokumenId + index) | **Sebagian** — lewat token/HTTP di `src/lib/storage/document-file-access.ts`; lewat repo di `src/lib/archive/berkas-arsip-file-access.ts` | Belum ada fungsi non-HTTP "beri saya logicalPath" yang bisa dipanggil perakit ZIP. **Harus diekspos** (RP-07 langkah 3). |
| Resolver lampiran item berkas (WORKFLOW + MANUAL) | **Sebagian** — `createBerkasArsipItemAttachmentFileResponse` mengembalikan `Response` (buffer penuh), bukan path | Perlu jalur yang mengembalikan `{ logicalPath, namaAman }[]` tanpa membaca file. |
| Penamaan file formal konsisten preview/download | **Ada** — `buildFormalFilename()` di `src/lib/file-helpers.ts`, `buildStorageFilename()` di `#/lib/dokumen`, `resolveWorkflowAttachmentReference()` di `src/lib/archive/berkas-arsip-attachment-names.ts` | RP-07 langkah 3 minta pakai `buildFormalFilename()`. Untuk item berkas, `resolveWorkflowAttachmentReference()` sudah menghasilkan `downloadFilename` yang benar. |
| Sanitasi nama folder/segmen | **Ada** — `sanitizeStoragePathSegment()`, `sanitizeStorageFilename()` di `src/lib/storage/local-storage-paths.ts`; `sanitizeBerkasAttachmentFilename()` / `toSafeAttachmentText()` di `berkas-arsip-attachment-names.ts` | Belum ada helper khusus "nama folder dokumen `YYYY-MM-DD_judul_id8`". Ekstrak baru di `document-zip.ts` atau `file-helpers.ts`. |
| Path traversal / root escape guard | **Ada** — `assertSafeLogicalStoragePath()`, `resolvePhysicalStoragePath()` (cek `path.relative` mulai `..`) | Perakit ZIP **wajib** lewat dua fungsi ini sebelum `createReadStream`. |
| Streaming ZIP (tak buffer penuh) | **Belum ada** — tidak ada dependensi arsip; tak ada penggunaan `ReadableStream` di route mana pun (`src/routes/**` bersih) | Tambah `archiver` (RP-07 langkah 1–2). |
| `DAFTAR_ISI.txt` generator | **Belum ada** | Baru, di `document-zip.ts`. |
| Dialog konfirmasi ekspor (klien) | **Belum ada** komponen khusus; ada pola dialog lain (`CloseBerkasDialog.tsx`, Base UI) | Buat komponen kecil per konsumen atau satu bersama. |
| Batas 500 dokumen / skip > 250 MB | **Belum ada** | Baru, di `document-zip.ts` + cek `COUNT` di endpoint. |

**Kesimpulan:** tidak ada implementasi ZIP paralel yang perlu dihindari. Yang perlu dipakai ulang adalah lapisan **penamaan** dan **guard path** — keduanya sudah matang.

---

## 2. Resolver file — kondisi sekarang

### 2a. WORKFLOW (dokumen lepas — RP-05) — `src/lib/storage/document-file-access.ts`

- `createDocumentLampiranAccessUrlResponse()` → keluarkan **signed URL** (butuh HTTP round-trip + token). Tidak cocok untuk perakit ZIP.
- `resolveDocumentLampiranAccessForToken()` → dipakai handler token; return `{ ok, logicalPath }` **tetapi** butuh `FileAccessTokenPayload` + `session`.
- Fungsi internal yang berguna:
  - `loadDocumentAccessContext(documentId)` → `{ document, isInDestroyedBerkas }` (cek keanggotaan berkas `CLOSED/DIMUSNAHKAN`).
  - `resolveDocumentLampiranReference(context, lampiranIndex)` → `{ ok: true, logicalPath }` atau error berkode (410 `Data file sudah dimusnahkan`, 404, dst). **Sudah** memanggil `assertSafeLogicalStoragePath()`.
  - `parseLampiranFileReferences()` → normalisasi `lampiran_urls` (string JSON atau array) → `{ url }[]`.
- Keduanya `function` privat (tidak di-`export`). **RP-07 langkah 3 = export jalur baru** mis. `resolveDocumentLampiranLogicalPath({ documentId, lampiranIndex })` yang membungkus `loadDocumentAccessContext` + `resolveDocumentLampiranReference`, **tanpa** token/HTTP. Otorisasi tetap tanggung jawab caller (endpoint RP-05).

### 2b. Item berkas (RP-02) — `src/lib/archive/berkas-arsip-file-access.ts`

- `createBerkasArsipItemAttachmentFileResponse({ berkasId, itemId, lampiranIndex, purpose })` → `Response` berisi `readFile()` **penuh** di memori. Tidak cocok streaming banyak file.
- Repo `defaultBerkasArsipFileAccessRepository` punya method siap-pakai:
  - `getFolderById(berkasId)` → `{ id, status_arsip }` (untuk blok `DIMUSNAHKAN`).
  - `getItemById(berkasId, itemId)` → `{ source_type, dokumen_id, manual_arsip_id }`.
  - `getWorkflowSourceById(dokumenId)` → semua kolom untuk penamaan (`judul`, `tanggal`, `is_non_material`, nama-nama master, `lampiran_urls`).
  - `getManualAttachmentByIndex(manualArsipId, index)` → `{ id }` (urut `createdAt, id`).
- `resolveWorkflowAttachmentReference(lampiran_urls, source, index)` → `{ logicalPath, downloadFilename, label, contentType }`. **Ini fungsi yang paling siap dipakai perakit** untuk item WORKFLOW: sudah aman, sudah menamai.
- MANUAL: `logical_path` diambil langsung dari `manual_arsip_attachment.logicalPath` (kolom `notNull`), + `judulLampiran` / `originalFilename` untuk nama. Sekarang aksesnya lewat `createManualArsipAttachmentFileResponse` (import dinamis dari `#/lib/manual-arsip`). Perlu jalur ambil `{ logicalPath, judulLampiran, originalFilename }` untuk semua attachment satu `manualArsipId`.
- **RP-07 langkah 3** untuk file ini = tambah fungsi mis. `collectBerkasItemAttachm019ns(berkasId)` atau `resolveBerkasItemLogicalPaths(item)` yang mengembalikan daftar `{ logicalPath, namaAman }` per item, memakai repo + `resolveWorkflowAttachmentReference` yang sudah ada.

### 2c. Guard path fisik — `src/lib/storage/local-storage-paths.ts`

- `getLocalStorageRoot()` → root dari env `LOCAL_STORAGE_ROOT` atau default dev.
- `assertSafeLogicalStoragePath(p)` → `normalizeLogicalStoragePath` (buang `..`, absolut, drive Windows, dst).
- `resolvePhysicalStoragePath(root, logicalPath)` → resolve + verifikasi `path.relative(root, resolved)` tidak keluar root. **Lempar** kalau keluar.
- Perakit ZIP: untuk tiap entri → `assertSafeLogicalStoragePath` → `resolvePhysicalStoragePath` → `fs.stat` (skip kalau ENOENT/ENOTDIR atau `size > 250 MB`) → `fs.createReadStream` → `archive.append(stream, { name: folderPath + '/' + namaAman })`.

---

## 3. Penamaan — bahan yang sudah tersedia

| Elemen | Fungsi existing | Output |
|---|---|---|
| `<file kelengkapan>` (WORKFLOW) | `buildFormalFilename(dok, lamp)` (`file-helpers.ts`) | `{kelengkapan}_{leaf}_{kegiatan}_{tanggal}.{ext}` — sudah dipakai preview/download |
| `<file kelengkapan>` (item berkas) | `resolveWorkflowAttachmentReference(...).downloadFilename` | idem, plus fallback aman `Lampiran N` |
| `<file kelengkapan>` (MANUAL) | `judul_lampiran` / `original_filename` + ekstensi dari `logical_path` | via `resolveManualAttachmentNames()` |
| sanitasi umum segmen | `sanitizeStoragePathSegment()`, `toSafeAttachmentText()` | buang `/ \ .. " \r \n`, teks sensitif (`token`, `storage root`, dst) |
| **`<folder dokumen>` `YYYY-MM-DD_judul_id8`** | **belum ada** | perlu helper baru: ambil `tanggal` (ISO `slice(0,10)`), `sanitizeStoragePathSegment(judul)`, `id.slice(0,8)` |
| **`<nama berkas>` (RP-02)** | **belum ada** | `sanitize(nomor_spm) + ' - ' + sanitize(klasifikasi_nama_snapshot)` |
| suffix anti-tabrakan file | **belum ada** | `" (2)"`, `" (3)"` di perakit, per folder dokumen |

**Guard nama sensitif** sudah kuat (`hasSensitiveNameText` menolak `token`, `signedurl`, `storage root`, `logical_path`, `physical_path`, `database_url`, `/storage/`). Helper folder baru sebaiknya memanggil `sanitizeStoragePathSegment` (bukan hanya regex ad-hoc).

---

## 4. Sumber data konsumen

### 4a. RP-05 — `src/routes/pegawai/laporan/saya.tsx` + `/api/laporan/saya`

- Halaman memuat `GET /api/laporan/saya` → `dokumen: DokumenLaporanRow[]`. Baris memuat `id`, `lampiran_urls` (sudah di-`parseLampiranUrls`), `tanggal`, `judul`, nama-nama master, `created_by`/`pengaju_id`, `status` (`COMPLETED` | `TERSIMPAN`).
- `filtered` = `useMemo` klien: filter hirarkis (`fungsiId`, `kegiatanId`, `jenisId`, `kategoriId`, `detailId`, `tanggalMulai`, `tanggalAkhir`) + `search` + `sort`. **Klien sudah menghitung `filtered`** → kirim `filtered.map(d => d.id)` ke endpoint (rekomendasi RP-05 langkah 1).
- Endpoint `GET /api/laporan/saya` sudah membatasi `createdBy = session.user.id` + status `COMPLETED/TERSIMPAN`. **Endpoint ekspor wajib mengulang cek ini per id** (jangan percaya daftar id klien).
- Tombol: di header seksi (dekat baris "N Dokumen Ditemukan", `saya.tsx` ±ln 144).

### 4b. RP-05 — `src/routes/pegawai/laporan/kegiatan.tsx` + `/api/laporan/kegiatan`

- Halaman: daftar kegiatan yang dipimpin → pilih satu → lihat `selectedDocuments` (dokumen kegiatan itu yang lolos `detailFilter`).
- `/api/laporan/kegiatan` otorisasi: `ketuaTimAssignments` where `userId = session.user.id` → `kegiatanIds` → dokumen `inArray(kegiatanJenisId, kegiatanIds)` + status `COMPLETED/TERSIMPAN`.
- **Endpoint ekspor wajib mengulang**: muat `kegiatanIds` yang dipimpin peminta, tolak/abaikan `dokumen_id` di luar itu.
- Tombol: paling wajar di panel detail kegiatan terpilih, bekerja atas `selectedDocuments` (bukan seluruh daftar kegiatan). Ini konsisten dengan "tiap dokumen = satu folder".

### 4c. RP-02 — `src/routes/arsiparis/berkas/$id.tsx` + `/api/arsiparis/berkas/$id`

- DTO detail sudah punya `items[]` dengan `source_type`, `attachments`, `workflow`/`manual`, `has_attachments`, `attachment_count`, dan `klasifikasi_nama_snapshot`, `nomor_spm`, `status_berkas`, `status_arsip`.
- Otorisasi endpoint arsip: `requireBerkasArsipApiSession()` (`berkas-arsip-api.ts`) — wajib `dms_session` + role `KEPALA_SUB_BAGIAN_UMUM` (ADMIN bukan pengganti). Endpoint ekspor pakai helper yang sama.
- Guard status: hanya `status_berkas = CLOSED` **dan** `status_arsip != DIMUSNAHKAN` (RP-02 langkah 1). `DIMUSNAHKAN` → file sudah dihapus fisik (Phase 13Y.2), harus ditolak lebih awal.
- Tombol: `/arsiparis/berkas/$id` (header aksi) dan opsional baris "Berkas Tertutup" (`/arsiparis/berkas/tertutup`).

---

## 5. Skema DB & CHECK constraint (relevan untuk item terbuka RP-02)

`src/db/schema/arsip/berkas-arsip.ts`:

- `berkasArsip.nomorSpm` = `text` **nullable** (tak ada `notNull`). RP-02 batasi ke `CLOSED`; Form Tutup Berkas mengisi Nomor SPM, tapi data lama/manual bisa `null` → perakit butuh fallback nama berkas (`[Tanpa Nomor SPM] - <klasifikasi>` atau `<id8> - <klasifikasi>`).
- `berkasArsip` **tak punya** kolom `terakhir_diekspor_at`. Menambah = migrasi Drizzle (`drizzle/*.sql`) + `src/db/schema/**` → butuh izin & di luar scope RP-07. **Item terbuka RP-02 #1.**
- `berkasArsipActivity.eventType` `text NOT NULL` + **CHECK constraint** `berkas_arsip_activity_event_type_check` membatasi ke 8 nilai literal (lihat baris 140-149). Nilai `BERKAS_DIEKSPOR` **tidak** ada → menambah = `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` (migrasi kecil) **dan** ubah array `BERKAS_ACTIVITY_EVENT_TYPES` di `src/lib/archive/berkas-arsip-activity.ts` + `CHECK` di schema. **Item terbuka RP-02 #2.**
  - Alternatif tanpa migrasi: pakai `METADATA_ARSIP_AKTIF_DIPERBARUI` (generik) dengan `catatan` = "Berkas diekspor ke ZIP", atau **tidak menulis activity sama sekali** (cukup `console.*` aplikasi — RP-05 langkah 5 sudah memilih pola "tanpa jejak DB").
- `manual_arsip_attachment.logicalPath` = `text NOT NULL`, `originalFilename` / `judulLampiran` `NOT NULL`. Aman dipakai perakit.

---

## 6. Integrasi runtime: streaming `Response` di TanStack Start + Nitro

- Server handler = `createFileRoute(...).server.handlers.GET/POST` mengembalikan `Response` Web standar (lihat `berkas/$id/close.ts`, `items/.../download/$lampiranIndex.ts`).
- Runtime: `nitro` (nitro-nightly) di Node, `@types/node ^22`. `archiver` menghasilkan **Node `Readable`**.
- `new Response(body)` menerima `BodyInit`. Node `Readable` **tidak** selalu diterima sebagai `BodyInit` di semua runtime → jalur paling portabel: `Readable.toWeb(archive)` (`node:stream`) → web `ReadableStream` → `new Response(webStream, { headers })`.
- Header respons: `Content-Type: application/zip`, `Content-Disposition: attachment; filename="..."` (nama statis + sanitasi, mis. `Ekspor_Laporan_Saya_YYYY-MM-DD.zip` / `Berkas_<nomorSpm sanit>_YYYY-MM-DD.zip`), `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` (pola `secureFileHeaders()` yang ada).
- **Tidak** ada `Content-Length` (streaming, ukuran tak diketahui di muka) — dapat diterima; gateway internal LAN.
- `archiver` memancarkan `error` & `warning` (mis. `ENOENT`). Handler: dengarkan `warning` (skip + catat ke `DAFTAR_ISI.txt`), `error` (destroy stream). Karena header sudah terkirim saat streaming mulai, kegagalan di tengah = ZIP terpotong → `DAFTAR_ISI.txt` (jika ditulis **pertama** ke arsip) jadi penanda.
- **Perlu verifikasi manual saat implementasi**: perilaku `Readable.toWeb` + backpressure di nitro-nightly, dan apakah handler perlu `export const Route` opsi khusus (mis. `ssr: false` seperti `/api/laporan/saya`).

---

## 7. Pola API & keamanan yang wajib diikuti (AGENTS.md)

| Aturan AGENTS.md | Dampak ke plan |
|---|---|
| **Baris 1075**: "Do not modify `package.json` / `pnpm-lock.yaml` unless the phase explicitly allows package changes." | Penambahan `archiver` + `@types/archiver` = **langkah tersendiri**, minta izin eksplisit sebelum edit `package.json`. |
| **Baris 567 / 9**: "Update docs before behavior changes." | `AGENTS.md` bagian *Storage And File Rules* di-update **bersamaan/sebelum** kode. Section-01 (fondasi) memuat langkah doc. |
| **Behavioral Rule 4**: "Zod at every boundary." | Body endpoint RP-05 (`{ dokumen_ids: string[] }`) lewat Zod di `src/lib/schemas/export.ts` (baru). RP-02 tak punya body (GET), param `$id` lewat `parseBerkasIdParam`. |
| **Behavioral Rule 5**: "No magic strings." | Route API baru masuk `src/lib/constants/routes.ts`. |
| **Behavioral Rule 7**: "Server is the authority for RBAC." | Otorisasi per-dokumen / per-berkas di server, bukan hanya sembunyikan tombol. |
| **Same-Origin (baris 227-230)**: unsafe methods `requireSameOrigin(request)`. | Endpoint RP-05 = `POST` → wajib `requireSameOrigin`. RP-02 = `GET` (aman) → tidak wajib, tapi tetap butuh sesi + role. |
| **Storage/File Rules (760-790)**: no path/root/token leak; path traversal guard; `DIMUSNAHKAN` blokir; nama disanitasi; missing file "fail cleanly". | Perakit hanya pakai `assertSafeLogicalStoragePath` + `resolvePhysicalStoragePath`; `DAFTAR_ISI.txt` & nama folder **tak boleh** memuat logicalPath/root/token; file hilang → skip + catat, jangan gagalkan ZIP. |
| **Baris 884 / 1074**: jangan sentuh `routeTree.gen.ts` kecuali fase mengizinkan. | Route API baru (`export-zip`) = file route baru → **butuh route generation**. Plan harus **eksplisit mengizinkan** route generation untuk 3 route API baru, jalankan generator resmi (`pnpm dev`/`build`), jangan hand-edit. (RP-01 sudah preseden untuk izin eksplisit semacam ini.) |
| **Prinsip tetap (rencana-perubahan.md baris 12)**: internal & mandiri, tak ada panggilan keluar. | ZIP dirakit di server dari filesystem lokal, dialirkan ke browser peminta. Tidak ada fetch/upload ke sistem lain. `archiver` = lib lokal murni, tanpa network. |

---

## 8. Konvensi test

- `vitest.config.ts`: `environment: 'node'`, `include: ['tests/**/*.test.ts']`.
- Direktori `tests/unit/` sudah punya `arsiparis/`, `storage/`, `laporan/`, `dokumen/`. **`tests/unit/export/` baru** untuk `document-zip.test.ts` (RP-07 langkah 2).
- Pola test file-access existing (`tests/unit/arsiparis/*`, `tests/unit/storage/*`) memakai repository yang di-inject (`BerkasArsipFileAccessDeps`) + root sementara. Perakit ZIP sebaiknya menerima `deps` serupa (resolver + root + `fs` opsional) supaya bisa diuji tanpa DB dan dengan direktori `tmp`.
- Untuk uji struktur ZIP: `archiver` menulis ke buffer/`PassThrough`; test dapat meng-unzip in-memory (mis. `fflate`/`unzipper`) **atau** — supaya tak menambah dev-dep uji — perakit mengekspos fungsi murni `buildZipPlan(entries)` (daftar path + skip + isi `DAFTAR_ISI.txt`) yang diuji tanpa benar-benar men-zip. **Rekomendasi:** pisahkan "perencanaan" (murni, teruji penuh) dari "streaming" (tipis, uji asap manual).

---

## 9. Peta modul final (gabungan RP-07 + RP-02 + RP-05)

```
src/lib/export/document-zip.ts            [BARU]  perakit: buildZipPlan() murni + streamDocumentZip() tipis
  ├─ pakai  src/lib/file-helpers.ts               buildFormalFilename (+ helper sanitasi folder baru)
  ├─ pakai  src/lib/storage/local-storage-paths.ts  assertSafeLogicalStoragePath, resolvePhysicalStoragePath, getLocalStorageRoot
  └─ dep    archiver + @types/archiver     [package.json — izin]

src/lib/storage/document-file-access.ts   [+]  export resolveDocumentLampiranLogicalPath() non-HTTP (RP-05)
src/lib/archive/berkas-arsip-file-access.ts [+]  export collectBerkasItemAttachments() non-HTTP (RP-02)

RP-05:
src/routes/api/laporan/saya.export-zip.ts       [BARU]  POST, Zod, re-authz per dokumen milik pegawai
src/routes/api/laporan/kegiatan.export-zip.ts   [BARU]  POST, Zod, re-authz per dokumen kegiatan yang dipimpin
src/lib/schemas/export.ts                        [BARU]  Zod body { dokumen_ids: string[] (1..500) }
src/routes/pegawai/laporan/saya.tsx             [+]  tombol + dialog konfirmasi (atas filtered)
src/routes/pegawai/laporan/kegiatan.tsx         [+]  tombol + dialog konfirmasi (atas selectedDocuments)

RP-02:
src/routes/api/arsiparis/berkas/$id/export-zip.ts [BARU]  GET, requireBerkasArsipApiSession, guard CLOSED & !DIMUSNAHKAN
src/routes/arsiparis/berkas/$id.tsx             [+]  tombol + dialog konfirmasi
src/routes/arsiparis/berkas/tertutup.tsx (index) [+]  (opsional) tombol per baris

Bersama:
src/lib/constants/routes.ts                      [+]  3 route API baru
src/routeTree.gen.ts                             [regen]  route generation (izin eksplisit)
AGENTS.md                                        [+]  Storage/File Rules — kebijakan ekspor ZIP
tests/unit/export/document-zip.test.ts           [BARU]
tests/unit/arsiparis/*, tests/unit/laporan/*     [+]  otorisasi endpoint + struktur folder
docs/penjelasan-proyek.md                        [+]  saat Selesai
```

---

## 10. Temuan yang perlu ditutup di Interview (Fase 2)

Hanya **RP-02** yang punya item terbuka (RP-05 final, RP-07 terkunci):

1. **`terakhir_diekspor_at`** — tambah kolom (→ migrasi) atau tidak. Default spec: tidak, kecuali peringatan "belum diekspor" RP-01 langkah 8 dijadikan **blok keras**.
2. **Event aktivitas `BERKAS_DIEKSPOR`** — (a) tak ada activity, log aplikasi saja; (b) pakai event generik yang sudah lolos CHECK; (c) tambah nilai `BERKAS_DIEKSPOR` (migrasi kecil ke CHECK `event_type` + array konstanta).
3. **Konfirmasi final penamaan** folder induk berkas & item MANUAL — RP-07 sudah mengunci `<nomor_spm sanit> - <klasifikasi>` / `[Manual] <judul>_<id8>`; perlu keputusan fallback saat `nomor_spm` `null` dan konfirmasi format `[Manual]` persis.

Selain itu: satu pertanyaan riset web (integrasi `archiver` streaming ⇄ `Readable.toWeb` di nitro-nightly) — opsional.
