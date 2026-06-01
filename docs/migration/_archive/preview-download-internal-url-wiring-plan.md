# Phase 6D.4 Preview/Download Internal URL Wiring Plan

Date: 2026-05-15.

## 1. Phase Scope

Phase 6D.4 is a planning and audit phase only. It defines how existing preview/download URL endpoints should later move from Supabase signed URLs to internal `/api/files/access?token=<opaque-token>` URLs.

No runtime behavior is changed in this phase. Existing preview, download, and upload behavior remains Supabase-backed until a later implementation phase explicitly migrates each endpoint and verifies compatibility.

## 2. Current Endpoint Inventory

### Raw Logical-Path Preview

- Endpoint path: `GET /api/dokumen/preview-url?url={logicalPath}`
- File path: `src/routes/api/dokumen/preview-url.ts`
- Inputs: query `url`, required.
- Current response shape: `{ signedUrl: string, filename: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: `canAccessStoragePath(supabase, session.user.id, url)`.
- Current authorization behavior: allowed when the first logical path segment matches the current user id, or when the user has `PPK`, `BENDAHARA`, or `ARSIPARIS`.
- Current signed URL generation: Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(url, 900)`.
- Current expiry behavior: 900 seconds.
- Current filename/download behavior: derives `filename` from the path leaf by splitting on `_` or `-`, dropping the first two segments, and falling back to `dokumen`.
- Classification: raw storage path based.

### Raw Logical-Path Download

- Endpoint path: `GET /api/dokumen/download-url?url={logicalPath}&docId={id}&docDate={date?}&lampName={name}&lampIndex={index?}`
- File path: `src/routes/api/dokumen/download-url.ts`
- Inputs: query `url`, `docId`, and `lampName` required; `docDate` and `lampIndex` optional. `lampIndex` is documented but not used in current filename construction.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: `canAccessStoragePath(supabase, session.user.id, url)`.
- Current authorization behavior: same raw logical-path owner or role behavior as raw preview.
- Current signed URL generation: Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(url, 900, { download: downloadFilename })`.
- Current expiry behavior: 900 seconds.
- Current filename/download behavior: derives the original filename from underscore-format pending paths or dash-format pending paths, then builds `{docIdFirst8}_{originalNameWithoutExt}_{docDate?}.{ext}` and passes it to Supabase as download metadata.
- Classification: raw storage path based.

### Default Document Preview

- Endpoint path: `GET /api/dokumen/$id/preview/$lampiranIndex`
- File path: `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: `getDokumenById()`, document owner check, `userHasApproverRole()`, archive status lookup.
- Current authorization behavior: allowed for document owner or approver role. Approver role currently includes `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 900)`.
- Current expiry behavior: 900 seconds.
- Current filename/download behavior: endpoint returns no filename. Callers build preview filenames client-side or fall back to a generic name.
- Classification: document-detail based; also used by current Arsiparis pages for archive previews.

### Default Document Download

- Endpoint path: `GET /api/dokumen/$id/download/$lampiranIndex`
- File path: `src/routes/api/dokumen.$id.download.$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: `getDokumenById()`, document owner check, `userHasApproverRole()`, archive status lookup.
- Current authorization behavior: allowed for document owner or approver role. Approver role currently includes `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 3600)`.
- Current expiry behavior: 3600 seconds.
- Current filename/download behavior: endpoint returns no filename and no Supabase download option. Current callers build download names client-side with document metadata helpers.
- Classification: document-detail based.

### PPK Document Preview

- Endpoint path: `GET /api/ppk/dokumen/$id/preview/$lampiranIndex`
- File path: `src/routes/api/ppk/dokumen/$id/preview/$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(authClient)`.
- Current authorization helper/checks: role query against `user_roles` joined to `roles`, `getDokumenById()`, archive status lookup.
- Current authorization behavior: requires assigned `PPK` role.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 900)`.
- Current expiry behavior: 900 seconds.
- Current filename/download behavior: endpoint returns no filename. Callers build preview filenames client-side or fall back to a generic name.
- Classification: role-specific document-detail based.

### PPK Document Download

- Endpoint path: `GET /api/ppk/dokumen/$id/download/$lampiranIndex`
- File path: `src/routes/api/ppk/dokumen/$id/download/$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(authClient)`.
- Current authorization helper/checks: role query against `user_roles` joined to `roles`, `getDokumenById()`, archive status lookup.
- Current authorization behavior: requires assigned `PPK` role.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 3600)`.
- Current expiry behavior: 3600 seconds.
- Current filename/download behavior: endpoint returns no filename and no Supabase download option. Current callers build download names client-side with document metadata helpers.
- Classification: role-specific document-detail based.

### Bendahara Document Preview

- Endpoint path: `GET /api/bendahara/dokumen/$id/preview/$lampiranIndex`
- File path: `src/routes/api/bendahara/dokumen/$id/preview/$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: role query against `user_roles` joined to `roles`, `getDokumenById()`, archive status lookup.
- Current authorization behavior: requires assigned `BENDAHARA` role.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 900)`.
- Current expiry behavior: 900 seconds.
- Current filename/download behavior: endpoint returns no filename. Callers build preview filenames client-side or fall back to a generic name.
- Classification: role-specific document-detail based.

### Bendahara Document Download

- Endpoint path: `GET /api/bendahara/dokumen/$id/download/$lampiranIndex`
- File path: `src/routes/api/bendahara/dokumen/$id/download/$lampiranIndex.ts`
- Inputs: path `id`, path `lampiranIndex`.
- Current response shape: `{ signedUrl: string }`
- Current auth/session mechanism: Supabase server client plus `getServerSession(supabase)`.
- Current authorization helper/checks: role query against `user_roles` joined to `roles`, `getDokumenById()`, archive status lookup.
- Current authorization behavior: requires assigned `BENDAHARA` role.
- Current archive blocking: checks `arsip.status_arsip` by `dokumen_id`; returns 410 when `DIMUSNAHKAN`.
- Current signed URL generation: selected `dok.lampiran_urls[lampiranIndex].url`, Supabase admin storage bucket `dokumen-lampiran`, `createSignedUrl(lampiran.url, 3600)`.
- Current expiry behavior: 3600 seconds.
- Current filename/download behavior: endpoint returns no filename and no Supabase download option. Current callers build download names client-side with document metadata helpers.
- Classification: role-specific document-detail based.

### Archive Preview/Download Surfaces

No separate `src/routes/api/arsiparis/*/preview*` or `src/routes/api/arsiparis/*/download*` route files were found in this audit.

Current Arsiparis detail pages for active, inactive, and proposed-destruction archives call `GET /api/dokumen/{dokumenId}/preview/{index}` and consume `{ signedUrl }`. Archive API detail routes read `lampiran_snapshot`, but preview requests still go through the default document preview route by document id and index. This must be treated as an archive-track compatibility risk before internal URL wiring.

## 3. Compatibility Contract For Future Internal URL Wiring

Future internal URL wiring must preserve:

- Existing endpoint paths.
- Existing HTTP methods.
- Existing query and path parameter shapes.
- Existing response shapes.
- `{ signedUrl: string }` as the response field wherever it is currently used.
- `{ signedUrl: string, filename: string }` for the raw preview endpoint.
- Existing filename fallback behavior where endpoints do not return `filename`.
- Existing expiry semantics where practical: 900 seconds for preview/raw links and 3600 seconds for role/document download links.

The future `signedUrl` value should be:

```text
/api/files/access?token=<opaque-token>
```

The token must be opaque to clients. If a signed base64 payload remains technically decodable, it must still be treated as client-visible and must not include secrets or physical paths.

Future tokens and responses must not expose:

- Absolute filesystem paths.
- Storage roots.
- Environment values.
- Signing secrets.
- Database URLs.
- Raw session tokens.
- Session token hashes.
- Password hashes.
- Supabase signed URLs.
- Broad serialized document/archive rows when an id plus re-query is sufficient.

Existing Supabase behavior remains the fallback and reference behavior until each endpoint is explicitly migrated and tested.

## 4. Authorization Requirements

Token verification is not authorization.

Future internal URL wiring must preserve or strengthen the current authorization behavior. At minimum, the signed-URL-producing endpoint must keep its current authorization check before creating an internal URL, and `/api/files/access` must revalidate access at token use time.

Future access must revalidate:

- Current local `dms_session` through `getLocalServerSession(request)`.
- Active role or allowed role where the source endpoint is role-specific.
- Owner/path authorization for raw logical-path tokens.
- Document owner or approver authorization for default document routes.
- PPK-only authorization for PPK routes.
- Bendahara-only authorization for Bendahara routes.
- Document and lampiran existence for document/lampiran tokens.
- Archive state for document/archive file access.
- `DIMUSNAHKAN` blocking before streaming document/archive files.
- Logical path safety with local storage path helpers.
- Root containment before any file read.

Future route behavior must not approximate document/archive authorization by only trusting a logical path token. Document and archive tokens should re-query current metadata before streaming.

## 5. Filename And Download Behavior

Current filename behavior discovered:

- Raw preview returns `{ signedUrl, filename }` and derives `filename` from the logical path leaf.
- Raw download creates a Supabase download URL with a server-built filename.
- Raw download supports underscore pending paths and dash pending paths when extracting the original filename.
- Raw download builds the download filename as `{docIdFirst8}_{originalNameWithoutExt}_{docDate?}.{ext}`.
- Default document, PPK, and Bendahara preview endpoints return no filename.
- Default document, PPK, and Bendahara download endpoints return no filename and do not pass a Supabase download filename.
- Current UI helpers build role/document preview and download names client-side using document metadata helpers, with fallback names where needed.
- `src/lib/file-helpers.ts` tolerates an optional `filename` in role endpoint JSON, but current role endpoints generally return only `{ signedUrl }`.

Future internal download tokens and `/api/files/access` streaming must preserve content-disposition compatibility:

- Preview access should use inline disposition when safe.
- Download access should use attachment disposition.
- Raw download should preserve the server-built filename shape above.
- Role/document download should preserve current client-side naming behavior unless a later phase intentionally adds a compatible `filename` field and updates callers in the same verified phase.
- Any filename used in `Content-Disposition` must be sanitized and must not contain path separators, traversal segments, absolute paths, storage roots, token values, or secrets.

Open implementation detail: role/document download endpoints currently return only a URL and rely on the browser helper or anchor behavior for filename handling. The exact split between token `downloadFilename`, access-route `Content-Disposition`, and existing client-side `a.download` behavior must be tested before runtime wiring.

## 6. Endpoint Classification

Likely migration tracks:

- Raw logical-path preview/download endpoints: `/api/dokumen/preview-url` and `/api/dokumen/download-url`.
- Document-detail preview/download endpoints: `/api/dokumen/$id/preview/$lampiranIndex` and `/api/dokumen/$id/download/$lampiranIndex`.
- Role-specific preview/download endpoints: PPK and Bendahara preview/download endpoints.
- Archive/lampiran_snapshot preview/download endpoints: no separate archive API preview/download route files were found. Current Arsiparis pages call the default document preview route while archive detail APIs expose snapshot data.

No Arsiparis-specific download endpoint was found in this audit. No `createSignedUrls` batch signed URL endpoint was found. No `getPublicUrl` preview/download path was found in active source routes.

## 7. Blockers Before Runtime Wiring

Blockers before any endpoint runtime migration:

- Local file streaming is still unimplemented in `/api/files/access`.
- Document/lampiran token authorization is still unimplemented.
- Archive/lampiran_snapshot token authorization is still unimplemented.
- `DIMUSNAHKAN` token-streaming checks are still unimplemented.
- `/api/files/access` currently supports only raw `logicalPath` token validation and returns 501 after successful validation.
- Exact archive preview semantics need a focused audit because Arsiparis pages display archive snapshots but call the default document preview route by document id and index.
- Exact role endpoint inventory may require a broader route audit before migration if new role routes are added.
- Supabase-backed endpoints must remain until compatibility is tested.
- Local filesystem storage starts empty, and existing Supabase Storage files are not migrated, copied, downloaded, backfilled, or synced.
- Upload replacement is not implemented.
- Pending-to-formal local move behavior is not implemented.
- Download filename/content-disposition behavior needs focused tests before streaming is enabled.
- Current raw download logging includes storage-path-oriented debug context; future local wiring must avoid leaking physical paths, tokens, env values, or signed URLs in logs.

## 8. Recommended Later Implementation Sequence

Recommended bounded sequence:

1. Phase 6D.5: implement an isolated non-streaming internal URL generation helper with focused tests. It should create `/api/files/access?token=<opaque-token>` values without wiring existing endpoints.
2. Phase 6D.6: wire one low-risk raw logical-path preview endpoint behind internal URL behavior while preserving `{ signedUrl, filename }`, or keep a Supabase fallback when local storage is not ready. Do not wire document/archive routes in the same phase.
3. Phase 6D.7: implement local streaming in `/api/files/access` with strict no-leak headers, safe content-type handling, inline/attachment disposition handling, path containment tests, and no absolute-path exposure.
4. Phase 6D.8: implement document/lampiran token authorization rechecks, role-specific rechecks, archive state rechecks, and `DIMUSNAHKAN` blocking before expanding runtime wiring.
5. Phase 6D.9: migrate remaining preview/download endpoints one track at a time, preserving endpoint paths and response shapes and retaining Supabase-backed reference behavior until each track passes compatibility checks.

This sequence intentionally avoids broad runtime migration before streaming and authorization are proven.

## 9. Explicitly Not Implemented

This phase does not implement:

- Runtime endpoint wiring.
- Existing preview/download endpoint behavior changes.
- Internal signed URL generation in existing endpoints.
- Upload replacement.
- Local file streaming.
- Supabase Storage file migration, copy, download, backfill, or sync.
- Database schema changes.
- `src/routeTree.gen.ts` changes.
- Auth/session changes.
- Workflow/FSM changes.
- Archive lifecycle changes.
- Pending-to-formal local move behavior.
- Delete/remove behavior.
- Archive destruction local file deletion.
- Storage diagnostics/orphan cleanup migration.

## 10. Validation Performed

Non-mutating validation commands run:

```powershell
git status --short --branch
```

Result: clean branch status at the start of the audit.

```powershell
rg -n "createSignedUrl" src docs tests
rg -n "signedUrl" src docs tests
rg -n "preview-url" src docs tests
rg -n "download-url" src docs tests
rg -n "downloadFilename" src docs tests
rg -n "Content-Disposition" src docs tests
rg -n "dokumen-lampiran" src docs tests
rg -n "canAccessStoragePath" src docs tests
rg -n "createFileRoute\('/api/.*(preview|download)|preview/\$lampiranIndex|download/\$lampiranIndex|preview-url|download-url" src/routes/api
rg -n "createFileRoute\('/api/(arsiparis|dokumen|ppk|bendahara).*(preview|download)|createSignedUrl|signedUrl" src/routes/api
rg -n "createSignedUrls|getPublicUrl" src docs tests
rg -n "arsiparis.*(preview|download)|(preview|download).*arsiparis" src/routes/api src/routes/arsiparis src/components src/lib
```

Result: discovered the eight active signed-URL preview/download API endpoints documented above, plus caller surfaces that consume `{ signedUrl }`. No active `src` usage of `createSignedUrls` or `getPublicUrl` was found. No Arsiparis-specific preview/download API route file was found.

```powershell
Get-ChildItem -Recurse src\routes\api | Where-Object { $_.Name -match 'preview|download|access|upload' } | Select-Object -ExpandProperty FullName
```

Result: confirmed route files/directories for the known preview/download, upload, and internal access route surfaces. The output was used only to verify inventory and is not reproduced here with absolute paths.

```powershell
git diff --check
```

Result: passed with no output.
