# Interview Transcript — Spec 03: Submit Flow

## Pertanyaan & Jawaban

### Q1: Web Research
**Q:** Apakah perlu riset teknis sebelum plan?
**A:** Tidak perlu riset — best practices untuk multi-step form, upload, dsb sudah ada di docs & skills yang sudah dibaca.

### Q2: Judul Dokumen — auto atau manual?
**Q:** Apakah Judul dokumen itu dipilih dari dropdown, atau pegawai harus ketik manual?
**A:** AUTO dari: `[Nama Kelengkapan] + [Nama Kegiatan] + [Tahun] + [Nama Pegawai]`
**Konfirmasi:** Contoh: "KAK SAKERNAS 2026 Amara Setiadi"
**Catatan:** Tujuan judul agar spesifik ke dokumen kelengkapan tertentu.

### Q3: File Upload
**Q:** 1 file atau multiple files per kelengkapan?
**A:** 1 file per kelengkapan (spec asli bilang ini, confirmed).

### Q4: Storage Access
**Q:** Upload via public URL atau signed URL?
**A:** Signed URL (private) — file tidak bisa didownload langsung.

### Q5: Signed URL — kapan di-generate?
**Q:** Generate on-demand saat klik download, atau generate saat upload?
**A:** Generate on-demand saat user klik download. URL expire dalam waktu tertentu (1 jam).

### Q6: 1 Ajuan = 1 Dokumen?
**Clarification:** Spec bilang `lampiran_urls` array per kelengkapan. Artinya 1 ajuan = 1 dokumen_transaksi = banyak lampiran.
**A:** Benar — 1 ajuan = 1 dokumen_transaksi dengan banyak lampiran. Contoh: "Ajuan SAKERNAS 2026 Amara Setiadi" punya 9 lampiran (6 Ketua Tim + 3 Anggota).

### Q7: Orphan Files Cleanup
**Q:** Pegawai upload file, batalkan proses. File tetap atau perlu cleanup?
**A:** Auto-cleanup via cleanup script atau Supabase trigger. File orphan tidak dibiarkan menumpuk.

### Q8: Tahun & Tanggal
**Q:** Tahun dipakai di judul, dari mana?
**A:** User pilih tahun dan tanggal secara manual di step 1 (Fungsi). Bukan auto dari system.

### Q9: Tahun & Tanggal — Step Berapa?
**Q:** Tahun + Tanggal di step berapa?
**A:** Step 1 (Fungsi) — sebelum pilih kegiatan.

### Q10: Judul dari Kelengkapan yang Mana?
**Clarification:** Step 4 ada banyak kelengkapan. Judul "[Nama Kelengkapan] + ..." dari yang mana?
**A:** TIDAK ada kelengkapan di judul. Judul = `[Nama Kegiatan] [Tahun] [Nama Pegawai]`. Contoh: "SAKERNAS 2026 Amara Setiadi".

## Asumsi Tambahan Hasil Interview

1. **Tahun input**: User pilih tahun dari dropdown (misal: 2024, 2025, 2026, dst.)
2. **Tanggal input**: User pilih tanggal dari date picker (format: DD/MM/YYYY)
3. **Judul final formula**: `[Nama Kegiatan] [Tahun] [Nama Pegawai]`
4. **Cleanup trigger**: Supabase Database Trigger — DELETE dari dokumen_transaksi → auto-delete lampiran files dari Storage
5. **Storage bucket**: Single bucket `dokumen-lampiran` dengan path structure: `[user_id]/[dokumen_id]/[kelengkapan_id]_[filename]`
6. **Download flow**: GET `/api/dokumen/[id]/lampiran/[lampiranIndex]` → server generate signed URL → redirect
