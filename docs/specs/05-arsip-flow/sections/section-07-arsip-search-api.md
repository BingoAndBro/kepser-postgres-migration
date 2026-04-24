# Section 07: Arsip Search (Public) + Preview + Download API

## Context
Section 01 (DB Migration) sudah selesai. Tabel arsip sudah ada.

## Objective
Membuat API untuk pencarian arsip + preview + download. Ini accessible oleh semua authenticated user (tidak hanya Arsiparis).

## Prerequisites
- Section 01 selesai
- Pattern: reuse existing preview/download endpoint pattern dari `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts`

## Implementation Steps

### 1. Buat `src/routes/api/arsip/index.ts`

**GET** — search arsip
- Auth: semua authenticated user
- Query params: ?fungsi_id, ?kegiatan_id, ?tahun, ?q, ?page
- WHERE: is_ditolak=false
- JOIN: arsip → dokumen_transaksi → master_fungsi → master_kegiatan
- Filter: fungsi_id, kegiatan_id, tahun, keyword (nomor_surat + judul)
- Pagination: 20 per halaman
- Order by: archived_at DESC

Response:
```typescript
{
  arsip: [{
    id: string,
    nomor_surat: string,
    judul: string,
    fungsi_nama: string,
    kegiatan_nama: string,
    klasifikasi: string,
    archived_at: string,
    status_arsip: string,
  }],
  total: number,
  page: number,
  per_page: number,
}
```

### 2. Buat `src/routes/api/arsip/[id].ts`

**GET** — detail arsip
- Auth: authenticated user
- Include: arsip metadata + dokumen info + fungsi + kegiatan + lampiran_urls (dari dokumen)
- Handle: 404 jika arsip tidak ada

Response:
```typescript
{
  arsip: {
    id: string,
    nomor_surat: string,
    klasifikasi: string,
    retensi_aktif: string,
    retensi_inaktif: string,
    masa_aktif_berakhir: string,
    masa_inaktif_berakhir: string,
    status_arsip: string,
    archived_at: string,
    archived_by_nama: string,
    catatan_arsiparis: string | null,
    dokumen: {
      id: string,
      judul: string,
      fungsi: { id, nama },
      kegiatan: { id, nama },
      tahun: number,
      lampiran_urls: LampiranUrl[],
    }
  }
}
```

### 3. Buat `src/routes/api/arsip/[id]/preview/[filename].ts`

**GET** — preview lampiran (inline)
- Auth: authenticated user
- Validate: arsip exists
- Validate: filename ada di lampiran_urls
- Generate signed URL (15 menit), inline (no download flag)
- Return: `{ signedUrl, filename, mimeType }`

### 4. Buat `src/routes/api/arsip/[id]/download/[filename].ts`

**GET** — download lampiran
- Auth: authenticated user
- Same validation as preview
- Generate signed URL (1 jam), with download flag
- Return: redirect to signed URL

## Files to Create

- `src/routes/api/arsip/index.ts`
- `src/routes/api/arsip/[id].ts`
- `src/routes/api/arsip/[id]/preview/[filename].ts`
- `src/routes/api/arsip/[id]/download/[filename].ts`

## Test Stubs

- [ ] GET /api/arsip dengan filter berfungsi
- [ ] GET /api/arsip pagination 20 per halaman
- [ ] GET /api/arsip exclude is_ditolak=true
- [ ] GET /api/arsip/[id] detail lengkap
- [ ] GET /api/arsip/[id]/preview/[filename] signed URL
- [ ] GET /api/arsip/[id]/download/[filename] redirect
- [ ] 401 jika belum login

## Definition of Done

- [ ] Search dengan semua filter berfungsi
- [ ] Pagination berfungsi
- [ ] Detail arsip lengkap
- [ ] Preview signed URL 15 menit
- [ ] Download signed URL 1 jam with download flag
- [ ] Auth check diterapkan
- [ ] Test stubs pass