# Perbaikan Kode Pasca-Validasi Rancangan Bab IV

> **Dasar:** `docs/planning/ubah-alur-v1/validasi-rancangan-bab-iv.md` (temuan A.3, A.4, B.2 UC-20/21/23, B.2 "Ubah nominal realisasi").
> **Branch:** `workflow/ubah-alur-v1`, dari `1ea3f7a` sampai `3834a95` (24 September 2026).
> **Aturan kerja:** satu butir = satu commit; test penuh (`pnpm test`) dan type-check (`tsc --noEmit`) dijalankan setelah tiap butir, lalu dibandingkan dengan baseline sebelum perubahan.

## Baseline sebelum perubahan

| Pemeriksaan | Hasil |
|---|---|
| `pnpm test` | 100 file, 1019 lulus, 1 dilewati |
| `tsc --noEmit` | 49 error lama di 29 file (semuanya sudah ada sebelum pekerjaan ini) |

Setiap butir di bawah dinyatakan lulus bila test hijau **dan** tidak ada error TypeScript baru dibanding baseline.

## Ringkasan per butir

| # | Perubahan | Commit | Test setelah butir | TypeScript |
|---|---|---|---|---|
| 1 | Checklist kelengkapan server = exact-match enam kolom | `d45bcd9` | 100 file, 1023 lulus (+4 baru) | Tidak ada error baru |
| 2 | Hapus `POST /api/dokumen` dan cabang `DRAFT` di `/api/dokumen/$id/submit` | `8faf1c8` | 101 file, 1025 lulus (+2 baru) | Tidak ada error baru |
| 3 | `scope=laporan_kinerja` hanya untuk PJ Kinerja (PPK/PPSPM → 403) | `c40c469` | 101 file, 1028 lulus (+3 baru) | Tidak ada error baru |
| 4 | Hapus `PATCH /api/dokumen/$id/nominal` | `d1f147e` | 100 file, 1017 lulus (−11: test rute yang dihapus) | 48 error (1 error lama hilang bersama file yang dihapus) |
| 5 | Hapus Master Jenis Dokumen + kolom `dokumen_transaksi.jenis_dokumen_id` | `3834a95` | 100 file, 1017 lulus | Tidak ada error baru |

`pnpm build` juga dijalankan (untuk meregenerasi `src/routeTree.gen.ts` di butir 4 dan 5) dan berhasil.

---

## Butir 1 — Exact-match enam kolom pada checklist kelengkapan

**Masalah.** Server hanya mencocokkan `kegiatan_id`, `is_ketua_tim`, dan simpul terdalam rantai Jenis–Kategori–Detail. `komponen_id` diabaikan bila rantai permintaan diisi, sehingga dua komponen dengan rantai yang sama saling mewajibkan lampiran. Klien (`KelengkapanChecklist.matchesCurrentSelection`) sudah mencocokkan keenam kolom.

**Perubahan.**
- `src/lib/dokumen/local-submit-drizzle-adapter.ts`: fungsi baru `buildRequiredKelengkapanCondition()` membangun `kegiatan_id = ? AND is_ketua_tim = ? AND` empat kolom lain yang masing-masing `= ?` bila dipilih atau `IS NULL` bila tidak. Aturan ini sama persis dengan klien.
- `tests/unit/dokumen/local-submit-drizzle-adapter.test.ts`: 4 test baru dengan fake DB yang benar-benar mengevaluasi klausa WHERE hasil render terhadap baris fixture:
  - komponen A dan komponen B dengan rantai permintaan sama → masing-masing hanya mendapat kelengkapan miliknya (kasus yang diminta);
  - level yang tidak dipilih dicocokkan sebagai NULL (daun di Kategori; hanya Komponen);
  - kelengkapan Ketua Tim dan anggota tetap terpisah;
  - SQL yang dihasilkan mengikat keenam kolom.

**Tidak diubah (catatan).** Server masih membaca checklist untuk dokumen non-material *bila* klien mengirim `jenisPermintaanId` (`shouldReadRequiredKelengkapan`), sedangkan klien tidak pernah memuat checklist untuk non-material. Formulir tidak mengirim rantai untuk non-material, jadi ini tidak berdampak saat ini. Perlu diputuskan terpisah bila ingin diseragamkan penuh.

## Butir 2 — Hapus jalur DRAFT lama

**Pemeriksaan pemanggil (grep).**
- `/api/dokumen` dipanggil UI hanya dengan GET (`src/routes/pegawai/dokumen/index.tsx:86`, `src/routes/pegawai.tsx:59`). Tidak ada POST.
- `/api/dokumen/$id/submit` hanya dipanggil dari halaman revisi (`src/routes/pegawai/dokumen/$id/revisi.tsx:319`), yang mengirim dokumen `NEED_REVISION`.
- Tidak ada test yang menyentuh kedua rute.

**Perubahan.**
- `src/routes/api/dokumen/index.ts`: handler `POST` (buat `DRAFT`) dihapus; GET tetap.
- `src/routes/api/dokumen.$id.submit.ts`: cabang `DRAFT`, termasuk jalur non-material → `COMPLETED` yang melewati modul transisi status, dihapus. Rute kini hanya menerima `NEED_REVISION` + `revision_target = USER` → `transition(..., 'RESUBMIT', 'PEGAWAI', ...)`, dengan log `RESUBMIT`. Cabang RESUBMIT tetap ada.
- `src/lib/schemas/dokumen.ts`: `createDokumenSchema` dihapus karena tidak lagi dipakai.
- `tests/unit/dokumen/legacy-draft-submit-removal-source.test.ts` (baru): mengunci bahwa POST dan cabang `DRAFT` hilang sementara RESUBMIT tetap.

**Dampak.** Pengajuan baru hanya lewat `POST /api/dokumen/submit`. Jalur non-material sekarang **satu-satunya** yang melewati modul transisi status (`DRAFT → TERSIMPAN`, aksi `STORE`), sesuai klaim kerangka Bab IV.

## Butir 3 — `scope=laporan_kinerja` hanya untuk PJ Kinerja

**Perubahan.**
- `src/routes/api/laporan/kinerja.ts`: bila `scope=laporan_kinerja` diminta dan sesi tidak memiliki peran `PENANGGUNG_JAWAB_KINERJA`, respons 403 `Forbidden` sebelum query apa pun. Pemeriksaan memakai `hasLocalRole`, jadi pengguna yang memegang PPK **dan** PJ Kinerja tetap boleh.
- `tests/unit/laporan/kinerja-route.test.ts`: 3 test baru, yaitu PPK → 403, PPSPM → 403, serta pengguna PPK+PJK → 200 dengan cakupan `COMPLETED` + `TERSIMPAN`.

**UI.** Hanya `src/routes/penanggung-jawab-kinerja/laporan-kinerja.tsx` (dan dasbor PJK) yang mengirim `scope`; halaman Monitoring Realisasi PPK/PPSPM tidak terdampak.

## Butir 4 — Hapus `PATCH /api/dokumen/$id/nominal`

**Pemeriksaan pemanggil.** Tidak ada pemanggil di UI; rute hanya muncul di `routeTree.gen.ts`. Satu-satunya test (`nominal-route-uuid-guard.test.ts`) menguji rute itu sendiri.

**Perubahan.**
- Dihapus: `src/routes/api/dokumen/$id.nominal.ts`, `tests/unit/dokumen/nominal-route-uuid-guard.test.ts` (11 test), dan `updateNominalSchema`/`UpdateNominal` di `src/lib/schemas/dokumen.ts`.
- `src/routeTree.gen.ts` diregenerasi lewat `pnpm build`.
- `tests/TEST-CLASSIFICATION.md`: baris test yang dihapus dibuang.
- `src/lib/dokumen/aksi-labels.ts`: label log `UPDATE_NOMINAL` **dipertahankan** agar riwayat lama tetap terbaca; komentarnya diperbarui.

## Butir 5 — Hapus Master Jenis Dokumen

**Hasil pemeriksaan sebelum drop** (dilaporkan dan disetujui lebih dulu; DB lokal `.env.migration`, query baca-saja):

| Pemeriksaan | Hasil |
|---|---|
| FK yang merujuk `master.master_jenis_dokumen` | Hanya `dokumen.dokumen_transaksi.jenis_dokumen_id` |
| Kolom lain `*jenis_dokumen*` | Tidak ada |
| View/function yang merujuk | Tidak ada |
| Isi tabel | 1 baris seed ("Dev Non-Material") |
| Dokumen yang memakai `jenis_dokumen_id` | 0 dari 23; 0 di berkas |

**Perubahan.**
- Migrasi baru `drizzle/0019_drop_master_jenis_dokumen.sql` (+ entri `drizzle/meta/_journal.json`): lepas FK → hapus kolom `dokumen_transaksi.jenis_dokumen_id` → hapus tabel `master.master_jenis_dokumen`. Semua memakai `IF EXISTS`.
- Skema Drizzle: `src/db/schema/master/jenis-dokumen.ts` dihapus; kolom dibuang dari `src/db/schema/dokumen/dokumen-transaksi.ts`; bagian terkait di skema lama `src/lib/db/schema.ts` juga dibuang (file itu masih dipakai untuk tipe `MasterFungsi`).
- Dihapus: halaman `src/routes/admin.master-data.jenis-dokumen.tsx`, rute `src/routes/api/master-jenis-dokumen.ts` dan `.$id.ts`, skema Zod create/update, tipe `JenisDokumenRow`, konstanta rute/tabel, dan seed.
- Pipeline pengajuan: `jenisDokumenId` dibuang dari payload/skema submit, repository, adapter (termasuk `selectJenisDokumenById`), dan write-bridge.
- Rute baca: `jenis_dokumen_id`/`jenis_dokumen_nama` dibuang dari `dokumen.$id.ts`, `dokumen/index.ts`, `laporan/saya(.export-zip).ts`, `laporan/kegiatan(.export-zip).ts`, `lib/dokumen/parse.ts`, `lib/dokumen/types.ts`, dan tipe di empat halaman detail dokumen (field ini tidak pernah ditampilkan).
- Tujuh file test disesuaikan (fixture dan mock adapter).
- `src/routeTree.gen.ts` diregenerasi.

**Belum dilakukan.** Migrasi 0019 **belum diterapkan** ke database mana pun. Jalankan sendiri bila sudah siap (lihat di bawah).

---

## Daftar commit

```
3834a95 Hapus Master Jenis Dokumen beserta kolom dokumen_transaksi.jenis_dokumen_id
d1f147e Hapus PATCH /api/dokumen/$id/nominal yang tidak dipakai UI
c40c469 Batasi scope=laporan_kinerja hanya untuk PJ Kinerja di server
8faf1c8 Hapus jalur DRAFT lama: POST /api/dokumen dan cabang DRAFT di /api/dokumen/$id/submit
d45bcd9 Samakan aturan checklist kelengkapan server dengan klien (exact-match enam kolom)
```

## Dampak ke kerangka Bab IV

| Bagian kerangka | Sekarang sesuai karena |
|---|---|
| 4.2.3 "exact-match atas keenam kolomnya" | Server dan klien kini memakai aturan yang sama (butir 1) |
| 4.2.2.1 "Jalur Non-material … satu-satunya pengecualian yang disengaja" | Jalur `DRAFT` lama yang juga melewati FSM sudah dihapus (butir 2) |
| UC-20/UC-21 "cakupan data berbeda per peran" | Ditegakkan di server (butir 3) |
| KNF-07 *Integrity* | Tidak ada lagi endpoint yang mengubah nominal selama validasi (butir 4) |
| UC-23 dan ERD 4.30 | `master_jenis_dokumen` tidak perlu disebut lagi; hapus dari daftar entitas (butir 5) |

## Catatan lain

- `graphify update .` sudah dijalankan setelah perubahan. Graf kini mencakup seluruh repo (14.095 node) karena perintah di CLAUDE.md memakai `.`; graf lama hanya dari `src/` (3.539 node).
- Peringatan line ending (LF → CRLF) saat commit berasal dari `core.autocrlf=true`; diff tiap commit tetap minimal.
