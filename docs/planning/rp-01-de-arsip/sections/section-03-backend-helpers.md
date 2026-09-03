# Section 03 — Helper Backend + Service Lifecycle + Read-Model

## Context

Konstanta (section-02) siap. Ini inti perubahan **perilaku**: perhitungan retensi
jadi satu field, tabel transisi lifecycle baru, pemetaan event action-aware, dan
field `umur` / `jatuhTempo` di read-model (dihitung saat baca — tanpa scheduler).
Menyentuh transisi status berkas → ikuti `.agent/skills/db-fsm-guard/SKILL.md`
(server otoritas, transisi ilegal ditolak, aksi destruktif butuh konfirmasi).

## Objective

- `retention.ts`: `calculateBerkasDueDate({ closedAt, masaSimpan })` → satu tanggal.
- `berkas-arsip-service.ts`: `propose_destruction: AKTIF→USUL_MUSNAH`,
  `cancel_proposal: USUL_MUSNAH→AKTIF` (event `METADATA_ARSIP_AKTIF_DIPERBARUI`),
  `approve_destruction` tetap, `mark_inactive` dihapus; `closeBerkasArsip` &
  `updateActiveBerkasMetadata` pakai satu field, field inaktif ditulis `null`.
- `berkas-arsip-read-model.ts`: DTO list & detail +`umur_berkas` +`jatuh_tempo`
  +`tanggal_jatuh_tempo`; cabang/`status_arsip_counts` `INAKTIF` dibuang; sort
  default `closed_at ASC`.
- `page-format.ts`: label status arsip baru; `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE`
  = `'BERSIHKAN FILE BERKAS'`; `resolveBerkasLifecycleAction` menghasilkan aksi
  "Usulkan Pembersihan" / ("Bersihkan File" + "Batalkan Usulan").
- Test unit backend hijau.

## Prerequisites

- Section 02 selesai.
- Baca: `../claude-research.md` §3 (lokasi fungsi & nomor baris),
  `.agent/skills/db-fsm-guard/SKILL.md`.

## Implementation Steps

### 3a. `src/lib/archive/retention.ts`
1. Tambah `calculateBerkasDueDate({ closedAt: string; masaSimpan: RetensiLabel }): string`:
   `'Permanen'` → `PERMANENT_RETENTION_SENTINEL_DATE`; selain itu
   `addCalendarYears(closedAt, RETENTION_YEARS_BY_LABEL[masaSimpan])`. Validasi
   `isDateOnlyString(closedAt)` — throw bila tidak valid.
2. `grep` pemanggil `calculateManualArchiveRetentionDates`. Jika hanya
   `buildCloseBerkasPlan` + `buildActiveBerkasMetadataPlan` (yang akan pindah ke
   `calculateBerkasDueDate`), hapus fungsi lama; jika masih ada pemanggil manual
   archive lain, biarkan.
3. (Opsional keterbacaan) `export const MASA_SIMPAN_LABELS = MANUAL_ARCHIVE_RETENTION_LABELS`.
4. Pertimbangkan helper murni `computeBerkasAging({ closedAt, dueDate, now }): { umurHari: number | null; jatuhTempo: boolean }`
   di sini (dipakai read-model list + detail). Bandingkan **date-only**.

### 3b. `src/lib/archive/berkas-arsip-service.ts`
1. `BerkasArchiveLifecycleAction` (±ln 138) →
   `'propose_destruction' | 'cancel_proposal' | 'approve_destruction'`.
2. `nextStatusForBerkasLifecycleAction` (±ln 891) tabel `allowed`:
   ```
   propose_destruction: { [AKTIF]: USUL_MUSNAH }
   cancel_proposal:     { [USUL_MUSNAH]: AKTIF }
   approve_destruction: { [USUL_MUSNAH]: DIMUSNAHKAN }
   ```
3. Ganti `eventTypeForBerkasLifecycleStatus(status)` (±ln 956) →
   `eventTypeForBerkasLifecycleAction(action: BerkasArchiveLifecycleAction): BerkasActivityEventType`:
   ```
   propose_destruction -> 'BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH'
   cancel_proposal     -> 'METADATA_ARSIP_AKTIF_DIPERBARUI'
   approve_destruction -> 'BERKAS_DIMUSNAHKAN'
   ```
   Di `transitionBerkasArchiveStatus` (±ln 454) panggil dengan `input.action`.
4. `buildCloseBerkasPlan` (±ln 542): hitung `masaAktifBerakhir` via
   `calculateBerkasDueDate({ closedAt: closedAtDateOnly, masaSimpan: parsed.retensi_aktif })`.
   `CloseBerkasPlan` tak lagi butuh `retensiInaktif` / `masaInaktifBerakhir` (hapus
   dari tipe, atau isi `null`).
5. `closeBerkasArsip` (±ln 397-410): `appendBerkasActivity('BERKAS_DITUTUP')`
   `metadataSnapshot` → `retensi_inaktif: null`, `masa_inaktif_berakhir: null`.
6. `buildActiveBerkasMetadataPlan` (±ln 512) + `updateActiveBerkasMetadata`
   (±ln 494-507): pola sama — satu field, `calculateBerkasDueDate` dari
   `existingClosedAt`, snapshot inaktif `null`.
7. Repository layer (`defaultBerkasArsipRepository`, ±ln 566+): pastikan
   `closeOpenBerkas` / `updateActiveBerkasMetadata` / `updateBerkasArchiveStatus`
   menulis kolom `retensi_inaktif` / `masa_inaktif_berakhir` = `null` bila builder
   menyertakannya (kolom nullable — aman).
8. Guard `updateBerkasArchiveStatus` (`currentStatusArsip` optimistic) **tidak
   diubah** — tetap menolak transisi bila status sudah bergeser.

### 3c. `src/lib/archive/berkas-arsip-read-model.ts`
1. Tambah field DTO list & detail: `umur_berkas: number | null`,
   `jatuh_tempo: boolean`, `tanggal_jatuh_tempo: string | null`
   (= `masa_aktif_berakhir`).
2. Di mapper row→DTO (±ln 520-540) hitung via `computeBerkasAging`
   (`now` = tanggal server). `OPEN` → `umur_berkas = null`, `jatuh_tempo = false`.
   Sentinel `9999-12-31` → `jatuh_tempo = false`.
3. `status_arsip_counts` (±ln 599-611): berhenti membuat bucket `INAKTIF`
   (jangan increment). `UNKNOWN` tetap.
4. Hapus penyaringan/pelabelan `INAKTIF` lain di file ini.
5. Sort default query berstatus `CLOSED`: `ORDER BY closed_at ASC` (terlama dulu).
   Daftar `OPEN` biarkan urutan existing.
6. (Opsional) tambah `due_only?: boolean` ke `listBerkasArsipFolderQuerySchema` +
   `ListBerkasArsipFolderQuery`; filter di memori setelah fetch (volume internal
   kecil). Kalau tidak, tinggalkan untuk section-06 memfilter di klien.

### 3d. `src/lib/archive/berkas-arsip-page-format.ts`
1. `formatBerkasArchiveStatusLabel` (±ln 25): `AKTIF → 'Tersimpan'`,
   `USUL_MUSNAH → 'Usul Pembersihan'`, `DIMUSNAHKAN → 'File Dibersihkan'`; hapus
   cabang `INAKTIF`.
2. `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE` (±ln 16) → `'BERSIHKAN FILE BERKAS'`.
3. `BerkasLifecycleActionView.action` (±ln 8): tambah `'cancel_proposal'`, buang
   `'mark_inactive'`.
4. `resolveBerkasLifecycleAction` (±ln 40):
   - `AKTIF` → aksi primer `propose_destruction`, label "Usulkan Pembersihan",
     konfirmasi "Berkas akan masuk daftar Usul Pembersihan. Dokumen tidak dihapus.",
     success "Berkas berhasil masuk daftar Usul Pembersihan.".
   - `USUL_MUSNAH` → kembalikan **kedua** aksi (ubah return jadi
     `BerkasLifecycleActionView[]`, ATAU sediakan
     `resolveSecondaryBerkasLifecycleAction` — pilih dampak terkecil, lihat OQ4):
     - `approve_destruction`: label "Bersihkan File", `confirmationPhrase`
       `'BERSIHKAN FILE BERKAS'`, copy: status jadi "File Dibersihkan", soft file
       dihapus, preview/download diblokir, metadata tetap.
     - `cancel_proposal`: label "Batalkan Usulan", konfirmasi ringan tanpa phrase,
       success "Usulan pembersihan dibatalkan.".
   - Hapus cabang `INAKTIF` & `mark_inactive`.

### 3e. Test unit
- `tests/unit/arsiparis/berkas-arsip-service.test.ts` — lihat TDD 3b/3c/3d/3e.
- `tests/unit/arsiparis/berkas-arsip-read-model.test.ts` — lihat TDD 3f/3g/3h.
- `tests/unit/**/retention*.test.ts` (bila ada) — TDD 3a.
- Jalankan hanya file test ini (`pnpm vitest run tests/unit/arsiparis/berkas-arsip-service.test.ts ...`).

## Files to Create/Modify

- `src/lib/archive/retention.ts`
- `src/lib/archive/berkas-arsip-service.ts`
- `src/lib/archive/berkas-arsip-read-model.ts`
- `src/lib/archive/berkas-arsip-page-format.ts`
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`
- `tests/unit/arsiparis/berkas-arsip-read-model.test.ts`
- (opsional) `tests/unit/**/retention*.test.ts`

## Test Stubs

Salin dari `../claude-plan-tdd.md` "Tests for: Step 3" (3a–3i). Poin kunci:
- [ ] `calculateBerkasDueDate` happy/permanen/error.
- [ ] `nextStatusForBerkasLifecycleAction`: 3 transisi valid + ≥5 transisi ilegal
      ditolak.
- [ ] `cancel_proposal` → event `METADATA_ARSIP_AKTIF_DIPERBARUI` (bukan
      `BERKAS_DITUTUP`).
- [ ] `closeBerkasArsip` menulis `masa_aktif_berakhir = closed_at + masa`,
      inaktif = `null`.
- [ ] Read-model: `umur_berkas`, `jatuh_tempo` (today==due, <due, sentinel, OPEN,
      CLOSED tanpa due), date-only tidak off-by-one.
- [ ] `status_arsip_counts` tanpa `INAKTIF`; sort terlama dulu.
- [ ] `page-format`: label baru; `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE`;
      `resolveBerkasLifecycleAction` untuk `AKTIF` & `USUL_MUSNAH`; `INAKTIF`→`null`.

## Definition of Done

- [x] `retention.ts` (`calculateBerkasDueDate` + `computeBerkasAging`),
      `berkas-arsip-service.ts` (transisi 2-tahap + `eventTypeForBerkasLifecycleAction`
      action-aware + single-field plans), `berkas-arsip-read-model.ts`
      (`umur_berkas`/`jatuh_tempo`/`tanggal_jatuh_tempo` + `due_only` + `closed_at ASC`
      untuk CLOSED), `berkas-arsip-page-format.ts` (label RP-01 + phrase
      `BERSIHKAN FILE BERKAS` + `resolveSecondaryBerkasLifecycleAction`).
- [x] `closeBerkasMetadataSchema` disederhanakan (folded dari section-04):
      satu field, `.strict()`, pesan "Masa Simpan Minimal tidak valid".
- [x] Test hijau: `berkas-arsip-service.test.ts`, `berkas-arsip-schema.test.ts`,
      `berkas-arsip-api.test.ts`, `berkas-arsip-folder-pages.test.ts`.
      **Full suite: 810 passed / 1 skipped / 0 regresi.**
- [x] Tidak ada perubahan schema DB / migrasi. `src/db/schema/**` utuh.
- [x] `BERKAS_ACTIVITY_EVENT_TYPES` tak berubah; `cancel_proposal` pakai event
      `METADATA_ARSIP_AKTIF_DIPERBARUI` yang sudah ada.
- [x] Guard optimistic `updateBerkasArchiveStatus` tetap.
- [x] TS: nol error di file section-03/04. Build-red sisa hanya di
      `navigation.ts` (section-05) + `arsiparis/berkas/$id.tsx` &
      `arsiparis/index.tsx` (section-06). Error TS lain di repo = baseline
      pre-existing (TanStack `event` drift, leftover supabase ref), bukan dari RP-01.

## Deviasi

Lihat `../code-reviews/section-03-review.md`. Ringkas: section 03+04 digabung jadi
satu commit backend; `berkas-arsip-folder-pages.test.ts` monolithic source-shape
test di-`it.skip` untuk section-06; 2 test `buildBerkasHistoryItems` tetap
`'Berkas dimusnahkan'` (label hardcoded `$id.tsx`, relabel di section-06c);
`resolveBerkasLifecycleAction` tetap single-return + fungsi baru untuk aksi
sekunder; `due_only` filter di memori.
