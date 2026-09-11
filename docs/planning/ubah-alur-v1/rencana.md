# Rencana Implementasi — Ubah Alur Bisnis v1 (branch `workflow/ubah-alur-v1`)

## Context

Aplikasi DMS BPS (TanStack Start + Drizzle + PostgreSQL lokal). Serangkaian perubahan alur yang
**menyatukan seluruh hierarki master data menjadi satu rantai terhubung**, dari Fungsi sampai
Kelengkapan Dokumen, plus penyesuaian form Ajukan Dokumen (Material & Non-Material) dan Penambahan
Dokumen Kasubag. Refactor tema/warna/token ditangani branch lain — jangan disentuh.

### Rantai hierarki TARGET (satu jalur linear, semuanya terhubung)

```
Fungsi
 └ Kegiatan                (child: fungsi_id)                    [sudah ada]
    └ Komponen             (child: kegiatan_id)                  [TABEL BARU]
       └ Jenis Permintaan  (child: komponen_id)                  [UBAH: tadinya tabel global/root]
          └ Kategori Permintaan  (child: jenis_permintaan_id)    [sudah ada, tak berubah]
             └ Detail Permintaan (child: kategori_permintaan_id) [sudah ada, tak berubah]
                └ Kelengkapan Dokumen                            [UBAH: tambah komponen_id ke rantai opsional]
```

Perubahan inti dari instruksi lanjutan pemilik proyek:
> "Jenis Permintaan itu turunan dari Komponen, Kategori turunan dari Jenis Permintaan, Detail turunan
> dari Kategori. Semuanya saling terhubung, dari awal (Fungsi) sampai Kelengkapan Dokumen."

- `master_jenis_permintaan` **berhenti menjadi tabel global** — mendapat kolom `komponen_id` (FK →
  `master_komponen`). Urutan internal `Jenis → Kategori → Detail` **tetap** (hanya Jenis yang dapat induk baru).
- `master_kelengkapan_dokumen` melengkapi rantai: kolom opsional `komponen_id` masuk di antara
  `kegiatan_id` dan `jenis_permintaan_id` (mengikuti pola kolom opsional jenis/kategori/detail yang sudah ada).

### Empat perubahan alur di atas skema baru

1. **Master data baru "Komponen"** — anak `master_kegiatan` (1:N), CRUD admin penuh meniru pola
   `master_kategori_permintaan`. Tabel & menu `master_jenis_dokumen` **tetap ada** (hanya berhenti dipakai di alur non-material).
2. **Ajukan Dokumen — Material**: setelah Kegiatan pilih **Komponen** (wajib) → lalu **Jenis Permintaan**
   yang di-fetch per-komponen → Kategori → Detail. `dokumen_transaksi.komponen_id` disimpan.
3. **Ajukan Dokumen — Non-Material**: buang pemilihan Jenis Dokumen; ganti input teks bebas
   **"Nama Dokumen"** setelah Kegiatan (jadi `leafName` judul).
4. **Penambahan Dokumen Kasubag** (`KEPALA_SUB_BAGIAN_UMUM`): buang total konsep `manual_arsip_category`;
   alur baru **Fungsi → Kegiatan → Komponen → Nama Dokumen** (teks bebas, kolom `nama` dipertahankan).
   Manual arsip **tidak** memakai Jenis/Kategori/Detail Permintaan.

### Keputusan yang sudah dikonfirmasi (Q&A)

| Topik | Keputusan |
|---|---|
| Data lama saat migrasi | **Wipe + reseed data transaksi & master-referensi lokal.** Migrasi `0012` `TRUNCATE ... RESTART IDENTITY CASCADE` untuk: seluruh tabel transaksi (dokumen_transaksi, log_aktivitas, manual_arsip + attachment, berkas_arsip + item/activity) **dan** tabel master referensi yang dapat kolom FK baru NOT NULL / berubah induk (`master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_kelengkapan_dokumen`). `master_fungsi`, `master_kegiatan`, `master_jenis_dokumen`, `ketua_tim_assignments`, `master_klasifikasi_arsip`, auth **tidak** dihapus. Reseed via `pnpm db:local:seed`. |
| Hapus `master_komponen` | **Ikuti pola lama: soft-delete saja** (`is_active = false`), tanpa cek "sedang dipakai". FK `onDelete: restrict` di DB sebagai jaring pengaman. |
| "Nama Dokumen" non-material | **Kolom baru `dokumen_transaksi.nama_dokumen` (text, nullable).** Judul non-material = `{nama_dokumen} {tahun} {displayName}`. Field **"Keterangan Detail" non-material jadi opsional** (tak lagi wajib). |
| Komponen & Kelengkapan Dokumen | **Ya — Komponen masuk rantai kelengkapan** (konsekuensi dari "terhubung sampai kelengkapan dokumen"): `master_kelengkapan_dokumen.komponen_id` (nullable), dan tier komponen di `selectRequiredKelengkapan` + `KelengkapanChecklist.matchesCurrentChain` + halaman admin Kelengkapan + `validateKelengkapanChain`. |

### Tension dengan constraint awal

Instruksi awal berbunyi "Hierarki Jenis Permintaan → Kategori → Detail TIDAK BOLEH diubah". Instruksi
lanjutan **secara eksplisit meminta** Jenis Permintaan menjadi anak Komponen. Yang dipertahankan:
urutan & FK internal `Jenis → Kategori → Detail` tidak berubah; `master_jenis_dokumen` (tabel + menu admin) tetap.
Yang berubah: `master_jenis_permintaan` mendapat induk `komponen_id`.

---

## Cara eksekusi — per fase (batch per lapisan)

Dikerjakan **per fase**, bukan 20 langkah sekaligus dan bukan satu-satu langkah kecil. Tiap fase =
semua file terkait sekaligus supaya kode meng-compile di akhir fase. Berhenti & lapor di tiap
checkpoint; commit per fase (dijalankan pemilik proyek — lihat [[feedback_no_commit_no_test_run]]).

| Fase | Langkah plan | Isi | Checkpoint pemilik proyek |
|---|---|---|---|
| **A** | 1–6, 19 | Skema Drizzle (`master_komponen` + perubahan `jenis_permintaan`/`kelengkapan`/`dokumen_transaksi`/`manual_arsip`) + `drizzle/0012_*.sql` + `_journal.json` + edit seed | **Jalankan** `pnpm db:local:migrate` lalu `pnpm db:local:seed`; konfirmasi sukses sebelum Fase B |
| **B** | 7 | Shared types + Zod schema | — (kecil, bisa digabung C) |
| **C** | 8, 9, + bagian API langkah 12 & 17 | API: `master-komponen(.$id)`, `master-jenis(.$id)`, `master-kelengkapan(.$id)`, `dokumen.$id`, service `manual-arsip.ts` | opsional `pnpm tsc --noEmit` / `pnpm test` |
| **D** | 10 | Write-path lib (`src/lib/dokumen/*`) | — |
| **E** | 11, 13, 14 | Form UI: Ajukan Dokumen, 4 halaman detail, halaman admin (Komponen/Jenis/Kelengkapan) | — |
| **F** | 15, 16, 18 | Read surfaces: `HierarchicalFilter`, laporan API/UI, penamaan arsip non-material | — |
| **G** | 17 (UI + service) | Penambahan Dokumen Kasubag (`penambahan-arsip.tsx` + `manual-arsip.ts` + read model) | — |
| **H** | 20 / bagian 6 | Update test | **Jalankan** `pnpm test` + `pnpm build` + walkthrough app (checklist §5) |

Status per 2026-09-11: **Fase A–H selesai (kode)**. Migrasi + seed sudah dijalankan pemilik proyek dan
sukses. Tinggal `pnpm test` + `pnpm build` + walkthrough app (checklist §5) oleh pemilik proyek.

Detail yang sudah dikerjakan:
- Fase A: skema Drizzle + `drizzle/0012_workflow_ubah_alur_v1_foundation.sql` + seed. Migrasi & seed **sudah dijalankan** (sukses).
- Fase B: `src/lib/master-data/shared.ts` (`KomponenRow`, `JenisRow`+komponen, `KelengkapanRow`+komponen), `src/lib/schemas/{master-data,dokumen,manual-arsip}.ts`.
- Fase C: API `master-komponen(.$id)` (baru), `master-jenis(.$id)` (komponen-scoped), `master-kelengkapan(.$id)` (tier komponen), `dokumen.$id.ts` (GET join komponen + PATCH namaDokumen/judul recompute), `api/arsiparis/dokumen.$id.ts` (komponen), service `src/lib/manual-arsip.ts` (category dihapus total, ganti fungsi/kegiatan/komponen — lihat `resolveManualArsipHierarchy`), hapus `api/arsiparis/manual-arsip/categories.ts`.
- Fase D: `src/lib/dokumen/{local-submit-write-bridge,local-submit-repository,local-submit-drizzle-adapter}.ts` (komponen + namaDokumen end-to-end di write path), `api/dokumen/submit.ts` (panggil `validateWorkflowChainForCharacteristic`).
- Fase E: `StepKomponen.tsx` (baru), `StepKarakteristik.tsx` (baru — toggle Material/Non-Material diekstrak sendiri), `StepNamaDokumen.tsx` (baru — input Nama Dokumen Non-Material diekstrak sendiri), `StepJenisPermintaan.tsx` (disederhanakan jadi khusus select Jenis Permintaan Material), `StepUploadLampiran.tsx`, `StepReview.tsx`/`ReviewSummary.tsx`, `KelengkapanChecklist.tsx` (tier komponen), `aju.tsx` (state/handler/gate/payload lengkap + `characteristicChosen` state untuk progressive disclosure: setelah Kegiatan hanya toggle Material/Non-Material yang tampil; field berikutnya baru muncul satu-satu sesuai pilihan — lihat catatan RP-04 di kode: `StepKomponen`/`StepNamaDokumen` selalu ter-mount begitu `kegiatanId` ada, hanya `hidden` via CSS berdasar `characteristicChosen`/`isNonMaterial`, tidak pernah di-unmount paksa, supaya popup Select tak pernah rusak), `pegawai/dokumen/$id/edit.tsx` (Nama Dokumen wajib + Keterangan opsional), `revisi.tsx` (baris Komponen + tier kelengkapan), 4 halaman detail (pegawai/ppk/bendahara/arsiparis) — paritas Komponen + label Nama Dokumen, admin pages Komponen (baru)/Jenis (selector Komponen)/Kelengkapan (filter tier Komponen), nav + routes.
- **Perbaikan UX (2026-09-11, setelah verifikasi manual pemilik proyek):** alur Ajukan Dokumen semula menampilkan Komponen + toggle + Jenis Permintaan sekaligus setelah Kegiatan dipilih. Diperbaiki jadi progressive disclosure murni: Kegiatan → (hanya) toggle Material/Non-Material → (Material: Komponen saja) atau (Non-Material: Nama Dokumen saja) → Jenis Permintaan (setelah Komponen dipilih) → Kategori → Detail, tetap satu-satu sesuai pola Kategori/Detail yang sudah ada. Diimplementasikan tanpa mengorbankan proteksi RP-04. Dikonfirmasi pemilik proyek aman ("aman lanjut ke fase selanjutnya").
- Fase F: `HierarchicalFilter.tsx` (level Komponen: `KomponenOption`, fetch cascading, handler, Select RP-04-safe), `pegawai/laporan/{saya,kegiatan}.tsx` (filter/haystack/countActiveFilters + komponenId, `kegiatanId` prop dialirkan ke toolbar/advanced-filter), `api/laporan/{saya,kegiatan}(.export-zip).ts` (join `masterKomponen`, `leaf_node_nama` non-material dari `nama_dokumen`, tangga leaf Material +komponen), penamaan arsip non-material: `storage.ts`/`file-helpers.ts` (`buildDokumenFilename`/`buildFormalFilename` leaf non-material = `nama_dokumen`, tangga Material +`komponen_nama`), `workflow-nama-arsip.ts` (`jenisDokumenNama`→`namaDokumen`, dikonfirmasi tanpa pemanggil app selain test-nya sendiri), `berkas-arsip-attachment-names.ts` (predikat non-material pakai `nama_dokumen` + fallback `komponen_nama`).
- Fase G: `manual-arsip-attachment-filename.ts` (`category_nama`→`komponen_nama`), `berkas-arsip-read-model.ts` (join ganda `masterKomponen` via `alias()` untuk workflow & manual, tipe row diperbarui), `berkas-arsip-csv.ts` (label "Kategori:"→"Komponen:"), `arsiparis/berkas/$id.tsx` (label "Komponen"), `berkas-arsip-file-access.ts` (join `masterKomponen` di kedua sisi workflow & manual, `categoryNama`→`komponenNama`), `penambahan-arsip.tsx` (2604 baris, overhaul total: tipe (`ManualArsipCategory`→`ManualArsipNamedRef` dsb), state (`categories`→`fungsis`/`kegiatans`/`komponens` dgn cascading fetch + reset berjenjang), Step 1 render (3 `<Select>` Fungsi→Kegiatan→Komponen, `disabled` di parent `Select` bukan `SelectTrigger` — pola dari `laporan/kegiatan.tsx`), `ManualCreateReview` (finalName `{nama} - {komponen} - {tahun}`, baris Fungsi/Kegiatan/Komponen), `validateForm`/`validateCurrentStep`/`handleFinalSubmit` (field baru), tombol Lanjutkan/Simpan `disabled` (`fungsis.length===0`)); plus perbaikan bug drizzle di `listManualArsipRecords` (`src/lib/manual-arsip.ts`) — reassignment `builder = builder.where(...)` butuh `.$dynamic()` setelah query dapat leftJoin tambahan (Fungsi/Kegiatan/Komponen), tanpa ini `tsc` gagal di `Property 'where' is missing`.
- Fase F & G: `npx tsc --noEmit` disaring `tests/|supabase/functions` — 27 error tersisa, semua diverifikasi identik dengan baseline pra-ada (dicek via `git diff`/stash per file: `AttachmentEditor.tsx`, Buffer/BodyInit di 3 file `archive`/`manual-arsip.ts`, `phase15-berkas-activity-dev-reset-analysis.ts`, `submit-runtime-orchestrator.ts`, `guards.ts`, `file-access-token.ts`, TanStack Router `event` di route files, `laporan/*.export-zip.ts` Date-vs-string, `dokumen/$id.nominal.ts` status_arsip, `client-id.ts`, `manual-arsip/$id/attachments.ts`, `pegawai/laporan/kegiatan.tsx` 2 baris) — **tidak ada regresi baru**.

- Fase H: semua file test wajib di bagian 6 diperbarui — `manual-arsip-route.test.ts` (rewrite besar:
  category dihapus total → fixture `fungsiRow()`/`kegiatanRow()`/`komponenRow()`, `queueSelectResults`
  untuk create/update flow jadi 4-5 item bukan 2-3 karena `resolveManualArsipHierarchy` melakukan 3
  `db.select` terpisah — bagian dalam transaksi/`queueManualArchiveCreateTransaction` TIDAK berubah,
  hanya validasi di luar transaksi yang bertambah; test "category list" dihapus, diganti 1 test yang
  menegaskan `api/arsiparis/manual-arsip/categories.ts` sudah tidak ada), `local-submit-{repository,
  write-bridge,drizzle-adapter}.test.ts` (`komponenId`/`namaDokumen` di payload & row, `selectKomponenById`
  di adapter/repository fake, tambah kasus tier Komponen di `resolveLocalSubmitLeafName`),
  `ajukan-dokumen-parity-source.test.ts` (source guard disesuaikan ke `StepKarakteristik`/`StepKomponen`/
  `StepNamaDokumen` yang baru, payload submit `namaDokumen`/`komponenId` bukan `jenisDokumenId`),
  `submit-route-parity.test.ts` (fixture `komponenId`/`namaDokumen` + test baru untuk 400 saat field
  wajib per karakteristik kosong), `kelengkapan-duplicate-validation.test.ts` dicek aman tanpa perubahan
  (validasi komponenId ada di route bukan di zod schema), `workflow-nama-arsip.test.ts`,
  `berkas-arsip-{attachment-names,read-model,csv,file-access,file-access-export}.test.ts`,
  `berkas-export-zip.test.ts` (semua: `jenis_dokumen_nama`/`category_nama`/`category_name` →
  `nama_dokumen`/`komponen_nama`/`komponen_name`), `hierarchical-filter-select-mount.test.ts` (tambah
  level Komponen). File lain di bagian 6 (`cross-role-*`, `revisi-dokumen-parity-source`,
  `penambahan-dokumen-upload-source`, `berkas-arsip-schema`, `kinerja-route`, `export-zip`,
  `document-zip`, `roles-navigation`, `seed-users`, `role-*`) dicek satu-satu — tidak menyentuh
  field yang berubah atau error-nya sudah pra-ada di `main` — sengaja **tidak diubah**.
  Plus perbaikan bug: `Phase15BerkasActivityDevResetPreservedCounts` (tipe literal `0` → `number`,
  memperbaiki regresi `berkas-activity-dev-reset.test.ts` yang muncul akibat total-error-count project
  berubah). **Belum disentuh:** `tests/e2e/submit-flow.spec.ts` — `advanceToStep()`-nya generik per
  index step (klik combobox ke-N lalu "Lanjut") dan urutan step berubah (kini ada toggle
  Material/Non-Material + Komponen sebelum Jenis Permintaan); perlu dijalankan di app nyata untuk
  diperbaiki, tidak aman diedit buta tanpa browser sungguhan — **serahkan ke pemilik proyek**.

Catatan verifikasi: `tsc --noEmit` project ini **sudah tidak bersih di `main`** (banyak error pra-ada,
tidak terkait pekerjaan ini). Setelah Fase H, `npx tsc --noEmit` disaring `tests/` menyisakan HANYA
error yang sudah diverifikasi identik dengan baseline `main` (lihat daftar di atas) — nol regresi baru,
di source maupun test. Gerbang verifikasi sebenarnya: `pnpm test` + `pnpm build` + walkthrough app +
`tests/e2e/submit-flow.spec.ts`, dijalankan pemilik proyek.

---

## 1. Ringkasan dampak per lapisan

### Schema / migration
- **Baru**: `src/db/schema/master/komponen.ts` (`master.master_komponen`, anak `master_kegiatan`), export di
  `src/db/schema/master/index.ts` (setelah `./kegiatan`, sebelum `./jenis-permintaan`).
- **Ubah** `src/db/schema/master/jenis-permintaan.ts`: tambah `komponenId: uuid('komponen_id').notNull()
  .references(() => masterKomponen.id, { onDelete: 'restrict' })` + index `idx_master_jenis_permintaan_komponen_id`,
  `idx_master_jenis_permintaan_komponen_active`; ubah partial-unique `master_jenis_permintaan_nama_active_unique`
  → **`master_jenis_permintaan_komponen_id_nama_active_unique` on `(komponenId, nama) WHERE is_active = true`**
  (nama jenis kini unik per-komponen, bukan global).
- **Ubah** `src/db/schema/master/kelengkapan-dokumen.ts`: tambah `komponenId: uuid('komponen_id')
  .references(() => masterKomponen.id, { onDelete: 'restrict' })` (nullable); masukkan `komponenId` ke
  `idx_master_kelengkapan_chain`; tambah check `master_kelengkapan_jenis_requires_komponen_check`
  (`jenis_permintaan_id is null or komponen_id is not null`).
- **Ubah** `src/db/schema/dokumen/dokumen-transaksi.ts`: tambah `komponenId` (uuid, **nullable**, FK
  `master_komponen` restrict, + `idx_dokumen_transaksi_komponen_id`) dan `namaDokumen` (text, nullable).
- **Ubah** `src/db/schema/arsip/manual-arsip.ts`: hapus `manualArsipCategory` + `categoryId` + indexnya +
  tipe `ManualArsipCategory`/`NewManualArsipCategory`; tambah `fungsiId`/`kegiatanId`/`komponenId`
  (uuid **NOT NULL**, FK restrict, + 3 index).
- **Konstanta** `src/lib/constants/tables.ts`: tambah `MASTER_KOMPONEN`, hapus `MANUAL_ARSIP_CATEGORY`.
- **Migrasi baru** `drizzle/0012_workflow_ubah_alur_v1_foundation.sql` + entri `drizzle/meta/_journal.json`.
  Tulis tangan (jangan `drizzle-kit generate`), gaya `0005`/`0007` (`IF NOT EXISTS`, `DO $$ ... pg_constraint`,
  `--> statement-breakpoint`).

### API (`src/routes/api/`)
- **Baru** `master-komponen.ts` (GET `?kegiatan_id`, POST) + `master-komponen.$id.ts` (GET/PATCH/DELETE soft) —
  cermin `master-kegiatan(.$id).ts`.
- **Ubah** `master-jenis.ts`: GET terima filter `?komponen_id`, select+leftJoin `masterKomponen`, response
  tambah `komponen_id`/`komponen_nama`, cek duplikat jadi `(nama, komponenId)`; POST butuh `komponenId`
  + validasi komponen aktif. `master-jenis.$id.ts`: GET join komponen; PATCH terima `komponenId`; validasi.
- **Ubah** `master-kelengkapan.ts` + `.$id.ts`: GET select+response `komponen_id`; `validateKelengkapanChain`
  tambah aturan komponen (jenis butuh komponen; komponen konsisten dgn kegiatan); `findDuplicateKelengkapan`
  + insert/update tambah `komponenId`.
- **Ubah** `dokumen/submit.ts` (payload lewat schema — otomatis; + panggil helper conditional baru),
  `dokumen.$id.ts` (GET join `masterKomponen`; PATCH tulis `namaDokumen` + rekomputasi judul non-material).
- **Ubah** `laporan/saya.ts`, `saya.export-zip.ts`, `kegiatan.ts`, `kegiatan.export-zip.ts`
  (select + leftJoin `masterKomponen`; `leaf_node_nama` non-material dari `nama_dokumen`; tambah komponen ke tangga leaf Material).
- **Ubah (opsional)** `laporan/kinerja.ts` (Monitoring Realisasi) — hanya jika perlu menampilkan komponen.
- **Hapus** `arsiparis/manual-arsip/categories.ts`.
- **Ubah** `arsiparis/manual-arsip/index.ts` & `$id.ts` — ikut schema Zod baru.
- **Zod** `src/lib/schemas/`:
  - `master-data.ts`: blok baru **Komponen**; `createJenisSchema`/`updateJenisSchema` + `komponenId`;
    `createKelengkapanSchema`/`updateKelengkapanSchema` + `komponenId` (opsional/nullable).
  - `dokumen.ts`: `createAndSubmitDokumenSchema` + `komponenId` (Material) & `namaDokumen` (Non-Material);
    helper `validateWorkflowChainForCharacteristic`; `updateDokumenSchema` + `namaDokumen`.
  - `manual-arsip.ts`: `createManualArsipSchema` buang `category_id`, tambah `fungsi_id`/`kegiatan_id`/`komponen_id`;
    `METADATA_FORBIDDEN_KEYS` sesuaikan; `listManualArsipQuerySchema` filter `komponen_id`/`kegiatan_id`.

### Write path dokumen (`src/lib/dokumen/`)
`local-submit-write-bridge.ts` (payload type; `resolveLocalSubmitLeafName` — branch non-material pakai
`namaDokumen`, tangga Material tambah `komponen`; repo interface `getKomponenById`),
`local-submit-repository.ts` (insert/row map + registry tabel `komponen`),
`local-submit-drizzle-adapter.ts` (`selectKomponenById`, enrich `komponen_nama`/`nama_dokumen`),
`parse.ts` + `types.ts` (`komponen_id`/`komponen_nama`/`nama_dokumen` di `DokumenRow`).

### Types & helper master-data
`src/lib/master-data/shared.ts`: `KomponenRow` baru; `JenisRow` + `komponen_id`/`komponen_nama`;
`KelengkapanRow` + `komponen_id`. `src/components/dokumen/form/dokumen-form-types.ts` re-export `KomponenRow`.

### Form UI — Ajukan Dokumen
- **Baru** `src/components/dokumen/form/StepKomponen.tsx` (cermin `StepKategoriPermintaan.tsx`).
- **Ubah** `src/routes/pegawai/dokumen/aju.tsx`: state komponen + `namaDokumen`; buang state/efek
  `jenisDokumen*`; efek fetch komponen per `kegiatanId`; **efek fetch jenis diubah** dari `/master-jenis`
  (semua) → `/master-jenis?komponen_id=<komponenId>` (Material); reset komponen di `handleKegiatanChange`
  (jaga `checkChairmanStatus`); gate advance; payload submit; `handleSubmitAnother`; `hasFormDirty`.
- **Ubah** `StepJenisPermintaan.tsx`: branch non-material — `<Select>` Jenis Dokumen → `<input>` "Nama Dokumen";
  branch Material tetap `<Select>` Jenis Permintaan (kini opsi datang dari komponen). Props sesuaikan.
- **Ubah** `StepUploadLampiran.tsx` (breadcrumb chips: sisip `komponenNama`; non-material `namaDokumen`),
  `StepReview.tsx` + `ReviewSummary.tsx` (label + baris Komponen / Nama Dokumen),
  `KelengkapanChecklist.tsx` (`matchesCurrentChain` tier komponen; prop `komponenId`).
- **Ubah** `src/routes/pegawai/dokumen/$id/edit.tsx` (edit non-material: field Nama Dokumen + keterangan opsional),
  `revisi.tsx` (label).
- **Ubah (paritas ketat, serempak)** 4 halaman detail: `pegawai/dokumen/$id/index.tsx`, `ppk/dokumen/$id/index.tsx`,
  `bendahara/dokumen/$id.tsx`, `arsiparis/dokumen/$id/index.tsx` — baris "Komponen" (Material) + sumber
  `jenisValue` non-material `jenis_dokumen_nama` → `nama_dokumen`.

### Form UI — Admin master-data
- **Baru** `src/routes/admin.master-data.komponen.tsx` (cermin `admin.master-data.kegiatan.tsx`; parent = Kegiatan).
- **Ubah** `src/routes/admin.master-data.jenis.tsx`: dari "bebas" → berinduk. Tambah selektor **Komponen**
  di form create/edit + `AdminFilterSelect` Komponen; `fetchData` ambil `/master-komponen`; hapus teks
  "Bebas — tidak bergantung ke fungsi/kegiatan"; body POST/PATCH sertakan `komponenId`; kolom tabel tambah "Komponen Induk".
- **Ubah** `src/routes/admin.master-data.kelengkapan.tsx`: sisipkan filter **Komponen** antara Kegiatan dan
  Jenis (`fetchKomponen(filterKegiatan)`, reset anak saat berubah); form `formKomponenId`; `matchesSelectedChain`
  + `hasLoadedDuplicateKelengkapan` tambah `komponen_permintaan_id`; `chainComplete` perhitungkan komponen.
- **Ubah** `src/routes/admin.master-data.kategori.tsx`: `fetchJenis()` sebaiknya per-komponen (opsional; minimal
  jangan rusak — `/master-jenis` kini komponen-scoped, dropdown bisa jadi panjang, beri label kegiatan/komponen).
- **Ubah nav/route** `src/lib/constants/routes.ts` (`ADMIN.MASTER_KOMPONEN`), `src/config/navigation.ts`
  (item nav setelah `master_kegiatan`).

### Form UI — Penambahan Dokumen Kasubag
`src/routes/arsiparis/penambahan-arsip.tsx` (2604 baris) — ganti dropdown Kategori + seluruh referensi
`category*` dengan cascade Fungsi → Kegiatan → Komponen; validasi per-step & final; body submit;
`ManualCreateReview` nama final `{nama} - {komponen} - {tahun}`; kolom tabel; draft localStorage.
`src/lib/manual-arsip.ts` (35 KB) — buang `listManualArsipCategories`/`findActiveManualArsipCategory`;
`createManualArsipRecord`/`listManualArsipRecords`/`getManualArsipDetail`/`updateManualArsipRecord` ganti
join & shape `category` → `fungsi`/`kegiatan`/`komponen`. `toManualArsipListItem` ubah signature.

### Read surfaces — laporan & filter
`src/components/laporan/HierarchicalFilter.tsx`: rantai jadi **Fungsi → Kegiatan → Komponen → Jenis → Kategori
→ Detail**; `HierarchicalFilterValue` + `komponenId`; fetch `/master-komponen?kegiatan_id=` & ubah
`/master-jenis` → `?komponen_id=`. `src/routes/pegawai/laporan/{saya,kegiatan}.tsx` sesuaikan filter/haystack.

### Arsip / penamaan (ikut perubahan non-material)
`src/lib/dokumen/storage.ts` & `src/lib/file-helpers.ts` (leaf folder non-material: `jenis_dokumen_nama` →
`nama_dokumen`), `src/lib/archive/workflow-nama-arsip.ts` (`jenisDokumenNama` → `namaDokumen`),
`berkas-arsip-attachment-names.ts` (`:211` predikat non-material), `berkas-arsip-read-model.ts`,
`berkas-arsip-file-access.ts`, `berkas-arsip-csv.ts`, `manual-arsip-attachment-filename.ts`
(`category_nama` → `komponen_nama`), `src/routes/arsiparis/berkas/$id.tsx` (label "Kategori" → "Komponen").

### Seed
`src/db/seed/constants.ts` (`SEED_MASTER_IDS.komponen`), `src/db/seed/master-data.ts` — sisipkan blok
Komponen setelah `kegiatanId`; `masterJenisPermintaan` insert tambah `komponenId`; `masterKelengkapanDokumen`
insert tambah `komponenId`. `masterJenisDokumen` seed tetap.

### Test — lihat bagian 6.

---

## 2. Rencana langkah berurutan

> Urutan: schema DB → migrasi → shared types/zod → API → write-path lib → form UI → read surfaces →
> arsip/manual → seed → test. Setelah kelompok schema+migrasi: `pnpm db:local:migrate` lalu
> `pnpm db:local:seed` (dijalankan pemilik proyek).

### Langkah 1 — Schema: `master_komponen` (tabel baru)
- **Baru** `src/db/schema/master/komponen.ts` — salin `kegiatan.ts`, ubah: import `masterKegiatan`;
  `kegiatanId: uuid('kegiatan_id').notNull().references(() => masterKegiatan.id, { onDelete: 'restrict' })`;
  index `idx_master_komponen_kegiatan_id`, `idx_master_komponen_is_active`, `idx_master_komponen_kegiatan_active`;
  partial unique `master_komponen_kegiatan_id_nama_active_unique` on `(kegiatanId, nama) WHERE is_active = true`;
  export tipe `MasterKomponen`/`NewMasterKomponen`.
- **Edit** `src/db/schema/master/index.ts` — `export * from './komponen'` setelah `./kegiatan`.
- **Edit** `src/lib/constants/tables.ts` — `MASTER_KOMPONEN: 'master_komponen'`.

### Langkah 2 — Schema: `master_jenis_permintaan` jadi anak Komponen
**Edit** `src/db/schema/master/jenis-permintaan.ts`:
- import `masterKomponen` dari `./komponen`; tambah `komponenId: uuid('komponen_id').notNull()
  .references(() => masterKomponen.id, { onDelete: 'restrict' })`.
- ganti blok index: `idx_master_jenis_permintaan_komponen_id`, `idx_master_jenis_permintaan_komponen_active`
  (`komponenId, isActive`), `idx_master_jenis_permintaan_nama` (boleh dipertahankan);
  hapus `master_jenis_permintaan_nama_active_unique`, ganti
  `master_jenis_permintaan_komponen_id_nama_active_unique` on `(komponenId, nama) WHERE is_active = true`.

### Langkah 3 — Schema: `master_kelengkapan_dokumen` lengkapi rantai
**Edit** `src/db/schema/master/kelengkapan-dokumen.ts`:
- import `masterKomponen`; tambah `komponenId: uuid('komponen_id').references(() => masterKomponen.id,
  { onDelete: 'restrict' })` (nullable) setelah `kegiatanId`.
- `idx_master_kelengkapan_chain` — sisipkan `table.komponenId` sebagai kolom pertama setelah `isKetuaTim`.
- tambah check `master_kelengkapan_jenis_requires_komponen_check`
  (`sql\`${table.jenisPermintaanId} is null or ${table.komponenId} is not null\``).

### Langkah 4 — Schema: `dokumen_transaksi`
**Edit** `src/db/schema/dokumen/dokumen-transaksi.ts`: import `masterKomponen` dari `../master`; setelah
`jenisDokumenId` tambah `komponenId: uuid('komponen_id').references(() => masterKomponen.id, { onDelete:
'restrict', onUpdate: 'no action' })` (nullable) dan `namaDokumen: text('nama_dokumen')` (nullable);
index `idx_dokumen_transaksi_komponen_id`.

### Langkah 5 — Schema: `manual_arsip`
**Edit** `src/db/schema/arsip/manual-arsip.ts`: hapus `manualArsipCategory` (const + table + 2 index) +
tipe terkait; di `manualArsip` hapus `categoryId` + FK + `idx_manual_arsip_category_id`; tambah `fungsiId`
/`kegiatanId`/`komponenId` (uuid **NOT NULL**, FK restrict `onUpdate: 'no action'`) + 3 index; import
`masterFungsi`/`masterKegiatan`/`masterKomponen` dari `../master`. Kolom `nama` dipertahankan.
**Edit** `src/lib/constants/tables.ts` — hapus `MANUAL_ARSIP_CATEGORY`.

### Langkah 6 — Migrasi SQL `0012` (tulis tangan)
**Baru** `drizzle/0012_workflow_ubah_alur_v1_foundation.sql`, berurutan (`--> statement-breakpoint`,
idempoten `0005`/`0007`):
1. `CREATE TABLE IF NOT EXISTS "master"."master_komponen" (...)` + FK guard
   `master_komponen_kegiatan_id_master_kegiatan_id_fk` → `master.master_kegiatan(id)` restrict + 3 index +
   partial-unique `master_komponen_kegiatan_id_nama_active_unique ... WHERE ..."is_active" = true`.
2. **Wipe** (`RESTART IDENTITY CASCADE`) — satu `TRUNCATE TABLE` untuk:
   `arsip.berkas_arsip_activity`, `arsip.berkas_arsip_item`, `arsip.berkas_arsip`,
   `arsip.manual_arsip_attachment`, `arsip.manual_arsip`,
   `dokumen.log_aktivitas`, `dokumen.dokumen_transaksi`,
   `master.master_kelengkapan_dokumen`, `master.master_detail_permintaan`,
   `master.master_kategori_permintaan`, `master.master_jenis_permintaan`.
   (verifikasi nama tabel aktivitas berkas di `berkas-arsip.ts`).
3. `master.master_jenis_permintaan`:
   `ALTER TABLE ... ADD COLUMN "komponen_id" uuid NOT NULL;` (tanpa `IF NOT EXISTS`, tabel kosong) + FK guard
   → `master.master_komponen(id)` restrict; `DROP INDEX IF EXISTS "master"."master_jenis_permintaan_nama_active_unique";`
   `CREATE UNIQUE INDEX IF NOT EXISTS "master_jenis_permintaan_komponen_id_nama_active_unique" ON ...
   ("komponen_id","nama") WHERE ..."is_active" = true;` + 2 index komponen.
4. `master.master_kelengkapan_dokumen`:
   `ALTER TABLE ... ADD COLUMN IF NOT EXISTS "komponen_id" uuid;` + FK guard → `master.master_komponen(id)` restrict;
   `DROP INDEX IF EXISTS "master"."idx_master_kelengkapan_chain";` lalu `CREATE INDEX IF NOT EXISTS
   "idx_master_kelengkapan_chain" ON ... ("kegiatan_id","is_ketua_tim","komponen_id","jenis_permintaan_id",
   "kategori_permintaan_id","detail_permintaan_id");` + check `master_kelengkapan_jenis_requires_komponen_check`
   (dalam `DO $$ ... pg_constraint` guard).
5. `dokumen.dokumen_transaksi`: `ADD COLUMN IF NOT EXISTS "komponen_id" uuid;` +
   `ADD COLUMN IF NOT EXISTS "nama_dokumen" text;` + FK guard
   `dokumen_transaksi_komponen_id_master_komponen_id_fk` → `master.master_komponen(id)` restrict +
   `CREATE INDEX IF NOT EXISTS "idx_dokumen_transaksi_komponen_id" ...`.
6. `arsip.manual_arsip`: `DROP CONSTRAINT IF EXISTS "manual_arsip_category_id_manual_arsip_category_id_fk";`
   + `DROP INDEX IF EXISTS "arsip"."idx_manual_arsip_category_id";` + `DROP COLUMN IF EXISTS "category_id";`
   + `DROP TABLE IF EXISTS "arsip"."manual_arsip_category";` + `ADD COLUMN "fungsi_id" uuid NOT NULL, ADD
   COLUMN "kegiatan_id" uuid NOT NULL, ADD COLUMN "komponen_id" uuid NOT NULL;` + 3 FK guard (restrict) + 3 index.
7. **Edit** `drizzle/meta/_journal.json` — append
   `{ "idx": 12, "version": "7", "when": <epoch-ms>, "tag": "0012_workflow_ubah_alur_v1_foundation", "breakpoints": true }`.

### Langkah 7 — Shared types & Zod
- **Edit** `src/lib/master-data/shared.ts`:
  - `KomponenRow` baru (`id, nama, deskripsi, is_active, created_at, kegiatan_id, kegiatan_nama?`).
  - `JenisRow` + `komponen_id: string`, `komponen_nama?: string`.
  - `KelengkapanRow` + `komponen_permintaan_id?: string | null` (nama field snake konsisten API).
  - opsional `jumlah_komponen?: number` di `KegiatanRow`.
- **Edit** `src/components/dokumen/form/dokumen-form-types.ts` — re-export `KomponenRow`.
- **Edit** `src/lib/schemas/master-data.ts`:
  - blok **Komponen**: `createKomponenSchema { kegiatanId: uuid, nama: 1..255, deskripsi?: max500 }`,
    `updateKomponenSchema { kegiatanId?, nama?, deskripsi?, isActive? }`.
  - `createJenisSchema` + `komponenId: z.string().uuid('ID komponen tidak valid')`; `updateJenisSchema` +
    `komponenId: z.string().uuid().optional()`.
  - `createKelengkapanSchema` + `komponenId: z.string().uuid().optional()`; `updateKelengkapanSchema` +
    `komponenId: z.string().uuid().optional().nullable()`.
- **Edit** `src/lib/schemas/dokumen.ts`:
  - `createAndSubmitDokumenSchema`: tambah `komponenId: z.string().uuid().optional()` (Material) &
    `namaDokumen: z.string().trim().min(1).max(255).optional()` (Non-Material). `jenisDokumenId` dibiarkan opsional (kompatibilitas).
  - helper `validateWorkflowChainForCharacteristic(isNonMaterial, { komponenId, namaDokumen })` di samping
    `validateNominalForMaterial`: Material ⇒ `komponenId` wajib; Non-Material ⇒ `namaDokumen` (trim) wajib.
  - `updateDokumenSchema` + `namaDokumen: z.string().trim().min(1).max(255).optional().nullable()`.
- **Edit** `src/lib/schemas/manual-arsip.ts`: `createManualArsipSchema` buang `category_id`, tambah
  `fungsi_id`/`kegiatan_id`/`komponen_id` (uuid) + transform output; `METADATA_FORBIDDEN_KEYS` buang
  `category_id`/`categoryId`, tambah 6 kunci baru; `listManualArsipQuerySchema` ganti `category_id` → `komponen_id` (+ `kegiatan_id` opsional).

### Langkah 8 — API master-komponen
- **Baru** `src/routes/api/master-komponen.ts` (salin `master-kegiatan.ts`): route `/api/master-komponen`;
  GET filter `kegiatan_id`, `eq(isActive,true)`, leftJoin `masterKegiatan`, `orderBy(asc(nama))`, response
  `{ ...row, master_kegiatan: {id,nama}|null, kegiatan_nama }`; POST `requireSameOrigin` → `createKomponenSchema`
  → `requireAdmin` → cek kegiatan aktif → cek duplikat `(nama, kegiatanId, isActive)` → insert → 201;
  `requireAdmin` lokal (pesan "...komponen").
- **Baru** `src/routes/api/master-komponen.$id.ts` (salin `master-kegiatan.$id.ts`, varian dgn 404-check +
  duplikat + `ne(id)`): GET / PATCH (partial `!== undefined`) / DELETE soft (`set({ isActive: false })`,
  `{ success: true, message: '...dinonaktifkan' }`).

### Langkah 9 — API master-jenis & master-kelengkapan
- **Edit** `src/routes/api/master-jenis.ts`:
  - GET: baca `?komponen_id`; `filters = [eq(isActive,true)]` + push `eq(komponenId, ...)` bila ada;
    leftJoin `masterKomponen`; select `komponen_id`, `komponen_nama`; response tambah `master_komponen`/`komponen_nama`.
  - POST: `createJenisSchema` kini butuh `komponenId`; cek komponen aktif (`400` jika tidak);
    cek duplikat jadi `(nama, komponenId, isActive)` → `409`; insert sertakan `komponenId`.
- **Edit** `src/routes/api/master-jenis.$id.ts`: GET join komponen; PATCH `updates.komponenId` bila `!== undefined`
  (+ validasi komponen aktif + duplikat per komponen); response sertakan komponen.
- **Edit** `src/routes/api/master-kelengkapan.ts`:
  - GET: select + response `komponen_permintaan_id: masterKelengkapanDokumen.komponenId`.
  - `validateKelengkapanChain`: tambah `if (jenisPermintaanId && !komponenId) return 'Jenis permintaan
    harus memiliki komponen'`; verifikasi `jenis.komponenId === komponenId` (query `masterJenisPermintaan`).
  - `findDuplicateKelengkapan` + insert `.values({...})`: tambah `komponenId` (dgn `isNull` guard di where).
- **Edit** `src/routes/api/master-kelengkapan.$id.ts`: PATCH tambah `komponenId` ke partial update + validasi rantai.

### Langkah 10 — Write path dokumen (`src/lib/dokumen/`)
- `local-submit-write-bridge.ts`: `LocalSubmitPayload` + `komponenId?`, `namaDokumen?`;
  `LocalSubmitDocumentCreatePayload` + `komponenId: string|null`, `namaDokumen: string|null`;
  `LocalSubmitCreatedDocument` + `komponen_id`, `komponen_nama?`, `nama_dokumen`;
  `LocalSubmitBridgeRepository` + `getKomponenById`; `resolveLocalSubmitLeafName` — **branch non-material**:
  `if (payload.is_non_material) return payload.namaDokumen?.trim() || fallback`; **Material** tambah tier
  `komponen` sebelum `return fallback`; `buildLocalSubmitDocumentCreatePayload` set kedua field.
- `local-submit-repository.ts`: `LOCAL_SUBMIT_SCHEMA_TABLES` + `komponen: 'master.master_komponen'`;
  insert/row types + map (`komponenId`, `namaDokumen` ↔ `komponen_id`/`komponen_nama`/`nama_dokumen`);
  `createLocalSubmitBridgeRepository` delegasikan `getKomponenById`.
- `local-submit-drizzle-adapter.ts`: `selectKomponenById` (pakai `selectNameById` generik + `masterKomponen`);
  `enrichInsertedDokumenRow` lookup `masterKomponen.nama` bila `row.komponenId`; propagate.
- `parse.ts` + `types.ts`: `DokumenRow` + `komponen_id?`, `komponen_nama?`, `nama_dokumen?`; teruskan di kedua parser.

### Langkah 11 — Form UI: Ajukan Dokumen
- **Baru** `src/components/dokumen/form/StepKomponen.tsx` (salin `StepKategoriPermintaan.tsx`; props
  `grouped?`, `kegiatanId`, `kegiatanNama`, `komponenId`, `komponenList`, `loadingKomponen`,
  `canAdvanceFromKomponen`, `onKomponenChange`, `onBack`, `onNext`).
- **Edit** `src/routes/pegawai/dokumen/aju.tsx`:
  - state: `komponenId/Nama/List/loadingKomponen`, `namaDokumen`; hapus `jenisDokumenId/Nama/List` + fetch `/master-jenis-dokumen`.
  - efek fetch komponen `on kegiatanId` → `/master-komponen?kegiatan_id=`.
  - **efek fetch jenis**: syarat `jenisPermintaanId`... ganti — load `/master-jenis?komponen_id=<komponenId>`
    saat `komponenId && !isNonMaterial`; reset saat komponen berubah.
  - `handleKegiatanChange`: reset `komponenId/Nama` + rantai; tetap `checkChairmanStatus(id)` di akhir.
  - `handleKomponenChange(id)` baru: set + reset `jenisPermintaanId`/kategori/detail.
  - `handleToggleNonMaterial`: reset `komponenId`/`namaDokumen` sesuai; tak sentuh jenisDokumen.
  - gate: `canAdvanceFromKomponen = isNonMaterial ? true : !!komponenId`;
    `canAdvanceFromStep3 = isNonMaterial ? !!namaDokumen.trim() : !!jenisPermintaanId`; masuk ke `canAdvanceFromInformation`.
  - render stack step-1: `StepKegiatan` → **`StepKomponen` (jika `kegiatanId && !isNonMaterial`)** →
    `StepJenisPermintaan` (gate Material jadi `komponenId`) → Kategori → Detail.
  - payload submit: `komponenId: !isNonMaterial ? (komponenId||undefined) : undefined`,
    `namaDokumen: isNonMaterial ? namaDokumen.trim() : undefined`; hapus `jenisDokumenId`.
  - `handleSubmitAnother` + `hasFormDirty` sesuaikan.
- **Edit** `StepJenisPermintaan.tsx`: branch `hidden={!isNonMaterial}` — ganti `<Select>` Jenis Dokumen
  jadi `<input type="text" maxLength={255}>` "Nama Dokumen *"; buang props `jenisDokumen*`, tambah
  `namaDokumen`/`onNamaDokumenChange`. Branch Material `<Select>` tetap (opsi dari komponen).
- **Edit** `StepUploadLampiran.tsx`: `contextParts` sisip `komponenNama` setelah `kegiatanNama` (Material);
  non-material pakai `namaDokumen`. Rename prop `jenisDokumenNama` → `namaDokumen`; tambah `komponenNama`.
- **Edit** `StepReview.tsx` + `ReviewSummary.tsx`: `aju.tsx` teruskan `jenisPermintaanNama={isNonMaterial ?
  namaDokumen : jenisPermintaanNama}` + prop `komponenNama`; `ReviewSummary` label `isNonMaterial ?
  'Nama Dokumen' : 'Jenis Permintaan'` + `SummaryItem` "Komponen" (Material).
- **Edit** `src/components/dokumen/KelengkapanChecklist.tsx`: `KelengkapanApiItem` + `komponen_permintaan_id?`;
  `matchesCurrentChain` tambah tier: bila `komponenId` & tanpa jenis → `item.komponen_permintaan_id === komponenId
  && jenis == null && kategori == null && detail == null`; prop `komponenId` + masuk `useMemo` deps; teruskan
  `komponen_id` sebagai query ke `/master-kelengkapan` bila didukung (atau tetap filter client-side).

### Langkah 12 — Edit / revisi non-material + `dokumen.$id.ts`
- **Edit** `src/routes/pegawai/dokumen/$id/edit.tsx`: input teks `nama_dokumen` (wajib bila non-material) +
  `keterangan_detail` opsional; save `PATCH` body `{ lampiranUrls, namaDokumen, keteranganDetail }`.
- **Edit** `src/routes/api/dokumen.$id.ts`: GET leftJoin `masterKomponen` + select `komponen_id`/`komponen_nama`/
  `nama_dokumen`; PATCH tulis `namaDokumen`, dan bila berubah untuk non-material rekomputasi `judul =
  \`${namaDokumen} ${dok.tahun} ${displayName}\`` (displayName dari session aktor — samakan dgn write-bridge).
  Heuristik `isNonMaterial` (`:457`) tetap (`komponen_id` tak dijadikan penanda).
- **Edit** `src/routes/pegawai/dokumen/$id/revisi.tsx`: label "Jenis Dokumen" → "Nama Dokumen"; baris rantai + Komponen.
- Legacy `src/routes/dokumen/*` = redirect saja → tidak disentuh.

### Langkah 13 — Halaman detail 4 role (paritas — ubah serempak)
`pegawai/dokumen/$id/index.tsx`, `ppk/dokumen/$id/index.tsx`, `bendahara/dokumen/$id.tsx`,
`arsiparis/dokumen/$id/index.tsx`: `jenisLabel = isNonMaterial ? 'Nama Dokumen' : 'Jenis Permintaan'`;
`jenisValue = isNonMaterial ? dok.nama_dokumen : dok.jenis_permintaan_nama`; tambah tile/baris "Komponen"
(`dok.komponen_nama`, Material) setelah "Kegiatan". Bentuk identik (dijaga `cross-role-detail-parity-source.test.ts`).

### Langkah 14 — Admin: Komponen, Jenis, Kelengkapan
- **Baru** `src/routes/admin.master-data.komponen.tsx` — salin `admin.master-data.kegiatan.tsx`: route
  `/admin/master-data/komponen`; `fetchData` ambil `/master-kegiatan` (dropdown+filter) & `/master-komponen`;
  form `formKegiatanId/formNama/formDeskripsi`; POST/PATCH/DELETE `/master-komponen`; kolom No | Nama |
  Kegiatan Induk | Deskripsi | Aksi.
- **Edit** `src/lib/constants/routes.ts` — `ADMIN.MASTER_KOMPONEN: '/admin/master-data/komponen'`.
- **Edit** `src/config/navigation.ts` — `{ id: 'master_komponen', label: 'Master Komponen', icon:
  ClipboardList, to: ROUTES.ADMIN.MASTER_KOMPONEN }` setelah `master_kegiatan` (grup `MANAJEMEN SISTEM`).
- **Edit** `src/routes/admin.master-data.jenis.tsx`: tambah state `formKomponenId`, `filterKomponen`,
  `komponenList`; `fetchData` ambil `/master-komponen` (+ `/master-kegiatan` untuk label); form `AdminFormSelect`
  Komponen (opsi label `"{kegiatan} / {komponen}"` untuk disambiguasi) + `AdminFilterSelect`; body POST/PATCH
  `{ komponenId, nama, deskripsi }`; hapus teks "Bebas — tidak bergantung..."; kolom tabel tambah "Komponen Induk"
  (`AdminRelationPill`); `isModalDirty` bandingkan `formKomponenId`.
- **Edit** `src/routes/admin.master-data.kelengkapan.tsx`: state `filterKomponen`, `komponenList`, `formKomponenId`;
  `useEffect` — setelah `filterKegiatan` → `fetchKomponen(filterKegiatan)`; setelah `filterKomponen` →
  `fetchJenis(filterKomponen)` (jenis kini per-komponen, bukan on-mount); reset anak berjenjang;
  `matchesSelectedChain` + `hasLoadedDuplicateKelengkapan` + body simpan tambah `komponenId`/`komponen_permintaan_id`;
  `chainComplete` = `filterKomponen && filterJenis && filterKategori && (detailList.length===0 || filterDetail)`.
- **Edit** `src/routes/admin.master-data.kategori.tsx`: `fetchJenis()` — `/master-jenis` kini komponen-scoped;
  minimal jaga tak rusak; idealnya beri label `"{komponen} / {jenis}"` di dropdown parent (opsional).

### Langkah 15 — Laporan / HierarchicalFilter
- **Edit** `src/components/laporan/HierarchicalFilter.tsx`: `HierarchicalFilterValue` + `komponenId`;
  rantai fetch Fungsi (mount) → Kegiatan (`?fungsi_id=`) → **Komponen (`/master-komponen?kegiatan_id=`)** →
  Jenis (`/master-jenis?komponen_id=`) → Kategori → Detail; reset berjenjang; docblock diperbarui.
- **Edit** `src/routes/api/laporan/saya.ts`, `kegiatan.ts`: select `komponen_id`, `komponen_nama`
  (`leftJoin masterKomponen`), `nama_dokumen`; `leaf_node_nama` non-material = `row.nama_dokumen`; tangga
  leaf Material tambah `komponen_nama` sebelum `kegiatan_nama`.
- **Edit** `saya.export-zip.ts`, `kegiatan.export-zip.ts`: idem; utamakan `nama_dokumen` untuk non-material.
- **Edit** `src/routes/pegawai/laporan/{saya,kegiatan}.tsx`: haystack + filter tambah `komponen_nama`/`nama_dokumen`.

### Langkah 16 — Monitoring Realisasi (opsional)
`src/routes/api/laporan/kinerja.ts` + `src/components/kinerja/MonitoringRealisasiView.tsx` — tak ada
ketergantungan jenis_dokumen; hanya diubah bila diminta menampilkan/mengelompokkan per Komponen
(extend zod row schema + select + `leftJoin(masterKomponen)` + kolom/grouping).

### Langkah 17 — Penambahan Dokumen Kasubag
- **Hapus** `src/routes/api/arsiparis/manual-arsip/categories.ts`.
- **Edit** `src/lib/manual-arsip.ts`: buang `listManualArsipCategories`, `findActiveManualArsipCategory`,
  tipe `ManualArsipCategoryResponse` + field `category*`; `createManualArsipRecord` validasi
  `fungsi_id`/`kegiatan_id`/`komponen_id` aktif & konsisten (komponen∈kegiatan, kegiatan∈fungsi) →
  `ManualArsipApiError(400)`; insert `fungsiId`/`kegiatanId`/`komponenId`; returning + shape `category` →
  `{ fungsi, kegiatan, komponen }`; `listManualArsipRecords`/`getManualArsipDetail`/`updateManualArsipRecord`
  ganti `leftJoin manualArsipCategory` → `masterFungsi` + `masterKegiatan` + `masterKomponen`; filter query
  `komponen_id`/`kegiatan_id`; `toManualArsipListItem` ubah signature.
- **Edit** `src/routes/api/arsiparis/manual-arsip/$id.ts` — ikut tipe baru.
- **Edit** `src/routes/arsiparis/penambahan-arsip.tsx`:
  - `fetchInitial`: ganti `/arsiparis/manual-arsip/categories` → `/master-fungsi`; cascade
    `/master-kegiatan?fungsi_id=` & `/master-komponen?kegiatan_id=` (pola `aju.tsx`).
  - form state: hapus `category_id`; tambah `fungsi_id`/`kegiatan_id`/`komponen_id`.
  - Step 1: 3 `<Select>` bertingkat Fungsi → Kegiatan → Komponen (reset anak saat induk berubah);
    "Nama Dokumen" (input `nama`) dipindah setelah Komponen; Keterangan tetap.
  - `validateCurrentStep`/`validateForm`: ganti cek `category_id` → cek 3 field baru.
  - `handleFinalSubmit` body: `{ nama, tanggal, keterangan, fungsi_id, kegiatan_id, komponen_id,
    klasifikasi_id, nominal_realisasi }`.
  - tombol Next/Submit `disabled`: `komponenList.length === 0` / `!komponen_id`.
  - `ManualCreateReview`: `finalName = "{nama} - {komponen.nama} - {year}"`; `<ReviewItem label="Komponen">` (+ Fungsi/Kegiatan opsional).
  - `ManualArsipTable`: kolom "Kategori" → "Komponen" (`item.komponen.nama`).
  - draft localStorage: abaikan field lama `category_id` saat baca.
- **Edit** `src/lib/archive/manual-arsip-attachment-filename.ts` — `category_nama` → `komponen_nama` (+ konstanta fallback).
- **Edit** read model: `berkas-arsip-read-model.ts`, `berkas-arsip-file-access.ts`, `berkas-arsip-csv.ts`,
  `berkas-arsip-attachment-names.ts` — field `category_name`/`category_nama` (manual) → `komponen_nama`;
  join `manualArsipCategory` → `masterKomponen`.
- **Edit** `src/routes/arsiparis/berkas/$id.tsx` — `ModalMetadataField label="Kategori"` (manual) → "Komponen";
  haystack `item.manual?.category_name` → `komponen_nama`.

### Langkah 18 — Arsip: penamaan dokumen non-material (workflow)
- `src/lib/dokumen/storage.ts` & `src/lib/file-helpers.ts`: non-material `leafNode = dok.nama_dokumen || 'Dokumen'`.
- `src/lib/archive/workflow-nama-arsip.ts`: `jenisDokumenNama` → `namaDokumen`; `if (judul && namaDokumen)
  return \`${namaDokumen} - ${judul}\`` (atau cukup `judul`; judul non-material sudah memuat `nama_dokumen` — putuskan).
- `src/lib/archive/berkas-arsip-attachment-names.ts` (`:211`): `if (document.is_non_material === true) return
  Boolean(trimToNull(document.nama_dokumen))`.
- Grep `jenisDokumenNama:` di `src/lib/archive/*` — semua pemanggil `deriveWorkflowNamaArsip` /
  `resolveWorkflowAttachmentNames` teruskan `nama_dokumen`.

### Langkah 19 — Seed
- **Edit** `src/db/seed/constants.ts` — `SEED_MASTER_IDS.komponen: 'b0b0b0b0-b0b0-40b0-80b0-b0b0b0b0b0b0'`.
- **Edit** `src/db/seed/master-data.ts`:
  - setelah `const kegiatanId = ...`: insert `masterKomponen { id: SEED_MASTER_IDS.komponen, kegiatanId,
    nama: 'Dev Komponen', deskripsi: '...', isActive: true }` `.onConflictDoNothing()`; `const komponenId =
    await findIdByName(... 'Dev Komponen')`.
  - `masterJenisPermintaan` insert — tambah `komponenId`.
  - `masterKelengkapanDokumen` insert (3 baris) — tambah `komponenId`.
  - return `{ kegiatanId, komponenId }`.
  - `masterJenisDokumen` seed tetap.

### Langkah 20 — Test (bagian 6).

---

## 3. Daftar migrasi Drizzle baru

| File | Isi ringkas |
|---|---|
| `drizzle/0012_workflow_ubah_alur_v1_foundation.sql` | (1) `CREATE TABLE master.master_komponen` + FK→`master_kegiatan` restrict + 3 index + partial-unique `(kegiatan_id, nama) WHERE is_active`. (2) `TRUNCATE ... RESTART IDENTITY CASCADE` untuk tabel transaksi (`dokumen_transaksi`, `log_aktivitas`, `manual_arsip`+attachment, `berkas_arsip`+item/activity) **dan** master referensi (`master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_kelengkapan_dokumen`). (3) `master_jenis_permintaan` `ADD COLUMN komponen_id uuid NOT NULL` (FK→`master_komponen` restrict) + ganti partial-unique jadi `(komponen_id, nama) WHERE is_active` + 2 index. (4) `master_kelengkapan_dokumen` `ADD COLUMN komponen_id uuid` (FK restrict) + rebuild `idx_master_kelengkapan_chain` (komponen di depan jenis) + check `jenis ⇒ komponen`. (5) `dokumen_transaksi` `ADD COLUMN komponen_id uuid` (FK restrict, index) + `ADD COLUMN nama_dokumen text`. (6) `manual_arsip` DROP `category_id`(+FK+index) & `DROP TABLE manual_arsip_category` + `ADD COLUMN fungsi_id/kegiatan_id/komponen_id uuid NOT NULL` (3 FK restrict + 3 index). Gaya idempoten `IF NOT EXISTS` + `DO $$ pg_constraint` + `--> statement-breakpoint`. |
| `drizzle/meta/_journal.json` | append `{ idx:12, version:"7", when:<epoch>, tag:"0012_workflow_ubah_alur_v1_foundation", breakpoints:true }` |

Terapkan: `pnpm db:local:migrate` → `pnpm db:local:seed` (pemilik proyek). **Jangan** `pnpm db:local:generate`.

---

## 4. Keputusan / asumsi terbuka yang perlu konfirmasi

1. **Uniqueness Jenis Permintaan** — kini unik **per-komponen** (`(komponen_id, nama)`). Konsekuensi: nama
   jenis yang sama boleh muncul di banyak komponen; laporan/filter harus selalu bawa konteks komponen.
   Konfirmasi ini diterima.
2. **Data referensi lama di-wipe** (`master_jenis_permintaan` + turunannya + kelengkapan). Semua konfigurasi
   Jenis/Kategori/Detail/Kelengkapan yang ada di DB lokal **hilang** dan harus dibuat ulang lewat seed +
   admin. Konfirmasi ini sesuai keputusan "wipe + reseed".
3. **`master_kelengkapan_dokumen.komponen_id` = nullable** (mengikuti pola jenis/kategori/detail yang
   nullable) — baris kelengkapan level-kegiatan/level-komponen tetap sah. Alternatif NOT NULL akan
   memaksa setiap kelengkapan menyebut komponen. Rencana pakai nullable.
4. **`admin.master-data.jenis.tsx` — selektor Komponen** butuh label disambiguasi (nama komponen bisa
   sama antar kegiatan). Rencana pakai label `"{kegiatan} / {komponen}"`. Konfirmasi bentuk yang diinginkan.
5. **`dokumen_transaksi.komponen_id` tetap nullable** (Material wajib via Zod/`submit.ts`; Non-Material NULL).
6. **`jenisDokumenId` tetap di `createAndSubmitDokumenSchema`** (opsional, tak dikirim form) + kolom
   `dokumen_transaksi.jenis_dokumen_id` + tabel/menu `master_jenis_dokumen` tetap (sesuai "tabel & menu tetap ada").
7. **`dokumen.$id.ts` PATCH rekomputasi judul non-material** — sumber `displayName` (session aktor). Konfirmasi.
8. **Nama & granularitas migrasi** — satu file `0012` untuk semua. Alternatif pecah `0012`–`0016`.
9. **`HierarchicalFilter` menambah level Komponen** — dianggap in-scope karena "terhubung sampai
   kelengkapan"; bila ingin ditunda jadi enhancement terpisah, minimal jaga `/master-jenis` yang kini
   butuh `?komponen_id` tidak merusak filter.
10. **`TRUNCATE` cakupan berkas_arsip** — verifikasi nama persis tabel aktivitas/log berkas di
    `src/db/schema/arsip/berkas-arsip.ts` sebelum SQL final.

---

## 5. Checklist verifikasi manual (dijalankan pemilik proyek)

### DB & seed
- [ ] `pnpm db:local:migrate` sukses; `\d master.master_komponen` menampilkan FK→`master_kegiatan` + partial-unique.
- [ ] `master.master_jenis_permintaan` punya kolom `komponen_id` NOT NULL + unique `(komponen_id, nama) WHERE is_active`.
- [ ] `master.master_kelengkapan_dokumen` punya `komponen_id` (nullable); index chain memuat `komponen_id`.
- [ ] `dokumen.dokumen_transaksi` punya `komponen_id` (FK) & `nama_dokumen`; tabel kosong.
- [ ] `arsip.manual_arsip` punya `fungsi_id`/`kegiatan_id`/`komponen_id` NOT NULL; `manual_arsip_category` hilang.
- [ ] `pnpm db:local:seed` sukses; ada `Dev Komponen` → `Dev Kegiatan`, `Dev Material` (jenis) → `Dev Komponen`,
      dan 3 kelengkapan terhubung.

### Admin — hierarki terhubung
- [ ] Menu "Master Komponen" muncul (grup Manajemen Sistem, setelah Master Kegiatan).
- [ ] CRUD Komponen: tambah (pilih kegiatan induk), edit, pindah kegiatan, nama duplikat pada kegiatan sama → 409, hapus (soft).
- [ ] Halaman "Jenis Permintaan": form kini punya selektor Komponen (wajib); daftar menampilkan "Komponen Induk";
      filter per komponen bekerja; tambah jenis tanpa komponen → gagal.
- [ ] Halaman "Kelengkapan Dokumen": filter berjenjang Fungsi → Kegiatan → **Komponen** → Jenis → Kategori → Detail;
      kelengkapan hanya tampil setelah leaf; tambah kelengkapan menyimpan `komponen_id`.
- [ ] `GET /api/master-jenis?komponen_id=<id>` hanya jenis milik komponen itu; tanpa param → semua jenis aktif.
- [ ] Non-admin: GET master-* boleh; POST/PATCH/DELETE → 403.

### Ajukan Dokumen — Material
- [ ] Setelah Kegiatan → step "Pilih Komponen"; setelah Komponen → Jenis Permintaan berisi hanya jenis milik komponen itu.
- [ ] Ganti Kegiatan → Komponen + Jenis/Kategori/Detail ter-reset; badge Ketua Tim tetap ter-refresh.
- [ ] Ganti Komponen → Jenis/Kategori/Detail ter-reset.
- [ ] Tidak bisa lanjut tanpa memilih Komponen (lalu Jenis Permintaan).
- [ ] Kelengkapan wajib yang muncul sesuai rantai (kegiatan + komponen + jenis/kategori/detail).
- [ ] Submit Material → `komponen_id` tersimpan; judul memakai leaf (detail/kategori/jenis/komponen/kegiatan).
- [ ] Detail dokumen 4 role menampilkan baris "Komponen"; Review menampilkan Komponen.

### Ajukan Dokumen — Non-Material
- [ ] Setelah Kegiatan → input teks "Nama Dokumen" (bukan dropdown Jenis Dokumen).
- [ ] "Keterangan Detail" tidak wajib; "Nama Dokumen" wajib.
- [ ] Submit → status TERSIMPAN; judul = `{Nama Dokumen} {tahun} {nama}`; `nama_dokumen` tersimpan.
- [ ] Edit (TERSIMPAN): ubah "Nama Dokumen" → judul ikut ter-update.
- [ ] Detail 4 role: label "Nama Dokumen" menampilkan teks bebas.
- [ ] Menu admin "Jenis Dokumen" masih ada & berfungsi.

### Penambahan Dokumen Kasubag
- [ ] Alur Fungsi → Kegiatan → Komponen → Nama Dokumen; tiap dropdown reset saat induk berubah.
- [ ] Tidak ada dropdown/menu "Kategori"; `GET /api/arsiparis/manual-arsip/categories` → 404.
- [ ] Field lain tetap: Tanggal, Keterangan wajib, Nominal wajib, Klasifikasi wajib, Bukti opsional.
- [ ] Simpan → arsip AKTIF; detail/list menampilkan Fungsi/Kegiatan/Komponen; nama file unduhan lampiran pakai nama Komponen.
- [ ] Review "Nama Dokumen Hasil Sistem (Final)" = `{nama} - {komponen} - {tahun}`.

### Arsip / berkas & laporan
- [ ] Dokumen non-material yang diarsipkan → nama arsip & nama file lampiran memakai "Nama Dokumen"; tidak ada fallback/ekstensi hilang.
- [ ] `HierarchicalFilter` di laporan menampilkan level Komponen; filter berjenjang benar.
- [ ] CSV / ZIP export berkas & laporan benar untuk dokumen baru.

### Regresi
- [ ] `pnpm test` hijau (setelah test bagian 6 diperbarui).
- [ ] `pnpm build` sukses (route tree memuat `/admin/master-data/komponen`).
- [ ] Playwright `tests/e2e/submit-flow.spec.ts` & `approval-flow.spec.ts` lulus.

---

## 6. Dampak ke test — file yang perlu diperbarui

### Wajib diubah
| File | Alasan |
|---|---|
| `tests/unit/arsiparis/manual-arsip-route.test.ts` | Satu-satunya test yang assert `categoryId`/`category_id`. Ganti fixture ke `fungsi_id`/`kegiatan_id`/`komponen_id`; hapus test "category list". |
| `tests/unit/dokumen/local-submit-repository.test.ts` | `:39/43` peta nama tabel — tambah `komponen: 'master.master_komponen'`; row map baru. |
| `tests/unit/dokumen/local-submit-write-bridge.test.ts` | `resolveLocalSubmitLeafName` branch non-material + tier Komponen; payload builder. |
| `tests/unit/dokumen/local-submit-drizzle-adapter.test.ts` | `selectKomponenById` + enrich. |
| `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts` | Source-assert `aju.tsx` + step components (Jenis Dokumen → Nama Dokumen; + StepKomponen; `/master-jenis?komponen_id`). |
| `tests/unit/dokumen/cross-role-detail-parity-source.test.ts` | 4 halaman detail berubah serempak. |
| `tests/unit/dokumen/cross-role-list-parity-source.test.ts` | Bila daftar menampilkan leaf/jenis. |
| `tests/unit/dokumen/penambahan-dokumen-upload-source.test.ts` | Source-assert `penambahan-arsip.tsx` (kategori → cascade). |
| `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts` | Label. |
| `tests/unit/dokumen/submit-route-parity.test.ts` | Payload schema baru. |
| `tests/unit/kelengkapan-duplicate-validation.test.ts` | Rantai kelengkapan kini punya tier Komponen. |
| `tests/unit/arsiparis/workflow-nama-arsip.test.ts` | `deriveWorkflowNamaArsip` pakai `namaDokumen`. |
| `tests/unit/arsiparis/berkas-arsip-attachment-names.test.ts` | Predikat non-material `:211` + nama file (`category_nama` → `komponen_nama`). |
| `tests/unit/arsiparis/berkas-arsip-read-model.test.ts` | Field `category_name`/`jenis_dokumen_nama` → `komponen_nama`/`nama_dokumen`. |
| `tests/unit/arsiparis/berkas-arsip-csv.test.ts` | Sel CSV "Kategori:" (manual) → "Komponen:". |
| `tests/unit/arsiparis/berkas-arsip-file-access*.test.ts` (4) | Shape row + filename. |
| `tests/unit/arsiparis/berkas-arsip-schema.test.ts` | Kolom baru `manual_arsip` + hilangnya `manual_arsip_category`. |
| `tests/unit/laporan/hierarchical-filter-select-mount.test.ts` | Level Komponen baru + `/master-jenis?komponen_id`. |
| `tests/unit/laporan/kinerja-route.test.ts` | Bila `kinerja.ts` diperluas. |
| `tests/unit/laporan/export-zip.test.ts`, `tests/unit/export/document-zip.test.ts` | Path/nama file non-material. |
| `tests/unit/auth/roles-navigation.test.ts` | Item nav `master_komponen` baru (assertion biasanya group-scoped; cek). |
| `tests/unit/db/seed-users.test.ts`, `tests/unit/auth/role-*.test.ts` | Seed master extend (`komponenId` di jenis/kelengkapan). |
| `tests/e2e/submit-flow.spec.ts` | Langkah wizard baru (Komponen; Nama Dokumen; jenis per-komponen). |

### Perlu dicek (mungkin aman)
`tests/fsm.test.ts`, `tests/unit/storage/manual-arsip-upload.test.ts`,
`tests/unit/dokumen/ppk-*` / `revisi-*` parity source, `tests/unit/laporan/kinerja-visual-parity-source.test.ts`,
`tests/unit/pegawai/pegawai-reports-visual-parity-source.test.ts`.

### Test baru yang disarankan
- `tests/unit/arsiparis/master-komponen-route.test.ts` — meniru `klasifikasi-create-route.test.ts` /
  `klasifikasi-update-route.test.ts` (GET filter `kegiatan_id`, POST admin-only, PATCH 404 + duplikat, DELETE soft).
- `tests/unit/dokumen/master-jenis-komponen-scope.test.ts` — `GET /api/master-jenis?komponen_id=` hanya
  mengembalikan jenis milik komponen; POST butuh `komponenId`.
