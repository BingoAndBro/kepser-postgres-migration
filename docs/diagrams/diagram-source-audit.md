# DMS Diagram Source Audit Handoff

## 1. Purpose

This document persists the Phase D1 diagram source audit findings as the source handoff for future PlantUML diagram generation phases:

- D2 - Use Case Diagram PlantUML
- D3 - Sequence Diagram PlantUML
- D4 - Domain/Class Diagram PlantUML

Phase D1.1 is documentation-only. It does not generate diagrams and does not change application runtime behavior.

## 2. Current Authority Sources

Use these current authority sources before creating D2/D3/D4 diagrams:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/fsm.ts`

Source areas that may be useful for targeted verification:

- `src/lib/auth/*`
- `src/routes/api/auth/*`
- `src/lib/storage/*`
- `src/lib/archive/*`
- `src/routes/api/*`
- `src/db/schema/*`

`docs/migration/_archive/` may contain historical references, older Supabase wording, legacy canonical archive assumptions, or removed route/API designs. Archived docs are traceability only and must not override current authority.

## 3. Diagram Actors

Primary diagram actors:

- Pegawai
- PPK
- PPSPM
- Kepala Sub Bagian Umum
- Penanggung Jawab Kinerja
- Admin Sistem

Role modeling rules:

- Canonical internal roles are `PEGAWAI`, `PPK`, `BENDAHARA`, `KEPALA_SUB_BAGIAN_UMUM`, `PENANGGUNG_JAWAB_KINERJA`, and `ADMIN`.
- `BENDAHARA` remains an internal role constant where applicable.
- User-facing diagrams should display `BENDAHARA` as `PPSPM`.
- `ADMIN` is dedicated Admin Sistem only. Do not model Admin Sistem as a super-actor or operational substitute for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, or Penanggung Jawab Kinerja.

## 4. Auth, Session, and RBAC Rules

- `dms_session` is the authentication boundary.
- `dms_session` is an opaque `HttpOnly` cookie backed by hashed session-token storage.
- `dms_active_role` is UX-only state and is not authorization proof.
- Server/API RBAC is authoritative.
- Role switch validates the user's assigned roles before setting `dms_active_role`.
- Client-side role hiding is only a UX hint.
- `ADMIN` must remain dedicated to system administration and must not be broadened into operational workflow/archive/report permissions.

## 5. Domain Entity Candidates

Auth:

- `User`
- `Role`
- `UserRole`
- `Session`

Document Workflow:

- `DokumenTransaksi`
- `LogAktivitas`

Folder-First Archive:

- `BerkasArsip`
- `BerkasArsipItem`
- `MasterKlasifikasiArsip`

Manual Archive Source:

- `ManualArsip`
- `ManualArsipAttachment`
- `ManualArsipCategory`, optional if still relevant to the target diagram

Master/Config Support:

- `MasterFungsi`
- `MasterKegiatan`
- `MasterJenisDokumen`
- `MasterJenisPermintaan`
- `MasterKategoriPermintaan`
- `MasterDetailPermintaan`
- `MasterKelengkapanDokumen`
- `KetuaTimAssignment`, if needed for reporting/assignment diagrams

Do not model these removed legacy entities as active classes:

- `arsip.arsip`
- `arsip_usul_musnah`
- `lampiran_snapshot`
- `canonical_arsip_id`

## 6. Workflow and Lifecycle Summary

Canonical document statuses are defined in `src/lib/constants/document-status.ts`. Document transition authority is `src/lib/fsm.ts`.

Material workflow:

```text
DRAFT -> IN_PPK_VALIDATION -> IN_BENDAHARA_APPROVAL -> COMPLETED
```

Revision branches:

```text
IN_PPK_VALIDATION -> NEED_REVISION -> IN_PPK_VALIDATION
IN_BENDAHARA_APPROVAL -> NEED_REVISION -> IN_BENDAHARA_APPROVAL
```

Non-material submit can result in:

```text
DRAFT -> TERSIMPAN
```

Folder-first archive lifecycle:

```text
OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN
```

`DIMUSNAHKAN` preserves metadata and blocks preview/download/file access. The safe destroyed-file message is exactly:

```text
Data file sudah dimusnahkan
```

## 7. Active Route/API Areas for Sequence Diagrams

Auth/session:

- `/api/auth/*`

Pegawai submit/revise/detail/files:

- `/api/dokumen*`
- `/api/pegawai/revisi`

PPK validation/reject/resubmit:

- `/api/ppk/*`

PPSPM approval/reject:

- `/api/bendahara/*`

Archive classification/manual/berkas lifecycle:

- `/api/arsiparis/dokumen/$id/archive`
- `/api/arsiparis/manual-arsip/*`
- `/api/arsiparis/berkas/**`

Admin users/master/reset:

- `/api/users/*`
- `/api/master-*`
- `/api/ketua-tim/*`

Penanggung Jawab Kinerja metadata report:

- `/api/laporan/kinerja`

## 8. File and Attachment Access Notes

- Preview/download flows issue internal file-access URLs rather than exposing direct storage paths.
- Authorization and current document/archive state must be revalidated before serving files.
- Folder-first item file access must revalidate current `berkas_arsip` status and `berkas_arsip_item` membership.
- `DIMUSNAHKAN` blocks preview/download/file access, including stale token/path access.
- Authorized destroyed-file failures must use the exact safe message `Data file sudah dimusnahkan`.
- `approve_destruction` / `Musnahkan Data` moves the folder-first berkas to `DIMUSNAHKAN`, invokes folder-first physical deletion, preserves metadata/logical references, and keeps file access blocked.
- File-access diagrams must not expose logical paths, physical paths, storage roots, tokens, signed-token internals, cookies, sessions, SQL details, env values, raw rows, or secrets.

## 9. Use Case Groups by Actor

Pegawai:

- login/logout
- switch role if multi-role
- submit material/non-material
- revise/resubmit
- view status/history
- preview/download authorized attachments

PPK:

- validation inbox
- approve to PPSPM
- reject to Pegawai
- handle PPK revision/resubmit
- preview/download

PPSPM:

- approval inbox
- approve to completed
- reject to PPK
- preview/download

Kepala Sub Bagian Umum:

- classify completed workflow documents into berkas
- add manual documents
- view open/active/inactive/usul musnah folders
- close berkas
- lifecycle transitions
- Musnahkan Data
- CSV export
- preview/download unless destroyed

Penanggung Jawab Kinerja:

- metadata-only final-document report
- no file access

Admin Sistem:

- manage users
- reset passwords
- manage master data and kelengkapan
- no workflow/archive substitution

## 10. Recommended PlantUML Backlog

D2 use case diagrams:

- overall DMS use case
- workflow use case
- folder-first archive use case
- admin/config use case
- PJ Kinerja report use case

D3 sequence diagrams:

- login/session/role switch
- Pegawai submit
- PPK validation
- PPSPM approval
- workflow classification
- manual document to berkas
- close berkas
- lifecycle to `DIMUSNAHKAN`
- destroyed-file block
- admin reset password

D4 domain/class diagrams:

- auth/RBAC domain
- document workflow domain
- folder-first archive domain
- manual archive/attachment domain
- admin/master configuration domain

## 11. Known Risks and Modeling Warnings

- Some UI components may still contain older generic status names like `IN_REVIEW`; canonical status constants and `src/lib/fsm.ts` are authority.
- Some comments/docs may mention Supabase as historical residue.
- Use correct Supabase wording: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."
- Do not claim Supabase is fully removed from the repository.
- Do not model removed legacy archive runtime as active.
- Do not model `arsip.arsip`, `lampiran_snapshot`, or `canonical_arsip_id` as active archive authority.
- Do not let `ADMIN` become a super-actor in operational diagrams.
- Do not restore or model removed archive surfaces as active, including `/arsiparis/aktif`, `/arsiparis/search`, `/arsiparis/arsip/$id`, legacy `/api/arsiparis/arsip/*`, or global/sidebar `Cari Arsip`.

## 12. Phase D1.1 Output

- This phase creates only `docs/diagrams/diagram-source-audit.md`.
- It does not generate diagrams.
- It prepares D2/D3/D4.
