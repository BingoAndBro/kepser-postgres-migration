# Section Index: SPEC 05 — Arsip Flow (Arsiparis)

## Execution Order

Ada 2 jalur yang bisa dikerjakan параллельно setelah section 01, tapi urutannya secara keseluruhan adalah:

1. **Section 01** (Database) harus selesai dulu — fondasi semua step lain
2. **Section 02** (Arsiparis Inbox + Detail API) bisa dimulai setelah 01, karena UI-nya bergantung pada API ini
3. **Section 03** (Arsipkan + Skip API) параллель dengan Section 04 — keduanya butuh 01 dan 02
4. **Section 04** (Daftar Arsip API) параллель dengan 03
5. **Section 05** (Pindahkan + Putuskan API) butuh 04 selesai (karena reuse logic)
6. **Section 06** (Master Klasifikasi CRUD) berdiri sendiri, bisa параллель dengan 03/04/05
7. **Section 07** (Arsip Search API) berdiri sendiri
8. **Section 08** (Arsiparis UI: Dashboard, Inbox, Detail) butuh 02 dan 03
9. **Section 09** (Arsiparis Lifecycle UI) butuh 04, 05, 07
10. **Section 10** (Klasifikasi + Public Arsip UI) butuh 06 dan 07
11. **Section 11** (Navigation Config) berdiri sendiri, bisa параллель dengan 08/09/10
12. **Section 12** (Cron Edge Function) berdiri sendiri — hanya butuh 01

**Rekomendasi:** Kerjakan secara berurutan (01 → 02 → 03 → 04 → 05 → ...), karena setiap section membangun dari yang sebelumnya. Tapi section 06, 11, 12 bisa dikerjakan lebih awal jika ingin parallelism.

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|---|---|---|---|
| 01 | section-01-db-migration.md | SQL migration untuk 4 tabel baru + RLS + seed | - | - |
| 02 | section-02-inbox-api.md | Arsiparis inbox + dokumen detail API | 01 | No |
| 03 | section-03-archive-skip-api.md | Arsipkan + skip API | 01, 02 | Yes (with 04, 06) |
| 04 | section-04-daftar-arsip-api.md | List aktif, inaktif, verifikasi, usul musnah API | 01 | Yes (with 03, 06) |
| 05 | section-05-pindahkan-api.md | Pindahkan sekarang + putus kan API | 04 | No |
| 06 | section-06-klasifikasi-crud-api.md | Master klasifikasi arsip CRUD | 01 | Yes (with 03, 04) |
| 07 | section-07-arsip-search-api.md | Arsip search + preview + download API | 01 | Yes (standalone) |
| 08 | section-08-arsiparis-ui-basic.md | Dashboard, inbox, detail dokumen UI | 02, 03 | No |
| 09 | section-09-arsiparis-ui-lifecycle.md | Lifecycle pages: aktif, verifikasi, inaktif, usul musnah | 04, 05, 07 | No |
| 10 | section-10-klasifikasi-arsip-ui.md | Klasifikasi CRUD + public arsip search/detail UI | 06, 07 | No |
| 11 | section-11-nav-config.md | Update NAV_CONFIG ARSIPARIS di AppLayout | - | Yes (with 08, 09, 10) |
| 12 | section-12-cron-edge.md | Supabase Edge Function + pg_cron untuk auto-transition | 01 | Yes (standalone) |