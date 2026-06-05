# Phase 15M.2 - Approved Table-Row Surface Tone Rollout

## 1. Status

- Implemented.
- Focused validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Visual-only soft surface tone rollout.
- Approved workflow list table body rows.
- Shared Pegawai, workflow, archive, kinerja, and admin page primitives.
- Representative Ajukan, Pegawai Revisi, and PPK Resubmit form shells.
- Shared document form support cards used by those representative flows.

Excluded:

- API/backend changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Workflow/status semantics changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. User Visual Request

The user wanted the very light, soft off-white feel from the approved `/pegawai/dokumen` `Dokumen Diajukan` table body rows applied to appropriate app surfaces. The requested direction was softer than pure white but not gray, not dark, not cold SaaS gray, and not orange-brown.

## 4. Approved Table-Row Surface Reference Used

Primary reference:

- `src/routes/pegawai/dokumen/index.tsx`
- Approved table: `Dokumen Diajukan`
- Surface reference: table body/content row surface, not the neutral gray table header.

Implementation note:

- Before this phase, the desktop body rows inherited white from the table shell while mobile/body-adjacent content tiles already used `#FFFDF9`.
- This phase codifies the approved soft body surface as `#FFFDF9` and applies it directly to the approved table body rows and compatible surfaces.
- The table header remains neutral gray and is not used as the rollout reference.

## 5. Files Changed

- `src/components/admin/AdminPagePrimitives.tsx`
- `src/components/archive/ArchivePagePrimitives.tsx`
- `src/components/dokumen/ActivityLog.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/dokumen/ReviewSummary.tsx`
- `src/components/dokumen/form/StepUploadLampiran.tsx`
- `src/components/dokumen/form/StepperControls.tsx`
- `src/components/kinerja/KinerjaPagePrimitives.tsx`
- `src/components/pegawai/PegawaiPagePrimitives.tsx`
- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/routes/bendahara/ditolak.tsx`
- `src/routes/bendahara/inbox.tsx`
- `src/routes/bendahara/selesai.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/pegawai/revisi.tsx`
- `src/routes/ppk/ditolak.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/revisi.tsx`
- `src/routes/ppk/tervalidasi.tsx`

## 6. Surface Tone Changes Made

- Applied `#FFFDF9` to approved workflow table body rows.
- Applied `#FFFDF9` to workflow, Pegawai, archive, kinerja, and admin card/table shells.
- Applied `#FFFDF9` to mobile list cards and pagination pills where they were previously stark white.
- Applied `#FFFDF9` to search/select surfaces where readability remains unchanged.
- Applied `#FFFDF9` to representative form content shells, summary cards, activity log cards, upload/checklist containers, and sticky form action bars.
- Shifted shared admin/archive/kinerja header gradient white stops to `#FFFDF9`.
- Follow-up adjustment after user review: `/pegawai/dokumen/$id/revisi` uses the warmer Ajukan-style `#FFFAF6` on the main revision content shell, tab-selected surface, revision note inner cards, metadata cards, completion side panel, confirmation summary cards, and the shared attachment editor's large section containers so the page no longer reads as pure white.

## 7. Pure White Surfaces Intentionally Preserved

- `text-white` on colored buttons and orange gradient headers, because it is foreground text, not a surface.
- Dark preview overlay controls using `hover:bg-white/10`, because they belong to the file preview overlay.
- Document/PDF preview iframe and paper/canvas surfaces using `bg-white`, because document content should remain paper-white.
- Semantic status, warning, destructive, success, and error fills such as rose/amber/emerald/red/orange badges and notices.
- Outline button interiors in critical action rows where pure white is part of button contrast and not the surrounding app surface.
- Small icon highlights on colored panels where translucency or white improves local contrast.
- Older detail-page modals outside the approved Phase 15M.2 representative scope.

## 8. Behavior Preserved

- No route behavior changed.
- No navigation behavior changed.
- No search/filter/pagination behavior changed.
- No submit, revision, resubmit, approval, rejection, archive, lifecycle, or status behavior changed.
- No text colors were changed as part of this phase.

## 9. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helper files were modified.
- No request/response contracts were changed.

## 10. Validation Performed

Passed:

- `git status --short --branch`
- `git branch --show-current`
- Required source/document inspection.
- Required white-surface search.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check.

Not run:

- full `pnpm test`
- `pnpm build`

## 11. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Check `/pegawai/dokumen`: approved table body row tone remains the reference.
2. Check `/pegawai/dokumen/aju`: form surfaces are softer but still readable.
3. Check `/pegawai/dokumen/$id/revisi`: panels are softer and still clean.
4. Check `/ppk/dokumen/$id/resubmit`: panels remain readable.
5. Check workflow list pages: table/list/card surfaces feel harmonious.
6. Check dark preview overlay: PDF/document paper remains correct and not gray.
7. Check modals/dropdowns: contrast remains good.
8. Check buttons: `text-white` on colored buttons remains readable.
9. Check status badges: semantic colors still distinguish statuses.
10. Check mobile 390px: surfaces do not become muddy.
11. Confirm no text contrast regression.

## 12. Deferred Items

- Manual browser QA remains pending.
- Wider legacy detail modal polishing can be handled in a later explicit visual phase.
- A future design-token cleanup can replace repeated `#FFFDF9` literals if the team wants a named surface token.

## 13. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
