# Section 04: Daftar Arsip (Aktif, Inaktif, Verifikasi, Usul Musnah) API

## Context
Section 01 (DB Migration) sudah selesai. Tabel arsip sudah ada.

## Objective
Membuat 4 endpoint API untuk list arsip di setiap tahap lifecycle: aktif, inaktif, verifikasi penyusutan, dan usul musnah.

## Prerequisites
- Section 01 selesai
- Pattern: mengikuti route pattern Bendahara inbox

## Implementation Steps

### 1. Buat `src/routes/api/arsiparis/aktif.ts`

GET list arsip dengan status_arsip='AKTIF'.

Join: arsip → dokumen_transaksi → master_fungsi → master_kegiatan.
Filter: ?fungsi_id, ?tahun, ?q (keyword search di nomor_surat atau judul dokumen).
Pagination: limit/offset.

Response:
```typescript
{
  aktif: [{
    id: string,
    nomor_surat: string,
    judul_dokumen: string,
    fungsi_nama: string,
    kegiatan_nama: string,
    archived_at: string,
    masa_aktif_berakhir: string,
  }]
}
```

### 2. Buat `src/routes/api/arsiparis/inaktif.ts`

GET list arsip dengan status_arsip='INAKTIF'.
Sama pattern dengan aktif, filter: ?fungsi_id, ?tahun.

### 3. Buat `src/routes/api/arsiparis/verifikasi-penyusutan.ts`

GET list arsip dengan status_arsip='VERIFIKASI_PENYUSUTAN'.
JOIN arsip_verifikasi_penyusutan untuk dapat status (MENUNGGU/DISETUJUI/DITOLAK), decided_by, decided_at, catatan.
Filter: ?fungsi_id, ?tahun.

Response:
```typescript
{
  verifikasi: [{
    arsip_id: string,
    verifikasi_id: string,
    nomor_surat: string,
    judul_dokumen: string,
    fungsi_nama: string,
    verifikasi_status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK',
    dipindahkan_oleh: string,
    created_at: string,
    decided_by: string | null,
    decided_at: string | null,
    catatan: string | null,
  }]
}
```

### 4. Buat `src/routes/api/arsiparis/usul-musnah.ts`

GET list arsip dengan status_arsip='USUL_MUSNAH'.
JOIN arsip_usul_musnah untuk status, diusulkan_oleh, created_at, decided_by, decided_at, catatan.
Filter: ?fungsi_id, ?tahun.

Response:
```typescript
{
  usul_musnah: [{
    arsip_id: string,
    musnah_id: string,
    nomor_surat: string,
    judul_dokumen: string,
    fungsi_nama: string,
    musnah_status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK',
    diusulkan_oleh: string,
    created_at: string,
    decided_by: string | null,
    decided_at: string | null,
    catatan: string | null,
  }]
}
```

## Files to Create

- `src/routes/api/arsiparis/aktif.ts`
- `src/routes/api/arsiparis/inaktif.ts`
- `src/routes/api/arsiparis/verifikasi-penyusutan.ts`
- `src/routes/api/arsiparis/usul-musnah.ts`

## Test Stubs

- [ ] GET /api/arsiparis/aktif mengembalikan arsip AKTIF dengan filter berfungsi
- [ ] GET /api/arsiparis/inaktif mengembalikan arsip INAKTIF dengan filter berfungsi
- [ ] GET /api/arsiparis/verifikasi-penyusutan mengembalikan + JOIN verifikasi info
- [ ] GET /api/arsiparis/usul-musnah mengembalikan + JOIN musnah info
- [ ] Semua endpoint returns 403 jika bukan ARSIPARIS

## Definition of Done

- [ ] Semua 4 endpoint berfungsi dengan benar
- [ ] Filter berfungsi (fungsi_id, tahun, q)
- [ ] JOIN menghasilkan data yang lengkap
- [ ] Role check diterapkan
- [ ] Test stubs pass