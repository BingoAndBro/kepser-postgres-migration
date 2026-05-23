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
- Initial UI form and optional attachment upload exist after Phase 12J.1/12J.2; preview/download, lifecycle action route, aggregate report, and Excel export remain future work
- File attachment is optional; schema supports many attachments while later UI may start with one optional file
- Phase 12J.2a adds official attachment title column `manual_arsip_attachment.judul_lampiran`; existing rows are backfilled from `original_filename`, and Phase 12J.2b requires explicit upload API titles aligned with uploaded files
- `keterangan` is required; `nominal_realisasi` remains nullable in DB for compatibility, while create API/UI require a positive integer value greater than 0 after Phase 12J.2d
- Manual archive uses archive lifecycle values `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`; future file access must block `DIMUSNAHKAN`
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
