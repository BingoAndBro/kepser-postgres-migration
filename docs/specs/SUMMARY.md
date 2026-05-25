# Analisis MVP — Split & Spec Summary

## FSM Final (Persetujuan Berjenjang)
```
DRAFT ──▶ IN_PPK_VALIDATION ──▶ IN_BENDAHARA_APPROVAL ──▶ COMPLETED ──▶ ARCHIVED
              │                        │
              ▼                        ▼
       NEED_REVISION            NEED_REVISION
       (target: USER)           (target: PPK)

       USER perbaiki             PPK perbaiki
           │                         │
           ▼                         ▼
       RESUBMIT ──▶ IN_PPK_VALIDATION ──▶ IN_BENDAHARA_APPROVAL
                                     (langsung ke Bendahara)
```

## Role Static (MVP)
`PEGAWAI` | `PPK` | `BENDAHARA` | `KEPALA_SUB_BAGIAN_UMUM` | `ADMIN` | `PENANGGUNG_JAWAB_KINERJA`

## Role Switcher
- Semua user BARU otomatis punya role PEGAWAI (role default)
- Jika user punya > 1 role (misal PEGAWAI + PPK), ada dropdown di kanan atas untuk switch
- ADMIN punya akun terpisah, tidak punya dropdown role
- Active role disimpan di session/client state

---

## Komponen & Urutan

| # | Komponen | Direktori | Status |
|---|----------|-----------|--------|
| 01 | Auth & RBAC Foundation | `docs/specs/01-auth-rbac-foundation/spec.md` | ✅ Done |
| 01b | FSM (Document Status Transitions) | `docs/specs/01b-fsm/spec.md` | ✅ Done |
| 02 | Master Data Management | `docs/specs/02-master-data/spec.md` | ✅ Done |
| 03 | Submit Flow (Pegawai) | `docs/specs/03-submit-flow/spec.md` | ✅ Done |
| 04 | Approval Flow (PPK→Bendahara) | `docs/specs/04-approval-flow/spec.md` | ✅ Done |
| 05 | Arsip Flow (Kepala Sub Bagian Umum) | `docs/specs/05-arsip-flow/spec.md` | ✅ Done |
| 06 | User Management | `docs/specs/06-user-management/spec.md` | 🔄 Draft |
| 07 | Chairman Assignment | `docs/specs/07-chairman-assignment/spec.md` | 📋 Planning |
| 08A | Nominal Realisasi Foundation | `docs/specs/08A-nominal-realisasi/spec.md` | ✅ Done |
| 08B | Penambahan Arsip (Kepala Sub Bagian Umum) | `docs/specs/08B-penambahan-arsip/spec.md` | 📋 Schema foundation added in Phase 12G |
| 08D | Export Excel & Agregasi | `docs/specs/08D-export-excel/spec.md` | 📋 Planning |
| 08E | Penanggung Jawab Kinerja (Role) | `docs/specs/08E-penanggung-jawab-kinerja/spec.md` | 📋 Planning |

---

## Estimasi Urutan Pengerjaan
```
01 → 01b → 02 → 03 → 04 → 05 → 06 → 07 → 08A → 08B → 08D → 08E
```
- 01: Fondasi (auth + RBAC)
- 02: Data master (fondasi data)
- 03: Submit Flow (mulai siklus dokumen)
- 04: Approval berjenjang (PPK → Bendahara)
- 05: Arsip Flow (tutup siklus)
- 06: User Management (admin + self-service)
- 07: Chairman Assignment (ketua tim per kegiatan)
- **08A: Fondasi nominal_realisasi (WAJIB selesai duluan)**
- 08B: Arsip manual oleh Kepala Sub Bagian Umum
- 08C: Dokumen Non-Material
- 08D: Export Excel + Agregasi
- 08E: Role Penanggung Jawab Kinerja

---

## Ringkasan Scope per Komponen

### 01 — Auth & RBAC Foundation
- Login / Logout Supabase Auth
- Role switcher dropdown ( kanan atas)
- Middleware SSR per route
- RLS policies
- Seed 5 role static

### 02 — Master Data Management
- CRUD master_fungsi (6 fungsi BPS)
- CRUD master_kegiatan (filterable per fungsi)
- CRUD master_kelengkapan_dokumen (per kegiatan × role)
- Seed data awal
- API read-only helpers

### 03 — Submit Flow (Pegawai)
- Form ajukan dokumen (5 step)
- Kelengkapan dinamis (kegiatan + Ketua Tim)
- Upload lampiran ke Supabase Storage
- Halaman "Dokumen Saya" + detail
- Resubmit jika PPK tolak

### 04 — Approval Flow (PPK → Bendahara)
- PPK Inbox (IN_PPK_VALIDATION)
- PPK Approve / Reject (catatan wajib)
- PPK Resubmit (jika Bendahara tolak)
- Bendahara Inbox (IN_BENDAHARA_APPROVAL)
- Bendahara Approve / Reject (catatan wajib)
- Audit trail log_aktivitas

### 05 — Arsip Flow (Kepala Sub Bagian Umum)
- Kepala Sub Bagian Umum Inbox (COMPLETED, belum diarsipkan)
- Kepala Sub Bagian Umum Archive (metadata: nomor surat, klasifikasi, retensi)
- Kepala Sub Bagian Umum Skip
- Pencarian arsip (semua user)
- Download arsip (semua user)

### 01b — FSM (Document Status Transitions)
- Shared infrastructure: `src/lib/fsm.ts` transition function
- Types: StatusDokumen, CurrentStep, RevisionTarget, FSMAction, TransitionResult
- 9 valid transitions (SUBMIT, APPROVE, REJECT, RESUBMIT, RESUBMIT_PPK, ARCHIVE, SKIP)
- Actor validation per action
- stepUrutan tracking untuk audit trail

### 06 — User Management
- Admin: Create user (email + password + nama_lengkap + nip_nrp + departemen + roles)
- Admin: Edit user metadata & roles
- Admin: Deactivate user (disable di Supabase Auth, roles tetap)
- Admin: Reactivate user
- Admin: Reset password
- User: Self-service change password
- User: View profile
- Master User page: real data dari auth.users + user_roles

### 07 — Chairman Assignment
- Tabel `ketua_tim_assignments` (user_id + kegiatan_id)
- Admin: Assign/remove user sebagai chairman per kegiatan
- Constraint: 1 kegiatan = 1 chairman
- Badge info di Ajukan Dokumen (Ketua Tim vs Anggota)
- Menu "Laporan Kegiatan" (hanya untuk user yang punya hak chairman)
- Halaman Detail User dengan activity history

### 08A — Nominal Realisasi Foundation
- Tambah kolom `nominal_realisasi` ke tabel `dokumen_transaksi` (DECIMAL)
- Tambah kolom `nominal_realisasi` ke tabel `arsip`
- Tambah kolom `is_non_material` ke tabel `dokumen_transaksi`
- Update API submit untuk validasi nominal WAJIB untuk Material
- Metadata dokumen workflow Material, termasuk `nominal_realisasi`, terkunci setelah status `COMPLETED`
- Fondasi untuk seluruh fitur 08B-08E

### 08B — Penambahan Arsip (Kepala Sub Bagian Umum)
- Phase 12G adds separate schema foundation: `arsip.manual_arsip_category`, `arsip.manual_arsip`, and `arsip.manual_arsip_attachment`
- Phase 12H adds minimal API foundation for category list, manual archive parent list, create without upload, and detail
- Manual archive is separate from workflow documents and does not depend on `dokumen_transaksi`
- Category is separate from `master_klasifikasi_arsip`; classification hierarchy remains in `master_klasifikasi_arsip`
- Initial UI form and optional attachment upload exist after Phase 12J.1/12J.2; Phase 12K.1 adds API-only authorized preview/download for attachments; UI buttons, lifecycle action route, aggregate report, and Excel export remain future work
- File attachment is optional; schema supports many attachments while later UI may start with one optional file
- Phase 12J.2a adds official attachment title column `manual_arsip_attachment.judul_lampiran`; existing rows are backfilled from `original_filename`, and Phase 12J.2b requires explicit upload API titles aligned with uploaded files
- `keterangan` is required; `nominal_realisasi` remains nullable in DB for compatibility, while create/edit API boundaries and create UI require a positive integer value greater than 0 after Phase 12J.2d/12L.1
- Phase 12L.1 adds API-only parent metadata edit for Manual Archive through `PATCH /api/arsiparis/manual-arsip/$id`, limited to `status_arsip='AKTIF'`; `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN` are locked for metadata edit
- Manual archive uses archive lifecycle values `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`; future file access must block `DIMUSNAHKAN`
- Phase 12L.2 adds the canonical archive parent schema foundation by extending `arsip.arsip` with `source_type: WORKFLOW | MANUAL` and transitional canonical metadata fields; it does not change runtime writes, migrate `manual_arsip` rows, delete old tables/files, or consolidate attachments
- Phase 12L.3 adds a transitional compatibility/report DTO mapper and report-first backfill plan only; it does not add UI integration, routes, lifecycle unification, runtime write changes, data backfill, table cleanup, or attachment consolidation
- Phase 12L.4 adds an internal read-only DB compatibility report reader only, and Phase 12L.5 adds human-reviewed remediation policy for report gaps only; neither phase adds UI/routes, mutates rows, creates migrations, aligns writes, performs backfill, or performs cleanup
- Phase 12L.7 aligns new workflow archive writes only: workflow archive creation now writes canonical `WORKFLOW` fields on `arsip.arsip`, derives `nama_arsip` from workflow document metadata, validates `klasifikasi_id`, derives classification snapshots server-side, and keeps Manual Archive unchanged
- Phase 12L.9 adds nullable Manual Archive source schema fields for future `nomor_surat`, `tanggal_diarsipkan`, retention labels/end dates, `klasifikasi_kode_snapshot`, `archived_by`, and `canonical_arsip_id`; it does not update Manual Archive API/UI, create canonical `MANUAL` rows, backfill rows, or change lifecycle/file behavior
- Phase 12L.10 updates Manual Archive create/edit API validation and server-side writes for required future-canonical metadata, server-calculated retention dates, and server-derived classification snapshots; it keeps UI, canonical `MANUAL` rows, backfill, lifecycle, attachments, migrations, and cleanup out of scope
- Phase 12L.11 updates `/arsiparis/penambahan-arsip` create UI to collect and submit the required Phase 12L.10 Manual Archive metadata; it keeps edit UI, APIs, canonical `MANUAL` rows, backfill, lifecycle, attachments, migrations, and cleanup out of scope
- Phase 12L.14 updates Manual Archive POST create runtime behavior so new source rows create a linked canonical `arsip.arsip` row with `source_type='MANUAL'` in the same DB transaction; PATCH/edit sync, existing-row backfill, lifecycle, attachment behavior, UI, migrations, and cleanup remain out of scope
- Phase 12L.15 updates Manual Archive PATCH/edit behavior for `AKTIF` linked rows so source metadata and the linked canonical `source_type='MANUAL'` row sync in one DB transaction; unlinked legacy rows remain source-only and no PATCH backfill/canonicalization is introduced
- Phase 12L.16 adds a docs-only, report-first remediation/backfill plan for existing Manual Archive rows without canonical `MANUAL` parents; it does not run a live report, mutate rows, create canonical rows, change APIs/UI/schema, touch attachments, or perform cleanup
- Phase 12L.17 adds an internal read-only Manual Archive remediation report helper with controlled bucket labels, safe DTO output, bounded select-only reader support, and mocked unit tests; it does not run a live report, mutate rows, create canonical rows, update source links, add API/UI/schema, touch attachments, or perform cleanup
- Phase 12L.18 adds an internal dependency-injected one-row canonicalization helper for explicitly human-approved rows that are still `READY_FOR_CANONICALIZATION` at execution time; it is not wired to routes, UI, CLI, scheduler, report readers, live reports, or automatic backfill
- Phase 12L.19 adds an internal dependency-injected one-row dry-run helper for human-approved Manual Archive rows; it returns safe preview metadata only, does not call the 12L.18 mutation helper, and does not insert, update, delete, transact, run live reports, or add routes/UI/CLI/scheduler behavior
- Phase 12M.1 adds an internal read-only unified archive query service for canonical `arsip.arsip` rows only; it excludes unlinked legacy `manual_arsip` rows, defers broad text search, and does not add routes/UI, mutate rows, backfill, cleanup, run live reports, or change attachment/file behavior
- Phase 12M.2 wires existing Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages to the unified canonical archive query service behind server-side `KEPALA_SUB_BAGIAN_UMUM` API authorization; it is read-only/list-only and keeps unified detail, lifecycle mutation, preview/download, search, export, cleanup, backfill, migrations, and route generation out of scope
- Phase 12M.3 defines a planning-only unified archive detail policy and recommends future canonical detail route `/arsiparis/arsip/$id`; it does not add routes/UI, route generation, preview/download actions, lifecycle changes, cleanup, backfill, migrations, schema changes, or source-link mutation
- Phase 12M.4 adds an internal dependency-injected read-only unified archive detail service for one canonical `arsip.arsip.id`; it returns safe common/source-specific metadata and controlled warnings, and keeps routes/UI, route generation, preview/download, attachment metadata display, lifecycle mutation, cleanup, backfill, migrations, schema changes, and source-link mutation out of scope
- Phase 12M.5 wires a read-only canonical detail API/page at `/api/arsiparis/arsip/$id` and `/arsiparis/arsip/$id` using the Phase 12M.4 detail service, and adds list `Detail` links by canonical `arsip.arsip.id`; it keeps attachment metadata display, preview/download, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, and source-link mutation out of scope
- Future aggregate/export is metadata-only by default and counts one `manual_arsip` parent row as one report regardless of attachment count
- **Depends on:** 08A (Nominal Realisasi)

### 08D — Export Excel & Agregasi
- Export arsip ke Excel per klasifikasi
- Agregasi: jumlah arsip + total nominal per klasifikasi
- Grand total semua klasifikasi
- Preview sebelum export
- Arsip manual (is_manual_entry) termasuk dalam agregasi

### 08E — Penanggung Jawab Kinerja (Role)
- Role baru: PENANGGUNG_JAWAB_KINERJA
- Menu tunggal: "Laporan Kinerja"
- Fondasi Phase 12E.1: halaman dan API metadata-only untuk dokumen final
- Status final yang masuk laporan: COMPLETED, TERSIMPAN, ARCHIVED
- Tidak ada preview/download/file URL/detail action/export pada fondasi ini
- ADMIN tetap dedicated dan tidak otomatis mewarisi PENANGGUNG_JAWAB_KINERJA
- Hierarki: Fungsi → Kegiatan → Detail Dokumen
- Agregasi nominal per Fungsi dan Kegiatan
- Filter: Fungsi, Kegiatan, Jenis, Detail, Tahun, Tanggal, Pengaju, Kategori
- Seluruh dokumen COMPLETED, termasuk Non-Material (dari 08C)
- **Depends on:** 08A (Nominal Realisasi)

---

## Catatan
- **08C Non-Material** → DONE (sudah diintegrasikan ke codebase, spec terpisah dihapus)
