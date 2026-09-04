# Section Index — Keluarga Fitur Ekspor ZIP (RP-07 + RP-02 + RP-05)

Baca `../claude-plan.md` untuk konteks penuh (arsitektur, 12 langkah implementasi, edge cases, integration points); `../claude-plan-tdd.md` untuk stub test lengkap per langkah; `../claude-spec.md` untuk keputusan yang sudah dikunci; `../claude-interview.md` untuk alasan di balik 3 keputusan RP-02.

## Execution Order

```
section-01 (fondasi)
     │
     ├──▶ section-02 (RP-02 — KSBU)   ─┐
     │                                  ├─ paralel, tidak saling menyentuh file
     └──▶ section-03 (RP-05 — Pegawai/Ketua Tim) ─┘
```

- **section-01 wajib pertama** — modul `document-zip.ts`, resolver non-HTTP di kedua file access existing, dan sinkron `AGENTS.md` adalah fondasi yang dipakai section-02 **dan** section-03. Tanpa ini, kedua section lain tidak punya apa pun untuk dipanggil.
- **section-02 dan section-03 paralelizable** setelah section-01 selesai — keduanya menambah file baru di direktori berbeda (`arsiparis/` vs `laporan/`) dan mengedit halaman UI berbeda (`arsiparis/berkas/$id.tsx` vs `pegawai/laporan/*.tsx`). Satu-satunya titik singgung adalah `src/routeTree.gen.ts` (file generated bersama) — lihat catatan koordinasi di bawah.
- Section-02 dan section-03 **tidak bergantung satu sama lain** — bisa dikerjakan dalam urutan apa pun, atau benar-benar bersamaan oleh dua sesi/engineer berbeda.

### Koordinasi `routeTree.gen.ts` bila section-02/03 benar-benar paralel

Kedua section menjalankan route generation resmi (`pnpm dev`/`pnpm build`) di akhir masing-masing. Kalau dikerjakan bersamaan oleh dua sesi berbeda, siapa pun yang commit lebih dulu meregenerasi & commit seperti biasa; sesi kedua **meregenerasi ulang** dari state terbaru `main` sebelum commit miliknya (bukan hand-merge diff `routeTree.gen.ts`). Ini murni urutan regenerasi, bukan konflik logika.

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | `section-01-fondasi.md` | Izin paket `archiver`; modul `src/lib/export/document-zip.ts` (`buildZipPlan` + `streamDocumentZip`); ekspos resolver non-HTTP di `document-file-access.ts` & `berkas-arsip-file-access.ts`; test `tests/unit/export/document-zip.test.ts`; sinkron `AGENTS.md` (Storage/File Rules + daftar API) | — | No |
| 02 | `section-02-rp02-berkas-export.md` | Endpoint `GET /api/arsiparis/berkas/$id/export-zip`; tombol + dialog konfirmasi di `/arsiparis/berkas/$id`; route generation; test otorisasi & struktur ZIP RP-02 | 01 | Yes (dengan 03) |
| 03 | `section-03-rp05-laporan-export.md` | Endpoint `POST /api/laporan/saya.export-zip` + `POST /api/laporan/kegiatan.export-zip`; Zod `src/lib/schemas/export.ts`; tombol + dialog di `/pegawai/laporan/saya` & `/pegawai/laporan/kegiatan`; route generation; test otorisasi per-dokumen RP-05 | 01 | Yes (dengan 02) |

## Definition of Done keseluruhan

- [ ] `src/lib/export/document-zip.ts` dipakai oleh **kedua** endpoint export (RP-02 dan RP-05) — tidak ada implementasi ZIP kedua yang divergen.
- [ ] KSBU bisa mengunduh ZIP satu berkas tertutup dari `/arsiparis/berkas/$id`, struktur `[Nomor SPM] - [Klasifikasi]/[folder dokumen]/[file]`.
- [ ] Pegawai bisa mengunduh ZIP dokumen laporan yang lolos filter aktif dari `/pegawai/laporan/saya`.
- [ ] Ketua Tim bisa mengunduh ZIP dokumen kegiatan yang ia pimpin dari `/pegawai/laporan/kegiatan`, termasuk dokumen milik anggota tim lain.
- [ ] Batas 500 dokumen (RP-05: dicek dari `dokumen_ids.length` mentah sebelum query DB; RP-02: dicek dari jumlah item berkas) ditegakkan sebelum streaming/IO apa pun, dengan pesan spesifik jumlah.
- [ ] File > 250 MB dan file hilang dilewati (tidak menggagalkan ZIP), tercatat di `DAFTAR_ISI.txt`.
- [ ] `DAFTAR_ISI.txt` selalu ada di root ZIP, jadi entri pertama yang ditulis, tidak memuat path fisik/root/token.
- [ ] Otorisasi ulang server-side per dokumen (RP-05) dan per berkas (RP-02) — id yang tidak berhak diabaikan diam-diam, tidak membocorkan keberadaannya.
- [ ] Dialog konfirmasi klien tampil sebelum ekspor jalan di kedua konsumen; jumlah > 500 → pesan "persempit filter" tanpa tombol lanjut.
- [ ] **Tidak ada migrasi DB baru** — `src/db/schema/**` dan `drizzle/*.sql` tidak berubah untuk seluruh keluarga fitur ini.
- [ ] **Tidak ada baris baru** di `berkas_arsip_activity` untuk aksi ekspor (keputusan interview #10) — cukup log aplikasi.
- [ ] `package.json`/`pnpm-lock.yaml` hanya berubah untuk `archiver`/`@types/archiver`, di commit tersendiri.
- [ ] `src/routeTree.gen.ts` diff terbatas ke 3 route API baru (`export-zip`, `saya.export-zip`, `kegiatan.export-zip`).
- [ ] `AGENTS.md` — *Storage And File Rules* + daftar *API utama* KSBU/Pegawai sinkron dengan perilaku baru.
- [ ] `pnpm test` hijau, termasuk `tests/unit/export/document-zip.test.ts` (baru) dan test otorisasi kedua endpoint.
- [ ] Smoke test manual: unduh ZIP nyata dari kedua konsumen (termasuk 1 kasus file hilang) — riset web menegaskan pendekatan `archiver`+`Readable.toWeb()` tapi tidak menggantikan uji langsung terhadap versi persis yang terpasang.
