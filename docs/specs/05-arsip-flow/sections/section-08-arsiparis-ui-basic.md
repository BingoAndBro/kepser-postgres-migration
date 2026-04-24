# Section 08: Arsiparis Dashboard, Inbox, Detail Dokumen UI

## Context
Section 02 (Inbox API) dan Section 03 (Archive/Skip API) sudah selesai. API untuk arsiparis inbox dan arsipkan/skip sudah ada.

## Objective
Membuat 3 halaman UI untuk Arsiparis:
- `/arsiparis` — Dashboard
- `/arsiparis/inbox` — List dokumen siap arsip
- `/arsiparis/dokumen/[id]` — Detail dokumen + form archive/skip + preview lampiran

## Prerequisites
- Section 02, Section 03 selesai (API ready)
- Pattern: mengikuti `src/routes/bendahara/inbox.tsx` dan `src/routes/ppk/dokumen/$id/index.tsx`
- Preview pattern dari PPK dokumen detail — reuse di sini

## Implementation Steps

### 1. Buat `src/routes/arsiparis/index.tsx` — Dashboard

Struktur: PageLayout dengan stats cards.
- Total inbox (dokumen COMPLETED belum diarsipkan)
- Total arsip aktif
- Total arsip verifikasi penyusutan
- Total arsip inaktif
- Total usul musnah

Gunakan pattern StatsBento atau card grid yang sudah ada di codebase.
Fetch data dari:
- `GET /api/arsiparis/inbox` → count untuk inbox
- `GET /api/arsiparis/aktif` → count untuk aktif
- `GET /api/arsiparis/verifikasi-penyusutan` → count
- `GET /api/arsiparis/inaktif` → count
- `GET /api/arsiparis/usul-musnah` → count

### 2. Buat `src/routes/arsiparis/inbox.tsx` — Inbox List

Struktur: PageLayout + table + filter.
- Table columns: Judul, Fungsi, Kegiatan, Pegawai, Tanggal Approve Bendahara, Aksi
- Filter: fungsi dropdown
- Empty state: "Tidak ada dokumen yang menunggu diarsipkan"
- Loading state
- Aksi: link ke `/arsiparis/dokumen/[id]`
- Sort by: tanggal terbaru

### 3. Buat `src/routes/arsiparis/dokumen/$id/index.tsx` — Detail + Archive/Skip

Halaman ini menggabungkan:
- **Header info**: judul, fungsi, kegiatan, tanggal, pegawai
- **Badge**: status COMPLETED (hijau)
- **Section lampiran**: list lampiran dengan preview (eye icon) + download (download icon)
- **Info approve Bendahara**: nama + tanggal dari API
- **Form archive**:
  - Nomor Surat (input text)
  - Klasifikasi (select — fetch dari `/api/arsiparis/klasifikasi`)
  - Retensi Aktif (select: 1/3/5/10 Tahun, Permanen)
  - Retensi Inaktif (select: sama)
  - Masa Aktif Berakhir (readonly, auto-calculated dari archived_at + retensi)
  - Masa Inaktif Berakhir (readonly, auto-calculated)
  - Catatan Arsiparis (textarea, optional)
  - Tombol [Arsipkan]
- **Tombol [Tidak Diarsipkan]** — dengan modal konfirmasi

**Preview lampiran:**
Reuse preview pattern dari PPK. State management:
```typescript
const [previewingIdx, setPreviewingIdx] = useState<number | null>(null)
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
```

Preview modal dengan iframe. ESC key handler.

**Form behavior:**
- Retensi change → auto-calculate masa aktif dan inaktif berakhir
- Submit archive → POST `/api/arsiparis/dokumen/[id]/archive` → redirect ke inbox + toast success
- Skip → modal konfirmasi → POST `/api/arsiparis/dokumen/[id]/skip` → redirect ke inbox

## Files to Create

- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`

## Test Stubs

- [ ] Dashboard menampilkan stats cards dengan data count
- [ ] Inbox table dengan filter berfungsi
- [ ] Empty state ditampilkan saat tidak ada data
- [ ] Form archive: semua field mandatory ter-validasi
- [ ] Form archive: klasifikasi dari master_klasifikasi_arsip
- [ ] Retensi change → masa berakhir auto-calculated
- [ ] Tombol Arsipkan berfungsi
- [ ] Modal konfirmasi untuk Tidak Diarsipkan
- [ ] Preview lampiran berfungsi (iframe modal)

## Definition of Done

- [ ] Dashboard menampilkan stats dengan data real
- [ ] Inbox list berfungsi dengan filter
- [ ] Detail page menampilkan semua info
- [ ] Preview lampiran berfungsi
- [ ] Form archive/submit berfungsi
- [ ] Skip dengan konfirmasi berfungsi
- [ ] Redirect ke inbox setelah aksi
- [ ] Test stubs pass