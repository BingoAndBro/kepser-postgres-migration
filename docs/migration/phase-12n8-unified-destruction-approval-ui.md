# Phase 12N.8 - Unified Destruction Approval UI Implementation

Date: 2026-05-25

Status: implemented for review. This phase exposes the existing unified `approve_destruction` API action in the unified archive detail UI with explicit destructive confirmation.

Copy note after 12N.8b:

- Phase 12N.8b hardens lifecycle confirmation copy only. The destructive warning now explicitly says `DIMUSNAHKAN` cannot be returned through the current feature, preview/download will be blocked, authorized metadata remains visible, physical file deletion is not implemented yet, and physical deletion/storage cleanup is a separate future phase.
- The 12N.8 API request body, exact phrase requirement, success refetch behavior, no-audit limitation, and no-physical-deletion boundary remain unchanged.

## 1. Scope And Boundary

Phase 12N.8 updates only the unified archive detail page:

```text
/arsiparis/arsip/$id
```

It adds UI access to the existing API action:

```text
POST /api/arsiparis/arsip/$id/lifecycle
approve_destruction
```

The API remains the authorization and mutation authority. Client-side visibility is a UX guard only.

This phase does not modify lifecycle API behavior, file-access helpers, unified list pages, legacy proposal routes, schema, migrations, package files, route generation, storage, cleanup, or database seed/data scripts.

## 2. Button Visibility Rules

The `Aksi Lifecycle` section remains below `Lampiran Arsip`.

| Status | UI behavior |
|---|---|
| `AKTIF` | Show only `Pindahkan ke Inaktif` |
| `INAKTIF` | Show only `Pindahkan ke Usul Musnah` |
| `USUL_MUSNAH` | Show danger-styled `Musnahkan Arsip` |
| `DIMUSNAHKAN` | Show no lifecycle action button |
| unknown/missing | Show no lifecycle action button |

`Musnahkan Arsip` is visually separated from non-destructive actions with error/danger styling and warning copy.

## 3. Destructive Confirmation UX

`Musnahkan Arsip` does not use `window.confirm`.

The trigger opens an explicit inline confirmation panel requiring:

- exact confirmation phrase:

```text
SETUJUI PEMUSNAHAN ARSIP
```

- trimmed non-empty reason.

The final submit button is disabled until the exact phrase and a non-empty trimmed reason are present and no request is pending.

Warning copy states:

- Arsip akan berubah menjadi `DIMUSNAHKAN`.
- Preview dan download file akan diblokir.
- File fisik tidak dihapus oleh aksi ini.
- Metadata arsip tetap dapat dilihat oleh pengguna berwenang.
- Audit khusus belum ditulis di fase ini; ini limitation development/local-LAN.

## 4. API Request Behavior

Final confirmation sends only:

```json
{
  "action": "approve_destruction",
  "confirmation": "SETUJUI PEMUSNAHAN ARSIP",
  "reason": "<trimmed reason>"
}
```

The UI does not send file ids, paths, storage references, proposal ids, raw rows, attachment metadata, tokens, signed token internals, session/cookie values, physical storage paths, or storage roots.

The request uses the same `apiFetch` pattern as existing lifecycle actions and relies on same-origin cookie behavior. Server-side `dms_session`, same-origin validation, strict body validation, and assigned `KEPALA_SUB_BAGIAN_UMUM` RBAC remain authoritative.

## 5. Success And Refetch Behavior

After successful `approve_destruction`:

- the browser stays on `/arsiparis/arsip/$id`;
- detail metadata is refetched;
- the confirmation panel closes;
- phrase and reason inputs are cleared;
- a safe success message is shown;
- status is expected to become `DIMUSNAHKAN`;
- lifecycle buttons disappear after refetch;
- preview/download actions are hidden by existing detail/file availability behavior;
- authorized metadata remains visible.

The destruction success path does not redirect to `/arsiparis/usul-musnah`.

Existing non-destructive success redirects are preserved:

- `mark_inactive` -> `/arsiparis/inaktif`;
- `propose_destruction` -> `/arsiparis/usul-musnah`.

## 6. Error Behavior

On failure, the UI:

- stays on the detail page;
- keeps the destructive confirmation panel open when applicable;
- shows safe `response.error` text when available;
- falls back to safe generic text for network/general failures;
- resets pending state;
- does not expose raw responses, stacks, paths, storage roots, SQL, env values, tokens, raw DB rows, raw attachment metadata, session/cookie values, or secrets.

Expected safe failures:

- `400` for wrong confirmation, blank reason, malformed body, or extra fields;
- `403` for unauthorized/non-Kasubag/ADMIN-only contexts;
- `409` for non-`USUL_MUSNAH`, stale status conflict, already destroyed archive, or Manual Archive source drift;
- network/general failure with generic safe text.

## 7. No File Deletion And No Audit Limitation

Phase 12N.8 exposes status-based destruction approval only:

```text
USUL_MUSNAH -> DIMUSNAHKAN
```

It does not:

- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- write `dokumen.log_aktivitas`;
- write archive-native audit rows;
- write legacy proposal decision rows.

No-audit remains an accepted development/local-LAN limitation inherited from Phase 12N.5.

## 8. Intentionally Not Changed

This phase does not:

- modify lifecycle API route behavior;
- modify file access helpers;
- modify unified list pages;
- implement `cancel_proposal`;
- implement `restore_active`;
- implement any transition out of `DIMUSNAHKAN`;
- modify legacy proposal routes;
- create legacy proposal rows;
- bridge to `arsip_usul_musnah`;
- write audit logs;
- create audit tables;
- delete physical files;
- cleanup storage;
- clear snapshots;
- delete attachment rows;
- change preview/download behavior;
- create migrations;
- modify schema;
- touch `db/`, `drizzle/`, or `supabase/`;
- modify `package.json` or `pnpm-lock.yaml`;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run broad build/E2E;
- run DB migrations/seeds;
- run cleanup.

## 9. Validation

Required validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
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

No broad build, E2E, DB migrations, seeds, route generation, cleanup, or destructive storage tests are required.

## 10. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for a `USUL_MUSNAH` archive.
3. Confirm `Aksi Lifecycle` appears below `Lampiran Arsip`.
4. Confirm `Musnahkan Arsip` appears only for `USUL_MUSNAH`.
5. Open the destructive confirmation panel.
6. Confirm submit is disabled until exact phrase and non-empty reason are entered.
7. Enter wrong phrase; expected submit remains disabled or API returns `400` if forced.
8. Enter exact phrase:

```text
SETUJUI PEMUSNAHAN ARSIP
```

9. Enter reason.
10. Submit.
11. Expected: API succeeds, UI stays on detail, refetches metadata, status becomes `DIMUSNAHKAN`.
12. Confirm no lifecycle buttons remain.
13. Confirm preview/download buttons are hidden.
14. Try stale preview/download URL if available; expected `410`.
15. Confirm metadata remains visible.
16. Confirm no physical files are deleted.
17. Confirm `lampiran_snapshot` remains intact.
18. Confirm no path/token/storage root/SQL/env/secrets appears in UI errors.
19. Login as `ADMIN`-only if test account exists; expected API remains `403` even if UI is manipulated.

## 11. Next Phase Recommendation

Recommended next phase:

```text
Phase 12N.9 - Archive-native destruction audit planning
```

Suggested boundary:

- documentation-first audit storage policy;
- decide whether audit belongs in a new archive-native audit table;
- include canonical archive id, source type, actor, previous status, next status, reason, confirmation evidence, and timestamp;
- no file deletion;
- no storage cleanup;
- no legacy proposal route mutation unless separately approved.
