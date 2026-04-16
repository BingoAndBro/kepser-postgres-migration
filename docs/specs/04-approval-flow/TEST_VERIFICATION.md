# Test & Verification Guide — Spec 04: Approval Flow (PPK → Bendahara)

## Overview

Spec 04 implements the Approval Flow: two-tier approval (PPK validates → Bendahara approves). Includes PPK inbox, detail/approve/reject, resubmit flow, and Bendahara inbox, detail/approve/reject, secondary lists.

## Prerequisites

- App running on `localhost:3000`
- Login credentials for PEGAWAI (to submit docs), PPK (to approve/reject), and BENDAHARA (to approve/reject)
- Storage bucket `dokumen-lampiran` active
- Migrations `003_dokumen_transaksi.sql` and `004_storage_rls_cleanup.sql` applied

---

## Test Cases

### [TC-01] PPK Inbox — List

**Tujuan:** PPK bisa melihat daftar dokumen yang menunggu validasi

**Langkah:**
1. Login sebagai PPK
2. Navigate ke `/ppk/inbox`

**Ekspektasi:**
- Halaman "Dokumen Menunggu Validasi" tampil
- Table dengan columns: No, Judul, Fungsi, Kegiatan, Tahun, Tanggal Ajuan, Status, Aksi
- Badge "Validasi PPK" warna kuning pada setiap baris
- Filter fungsi, tanggal mulai, tanggal akhir berfungsi
- Search client-side berfungsi
- Empty state jika tidak ada dokumen

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-02] PPK Inbox — Access Control

**Tujuan:** Non-PPK tidak bisa akses endpoint PPK

**Langkah:**
1. Login sebagai PEGAWAI (bukan PPK)
2. Navigate ke `/ppk/inbox`

**Ekspektasi:**
- Error atau redirect ke halaman yang tepat
- Tidak ada data dokumen ditampilkan

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-03] PPK Detail Page — Load

**Tujuan:** PPK bisa melihat detail dokumen lengkap

**Langkah:**
1. Submit dokumen sebagai PEGAWAI (status → IN_PPK_VALIDATION)
2. Login sebagai PPK
3. Buka `/ppk/inbox`, klik "Lihat" pada dokumen

**Ekspektasi:**
- Halaman detail tampil dengan judul, fungsi, kegiatan, tahun, tanggal
- Workflow indicator menunjukkan posisi saat ini (PPK highlighted)
- Lampiran list dengan tombol Pratinjau dan Download
- Tombol "Setujui" dan "Tolak" terlihat

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-04] PPK Detail — Preview Lampiran

**Tujuan:** PPK bisa preview dokumen tanpa download

**Langkah:**
1. Dari halaman detail PPK, klik tombol Eye pada salah satu lampiran

**Ekspektasi:**
- Modal overlay muncul dengan iframe berisi dokumen
- Header dengan nama file dan tombol X
- ESC menutup modal
- Klik luar modal menutup modal
- Signed URL expire 15 menit

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-05] PPK Approve Document

**Tujuan:** PPK approve dokumen → status berubah ke IN_BENDAHARA_APPROVAL

**Langkah:**
1. Dari halaman detail PPK, klik "Setujui"
2. Konfirmasi dialog

**Ekspektasi:**
- Status berubah ke "IN_BENDAHARA_APPROVAL"
- current_step = 'BENDAHARA'
- Log entry PPK_APPROVE tercatat di log_aktivitas
- Redirect ke /ppk/inbox
- Dokumen tidak lagi muncul di inbox PPK

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-06] PPK Reject Document

**Tujuan:** PPK reject dokumen dengan catatan wajib

**Langkah:**
1. Dari halaman detail PPK, klik "Tolak"
2. Modal terbuka
3. Isi catatan revisi (min 10 karakter)
4. Klik "Tolak Dokumen"

**Ekspektasi:**
- Status berubah ke "NEED_REVISION", revision_target='USER'
- Log entry PPK_REJECT dengan catatan tercatat
- Redirect ke /ppk/inbox
- Catatan revisi tersimpan di dokumen.revision_notes

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-07] PPK Reject — Catatan Required

**Tujuan:** Reject gagal jika catatan kurang dari 10 karakter

**Langkah:**
1. Klik "Tolak", masukkan "salah" (5 karakter)
2. Klik "Tolak Dokumen"

**Ekspektasi:**
- Error "Catatan minimal 10 karakter" muncul
- Status tidak berubah
- Tetap di halaman detail

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-08] PPK Tervalidasi Page

**Tujuan:** PPK bisa melihat dokumen yang sudah dia validasi

**Langkah:**
1. Setelah approve, navigate ke `/ppk/tervalidasi`

**Ekspektasi:**
- Table menampilkan dokumen yang sudah IN_BENDAHARA_APPROVAL, COMPLETED, ARCHIVED
- Status badges sesuai (biru/hijau/abu)
- Empty state jika belum ada

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-09] PPK Ditolak Page

**Tujuan:** PPK bisa melihat dokumen yang dia tolak

**Langkah:**
1. Setelah reject, navigate ke `/ppk/ditolak`

**Ekspektasi:**
- Table menampilkan dokumen NEED_REVISION dengan revision_target='USER'
- Kolom catatan menampilkan preview (truncated)
- Empty state jika belum ada

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-10] PPK Revisi Page

**Tujuan:** PPK bisa melihat dokumen yang dikembalikan Bendahara

**Langkah:**
1. Sebagai BENDAHARA, reject dokumen dari PPK
2. Login sebagai PPK
3. Navigate ke `/ppk/revisi`

**Ekspektasi:**
- Table menampilkan dokumen NEED_REVISION dengan revision_target='PPK'
- Catatan Bendahara tampil (truncated)

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-11] PPK Resubmit — Edit Lampiran

**Tujuan:** PPK bisa hapus file lama dan upload file baru saat resubmit

**Langkah:**
1. Dari halaman `/ppk/revisi`, klik "Lihat" pada dokumen
2. Halaman resubmit terbuka
3. Catatan Bendahara terlihat di banner amber
4. Hapus salah satu lampiran, upload file baru
5. Klik "Resubmit ke Bendahara"

**Ekspektasi:**
- File yang dihapus tidak lagi di lampiran_urls
- File baru ter-upload ke storage
- Status berubah ke IN_BENDAHARA_APPROVAL
- Log entry RESUBMIT_PPK tercatat

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-12] Bendahara Inbox — List

**Tujuan:** Bendahara bisa melihat dokumen yang sudah divalidasi PPK

**Langkah:**
1. Setelah PPK approve, login sebagai BENDAHARA
2. Navigate ke `/bendahara/inbox`

**Ekspektasi:**
- Table menampilkan dokumen IN_BENDAHARA_APPROVAL
- Kolom tambahan: "Divalidasi Oleh" dan "Tanggal Validasi" (dari PPK_APPROVE log)
- Filter fungsi berfungsi
- Badge "Persetujuan Bendahara" warna biru

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-13] Bendahara Detail — PPK Validation Badge

**Tujuan:** Halaman detail Bendahara menampilkan hasil validasi PPK

**Langkah:**
1. Dari inbox Bendahara, klik "Lihat" pada dokumen

**Ekspektasi:**
- Banner hijau "Hasil Validasi PPK" tampil dengan tanggal
- Workflow indicator lengkap
- Lampiran list dengan preview + download
- Tombol "Setujui Pencairan" (primary) dan "Tolak" (destructive)

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-14] Bendahara Approve — COMPLETED

**Tujuan:** Bendahara approve → status COMPLETED

**Langkah:**
1. Klik "Setujui Pencairan", konfirmasi

**Ekspektasi:**
- Status berubah ke COMPLETED, current_step=null
- Log entry BENDAHARA_APPROVE tercatat
- Redirect ke /bendahara/inbox

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-15] Bendahara Reject — back to PPK

**Tujuan:** Bendahara reject → dokumen kembali ke PPK untuk diperbaiki

**Langkah:**
1. Dari halaman detail, klik "Tolak"
2. Isi catatan penolakan (min 10 karakter)
3. Klik "Tolak Dokumen"

**Ekspektasi:**
- Status berubah ke NEED_REVISION, revision_target='PPK'
- Log entry BENDAHARA_REJECT dengan catatan tercatat
- Redirect ke /bendahara/inbox

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

### [TC-16] Bendahara Ditolak + Selesai Pages

**Tujuan:** Bendahara bisa melihat list dokumen ditolak dan selesai

**Langkah:**
1. Navigate ke `/bendahara/ditolak` dan `/bendahara/selesai`

**Ekspektasi:**
- Ditolak: list NEED_REVISION dengan revision_target='PPK', catatan preview
- Selesai: list COMPLETED, badge hijau "Selesai"

**Status:** ⬜ Belum diuji / ✅ Lulus / ❌ Gagal

---

## Manual Verification Checklist

| # | Fitur | Tested | Pass | Fail | Catatan |
|---|-------|--------|------|------|---------|
| 1 | PPK Inbox — list IN_PPK_VALIDATION | ⬜ | ⬜ | ⬜ | |
| 2 | PPK Inbox — filter (fungsi, date) | ⬜ | ⬜ | ⬜ | |
| 3 | PPK Inbox — access control (non-PPK blocked) | ⬜ | ⬜ | ⬜ | |
| 4 | PPK Detail — load with workflow | ⬜ | ⬜ | ⬜ | |
| 5 | PPK Detail — preview modal (15-min URL) | ⬜ | ⬜ | ⬜ | |
| 6 | PPK Approve → IN_BENDAHARA_APPROVAL | ⬜ | ⬜ | ⬜ | |
| 7 | PPK Reject → NEED_REVISION (catatan wajib) | ⬜ | ⬜ | ⬜ | |
| 8 | PPK Reject — min 10 char validation | ⬜ | ⬜ | ⬜ | |
| 9 | PPK Tervalidasi list page | ⬜ | ⬜ | ⬜ | |
| 10 | PPK Ditolak list page | ⬜ | ⬜ | ⬜ | |
| 11 | PPK Revisi list page | ⬜ | ⬜ | ⬜ | |
| 12 | PPK Resubmit — edit lampiran + FSM | ⬜ | ⬜ | ⬜ | |
| 13 | Bendahara Inbox — list with PPK info | ⬜ | ⬜ | ⬜ | |
| 14 | Bendahara Detail — PPK badge | ⬜ | ⬜ | ⬜ | |
| 15 | Bendahara Approve → COMPLETED | ⬜ | ⬜ | ⬜ | |
| 16 | Bendahara Reject → NEED_REVISION target=PPK | ⬜ | ⬜ | ⬜ | |
| 17 | Bendahara Ditolak list page | ⬜ | ⬜ | ⬜ | |
| 18 | Bendahara Selesai list page | ⬜ | ⬜ | ⬜ | |
| 19 | FSM transition used (not direct update) | ⬜ | ⬜ | ⬜ | |
| 20 | log_aktivitas append-only (only INSERT) | ⬜ | ⬜ | ⬜ | |
| 21 | Double-click prevention (loading state) | ⬜ | ⬜ | ⬜ | |
| 22 | All pages have loading/empty/error states | ⬜ | ⬜ | ⬜ | |

---

## Bug yang Ditemukan

| # | Deskripsi | Severity | Status | Link |
|---|---------------|----------|--------|------|
| 1 | | | Open | |

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan