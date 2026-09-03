# Research — RP-01 De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

> Input spec: `docs/rencana-perubahan.md` bagian **RP-01** (status `Disetujui`).
> Rujukan: `docs/penjelasan-proyek.md` **PB-6** (framing sudah diperbarui), `AGENTS.md`
> (Arsip Lifecycle, Status Berkas, Behavioral Rules 5/5A, Storage And File Rules,
> Route And Ownership Map), `docs/migration/README.md`.

Tanggal riset: 2026-09-04. Branch: `ui/prototype-redesign-v1`.

---

## 1. Ringkasan orientasi

RP-01 adalah perubahan **label + logika transisi**, **tanpa migrasi DB**. Tidak ada
dependensi baru, tidak ada perubahan `package.json`. Satu-satunya file "protected"
yang boleh disentuh adalah `src/routeTree.gen.ts`, dan hanya lewat generator resmi
(bukan edit manual) — RP-01 mengizinkan ini secara eksplisit karena ada 1 route yang
dihapus (`/arsiparis/inaktif`) dan 1 route yang di-rename
(`/arsiparis/usul-musnah` → `/arsiparis/pembersihan`).

Invariant `AGENTS.md` yang mengikat plan ini:
- **"Update docs before behavior changes"** → `AGENTS.md` + `docs/migration/README.md`
  disinkronkan sebagai langkah **pertama**, sebelum kode.
- **"No magic strings"** → route pakai `src/lib/constants/routes.ts`, status pakai
  konstanta di `src/lib/constants/archive-status.ts`.
- **"Zod at every boundary"** → schema di `src/lib/schemas/` diubah bersamaan handler.
- **`routeTree.gen.ts` hanya via route generation** → dijadikan langkah tersendiri.
- **Aplikasi internal & mandiri** → tidak ada panggilan keluar; RP-01 memang tak
  menambah apa pun ke arah itu.

---

## 2. Peta nilai internal vs label (kondisi kode sekarang)

### `src/lib/constants/archive-status.ts` (45 baris)
- `ARCHIVE_STATUS_VALUES = ['AKTIF','INAKTIF','USUL_MUSNAH','DIMUSNAHKAN']` — dipakai
  oleh Zod (`BERKAS_ARCHIVE_STATUS_VALUES`) **dan** DB CHECK constraint
  `berkas_arsip_status_arsip_check`. **Harus dibiarkan utuh** (target tanpa migrasi).
- Tidak ada helper "resting status". RP-01 minta menambah mis.
  `BERKAS_RESTING_STATUS = 'AKTIF'` + komentar "INAKTIF deprecated (RP-01)".
- `BERKAS_STATUS_VALUES = ['OPEN','CLOSED']` — tidak berubah.

### `src/db/schema/arsip/berkas-arsip.ts`
CHECK constraint yang relevan (semua **dibiarkan**, nilai lama harmless):
- `berkas_arsip_status_arsip_check`: `status_arsip is null or in ('AKTIF','INAKTIF','USUL_MUSNAH','DIMUSNAHKAN')`.
- `berkas_arsip_open_status_arsip_null_check`: `status_berkas <> 'OPEN' or status_arsip is null`.
  → `cancel_proposal` (`USUL_MUSNAH → AKTIF`) aman (berkas tetap `CLOSED`).
- `berkas_arsip_closed_metadata_check`: OPEN ⇒ `closed_at/closed_by` null; CLOSED ⇒
  keduanya non-null. **Tidak ada** CHECK yang memaksa `retensi_inaktif` /
  `masa_inaktif_berakhir` non-null → aman dibiarkan `null`.
- `berkas_arsip_activity_event_type_check`: memuat 8 nilai
  (`BERKAS_DIBUKA`, `DOKUMEN_PERSETUJUAN_DIKLASIFIKASIKAN`, `DOKUMEN_MANUAL_DITAMBAHKAN`,
  `BERKAS_DITUTUP`, `METADATA_ARSIP_AKTIF_DIPERBARUI`, `BERKAS_DIPINDAHKAN_KE_INAKTIF`,
  `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH`, `BERKAS_DIMUSNAHKAN`).
  **Tidak ada nilai untuk "batalkan usulan".** Menambah nilai baru = migrasi.
- Kolom warisan: `retensiInaktif` (`text`, nullable), `masaInaktifBerakhir` (`date`,
  nullable). Tetap ada; hanya berhenti diisi.

### `src/lib/archive/berkas-arsip-activity.ts` (37 baris)
- `BERKAS_ACTIVITY_EVENT_TYPES` = mirror dari CHECK constraint DB. **JANGAN diubah.**
- `BERKAS_ACTIVITY_EVENT_LABELS` = hanya string tampilan → **inilah yang di-relabel**:
  - `BERKAS_DIPINDAHKAN_KE_INAKTIF` → jadi tidak terpakai (biarkan label apa adanya
    atau tandai deprecated).
  - `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH` → `'Berkas diusulkan untuk pembersihan'`.
  - `BERKAS_DIMUSNAHKAN` → `'File berkas dibersihkan'`.

---

## 3. Lifecycle backend — di mana logikanya

### `src/lib/archive/berkas-arsip-service.ts` (1026 baris)
- **Tipe aksi** (`BerkasArchiveLifecycleAction`, ±ln 138):
  `'mark_inactive' | 'propose_destruction' | 'approve_destruction'`.
- **`nextStatusForBerkasLifecycleAction`** (±ln 891): tabel `allowed`:
  ```
  mark_inactive:       { AKTIF -> INAKTIF }
  propose_destruction: { INAKTIF -> USUL_MUSNAH }
  approve_destruction: { USUL_MUSNAH -> DIMUSNAHKAN }
  ```
  Target RP-01:
  ```
  propose_destruction: { AKTIF -> USUL_MUSNAH }        # langsung, tanpa INAKTIF
  approve_destruction: { USUL_MUSNAH -> DIMUSNAHKAN }  # tetap
  cancel_proposal:     { USUL_MUSNAH -> AKTIF }        # BARU
  # mark_inactive: dihapus (atau no-op yang menolak)
  ```
- **`eventTypeForBerkasLifecycleStatus`** (±ln 956): `switch` **atas status tujuan**.
  `AKTIF` → `'BERKAS_DITUTUP'`. ⚠️ Kalau `cancel_proposal` menuju `AKTIF` dan tetap
  memakai fungsi ini, log aktivitasnya jadi **"Berkas ditutup"** — salah makna.
  → Implementasi harus **action-aware**: buat cabang khusus untuk `cancel_proposal`
  yang memetakan ke event **yang sudah ada di CHECK** (rekomendasi:
  `METADATA_ARSIP_AKTIF_DIPERBARUI`). Ini **interview Q2**.
- **`transitionBerkasArchiveStatus`** (±ln 415): guard `statusBerkas === 'CLOSED'` +
  `statusArsip` non-null, panggil `nextStatusForBerkasLifecycleAction`, update, lalu
  `appendBerkasActivity({ eventType: eventTypeForBerkasLifecycleStatus(next) })`.
  Titik sisip untuk cabang `cancel_proposal`.
- **`closeBerkasArsip`** (±ln 368) + **`buildCloseBerkasPlan`** (±ln 542): sekarang
  memakai `calculateManualArchiveRetentionDates({ retensiAktif, retensiInaktif })`
  (butuh **dua** label). Target: satu field. `appendBerkasActivity('BERKAS_DITUTUP')`
  snapshot masih menulis `retensi_inaktif` + `masa_inaktif_berakhir` (±ln 406-408) →
  isi `null`.
- **`updateActiveBerkasMetadata`** (±ln 465) + **`buildActiveBerkasMetadataPlan`**
  (±ln 512): jalur edit metadata `CLOSED/AKTIF`. Juga memakai retensi ganda
  (±ln 526-530). Harus ikut disederhanakan agar konsisten dengan form.
- `CloseBerkasPlan` / `ActiveBerkasMetadataPlan` masih membawa field
  `retensiInaktif` + `masaInaktifBerakhir` (±ln 152-165) → sederhanakan atau isi
  konstanta `null`.

### `src/lib/archive/retention.ts` (85 baris)
- `MANUAL_ARCHIVE_RETENTION_LABELS = ['1 Tahun','3 Tahun','5 Tahun','10 Tahun','Permanen']`
  — dipakai ulang untuk dropdown "Masa Simpan Minimal".
- `calculateManualArchiveRetentionDates({ tanggalDiarsipkan, retensiAktif, retensiInaktif })`
  → `{ masaAktifBerakhir, masaInaktifBerakhir }`. Butuh `calculateBerkasDueDate`
  (satu label) yang menghitung `tanggal_jatuh_tempo = closed_at + masa_simpan`
  (sentinel `9999-12-31` untuk "Permanen").
- `PERMANENT_RETENTION_SENTINEL_DATE`, `addCalendarYears`, `isDateOnlyString` bisa
  dipakai ulang.

### `src/lib/archive/berkas-arsip-page-format.ts` (137 baris)
- `formatBerkasArchiveStatusLabel` (±ln 25): `AKTIF→'Aktif'`, `INAKTIF→'Inaktif'`,
  `USUL_MUSNAH→'Usul musnah'`, `DIMUSNAHKAN→'Dimusnahkan'`. Target: `AKTIF→'Tersimpan'`,
  `USUL_MUSNAH→'Usul Pembersihan'`, `DIMUSNAHKAN→'File Dibersihkan'`, hapus cabang
  `INAKTIF`.
- `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE = 'MUSNAHKAN DATA FILE'` (±ln 16) →
  `'BERSIHKAN FILE BERKAS'`. **Dipakai juga oleh** `lifecycle.ts` (schema Zod
  `z.literal(...)`) dan UI dialog.
- `BerkasLifecycleActionView.action` type (±ln 8): union `mark_inactive |
  propose_destruction | approve_destruction` → tambah `cancel_proposal`, buang
  `mark_inactive`.
- `resolveBerkasLifecycleAction` (±ln 40): sekarang branch per `statusArsip`
  (`AKTIF`→"Jadikan Inaktif", `INAKTIF`→"Usulkan Musnah", `USUL_MUSNAH`→"Musnahkan
  Data"). Target: `AKTIF`→"Usulkan Pembersihan", `USUL_MUSNAH`→ dua aksi ("Bersihkan
  File" + "Batalkan Usulan"). Return type mungkin perlu jadi array / atau fungsi
  terpisah untuk aksi sekunder.

### `src/routes/api/arsiparis/berkas/$id/lifecycle.ts` (102 baris)
- `nonDestructiveLifecycleBodySchema`: `action: z.enum(['mark_inactive','propose_destruction'])`
  → jadi `z.enum(['propose_destruction','cancel_proposal'])`.
- `approveDestructionLifecycleBodySchema`: `confirmation: z.literal(BERKAS_DESTRUCTION_CONFIRMATION_PHRASE)`
  → ikut frasa baru otomatis (import konstanta).
- `discriminatedUnion('action', [...])` — struktur tetap.
- `executePhysicalDeletionAfterLifecycle` hanya dipanggil untuk `approve_destruction`
  → tidak berubah.

### `src/routes/api/arsiparis/berkas/$id/close.ts` (47 baris)
- Tipis: parse `closeBerkasMetadataSchema`, panggil `closeBerkasArsip`. Perubahan
  otomatis mengikuti schema + service.

### `src/lib/schemas/berkas-arsip.ts` (63 baris)
- `openBerkasRequestSchema`: `klasifikasi_id: z.uuid('Jenis pembayaran tidak valid')`
  → `'Cara pembayaran tidak valid'`.
- `closeBerkasMetadataSchema` (±ln 45): field `nomor_spm` + `retensi_aktif` +
  `retensi_inaktif` + `closed_at?`, `.strict().transform(...)`. Target: buang
  `retensi_inaktif`; `retensi_aktif` dipertahankan sebagai key (pesan → "Masa Simpan
  Minimal tidak valid") atau di-alias ke `masa_simpan`. `.strict()` berarti
  mengirim `retensi_inaktif` akan **ditolak** setelah dihapus → front-end wajib
  berhenti mengirimnya bersamaan.

### `src/lib/archive/berkas-arsip-read-model.ts` (859 baris)
- DTO list & detail (`BerkasArsipFolderListItemDto`) sudah membawa `closed_at`,
  `masa_aktif_berakhir`, `retensi_aktif`, `retensi_inaktif`,
  `masa_inaktif_berakhir`, `status_arsip`.
- **Belum ada** `umurBerkas` / `jatuhTempo` / `tanggalJatuhTempo`. Perlu ditambah,
  dihitung dari `closed_at` + `masa_aktif_berakhir` (yang kini = tanggal jatuh
  tempo). Read-model = tempat "dihitung saat dibaca" (tanpa scheduler).
- `status_arsip_counts` (±ln 84, 599-611): agregasi termasuk key `INAKTIF` &
  `UNKNOWN`. Perlu perlakuan data `INAKTIF` lama — **interview Q1**.
- `listBerkasArsipFolderQuerySchema` + `ListBerkasArsipFolderQuery`: filter
  `status_arsip` string; API route `berkas/index.ts` mem-forward `status_arsip=null`,
  `status_arsip=<value>`, `search`, `limit`, `offset`. Perlu opsi filter "jatuh
  tempo" (dihitung, jadi filter dilakukan setelah query atau via SQL predikat
  `closed_at + interval`).

### `src/routes/api/arsiparis/berkas/index.ts` (94 baris)
- `parseFolderListQuery`: teruskan `status_arsip`. `safeFolderListRow` (±ln 73):
  daftar field yang di-whitelist ke klien — **tambah** `umur_berkas` /
  `jatuh_tempo` / `tanggal_jatuh_tempo` di sini agar sampai ke UI.

### `src/lib/archive/berkas-arsip-csv.ts` (217 baris)
- `FOLDER_LIST_HEADERS` (±ln 58) memuat `'Jenis Pembayaran'` → `'Cara Pembayaran'`;
  tambah kolom `'Umur Berkas'`. Ada label status arsip di baris data (via
  `formatBerkasArchiveStatusLabel`) → otomatis ikut.
- Konstanta filename: `BERKAS_INAKTIF_LIST_CSV_FILENAME`,
  `BERKAS_USUL_MUSNAH_LIST_CSV_FILENAME` — perlu rename/追加 untuk halaman
  Pembersihan.

### `src/lib/archive/berkas-arsip-physical-destruction.ts`
- `BERKAS_PHYSICAL_DESTRUCTION_CONFIRMATION_PHRASE = 'HAPUS FILE FISIK ARSIP'`
  (±ln 27) — frasa **internal** (dipakai server-only, dilewatkan otomatis oleh
  `lifecycle.ts`). RP-01 map: "sesuaikan wording; logika hapus fisik tetap".
  Karena tidak user-facing, ini kosmetik murni; boleh dibiarkan atau diselaraskan
  jadi mis. `'HAPUS FILE FISIK BERKAS'`. Ada test yang mengecek frasa.

### `src/lib/archive/berkas-arsip-file-access.ts` / `document-file-access.ts`
- Pesan blok `DIMUSNAHKAN`: `'Data file sudah dimusnahkan'` (dikunci oleh
  `AGENTS.md` Storage Rules + test UI `AttachmentViewer`, exact-match). **Hati-hati:**
  string ini **allowlisted** di parsing error UI. Mengganti wording berarti
  menyentuh backend + UI + test + AGENTS.md sekaligus. RP-01 map menandai ini "jika
  user-facing" — **rekomendasi: JANGAN ganti string `Data file sudah dimusnahkan`
  di iterasi ini** (biaya besar, risiko regresi allowlist), cukup relabel di
  permukaan yang jelas milik RP-01. Catat sebagai open question / non-scope kecil.

---

## 4. Navigasi & route

### `src/lib/constants/routes.ts` (±ln 31-37, grup `KEPALA_SUB_BAGIAN_UMUM`)
```
ROOT: '/arsiparis'
INBOX: '/arsiparis/inbox'
BERKAS_AKTIF: '/arsiparis/berkas'
INAKTIF: '/arsiparis/inaktif'            # HAPUS
USUL_MUSNAH: '/arsiparis/usul-musnah'    # RENAME -> PEMBERSIHAN: '/arsiparis/pembersihan'
PENAMBAHAN_ARSIP: '/arsiparis/penambahan-arsip'
KLASIFIKASI: '/arsiparis/klasifikasi'
```

### `src/config/navigation.ts` (grup KSBU, ±ln 116-129)
```
{ id:'pemberkasan',      label:'Pengklasifikasian Dokumen', icon:Archive,   to:INBOX }
{ id:'arsip_aktif',      label:'Pemberkasan Arsip Aktif',   icon:FolderOpen, to:BERKAS_AKTIF }
{ id:'arsip_inaktif',    label:'Daftar Arsip Inaktif',      icon:ArchiveX,   to:INAKTIF }        # HAPUS
{ id:'usul_musnah',      label:'Usul Musnah',               icon:Trash2,     to:USUL_MUSNAH }    # -> 'Pembersihan Berkas', to:PEMBERSIHAN
{ id:'penambahan_arsip', label:'Penambahan Dokumen',        icon:FilePlus,   to:PENAMBAHAN_ARSIP } # label sudah OK
{ id:'klasifikasi',      label:'Master Klasifikasi',        icon:Network,    to:KLASIFIKASI }   # -> 'Master Klasifikasi Dokumen' (opsional)
```
- `import { Archive, ArchiveX } from 'lucide-react'` (±ln 2-3) — ganti ikon ke
  `FolderOpen` / `FolderClosed` / `Trash2` sesuai RP-01. `FolderClosed` tidak ada di
  lucide; alternatif `FolderCheck` / `FolderArchive` / `Archive` tetap. **Konfirmasi
  target menu**: 2 item ("Berkas Terbuka" + "Berkas Tertutup") vs 1 halaman 2 tab —
  **interview Q3**. PB-6 tabel penamaan menyarankan menu final KSBU:
  *Dashboard · Pengklasifikasian Dokumen · Penambahan Dokumen · Berkas Terbuka ·
  Berkas Tertutup · Pembersihan Berkas · Master Klasifikasi*.

### `src/routeTree.gen.ts`
- Digenerasi oleh **`@tanstack/router-plugin`** (`package.json` dep
  `@tanstack/router-plugin@^1.132.0`) saat `pnpm dev` / `pnpm build`. **Tidak ada
  script CLI khusus.** Langkah plan: setelah file route ditamb/dihapus/di-rename,
  jalankan `pnpm dev` sebentar (atau `pnpm build`) untuk regenerasi, lalu verifikasi
  `git diff src/routeTree.gen.ts` hanya menyangkut `/arsiparis/inaktif` (hilang) &
  `/arsiparis/pembersihan` (baru, `usul-musnah` hilang).

---

## 5. Halaman & komponen UI

| File | Baris | Catatan riset |
|---|---|---|
| `src/routes/arsiparis/inaktif/index.tsx` | 327 | Fetch `apiFetch(... status_arsip:'INAKTIF')` (±ln 88). Import `ArchiveX`, CSV `BERKAS_INAKTIF_LIST_CSV_FILENAME`. **Dihapus total** + route gen. |
| `src/routes/arsiparis/usul-musnah/index.tsx` | 390 | **Sudah punya toggle** `FinalArchiveFilter = 'USUL_MUSNAH' | 'DIMUSNAHKAN'` (±ln 73-97), opsi label "Usul Musnah". Rename file → `pembersihan/index.tsx`; relabel toggle → "Usulan Pembersihan" / "Sudah Dibersihkan"; tombol "Musnahkan Data" → "Bersihkan File", tambah "Batalkan Usulan"; kolom Umur Berkas. Route gen. |
| `src/routes/arsiparis/berkas/index.tsx` | 483 | Judul seksi "Berkas Terbuka" + (saat ini) "Pemberkasan Arsip Aktif". Tambah kolom Umur Berkas + badge Jatuh Tempo, tombol "Usulkan Pembersihan" per baris + batch (interview Q4), teks "Jenis Pembayaran". |
| `src/routes/arsiparis/berkas/$id.tsx` | 2157 | Besar. Label detail; tombol aksi lifecycle (`resolveBerkasLifecycleAction`); "Jenis Pembayaran"/"Inaktif"/"Musnah"; dialog konfirmasi frasa. |
| `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx` | 329 | Field "Retensi Aktif" + "Retensi Inaktif" + preview "Masa Inaktif Berakhir". Buang field inaktif; "Retensi Aktif" → "Masa Simpan Minimal"; `getRetentionPreview` → satu tanggal; payload berhenti mengirim `retensi_inaktif` (schema `.strict()`). |
| `src/routes/arsiparis/index.tsx` | 219 | Dashboard KSBU: kartu "Arsip Inaktif" hapus; "Usul Musnah" → "Usul Pembersihan"; "Jenis Pembayaran"; "musnah". Import `INAKTIF` (±). |
| `src/routes/arsiparis/inbox.tsx` | — | "Jenis Pembayaran" → "Cara Pembayaran". |
| `src/routes/arsiparis/penambahan-arsip.tsx` | — | "Jenis Pembayaran" → "Cara Pembayaran"; retensi bila dikumpulkan; "musnah". |
| `src/routes/arsiparis/klasifikasi.tsx` | — | "Master Klasifikasi Arsip" → "Master Klasifikasi Dokumen"; "Jenis Pembayaran". |
| `src/routes/arsiparis/dokumen/$id/index.tsx` | — | "Jenis Pembayaran". |
| `src/components/ui/StatusBadge.tsx` | — | Map status arsip (±ln 16-19, 68-71): `AKTIF:'Aktif'`→`'Tersimpan'`, hapus `INAKTIF`, `USUL_MUSNAH:'Usul Musnah'`→`'Usul Pembersihan'`, `DIMUSNAHKAN:'Dimusnahkan'`→`'File Dibersihkan'`. Union type `StatusArsip` ikut. |
| `src/components/dashboard/StatsBento.tsx` | 156 | Tile "Arsip Inaktif" hapus; "Usul Musnah" → "Usul Pembersihan"; "musnah". |
| `src/lib/archive/berkas-klasifikasi-eligibility.ts` | — | Teks "Jenis Pembayaran" → "Cara Pembayaran". |
| `src/lib/manual-arsip.ts` | — | Referensi `INAKTIF`/"musnah"/retensi ganda. |

Sweep akhir label (RP-01 langkah 8):
`grep -rn "Jenis Pembayaran\|Inaktif\|Musnah\|Pengarsipan\|Master Klasifikasi Arsip" src/`
— file yang mengandung `INAKTIF`/`inaktif`/`Musnah` sudah dipetakan di atas; ada juga
referensi `musnah` di `src/lib/storage/*`, `src/lib/storage-client.ts`,
`src/routes/api/dokumen/$id.nominal.ts` yang **kemungkinan besar** menyangkut string
`Data file sudah dimusnahkan` (lihat §3, jangan diubah tanpa keputusan).

---

## 6. Test yang menyebut istilah lama (`tests/unit/arsiparis/`)

Ada folder `tests/unit/arsiparis/` dengan file relevan:
`berkas-arsip-service.test.ts`, `berkas-arsip-schema.test.ts`,
`berkas-arsip-read-model.test.ts`, `berkas-arsip-api.test.ts`,
`berkas-arsip-folder-pages.test.ts`, `berkas-arsip-csv.test.ts`,
`berkas-arsip-physical-destruction.test.ts`, `berkas-klasifikasi-eligibility.test.ts`,
`manual-arsip-route.test.ts`, `workflow-archive-route.test.ts`,
`berkas-activity-dev-reset.test.ts`, `berkas-arsip-file-access.test.ts`.
Plus `tests/unit/components/ui-foundation.test.ts` (label `StatusBadge`) dan
`tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts` (kartu dashboard).
`pnpm test` = `vitest run`. E2E: `tests/e2e/**` — cek alur `/arsiparis/inaktif` &
`/arsiparis/usul-musnah` bila ada.

---

## 7. Dokumen yang harus disinkronkan (langkah pertama)

- **`AGENTS.md`**:
  - `### Arsip Lifecycle` (±ln 343): alur `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`
    → jelaskan alur runtime baru 2 tahap (`AKTIF -> USUL_MUSNAH -> DIMUSNAHKAN` +
    `cancel_proposal`), catat `INAKTIF` deprecated tapi nilai enum & CHECK dibiarkan.
  - `### Status Berkas` (±ln 364): baris "Close-folder requires `Nomor SPM`, active
    retention, and inactive retention" → "requires `Nomor SPM` + single `Masa Simpan
    Minimal`". Phase 13S baris yang menyebut `retensi_aktif`, `retensi_inaktif`.
  - `### Behavioral Rules 5. Arsip Flow` (±ln 628) & `5A` — frasa retensi ganda,
    `Musnahkan Data`, `MUSNAHKAN DATA FILE` → frasa baru `BERSIHKAN FILE BERKAS`.
  - `## Route And Ownership Map` → `### Kepala Sub Bagian Umum` (±ln 962-963): hapus
    `/arsiparis/inaktif`, ganti `/arsiparis/usul-musnah` → `/arsiparis/pembersihan`.
  - Tambah entri di daftar "surface" yang di-rename/hapus (pola Phase 14E/14H).
- **`docs/migration/README.md`**:
  - `## Active Runtime Summary` (±ln 47-52): daftar surface — hapus `/arsiparis/inaktif`,
    ganti `/arsiparis/usul-musnah` → `/arsiparis/pembersihan`.
  - `## Removed Or Deprecated Surfaces` (±ln 77-88): tambah `/arsiparis/inaktif removed`,
    `/arsiparis/usul-musnah renamed -> /arsiparis/pembersihan`.
  - `Future frontend redesign should start from...` (±ln 113-116): sinkron daftar.
- **`docs/penjelasan-proyek.md`** PB-6: framing sudah diperbarui; sinkronkan label
  saat implementasi selesai (langkah terakhir).

---

## 8. Temuan yang mengubah/menegaskan rencana

1. **`cancel_proposal` tidak punya event type di CHECK constraint.** Memakai event
   baru = migrasi (melanggar target). Rekomendasi kuat: petakan ke
   `METADATA_ARSIP_AKTIF_DIPERBARUI`. → **interview Q2** (jawaban hampir pasti
   "event yang sudah ada").
2. **`eventTypeForBerkasLifecycleStatus` berbasis status tujuan**, jadi
   `cancel_proposal → AKTIF` akan salah-log "Berkas ditutup" bila tidak
   di-special-case. Implementasi harus action-aware.
3. **`closeBerkasMetadataSchema` `.strict()`** → menghapus `retensi_inaktif` dari
   schema **memaksa** front-end (`CloseBerkasDialog`) berhenti mengirim field itu di
   commit yang sama; tidak bisa dipecah antar-section tanpa sementara memecah build
   API↔UI. Section Zod+API dan section UI dialog **harus landing berdekatan** atau
   schema menerima-tapi-abaikan `retensi_inaktif` sebagai langkah transisi.
4. **Halaman `usul-musnah` sudah punya toggle** `USUL_MUSNAH`/`DIMUSNAHKAN` — RP-01
   item 6 sebagian sudah ada; kerjanya relabel + rename file + tambah aksi "Batalkan
   Usulan" + kolom umur.
5. **String `Data file sudah dimusnahkan`** dikunci AGENTS.md + allowlist parsing UI
   + test. Mengganti wording ini berbiaya besar & berisiko regresi. Rekomendasi:
   **exclude dari scope RP-01** (catat sebagai open question); relabel hanya
   permukaan yang tidak menyentuh allowlist.
6. **Route generation** hanya lewat plugin build/dev (tak ada CLI) → langkah
   tersendiri + verifikasi diff.
7. **Data `INAKTIF` lama di DB dev/seed** → butuh keputusan map-di-read-model vs
   reset DB. `status_arsip_counts` juga akan memuat bucket `INAKTIF`. → **interview
   Q1**.

---

## 9. Web research

RP-01 tidak menambah dependensi, tidak menyentuh library baru, dan seluruhnya
internal (TanStack Start + Drizzle + Zod yang sudah dipakai di repo). **Tidak ada
web research yang diperlukan.**
