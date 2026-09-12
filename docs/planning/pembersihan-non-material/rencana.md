# Rencana — Pembersihan Lampiran Dokumen Non-Material oleh Ketua Tim

## Status implementasi

Bagian A–J diimplementasikan. `pnpm test` (944 pass, 1 skip pre-existing) dan `tsc --noEmit`
(tanpa error baru di luar noise pre-existing yang sudah ada sebelum branch ini) sudah dijalankan
selama development. **Belum dijalankan oleh saya**: `pnpm db:local:migrate` di DB nyata, `pnpm build`
produksi, dan walkthrough aplikasi — lihat checklist di bagian **Verifikasi** paling bawah; itu tugas
pemilik proyek.

Deviasi kecil dari draf awal, ditemukan saat implementasi:
- Bagian H (badge) tidak menyentuh `AttachmentEditor`/`AttachmentViewer` untuk menonaktifkan tombol
  unduh/pratinjau secara proaktif — cakupannya dibatasi ke badge header + guard baca 410 yang sudah ada.
  Klik pada lampiran yang sudah dibersihkan tetap aman (menampilkan toast error, bukan crash), hanya
  belum ada penonaktifan tombol di muka.

## Context

Dokumen **non-material** (`is_non_material = true`) berhenti permanen di status `TERSIMPAN`
(`buildLocalSubmitTransitionPlan`, `src/lib/dokumen/local-submit-write-bridge.ts:442`) — tanpa PPK,
tanpa bendahara, tanpa arsiparis. Karena endpoint klasifikasi arsip mensyaratkan `status === 'COMPLETED'`
(`src/routes/api/arsiparis/dokumen.$id.archive.ts:101`), dokumen non-material **tidak pernah masuk berkas**,
sehingga tidak pernah tersentuh mesin retensi/pemusnahan berkas. Akibatnya lampirannya menumpuk di storage
tanpa batas, dan satu-satunya jalan keluar adalah hard delete oleh pemiliknya sendiri
(`src/routes/api/dokumen.$id.ts:648`) yang jarang dilakukan.

Keputusan pemilik proyek: non-material diperlakukan sebagai **dokumen kerja, bukan arsip**. Yang dibersihkan
hanya **file fisiknya**; baris metadata tetap tinggal dan diberi badge "File Dibersihkan" — persis seperti
yang sudah terjadi pada dokumen di dalam berkas yang dimusnahkan kasubag. Yang berhak membersihkan adalah
**ketua tim** dari kegiatan terkait, karena hanya dia yang tahu kapan masa guna laporan kegiatan lewat.

Tiga hal penting yang menentukan bentuk rencana ini:

1. **`status` dokumen TIDAK diubah.** `status` adalah posisi dalam FSM (`src/lib/constants/document-status.ts`).
   Menimpanya dengan nilai seperti `DIBERSIHKAN` akan menghapus informasi "dokumen ini pernah `COMPLETED`",
   dan akan mengeluarkan dokumen material dari `laporan/kinerja.ts` (filter `['COMPLETED','TERSIMPAN','ARCHIVED']`)
   — riwayat nominal realisasi hilang hanya karena filenya dihapus. Kondisi pembersihan disimpan di kolom terpisah.
2. **`lampiran_urls` TIDAK dikosongkan.** Index array adalah identitas file: route unduh/pratinjau mengalamatkan
   lampiran lewat `lampiranIndex` (`resolveDocumentLampiranReferenceFromContext`,
   `src/lib/storage/document-file-access.ts:255`). Menggeser/mengosongkan array akan merusak tautan dan
   referensi item arsip. Metadata lampiran tetap utuh, aksesnya yang diblokir 410.
3. **Berkas arsip tidak berubah sama sekali.** Guard akses arsip (join ke `berkasArsip.statusArsip = DIMUSNAHKAN`)
   tetap jadi otoritas; kolom baru hanya dipakai untuk tampilan. Endpoint lifecycle, service, dan
   `berkas-arsip-physical-destruction.ts` tidak diubah perilakunya — hanya ditambahi penulisan kolom + jejak audit.

### Keputusan yang sudah dikonfirmasi

| Topik | Keputusan |
|---|---|
| Friksi sebelum eksekusi | **Wajib ketik frasa konfirmasi.** Aksi tidak bisa dibatalkan (file benar-benar hilang), jadi tidak ada undo / masa tenggang. Pakai `ConfirmDialog` `requireTyped`. |
| Basis umur dokumen | **`dokumen_transaksi.tanggal`** (tanggal kejadian). `created_at` hanya kolom sekunder di tabel. |
| Ambang alert "lama" | **90 hari** (satu triwulan), sebagai konstanta `NON_MATERIAL_STALE_DAYS`. Bukan master setting. |
| Penentuan periode hapus | **Tidak dihitung sistem.** Ketua tim memilih sendiri lewat filter tanggal dari–sampai; alert hanya memberi tahu. |
| Scope | Ketiga tambahan diambil: badge sisi pegawai/PPK, tabel `audit.audit_log` + penulisan jejak (tanpa UI admin), dan pengisian kolom pembersihan saat kasubag musnahkan berkas. |
| Hard delete pegawai | Tetap hard (baris hilang), tapi kini meninggalkan jejak di `audit.audit_log`. |

---

## Bagian 0 — Dokumen rencana di repo

Salin isi rencana ini menjadi `docs/planning/pembersihan-non-material/rencana.md`, mengikuti format
`docs/planning/ubah-alur-v1/rencana.md` (Context → tabel keputusan → langkah → checklist verifikasi → tabel test).

---

## Bagian A — Skema DB

**Migrasi baru** `drizzle/0013_pembersihan_lampiran_non_material.sql` (via `pnpm db:local:generate`; nomor terakhir saat ini `0012`).

**A1. Kolom pembersihan** pada `dokumen.dokumen_transaksi` — `src/db/schema/dokumen/dokumen-transaksi.ts`:

```ts
lampiranDibersihkanAt: timestamp('lampiran_dibersihkan_at', { withTimezone: true }),
lampiranDibersihkanBy: uuid('lampiran_dibersihkan_by').references(() => users.id, { onDelete: 'set null' }),
lampiranDibersihkanAlasan: text('lampiran_dibersihkan_alasan'),
```
plus `check` — `lampiran_dibersihkan_alasan is null or in ('BERKAS_DIMUSNAHKAN','PEMBERSIHAN_NON_MATERIAL')`
dan `index('idx_dokumen_lampiran_dibersihkan_at')`.

**A2. Tabel jejak baru** — `src/db/schema/audit/audit-log.ts`, `pgSchema('audit')`.
Bentuknya meniru `berkasArsipActivity` (`src/db/schema/arsip/berkas-arsip.ts:113`), **dengan satu perbedaan wajib**:

```ts
entityId: uuid('entity_id').notNull(),   // SENGAJA TANPA .references() — baris dokumen boleh lenyap
```

`berkasArsipActivity.workflowDocumentId` memakai `onDelete: 'no action'`, yang justru akan **memblokir**
hard delete. Tabel jejak untuk penghapusan tidak boleh punya FK ke entitas yang dihapus.

Kolom: `id`, `entityType` ('DOKUMEN'), `entityId`, `aksi`, `actorUserId` (→ users, `set null`),
`metadataSnapshot` jsonb, `createdAt`. Index: `(entity_type, entity_id)`, `(actor_user_id, created_at)`,
`(aksi, created_at)`. Check `aksi in ('DOKUMEN_LAMPIRAN_DIBERSIHKAN','DOKUMEN_DIHAPUS_PERMANEN','BERKAS_LAMPIRAN_DIBERSIHKAN')`.
Daftarkan schema `audit` di barrel `src/db/schema/index.ts` dan `src/lib/db/schema.ts`.

**A3. Konstanta** — `src/lib/dokumen/pembersihan.ts` (baru):
`NON_MATERIAL_STALE_DAYS = 90`, `PEMBERSIHAN_DOKUMEN_CONFIRMATION_PHRASE = 'BERSIHKAN'`
(satu frasa dipakai UI **dan** literal Zod — jangan ulangi dualisme `BERSIHKAN FILE BERKAS` vs `HAPUS FILE FISIK ARSIP`),
`PEMBERSIHAN_BATCH_LIMIT = 200`, dan `computeDokumenAging({ tanggal, now })` → `{ umurHari, isStale }`,
meniru `computeBerkasAging` di `src/lib/archive/retention.ts:82` (perbandingan date-only, hindari off-by-one zona waktu).

---

## Bagian B — Helper storage bersama (prasyarat)

Saat ini ada **tiga salinan** logika hapus-file-aman yang hampir identik:
`src/lib/archive/berkas-arsip-physical-destruction.ts:478-550` (paling keras — menolak symlink, menangani `ENOTDIR`),
`src/routes/api/dokumen.$id.ts:236-301`, dan salinan privat di `src/lib/storage/local-attachment-replacement.ts`.

Buat **`src/lib/storage/logical-file-deletion.ts`**, mengangkat versi terkeras dari
`berkas-arsip-physical-destruction.ts` (jangan menulis salinan keempat):

```ts
export async function deleteLogicalFilesSafely(
  logicalPaths: string[],
  options: { root?: string; dryRun?: boolean; protectedLogicalPaths?: ReadonlySet<string> },
): Promise<LogicalFileDeletionReport>
```

Wajib mempertahankan: `assertSafeLogicalStoragePath` + `resolvePhysicalStoragePath`
(`src/lib/storage/local-storage-paths.ts`), `lstat` + tolak symlink, `realpath` containment,
dedupe berdasarkan **physical path hasil resolve** (bukan string logis — lihat `prepareUniqueCandidates:382`),
dan **kategorisasi error per item, bukan gagal seluruh batch** (`resolveExecutionStatus:423`).
Report snake_case tanpa membocorkan path (tes `expectNoLeak` yang ada mengandalkan invarian ini).

`berkas-arsip-physical-destruction.ts` **tidak wajib** dirombak untuk memakainya di rencana ini —
biarkan jalur arsip yang sudah teruji apa adanya. Hindari refactor yang mengubah perilakunya.

---

## Bagian C — Service pembersihan (murni + DI)

**`src/lib/dokumen/pembersihan-service.ts`** (baru). Ikuti pola injeksi repository dari
`berkas-arsip-physical-destruction.ts` (`Repository` + `Storage` seam, default lazy `await import('#/db/client')`)
agar unit test tidak menyentuh DB.

`buildPembersihanPlan(rows, { actorKegiatanIds })` — fungsi murni yang menyaring per dokumen dan mengembalikan
alasan penolakan per-item (bukan melempar):

1. `is_non_material === true` **dan** `jenis_permintaan_id`/`kategori_permintaan_id`/`detail_permintaan_id`
   semuanya null — tiru guard berlapis di `dokumen.$id.ts:707`, jangan cuma cek boolean.
2. `status === 'TERSIMPAN'`.
3. `kegiatan_jenis_id` ada di `actorKegiatanIds`.
4. `lampiran_dibersihkan_at === null` (idempoten — yang sudah bersih dilewati, bukan error).
5. Tidak ada di `berkas_arsip_item` (jaring pengaman; mustahil hari ini).

`executePembersihanLampiran(...)`:
- Bangun **protected set** dari `lampiranUrls` seluruh `dokumen_transaksi` **di luar** set target +
  seluruh `manualArsipAttachment.logicalPath` — pola dari
  `src/lib/storage/local-attachment-reference-cleanup.ts:15`. File yang dipakai baris lain → dilewati,
  jangan dihapus.
- Panggil `deleteLogicalFilesSafely`.
- Dalam **satu transaksi**: `update dokumenTransaksi set lampiran_dibersihkan_at/by/alasan = 'PEMBERSIHAN_NON_MATERIAL'`
  untuk dokumen yang lolos, + insert `audit.audit_log` (`DOKUMEN_LAMPIRAN_DIBERSIHKAN`) per dokumen dengan
  `metadata_snapshot` berisi `{ judul, nama_dokumen, pemilik_id, kegiatan_id, jumlah_lampiran }`.
- **Jangan sentuh `lampiran_urls` dan `status`.**
- Kembalikan report agregat + daftar `{ dokumen_id, outcome, reason }`.

Urutan: hapus file **lalu** tulis DB (kebalikan dari hard delete). Kalau file gagal terhapus, kolom tidak
terisi dan dokumen bisa dicoba lagi — lebih baik daripada dokumen bertanda "bersih" padahal filenya masih ada.

---

## Bagian D — API

**`GET /api/pembersihan-dokumen`** — daftar dokumen non-material dari kegiatan yang dipimpin caller.
Templat otorisasi: `src/routes/api/laporan/kegiatan.ts:52` (query `ketuaTimAssignments` untuk `session.user.id`,
`[] + is_ketua_tim:false` kalau tidak memimpin apa pun). Filter tambahan `is_non_material = true` dan
`status = 'TERSIMPAN'`. Kembalikan `umur_hari`, `is_stale`, `lampiran_dibersihkan_at`, `jumlah_lampiran`,
plus `stale_count` dan `stale_days` untuk alert.

**`POST /api/pembersihan-dokumen/bersihkan`** — bentuknya meniru
`src/routes/api/arsiparis/berkas/$id/lifecycle.ts`: `requireSameOrigin` → session → Zod body
`{ dokumen_ids: string[].max(200), confirmation: z.literal(PEMBERSIHAN_DOKUMEN_CONFIRMATION_PHRASE) }` →
service → JSON berisi report. Route tidak pernah 500 karena error storage (pakai fallback report seperti
`failedPhysicalDeletionReport()`).

**Otorisasi — catatan penting:** "Ketua Tim" **bukan role** (`src/lib/constants/roles.ts` tidak memuatnya).
Otorisasi = `hasLocalRole(session, 'PEGAWAI')` **dan** ada baris `ketuaTimAssignments` untuk
`(session.user.id, dokumen.kegiatan_jenis_id)`. Validasi ulang per dokumen di server — jangan percaya filter UI.
Query kanonik: `src/routes/api/users/me/is-ketua-tim/$kegiatanId.ts:37`.
Pakai regex UUID 5-grup yang benar dari `dokumen.$id.ts:41` (versi di `api/ketua-tim/$id.ts:22` cacat, jangan disalin).

**`GET /api/users/me/ketua-tim`** — tambahkan `stale_non_material_count` ke response. `AppLayout` sudah
memanggil endpoint ini saat boot, jadi badge nav tidak menambah request baru.

---

## Bagian E — Guard baca (satu titik sisip)

`loadDocumentAccessContext` (`src/lib/storage/document-file-access.ts:217`) adalah chokepoint tunggal untuk
unduh, pratinjau, token, **dan** export ZIP. Tambahkan `isLampiranCleaned` ke `DocumentAccessContext` (baris 37),
lalu di `resolveDocumentLampiranReference` (baris 254) kembalikan **410 `'Data file sudah dibersihkan'`**
tepat di sebelah cek `isInDestroyedBerkas` yang sudah ada.

Efek berantai yang didapat gratis:
- `buildLaporanZipEntries` (`src/lib/export/laporan-zip-entries.ts:27`) hanya push saat `reference.ok`,
  jadi lampiran yang sudah dibersihkan otomatis dilewati. **Ini menutup bug nyata**: hari ini ZIP mencoba
  membaca file yang sudah dimusnahkan kasubag karena `ok` ditentukan dari metadata, bukan keberadaan file.
- `src/lib/storage/internal-file-access.ts:174` punya implementasi paralel — terapkan cek yang sama di sana.

Tambahan: blokir edit dokumen yang sudah dibersihkan — `canEditNonMaterial` di
`src/routes/api/dokumen.$id.ts:473` dan guard klien `src/routes/pegawai/dokumen/$id/edit.tsx:80`
tambahkan `&& lampiran_dibersihkan_at === null`. Hard delete tetap diizinkan (plan-nya akan menghasilkan nol kandidat file).

String `'Data file sudah dimusnahkan'` yang lama **jangan diubah** — ada allowlist parsing di UI + test
(lihat keputusan turunan RP-01, `docs/planning/rp-01-de-arsip/claude-interview.md`). Pesan baru dipakai khusus jalur non-material.

---

## Bagian F — Halaman "Pembersihan Dokumen"

**Route** `src/routes/pegawai/pembersihan-dokumen.tsx` (baru) + `ROUTES.PEGAWAI.PEMBERSIHAN_DOKUMEN = '/pegawai/pembersihan-dokumen'`
di `src/lib/constants/routes.ts` (bukan `src/config/routes.ts`).

**Nav** — `src/config/navigation.ts`, grup MANAGEMENT PEGAWAI, tepat setelah `laporan_kegiatan`:
`{ id: 'pembersihan_dokumen', label: 'Pembersihan Dokumen', icon: Trash2, to: ... }`.
Sejajar dengan preseden kasubag "Pembersihan Berkas".
**Wajib**: tambahkan `'pembersihan_dokumen'` ke filter id di `src/components/layout/AppSidebar.tsx:65-83`
(mekanisme penyembunyian menu ketua tim adalah filter id hardcoded, saat ini hanya memuat `'laporan_kegiatan'`).

**Struktur halaman** — jiplak kerangka `src/routes/pegawai/laporan/kegiatan.tsx`:
`PageLayout` → header → toolbar (search + "Filter Lanjutan" + Select sort) → `LoadingState`/`ErrorState`/`EmptyState`
→ tabel desktop + `PegawaiPanel` mobile. Fetch klien via `apiFetch` dalam satu `useEffect`, tanpa loader/react-query.
Filter lanjutan: Select Kegiatan + dua `DatePicker` (`Mulai Dari` / `Sampai Tanggal`) — komponen dan pola
`countActiveFilters` sudah ada di halaman itu (semua subkomponennya lokal, jadi disalin, bukan diimpor).

**Yang belum ada dan harus dibuat:**
- `src/components/ui/checkbox.tsx` — belum ada sama sekali. `src/components/ui/table.tsx` sudah menyiapkan
  gaya `[&:has([role=checkbox])]:pr-0`, jadi ikuti kontrak `role="checkbox"` itu.
- Lapisan seleksi: `Set<string>`, checkbox header select-all (hanya baris yang lolos filter), bar aksi sticky
  berisi "N terpilih" + tombol "Bersihkan Lampiran". **Tidak ada preseden multi-select di repo** — ini pola baru.
  Yang terdekat hanyalah body `dokumen_ids: string[]` pada `handleExportZip` (`kegiatan.tsx:266`).

**Dialog konfirmasi** — `src/components/ui/ConfirmDialog.tsx` sudah mendukung semuanya:
`tone="destructive"`, `requireTyped={PEMBERSIHAN_DOKUMEN_CONFIRMATION_PHRASE}`, `pending` (spinner in-dialog).
Isi `children` dengan ringkasan: jumlah dokumen, jumlah pegawai, rentang tanggal, 5 judul teratas +
"…dan N lainnya". Contoh persis: `src/routes/arsiparis/pembersihan/index.tsx:432`.
Hasil: toast "X berhasil, Y dilewati" (`showToast` dari `AppToast`), lalu refresh daftar.
Kegagalan sebagian **tidak** membatalkan yang berhasil.

---

## Bagian G — Alert umur

- **Badge angka** pada item nav "Pembersihan Dokumen" — `NavItem` sudah punya field `badge`, disuplai dari
  `stale_non_material_count` yang diambil `AppLayout` (`src/components/layout/AppLayout.tsx:141`).
- **Kartu di dashboard pegawai** (`src/routes/pegawai.tsx`, blok dashboard inline saat `pathname === ROUTES.PEGAWAI.ROOT`):
  *"30 dokumen non-material berumur lebih dari 90 hari"* + tombol "Tinjau" yang membuka halaman dengan
  filter tanggal terisi. Hanya render saat `hasKetuaTimAssignment`.
  Catatan: `DashboardQuickActions` di file itu menampilkan `LAPORAN_KEGIATAN` tanpa syarat — kartu baru
  ini **harus** dikondisikan, jangan ikut pola tersebut.
- Tombol "Tinjau" **tidak menyeleksi apa pun**. Alert memberi tahu, bukan menyiapkan eksekusi sekali klik.
- Bukan modal, tidak memblokir.

---

## Bagian H — Badge "File Dibersihkan" di sisi pegawai/PPK/bendahara

Hari ini **nol** permukaan pegawai/PPK/bendahara yang menampilkan keadaan ini: pegawai yang berkasnya
dimusnahkan kasubag tetap melihat daftar lampiran normal, mengklik, lalu dapat 410 mentah. Bagian ini
menambalnya sekaligus melayani kasus non-material.

- Pakai label yang **sudah ada**: `'File Dibersihkan'` (`src/components/ui/StatusBadge.tsx:72`,
  `src/lib/archive/berkas-arsip-page-format.ts:34`). Jangan bikin istilah baru.
- Badge muncul dari `lampiran_dibersihkan_at != null`, **berdampingan** dengan badge status — bukan menggantikannya.
- `lampiran_dibersihkan_alasan` menentukan pesan: *"File dibersihkan bersama pemusnahan berkas"* vs
  *"File dibersihkan oleh ketua tim"*.
- Permukaan: `src/routes/pegawai/dokumen/$id/index.tsx`, `src/routes/pegawai/dokumen/index.tsx`,
  `src/routes/pegawai/laporan/{saya,kegiatan}.tsx`, `src/routes/ppk/dokumen/$id/index.tsx`,
  `src/routes/bendahara/dokumen/$id.tsx`. Di daftar lampiran, nonaktifkan tombol unduh/pratinjau dan
  tampilkan pesan alih-alih membiarkan klik berujung error.
- Tambahkan `lampiran_dibersihkan_at`/`_alasan` ke select + mapper API terkait
  (`api/dokumen.$id.ts`, `api/laporan/{saya,kegiatan}.ts`, `api/ppk/dokumen/$id.ts`, `api/bendahara/dokumen/$id.ts`)
  dan ke tipe `DokumenRow`/`DokumenLaporanRow` (`src/lib/dokumen/types.ts`).

**Kolom diisi untuk kedua jalur.** Saat berkas beralih ke `DIMUSNAHKAN`
(`src/lib/archive/berkas-arsip-service.ts:901` + route lifecycle), tulis juga
`lampiran_dibersihkan_at/by/alasan = 'BERKAS_DIMUSNAHKAN'` pada `dokumen_transaksi` anggota berkas,
di transaksi yang sama dengan transisi status.
**Pembagian peran yang tidak boleh kabur:** kolom = untuk tampilan; join ke
`berkasArsip.statusArsip = DIMUSNAHKAN` **tetap** otoritas pemblokiran akses dan tidak diubah. Kalau kolom
gagal terisi, akibat terburuknya badge tidak muncul — bukan file arsip yang mestinya terkunci jadi terbuka.

---

## Bagian I — Jejak audit dari tiga jalur

1. **Hard delete pegawai** (`src/routes/api/dokumen.$id.ts:751`) — insert `audit.audit_log`
   (`DOKUMEN_DIHAPUS_PERMANEN`) dengan snapshot lengkap **sebelum** `delete(dokumenTransaksi)`, di transaksi yang sama.
   Baris `logAktivitas` `aksi: 'DELETE'` yang ada sekarang **sia-sia**: `log_aktivitas.dokumen_id` memakai
   `onDelete: 'cascade'` (`src/db/schema/dokumen/log-aktivitas.ts:20`), jadi log itu ikut terhapus sedetik
   kemudian. Biarkan baris itu (murah, tidak berbahaya) tapi jangan andalkan — jejak sebenarnya ada di `audit_log`.
   Snapshot wajib memuat `judul`, `nama_dokumen`, `pemilik_id`, `kegiatan_id`, `jumlah_lampiran` — setelah
   barisnya hilang, itulah satu-satunya bukti dokumen apa yang dihapus.
2. **Pembersihan ketua tim** — sudah tercakup di Bagian C.
3. **Pemusnahan berkas kasubag** — insert `BERKAS_LAMPIRAN_DIBERSIHKAN` per dokumen, berdampingan dengan
   `berkasArsipActivity` `BERKAS_DIMUSNAHKAN` yang sudah ada (tidak menggantikannya).

**Tanpa UI admin.** Activity Log admin adalah proyek terpisah yang nanti tinggal membaca tabel ini.

---

## Bagian J — Test

Semua vitest, `environment: 'node'`, pola DI repository sudah baku di repo.

| File test (baru) | Cakupan |
|---|---|
| `tests/unit/dokumen/pembersihan-aging.test.ts` | `computeDokumenAging` — batas tepat 90 hari, date-only, tanpa off-by-one zona waktu. Model: `tests/unit/arsiparis/berkas-arsip-retention.test.ts` |
| `tests/unit/dokumen/pembersihan-plan.test.ts` | `buildPembersihanPlan` murni — tolak material, tolak non-`TERSIMPAN`, tolak kegiatan bukan miliknya, lewati yang sudah bersih, tolak yang ada di berkas. Model: `tests/unit/storage/submit-move-plan.test.ts` |
| `tests/unit/storage/logical-file-deletion.test.ts` | `deleteLogicalFilesSafely` — symlink ditolak, path di luar root ditolak, duplikat physical path, protected set dihormati, file hilang ≠ gagal, report tidak membocorkan path (`expectNoLeak`). Model: `tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts` (root nyata di `.tmp/`) |
| `tests/unit/dokumen/pembersihan-route.test.ts` | Route bulk — 403 bukan ketua tim kegiatan itu, 400 frasa salah, 400 > 200 id, sukses sebagian, `lampiran_urls` & `status` **tidak berubah**, `audit_log` tertulis. Model: `tests/unit/arsiparis/manual-arsip-route.test.ts` |
| `tests/unit/storage/document-file-access-cleaned.test.ts` | 410 untuk lampiran yang dibersihkan; `buildLaporanZipEntries` melewati dokumen tersebut |

Perbarui juga test existing yang menyentuh `berkas lifecycle` bila penulisan kolom baru mengubah ekspektasi
transaksi (`tests/unit/arsiparis/*lifecycle*`).

---

## Urutan eksekusi (hindari build-red panjang)

`A` (skema + konstanta) → `B` (helper storage + test) → `C` (service + test) → `D` (API + test) →
`E` (guard baca + test) → `F` (UI + checkbox + nav) → `G` (alert) → `H` (badge lintas peran) → `I` (jejak audit) → `J` (sapu test).

`F` menyentuh `navigation.ts` + `AppSidebar` + route baru sekaligus; kerjakan ketiganya berdekatan supaya
route generation (`@tanstack/router-plugin`, jalan lewat `pnpm dev`/`pnpm build`) tidak menghasilkan diff setengah jadi.

---

## Verifikasi

<cc-memory filenames="feedback_no_commit_no_test_run.md">Seluruh langkah di bawah dijalankan oleh pemilik proyek, bukan oleh saya.</cc-memory>

1. `pnpm db:local:generate` lalu `pnpm db:local:migrate` — pastikan `0013` berisi kolom + tabel `audit`, bukan drift lain.
2. `pnpm test` — seluruh suite hijau, termasuk test arsip lama (bukti berkas tidak berubah perilakunya).
3. `pnpm build` — route generation bersih.
4. Walkthrough aplikasi:
   - Login sebagai pegawai **tanpa** assignment ketua tim → menu "Pembersihan Dokumen" **tidak** muncul.
   - Login sebagai ketua tim → menu muncul, tabel hanya berisi non-material dari kegiatannya, filter tanggal jalan.
   - Pilih beberapa dokumen → dialog minta ketik `BERSIHKAN` → konfirmasi.
   - Cek `storage/` di disk: file hilang. Cek DB: `status` masih `TERSIMPAN`, `lampiran_urls` **utuh**,
     `lampiran_dibersihkan_at` terisi, ada baris di `audit.audit_log`.
   - Login sebagai pemilik dokumen → badge "File Dibersihkan", tombol unduh nonaktif, klik paksa URL lama → 410.
   - Ekspor ZIP laporan kegiatan → tidak error, dokumen tersebut tanpa file.
   - **Regresi arsip:** buka berkas tertutup, jalankan "Bersihkan File Berkas" seperti biasa → alurnya identik
     dengan sebelumnya, ditambah badge "File Dibersihkan" yang kini muncul di halaman pegawai.
