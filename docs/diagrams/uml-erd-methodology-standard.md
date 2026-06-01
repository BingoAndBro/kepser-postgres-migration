# UML & ERD Methodology Standard

## 1. Purpose

This document defines the project-specific diagram methodology standard before further DMS diagram revision, missing diagram generation, Miro MCP work, or native Miro shape work.

This is a methodology standard, not a diagram output phase. It does not create, render, revise, or export diagrams.

This document does not replace current DMS domain authority. It combines methodology guidance from the external textbook reference with current DMS project constraints, role labels, security boundaries, and folder-first archive authority.

## 2. Reference Basis

Methodology reference:

- Dennis, Wixom, and Tegarden, Systems Analysis & Design: An Object-Oriented Approach with UML, 5th ed.
- Chapter 4: use cases, activity diagrams, use-case descriptions, and functional model verification.
- Chapter 5: structural modeling, class diagrams, relationships, simplification, and structural model verification.
- Chapter 6: behavioral modeling, sequence diagrams, messages, interactions, and behavioral model verification.
- Chapter 9: object persistence, relational database mapping, RDBMS design tradeoffs, and data management layer verification.

Project authority:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/diagrams/diagram-source-audit.md`
- `docs/diagrams/README.md`
- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/fsm.ts`

Archived migration docs under `docs/migration/_archive/**` are historical only. They must not override current authority, especially for Supabase status, removed archive runtime, removed routes, and folder-first archive behavior.

## 3. Diagram Set Required for This DMS Documentation

Already created:

- Use case diagrams
- Sequence diagrams
- Class/domain diagrams

Still needed:

- Activity diagrams
- ERD diagrams
- Use-case descriptions for selected major use cases, if formal documentation needs more detail than a diagram can carry

Recommended activity diagrams:

- Activity Workflow Dokumen Material
- Activity Workflow Dokumen Non-Material
- Activity Pengklasifikasian Dokumen ke Berkas
- Activity Penambahan Dokumen Manual
- Activity Tutup Berkas
- Activity Musnahkan Data
- Activity Admin Reset Password, optional
- Activity Laporan Kinerja Metadata, optional

Recommended ERD diagrams:

- ERD Overview
- ERD Auth & RBAC
- ERD Workflow Dokumen
- ERD Folder-First Archive
- ERD Manual Document Source
- ERD Admin/Master Config

## 4. Use Case Diagram Standard

Use case diagrams model actor goals and system functions. They should not model UI clicks, database operations, implementation helpers, storage mechanics, or low-level API calls.

Practical rules:

- Actors stay outside the system boundary.
- Use cases stay inside the system boundary.
- Actor names must match user-facing DMS terminology.
- Use one main overall use case diagram for the whole project.
- Use smaller module-level use case diagrams when the overall diagram becomes too dense.
- Use case names should be short verb-object phrases.
- Avoid technical implementation terms as use case names.
- Use include/extend only when it improves clarity; do not use it as decoration.
- Avoid crossing lines where possible.
- Do not make `ADMIN` a super-actor.

DMS-specific use case structure:

- Main use case diagram: `dms-overall-use-case`
- Module use case diagrams: workflow, archive, admin, and PJ Kinerja
- Use PPSPM as the user-facing label, not Bendahara.
- Use Kepala Sub Bagian Umum as the user-facing label, not Arsiparis or Kasubag.
- Penanggung Jawab Kinerja use cases are metadata-only and must not include file access.
- Admin Sistem has system administration and configuration use cases only. Admin Sistem is not an operational substitute for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, or Penanggung Jawab Kinerja.

## 5. Use-Case Description Standard

Use-case descriptions should be used for major use cases that need detail beyond a diagram. They are useful before activity diagrams and sequence diagrams because they document actors, triggers, flow steps, alternatives, exceptions, and business rules in a reviewable form.

Recommended DMS use cases needing descriptions:

- Ajukan Dokumen Material
- Simpan Dokumen Non-Material
- Validasi Dokumen oleh PPK
- Persetujuan Dokumen oleh PPSPM
- Pengklasifikasian Dokumen Selesai
- Penambahan Dokumen Manual
- Tutup Berkas
- Musnahkan Data
- Reset Password User oleh Admin
- Lihat Laporan Kinerja Metadata

This phase does not create actual use-case descriptions. It only standardizes the reusable template.

Template:

```text
Use Case Name:
Primary Actor:
Supporting Actors:
Trigger:
Preconditions:
Normal Flow:
Alternate/Exception Flows:
Postconditions:
Business Rules:
Notes:
```

Guidance:

- Keep each normal-flow step action-oriented.
- Tie each description to one primary actor goal.
- Document meaningful alternate and exception flows instead of hiding them in notes.
- Keep business rules separate from step-by-step flow when doing so improves review clarity.
- Use descriptions to validate activity diagrams, sequence diagrams, and class/domain candidates.

## 6. Activity Diagram Standard

Activity diagrams model workflow and process logic. They are best for business processes, decision points, parallel activities, and handoffs between roles or services.

Practical rules:

- Use one initial node.
- Use action nodes for work performed by a role or system.
- Use decision and merge nodes for branches.
- Use fork and join nodes only when real parallel activity matters.
- Use one final node for the normal process end unless a more specific ending is needed.
- Use swimlanes/partitions when multiple actors, roles, or services participate.
- Keep actions short and action-oriented.
- Decision guards must be clear and mutually understandable to reviewers.
- Do not include low-level code, database, storage, or route implementation details.

DMS swimlanes may include:

- Pegawai
- PPK
- PPSPM
- Kepala Sub Bagian Umum
- Admin Sistem
- Penanggung Jawab Kinerja
- System/API

Recommended DMS activity diagrams:

- Material workflow from Pegawai submit to `COMPLETED` or `NEED_REVISION` branches.
- Non-Material workflow from submit to `TERSIMPAN`.
- Folder-first classification.
- Manual document addition.
- Berkas closure.
- Archive destruction.
- Admin reset password.
- PJ Kinerja reporting, optional and high-level only.

## 7. Class / Domain Diagram Standard

Class/domain diagrams model important concepts, conceptual attributes, and relationships. They are not ERDs and should not mirror every database table or every column.

Practical rules:

- Use class names aligned with domain language.
- Include conceptual attributes only when helpful.
- Show multiplicities where relationships matter.
- Use composition, aggregation, and association carefully and only when the relationship meaning is clear.
- Separate a domain overview from detailed domain diagrams.
- Avoid sensitive attributes.
- Avoid implementation-only helper classes unless they are necessary to explain the domain.
- Keep class/domain diagrams aligned with use cases, activity diagrams, and sequence scenarios.

DMS class/domain diagrams may include:

- `User`, `Role`, `UserRole`, `Session`
- `DokumenTransaksi`, `LogAktivitas`, `LampiranMetadata`
- `BerkasArsip`, `BerkasArsipItem`, `MasterKlasifikasiArsip`
- `ManualArsip`, `ManualArsipAttachment`
- `MasterFungsi`, `MasterKegiatan`, `MasterKelengkapanDokumen`, `KetuaTimAssignment`

Do not model removed legacy archive runtime as active:

- `arsip.arsip`
- `arsip_usul_musnah`
- `lampiran_snapshot`
- `canonical_arsip_id`

## 8. Sequence Diagram Standard

Sequence diagrams model interactions over time among actors, UI surfaces, APIs, services, and domain-level participants. They should be used for important scenario flows, not every possible UI action.

Practical rules:

- Keep each sequence focused on one scenario.
- Participants should be domain-level and reviewable, not overly low-level.
- Put the initiating actor or participant toward the left.
- Messages should be meaningful business or system actions.
- Use top-to-bottom order to show time.
- Use alt/opt blocks for branches and optional steps.
- Show return messages only when they add clarity.
- Avoid exposing secrets, token internals, storage internals, or sensitive values.

DMS-specific guidance:

- The existing D3 sequence set is appropriate as scenario-level documentation.
- Before Miro/native redraw, review whether any sequence is too implementation-heavy.
- Keep PPSPM as the user-facing approval actor label.
- Model destroyed-file access blocking with the exact safe message:

```text
Data file sudah dimusnahkan
```

## 9. ERD / Relational Data Model Standard

An ERD is different from a class/domain diagram. A class/domain diagram models conceptual domain objects and relationships. An ERD models relational database tables, primary keys, foreign keys, cardinalities, and important constraints.

Practical rules:

- Generate ERD content from active schema authority, not historical docs.
- Use repository schema as the source: `src/db/schema/**`.
- Show table relationships and cardinalities clearly.
- Show important constraints when they are needed to understand data integrity.
- Split ERDs by domain when an overview becomes too dense.
- Do not include sensitive field values.
- Sensitive columns may be omitted, generalized, or marked as internal-only if necessary.

DMS-specific ERD rules:

- Include active folder-first archive tables.
- Exclude removed legacy archive runtime.
- Do not expose password hashes, session tokens, storage paths, or secrets.
- ERD diagrams should be split by domain when too dense: Auth/RBAC, Workflow, Folder-First Archive, Manual Document Source, Admin/Master Config, and Overview.

Relational modeling guidance for DMS:

- Map persistent domain concepts to tables only from active Drizzle schema.
- Represent one-to-many and many-to-many relationships through foreign keys and join/association tables.
- Treat many-valued attributes and repeating groups as separate related tables where the active schema does so.
- Keep the ERD focused on database structure, not runtime service behavior.

## 10. Activity Diagram and ERD Gap Acknowledgment

Current repo has no activity diagram sources yet.

Current repo has no ERD diagram sources yet.

These are known documentation gaps. They should be addressed after this methodology standard in separate bounded phases.

## 11. Current D2/D3/D4 Diagram Quality Review Criteria

Use this checklist to evaluate existing diagrams before revision or Miro-native redraw:

- Correct actor labels.
- Correct system boundary.
- No `ADMIN` super-actor.
- No legacy archive active authority.
- No over-dense overall diagram.
- No wrong Supabase claim.
- No sensitive internals.
- Correct destroyed-file message.
- Correct material/non-material workflow.
- Correct folder-first lifecycle.
- Clear enough for Miro/client review.

DMS-specific checks:

- PPSPM is used as the user-facing label.
- Kepala Sub Bagian Umum is used as the user-facing label.
- Admin Sistem is limited to administration/configuration.
- Penanggung Jawab Kinerja remains metadata-only.
- Correct Supabase wording is: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."
- Removed archive surfaces such as `/arsiparis/aktif`, `/arsiparis/search`, `/arsiparis/arsip/$id`, and global/sidebar `Cari Arsip` are not modeled as active.

## 12. Miro / Native Shape Implications

PlantUML is source-controlled and reproducible, but its layout may be rigid. Native Miro shapes are easier to visually edit, review, and arrange, but they can drift from repository source.

If Miro MCP or native Miro shapes are used later, diagrams must be created from this standard and current project authority, not from visual preference alone.

Miro-native diagrams should preserve UML and ERD semantics:

- Actors outside the use case system boundary.
- Use cases inside the system boundary.
- Sequence lifelines ordered logically.
- Class/domain multiplicities retained where needed.
- Activity swimlanes and decision guards retained.
- ERD cardinalities retained.

If a Miro-native version diverges from repository source, the divergence must be documented and either synchronized back in a scoped phase or treated as presentation-only.

## 13. Recommended Next Phases

- D6F - Current Diagram Gap Review Against UML & ERD Standard: review D2/D3/D4 `.puml` files and identify needed revisions.
- D6G - Activity Diagram Source Generation: create PlantUML activity diagrams for core workflows.
- D6H - ERD Source Generation: create ERD diagram sources from active Drizzle schema.
- D6I - Miro Native Shape Style Guide: define how diagrams should look in Miro if using manual/MCP native shapes.
- D6J - Miro MCP Feasibility Test: run only after methodology and style guide are ready.

## 14. Safety Rules

- Do not expose secrets, env values, DB URL, tokens, cookies, sessions, password hashes, storage root, physical paths, logical paths, raw SQL rows, credentials, or machine-specific local paths.
- Do not include the external PDF path.
- Do not include long copyrighted text.
- Do not model removed legacy archive runtime as active.
- Do not use historical docs as current authority.
- Do not claim Supabase is fully removed from repository.
- Preserve the correct Supabase wording: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."
- Preserve `dms_session` as the auth boundary.
- Treat `dms_active_role` as UX-only state.
- Treat server/API RBAC as authoritative.
- Keep `ADMIN` dedicated to Admin Sistem.

## 15. Phase D6E Output

This phase creates only `docs/diagrams/uml-erd-methodology-standard.md`.

It does not create or revise diagrams. It does not create activity diagram sources, ERD sources, `.puml` revisions, `.mmd` files, `.drawio` files, rendered exports, Miro artifacts, application code, tests, schema changes, package changes, route generation, migrations, seeds, commits, or pushes.

It prepares:

- D6F - Current Diagram Gap Review Against UML & ERD Standard
- D6G - Activity Diagram Source Generation
- D6H - ERD Source Generation
