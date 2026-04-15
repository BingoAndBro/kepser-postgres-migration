# Section Index: 02 — Master Data Management

## Execution Order

| Priority | Reason |
|----------|--------|
| 01, 02 | **Foundation** — tidak ada yang bisa jalan tanpa schema dan migration |
| 03 | **Helpers** — semua komponen downstream pakai ini |
| 04, 05, 06 | **API Endpoints** — butuh schema, bisa paralel |
| 07, 08, 09 | **Admin Pages** — butuh API endpoints selesai dulu |
| 10 | **Layout** — wire everything together |

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-db-schema.md | Extend Drizzle schema + SQL migration + seed data | - | - |
| 02 | section-02-db-helpers.md | Read-only helper functions (getAllFungsi, dll) | 01 | No |
| 03 | section-03-api-fungsi.md | CRUD API for master-fungsi | 01 | Yes (with 04, 05) |
| 04 | section-04-api-kegiatan.md | CRUD API for master-kegiatan | 01 | Yes (with 03, 05) |
| 05 | section-05-api-kelengkapan.md | CRUD API for master-kelengkapan | 01 | Yes (with 03, 04) |
| 06 | section-06-admin-fungsi.md | Admin page: list & CRUD fungsi | 03 | Yes (with 07, 08) |
| 07 | section-07-admin-kegiatan.md | Admin page: list & CRUD kegiatan | 04 | Yes (with 06, 08) |
| 08 | section-08-admin-kelengkapan.md | Admin page: kelengkapan config | 05 | Yes (with 06, 07) |
| 09 | section-09-admin-layout.md | Tab navigation + NAV_CONFIG update | 06, 07, 08 | After all pages |

## Recommended Execution

**Batch 1** (Sequential): Section 01 → 02

**Batch 2** (Parallel): Section 03, 04, 05 (semua butuh section 01)

**Batch 3** (Parallel): Section 06, 07, 08 (semua butuh Batch 2)

**Batch 4** (Sequential): Section 09 (butuh semua)
