# Section 05 — Navigasi + Route Add/Remove/Rename + Route Generation

## Context

Route constants (section-02) siap. RP-01 **secara eksplisit mengizinkan** route
generation untuk: hapus `/arsiparis/inaktif`, rename `/arsiparis/usul-musnah` →
`/arsiparis/pembersihan`, tambah `/arsiparis/berkas/tertutup`. Dikerjakan sebagai
satu langkah supaya `src/routeTree.gen.ts` teregenerasi sekali dengan diff yang
bisa diaudit. **Jangan edit `routeTree.gen.ts` manual** (Protected Files).

## Objective

- `navigation.ts` grup KSBU: 2 item ("Berkas Terbuka" + "Berkas Tertutup"),
  "Pembersihan Berkas", tanpa "Daftar Arsip Inaktif", ikon disesuaikan, urutan
  sesuai PB-6.
- File route: `inaktif/` dihapus, `usul-musnah/index.tsx` →
  `pembersihan/index.tsx` (rename + path), `berkas/tertutup.tsx` dibuat (stub
  komponen; isi penuh di section-06).
- `src/routeTree.gen.ts` teregenerasi via generator resmi; diff terverifikasi
  hanya 3 route.

## Prerequisites

- Section 02 selesai. Bisa paralel dengan section-03/04.
- Isi UI penuh untuk `pembersihan` & `tertutup` menyusul di section-06 — di sini
  cukup buat berkompilasi.

## Implementation Steps

1. **`src/config/navigation.ts` grup `KEPALA_SUB_BAGIAN_UMUM` (±ln 116-129):**
   - `arsip_aktif` → `label: 'Berkas Terbuka'`, `to: ROUTES...BERKAS_AKTIF`,
     `icon: FolderOpen`.
   - **Tambah** `{ id: 'berkas_tertutup', label: 'Berkas Tertutup', icon: <pilih>,
     to: ROUTES...BERKAS_TERTUTUP }` — ikon: `FolderCheck` / `Archive` / `Lock`
     (`FolderClosed` tidak ada di lucide; putuskan, catat di PR).
   - **Hapus** item `arsip_inaktif`.
   - `usul_musnah` → `{ id: 'pembersihan', label: 'Pembersihan Berkas',
     icon: Trash2, to: ROUTES...PEMBERSIHAN }`.
   - `klasifikasi` → `label: 'Master Klasifikasi Dokumen'` (opsional, sesuai PB-6).
   - Bersihkan `import { Archive, ArchiveX }` — buang yang tak dipakai, tambah ikon
     baru.
   - Urutan final: Dashboard · Pengklasifikasian Dokumen · Penambahan Dokumen ·
     Berkas Terbuka · Berkas Tertutup · Pembersihan Berkas · Master Klasifikasi
     Dokumen · (System).
2. **Hapus** `src/routes/arsiparis/inaktif/index.tsx` (+ folder `inaktif/` bila
   kosong). Semua logikanya digantikan halaman Berkas Tertutup (section-06b).
3. **Rename** `src/routes/arsiparis/usul-musnah/index.tsx` →
   `src/routes/arsiparis/pembersihan/index.tsx`:
   - Ubah `createFileRoute('/arsiparis/usul-musnah/')` →
     `createFileRoute('/arsiparis/pembersihan/')`.
   - Sisanya (relabel toggle, tombol Batalkan Usulan, kolom Umur) di section-06e —
     di sini cukup rename + path + biar kompilasi.
4. **Buat** `src/routes/arsiparis/berkas/tertutup.tsx`:
   - `createFileRoute('/arsiparis/berkas/tertutup')` + komponen placeholder minimal
     (mis. `<PageLayout>…</PageLayout>` kosong). Isi penuh di section-06b.
   - Pastikan tidak bentrok dengan `berkas/$id.tsx` (segmen statis > param; id
     selalu UUID).
5. **Route generation:** jalankan `pnpm dev` (biarkan Vite start hingga plugin
   `@tanstack/router-plugin` menulis ulang `src/routeTree.gen.ts`, lalu hentikan)
   **atau** `pnpm build`. Tidak ada CLI khusus.
6. **Verifikasi:**
   - `git diff src/routeTree.gen.ts` → hanya: `/arsiparis/inaktif` hilang,
     `/arsiparis/usul-musnah` hilang, `/arsiparis/pembersihan` muncul,
     `/arsiparis/berkas/tertutup` muncul. Nol route lain berubah. Bila ada yang
     lain → STOP, investigasi.
   - `grep -rn "arsiparis/inaktif\|arsiparis/usul-musnah" src/` → idealnya nol
     (sisa di `$id.tsx` redirect sukses & dashboard ditangani section-06).
7. **Cek matcher nav aktif** (`AppLayout`): bila prefix-match,
   `/arsiparis/berkas/tertutup` juga menyalakan "Berkas Terbuka". Pola sama sudah
   ada untuk `/arsiparis/berkas/$id`. Bila perlu, pasang
   `activeOptions={{ exact: true }}` pada item "Berkas Terbuka" (OQ6).

## Files to Create/Modify

- `src/config/navigation.ts`
- `src/routes/arsiparis/inaktif/index.tsx` — **hapus**
- `src/routes/arsiparis/usul-musnah/index.tsx` → `src/routes/arsiparis/pembersihan/index.tsx` — **rename**
- `src/routes/arsiparis/berkas/tertutup.tsx` — **baru (stub)**
- `src/routeTree.gen.ts` — via generator (jangan edit manual)

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 5".
- [ ] Navigasi KSBU: item "Berkas Terbuka" → `/arsiparis/berkas`; "Berkas Tertutup"
      → `/arsiparis/berkas/tertutup`; "Pembersihan Berkas" → `/arsiparis/pembersihan`.
- [ ] Tidak ada item `/arsiparis/inaktif` atau `/arsiparis/usul-musnah`.
- [ ] Urutan item sesuai PB-6.
- [ ] (manual) `git diff src/routeTree.gen.ts` hanya 3 route.
- [ ] (manual) `grep` path lama di `src/` bersih.

## Definition of Done

- [ ] `navigation.ts` sesuai; import ikon bersih.
- [ ] `inaktif/` terhapus; `pembersihan/index.tsx` ada dengan path route benar;
      `berkas/tertutup.tsx` ada & kompilasi.
- [ ] `routeTree.gen.ts` diregenerasi resmi; diff terbatas 3 route; **tidak** ada
      edit manual.
- [ ] Test navigasi hijau.
- [ ] Tidak ada regresi section-03.
