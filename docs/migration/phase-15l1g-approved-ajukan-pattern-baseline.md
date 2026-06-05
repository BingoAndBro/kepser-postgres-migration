# Phase 15L.1G - Approved Ajukan Dokumen Pattern Baseline

## 1. Status

- Documentation/baseline only.
- Ajukan Dokumen is approved by the user as the first prototype-parity baseline.
- Approval follows the Phase 15L.1 through Phase 15L.1F work on function safety, visual refinement, upload-row parity, and unsaved-change protection.
- No source code, UI, tests, package files, schema, migrations, API routes, environment files, generated route tree, or prototype source are changed by this phase.
- No commit or push was performed.

## 2. Approved Visual Direction

Future prototype-parity work should reuse the approved Ajukan Dokumen real-app visual language:

- simple and compact layout;
- fewer cards and fewer internal headings;
- direct input presentation instead of deeply nested form cards;
- soft warm orange accent;
- light cream or white page canvas;
- orange used as accent only;
- no orange-brown, heavy burnt, or visually dominant warm tone;
- white or off-white cards;
- subtle neutral borders;
- compact typography;
- reduced uppercase tracking;
- no excessive badges, decorations, shadows, or repeated accent treatments.

The approved direction is a restrained real-application adaptation of the prototype, not a literal prototype copy.

## 3. Approved Interaction Patterns

Ajukan Dokumen establishes the approved interaction baseline for similar workflow forms:

- three-stage Ajukan flow:
  - Informasi Dasar;
  - Kelengkapan;
  - Review & Ajukan.
- Revisi-style uploaded file row adapted for Ajukan's pending-document context;
- filename visible on uploaded rows;
- compact preview, edit/replace, and remove actions;
- same feature, same treatment: repeated controls such as upload rows, add-supporting-document areas, reset buttons, replace buttons, delete icons, status pills, modals, and empty states should reuse the same or intentionally near-identical visual component treatment across pages;
- prefer shared helpers/components for repeated actions instead of recreating similar controls with different size, padding, icon, color, or hover behavior;
- clickable controls should communicate interactivity with pointer cursor on hover; custom clickable wrappers should include `cursor-pointer`, and shared button components should preserve pointer behavior for enabled states;
- destructive icon actions should be visibly destructive at rest when the action is destructive, then become more explicit on hover;
- uploaded state clearly visible;
- form state retained across stages;
- dirty/unsaved changes guard with:
  - "Keluar tanpa menyimpan?"
  - "Perubahan yang belum disimpan akan hilang."
  - "Tetap di halaman"
  - "Keluar tanpa menyimpan"
- success state after submit;
- toast feedback for successful and failed outcomes;
- "Ajukan Dokumen Lain" resets the local Ajukan form to a fresh submission state.

## 4. Business Behavior Preserved

The approved Ajukan baseline is visual and interaction guidance only. It does not authorize business or backend changes:

- no submit endpoint change;
- no payload change;
- no workflow or status change;
- no Material or Non-Material rule change;
- no upload, storage, preview, download, or file-access change;
- no auth, session, or RBAC change;
- no backend or API change;
- no package, schema, environment, generated route tree, database, Drizzle, Supabase, or migration change.

## 5. Pattern To Reuse In Future Phases

Use this Ajukan baseline as the approved real-app adaptation layer for future prototype-parity phases. It is not a replacement for inspecting the relevant prototype page.

Future phases must:

- inspect the relevant prototype page first;
- preserve the real application's business logic, API behavior, validation, authorization, and storage boundaries;
- adapt the target page using the approved Ajukan visual language:
  - soft warm orange palette;
  - compact layout;
  - simple direct fields;
  - fewer nested cards;
  - restrained borders and shadows;
  - Revisi-style/Ajukan-approved upload rows where upload rows apply;
  - unsaved-change modal style where dirty navigation applies;
  - success state and toast style where mutation outcomes apply.

## 6. Pattern Not To Copy Blindly

- Do not reuse Ajukan submit logic for Revisi Dokumen.
- Revisi backend, upload, attachment-editor, update, and resubmit behavior remain their own source of truth.
- Ajukan should be reused only for the approved visual and interaction language.
- Preserve each page's own business logic, endpoint sequence, payload, validation, state ownership, and API behavior.
- Do not copy or import prototype source.

## 7. Next Recommended Phase

Recommended next phase:

- Phase 15L.2 - Revisi Dokumen Flow Parity using the approved Ajukan visual/interaction baseline.

Phase 15L.2 should treat existing Revisi backend behavior as correct. The focus should be flow/visual parity and confirmation polish while preserving the current Revisi upload, update, resubmit, authorization, and validation behavior.

## 8. Validation

Planned validation for this documentation-only phase:

- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- `git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase`

Expected result:

- only `docs/migration/phase-15l1g-approved-ajukan-pattern-baseline.md` is changed or untracked;
- protected diff output is empty;
- no commit or push is performed.
