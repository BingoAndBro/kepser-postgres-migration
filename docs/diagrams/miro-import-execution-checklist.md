# Miro Import Execution Checklist

## 1. Purpose

This checklist guides manual import of PlantUML diagrams into Miro using the Miro PlantUML app/editor.

- This is an execution checklist, not an automated import.
- The `.puml` files in the repository remain the source of truth.
- Miro is used for review, discussion, and visual iteration.
- PNG/SVG/PDF exports are not the editable master.

## 2. Pre-Import Requirements

- [ ] Repository is clean before manual import notes are changed.
- [ ] Miro board is created or selected.
- [ ] Miro PlantUML app/editor is available on the board.
- [ ] `docs/diagrams/miro-editable-import-handoff.md` has been read.
- [ ] `docs/diagrams/README.md` has been read.
- [ ] Diagram frames are prepared in Miro.
- [ ] Review convention is agreed: comments/sticky notes for feedback, source edits copied back to repo.

## 3. Recommended Miro Board Frames

- [ ] Frame 1: Overview
- [ ] Frame 2: Auth & RBAC
- [ ] Frame 3: Document Workflow
- [ ] Frame 4: Folder-First Archive
- [ ] Frame 5: Manual Document Source
- [ ] Frame 6: Admin & Master Configuration
- [ ] Frame 7: Penanggung Jawab Kinerja / Reporting
- [ ] Frame 8: Review Notes / Open Questions

For each frame:

- place imported PlantUML diagram objects;
- add sticky note with repo `.puml` path;
- use comments/sticky notes for review feedback.

## 4. Import Checklist - Overview

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 1: Overview | `docs/diagrams/domain/dms-domain-overview.puml` | `dms-domain-overview.puml` |  |  |  |
| [ ] | Frame 1: Overview | `docs/diagrams/use-cases/dms-overall-use-case.puml` | `dms-overall-use-case.puml` |  |  |  |

## 5. Import Checklist - Auth & RBAC

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 2: Auth & RBAC | `docs/diagrams/domain/auth-rbac-domain.puml` | `auth-rbac-domain.puml` |  |  |  |
| [ ] | Frame 2: Auth & RBAC | `docs/diagrams/sequences/login-session-role-switch-sequence.puml` | `login-session-role-switch-sequence.puml` |  |  |  |

## 6. Import Checklist - Document Workflow

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 3: Document Workflow | `docs/diagrams/use-cases/document-workflow-use-case.puml` | `document-workflow-use-case.puml` |  |  |  |
| [ ] | Frame 3: Document Workflow | `docs/diagrams/domain/document-workflow-domain.puml` | `document-workflow-domain.puml` |  |  |  |
| [ ] | Frame 3: Document Workflow | `docs/diagrams/sequences/pegawai-submit-material-sequence.puml` | `pegawai-submit-material-sequence.puml` |  |  |  |
| [ ] | Frame 3: Document Workflow | `docs/diagrams/sequences/ppk-validation-sequence.puml` | `ppk-validation-sequence.puml` |  |  |  |
| [ ] | Frame 3: Document Workflow | `docs/diagrams/sequences/ppspm-approval-sequence.puml` | `ppspm-approval-sequence.puml` |  |  |  |

## 7. Import Checklist - Folder-First Archive

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/use-cases/folder-first-archive-use-case.puml` | `folder-first-archive-use-case.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/domain/folder-first-archive-domain.puml` | `folder-first-archive-domain.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/sequences/workflow-classification-to-berkas-sequence.puml` | `workflow-classification-to-berkas-sequence.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml` | `manual-document-to-berkas-sequence.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/sequences/close-berkas-sequence.puml` | `close-berkas-sequence.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/sequences/archive-destruction-sequence.puml` | `archive-destruction-sequence.puml` |  |  |  |
| [ ] | Frame 4: Folder-First Archive | `docs/diagrams/sequences/destroyed-file-access-block-sequence.puml` | `destroyed-file-access-block-sequence.puml` |  |  |  |

## 8. Import Checklist - Manual Document Source

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 5: Manual Document Source | `docs/diagrams/domain/manual-archive-domain.puml` | `manual-archive-domain.puml` |  |  |  |
| [ ] | Frame 5: Manual Document Source | `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml` | `manual-document-to-berkas-sequence.puml` |  |  |  |

Note:

- This sequence also appears in Folder-First Archive. If imported once, cross-reference the same Miro object rather than duplicating unless needed for review clarity.

## 9. Import Checklist - Admin & Master Configuration

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 6: Admin & Master Configuration | `docs/diagrams/use-cases/admin-config-use-case.puml` | `admin-config-use-case.puml` |  |  |  |
| [ ] | Frame 6: Admin & Master Configuration | `docs/diagrams/domain/admin-master-config-domain.puml` | `admin-master-config-domain.puml` |  |  |  |
| [ ] | Frame 6: Admin & Master Configuration | `docs/diagrams/sequences/admin-reset-password-sequence.puml` | `admin-reset-password-sequence.puml` |  |  |  |

## 10. Import Checklist - Penanggung Jawab Kinerja / Reporting

| Status | Miro Frame | Source File | Miro Object/Frame Label | Import Result | Layout Notes | Needs Source Update? |
|---|---|---|---|---|---|---|
| [ ] | Frame 7: Penanggung Jawab Kinerja / Reporting | `docs/diagrams/use-cases/pj-kinerja-report-use-case.puml` | `pj-kinerja-report-use-case.puml` |  |  |  |

## 11. Per-Diagram Review Checklist

- [ ] Diagram imported through Miro PlantUML app/editor.
- [ ] Miro object/frame label matches source filename.
- [ ] Sticky note contains repository-relative `.puml` path.
- [ ] Diagram is readable at normal zoom.
- [ ] Diagram is not too dense for review.
- [ ] Actor labels are correct.
- [ ] No forbidden legacy archive runtime is modeled as active.
- [ ] No sensitive internals are visible.
- [ ] Any Miro-side source edits are copied back to repo before being considered final.

## 12. Modeling Rules to Check During Miro Review

- Use PPSPM as user-facing label.
- `BENDAHARA` may appear only as internal role/status where needed.
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

## 13. Feedback Capture Format

For each issue:

- Diagram source file:
- Miro frame:
- Issue type:
  - wording
  - layout
  - missing flow/entity
  - incorrect role/label
  - forbidden legacy concept
  - too much implementation detail
  - other
- Description:
- Proposed change:
- Should update `.puml` source?
  - yes/no
- Priority:
  - must fix before client review
  - nice to improve
  - presentation polish only

## 14. Sync-Back Trigger

D6D should happen:

- if Miro source edits were made;
- if review feedback requires PlantUML source changes;
- if Miro board and repo source differ;
- before rendering/exporting final diagrams.

Do not assume Miro-only edits update the repo. Sync-back should update only selected `.puml` files after review.

## 15. What This Phase Does Not Do

- Does not import diagrams into Miro automatically.
- Does not create a Miro board.
- Does not render diagrams.
- Does not create exports.
- Does not install tools.
- Does not modify `.puml` files.
- Does not modify app/runtime code.
- Does not validate visual layout inside Miro.

## 16. Recommended Next Phase

- D6B.2 - Manual Miro Import Execution Notes, if the user wants to record actual import results in repo.
- D6C - Miro Review Feedback Capture, after diagrams are imported and reviewed.
- D6D - Sync Miro Edits Back to PlantUML Source, if source edits are made in Miro.
- D7 - Render/Export Final Diagrams, only after editable Miro review is accepted.
