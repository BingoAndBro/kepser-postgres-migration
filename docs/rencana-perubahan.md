# Rencana Perubahan Aplikasi

> File ini adalah **daftar hidup** semua fitur baru / perubahan yang direncanakan tetapi **belum ada** di aplikasi.
> Untuk memahami aplikasi seperti sekarang, baca `docs/penjelasan-proyek.md`. Untuk aturan yang mengikat, `AGENTS.md` tetap otoritas.
>
> **Cara pakai:**
> - Tiap rencana diberi kode `RP-xx` dan satu bagian tersendiri.
> - Tiap bagian wajib punya: *Latar belakang*, *Perubahan yang diminta*, *Peta file terdampak*, *Yang tidak termasuk*, *Risiko*, *Urutan kerja*.
> - Selama status belum `Selesai`, isinya rencana — belum tentu tercermin di kode.
> - Setelah `Selesai`, pindahkan ringkasannya ke `docs/penjelasan-proyek.md` / `AGENTS.md`, sisakan catatan di sini sebagai jejak.

> **Prinsip tetap.** Aplikasi ini **internal & mandiri** — tidak berintegrasi / bertukar data dengan aplikasi manapun (kipApp, aplikasi arsip nasional, dll). Setiap fitur "ekspor/unduh" hanya menghasilkan file; pengguna yang mengunggahnya ke tempat lain secara **manual**. Tidak ada RP yang boleh menambah panggilan keluar ke sistem eksternal tanpa keputusan terpisah.

## Legenda status

| Status | Arti |
|---|---|
| `Draft` | Masih dirembuk, detail bisa berubah |
| `Disetujui` | Desain final, siap dikerjakan |
| `Dikerjakan` | Implementasi berjalan |
| `Selesai` | Sudah di kode + dokumen inti diperbarui |
| `Ditunda` | Sengaja ditahan |

## Daftar Perubahan

| Kode | Judul | Status | Ringkas |
|---|---|---|---|
| **RP-01** | De-arsip-kan istilah + sederhanakan lifecycle berkas | `Disetujui` | Buang bahasa kearsipan resmi; 4 tahap lifecycle → 2 tahap sesudah tutup; 2 field retensi → 1; tanpa scheduler |
| **RP-02** | Ekspor satu berkas penuh ke ZIP | `Draft` | Unduh semua soft file dalam satu berkas sebagai satu `.zip` (dipakai KSBU untuk keperluan tahunan) |
| **RP-03** | Aksi cepat beranda: urutkan prioritas dari yang terlama | `Draft` | Di dashboard PPK / PPSPM / KSBU, daftar "Perlu Tindakan" (maks 3) ambil 3 dokumen **terlama**, bukan 3 terbaru |
| **RP-04** | Bug: dropdown "Pilih Jenis Permintaan" tak bisa dibuka | `Selesai` | Setelah ganti Karakteristik Dokumen ke Non-Material lalu membuka dropdown Jenis Dokumen, dropdown Jenis Permintaan mati/tidak muncul |
| **RP-05** | Ekspor massal dokumen terpilih (terfilter) ke ZIP | `Draft` | Dari halaman daftar/laporan, filter (mis. periode 1 bulan), tombol "Ekspor Semua File (ZIP)"; di dalam zip, tiap dokumen = satu folder berisi seluruh kelengkapannya |
| **RP-06** | Bug: ekstensi file hilang setelah dokumen masuk berkas | `Dikerjakan` | Di Penambahan Dokumen (KSBU), upload + preview awal (status PENDING) berhasil; setelah dokumen masuk berkas (jadi FORMAL) nama file kehilangan ekstensi → preview gagal ("Preview hanya tersedia untuk file PDF") padahal file aslinya PDF dan download tetap berhasil sebagai PDF. **Akar masalah ditemukan & kode sudah diperbaiki** — lihat detail. |
| **RP-07** | Fondasi Ekspor ZIP Bersama (RP-02 + RP-05) | `Disetujui` | Perakit ZIP streaming tunggal; struktur folder berlapis; batas 500 dokumen / skip file >250 MB; `DAFTAR_ISI.txt`; dialog konfirmasi |

---

# RP-01 — De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

**Status:** `Disetujui`
**Sumber:** diskusi 2026-09 (lihat riwayat); ringkasan model final ada di `docs/penjelasan-proyek.md` bagian PB-6.

## Latar belakang & keputusan

1. **Aplikasi ini bukan sistem kearsipan resmi.** Sistem of record kearsipan tetap aplikasi arsip nasional. Aplikasi ini hanya *staging*: kumpulkan dokumen → berkas per cara pembayaran → tutup + Nomor SPM → ekspor tahunan → bersihkan file lama karena disk terbatas.
2. **Istilah kearsipan diganti** supaya tidak mengundang tuntutan kepatuhan UU 43/2009 (JRA disahkan ANRI, penyusutan, berita acara pemusnahan).
3. **Lifecycle disederhanakan** dari `AKTIF → INAKTIF → USUL_MUSNAH → DIMUSNAHKAN` (4 tahap) menjadi **2 tahap sesudah tutup**: `Usul Pembersihan → File Dibersihkan`. Status `INAKTIF` dibuang dari alur.
4. **Form Tutup Berkas** dari 2 field retensi (aktif + inaktif) menjadi **1 field**: "Masa Simpan Minimal".
5. **Tidak ada scheduler.** "Jatuh Tempo" dihitung saat halaman/endpoint dibaca (`hari ini ≥ closed_at + masa_simpan`), bukan job latar. Perpindahan state tetap butuh klik manusia + konfirmasi.
6. **Identifier internal dipertahankan** (nama tabel/kolom/enum/route `/arsiparis`). Hanya **label tampilan** yang diganti — pola yang sudah dipakai (`PPSPM` tampil "PPSPM"). Nilai enum lama (`INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`, `retensi_inaktif`) dibiarkan ada di DB agar **tanpa migrasi**.

## Model target

```
Pengklasifikasian Dokumen ─┐
                           ├─▶ BERKAS TERBUKA ──(Tutup Berkas: +Nomor SPM +Masa Simpan Minimal)──▶ BERKAS TERTUTUP
Penambahan Dokumen ────────┘     (get-or-create per Cara Pembayaran)                                     │
                                                                                                       │
     BERKAS TERTUTUP ◀──(Batalkan Usulan)── USUL PEMBERSIHAN ◀──(Usulkan Pembersihan / batch jatuh tempo)┘
                                                    │
                                                    ▼  (Bersihkan File — konfirmasi ketik)
                                          FILE DIBERSIHKAN  (terminal; hanya soft file dihapus, metadata tetap)
```

**Pemetaan ke nilai internal (tetap):**

| Label tampilan | `status_berkas` | `status_arsip` |
|---|---|---|
| Terbuka | `OPEN` | `null` |
| Tertutup / "Tersimpan" | `CLOSED` | `AKTIF` |
| Usul Pembersihan | `CLOSED` | `USUL_MUSNAH` |
| File Dibersihkan | `CLOSED` | `DIMUSNAHKAN` |
| ~~Inaktif~~ (dibuang) | — | `INAKTIF` *(tak dipakai)* |

## Perubahan yang diminta

1. **Relabel istilah** di seluruh UI + pesan validasi + label CSV + label activity:
   - "Arsip / Pengarsipan" → "Berkas / Pemberkasan"
   - "Jenis Pembayaran" → **"Cara Pembayaran"**
   - "Arsip Aktif" → "Berkas Tertutup" (chip: "Tersimpan")
   - "Usul Musnah" / "Musnahkan Data" → **"Usul Pembersihan"** / **"Bersihkan File"**
   - "Dimusnahkan" → **"File Dibersihkan"**
   - "Master Klasifikasi Arsip" → "Master Klasifikasi Dokumen"
2. **Tutup Berkas: satu field retensi.** Hapus `retensi_inaktif` dari form + preview. Rename label `retensi_aktif` → "Masa Simpan Minimal". Simpan `tanggal_jatuh_tempo = closed_at + masa_simpan` (pakai kolom `masa_aktif_berakhir` yang sudah ada). `masa_inaktif_berakhir` & `retensi_inaktif` dibiarkan `null`.
3. **Lifecycle:**
   - `propose_destruction`: izinkan `AKTIF → USUL_MUSNAH` **langsung** (sekarang `INAKTIF → USUL_MUSNAH`).
   - Hapus/no-op aksi `mark_inactive`.
   - Tambah aksi **`cancel_proposal`**: `USUL_MUSNAH → AKTIF` (tombol "Batalkan Usulan"), hanya bila belum `DIMUSNAHKAN`.
   - `approve_destruction` (`USUL_MUSNAH → DIMUSNAHKAN`) tetap; ganti frasa konfirmasi `MUSNAHKAN DATA FILE` → `BERSIHKAN FILE BERKAS`; alasan tetap wajib.
4. **Kolom "Umur Berkas" + badge "Jatuh Tempo"** (dihitung) di daftar Berkas Tertutup & Pembersihan Berkas. Urut default: terlama dulu.
5. **Tombol batch "Usulkan Semua yang Jatuh Tempo"** di Berkas Tertutup (opsional tapi disarankan).
6. **Menu "Pembersihan Berkas"** dengan **toggle 2 daftar**: *Usulan Pembersihan* (`USUL_MUSNAH`) / *Sudah Dibersihkan* (`DIMUSNAHKAN`). Menggantikan halaman `/arsiparis/usul-musnah`.
7. **Hapus halaman + menu "Daftar Arsip Inaktif"** (`/arsiparis/inaktif`).
8. **Peringatan "belum pernah diekspor"** sebelum "Bersihkan File" (opsional; sinkron dengan RP-02).
9. **Dashboard KSBU**: kartu "Arsip Inaktif" dihapus; "Usul Musnah" → "Usul Pembersihan".

## Keputusan kunci: tanpa scheduler

- Tidak ada cron / scheduled function. Tidak ada baris DB "sudah jatuh tempo".
- List API + read-model menghitung `umur` dan `jatuhTempo` per baris saat dipanggil.
- State (`status_arsip`) hanya berubah oleh aksi user (per-baris atau batch) — aman untuk aksi destruktif.
- Jika kelak butuh otomatis penuh: tambah aksi admin "Jalankan Pemeliharaan" atau interval di server. **Di luar scope RP-01.**

## Peta file terdampak

> Legenda: **L** = label/teks saja · **B** = logika · **S** = skema (usahakan tanpa migrasi) · **R** = route generation · **T** = test

### A. Konstanta, tipe, konfigurasi

| File | Jenis | Yang berubah |
|---|---|---|
| `src/lib/constants/archive-status.ts` | B/L | `ARCHIVE_STATUS_VALUES` biarkan (DB check masih pakai). Tambah helper mis. `BERKAS_RESTING_STATUS = 'AKTIF'`. Dokumentasikan bahwa `INAKTIF` deprecated. |
| `src/lib/constants/routes.ts` | R/L | Hapus `KEPALA_SUB_BAGIAN_UMUM.INAKTIF`. Ganti `USUL_MUSNAH` → `PEMBERSIHAN` + path `/arsiparis/pembersihan`. `BERKAS_AKTIF` tetap (isi 2 tab). |
| `src/config/navigation.ts` | L/R | Grup `KEPALA_SUB_BAGIAN_UMUM`: hapus item `arsip_inaktif`; `arsip_aktif` → 2 item ("Berkas Terbuka", "Berkas Tertutup") atau 1 halaman 2-tab; `usul_musnah` → "Pembersihan Berkas"; `penambahan_arsip` label sudah "Penambahan Dokumen" (ok); `klasifikasi` → "Master Klasifikasi". Ikon `Archive`/`ArchiveX` → `FolderOpen`/`FolderClosed`/`Trash2`. |
| `src/lib/archive/berkas-arsip-activity.ts` | L | `BERKAS_ACTIVITY_EVENT_LABELS`: "…ke Inaktif" (jadi tak terpakai), "…ke Usul Musnah" → "diusulkan untuk pembersihan", "Berkas dimusnahkan" → "File berkas dibersihkan". **Nilai `BERKAS_ACTIVITY_EVENT_TYPES` jangan diubah** (dipakai CHECK constraint DB). |

### B. Skema DB — target: tanpa migrasi

| File | Jenis | Yang berubah |
|---|---|---|
| `src/db/schema/arsip/berkas-arsip.ts` | S | **Tidak diubah struktur.** `retensiInaktif`, `masaInaktifBerakhir` jadi kolom warisan (tetap nullable). CHECK `status_arsip` & `event_type` tetap memuat nilai lama (harmless). Tambah komentar "INAKTIF deprecated (RP-01)". |
| `drizzle/*.sql` | S | Tidak ada migrasi baru untuk RP-01. Rename identifier internal = fase terpisah bila diinginkan. |

### C. Backend / helper

| File | Jenis | Yang berubah |
|---|---|---|
| `src/lib/archive/berkas-arsip-service.ts` | B | `nextStatusForBerkasLifecycleAction` (±ln 891): `propose_destruction` terima `AKTIF → USUL_MUSNAH`; hapus `mark_inactive`; tambah `cancel_proposal: { USUL_MUSNAH → AKTIF }`. `eventTypeForBerkasLifecycleStatus` (±ln 960): cabang `INAKTIF` jadi mati; petakan `cancel_proposal` ke event yang sesuai (mis. `METADATA_ARSIP_AKTIF_DIPERBARUI` atau event baru bila mau — hati-hati CHECK constraint). Fungsi close (±ln 403): tetap tulis `status_arsip='AKTIF'`; input retensi jadi satu. Filter edit metadata `AKTIF` (±ln 475, 759): tetap. |
| `src/lib/archive/retention.ts` | B | Tambah `calculateBerkasDueDate({ closedAt, masaSimpan })` (satu label). `calculateManualArchiveRetentionDates` boleh tetap untuk kompat, atau dibuat memanggil path satu-field. `MANUAL_ARCHIVE_RETENTION_LABELS` dipakai ulang untuk dropdown "Masa Simpan Minimal". |
| `src/lib/archive/berkas-arsip-read-model.ts` | B | DTO list/detail: tambah `umurBerkas` (dari `closed_at`) + `jatuhTempo: boolean` + `tanggalJatuhTempo`. Buang penyaringan/pelabelan `INAKTIF`. |
| `src/lib/archive/berkas-arsip-page-format.ts` | L | `formatBerkasArchiveStatusLabel`: `AKTIF`→"Tersimpan", `USUL_MUSNAH`→"Usul Pembersihan", `DIMUSNAHKAN`→"File Dibersihkan", hapus `INAKTIF`. `nextLifecycleAction` (±ln 46): hapus "Jadikan Inaktif"; "Usulkan Musnah"→"Usulkan Pembersihan"; "Musnahkan Data"→"Bersihkan File"; tambah "Batalkan Usulan". |
| `src/lib/archive/berkas-arsip-csv.ts` | L | Header/label kolom: "Jenis Pembayaran"→"Cara Pembayaran", "Inaktif"/"Musnah"/"Retensi Inaktif" disesuaikan; tambah kolom "Umur Berkas". |
| `src/lib/archive/berkas-klasifikasi-eligibility.ts` | L | Teks "Jenis Pembayaran" → "Cara Pembayaran". |
| `src/lib/archive/berkas-arsip-api.ts` | B/L | Referensi `INAKTIF` (param/filter) dibersihkan. |
| `src/lib/archive/berkas-arsip-file-access.ts` | L | Pesan blok `DIMUSNAHKAN` → "File berkas sudah dibersihkan" (jika user-facing). Logika tetap. |
| `src/lib/archive/berkas-arsip-physical-destruction.ts` | L | Frasa konfirmasi internal (`HAPUS FILE FISIK ARSIP`) → sesuaikan wording; logika hapus fisik tetap. |
| `src/lib/manual-arsip.ts` | L/B | Referensi `INAKTIF`/"musnah"/retensi ganda. |

### D. Validasi (Zod)

| File | Jenis | Yang berubah |
|---|---|---|
| `src/lib/schemas/berkas-arsip.ts` | B | `closeBerkasMetadataSchema`: hapus `retensi_inaktif`; `retensi_aktif` → simpan sebagai `masa_simpan` (boleh pertahankan key, ganti pesan) + transform. `openBerkasRequestSchema`: pesan "Jenis pembayaran tidak valid" → "Cara pembayaran tidak valid". |
| `src/routes/api/arsiparis/berkas/$id/lifecycle.ts` | B | `lifecycleBodySchema`: enum aksi buang `mark_inactive`, tambah `cancel_proposal`. Handler: `physicalDeletion` tetap hanya untuk `approve_destruction`. |
| `src/lib/schemas/manual-arsip.ts` | B/L | "Jenis Pembayaran" → "Cara Pembayaran"; retensi manual disederhanakan bila form manual mengumpulkannya. |

### E. API routes

| File | Jenis | Yang berubah |
|---|---|---|
| `src/routes/api/arsiparis/berkas/$id/close.ts` | B | Terima satu field retensi; hitung `tanggal_jatuh_tempo`. |
| `src/routes/api/arsiparis/berkas/$id/lifecycle.ts` | B | (lihat D) + tangani `cancel_proposal`. |
| `src/routes/api/arsiparis/berkas/index.ts` | B/L | Param filter status (buang `INAKTIF`); DTO list tambah umur/jatuh tempo; dukung filter "jatuh tempo". |
| `src/routes/api/arsiparis/berkas/$id.ts` | B/L | DTO detail tambah umur/jatuh tempo; buang `INAKTIF`. |
| `src/routes/api/arsiparis/dokumen.$id.archive.ts` | L | "Jenis Pembayaran" → "Cara Pembayaran". |
| `src/routes/api/arsiparis/manual-arsip/index.ts`, `.../$id.ts` | B/L | Retensi + "Jenis Pembayaran". |

### F. Halaman UI

| File | Jenis | Yang berubah |
|---|---|---|
| `src/routes/arsiparis/berkas/index.tsx` | L/B | Judul seksi: "Berkas Terbuka" + "Berkas Tertutup"; kolom **Umur Berkas** + badge **Jatuh Tempo**; tombol "Usulkan Pembersihan" (per baris) + "Usulkan Semua yang Jatuh Tempo"; teks "Jenis Pembayaran". |
| `src/routes/arsiparis/berkas/$id.tsx` | L/B | Label detail; tombol aksi lifecycle (Usulkan Pembersihan / Batalkan Usulan / Bersihkan File); "Jenis Pembayaran", "Inaktif", "Musnah". |
| `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx` | L/B | Hapus field "Retensi Inaktif" + preview "Masa Inaktif Berakhir"; "Retensi Aktif" → "Masa Simpan Minimal"; `isInvalid` & submit payload disesuaikan; `getRetentionPreview` → satu tanggal. |
| `src/routes/arsiparis/inaktif/index.tsx` | R | **Dihapus.** Perlu route generation. |
| `src/routes/arsiparis/usul-musnah/index.tsx` | R/L/B | Jadi **"Pembersihan Berkas"** dengan toggle (Usulan / Sudah Dibersihkan); tombol "Bersihkan File" + "Batalkan Usulan"; kolom Umur Berkas. Rename file → `src/routes/arsiparis/pembersihan/index.tsx`. Route generation. |
| `src/routes/arsiparis/inbox.tsx` | L | "Jenis Pembayaran" → "Cara Pembayaran". |
| `src/routes/arsiparis/index.tsx` | L/B | Kartu dashboard "Arsip Inaktif" hapus; "Usul Musnah" → "Usul Pembersihan"; "Jenis Pembayaran"; "musnah". |
| `src/routes/arsiparis/penambahan-arsip.tsx` | L/B | "Jenis Pembayaran" → "Cara Pembayaran"; retensi (bila dikumpulkan). |
| `src/routes/arsiparis/klasifikasi.tsx` | L | Judul "Master Klasifikasi Arsip" → "Master Klasifikasi Dokumen"; "Jenis Pembayaran". |

### G. Komponen bersama

| File | Jenis | Yang berubah |
|---|---|---|
| `src/components/ui/StatusBadge.tsx` | L | Union & `label` map status arsip: `AKTIF`→"Tersimpan", `INAKTIF` dihapus, `USUL_MUSNAH`→"Usul Pembersihan", `DIMUSNAHKAN`→"File Dibersihkan". |
| `src/components/dashboard/StatsBento.tsx` | L | Tile "Arsip Inaktif" hapus; "Usul Musnah" → "Usul Pembersihan". |

### H. Route tree

| File | Jenis | Yang berubah |
|---|---|---|
| `src/routeTree.gen.ts` | R | Diregenerasi setelah `/arsiparis/inaktif` dihapus & `/arsiparis/usul-musnah` → `/arsiparis/pembersihan`. **`AGENTS.md` melarang mengubah file ini kecuali fase mengizinkan** — RP-01 harus eksplisit mengizinkan route generation. |

### I. Test

| File | Jenis | Yang berubah |
|---|---|---|
| `tests/unit/arsiparis/berkas-arsip-service.test.ts` | T | Transisi `mark_inactive` → hapus; tambah `AKTIF→USUL_MUSNAH` & `cancel_proposal`. |
| `tests/unit/arsiparis/berkas-arsip-schema.test.ts` | T | `closeBerkasMetadataSchema` satu field; enum aksi lifecycle. |
| `tests/unit/arsiparis/berkas-arsip-read-model.test.ts` | T | Field umur/jatuh tempo; tanpa `INAKTIF`. |
| `tests/unit/arsiparis/berkas-arsip-api.test.ts` | T | Filter status; DTO baru. |
| `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts` | T | Judul seksi & tombol baru. |
| `tests/unit/arsiparis/berkas-arsip-csv.test.ts` | T | Header kolom baru. |
| `tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts` | T | Frasa konfirmasi baru. |
| `tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts` | T | "Cara Pembayaran". |
| `tests/unit/arsiparis/manual-arsip-route.test.ts`, `workflow-archive-route.test.ts` | T | Label. |
| `tests/unit/components/ui-foundation.test.ts` | T | Label `StatusBadge`. |
| `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts` | T | Kartu dashboard KSBU. |
| `tests/e2e/**` | T | Alur `/arsiparis/inaktif` & `/arsiparis/usul-musnah` (bila ada). |

### J. Dokumen

| File | Yang berubah |
|---|---|
| `AGENTS.md` | Bagian *Status Berkas*, *Arsip Lifecycle*, *Behavioral Rules 5 / 5A*, *Route And Ownership Map* (`/arsiparis/inaktif`, `/arsiparis/usul-musnah`), *Removed Or Deprecated Surfaces*. Wajib update sebelum/bersamaan kode (invariant "Update docs before behavior changes"). |
| `docs/migration/README.md` | Daftar "Active archive surfaces" & "Removed surfaces". |
| `docs/penjelasan-proyek.md` | Sinkronkan label PB-6 saat implementasi jadi (framing sudah diperbarui). |

## Yang TIDAK termasuk (non-scope RP-01)

- Rename identifier internal / nama tabel / kolom / nilai enum di DB → butuh migrasi, fase terpisah.
- Scheduler / cron / auto-transition.
- Ekspor ZIP (itu **RP-02**).
- Perubahan alur persetujuan dokumen (`dokumen_transaksi` FSM) — **tidak tersentuh**.
- Perubahan boundary `dms_session`, RBAC server, same-origin.
- Penghapusan fisik file di luar aksi "Bersihkan File" yang sudah ada.

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| CHECK constraint DB (`status_arsip`, `event_type`) memuat nilai lama | Biarkan; nilai lama tetap valid, hanya tidak dipakai. Tidak perlu migrasi. |
| Route generation menyentuh `routeTree.gen.ts` (dilarang default) | RP-01 eksplisit mengizinkan; jalankan generator resmi, jangan edit manual. |
| Data lama sudah `INAKTIF` di DB dev/seed | Perlakukan sebagai `AKTIF` di read-model (map `INAKTIF → AKTIF` saat baca), atau reset DB dev. Putuskan sebelum mulai. |
| Banyak test menyebut istilah lama (±12 file) | Update test bersama kode; jadikan bagian Definition of Done. |
| Pesan "belum diekspor" bergantung RP-02 | Buat opsional/flag; aktifkan penuh setelah RP-02. |

## Urutan kerja yang disarankan

1. Update `AGENTS.md` + `docs/migration/README.md` (rencana → aturan).
2. Konstanta + tipe (`archive-status.ts`, `routes.ts`, `berkas-arsip-activity.ts` label).
3. Helper backend (`retention.ts`, `berkas-arsip-service.ts`, `read-model`, `page-format`) + test unit-nya.
4. Zod + API routes (`close`, `lifecycle`, `berkas/index`, `berkas/$id`) + test.
5. Navigasi + hapus route `/arsiparis/inaktif` + rename `/arsiparis/usul-musnah` → `/arsiparis/pembersihan` + route generation.
6. Halaman UI (`berkas/index`, `berkas/$id`, `CloseBerkasDialog`, `pembersihan/index`, `index` dashboard, `penambahan-arsip`, `klasifikasi`, `inbox`).
7. Komponen bersama (`StatusBadge`, `StatsBento`).
8. Sapu label sisa (`grep -rn "Jenis Pembayaran\|Inaktif\|Musnah\|Pengarsipan" src/`).
9. Jalankan `pnpm test`; perbaiki test.
10. Sinkronkan `docs/penjelasan-proyek.md`.

---

# RP-02 — Ekspor Satu Berkas Penuh ke ZIP

**Status:** `Draft` · **Terkait:** RP-07 (fondasi bersama — perakit ZIP, struktur folder, batas, `DAFTAR_ISI.txt`, dialog konfirmasi sudah dikunci di sana)

## Latar belakang

Kepala Sub Bagian Umum berkala perlu mengambil **seluruh soft file satu berkas** (per Nomor SPM) sekaligus — misalnya untuk keperluan tahunan, di mana proses lama adalah scan ulang seluruh berkas fisik. Aplikasi sudah menyimpan soft file, tetapi unduhan **masih satu per satu** (`preview`/`download` per lampiran per item). Dibutuhkan **satu tombol → satu `.zip`** berisi seluruh soft file dalam satu berkas. Apa yang dilakukan dengan zip itu (mis. mengunggah ke aplikasi arsip nasional) **manual, di luar sistem** — RP ini hanya menghasilkan file.

## Perubahan yang diminta (draft — perlu dirinci)

1. Endpoint terotorisasi mis. `GET /api/arsiparis/berkas/$id/export-zip` — hanya `KEPALA_SUB_BAGIAN_UMUM`, hanya berkas `CLOSED` (dan belum `DIMUSNAHKAN`).
2. Susun ZIP dari lampiran seluruh `berkas_arsip_item` (`WORKFLOW` dari `dokumen_transaksi.lampiran_urls`, `MANUAL` dari `manual_arsip_attachment.logical_path`), streaming, nama file di dalam ZIP = nama aman yang sudah dipakai preview/download.
3. Struktur folder di dalam ZIP: `[Nomor SPM]/[nama item]/[nama lampiran]` (perlu diputuskan).
4. Tombol "Ekspor ZIP" di `/arsiparis/berkas/$id` dan/atau baris "Berkas Tertutup".
5. Catat aktivitas `BERKAS_DIEKSPOR` (perlu evaluasi CHECK constraint `event_type` → kemungkinan butuh migrasi kecil, atau pakai event generik).
6. Setelah ini jalan, aktifkan penuh peringatan "belum pernah diekspor" di RP-01 langkah 8 (butuh menyimpan `terakhir_diekspor_at`).

## Peta file terdampak (perkiraan awal)

| File | Catatan |
|---|---|
| `src/routes/api/arsiparis/berkas/$id/export-zip.ts` | **baru** — handler streaming ZIP |
| `src/lib/archive/berkas-arsip-file-access.ts` | pakai ulang resolver lampiran folder-first yang aman |
| `src/lib/archive/berkas-arsip-zip.ts` | **baru** — perakit ZIP (pilih lib: `archiver` / `jszip` / manual `zip` stream) → butuh perubahan `package.json` |
| `src/lib/constants/routes.ts` | route API baru |
| `src/routes/arsiparis/berkas/$id.tsx`, `src/routes/arsiparis/berkas/index.tsx` | tombol "Ekspor ZIP" |
| `src/db/schema/arsip/berkas-arsip.ts` | (opsional) kolom `terakhir_diekspor_at` → migrasi |
| `src/lib/archive/berkas-arsip-activity.ts` + CHECK constraint | (opsional) event `BERKAS_DIEKSPOR` |
| `tests/unit/arsiparis/*` | test baru untuk perakitan ZIP & otorisasi |
| `AGENTS.md` | Storage/File Rules — ZIP export metadata-only atas file yang sah; tetap larang bocor path/root/token |

## Yang perlu diputuskan sebelum `Disetujui`

**Sudah diselesaikan di RP-07:** batas (500 dokumen + skip file > 250 MB), perilaku file fisik hilang (skip + `DAFTAR_ISI.txt`), struktur folder & penamaan (prefiks `YYYY-MM-DD_judul_id8`), library ZIP (`archiver`), dialog konfirmasi.

**Sisa khusus RP-02:**
- Folder induk berkas: `[Nomor SPM] - [Klasifikasi] / [YYYY-MM-DD_judul_id8] / [file]` (item MANUAL: `[Manual] [judul]_id8/`). Konfirmasi final saat plan.
- Apakah perlu `terakhir_diekspor_at` (memicu migrasi) — hanya bila peringatan "belum diekspor" RP-01 langkah 8 diaktifkan sebagai blok. Default: tidak.
- Event aktivitas `BERKAS_DIEKSPOR` vs event generik (CHECK constraint `event_type` → mungkin migrasi kecil).

---

# RP-03 — Aksi Cepat Beranda: Urutkan Prioritas dari yang Terlama

**Status:** `Draft`

## Latar belakang

Di beranda tiap role ada seksi **"Perlu Tindakan"** (komponen `DashboardSection` + `DashboardActionRow`) yang menampilkan **maksimal 3 baris** dokumen/berkas prioritas. Untuk **PPK**, **PPSPM**, dan **Kepala Sub Bagian Umum**, ketiga baris itu sekarang diambil dari **3 dokumen terbaru** — semua API inbox mengurutkan `ORDER BY created_at DESC`, lalu dashboard memanggil `.slice(0, 3)`.

Akibatnya dokumen **paling lama menunggu** (paling berisiko terlupa / kena deadline) justru tidak pernah tampil di aksi cepat. Yang diinginkan: 3 baris itu = **3 dokumen terlama** yang belum ditindaklanjuti.

## Perubahan yang diminta

1. Di seksi "Perlu Tindakan" dashboard **PPK / PPSPM / KSBU**, urutkan kandidat **naik** berdasarkan umur dokumen (`created_at`, fallback `tanggal`) sebelum `.slice(0, 3)` → yang terlama di atas.
2. Tetap maksimal 3 baris. Tampilkan meta umur bila memungkinkan (mis. "Menunggu 12 hari") agar prioritas terbaca.
3. Scope: **hanya widget aksi cepat di beranda.** Halaman inbox penuh (`/ppk/inbox`, dll.) tidak diubah di RP-03 (lihat *Yang tidak termasuk*).
4. Untuk KSBU: seksi bawah yang sekarang berjudul **"Daftar Dokumen Terbaru"** (`recentDocuments = classificationQueue.slice(0, 3)`) diubah jadi **"Perlu Diklasifikasikan (Terlama)"** dengan urutan naik.

## Pendekatan

**Sortir di sisi klien (dashboard), bukan ubah API.** Minimal, tidak menyentuh kontrak endpoint maupun halaman inbox. Bila nanti diinginkan inbox penuh juga default "terlama dulu", jadikan RP terpisah.

```ts
// pola pengganti .slice(0, 3)
const byOldest = (a, b) =>
  new Date(a.created_at ?? a.tanggal ?? 0).getTime() -
  new Date(b.created_at ?? b.tanggal ?? 0).getTime()
const actionItems = [...waiting, ...revision].sort(byOldest).slice(0, 3)
```

## Peta file terdampak

| File | Jenis | Yang berubah |
|---|---|---|
| `src/routes/ppk/index.tsx` | B | `const actionItems = [...waiting, ...revision].slice(0, 3)` (±ln 62) → `.sort(byOldest).slice(0, 3)`. Opsional: meta umur di `DashboardActionRow`. |
| `src/routes/ppspm/index.tsx` | B | `waiting.slice(0, 3)` (±ln 109) → `[...waiting].sort(byOldest).slice(0, 3)`. |
| `src/routes/arsiparis/index.tsx` | B/L | `recentDocuments = classificationQueue.slice(0, 3)` (±ln 104) → `.sort(byOldest).slice(0, 3)`; judul seksi (±ln 181) "Daftar Dokumen Terbaru" → "Perlu Diklasifikasikan (Terlama)"; deskripsi disesuaikan. |
| `src/components/dashboard/RoleDashboardPrimitives.tsx` | B/L *(opsional)* | Bila mau helper umur bersama (`formatWaitingAge`) atau prop `meta` sudah cukup — tidak wajib. |
| `src/lib/utils/format.ts` | B *(opsional)* | Helper `formatRelativeAge(date)` bila meta umur dipakai di beberapa tempat. |
| `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts` | T | Sesuaikan bila mengecek judul seksi / urutan baris. |
| `tests/unit/**` (dashboard PPK/PPSPM/KSBU bila ada) | T | Tambah kasus: diberi daftar tak berurut → 3 baris teratas adalah yang `created_at` paling lama. |

## Yang TIDAK termasuk

- Perubahan urutan/paginasi di halaman inbox penuh (`/ppk/inbox`, `/ppspm/inbox`, `/arsiparis/inbox`) dan API-nya.
- Perubahan `ORDER BY` di endpoint `*/inbox`.
- Dashboard **Pegawai**, **Admin**, **Penanggung Jawab Kinerja** (tidak punya antrean prioritas serupa).
- Badge/indikator "terlambat" berbasis SLA (bisa jadi RP terpisah).

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| `created_at` kosong pada sebagian data | Fallback ke `tanggal`, lalu `0` (dianggap paling lama → muncul di atas; aman untuk prioritas). |
| PPK menggabung `waiting` + `revision` dengan sumber tanggal beda makna | Untuk RP-03 cukup pakai `created_at` dokumen; bila perlu, urut `revision` pakai `updated_at`. Putuskan saat implementasi. |
| Test snapshot dashboard pecah | Update bareng kode. |

## Urutan kerja

1. Tambah helper `byOldest` (inline atau di `format.ts`).
2. Ubah 3 file dashboard (`ppk`, `ppspm`, `arsiparis`).
3. Sesuaikan judul/deskripsi seksi KSBU.
4. Tambah/perc-update test.
5. Cek manual: buat beberapa dokumen dengan `created_at` berbeda → pastikan 3 teratas = terlama.

---

# RP-04 — Bug: Dropdown "Pilih Jenis Permintaan" Tidak Bisa Dibuka

**Status:** `Selesai` · **Jenis:** bug

## Implementasi (jejak)

Opsi **B** dipakai (render kedua Select tetap ter-mount, sembunyikan lewat atribut HTML `hidden` alih-alih ternary yang meng-unmount):

- `src/components/dokumen/form/StepJenisPermintaan.tsx`: blok "Pilih Jenis Permintaan" & "Pilih Jenis Dokumen" sekarang selalu di-render, masing-masing `hidden={isNonMaterial}` / `hidden={!isNonMaterial}`. `handleToggleNonMaterial` di `aju.tsx` sudah mereset kedua id sebelumnya, jadi tidak ada kebocoran state.
- Audit `src/components/laporan/HierarchicalFilter.tsx` (langkah 5) menemukan pola sama: Select Kegiatan/Kategori/Detail dirender via `condition && <Select>`, rentan ter-unmount paksa saat popup-nya terbuka lalu field prasyaratnya (mis. Fungsi) berubah. Diperbaiki dengan pola yang sama (`hidden`, bukan unmount).
- Opsi A/C/D tidak dipakai — B sudah cukup, tanpa risiko upgrade paket.
- Test regresi berbasis rendering nyata (jsdom + interaksi popup Base UI) di-skip karena infra test proyek ini `environment: 'node'` tanpa `@testing-library/react` — menambahkannya di luar scope bug fix ini. Sebagai gantinya ditambahkan source-guard test yang menolak pola ternary-unmount muncul lagi: `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts` dan `tests/unit/laporan/hierarchical-filter-select-mount.test.ts`. **Repro manual lintas-browser tetap perlu dilakukan manusia** sebelum menutup RP ini sepenuhnya.

## Langkah reproduksi

1. Buka **Ajukan Dokumen** → sampai Langkah 3 (Karakteristik Dokumen + Jenis Permintaan/Dokumen).
2. Karakteristik = **Material**. Buka dropdown **"Pilih Jenis Permintaan"**, pilih satu nilai (atau buka lalu tutup).
3. Klik **Non-Material**.
4. Buka dropdown **"Pilih Jenis Dokumen"**.
5. Klik kembali ke **Material** → dropdown **"Pilih Jenis Permintaan"** **tidak merespons / tidak menampilkan daftar** (trigger seperti mati). Kadang seluruh area form ikut tidak bisa diklik.

## Dugaan akar masalah

- Komponen Select memakai **`@base-ui/react` `^1.3.0`** (`src/components/ui/select.tsx`).
- Di `src/components/dokumen/form/StepJenisPermintaan.tsx`, dua `<Select>` berada di **cabang terner yang saling eksklusif**: `isNonMaterial ? <Select JenisDokumen> : <Select JenisPermintaan>`.
- `handleToggleNonMaterial` di `aju.tsx` (±ln 365) **langsung** mem-flip `isNonMaterial`, sehingga Select yang sedang/baru dibuka **di-unmount seketika** (portal popup + scroll-lock/pointer-events guard milik Base UI belum sempat cleanup).
- Guard yang "nyangkut" itu membuat trigger berikutnya tidak bisa membuka popup, atau `pointer-events: none` tertinggal di `body`.
- Membuka Select kedua (Jenis Dokumen) menumpuk portal di atas state yang sudah rusak → gejala makin jelas saat balik ke Material.

**Perlu dipastikan saat repro:** apakah bug juga muncul tanpa menyentuh Non-Material (buka–tutup Jenis Permintaan berulang saja)? Untuk memisahkan "unmount saat terbuka" vs masalah lain. Cek versi patch `@base-ui/react` terbaru & changelog Select.

## Perubahan yang diminta (opsi — pilih 1 saat implementasi)

| Opsi | Inti | Catatan |
|---|---|---|
| **A. Tutup Select sebelum unmount** *(disarankan)* | Jadikan tiap Select `open`-controlled di `StepJenisPermintaan`. Saat tombol Material/Non-Material diklik, set `open=false` dulu, flip `isNonMaterial` di frame berikutnya (`requestAnimationFrame`/`setTimeout(0)`). | Membiarkan Base UI menjalankan cleanup close sebelum komponen hilang. |
| **B. Jangan unmount — sembunyikan** | Render kedua Select tetap ter-mount, satu disembunyikan (`hidden` / `display:none`) alih-alih terner. | Nilai sudah di-reset saat toggle, jadi aman. Paling sederhana & tahan banting. |
| **C. Upgrade `@base-ui/react`** | Jika bug cleanup Select sudah diperbaiki di rilis 1.3.x/1.x berikutnya. | Cek changelog; butuh izin perubahan `package.json` (`AGENTS.md`). |
| **D. Cleanup defensif** | `useEffect` saat `isNonMaterial` berubah: pulihkan `document.body.style.pointerEvents`, buang elemen backdrop Base UI yang tertinggal. | Stopgap; jangan jadi solusi akhir. |

Rekomendasi: **B** bila cukup (paling kecil risikonya), jika tidak **A**. **C** hanya kalau memang ada fix upstream.

## Peta file terdampak

| File | Jenis | Yang berubah |
|---|---|---|
| `src/components/dokumen/form/StepJenisPermintaan.tsx` | B | Lokasi perbaikan utama. Opsi B: render kedua blok, `hidden` pada yang non-aktif. Opsi A: state `open` per Select + tutup sebelum toggle. |
| `src/routes/pegawai/dokumen/aju.tsx` | B | `handleToggleNonMaterial` (±ln 365): koordinasikan "tutup Select dulu, baru flip" (opsi A). Opsi B mungkin tak perlu ubah file ini. |
| `src/components/ui/select.tsx` | B *(mungkin)* | Bila perbaikan sebaiknya di level wrapper: teruskan `open`/`onOpenChange`, atau setel prop Base UI agar tidak mengunci scroll/pointer saat tak perlu (`modal={false}` bila tersedia). |
| `package.json` / `pnpm-lock.yaml` | S *(opsi C saja)* | Naikkan `@base-ui/react`. Butuh izin perubahan paket. |
| `src/components/laporan/HierarchicalFilter.tsx` | B | **Audit** — juga punya Select yang dirender bersyarat; cek apakah rentan pola yang sama. |
| `src/routes/pegawai/dokumen/$id/edit.tsx`, `.../revisi.tsx` | — | Verifikasi: tidak memakai `StepJenisPermintaan` (metadata terkunci pasca-`COMPLETED`); kemungkinan tidak terdampak. |
| `tests/unit/**` | T | Test regresi urutan: buka Select A → toggle Non-Material → buka Select B → kembali → Select A masih bisa dibuka. (Base UI di jsdom bisa terbatas — sertakan checklist repro manual.) |
| `docs/` | — | Tidak ada; ini perbaikan bug internal. |

## Yang TIDAK termasuk

- Perombakan langkah form Ajukan Dokumen di luar perbaikan Select ini.
- Perubahan alur Material/Non-Material atau field yang dikumpulkan.
- Ganti pustaka Select secara menyeluruh.

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Opsi C (upgrade) membawa perubahan perilaku Select di seluruh app | Uji semua Select penting (ajukan, tutup berkas, master data, filter laporan) sebelum merge. |
| Opsi B menyisakan dua Select ter-mount → kebocoran state | Pastikan reset ID saat toggle sudah menyeluruh (sudah ada di `handleToggleNonMaterial`). |
| Bug ternyata bukan dari unmount-saat-terbuka | Selesaikan langkah "Perlu dipastikan saat repro" dulu sebelum memilih opsi. |

## Urutan kerja

1. Reproduksi & isolasi (dengan/tanpa menyentuh Non-Material; cek console error; cek `body` style setelah bug).
2. Cek changelog `@base-ui/react` untuk bug Select terkait.
3. Pilih opsi (B → A → C sesuai temuan).
4. Terapkan di `StepJenisPermintaan.tsx` (+ `aju.tsx` bila opsi A).
5. Audit `HierarchicalFilter.tsx` & Select bersyarat lain; terapkan pola aman yang sama bila perlu.
6. Test regresi + repro manual lintas-browser.

---

# RP-05 — Ekspor Massal Dokumen Terpilih (Terfilter) ke ZIP

**Status:** `Draft` · **Terkait:** RP-07 (fondasi bersama — perakit ZIP, struktur folder, batas 500 dokumen, `DAFTAR_ISI.txt`, dialog konfirmasi dikunci di sana), RP-02 (konsumen lain dari fondasi yang sama)

## Latar belakang

Tiap bulan pegawai perlu mengumpulkan dokumen kegiatannya (mis. periode 1 bulan terakhir) untuk keperluan laporan bulanan yang **mereka unggah manual ke kipApp** — aplikasi ini **tidak** terhubung ke kipApp. Sekarang file hanya bisa diunduh **satu lampiran per satu** dari halaman detail. Dibutuhkan: dari halaman daftar/laporan yang **sudah punya filter** (periode, kegiatan, fungsi, jenis/kategori/detail), satu tombol **"Ekspor Semua File (ZIP)"** yang membungkus seluruh lampiran dari dokumen yang lolos filter.

Karena **kelengkapan (lampiran) lengket ke satu dokumen/kegiatan**, di dalam zip **tiap dokumen jadi satu folder** berisi seluruh kelengkapannya — supaya tidak tercerai-berai.

## Perubahan yang diminta (draft — perlu dirinci)

1. Endpoint terotorisasi, mis. `POST /api/laporan/saya/export-zip` (dan analog untuk Laporan Kegiatan) menerima **daftar `dokumen_id`** hasil filter (atau parameter filter yang sama persis dengan yang dipakai halaman), lalu:
   - re-otorisasi per dokumen sesuai role (pegawai: hanya miliknya; Ketua Tim: kegiatan yang ia pimpin),
   - susun ZIP streaming dari `dokumen_transaksi.lampiran_urls` tiap dokumen lewat resolver file aman yang sudah ada,
   - **struktur folder:** `[nama/nomor dokumen]/[nama lampiran]` (nama dokumen di-sanitasi; hindari tabrakan nama antar-dokumen — prefiks tanggal/urutan bila perlu).
2. Tombol **"Ekspor Semua File (ZIP)"** di `/pegawai/laporan/saya` dan `/pegawai/laporan/kegiatan`, aktif mengikuti **baris yang sedang terlihat/terfilter** (`filtered`), dengan indikator jumlah dokumen & perkiraan berat bila memungkinkan.
3. Batas aman: maksimum jumlah dokumen / total ukuran per ekspor; bila lewat, minta user mempersempit filter.
4. Dokumen tanpa lampiran → dilewati (atau folder kosong + catatan di `manifest.txt` opsional).
5. Tidak menyimpan jejak di DB (cukup log aplikasi biasa) kecuali diputuskan lain.

## Peta file terdampak (perkiraan awal)

| File | Jenis | Catatan |
|---|---|---|
| `src/routes/api/laporan/saya.export-zip.ts` | **baru** | Handler ZIP untuk dokumen milik pegawai (terfilter). |
| `src/routes/api/laporan/kegiatan.export-zip.ts` | **baru** | Idem untuk dokumen kegiatan yang dipimpin Ketua Tim. |
| `src/lib/export/document-zip.ts` | **baru** | Perakit ZIP generik (dipakai bersama RP-02). Pilih lib (`archiver`/`jszip`) → **butuh perubahan `package.json`** (izin eksplisit). |
| `src/lib/archive/berkas-arsip-zip.ts` (RP-02) | B | Sebaiknya jadi tipis di atas `src/lib/export/document-zip.ts` agar satu implementasi. |
| `src/lib/storage/document-file-access.ts`, `src/lib/file-helpers.ts` | B | Pakai ulang resolver lampiran + penamaan aman per dokumen/role. |
| `src/lib/dokumen/queries.ts` | B | Query dokumen terfilter untuk sisi server (bila endpoint menerima parameter filter, bukan daftar id). |
| `src/routes/pegawai/laporan/saya.tsx` | L/B | Tombol "Ekspor Semua File (ZIP)"; kirim `filtered` (id) atau nilai filter aktif; state loading/limit. |
| `src/routes/pegawai/laporan/kegiatan.tsx` | L/B | Idem. |
| `src/lib/constants/routes.ts` | L | Route API baru. |
| `src/lib/schemas/` (baru mis. `export.ts`) | B | Zod untuk body ekspor (daftar id / filter + batas). |
| `package.json` / `pnpm-lock.yaml` | S | Dependensi ZIP (bersama RP-02). |
| `tests/unit/**` | T | Perakitan ZIP, struktur folder per-dokumen, otorisasi per-dokumen, batas ukuran. |
| `AGENTS.md` | Doc | Storage/File Rules — ekspor hanya atas file yang sah untuk role peminta; nama folder/berkas di-sanitasi; jangan bocorkan path fisik/logis/root/token; batas ukuran didokumentasikan. |
| `docs/penjelasan-proyek.md` | Doc | PB-6.4 sudah menyebut RP-05; sinkronkan saat `Selesai`. |

## Yang TIDAK termasuk

- Integrasi/kirim otomatis ke kipApp atau aplikasi manapun (lihat *Prinsip tetap*).
- Ekspor per berkas milik KSBU (itu **RP-02**).
- Ekspor isi/teks dokumen atau konversi format — hanya membungkus file apa adanya.
- Perubahan filter/laporan di luar penambahan tombol ekspor.
- Job latar / penjadwalan ekspor.

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| ZIP besar → memori/timeout server | Streaming (jangan buffer penuh); batas jumlah dokumen & total ukuran; minta user mempersempit filter. |
| Nama dokumen sama → folder tabrakan di ZIP | Prefiks urutan/tanggal, atau sisipkan potongan id pendek. |
| Otorisasi: pegawai menyisipkan id dokumen orang lain | Server **wajib** re-cek kepemilikan/role per dokumen, abaikan yang tidak berhak (jangan bocorkan keberadaannya). |
| Dependensi ZIP baru | Butuh izin perubahan paket (`AGENTS.md`); pilih lib kecil & terawat; pakai bersama RP-02. |
| File fisik hilang | Lewati + catat di `manifest.txt` opsional; jangan gagalkan seluruh ZIP. |

## Urutan kerja

1. Putuskan: endpoint terima **daftar id** (dari `filtered` klien) atau **parameter filter** (server query ulang). Rekomendasi: daftar id (klien sudah menghitung `filtered`), server tetap re-otorisasi.
2. Pilih & tambah lib ZIP (izin paket) → `src/lib/export/document-zip.ts`.
3. Endpoint `laporan/saya` + Zod + otorisasi per-dokumen + streaming.
4. Tombol di `saya.tsx` (loading, batas, jumlah).
5. Ulangi untuk `laporan/kegiatan`.
6. Selaraskan RP-02 agar memakai perakit yang sama.
7. Test + repro manual (isi zip rapi per folder dokumen).

---

# RP-07 — Fondasi Ekspor ZIP Bersama (RP-02 + RP-05)

**Status:** `Disetujui`
**Terkait:** RP-02 (konsumen), RP-05 (konsumen), RP-01 langkah 8 (`terakhir_diekspor_at` — di luar scope RP-07)

## Latar belakang

RP-02 (ekspor satu berkas) dan RP-05 (ekspor massal dokumen laporan terfilter) sama-sama butuh: merakit `.zip` **streaming** dari lampiran yang sudah divalidasi, penamaan file aman, batas ukuran, `DAFTAR_ISI.txt`, dan penanganan file fisik hilang. Supaya tidak ada dua implementasi ZIP yang berbeda, logika ini dikerjakan **sekali** sebagai `src/lib/export/document-zip.ts`; RP-02 dan RP-05 jadi lapisan tipis (endpoint + otorisasi + tombol) di atasnya. RP-07 mengunci keputusan yang sebelumnya berstatus "perlu dirinci" di RP-02 & RP-05.

## Perubahan yang diminta

1. **Modul baru `src/lib/export/document-zip.ts`** — perakit ZIP streaming generik.
   - Input: daftar entri `{ folderPath: string, files: Array<{ namaAman: string, logicalPath: string }> }` + opsi (`rootManifestLines?`).
   - Output: stream ZIP (Node `Readable` / web `ReadableStream`).
   - Tidak tahu-menahu soal role, filter, atau otorisasi — caller yang sudah menyaring & menyusun hierarki.
2. **Library: `archiver`** (streaming, tidak buffer penuh di memori). **Bukan** `jszip` (buffer di memori). Menambah dependensi → butuh **izin eksplisit** perubahan `package.json` (`AGENTS.md`).
3. **Struktur folder di dalam ZIP** (pola sama; RP-02 menambah satu level induk):
   - RP-05: `<folder dokumen>/<file kelengkapan>`
   - RP-02: `<nama berkas>/<folder dokumen>/<file kelengkapan>`
   - `<nama berkas>` = `nomor_spm` disanitasi + `" - "` + `klasifikasi_nama_snapshot`.
   - `<folder dokumen>` = `YYYY-MM-DD_<judul disanitasi>_<id 8-char>`. Prefiks tanggal + potongan id **wajib**: `dokumen_transaksi.judul` teks bebas tanpa unique constraint, dua dokumen bisa berjudul sama. Item MANUAL: `[Manual] <judul manual disanitasi>_<id 8-char>`.
   - `<file kelengkapan>` = hasil `buildFormalFilename()` yang sudah ada (`src/lib/file-helpers.ts`), konsisten dengan preview/download. Bila dua file dalam satu dokumen menghasilkan nama sama → suffix `" (2)"`, `" (3)"`.
4. **Batas per ekspor:**
   - **Primer:** maksimal **500 dokumen** per ZIP. Dicek server **sebelum** streaming dimulai (hitung `COUNT`, instan, tanpa IO). Lewat → tolak (HTTP 413) + pesan: "Filter menghasilkan N dokumen. Maksimal 500 per ekspor — persempit periode atau kegiatan."
   - **Sekunder:** file tunggal **> 250 MB dilewati**, dicatat di `DAFTAR_ISI.txt`.
   - Total byte **tidak dipatok keras** (butuh `stat` tiap file); dipantau lewat log aplikasi. Bila perlu, cap GB berbasis `stat` ditambah belakangan — di luar scope RP-07.
5. **File fisik hilang / tidak terbaca:** dilewati, **tidak** menggagalkan ZIP; dicatat di `DAFTAR_ISI.txt`.
6. **`DAFTAR_ISI.txt`** di root tiap ZIP — selalu ada. Isi: timestamp ekspor, identitas peminta (role), sumber (filter aktif untuk RP-05 / Nomor SPM untuk RP-02), daftar dokumen + lampiran yang masuk, daftar yang dilewati + alasan (file hilang / > 250 MB / dokumen tanpa lampiran).
7. **Dokumen tanpa lampiran:** dilewati (tidak membuat folder kosong); disebut di `DAFTAR_ISI.txt`.
8. **Dialog konfirmasi (klien)** sebelum ekspor dijalankan, pada RP-02 & RP-05: tampilkan jumlah dokumen yang akan diekspor + pengingat "mengikuti filter aktif" (RP-05); tombol `Batal` / `Ekspor Sekarang`. Bila jumlah > 500: dialog jadi pesan "persempit filter" tanpa tombol lanjut.
9. **Resolver lampiran** memakai path folder-first aman yang sudah ada — WORKFLOW lewat helper di `src/lib/storage/document-file-access.ts`, MANUAL lewat `manual_arsip_attachment.logical_path`. Output ZIP **tidak** memuat path fisik / root / token.

## Peta file terdampak

> Legenda: **L** = label · **B** = logika · **S** = skema/paket · **T** = test

| File | Jenis | Yang berubah |
|---|---|---|
| `src/lib/export/document-zip.ts` | **baru** · B | Perakit ZIP streaming + `DAFTAR_ISI.txt` + suffix anti-tabrakan + batas 500 / skip file > 250 MB. |
| `package.json` / `pnpm-lock.yaml` | S | Tambah `archiver` (+ `@types/archiver`). Butuh izin perubahan paket. |
| `src/lib/file-helpers.ts` | B | Pakai ulang `buildFormalFilename`; ekstrak helper sanitasi nama folder bila perlu. |
| `src/lib/storage/document-file-access.ts` | B | Ekspos resolver "logicalPath dari (dokumenId, lampiranIndex)" untuk perakit — tanpa lewat HTTP token. |
| `src/lib/archive/berkas-arsip-file-access.ts` | B | Idem untuk lampiran item berkas (WORKFLOW + MANUAL). |
| `tests/unit/export/document-zip.test.ts` | **baru** · T | Struktur folder; prefiks tanggal + id; anti-tabrakan; skip file hilang / > 250 MB; isi `DAFTAR_ISI.txt`; penolakan > 500 dokumen. |
| `AGENTS.md` | Doc | *Storage/File Rules* — ekspor ZIP hanya atas file sah untuk role peminta; nama disanitasi; jangan bocorkan path/root/token; batas didokumentasikan. |

## Yang TIDAK termasuk (non-scope RP-07)

- Endpoint & tombol UI konkret → **RP-02** dan **RP-05**.
- Otorisasi per dokumen / per berkas → tanggung jawab caller (RP-02/RP-05).
- Kolom `terakhir_diekspor_at` / jejak DB / event `BERKAS_DIEKSPOR` → khusus RP-02, opsional.
- Cap total-byte berbasis `stat` per file.
- Konversi / format ulang isi file — hanya membungkus apa adanya.
- Job latar / penjadwalan ekspor.
- Panggilan keluar ke sistem manapun (lihat *Prinsip tetap*).

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Tabrakan nama folder (`judul` teks bebas, tak unik) | Prefiks `YYYY-MM-DD_` + potongan id 8-char **wajib**; suffix `" (2)"` untuk file dalam satu dokumen. |
| ZIP besar → timeout gateway/proxy | Streaming (tak buffer penuh); cap 500 dokumen dicek sebelum stream; dialog konfirmasi mendorong filter periode. |
| Dependensi baru (`archiver`) | Izin paket eksplisit; lib kecil & terawat; dipakai bersama dua RP. |
| File fisik hilang di tengah rakit | Skip + catat di `DAFTAR_ISI.txt`; ZIP tetap terbentuk. |
| Perakit dipakai dua konteks (dokumen lepas vs berkas) | Kontrak generik `{ folderPath, files[] }`; caller menyusun hierarki. |
| Unduhan gagal di tengah | Cek batas & existence sebisa mungkin sebelum stream; `DAFTAR_ISI.txt` jadi penanda kelengkapan bagi penerima. |

## Urutan kerja

1. Izin + tambah `archiver` di `package.json`.
2. `src/lib/export/document-zip.ts` + `tests/unit/export/document-zip.test.ts` (struktur, anti-tabrakan, skip, `DAFTAR_ISI.txt`, batas 500).
3. Ekspos resolver `logicalPath` non-HTTP di `document-file-access.ts` + `berkas-arsip-file-access.ts`.
4. (RP-05) endpoint `laporan/saya` + `laporan/kegiatan` memakai perakit + Zod + otorisasi per-dokumen + dialog konfirmasi.
5. (RP-02) endpoint `berkas/$id/export-zip` memakai perakit + satu level folder induk + dialog konfirmasi.
6. Sinkronkan `AGENTS.md` *Storage/File Rules*.

---

# RP-06 — Bug: Ekstensi File Hilang Setelah Dokumen Masuk Berkas

**Status:** `Dikerjakan` · **Jenis:** bug
**Sumber:** dilaporkan pengguna 2026-09-05, alur "Penambahan Dokumen" di menu KSBU.

## Langkah reproduksi

1. Di menu KSBU → **Penambahan Dokumen**, isi kolom judul kelengkapan dokumen, lalu unggah file **PDF**.
2. **Preview langsung setelah unggah (masih PENDING)** → berhasil, tampil sebagai PDF.
3. Dokumen diproses masuk ke **berkas** (jadi file **FORMAL** — lihat RP-01 lifecycle: Terbuka → Tertutup).
4. Buka kembali kelengkapan dokumen tsb dari berkas (`/arsiparis/berkas/$id`) → coba **Preview**.
5. **Hasil:** gagal, muncul pesan *"Preview hanya tersedia untuk file PDF."* — padahal file aslinya PDF dan tidak pernah diganti. Badge status lampiran tetap menampilkan **tercentang/berhasil** (indikator "file sudah ada"), sehingga tampilannya kontradiktif: badge bilang file ada & valid, tapi preview menolak.
6. **Download** kelengkapan yang sama → berhasil, dan file yang terunduh **memang PDF valid**. Jadi isi file di storage tidak rusak — masalahnya murni di deteksi format sisi klien untuk preview.

## Akar masalah (dikonfirmasi dari kode, bukan lagi dugaan)

Ada **dua jalur kode terpisah** yang sama-sama menentukan nama tampilan sebuah lampiran MANUAL (dipakai KSBU), dan cuma satu yang benar:

1. **Jalur download/streaming** (`src/lib/manual-arsip.ts` — `resolveManualArsipAttachmentExtension` + `createManualArsipAttachmentFileResponse`) — mengambil ekstensi dari `manual_arsip_attachment.content_type` (dicocokkan ke daftar ekstensi yang diizinkan) dengan `original_filename` sebagai pengecekan silang, **bukan** dari `judul_lampiran`. **Ini yang dipakai endpoint download** → makanya download selalu benar jadi `.pdf`. (Koreksi: draf awal RP-06 ini sempat salah menyebut sumbernya `logical_path` — sudah diperbaiki setelah investigasi iterasi 2 di bawah.)
2. **Jalur read-model / daftar lampiran** (`src/lib/archive/berkas-arsip-attachment-names.ts` — `resolveManualAttachmentNames`) — dipakai untuk membangun `previewTitle` yang ditampilkan di `/arsiparis/berkas/$id`. Fungsi ini **sama sekali tidak menerima `logical_path`** — sebelumnya cuma menerima `{ judul_lampiran, original_filename }`. Ia memprioritaskan `judul_lampiran` (judul yang diketik user, mis. "Bukti Manual") sebagai `previewTitle` **apa adanya, tanpa ekstensi**, karena memang tidak punya akses ke path fisik untuk tahu ekstensinya.

Di `src/routes/arsiparis/berkas/$id.tsx` (±ln 1776), gate PDF-only untuk preview adalah:
```ts
isPdfLikeFilename(title) || isPdfLikeFilename(downloadHref) || isPdfLikeFilename(href)
```
`title` = `previewTitle` dari jalur (2) di atas — untuk item MANUAL dengan judul kelengkapan diisi user, nilainya seperti `"Bukti Manual"` (tanpa `.pdf`). `downloadHref`/`href` adalah URL API berbasis index (`/api/arsiparis/berkas/{id}/item/{key}/lampiran/{idx}/preview`), juga tidak mengandung ekstensi. Ketiga cek gagal → cabang PDF-only aktif → **preview ditolak walau file aslinya PDF**.

Ini persis cocok dengan laporan: masalah muncul **khusus setelah "judul kelengkapan dokumen" diisi** ("saat saya buat kolom judul kelengkapan dokumen... ia bisa") — karena `judul_lampiran` yang diisi user itulah yang dipakai sebagai `previewTitle` tanpa ekstensi. Sebelum masuk berkas (masih di halaman upload/preview awal), preview memakai jalur lain (fetch blob asli via signed URL, bukan gate ekstensi nama file) sehingga tidak kena bug ini — cocok dengan langkah 2 di reproduksi.

Sudah dikonfirmasi juga oleh test lama yang (tanpa sadar) mendokumentasikan bug ini: `tests/unit/arsiparis/berkas-arsip-attachment-names.test.ts` sebelumnya meng-assert `resolveManualAttachmentNames({ judul_lampiran: 'Bukti Manual', original_filename: 'manual.pdf' })` menghasilkan `previewTitle: 'Bukti Manual'` (tanpa ekstensi) — padahal `original_filename` jelas `.pdf`.

## Perbaikan yang diterapkan

### Iterasi 1 — Preview PDF-nya sudah bisa terbuka

Menambahkan info ekstensi ke jalur read-model MANUAL supaya `resolveManualAttachmentNames` tidak lagi mengembalikan `previewTitle` tanpa ekstensi, sama seperti yang sudah dilakukan jalur WORKFLOW (`resolveWorkflowAttachmentNamesFromEntry` sudah punya `withSafeExtension`).

### Iterasi 2 — nama file preview vs download beda (ditemukan setelah iterasi 1 diverifikasi user)

Setelah iterasi 1, preview PDF sudah bisa terbuka, tapi user melaporkan **nama file yang tampil di preview berbeda dari nama file hasil download** — preview cuma menampilkan judul kelengkapan dokumen apa adanya (mis. `"Bukti Manual.pdf"`), sedangkan download menghasilkan nama formal lengkap (mis. `"Bukti_Manual_Dokumen_Manual_Pengadaan_2026-05-21.pdf"`).

**Akar masalah lanjutan:** ternyata ada **jalur penamaan ketiga**. Nama file formal untuk lampiran MANUAL yang sesungguhnya dipakai endpoint download/preview (Content-Disposition) dibangun oleh `resolveManualArsipAttachmentPolicyFilename()` di `src/lib/manual-arsip.ts` — sebuah implementasi privat (tidak diekspor) dengan pola `"{judul_lampiran}_{nama_arsip_manual}_{kategori}_{tanggal}.{ext}"`. Iterasi 1 hanya menambahkan ekstensi ke `previewTitle`, tapi tidak menyamakan formatnya dengan builder asli ini — sehingga preview & download tetap punya nama berbeda meski sama-sama sudah berekstensi benar.

**Perbaikan:** mengekstrak logika `resolveManualArsipAttachmentPolicyFilename` dari `manual-arsip.ts` menjadi modul murni bersama baru — `src/lib/archive/manual-arsip-attachment-filename.ts` (`buildManualArsipAttachmentFilename`) — lalu dipakai oleh **kedua** jalur: `manual-arsip.ts` (download/preview response yang sebenarnya) dan `berkas-arsip-attachment-names.ts` (read-model yang memberi nama ke UI daftar/preview di `/arsiparis/berkas/$id`). Ini menutup celah struktural yang berulang kali jadi sumber bug (tiga implementasi penamaan berbeda untuk hal yang sama) dengan satu sumber kebenaran tunggal.

| File | Perubahan |
|---|---|
| `src/lib/archive/manual-arsip-attachment-filename.ts` | **Baru.** `buildManualArsipAttachmentFilename(attachment, document)` — logika penamaan formal (segmen judul + nama arsip + kategori + tanggal, resolusi ekstensi dari `content_type`/`original_filename`, truncation) dipindah verbatim dari `manual-arsip.ts`. Modul murni, tanpa import DB/auth. |
| `src/lib/manual-arsip.ts` | `resolveManualArsipAttachmentPolicyFilename` sekarang tinggal memanggil `buildManualArsipAttachmentFilename(reference.attachment, reference)`. 5 fungsi privat + 6 konstanta yang duplikat (`sanitizeFilenameSegment`, `resolveManualArsipAttachmentExtension`, dst.) dihapus dari file ini karena sudah pindah ke modul bersama. Import `node:path` & `DOCUMENT_UPLOAD_EXTENSIONS_BY_MIME_TYPE` yang jadi tidak terpakai ikut dihapus. **Perilaku endpoint download/preview tidak berubah** (diverifikasi: 84 test di `manual-arsip-route.test.ts` tetap hijau tanpa diubah). |
| `src/lib/archive/berkas-arsip-read-model.ts` | `ManualAttachmentNameReadRow` field `logical_path` (dari iterasi 1) diganti `content_type: string \| null`; query `listManualAttachmentsByManualArsipIds` select `content_type` alih-alih `logical_path`. `getAttachmentNames` sekarang meneruskan konteks dokumen manual (`manual_nama`, `manual_date`, `manual_category_name` dari `BerkasItemSourceReadRow`, sudah tersedia sebelumnya) ke `resolveManualAttachmentNames`. |
| `src/lib/archive/berkas-arsip-attachment-names.ts` | `ManualAttachmentNamingRow` field `logical_path` diganti `content_type: string \| null` (wajib, bukan opsional — cocok kolom `NOT NULL` di DB). Tambah `ManualAttachmentNamingDocument`. `resolveManualAttachmentNames(row, document)` sekarang mengambil parameter kedua dan memanggil `buildManualArsipAttachmentFilename(row, document)`, lalu hasilnya disaring lewat `sanitizeBerkasAttachmentFilename` (guard nama sensitif tetap berlaku). |
| `tests/unit/arsiparis/berkas-arsip-attachment-names.test.ts` | 3 test manual diperbarui: nama formal lengkap saat metadata lengkap, fallback ke segmen generik (`Arsip`/`Kategori`/`Tanggal`) saat metadata dokumen manual kosong, dan ekstensi sengaja dikosongkan (bukan ditebak) saat `content_type` & `original_filename` sama-sama tidak diketahui. |
| `tests/unit/arsiparis/berkas-arsip-read-model.test.ts` | Fixture `manualAttachments` tambah `content_type: 'application/pdf'`; ekspektasi `attachments[0].previewTitle`/`downloadFilename` untuk item manual diperbarui jadi nama formal lengkap `"Bukti_Manual_Dokumen_Manual_Pengadaan_2026-05-21.pdf"` — **sekarang identik dengan pola nama yang dipakai endpoint download**. |

### Iterasi 3 — ekspor ZIP berkas KSBU: file MANUAL keluar tanpa ekstensi (ditemukan setelah iterasi 2 diverifikasi user)

Setelah iterasi 2, nama di preview & download sudah identik. User lalu melaporkan: **ekspor ZIP berkas** (RP-02, tombol "Ekspor ZIP" di `/arsiparis/berkas/$id`) menghasilkan file dengan "format tidak jelas" — **khusus untuk dokumen yang masuk lewat Penambahan Dokumen KSBU (MANUAL)**; dokumen WORKFLOW di ZIP yang sama aman. Padahal isi file yang diunggah tetap PDF.

**Akar masalah:** ternyata ada **jalur penamaan keempat**, terpisah dari tiga yang sudah dibenahi di iterasi 1-2. Resolver untuk ekspor ZIP (`resolveManualItemAttachmentsForExport` di `src/lib/archive/berkas-arsip-file-access.ts`, dipakai `resolveBerkasArsipItemAttachments` → endpoint `export-zip.ts`) punya query `getManualAttachmentsForItem` sendiri yang **hanya select `logicalPath` + `judulLampiran`** dari DB — tanpa `content_type`, `original_filename`, atau metadata arsip manual (`nama`/`tanggal`/`category`) — lalu langsung memakai `judulLampiran` mentah sebagai `namaAman` (nama file di dalam ZIP), sama seperti bug awal RP-06 tapi di lokasi berbeda: **tanpa ekstensi sama sekali**. Karena file di dalam ZIP tidak berekstensi, Windows/aplikasi lain tidak tahu itu PDF — walau bytes isinya tetap PDF valid — sehingga tampak "format tidak jelas"/tidak bisa dibuka langsung. Ini persis kontras dengan WORKFLOW di ZIP yang sama, yang sudah lebih dulu benar (`resolveWorkflowItemAttachmentsForExport` memakai `resolveWorkflowAttachmentReference(...).downloadFilename`, formal & berekstensi) — cocok dengan laporan "dokumen lain aman".

Sudah dikonfirmasi juga oleh test yang ada: `tests/unit/arsiparis/berkas-arsip-file-access-export.test.ts` sebelumnya meng-assert `namaAman: 'Lampiran Satu'` (tanpa ekstensi) untuk item MANUAL, persis di sebelah test WORKFLOW yang sudah benar meng-assert nama formal berekstensi — pola yang sama seperti test lama iterasi 1 yang tanpa sadar mendokumentasikan bug.

**Perbaikan:** `getManualAttachmentsForItem` sekarang JOIN ke `manual_arsip` + `manual_arsip_category` dan ikut select `original_filename`, `content_type`, `manual_nama`/`tanggal`/`category_nama`; `resolveManualItemAttachmentsForExport` memakai **modul bersama yang sama** dari iterasi 2 (`buildManualArsipAttachmentFilename`, lewat `sanitizeBerkasAttachmentFilename`) untuk membangun `namaAman` — sehingga nama file di dalam ZIP sekarang identik dengan nama di preview/download.

| File | Perubahan |
|---|---|
| `src/lib/archive/berkas-arsip-file-access.ts` | `BerkasArsipManualAttachmentExportRow` tambah `originalFilename`, `contentType`, `manualNama`, `manualTanggal`, `categoryNama`. `getManualAttachmentsForItem`: `innerJoin(manualArsip)` + `leftJoin(manualArsipCategory)`, select field baru. `resolveManualItemAttachmentsForExport`: `namaAman` dibangun lewat `buildManualArsipAttachmentFilename(...)` (impor dari modul bersama iterasi 2) + `sanitizeBerkasAttachmentFilename`, fallback ke `judulLampiran` mentah bila hasilnya kosong. |
| `tests/unit/arsiparis/berkas-arsip-file-access-export.test.ts` | Test MANUAL diperbarui: fixture tambah `originalFilename`/`contentType`/`manualNama`/`manualTanggal`/`categoryNama`; ekspektasi `namaAman` jadi nama formal berekstensi (mis. `"Lampiran_Satu_Dokumen_Manual_Pengadaan_2026-05-30.pdf"`), sejajar dengan test WORKFLOW di file yang sama. |
| `tests/unit/arsiparis/berkas-arsip-file-access.test.ts` | Fixture `getManualAttachmentsForItem` disesuaikan dengan field baru (nilai default `null`, tidak ada assertion `namaAman` di file ini — hanya perlu tetap memenuhi tipe repository). |

## Yang TIDAK termasuk

- Perubahan alur unggah/preview untuk file non-PDF (docx/xlsx/gambar) — fokus RP-06 pada PDF sesuai laporan; ekstensi & nama non-PDF ikut terbawa otomatis oleh perbaikan yang sama (bukan gate khusus PDF), tapi tidak diuji eksplisit di luar test yang sudah ditambahkan.
- Menyamakan lagi pola nama formal WORKFLOW (`buildDokumenFilename`: `{kelengkapan}_{leaf}_{kegiatan}_{tanggal}.ext`) dengan pola MANUAL (`{judul}_{nama}_{kategori}_{tanggal}.ext`) — keduanya sudah konsisten *secara internal* (preview = download = ZIP di masing-masing jalur), hanya polanya berbeda antar WORKFLOW vs MANUAL. Menyeragamkan dua pola ini lintas jenis sumber di luar scope RP-06.
- RP-05 (ekspor ZIP laporan pegawai) — hanya menyentuh dokumen WORKFLOW (`dokumen_transaksi`), tidak pernah memuat lampiran MANUAL/KSBU, jadi tidak terdampak bug iterasi 3 maupun perbaikannya (dicek: `src/lib/export/laporan-zip-entries.ts` tidak menyentuh `manual_arsip*` sama sekali).

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Ekstraksi ke modul bersama diam-diam mengubah perilaku download yang sudah berjalan | Logika dipindah verbatim (bukan ditulis ulang); 84 test `manual-arsip-route.test.ts` yang meng-assert Content-Disposition/filename download dijalankan ulang tanpa diubah dan tetap hijau. |
| Kolom `manual_arsip_attachment.content_type`/`original_filename` untuk data lama (dev/seed) mungkin kosong/tidak dikenali | `buildManualArsipAttachmentFilename` sudah menangani: `content_type`/`original_filename` kosong → ekstensi **sengaja dikosongkan** (bukan ditebak `.pdf` secara serampangan) — sama seperti perilaku asli di `manual-arsip.ts` sebelum refactor. |
| Test lama yang di-assert ulang mungkin menyembunyikan regresi lain | Test baru mencakup kasus nama formal lengkap, fallback segmen generik, dan ekstensi sengaja kosong — cakupan lebih luas dari test asli sebelum RP-06. |
| Mungkin masih ada jalur penamaan lampiran MANUAL kelima yang belum ditemukan (pola berulang di RP-06: 4 lokasi berbeda ditemukan satu per satu lewat laporan user) | Sebelum menandai `Selesai`, grep menyeluruh `judulLampiran`/`judul_lampiran` dipakai langsung sebagai nama file (tanpa lewat `buildManualArsipAttachmentFilename`) di seluruh `src/` — lihat langkah "Sisa pekerjaan". |

## Sisa pekerjaan sebelum `Selesai`

1. **Jalankan test suite penuh** (`pnpm test`) — subset yang relevan (`berkas-arsip-attachment-names.test.ts`, `berkas-arsip-read-model.test.ts`, `berkas-arsip-file-access.test.ts`, `berkas-arsip-file-access-export.test.ts`, `berkas-export-zip.test.ts`, `manual-arsip-route.test.ts`, plus seluruh `tests/unit/arsiparis/` & `tests/unit/storage/`) sudah dijalankan di sesi ini dan hijau (583 test); jalankan suite lengkap sekali lagi untuk memastikan tidak ada dampak tak terduga di file lain.
2. ~~Audit menyeluruh~~ **Sudah dilakukan** (mengingat pola berulang 4x di RP-06 ini): `grep -rn "judulLampiran\|judul_lampiran" src/` dijalankan di sesi ini. Satu pemakaian lain sebagai label ditemukan di `src/routes/arsiparis/penambahan-arsip.tsx` (±ln 594, 798, halaman "Daftar Manual Arsip" — beda dari `/arsiparis/berkas/$id`) — **aman**: `judul_lampiran` di situ cuma jadi teks judul modal preview, sedangkan gate PDF-nya sudah benar pakai `attachment.content_type` langsung (±ln 597), bukan parsing ekstensi dari nama file. Tidak ada lokasi kelima yang perlu diperbaiki.
3. **Verifikasi manual**: unggah PDF di Penambahan Dokumen (KSBU) dengan judul kelengkapan diisi → tutup ke berkas → (a) Preview harus tampil PDF dengan nama sama seperti Download; (b) klik "Ekspor ZIP" di halaman berkas tsb, ekstrak hasil ZIP-nya, dan pastikan file lampiran MANUAL di dalamnya terbuka sebagai PDF dengan nama formal berekstensi `.pdf` — bukan lagi judul kelengkapan polos tanpa ekstensi.
4. Setelah terverifikasi, ubah status jadi `Selesai` dan pindahkan ringkasan singkat ke `docs/penjelasan-proyek.md` (jejak bug + fix), sesuai konvensi di kepala dokumen ini.
