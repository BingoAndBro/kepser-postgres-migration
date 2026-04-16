# Section Index — Spec 03: Submit Flow

## Execution Order

```
01 (DB + Schema) → 02 (Zod + Helpers) → 03 (CRUD API)
                                            ↓
04 (List UI) ←──────────────────────────────┘
                                            ↓
05 (Form UI) ──────────────────────────────┘
                                            ↓
06 (Detail/Edit UI) ←──────────────────────┘
```

**Alasan urutan:**
- Section 02-03 harus selesai sebelum UI karena API jadi contract untuk UI
- Section 04 (List) bisa dikerjakan paralel dengan Section 05-06 (Form/Detail)
- Section 06 (Detail/Edit) bergantung pada Section 05 (komponen reuse)

**Parallelization:**
- Section 04 bisa mulai setelah Section 03 API skeleton selesai (tidak perlu semua detail API)
- Section 05 bisa mulai setelah Section 04 layout selesai
- Section 06 butuh Section 05 komponen (reusable)

## Sections

| # | File | Deskripsi | Depends On | Parallelizable |
|---|---|---|---|---|
| 01 | `section-01-db-schema.md` | Migration, Drizzle schema, RLS, Storage bucket | Spec 02 done | No |
| 02 | `section-02-api-core.md` | Zod schemas, DB helpers, CRUD + submit API | 01 | No |
| 03 | `section-03-api-upload.md` | Upload, download signed URL, cleanup trigger | 01 | No |
| 04 | `section-04-ui-list.md` | Dokumen Saya list page | 03 (API) | Partially (with 05) |
| 05 | `section-05-ui-form.md` | Ajukan Dokumen multi-step form + components | 04 (layout) | No |
| 06 | `section-06-ui-detail.md` | Detail dokumen + edit/resubmit page | 05 (components) | No |
