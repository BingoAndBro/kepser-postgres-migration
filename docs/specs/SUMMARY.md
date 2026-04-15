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
`PEGAWAI` | `PPK` | `BENDAHARA` | `ARSIPARIS` | `ADMIN`

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
| 05 | Arsip Flow (Arsiparis) | `docs/specs/05-arsip-flow/spec.md` | ✅ Done |
| 06 | User Management | `docs/specs/06-user-management/spec.md` | 🔄 Draft |
| 01b | FSM — Document Status Transitions | `docs/specs/01b-fsm/spec.md` | ✅ Done |

---

## Estimasi Urutan Pengerjaan
```
01 → 01b → 02 → 03 → 04 → 05 → 06
```
- 01: Fondasi (auth + RBAC)
- 02: Data master (fondasi data)
- 03: Submit Flow (mulai siklus dokumen)
- 04: Approval berjenjang (PPK → Bendahara)
- 05: Arsip Flow (tutup siklus)

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

### 05 — Arsip Flow (Arsiparis)
- Arsiparis Inbox (COMPLETED, belum diarsipkan)
- Arsiparis Archive (metadata: nomor surat, klasifikasi, retensi)
- Arsiparis Skip
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
