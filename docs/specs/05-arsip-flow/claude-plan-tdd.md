# Test Stubs: SPEC 05 — Arsip Flow (Arsiparis)

## Tests for: Step 1 — Database Migration

### Happy Path
- [ ] Migration 005_arsip.sql berhasil dijalankan tanpa error
- [ ] Tabel `arsip` dibuat dengan semua kolom sesuai spec
- [ ] Tabel `master_klasifikasi_arsip` dibuat dengan semua kolom sesuai spec
- [ ] Tabel `arsip_verifikasi_penyusutan` dibuat dengan UNIQUE constraint pada arsip_id
- [ ] Tabel `arsip_usul_musnah` dibuat dengan UNIQUE constraint pada arsip_id
- [ ] RLS policies dibuat dan berfungsi (ARSIPARIS bisa INSERT, semua authenticated bisa SELECT arsip)
- [ ] Seed data klasifikasi (Klasifikasi I–VII) ter-insert
- [ ] Role ARSIPARIS sudah ada di tabel roles

### Edge Cases
- [ ] Migration bisa dijalankan ulang (idempotent — IF NOT EXISTS / CREATE TABLE IF NOT EXISTS)
- [ ] UNIQUE constraint mencegah 2 record aktif per arsip di sub-tables
- [ ] Foreign key constraint mencegah arsip_id yang tidak valid

---

## Tests for: Step 2 — Arsiparis Inbox & Dokumen Detail API

### Happy Path
- [ ] GET /api/arsiparis/inbox mengembalikan list dokumen dengan status=COMPLETED dan belum diarsipkan
- [ ] GET /api/arsiparis/inbox include informasi fungsi, kegiatan, nama pegawai
- [ ] GET /api/arsiparis/inbox filter by fungsi_id bekerja
- [ ] GET /api/arsiparis/inbox filter by date range bekerja
- [ ] GET /api/arsiparis/inbox exclude dokumen yang sudah punya record arsip (ditolak atau tidak)
- [ ] GET /api/arsiparis/dokumen/[id] mengembalikan detail lengkap dokumen
- [ ] GET /api/arsiparis/dokumen/[id] include lampiran_urls
- [ ] GET /api/arsiparis/dokumen/[id] include info approve Bendahara dari log_aktivitas

### Error Cases
- [ ] GET /api/arsiparis/inbox returns 403 jika bukan ARSIPARIS
- [ ] GET /api/arsiparis/dokumen/[id] returns 404 jika dokumen tidak ada
- [ ] GET /api/arsiparis/dokumen/[id] returns 403 jika bukan ARSIPARIS

---

## Tests for: Step 3 — Arsipkan & Skip API

### Happy Path
- [ ] POST /api/arsiparis/dokumen/[id]/archive berhasil membuat record arsip dengan status_arsip='AKTIF'
- [ ] POST archive meng-update dokumen status ke 'ARCHIVED' via FSM
- [ ] POST archive membuat log_aktivitas dengan aksi='ARCHIVE'
- [ ] POST archive menghitung masa_aktif_berakhir dan masa_inaktif_berakhir dari retensi
- [ ] POST /api/arsiparis/dokumen/[id]/skip berhasil membuat record arsip dengan is_ditolak=true
- [ ] POST skip tidak mengubah dokumen status (tetap 'COMPLETED')
- [ ] POST skip membuat log_aktivitas dengan aksi='ARCHIVE_SKIP'

### Edge Cases
- [ ] POST archive dengan fields wajib kosong → 400 validation error
- [ ] POST archive dengan klasifikasi yang tidak ada di master_klasifikasi_arsip → 400 validation error
- [ ] POST archive pada dokumen yang sudah diarsipkan → error atau idempotent
- [ ] POST skip pada dokumen yang sudah punya record arsip → error (sudah ada di inbox?)

### Error Cases
- [ ] POST archive returns 403 jika bukan ARSIPARIS
- [ ] POST skip returns 403 jika bukan ARSIPARIS
- [ ] POST archive pada dokumen yang bukan status COMPLETED → error (invalid state)

---

## Tests for: Step 4 — Daftar Arsip (Aktif, Inaktif, Verifikasi, Usul Musnah)

### Happy Path
- [ ] GET /api/arsiparis/aktif mengembalikan arsip dengan status_arsip='AKTIF'
- [ ] GET /api/arsiparis/aktif filter by fungsi_id bekerja
- [ ] GET /api/arsiparis/aktif filter by tahun bekerja
- [ ] GET /api/arsiparis/aktif filter by keyword (q) di nomor_surat/judul bekerja
- [ ] GET /api/arsiparis/inaktif mengembalikan arsip dengan status_arsip='INAKTIF'
- [ ] GET /api/arsiparis/verifikasi-penyusutan mengembalikan arsip dengan status_arsip='VERIFIKASI_PENYUSUTAN' + info verifikasi dari JOIN
- [ ] GET /api/arsiparis/usul-musnah mengembalikan arsip dengan status_arsip='USUL_MUSNAH' + info musnah dari JOIN
- [ ] Semua list include joined info (dokumen.judul, fungsi.nama, dll)

### Error Cases
- [ ] GET /api/arsiparis/aktif returns 403 jika bukan ARSIPARIS
- [ ] GET /api/arsiparis/inaktif returns 403 jika bukan ARSIPARIS
- [ ] GET /api/arsiparis/verifikasi-penyusutan returns 403 jika bukan ARSIPARIS
- [ ] GET /api/arsiparis/usul-musnah returns 403 jika bukan ARSIPARIS

---

## Tests for: Step 5 — Pindahkan Sekarang + Putuskan

### Happy Path
- [ ] POST pindahkan ke verifikasi: INSERT arsip_verifikasi_penyusutan + UPDATE arsip.status_arsip='VERIFIKASI_PENYUSUTAN'
- [ ] POST pindahkan ke verifikasi: log_aktivitas created
- [ ] POST putuskan verifikasi SETUJUI: UPDATE verifikasi status='DISETUJUI', arsip.status_arsip='INAKTIF'
- [ ] POST putuskan verifikasi TOLAK: UPDATE verifikasi status='DITOLAK', arsip.status_arsip='AKTIF' (kembali)
- [ ] POST pindahkan ke usul musnah: INSERT arsip_usul_musnah + UPDATE arsip.status_arsip='USUL_MUSNAH'
- [ ] POST putuskan musnah SETUJUI: UPDATE musnah status='DISETUJUI', DELETE arsip record, DELETE file dari storage
- [ ] POST putuskan musnah TOLAK: UPDATE musnah status='DITOLAK', arsip.status_arsip='INAKTIF' (kembali)

### Edge Cases
- [ ] Pindahkan ke verifikasi pada arsip yang sudah punya verifikasi record aktif → UNIQUE constraint error
- [ ] Pindahkan ke verifikasi pada arsip yang bukan status AKTIF → error
- [ ] Pindahkan ke musnah pada arsip yang bukan status INAKTIF → error
- [ ] Putuskan pada record yang bukan status MENUNGGU → error (sudah diputuskan)

### Error Cases
- [ ] POST returns 403 jika bukan ARSIPARIS
- [ ] PUTUSKAN dengan aksi tidak valid → 400 validation error
- [ ] arsip_id tidak valid → 404

---

## Tests for: Step 6 — Master Klasifikasi CRUD

### Happy Path
- [ ] GET /api/arsiparis/klasifikasi mengembalikan semua klasifikasi aktif
- [ ] POST /api/arsiparis/klasifikasi membuat klasifikasi baru
- [ ] PATCH /api/arsiparis/klasifikasi/[id] update klasifikasi
- [ ] DELETE /api/arsiparis/klasifikasi/[id] soft delete (is_active=false)
- [ ] GET bisa diakses tanpa auth (public dropdown)

### Error Cases
- [ ] POST returns 403 jika bukan ADMIN
- [ ] PATCH returns 403 jika bukan ADMIN
- [ ] DELETE returns 403 jika bukan ADMIN
- [ ] POST dengan nama duplikat → error atau replace existing

---

## Tests for: Step 7 — Arsip Search (Public) + Preview + Download

### Happy Path
- [ ] GET /api/arsip mengembalikan list arsip dengan filter
- [ ] GET /api/arsip filter by fungsi_id bekerja
- [ ] GET /api/arsip filter by kegiatan_id bekerja
- [ ] GET /api/arsip filter by tahun bekerja
- [ ] GET /api/arsip filter by keyword (q) bekerja
- [ ] GET /api/arsip exclude is_ditolak=true
- [ ] GET /api/arsip pagination 20 per halaman bekerja
- [ ] GET /api/arsip/[id] mengembalikan detail lengkap arsip + dokumen info
- [ ] GET /api/arsip/[id]/preview/[filename] mengembalikan signed URL (inline)
- [ ] GET /api/arsip/[id]/download/[filename] mengembalikan signed URL (download flag)

### Error Cases
- [ ] GET /api/arsip/[id] returns 404 jika arsip tidak ada
- [ ] GET /api/arsip/[id]/preview/[filename] returns 401 jika belum login
- [ ] GET /api/arsip/[id]/download/[filename] returns 401 jika belum login
- [ ] Preview dengan filename tidak ada di lampiran_urls → error

---

## Tests for: Step 8 — Arsiparis Dashboard, Inbox, Detail UI

### Happy Path
- [ ] /arsiparis dashboard menampilkan stats (inbox count, aktif count, dll)
- [ ] /arsiparis/inbox menampilkan table dokumen dengan filter berfungsi
- [ ] /arsiparis/inbox empty state ketika tidak ada dokumen
- [ ] /arsiparis/dokumen/[id] menampilkan info lengkap dokumen + lampiran
- [ ] Form archive: semua field mandatory ter-validasi
- [ ] Form archive: klasifikasi dropdown dari master_klasifikasi_arsip
- [ ] Form archive: masa berakhir auto-calculated saat retensi dipilih
- [ ] Tombol Arsipkan submit ke POST /api/arsiparis/dokumen/[id]/archive
- [ ] Tombol Tidak Diarsipkan membuka modal konfirmasi
- [ ] Preview lampiran berfungsi (iframe modal)

### Edge Cases
- [ ] Form disubmit dengan field kosong → validation error ditampilkan
- [ ] Dokumen sudah diarsipkan → redirect atau error di halaman detail

---

## Tests for: Step 9 — Arsiparis Lifecycle Pages

### Happy Path
- [ ] /arsiparis/aktif table dengan filter berfungsi + tombol Pindahkan Sekarang
- [ ] /arsiparis/verifikasi-penyusutan table dengan status badges (MENUNGGU/DISETUJUI/DITOLAK)
- [ ] Tombol Setujui dan Tolak di verifikasi penyusutan membuka modal
- [ ] Setujui → arsip masuk INAKTIF, Tolak → arsip kembali ke AKTIF
- [ ] /arsiparis/inaktif table dengan tombol Pindahkan Sekarang
- [ ] /arsiparis/usul-musnah table dengan status badges
- [ ] Setujui Musnah di usul musnah → konfirmasi warning "akan menghapus permanen"
- [ ] Setujui Musnah → arsip dihapus
- [ ] Tolak → arsip kembali ke INAKTIF
- [ ] Aksi yang sudah diputuskan tidak bisa diulang (button disabled)

### Edge Cases
- [ ] Pindahkan Sekarang pada arsip yang sudah di-sub-stage → error dari API
- [ ] Rapid double-click pada tombol aksi → hanya satu request yang diproses (debounce/idempotency)

---

## Tests for: Step 10 — Arsiparis Klasifikasi + Public Arsip Pages

### Happy Path
- [ ] /arsiparis/klasifikasi CRUD table berfungsi
- [ ] Tambah klasifikasi dengan modal
- [ ] Edit klasifikasi dengan modal
- [ ] Hapus klasifikasi dengan konfirmasi
- [ ] /arsip search page dengan sidebar filter berfungsi
- [ ] /arsip filter results dengan pagination
- [ ] /arsip/[id] detail page menampilkan metadata lengkap
- [ ] /arsip/[id] preview dan download lampiran berfungsi
- [ ] Back button navigates ke search page

### Edge Cases
- [ ] Search tanpa filter → semua arsip ditampilkan
- [ ] Search dengan keyword tidak match → empty state

---

## Tests for: Step 11 — Navigation Config

### Happy Path
- [ ] Sidebar ARSIPARIS menampilkan semua menu items
- [ ] Menu items navigasi ke route yang benar
- [ ] Active menu item highlighted
- [ ] Role switcher bisa switch ke ARSIPARIS

---

## Tests for: Step 12 — Cron Auto-Transition

### Happy Path
- [ ] Edge Function berjalan via pg_cron schedule
- [ ] Arsip AKTIF dengan masa_aktif_berakhir <= today → masuk VERIFIKASI_PENYUSUTAN
- [ ] Arsip INAKTIF dengan masa_inaktif_berakhir <= today → masuk USUL_MUSNAH
- [ ] UNIQUE constraint mencegah duplicate transition
- [ ] Log_aktivitas created untuk setiap auto-transition
- [ ] Edge Function idempotent (bisa dijalankan berulang tanpa efek samping)

### Edge Cases
- [ ] Edge Function jalan tapi tidak ada arsip yang perlu ditransisi → no-op, success
- [ ] Arsip sudah di-sub-stage tapi belum decided → tidak ditransisi lagi
- [ ] Cron overlap → pg_cron handles (satu schedule per hari cukup)

### Error Cases
- [ ] Database connection error → Edge Function returns error, pg_cron retry next schedule