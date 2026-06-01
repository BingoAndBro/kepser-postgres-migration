# Phase 12N.7 - Unified Destruction Approval UI Plan

Date: 2026-05-25

Status: planned policy and implementation plan. This phase is documentation-only and does not expose a `Musnahkan` UI action.

Implementation note after 12N.8:

- Phase 12N.8 implements this approved plan by exposing `Musnahkan Arsip` only for `USUL_MUSNAH`, requiring exact phrase `SETUJUI PEMUSNAHAN ARSIP` and a trimmed non-empty reason, staying on detail after success, and refetching metadata into the `DIMUSNAHKAN` state.
- Phase 12N.8 keeps file deletion, snapshot clearing, audit writes, legacy proposal route changes, schema changes, migrations, route generation, and storage cleanup out of scope.

## 1. Scope And Boundary

Phase 12N.7 defines the future UI policy for exposing the existing API-only destructive lifecycle action:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

Future action:

```text
approve_destruction
```

The future UI target is the unified archive detail page:

```text
/arsiparis/arsip/$id
```

This phase does not implement the button, modal, route behavior, file-access changes, schema changes, migrations, storage cleanup, audit writes, list changes, route generation, or tests. It only records the policy and future implementation checklist.

Security boundary reminders:

- `dms_session` remains the authentication boundary.
- `dms_active_role` is UX-only and must not authorize destructive mutation.
- Server/API RBAC remains authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` is the operational archive lifecycle role.
- `ADMIN` remains dedicated system/admin access and must not perform operational archive destruction approval by inheritance.
- Active Supabase runtime/package dependency is retired; historical Supabase artifacts remain.

## 2. Current API Status

Phase 12N.5 already adds API-only canonical `approve_destruction` support:

```text
USUL_MUSNAH -> DIMUSNAHKAN
```

Current accepted API behavior:

- route id is canonical `arsip.arsip.id`;
- request is protected by centralized same-origin validation;
- request requires a valid local `dms_session`;
- request requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- `ADMIN`-only and non-Kasubag sessions are rejected;
- request body is strict Zod-validated;
- confirmation phrase must exactly match `SETUJUI PEMUSNAHAN ARSIP`;
- `reason` is required and must be non-empty after trimming;
- WORKFLOW archives update canonical status only;
- linked MANUAL archives update canonical and source status in one guarded transaction;
- no audit row is written;
- no physical file deletion is performed;
- no `lampiran_snapshot` clearing is performed;
- no `manual_arsip_attachment` row is deleted;
- no legacy proposal route is changed.

Phase 12N.6 and 12N.6b expose only non-destructive UI actions:

- `AKTIF -> INAKTIF` through `mark_inactive`;
- `INAKTIF -> USUL_MUSNAH` through `propose_destruction`;
- the `Aksi Lifecycle` section appears below `Lampiran Arsip`;
- no `approve_destruction` or `Musnahkan` UI is exposed.

## 3. Button Visibility Policy

Future visibility policy:

| Status | Future UI behavior |
|---|---|
| `AKTIF` | Show only `Pindahkan ke Inaktif` |
| `INAKTIF` | Show only `Pindahkan ke Usul Musnah` |
| `USUL_MUSNAH` | May show destructive button `Musnahkan Arsip` only after a human-approved implementation phase |
| `DIMUSNAHKAN` | Show no lifecycle action button |
| unknown/missing | Show no lifecycle action button |

For Phase 12N.7 itself:

- do not add `Musnahkan Arsip`;
- do not send `approve_destruction` from the browser;
- keep the existing `USUL_MUSNAH` note that destructive approval is not exposed in this UI phase.

Client-side visibility is only a UX guard. The API must still reject unauthorized, malformed, stale, or invalid status requests.

## 4. Destructive UI Placement

Recommended placement for a future approved implementation:

- render inside the existing `Aksi Lifecycle` section;
- keep the section at the bottom of the unified detail page, below `Lampiran Arsip`;
- show the destructive action only for `USUL_MUSNAH`;
- use a visually distinct danger style separate from non-destructive lifecycle buttons;
- include warning text before submission.

The warning text must make clear:

- the action changes archive status to `DIMUSNAHKAN`;
- preview/download/file access will be blocked;
- physical files are not deleted by this action;
- metadata remains visible to authorized users;
- no dedicated archive audit is written in the current development/local-LAN limitation.

The UI must not imply:

- physical file deletion;
- storage cleanup;
- snapshot clearing;
- audit write completion;
- legacy proposal approval;
- transition out of `DIMUSNAHKAN`.

## 5. Confirmation UX

Future destructive approval must not be one-click.

Required behavior:

- use a modal/dialog or explicit inline confirmation panel;
- require the user to type the exact phrase:

```text
SETUJUI PEMUSNAHAN ARSIP
```

- require a reason textarea/input;
- trim the reason before submit;
- block blank or whitespace-only reason;
- disable final submit until the confirmation phrase and trimmed reason are valid;
- use an explicit final submit label, for example:

```text
Konfirmasi Pemusnahan Arsip
```

Recommended warning copy:

```text
Arsip akan berubah menjadi DIMUSNAHKAN.
File preview/download akan diblokir.
File fisik tidak dihapus oleh aksi ini.
Metadata arsip tetap dapat dilihat oleh pengguna berwenang.
Audit khusus belum ditulis di fase ini; ini limitation development/local-LAN.
```

The UI should keep the original `Musnahkan Arsip` trigger separate from the final confirmation submit. The trigger opens the confirmation surface; only the final confirmation submit sends the API request.

## 6. API Request Plan

Future UI should call:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

Request body:

```json
{
  "action": "approve_destruction",
  "confirmation": "SETUJUI PEMUSNAHAN ARSIP",
  "reason": "<trimmed reason>"
}
```

No extra fields are allowed or needed.

Do not send:

- file ids;
- paths;
- storage refs;
- proposal ids;
- raw rows;
- attachment metadata;
- file tokens;
- signed token internals;
- session or cookie values;
- physical storage paths or roots.

The browser request should rely on same-origin cookie behavior. Authorization remains server-side and must not trust `dms_active_role`.

## 7. Success Behavior Recommendation

Redirecting to `/arsiparis/usul-musnah` after success is not ideal because a destroyed archive no longer belongs to the Usul Musnah lifecycle list.

Recommended future behavior:

- if a dedicated `/arsiparis/dimusnahkan` list exists, redirect there after success;
- if no destroyed list exists, stay on the unified detail page, refetch metadata, and show the `DIMUSNAHKAN` metadata-only state.

Because no destroyed list is guaranteed today, the recommended 12N.8 implementation should:

- stay on `/arsiparis/arsip/$id`;
- refetch detail after success;
- show status `DIMUSNAHKAN`;
- hide file preview/download actions;
- show a safe success message that does not mention file deletion or audit completion.

## 8. File Action Expectations

After successful destruction approval:

- preview/download buttons must disappear from unified detail UI;
- stale preview/download URLs must return safe `410` responses server-side;
- no file bytes must be returned for stale destroyed file actions;
- physical files must not be deleted;
- storage cleanup must not run;
- `lampiran_snapshot` must not be cleared;
- `manual_arsip_attachment` rows must remain;
- authorized metadata detail may remain visible.

UI hiding is not sufficient. Server-side file access must continue to revalidate current canonical/source lifecycle state.

## 9. Error Behavior

Future UI should:

- display safe text from `response.error` when present;
- keep the user on the detail page on failure;
- preserve entered reason and confirmation where reasonable after a validation error;
- reset pending state after failure;
- avoid exposing raw responses, stack traces, paths, storage roots, SQL, env values, tokens, raw rows, raw attachment metadata, session/cookie values, or secrets.

Expected failures:

| Status | Scenario | Future UI behavior |
|---:|---|---|
| `400` | wrong confirmation, blank reason, malformed body, extra fields | show safe validation error and keep confirmation open |
| `403` | unauthenticated role context, non-Kasubag, or `ADMIN`-only operational denial | show safe access-denied message and keep user on detail |
| `409` | archive no longer `USUL_MUSNAH`, already `DIMUSNAHKAN`, guarded update conflict, or MANUAL source drift | show conflict message and recommend reload |
| `410` | user opens old preview/download URL separately after destruction | file action fails closed with no bytes |

The UI should refetch detail after a `409` only if that does not mask the failure message.

## 10. Manual Retest Plan

For a future approved implementation:

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for an `AKTIF` archive. Expected: only `Pindahkan ke Inaktif` appears.
3. Open unified detail for an `INAKTIF` archive. Expected: only `Pindahkan ke Usul Musnah` appears.
4. Open unified detail for a `USUL_MUSNAH` archive. Expected: `Musnahkan Arsip` appears only if the approved implementation phase adds it.
5. Open unified detail for a `DIMUSNAHKAN` archive. Expected: no lifecycle action button appears.
6. Try wrong confirmation. Expected: button remains disabled or request returns safe `400`.
7. Try blank or whitespace-only reason. Expected: blocked before submit or safe `400`.
8. Submit exact confirmation and valid trimmed reason. Expected: API succeeds.
9. Confirm status becomes `DIMUSNAHKAN`.
10. Confirm preview/download buttons are hidden after detail refresh.
11. Open stale preview URL separately. Expected: safe `410`, no file bytes.
12. Open stale download URL separately. Expected: safe `410`, no file bytes.
13. Confirm authorized metadata remains visible.
14. Confirm physical file remains on storage.
15. Confirm `lampiran_snapshot` remains.
16. Confirm `manual_arsip_attachment` rows remain for linked MANUAL archives.
17. Login as `ADMIN`-only if a test account exists. Expected: API returns `403`; UI must not grant operational action by admin role.
18. Confirm no path, token, storage root, SQL, env value, secret, raw row, or raw attachment metadata appears in UI or API errors.

## 11. What Is Intentionally Not Changed

This phase does not:

- add `approve_destruction` UI;
- add a `Musnahkan` button;
- modify unified detail runtime behavior;
- modify lifecycle API route behavior;
- modify file access helpers;
- implement `cancel_proposal`;
- implement `restore_active`;
- implement any transition out of `DIMUSNAHKAN`;
- modify unified list pages;
- modify legacy proposal routes;
- write audit logs;
- create audit tables;
- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- change preview/download behavior;
- create migrations;
- modify schema;
- touch `db/`, `drizzle/`, or `supabase/`;
- modify package files;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run broad build/E2E;
- run DB migrations/seeds;
- run cleanup.

## 12. Validation

Required validation for this documentation-only phase:

```bash
git diff --check
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

Tests are optional for 12N.7 because no runtime source behavior changes. Do not run broad build, E2E, DB migrations, seeds, route generation, cleanup, or destructive tests for this phase.

## 13. Next Phase Recommendation

Recommended next phase:

```text
Phase 12N.8 - Unified Destruction Approval UI Implementation
```

Suggested boundary:

- add `Musnahkan Arsip` only on unified detail for `USUL_MUSNAH`;
- require typed phrase `SETUJUI PEMUSNAHAN ARSIP`;
- require trimmed non-empty reason;
- send only the strict API body documented above;
- keep server/API authorization authoritative;
- stay on detail and refetch into `DIMUSNAHKAN` state unless a dedicated destroyed list exists;
- hide file actions after success;
- preserve stale file-action `410` behavior;
- do not delete files;
- do not clear snapshots;
- do not write audit rows unless an archive-native audit phase is separately approved;
- do not change legacy proposal routes.
