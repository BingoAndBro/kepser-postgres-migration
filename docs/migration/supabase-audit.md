# Supabase Dependency Audit

This is a template for the full Supabase dependency audit. Do not treat it as complete until each section has been filled with file paths, endpoint paths, behavior notes, and migration priority.

## Auth Usage

Track:

- Supabase browser auth calls.
- Supabase server auth calls.
- Admin auth calls.
- Session reads.
- Login/logout/session endpoints.
- Active role behavior.

Find with:

```bash
rg "supabase.auth|createBrowserClient|createServerClient|createAdminClient|getSession|getUser|signIn|signOut" src
```

Findings:

- Pending.

## Database Usage

Track:

- `.from(...)` table usage.
- Admin-client database writes.
- Browser-client direct table access.
- Tables not represented in Drizzle.
- Joins/enrichment done in application code.

Find with:

```bash
rg "\\.from\\(|\\.select\\(|\\.insert\\(|\\.update\\(|\\.delete\\(" src
```

Findings:

- Pending.

## Storage Usage

Track:

- Uploads.
- Copies/moves.
- Deletes.
- Downloads.
- Bucket names.
- Pending path handling.
- Formal path handling.

Find with:

```bash
rg "storage|upload|download|createSignedUrl|signedUrl|remove\\(|copy\\(" src
```

Findings:

- Pending.

## Signed URL Usage

Track:

- Preview endpoint behavior.
- Download endpoint behavior.
- Client helpers that expect signed URLs.
- Expiration behavior.
- Role-specific access rules.

Findings:

- Pending.

## Realtime Usage

Track:

- Supabase channel usage.
- Subscriptions.
- Realtime assumptions in UI.

Find with:

```bash
rg "channel\\(|on\\('postgres_changes'|subscribe\\(" src
```

Findings:

- Pending.

## RPC Usage

Track:

- Supabase RPC calls.
- Database functions that must be replaced or reimplemented.

Find with:

```bash
rg "\\.rpc\\(" src
```

Findings:

- Pending.

## Environment Variables

Track:

- Supabase URL/key variables.
- Service role variables.
- Storage bucket variables.
- New target variables needed for PostgreSQL, session cookies, and local storage.

Find with:

```bash
rg "import\\.meta\\.env|process\\.env|SUPABASE|DATABASE_URL|STORAGE|SESSION|COOKIE" .
```

Findings:

- Pending.

## Files Requiring Careful Migration

Initial candidates from architecture docs:

- `src/components/layout/AppLayout.tsx`
- `src/lib/auth.ts`
- `src/lib/auth-state.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/supabase-server.ts`
- `src/lib/supabase-admin.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/storage-client.ts`
- `src/lib/file-helpers.ts`
- `src/lib/master-data.ts`
- `src/lib/user-helpers.ts`
- `src/routes/api/upload.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts`
- `src/routes/api/dokumen.$id.download.$lampiranIndex.ts`

## Endpoint Priority List

Priority 1:

- Auth/session endpoints.
- Upload/preview/download endpoints.
- Pegawai submit/resubmit.
- PPK/Bendahara approve/reject.

Priority 2:

- Read-only inbox/list/detail endpoints by role.
- Arsip archive and search endpoints.

Priority 3:

- Admin/master data CRUD.
- Operational cleanup/analyze endpoints.

## Audit Status

- Status: Template prepared.
- Full audit: Not performed yet.
- Reason: Current task is documentation and planning only.

