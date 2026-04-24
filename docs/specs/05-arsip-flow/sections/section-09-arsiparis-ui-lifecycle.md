# Section 09: Arsiparis Lifecycle Pages UI

## Context
Section 04 (Daftar Arsip API), Section 05 (Pindahkan/Putuskan API), Section 07 (Arsip Search API) sudah selesai. API untuk list dan aksi lifecycle sudah ada.

## Objective
Membuat 4 halaman UI untuk lifecycle arsip:
- `/arsiparis/aktif` — daftar arsip aktif + Pindahkan Sekarang
- `/arsiparis/verifikasi-penyusutan` — daftar arsip verifikasi + Setujui/Tolak
- `/arsiparis/inaktif` — daftar arsip inaktif + Pindahkan Sekarang
- `/arsiparis/usul-musnah` — daftar arsip usul musnah + Setujui Musnah/Tolak

## Prerequisites
- Section 04, Section 05, Section 07 selesai (API ready)

## Implementation Steps

### 1. Buat `src/routes/arsiparis/aktif.tsx` — Arsip Aktif

- PageLayout dengan title "Daftar Arsip Aktif"
- Table columns: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Arsip, Masa Aktif Berakhir, Aksi
- Filter: fungsi dropdown, tahun, keyword (q)
- Kolom Aksi: tombol [Pindahkan Sekarang]
- Tombol [Pindahkan Sekarang] → modal konfirmasi

**Modal "Pindahkan Sekarang" — ke Verifikasi Penyusutan:**
- Header: "Pindahkan ke Verifikasi Penyusutan?"
- Info arsip: nomor surat, judul
- Text: "Arsip akan dipindahkan ke tahap Verifikasi Penyusutan dan menunggu persetujuan Arsiparis."
- Textarea Catatan (opsional)
- Tombol: [Batal] [Ya, Pindahkan]
- Submit: POST `/api/arsiparis/verifikasi-penyusutan/pindahkan` → refresh table + toast

### 2. Buat `src/routes/arsiparis/verifikasi-penyusutan.tsx` — Verifikasi Penyusutan

- PageLayout dengan title "Verifikasi Penyusutan"
- Table columns: Nomor Surat, Judul, Tanggal Diajukan, Status, Aksi
- Status badges: MENUNGGU (kuning), DISETUJUI (hijau), DITOLAK (merah)
- Kolom Aksi: hanya tampil jika status = 'MENUNGGU'
  - Tombol [Setujui] → modal konfirmasi "Terima pengajuan penyusutan?"
  - Tombol [Tolak] → modal konfirmasi dengan textarea alasan
- Jika SUDAH DISETUJUI/DITOLAK: tampilkan nama yang memutuskan + tanggal + catatan
- Filter: fungsi dropdown, tahun

**Modal Setujui:**
- Header: "Setujui Penyusutan?"
- Info: nomor surat, judul
- Text: "Arsip akan dipindahkan ke Daftar Arsip Inaktif."
- Tombol: [Batal] [Setujui]

**Modal Tolak:**
- Header: "Tolak Penyusutan?"
- Textarea: alasan penolakan
- Tombol: [Batal] [Tolak]

### 3. Buat `src/routes/arsiparis/inaktif.tsx` — Arsip Inaktif

- PageLayout dengan title "Daftar Arsip Inaktif"
- Table columns: Nomor Surat, Judul, Fungsi, Kegiatan, Tanggal Jadi Inaktif, Masa Inaktif Berakhir, Aksi
- Filter: fungsi dropdown, tahun
- Kolom Aksi: tombol [Pindahkan Sekarang]
- Tombol → modal "Usulkan Pemusnahan?"

**Modal "Pindahkan Sekarang" — ke Usul Musnah:**
- Header: "Usulkan Pemusnahan?"
- Info: nomor surat, judul
- Text warning: "Arsip akan diusulkan untuk dimusnahkan. Persetujuan akhir diperlukan sebelum dokumen dihapus permanen."
- Textarea Catatan (opsional)
- Tombol: [Batal] [Ya, Usulkan]

### 4. Buat `src/routes/arsiparis/usul-musnah.tsx` — Usul Musnah

- PageLayout dengan title "Usul Musnah"
- Table columns: Nomor Surat, Judul, Tanggal Usul, Status, Aksi
- Status badges: MENUNGGU (kuning), DISETUJUI (hijau), DITOLAK (merah)
- Kolom Aksi: hanya tampil jika status = 'MENUNGGU'
  - Tombol [Setujui Musnah] → modal warning konfirmasi
  - Tombol [Tolak] → modal konfirmasi

**Modal Setujui Musnah (WARNING):**
- Header: "Setujui Pemusnahan?"
- Text warning besar: "PERHATIAN: Dokumen akan dihapus PERMANEN dan tidak bisa dikembalikan!"
- Info: nomor surat, judul
- Text: "Semua file lampiran juga akan dihapus dari storage."
- Tombol: [Batal] [Ya, Musnahkan] (button dengan variant destructive)

**Modal Tolak:**
- Header: "Tolak Pemusnahan?"
- Textarea: alasan penolakan
- Tombol: [Batal] [Tolak]

## Files to Create

- `src/routes/arsiparis/aktif.tsx`
- `src/routes/arsiparis/verifikasi-penyusutan.tsx`
- `src/routes/arsiparis/inaktif.tsx`
- `src/routes/arsiparis/usul-musnah.tsx`

## Test Stubs

- [ ] Aktif: table + filter + Pindahkan Sekarang berfungsi
- [ ] Verifikasi: status badges berfungsi
- [ ] Verifikasi: Setujui → arsip masuk INAKTIF
- [ ] Verifikasi: Tolak → arsip kembali ke AKTIF
- [ ] Inaktif: table + filter + Pindahkan Sekarang berfungsi
- [ ] Usul Musnah: status badges berfungsi
- [ ] Usul Musnah: Setujui → konfirmasi warning + delete
- [ ] Usul Musnah: Tolak → arsip kembali ke INAKTIF
- [ ] Aksi pada record yang sudah decided → button disabled
- [ ] Rapid double-click → debounce

## Definition of Done

- [ ] Semua 4 halaman berfungsi dengan benar
- [ ] Filter berfungsi
- [ ] Status badges display dengan warna yang sesuai
- [ ] Modal konfirmasi berfungsi untuk semua aksi
- [ ] Warning khusus untuk Setujui Musnah
- [ ] Tombol disabled untuk record yang sudah decided
- [ ] Test stubs pass