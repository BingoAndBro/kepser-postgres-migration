# Phase 15L.3A.2 - Apply Approved Table/List Baseline

## 1. Status

- Implemented.
- Focused validation passed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Visual/presentation alignment for remaining workflow list pages.
- Pegawai `/pegawai/revisi`.
- PPK `/ppk/inbox`, `/ppk/tervalidasi`, `/ppk/ditolak`, and `/ppk/revisi`.
- PPSPM `/bendahara/inbox`, `/bendahara/selesai`, and `/bendahara/ditolak`.
- Narrow workflow list primitive additions for list-only header, date display, action affordance, and table header class reuse.
- Focused source guard update.

Excluded:

- `/pegawai/dokumen` source changes.
- Detail page source changes.
- API/backend changes.
- Workflow/status/revision semantics changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. Approved Table/List Baseline Used

Primary baseline:

- `src/routes/pegawai/dokumen/index.tsx`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`

Applied characteristics:

- controlled `max-w-[1280px]` content rail;
- flatter list header with warm icon token;
- light search/filter shell;
- rounded white table card with subtle neutral border;
- compact neutral table headers;
- row-level hover using warm orange accent only;
- document title remains strongest row text;
- date display uses clock icon and neutral gray text;
- action chevron uses neutral default, orange hover, and visible soft border/ring;
- mobile cards use compact metadata tiles and full-width bottom action.

## 4. Prototype References Used

Inspected:

- `D:\Temp\dms-ai-studio-final\src\components\workflow\InboxView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\workflow\ReportListView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\UserView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\PPKView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\TreasurerView.tsx`

No prototype source was copied or imported.

## 5. Files Changed

- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/routes/pegawai/revisi.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/tervalidasi.tsx`
- `src/routes/ppk/ditolak.tsx`
- `src/routes/ppk/revisi.tsx`
- `src/routes/bendahara/inbox.tsx`
- `src/routes/bendahara/selesai.tsx`
- `src/routes/bendahara/ditolak.tsx`
- `tests/unit/dokumen/cross-role-list-parity-source.test.ts`
- `docs/migration/phase-15l3a2-apply-approved-table-list-baseline.md`

## 6. Pages Aligned

- `/pegawai/revisi`
- `/ppk/inbox`
- `/ppk/tervalidasi`
- `/ppk/ditolak`
- `/ppk/revisi`
- `/bendahara/inbox`
- `/bendahara/selesai`
- `/bendahara/ditolak`

## 7. Role-Specific Behavior Preserved

- Pegawai revision list still fetches `/pegawai/revisi` and opens `/pegawai/dokumen/$id/revisi`.
- PPK inbox still uses existing search, function filter, date filters, reset behavior, and opens `/ppk/dokumen/$id`.
- PPK validated/rejected/revision lists still use their existing data sources and navigation.
- PPK revision list still opens `/ppk/dokumen/$id/resubmit`.
- PPSPM inbox still uses `/bendahara/inbox`, the existing function filter, and opens `/bendahara/dokumen/$id`.
- PPSPM completed/rejected lists still use existing data sources and navigation.
- Internal `/bendahara` route namespace remains unchanged while user-facing visible terminology remains PPSPM.

## 8. Mobile Card Behavior

- Target pages keep mobile card lists below `md`.
- Status remains near the title area.
- Metadata tiles use neutral borders and compact spacing.
- Long metadata such as `Kegiatan` and `Catatan` remains full-width where appropriate.
- Date values use the same clock-icon treatment as desktop rows.
- Bottom action buttons remain full-width and reachable at 390px.

## 9. Reuse Opportunities Deferred To Phase 15N

- Pegawai and workflow list table helpers can be consolidated after all parity pages are complete.
- The desktop table row/cell pattern is now repeated and is a candidate for a future `DocumentListTable` primitive.
- Mobile action button and metadata tile patterns can be unified further.
- Page-level search/filter shell behavior can be audited for one shared primitive after archive/admin/profile surfaces are reviewed.

## 10. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helpers were modified.
- No request/response contracts were changed.
- No workflow/status semantics were changed.
- No auth/session/RBAC changes were made.
- No storage/file-access changes were made.

## 11. Validation Performed

Passed:

- `git status --short --branch`
- `git branch --show-current`
- Required source/document/prototype inspection.
- `git grep -n "table\|thead\|tbody\|Dokumen\|inbox\|tervalidasi\|ditolak\|revisi\|selesai\|StatusBadge\|EmptyState\|LoadingState\|ErrorState\|pagination\|filter\|search" -- src/routes/pegawai src/routes/ppk src/routes/bendahara src/components tests`
- `pnpm test tests/unit/dokumen/cross-role-list-parity-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check.

Not run:

- full `pnpm test`
- `pnpm build`

## 12. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Confirm approved `/pegawai/dokumen` remains visually unchanged.
2. Check `/pegawai/revisi`.
3. Check `/ppk/inbox`.
4. Check `/ppk/tervalidasi`.
5. Check `/ppk/ditolak`.
6. Check `/ppk/revisi`.
7. Check `/bendahara/inbox`.
8. Check `/bendahara/selesai`.
9. Check `/bendahara/ditolak`.
10. Confirm all target list pages feel consistent with approved `/pegawai/dokumen`.
11. Confirm filters/search still work.
12. Confirm detail navigation still works.
13. Confirm role-specific action behavior is unchanged.
14. Confirm visible PPSPM terminology where applicable.
15. Confirm 390px mobile card lists are readable and have no horizontal overflow.
16. Confirm no forbidden legacy surfaces are restored.

## 13. Protected Files Confirmation

Expected:

- `.env` and `.env.migration` unchanged.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` unchanged.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files unchanged.
- No package installed.
- No prototype source copied or imported.
- No commit or push performed.
