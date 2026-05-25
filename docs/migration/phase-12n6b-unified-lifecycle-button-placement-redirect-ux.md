# Phase 12N.6b - Unified Lifecycle Button Placement And Redirect UX

Date: 2026-05-25

Status: implemented for review. This phase refines the existing non-destructive lifecycle UI only.

Planning note after 12N.7:

- Phase 12N.7 keeps this runtime behavior unchanged and only documents a future `Musnahkan Arsip` UI policy for `USUL_MUSNAH` after separate human approval.

Implementation note after 12N.8:

- Phase 12N.8 keeps `Aksi Lifecycle` below `Lampiran Arsip`. Non-destructive redirects remain unchanged, while successful `approve_destruction` stays on detail and refetches metadata into the `DIMUSNAHKAN` state.

## 1. Scope And Boundary

Phase 12N.6b updates only the unified archive detail page UX:

```text
/arsiparis/arsip/$id
```

The existing lifecycle API remains unchanged:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

This phase does not change lifecycle API behavior, file access, schema, migrations, route generation, legacy proposal routes, storage, audit, or archive data.

## 2. Human UX Feedback

Human feedback for this phase:

- The `Aksi Lifecycle` section should appear at the bottom of the unified archive detail page, below `Lampiran Arsip`.
- After successful lifecycle movement, the browser should navigate to the relevant archive list because the archive no longer belongs to its previous lifecycle context.

## 3. Placement Change

`Aksi Lifecycle` now renders below `Lampiran Arsip` in the unified archive detail page.

The section remains the final detail content section and keeps the same visual style as the Phase 12N.6 implementation.

## 4. Redirect Behavior

After successful `mark_inactive`:

```text
/arsiparis/inaktif
```

After successful `propose_destruction`:

```text
/arsiparis/usul-musnah
```

The page uses TanStack Router navigation. Failed API calls stay on the detail page and show the existing safe inline error message.

## 5. Unchanged Status Visibility Rules

Visibility remains unchanged:

| Status | UI behavior |
|---|---|
| `AKTIF` | Shows only `Pindahkan ke Inaktif` |
| `INAKTIF` | Shows only `Pindahkan ke Usul Musnah` |
| `USUL_MUSNAH` | Shows no destructive button; displays safe note that destruction approval is not exposed in this UI phase |
| `DIMUSNAHKAN` | Shows no lifecycle button |
| unknown/missing | Shows no lifecycle button |

The UI still sends only:

```json
{ "action": "mark_inactive" }
```

or:

```json
{ "action": "propose_destruction" }
```

It does not send `approve_destruction` or a destructive confirmation phrase.

## 6. What Is Intentionally Not Changed

This phase does not:

- add `approve_destruction` UI;
- add a `Musnahkan` button;
- implement `cancel_proposal`;
- implement `restore_active`;
- modify lifecycle API route behavior;
- modify file access helpers;
- modify unified list pages;
- change preview/download behavior;
- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- write audit logs;
- modify legacy proposal routes;
- create migrations;
- modify schema;
- touch `db/`, `drizzle/`, or `supabase/`;
- modify package files;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run broad build/E2E;
- run DB migrations/seeds;
- run cleanup.

## 7. Validation

Required validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
```

Required protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

No broad build, E2E, migrations, seeds, route generation, cleanup, or live DB report is required.

## 8. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for an `AKTIF` archive.
3. Confirm `Aksi Lifecycle` appears below `Lampiran Arsip`.
4. Click `Pindahkan ke Inaktif` and confirm.
5. Expected: API succeeds and browser redirects to `/arsiparis/inaktif`.
6. Open unified detail for an `INAKTIF` archive.
7. Confirm `Aksi Lifecycle` appears below `Lampiran Arsip`.
8. Click `Pindahkan ke Usul Musnah` and confirm.
9. Expected: API succeeds and browser redirects to `/arsiparis/usul-musnah`.
10. Confirm no `Musnahkan` or `approve_destruction` UI exists.
11. Confirm `DIMUSNAHKAN` has no lifecycle button.
12. Confirm no file deletion, preview/download changes, or path/token/storage leaks.

## 9. Next Phase Note

Future destructive UI should remain in the bottom `Aksi Lifecycle` section, below `Lampiran Arsip`, but only after a separate approved implementation phase. Phase 12N.7 is planning-only and does not add the button.
