# Implementation Plan: Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

## Overview

Dibangun satu modul perakit ZIP streaming (`src/lib/export/document-zip.ts`) yang tidak tahu apa-apa soal role, filter, atau otorisasi — ia hanya menerima daftar entri `{ folderPath, files: [{ namaAman, logicalPath }] }` yang **sudah** disaring dan diberi nama oleh pemanggil, lalu menghasilkan `.zip` streaming lengkap dengan `DAFTAR_ISI.txt`, penanganan file hilang/terlalu besar, dan anti-tabrakan nama. Di atas modul ini dibangun dua konsumen tipis: **RP-02** (satu endpoint `GET` yang merakit seluruh lampiran satu berkas tertutup KSBU, dengan satu level folder induk `[Nomor SPM] - [Klasifikasi]`) dan **RP-05** (dua endpoint `POST` yang merakit lampiran dari dokumen laporan yang lolos filter — satu untuk pegawai atas dokumennya sendiri, satu untuk Ketua Tim atas dokumen kegiatan yang ia pimpin). Kedua konsumen melakukan re-otorisasi penuh di server; klien hanya mengirim daftar id/parameter yang sudah mereka lihat.

Pendekatan dipecah jadi tiga unit kerja berurutan-lalu-paralel: **section-01** membangun fondasi (modul + resolver non-HTTP + test + sinkron `AGENTS.md`), lalu **section-02** (RP-02) dan **section-03** (RP-05) berjalan **paralel** di atas fondasi yang sama karena keduanya hanya menambah endpoint + tombol + dialog tanpa saling menyentuh file.

## Architecture

```text
                         ┌─────────────────────────────────────┐
                         │  src/lib/export/document-zip.ts      │
                         │  ┌─────────────────────────────────┐│
                         │  │ buildZipPlan(entries, opts)      ││   pure, no I/O
                         │  │  → { includedFolders[],          ││   fully unit-testable
                         │  │      skipped[], daftarIsiText }  ││
                         │  └─────────────────────────────────┘│
                         │  ┌─────────────────────────────────┐│
                         │  │ streamDocumentZip(entries, opts) │←┼── thin: fs.stat + archiver
                         │  │  → Response (application/zip)    ││   + Readable.toWeb()
                         │  └─────────────────────────────────┘│
                         └───────────────┬───────────────────────┘
                                         │ dipakai oleh
             ┌───────────────────────────┼────────────────────────────┐
             │                                                        │
  ┌──────────▼─────────────┐                          ┌───────────────▼──────────────┐
  │ RP-02 (KSBU)            │                          │ RP-05 (Pegawai / Ketua Tim)   │
  │ GET .../berkas/$id/     │                          │ POST .../laporan/saya.        │
  │     export-zip          │                          │      export-zip               │
  │                          │                          │ POST .../laporan/kegiatan.    │
  │ resolver:                │                          │      export-zip               │
  │  berkas-arsip-file-      │                          │                                │
  │  access.ts (WORKFLOW+    │                          │ resolver:                     │
  │  MANUAL item berkas)     │                          │  document-file-access.ts      │
  │                          │                          │  (WORKFLOW dokumen lepas)     │
  │ +1 level folder induk    │                          │                                │
  │ [Nomor SPM] - [Klasif.]  │                          │ re-authz per dokumen_id        │
  └──────────────────────────┘                          └────────────────────────────────┘
```

Alur satu ekspor (generik untuk ketiga endpoint):

1. Klien memuat halaman, sudah punya daftar dokumen/berkas yang terlihat (hasil query/filter yang sudah ada).
2. Klik "Ekspor ZIP" → dialog konfirmasi klien menampilkan jumlah dokumen (dan untuk RP-05, ringkasan filter aktif). Jika jumlah > 500 (RP-05) atau (RP-02, hampir mustahil karena satu berkas), dialog jadi pesan "persempit filter" tanpa tombol lanjut.
3. Konfirmasi → request ke endpoint (`GET` untuk RP-02 dengan `$id` di path; `POST` dengan body `{ dokumen_ids }` untuk RP-05).
4. Endpoint: sesi + role → re-otorisasi (per berkas untuk RP-02; per dokumen untuk RP-05) → hitung `COUNT` (RP-05: `dokumen_ids.length` setelah filter server; RP-02: jumlah item berkas) → jika > 500, `413` + pesan spesifik, **tanpa** mulai streaming.
5. Endpoint memanggil resolver non-HTTP yang sesuai untuk mengubah tiap dokumen/item jadi `{ folderPath, files: [{ namaAman, logicalPath }] }`, mengumpulkan entri yang gagal diresolusi (dokumen tanpa lampiran, file hilang terdeteksi dini bila memungkinkan) sebagai "skip" awal.
6. Endpoint memanggil `streamDocumentZip(entries, opts)` → `Response` dengan header `Content-Type: application/zip`, `Content-Disposition: attachment; filename="..."`, `Cache-Control: no-store`.
7. Di dalam `streamDocumentZip`: `DAFTAR_ISI.txt` ditulis **pertama** ke archive (penanda kelengkapan kalau stream terputus), lalu tiap file: `assertSafeLogicalStoragePath` → `resolvePhysicalStoragePath` → `fs.stat` (skip jika ENOENT/ENOTDIR atau `size > 250MB`, catat) → `archive.append(createReadStream(...), { name })`. Warning `archiver` (mis. ENOENT saat baca aktual) ditangkap, dicatat, tidak menghentikan stream. Error fatal → biarkan koneksi terputus (klien menerima ZIP tak lengkap; tak ada mekanisme retry parsial).
8. Browser menerima unduhan `.zip`.

## Implementation Steps

### Step 0: Izin dependensi — tambah `archiver`

**What:** Tambah `archiver` dan `@types/archiver` ke `dependencies`/`devDependencies` di `package.json`, jalankan `pnpm install` untuk memperbarui `pnpm-lock.yaml`.

**Why:** RP-07 memilih `archiver` (streaming, bukan `jszip` yang buffer penuh di memori) sebagai satu-satunya library ZIP untuk keluarga fitur ini. AGENTS.md melarang perubahan `package.json`/`pnpm-lock.yaml` tanpa izin eksplisit — plan ini **adalah** izin eksplisit tersebut, tapi harus tetap jadi langkah tersendiri yang terlihat jelas di diff/PR, terpisah dari perubahan logika.

**How:** Tambah baris dependensi, jalankan installer, commit `package.json` + `pnpm-lock.yaml` sendirian (tanpa perubahan kode lain dalam commit yang sama) supaya mudah diaudit.

**Files affected:** `package.json`, `pnpm-lock.yaml`.

**Dependencies:** Tidak ada — langkah pertama.

---

### Step 1: Modul fondasi `src/lib/export/document-zip.ts`

**What:** Modul baru berisi dua lapis:

- **`buildZipPlan(entries, options)`** — fungsi **murni**, tanpa I/O filesystem. Menerima daftar entri sudah-teresolusi `{ folderPath, files: Array<{ namaAman, logicalPath }> }` (nama sudah aman/disanitasi oleh pemanggil, `logicalPath` untuk diteruskan ke lapisan streaming — modul ini **tidak** membaca isi file), plus metadata opsional (`requesterLabel`, `requesterRole`, `sourceDescription`, `generatedAt`). Ia menghitung: urutan akhir folder+nama file per entri (menerapkan suffix `" (2)"`, `" (3)"` bila dua file dalam satu folder menghasilkan `namaAman` sama), memisahkan entri "akan disertakan" dari daftar "dokumen tanpa lampiran → dilewati", dan menyusun **teks** `DAFTAR_ISI.txt` (belum ditulis ke file apa pun). Fungsi ini **tidak** tahu ukuran file atau apakah file benar-benar ada — itu baru diketahui saat lapisan streaming melakukan `fs.stat`.
- **`streamDocumentZip(entries, options, deps?)`** — lapisan tipis yang memanggil `buildZipPlan` untuk mendapat rencana nama final, lalu untuk tiap file: resolve path fisik (`assertSafeLogicalStoragePath` + `resolvePhysicalStoragePath`, root dari `deps.root ?? getLocalStorageRoot()`), `fs.stat` (skip + catat kalau file hilang/`ENOENT`/`ENOTDIR`, atau `size > 250 * 1024 * 1024` byte), lalu `archive.append(fs.createReadStream(physicalPath), { name })`. `DAFTAR_ISI.txt` **final** (termasuk file yang baru ketahuan hilang/kebesaran saat `stat`) ditulis sebagai entri **pertama** ke archive sebelum file lain — supaya kalaupun stream terputus di tengah, penerima tetap punya daftar untuk tahu apa yang seharusnya ada. Mengembalikan `Response` siap dikirim (`application/zip`, `Content-Disposition`, `Cache-Control: no-store`) memakai `PassThrough` Node → `Readable.toWeb()` (dikonfirmasi `research-web.md`).
- Batas **500 dokumen**: modul menolak (`throw` error typed, mis. `DocumentZipTooManyEntriesError`) kalau `entries.length > 500` — **pengaman kedua**; pengaman **utama** (respons `413` dengan pesan ramah "Filter menghasilkan N dokumen…") ada di endpoint, dicek lewat `COUNT` **sebelum** memanggil modul ini sama sekali (lihat Step 5 & 7).
- Helper penamaan folder baru (bisa taruh di modul ini atau `file-helpers.ts` — rekomendasi: di `document-zip.ts` karena spesifik konteks ekspor):
  - `buildWorkflowDocumentFolderName({ id, judul, tanggal })` → `${tanggal.slice(0,10)}_${sanitizeStoragePathSegment(judul)}_${id.slice(0,8)}`.
  - `buildManualDocumentFolderName({ id, judul })` → `[Manual] ${sanitizeStoragePathSegment(judul)}_${id.slice(0,8)}`.
  - `buildBerkasParentFolderName({ nomorSpm, klasifikasiNama })` → `${sanitize(nomorSpm) || '[Tanpa Nomor SPM]'} - ${sanitize(klasifikasiNama)}`.
  - Semua tiga memakai `sanitizeStoragePathSegment` (existing, `local-storage-paths.ts`) sebagai basis, **bukan** regex ad-hoc baru.

**Why:** Memisahkan "rencana" (murni) dari "eksekusi I/O" (tipis) memenuhi kebutuhan test RP-07 (struktur folder, anti-tabrakan, skip, isi `DAFTAR_ISI.txt`, penolakan >500) tanpa harus benar-benar menulis/membaca `.zip` di kebanyakan test case — hanya smoke test kecil yang perlu menyentuh `archiver`/filesystem sungguhan. ZIP dipilih streaming (bukan buffer penuh) supaya ratusan dokumen tak membengkakkan memori server (RP-07 keputusan #1, risiko "ZIP besar → timeout gateway/proxy" di RP-05).

**How:** Lihat pseudocode alur di atas (bagian Architecture, langkah 7). Kontrak generik `{ folderPath, files[] }` per entri sudah cukup umum untuk dua bentuk hierarki (RP-05 pakai `folderPath` = nama folder dokumen langsung; RP-02 pakai `folderPath` = `<nama berkas>/<folder dokumen>` — pemanggil yang menggabungkan level induk, modul tidak tahu bedanya).

**Files affected:** `src/lib/export/document-zip.ts` (baru).

**Dependencies:** Step 0 (`archiver` terpasang).

---

### Step 2: Ekspos resolver non-HTTP di `document-file-access.ts` (untuk RP-05)

**What:** Di `src/lib/storage/document-file-access.ts`, ekspor (ubah dari `function` privat jadi `export function`, atau tambah wrapper baru) jalur yang mengembalikan `logicalPath` dokumen+lampiran **tanpa** token/HTTP:

- `loadDocumentAccessContext(documentId)` dan `resolveDocumentLampiranReference(context, lampiranIndex)` sudah punya logika yang tepat (termasuk blok `DIMUSNAHKAN` via `isInDestroyedBerkas` dan `assertSafeLogicalStoragePath`) — tinggal digabung jadi satu fungsi publik, mis. `resolveDocumentLampiranLogicalPathForExport({ documentId, lampiranIndex })` → `FileReferenceResult` (`{ ok: true, logicalPath }` atau `{ ok: false, status, message }`), dipanggil murni dari server (endpoint RP-05 sudah melakukan otorisasi kepemilikan/kegiatan sendiri sebelum memanggil ini — fungsi ini **tidak** mengulang cek role, hanya cek status berkas/dimusnahkan + validitas path, sama seperti alur token sekarang).
- Karena `loadDocumentAccessContext` melakukan satu query per pemanggilan, dan satu dokumen laporan biasa punya beberapa lampiran, endpoint RP-05 **memoization per-request**: panggil sekali per `documentId` (cache di `Map` lokal dalam satu request), pakai hasil `context` untuk semua `lampiranIndex` dokumen itu — bukan query ulang per lampiran. Ini didokumentasikan sebagai detail implementasi endpoint (Step 7), bukan tanggung jawab modul ini.
- **Catatan penting:** fungsi ini hanya mengembalikan `logicalPath` yang **valid & aman**, bukan nama file. Endpoint RP-05 tetap membangun `namaAman` sendiri lewat `buildFormalFilename(dok, lamp)` dari `file-helpers.ts` karena endpoint **sudah** meng-query baris dokumen penuh (mis. dari query serupa `/api/laporan/saya`) untuk keperluan filter/otorisasi — tidak perlu resolver ini juga mengembalikan metadata penamaan.

**Why:** RP-07 langkah 3 & Peta File eksplisit meminta ekspos resolver ini. Menjaga "tidak lewat HTTP token" penting: perakit ZIP jalan sepenuhnya di sisi server dalam satu request, tidak boleh membuat token sementara untuk dirinya sendiri (itu hanya overhead & permukaan risiko tambahan, lihat Storage/File Rules AGENTS.md soal token internals).

**How:** Refactor minimal — ekstraksi nama, tanpa mengubah perilaku endpoint token/preview/download yang sudah ada (`createDocumentLampiranAccessUrlResponse` dan `resolveDocumentLampiranAccessForToken` tetap dipakai apa adanya oleh rute existing).

**Files affected:** `src/lib/storage/document-file-access.ts`.

**Dependencies:** Step 1 (kontrak `{ namaAman, logicalPath }` sudah disepakati).

---

### Step 3: Ekspos resolver non-HTTP di `berkas-arsip-file-access.ts` (untuk RP-02)

**What:** Di `src/lib/archive/berkas-arsip-file-access.ts`, tambah jalur yang mengembalikan `{ logicalPath, namaAman }` per attachment **tanpa** membaca isi file (beda dari `createBerkasArsipItemAttachmentFileResponse` yang saat ini `readFile()` penuh):

- Untuk item **WORKFLOW**: `resolveWorkflowAttachmentReference(lampiran_urls, source, index)` (dari `berkas-arsip-attachment-names.ts`) **sudah** mengembalikan `{ logicalPath, downloadFilename, ... }` — tinggal dipanggil dari fungsi resolver baru, mis. `resolveBerkasArsipItemAttachments(berkasId, itemId)`, yang: `getFolderById` (cek bukan `DIMUSNAHKAN`) → `getItemById` → jika `WORKFLOW`: `getWorkflowSourceById` sekali, lalu iterasi semua index lampiran (`parseWorkflowAttachmentEntries(lampiran_urls).length`) memanggil `resolveWorkflowAttachmentReference` per index → kumpulkan `{ logicalPath, namaAman: downloadFilename }[]`.
- Untuk item **MANUAL**: query langsung `manualArsipAttachment` where `manualArsipId = item.manual_arsip_id`, order `createdAt, id` (sama urutan seperti `getManualAttachmentByIndex`), ambil semua baris sekaligus (bukan satu per index seperti sekarang) → map ke `{ logicalPath: row.logicalPath, namaAman: row.judulLampiran || row.originalFilename }`. Ini query baru kecil di repository (`BerkasArsipFileAccessRepository` bisa ditambah method `getManualAttachmentsForItem(manualArsipId)` — mengembalikan semua baris sekaligus, dibanding `getManualAttachmentByIndex` yang ambil satu per satu).
- Fungsi resolver baru **mengembalikan daftar per item**, bukan per index tunggal — karena perakit ZIP butuh *semua* lampiran satu item sekaligus untuk membangun satu folder dokumen.

**Why:** Sama seperti Step 2, RP-07 langkah 3 eksplisit meminta ini. Menghindari `readFile()` penuh untuk tiap lampiran satu-satu (yang dilakukan endpoint download/preview existing) penting karena RP-02 bisa memuat **seluruh** lampiran satu berkas (bisa puluhan/ratusan dokumen × beberapa lampiran) — kalau tiap lampiran baca penuh ke `Buffer` sebelum diserahkan ke `archiver`, memori bisa membengkak. Resolver baru hanya mengembalikan `logicalPath`; pembacaan fisik (streaming) terjadi di `document-zip.ts` (Step 1) satu per satu saat `archive.append`.

**How:** Tambah method ke `BerkasArsipFileAccessRepository` (interface + implementasi default) dan satu fungsi orkestrasi baru yang dipanggil endpoint RP-02 per item berkas (loop `items[]` dari service/read-model berkas yang sudah ada).

**Files affected:** `src/lib/archive/berkas-arsip-file-access.ts`.

**Dependencies:** Step 1.

---

### Step 4: Test unit fondasi

**What:** `tests/unit/export/document-zip.test.ts` (baru) — fokus ke `buildZipPlan` (murni, cepat, banyak kasus) plus **beberapa** test smoke untuk `streamDocumentZip` memakai direktori sementara nyata (pola `tests/unit/storage/*`/`tests/unit/arsiparis/*` yang sudah inject `root`/`deps`).

Kasus wajib (selaras `claude-plan-tdd.md`):
- Struktur folder benar untuk hierarki RP-05 (`<folder dokumen>/<file>`) dan RP-02 (`<nama berkas>/<folder dokumen>/<file>`).
- Prefiks `YYYY-MM-DD_` + potongan id 8-char pada nama folder dokumen WORKFLOW; prefiks `[Manual] ` + id 8-char pada folder dokumen MANUAL.
- Dua file dengan `namaAman` sama dalam satu folder → suffix `" (2)"`, `" (3)"`.
- File hilang (`ENOENT` saat `stat`) → dilewati, tercatat di `DAFTAR_ISI.txt`, ZIP tetap selesai (tidak `throw`).
- File > 250 MB (`stat.size` dipalsukan lewat mock/dep injeksi) → dilewati, tercatat, ZIP tetap selesai.
- Dokumen tanpa lampiran (entri dengan `files: []`) → tidak membuat folder, tercatat di `DAFTAR_ISI.txt`.
- > 500 entri → `buildZipPlan`/`streamDocumentZip` melempar error typed (bukan mulai streaming).
- Isi `DAFTAR_ISI.txt` memuat timestamp, identitas peminta+role, sumber, daftar masuk, daftar dilewati+alasan — **tidak** memuat `logicalPath`/path fisik/root/token mentah di baris manapun (assert negatif).

**Why:** RP-07 Peta File eksplisit minta `tests/unit/export/document-zip.test.ts`. Fase implementasi berikutnya (Section 02/03) bergantung modul ini sudah teruji sebelum dipakai konsumen — kalau bug ditemukan lebih lambat (di endpoint RP-02/05), lebih mahal ditelusuri karena bercampur otorisasi.

**How:** Test murni untuk `buildZipPlan` tidak butuh filesystem — cukup daftar entri buatan tangan. Test `streamDocumentZip` pakai `os.tmpdir()`/direktori scratch + file kecil asli, root di-inject lewat `deps.root`.

**Files affected:** `tests/unit/export/document-zip.test.ts` (baru).

**Dependencies:** Step 1.

---

### Step 5: Sinkron `AGENTS.md` — Storage And File Rules

**What:** Tambah butir baru ke bagian *Storage And File Rules* `AGENTS.md`: ekspor ZIP hanya boleh atas file yang sudah lolos otorisasi role peminta (bukan permukaan akses baru), nama folder/file di dalam ZIP mengikuti aturan sanitasi yang sama dengan preview/download, `DAFTAR_ISI.txt` **tidak boleh** memuat logical path/root fisik/token, batas 500 dokumen & skip >250MB didokumentasikan sebagai kebijakan resmi, `DIMUSNAHKAN` tetap memblokir ekspor item terkait (sama seperti preview/download). Juga tambah 3 route API baru ke daftar *API utama* Kepala Sub Bagian Umum / Pegawai di bagian relevan `AGENTS.md` (mengikuti pola baris 960-985 existing).

**Why:** Invariant "Update docs before behavior changes" (AGENTS.md butir 9) — dokumen harus disinkronkan **sebelum atau bersamaan** kode, bukan sesudahnya. Ini juga langkah pertama section-01 (preseden RP-01: "01 (docs) wajib pertama").

**How:** Edit prosa, ikuti gaya butir existing (deklaratif, bahasa Inggris untuk bagian *Rules*, konsisten dengan sekitarnya).

**Files affected:** `AGENTS.md`.

**Dependencies:** Tidak ada teknis, tapi secara urutan kerja dilakukan **di awal** section-01 (lihat Section Splitting).

---

### Step 6: RP-02 — endpoint `GET /api/arsiparis/berkas/$id/export-zip`

**What:** Route baru `src/routes/api/arsiparis/berkas/$id/export-zip.ts`. Alur:

1. `requireBerkasArsipApiSession(request)` (existing helper — sesi + role `KEPALA_SUB_BAGIAN_UMUM`, `ADMIN` bukan pengganti).
2. `parseBerkasIdParam(params.id)` (existing helper).
3. Muat berkas (folder + metadata `nomor_spm`, `klasifikasi_nama_snapshot`, `status_berkas`, `status_arsip`) + daftar `items[]` (pakai service/read-model yang sudah dipakai endpoint detail `$id.ts`, atau query langsung serupa).
4. Guard: `status_berkas !== 'CLOSED'` → `409` ("Berkas belum ditutup, tidak bisa diekspor"). `status_arsip === 'DIMUSNAHKAN'` → `410` ("Data file sudah dimusnahkan") — konsisten pesan existing.
5. Guard jumlah: `items.length > 500` → `413` + pesan "Berkas ini memiliki N dokumen. Maksimal 500 per ekspor." (kasus ekstrem, tapi pengaman tetap ditegakkan sesuai RP-07 secara seragam).
6. Untuk tiap item: panggil resolver Step 3 (`resolveBerkasArsipItemAttachments`) → dapat daftar `{ logicalPath, namaAman }[]`. Bangun `folderPath` = `buildBerkasParentFolderName({ nomorSpm, klasifikasiNama }) + '/' + (item.source_type === 'WORKFLOW' ? buildWorkflowDocumentFolderName(...) : buildManualDocumentFolderName(...))`. Item tanpa attachment (`attachments.length === 0`) → entri `files: []` (dilewati otomatis oleh `buildZipPlan`, tercatat di manifest).
7. Panggil `streamDocumentZip(entries, { requesterLabel, requesterRole: 'KEPALA_SUB_BAGIAN_UMUM', sourceDescription: \`Nomor SPM \${nomorSpm}\`, filename: ... })` → kembalikan `Response`.
8. Log aplikasi (`console.info`/setara) mencatat `berkasId`, aktor, jumlah dokumen — **tanpa** menulis ke `berkas_arsip_activity` (keputusan interview #10).

**Why:** Satu tombol → satu `.zip` untuk keperluan tahunan KSBU (RP-02 goal utama). `GET` dipilih (bukan `POST`) karena tidak ada body — konsisten pola download/preview existing yang juga `GET`; tidak butuh `requireSameOrigin` untuk `GET` menurut kebijakan Same-Origin AGENTS.md (hanya "unsafe methods"), tapi tetap wajib sesi+role.

**How:** Ikuti pola `close.ts`/`items/.../download/$lampiranIndex.ts` untuk struktur handler; ikuti pola `berkasArsipErrorResponse`/`safeBerkasDto` untuk error mapping bila memakai service existing.

**Files affected:** `src/routes/api/arsiparis/berkas/$id/export-zip.ts` (baru).

**Dependencies:** Step 1, Step 3.

---

### Step 7: RP-02 — tombol + dialog konfirmasi

**What:** Tambah tombol "Ekspor ZIP" di `src/routes/arsiparis/berkas/$id.tsx` (header aksi, di samping tombol lifecycle existing). Klik → dialog konfirmasi kecil (komponen baru atau state lokal, mengikuti pola visual `CloseBerkasDialog.tsx`) menampilkan: jumlah dokumen dalam berkas, ringkasan (Nomor SPM + Klasifikasi), tombol `Batal` / `Ekspor Sekarang`. Konfirmasi → navigasi/`window.location` ke endpoint `GET` (unduhan langsung lewat browser, tidak perlu `fetch`+`blob` karena tidak ada body request) atau `<a href=... download>`; tampilkan state "Menyiapkan unduhan…" sebentar sebelum browser mengambil alih. Jika berkas `DIMUSNAHKAN` atau belum `CLOSED`, tombol disembunyikan/disabled dengan tooltip alasan (cermin guard server Step 6 — supaya UI tidak menjanjikan aksi yang pasti gagal server).

**Why:** RP-07 keputusan #8 mewajibkan dialog konfirmasi sebelum ekspor jalan. Tombol di halaman detail berkas (bukan hanya baris list) karena itu tempat metadata berkas (Nomor SPM, jumlah dokumen) paling lengkap ditampilkan.

**How:** Tanpa kode lengkap — pola: `Dialog`/`AlertDialog` primitif yang sudah dipakai di codebase (Base UI, lihat `select.tsx`/`CloseBerkasDialog.tsx` untuk pola), state `open` lokal, tidak perlu state management global.

**Files affected:** `src/routes/arsiparis/berkas/$id.tsx`. *(Opsional, tidak wajib Definition of Done: tombol ringkas juga di baris `/arsiparis/berkas/tertutup` — bisa jadi iterasi lanjutan bila diminta terpisah.)*

**Dependencies:** Step 6.

---

### Step 8: RP-05 — endpoint `POST /api/laporan/saya.export-zip`

**What:** Route baru `src/routes/api/laporan/saya.export-zip.ts` (konvensi penamaan file mengikuti `saya.ts` existing di direktori yang sama — flat-file dot-segment, bukan folder `$id`). Alur:

1. `requireSameOrigin(request)` (wajib — `POST`).
2. Sesi lokal (`getLocalServerSession`) — wajib login, tidak butuh role spesifik (semua role punya laporan sendiri lewat `pegawai`, tapi endpoint ini dipakai UI `/pegawai/laporan/saya` yang hanya field pegawai — cek juga bila perlu dibatasi role `PEGAWAI` secara eksplisit atau cukup kepemilikan dokumen, sejalan `GET /api/laporan/saya` existing yang **tidak** mengecek role, hanya `createdBy`).
3. Body divalidasi Zod (`src/lib/schemas/export.ts`, baru): `{ dokumen_ids: string[] }`, tiap elemen `z.uuid()`, panjang array `min(1)`. **Tidak** dipasang `max(500)` di level Zod — batas 500 punya pesan spesifik RP-07 ("Filter menghasilkan N dokumen…") yang butuh tahu `N` sebelum ditolak, sementara Zod yang gagal di `max()` hanya memberi pesan generik. Sebagai gantinya Zod pasang `max()` jauh lebih longgar (mis. `2000`) murni sebagai pengaman anti-abuse payload raksasa, bukan aturan bisnis.
4. **Guard 500 (business rule) segera setelah parse Zod sukses, sebelum query DB apa pun**: `if (parsed.data.dokumen_ids.length > 500) return 413` dengan pesan "Filter menghasilkan N dokumen. Maksimal 500 per ekspor — persempit periode atau kegiatan." Ini `array.length` murni (instan, tanpa IO) — cocok dengan RP-07 keputusan #3 ("dicek server sebelum streaming dimulai, instan, tanpa IO"). Karena guard ini jalan sebelum query, hasil query di langkah berikutnya **otomatis** tidak pernah melebihi 500 (query hanya bisa mempersempit, bukan memperbesar, himpunan id yang diminta) — tidak perlu guard jumlah kedua setelah query.
5. Query ulang dokumen: `WHERE id IN (dokumen_ids) AND created_by = session.user.id AND status IN ('COMPLETED', 'TERSIMPAN')` — **abaikan diam-diam** id yang tidak lolos (jangan bocorkan keberadaan dokumen orang lain lewat pesan error berbeda). Duplikat id di `dokumen_ids` juga otomatis menyatu jadi satu baris lewat `IN (...)`.
6. Untuk tiap dokumen hasil query: untuk tiap index di `lampiran_urls`, panggil resolver Step 2 (dengan memoization per `documentId` seperti dijelaskan di Step 2) → `logicalPath`; `namaAman` = `buildFormalFilename(dok, lamp)`. `folderPath` = `buildWorkflowDocumentFolderName({ id: dok.id, judul: dok.judul, tanggal: dok.tanggal })`. Dokumen tanpa lampiran valid → `files: []` (dilewati otomatis, tercatat).
7. Panggil `streamDocumentZip(entries, { requesterLabel, requesterRole: 'PEGAWAI', sourceDescription: 'Laporan Saya (filter aktif klien)', filename: ... })`. Nama file ZIP itu sendiri (bukan isi di dalamnya): `Laporan_Saya_<username atau user id8>_<YYYY-MM-DD saat diunduh>.zip`, disanitasi lewat helper yang sama.
8. Log aplikasi (tanpa DB) mencatat aktor + jumlah dokumen.

**Why:** RP-05 goal — pegawai mengunduh seluruh lampiran dokumen yang lolos filter aktif, tanpa satu-satu. `POST` dipilih karena body berisi daftar id (berpotensi banyak) — tidak cocok query string `GET`. Endpoint **wajib** query ulang by `created_by`, bukan percaya `dokumen_ids` dari klien (Risiko RP-05: "pegawai menyisipkan id dokumen orang lain").

**How:** Struktur query mirip `GET /api/laporan/saya` (baris `and(eq(createdBy,...), inArray(status,...))`) ditambah `inArray(id, dokumen_ids)`.

**Files affected:** `src/routes/api/laporan/saya.export-zip.ts` (baru), `src/lib/schemas/export.ts` (baru).

**Dependencies:** Step 1, Step 2.

---

### Step 9: RP-05 — endpoint `POST /api/laporan/kegiatan.export-zip`

**What:** Route baru `src/routes/api/laporan/kegiatan.export-zip.ts`, struktur identik Step 8 (termasuk urutan guard 500 sebelum query — lihat Step 8 poin 4) tapi otorisasi lewat `ketuaTimAssignments`: muat `kegiatanIds` yang dipimpin `session.user.id` (pola persis `GET /api/laporan/kegiatan`), lalu query dokumen `WHERE id IN (dokumen_ids) AND kegiatan_jenis_id IN (kegiatanIds) AND status IN (...)`. Sisanya (resolver, `streamDocumentZip`, log) sama seperti Step 8, memakai skema Zod yang sama (`src/lib/schemas/export.ts`). Nama file ZIP: `Laporan_Kegiatan_<nama kegiatan disanitasi>_<YYYY-MM-DD>.zip`.

**Why:** Ketua Tim butuh ekspor dokumen kegiatan yang ia pimpin (bisa dokumen milik anggota tim lain, bukan hanya miliknya sendiri) — beda authorization boundary dari Step 8 (kepemilikan langsung vs kepemimpinan kegiatan), karena itu endpoint terpisah, bukan parameter tambahan di endpoint yang sama (menjaga setiap endpoint punya satu aturan otorisasi yang jelas & mudah diaudit — sejalan pola dua endpoint API terpisah yang sudah ada, `laporan/saya.ts` vs `laporan/kegiatan.ts`).

**How:** Reuse skema Zod Step 8. Reuse helper resolver/`streamDocumentZip` yang sama.

**Files affected:** `src/routes/api/laporan/kegiatan.export-zip.ts` (baru).

**Dependencies:** Step 1, Step 2, Step 8 (skema Zod bersama).

---

### Step 10: RP-05 — tombol + dialog konfirmasi (dua halaman)

**What:**
- `src/routes/pegawai/laporan/saya.tsx`: tombol "Ekspor Semua File (ZIP)" di header seksi hasil (dekat teks "N Dokumen Ditemukan"), aktif atas `filtered` (array `useMemo` yang sudah ada). Klik → dialog: jumlah dokumen di `filtered`, catatan "mengikuti filter aktif", tombol `Batal`/`Ekspor Sekarang`. Konfirmasi → `POST` `fetch` dengan body `{ dokumen_ids: filtered.map(d => d.id) }`, terima `Response` blob, trigger unduhan via `URL.createObjectURL` + `<a download>` sementara (dibuang setelah klik, pola yang sama seperti `downloadRoleFile` di `file-helpers.ts`). State loading selama fetch berlangsung (tombol disabled + spinner/teks "Menyiapkan ZIP…"). Jika `filtered.length > 500`: dialog otomatis jadi pesan "Filter menghasilkan N dokumen. Maksimal 500 per ekspor — persempit periode atau kegiatan." tanpa tombol lanjut (RP-07 keputusan #8, "jika jumlah > 500").
- `src/routes/pegawai/laporan/kegiatan.tsx`: tombol serupa di panel detail kegiatan terpilih, aktif atas `selectedDocuments` (bukan seluruh `kegiatanRows`) — karena target ekspor adalah dokumen dalam satu kegiatan yang sedang dilihat, bukan lintas-kegiatan sekaligus. Sisanya (dialog, fetch, unduhan, batas 500) identik pola Step 10a.

**Why:** RP-05 goal eksplisit — tombol "aktif mengikuti baris yang sedang terlihat/terfilter (`filtered`)". Memakai `fetch`+`blob` (bukan navigasi langsung seperti RP-02) karena endpoint `POST` butuh body (daftar id) yang tidak bisa dikirim lewat navigasi URL biasa.

**How:** Pola unduhan blob mengikuti helper existing (`downloadRoleFile` di `file-helpers.ts`, meski itu untuk `signedUrl`) — tambah helper baru mis. `downloadZipBlob(response, filename)` di modul yang sama atau lokal ke tiap halaman.

**Files affected:** `src/routes/pegawai/laporan/saya.tsx`, `src/routes/pegawai/laporan/kegiatan.tsx`.

**Dependencies:** Step 8, Step 9.

---

### Step 11: Route constants + route generation

**What:** Tambah 3 path baru ke `src/lib/constants/routes.ts` bila dipakai sebagai referensi bersama (mis. bagian `API` grouping baru atau string literal di pemanggil `apiFetch`/`fetch` langsung — ikuti pola existing: route API tidak semuanya masuk `ROUTES` const, cek dulu apakah `laporan/saya`/`laporan/kegiatan` API path sudah dirujuk lewat constant atau string literal di halaman terkait sebelum menambah entri baru yang tidak konsisten dengan pola sekitarnya). Jalankan route generation resmi (`pnpm dev` sesaat atau `pnpm build`) supaya `src/routeTree.gen.ts` memuat 3 route API baru — **jangan** hand-edit file itu.

**Why:** Behavioral Rule 5 AGENTS.md ("No magic strings" untuk route path bersama) + larangan hand-edit `routeTree.gen.ts` kecuali fase mengizinkan — plan ini eksplisit mengizinkan untuk 3 route API baru ini saja.

**How:** Jalankan generator resmi sekali per section (section-02 meregenerasi setelah route `export-zip.ts` RP-02 dibuat; section-03 meregenerasi setelah 2 route RP-05 dibuat) — lihat catatan koordinasi paralel di *Integration Points*.

**Files affected:** `src/lib/constants/routes.ts` (bila relevan), `src/routeTree.gen.ts` (regenerasi, bukan edit manual).

**Dependencies:** Step 6 (untuk regenerasi section-02), Step 8+9 (untuk regenerasi section-03).

---

### Step 12: Test otorisasi & integrasi per endpoint

**What:** Test unit untuk tiap endpoint baru:
- RP-02: berkas `OPEN` → ditolak; `DIMUSNAHKAN` → `410`; role bukan KSBU → `403`; tanpa sesi → `401`; berkas valid → `Response` dengan `Content-Type: application/zip` + header `Content-Disposition` mengandung nama berkas yang disanitasi.
- RP-05 (saya & kegiatan): dokumen id milik user lain disisipkan → diabaikan diam-diam (tidak muncul di hasil, tidak error khusus); `dokumen_ids` kosong → `400` (Zod `min(1)`); same-origin gagal → ditolak; `dokumen_ids` berisi 501 id valid (walau mayoritas nanti bakal ditolak re-authz) → `413` **sebelum** query DB dijalankan sama sekali (assert lewat spy/mock DB call count = 0).

**Why:** Bagian tersulit & paling berisiko keamanan dari fitur ini adalah otorisasi ulang di server (Risiko RP-05 eksplisit: "pegawai menyisipkan id dokumen orang lain") — wajib punya test eksplisit, bukan hanya diverifikasi manual.

**How:** Mock `getLocalServerSession`/DB seperti pola `tests/unit/arsiparis/*`, `tests/unit/laporan/*` existing.

**Files affected:** `tests/unit/arsiparis/berkas-export-zip.test.ts` (baru), `tests/unit/laporan/export-zip.test.ts` (baru, mencakup dua endpoint).

**Dependencies:** Step 6, Step 8, Step 9.

---

## Edge Cases & Error Handling

| Kasus | Penanganan |
|---|---|
| Berkas/dokumen tanpa lampiran sama sekali | Dilewati (tidak ada folder kosong di ZIP), dicatat di `DAFTAR_ISI.txt` bagian "dilewati". ZIP tetap dibuat meski **semua** entri kosong — hasil ZIP hanya berisi `DAFTAR_ISI.txt`. |
| File fisik hilang (`ENOENT`) atau tak terbaca (`ENOTDIR`, permission) | Dilewati, dicatat dengan alasan spesifik. Tidak melempar, tidak menghentikan ZIP. |
| File tunggal > 250 MB | Dilewati sebelum `createReadStream` (dicek lewat `fs.stat` size), dicatat. |
| > 500 dokumen (RP-05: `dokumen_ids.length` mentah dari klien, dicek sebelum query DB; RP-02: `items.length` berkas) | `413` sebelum streaming **dan** sebelum query re-authz — **tidak** ada IO sama sekali di jalur ini, hanya panjang array/`COUNT`. |
| `nomor_spm` `null`/kosong (RP-02) | Fallback nama folder induk `"[Tanpa Nomor SPM] - <klasifikasi>"` (keputusan interview #11). |
| Dua file dalam satu folder dokumen menghasilkan `namaAman` sama | Suffix `" (2)"`, `" (3)"`, dst — dihitung di `buildZipPlan`. |
| Berkas `status_arsip = DIMUSNAHKAN` (RP-02) | `410 Data file sudah dimusnahkan` — file fisik memang sudah dihapus (Phase 13Y.2), konsisten pesan existing preview/download. |
| Berkas belum `CLOSED` (RP-02) | `409` — ekspor hanya untuk berkas final. |
| Dokumen laporan tak lagi `COMPLETED`/`TERSIMPAN` saat ekspor (RP-05, race kecil antara load halaman dan klik ekspor) | Diabaikan diam-diam oleh query ulang server (sama seperti id milik orang lain — tidak dibedakan di response, cukup tidak masuk hasil). |
| Klien mengirim `dokumen_ids` kosong (RP-05) | `400` dari Zod (`min(1)`) sebelum query DB. |
| Same-origin gagal (RP-05, `POST`) | Ditolak oleh `requireSameOrigin` sebelum sesi/otorisasi diperiksa (pola existing `close.ts`). |
| Koneksi klien terputus di tengah unduhan | Server tidak punya mekanisme resume; `DAFTAR_ISI.txt` (entri pertama dalam ZIP) jadi penanda kelengkapan yang diharapkan bagi penerima kalaupun file `.zip` hasil unduhan korup/tidak lengkap. |
| Nama berkas/dokumen berisi karakter tak aman (mis. emoji, kontrol karakter, path-like) | `sanitizeStoragePathSegment` (existing) menangani — sudah teruji di modul lain, dipakai ulang, tidak ditulis ulang. |

## Integration Points

- **`document-file-access.ts`** (RP-05) dan **`berkas-arsip-file-access.ts`** (RP-02) tidak berubah perilaku untuk konsumen existing (token preview/download) — hanya menambah fungsi baru yang dipanggil path baru. Refactor internal (Step 2/3) harus **tidak mengubah** hasil `createDocumentLampiranAccessUrlResponse`/`createBerkasArsipItemAttachmentFileResponse` untuk memastikan tak ada regresi ke fitur preview/download yang sudah dipakai user.
- **`document-zip.ts`** adalah satu-satunya titik yang tahu format `DAFTAR_ISI.txt` dan aturan skip/batas — RP-02 dan RP-05 **wajib** memanggilnya, bukan menulis ulang logika serupa (RP-07 tujuan eksplisit: hindari dua implementasi ZIP berbeda).
- **`routeTree.gen.ts` adalah file bersama yang di-generate** — kalau section-02 dan section-03 benar-benar dikerjakan paralel (dua sesi/engineer berbeda), regenerasi kedua section berpotensi "tabrakan" di file yang sama. Mitigasi: siapa pun yang selesai lebih dulu regenerasi & commit; yang kedua **regenerasi ulang** dari state terbaru (bukan hand-merge diff `routeTree.gen.ts`) sebelum commit miliknya. Ini bukan konflik logika, hanya urutan regenerasi — aman selama tidak ada yang hand-edit file itu.
- **`AGENTS.md`** — Step 5 (bagian dari section-01) harus selesai sebelum section-02/03 dianggap "siap direview", karena keduanya mengandalkan kebijakan Storage/File Rules yang baru didokumentasikan di sana sebagai referensi perilaku yang benar.
- **`buildFormalFilename`** (`file-helpers.ts`) dipakai ulang persis seperti dipakai preview/download dokumen lepas — **tidak** ditulis ulang untuk RP-05, memastikan nama file di dalam ZIP konsisten dengan nama file kalau diunduh satu-satu.
- **`resolveWorkflowAttachmentReference`** (`berkas-arsip-attachment-names.ts`) dipakai ulang persis seperti dipakai download item berkas — **tidak** ditulis ulang untuk RP-02.

## Migration / Compatibility Notes

- **Tidak ada migrasi database baru** untuk seluruh keluarga fitur ini (RP-07 + RP-02 + RP-05). Keputusan interview menutup kedua kandidat migrasi (`terakhir_diekspor_at`, event `BERKAS_DIEKSPOR`) dengan memilih opsi tanpa migrasi.
- `src/db/schema/**` dan `drizzle/*.sql` **tidak berubah** — bisa dipakai sebagai salah satu kriteria Definition of Done (cermin pola RP-01: "Tidak ada migrasi baru; `src/db/schema/**` & `drizzle/*.sql` tak berubah").
- Tidak ada breaking change ke endpoint/kontrak yang sudah ada — semua perubahan bersifat aditif (route baru, fungsi baru, tombol baru). Endpoint `GET /api/laporan/saya`, `GET /api/laporan/kegiatan`, `GET /api/arsiparis/berkas/$id` tetap seperti semula.
- `package.json`/`pnpm-lock.yaml` berubah (Step 0) — ini **satu-satunya** perubahan non-kode-aplikasi, terisolasi di commit tersendiri.

## Open Questions

Tidak ada — semua keputusan RP-02 yang sebelumnya terbuka sudah ditutup di `claude-interview.md`. RP-05 dan RP-07 final sejak sebelum plan ini ditulis.
