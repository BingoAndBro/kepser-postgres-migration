# Phase 6D.9 Controlled Raw Preview Enablement Strategy

Date: 2026-05-15.

## 1. Phase Scope

Phase 6D.9 is documentation and planning only. It defines when selected raw-preview callers may later opt into the already-existing internal raw preview URL path.

No runtime behavior is changed in this phase. No UI caller is changed, no endpoint default is changed, and no storage lifecycle behavior is implemented.

`useInternal=true` remains opt-in only:

```text
GET /api/dokumen/preview-url?url=<logicalPath>&useInternal=true
```

The default raw preview request remains Supabase-backed:

```text
GET /api/dokumen/preview-url?url=<logicalPath>
```

## 2. Current Verified Capability

Phase 6D.8 verified the opt-in raw logical-path preview path at focused unit/service level.

The verified capability is limited to:

- `GET /api/dokumen/preview-url?url=<logicalPath>&useInternal=true` can return the existing compatible response shape `{ signedUrl, filename }`.
- In the opt-in path, `signedUrl` points to the internal access route shape `/api/files/access?token=<opaque-token>`.
- `/api/files/access` and `handleInternalFileAccessRequest(...)` can return local file content for raw logical-path tokens.
- Local file content is returned only when a matching local file exists for the same logical path.
- Access is allowed only after token validation, local session presence, logical path validation, root containment resolution, and raw owner-or-role compatibility checks pass.
- Raw owner access is based on the logical path owner segment matching the local session user id.
- Raw role compatibility currently allows `PPK`, `BENDAHARA`, and `ARSIPARIS`, matching the existing raw-path compatibility model.

This does not prove availability for existing Supabase Storage files. The local filesystem storage target starts empty, and no Supabase Storage migration, copy, download, backfill, or sync is allowed or assumed.

## 3. Caller Surface Inventory

### `src/lib/storage-client.ts`

- Calls raw preview directly through `fetch('/api/dokumen/preview-url?url=...')`.
- `getSignedUrlDirect()` and its alias `getSignedUrl` are preview-url helpers that currently do not pass `useInternal=true`.
- `downloadWithSignedUrl()` fetches the returned URL and saves a blob with a caller-provided filename.
- `downloadFromApi()` is download-related but consumes role/document endpoint JSON, not the raw preview endpoint.
- Current status: must remain Supabase-backed for now because this helper is shared by multiple UI surfaces and local upload/move lifecycle is not implemented.
- Later candidate: yes, but only as a controlled helper-level prototype behind an explicit developer/local-only opt-in. It must preserve default Supabase behavior unless fallback policy is explicitly changed and tested.

### `src/components/dokumen/AttachmentEditor.tsx`

- Calls raw preview through `getSignedUrl(lamp.url)` for preview.
- Uses the same raw preview helper plus `downloadWithSignedUrl(...)` for edit-page downloads.
- This is edit-page and revision/resubmit related.
- It also still performs direct browser Supabase Storage upload/delete for some edit/revision/resubmit flows.
- Current status: must remain Supabase-backed for now.
- Later candidate: preview-only actions may become candidates after either local upload replacement exists or local files are deliberately prepared for manual verification. Download behavior should not be included in raw preview enablement because download endpoint wiring and filename/content-disposition parity remain separate work.

### `src/components/dokumen/AttachmentViewer.tsx`

- For `apiType='default'`, preview calls `getSignedUrl(lamp.url)`, which uses the raw preview endpoint.
- For `apiType='default'`, download also uses the raw preview helper plus `downloadWithSignedUrl(...)`.
- For `apiType='ppk'` and `apiType='bendahara'`, preview/download call role-specific document endpoints, not raw preview.
- This surface is document-viewer related and is used from Pegawai, Arsiparis document detail, PPK, and Bendahara detail pages.
- Current status: must remain Supabase-backed for now.
- Later candidate: only `apiType='default'` preview-only behavior can be considered for a controlled raw-preview prototype. `apiType='ppk'` and `apiType='bendahara'` must remain Supabase-backed until role endpoint migration and document-token authorization exist.

### `src/lib/file-helpers.ts`

- Does not call the raw preview endpoint.
- `getPreviewRoleData()` calls role/document preview endpoints.
- `downloadRoleFile()` calls role/document download endpoints and consumes `{ signedUrl }`.
- This is role/document-viewer related.
- Current status: must remain Supabase-backed for now.
- Later candidate: no for raw-preview enablement. It belongs to later document/role endpoint migration after document-token authorization, role rechecks, archive state checks, and `DIMUSNAHKAN` blocking are implemented.

### Arsiparis Detail Pages

Discovered direct preview callers:

- `src/routes/arsiparis/aktif/$id.tsx`
- `src/routes/arsiparis/inaktif/$id.tsx`
- `src/routes/arsiparis/usul-musnah/$id.tsx`

These pages call the default document preview endpoint:

```text
GET /api/dokumen/{dokumenId}/preview/{index}
```

They do not call raw preview directly. They are archive lifecycle surfaces and depend on archive status semantics.

- Current status: must remain Supabase-backed for now.
- Later candidate: no for raw-preview enablement. These require archive/document token authorization and `DIMUSNAHKAN` checks before any internal streaming can be used.

### Route Tree And Tests

- `src/routeTree.gen.ts` contains generated route references for the existing preview/download/internal access routes, but it is not a caller and must not change in this phase.
- `tests/unit/storage/raw-preview-internal-url-wiring.test.ts` and `tests/unit/storage/raw-preview-internal-url-runtime.test.ts` intentionally exercise `useInternal=true`.
- Test-only use of `useInternal=true` remains acceptable. Production/UI callers must not be changed by this strategy phase.

## 4. Preconditions Before Caller Enablement

No normal caller should use `useInternal=true` until these preconditions are met:

- Local upload replacement exists, or local files are deliberately created for a narrow manual/runtime verification scenario.
- Local file paths match the stored logical paths in `lampiran_urls.url`.
- The local storage lifecycle is understood for files created by the app, including upload, replacement, and eventual move to formal paths.
- Fallback behavior is defined before the caller changes.
- Missing-local-file error UX is understood and accepted for the selected caller surface.
- No production caller is switched without manual verification using an authenticated browser session.
- No caller assumes Supabase Storage files already exist locally.
- No Supabase Storage migration, copy, download, backfill, or sync is assumed or performed.
- Internal URL use must not become the default until local upload, pending-to-formal move, replacement, and cleanup behavior exist.
- Download behavior must remain separate from raw preview enablement until download endpoint wiring and content-disposition parity are planned and tested.
- Document, role, and archive endpoint callers must wait for document/archive token authorization and `DIMUSNAHKAN` checks.

## 5. Controlled Enablement Options

### Option A: Keep `useInternal=true` Manual/Test-Only

- Lowest risk.
- Current runtime behavior remains unchanged for all UI callers.
- Focused tests and manual requests can still verify the internal path.
- Missing local files do not affect users.

### Option B: Add Developer-Only Caller Opt-In Later

- A later phase could add a developer-only switch in `storage-client` or a single caller.
- It must be explicit and local-only.
- It must not change default behavior for normal users.
- It still risks confusing manual testers if the local filesystem does not contain matching files.

### Option C: Add Selected Caller Opt-In Behind Explicit Local-Only Condition

- A later phase could enable only preview, not download, for a narrow surface such as default `AttachmentViewer` preview.
- It must require an explicit local-only condition and a defined fallback or hard-failure policy.
- It should not include edit/revision upload flows until local upload replacement exists.

### Option D: Make Internal Raw Preview Default After Local Storage Lifecycle Exists

- This should happen only after local upload, pending-to-formal moves, replacement/delete behavior, and relevant manual verification are complete.
- This is not appropriate while local storage starts empty and Supabase Storage remains the reference.

Recommendation: keep `useInternal=true` manual/test-only for now. If a prototype is needed later, use a narrow developer-only caller-level opt-in for preview-only behavior and document it as non-production until local upload replacement exists.

## 6. Fallback Policy

Later runtime enablement must choose one policy before changing callers.

### Supabase Fallback When Local File Missing

- Preserves user behavior for existing documents.
- Hides local-file availability gaps during transition.
- Risks masking broken local upload/move lifecycle if used too broadly.
- Must avoid logging or exposing internal generated URLs, tokens, physical paths, or Supabase signed URLs.

### Hard Failure For Internal Path

- Makes missing local files visible immediately.
- Safer for verifying local storage correctness.
- Causes user-visible preview failures if applied to normal callers before local files are reliably present.

### Hybrid Only In Development Or Manual Testing

- Allows internal-path validation without changing production behavior.
- Can use hard failure in explicit internal mode while default UI remains Supabase-backed.
- Keeps migration failures observable without affecting normal users.

Recommendation: use hybrid development/manual testing first. Keep default Supabase-backed behavior for normal callers. For explicit `useInternal=true`, prefer hard failure rather than silent Supabase fallback so local storage gaps are visible during verification. If a later caller-level prototype needs fallback, document it as a temporary bridge and add tests proving both the internal success path and the default Supabase path.

This policy is not implemented in Phase 6D.9.

## 7. Rollback Criteria

Any later caller-level internal preview enablement should be rolled back immediately if any of these occur:

- Unexpected `404` responses for existing documents.
- Stored DB logical paths do not map to local file paths.
- Preview filename behavior regresses.
- `Content-Disposition` or inline preview behavior regresses.
- Local session or active-role behavior differs from existing auth UX.
- Owner/role authorization differs from current raw preview behavior.
- Any response, log, or UI output exposes a token, internal signed URL, Supabase signed URL, physical filesystem path, storage root, DB URL, env value, secret, session token, token hash, or password hash.
- Preview fails for a normal user path that previously worked through Supabase.
- Any archive lifecycle or destroyed-file behavior becomes ambiguous.
- A UI caller starts using internal preview by default outside the intended local-only condition.

Rollback should remove caller-level opt-in only. The existing opt-in endpoint capability can remain available for tests unless it is the source of the regression.

## 8. Manual Verification Checklist

Use placeholders only. Do not paste real secrets, generated tokens, generated internal signed URLs, Supabase signed URLs, DB URLs, env values, storage roots, or physical filesystem paths into logs or docs.

PowerShell-oriented checklist for a later runtime/manual phase:

1. Prepare a local test file whose relative storage location matches `<logicalPath>` under `<localStorageRoot>`.
2. Confirm `<logicalPath>` is a safe logical storage path and starts with the expected owner segment.
3. Start the app using the normal local development process for that phase.
4. Log in through the browser so the same session has the required auth cookies, including the local session cookie.
5. In the same authenticated browser session, request:

```powershell
Invoke-WebRequest -Uri "http://localhost:<port>/api/dokumen/preview-url?url=<logicalPath>&useInternal=true" -WebSession <sessionCookie>
```

6. Verify the JSON response shape contains `signedUrl` and `filename`.
7. Verify the returned `signedUrl` is an internal API route and does not contain a physical path, storage root, env value, Supabase signed URL, or secret.
8. Use the returned URL only in the same authenticated session.
9. Verify the content response succeeds for a matching local file.
10. Verify response headers include safe no-store and no-sniff behavior.
11. Verify the default request remains Supabase-backed:

```powershell
Invoke-WebRequest -Uri "http://localhost:<port>/api/dokumen/preview-url?url=<logicalPath>" -WebSession <sessionCookie>
```

12. Verify the default response is not an internal `/api/files/access` URL.
13. Remove or rename the local test file and verify explicit internal access fails with a generic missing-file response that does not leak physical paths.
14. Try a non-owner `PEGAWAI` session and verify access is denied.
15. Try a compatible role session only when the current raw preview policy allows it.

The commands above are illustrative. Do not include real cookie values or returned URLs in documentation, issue comments, commits, or chat output.

## 9. Required Tests Before Runtime Enablement

Existing focused tests to run before later caller enablement:

```powershell
pnpm test tests/unit/storage/raw-preview-internal-url-wiring.test.ts
pnpm test tests/unit/storage/raw-preview-internal-url-runtime.test.ts
pnpm test tests/unit/storage/internal-file-access.test.ts
```

Additional tests needed when any caller/helper changes are made later:

- Caller-level tests proving the default path still omits `useInternal=true`.
- Caller-level tests proving any local-only opt-in adds `useInternal=true` only under the explicit condition.
- Regression tests for the default Supabase-backed raw preview response shape.
- Missing local file tests for the selected fallback or hard-failure policy.
- Auth denial tests for missing session and non-owner `PEGAWAI`.
- Raw compatibility role tests for `PPK`, `BENDAHARA`, and `ARSIPARIS` where the raw preview policy allows them.
- UI behavior tests for preview modal error messaging if internal missing-file responses are allowed to reach the UI.
- Tests proving download actions are not accidentally switched by raw preview enablement.
- Tests proving role/document/archive endpoint callers are not changed by raw preview enablement.

Do not run broad build, dev, full test, full typecheck, DB scripts, auth hash scripts, or route generation for this docs-only phase.

## 10. Explicitly Not Implemented

Phase 6D.9 does not implement:

- Runtime code changes.
- Default internal URL enablement.
- UI caller changes.
- Helper caller changes.
- Download endpoint wiring.
- Document preview/download endpoint wiring.
- PPK preview/download endpoint wiring.
- Bendahara preview/download endpoint wiring.
- Arsiparis/archive endpoint wiring.
- Upload replacement.
- Pending-to-formal local move behavior.
- Delete/remove behavior.
- Archive destruction deletion.
- Supabase Storage file migration, copy, download, backfill, or sync.
- Document/archive token authorization.
- `DIMUSNAHKAN` document/archive token-streaming checks.
- Storage diagnostics or orphan cleanup replacement.
- DB schema changes.
- Auth/session changes.
- Workflow/FSM changes.
- `src/routeTree.gen.ts` changes.

## 11. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.1 Local Upload Replacement Planning
```

Runtime caller enablement should be deferred until local upload replacement is planned and the file availability model is clearer. If a raw preview caller prototype is still needed before upload replacement, run a narrow documentation-first phase:

```text
Phase 6D.10 Raw Preview Caller-Level Enablement Prototype Plan
```

That prototype plan should stay preview-only, developer-only, and local-only. It should not include download, document-detail, PPK, Bendahara, Arsiparis/archive, upload, move, delete, archive destruction, or broad document/archive token work.
