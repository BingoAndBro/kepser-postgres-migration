# DMS Diagrams

## 1. Purpose

This directory contains PlantUML source files for DMS documentation diagrams. These files document the current diagram source set and are intended to stay as editable source documentation.

Phase D1.1 persisted the diagram source audit handoff in `docs/diagrams/diagram-source-audit.md`. Phase D2 created use case diagrams, Phase D3 created sequence diagrams, and Phase D4 created domain/class diagrams. Phase D5 catalogs the diagram set and prepares future render/export work without rendering diagrams or creating exports.

## 2. Current Source Authority

Use these sources as the current authority for diagram review and future diagram work:

- `docs/diagrams/diagram-source-audit.md`
- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/fsm.ts`

`docs/migration/_archive/` is historical only and must not override current authority.

## 3. Diagram Directory Structure

```text
docs/diagrams/
- README.md
- diagram-source-audit.md
- use-cases/
- sequences/
- domain/
```

## 4. Use Case Diagrams

- `use-cases/dms-overall-use-case.puml` - Overall DMS actor and capability map.
- `use-cases/document-workflow-use-case.puml` - Pegawai, PPK, and PPSPM document workflow capabilities.
- `use-cases/folder-first-archive-use-case.puml` - Kepala Sub Bagian Umum folder-first archive, lifecycle, and file-access capabilities.
- `use-cases/admin-config-use-case.puml` - Admin Sistem user, password reset, and master configuration capabilities.
- `use-cases/pj-kinerja-report-use-case.puml` - Penanggung Jawab Kinerja metadata-only reporting capabilities.

## 5. Sequence Diagrams

- `sequences/login-session-role-switch-sequence.puml` - Login, `dms_session`, assigned-role validation, and role switching.
- `sequences/pegawai-submit-material-sequence.puml` - Pegawai material document submission flow.
- `sequences/ppk-validation-sequence.puml` - PPK validation, approval, rejection, and revision routing.
- `sequences/ppspm-approval-sequence.puml` - PPSPM approval, rejection, and completion routing.
- `sequences/workflow-classification-to-berkas-sequence.puml` - Completed workflow document classification into an open folder-first berkas.
- `sequences/manual-document-to-berkas-sequence.puml` - Manual document creation and attachment into an open folder-first berkas.
- `sequences/close-berkas-sequence.puml` - Folder closing and initial active archive status assignment.
- `sequences/archive-destruction-sequence.puml` - Folder-first lifecycle movement through destruction approval.
- `sequences/destroyed-file-access-block-sequence.puml` - Authorized destroyed-file access blocking behavior.
- `sequences/admin-reset-password-sequence.puml` - Admin Sistem password reset and server-authoritative session revocation.

## 6. Domain/Class Diagrams

- `domain/auth-rbac-domain.puml` - Auth, user, role, session, and RBAC domain model.
- `domain/document-workflow-domain.puml` - Document workflow statuses, actors, and activity log model.
- `domain/folder-first-archive-domain.puml` - Folder-first archive parent, item, lifecycle, and classification model.
- `domain/manual-archive-domain.puml` - Manual archive source data and attachment model.
- `domain/admin-master-config-domain.puml` - Admin Sistem and master configuration support model.
- `domain/dms-domain-overview.puml` - High-level cross-domain DMS model overview.

## 7. Modeling Rules

- Use PPSPM as the user-facing label; `BENDAHARA` may appear only as an internal role/status where needed.
- Use Kepala Sub Bagian Umum, not Arsiparis/Kasubag.
- `ADMIN` is Admin Sistem and not an operational substitute.
- Folder-first archive is active authority.
- Removed legacy archive runtime must not be modeled as active.
- Reporting/Penanggung Jawab Kinerja is metadata-only and has no file access.
- Destroyed-file message must remain exactly:

```text
Data file sudah dimusnahkan
```

- Correct Supabase wording:

```text
Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.
```

## 8. Render / Export Guidance

- Do not render diagrams in Phase D5.
- PlantUML source files can later be rendered to SVG/PNG/PDF if explicitly requested.
- Render/export outputs should be generated in a separate explicit phase.
- Rendering should not modify application code, package files, routeTree, schema, env, auth, storage, or archive lifecycle files.
- If importing into draw.io/Miro, treat generated assets as derived documentation, not source authority.
- PlantUML `.puml` files remain the editable source of truth for diagrams.
- Do not add new tool dependencies as part of this catalog.

## 9. Safety / Sensitive Information Rules

- Diagrams must not expose secrets, env values, DB URL, tokens, cookies, sessions, password hashes, storage root, physical paths, logical paths, raw SQL rows, credentials, or machine-specific local paths.
- Diagrams should use domain-level participants/classes, not sensitive implementation internals.

## 10. Phase Status

Completed:

- D1
- D1.1
- D2
- D3
- D4
- D5

Not done:

- Rendering/export validation
- Visual layout QA after render
- Any application/runtime changes
