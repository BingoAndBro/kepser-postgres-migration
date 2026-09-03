# Implementation Plan — RP-01: De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

> Baca dulu: `claude-spec.md` (spec tersintesis), `claude-research.md` (peta kode),
> `claude-interview.md` (keputusan Fase 2). Otoritas mengikat: `AGENTS.md`.
> Untuk fase implementasi: **wajib** baca `.agent/skills/ui-ux-pro-max/SKILL.md`
> (menyentuh UI/Frontend) dan `.agent/skills/db-fsm-guard/SKILL.md` (menyentuh
> status workflow berkas / transisi lifecycle).

---

## Overview

RP-01 mengganti bahasa kearsipan resmi dengan istilah netral dan memangkas
lifecycle berkas sesudah-tutup dari 4 tahap jadi 2, **tanpa migrasi DB dan tanpa
scheduler**. Semua nilai internal (enum, kolom, nama tabel, route `/arsiparis`)
dipertahankan; yang berubah hanya **label tampilan** dan **logika transisi
lifecycle** di layer aplikasi. "Jatuh Tempo" dan "Umur Berkas" dihitung saat baca.
Satu route dihapus (`/arsiparis/inaktif`), satu di-rename
(`/arsiparis/usul-musnah` → `/arsiparis/pembersihan`), satu ditambah
(`/arsiparis/berkas/tertutup`) — semuanya lewat route generation resmi. Dokumen
konstitusi (`AGENTS.md`, `docs/migration/README.md`) disinkronkan lebih dulu.

Urutan besar (mengikuti "Urutan kerja yang disarankan" RP-01, disesuaikan keputusan
interview):

```
1  Docs (AGENTS.md + migration/README.md)          → section-01
2  Konstanta + tipe + label activity               → section-02
3  Helper backend (retention, service, read-model,  → section-03
   page-format) + test unit
4  Zod + API routes (close, lifecycle, berkas list, → section-04
   berkas detail) + test
5  Navigasi + route add/remove/rename + route gen   → section-05
6  Halaman UI (berkas terbuka/tertutup, detail,     → section-06
   CloseBerkasDialog, pembersihan, dashboard,
   penambahan, klasifikasi, inbox)
7  Komponen bersama (StatusBadge, StatsBento)       → section-07
8  Sweep label sisa + grep                          → section-08
9  pnpm test + perbaikan test                       → section-09
10 Sinkron docs/penjelasan-proyek.md PB-6           → section-10
```

section-03 & section-04 backend-berat; section-06 & section-07 UI-berat. Lihat
`sections/index.md` untuk dependency & paralelisasi.

---

## Architecture

Tiga lapisan yang tersentuh, semuanya di dalam domain berkas/arsip folder-first:

```
            ┌─────────────────────────────────────────────────────────────┐
  KONSTANTA │ archive-status.ts (helper resting-status, komentar deprecated)│
            │ routes.ts (hapus INAKTIF, rename USUL_MUSNAH→PEMBERSIHAN,     │
            │            tambah BERKAS_TERTUTUP)                            │
            │ berkas-arsip-activity.ts (LABELS only; TYPES tetap)          │
            └───────────────┬─────────────────────────────────────────────┘
                            │
            ┌───────────────▼─────────────────────────────────────────────┐
  BACKEND   │ retention.ts        → calculateBerkasDueDate (1 label)       │
  (helper + │ berkas-arsip-service.ts → lifecycle transitions:            │
   service) │    propose_destruction: AKTIF→USUL_MUSNAH                    │
            │    cancel_proposal:     USUL_MUSNAH→AKTIF (event action-aware)│
            │    mark_inactive: dihapus                                    │
            │ berkas-arsip-read-model.ts → +umur, +jatuhTempo, -INAKTIF    │
            │ berkas-arsip-page-format.ts → label status + aksi lifecycle  │
            │ berkas-arsip-csv.ts → header "Cara Pembayaran" + "Umur Berkas"│
            └───────────────┬─────────────────────────────────────────────┘
                            │
            ┌───────────────▼─────────────────────────────────────────────┐
  API       │ schemas/berkas-arsip.ts → closeBerkasMetadataSchema 1-field │
  (Zod +    │ api/.../close.ts          (ikut schema)                     │
   routes)  │ api/.../lifecycle.ts     → enum aksi: propose+cancel        │
            │ api/.../berkas/index.ts  → whitelist umur/jatuh tempo       │
            │ api/.../berkas/$id.ts    → detail umur/jatuh tempo, -INAKTIF │
            └───────────────┬─────────────────────────────────────────────┘
                            │
            ┌───────────────▼─────────────────────────────────────────────┐
  UI        │ navigation.ts (2 item: Berkas Terbuka + Berkas Tertutup)    │
            │ routes/arsiparis/berkas/index.tsx     (Terbuka)             │
            │ routes/arsiparis/berkas/tertutup.tsx  (BARU — Tertutup)     │
            │ routes/arsiparis/berkas/$id.tsx       (label + aksi + dialog)│
            │ routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx   │
            │ routes/arsiparis/pembersihan/index.tsx (rename dari         │
            │    usul-musnah/index.tsx; toggle relabel + Batalkan Usulan) │
            │ routes/arsiparis/inaktif/index.tsx    (HAPUS)               │
            │ routes/arsiparis/index.tsx (dashboard KSBU)                 │
            │ routes/arsiparis/{inbox,penambahan-arsip,klasifikasi}.tsx   │
            │ components/ui/StatusBadge.tsx, components/dashboard/StatsBento│
            └────────────────────────────────────────────────────────────┘
```

Data flow "Jatuh Tempo" (tanpa scheduler):

```
closeBerkasArsip  ──writes──▶  berkas_arsip.masa_aktif_berakhir = closed_at + masa_simpan
                                (kolom lama dipakai ulang sebagai "tanggal jatuh tempo")

listBerkasArsipFolders / detail read
  ──computes per row on read──▶  umur_berkas       = today − closed_at   (hari)
                                 jatuh_tempo       = today ≥ masa_aktif_berakhir  (bool)
                                 tanggal_jatuh_tempo = masa_aktif_berakhir
  ──sort default──▶  closed_at ASC (terlama dulu)
```

---

## Implementation Steps

### Step 1 — Sinkron dokumen konstitusi (docs-first)

**What:** Perbarui `AGENTS.md` dan `docs/migration/README.md` agar mencerminkan
lifecycle 2-tahap, satu field retensi, route yang dihapus/di-rename/ditambah, dan
frasa konfirmasi baru — **sebelum** menyentuh kode.

**Why:** Invariant `AGENTS.md` "Update docs before behavior changes". Dokumen ini
adalah "hukum kerja repo"; kalau kode berubah lebih dulu, reviewer tidak punya
acuan sah.

**How (prose):**
- `AGENTS.md`:
  - `### Arsip Lifecycle` (±ln 343): tambah catatan bahwa runtime folder-first RP-01
    memakai alur 2 tahap `AKTIF → USUL_MUSNAH → DIMUSNAHKAN` plus aksi
    `cancel_proposal` (`USUL_MUSNAH → AKTIF`); `INAKTIF` **deprecated dari alur**
    tetapi nilai enum & CHECK constraint dibiarkan (tanpa migrasi). Jangan hapus
    blok lama; tandai "superseded for folder-first runtime by RP-01".
  - `### Status Berkas` (±ln 364, 377): baris "Close-folder requires `Nomor SPM`,
    active retention, and inactive retention" → "requires `Nomor SPM` and a single
    `Masa Simpan Minimal` retention label; `retensi_inaktif` /
    `masa_inaktif_berakhir` remain nullable legacy columns". Tambah catatan RP-01
    di baris Phase 13S/13S.1 yang menyebut `retensi_aktif` + `retensi_inaktif`.
  - `### Behavioral Rules → 5. Arsip Flow` (±ln 628): sesuaikan deskripsi transisi;
    frasa konfirmasi `MUSNAHKAN DATA FILE` → `BERSIHKAN FILE BERKAS`; "Musnahkan
    Data" → "Bersihkan File".
  - `## Route And Ownership Map → ### Kepala Sub Bagian Umum` (±ln 962-963): hapus
    `/arsiparis/inaktif`; ganti `/arsiparis/usul-musnah` → `/arsiparis/pembersihan`;
    tambah `/arsiparis/berkas/tertutup`.
  - Tambah baris ringkas "RP-01" di area lifecycle/route yang mencatat: relabel
    only, no migration, route generation allowed for these 3 routes, phrase change.
- `docs/migration/README.md`:
  - `## Active Runtime Summary` (±ln 47-52): daftar surface — hapus
    `/arsiparis/inaktif`; ganti `/arsiparis/usul-musnah` → `/arsiparis/pembersihan`;
    tambah `/arsiparis/berkas/tertutup`.
  - `## Removed Or Deprecated Surfaces` (±ln 77-88): tambah
    `/arsiparis/inaktif removed (RP-01)` dan
    `/arsiparis/usul-musnah renamed -> /arsiparis/pembersihan (RP-01)`.
  - Blok "Future frontend redesign should start from..." (±ln 113-116): sinkron.
- **Jangan** sentuh `docs/penjelasan-proyek.md` di sini — PB-6 framing sudah
  diperbarui; hanya label yang disinkronkan di Step 10.

**Files affected:** `AGENTS.md`, `docs/migration/README.md`.

**Dependencies:** —. Ini langkah pertama.

---

### Step 2 — Konstanta, tipe, label activity

**What:** Ubah `archive-status.ts` (helper + komentar), `routes.ts` (add/remove/rename
konstanta route), `berkas-arsip-activity.ts` (label saja).

**Why:** Semua layer berikutnya mengacu ke konstanta ini. Route constants harus
siap sebelum navigasi & halaman. Nilai enum & event types **tidak** berubah supaya
DB CHECK constraint tetap valid tanpa migrasi.

**How (prose):**
- `src/lib/constants/archive-status.ts`:
  - `ARCHIVE_STATUS_VALUES` / `ARCHIVE_STATUS` **dibiarkan utuh** (dipakai Zod + DB
    CHECK). Tambah `export const BERKAS_RESTING_STATUS = 'AKTIF' as const` (atau nama
    setara) + komentar blok: `// INAKTIF: nilai enum dipertahankan untuk kompat DB
    CHECK; sudah TIDAK dipakai di alur lifecycle sejak RP-01.`
- `src/lib/constants/routes.ts` grup `KEPALA_SUB_BAGIAN_UMUM` (±ln 31-37):
  - Hapus `INAKTIF: '/arsiparis/inaktif'`.
  - Ganti `USUL_MUSNAH: '/arsiparis/usul-musnah'` → `PEMBERSIHAN: '/arsiparis/pembersihan'`.
  - Tambah `BERKAS_TERTUTUP: '/arsiparis/berkas/tertutup'`.
  - `BERKAS_AKTIF: '/arsiparis/berkas'` tetap (kini isinya seksi Terbuka saja).
  - Grep pemakai `ROUTES.KEPALA_SUB_BAGIAN_UMUM.INAKTIF` / `.USUL_MUSNAH` dan
    perbaiki semua referensi (akan ketahuan sebagai type error TS — manfaatkan itu).
- `src/lib/archive/berkas-arsip-activity.ts`:
  - `BERKAS_ACTIVITY_EVENT_TYPES` **tidak diubah**.
  - `BERKAS_ACTIVITY_EVENT_LABELS`:
    - `BERKAS_DIPINDAHKAN_KE_INAKTIF` → biarkan string atau ubah jadi
      `'Berkas dipindahkan ke Inaktif (usang)'`; event ini tak lagi ditulis runtime.
    - `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH` → `'Berkas diusulkan untuk pembersihan'`.
    - `BERKAS_DIMUSNAHKAN` → `'File berkas dibersihkan'`.
  - `METADATA_ARSIP_AKTIF_DIPERBARUI` label dibiarkan generik (dipakai juga oleh
    `cancel_proposal` — lihat Step 3).

**Files affected:** `src/lib/constants/archive-status.ts`,
`src/lib/constants/routes.ts`, `src/lib/archive/berkas-arsip-activity.ts`.

**Dependencies:** Step 1.

---

### Step 3 — Helper backend + service lifecycle + read-model + test unit

**What:** Sederhanakan perhitungan retensi jadi satu field; ubah tabel transisi
lifecycle; jadikan pemetaan event action-aware; tambah `umur` / `jatuhTempo` di
read-model; relabel `page-format`. Tulis/ubah test unit-nya.

**Why:** Ini inti perubahan perilaku. Harus benar dan ber-test sebelum API & UI
menumpang di atasnya. Menyentuh transisi status berkas → wajib mengikuti
`db-fsm-guard` (guard status di server tetap otoritas, tolak transisi ilegal).

**How (prose):**

*3a. `src/lib/archive/retention.ts`*
- Tambah `calculateBerkasDueDate({ closedAt, masaSimpan }: { closedAt: string;
  masaSimpan: RetensiLabel }): string` yang mengembalikan satu tanggal
  (`YYYY-MM-DD`): `Permanen` → `PERMANENT_RETENTION_SENTINEL_DATE`; selain itu
  `addCalendarYears(closedAt, RETENTION_YEARS_BY_LABEL[masaSimpan])`.
- Pertahankan `calculateManualArchiveRetentionDates` **hanya jika** masih ada
  pemanggil non-RP-01; kalau semua pemanggil (`buildCloseBerkasPlan`,
  `buildActiveBerkasMetadataPlan`) sudah pindah ke `calculateBerkasDueDate`, boleh
  dihapus. Cek grep dulu.
- `MANUAL_ARCHIVE_RETENTION_LABELS` dipakai ulang untuk dropdown "Masa Simpan
  Minimal" (bisa di-`export` alias `MASA_SIMPAN_LABELS` untuk keterbacaan; opsional).

*3b. `src/lib/archive/berkas-arsip-service.ts`*
- `BerkasArchiveLifecycleAction` (±ln 138): union jadi
  `'propose_destruction' | 'cancel_proposal' | 'approve_destruction'` (buang
  `mark_inactive`).
- `nextStatusForBerkasLifecycleAction` (±ln 891): tabel `allowed`:
  ```
  propose_destruction: { AKTIF: USUL_MUSNAH }
  cancel_proposal:     { USUL_MUSNAH: AKTIF }
  approve_destruction: { USUL_MUSNAH: DIMUSNAHKAN }
  ```
  Transisi lain tetap dilempar `BERKAS_LIFECYCLE_INVALID`.
- **Pemetaan event action-aware.** Ubah `eventTypeForBerkasLifecycleStatus(status)`
  → `eventTypeForBerkasLifecycleAction(action, nextStatus)`:
  ```
  propose_destruction  -> BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH
  cancel_proposal      -> METADATA_ARSIP_AKTIF_DIPERBARUI     // K2: tanpa migrasi
  approve_destruction  -> BERKAS_DIMUSNAHKAN
  ```
  Panggilan di `transitionBerkasArchiveStatus` (±ln 454) disesuaikan meneruskan
  `input.action`.
- `closeBerkasArsip` (±ln 368) + `buildCloseBerkasPlan` (±ln 542):
  - `CloseBerkasPlan` tidak lagi butuh `retensiInaktif` / `masaInaktifBerakhir`
    (atau isi konstanta `null`). Hitung `masaAktifBerakhir` via
    `calculateBerkasDueDate({ closedAt: closedAtDateOnly, masaSimpan: parsed.retensi_aktif })`.
  - `repository.closeOpenBerkas` menerima `plan` — pastikan penulisan
    `retensi_inaktif` / `masa_inaktif_berakhir` di repo layer diisi `null`
    (bukan dihapus dari INSERT bila kolomnya NOT NULL — sudah nullable, aman).
  - `appendBerkasActivity('BERKAS_DITUTUP')` metadataSnapshot (±ln 405-408): set
    `retensi_inaktif: null`, `masa_inaktif_berakhir: null` (atau hapus dari
    snapshot). Snapshot adalah JSON bebas → aman.
- `updateActiveBerkasMetadata` (±ln 465) + `buildActiveBerkasMetadataPlan`
  (±ln 512): jalur edit metadata `CLOSED/AKTIF`. Ikut disederhanakan: satu label,
  `calculateBerkasDueDate` dari `existingClosedAt`. Snapshot event
  `METADATA_ARSIP_AKTIF_DIPERBARUI` (±ln 502-505) → field inaktif `null`.
- `parseCloseBerkasMetadata` mengacu `closeBerkasMetadataSchema` (Step 4) — akan
  otomatis ikut setelah schema berubah. Pastikan tipe `CloseBerkasMetadataInput`
  yang di-`import` di service tidak lagi merujuk `retensi_inaktif`.

*3c. `src/lib/archive/berkas-arsip-read-model.ts`*
- DTO list & detail: tambah field `umur_berkas: number | null` (hari sejak
  `closed_at`; `null` bila belum `CLOSED`), `jatuh_tempo: boolean`,
  `tanggal_jatuh_tempo: string | null` (= `masa_aktif_berakhir`).
  - Perhitungan di layer read-model (mapper row → DTO, ±ln 520-540), memakai
    "hari ini" server. Sentinel `9999-12-31` → `jatuh_tempo = false`.
  - Pertimbangkan helper murni `computeBerkasAging({ closedAt, dueDate, now })` di
    `retention.ts` atau `berkas-arsip-page-format.ts` supaya mudah di-test &
    dipakai ulang detail + list.
- Buang cabang/label `INAKTIF`:
  - `status_arsip_counts` (±ln 599-611): berhenti membuat bucket `INAKTIF`
    (biarkan absen / 0). `UNKNOWN` tetap.
  - Semua penyaringan/pelabelan `INAKTIF` di read-model dihapus.
- Sort default list: `closed_at ASC` (terlama dulu) untuk daftar berstatus `CLOSED`.
  Untuk daftar Terbuka, urutan existing dipertahankan (mis. `created_at`).
  - Kalau `listBerkasArsipFolderQuerySchema` belum punya param `sort`, cukup ubah
    default `ORDER BY` untuk query berstatus CLOSED, atau tambahkan opsi
    `due_only?: boolean` untuk filter "jatuh tempo" (predikat SQL
    `closed_at + make_interval(...)` kompleks → alternatif: filter di memori setelah
    fetch, aman untuk volume internal). Putuskan saat implementasi; default: sort
    di SQL, filter `due_only` di memori.

*3d. `src/lib/archive/berkas-arsip-page-format.ts`*
- `formatBerkasArchiveStatusLabel` (±ln 25): `AKTIF → 'Tersimpan'`,
  `USUL_MUSNAH → 'Usul Pembersihan'`, `DIMUSNAHKAN → 'File Dibersihkan'`; hapus
  cabang `INAKTIF` (fallback "Status arsip tidak dikenal" cukup).
- `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE` (±ln 16): `'MUSNAHKAN DATA FILE'` →
  `'BERSIHKAN FILE BERKAS'`. (Dipakai juga `lifecycle.ts` & UI dialog — otomatis
  ikut lewat import.)
- `BerkasLifecycleActionView.action` (±ln 8): union → tambah `'cancel_proposal'`,
  buang `'mark_inactive'`.
- `resolveBerkasLifecycleAction` (±ln 40):
  - `statusArsip === 'AKTIF'` → satu aksi: `propose_destruction`, label
    "Usulkan Pembersihan", konfirmasi "Berkas akan masuk daftar Usul Pembersihan.
    Dokumen tidak dihapus.", success "Berkas berhasil masuk daftar Usul Pembersihan."
  - `statusArsip === 'USUL_MUSNAH'` → dua aksi. Ubah kontrak fungsi jadi
    mengembalikan `BerkasLifecycleActionView[]` (atau tambah fungsi
    `resolveSecondaryBerkasLifecycleAction`):
    - `approve_destruction`: label "Bersihkan File", `confirmationPhrase`
      `'BERSIHKAN FILE BERKAS'`, copy disesuaikan (status jadi "File Dibersihkan",
      soft file dihapus, preview/download diblokir, metadata tetap).
    - `cancel_proposal`: label "Batalkan Usulan", konfirmasi ringan tanpa phrase
      ("Berkas kembali ke Tersimpan. Tidak ada file yang dihapus."), success
      "Usulan pembersihan dibatalkan."
  - Hapus cabang `INAKTIF` & aksi `mark_inactive`.
  - **Catatan altitude:** kalau mengubah return jadi array berdampak luas ke
    `$id.tsx`, boleh pertahankan fungsi lama untuk aksi primer + fungsi baru untuk
    aksi sekunder. Putuskan saat implementasi UI (section-06).

*3e. Test unit (section-03 scope)*
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`: hapus kasus `mark_inactive`;
  tambah `AKTIF → USUL_MUSNAH` (propose), `USUL_MUSNAH → AKTIF` (cancel) dengan
  assertion event = `METADATA_ARSIP_AKTIF_DIPERBARUI`, `USUL_MUSNAH → DIMUSNAHKAN`
  tetap; transisi ilegal (`AKTIF → DIMUSNAHKAN`, `cancel` dari `AKTIF`) ditolak.
  Tambah kasus `closeBerkasArsip` menulis `masa_aktif_berakhir = closed_at + masa`
  dan `retensi_inaktif`/`masa_inaktif_berakhir` = `null`.
- `tests/unit/arsiparis/berkas-arsip-read-model.test.ts`: field `umur_berkas`,
  `jatuh_tempo` (today == due, today < due, sentinel Permanen), `tanggal_jatuh_tempo`;
  tidak ada bucket `INAKTIF` di `status_arsip_counts`; sort terlama-dulu.
- (retention) kalau ada `tests/unit/**/retention*.test.ts`, tambah kasus
  `calculateBerkasDueDate`.

**Files affected:** `src/lib/archive/retention.ts`,
`src/lib/archive/berkas-arsip-service.ts`,
`src/lib/archive/berkas-arsip-read-model.ts`,
`src/lib/archive/berkas-arsip-page-format.ts`,
`tests/unit/arsiparis/berkas-arsip-service.test.ts`,
`tests/unit/arsiparis/berkas-arsip-read-model.test.ts`,
(opsional) `tests/unit/**/retention*.test.ts`.

**Dependencies:** Step 2.

---

### Step 4 — Zod + API routes + test

**What:** Sederhanakan `closeBerkasMetadataSchema` jadi satu field; ubah enum aksi
`lifecycleBodySchema`; whitelist field baru (`umur_berkas`, `jatuh_tempo`,
`tanggal_jatuh_tempo`) di response list & detail; bersihkan referensi `INAKTIF` di
param filter; ganti pesan "Jenis pembayaran" → "Cara pembayaran".

**Why:** Boundary Zod = kontrak API. `.strict()` pada `closeBerkasMetadataSchema`
berarti perubahan ini harus selaras dengan `CloseBerkasDialog` (section-06) —
dikerjakan berdekatan (lihat `sections/index.md`).

**How (prose):**
- `src/lib/schemas/berkas-arsip.ts`:
  - `openBerkasRequestSchema`: pesan `'Jenis pembayaran tidak valid'` →
    `'Cara pembayaran tidak valid'`.
  - `closeBerkasMetadataSchema` (±ln 45):
    - Hapus `retensi_inaktif`. Pertahankan key `retensi_aktif`, ganti pesan →
      `'Masa Simpan Minimal tidak valid'`.
    - `.strict()` dipertahankan → payload dengan `retensi_inaktif` **ditolak**.
      Konsekuensi: `CloseBerkasDialog` di section-06 wajib berhenti mengirimnya.
      (Alternatif transisi bila section-06 tertunda: `.strip()` sementara +
      `retensi_inaktif` optional-ignored — tapi plan memilih tidak menunda.)
    - `.transform` output: `{ nomor_spm, retensi_aktif, closed_at }` (buang
      `retensi_inaktif`).
  - `CloseBerkasMetadataInput` type ikut menyusut — perbaiki pemakainya di service
    (Step 3) & UI (Step 6).
- `src/routes/api/arsiparis/berkas/$id/lifecycle.ts`:
  - `nonDestructiveLifecycleBodySchema`: `action: z.enum(['propose_destruction', 'cancel_proposal'])`.
  - `approveDestructionLifecycleBodySchema`: `confirmation: z.literal(BERKAS_DESTRUCTION_CONFIRMATION_PHRASE)`
    — otomatis jadi `'BERSIHKAN FILE BERKAS'` (import konstanta, tak ada string
    literal di sini).
  - `discriminatedUnion('action', [...])` struktur tetap. Handler
    `executePhysicalDeletionAfterLifecycle` tetap hanya untuk `approve_destruction`.
- `src/routes/api/arsiparis/berkas/index.ts`:
  - `safeFolderListRow` (±ln 73): tambah `umur_berkas`, `jatuh_tempo`,
    `tanggal_jatuh_tempo` ke objek yang di-whitelist (nilai dari DTO read-model).
  - `parseFolderListQuery`: kalau read-model menambah `due_only`, teruskan param
    `due_only=true`.
- `src/routes/api/arsiparis/berkas/$id.ts`:
  - DTO detail whitelist tambah field umur/jatuh tempo; buang referensi `INAKTIF`
    bila ada (mis. label/branch).
- `src/lib/archive/berkas-arsip-api.ts`: bersihkan referensi `INAKTIF`
  (param/filter/label) bila ada. `safeBerkasDto` — pastikan tidak membocorkan field
  baru yang tak diinginkan; hanya tambah yang aman.
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`: pesan/teks "Jenis Pembayaran"
  → "Cara Pembayaran" (label saja).
- `src/routes/api/arsiparis/manual-arsip/index.ts` & `$id.ts`: "Jenis Pembayaran" →
  "Cara Pembayaran"; retensi disederhanakan **bila** form manual mengumpulkannya
  (cek `src/lib/schemas/manual-arsip.ts` — kemungkinan besar hanya label).

*Test (section-04 scope):*
- `tests/unit/arsiparis/berkas-arsip-schema.test.ts`: `closeBerkasMetadataSchema`
  satu field; `retensi_inaktif` ditolak; pesan "Cara pembayaran".
- `tests/unit/arsiparis/berkas-arsip-api.test.ts`: filter status (tanpa `INAKTIF`);
  response list & detail memuat `umur_berkas` / `jatuh_tempo` / `tanggal_jatuh_tempo`;
  enum aksi lifecycle (`cancel_proposal` diterima, `mark_inactive` ditolak 400).
- `tests/unit/arsiparis/berkas-arsip-csv.test.ts` (kalau CSV disentuh di Step 8,
  bisa pindah section-08).

**Files affected:** `src/lib/schemas/berkas-arsip.ts`,
`src/routes/api/arsiparis/berkas/$id/lifecycle.ts`,
`src/routes/api/arsiparis/berkas/index.ts`,
`src/routes/api/arsiparis/berkas/$id.ts`,
`src/lib/archive/berkas-arsip-api.ts`,
`src/routes/api/arsiparis/dokumen.$id.archive.ts`,
`src/routes/api/arsiparis/manual-arsip/index.ts`,
`src/routes/api/arsiparis/manual-arsip/$id.ts`,
`src/lib/schemas/manual-arsip.ts` (bila perlu),
`tests/unit/arsiparis/berkas-arsip-schema.test.ts`,
`tests/unit/arsiparis/berkas-arsip-api.test.ts`.

**Dependencies:** Step 3 (tipe & fungsi service/read-model).

---

### Step 5 — Navigasi + route add/remove/rename + route generation

**What:** Ubah `navigation.ts` (2 item menu + ikon), buat file route baru
`src/routes/arsiparis/berkas/tertutup.tsx` (stub dulu, diisi di Step 6), hapus
`src/routes/arsiparis/inaktif/`, rename `src/routes/arsiparis/usul-musnah/index.tsx`
→ `src/routes/arsiparis/pembersihan/index.tsx`, lalu jalankan route generation
resmi dan verifikasi diff.

**Why:** RP-01 secara eksplisit **mengizinkan** route generation untuk perubahan
ini. Dikerjakan sebagai satu langkah supaya `routeTree.gen.ts` teregenerasi sekali
dengan diff yang bisa diaudit.

**How (prose):**
- `src/config/navigation.ts` grup `KEPALA_SUB_BAGIAN_UMUM` (±ln 116-129):
  - `arsip_aktif` → label **"Berkas Terbuka"**, `to: ROUTES...BERKAS_AKTIF`,
    ikon `FolderOpen`.
  - **Tambah** item `berkas_tertutup` → label **"Berkas Tertutup"**,
    `to: ROUTES...BERKAS_TERTUTUP`, ikon (`FolderCheck` / `Archive` / `Lock` —
    pilih; `FolderClosed` tidak ada di lucide).
  - **Hapus** item `arsip_inaktif`.
  - `usul_musnah` → id `pembersihan`, label **"Pembersihan Berkas"**,
    `to: ROUTES...PEMBERSIHAN`, ikon `Trash2` (tetap).
  - `klasifikasi` → label **"Master Klasifikasi Dokumen"** (opsional; RP-01 & PB-6
    menyebut "Master Klasifikasi (Dokumen)").
  - Bersihkan import `ArchiveX` (tak lagi dipakai); sesuaikan import `FolderOpen` /
    ikon baru.
  - Urutan menu final (PB-6): Dashboard · Pengklasifikasian Dokumen · Penambahan
    Dokumen · Berkas Terbuka · Berkas Tertutup · Pembersihan Berkas · Master
    Klasifikasi Dokumen.
- File route:
  - **Hapus** `src/routes/arsiparis/inaktif/index.tsx` (dan folder `inaktif/` bila
    kosong).
  - **Rename** `src/routes/arsiparis/usul-musnah/index.tsx` →
    `src/routes/arsiparis/pembersihan/index.tsx`. Update `createFileRoute('/arsiparis/usul-musnah/')`
    → `createFileRoute('/arsiparis/pembersihan/')`. (Isi UI penuh di Step 6; di sini
    cukup rename + path route.)
  - **Buat** `src/routes/arsiparis/berkas/tertutup.tsx` dengan
    `createFileRoute('/arsiparis/berkas/tertutup')` + komponen placeholder
    (diisi Step 6). Pastikan tidak bentrok dengan `berkas/$id.tsx`.
- **Route generation:** jalankan `pnpm dev` (biarkan Vite start → plugin
  regenerasi `src/routeTree.gen.ts` → hentikan) **atau** `pnpm build`. **Jangan**
  edit `routeTree.gen.ts` manual.
- **Verifikasi:** `git diff src/routeTree.gen.ts` — pastikan hanya:
  `/arsiparis/inaktif` hilang, `/arsiparis/usul-musnah` hilang,
  `/arsiparis/pembersihan` muncul, `/arsiparis/berkas/tertutup` muncul. Tidak ada
  route lain berubah.
- Grep sisa referensi path lama: `grep -rn "arsiparis/inaktif\|arsiparis/usul-musnah" src/`
  (termasuk redirect sukses aksi lifecycle di `$id.tsx` & halaman pembersihan).

**Files affected:** `src/config/navigation.ts`,
`src/routes/arsiparis/inaktif/index.tsx` (hapus),
`src/routes/arsiparis/usul-musnah/index.tsx` → `src/routes/arsiparis/pembersihan/index.tsx`,
`src/routes/arsiparis/berkas/tertutup.tsx` (baru),
`src/routeTree.gen.ts` (via generator).

**Dependencies:** Step 2 (route constants).

---

### Step 6 — Halaman UI

**What:** Isi & relabel halaman: Berkas Terbuka, Berkas Tertutup (baru),
detail `$id`, `CloseBerkasDialog`, Pembersihan Berkas, dashboard KSBU, penambahan,
klasifikasi, inbox. Menyentuh UI/Frontend → **wajib** ikuti
`.agent/skills/ui-ux-pro-max/SKILL.md`.

**Why:** Ini permukaan yang dilihat pengguna. Perubahan perilaku (aksi lifecycle,
form retensi, badge jatuh tempo, batch) semuanya bermuara di sini.

**How (prose):**

*6a. `src/routes/arsiparis/berkas/index.tsx` (Berkas Terbuka)*
- Halaman kini fokus daftar `status_berkas=OPEN`. Judul/subjudul "Berkas Terbuka".
- Hilangkan/relokasi seksi "Pemberkasan Arsip Aktif" (pindah ke `tertutup.tsx`).
- Teks "Jenis Pembayaran" → "Cara Pembayaran". Tombol "Tutup Berkas" (shortcut list)
  tetap; buka `CloseBerkasDialog` yang sudah disederhanakan.

*6b. `src/routes/arsiparis/berkas/tertutup.tsx` (Berkas Tertutup — BARU)*
- Fetch `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF`
  (pola `apiFetch` seperti `inaktif/index.tsx` lama).
- Kolom: Cara Pembayaran, Nomor SPM, Tgl Tutup, **Umur Berkas** (`umur_berkas` +
  hari), **badge "Jatuh Tempo"** (bila `jatuh_tempo`), jumlah item, nominal.
- Urut default: terlama dulu (server sudah `closed_at ASC`).
- Aksi per baris: **"Usulkan Pembersihan"** → dialog konfirmasi →
  `POST /api/arsiparis/berkas/$id/lifecycle { action: 'propose_destruction' }` →
  refresh + toast; sukses redirect/stay sesuai pola (`Phase 13W.1` menyarankan
  landing di list — di sini tetap di Berkas Tertutup, baris hilang).
- **Batch "Usulkan Semua yang Jatuh Tempo"** (K4):
  - Aktif hanya bila ada ≥1 baris `jatuh_tempo`.
  - Klik → dialog: "N berkas jatuh tempo akan diusulkan untuk pembersihan. Lanjut?"
    tombol `Batal` / `Usulkan Semua`.
  - Eksekusi: kumpulkan `berkas_id` baris jatuh tempo; panggil endpoint
    `propose_destruction` per berkas (loop, konkurensi terbatas mis. 3–5).
  - Hasil: toast ringkas "X berhasil, Y gagal" (kegagalan sebagian tidak
    membatalkan sukses); daftar di-refresh.
  - Pseudocode:
    ```
    const ids = rows.filter(r => r.jatuh_tempo).map(r => r.berkas_id)
    const results = await mapWithConcurrency(ids, 4, id =>
      apiFetch(lifecycleUrl(id), { method:'POST', body:{ action:'propose_destruction' }})
        .then(() => ({ id, ok:true }))
        .catch(() => ({ id, ok:false })))
    toast(`${okCount} berhasil${failCount ? `, ${failCount} gagal` : ''}`)
    refetch()
    ```
- CSV export (bila dipertahankan): header "Cara Pembayaran" + "Umur Berkas"
  (Step 8 / `berkas-arsip-csv.ts`); filename konstanta baru mis.
  `BERKAS_TERTUTUP_LIST_CSV_FILENAME`.
- Peringatan "belum pernah diekspor": **tidak di sini** (ada di aksi Bersihkan File).

*6c. `src/routes/arsiparis/berkas/$id.tsx` (detail — 2157 baris, hati-hati)*
- Label: "Arsip/Pengarsipan" → "Berkas/Pemberkasan"; "Jenis Pembayaran" → "Cara
  Pembayaran"; "Inaktif"/"Usul Musnah"/"Musnahkan Data"/"Dimusnahkan" → istilah
  baru (via `formatBerkasArchiveStatusLabel` + `resolveBerkasLifecycleAction`).
- Tombol aksi lifecycle mengikuti `resolveBerkasLifecycleAction` baru:
  - `AKTIF` → "Usulkan Pembersihan".
  - `USUL_MUSNAH` → "Bersihkan File" (dialog + ketik `BERSIHKAN FILE BERKAS`) **dan**
    "Batalkan Usulan" (dialog ringan, `action:'cancel_proposal'`).
- Redirect sukses: sesuaikan target ke route baru (`/arsiparis/pembersihan` bukan
  `/arsiparis/usul-musnah`; tidak ada lagi `/arsiparis/inaktif`).
- Titik-sisip **stub peringatan "belum pernah diekspor"** (K5): sebelum tombol
  "Bersihkan File", komponen/props peringatan yang default `null` +
  `// RP-02: aktifkan peringatan "belum pernah diekspor" di sini`.
- **Jangan** ubah string `Data file sudah dimusnahkan` bila muncul di halaman ini
  via `AttachmentViewer` / parsing error (allowlist). Teks naratif non-allowlist
  yang jelas milik detail berkas boleh disesuaikan (OQ2).

*6d. `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx` (329 baris)*
- Hapus field input "Retensi Inaktif" + baris preview "Masa Inaktif Berakhir".
- "Retensi Aktif" → **"Masa Simpan Minimal"** (label + helper text). Dropdown tetap
  `MANUAL_ARCHIVE_RETENTION_LABELS`.
- `getRetentionPreview` → satu tanggal ("Tanggal Jatuh Tempo: …"), memakai
  `calculateBerkasDueDate` (atau perhitungan preview lokal setara).
- `isInvalid` & payload submit: **berhenti mengirim `retensi_inaktif`** (schema
  `.strict()` akan menolak). Kirim `{ nomor_spm, retensi_aktif, closed_at? }`.
- Dipakai dari `berkas/index.tsx` (shortcut) & `berkas/$id.tsx` — pastikan kedua
  pemanggil tetap kompatibel.

*6e. `src/routes/arsiparis/pembersihan/index.tsx` (rename dari usul-musnah)*
- Sudah punya toggle `FinalArchiveFilter = 'USUL_MUSNAH' | 'DIMUSNAHKAN'`.
  Relabel: judul menu/halaman "Pembersihan Berkas"; toggle → **"Usulan Pembersihan"**
  (`USUL_MUSNAH`) / **"Sudah Dibersihkan"** (`DIMUSNAHKAN`).
- Baris `USUL_MUSNAH`: aksi **"Bersihkan File"** (dialog + `BERSIHKAN FILE BERKAS`)
  + **"Batalkan Usulan"** (`cancel_proposal`). Kolom **Umur Berkas**.
- Baris `DIMUSNAHKAN`: read-only (tidak ada aksi).
- CSV filename konstanta: rename `BERKAS_USUL_MUSNAH_LIST_CSV_FILENAME` →
  `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME` (atau tambah alias).
- Redirect sukses aksi → tetap di `/arsiparis/pembersihan`.
- Import `ArchiveX` / referensi `usul-musnah` → bersihkan.

*6f. `src/routes/arsiparis/index.tsx` (dashboard KSBU, 219 baris)*
- Hapus kartu/statistik "Arsip Inaktif". "Usul Musnah" → "Usul Pembersihan".
- "Jenis Pembayaran" → "Cara Pembayaran"; "musnah" → "pembersihan".
- Hapus import/pemakaian `ROUTES...INAKTIF`. Link "Usul Musnah" → `/arsiparis/pembersihan`.
- (Bila kartu dashboard mengambil hitung dari `status_arsip_counts` — sesuaikan key;
  `INAKTIF` sudah tidak ada.)

*6g. `src/routes/arsiparis/inbox.tsx`*
- "Jenis Pembayaran" → "Cara Pembayaran".

*6h. `src/routes/arsiparis/penambahan-arsip.tsx`*
- "Jenis Pembayaran" → "Cara Pembayaran"; retensi (bila dikumpulkan — cek; mungkin
  tidak sejak Phase 13E). "musnah" bila ada.

*6i. `src/routes/arsiparis/klasifikasi.tsx`*
- Judul "Master Klasifikasi Arsip" → "Master Klasifikasi Dokumen"; "Jenis
  Pembayaran" → "Cara Pembayaran".

*6j. `src/routes/arsiparis/dokumen/$id/index.tsx`*
- "Jenis Pembayaran" → "Cara Pembayaran".

**Files affected:** kesembilan file di atas + `berkas/tertutup.tsx` (isi penuh).

**Dependencies:** Step 3, Step 4 (kontrak API/DTO), Step 5 (route & nav).

---

### Step 7 — Komponen bersama

**What:** `StatusBadge.tsx`, `StatsBento.tsx`.

**Why:** Dipakai lintas halaman; relabel di sini menular ke semua konsumen.

**How (prose):**
- `src/components/ui/StatusBadge.tsx`:
  - Map status arsip (±ln 68-71): `AKTIF: 'Tersimpan'` (tone tetap `success`),
    `USUL_MUSNAH: 'Usul Pembersihan'`, `DIMUSNAHKAN: 'File Dibersihkan'`.
  - Hapus entri `INAKTIF` dari map; sempitkan union type `StatusArsip`
    (±ln 16-19) → buang `"INAKTIF"` **atau** biarkan di union tapi tanpa entri map
    (fallback "Status tidak dikenal"). Rekomendasi: buang dari union UI supaya
    TS menandai pemakaian lama.
- `src/components/dashboard/StatsBento.tsx` (156 baris):
  - Hapus tile "Arsip Inaktif". "Usul Musnah" → "Usul Pembersihan". "musnah" →
    "pembersihan".

**Files affected:** `src/components/ui/StatusBadge.tsx`,
`src/components/dashboard/StatsBento.tsx`.

**Dependencies:** Step 2. Bisa paralel dengan Step 6.

---

### Step 8 — Sweep label sisa + CSV

**What:** Jaring string kearsipan yang tersisa + finalisasi header CSV.

**Why:** RP-01 langkah 8 minta sapuan `grep` eksplisit sebagai bagian Definition of
Done. Perubahan label yang tercecer paling gampang lolos review.

**How (prose):**
- `src/lib/archive/berkas-arsip-csv.ts`:
  - `FOLDER_LIST_HEADERS` (±ln 58-61): `'Jenis Pembayaran'` → `'Cara Pembayaran'`;
    tambah kolom `'Umur Berkas'` (nilai dari DTO `umur_berkas`).
  - Konstanta filename: `BERKAS_INAKTIF_LIST_CSV_FILENAME` (hapus — halaman hilang),
    `BERKAS_USUL_MUSNAH_LIST_CSV_FILENAME` → `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME`,
    tambah `BERKAS_TERTUTUP_LIST_CSV_FILENAME`.
  - Label status arsip di baris data lewat `formatBerkasArchiveStatusLabel` →
    otomatis "Tersimpan"/"Usul Pembersihan"/"File Dibersihkan".
- `src/lib/archive/berkas-klasifikasi-eligibility.ts`: "Jenis Pembayaran" → "Cara
  Pembayaran".
- `src/lib/manual-arsip.ts`: referensi `INAKTIF` / "musnah" / retensi ganda.
- Sapuan grep (jalankan & bereskan sisa non-allowlist):
  ```
  grep -rn "Jenis Pembayaran" src/
  grep -rn "Pengarsipan\|Master Klasifikasi Arsip\|Arsip Aktif\|Arsip Inaktif" src/
  grep -rn "Usul Musnah\|Musnahkan Data\|Dimusnahkan" src/
  grep -rn "INAKTIF" src/          # hanya boleh sisa: archive-status.ts (komentar), schema, CHECK mirror
  grep -rn "retensi_inaktif\|masaInaktifBerakhir\|masa_inaktif" src/  # sisa: kolom warisan schema + repo INSERT null
  ```
- **Yang boleh tetap:** `ARCHIVE_STATUS_VALUES` memuat `'INAKTIF'`;
  `BERKAS_ACTIVITY_EVENT_TYPES` memuat `BERKAS_DIPINDAHKAN_KE_INAKTIF`; kolom
  `retensiInaktif`/`masaInaktifBerakhir` di schema; string `Data file sudah
  dimusnahkan` (allowlist); frasa internal `HAPUS FILE FISIK ARSIP`.

**Files affected:** `src/lib/archive/berkas-arsip-csv.ts`,
`src/lib/archive/berkas-klasifikasi-eligibility.ts`, `src/lib/manual-arsip.ts`,
+ file lain yang muncul di grep.

**Dependencies:** Step 3–7.

---

### Step 9 — `pnpm test` + perbaikan test

**What:** Jalankan `pnpm test` (vitest run), perbaiki test yang menyebut istilah
lama; pastikan tidak ada regresi.

**Why:** ±12 file test menyebut istilah lama (RP-01 bagian I). Definition of Done.

**How (prose):**
- Update daftar test di §6 `claude-research.md`:
  `berkas-arsip-service.test.ts`, `berkas-arsip-schema.test.ts`,
  `berkas-arsip-read-model.test.ts`, `berkas-arsip-api.test.ts`,
  `berkas-arsip-folder-pages.test.ts`, `berkas-arsip-csv.test.ts`,
  `berkas-arsip-physical-destruction.test.ts` (frasa konfirmasi **internal** tak
  berubah → seharusnya tetap hijau; kalau test mengecek user-facing phrase
  `MUSNAHKAN DATA FILE`, sesuaikan ke `BERSIHKAN FILE BERKAS`),
  `berkas-klasifikasi-eligibility.test.ts` ("Cara Pembayaran"),
  `manual-arsip-route.test.ts`, `workflow-archive-route.test.ts` (label),
  `tests/unit/components/ui-foundation.test.ts` (label `StatusBadge`),
  `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts` (kartu KSBU),
  `berkas-activity-dev-reset.test.ts` (bila mengecek nilai `INAKTIF`).
- `tests/e2e/**`: cari spec yang menavigasi `/arsiparis/inaktif` atau
  `/arsiparis/usul-musnah`; update path & label. Jalankan E2E hanya bila diminta
  (AGENTS.md Testing Expectations).
- Kalau ada test yang menegakkan perilaku lama `mark_inactive` sebagai valid → ubah
  jadi menegakkan penolakannya.

**Files affected:** file test di atas.

**Dependencies:** Step 1–8.

---

### Step 10 — Sinkron `docs/penjelasan-proyek.md` PB-6

**What:** Samakan label PB-6 dengan kondisi kode final.

**Why:** RP-01 bagian J: "Sinkronkan label PB-6 saat implementasi jadi (framing
sudah diperbarui)." Dokumen penjelasan bukan otoritas, tapi harus tidak
menyesatkan.

**How (prose):**
- PB-6.2 baris "Status sekarang vs target" — hapus/ubah jadi past-tense
  ("Sebelumnya form meminta retensi aktif + inaktif; sejak RP-01 satu field").
- PB-6.3 baris "Status sekarang vs target" — idem, lifecycle 2 tahap.
- Tabel penamaan PB-6 (±ln 307-322): tandai kolom "target" jadi "berlaku".
- Baris menu KSBU (±ln 324) — pastikan sesuai `navigation.ts` final.
- Legenda status RP di `docs/rencana-perubahan.md`: ubah **RP-01** jadi `Selesai`
  dan pindahkan ringkasan (langkah opsional, bisa oleh manusia saat merge).

**Files affected:** `docs/penjelasan-proyek.md`, (opsional) `docs/rencana-perubahan.md`.

**Dependencies:** Step 1–9.

---

## Build-red windows (urutan eksekusi)

Perubahan ini menyentuh konstanta yang dipakai silang, jadi ada jendela di mana
`tsc`/build merah **secara sengaja** sampai section berikutnya landing. Ini normal
untuk "satu unit perencanaan", tapi implementor harus sadar:

- Setelah **Step 2** (hapus `ROUTES...INAKTIF`, rename `USUL_MUSNAH`): TS error di
  `inaktif/index.tsx`, `navigation.ts`, `arsiparis/index.tsx` sampai **Step 5–6**.
- Setelah **Step 3** (union `BerkasArchiveLifecycleAction` tanpa `mark_inactive`,
  `resolveBerkasLifecycleAction` berubah bentuk): TS error di `$id.tsx` sampai
  **Step 6c**.
- Setelah **Step 4** (`closeBerkasMetadataSchema` tanpa `retensi_inaktif`):
  `CloseBerkasDialog` mengirim field yang ditolak sampai **Step 6d**.

→ Definition of Done tiap section = TS/lint hijau **untuk file dalam scope-nya** +
build hijau **hanya di akhir section-06/07**. Jalankan `pnpm test` penuh di
section-09. Jangan commit potongan yang meninggalkan build merah tanpa catatan
eksplisit di PR.

---

## Edge Cases & Error Handling

| Kasus | Penanganan |
|---|---|
| Berkas `CLOSED/AKTIF` dengan `masa_simpan = Permanen` | `masa_aktif_berakhir = 9999-12-31`; `jatuh_tempo` selalu `false`; tidak pernah masuk batch "Usulkan Semua yang Jatuh Tempo". |
| Berkas `CLOSED` lama tanpa `masa_aktif_berakhir` (data pra-RP) | `tanggal_jatuh_tempo = null`, `jatuh_tempo = false`. Umur tetap dihitung dari `closed_at`. Tidak error. |
| Data `INAKTIF` masih ada di DB (dev belum di-reset) | Baris tetap ter-fetch; `formatBerkasArchiveStatusLabel` → fallback "Status arsip tidak dikenal"; tidak muncul di halaman Terbuka/Tertutup/Pembersihan (filter `status_arsip` spesifik). Reset DB dev (K1) membereskan. Bukan crash. |
| `cancel_proposal` dipanggil saat status sudah `DIMUSNAHKAN` | `nextStatusForBerkasLifecycleAction` melempar `BERKAS_LIFECYCLE_INVALID` → API 409/400 aman. UI hanya menampilkan tombol "Batalkan Usulan" untuk `USUL_MUSNAH`. |
| `mark_inactive` masih dikirim klien lama / test lama | `lifecycleBodySchema` menolak (400 "Aksi lifecycle berkas tidak valid"). |
| Batch propose: sebagian berkas gagal (mis. status berubah oleh sesi lain) | Loop menangkap per-item; sukses tetap diterapkan; toast "X berhasil, Y gagal"; refresh menampilkan kondisi aktual. |
| `CloseBerkasDialog` (klien lama) masih mengirim `retensi_inaktif` | Schema `.strict()` menolak → 400 dengan pesan issue pertama. Section-06 wajib landing bersama section-04. |
| Race condition dua transisi lifecycle bersamaan | Sudah ditangani `updateBerkasArchiveStatus` dengan `currentStatusArsip` guard (optimistic) → `BERKAS_LIFECYCLE_INVALID` bila status sudah bergeser. Tidak berubah. |
| Route generation menghasilkan diff di luar 3 route | STOP; investigasi; jangan commit `routeTree.gen.ts` yang menyentuh route lain. |
| `masa_aktif_berakhir` bertipe `date` (tanpa jam) vs "hari ini" server | Bandingkan sebagai date-only (`YYYY-MM-DD`), bukan timestamp, untuk hindari off-by-one zona waktu. Helper `computeBerkasAging` memakai date-only. |

---

## Integration Points

- **`db-fsm-guard`**: transisi `status_arsip` bukan FSM `dokumen_transaksi`, tapi
  prinsip sama — server adalah otoritas, transisi ilegal ditolak, aksi destruktif
  butuh konfirmasi eksplisit. `nextStatusForBerkasLifecycleAction` +
  `updateBerkasArchiveStatus` (guard `currentStatusArsip`) adalah titik penegakan.
  Aksi `approve_destruction` tetap memicu penghapusan fisik file
  (`executeBerkasPhysicalFileDestruction`) — **tidak berubah**.
- **`ui-ux-pro-max`**: semua halaman di Step 6 & 7. Pertahankan pola komponen
  (`ArchivePagePrimitives`, `StatusBadge`, `EmptyState`, dialog konfirmasi
  ketik-persis) yang sudah dipakai.
- **File access / `DIMUSNAHKAN` block**: tidak disentuh. String
  `Data file sudah dimusnahkan` dikunci (allowlist + AGENTS.md + test).
- **CSV export folder-first** (`berkas-arsip-csv.ts`): metadata-only, tanpa
  ID/path/token — aturan Phase 13R/14F tetap berlaku; hanya header & kolom "Umur
  Berkas" yang ditambah.
- **RP-02 (Ekspor ZIP)**: titik-sisip stub peringatan "belum pernah diekspor" di
  UI dialog "Bersihkan File". Tidak ada kolom/endpoint baru.
- **Dashboard counts**: `status_arsip_counts` kehilangan bucket `INAKTIF`;
  konsumen (`StatsBento`, `arsiparis/index.tsx`) harus berhenti membacanya.

---

## Migration / Compatibility Notes

- **Tidak ada migrasi DB.** `src/db/schema/**`, `drizzle/*.sql` tidak berubah.
  CHECK constraint `berkas_arsip_status_arsip_check` &
  `berkas_arsip_activity_event_type_check` tetap memuat nilai lama — valid,
  hanya tidak dipakai runtime.
- **Kolom warisan:** `berkas_arsip.retensi_inaktif`,
  `berkas_arsip.masa_inaktif_berakhir` tetap ada (nullable), diisi `null` oleh
  runtime baru. Repo INSERT/UPDATE tetap menyebut kolom ini dengan nilai `null`
  (jangan hapus dari statement bila builder mensyaratkan kelengkapan kolom).
- **`src/routeTree.gen.ts`:** diregenerasi (diizinkan RP-01). Diff harus terbatas
  pada 3 route.
- **Reset DB dev (K1):** langkah manual manusia sebelum QA — bersihkan baris
  `berkas_arsip` berstatus `INAKTIF` di DB lokal (atau reset penuh tabel arsip
  folder-first mengikuti `phase-15l3c5b-controlled-dev-archive-data-reset-plan.md`).
  Tidak ada skrip baru di repo.
- **Klien lama:** payload `close` dengan `retensi_inaktif` & aksi lifecycle
  `mark_inactive` akan ditolak setelah deploy. Karena aplikasi internal single-deploy
  (bukan API publik), tidak butuh periode dual-support.
- **Identifier internal dipertahankan:** rename tabel/kolom/enum/route `/arsiparis`
  = fase terpisah, non-scope.

---

## Open Questions (tandai saat implementasi)

- **OQ1** — Label `METADATA_ARSIP_AKTIF_DIPERBARUI` untuk `cancel_proposal`
  dibiarkan generik. Bisa dibuat spesifik kapan saja (label murni, tanpa migrasi).
- **OQ2** — Wording pesan blok akses file `DIMUSNAHKAN` di permukaan non-allowlist:
  sesuaikan bila jelas user-facing & tidak menyentuh
  `Data file sudah dimusnahkan`/`AttachmentViewer` allowlist. Kalau ragu, biarkan.
- **OQ3** — Ikon lucide "Berkas Tertutup" (`FolderClosed` tidak ada) →
  `FolderCheck` / `Archive` / `Lock`. Pilih di Step 5/6.
- **OQ4** — `resolveBerkasLifecycleAction` return array vs fungsi terpisah untuk
  aksi sekunder (`cancel_proposal`). Putuskan saat menyentuh `$id.tsx` (dampak
  terkecil menang).
- **OQ5** — Filter "jatuh tempo" di list API: predikat SQL vs filter di memori.
  Default plan: sort di SQL (`closed_at ASC`), `due_only` difilter di memori
  (volume internal kecil). Naikkan ke SQL bila perlu.
- **OQ6** — Highlight navigasi: `/arsiparis/berkas/tertutup` adalah sub-path
  `/arsiparis/berkas`. Cek matcher nav di `AppLayout` — bila prefix-match, item
  "Berkas Terbuka" ikut menyala di halaman Tertutup. Pola yang sama sudah ada untuk
  `/arsiparis/berkas/$id`, jadi kemungkinan matcher sudah exact/aware; verifikasi
  saat Step 5 dan pakai `activeOptions={{ exact: true }}` bila perlu.
