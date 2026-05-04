# Section Index: SPEC 07 — Chairman Assignment

## Execution Order

| Order | Reason |
|-------|--------|
| 01 → 02 | API endpoints butuh database table existent |
| 02 → 03 | User check API butuh functions yang dibuat di step 1 |
| 02 → 04, 05 | Master User page butuh CRUD API endpoints |
| 03 → 06 | AppLayout butuh API endpoint untuk cek chairman status |
| 03 → 07, 08 | Ajukan Dokumen butuh is-chairman API |
| 03 → 09 | Laporan Kegiatan butuh permission check |
| 04, 05 → (complete) | Master User section |
| 07, 08 → (complete) | Ajukan Dokumen section |
| 06 → (after other sections) | Final integration |

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-database-migration.md | Buat tabel `ketua_tim_assignments` dan helper functions | - | - |
| 02 | section-02-api-crud.md | API endpoints untuk CRUD chairman assignments (ADMIN) | 01 | No |
| 03 | section-03-api-user-check.md | API endpoints untuk user cek status chairman (Authenticated) | 01 | No |
| 04 | section-04-master-user-display.md | Update Master User table dengan kolom "Kegiatan Ketua Tim" | 02 | No |
| 05 | section-05-master-user-dialog.md | Update Edit/Create User dialog dengan section chairman management | 02, 04 | No |
| 06 | section-06-applayout-menu.md | Conditional menu "Laporan Kegiatan" di AppLayout | 03 | Yes (with 07, 08, 09) |
| 07 | section-07-ajukan-dokumen-badge.md | Auto-detect peran dan tampilkan badge di Ajukan Dokumen | 03 | Yes (with 06, 08, 09) |
| 08 | section-08-ajukan-dokumen-submit.md | Update form submission dengan auto-set is_ketua_tim | 07 | No |
| 09 | section-09-laporan-kegiatan-permission.md | Permission check untuk halaman Laporan Kegiatan | 03 | Yes (with 06, 07) |
| 10 | section-10-drizzle-schema.md | Update Drizzle schema (Optional) | 01 | No |

## Grouping for Parallel Work

Jika melakukan secara parallel, bisa dibagi:

**Group A: Database + API Foundation**
- Section 01 (Database)
- Section 02 (API CRUD)
- Section 03 (API User Check)

**Group B: Master User UI**
- Section 04 (Table Display)
- Section 05 (Edit Dialog)

**Group C: Frontend Integration**
- Section 06 (AppLayout Menu)
- Section 07 (Badge)
- Section 08 (Submit)
- Section 09 (Permission Check)

**Group D: Optional**
- Section 10 (Drizzle Schema)

---

*Section Index version: 1.0*
*Created: 2026-05-03*