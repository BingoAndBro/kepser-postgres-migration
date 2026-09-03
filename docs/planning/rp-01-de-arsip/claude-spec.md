# Synthesized Spec — RP-01: De-arsip-kan Istilah + Sederhanakan Lifecycle Berkas

Gabungan `docs/rencana-perubahan.md` (RP-01) + `claude-research.md` + `claude-interview.md`.
Otoritas final tetap `AGENTS.md`.

---

## Problem Statement

Aplikasi ini adalah *staging* dokumen internal BPS, **bukan** sistem kearsipan
resmi. UI, pesan validasi, label CSV, dan label activity masih memakai bahasa
kearsipan resmi (arsip, retensi aktif/inaktif, usul musnah, musnahkan) yang
mengesankan kepatuhan UU 43/2009 (JRA ANRI, penyusutan, berita acara pemusnahan) —
padahal tidak relevan dan berisiko mengundang tuntutan kepatuhan. Lifecycle berkas
sesudah "tutup" juga terlalu panjang: 4 tahap (`AKTIF → INAKTIF → USUL_MUSNAH →
DIMUSNAHKAN`) dengan 2 field retensi dan halaman terpisah untuk tahap "Inaktif"
yang tidak memberi nilai.

## Goals

1. **Relabel** seluruh istilah kearsipan resmi jadi istilah netral (berkas / masa
   simpan / pembersihan file), di UI, pesan validasi, label CSV, label activity —
   **tanpa** mengubah identifier internal (nama tabel/kolom/enum, route `/arsiparis`).
2. **Sederhanakan lifecycle** sesudah tutup dari 4 tahap jadi 2:
   `Usul Pembersihan → File Dibersihkan`. `INAKTIF` dibuang dari alur.
3. **Satu field retensi** di Form Tutup Berkas: "Masa Simpan Minimal" (menggantikan
   pasangan retensi aktif + inaktif).
4. **Tanpa scheduler.** "Jatuh Tempo" dihitung saat halaman/endpoint dibaca
   (`hari ini ≥ closed_at + masa_simpan`). Perpindahan state tetap butuh klik + konfirmasi.
5. **Tanpa migrasi DB.** Nilai enum lama (`INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`,
   `retensi_inaktif`, `masa_inaktif_berakhir`) dibiarkan ada; CHECK constraint tetap
   memuat nilai lama (harmless).
6. Hapus halaman + menu `/arsiparis/inaktif`. Rename `/arsiparis/usul-musnah` →
   `/arsiparis/pembersihan` (menu "Pembersihan Berkas", toggle 2 daftar).
7. Kolom **Umur Berkas** (dihitung) + badge **Jatuh Tempo** (dihitung) di daftar
   Berkas Tertutup & Pembersihan Berkas. Urut default terlama dulu.
8. Aksi baru **`cancel_proposal`** (`USUL_MUSNAH → AKTIF`, tombol "Batalkan Usulan").
9. Tombol batch **"Usulkan Semua yang Jatuh Tempo"** di Berkas Tertutup.
10. Dashboard KSBU: kartu "Arsip Inaktif" dihapus; "Usul Musnah" → "Usul Pembersihan".
11. Dokumen inti (`AGENTS.md`, `docs/migration/README.md`) disinkronkan **sebelum**
    kode (invariant "Update docs before behavior changes");
    `docs/penjelasan-proyek.md` PB-6 disinkronkan di akhir.

## Non-Goals (Explicit Exclusions)

- Rename identifier internal / nama tabel / kolom / nilai enum DB → butuh migrasi,
  fase terpisah.
- Scheduler / cron / auto-transition.
- Ekspor ZIP (RP-02) — kecuali **titik-sisip no-op** untuk peringatan "belum pernah
  diekspor" (langkah 8 RP-01).
- Perubahan FSM `dokumen_transaksi` (alur persetujuan dokumen) — tidak tersentuh.
- Perubahan boundary `dms_session`, RBAC server, same-origin.
- Penghapusan fisik file di luar aksi "Bersihkan File" (`approve_destruction`) yang
  sudah ada.
- **Mengganti string `Data file sudah dimusnahkan`** (backend blok `DIMUSNAHKAN` +
  allowlist parsing UI `AttachmentViewer` + test + `AGENTS.md` Storage Rules).
  Dikunci lintas-lapisan; di luar scope RP-01.
- **Mengganti frasa internal `HAPUS FILE FISIK ARSIP`** (server-only, bukan
  user-facing).
- Kolom DB `terakhir_diekspor_at` / event `BERKAS_DIEKSPOR` (khusus RP-02).

## Context & Constraints

- **Target tanpa migrasi.** `src/db/schema/arsip/berkas-arsip.ts` tidak berubah
  struktur. CHECK `berkas_arsip_status_arsip_check` &
  `berkas_arsip_activity_event_type_check` tetap memuat nilai lama. Kolom
  `retensiInaktif` / `masaInaktifBerakhir` jadi kolom warisan (tetap nullable, tidak
  diisi).
- **`BERKAS_ACTIVITY_EVENT_TYPES`** (`src/lib/archive/berkas-arsip-activity.ts`)
  **tidak boleh diubah** (mirror CHECK constraint DB) — hanya labelnya.
- **`ARCHIVE_STATUS_VALUES`** (`src/lib/constants/archive-status.ts`) dibiarkan
  (dipakai Zod + DB CHECK). Tambah helper `BERKAS_RESTING_STATUS = 'AKTIF'` +
  komentar deprecated `INAKTIF`.
- **`src/routeTree.gen.ts`**: RP-01 **mengizinkan** route generation untuk
  penghapusan (`/arsiparis/inaktif`), rename (`/arsiparis/usul-musnah` →
  `/arsiparis/pembersihan`), dan penambahan (`/arsiparis/berkas/tertutup`).
  Jalankan generator resmi (`@tanstack/router-plugin` via `pnpm dev`/`pnpm build`),
  **jangan edit manual**. Langkah tersendiri + verifikasi diff.
- **"Update docs before behavior changes"**: `AGENTS.md` + `docs/migration/README.md`
  = langkah **pertama**.
- **"No magic strings"**: route via `routes.ts`, status via `archive-status.ts`.
- **"Zod at every boundary"**: `src/lib/schemas/berkas-arsip.ts` diubah bersamaan
  handler.
- **Aplikasi internal & mandiri**: tidak ada panggilan keluar (RP-01 tidak
  menyentuh ini).
- `closeBerkasMetadataSchema` memakai `.strict()` → menghapus `retensi_inaktif`
  memaksa `CloseBerkasDialog` berhenti mengirim field itu di rangkaian yang sama.

## Model target (label ⇄ internal)

```
Pengklasifikasian Dokumen ─┐
                           ├─▶ BERKAS TERBUKA ──(Tutup Berkas: +Nomor SPM +Masa Simpan Minimal)──▶ BERKAS TERTUTUP
Penambahan Dokumen ────────┘    (get-or-create per Cara Pembayaran)                                     │
                                                                                                      │
   BERKAS TERTUTUP ◀──(Batalkan Usulan)── USUL PEMBERSIHAN ◀──(Usulkan Pembersihan / batch jatuh tempo)┘
                                                │
                                                ▼  (Bersihkan File — konfirmasi "BERSIHKAN FILE BERKAS")
                                       FILE DIBERSIHKAN  (terminal; hanya soft file dihapus, metadata tetap)
```

| Label tampilan | `status_berkas` | `status_arsip` |
|---|---|---|
| Terbuka | `OPEN` | `null` |
| Tertutup (chip "Tersimpan") | `CLOSED` | `AKTIF` |
| Usul Pembersihan | `CLOSED` | `USUL_MUSNAH` |
| File Dibersihkan | `CLOSED` | `DIMUSNAHKAN` |
| ~~Inaktif~~ (dibuang dari alur) | — | `INAKTIF` *(nilai enum tetap ada, tak dipakai)* |

Transisi lifecycle target (`nextStatusForBerkasLifecycleAction`):
```
propose_destruction: AKTIF      -> USUL_MUSNAH     (langsung; dulu INAKTIF -> USUL_MUSNAH)
cancel_proposal:     USUL_MUSNAH -> AKTIF          (BARU; event METADATA_ARSIP_AKTIF_DIPERBARUI)
approve_destruction: USUL_MUSNAH -> DIMUSNAHKAN    (tetap; frasa "BERSIHKAN FILE BERKAS")
mark_inactive:       dihapus (aksi ditolak / tidak lagi diekspos)
```

## Key Decisions Made (dari interview)

| # | Keputusan |
|---|---|
| K1 | Data `INAKTIF` lama: **reset DB dev** (manual, terkontrol) + hapus cabang `INAKTIF` dari kode. Tanpa jalur kompat map-di-read-model. |
| K2 | `cancel_proposal` → event **`METADATA_ARSIP_AKTIF_DIPERBARUI`** (tanpa migrasi). Logika event dibuat **action-aware**. |
| K3 | Navigasi: **2 item menu** — "Berkas Terbuka" (`/arsiparis/berkas`) + "Berkas Tertutup" (`/arsiparis/berkas/tertutup`, route baru). |
| K4 | Batch "Usulkan Semua yang Jatuh Tempo": **in scope**, tanpa endpoint baru (klien loop `propose_destruction` per berkas, satu konfirmasi, ringkasan hasil). |
| K5 | Peringatan "belum pernah diekspor": **stub no-op** di UI, diaktifkan setelah RP-02. |
| K6 | String `Data file sudah dimusnahkan` & frasa `HAPUS FILE FISIK ARSIP`: **tidak diubah** (non-scope). |
| K7 | `closeBerkasMetadataSchema`: hapus `retensi_inaktif`; section Zod/API + section UI dialog dikerjakan berdekatan. `retensi_aktif` dipertahankan sebagai key (pesan → "Masa Simpan Minimal tidak valid"). |

## Assumptions

- A1. Tidak ada baris DB **produksi** berstatus `INAKTIF` (ini handoff internal/LAN;
  hanya DB dev). Bila ternyata ada di lingkungan lain, butuh keputusan backfill
  terpisah — di luar RP-01.
- A2. `MANUAL_ARCHIVE_RETENTION_LABELS` (`1/3/5/10 Tahun`, `Permanen`) cocok dipakai
  ulang untuk dropdown "Masa Simpan Minimal" tanpa perubahan nilai.
- A3. `masa_aktif_berakhir` (kolom `date`, sudah ada) cukup sebagai penyimpan
  `tanggal_jatuh_tempo`. "Permanen" → sentinel `9999-12-31` → tidak pernah "Jatuh
  Tempo".
- A4. Halaman `/arsiparis/berkas/$id` menerima segmen statis sibling `tertutup`
  tanpa konflik (id selalu UUID).
- A5. `AttachmentViewer` / file-access tests tidak akan pecah selama string
  `Data file sudah dimusnahkan` tidak disentuh.
- A6. Route generation via plugin menghasilkan diff `routeTree.gen.ts` yang terbatas
  pada 3 route yang berubah; tidak ada efek samping ke route lain.

## Open Questions (kecil, tidak memblokir)

- OQ1. Apakah label `METADATA_ARSIP_AKTIF_DIPERBARUI` perlu dibuat lebih spesifik
  ("Usulan pembersihan dibatalkan") — bisa dilakukan sebagai perubahan label murni
  kapan saja tanpa migrasi. Default: biarkan generik di RP-01.
- OQ2. Wording pesan blok akses file setelah `DIMUSNAHKAN` di permukaan non-allowlist
  (mis. teks halaman detail, bukan `AttachmentViewer`) — relabel bila jelas
  user-facing & tidak menyentuh allowlist; kalau ragu, biarkan.
- OQ3. Ikon lucide untuk "Berkas Tertutup" — `FolderClosed` tidak ada; kandidat
  `FolderCheck` / `FolderArchive` / `Lock`. Pilih saat implementasi UI.
