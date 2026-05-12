# Supabase Dependency Audit

## Audit Date

2026-05-12

## Summary

Supabase usage is broad and scattered across this repository. There are centralized client factories in `src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`, and `src/lib/supabase-admin.ts`, but actual usage is distributed across browser layouts/pages/components, API routes, domain helpers, storage helpers, user-management helpers, Supabase migrations, and a Supabase Edge Function.

Highest-risk replacement areas:

- Auth/session bootstrap is split between direct browser Supabase calls in `src/routes/login.tsx` and `src/components/layout/AppLayout.tsx`, plus API auth routes under `src/routes/api/auth/`.
- Server/API authorization depends on Supabase Auth cookies and `user_roles` queries in nearly every API domain.
- User management depends on Supabase Auth Admin APIs for listing, creating, updating metadata, and changing passwords.
- Storage behavior depends on Supabase Storage path semantics, service-role storage operations, and signed URL generation.
- Document workflow mutation endpoints combine Supabase Auth, database writes, FSM transitions, audit log inserts, and storage moves/deletes.
- Supabase PostgREST nested select syntax is used in role joins and master-data joins.

Recommended replacement order:

1. Preserve Supabase code as the reference implementation.
2. Build PostgreSQL/Drizzle schema and deterministic seed foundation.
3. Build auth compatibility behind existing session/login/role behavior.
4. Build local filesystem storage compatibility and internal signed-token behavior.
5. Migrate read-only APIs by domain.
6. Migrate mutation APIs by domain after read/storage/auth parity.
7. Replace Edge/cron behavior with local scheduled job or app-managed maintenance.
8. Remove Supabase only after parity is verified.

## 1. Auth Usage

| File | Supabase Usage | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `src/lib/supabase-browser.ts` | `createBrowserClient` from `@supabase/ssr`; reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, fallback `process.env.SUPABASE_URL`, `process.env.SUPABASE_ANON_KEY` | Singleton browser client for client-side auth, storage, and direct DB calls | Remove browser Supabase client; use API/session endpoints and app auth state | High | Many browser files call `getBrowserClient()`, so this cannot be removed until those paths are migrated. |
| `src/lib/supabase-server.ts` | `createServerClient` from `@supabase/ssr`; cookie adapter | Creates request-scoped Supabase client for API routes and server auth checks | Custom session resolver reading hashed session token from DB | Critical | Current cookie adapter sets `httpOnly: false` because active role UX needs readable cookie behavior; replacement must distinguish session cookie from active-role cookie. |
| `src/lib/supabase-admin.ts` | `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` | Service-role client bypassing RLS for workflow, storage, and user admin | Server-only DB/storage/admin service layer | Critical | Service role assumptions are embedded in workflow/storage/user management. |
| `src/lib/auth.ts` | `supabase.auth.getSession`, `supabase.auth.getUser`, `user_roles` query | Provides unverified `getSession`, verified `getServerSession`, role lookup, active-role cookie helpers, app session construction | Custom auth/session helpers plus Drizzle role queries | Critical | Comment explicitly says `getSession()` is unverified and not for server security; some routes still use it or alias it. |
| `src/lib/auth-state.ts` | No Supabase import; caches auth state in `sessionStorage` | Client-side cached auth state for UX readiness | Keep or replace with API-backed client auth cache | Medium | This is coupled to Supabase-derived user/role data but not directly to Supabase APIs. |
| `src/components/layout/AppLayout.tsx` | `getBrowserClient`, `auth.getSession`, `auth.getUser`, `auth.signOut`, `auth.onAuthStateChange`, `user_status`, `user_roles` | Main browser auth bootstrap, inactive-user handling, role resolution, active-role cookie, role switch UX, logout | API/session endpoint plus custom auth event/state model | Critical | Current root route is `ssr: false`; this layout is the practical auth bootstrap. Must preserve redirects, inactive reason, active role, and ADMIN no-switch behavior. |
| `src/routes/login.tsx` | Browser `auth.signInWithPassword`, `auth.signOut`, `user_status`, `getUserRole` | Login UI directly authenticates through Supabase browser client, checks inactive account, sets `dms_active_role`, redirects | Existing UI calling custom `/api/auth/login` or equivalent compatible server action | Critical | Login page currently bypasses the `/api/auth/login` route for primary login behavior. |
| `src/routes/api/auth/login.ts` | Server `auth.signInWithPassword`, role lookup | API login alternative that validates input, signs in, returns user/roles/activeRole, sets active-role cookie | Custom credential verification, argon2id check, session creation | High | Must preserve response shape if clients start depending on it. |
| `src/routes/api/auth/logout.ts` | Server `auth.signOut` | Logs out and clears active-role cookie | Revoke hashed DB session and clear session + active-role cookies | High | Current browser logout also calls `supabase.auth.signOut()` directly. |
| `src/routes/api/auth/session.ts` | `getServerSession`, `user_roles`, active-role cookie | Returns `{ session, roles, activeRole }` | Custom session introspection endpoint | High | Should become the canonical replacement for `AppLayout` auth bootstrap. |
| `src/routes/api/auth/role-switch.ts` | `getServerSession`, `user_roles` | Validates active role, blocks ADMIN role switching, sets active-role cookie | Custom session + Drizzle role lookup | High | Preserve `ADMIN tidak bisa switch role` behavior. |
| `src/routes/api/users/me.ts` | `getServerSession`, `getUserRole` | Returns current user profile/session-derived data | Custom session current-user endpoint | High | User identity currently comes from Supabase Auth user metadata. |
| `src/routes/api/users/me/change-password.ts` | `auth.signInWithPassword`, `auth.updateUser` | Verifies current password by signing in, then updates Supabase password | Argon2id password verification + hash update + session invalidation policy | Critical | Must define whether password change revokes other sessions. |
| `src/lib/user-helpers.ts` | `auth.admin.listUsers`, `auth.admin.createUser`, `auth.admin.updateUserById` | Admin user CRUD, metadata, password reset, user listing | `auth.users` table in local PostgreSQL with password hashes and metadata columns | Critical | Supabase Auth is currently the user table; replacement schema must support all UI fields and role/status joins. |
| `src/routes/api/users/*` | Server client for auth guard; admin client/user helpers for admin actions | Admin user list/create/update/reset/activate/deactivate | Custom auth admin service + Drizzle role/status writes | Critical | Preserve PEGAWAI default role and dedicated ADMIN constraints. |
| `src/lib/guards.ts` | Supabase auth/role helpers | Route/API guard utilities | Custom server guard utilities | High | Guard behavior should be consolidated during auth migration. |
| `src/routes/admin.index.tsx`, `src/routes/bendahara.tsx`, `src/routes/ppk.tsx`, `src/routes/arsiparis/*.tsx`, selected role pages | Browser `getBrowserClient`, `auth.getSession`, `user_roles` | Client-side role/redirect checks | API/session-driven client guard or server route guard | Medium | These are UX hints only; server/API authorization remains authoritative. |

## 2. Database Usage

| File | Tables/Queries | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `src/lib/auth.ts` | `user_roles`, nested `role:roles(nama)` | Resolves role names for session and RBAC | Drizzle query joining `auth/users` to `master/roles` or equivalent role tables | Critical | Nested PostgREST select behavior must be replaced explicitly. |
| `src/components/layout/AppLayout.tsx` | `user_status`, `user_roles`, `roles` nested select | Browser checks account active status and resolves roles | `/api/auth/session` or `/api/users/me` returning active state and roles | Critical | Direct browser DB dependency should be removed after auth compatibility layer exists. |
| `src/lib/master-data/*` and `src/lib/master-data.ts` | `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen`, `master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_jenis_dokumen` | Browser/admin helper CRUD and reads, including duplicate checks and soft/hard delete differences | Drizzle master-data service behind API routes | High | Master data exists both in browser helpers and API routes. Preserve hard-delete versus soft-delete semantics per entity. |
| `src/routes/admin.master-data.*.tsx` | Calls `getBrowserClient()` and `src/lib/master-data` helpers | Admin master-data pages read/write Supabase directly from browser | Move all CRUD behind API/server boundaries | High | This is one of the largest client-side direct Supabase surfaces. |
| `src/components/laporan/HierarchicalFilter.tsx` | Master-data read helpers using browser Supabase | Loads fungsi/kegiatan/jenis/kategori/detail dropdowns | API-backed read endpoints or shared client API helper | Medium | Used for report filters; response shape should preserve dropdown data. |
| `src/components/dokumen/KelengkapanChecklist.tsx` | `master_kelengkapan_dokumen` direct query | Loads required/optional checklist based on kegiatan/role | API-backed kelengkapan lookup | Medium | Also intertwined with upload UI. |
| `src/lib/dokumen/queries.ts` | `dokumen_transaksi`, master tables, `master_kelengkapan_dokumen`, `user_roles`, `ketua_tim_assignments` | Core document reads, manual joins, report helpers, approver role checks | Drizzle document query service | Critical | Manual enrichment defines response shape. Preserve field names like `fungsi_nama`, `kegiatan_nama`, leaf names. |
| `src/lib/dokumen/mutations.ts` | `dokumen_transaksi`, master tables | Create/update document rows and status fields | Drizzle mutation service with transactions | Critical | Status writes must still follow FSM behavior. |
| `src/lib/dokumen/logs.ts` | `log_aktivitas` insert/select | Append-only audit insert and activity reads | Drizzle append-only audit service | Critical | No update/delete allowed. |
| `src/lib/dokumen/storage.ts` | `user_roles` | Storage path authorization for owner/approver roles | Drizzle role lookup in storage authorization helper | High | Owner path semantics currently use first path segment as user ID. |
| `src/routes/api/dokumen/*` | `dokumen_transaksi`, `log_aktivitas`, master tables, `ketua_tim_assignments`, `arsip` | Pegawai create/list/detail/update/delete/submit/resubmit/log/nominal/read helpers | Drizzle API internals preserving endpoint contracts | Critical | Mixed session client and admin client usage; storage moves and DB writes need transaction strategy or compensating cleanup. |
| `src/routes/api/ppk/*` | `user_roles`, `dokumen_transaksi`, `log_aktivitas`, master tables, `arsip` | PPK inbox/detail/approve/reject/resubmit/kembalikan/revision lists | Drizzle PPK read/mutation services | Critical | PPK resubmit is a high-risk mutation path involving lampiran updates and FSM behavior. |
| `src/routes/api/bendahara/*` | `user_roles`, `dokumen_transaksi`, `log_aktivitas`, master tables, `arsip` | Bendahara inbox/detail/approve/reject/selesai/ditolak and file access | Drizzle Bendahara services | Critical | Existing idempotency check reads `log_aktivitas` for prior `BENDAHARA_APPROVE`. |
| `src/routes/api/arsiparis/*` | `user_roles`, `dokumen_transaksi`, `log_aktivitas`, `arsip`, `arsip_usul_musnah`, `master_klasifikasi_arsip`, master tables | Archive inbox/detail/archive/active/inactive/usul-musnah/search/classification lifecycle | Drizzle Arsip services | Critical | Includes lifecycle state, retention dates, archive snapshots, and destroyed-file restrictions. |
| `src/routes/api/laporan/saya.ts` | `dokumen_transaksi`, master tables through helper | User report for completed/tersimpan documents | Drizzle report read service | High | Must preserve completed + `TERSIMPAN` inclusion. |
| `src/routes/api/laporan/kegiatan.ts` | `ketua_tim_assignments`, `dokumen_transaksi`, master tables, `auth.admin.listUsers` | Ketua Tim activity report with submitter name enrichment | Drizzle report service + local auth user lookup | High | Supabase Auth Admin pagination/listing behavior must be replaced. |
| `src/routes/api/ketua-tim/*` | `ketua_tim_assignments`, `master_kegiatan`, auth admin user lookup | Ketua Tim assignment CRUD and user/kegiatan lookup | Drizzle assignment service + local user lookup | High | Current behavior includes replace semantics by `kegiatan_id`; preserve it. |
| `src/routes/api/master-*` | Master tables and admin role guard | Server-side master-data CRUD endpoints | Drizzle master-data service | Medium | These are better migration targets than browser direct master-data helpers. |
| `src/routes/api/admin/analyze-storage.ts` | `user_roles`, `dokumen_transaksi`, storage listing | Storage diagnostics compares DB lampiran paths against bucket contents | Local storage diagnostics | Medium | Should move after filesystem storage exists. |
| `src/routes/api/admin/cleanup-orphan-files.ts` | `user_roles`, `dokumen_transaksi`, storage listing/removal | Deletes storage files not referenced by DB metadata | Local filesystem cleanup job/endpoint | High | Must avoid deleting legitimate files during migration. |
| `supabase/migrations/*.sql` | Full current DB schema, RLS, storage policies, cron, seeds | Current source of truth for production database behavior | Reference material for new Drizzle schema | Critical | `src/lib/db/schema.ts` is partial; use migrations + runtime code as schema reference. |
| `src/lib/db/schema.ts` | Partial Drizzle mirror | Drizzle schema helper/mirror only | New Drizzle schema from scratch | Medium | Do not assume it covers production behavior. |

Tables found in audited code paths:

- `arsip`
- `arsip_usul_musnah`
- `arsip_verifikasi_penyusutan`
- `dokumen_transaksi`
- `dokumen-lampiran` bucket references
- `ketua_tim_assignments`
- `log_aktivitas`
- `master_detail_permintaan`
- `master_fungsi`
- `master_jenis_dokumen`
- `master_jenis_permintaan`
- `master_kategori_permintaan`
- `master_kegiatan`
- `master_kelengkapan_dokumen`
- `master_klasifikasi_arsip`
- `roles`
- `user_roles`
- `user_status`

## 3. Storage Usage

| File | Storage Operation | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `src/routes/api/upload.ts` | `admin.storage.from('dokumen-lampiran').upload(...)` | Authenticates user, validates form data, MIME type and 2MB size, writes pending path `{userId}/{kelengkapanId}_{timestamp}_{filename}`, returns `url`, `nama`, `kelengkapan_id`, `uploaded_at` | Local filesystem pending upload under `storage/temp` or equivalent internal layout | Critical | Preserve response shape and current allowed file types/size unless separately changed. |
| `src/components/dokumen/FileUploadButton.tsx` | Fetches `/api/upload` | Client upload button uses API route rather than direct storage | Keep API contract | Medium | Safer than direct Supabase storage. |
| `src/components/dokumen/AttachmentEditor.tsx` | Direct browser `supabase.storage.upload(...)` and `.remove(...)`; `auth.getSession` for user ID | Revisi/resubmit attachment editor can upload/delete pending files directly from browser | Move all file upload/delete through API routes | Critical | This is a direct client-side storage dependency and should be eliminated in storage compatibility phase. |
| `src/lib/dokumen/storage.ts` | `.move(...)`, `.remove(...)` | Centralized helper moves pending files to formal `{userId}/{dokId}/{uuid}.{ext}`, tracks old files, deletes orphans | Local filesystem move/delete helper with safe path resolution | Critical | This helper captures current pending/formal semantics. |
| `src/routes/api/dokumen/submit.ts` | `.move(...)` | Combined create+submit pre-processes pending files and moves them to a formal path before creating/updating document state | Local move into formal document path | Critical | Current code uses `temp-id` before actual document creation; replacement should decide whether to preserve path shape or improve with compatible metadata mapping. |
| `src/routes/api/dokumen/rename-pending.ts` | `.move(...)` | Renames pending file to formal-like path | Local filesystem rename endpoint/helper | High | Must be audited before replacing submit/update flows. |
| `src/routes/api/dokumen.$id.ts` | `.remove(...)` on non-material delete; `syncDocumentAttachments`, `deleteOrphanFiles` | Deletes document row and associated files; update path deletes replaced/orphaned files asynchronously | Local file delete with DB/file consistency policy | Critical | Current delete logs before DB delete, then deletes files fire-and-forget. |
| `src/routes/api/admin/analyze-storage.ts` | `admin.storage.list(...)` | Lists storage bucket and compares with `dokumen_transaksi.lampiran_urls` | Filesystem scan against DB metadata | Medium | Use after local storage root is implemented. |
| `src/routes/api/admin/cleanup-orphan-files.ts` | `admin.storage.list(...)`, `.remove(...)` | Finds and deletes orphan files from bucket | Filesystem cleanup with dry-run/confirm behavior | High | Dangerous operation; keep isolated and tested. |
| `src/routes/api/arsiparis/usul-musnah.$id.ts` | `.remove(...)` for each `lampiran_snapshot` file | On approved destruction, deletes original storage files, sets `arsip.status_arsip='DIMUSNAHKAN'`, clears snapshot | Filesystem delete tied to archive lifecycle | Critical | Preview/download endpoints rely on `DIMUSNAHKAN` status returning 410. |
| `src/components/dokumen/AttachmentViewer.tsx` | Uses API preview/download paths or `storage-client` helpers | Displays/opens/downloads attachments | Continue API-only preview/download | High | Keep UI behavior and returned `signedUrl` field until token replacement is ready. |
| `src/lib/storage-client.ts` | Fetches `/api/dokumen/preview-url`, downloads returned signed URL | Browser helper expects API to return `signedUrl` and then fetches it | Internal signed token or streaming endpoint, preserving client contract if needed | High | Current client behavior depends on externally fetchable URL. |
| `src/lib/file-helpers.ts` | Fetches role-specific preview/download APIs and opens `signedUrl` | Role-context file download/preview abstraction | Keep route paths and return shape during migration | High | Role contexts currently only cover `pegawai`, `ppk`, `bendahara`. |
| `supabase/migrations/004_storage_rls_cleanup.sql` | Storage policy/RLS cleanup | Historical storage RLS/policy reference | Reference only | Medium | No local RLS implementation yet, but policy intent may inform API authorization. |

Storage path behavior found:

- Pending API upload format: `{userId}/{kelengkapanId}_{timestamp}_{safeFilename}` from `/api/upload`.
- Pending edit-session detection also recognizes dash format: `{userId}/{timestamp}-{random}-{filename}`.
- Formal format: `{userId}/{dokumenId}/{uuid}.{ext}`.
- Authorization sometimes uses first path segment as owner user ID.

## 4. Signed URL / Public URL Usage

| File | URL Type | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts` | Supabase signed URL, 900 seconds | Owner or approver can preview unless archive is `DIMUSNAHKAN`; returns `{ signedUrl }` | Internal short-lived preview token or direct authorized stream | Critical | Must preserve 401/403/404/410 behavior. |
| `src/routes/api/dokumen.$id.download.$lampiranIndex.ts` | Supabase signed URL, 3600 seconds | Owner or approver can download unless `DIMUSNAHKAN`; returns `{ signedUrl }` | Internal download token or direct authorized stream | Critical | Client filename is mostly built client-side. |
| `src/routes/api/ppk/dokumen/$id/preview/$lampiranIndex.ts` | Supabase signed URL, 900 seconds | PPK-only preview, checks `arsip.status_arsip` | Internal signed-token/stream endpoint | High | Object-not-found currently maps to 410 in this endpoint. |
| `src/routes/api/ppk/dokumen/$id/download/$lampiranIndex.ts` | Supabase signed URL, 3600 seconds | PPK-only download | Internal signed-token/stream endpoint | High | Preserve response shape. |
| `src/routes/api/bendahara/dokumen/$id/preview/$lampiranIndex.ts` | Supabase signed URL, 900 seconds | Bendahara-only preview | Internal signed-token/stream endpoint | High | Similar to PPK endpoint. |
| `src/routes/api/bendahara/dokumen/$id/download/$lampiranIndex.ts` | Supabase signed URL, 3600 seconds | Bendahara-only download | Internal signed-token/stream endpoint | High | Similar to PPK endpoint. |
| `src/routes/api/dokumen/preview-url.ts` | Supabase signed URL, 900 seconds from raw storage path query | Used by edit pages/helpers for arbitrary storage path preview after `canAccessStoragePath` | Internal signed-token endpoint with strict path validation | Critical | Current query accepts `url` parameter; local replacement must prevent path traversal and avoid exposing raw filesystem paths. |
| `src/routes/api/dokumen/download-url.ts` | Supabase signed URL, 900 seconds with download filename | Used by edit page for arbitrary storage path download with generated filename | Internal signed-token endpoint or direct stream | Critical | Requires careful filename sanitization and path validation. |
| `src/lib/storage-client.ts` | Expects `signedUrl` JSON then fetches signed URL | Browser downloads via object URL | Keep compatibility or switch helper to fetch stream directly | High | Current UI may assume `signedUrl` exists. |
| `src/lib/file-helpers.ts` | Expects role endpoint `signedUrl` | Browser opens/downloads signed URL | Keep compatibility or switch helper to fetch stream directly | High | Preserve role-specific API paths. |

No `getPublicUrl` usage found in audited paths.

No `createSignedUrls` usage found in audited paths.

No direct public bucket URL exposure found, but the app intentionally returns temporary Supabase signed URLs to the browser.

## 5. RPC / Realtime / Edge Function Usage

### RPC usage

| File | RPC | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `src/routes/api/users/me/is-ketua-tim/$kegiatanId.ts` | `rpc('is_user_chairman', { p_user_id, p_kegiatan_id })` | Checks whether current user is chairman for one kegiatan | Drizzle query against `ketua_tim_assignments` | Medium | Replace with explicit query; preserve response shape. |
| `src/routes/api/users/me/ketua-tim.ts` | `rpc('get_user_chairman_kegiatan', { p_user_id })` | Returns current user's chairman kegiatan list | Drizzle query joining `ketua_tim_assignments` and `master_kegiatan` | Medium | Used by `AppLayout` and role/navigation UX. |

### Realtime/channel usage

No Supabase Realtime channel or `postgres_changes` usage found in audited paths.

`src/components/layout/AppLayout.tsx` does use `supabase.auth.onAuthStateChange(...)` and unsubscribes the returned subscription. This is Auth event subscription, not database Realtime.

### Supabase Edge Function usage

| File | Supabase Function Usage | Current Behavior | Replacement Target | Risk | Notes |
|---|---|---|---|---|---|
| `supabase/functions/arsip-retensi/index.ts` | Supabase Edge Function using Deno and `@supabase/supabase-js` | Scheduled archive retention transition; queries `arsip`, inserts `arsip_verifikasi_penyusutan`/`arsip_usul_musnah`, updates archive status, inserts logs | Local scheduled job, app admin endpoint, or PostgreSQL-side job after deployment strategy is chosen | High | AGENTS notes current active flow no longer uses `VERIFIKASI_PENYUSUTAN`; reconcile before implementing replacement. |
| `supabase/migrations/007_cron_arsip.sql` | `pg_cron` calls Edge Function URL with service role header | Daily 02:00 retention automation | Local scheduler or Postgres cron strategy | High | Uses `app.settings.SUPABASE_URL` and `SERVICE_ROLE_KEY`; not portable to local target. |

## 6. Environment Variables

| Variable | Used In | Current Purpose | Migration Replacement | Notes |
|---|---|---|---|---|
| `SUPABASE_URL` | `.env.example`, `src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, Supabase Edge Function, docs/specs | Supabase project URL for browser/server/admin clients and Edge function | Remove after migration; replace with `APP_URL`, `DATABASE_URL`, and local service config | `.env.example` currently contains concrete-looking Supabase values; treat as sensitive/unsafe even if dummy. |
| `SUPABASE_ANON_KEY` | `.env.example`, `src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`, docs/specs | Supabase anonymous key for browser/server client | Remove after auth/API migration | Browser fallback uses non-`VITE_` var too. |
| `VITE_SUPABASE_URL` | `src/lib/supabase-browser.ts`, `src/lib/constants/env.ts` | Client-safe Supabase URL for browser bundle | Remove when browser Supabase client is removed | Use only client-safe env vars in browser code during transition. |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase-browser.ts`, `src/lib/constants/env.ts` | Client-safe Supabase anon key for browser bundle | Remove when browser Supabase client is removed | Current `.env.example` does not show `VITE_` variants. |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.example`, `src/lib/supabase-admin.ts`, Supabase Edge Function, docs/specs | Service role key for admin DB/Auth/Storage and Edge function | Remove; replace with server-only app secrets and DB credentials | High-value secret; must never be exposed to client. |
| `SERVICE_ROLE_KEY` | `supabase/migrations/007_cron_arsip.sql` | Setting read by pg_cron SQL to call Edge Function | Remove with Supabase cron path | Name differs from `SUPABASE_SERVICE_ROLE_KEY`. |
| `DATABASE_URL` | `drizzle.config.ts`, `.env.example`, docs/specs | Current Drizzle/Supabase Postgres connection string | Keep but repoint to local PostgreSQL Docker connection | Future local value should be non-Supabase. |
| `NODE_ENV` | `.env.example`, `src/lib/supabase-server.ts` | Controls secure cookie option in Supabase server client | Keep standard Node env; custom auth should use explicit cookie security config too | In LAN HTTP, Secure cookie behavior is an open decision. |
| `APP_URL` | `.env.example` | App base URL for redirects/deployment | Keep or replace with documented app base URL variable | Duplicated in `.env.example`. |
| `PLAYWRIGHT_BASE_URL` | Playwright config/tests | Test target app URL | Keep | Not Supabase-specific. |

## 7. API Endpoint Priority Map

| Domain | Endpoint/File | Supabase Dependency | Suggested Migration Phase | Risk | Notes |
|---|---|---|---|---|---|
| Auth | `src/routes/api/auth/login.ts` | Supabase password sign-in, role lookup | Phase 5 | Critical | Primary UI currently uses browser login, so migrate UI + API together. |
| Auth | `src/routes/api/auth/logout.ts` | Supabase sign out | Phase 5 | High | Must revoke custom session and clear cookies. |
| Auth | `src/routes/api/auth/session.ts` | Supabase verified user/session + roles | Phase 5 | Critical | Should become AppLayout bootstrap source. |
| Auth | `src/routes/api/auth/role-switch.ts` | Supabase session + `user_roles` | Phase 5 | High | Preserve ADMIN no-switch behavior. |
| Upload/storage | `src/routes/api/upload.ts` | Supabase Auth session + Storage upload | Phase 6 | Critical | Entry point for pending uploads. |
| Upload/storage | `src/routes/api/dokumen/preview-url.ts`, `src/routes/api/dokumen/download-url.ts` | Supabase signed URLs from raw storage path | Phase 6 | Critical | Highest path traversal risk in local filesystem replacement. |
| Upload/storage | Role preview/download endpoints under `dokumen`, `ppk`, `bendahara` | Supabase signed URLs, role checks, archive status checks | Phase 6 | Critical | Must preserve 900s preview and 3600s download semantics or compatible token behavior. |
| Pegawai | `src/routes/api/dokumen/index.ts`, `src/routes/api/dokumen.$id.ts`, `src/routes/api/dokumen.$id.log.ts`, `src/routes/api/dokumen/$id.nominal.ts` | Supabase DB and auth/session; admin bypass for some reads/writes | Phase 7 for reads, Phase 8 for writes | Critical | Split GET/list/log before PATCH/DELETE/nominal mutations. |
| Pegawai | `src/routes/api/dokumen/submit.ts`, `src/routes/api/dokumen.$id.submit.ts`, `src/routes/api/dokumen/rename-pending.ts` | DB + FSM + audit + storage move | Phase 8 | Critical | Do not migrate before storage compatibility exists. |
| Pegawai | `src/routes/api/pegawai/revisi.ts` | Admin DB reads and enrichment | Phase 7 | High | Read-only list can migrate before mutations. |
| PPK | `src/routes/api/ppk/inbox.ts`, `tervalidasi.ts`, `ditolak.ts`, `revisi.ts`, `dokumen/$id.ts` | Supabase DB reads, role checks, enrichment | Phase 7 | High | Response shape includes enriched names and status filters. |
| PPK | `src/routes/api/ppk/dokumen/$id/approve.ts`, `reject.ts`, `resubmit/$id.ts`, `kembalikan/$id.ts` | Auth + DB writes + FSM + logs + storage sync | Phase 8 | Critical | Resubmit is storage-coupled. |
| Bendahara | `src/routes/api/bendahara/inbox.ts`, `ditolak.ts`, `selesai.ts`, `dokumen/$id.ts` | Supabase DB reads, role checks, enrichment | Phase 7 | High | Read-only first. |
| Bendahara | `src/routes/api/bendahara/dokumen/$id/approve.ts`, `reject.ts` | Auth + DB writes + FSM + idempotency log checks | Phase 8 | Critical | Preserve reject notes and approval idempotency behavior. |
| Arsiparis | `src/routes/api/arsiparis/inbox.ts`, `aktif*.ts`, `inaktif*.ts`, `usul-musnah*.ts`, `search.ts`, `dokumen.$id.ts` | Supabase DB reads, auth admin user lookup, archive lifecycle tables | Phase 7 | High | Reads include archive snapshots and user-name enrichment. |
| Arsiparis | `src/routes/api/arsiparis/dokumen.$id.archive.ts`, `aktif.$id/pindahkan.ts`, `inaktif.$id/musnahkan.ts`, `usul-musnah.$id.ts` | DB writes, FSM/logs, storage deletion for destruction | Phase 8 | Critical | Must preserve `DIMUSNAHKAN` access restrictions. |
| Admin/master data | `src/routes/api/master-*` | Supabase DB CRUD + ADMIN guard | Phase 7/8 by method | Medium | GET first, then POST/PATCH/DELETE. |
| Admin/master data | `src/routes/api/users/*` | Supabase Auth Admin + role/status tables | Phase 5 for auth model, Phase 8 for user mutations | Critical | Depends on new local auth schema. |
| Admin/master data | `src/routes/api/ketua-tim/*` | `ketua_tim_assignments`, master data, auth admin user lookup | Phase 7/8 | High | Preserve replace-on-post semantics. |
| Reports/laporan | `src/routes/api/laporan/saya.ts`, `src/routes/api/laporan/kegiatan.ts` | Supabase DB reads, helper enrichment, auth admin listUsers | Phase 7 | High | Ketua Tim report depends on assignment and user-name lookup. |
| Admin/storage ops | `src/routes/api/admin/analyze-storage.ts`, `cleanup-orphan-files.ts` | Supabase Storage list/delete + DB metadata | Phase 6 or after | High | Do not migrate before local storage metadata rules are stable. |

## 8. Client-Side Direct Supabase Access

Direct browser Supabase access found in:

- `src/routes/login.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/laporan/HierarchicalFilter.tsx`
- `src/routes/admin.index.tsx`
- `src/routes/admin.master-data.detail.tsx`
- `src/routes/admin.master-data.fungsi.tsx`
- `src/routes/admin.master-data.jenis.tsx`
- `src/routes/admin.master-data.jenis-dokumen.tsx`
- `src/routes/admin.master-data.kategori.tsx`
- `src/routes/admin.master-data.kegiatan.tsx`
- `src/routes/admin.master-data.kelengkapan.tsx`
- `src/routes/arsiparis/search.tsx`
- `src/routes/arsiparis/usul-musnah/index.tsx`
- Several role page guards under `src/routes/ppk*`, `src/routes/bendahara*`, `src/routes/arsiparis*`, and `src/routes/pegawai*`.

Why this is risky:

- Browser Supabase Auth currently provides persistence, token refresh, and auth event notifications.
- Browser DB/storage calls bypass the intended migration target where server/API authorization is authoritative.
- Master-data admin pages currently mutate Supabase directly from the browser through helper functions.
- `AttachmentEditor` directly uploads/deletes files from the browser, which conflicts with the local filesystem rule that files must only be accessed through API routes.

Migration recommendation:

- Move login/session/bootstrap behind `/api/auth/*` first.
- Move direct storage operations behind `/api/upload` and role-aware delete/replace endpoints.
- Move master-data page reads/writes to existing `/api/master-*` endpoints before replacing endpoint internals with Drizzle.
- Keep client-side role checks only as UX hints after server/API authorization is in place.

## 9. Hidden Coupling / Implicit Behavior

- Supabase Auth stores users, password hashes, user metadata, email, created/updated timestamps, session persistence, token refresh, and auth state events.
- `AppLayout` depends on Supabase browser `onAuthStateChange` for `SIGNED_IN`, `SIGNED_OUT`, and `TOKEN_REFRESHED` behavior.
- `getServerSession()` depends on Supabase `auth.getUser()` verification and then `auth.getSession()` for session details.
- Some routes still use `getSession()` or alias it even though `src/lib/auth.ts` marks it as unverified.
- Supabase Auth Admin list APIs are used to enrich user names in reports/logs/archive detail. Local auth schema must support equivalent lookup without scanning remote users.
- PostgREST nested select syntax like `role:roles(nama)` and `master_kegiatan(nama, master_fungsi(nama))` implicitly performs relationship joins.
- Manual application-level joins currently define response shapes. Drizzle migration must preserve those enriched fields.
- Supabase Storage path strings are stored directly in `lampiran_urls.url` and archive snapshots.
- Storage authorization sometimes assumes first path segment is the user ID.
- Supabase signed URLs provide temporary access and direct browser fetchability. Replacement must decide token format, expiry, and whether the final file response is streamed or redirected.
- Supabase Storage `move()` behavior is used for pending-to-formal transitions.
- Supabase Storage `remove()` is used for pending cleanup, orphan cleanup, document deletion, and archive destruction.
- Database defaults such as UUID generation and timestamps are currently supplied by Supabase/PostgreSQL migrations.
- RLS assumptions exist historically. Several API routes intentionally use admin client to bypass RLS while enforcing authorization in application code.
- Supabase Edge Function + pg_cron provide scheduled archive retention behavior that has no local replacement yet.
- `.env.example` contains concrete-looking Supabase credentials; before real deployment docs, replace with placeholders in a separate task if allowed.

## 10. Replacement Order Recommendation

Specific safe order for this repo:

1. Keep all Supabase code and migrations as reference until each replacement passes parity checks.
2. Build new Drizzle schema from scratch using `supabase/migrations/` plus active endpoint/helper behavior as schema truth.
3. Seed roles, required master data, bootstrap admin, and minimal fixtures before auth migration.
4. Implement custom cookie session auth and make `/api/auth/session` the canonical session source.
5. Switch `src/routes/login.tsx` and `AppLayout` behavior to the compatible auth API only after the server auth layer is tested.
6. Implement local filesystem storage under `storage/` with API-only upload/preview/download and internal signed-token compatibility.
7. Migrate storage endpoints before workflow mutations because submit/resubmit depends on file movement.
8. Migrate read-only APIs by domain: Pegawai, PPK, Bendahara, Arsiparis, Admin/master data, reports.
9. Migrate mutation APIs by domain: Pegawai submit/revise, PPK approve/reject/resubmit, Bendahara approve/reject, Arsiparis archive/lifecycle, Admin/master data/user mutations.
10. Replace Edge Function/cron retention behavior with a local scheduled mechanism after archive tables and lifecycle endpoints are stable.
11. Remove browser direct Supabase access, then server Supabase clients, then packages/env vars only after full parity is verified.

## 11. Open Questions

- Should custom auth preserve Supabase user IDs as UUIDs exactly, or generate fresh local UUIDs for users?
- Which user metadata fields become first-class columns versus JSON metadata?
- Should active role remain a readable non-HttpOnly cookie while session token is HttpOnly?
- Should password change revoke all existing sessions or only the current session?
- What exact local signed-token format should replace Supabase signed URLs?
- Should preview/download endpoints keep returning `{ signedUrl }`, or can they stream files directly while preserving UI behavior?
- How should current raw `url` query endpoints validate storage paths after moving to filesystem storage?
- Should local storage preserve current path strings exactly or introduce a compatibility mapping layer?
- How should DB/file operations handle partial failure without Supabase Storage atomicity?
- What job runner should replace Supabase Edge Function + pg_cron for archive retention on LAN deployments?
- Should the obsolete-looking `arsip_verifikasi_penyusutan` Edge Function path be migrated, removed, or reconciled with current AGENTS lifecycle?
- Should `.env.example` concrete-looking Supabase keys be replaced with placeholders in a separate documentation hygiene task?
- How much of current Supabase RLS policy intent should be modeled in schema comments/tests before RLS is deferred?

## 12. Commands Used

```powershell
Get-Content -Raw -Path AGENTS.md
Get-Content -Raw -Path docs\migration\README.md
Get-Content -Raw -Path docs\migration\migration-constraints.md
Get-Content -Raw -Path docs\migration\migration-roadmap.md
Get-Content -Raw -Path docs\migration\phase-plan.md
Get-Content -Raw -Path docs\migration\agent-working-rules.md
Get-Content -Raw -Path docs\migration\supabase-audit.md
Get-Content -Raw -Path docs\best-practices\drizzle-postgres-migration-notes.md
Get-Content -Raw -Path docs\best-practices\custom-session-auth-notes.md
Get-Content -Raw -Path docs\best-practices\local-filesystem-storage-notes.md
rg -n "supabase|createClient|createBrowserClient|createServerClient|supabase\.auth|auth\.getUser|auth\.getSession|auth\.signIn|auth\.signOut|auth\.onAuthStateChange" src supabase drizzle.config.ts README.md SETUP.md .env.example
rg -n "\.from\(|supabase\.from|\.select\(|\.insert\(|\.update\(|\.delete\(" src\lib src\routes\api src\routes src\components src\hooks
rg -n "supabase\.storage|storage\.from|\.storage|upload|download|createSignedUrl|createSignedUrls|getPublicUrl|\.remove\(|\.move\(|\.copy\(" src supabase
rg -n "\.rpc\(|channel\(|realtime|postgres_changes|subscribe\(|functions\.invoke|supabase\.functions|serve\(" src supabase
rg -n "SUPABASE|VITE_SUPABASE|SUPABASE_URL|SUPABASE_ANON_KEY|SERVICE_ROLE|process\.env|import\.meta\.env|DATABASE_URL|STORAGE|SESSION|COOKIE" . -g '!node_modules' -g '!dist' -g '!graphify-out' -g '!docs/migration/supabase-audit.md'
rg -l "supabase|createBrowserClient|createServerClient|createClient\(|auth\.|\.from\(|\.storage|createSignedUrl|\.rpc\(|channel\(|SUPABASE|import\.meta\.env|process\.env" src supabase drizzle.config.ts .env.example README.md SETUP.md
rg -l "getBrowserClient|supabase\.from|supabase\.auth|supabase\.storage|createBrowserClient" src\components src\routes src\hooks
rg -l "createServerSupabaseClient|createAdminClient|getSession\(|getServerSession\(|hasRole\(|userHasApproverRole" src\routes\api src\lib
rg -l "createSignedUrl|getPublicUrl|createSignedUrls|storage\.from|\.storage|\.upload\(|\.download\(|\.remove\(|\.move\(|\.copy\(" src supabase
rg -n "from\('([^']+)'\)" src supabase
rg -n "auth\.admin|listUsers|createUser|updateUserById|deleteUser|invite|generateLink" src\lib src\routes\api
rg -n "createSignedUrl|createSignedUrls|getPublicUrl" src supabase
rg -n "storage\.from\('dokumen-lampiran'\)|\.storage\s*$|\.upload\(|\.move\(|\.remove\(|\.copy\(|\.download\(" src
Get-ChildItem -Recurse -File -Path src\routes\api
Get-Content -Raw -Path src\lib\supabase-browser.ts
Get-Content -Raw -Path src\lib\supabase-server.ts
Get-Content -Raw -Path src\lib\supabase-admin.ts
Get-Content -Raw -Path src\lib\auth.ts
Get-Content -Raw -Path src\lib\auth-state.ts
Get-Content -Raw -Path src\components\layout\AppLayout.tsx
Get-Content -Raw -Path src\routes\login.tsx
Get-Content -Raw -Path src\routes\api\auth\login.ts
Get-Content -Raw -Path src\routes\api\auth\logout.ts
Get-Content -Raw -Path src\routes\api\auth\session.ts
Get-Content -Raw -Path src\routes\api\auth\role-switch.ts
Get-Content -Raw -Path src\routes\api\users\me\change-password.ts
Get-Content -Raw -Path src\lib\storage-client.ts
Get-Content -Raw -Path src\lib\file-helpers.ts
Get-Content -Raw -Path src\lib\dokumen\storage.ts
Get-Content -Raw -Path src\routes\api\upload.ts
Get-Content -Raw -LiteralPath 'src\routes\api\dokumen.$id.preview.$lampiranIndex.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\dokumen.$id.download.$lampiranIndex.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\dokumen\preview-url.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\dokumen\download-url.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\bendahara\dokumen\$id\preview\$lampiranIndex.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\ppk\dokumen\$id\preview\$lampiranIndex.ts'
Get-Content -Raw -Path src\lib\dokumen\queries.ts
Get-Content -Raw -Path src\lib\dokumen\mutations.ts
Get-Content -Raw -Path src\lib\dokumen\logs.ts
Get-Content -Raw -Path src\lib\master-data.ts
Get-Content -Raw -Path src\lib\user-helpers.ts
Get-Content -Raw -Path src\routes\api\dokumen\submit.ts
Get-Content -Raw -LiteralPath 'src\routes\api\dokumen.$id.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\ppk\dokumen\$id\approve.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\bendahara\dokumen\$id\approve.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\arsiparis\dokumen.$id.archive.ts'
Get-Content -Raw -LiteralPath 'src\routes\api\arsiparis\usul-musnah.$id.ts'
Get-Content -Raw -Path supabase\functions\arsip-retensi\index.ts
Get-Content -Raw -Path supabase\migrations\007_cron_arsip.sql
Get-Content -Raw -Path .env.example
Get-Content -Raw -Path drizzle.config.ts
```

