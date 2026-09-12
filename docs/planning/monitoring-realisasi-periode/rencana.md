# Rencana — Level Komponen + Filter Periode di Monitoring Nominal Realisasi

## Status implementasi

Bagian A–G diimplementasikan. `pnpm test` (985 pass, 1 skip pre-existing) dan `tsc --noEmit`
(tanpa error baru pada file yang disentuh branch ini) sudah dijalankan selama development.
**Belum dijalankan oleh saya**: `pnpm build` produksi dan walkthrough aplikasi — lihat checklist
di bagian **Verifikasi** paling bawah; itu tugas pemilik proyek.

Deviasi kecil dari draf awal, ditemukan saat implementasi:
- `countKomponen` (paralel `countKegiatan`) tidak jadi dibuat — tidak ada tempat di UI yang
  butuh menjumlahkan komponen lintas banyak kegiatan sekaligus; "Jumlah Komponen" cukup
  `kegiatan.komponen.length` langsung di kartu satu kegiatan.
- Tombol sekunder "Lihat Semua Dokumen Kegiatan" (D7, opsional) tidak diambil — di luar cakupan
  minimal yang diminta, bisa ditambah kalau user merasa satu klik ekstra ke level Komponen
  mengganggu.
- Badge "Nonaktif" untuk komponen/kegiatan (D6, opsional) tidak diambil, sejalan dengan keputusan
  untuk tidak memfilter `isActive` di laporan sama sekali.

## Koreksi pasca-implementasi — cakupan dokumen (2026-09-12)

Setelah rilis awal, pemilik proyek menyadari halaman ini ikut menampilkan dokumen **non-material**
dan dokumen berstatus **TERSIMPAN** — padahal menu ini seharusnya hanya menghitung realisasi
dokumen **material** yang **final** (COMPLETED/ARCHIVED). Investigasi FSM
(`src/lib/dokumen/local-submit-write-bridge.ts:442-461`, `src/lib/fsm.ts`) membuktikan `TERSIMPAN`
memang eksklusif untuk dokumen non-material — filter lama `[COMPLETED, TERSIMPAN, ARCHIVED]`
sepertinya hanya ditiru dari `laporan/kegiatan.ts`/`laporan/saya.ts` (laporan "semua dokumen final",
yang justru benar menyertakan non-material) tanpa disesuaikan untuk laporan uang ini.

**Keputusan lanjutan dari pemilik proyek:** dokumen material yang berkas arsipnya sudah
**DIMUSNAHKAN** juga tidak boleh lagi dihitung di monitoring nominal.

Perubahan di `api/laporan/kinerja.ts`:
- `FINAL_LAPORAN_KINERJA_STATUSES` → `[COMPLETED, ARCHIVED]` saja (TERSIMPAN dibuang).
- Tambah `eq(dokumenTransaksi.isNonMaterial, false)` — material saja.
- Query tambahan ke `berkas_arsip_item` ⋈ `berkas_arsip` (`sourceType='WORKFLOW'`,
  `statusArsip='DIMUSNAHKAN'`) untuk mengumpulkan id dokumen yang berkasnya sudah dimusnahkan,
  lalu `notInArray(dokumenTransaksi.id, ids)` — meniru persis otoritas guard akses lampiran di
  `document-file-access.ts:245-257`, bukan definisi baru.
- Field `is_non_material` dibuang seluruhnya dari select/schema/response (selalu `false` sekarang,
  jadi tidak ada nilainya dipertahankan).

Dampak di `MonitoringRealisasiView.tsx` (kode yang jadi mati akibat perubahan di atas, dibersihkan
sekaligus): filter "Jenis" (Material/Non-Material) dan opsi status "Tersimpan" dihapus (tidak akan
pernah punya hasil lagi); kartu "Dokumen Material/Non-Material" di `KomponenDetailCards` diganti
"Belum Diarsipkan" (COMPLETED) / "Sudah Diarsipkan" (ARCHIVED) — pembagian yang sekarang benar-benar
relevan; kolom "Jenis Scope" di tabel dokumen dan field "Jenis" di dialog metadata dihapus (dulu
selalu bernilai "Material", jadi tidak informatif lagi); teks detail "Hanya Belanja Material" di
semua kartu Total Nominal Realisasi diganti "Berkas Belum Dimusnahkan" untuk mencerminkan syarat
yang sekarang benar-benar berlaku.

Test yang diperbarui: `tests/unit/laporan/kinerja-route.test.ts` (status set, mock query
destroyed-ids baru via `setupDbSelect`, test baru untuk filter material-only dan exclude
destroyed-berkas), `tests/unit/laporan/monitoring-rows.test.ts` (fixture tanpa `is_non_material`).

**Koreksi kedua, sama hari:** dokumen material wajib mengisi Komponen saat submit
(`validateWorkflowChainForCharacteristic`, `src/lib/schemas/dokumen.ts:205-227`). Dokumen lama dari
sebelum kolom Komponen ada bisa punya `komponen_id = null` meski material — ini data yatim, bukan
realisasi yang bisa dipertanggungjawabkan ke Komponen mana pun, jadi ditambahkan
`isNotNull(dokumenTransaksi.komponenId)` ke `scopeFilter` di `api/laporan/kinerja.ts`, sejajar
dengan `isNonMaterial = false`. Dampaknya dokumen semacam itu **tidak lagi masuk daftar sama
sekali** — bukan dibucket ke "Tanpa Komponen" seperti rencana awal. Keranjang "Tanpa Komponen" di
`buildKomponenRows` (monitoring-rows.ts) tetap dibiarkan ada sebagai fallback pertahanan (kalau
integritas data FK pernah dilanggar secara manual), tapi seharusnya tidak pernah muncul lagi dengan
data yang sehat.

## Context

Dua permintaan klien untuk halaman **Monitoring Nominal Realisasi**
(`src/components/kinerja/MonitoringRealisasiView.tsx`, dipakai bersama oleh tiga route: PPK,
Bendahara, dan Penanggung Jawab Kinerja):

1. **Drill-down kurang satu level.** Hari ini hanya Fungsi → Kegiatan → dokumen. Hierarki master
   sudah diperluas di branch `workflow/ubah-alur-v1` menjadi Fungsi → Kegiatan → **Komponen** →
   Jenis → Kategori → Detail, dan `dokumen_transaksi.komponen_id` sudah ada
   (`src/db/schema/dokumen/dokumen-transaksi.ts:67`) — tapi `api/laporan/kinerja.ts` tidak pernah
   menjoin-nya. Sibling report `api/laporan/kegiatan.ts:103-108` sudah membuktikan join-nya.
2. **Rencana Anggaran disusun per triwulan**, jadi laporan realisasi harus bisa dilihat per
   triwulan, per tahun, atau seluruh periode — default triwulan berjalan.

**Temuan yang mengubah bentuk rencana ini:** `api/laporan/kinerja.ts:25,124` mengambil
`LIMIT 200` dokumen diurut `updated_at desc`, lalu **seluruh total Rupiah dijumlahkan di browser**
dari 200 baris itu (`totalNominal`, `MonitoringRealisasiView.tsx:1875`). Artinya angka realisasi
yang tampil hari ini **sudah terpotong diam-diam** bila dokumen final lebih dari 200 — dan menu
"Seluruh Periode" akan membuat cacat itu terlihat. Karena itu filter periode dikerjakan di
**server** (SQL), bukan di browser, dan batasnya dinaikkan + diberi peringatan eksplisit.

### Keputusan yang sudah dikonfirmasi

| Topik | Keputusan |
|---|---|
| Basis tanggal periode | **`dokumen_transaksi.tanggal`** (text `YYYY-MM-DD`, notNull). Tanggal kejadian yang diisi pegawai; sama dengan basis umur di fitur Pembersihan Non Material. Tidak ikut bergeser kalau approval molor. |
| Mode periode | **Triwulan / Tahunan / Seluruh Periode / Kustom**. Filter rentang tanggal manual yang sekarang ada di "Filter Lanjutan" **dipindah** jadi mode Kustom — supaya tidak ada dua filter tanggal yang saling menimpa. |
| Cakupan filter | **Global**. Kartu Fungsi, Kegiatan, Komponen, band total satker, dan daftar dokumen semuanya memakai periode yang sama. |
| Default saat halaman dibuka | **Triwulan kalender berjalan** (mis. 12 Sep 2026 → TW3 2026, Jul–Sep). Jujur & bisa ditebak; risiko halaman kosong di awal triwulan ditangani empty-state khusus (Bagian F). |
| Batas 200 dokumen | Filter periode **pindah ke SQL**, batas dinaikkan ke **2000**, dan muncul peringatan "data terpotong" bila batas kena. Agregasi tetap di browser (tidak membongkar semua level jadi query SQL). |
| Triwulan | **Kuartal kalender tetap** — TW1 Jan–Mar, TW2 Apr–Jun, TW3 Jul–Sep, TW4 Okt–Des. Bukan rolling 3 bulan. Tahun anggaran = tahun kalender. |
| `isActive` master | **Tidak difilter** di laporan (semua join tetap `leftJoin`). Penghapusan dokumen di sistem ini hard-delete, jadi dokumen yang dihapus otomatis tidak terhitung tanpa kode tambahan. Penghapusan master adalah soft-delete (`isActive=false`); memfilternya di laporan akan membuang nama, bukan uangnya, sehingga realisasi tahun lalu bisa "hilang" hanya karena kegiatannya dinonaktifkan tahun ini — salah untuk laporan uang. |

---

## Rancangan UI/UX periode

Satu baris kontrol persisten di bawah header, **tampil di semua level** (karena filternya global),
memakai gaya segmented control yang sudah ada (`GroupByToggle`, `MonitoringRealisasiView.tsx:520-558`)
dan `Select`/`DatePicker` yang sudah ada — tidak ada primitif UI baru.

Perilaku per mode:

| Mode | Kontrol yang muncul | Rentang yang dikirim ke API |
|---|---|---|
| **Triwulan** (default) | Select Tahun + Select Triwulan, diapit tombol `‹` `›` untuk lompat triwulan sebelum/sesudah | `2026-07-01` … `2026-09-30` |
| **Tahunan** | Select Tahun saja | `2026-01-01` … `2026-12-31` |
| **Seluruh Periode** | — | tanpa parameter tanggal |
| **Kustom** | Dua `DatePicker`: "Mulai Dari Tanggal" / "Sampai Tanggal" (label persis dipindah dari Filter Lanjutan) | sesuai isian |

Detail yang menentukan rasa pakainya:

- **Tombol `‹` `›`** di sebelah Select Triwulan membuat perbandingan antar-triwulan jadi satu klik.
- **Label triwulan menyebut bulannya** ("TW3 · Jul–Sep"), bukan "Q3" — menghilangkan keraguan.
- **Band total satker menyebut periode aktif** (`Total Realisasi Satker · TW3 2026`).
- **Periode ikut di URL**, konsisten dengan `fungsiId`/`kegiatanId`/`groupBy` yang sudah di URL.
- **Periode bertahan saat drill-down** lewat `periodeScope` yang di-spread di setiap handler navigasi.
- **Pilihan tahun tidak ditebak dari data browser** — API mengirim `meta.tahun_tersedia`.
- **Mobile**: baris kontrol `flex-col gap-3 lg:flex-row`; segmented control melebar penuh.

---

## Bagian A — Model periode (murni, bisa dites)

`src/lib/laporan/periode.ts` — string `YYYY-MM-DD` murni, tanpa `date-fns`. Batas kuartal
konstanta, bukan aritmetika kalender: `PeriodeMode`, `PeriodeValue`, `TRIWULAN_OPTIONS`,
`currentPeriode(now?)`, `resolvePeriodeRange(p)`, `periodeLabel(p)`, `shiftTriwulan(p, delta)`,
`normalizePeriodeSearch(search)`.

## Bagian B — API `src/routes/api/laporan/kinerja.ts`

Join `masterKomponen` + kolom `komponen_id`/`komponen_nama`; filter `start_date`/`end_date` di SQL
(`gte`/`lte` pada `dokumenTransaksi.tanggal`, validasi format, 400 bila tidak valid); limit 200 →
2000 + `meta.count`/`meta.truncated`; `meta.tahun_tersedia` dari `selectDistinct`. Tidak menambah
filter `isActive`.

## Bagian C — Search param & navigasi

`monitoringRealisasiNavigation.ts` dapat `komponenId`, `periode`, `tahun`, `triwulan`, `dari`,
`sampai`; `periodeScope` di-spread ke setiap `go()`; `onSelectKomponen` baru; `onSelectKegiatan`
membuang `komponenId` saat kegiatan berganti. Tiga route wrapper (`ppk`, `bendahara`,
`penanggung-jawab-kinerja`) diubah bersamaan.

## Bagian D — Level Komponen di view

Ekstraksi builder murni ke `src/lib/laporan/monitoring-rows.ts`; `KomponenRow` baru;
`buildKomponenRows`; tiga guard level JSX (Kegiatan → Komponen → Dokumen); dokumen tanpa komponen
masuk keranjang `'Tanpa Komponen'`.

## Bagian E — `PeriodeSelector` + pemuatan ulang data

Segmented control + Select Tahun/Triwulan + `DatePicker` Kustom, gaya menjiplak `GroupByToggle`;
Filter Lanjutan kehilangan filter tanggal manual (pindah ke mode Kustom); fetch ulang pakai
`AbortController` untuk menghindari balapan request saat periode diganti cepat.

## Bagian F — Keadaan kosong & data terpotong

Empty-state periode kosong dengan tombol "Lihat TW sebelumnya" + "Seluruh Periode"; pita peringatan
saat `meta.truncated`.

## Bagian G — Test

`tests/unit/laporan/periode.test.ts`, `tests/unit/laporan/monitoring-rows.test.ts`,
`tests/unit/laporan/kinerja-route.test.ts` (diperbarui), `tests/unit/laporan/kinerja-visual-parity-source.test.ts`
(diperbarui — larangan `'Semua Tahun'`/`yearOptions`/dll dilepas karena konsep tahun sengaja
dikembalikan; larangan metadata-only lain tetap).

---

## Urutan eksekusi

`A` → `B` → `C` → `D1` (ekstraksi) → `D2-D5` (level Komponen) → `E` → `F` → `G` (test parity
paling akhir).

---

## Verifikasi

Seluruh langkah di bawah dijalankan oleh pemilik proyek, bukan oleh saya.

1. `pnpm test` — suite hijau, termasuk test yang diubah.
2. `pnpm build` — route generation bersih.
3. Walkthrough aplikasi (PPK, Bendahara, Penanggung Jawab Kinerja): default triwulan berjalan,
   ganti mode periode, navigasi `‹`/`›`, drill-down sampai Komponen dengan periode bertahan,
   dokumen non-material di keranjang "Tanpa Komponen", mode Kustom, empty-state periode kosong,
   share URL.
4. Cek silang angka: total kegiatan/komponen di satu triwulan harus sama dengan penjumlahan manual
   nominal dokumennya.
