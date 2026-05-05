# Synthesized Spec: 08A — Nominal Realisasi Foundation

## Problem Statement

Sistem tidak memiliki field untuk menyimpan `nominal_realisasi` pada dokumen transaksi. Hal ini menyebabkan seluruh fitur di spec 08 (08B-08E) yang bergantung pada data nominal tidak bisa diimplementasi. Spec ini adalah fondasi yang harus selesai terlebih dahulu.

## Goals

- Menambahkan kolom `nominal_realisasi` ke tabel `dokumen_transaksi` dan `arsip`
- Menambahkan flag `is_non_material` untuk membedakan dokumen yang tidak wajib nominal
- Memastikan validasi: dokumen Material WAJIB punya nominal, Non-Material OPSIONAL
- Update Drizzle schema dan API agar field baru bisa digunakan

## Non-Goals (Explicit Exclusions)

- UI form untuk input nominal (ditangani di spec 03 dan 08B)
- Agregasi nominal untuk laporan (ditangani di spec 08D dan 08E)
- Validasi logic khusus Non-Material (ditangani di spec 08C)
- Perhitungan dari RAB/kegiatan (input manual hanya)

## Context & Constraints

- **Pattern existente:** Gunakan pola yang sudah ada di codebase (Drizzle schema, Zod validation, API handler pattern)
- **Naming:** snake_case untuk database, camelCase untuk TypeScript
- **Migration:** Idempotent (IF NOT EXISTS), format `NNN_nama_descriptive.sql`
- **Auth pattern:** Gunakan `getServerSession()` + role check

## Key Decisions Made

1. **is_non_material** adalah flag yang diset secara **manual oleh user** saat submit dokumen (checkbox/toggle di form)
2. **nominal_realisasi** adalah input manual user, bukan calculation dari data lain
3. **Default value** untuk `nominal_realisasi` di database adalah `0` (bukan NULL)
4. **Validasi**:
   - Jika `is_non_material = false` → `nominal_realisasi` WAJIB terisi (> 0)
   - Jika `is_non_material = true` → `nominal_realisasi` BISA NULL
5. **Update capability:** Nominal bisa diupdate setelah submit (dengan role authorization)
6. **Propagasi ke arsip:** Saat dokumen diarsipkan, `nominal_realisasi` di-copy ke tabel `arsip`. Untuk arsip manual, user arsiparis bisa input sendiri.

## Assumptions

- Form submit sudah ada dan akan extended dengan toggle is_non_material dan input nominal
- Validator akan check berdasarkan nilai is_non_material yang dikirim di body request
- Migration default 0 akan work dengan validator yang tetap strict untuk dokumen baru

## Open Questions

- Apakah perlu constraint `nominal_realisasi >= 0` di database level? → **Ya, CHECK constraint**
- Apakah update nominal perlu logged di audit trail? → **Ya, gunakan log_aktivitas**
- Apakah ada batasan untuk siapa yang boleh update nominal? → **creator, arsiparis, superadmin**

---

## Decision Summary

| Item | Decision |
|------|----------|
| is_non_material source | User manual (form toggle) |
| nominal_realisasi source | Input manual |
| Database default | 0 |
| Material validation | WAJIB nominal |
| Non-Material validation | OPSIONAL nominal |
| Arsip propagasi | Copy dari dokumen |
| Arsip manual | User arsip input sendiri |