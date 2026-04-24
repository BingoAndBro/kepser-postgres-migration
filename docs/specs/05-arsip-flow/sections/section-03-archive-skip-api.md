# Section 03: Arsipkan & Skip API

## Context
Section 01 (DB Migration) dan Section 02 (Inbox API) sudah selesai. Arsiparis bisa melihat inbox dan detail dokumen.

## Objective
Membuat 2 endpoint API: `POST /api/arsiparis/dokumen/[id]/archive` (arsipkan dokumen) dan `POST /api/arsiparis/dokumen/[id]/skip` (tolak mengarsipkan).

## Prerequisites
- Section 01, Section 02 selesai
- FSM `transition()` function sudah ada di `src/lib/fsm.ts` — sudah support `COMPLETED:ARCHIVE → ARCHIVED`
- `insertLog()` helper sudah ada di `src/lib/dokumen-helpers.ts`
- Zod validation pattern sudah ada di codebase

## Implementation Steps

### 1. Buat `src/routes/api/arsiparis/dokumen.$id.archive.ts`

**Archive action:**
1. Get session + role check ARSIPARIS
2. Validate body (Zod):
   - `nomor_surat`: string, min 1
   - `klasifikasi`: string, min 1
   - `retensi_aktif`: enum ["1 Tahun", "3 Tahun", "5 Tahun", "10 Tahun", "Permanen"]
   - `retensi_inaktif`: enum yang sama
   - `masa_aktif_berakhir`: date string (YYYY-MM-DD)
   - `masa_inaktif_berakhir`: date string (YYYY-MM-DD)
   - `catatan_arsiparis?`: optional string
3. Verify dokumen exists + status = 'COMPLETED' + belum diarsipkan
4. Calculate masa_aktif_berakhir dan masa_inaktif_berakhir (atau terima dari body)
5. INSERT ke tabel `arsip`:
   - `dokumen_id`, `nomor_surat`, `klasifikasi`, `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, `masa_inaktif_berakhir`, `catatan_arsiparis`, `archived_by`, `status_arsip='AKTIF'`
6. Update dokumen status → 'ARCHIVED' via FSM `transition()`
7. INSERT log_aktivitas dengan aksi='ARCHIVE'
8. Return success response

**Body shape:**
```typescript
{
  nomor_surat: string,
  klasifikasi: string,
  retensi_aktif: "1 Tahun" | "3 Tahun" | "5 Tahun" | "10 Tahun" | "Permanen",
  retensi_inaktif: "1 Tahun" | "3 Tahun" | "5 Tahun" | "10 Tahun" | "Permanen",
  masa_aktif_berakhir: string, // YYYY-MM-DD
  masa_inaktif_berakhir: string, // YYYY-MM-DD
  catatan_arsiparis?: string,
}
```

**Retensi calculation (di client/UI):**
- Masa aktif berakhir = archived_at + durasi retensi aktif
- Masa inaktif berakhir = masa aktif berakhir + durasi retensi inaktif

### 2. Buat `src/routes/api/arsiparis/dokumen.$id.skip.ts`

**Skip action:**
1. Get session + role check ARSIPARIS
2. Validate body (Zod): `catatan_arsiparis?`: optional string
3. Verify dokumen exists + status = 'COMPLETED' + belum diarsipkan
4. INSERT ke tabel `arsip`:
   - `dokumen_id`, `is_ditolak=true`, `catatan_arsiparis`, `archived_by`
   - `status_arsip` tetap default 'AKTIF'
   - Field lain (nomor_surat, klasifikasi, dll) null/empty
5. Tidak mengubah dokumen status (tetap 'COMPLETED')
6. INSERT log_aktivitas dengan aksi='ARCHIVE_SKIP'
7. Return success response

## Files to Create

- `src/routes/api/arsiparis/dokumen.$id.archive.ts` — POST archive
- `src/routes/api/arsiparis/dokumen.$id.skip.ts` — POST skip

## Test Stubs (dari TDD plan)

- [ ] POST archive berhasil membuat record arsip dengan status_arsip='AKTIF'
- [ ] POST archive meng-update dokumen status ke 'ARCHIVED' via FSM
- [ ] POST archive membuat log_aktivitas dengan aksi='ARCHIVE'
- [ ] POST archive menghitung masa retensi
- [ ] POST skip berhasil membuat record arsip dengan is_ditolak=true
- [ ] POST skip tidak mengubah dokumen status (tetap 'COMPLETED')
- [ ] POST skip membuat log_ktivitas dengan aksi='ARCHIVE_SKIP'
- [ ] POST archive dengan fields wajib kosong → 400 validation error
- [ ] POST archive dengan klasifikasi tidak valid → 400
- [ ] POST archive pada dokumen yang sudah diarsipkan → error
- [ ] POST archive returns 403 jika bukan ARSIPARIS
- [ ] POST archive pada dokumen bukan COMPLETED → error

## Definition of Done

- [ ] `POST /api/arsiparis/dokumen/[id]/archive` berfungsi dengan benar
- [ ] `POST /api/arsiparis/dokumen/[id]/skip` berfungsi dengan benar
- [ ] FSM transition trigger saat arsipkan
- [ ] Log aktivitas tersimpan untuk kedua aksi
- [ ] Validation Zod diterapkan dengan benar
- [ ] Role check diterapkan
- [ ] Semua test stubs pass