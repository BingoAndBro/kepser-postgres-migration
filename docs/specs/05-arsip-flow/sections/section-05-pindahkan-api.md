# Section 05: Pindahkan Sekarang + Putuskan API

## Context
Section 04 (Daftar Arsip API) sudah selesai. Arsiparis bisa melihat arsip di setiap tahap. Sekarang perlu aksi untuk memicu pemindahan dan decide.

## Objective
Membuat 4 endpoint API:
- `POST /api/arsiparis/verifikasi-penyusutan/pindahkan` — pindahkan arsip aktif ke verifikasi penyusutan
- `POST /api/arsiparis/verifikasi-penyusutan/putuskan` — decide verifikasi penyusutan
- `POST /api/arsiparis/usul-musnah/pindahkan` — pindahkan arsip inaktif ke usul musnah
- `POST /api/arsiparis/usul-musnah/putuskan` — decide usul musnah (dengan file deletion)

## Prerequisites
- Section 01, Section 04 selesai
- UNIQUE constraint pada arsip_id di sub-tables sudah ada

## Implementation Steps

### 1. Buat `src/routes/api/arsiparis/verifikasi-penyusutan/pindahkan.ts`

Body: `{ arsip_id: string, catatan?: string }`
1. Role check ARSIPARIS
2. Validate arsip exists + status_arsip = 'AKTIF'
3. Check belum ada arsip_verifikasi_penyusutan aktif untuk arsip_id ini
4. INSERT arsip_verifikasi_penyusutan (status='MENUNGGU', dipindahkan_oleh=session.user.id)
5. UPDATE arsip SET status_arsip='VERIFIKASI_PENYUSUTAN'
6. INSERT log_aktivitas (aksi='PINDAHKAN_VERIFIKASI_PENYUSUTAN')

### 2. Buat `src/routes/api/arsiparis/verifikasi-penyusutan/putuskan.ts`

Body: `{ verifikasi_id: string, aksi: 'SETUJUI' | 'TOLAK', catatan?: string }`
1. Role check ARSIPARIS
2. Validate: verifikasi exists + status='MENUNGGU'
3. Update arsip_verifikasi_penyusutan (status, decided_by, decided_at, catatan)
4. If SETUJUI: UPDATE arsip SET status_arsip='INAKTIF'
   Else TOLAK: UPDATE arsip SET status_arsip='AKTIF'
5. INSERT log_aktivitas (aksi='VERIFIKASI_PENYUSUTAN_SETUJUI' / 'VERIFIKASI_PENYUSUTAN_TOLAK')

### 3. Buat `src/routes/api/arsiparis/usul-musnah/pindahkan.ts`

Body: `{ arsip_id: string, catatan?: string }`
1. Role check ARSIPARIS
2. Validate arsip exists + status_arsip = 'INAKTIF'
3. Check belum ada arsip_usul_musnah aktif untuk arsip_id ini
4. INSERT arsip_usul_musnah (status='MENUNGGU', diusulkan_oleh=session.user.id)
5. UPDATE arsip SET status_arsip='USUL_MUSNAH'
6. INSERT log_aktivitas (aksi='PINDAHKAN_USUL_MUSNAH')

### 4. Buat `src/routes/api/arsiparis/usul-musnah/putuskan.ts`

Body: `{ musnah_id: string, aksi: 'SETUJUI' | 'TOLAK', catatan?: string }`
1. Role check ARSIPARIS
2. Validate: musnah exists + status='MENUNGGU'
3. Update arsip_usul_musnah (status, decided_by, decided_at, catatan)
4. If SETUJUI:
   a. Get arsip record → dapat dokumen_id
   b. Get lampiran_urls dari dokumen_transaksi
   c. DELETE arsip_usul_musnah record
   d. DELETE arsip record
   e. Loop lampiran_urls → hapus file dari Supabase Storage bucket `dokumen-lampiran`
   f. INSERT log_aktivitas (aksi='USUL_MUSNAH_SETUJUI')
5. If TOLAK: UPDATE arsip SET status_arsip='INAKTIF', INSERT log_aktivitas (aksi='USUL_MUSNAH_TOLAK')

**Catatan file deletion:**
- Loop melalui `lampiran_urls` dari dokumen_transaksi
- Untuk setiap entry, ambil `url` dan hapus dari Supabase Storage
- Gunakan Supabase Admin client untuk operasi storage
- Handle error gracefully — file deletion gagal tidak boleh menggagalkan arsip deletion

## Files to Create

- `src/routes/api/arsiparis/verifikasi-penyusutan/pindahkan.ts`
- `src/routes/api/arsiparis/verifikasi-penyusutan/putuskan.ts`
- `src/routes/api/arsiparis/usul-musnah/pindahkan.ts`
- `src/routes/api/arsiparis/usul-musnah/putuskan.ts`

## Test Stubs

- [ ] Pindahkan ke verifikasi: INSERT + UPDATE status_arsip
- [ ] Putuskan verifikasi SETUJU: INAKTIF, TOLAK: AKTIF
- [ ] Pindahkan ke usul musnah: INSERT + UPDATE status_arsip
- [ ] Putuskan musnah SETUJU: DELETE arsip + hapus file storage
- [ ] Putuskan musnah TOLAK: INAKTIF
- [ ] UNIQUE constraint prevents double-pindahkan
- [ ] Pindahkan pada status salah → error
- [ ] Semua returns 403 jika bukan ARSIPARIS

## Definition of Done

- [ ] Semua 4 endpoint berfungsi dengan benar
- [ ] UNIQUE constraint menangani double-pindahkan
- [ ] File deletion saat musnah berfungsi
- [ ] Log aktivitas tersimpan untuk semua aksi
- [ ] Role check diterapkan
- [ ] Test stubs pass