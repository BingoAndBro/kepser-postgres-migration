# Phase 15L.3A.3 - Workflow List Header Search Filter Consistency

## 1. Status

- Implemented.
- Focused source validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Workflow list header/search/filter consistency for Pegawai, PPK, and PPSPM list pages.
- Client-side search over safe metadata already available in each page DTO.
- Consistent search placeholders and result count placement.
- Follow-up alignment so desktop table columns match the approved `/pegawai/dokumen` structure.
- Follow-up toolbar refinement so the status filter sits immediately to the left of the total document count on `/pegawai/dokumen` and `/ppk/tervalidasi`.
- Follow-up removal of the redundant function filter from `/bendahara/inbox` because the page already has metadata search.
- Follow-up removal of redundant function/date filters from `/ppk/inbox`; the validation inbox uses search only.
- Follow-up status filter addition on `/ppk/tervalidasi`.
- Follow-up custom status select styling using the app select primitive so the trigger text, icon, and dropdown menu stay visually stable.
- Follow-up compact shared search/filter shell for `/pegawai/dokumen` and `/ppk/tervalidasi`, with fit-to-content status trigger and medium-weight text.
- Follow-up reuse of the same compact search shell across the remaining workflow list pages without adding status filters.
- Follow-up neutral grey table header row and column text across all target workflow list tables.
- Removal of duplicate below-toolbar result count text where the toolbar now carries the count.
- Status dropdowns are limited to `/pegawai/dokumen` and `/ppk/tervalidasi`.

Excluded:

- API/backend changes.
- Server-side search/filter behavior.
- Workflow/status/action semantics.
- Detail pages.
- Auth/session/RBAC.
- Storage/file-access.
- Schema, migration, package, lockfile, environment, generated route tree, database, Drizzle, and Supabase changes.

## 3. User Finding

The approved table/list visual baseline was in place, but list header/search/filter behavior was inconsistent:

- some workflow lists had search and some did not;
- placeholders differed;
- result count appeared in different places;
- desktop table columns differed between pages;
- the status filter and total count on `/pegawai/dokumen` did not sit proportionally beside each other;
- status filters should only appear where the user requested them;
- mixed/filterable pages needed useful filters without changing backend behavior.

## 4. Header/Search/Filter Consistency Rules

- Every target workflow list page now has a search control.
- Search is case-insensitive.
- Search safely skips missing or nullable fields.
- Search uses only client-side fields already returned by that page.
- Result count uses `Total ... Dokumen` wording and is aligned as plain text in the search/filter shell.
- Pages other than `/pegawai/dokumen` and `/ppk/tervalidasi` use search only and do not show a status dropdown.
- Mixed-status `/pegawai/dokumen` keeps its existing status dropdown.
- On `/pegawai/dokumen` and `/ppk/tervalidasi`, the status dropdown is placed immediately left of the plain total count text.
- `/ppk/tervalidasi` has a status dropdown per latest user direction.
- The status dropdown trigger is compact, fit-to-content on desktop, and uses medium-weight text instead of a bold pill.
- All target workflow list pages use the same compact search card sizing.
- Table header rows use a subtle neutral grey background while body rows stay visually distinct and harmonious.
- Table column headings use neutral grey text for a quieter cross-page baseline.
- Inbox pages use search only and do not show function/date filters.

## 5. Desktop Table Column Baseline

Desktop workflow list tables now follow the approved `/pegawai/dokumen` structure:

- `No`
- `Judul Dokumen`
- `Kegiatan`
- `Status`
- `Tanggal` / `Tanggal Ajuan` where the page data supports a true submitted date
- `Aksi`

`Fungsi` is shown as secondary text under `Judul Dokumen`, matching the approved baseline. Rejected-page `Catatan` stays searchable and remains visible in mobile metadata, but it is not a separate desktop column so the table width stays consistent.

## 6. Pages Changed

- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/pegawai/revisi.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/tervalidasi.tsx`
- `src/routes/ppk/ditolak.tsx`
- `src/routes/ppk/revisi.tsx`
- `src/routes/bendahara/inbox.tsx`
- `src/routes/bendahara/selesai.tsx`
- `src/routes/bendahara/ditolak.tsx`
- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `tests/unit/dokumen/cross-role-list-parity-source.test.ts`

## 7. Search Fields By Page

| Page | Search fields |
|---|---|
| `/pegawai/dokumen` | `judul`, `fungsi_nama`, `kegiatan_nama` |
| `/pegawai/revisi` | `judul`, `fungsi_nama`, `kegiatan_nama`, `revision_notes` |
| `/ppk/inbox` | `judul`, `fungsi_nama`, `kegiatan_nama` |
| `/ppk/tervalidasi` | `judul`, `fungsi_nama`, `kegiatan_nama` |
| `/ppk/ditolak` | `judul`, `fungsi_nama`, `kegiatan_nama`, `revision_notes` |
| `/ppk/revisi` | `judul`, `fungsi_nama`, `kegiatan_nama`, `revision_notes` |
| `/bendahara/inbox` | `judul`, `fungsi_nama`, `kegiatan_nama` |
| `/bendahara/selesai` | `judul`, `fungsi_nama`, `kegiatan_nama` |
| `/bendahara/ditolak` | `judul`, `fungsi_nama`, `kegiatan_nama`, `revision_notes` |

## 8. Status Filter Decisions By Page

| Page | Decision |
|---|---|
| `/pegawai/dokumen` | Kept existing status dropdown because the list is mixed-status. |
| `/pegawai/revisi` | No status dropdown; action-specific revision list. |
| `/ppk/inbox` | No status/function/date filters; search only. |
| `/ppk/tervalidasi` | Status dropdown shown per latest user direction. |
| `/ppk/ditolak` | No status dropdown; fixed rejected-history page. |
| `/ppk/revisi` | No status dropdown; action-specific PPK revision list. |
| `/bendahara/inbox` | No status dropdown and no function filter; search covers the available metadata. |
| `/bendahara/selesai` | No status dropdown; fixed completed-history page. |
| `/bendahara/ditolak` | No status dropdown; fixed rejected-history page. |

## 9. Behavior Preserved

- Existing endpoints are unchanged.
- Redundant PPK inbox function/date filters were removed from the client list header and request query.
- The redundant PPSPM inbox function filter was removed from the client list header and request query.
- Existing row/detail navigation is unchanged.
- Existing approve, reject, resubmit, and revision actions are unchanged.
- Existing status badge values and labels are unchanged.
- Existing rejected/revision notes remain searchable where present.
- Internal `/bendahara` route namespace remains unchanged while visible copy uses PPSPM.

## 10. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helpers were modified.
- No request/response contracts were changed.
- No server-side search/filter behavior was added.

## 11. Validation Performed

Passed:

- `git status --short --branch`
- `git branch --show-current`
- Required source/document/prototype inspection.
- `git grep -n "search\|Search\|filter\|Filter\|statusFilter\|setSearch\|query\|placeholder\|ditemukan\|Semua Status\|StatusBadge\|judul\|fungsi\|kegiatan\|catatan" -- src/routes/pegawai src/routes/ppk src/routes/bendahara src/components tests`
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

1. Check `/pegawai/dokumen`: search by judul, fungsi, kegiatan; status filter still works.
2. Check `/pegawai/revisi`: search by judul, fungsi, kegiatan, and catatan.
3. Check `/ppk/inbox`: search by judul, fungsi, kegiatan; no function/date filters are shown.
4. Check `/ppk/tervalidasi`: search works; status filter works and arrow icon is stable.
5. Check `/ppk/ditolak`: search works including catatan; no status dropdown.
6. Check `/ppk/revisi`: search works including catatan; no misleading status dropdown.
7. Check `/bendahara/inbox`: search by judul, fungsi, kegiatan; no separate function filter is shown.
8. Check `/bendahara/selesai`: search works; no status dropdown.
9. Check `/bendahara/ditolak`: search works including catatan; no status dropdown.
10. Confirm desktop columns use the same structure as `/pegawai/dokumen`.
11. Confirm `/pegawai/dokumen` status filter sits beside the total document count.
12. Confirm placeholders are consistent.
13. Confirm result count text uses `Total ... Dokumen`.
14. Confirm 390px mobile search/filter layout is usable.
15. Confirm row/detail navigation and role-specific actions still work.

## 13. Deferred Items / Phase 15N Reuse Opportunities

- A shared workflow list search helper can remove repeated route-local filter logic.
- Pegawai local search shell and `WorkflowSearchPanel` can be consolidated after broader list surfaces are complete.
- Future list primitives can centralize result count text and empty-state wording.
- No archive/admin/profile list consolidation is included in this phase.

## 14. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
