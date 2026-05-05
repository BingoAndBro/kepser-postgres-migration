# Section Index: 08A — Nominal Realisasi Foundation

## Execution Order

Urutan berdasarkan dependency:

1. **Section 01**: SQL Migration — tidak ada dependency, step pertama
2. **Section 02**: Drizzle Schema — bergantung pada migration, harus setelah 01
3. **Section 03**: Zod Validation — tidak ada dependency, bisa parallel dengan 02
4. **Section 04**: Dokumen Helpers — bergantung pada schema, harus setelah 02
5. **Section 05**: Submit Handler — membutuhkan 01, 02, 03
6. **Section 06**: Update Nominal Endpoint — membutuhkan 01, 02, 03
7. **Section 07**: Archive Handler — membutuhkan 01, 02

Parallelizable:
- Section 02 dan 03 bisa paralelo
- Section 05 dan 06 bisa paralelo (keduanya bergantung pada 01, 02, 03)

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-sql-migration.md | SQL migration untuk menambah kolom | - | No |
| 02 | section-02-drizzle-schema.md | Update TypeScript schema | 01 | Yes (with 03) |
| 03 | section-03-zod-schema.md | Zod validation schemas | - | Yes (with 02) |
| 04 | section-04-document-helpers.md | Update helper functions | 02 | No |
| 05 | section-05-submit-handler.md | Update submit endpoint | 01, 02, 03 | No |
| 06 | section-06-update-nominal.md | Create PATCH endpoint | 01, 02, 03 | No |
| 07 | section-07-archive-handler.md | Update archive propagasi | 01, 02 | No |

---

## Quick Start

Untuk implementasi cepat, bisa kerjakan sections berurutan sesuai nomor. Section yang parallelizable bisa dikerjakan bersamaan oleh dua orang (misalnya: 02 dan 03).

**Minimum untuk feature complete:** Section 01-05 (migration, schema, validation, helpers, submit)

**Full feature:** Semua sections 01-07