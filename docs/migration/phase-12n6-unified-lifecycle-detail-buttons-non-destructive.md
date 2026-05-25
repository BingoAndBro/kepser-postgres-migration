# Phase 12N.6 - Unified Lifecycle Detail Buttons For Non-Destructive Actions

Date: 2026-05-25

Status: implemented for review. This phase adds non-destructive lifecycle action buttons to the unified archive detail page only.

Implementation note after 12N.6b:

- Phase 12N.6b moves the `Aksi Lifecycle` section below `Lampiran Arsip`.
- After successful `mark_inactive`, the page redirects to `/arsiparis/inaktif`.
- After successful `propose_destruction`, the page redirects to `/arsiparis/usul-musnah`.
- Destructive UI remains out of scope.

## 1. Scope And Boundary

Phase 12N.6 updates:

```text
/arsiparis/arsip/$id
```

The page now exposes UI buttons for existing non-destructive unified lifecycle API actions:

- `mark_inactive`
- `propose_destruction`

The existing API route remains the authority:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

This phase does not modify the lifecycle API route, file-access helpers, list pages, legacy proposal routes, schema, migrations, route generation, package files, storage files, or database rows.

## 2. Human Domain Clarification

Human clarification accepted for this phase:

- `KEPALA_SUB_BAGIAN_UMUM` may manually move an archive from `AKTIF` to `INAKTIF`.
- `KEPALA_SUB_BAGIAN_UMUM` may manually move an archive from `INAKTIF` to `USUL_MUSNAH`.
- Manual movement does not have to wait for an automatic retention scheduler because operational exceptions can exist.
- UI buttons are needed on the unified archive detail page.

Client-side visibility is convenience only. The server API still enforces `dms_session`, same-origin protection, and assigned `KEPALA_SUB_BAGIAN_UMUM`.

## 3. Buttons Added

New detail section:

```text
Aksi Lifecycle
```

Buttons:

- `Pindahkan ke Inaktif`
- `Pindahkan ke Usul Musnah`

No `Musnahkan` or `approve_destruction` UI button is added in this phase.

## 4. Status Visibility Rules

Visibility uses the safe unified detail DTO status value:

| Status | UI behavior |
|---|---|
| `AKTIF` | Shows only `Pindahkan ke Inaktif` |
| `INAKTIF` | Shows only `Pindahkan ke Usul Musnah` |
| `USUL_MUSNAH` | Shows no destructive button; displays safe note that destruction approval is not exposed in this UI phase |
| `DIMUSNAHKAN` | Shows no lifecycle button |
| unknown/missing | Shows no lifecycle button |

## 5. API Calls Used

For `AKTIF`:

```json
{
  "action": "mark_inactive"
}
```

For `INAKTIF`:

```json
{
  "action": "propose_destruction"
}
```

Both calls use:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

The browser call is same-origin and uses the existing local session cookie behavior.

After success, the page refreshes detail data so the new status is visible.

## 6. Confirmation Behavior

Before `mark_inactive`, the page asks:

```text
Pindahkan arsip ini ke status Inaktif?
```

Before `propose_destruction`, the page asks:

```text
Ajukan arsip ini ke Usul Musnah?
```

The destructive confirmation phrase from 12N.5 is not used because this phase does not expose actual destruction approval in UI.

Pending requests disable the action button to prevent double-submit.

Failures display safe API error text when available. The UI does not expose raw responses, stack traces, paths, SQL, env values, tokens, storage roots, raw DB rows, or raw attachment metadata.

## 7. What Is Intentionally Not Changed

This phase does not:

- add `approve_destruction` UI;
- add a `Musnahkan` button;
- implement `cancel_proposal`;
- implement `restore_active`;
- modify lifecycle API route behavior;
- modify file access helpers;
- modify unified list pages;
- add lifecycle buttons to list pages;
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

## 8. Validation

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

No broad build, E2E, migrations, seeds, route generation, cleanup, or live DB report is required for this UI-only phase.

## 9. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for an `AKTIF` archive.
3. Confirm button `Pindahkan ke Inaktif` appears.
4. Click it and confirm the action.
5. Expected: API succeeds and status becomes `INAKTIF`.
6. Confirm no file is deleted and preview/download still works.
7. Open unified detail for an `INAKTIF` archive.
8. Confirm button `Pindahkan ke Usul Musnah` appears.
9. Click it and confirm the action.
10. Expected: API succeeds and status becomes `USUL_MUSNAH`.
11. Confirm no file is deleted and preview/download still works.
12. Open unified detail for a `USUL_MUSNAH` archive.
13. Confirm no `Musnahkan` button appears in this phase.
14. Open a `DIMUSNAHKAN` archive.
15. Confirm no lifecycle button appears and file buttons remain hidden.
16. Login as `ADMIN`-only if a test account exists.
17. Expected: API remains `403` even if UI is manipulated.

Also confirm no path, token, storage root, SQL, env value, secret, raw row, or raw attachment metadata appears in visible UI errors.

## 10. Next Phase Recommendation

Recommended next phase:

```text
Phase 12N.7 - Unified lifecycle UI for destruction approval only if separately approved
```

Suggested boundary:

- expose `approve_destruction` only after human review of 12N.5 API behavior and 12N.6 non-destructive UI behavior;
- require explicit destructive confirmation phrase;
- keep server/API authorization authoritative;
- no physical file deletion;
- no snapshot clearing;
- no legacy proposal route changes unless separately approved;
- consider archive-native audit before adding destructive UI.
