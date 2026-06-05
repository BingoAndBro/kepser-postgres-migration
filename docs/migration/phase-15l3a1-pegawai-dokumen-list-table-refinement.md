# Phase 15L.3A.1 - Pegawai Dokumen List Table Refinement

## 1. Status

- Implemented.
- Focused source validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- `/pegawai/dokumen` visual refinement only.
- Header, search/filter shell, table shell, row rhythm, status badge presentation, and mobile card polish.
- Safe Pegawai revision status distinction using existing `status` and `revision_target` fields.
- Focused source guard update.

Excluded:

- PPK/PPSPM list changes.
- Detail page changes.
- API/backend changes.
- Workflow/status/revision target semantic changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. User Visual Feedback Addressed

- Current table felt cheap and less elegant than the prototype.
- Table needed a more refined card shell and less raw data-grid feeling.
- Header needed to be simpler, lighter, and closer to the prototype.
- Search/filter area needed softer styling and cleaner spacing.
- Status badges needed a calmer, less high-contrast treatment.
- Revision status needed to avoid implying Pegawai can revise documents whose active revision target is not Pegawai.
- Latest follow-up feedback required more comfortable right/left breathing room and clearer row text hierarchy.
- Follow-up UX clarification set `Perlu Revisi` as the label for work actionable by the current role, while non-Pegawai revision ownership should use distinct warning copy.

## 4. Prototype/Current Screenshot Comparison Summary

The prototype screenshot uses a flat title area, restrained orange accent, a white rounded search shell, a simple result count, and a rounded table card with subtle dividers. The current implementation was already consistent with Phase 15L.3A lists, but still used heavier page primitives and less refined table rhythm. This pass adapts the page toward the prototype composition without copying prototype source.

## 5. Files Changed

- `src/routes/pegawai/dokumen/index.tsx`
- `tests/unit/dokumen/cross-role-list-parity-source.test.ts`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`

## 6. Header/Search/Table Refinements

- Replaced the heavy Pegawai header primitive usage on this page with a flatter local header.
- Kept title `Dokumen Diajukan`.
- Kept `Ajukan Dokumen Baru`.
- Shortened subtitle to match the prototype's direct tone.
- Replaced the page-level search primitive usage with a local refined search/filter shell.
- Search placeholder now uses the simpler `Cari dokumen...`.
- Desktop table now sits in a rounded white shell with restrained border and soft shadow.
- Header row uses subtle off-white background, tighter uppercase tracking, and cleaner column spacing.
- Row hover is applied to the whole row through `cursor-pointer` and warm subtle hover background.
- Action remains a single chevron affordance while the full row is navigable.
- Mobile cards keep compact metadata and use calmer zinc borders.
- The page content now sits inside a narrower `max-w-[1280px]` rail with stronger responsive horizontal padding and top breathing space so the header, search shell, result count, and table do not consume the entire content width.
- Document titles use black text in their default state and shift to orange only on row hover.
- Row hierarchy is calmer: document title is semibold, number/kegiatan/date values are normal weight, and the status badge carries the strongest visual emphasis.

## 7. Status/Revision Clarity Behavior

- Added a local `PegawaiDocumentStatusBadge` for `/pegawai/dokumen`.
- `NEED_REVISION` with `revision_target='USER'` displays `Perlu Revisi` and opens the Pegawai revisi route.
- `NEED_REVISION` with `revision_target='PPK'` displays `Dikembalikan ke PPK` and opens detail instead of Pegawai revisi.
- `Dikembalikan ke PPK` uses a soft orange warning treatment, while red/rose remains reserved for Pegawai-actionable `Perlu Revisi`.
- Other statuses keep existing semantic mapping:
  - `Validasi PPK`
  - `Menunggu Persetujuan`
  - `Selesai`
  - `Tersimpan`
  - `Diarsipkan`
- No backend status values were invented or changed.

## 8. Business Behavior Preserved

- Existing `/auth/session` and `/dokumen` fetching is unchanged.
- Existing search, status filter, pagination, and empty/loading/error states are preserved.
- Existing detail and Pegawai revision route targets are preserved.
- Revision routing still uses only `status === 'NEED_REVISION' && revision_target === 'USER'`.
- No submit, revisi, resubmit, approve, reject, workflow, or status behavior was changed.

## 9. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helpers were modified.
- No request/response contracts were changed.
- No workflow/status semantics were changed.

## 10. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/cross-role-list-parity-source.test.ts`
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

1. Open `/pegawai/dokumen`.
2. Compare with the prototype screenshot.
3. Confirm table no longer feels raw, full-width, or cheap.
4. Confirm header is simpler and more elegant.
5. Confirm search/filter panel is clean and not bulky.
6. Confirm status badges look refined.
7. Confirm Pegawai-actionable revision rows show `Perlu Revisi`.
8. Confirm PPK-targeted revision rows show `Dikembalikan ke PPK` and open detail, not Pegawai revisi.
9. Confirm row/detail navigation still works.
10. Confirm search/filter still works.
11. Confirm 390px mobile cards are readable and have no horizontal overflow.
12. Confirm no PPK/PPSPM pages changed in this phase.

## 12. Deferred Items

- Browser/manual QA remains pending.
- Broader PPK/PPSPM table polish remains outside Phase 15L.3A.1.
- A shared refined list/table primitive can be considered later if Phase 15N consolidates repeated patterns.

## 13. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
