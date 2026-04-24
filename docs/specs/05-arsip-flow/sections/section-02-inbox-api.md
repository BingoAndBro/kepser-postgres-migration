# Section 02: Arsiparis Inbox & Dokumen Detail API

## Context
Section 01 (Database Migration) sudah selesai. Tabel `arsip`, `master_klasifikasi_arsip`, `arsip_verifikasi_penyusutan`, `arsip_usul_musnah` sudah ada.

## Objective
Membuat 2 endpoint API: `GET /api/arsiparis/inbox` (list dokumen siap arsip) dan `GET /api/arsiparis/dokumen/[id]` (detail dokumen dengan lampiran dan info approve Bendahara).

## Prerequisites
- Section 01 selesai
- Auth pattern (getServerSession + role check) sudah ada di codebase — lihat `src/routes/api/bendahara/inbox.ts`
- Helper `getDokumenById` sudah ada di `src/lib/dokumen-helpers.ts`

## Implementation Steps

### 1. Buat `src/routes/api/arsiparis/inbox.ts`

Endpoint ini mengembalikan list dokumen dengan:
- status = 'COMPLETED'
- belum punya record di tabel `arsip` (LEFT JOIN WHERE arsip.id IS NULL)
- include: fungsi.nama, kegiatan.nama, created_by (user metadata), tanggal approve Bendahara

Query yang dilakukan:
1. Get session + role check (harus ARSIPARIS)
2. Query dokumen_transaksi WHERE status='COMPLETED'
3. LEFT JOIN arsip ON arsip.dokumen_id = dokumen_transaksi.id
4. WHERE arsip.id IS NULL (belum diarsipkan)
5. LEFT JOIN master_fungsi, master_kegiatan
6. Filter: ?fungsi_id, ?start_date, ?end_date
7. Order by created_at DESC

Dari log_aktivitas, ambil entry dengan aksi='BENDAHARA_APPROVE' untuk dapat tanggal approve Bendahara.

Response shape:
```typescript
{
  inbox: [{
    id: string,
    judul: string,
    fungsi_nama: string,
    kegiatan_nama: string,
    tanggal: string,
    tahun: number,
    nama_pegawai: string,  // dari user_metadata
    bendahara_approve_at: string, // dari log_aktivitas BENDAHARA_APPROVE
  }]
}
```

### 2. Buat `src/routes/api/arsiparis/dokumen.$id.ts`

Endpoint ini mengembalikan detail dokumen untuk halaman review arsip:
- Info lengkap dokumen (judul, fungsi, kegiatan, tanggal, tahun)
- lampiran_urls (array untuk preview)
- Info approve Bendahara (nama, tanggal) — dari log_aktivitas BENDAHARA_APPROVE
- Info apakah sudah ada record arsip (untuk handle edge case: arsip sudah ada tapi user masih akses)
- Include join ke arsip untuk dapat nomor_surat jika sudah diarsipkan

Validasi:
- Session + role check ARSIPARIS
- Dokumen harus ada
- Dokumen harus berstatus COMPLETED (jika bukan, return error)
- Dokumen belum diarsipkan (jika sudah, bisa return info tapi note bahwa sudah diarsip)

Response shape:
```typescript
{
  dokumen: {
    id: string,
    judul: string,
    fungsi: { id, nama },
    kegiatan: { id, nama },
    tanggal: string,
    tahun: number,
    lampiran_urls: LampiranUrl[],
    created_by: { id, nama, email },
    status: string,
  },
  bendahara_approve: {
    nama: string,
    tanggal: string,
  } | null,
  arsip: {  // null jika belum diarsipkan
    id: string,
    status_arsip: string,
    nomor_surat: string,
  } | null
}
```

## Files to Create

- `src/routes/api/arsiparis/inbox.ts` — GET inbox list
- `src/routes/api/arsiparis/dokumen.$id.ts` — GET dokumen detail

## Test Stubs (dari TDD plan)

- [ ] GET /api/arsiparis/inbox mengembalikan list dokumen COMPLETED belum diarsipkan
- [ ] GET /api/arsiparis/inbox include informasi fungsi, kegiatan, nama pegawai
- [ ] GET /api/arsiparis/inbox filter by fungsi_id bekerja
- [ ] GET /api/arsiparis/inbox filter by date range bekerja
- [ ] GET /api/arsiparis/inbox exclude dokumen yang sudah punya record arsip
- [ ] GET /api/arsiparis/dokumen/[id] mengembalikan detail lengkap dokumen
- [ ] GET /api/arsiparis/dokumen/[id] include lampiran_urls
- [ ] GET /api/arsiparis/dokumen/[id] include info approve Bendahara dari log_aktivitas
- [ ] GET /api/arsiparis/inbox returns 403 jika bukan ARSIPARIS
- [ ] GET /api/arsiparis/dokumen/[id] returns 404 jika dokumen tidak ada
- [ ] GET /api/arsiparis/dokumen/[id] returns 403 jika bukan ARSIPARIS

## Definition of Done

- [ ] `GET /api/arsiparis/inbox` berfungsi dengan benar
- [ ] `GET /api/arsiparis/dokumen/[id]` berfungsi dengan benar
- [ ] Role check ARSIPARIS diterapkan di kedua endpoint
- [ ] Filter fungsi dan tanggal berfungsi
- [ ] Response sesuai shape yang didefinisikan
- [ ] Semua test stubs di atas pass