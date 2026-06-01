# Miro Editable Import Handoff

## 1. Purpose

This document describes how to use the existing PlantUML diagram sources in Miro while preserving editability and repository source control.

- The preferred path is the Miro PlantUML app/editor.
- The editable master remains the `.puml` source in the repository.
- Miro can be used for review, discussion, and visual iteration.
- PNG/SVG/PDF exports are not the editable master.

## 2. Current Diagram Source Set

Use case diagrams:

- `docs/diagrams/use-cases/dms-overall-use-case.puml`
- `docs/diagrams/use-cases/document-workflow-use-case.puml`
- `docs/diagrams/use-cases/folder-first-archive-use-case.puml`
- `docs/diagrams/use-cases/admin-config-use-case.puml`
- `docs/diagrams/use-cases/pj-kinerja-report-use-case.puml`

Sequence diagrams:

- `docs/diagrams/sequences/login-session-role-switch-sequence.puml`
- `docs/diagrams/sequences/pegawai-submit-material-sequence.puml`
- `docs/diagrams/sequences/ppk-validation-sequence.puml`
- `docs/diagrams/sequences/ppspm-approval-sequence.puml`
- `docs/diagrams/sequences/workflow-classification-to-berkas-sequence.puml`
- `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml`
- `docs/diagrams/sequences/close-berkas-sequence.puml`
- `docs/diagrams/sequences/archive-destruction-sequence.puml`
- `docs/diagrams/sequences/destroyed-file-access-block-sequence.puml`
- `docs/diagrams/sequences/admin-reset-password-sequence.puml`

Domain/class diagrams:

- `docs/diagrams/domain/auth-rbac-domain.puml`
- `docs/diagrams/domain/document-workflow-domain.puml`
- `docs/diagrams/domain/folder-first-archive-domain.puml`
- `docs/diagrams/domain/manual-archive-domain.puml`
- `docs/diagrams/domain/admin-master-config-domain.puml`
- `docs/diagrams/domain/dms-domain-overview.puml`

## 3. Recommended Miro Workflow

1. Open the target Miro board.
2. Add or open the Miro PlantUML app/editor.
3. Open one `.puml` file from the repository.
4. Copy the full PlantUML source from `@startuml` through `@enduml`.
5. Paste it into the Miro PlantUML editor.
6. Generate/update the diagram in Miro.
7. Name or label the Miro object/frame according to the source filename.
8. Repeat for each diagram.
9. Use Miro comments/sticky notes for review feedback.
10. If editing the diagram source in Miro, copy the updated PlantUML source back to the matching `.puml` file in the repo before considering the repo updated.

Important:

- Editing in Miro is code/source-based through PlantUML, not guaranteed to be native drag-and-drop editing of each diagram element.
- Do not treat uploaded PNG/SVG/PDF as the editable master.

## 4. Suggested Import Order

1. Overview and catalog:
   - `docs/diagrams/domain/dms-domain-overview.puml`
   - `docs/diagrams/use-cases/dms-overall-use-case.puml`

2. Auth and access:
   - `docs/diagrams/domain/auth-rbac-domain.puml`
   - `docs/diagrams/sequences/login-session-role-switch-sequence.puml`

3. Document workflow:
   - `docs/diagrams/use-cases/document-workflow-use-case.puml`
   - `docs/diagrams/domain/document-workflow-domain.puml`
   - `docs/diagrams/sequences/pegawai-submit-material-sequence.puml`
   - `docs/diagrams/sequences/ppk-validation-sequence.puml`
   - `docs/diagrams/sequences/ppspm-approval-sequence.puml`

4. Folder-first archive:
   - `docs/diagrams/use-cases/folder-first-archive-use-case.puml`
   - `docs/diagrams/domain/folder-first-archive-domain.puml`
   - `docs/diagrams/sequences/workflow-classification-to-berkas-sequence.puml`
   - `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml`
   - `docs/diagrams/sequences/close-berkas-sequence.puml`
   - `docs/diagrams/sequences/archive-destruction-sequence.puml`
   - `docs/diagrams/sequences/destroyed-file-access-block-sequence.puml`

5. Manual document source:
   - `docs/diagrams/domain/manual-archive-domain.puml`
   - `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml`

6. Admin/config:
   - `docs/diagrams/use-cases/admin-config-use-case.puml`
   - `docs/diagrams/domain/admin-master-config-domain.puml`
   - `docs/diagrams/sequences/admin-reset-password-sequence.puml`

7. Reporting:
   - `docs/diagrams/use-cases/pj-kinerja-report-use-case.puml`

## 5. Miro Board Organization Recommendation

Recommended board layout:

- Frame 1: Overview
- Frame 2: Auth & RBAC
- Frame 3: Document Workflow
- Frame 4: Folder-First Archive
- Frame 5: Admin & Master Configuration
- Frame 6: Penanggung Jawab Kinerja / Reporting
- Frame 7: Review Notes / Open Questions

For each frame:

- Place the PlantUML diagram object.
- Add a small sticky note with the repository path of the `.puml` source.
- Add review notes as Miro comments or sticky notes, not by changing the source unless intended.

## 6. Editability Rules

- Preferred edits should happen in `.puml` files in the repo, then re-import/update in Miro.
- If edits happen first in Miro, copy the edited PlantUML source back into the matching repo `.puml` file.
- Do not make Miro-only source edits and assume the repository is updated.
- Do not use PNG/SVG/PDF exports as the editable master.
- Manual visual polish in Miro is acceptable, but it must be treated as presentation-layer work unless copied back to PlantUML source.
- If diagrams are recreated as native Miro shapes, the native Miro version becomes a separate presentation artifact, not the repo source of truth.

## 7. Source-of-Truth Policy

- Repository `.puml` files are source of truth.
- Miro board is review/presentation workspace.
- Derived exports are not source of truth.
- If Miro and repo differ, repo wins unless a deliberate sync-back phase updates `.puml` files.

## 8. Sync-Back Checklist

Use this checklist when a diagram is edited in Miro and the repository should be updated:

- [ ] Identify which Miro diagram was edited.
- [ ] Confirm the matching repo `.puml` file path.
- [ ] Copy updated PlantUML source from Miro.
- [ ] Replace the corresponding `.puml` file content.
- [ ] Run `git diff --check`.
- [ ] Review diff for:
  - no machine-specific paths
  - no secrets/sensitive internals
  - no forbidden legacy active modeling
  - no wrong role labels
  - destroyed-file message remains exact where relevant
- [ ] Commit only the edited `.puml` files after review.

## 9. Modeling Rules to Preserve During Miro Edits

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

## 10. Safety Rules

- Do not expose secrets, env values, DB URL, tokens, cookies, sessions, password hashes, storage root, physical paths, logical paths, raw SQL rows, credentials, or machine-specific local paths.
- Avoid low-level implementation internals in public/client review boards.
- Keep diagrams at domain/workflow/documentation level.

## 11. What This Phase Does Not Do

- Does not render diagrams.
- Does not create exports.
- Does not install tools.
- Does not modify `.puml` diagram source files.
- Does not modify app/runtime code.
- Does not import anything into Miro automatically.
- Does not create a Miro board.
- Does not validate visual layout inside Miro.

## 12. Recommended Next Phases

- D6B - Manual Miro Import Checklist Execution: user imports diagrams into Miro using the handoff, no repo changes unless documenting results.
- D6C - Miro Review Feedback Capture: document review notes from Miro and decide which changes should update `.puml` source.
- D6D - Sync Miro Edits Back to PlantUML Source: update selected `.puml` files from edited Miro PlantUML source after review.
- D7 - Render/Export Final Diagrams: only after editable Miro review is done and final source is accepted.
