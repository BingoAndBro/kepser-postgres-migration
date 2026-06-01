# Current Diagram Gap Review

## 1. Purpose

This document reviews the existing D2/D3/D4 PlantUML diagram sources against `docs/diagrams/uml-erd-methodology-standard.md`.

This phase is review-only.

- It does not revise existing diagrams.
- It does not generate activity diagrams or ERDs.
- It prepares bounded follow-up phases for targeted diagram revision, missing activity diagrams, missing ERDs, and possible later Miro-native work.

## 2. Review Inputs

- `docs/diagrams/uml-erd-methodology-standard.md`
- `docs/diagrams/diagram-source-audit.md`
- `docs/diagrams/README.md`
- `docs/diagrams/use-cases/*.puml`
- `docs/diagrams/sequences/*.puml`
- `docs/diagrams/domain/*.puml`
- `AGENTS.md`
- `docs/migration/README.md`
- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/fsm.ts`

## 3. Overall Verdict

Status: acceptable as a source baseline, needs targeted revisions, and is not ready for Miro-native redraw as-is.

The current diagram set captures the main DMS actors, material and non-material workflow rules, folder-first archive authority, Admin Sistem boundary, Penanggung Jawab Kinerja metadata-only boundary, and the exact destroyed-file message: `Data file sudah dimusnahkan`.

The primary gaps are diagram density, some use cases that are closer to UI sub-functions than actor goals, several sequence diagrams that include implementation-service detail, and class/domain diagrams that are useful conceptually but sometimes approach pseudo-ERD structure. Activity diagrams and ERDs are still missing entirely.

## 4. Use Case Diagram Review

| File | Purpose | Status | Key Findings | Recommended Action |
|---|---|---|---|---|
| `docs/diagrams/use-cases/dms-overall-use-case.puml` | Overall DMS actor and capability map. | Needs simplification. | Actor labels are correct and Admin Sistem is not a super-actor. The system boundary is clear, but the diagram is too dense for formal main use case and Miro/client review. It mixes overall goals with module-level details such as export, file access, revision routing, and reporting breakdowns. | Simplify into a formal main use case diagram with fewer high-level actor goals. Keep detailed flows in module diagrams and future activity/use-case descriptions. |
| `docs/diagrams/use-cases/document-workflow-use-case.puml` | Pegawai, PPK, and PPSPM workflow capability breakdown. | Acceptable with minor simplification. | Correctly preserves material flow, non-material flow, PPSPM user-facing label, and internal status note. Some use cases such as upload, inbox viewing, and activity history are useful but closer to UI/sub-function detail. | Keep as a module-level breakdown. Consider grouping supporting actions under broader goals during D6F.1. |
| `docs/diagrams/use-cases/folder-first-archive-use-case.puml` | Kepala Sub Bagian Umum folder-first archive, lifecycle, and file-access capability breakdown. | Acceptable but dense. | Correctly models folder-first authority, close/final metadata timing, lifecycle, and destroyed-file blocking. Include relations are mostly justified, but the diagram is dense and includes UI/navigation-style viewing goals. | Keep as module-level diagram. Split or simplify if targeting Miro-native redraw. Preserve folder-first authority and exact destroyed-file message. |
| `docs/diagrams/use-cases/admin-config-use-case.puml` | Admin Sistem user, password reset, master data, and completeness configuration. | Needs simplification. | Admin Sistem is correctly limited to administration/configuration. However, filter and selection use cases are UI-oriented, and include relations are overused for filtering and picker-style behavior. | Refine to fewer administration goals. Move filter/picker details to UI notes or omit from UML use case view. |
| `docs/diagrams/use-cases/pj-kinerja-report-use-case.puml` | Penanggung Jawab Kinerja metadata-only reporting. | Acceptable but could be simpler. | Correct actor and metadata-only boundary. No file access is modeled. The diagram decomposes dashboard/report drilldown into many included use cases, making it somewhat UI/report-widget oriented. | Keep as a module-level breakdown. Consider one main report use case plus optional read-only drilldown use cases. |

Summary:

- Acceptable use case diagrams: `document-workflow-use-case.puml`, `folder-first-archive-use-case.puml`, `pj-kinerja-report-use-case.puml`.
- Too dense or needing simplification: `dms-overall-use-case.puml`, `admin-config-use-case.puml`.
- Module-level use cases remain useful as breakdown diagrams, but the overall diagram should become the formal high-level map.

## 5. Sequence Diagram Review

| File | Scenario | Status | Key Findings | Recommended Action |
|---|---|---|---|---|
| `docs/diagrams/sequences/login-session-role-switch-sequence.puml` | Login, session check, role switch, and logout. | Acceptable. | Scenario is focused and correctly preserves `dms_session` as auth boundary, active role as UX state, assigned-role validation, and Admin Sistem non-substitution. Participant names are mostly domain-level. | Keep. Minor future polish can shorten auth/database exchange detail for Miro readability. |
| `docs/diagrams/sequences/pegawai-submit-material-sequence.puml` | Pegawai submits a material document. | Needs simplification. | Correctly covers material validation, attachment formalization, status `IN_PPK_VALIDATION`, and failure handling. It is implementation-heavy due to file movement, compensation, service, database, and local storage participants. | Simplify for business sequence. Push file-handling internals to a note or separate technical sequence if needed. |
| `docs/diagrams/sequences/ppk-validation-sequence.puml` | PPK validation, rejection, and forwarding to PPSPM. | Acceptable with minor simplification. | Scenario focus and alt branches are clear. It preserves revision-to-Pegawai and forward-to-PPSPM behavior. Some detail and file-access preparation could be reduced. | Keep. Consider trimming inbox/detail retrieval before Miro-native redraw. |
| `docs/diagrams/sequences/ppspm-approval-sequence.puml` | PPSPM approval, rejection to PPK, and completion. | Acceptable with minor simplification. | Correct actor label and approval/revision outcomes. Similar to PPK sequence, it includes detail retrieval and file-access preparation that may be unnecessary in the core approval scenario. | Keep. Consider trimming support retrieval steps. |
| `docs/diagrams/sequences/workflow-classification-to-berkas-sequence.puml` | Completed workflow document classified into an open folder-first berkas. | Acceptable. | Correctly preserves Kepala Sub Bagian Umum ownership, eligible completed documents, one open berkas behavior, duplicate rejection, and folder-first item creation. | Keep. Minor wording cleanup only if D6F.1 revises diagrams. |
| `docs/diagrams/sequences/manual-document-to-berkas-sequence.puml` | Manual document creation into folder-first berkas. | Needs simplification. | Domain flow is correct, including required metadata, optional attachments, open berkas reuse, and closed-payment-category rejection. It is implementation-heavy around attachment formalization and storage compensation. | Simplify for business review. Keep attachment failure as a high-level alternative, not service internals. |
| `docs/diagrams/sequences/close-berkas-sequence.puml` | Close an open berkas and set archive metadata. | Acceptable. | Correctly preserves open-only closure, final metadata timing, `CLOSED/AKTIF`, and stale-state handling. Sequence is slightly detailed but still reviewable. | Keep. If redrawing in Miro, emphasize status transition and metadata validation over data-write steps. |
| `docs/diagrams/sequences/archive-destruction-sequence.puml` | Approve destruction and move a berkas to destroyed state with file access blocked. | Needs simplification. | Domain correctness is strong: exact role, eligible lifecycle state, metadata preservation, blocked file access, and safe count/category reporting. It is implementation-heavy due to physical deletion service and local file storage interactions. | Keep as technical source baseline, but create a simpler business sequence or activity diagram for client review. |
| `docs/diagrams/sequences/destroyed-file-access-block-sequence.puml` | Authorized preview/download is blocked for destroyed berkas. | Acceptable with caution. | Correctly preserves authorization-first behavior and exact message `Data file sudah dimusnahkan`. It includes storage as a participant but does not expose sensitive values. | Keep. Future revision can make storage participation conditional or note-only to reduce implementation detail. |
| `docs/diagrams/sequences/admin-reset-password-sequence.puml` | Admin Sistem resets a user's password and sessions are revoked. | Acceptable with minor refinement. | Correctly limits Admin Sistem to administration and avoids displaying sensitive values. It includes hashing and session revocation as internal services, which is acceptable for this security-relevant scenario but may be too low-level for Miro overview. | Keep. For Miro, consider a simplified version with internal security steps summarized. |

Summary:

- Acceptable sequence diagrams: login/session/role switch, PPK validation, PPSPM approval, workflow classification, close berkas, destroyed-file block, admin reset password.
- Too implementation-heavy or needing simplification: Pegawai material submit, manual document to berkas, archive destruction.
- The current sequence set is good as source documentation, but not all diagrams are ready for native Miro redraw without a style and abstraction pass.

## 6. Class / Domain Diagram Review

| File | Domain | Status | Key Findings | Recommended Action |
|---|---|---|---|---|
| `docs/diagrams/domain/auth-rbac-domain.puml` | Auth, user, role, session, active role state, and RBAC. | Acceptable with refinement. | Correctly preserves auth boundary, UX-only active role, assigned roles, and Admin Sistem limitation. It includes conceptual attributes only, but `ActiveRoleState` may be interpreted as persistent unless clarified. | Keep. Add clearer note in D6F.1 that active role is UX/session-state concept, not authorization proof. |
| `docs/diagrams/domain/document-workflow-domain.puml` | Workflow document, attachments, audit log, statuses, and revision target. | Acceptable with refinement. | Correctly captures material/non-material statuses and audit trail. It omits `ARCHIVED` from the enum despite active constants including it, likely because folder-first de-transitionalization changed archive authority. That omission should be explicitly justified or corrected in a diagram revision. | Refine status modeling so final workflow status and folder-first transition semantics are unambiguous. |
| `docs/diagrams/domain/folder-first-archive-domain.puml` | Folder-first archive parent, items, source references, classification, and lifecycle. | Acceptable. | Strong conceptual fit. It preserves multiplicities, folder-first authority, one leaf grouping, source item types, close/final metadata timing, and destroyed-file blocking. It is close to ERD detail but still readable as a domain model. | Keep. Use it as a primary input for future ERD separation, without turning the class diagram into table inventory. |
| `docs/diagrams/domain/manual-archive-domain.puml` | Manual document source and attachment relationship into folder-first archive. | Acceptable with refinement. | Correctly separates manual source data from folder-first archive grouping and avoids storage internals. It is somewhat schema-like due to many metadata attributes. | Keep. Trim attributes during D6F.1 if the target is conceptual UML rather than database-adjacent explanation. |
| `docs/diagrams/domain/admin-master-config-domain.puml` | Admin user/role configuration, master data hierarchy, completeness, and team lead assignment. | Needs refinement. | Domain relationships are useful and multiplicities matter. The diagram is somewhat database-like and dense, and several master entities could be better handled in ERD or a smaller master-data structure diagram. | Split conceptual admin responsibilities from master-data hierarchy if revising. Move detailed relational structure to ERD D6H. |
| `docs/diagrams/domain/dms-domain-overview.puml` | High-level cross-domain DMS conceptual overview. | Acceptable for overview. | Useful for Miro-native redraw because it is high-level and avoids low-level attributes. It preserves reporting metadata-only, Admin Sistem limitation, folder-first authority, and destroyed-file policy. | Keep as the best candidate for first native Miro redraw after style guide. |

Summary:

- Acceptable class/domain diagrams: auth/RBAC, document workflow, folder-first archive, manual archive, DMS overview.
- Needs refinement: admin/master configuration, document workflow status semantics, manual archive attribute density.
- Several class/domain diagrams should not be expanded further; ERD content belongs in D6H.

## 7. Missing Activity Diagrams

| Activity Diagram | Priority | Main Swimlanes | Key Decision Points | Why Needed |
|---|---|---|---|---|
| Material workflow | Must-have | Pegawai, PPK, PPSPM, System/API | Valid submission, PPK approve/reject, PPSPM approve/reject, revision target | Best format for role handoff, revision loops, and final `COMPLETED` behavior. |
| Non-Material workflow | Must-have | Pegawai, System/API | Non-material eligibility, required fields, submit-to-`TERSIMPAN` | Clarifies that non-material documents bypass material approval flow. |
| Pengklasifikasian Dokumen ke Berkas | Must-have | Kepala Sub Bagian Umum, System/API | Document completed eligibility, existing open berkas, closed payment-category rejection, duplicate item rejection | Clarifies folder-first classification after workflow completion. |
| Penambahan Dokumen Manual | Must-have | Kepala Sub Bagian Umum, System/API | Required metadata, optional attachment, existing open berkas, closed payment-category rejection | Clarifies manual source creation and folder-first item attachment without legacy archive runtime. |
| Tutup Berkas | Must-have | Kepala Sub Bagian Umum, System/API | Open versus closed berkas, required final metadata, stale state, final `CLOSED/AKTIF` | Shows where final archive metadata is captured and why new items are blocked after close. |
| Musnahkan Data | Must-have | Kepala Sub Bagian Umum, System/API, File Handling | Eligible `USUL_MUSNAH`, exact confirmation, status change, file processing summary, blocked access | Best format for destructive lifecycle policy, metadata preservation, and `Data file sudah dimusnahkan`. |
| Admin Reset Password | Optional | Admin Sistem, System/API | Authorized admin, target user valid, confirmation matches, session revocation | Useful for security review but not central to the archive/workflow domain. |
| Laporan Kinerja Metadata | Optional | Penanggung Jawab Kinerja, System/API | Assigned role valid, final-status filter, no file action | Useful to preserve metadata-only reporting and no-file-access boundary. |

## 8. Missing ERD Diagrams

Do not generate ERD content in this phase.

| ERD Diagram | Priority | Likely Source Schema Area | Safety Notes | Why Needed |
|---|---|---|---|---|
| ERD Overview | Must-have | `src/db/schema/**` active schema overview | Omit sensitive values and implementation-only internals. | Provides a relational map across major active database domains without relying on class diagrams. |
| ERD Auth & RBAC | Must-have | Auth/user/role/session schema modules | Sensitive credential/session fields should be generalized or omitted. | Needed to validate assigned roles, dedicated Admin Sistem, sessions, and RBAC relationships. |
| ERD Workflow Dokumen | Must-have | Document transaction, activity log, and related workflow schema modules | Do not expose file internals or raw attachment payload details. | Needed to verify status, actor, log, and document-source relationships. |
| ERD Folder-First Archive | Must-have | Folder-first archive, archive item, classification, and lifecycle schema modules | Exclude removed legacy archive runtime as active authority. Avoid sensitive file-access details. | Needed because folder-first berkas and items are current runtime archive authority. |
| ERD Manual Document Source | Should-have | Manual document source and attachment schema modules | Avoid exposing file storage internals. | Needed to separate manual source persistence from folder-first grouping. |
| ERD Admin/Master Config | Should-have | Master data, completeness, team lead assignment, and admin-support schema modules | Keep credential/security fields generalized. | Needed because the admin/master domain diagram is dense and relational by nature. |

## 9. Miro Native Redraw Readiness

Current diagrams are not ready for native Miro redraw/MCP as-is.

- Overall use case visual readiness: not ready. `dms-overall-use-case.puml` is too dense and should be simplified first.
- Module use case visual readiness: partially ready. Workflow, archive, and PJ Kinerja diagrams are useful, but admin/config and report drilldown include UI-oriented sub-functions.
- Sequence diagram visual readiness: partially ready. Several are scenario-focused, but submit/manual/destruction sequences need abstraction before client-facing redraw.
- Class/domain diagram visual readiness: partially ready. `dms-domain-overview.puml` is the best candidate; admin/master and workflow-domain refinements should happen first.
- Style guide readiness: not ready. D6I should define shape conventions, spacing, actor labels, sequence participant abstraction, class attribute depth, color rules, and ERD notation before any MCP/native redraw.

Recommendation: Miro MCP should wait until D6I style guide is complete. D6J should be a feasibility test only, not a bulk migration.

## 10. Recommended Revision Backlog

P0: correctness/security/domain issues

- Verify whether `docs/diagrams/domain/document-workflow-domain.puml` should include `ARCHIVED` or explicitly document why workflow-domain status stops before folder-first archive authority.
- Preserve exact destroyed-file message `Data file sudah dimusnahkan` in all future diagram revisions.
- Preserve Admin Sistem as dedicated administration only, not an operational substitute.
- Preserve Penanggung Jawab Kinerja as metadata-only with no file access.
- Preserve folder-first berkas and item model as active archive authority.
- Preserve correct Supabase wording: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."

P1: readability/UML-methodology issues

- Simplify `dms-overall-use-case.puml` into a formal main use case diagram.
- Reduce UI-click/filter/picker use cases in admin and reporting diagrams.
- Reduce implementation service detail in submit, manual document, and destruction sequences.
- Clarify conceptual versus relational content in admin/master and manual archive domain diagrams.
- Add activity diagrams for material workflow, non-material workflow, classification, manual document addition, close berkas, and destruction.
- Add ERDs from active schema authority only.

P2: presentation polish/Miro-native layout issues

- Create a Miro native style guide before any MCP shape generation.
- Define actor ordering and module color grouping.
- Define sequence participant abstraction rules.
- Define class/domain attribute depth and ERD cardinality notation.
- Run one bounded Miro MCP feasibility test after style guide approval.

Likely next bounded phases:

- D6F.1: Targeted PlantUML Revision Pass
- D6G: Activity Diagram Source Generation
- D6H: ERD Source Generation
- D6I: Miro Native Shape Style Guide
- D6J: Miro MCP Feasibility Test

## 11. Safety and Terminology Findings

- Wrong Bendahara user-facing label: not found as an active actor label. The term appears only in internal-role/status context or as a warning; user-facing diagrams use PPSPM.
- Arsiparis/Kasubag active labels: not found as active actor labels. User-facing diagrams use Kepala Sub Bagian Umum.
- ADMIN super-actor: not found. Admin Sistem is scoped to administration/configuration.
- Legacy archive active authority: not found. Diagrams model folder-first berkas authority and describe removed legacy runtime only as not active.
- Wrong Supabase claim: not found. The correct wording is preserved where needed.
- Sensitive internals: no secret values or machine-specific local references were found in the reviewed diagram sources, and this review does not add any.
- Destroyed-file message issue: not found. The exact message `Data file sudah dimusnahkan` is present and should remain exact.

## 12. Phase D6F Output

This phase creates only `docs/diagrams/current-diagram-gap-review.md`.

It does not modify diagrams. It does not create activity diagram files. It does not create ERD files. It does not render diagrams, create exports, add tooling, edit application code, edit tests, edit schema files, run migrations, seed/reset data, create Miro artifacts, commit, or push.

It prepares the next bounded phases for targeted diagram revisions, activity diagrams, ERDs, Miro-native style guidance, and a later feasibility test.
