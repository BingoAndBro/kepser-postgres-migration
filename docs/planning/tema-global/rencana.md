# Rencana — Pengaturan Tema Global (SE / SP / ST)

Status: **Draft untuk ditinjau.** Belum ada kode yang diubah.
Konteks institusi: BPS. Tiga event sensus besar bergiliran menjadi identitas visual aplikasi:

| Kode | Event | Tahun (akhiran) | Warna tema |
|------|-------|-----------------|------------|
| `se` | Sensus Ekonomi | 6 | Oranye (tema aplikasi saat ini) |
| `sp` | Sensus Penduduk | 0 | Biru |
| `st` | Sensus Pertanian | 3 | Hijau |

Tahun di antara sensus = masa persiapan event berikutnya; admin yang menentukan tema aktif.

---

## 1. Keputusan terkunci (dari user — tidak dibuka ulang)

1. **Titik kendali tunggal:** hanya ada di menu **Settings** pada role **Admin**. Tidak ada kontrol tema di role lain, tidak ada override per-user.
2. **Status setelan: `GLOBAL`.** Satu nilai berlaku untuk seluruh aplikasi dan semua pengguna. Saat admin mengganti tema, seluruh aplikasi ikut berubah untuk semua orang.
3. **Target konsistensi utama (prioritas):** warna **tabel**, **kolom filter & pencarian**, dan **badge status**. Ketiganya wajib seragam lewat satu sumber token / satu primitive.
4. **"Oranye" = keluarga oranye.** Boleh naik/turun opacity atau shade, asal masih satu keluarga. Berlaku sama untuk biru & hijau di tema lain.
5. **Dikecualikan dari tema (tetap, tidak ikut berganti warna):**
   - Tombol **hapus / destruktif** → merah (standar).
   - Kartu **laporan / monitoring nominal realisasi** → hijau "uang".

---

## 2. Keputusan desain (default yang diambil — silakan koreksi bila perlu)

Poin-poin ini belum dikunci user. Nilai default di bawah dipakai kecuali diminta lain.

| # | Isu | Default yang diambil | Alasan |
|---|-----|----------------------|--------|
| D1 | Warna status semantik (`success` hijau, `warning` amber, `danger` merah, `info` biru) saat tema jadi biru/hijau | **Tetap sama di ketiga tema.** Tidak ikut berganti. | User minta badge status konsisten. Status yang berubah-ubah warna antar tema merusak keterbacaan. |
| D2 | Tabrakan `info` (biru) dengan tema **SP** (brand biru) | **Tidak diubah dulu.** `info` tetap biru/sky seperti sekarang di semua tema. Bila mengganggu setelah fitur jadi (tema SP aktif), user akan minta perubahan belakangan. | Keputusan user: coba dulu apa adanya. |
| D3 | Tabrakan `success` + `money` (hijau) dengan tema **ST** (brand hijau) | Brand hijau ST dibuat **hijau tua/pekat** (`#1E7A46`), `success` tetap emerald terang (`#059669`). **Kartu** money/realisasi tetap aksen hijau di SE & SP; di ST kartu money jadi **netral-tegas** (ikon/garis didesaturasi). Nilai nominal di **sel tabel** ikut warna tema — lihat D4. | Menjaga 3 hijau tetap bisa dibedakan. |
| D4 | Nilai **Total Nominal Realisasi** di sel tabel saat ini 3 warna (oranye `#FF4D00` di tabel Pegawai/Fungsi, hitam `zinc-950` di tabel Kegiatan, hijau di kartu) | **Nilai nominal di sel tabel = warna tema** (`--brand-text`). SE → oranye (seperti sekarang, sudah benar), SP → biru, ST → hijau. Tabel Kegiatan yang sekarang hitam **diseragamkan** ikut warna tema juga. Nilai nominal di **kartu ringkasan** tetap aksen `money` hijau (fixed, kecuali ST — lihat D3). | Keputusan user: nominal tabel mengikuti tema. Inkonsistensi antar-tabel tetap dibereskan (semua sel tabel satu aturan). |
| D5 | Dark mode | **Dihapus.** Buang `@custom-variant dark` + semua blok `.dark` di `styles.css`, sederhanakan `THEME_INIT_SCRIPT`. Tidak ada `dark:` utility di komponen (sudah dicek — nol). | Keputusan user: hapus, tidak perlu. |
| D6 | Skala abu campur (`zinc` 248×, `slate`, `neutral`) | **Distandarkan ke `zinc`.** `slate` & `neutral` dipetakan ke token netral. | Konsistensi; `zinc` sudah dominan. |
| D7 | Halaman **login** (pra-autentikasi, tidak bisa fetch setelan global) | Pakai tema terakhir yang tersimpan di `localStorage`; kalau kosong → `se` (default). | Login tetap "ikut tema" tanpa panggilan server yang memblokir. |
| D8 | Ekspor **Excel / ZIP** | Di luar scope (tidak berwarna tema). | Bukan UI berwarna. |
| D9 | Lingkup refactor hardcoded | Bertahap: **target utama dulu** (tabel, filter, pencarian, badge, primitive bersama), lalu sisa file. | Memberi hasil terlihat cepat pada area prioritas user. |

---

## 3. Kondisi teknis saat ini (temuan audit)

- **Stack:** TanStack Start dengan `ssr: false` (SPA murni) + React 19 + **Tailwind v4** (CSS-first `@theme` di `src/styles.css`) + Drizzle/Postgres + API REST via `apiFetch` → `/api/*` (nitro).
- **Sudah ada lapisan token semantik** di `src/styles.css` (`--color-primary`, `--color-surface`, dst) — dipakai ~217×. Ini otomatis ikut kalau token di-swap.
- **Belum ada** infrastruktur pemilihan tema (tidak ada ThemeProvider, tidak ada `data-theme`).
- **Hook bootstrap sudah ada:** `src/routes/__root.tsx` menaruh `THEME_INIT_SCRIPT` inline di `<head>` yang jalan sebelum paint (sekarang hanya memaksa `.light`). Ini titik masuk alami untuk set `data-theme`.
- **Namespace DB `src/db/schema/app/`** sengaja dikosongkan "untuk fase berikutnya" → rumah untuk tabel setelan.
- **Menu `settings`** ada di `NAV_CONFIG` semua role tapi **tanpa `to:`** dan **tanpa route** → perlu dibuat untuk admin.
- **`/admin/*` sudah dijaga** `guardRole('ADMIN')` di `src/routes/admin.tsx`.

### Utang warna hardcoded

428 kemunculan di 61 file. Ringkas per keluarga: `zinc` 248, `orange` 183, `amber` 34, `emerald` 33, `red` 20, `neutral` 18, `slate` 14, `sky` 12, `rose` 12, `green` 12, `blue` 8, `purple`/`indigo` 3.

**Brand oranye ditulis ~6 nilai berbeda yang tidak sinkron:**
`#FF5F1F` (token `styles.css` + `ConfirmDialog`), `#FF5A00` (tombol admin), `#FF4D00` (aksen/hover admin), `#F04F00` (hover admin), `#EA580C` (hover ConfirmDialog & dashboard), `#F97316` (step aktif) + kelas palet `orange-50…950`.

**Sistem "tone" di-reimplement 5×** dengan shade beda-tipis: `StatusBadge`, `RoleBadge`, `RoleDashboardPrimitives` (metric card), `AdminPagePrimitives` (`AdminNotice`), `ConfirmDialog`.

**Catatan `ConfirmDialog`:** tombol **Batal** saat ini **bukan merah** — dia `variant="outline"` netral. Yang merah hanya tombol *konfirmasi* pada `tone="destructive"`.

---

## 4. Taksonomi token (target akhir)

Satu set variabel semantik di `src/styles.css`. Komponen hanya memakai nama token — tidak pernah `orange-500` / `#FFxxxx` lagi.

### Grup 1 — BRAND (berganti per tema)

| Token | Untuk apa | Menggantikan |
|-------|-----------|--------------|
| `--brand-solid` | bg tombol utama, step aktif, toggle aktif | `#FF5F1F`, `#FF5A00`, `#F97316`, `bg-orange-600` |
| `--brand-solid-hover` | hover tombol utama | `#F04F00`, `#EA580C` |
| `--brand-solid-active` | pressed | (baru) |
| `--brand-on-solid` | teks/ikon di atas brand solid | `#fff` |
| `--brand-text` | heading beraksen, judul row saat hover, link | `text-orange-900`, `#FF4D00`, `#B83200` |
| `--brand-text-muted` | eyebrow, label kecil uppercase, meta | `text-orange-700/70`, `text-orange-800`, `#5B3A00` |
| `--brand-icon` | ikon warna brand | `text-orange-600/700` |
| `--brand-surface` | bg lembut: chip ikon, baris hover, item terpilih, badge brand | `bg-orange-50`, `#FFF6EA`, `#FFF8F1`, `#FFF0E7`, `#FFF4ED`, `#FFF1E8` |
| `--brand-surface-strong` | bg lembut lebih pekat | `bg-orange-100` |
| `--brand-border` | tepi kartu/panel/input beraksen brand | `border-orange-100/200`, `#E9D2BD`, `#F0E1D5`, `#F4D7A8`, `#E1D7CB` |
| `--brand-border-strong` | tepi kartu "emphasis", fokus input | `border-orange-300`, `#FFBC80`, `#FF8A4C` |
| `--brand-ring` | ring fokus keyboard | `ring-orange-200/70`, `ring-orange-100/60` |
| `--brand-gradient-from/-to` | header kartu, `sunset-gradient`, accent hover | `from-orange-50 … to-[#FFF8F1]`, `linear-gradient(135deg,#FF5F1F,#ff7948)` |
| `--brand-glow` | shadow berwarna, animasi `breath` | `shadow-orange-500/10`, `rgba(255,90,0,.20)`, `rgba(251,146,60,.14)`, `rgba(255,95,31,.4)` |

### Grup 2 — SURFACE / NETRAL (ikut tema hanya pada tint tipis `bg-app`/`bg-surface`/`bg-sunken`; sisanya tetap)

| Token | Untuk apa | Menggantikan |
|-------|-----------|--------------|
| `--bg-app` | kanvas aplikasi | `#FFFBF7` |
| `--bg-surface` | kartu, panel, baris tabel | `#FFFDF9`, `#fff`, `#FFF7F2` |
| `--bg-sunken` | header tabel, header section, footer dialog | `neutral-100`, `#F7F3EF`, `#F7FAFD` |
| `--border-default` | pemisah, tepi kartu netral, tepi input | `zinc-200/80`, `zinc-100`, `#E2E8F0`, `#E8EEF5`, `#CAD4E2`, `neutral-200`, `#DCE6F0` |
| `--text-strong` | judul, angka besar | `zinc-950`, `#071A3A`, `#3D332A` |
| `--text-body` | teks isi | `zinc-700/900`, `#35527A` |
| `--text-muted` | teks sekunder, placeholder | `zinc-500/600`, `#8A8A8A`, `#7A622E` |
| `--text-disabled` | disabled, ikon kosong | `zinc-300/400` |
| `--shadow-card` | bayangan kartu standar | `rgba(15,23,42,.06)`, `rgba(15,23,42,.07)` |

### Grup 3 — STATUS SEMANTIK (tetap di semua tema)

Tiap kategori punya set: `--{name}-surface`, `--{name}-border`, `--{name}-text`, `--{name}-solid`, `--{name}-on-solid`.

| Kategori | Makna & lokasi | Menyatukan |
|----------|----------------|------------|
| `success` (emerald) | badge SELESAI/TERSIMPAN, arsip AKTIF, step selesai, role Pegawai, notice sukses | `emerald-50…900`, `green-500/600/700` |
| `warning` (amber) | badge PERLU REVISI, notice peringatan, kartu "gold", role Kepala Sub Bagian | `amber-50…950` |
| `danger` (merah) | hover tombol hapus, notice destruktif, arsip DIMUSNAHKAN, error state, konfirmasi destruktif | `red-*`, `rose-*`, `#F00446`, `#D9043D` |
| `info` (cyan — lihat D2) | badge MENUNGGU PPK, folder OPEN, sumber WORKFLOW, role PPK, metric card | `sky-*`, `blue-*` |
| `neutral-status` (zinc) | badge DRAFT/ARCHIVED/CLOSED, role Admin & PJ Kinerja | `slate-*` di StatusBadge vs `zinc-*` di RoleBadge |

### Grup 4 — MONEY / NOMINAL REALISASI (lihat D3, D4)

Dipakai untuk **kartu ringkasan** (SummaryCard, SatkerSummaryBand). Nilai nominal **di sel tabel** TIDAK pakai token ini — pakai `--brand-text` (ikut tema, D4).

| Token | Menggantikan |
|-------|--------------|
| `--money-surface` | `#EAFBF2` |
| `--money-border` | `#7DD7A9`, `#62C995` |
| `--money-text` | `#006B35`, `#00713A`, `#0B6B3D` |
| `--money-value` (angka mono di kartu) | `#02170B` |
| `--money-icon` | `#16A35D` |
| `--money-glow` | `rgba(16,185,129,.18)` |

Di tema `st`: kartu money jadi netral-tegas — `--money-surface` → `#F1F4F2`, `--money-border` → `#C9D6CE`, `--money-text` → `#3F4B44`, `--money-icon` → `#5E6E64`, `--money-value` tetap `#02170B`.

### Grup 5 — IDENTITAS ROLE

`RoleBadge` sudah memusatkan. Cukup: konsumsi token Grup 3, perbaiki `neutral`. Pemetaan dipertahankan (Pegawai=success, PPK=info, PPSPM=brand, Kepala Sub Bagian=warning, PJ Kinerja=neutral, Admin=neutral).

### Grup 6 — DEKORATIF

`mesh-blob`, `glass-panel`, `sunset-gradient`, animasi `breath`/`slow-glow` → turunan `--brand-*`.

---

## 5. Palet 3 tema (draft — wajib cek kontras WCAG AA sebelum dipakai)

Nilai berikut adalah titik awal. Semua pasangan teks/latar harus lolos rasio ≥ 4.5:1 (teks normal) / ≥ 3:1 (teks besar & UI).

| Token | `se` (oranye) | `sp` (biru) | `st` (hijau) |
|-------|---------------|-------------|--------------|
| `--brand-solid` | `#FF5F1F` | `#17549E` | `#1E7A46` |
| `--brand-solid-hover` | `#E85416` | `#114684` | `#196438` |
| `--brand-solid-active` | `#CC4A13` | `#0E3A6E` | `#14512E` |
| `--brand-on-solid` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `--brand-text` \* | `#B23A0B` | `#123F7D` | `#14562F` |
| `--brand-text-muted` | `#8A5A3C` | `#4A5B78` | `#4A6152` |
| `--brand-surface` | `#FFF3EC` | `#EAF1FB` | `#E9F4EC` |
| `--brand-surface-strong` | `#FFE1D2` | `#D2E2F5` | `#CFE7D6` |
| `--brand-border` | `#F5D9C9` | `#C4D8EF` | `#C0DEC9` |
| `--brand-border-strong` | `#F3B48C` | `#93B7E0` | `#8CC5A0` |
| `--brand-ring` | `rgba(255,95,31,.45)` | `rgba(23,84,158,.40)` | `rgba(30,122,70,.40)` |
| `--brand-gradient-from` | `#FF5F1F` | `#17549E` | `#1E7A46` |
| `--brand-gradient-to` | `#FF7948` | `#3E7DC4` | `#3FA06B` |
| `--brand-glow` | `rgba(255,95,31,.35)` | `rgba(23,84,158,.30)` | `rgba(30,122,70,.30)` |
| `--bg-app` | `#FFFBF7` | `#F9FBFD` | `#F8FBF9` |
| `--bg-surface` | `#FFFDF9` | `#FFFFFF` | `#FFFFFF` |
| `--bg-sunken` | `#F6F1EC` | `#EEF3F8` | `#EEF4F0` |

\* `--brand-text` juga dipakai untuk **nilai nominal di sel tabel** (D4). Untuk SE `#B23A0B` sedikit lebih tua dari `#FF4D00` yang dipakai sekarang — demi lolos kontras AA pada teks kecil. Masih jelas oranye. Bila user ingin persis `#FF4D00`, sediakan token terpisah `--nominal-table` per tema.

**Tetap sama di 3 tema:**

| Token | Nilai |
|-------|-------|
| `--success-surface / -border / -text / -solid` | `#ECFDF3` / `#A7E3C4` / `#05683B` / `#059669` |
| `--warning-surface / -border / -text / -solid` | `#FFF8EB` / `#F5D08A` / `#92500E` / `#D97706` |
| `--danger-surface / -border / -text / -solid` | `#FEF2F2` / `#F3B4B4` / `#B42318` / `#DC2626` |
| `--info-surface / -border / -text / -solid` | `#EFF6FF` / `#AECBF5` / `#1E5BA8` / `#2563EB` — **tetap biru/sky seperti sekarang (D2)**; nilai final samakan dengan `sky-*` yang dipakai `StatusBadge` |
| `--neutral-status-surface / -border / -text` | `#F4F4F5` / `#D4D4D8` / `#3F3F46` |
| `--money-*` | seperti Grup 4 (termasuk override `st`) |

---

## 6. Mekanisme teknis

### 6.1 Lapisan token (Tailwind v4)

Di `src/styles.css`:

1. **`:root`** mendeklarasikan seluruh variabel Grup 1–6 dengan nilai tema **`se`** (default).
2. **`[data-theme="sp"]`** dan **`[data-theme="st"]`** hanya meng-override variabel Grup 1 + tiga `--bg-*` + penyesuaian `--money-*` untuk `st`.
3. **`@theme inline { --color-brand-solid: var(--brand-solid); … }`** supaya utilitas Tailwind (`bg-brand-solid`, `text-danger-text`, dst) meng-emit `var(--…)` — bukan menyalin nilai — sehingga override `[data-theme]` bekerja saat runtime.
4. Token lama (`--color-primary`, dst) dipetakan ke token baru agar 217 pemakaian existing ikut tanpa disentuh.
5. `@keyframes`, `.sunset-gradient`, `.mesh-blob-*`, `.glass-panel` diganti memakai `var(--brand-*)`. `.rdp { --rdp-accent-color: var(--brand-solid) }`.
6. **Hapus dark mode (D5):** buang baris `@custom-variant dark (&:is(.dark *));` (`styles.css:5`), blok `.dark input[type="date"]` (`:85`), dan `.dark .mesh-bg` + `.dark .mesh-blob-*` (`:178–184`). Sederhanakan `THEME_INIT_SCRIPT` (buang `remove('dark')`, tetap set `.light` + `colorScheme='light'`). Tidak ada `dark:` utility di komponen (sudah dicek).

### 6.2 Bootstrap & penerapan (SPA, tanpa SSR data)

- **Paint pertama:** perluas `THEME_INIT_SCRIPT` di `__root.tsx` — baca `localStorage.getItem('app-theme')`, validasi ke `se|sp|st`, set `document.documentElement.dataset.theme`. Fallback `se`. (Tetap memaksa `.light`.)
- **Setelah app mount:** root memanggil `GET /api/settings/theme` (sumber kebenaran GLOBAL). Jika beda dari `localStorage`, perbarui `data-theme` + `localStorage` + cookie `app-theme` (untuk konsumen server bila kelak perlu). Selisih hanya mungkin pada kunjungan pertama / setelah admin baru saja mengganti — jarang, dan hanya "kedip" satu kali.
- **Login:** pakai `localStorage` saja (D7).

### 6.3 Persistensi

- **Migrasi Drizzle:** tabel `app_settings` di `src/db/schema/app/` — bentuk key/value sederhana:
  `key text primary key`, `value jsonb not null`, `updated_at timestamptz`, `updated_by uuid`.
  Baris awal: `key='theme'`, `value='"se"'`.
- **Route API** (nitro, pola `apiFetch` existing):
  - `GET /api/settings/theme` → `{ theme: 'se' }`. Boleh diakses semua sesi terautentikasi.
  - `PUT /api/settings/theme` body `{ theme }` → validasi enum (zod), **cek role ADMIN di server** (bukan hanya guard route), tulis baris, catat `updated_by`. Kembalikan nilai baru.
- Tidak ada activity-log DB baru (konsisten kebijakan audit fitur lain); cukup `console.*` server dengan aktor + nilai lama/baru.

### 6.4 UI Admin

- Route baru **`/admin/settings`** (`src/routes/admin.settings.tsx`) — otomatis terjaga oleh `guardRole('ADMIN')` di `admin.tsx`.
- Tambahkan `ROUTES.ADMIN.SETTINGS` di `src/lib/constants/routes.ts`; isi `to:` pada item `settings` di `NAV_CONFIG.ADMIN` (biarkan role lain apa adanya).
- Isi halaman: 3 kartu pilihan tema (nama event + swatch + preview mini tombol/badge/tabel), radio. Simpan → `PUT`, lalu langsung set `data-theme` (optimistic) + toast "Tema aplikasi diubah ke …". Banner kecil: "Perubahan ini berlaku untuk semua pengguna."

---

## 7. Konsolidasi primitive (target prioritas user)

Tujuan: **tabel, filter, pencarian, badge status** tampil dari satu sumber.

| Area | Kondisi sekarang (duplikasi) | Menjadi |
|------|------------------------------|---------|
| **Tabel** | `AdminTableShell`; shell inline di `MonitoringRealisasiView` (`PegawaiList`/`FungsiList`/`KegiatanList`); `ArchivePagePrimitives`; `KinerjaPagePrimitives`; `PegawaiPagePrimitives`. Header hardcode `border-neutral-200 bg-neutral-100`, baris `bg-[#FFFDF9]`, hover `bg-[#FFF8F1]/70`, `divide-zinc-100`. | Satu `DataTableShell` + kelas header/row/hover berbasis token (`bg-sunken`, `border-default`, `hover:bg-brand-surface`). |
| **Toolbar filter + pencarian** | `AdminSearchPanel` + `AdminFilterSelect`; `SimpleReportToolbar` + `KegiatanDetailToolbar`; varian di archive/pegawai. Input hardcode `border-[#E9D2BD]`, `focus:ring-orange-200/70`, ikon `text-orange-700/50`, chevron `text-[#FF4D00]`. | `SearchField` + `FilterSelect` primitive tunggal, token-based (`border-brand-border`, `focus:ring-brand-ring`, ikon `text-brand-icon`). |
| **Badge status** | `StatusBadge` (pusat, tapi `toneClassName` hardcode). Tone map diduplikasi di `RoleBadge`, `RoleDashboardPrimitives`, `AdminNotice`, `ConfirmDialog`. | Satu helper `toneClasses(tone)` di `src/lib/tone.ts` → dipakai `StatusBadge`, `RoleBadge`, `AdminNotice`, metric card, `ConfirmDialog`. |

---

## 8. Fase kerja

| Fase | Isi | Hasil terlihat | Estimasi kasar |
|------|-----|----------------|----------------|
| **1. Fondasi token + hapus dark mode** | Tambah semua token Grup 1–6 ke `styles.css` (nilai = warna oranye sekarang). Tambah blok `[data-theme="sp"|"st"]` (belum bisa diakses). Petakan token lama → baru. Hapus semua sisa dark mode (§6.1 poin 6). | Nihil (aplikasi identik). | 0,5–1 hari |
| **2. Konsolidasi + refactor prioritas** | `DataTableShell`, `SearchField`, `FilterSelect`, `toneClasses()`. Refactor tabel + filter + pencarian + badge di 6 file primitive + `MonitoringRealisasiView` ke token. Terapkan D4: nilai nominal di **semua sel tabel** pakai `--brand-text` (seragam, ikut tema); nominal di kartu tetap `--money-value`. | Area prioritas seragam & siap tema. | 3–5 hari |
| **3. Refactor sisa hardcoded** | `orange-*`/hex tersisa di routes & komponen: header halaman, kartu dashboard, dialog, dekoratif (mesh/gradient/animasi), `--rdp-*`. File per file. | Seluruh UI ikut tema. | 3–5 hari |
| **4. Persistensi + bootstrap** | Migrasi `app_settings`; `GET`/`PUT /api/settings/theme`; perluas `THEME_INIT_SCRIPT`; rekonsiliasi di root; cookie + localStorage. | Tema bisa diset via API; persist antar reload. | 1–1,5 hari |
| **5. UI Admin** | Route `/admin/settings`, konstanta route, wiring `NAV_CONFIG.ADMIN`, kartu pemilih + preview + toast + banner "berlaku global". | Fitur lengkap dari sisi admin. | 1–1,5 hari |
| **6. QA + guardrail** | Uji manual 3 tema di semua layar utama (login, dashboard tiap role, tabel, form, dialog, monitoring realisasi, arsip). Tambah lint `no-restricted-syntax` melarang `-(orange\|amber\|sky\|…)-[0-9]` dan `bg-[#` di `src/`. | Regressi tertangkap; kode baru tak bisa menambah warna liar. | 1–2 hari |

**Total kasar:** ~10–16 hari kerja fokus. Fase 1–2 memberi nilai pada area prioritas user; Fase 4–5 baru mengaktifkan pergantian tema end-to-end.

Catatan urutan: Fase 4–5 bisa jalan paralel dengan Fase 3 (tidak saling bergantung). Fitur tidak "menyala" untuk user sampai Fase 5 selesai — aman dirilis bertahap.

---

## 9. Di luar scope

- Dark mode (**dihapus**, bukan sekadar dinonaktifkan — lihat D5).
- Override tema per-user / per-role.
- Kontrol tema di role selain Admin.
- Pewarnaan tema pada ekspor Excel / ZIP / PDF.
- Penjadwalan otomatis tema berdasarkan tahun (bisa jadi peningkatan lanjutan: default terhitung, admin tetap bisa override).
- Aset gambar/ilustrasi berwarna oranye (bila ada PNG/logo) — dicatat terpisah bila ditemukan saat Fase 3.

---

## 10. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Permukaan regresi luas (hampir semua layar) | Fase 1 dibuat "nol perubahan visual" sebagai baseline; refactor bertahap per area; QA per tema di Fase 6. |
| `@theme inline` v4 keliru dipakai → utilitas menyalin nilai, override `[data-theme]` tidak jalan | Verifikasi lebih dulu di Fase 1 dengan satu token percobaan + toggle `data-theme` manual di devtools. |
| Kontras buruk di tema biru/hijau (teks di atas surface, badge) | Semua pasangan dicek WCAG AA sebelum Fase 5; palet §5 masih draft. |
| "Kedip" tema pada kunjungan pertama / setelah admin ganti | `localStorage` untuk paint instan; selisih dengan server hanya sekali & kecil. Dapat diterima. |
| Kode baru menambah `orange-*` lagi | Lint rule di Fase 6. |
| Tabel Kegiatan yang tadinya hitam berubah jadi warna tema (D4) dianggap "regresi" | Perubahan kecil & menuju konsistensi; tunjukkan di QA Fase 2. |
| `--brand-text` SE (`#B23A0B`) sedikit lebih tua dari `#FF4D00` sekarang | Bila user keberatan, tambah token `--nominal-table` per tema dengan nilai persis. |

---

## 11. Status keputusan

**Sudah dikunci user (2026-09-10):**
- Kendali tema: menu Settings, role Admin saja. Status `GLOBAL`.
- D2 — `info` **tidak diubah**, tetap biru/sky sekarang; ditinjau ulang bila mengganggu setelah fitur jadi.
- D4 — nilai nominal di **sel tabel** mengikuti warna tema (SE oranye seperti sekarang, SP biru, ST hijau); semua tabel diseragamkan satu aturan.
- D5 — dark mode **dihapus**.

**Masih perlu konfirmasi:**
1. D3 — di tema hijau (ST), kartu money/realisasi jadi netral (bukan hijau). Setuju?
2. Palet draft §5 sebagai titik awal (nilai final setelah cek kontras AA)? Termasuk `--brand-text` SE `#B23A0B` (lebih tua sedikit dari `#FF4D00`) — atau mau token nominal-tabel terpisah yang persis `#FF4D00`?
3. Urutan fase §8 (area prioritas dulu, fitur baru "menyala" di Fase 5)?
