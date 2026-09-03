# Section 06 — Halaman UI

## Context

Backend (section-03), API (section-04), dan route/nav (section-05) siap. Section ini
mengisi & me-relabel permukaan yang dilihat pengguna, termasuk perilaku baru:
aksi lifecycle "Usulkan Pembersihan" / "Bersihkan File" / "Batalkan Usulan", form
retensi satu field, badge Jatuh Tempo, dan batch "Usulkan Semua yang Jatuh Tempo".

**Wajib** ikuti `.agent/skills/ui-ux-pro-max/SKILL.md`. Pertahankan pola komponen
repo (`ArchivePagePrimitives`, `StatusBadge`, `EmptyState`, `LoadingState`,
`ErrorState`, dialog konfirmasi ketik-persis, `apiFetch`).

## Objective

10 halaman/komponen ter-relabel & berperilaku sesuai target RP-01; test halaman
hijau; build TS hijau setelah section ini (bersama section-07).

## Prerequisites

- Section 03, 04, 05 selesai.
- Baca `../claude-research.md` §5 (peta halaman + baris), `../claude-plan.md` Step 6.

## Implementation Steps

### 6a. `src/routes/arsiparis/berkas/index.tsx` (Berkas Terbuka)
- Fokuskan ke daftar `status_berkas=OPEN`. Judul/subjudul "Berkas Terbuka".
- Pindahkan seksi "Pemberkasan Arsip Aktif" keluar dari halaman ini (→ 6b).
- "Jenis Pembayaran" → "Cara Pembayaran". Shortcut "Tutup Berkas" tetap → membuka
  `CloseBerkasDialog` (6d).

### 6b. `src/routes/arsiparis/berkas/tertutup.tsx` (BARU — isi penuh stub section-05)
- Fetch `GET /api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF`
  (pola `apiFetch`/`ApiError` seperti `inaktif/index.tsx` lama — pindahkan
  sebagian besar UI-nya ke sini).
- Kolom: Cara Pembayaran, Nomor SPM, Tgl Tutup, **Umur Berkas** (`umur_berkas` +
  " hari"), **badge "Jatuh Tempo"** bila `jatuh_tempo`, jumlah item, nominal.
- Urut default terlama dulu (server sudah `closed_at ASC`).
- Aksi per baris **"Usulkan Pembersihan"** → dialog konfirmasi →
  `POST /api/arsiparis/berkas/$id/lifecycle { action: 'propose_destruction' }` →
  refetch + toast; baris pindah keluar dari daftar.
- **Batch "Usulkan Semua yang Jatuh Tempo":**
  - Tombol enabled hanya bila ada ≥1 baris `jatuh_tempo`.
  - Klik → dialog: "N berkas jatuh tempo akan diusulkan untuk pembersihan. Lanjut?"
    (`Batal` / `Usulkan Semua`).
  - Eksekusi: kumpulkan `berkas_id` baris `jatuh_tempo`; panggil endpoint
    `propose_destruction` per berkas dengan konkurensi terbatas (mis. 4).
    ```
    const ids = rows.filter(r => r.jatuh_tempo).map(r => r.berkas_id)
    const results = await mapWithConcurrency(ids, 4, id =>
      apiFetch(lifecycleUrl(id), { method:'POST', body:{ action:'propose_destruction' }})
        .then(() => ({ id, ok:true })).catch(() => ({ id, ok:false })))
    toast(`${okCount} berhasil${failCount ? `, ${failCount} gagal` : ''}`)
    refetch()
    ```
  - Kegagalan sebagian tidak membatalkan sukses.
- CSV export (bila dipertahankan): filename `BERKAS_TERTUTUP_LIST_CSV_FILENAME`
  (section-08).
- Reuse `ArchivePagePrimitives` + `PageLayout`.

### 6c. `src/routes/arsiparis/berkas/$id.tsx` (detail — 2157 baris, hati-hati)
- Relabel: "Arsip/Pengarsipan" → "Berkas/Pemberkasan"; "Jenis Pembayaran" → "Cara
  Pembayaran"; status via `formatBerkasArchiveStatusLabel` (sudah baru).
- Tombol aksi lifecycle dari `resolveBerkasLifecycleAction` baru:
  - `AKTIF` → "Usulkan Pembersihan".
  - `USUL_MUSNAH` → "Bersihkan File" (dialog + ketik `BERSIHKAN FILE BERKAS`) **dan**
    "Batalkan Usulan" (dialog ringan, `action:'cancel_proposal'`, tanpa ketik).
  - Sesuaikan pemakaian bila return `resolveBerkasLifecycleAction` berubah jadi
    array (OQ4).
- Redirect sukses: `/arsiparis/pembersihan` (bukan `/arsiparis/usul-musnah`); tak
  ada lagi `/arsiparis/inaktif`.
- **Stub peringatan "belum pernah diekspor"** (K5): sebelum tombol "Bersihkan
  File", slot komponen/props yang default `null` +
  `// RP-02: aktifkan peringatan "belum pernah diekspor" di sini`
  (`data-testid="export-warning-slot"`).
- **Jangan** ubah string `Data file sudah dimusnahkan` (AttachmentViewer/allowlist).
  Teks naratif non-allowlist yang jelas milik detail berkas boleh disesuaikan (OQ2).

### 6d. `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx` (329 baris)
- Hapus input "Retensi Inaktif" + preview "Masa Inaktif Berakhir".
- "Retensi Aktif" → **"Masa Simpan Minimal"** (label + helper text). Dropdown tetap
  `MANUAL_ARCHIVE_RETENTION_LABELS`.
- `getRetentionPreview` → satu tanggal "Tanggal Jatuh Tempo" (pakai
  `calculateBerkasDueDate` atau perhitungan preview setara).
- `isInvalid` & payload submit: kirim `{ nomor_spm, retensi_aktif, closed_at? }` —
  **berhenti mengirim `retensi_inaktif`** (schema `.strict()`).
- Dipakai dari `berkas/index.tsx` shortcut & `berkas/$id.tsx` — verifikasi kedua
  pemanggil.

### 6e. `src/routes/arsiparis/pembersihan/index.tsx` (rename dari usul-musnah)
- Sudah punya toggle `FinalArchiveFilter = 'USUL_MUSNAH' | 'DIMUSNAHKAN'`.
- Judul menu/halaman "Pembersihan Berkas"; toggle → **"Usulan Pembersihan"**
  (`USUL_MUSNAH`) / **"Sudah Dibersihkan"** (`DIMUSNAHKAN`).
- Baris `USUL_MUSNAH`: aksi **"Bersihkan File"** (dialog + `BERSIHKAN FILE BERKAS`)
  + **"Batalkan Usulan"** (`cancel_proposal`). Kolom **Umur Berkas**.
- Baris `DIMUSNAHKAN`: read-only.
- CSV filename → `BERKAS_PEMBERSIHAN_LIST_CSV_FILENAME` (section-08).
- Redirect sukses → tetap `/arsiparis/pembersihan`.
- Bersihkan import `ArchiveX` / referensi `usul-musnah`.
- Stub peringatan ekspor (K5) di dialog "Bersihkan File" (sama seperti 6c).

### 6f. `src/routes/arsiparis/index.tsx` (dashboard KSBU, 219 baris)
- Hapus kartu/statistik "Arsip Inaktif". "Usul Musnah" → "Usul Pembersihan"
  (link → `/arsiparis/pembersihan`).
- "Jenis Pembayaran" → "Cara Pembayaran"; "musnah" → "pembersihan".
- Hapus import/pemakaian `ROUTES...INAKTIF`.
- Bila kartu membaca `status_arsip_counts.INAKTIF` → hapus (kunci sudah tak ada).

### 6g. `src/routes/arsiparis/inbox.tsx` — "Jenis Pembayaran" → "Cara Pembayaran".
### 6h. `src/routes/arsiparis/penambahan-arsip.tsx` — "Jenis Pembayaran" → "Cara
  Pembayaran"; retensi bila dikumpulkan (cek — mungkin tidak sejak Phase 13E);
  "musnah" bila ada.
### 6i. `src/routes/arsiparis/klasifikasi.tsx` — judul "Master Klasifikasi Arsip" →
  "Master Klasifikasi Dokumen"; "Jenis Pembayaran" → "Cara Pembayaran".
### 6j. `src/routes/arsiparis/dokumen/$id/index.tsx` — "Jenis Pembayaran" → "Cara
  Pembayaran".

## Files to Create/Modify

- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/tertutup.tsx` (isi penuh)
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx`
- `src/routes/arsiparis/pembersihan/index.tsx`
- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/routes/arsiparis/klasifikasi.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts` (+ test halaman lain)

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 6" (6a–6j). Poin kunci:
- [ ] `/arsiparis/berkas` = "Berkas Terbuka", tanpa seksi "Pemberkasan Arsip Aktif".
- [ ] `/arsiparis/berkas/tertutup`: kolom "Umur Berkas", badge "Jatuh Tempo",
      tombol "Usulkan Pembersihan" per baris.
- [ ] Batch "Usulkan Semua…": disabled tanpa baris jatuh tempo; dialog menyebut N;
      memanggil lifecycle per id; toast ringkasan; 1 gagal tak menghentikan sisa.
- [ ] Detail `$id`: `AKTIF`→"Usulkan Pembersihan"; `USUL_MUSNAH`→"Bersihkan File" +
      "Batalkan Usulan"; dialog "Bersihkan File" minta ketik `BERSIHKAN FILE BERKAS`;
      redirect sukses bukan ke `/arsiparis/inaktif`/`/arsiparis/usul-musnah`;
      slot peringatan ekspor kosong; `Data file sudah dimusnahkan` tak berubah.
- [ ] `CloseBerkasDialog`: tanpa "Retensi Inaktif"; label "Masa Simpan Minimal";
      preview satu tanggal; payload tanpa `retensi_inaktif`.
- [ ] `/arsiparis/pembersihan` merender; `/arsiparis/usul-musnah` tak terdaftar;
      toggle "Usulan Pembersihan"/"Sudah Dibersihkan"; "Bersihkan File" +
      "Batalkan Usulan"; kolom Umur Berkas.
- [ ] Dashboard KSBU: tanpa "Arsip Inaktif"; "Usul Pembersihan"; tanpa "Jenis
      Pembayaran".
- [ ] inbox/penambahan/klasifikasi/dokumen-detail: tanpa "Jenis Pembayaran";
      klasifikasi judul "Master Klasifikasi Dokumen".

## Definition of Done

- [ ] 10 file UI diubah; test halaman hijau.
- [ ] Build TS hijau (bersama section-07).
- [ ] Batch propose berfungsi dengan ringkasan hasil & tahan kegagalan sebalikan.
- [ ] `CloseBerkasDialog` submit tanpa `retensi_inaktif` (verifikasi mock body).
- [ ] Tidak ada string `Data file sudah dimusnahkan` yang diubah.
- [ ] Tidak ada regresi section 03/04/05.
