# Migration Roadmap

This roadmap keeps migration work small, reviewable, and behavior-preserving.

## Remaining-Work Principles

From Phase 6G onward, prefer phases that make concrete runtime progress. Do not add foundation-only, helper-only, or planning-only phases unless a specific implementation blocker is found and documented.

The local target is clean: old Supabase data is not imported, old Supabase Storage files are not migrated or copied, and local workflows use seed/new local data plus newly uploaded local files. Missing old Supabase-backed files are not a migration blocker; migrated local routes should fail cleanly without Supabase fallback.

Continuing guardrails:

- No Supabase Storage migration, copy, download, backfill, or sync.
- No Supabase Storage fallback for local storage paths.
- Preserve endpoint paths, request payloads, response shapes, UI behavior, auth UX, FSM/workflow behavior, archive behavior, role behavior, and logical storage path semantics.
- Server-side RBAC is authoritative; `dms_active_role` is UX state only.
- `ADMIN`-only accounts must not become submit-compatible unless explicitly approved.
- `log_aktivitas` remains append-only.
- `DIMUSNAHKAN` blocks archive preview/download.
- Do not remove Supabase dependencies globally until parity is verified.

## Phase 0: Planning, Best Practices, And Constitution Update

Goal: Establish the migration rules before implementation.

Allowed changes:

- Documentation under `docs/migration/` and `docs/best-practices/`.
- `AGENTS.md` updates if migration rules become canonical.
- `.gitkeep` files for storage folders.

Forbidden changes:

- Application source changes.
- Package changes.
- Docker, Drizzle, auth, or storage implementation.

Expected output files:

- Migration planning docs.
- Best-practice notes.
- Open decision log.

Validation checklist:

- Docs cite official/trusted sources.
- No `src/` files changed.
- No package files changed.

## Phase 1: Migration Foundation Setup

Goal: Add non-invasive local migration scaffolding.

Allowed changes:

- Environment example docs.
- Local-only folders.
- Scripts only if explicitly planned and reviewed.

Forbidden changes:

- No endpoint behavior changes.
- No Supabase removal.

Expected output files:

- Local setup notes.
- Environment variable reference.

Validation checklist:

- `pnpm` remains the only package manager.
- App still builds/runs as before.

## Phase 2: Supabase Dependency Audit

Goal: Map every Supabase Auth, Database, Storage, signed URL, RPC, and Realtime dependency.

Allowed changes:

- Audit docs.
- Code search notes.
- Endpoint priority list.

Forbidden changes:

- No replacement implementation.
- No deletion of Supabase helpers.

Expected output files:

- Completed `docs/migration/supabase-audit.md`.
- File and endpoint migration matrix.

Validation checklist:

- All Supabase client factories accounted for.
- All preview/download paths accounted for.
- All auth/session flows accounted for.

## Phase 3: Drizzle PostgreSQL Schema Foundation

Goal: Define the target PostgreSQL schema from scratch.

Allowed changes:

- Drizzle schema files.
- Drizzle config.
- Generated migration files after review.
- Schema documentation.

Forbidden changes:

- No API migration yet.
- No data restore from Supabase dummy data.
- No RLS implementation yet.

Expected output files:

- Drizzle schema organized by domain.
- Migration SQL.
- Schema documentation.

Validation checklist:

- Schemas exist for `auth`, `master`, `dokumen`, `arsip`, and `app`.
- FK/index strategy reviewed.
- RLS-friendly ownership/user columns included where needed.

## Phase 4: Seed And Local DB Bootstrapping

Goal: Make a fresh local database usable for development.

Allowed changes:

- Minimal deterministic seed scripts.
- Admin/bootstrap user setup.
- Master data seed strategy.

Forbidden changes:

- No Supabase dummy restore.
- No production secrets in repo.

Expected output files:

- Seed files.
- Bootstrap docs.
- Local DB reset notes.

Validation checklist:

- Fresh database can initialize.
- Seed produces required roles/master data.
- Admin account bootstrap is documented.

## Phase 5: Auth Compatibility Layer

Goal: Replace Supabase Auth behavior behind compatible app/API semantics.

Allowed changes:

- Auth tables under `auth` schema.
- Password hash helpers.
- Session helpers.
- Login/logout/session endpoints.
- Active-role compatibility.

Forbidden changes:

- No UI redesign.
- No endpoint path changes.
- No role model changes.

Expected output files:

- Auth DB schema.
- Session implementation.
- Auth tests.

Validation checklist:

- Login/logout/session flow works.
- Session expiration and remember-me work.
- `ADMIN` remains dedicated.
- Server authorization remains authoritative.

## Phase 6: Storage Compatibility Layer

Goal: Replace Supabase Storage behavior behind compatible upload, move, preview, and download semantics.

Allowed changes:

- Local storage service helpers.
- Upload API internals.
- Preview/download internals.
- Internal signed-token helpers.
- Submit/update/resubmit move internals when their route phase allows it.

Non-goals:

- No public static serving of `storage/`.
- No path shape drift unless compatibility mapping is documented.
- No old Supabase Storage file migration, copy, download, backfill, or sync.
- No Supabase fallback after a surface is intentionally local.

Expected outputs:

- Storage helper implementation.
- Signed-token helper.
- Storage tests.
- Route-specific storage handoff docs where behavior changes.

Key validation gates:

- Pending upload behavior works.
- Formal file behavior works.
- Preview/download require authorization.
- Path traversal attempts fail.
- Missing old Supabase-backed files fail cleanly.

Exit criteria:

- New local uploads, local moves, preview/download, and storage cleanup surfaces work for the clean local target without relying on Supabase Storage.

Current status:

- Completed foundations and runtime surfaces include local storage path helpers, internal token/access helpers, opt-in raw preview, `POST /api/upload`, `POST /api/dokumen/rename-pending`, submit foundations through Phase 6F, and Phase 6G submit runtime integration.
- Phase 6G.6 made `POST /api/dokumen/submit` local-backed by default for the clean local target and removed the submit-route legacy Supabase execution branch.
- Global Supabase retirement is not complete; many read APIs, workflow endpoints, storage surfaces, and user-management/admin surfaces may still be Supabase-backed.
- Phase 7A Read API Inventory and Prioritization is complete in `docs/migration/read-api-inventory-prioritization.md`.
- Phase 7B has started. The first runtime group migrated the six public master-data list GET routes to local PostgreSQL/Drizzle, Phase 7B.2 migrated matching master detail GETs plus Ketua Tim admin GET reads, and Phase 7B.3 classified browser master-data helper read surfaces while leaving master/admin mutations and broader read domains for later phases.
- Phase 7C migrated the scoped role inbox/list dokumen GET routes to local PostgreSQL/Drizzle on 2026-05-17.
- Phase 7D migrated the scoped dokumen detail/log GET routes to local PostgreSQL/Drizzle on 2026-05-17.
- Phase 7E migrated scoped laporan and archive metadata/search/classification GET routes to local PostgreSQL/Drizzle on 2026-05-17. Dashboard audit found no dedicated dashboard read API route to migrate.
- Phase 7F stabilized and closed the major read-domain migration audit on 2026-05-17. No true remaining Phase 7 read blocker was found; remaining Supabase usages are assigned to mixed mutation, storage/file-access, workflow/write, admin/user-management/auth-admin, or browser helper/UI retirement buckets.
- Mixed write handlers, preview/download/file-access routes, browser filter helper reads, archive lifecycle/destruction behavior, storage, and mutations remain later phases.

Completed compressed Phase 6G sequence:

- 6G.2 Submit Route Local Auth and Dry-Run Boundary Wiring.
- 6G.3 Submit Route Local Preflight Wiring.
- 6G.4 Submit Route Local DB Transaction Wiring.
- 6G.5 Submit Route Controlled Local File Movement.
- 6G.6 Submit Runtime Stabilization and Supabase Submit Path Retirement.

## Phase 7: Read API Migration By Domain

Goal: Move read endpoints from Supabase reads to PostgreSQL/Drizzle without changing endpoint paths, request query/body shapes, response shapes, or UI behavior.

Global guardrails:

- Server-side RBAC and filtering remain authoritative; `dms_active_role` is UX state only.
- `ADMIN` remains dedicated and must not be merged with other roles.
- `log_aktivitas` remains append-only.
- No Supabase fallback.
- No old Supabase Storage migration, copy, download, backfill, or sync.
- Do not remove global Supabase dependencies until later Phase 10/11 after parity.
- `DIMUSNAHKAN` preview/download blocking belongs to relevant archive/file phases; Phase 7 must not overclaim preview/download migration.
- Archive destruction/delete behavior is excluded from Phase 7 read migration.

Subphases:

- Phase 7A Read API Inventory and Prioritization.
  Goal: produce a short inventory of Supabase-backed read endpoints by domain, rough priority order, response compatibility notes, deferred endpoints, and validation strategy.
  Status: complete in `docs/migration/read-api-inventory-prioritization.md`.
  Runtime scope: none.
  Non-goals: no runtime code, no helper creation, no endpoint migration.
  Validation gates: inventory covers master/current-user, role list, detail, report/dashboard, and archive reads; first runtime group is selected.
  Exit criteria: Phase 7B starts with read-only master data `GET` endpoints for master fungsi, master kegiatan, master kelengkapan dokumen, jenis permintaan, kategori permintaan, and detail permintaan.

- Phase 7B Master Data and Current User Read APIs.
  Goal: migrate low-risk frequently used master/current-user reads.
  Progress: first runtime group migrated `GET /api/master-fungsi`, `GET /api/master-jenis`, `GET /api/master-kegiatan`, `GET /api/master-kategori`, `GET /api/master-detail`, and `GET /api/master-kelengkapan`; Phase 7B.2 migrated matching master detail GETs and Ketua Tim admin GET reads; Phase 7B.3 inventoried browser helper/caller placement only.
  Runtime scope: master fungsi, kegiatan, kelengkapan dokumen, jenis permintaan, kategori permintaan, detail permintaan, jenis dokumen reads where present, Ketua Tim admin GET reads, and remaining current-user read endpoints.
  Non-goals: master/admin mutations, user-management mutations, password flows, route path changes, UI changes.
  Validation gates: response shape parity, active/filter/order parity, and local `dms_session` authorization where required.
  Remaining 7B caveat: the browser-based `src/lib/master-data/jenis-dokumen.ts` helper is deferred until a compatible API-backed read surface is scoped; current-user support GETs are already local. Phase 7B.3 does not recommend an immediate 7B.4 because `jenis_dokumen` is not the only browser master-data dependency in the submit form.
  Next target: Phase 7C role inbox/list dokumen reads. A future `GET /api/master-jenis-dokumen` route remains justified, but should be implemented only in a narrow accepted carve-out or during Phase 10/11 Supabase client retirement.
  Exit criteria: form/navigation/support read surfaces use local PostgreSQL/Drizzle.

- Phase 7C Role Inbox/List Dokumen Read APIs.
  Goal: migrate role/status-filtered document list APIs.
  Progress: scoped runtime GET group migrated on 2026-05-17 for `GET /api/dokumen`, `GET /api/pegawai/revisi`, `GET /api/ppk/inbox`, `GET /api/ppk/tervalidasi`, `GET /api/ppk/ditolak`, `GET /api/ppk/revisi`, `GET /api/bendahara/inbox`, `GET /api/bendahara/selesai`, `GET /api/bendahara/ditolak`, and `GET /api/arsiparis/inbox`.
  Runtime scope: Pegawai document lists and revision list, PPK inbox/tervalidasi/ditolak/revisi, Bendahara inbox/selesai/ditolak, and Arsiparis inbox/list/search reads where list-only.
  Non-goals: detail endpoints, workflow mutations, preview/download, storage movement/deletion.
  Validation gates: server-side RBAC and status/owner/current_step/revision_target filtering remain compatible.
  Caveats: `POST /api/dokumen` remains Supabase-backed in the mixed route file; role list UI `master_fungsi` filter dropdowns still use browser Supabase reads and are not security boundaries.
  Exit criteria: role list/inbox pages render from local PostgreSQL/Drizzle without relying on UI filtering.

- Phase 7D Dokumen Detail Read API.
  Goal: migrate central and role-specific document detail reads.
  Progress: scoped runtime GET group migrated on 2026-05-17 for `GET /api/dokumen/$id`, `GET /api/dokumen/$id/log`, `GET /api/ppk/dokumen/$id`, `GET /api/bendahara/dokumen/$id`, and `GET /api/arsiparis/dokumen/$id`.
  Runtime scope: document detail, lampiran metadata, `log_aktivitas`, status/current_step/revision_target, and role authorization.
  Non-goals: preview/download route migration, file streaming, storage movement, workflow mutations.
  Validation gates: detail response parity, audit log ordering/field parity, and server-side authorization.
  Caveats: mixed central PATCH/DELETE, role approve/reject/archive mutations, preview/download routes, and archive active/inactive/usul-musnah snapshot detail routes remain deferred.
  Exit criteria: role detail pages read metadata and audit logs from local PostgreSQL/Drizzle.

- Phase 7E Report, Dashboard, And Archive Read APIs.
  Goal: migrate broader read-only reporting, dashboard, and archive metadata surfaces.
  Progress: scoped GET routes migrated on 2026-05-17 for laporan saya, laporan kegiatan, archive active/inactive/usul-musnah list/detail reads, archive search, and classification tree reads. Dashboard audit found no dedicated dashboard read API route.
  Runtime scope: laporan saya, laporan kegiatan, dashboard counts/statistics where present, archive list/detail/search aggregates, read-only archive metadata, and read-only archive classification.
  Non-goals: archive destruction/delete behavior, archive lifecycle mutations, storage cleanup, preview/download migration.
  Validation gates: aggregate/count parity, Ketua Tim report authorization, archive status filter parity, and response shape parity.
  Caveats: `GET /api/arsiparis/search` uses status-based PPK visibility because local schema has no legacy `step_urutan` column; `DIMUSNAHKAN` file-access blocking remains storage/file-access work; mixed archive/classification mutations remain deferred.
  Exit criteria: report and archive read pages render from local PostgreSQL/Drizzle, with dashboard API migration skipped because no dashboard API exists in the audited route set.

- Phase 7F Read API Stabilization and Supabase Read Retirement.
  Goal: mark read migration complete only when supported by audit.
  Runtime scope: audit remaining Supabase-backed read endpoints, focused tests/contract checks, response shape parity checks, docs updates, and deferred blocker list.
  Non-goals: global Supabase dependency removal, write workflow migration, storage surface completion.
  Validation gates: grep/audit confirms migrated read domains no longer use Supabase-backed reads or remaining reads are explicitly deferred; no Supabase fallback was introduced.
  Status: complete as of 2026-05-17 for major server/API read domains. Dashboard API migration remains skipped because no dedicated dashboard read API route was found.
  Exit criteria: met for scoped major read domains; browser helper/dropdown reads, mixed route mutations, preview/download/storage, user-management/auth-admin, archive lifecycle/destruction, archive search PPK `step_urutan` caveat, and `DIMUSNAHKAN` file-access blocking remain assigned to later phases.

Expected outputs:

- Short Phase 7A read endpoint inventory and priority list.
- Domain-based migrated read endpoints in 7B through 7E.
- Focused response-shape and authorization checks where practical.
- Phase 7F audit/handoff notes before Phase 8.

Current next recommended target after Phase 8G: Phase 9 storage/file-access completion, unless manual smoke checks find a concrete Phase 8G write-contract blocker.

## Phase 8: Write Workflow API Migration By Domain

Goal: Move write endpoints to PostgreSQL/Drizzle while preserving workflow behavior.

Current planning note:

- After Phase 7F closed the major server/API read migration audit, Phase 8 is planned as compact write/workflow migration by domain: 8A inventory/order, 8B Pegawai document update/revision writes, 8C PPK workflow mutations, 8D Bendahara workflow mutations, 8E Arsiparis archive metadata/lifecycle writes, 8F non-user-management master/admin CRUD writes, and 8G stabilization/audit.
- Phase 8 may migrate database metadata writes and workflow transactions, but storage-coupled physical file movement/deletion, preview/download, storage cleanup/orphan cleanup, user-management/Auth Admin replacement, browser helper/UI retirement, package cleanup, and global Supabase dependency removal remain later-phase work.
- Phase 8A completed the write/mutation inventory on 2026-05-17 without runtime changes. The inventory found no concrete blocker to starting Phase 8B, but it did mark mixed storage behavior inside document update/delete/resubmit/destruction routes as split-or-defer work for Phase 9.
- The next runtime target is Phase 8B Pegawai document update/revision write APIs, focused on `src/routes/api/dokumen.$id.ts`, `src/routes/api/dokumen.$id.submit.ts`, `src/routes/api/dokumen/$id.nominal.ts`, and only the active old draft-create behavior in `src/routes/api/dokumen/index.ts` if verified. Do not include `src/routes/api/dokumen/submit.ts`, preview/download, physical file movement/deletion, browser helper/UI rewrites, user-management/Auth Admin, route generation, schema/migration/seed, or package work in Phase 8B.
- Phase 8B started runtime migration on 2026-05-17. `PATCH /api/dokumen/$id` metadata-only update behavior and `POST /api/dokumen/$id/submit` existing-document submit/resubmit behavior are local PostgreSQL/Drizzle-backed with local `dms_session` PEGAWAI owner enforcement and append-only audit transactions. The PATCH metadata path rejects pending/move-required lampiran paths until Phase 9 handles update-time physical movement. `DELETE /api/dokumen/$id` remains Phase 9 storage-coupled work, `PATCH /api/dokumen/$id/nominal` remains deferred because it is cross-role, and old `POST /api/dokumen` draft-create remains skipped as inactive/ambiguous against the already-local combined submit route. Next target: close any remaining Phase 8B review blockers, then proceed to Phase 8C PPK workflow mutations.
- Phase 8C started runtime migration on 2026-05-18. PPK approve, reject, kembalikan, and the safe `POST /api/ppk/resubmit/$id` decision path are local PostgreSQL/Drizzle-backed with local `dms_session` PPK role enforcement and append-only audit transactions. PPK resubmit attachment save/move/delete behavior remains Phase 9 storage work; if no review blocker is found, the next runtime target is Phase 8D Bendahara workflow mutations.
- Phase 8D started runtime migration on 2026-05-18. Bendahara approve and reject decision writes are local PostgreSQL/Drizzle-backed with local `dms_session` BENDAHARA role enforcement, FSM-compatible status transitions, revision-target preservation, and append-only audit transactions. `PATCH /api/dokumen/$id/nominal` remains deferred because the legacy route is cross-role rather than Bendahara-owned; if no review blocker is found, the next runtime target is Phase 8E Arsiparis archive metadata/lifecycle writes.
- Phase 8E started runtime migration on 2026-05-18. Archive creation plus safe `AKTIF -> INAKTIF` and `INAKTIF -> USUL_MUSNAH` metadata/proposal writes are local PostgreSQL/Drizzle-backed with local `dms_session` ARSIPARIS role enforcement, transaction boundaries, preserved `lampiran_snapshot`/`nominal_realisasi`, and append-only audit inserts. `PATCH /api/arsiparis/usul-musnah/$id` destructive approval remains Phase 9 storage-coupled work because legacy behavior deletes storage objects, clears snapshots, and sets `DIMUSNAHKAN`; next target is Phase 8F non-user-management master/admin CRUD writes if no 8E review blocker is found.
- Phase 8F started runtime migration on 2026-05-18. Scoped non-user-management master/admin metadata writes are local PostgreSQL/Drizzle-backed for master fungsi, kegiatan, jenis/kategori/detail permintaan, kelengkapan dokumen, Arsip classification CRUD, and Ketua Tim assignment writes, with local `dms_session` role enforcement and preserved soft-delete/hard-delete behavior. `/api/users/*`, password/Auth Admin replacement, admin storage diagnostics, browser helper/UI retirement, storage/file-access, route generation, schema/migration/seed, package cleanup, and global Supabase cleanup remain deferred. Next target: Phase 8G write API stabilization/audit if no Phase 8F review blocker is found.
- Phase 8G completed the write stabilization and Supabase write retirement audit on 2026-05-18. The selected clean-local write domains from Phase 8B through 8F are closed for Phase 8: Pegawai update/revision metadata writes, PPK decision writes, Bendahara decision writes, safe Arsiparis archive metadata/lifecycle writes, and non-user-management master/admin metadata CRUD writes. Remaining Supabase-backed surfaces are classified into Phase 9 storage/file-access, Phase 10 user-management/Auth Admin, Phase 11 global cleanup/browser helper/package/env cleanup, plus the cross-role nominal route. Phase 8 does not claim preview/download/storage completion, user-management/Auth Admin completion, browser helper/UI retirement, global Supabase dependency removal, or package/env cleanup.

Allowed scope:

- Mutation helpers.
- Transaction boundaries.
- Audit log inserts.
- Workflow endpoint internals.
- Domain-by-domain migration for Pegawai, PPK, Bendahara, Arsiparis, and Admin/master-data write surfaces.

Non-goals:

- No FSM behavior drift.
- No audit log update/delete.
- No payload shape changes.
- No route path, response shape, role behavior, or UI behavior drift.

Expected outputs:

- Domain mutation helpers.
- Migrated mutation endpoints.
- Workflow tests.

Key validation gates:

- Submit/resubmit works.
- PPK approve/reject works.
- Bendahara approve/reject works.
- Arsiparis archive works.
- Admin/master CRUD works.
- `log_aktivitas` remains append-only.

Exit criteria:

- Met as of Phase 8G for the selected clean-local write domains. Core workflow mutations selected for Phase 8 no longer depend on Supabase database helpers and preserve FSM, role, archive, and audit behavior. Storage-coupled writes/access, user-management/Auth Admin, cross-role nominal compatibility, browser helper/UI retirement, and final Supabase cleanup remain later-phase work.

## Phase 9: Storage Surface Completion

Goal: Complete the remaining local filesystem storage surfaces after submit and core workflow wiring are stable.

Current planning note:

- Phase 9.0 planned storage/file-access completion on 2026-05-18 as compact runtime-oriented subphases: 9A inventory/order, 9B raw preview/download internal URL migration, 9C role/document preview/download routes, 9D update/revision/resubmit attachment movement, 9E document delete and attachment remove/delete, 9F destructive archive approval plus `DIMUSNAHKAN` hardening, and 9G diagnostics/orphan cleanup/stabilization.
- Phase 9A completed the final storage surface inventory/order on 2026-05-18 without runtime changes. Remaining active surfaces are assigned to 9B through 9G, existing local foundations are ready for raw-path internal URL migration, and no concrete blocker was found to starting Phase 9B next.
- Phase 9B migrated `GET /api/dokumen/preview-url?url=...` and `GET /api/dokumen/download-url?url=...` on 2026-05-18. Both raw logical-path URL-generation endpoints now return internal `/api/files/access?token=...` URLs through local `dms_session` authorization and the existing raw-path internal access service, while preserving the `{ signedUrl }` response field and preview `filename` field.
- Phase 9C migrated central, PPK, and Bendahara document preview/download route handlers on 2026-05-18. The migrated handlers preserve `{ signedUrl }`, issue document/lampiran internal access tokens, and `/api/files/access` now revalidates current local session binding, document role/owner visibility, archive state, `DIMUSNAHKAN`, lampiran index, logical path safety, root containment, and file existence at token-use time. The next target is Phase 9D update/revision/resubmit attachment movement unless manual Phase 9C smoke checks find a blocker.
- Phase 9D migrated scoped update/revision/resubmit attachment movement on 2026-05-18. `PATCH /api/dokumen/$id`, `PATCH /api/ppk/resubmit/$id`, and optional-attachment `POST /api/ppk/resubmit/$id` now use local pending-to-formal movement for new local pending files, preserve already formal paths, reject unsafe/missing/conflicting/owner-mismatched move inputs before DB metadata updates, and avoid Supabase Storage movement/deletion fallback. The remaining non-atomic window is local movement before DB update; moved files are rolled back best-effort on later DB failure, and unresolved rollback failure requires manual recovery/orphan cleanup in later storage phases.
- Phase 9E migrated the Pegawai UI `DELETE /api/dokumen/$id` path on 2026-05-18 for owner non-material `TERSIMPAN` documents with no material request-chain fields only. The route now uses local `dms_session` authorization, requires assigned `PEGAWAI` plus owner semantics, requires `is_non_material=true`, blocks archive-linked rows, preflights local logical paths before DB mutation, treats missing local files as a compatible no-op, skips URL/protocol-like legacy metadata without Supabase fallback, deletes the DB row before local filesystem unlink, and returns an explicit partial-cleanup 500 with safe counts if file deletion fails after DB deletion. Audit exception: current local `log_aktivitas.dokumen_id` cascades on document delete, and that cascade is accepted only for this user-owned non-approval saved document delete to preserve legacy Pegawai UI behavior. Browser-only `AttachmentEditor` reset/cancel delete, destructive archive approval, admin orphan cleanup, final browser helper retirement, and global Supabase cleanup remain later work.
- Phase 9F migrated `PATCH /api/arsiparis/usul-musnah/$id` on 2026-05-18. The destructive approval route now uses local `dms_session` authorization, requires assigned `ARSIPARIS`, rejects non-`MENUNGGU` proposals and non-`USUL_MUSNAH` archives, preflights `lampiran_snapshot` file candidates, updates proposal decision fields, `status_arsip='DIMUSNAHKAN'`, legacy `lampiran_snapshot=[]`, `musnah_at`, `musnah_by`, `musnah_catatan`, and append-only `log_aktivitas` in one local transaction, then unlinks eligible local files. Missing local files and URL/protocol-like legacy metadata are no-ops without Supabase fallback; unsafe paths fail before DB mutation. If post-DB unlink fails, the route returns a partial-cleanup 500 with safe counts and `compensationRequired=true`; `DIMUSNAHKAN` remains the runtime access authority, and Phase 9G must handle diagnostics/orphan cleanup. Document-aware preview/download and stale document tokens remain blocked by Phase 9C checks; raw logical-path tokens remain context-free and are not broadened in 9F.
- Phase 9G migrated `GET /api/admin/analyze-storage` and `GET /api/admin/cleanup-orphan-files` on 2026-05-18. Both routes now use local `dms_session` authorization and require assigned `ADMIN`. Diagnostics scans only the configured local storage root, compares logical local file paths against `dokumen_transaksi.lampiran_urls` and retained `arsip.lampiran_snapshot`, reports referenced/orphan-candidate/pending/unsupported/unsafe/missing/legacy-metadata categories, and never exposes physical paths or storage roots. Cleanup uses the same analysis, defaults to dry-run/report-only, requires `dry_run=false` for deletion, deletes only confidently unreferenced formal local files, skips pending and unsupported local files, treats missing files as no-op, and never uses Supabase Storage removal or fallback.
- Phase 9 starts after Phase 8G closed selected clean-local write domains. It does not include user-management/Auth Admin, password flows, package/env cleanup, global Supabase dependency removal, old Supabase file migration/copy/download/backfill/sync, or broad browser helper/UI retirement.

Allowed scope:

- Default preview/download endpoint migration.
- Role-specific preview/download migration.
- `AttachmentEditor` upload/remove migration.
- Update/resubmit pending-to-formal movement.
- Document delete/remove file behavior.
- Archive destruction deletion.
- Admin diagnostics and orphan cleanup.

Non-goals:

- No Supabase Storage migration, copy, download, backfill, or sync.
- No public static storage serving.
- No unrelated endpoint behavior changes.

Expected outputs:

- Migrated storage endpoints/components.
- Focused storage access and failure tests.
- Storage cleanup/diagnostics handoff docs.

Key validation gates:

- Upload/preview/download/move/delete behavior remains compatible.
- Unauthorized access fails.
- `DIMUSNAHKAN` blocks file access.
- Missing files fail cleanly.
- Path traversal and physical path leakage checks pass.

Exit criteria:

- Met for Phase 9 server-side clean-local storage runtime after Phase 9G with caveats: new local upload, rename-pending, submit movement, update/revision/PPK-resubmit movement, raw/document/role preview/download, scoped Pegawai non-material `TERSIMPAN` document delete, destructive archive approval cleanup, admin diagnostics, and conservative cleanup are local-filesystem-backed and do not use Supabase Storage fallback. This does not complete browser-only `AttachmentEditor` upload/remove replacement, old Supabase Storage migration, raw-token context redesign, scheduler replacement, final browser helper retirement, global Supabase package/env cleanup, backup/restore drills, or release hardening; those remain Phase 10/11 work.

## Phase 10: Admin/User Management And Supabase Runtime Retirement

Goal: Replace remaining Supabase Auth Admin/user-management/runtime dependencies and prepare final Supabase cleanup after parity.

Current status:

- Phase 10B migrated admin user list/detail reads to local PostgreSQL/Drizzle.
- Phase 10C migrated admin user create/update/activate/deactivate and role assignment to local PostgreSQL/Drizzle.
- Phase 10D migrated admin reset-password and self-service change-password to local Argon2id password hash updates with all-session revocation after successful hash updates.
- Phase 10E accepted deactivate/reactivate as the normal user lifecycle and found no active user hard-delete route or UI contract.
- Phase 10F closed stabilization on 2026-05-18: Phase 10-owned server routes have no Supabase Auth/Admin fallback, response shapes remain compatible, and remaining Supabase usage is classified for Phase 11 global/browser helper cleanup or reference-only legacy helper/docs/tests.
- Phase 10 is complete for the clean local server-side user-management/password target. It does not complete old Supabase Auth data migration, production bootstrap password workflow, email invite/reset flow, user hard delete, browser helper/UI retirement, global Supabase package/env cleanup, full regression, backup/restore, or release hardening.

Allowed scope:

- User management replacement.
- Password provisioning/change replacement.
- Remaining Supabase Auth Admin replacement.
- Session hardening, CSRF, and rate limiting where appropriate.
- Supabase runtime usage audit and dependency cleanup plan.

Non-goals:

- No global Supabase dependency removal before verified parity.
- No cleanup mixed with unresolved behavior migration.
- No role model changes.

Expected outputs:

- Local user-management implementation.
- Auth/session hardening notes or tests.
- Supabase runtime retirement checklist.

Key validation gates:

- Admin user-management flows work locally.
- Auth/session regression passes.
- Remaining Supabase runtime usages are removed or explicitly documented as reference-only.

Exit criteria:

- Met for Phase 10-owned server-side user-management/password routes after Phase 10F. No required Supabase Auth/Admin runtime path remains in those routes, and final browser helper/package/env/global cleanup is handed off to Phase 11 with a verified checklist.

## Phase 11: Stabilization, Regression, Cleanup, And Release Readiness

Goal: Confirm compatibility and prepare the local/LAN release.

Current status:

- Phase 11D.4 completed the post-retirement audit on 2026-05-19. Phase 11E.1 completed package/env cleanup planning, Phase 11E.2 removed `@supabase/ssr` and `@supabase/supabase-js` from package files, Phase 11E.3 removed unused Supabase env constants from source plus narrowed current-runtime docs wording toward local PostgreSQL, local `dms_session` auth, and local filesystem storage, and Phase 11E.4 completed the final lightweight package/env/global audit and regression handoff. Phase 11E is complete for verified active source/runtime/package/env-constant Supabase retirement only. `.env`/`.env.migration` remain human-controlled, historical Supabase docs/spec references are preserved, and old Supabase data/file migration remains out of scope.
- Phase 11F planning/report preparation completed on 2026-05-19 in `docs/migration/phase-11f-regression-smoke-plan.md`. It produced the human-run regression command plan, domain smoke checklist, report template, stop/go criteria, Supabase cleanup audit command plan, and Phase 11G/11H hardening handoff. It did not run tests/build/E2E, DB scripts, migrations, seeds, route generation, package commands, dev server, or commit, and it did not modify runtime source/tests/package/env/route-tree/DB/Drizzle/Supabase files.
- Next target: Phase 11G Backup/Restore, LAN Deployment, And Operations Hardening. Final go-live remains human-controlled after executed regression/smoke evidence and hardening evidence are reviewed.

Allowed scope:

- End-to-end regression and smoke checks.
- Docker/PostgreSQL persistence and LAN runbook finalization.
- PostgreSQL plus `storage/` backup/restore scripts and drills.
- Final dependency/env cleanup after verified parity.
- Security and operational hardening.

Non-goals:

- No broad feature changes.
- No late architecture rewrite.
- No Supabase cleanup before replacement gaps are closed.

Expected outputs:

- Regression report.
- Deployment and backup/restore docs.
- Known risk list.
- Final cleanup diff if parity permits.

Key validation gates:

- App accessible from another LAN device.
- PostgreSQL data persists.
- Files persist.
- Backup and restore tested.
- Critical workflows tested end to end.
- Auth/session security reviewed.
- Storage access reviewed.
- Final Supabase usage audit is clean or explicitly reference-only.

Exit criteria:

- The local PostgreSQL/auth/storage app is release-ready for the intended local/LAN deployment.
