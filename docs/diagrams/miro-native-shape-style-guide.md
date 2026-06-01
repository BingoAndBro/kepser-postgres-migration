# Miro Native Shape Style Guide

## 1. Purpose

This document defines visual and semantic rules for building editable native Miro diagram versions of the DMS PlantUML sources. It is intended for future manual redraw work or future MCP-based Miro shape generation while preserving UML, ERD, security, workflow, and DMS domain semantics.

This phase does not create Miro shapes.

This phase does not use Miro MCP.

This guide prepares future manual or MCP-based Miro redraw. The repository `.puml` files remain source documentation. Miro native shapes are editable presentation and review artifacts unless a later scoped phase explicitly synchronizes reviewed changes back to source.

## 2. Source Authority

Use these sources as current authority for native Miro redraw:

- `docs/diagrams/uml-erd-methodology-standard.md`
- `docs/diagrams/current-diagram-gap-review.md`
- `docs/diagrams/diagram-source-audit.md`
- `docs/diagrams/README.md`
- `docs/diagrams/use-cases/*.puml`
- `docs/diagrams/sequences/*.puml`
- `docs/diagrams/domain/*.puml`
- `docs/diagrams/activities/*.puml`
- `docs/diagrams/erd/*.puml`
- `AGENTS.md`
- `docs/migration/README.md`
- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/fsm.ts`

The source-of-truth split is:

- Repository `.puml` files and current DMS docs are the source documentation.
- Miro native shapes are an editable presentation and review workspace.
- PNG, SVG, and PDF exports are derived outputs and are not source of truth.

`docs/migration/_archive/**` is historical only. It must not override current authority for role labels, Supabase status, removed archive runtime, removed routes, security posture, or folder-first archive behavior.

## 3. Board Organization

Recommended Miro board sections:

A. Dokumentasi UML Formal

- A1 - Use Case Diagram DMS
- A2 - Sequence Diagram DMS
- A3 - Class / Domain Diagram DMS
- A4 - Activity Diagram DMS
- A5 - ERD DMS
- A6 - Catatan Review

B. Review Berdasarkan Domain Sistem

- B1 - Overview Sistem DMS
- B2 - Auth, Session, dan RBAC
- B3 - Workflow Dokumen
- B4 - Arsip Folder-First
- B5 - Penambahan Dokumen Manual
- B6 - Admin dan Master Data
- B7 - Laporan Kinerja
- B8 - Catatan Review

Section A is for formal UML and ERD documentation by diagram type. Section B is for domain-based stakeholder review and discussion.

Do not duplicate diagrams unless duplication helps review. If a diagram is duplicated across sections, add a visible note with the source path and whether the duplicate is presentation-only.

## 4. Global Visual Style

Use a simple, warm, readable visual style aligned with the DMS UI direction:

- Use warm cream or orange canvas/frame backgrounds when possible.
- Use white or off-white diagram cards for contrast.
- Use black or dark text.
- Use orange accents sparingly for important system boundaries, lifecycle transitions, warnings, or review callouts.
- Avoid a cold gray/blue SaaS look.
- Use consistent font size and spacing within each frame.
- Avoid dense diagrams; prefer multiple smaller grouped diagrams over one crowded frame.
- Put clear titles at the top-left of each frame.
- Add a small source note for every diagram, for example: `Source: docs/diagrams/use-cases/dms-overall-use-case.puml`.
- Add a legend when color, line style, icon, or symbol meaning is used.

Do not specify or depend on exact Miro proprietary object IDs. Do not require custom fonts. Do not use color combinations that reduce readability.

## 5. Use Case Diagram Native Style

Shapes:

- Actors: stick figure/person icon or simple labeled actor box outside the system boundary.
- System boundary: large rounded rectangle.
- Use cases: ovals inside the system boundary.
- Associations: straight or slightly curved connectors.
- Notes: small note boxes near the related actor, use case, or boundary.

Layout:

- Actors stay outside the system boundary.
- The main system boundary is centered.
- Primary operational actors belong on the left.
- Administrative and reporting actors belong on the right or bottom-right.
- Keep the main use case diagram high-level.
- Module-level use cases may show more detail, but should not model UI clicks.

Naming:

- Use verb-object use case names.
- Use Indonesian user-facing labels.
- Use PPSPM, not Bendahara.
- Use Kepala Sub Bagian Umum, not Arsiparis/Kasubag.
- Admin Sistem should connect only to admin and configuration use cases.

The main DMS use case should remain simplified:

- Login / Logout
- Ganti Peran
- Kelola Dokumen
- Validasi Dokumen
- Setujui Dokumen
- Kelola Berkas Arsip
- Kelola Dokumen Manual
- Kelola Laporan Kinerja
- Kelola User dan Master Data

## 6. Sequence Diagram Native Style

Shapes:

- Participants: labeled rectangles at the top.
- Lifelines: vertical dashed lines.
- Messages: horizontal connectors/arrows.
- Return/response: dashed or lighter connector when it adds clarity.
- Branches: grouped frames labeled `alt`, `else`, or `opt`.

Layout:

- Actor/user on the far left.
- UI participant next.
- API/System services in the middle.
- Database or persistence on the right only when needed.
- Keep participants domain-level.
- Avoid too many low-level services.
- Prefer 5-7 participants maximum for Miro readability.
- For business or client review, collapse storage/file internals into notes.

Rules:

- Do not expose tokens, sessions, storage paths, physical paths, DB URL, or secret values.
- Keep the destroyed-file block message exact: `Data file sudah dimusnahkan`.
- For material workflow, use PPSPM as the visible actor label.
- Preserve authorization-before-state-disclosure semantics for file access and destroyed-folder behavior.

## 7. Class / Domain Diagram Native Style

Shapes:

- Classes: rectangles with class name and optional attributes.
- Packages/domains: grouped colored containers.
- Relationships: connectors with multiplicities.
- Notes: small note boxes for business rules.

Rules:

- Keep diagrams conceptual.
- Do not mirror every database table or column.
- Attributes should be minimal and conceptual.
- Retain multiplicities where they carry business meaning.
- Separate conceptual domain model from ERD.
- Do not include sensitive attributes.
- Avoid turning admin/master domain diagrams into full table inventories.

Important domain groups:

- Auth/RBAC
- Workflow Dokumen
- Folder-First Archive
- Manual Document Source
- Admin/Master Config
- Reporting metadata boundary

## 8. Activity Diagram Native Style

Shapes:

- Start: filled circle.
- Action: rounded rectangle.
- Decision/merge: diamond.
- Final: bullseye/final circle.
- Swimlanes: horizontal or vertical lanes by role.
- Notes: small note boxes for rules.

Layout:

- Use swimlanes for role handoffs.
- Keep actions short.
- Use clear decision guards such as `[valid]`, `[invalid]`, `[approve]`, and `[reject]`.
- Avoid low-level API/database actions unless necessary.
- Make revision loops visually clear without making them overly complex.

DMS swimlanes may include:

- Pegawai
- PPK
- PPSPM
- Kepala Sub Bagian Umum
- Admin Sistem
- Penanggung Jawab Kinerja
- System/API
- File Handling, only when needed

## 9. ERD Native Style

Shapes:

- Tables/entities: rectangles with table name and selected columns.
- PK/FK markers: concise text markers.
- Relationships: connectors with crow's foot style if available, otherwise labeled cardinality.
- Domain groups: light containers.

Rules:

- ERD must come from active Drizzle schema.
- Do not invent tables.
- Do not show sensitive columns in detail.
- Omit or generalize credential, session, and file path fields.
- Use domain-specific ERD frames to reduce density.
- Folder-first archive authority must be BerkasArsip and BerkasArsipItem.
- ManualArsip is a manual document source, not active lifecycle authority.
- Lifecycle authority is `berkas_arsip.status_berkas` and `berkas_arsip.status_arsip` through `berkas_arsip_item` source `MANUAL` or `WORKFLOW`.

## 10. DMS Terminology Rules for Miro Diagrams

Use these labels and wording rules in native Miro diagrams:

- Use PPSPM as the user-facing label.
- `BENDAHARA` may appear only as an internal role/status note if necessary.
- Use Kepala Sub Bagian Umum as the user-facing archive actor.
- Do not use Arsiparis or Kasubag as active user-facing labels.
- Use Admin Sistem for the admin actor.
- Admin Sistem is not an operational substitute for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, or Penanggung Jawab Kinerja.
- Use Penambahan Dokumen, not Penambahan Arsip.
- Use Nomor SPM at closure/final archive metadata, not Nomor Surat as a new business label.
- Use `Data file sudah dimusnahkan` exactly where destroyed-file access is blocked.
- Use correct Supabase wording only if mentioned: `Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.`

## 11. Miro Review Notes and Sync Rules

Every diagram should have a visible source path note.

Every diagram should have one review status:

- Draft
- Needs revision
- Ready for stakeholder review
- Accepted

Use Miro comments and sticky notes to capture feedback. If a Miro-native diagram diverges from `.puml`, document whether the divergence is:

- presentation-only, or
- required to sync back to source in a scoped phase.

Do not assume Miro-only changes update the repository. Sync-back must be explicit, reviewed, and scoped to the source files being changed.

## 12. MCP Readiness Rules

This guide prepares future MCP use but does not run MCP.

Before Miro MCP use:

- A target board must be selected.
- Permission and scope must be confirmed.
- No tokens, API keys, secrets, cookie values, session values, password hash values, DB URL values, storage root values, physical path values, or logical path values should be pasted into prompts.
- MCP must first create a safe test frame only.
- MCP must not bulk-create all diagrams before a proof-of-concept is approved.
- D6J should be a feasibility test only.
- D6K should be one native diagram prototype only, likely Use Case Utama.

## 13. Recommended First Native Diagram Prototype

Recommended first prototype:

- Use Case Utama - DMS Overall

Reason:

- It is now simplified after D6F.1.
- It is closest to classic UML.
- It is easiest to compare with the user's previous documentation style.
- It tests actors, system boundary, ovals, connectors, notes, and layout.

Target layout:

- Pegawai, PPK, and PPSPM on the left.
- Kepala Sub Bagian Umum, Penanggung Jawab Kinerja, and Admin Sistem on the right.
- System boundary centered.
- Core use cases arranged in two columns inside the boundary.
- Notes below or on the right side.

## 14. What This Phase Does Not Do

This phase:

- Does not create Miro shapes.
- Does not call Miro MCP.
- Does not modify PlantUML sources.
- Does not render or export diagrams.
- Does not create PNG, SVG, or PDF files.
- Does not modify runtime code.
- Does not create a Miro board.

## 15. Recommended Next Phases

- D6J - Miro MCP Feasibility Test: create one safe test frame and a few basic shapes only.
- D6K - Native Miro Prototype: Use Case Utama: create one editable native Miro use case diagram.
- D6L - Native Miro Formal UML Set: build formal UML/ERD frames after prototype approval.
- D6M - Native Miro Domain Review Set: build domain-based stakeholder review frames if needed.
- D7 - Render/Export Final Diagrams: only after native Miro review/source acceptance.
