# Phase 12N.11b - Legacy Proposal Route Removal And Redirect Cleanup

Date: 2026-05-25

Status: implemented for review. This phase removes obsolete legacy archive lifecycle route surfaces that were replaced by unified canonical archive detail and lifecycle behavior.

## 1. Scope And Boundary

Phase 12N.11b is a bounded runtime risk-reduction phase.

In scope:

- delete obsolete legacy mutation routes for archive lifecycle movement and proposal approval;
- delete obsolete status-specific detail pages and detail APIs after reference audit confirmed current list pages use unified canonical detail;
- regenerate `src/routeTree.gen.ts` from TanStack route files;
- document the boundary and manual retest path.

Out of scope:

- no list page deletion;
- no read-only unified list API deletion;
- no unified lifecycle API behavior change;
- no physical file deletion;
- no `lampiran_snapshot` clearing;
- no attachment row deletion;
- no archive, Manual Archive, workflow, or proposal row deletion;
- no audit schema/table or audit writes;
- no migrations, Drizzle schema changes, package changes, seed changes, or cleanup.

## 2. Human-Approved Reason For Deleting Instead Of Disabling

The human explicitly approved closing the runtime risk from old legacy proposal/workflow lifecycle routes before Phase 12O and preferred deleting unused dangerous legacy code instead of only disabling it.

Reason:

- old proposal approval was proposal-id based, not canonical archive-id based;
- old behavior was WORKFLOW-oriented and did not sync linked Manual Archive source status;
- old destructive approval directly deleted files and cleared archive snapshot metadata;
- keeping dead route code would preserve a high-risk runtime surface and dirty/dead code structure.

Routes were removed because unified canonical lifecycle replaced them, not because archive lifecycle was removed.

## 3. Files And Routes Removed

Deleted runtime route files:

- `src/routes/api/arsiparis/usul-musnah.$id.ts`
- `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts`
- `src/routes/api/arsiparis/aktif.$id/pindahkan.ts`
- `src/routes/arsiparis/aktif/$id.tsx`
- `src/routes/api/arsiparis/aktif.$id.ts`
- `src/routes/arsiparis/inaktif/$id.tsx`
- `src/routes/api/arsiparis/inaktif.$id.ts`
- `src/routes/arsiparis/usul-musnah/$id.tsx`

Removed route surfaces:

- `PATCH /api/arsiparis/usul-musnah/$id`
- `GET /api/arsiparis/usul-musnah/$id`
- `POST /api/arsiparis/inaktif/$id/musnahkan`
- `POST /api/arsiparis/aktif/$id/pindahkan`
- `GET /api/arsiparis/inaktif/$id`
- `GET /api/arsiparis/aktif/$id`
- `/arsiparis/usul-musnah/$id`
- `/arsiparis/inaktif/$id`
- `/arsiparis/aktif/$id`

## 4. References Audited

Audited before deletion:

- old UI paths: `/arsiparis/aktif/$id`, `/arsiparis/inaktif/$id`, `/arsiparis/usul-musnah/$id`;
- old API paths: `/api/arsiparis/aktif`, `/api/arsiparis/inaktif`, `/api/arsiparis/usul-musnah`;
- old action terms: `pindahkan`, `musnahkan`, `SETUJUI`;
- old proposal table references: `arsip_usul_musnah`;
- old snapshot clearing reference: `lampiranSnapshot: []`;
- physical deletion references: `unlink`, `delete`.

Reference result:

- current list pages link row actions to `/arsiparis/arsip/$id` using canonical archive IDs;
- active source references to deleted old routes were limited to the deleted files and generated route tree registrations;
- remaining references are historical docs/specs, schema/table definitions, unified behavior, tests for unified behavior, or retained safe list routes.

## 5. RouteTree Generation Note

`src/routeTree.gen.ts` was regenerated from route files after deletion. It is generated output and was not manually edited.

The generated diff removes registrations for the deleted legacy route files and changes the retained read-only list APIs from route parents with child routes to plain list routes:

- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`

No unrelated route registrations are intentionally changed.

## 6. Unified Replacement Paths

Operators should use:

- unified detail page: `/arsiparis/arsip/$id`;
- unified lifecycle API: `POST /api/arsiparis/arsip/$id/lifecycle`;
- retained list pages: `/arsiparis/aktif`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`;
- retained read-only list APIs: `GET /api/arsiparis/aktif`, `GET /api/arsiparis/inaktif`, `GET /api/arsiparis/usul-musnah`.

Supported unified lifecycle actions remain:

- `mark_inactive`;
- `propose_destruction`;
- `approve_destruction`.

## 7. Runtime Risk Closed

This phase closes the runtime route surface for:

- proposal-id based legacy destruction approval;
- direct file deletion through old proposal approval;
- snapshot clearing through old proposal approval;
- legacy WORKFLOW-only active/inactive movement routes;
- legacy detail pages that used workflow preview paths instead of unified source-aware archive file actions.

Old URLs should now return router/framework not-found or other safe router behavior, not old destructive behavior.

## 8. What Is Intentionally Not Changed

This phase does not:

- change unified lifecycle route behavior;
- wire physical deletion helper to legacy routes;
- wire physical deletion helper to `approve_destruction`;
- delete files;
- clear `lampiran_snapshot`;
- delete attachment metadata rows;
- delete archive/manual/workflow/proposal DB rows;
- create migrations;
- modify Drizzle schema;
- modify package files;
- modify env files;
- touch `db/`, `drizzle/`, or `supabase/`;
- add redirect logic for proposal IDs;
- create audit tables or audit rows.

## 9. Validation

Implemented validation:

- preflight `git status --short --branch`;
- targeted reference audit with `git grep`;
- generated route tree diff review;
- protected diff checks for excluded paths;
- focused tests listed below.

Focused tests:

```bash
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
pnpm test tests/unit/arsiparis/unified-archive-physical-destruction.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
```

## 10. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/aktif`, `/arsiparis/inaktif`, and `/arsiparis/usul-musnah`.
3. Confirm list pages load.
4. Click `Detail` from each list where data exists.
5. Expected: opens `/arsiparis/arsip/$id`.
6. Confirm unified lifecycle buttons still work for `AKTIF -> INAKTIF`, `INAKTIF -> USUL_MUSNAH`, and `USUL_MUSNAH -> DIMUSNAHKAN`.
7. Try old URLs if known: `/arsiparis/aktif/$id`, `/arsiparis/inaktif/$id`, and `/arsiparis/usul-musnah/$proposalId`.
8. Expected: route not found or safe router behavior, not old destructive behavior.
9. Try old API URLs if known: `/api/arsiparis/aktif/$id/pindahkan`, `/api/arsiparis/inaktif/$id/musnahkan`, and `/api/arsiparis/usul-musnah/$proposalId`.
10. Expected: route not found, 404, or safe framework response, not mutation.
11. Confirm no physical files are deleted by old routes.
12. Confirm no path, token, storage root, SQL, env value, session/cookie value, or secret appears.

## 11. Next Roadmap Item

Proceed to:

```text
Phase 12O
```

Keep future physical deletion and archive-native audit as separate human-approved work. Do not reintroduce the removed legacy proposal route surfaces.
