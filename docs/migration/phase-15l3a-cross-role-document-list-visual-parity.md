# Phase 15L.3A - Cross-Role Document List Visual Parity

## 1. Status

- Implemented.
- Focused source validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Pegawai document/revision list presentation.
- PPK inbox, validated, rejected, and revision list presentation.
- PPSPM inbox, completed, and rejected list presentation.
- Shared workflow list/card primitive polish.
- Focused source guard for the visual parity boundary.

Excluded:

- API route changes.
- Backend helper changes.
- Workflow/status transition changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. User Rationale

The user requested Pegawai, PPK, and PPSPM document list surfaces to feel like one consistent system. Ajukan Dokumen and Revisi pages are already approved as the real-app adaptation baseline, while the prototype screenshot shows the desired compact document list rhythm: simple page context, warm orange accent, clean search/filter shell, readable result count, dense desktop table, visible status, and mobile cards without horizontal overflow.

## 4. Prototype References Used

- `D:\Temp\dms-ai-studio-final\src\components\workflow\InboxView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\workflow\ReportListView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\UserView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\PPKView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\TreasurerView.tsx`
- Latest user screenshot showing `Dokumen Diajukan` list/table style.

No prototype source was copied or imported.

## 5. Approved Baseline Pages Used

- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `docs/migration/phase-15l1g-approved-ajukan-pattern-baseline.md`
- `docs/migration/phase-15l2-revisi-dokumen-flow-parity.md`
- `docs/migration/phase-15l2c-ppk-resubmit-visual-parity.md`
- `docs/migration/phase-15m0-actionable-cursor-affordance.md`
- `docs/migration/phase-15m1-dark-document-preview-overlay.md`

## 6. Files Changed

- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/pegawai/revisi.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/tervalidasi.tsx`
- `src/routes/ppk/ditolak.tsx`
- `src/routes/ppk/revisi.tsx`
- `src/routes/ppspm/inbox.tsx`
- `src/routes/ppspm/selesai.tsx`
- `src/routes/ppspm/ditolak.tsx`
- `tests/unit/dokumen/cross-role-list-parity-source.test.ts`
- `docs/migration/phase-15l3a-cross-role-document-list-visual-parity.md`

## 7. Cross-Role List Pattern Changes

- Workflow PPK/PPSPM page headers now use the same solid warm cream shell as the Pegawai list baseline instead of a separate gradient treatment.
- Shared workflow mobile cards now use compact warm metadata tiles, optional full-width metadata rows, and a separated bottom action area.
- PPSPM inbox now uses the shared table component pattern instead of a one-off raw table.
- Rejected PPK/PPSPM lists now show a contextual rejected badge in the same status placement used by other list pages.
- Long mobile metadata such as `Kegiatan` and `Catatan` can span full width to improve readability at 390px.
- Pegawai `/pegawai/dokumen` now uses the prototype-aligned `Dokumen Diajukan` page label.
- Pegawai mobile list actions now use full-width bottom buttons like the PPK/PPSPM mobile cards.
- Desktop table rows across the touched list surfaces now expose row-level pointer/keyboard navigation so hover/click affordance is not limited to the action icon.
- The `Tahun` column and mobile `Tahun` metadata were removed from touched document list surfaces because the date already carries the year.
- Table/mobile action affordance is normalized to one chevron-style `Buka Dokumen` treatment; revision/detail distinction is left to status context.
- List status visuals now use a prototype-like simple rectangular badge through `DocumentListStatusBadge`.
- Technical `Step 1` / `Step 2` list labels were removed from the touched list surfaces; visible status copy stays simple and user-facing.

## 8. Role-Specific Behavior Preserved

- Pegawai document list fetches, filters, pagination, detail navigation, and revision navigation are unchanged.
- Pegawai revision list fetches, search, pagination, and revision detail navigation are unchanged.
- PPK inbox filters/search and detail navigation are unchanged.
- PPK validated/rejected/revision data loading and navigation are unchanged.
- PPSPM inbox function filter and detail navigation are unchanged.
- PPSPM completed/rejected data loading and navigation are unchanged.
- Internal Ppspm route/namespace remains unchanged while visible wording remains PPSPM where user-facing.

## 9. Mobile Card Behavior

- 390px mobile uses card lists rather than desktop table overflow.
- Status remains near the title area.
- Metadata uses readable compact tiles with full-width treatment for longer values.
- Actions remain reachable through full-width bottom buttons.

## 10. Reuse Opportunities Deferred To Phase 15N

- Pegawai and workflow list primitives are now closer, but a broader shared document-list primitive is deferred.
- Rejected contextual badge duplication between PPK and PPSPM can be consolidated later.
- Desktop table column helper extraction is deferred until more pages are audited.
- Search/filter shell unification between Pegawai and workflow primitives remains a candidate for Phase 15N.

## 11. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helpers were modified.
- No request/response contracts were changed.
- No workflow/status semantics were changed.

## 12. Validation Performed

- `git status --short --branch`
- `git branch --show-current`
- Required source/document/prototype inspection.
- `git grep -n "table\|thead\|tbody\|Dokumen Diajukan\|inbox\|tervalidasi\|ditolak\|revisi\|selesai\|StatusBadge\|EmptyState\|LoadingState\|ErrorState\|pagination\|filter\|search" -- src/routes/pegawai src/routes/ppk src/routes/ppspm src/components`
- `pnpm test tests/unit/dokumen/cross-role-list-parity-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check.

Not run:

- full `pnpm test`
- `pnpm build`

## 13. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Login as Pegawai.
2. Check `/pegawai/dokumen`.
3. Check `/pegawai/revisi`.
4. Login/switch as PPK.
5. Check `/ppk/inbox`, `/ppk/tervalidasi`, `/ppk/ditolak`, `/ppk/revisi`.
6. Login/switch as PPSPM.
7. Check `/ppspm/inbox`, `/ppspm/selesai`, `/ppspm/ditolak`.
8. Confirm lists feel visually consistent.
9. Confirm filters/search still work.
10. Confirm detail navigation still works.
11. Confirm role-specific action behavior is unchanged.
12. Confirm 390px mobile card lists are readable and have no horizontal overflow.
13. Confirm action buttons have pointer affordance and disabled actions do not look clickable.
14. Confirm no forbidden legacy surfaces are restored.

## 14. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
