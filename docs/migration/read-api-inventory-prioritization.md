# Phase 7A Read API Inventory And Prioritization

Date: 2026-05-17.

## Purpose And Scope

Phase 7A is inventory and prioritization only. No runtime code changed, no helpers were created, no routes were edited, and no tests were added.

This inventory prepares Phase 7B runtime migration. Phase 7B should start migrating read endpoints directly after this document, beginning with low-risk master data reads.

## Method

Inventory was built from lightweight codebase listings and searches only:

- listed `src/routes/api`;
- listed relevant `src/lib/dokumen`, `src/lib/master-data`, `src/lib/auth`, and `src/db/schema` files;
- searched for `createServerSupabaseClient`, `createAdminClient`, `getServerSession`, `supabase.from`, `.from(`, `.select(`, `.single(`, `.maybeSingle(`;
- inspected route/helper files for method boundaries so mutations, storage, diagnostics, and auth-admin surfaces were not misclassified as Phase 7 read targets.

This is a codebase inventory, not runtime verification.

## Domain Inventory

### Master Data And Current-User Support Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/master-fungsi.ts` `GET /api/master-fungsi` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | active fungsi dropdown/list | returns raw snake_case rows array; active filter and `nama` ordering | public read today | 7B first group migrated |
| `src/routes/api/master-kegiatan.ts` `GET /api/master-kegiatan?fungsi_id=` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | kegiatan dropdown/list | adds `fungsi_nama` while preserving nested `master_fungsi` row data | public read today | 7B first group migrated |
| `src/routes/api/master-kelengkapan.ts` `GET /api/master-kelengkapan?kegiatan_id=&is_ketua_tim=` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | required document checklist | adds `kegiatan_nama` and `fungsi_nama`; no `is_active` filter in current route | public read today | 7B first group migrated |
| `src/routes/api/master-jenis.ts` `GET /api/master-jenis` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | jenis permintaan dropdown/list | raw snake_case rows array, active filter, `nama` ordering | public read today | 7B first group migrated |
| `src/routes/api/master-kategori.ts` `GET /api/master-kategori?jenis_id=` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | kategori permintaan dropdown/list | adds `jenis_nama`, preserves nested join object if callers rely on it | public read today | 7B first group migrated |
| `src/routes/api/master-detail.ts` `GET /api/master-detail?kategori_id=` | Local PostgreSQL/Drizzle for GET as of Phase 7B first group; mutations in same file remain Supabase-backed | detail permintaan dropdown/list | adds `kategori_nama` and `jenis_nama`, preserves nested join object | public read today | 7B first group migrated |
| `src/routes/api/master-jenis.$id.ts`, `master-kategori.$id.ts`, `master-detail.$id.ts` `GET` | Local PostgreSQL/Drizzle for GET as of Phase 7B.2; mutations in same files remain Supabase-backed | admin/detail read for edit flows | single object or `404 { error }`; joined display names and nested join objects preserved for kategori/detail | public read today | 7B.2 migrated |
| `src/lib/master-data/jenis-dokumen.ts` `getAllJenisDokumen(...)` | Supabase browser/helper-backed; audited and deferred in Phase 7B.2 | non-material jenis dokumen dropdown/admin page | returns `JenisDokumenRow[]`; no API route exists in current listing | direct UI/browser helper usage prevents safe server-only Drizzle swap without a new API/UI migration | defer until a narrow API-backed jenis-dokumen read surface is scoped |
| `src/routes/api/users/me.ts` | already local | current profile | maps local auth user fields through existing profile parser | local `dms_session` already authoritative | done before 7B |
| `src/routes/api/users/me/ketua-tim.ts` and `src/routes/api/users/me/is-ketua-tim/$kegiatanId.ts` | already local | current-user Ketua Tim support | `{ is_ketua_tim, kegiatan }` and `{ is_ketua_tim }` | local `dms_session` already authoritative | done before 7B |
| `src/routes/api/ketua-tim/index.ts`, `user/$userId.ts`, `kegiatan/$kegiatanId.ts` `GET` | Local PostgreSQL/Drizzle for GET as of Phase 7B.2; mutations in same files remain Supabase-backed | admin Ketua Tim assignment reads | `{ assignments }` / `{ chairman }`, nested `kegiatan`, and local user-name/user-email enrichment preserved where current GET returned it | local `dms_session` ADMIN validation; ADMIN remains dedicated | 7B.2 migrated |

Mutation handlers in the same master/ketua-tim files are not Phase 7 read targets.

### Role Inbox/List Dokumen Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/dokumen/index.ts` `GET /api/dokumen` via `getDokumenByUser` | Supabase-backed | Pegawai document list | `{ dokumen }`; helper parses rows and joins `fungsi_nama`, `kegiatan_nama` | owner filter must be server-side local session | 7C |
| `src/routes/api/pegawai/revisi.ts` | Supabase-backed | Pegawai revision inbox | `{ dokumen }`; only selected fields, `revision_notes`, `updated_at` | owner plus `NEED_REVISION`/`USER` filters | 7C |
| `src/routes/api/ppk/inbox.ts`, `tervalidasi.ts`, `ditolak.ts`, `revisi.ts` | Supabase-backed | PPK role lists | `{ dokumen }`; status-specific fields and manual master joins | PPK role check must use local assigned roles, not UI state | 7C |
| `src/routes/api/bendahara/inbox.ts`, `selesai.ts`, `ditolak.ts` | Supabase-backed | Bendahara role lists | `{ dokumen }`; inbox includes `ppk_user_id` and `ppk_validated_at` from `log_aktivitas` | Bendahara role check and status filters | 7C |
| `src/routes/api/arsiparis/inbox.ts` | Supabase-backed | completed documents awaiting archive | `{ inbox }`; excludes existing `arsip`, includes `bendahara_approve_at` | Arsiparis role check and completed/unarchived filter | 7C or 7E if grouped with archive |

Phase 7C status update, 2026-05-17:

- `GET /api/dokumen` is migrated to local PostgreSQL/Drizzle for the Pegawai-owned document list. The mixed-file `POST /api/dokumen` handler remains Supabase-backed and deferred to write phases.
- `GET /api/pegawai/revisi` is migrated to local PostgreSQL/Drizzle.
- `GET /api/ppk/inbox`, `GET /api/ppk/tervalidasi`, `GET /api/ppk/ditolak`, and `GET /api/ppk/revisi` are migrated to local PostgreSQL/Drizzle.
- `GET /api/bendahara/inbox`, `GET /api/bendahara/selesai`, and `GET /api/bendahara/ditolak` are migrated to local PostgreSQL/Drizzle.
- `GET /api/arsiparis/inbox` is migrated to local PostgreSQL/Drizzle as the Arsiparis completed-unarchived intake list only.
- No Supabase fallback was added for migrated GET handlers.
- Browser-side `master_fungsi` filter reads in role list pages remain deferred UI/helper work. They are dropdown/filter data only and do not replace server-side role/status filtering in the migrated APIs.

### Dokumen Detail Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/dokumen.$id.ts` `GET` via local Drizzle select | Local PostgreSQL/Drizzle for GET as of Phase 7D; PATCH/DELETE in same file remain Supabase/storage-backed and out of scope | central document detail | `{ dokumen }`; parsed `lampiran_urls`, chain names, `jenis_dokumen_nama` for non-material | local `dms_session`; owner or relevant non-admin workflow role | 7D migrated |
| `src/routes/api/dokumen.$id.log.ts` | Local PostgreSQL/Drizzle as of Phase 7D | document audit log | `{ logs }`; camelCase output `stepUrutan`, `createdAt`, `userNama`, `userEmail`; timestamp order ascending | local `dms_session`; owner or relevant non-admin workflow role | 7D migrated |
| `src/routes/api/ppk/dokumen/$id.ts` | Local PostgreSQL/Drizzle as of Phase 7D | PPK detail | `{ dokumen, logs }`; status/current_step/revision_target/lampiran fields | local `dms_session` PPK role plus allowed statuses | 7D migrated |
| `src/routes/api/bendahara/dokumen/$id.ts` | Local PostgreSQL/Drizzle as of Phase 7D | Bendahara detail | `{ dokumen, ppkValidation, logs }`; PPK approval log is single-object/null | local `dms_session` BENDAHARA role plus Bendahara-relevant statuses | 7D migrated |
| `src/routes/api/arsiparis/dokumen.$id.ts` | Local PostgreSQL/Drizzle as of Phase 7D | Arsiparis review detail before archive | `{ dokumen, bendahara_approve, arsip }`; nested `fungsi`/`kegiatan` objects | local `dms_session` ARSIPARIS role and `COMPLETED` status check | 7D migrated |

Preview/download routes with `$lampiranIndex`, `preview-url`, and `download-url` are storage/file-access surfaces and are deferred.

### Report, Dashboard, Archive Read/Search/List/Metadata Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/laporan/saya.ts` | Local PostgreSQL/Drizzle as of Phase 7E | current user's completed/tersimpan report | `{ dokumen }`; enriched chain names and `leaf_node_nama`; date ordering by `tanggal` | local session owner filter | 7E migrated |
| `src/routes/api/laporan/kegiatan.ts` | Local PostgreSQL/Drizzle as of Phase 7E | Ketua Tim activity report | `{ dokumen, isKetuaTim }`; `pengaju_nama` enriched from local `auth.users` | server-side local Ketua Tim assignment required; no ADMIN broad grant | 7E migrated |
| Dashboard pages under `src/routes/*/index.tsx` | no dedicated dashboard API found in Phase 7E audit | role dashboard/stat display | UI-local/static or composed from existing list APIs | depends on caller endpoints | skipped: no dashboard read API to migrate |
| `src/routes/api/arsiparis/aktif.ts`, `aktif.$id.ts` | Local PostgreSQL/Drizzle as of Phase 7E | archive active list/detail | `{ aktif }` and `{ arsip }`; detail uses `lampiran_snapshot`, local user-name enrichment | local ARSIPARIS role; metadata only, not file access | 7E migrated |
| `src/routes/api/arsiparis/inaktif.ts`, `inaktif.$id.ts` | Local PostgreSQL/Drizzle as of Phase 7E | archive inactive list/detail | `{ inaktif }` and `{ arsip }`; same snapshot/user-name behavior | local ARSIPARIS role | 7E migrated |
| `src/routes/api/arsiparis/usul-musnah.ts`, `usul-musnah.$id.ts` `GET` | Local PostgreSQL/Drizzle for GET as of Phase 7E; PATCH remains Supabase/storage-backed | proposed destruction list/detail | `{ usul_musnah }`, `{ musnah, arsip }`; detail includes destruction metadata and snapshot | local ARSIPARIS role for GET; PATCH destruction deferred | 7E GET migrated only |
| `src/routes/api/arsiparis/search.ts` | Local PostgreSQL/Drizzle as of Phase 7E | archive search across roles | `{ arsip, total, page, per_page }`; count/pagination and post-query filtering preserved as closely as practical | local role-specific server filtering; `step_urutan` legacy column absent locally | 7E migrated with caveat |
| `src/routes/api/arsiparis/klasifikasi/index.ts` `GET` | Local PostgreSQL/Drizzle for GET as of Phase 7E; POST remains Supabase-backed | classification tree | `{ klasifikasi }`; recursive tree order by code/name and `is_root` derived from code `000` | public read preserved; mutations auth-gated and deferred | 7E GET migrated only |

### Admin/User-Management Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/users/index.ts` `GET` via `getUsersWithRoles` | Supabase Auth Admin plus Supabase tables | admin user list | `parseUserListResponse`, metadata, roles, active status; Auth Admin shape differs from local users | ADMIN dedicated role must be enforced locally | defer to 10 unless needed for 7B UI |
| `src/routes/api/users/$id.ts` `GET` via `getUserWithRoles` | Supabase Auth Admin plus Supabase tables | admin single-user read | `parseUserResponse`; auth metadata and status mapping | ADMIN dedicated role | defer to 10 unless needed for 7B UI |
| `src/lib/user-helpers.ts` read helpers | Supabase-backed | user list/single helpers and role/status reads | Auth Admin listUsers and `user_status` merge semantics | local Auth Admin replacement is larger than read API parity | defer to 10 |

### Deferred/Non-Phase-7 Surfaces

- Mutations: `POST`, `PATCH`, `DELETE` handlers for master data, dokumen update/delete/submit/resubmit, PPK/Bendahara approve/reject, archive lifecycle, classification writes, user management, password changes.
- Preview/download/file streaming: `src/routes/api/dokumen/preview-url.ts`, `download-url.ts`, `dokumen.$id.preview.$lampiranIndex.ts`, `dokumen.$id.download.$lampiranIndex.ts`, role-specific preview/download routes, and `/api/files/access`.
- Storage movement/delete: `/api/upload`, `/api/dokumen/rename-pending`, submit file movement, update/resubmit file movement, archive destruction file deletion.
- Archive destruction/delete behavior: `inaktif.$id/musnahkan`, `usul-musnah.$id` `PATCH`, lifecycle movement routes.
- Diagnostics/orphan cleanup: `src/routes/api/admin/analyze-storage.ts`, `cleanup-orphan-files.ts`.
- Global Supabase Auth/Admin retirement and user-management replacement.

These are deferred because Phase 7 is read migration only, and storage/Auth Admin retirement belongs to later phases.

## Prioritized Runtime Order

1. Phase 7B first group completed: read-only master data GET endpoints:
   - `src/routes/api/master-fungsi.ts` `GET`;
   - `src/routes/api/master-kegiatan.ts` `GET`;
   - `src/routes/api/master-kelengkapan.ts` `GET`;
   - `src/routes/api/master-jenis.ts` `GET`;
   - `src/routes/api/master-kategori.ts` `GET`;
   - `src/routes/api/master-detail.ts` `GET`.
2. Phase 7B.2 completed:
   - `src/routes/api/master-jenis.$id.ts` `GET`;
   - `src/routes/api/master-kategori.$id.ts` `GET`;
   - `src/routes/api/master-detail.$id.ts` `GET`;
   - `src/routes/api/ketua-tim/index.ts` `GET`;
   - `src/routes/api/ketua-tim/user/$userId.ts` `GET`;
   - `src/routes/api/ketua-tim/kegiatan/$kegiatanId.ts` `GET`;
   - remaining current-user support GETs were audited and remain already local: `/api/users/me`, `/api/users/me/ketua-tim`, and `/api/users/me/is-ketua-tim/$kegiatanId`.
3. Deferred within/after 7B:
   - `src/lib/master-data/jenis-dokumen.ts` `getAllJenisDokumen(...)` remains Supabase browser-helper-backed because current callers pass a browser Supabase client directly and no API route exists to preserve behavior without UI/API surface work.
4. Phase 7C role inbox/list dokumen reads migrated the scoped runtime GET group on 2026-05-17.
5. Phase 7D dokumen detail and log reads migrated the scoped runtime GET group on 2026-05-17.
6. Phase 7E migrated laporan, archive list/detail/search, and archive classification GET reads on 2026-05-17. Dashboard audit found no dedicated dashboard read API route to migrate.
7. Next recommended runtime target: Phase 7F read API stabilization and Supabase read retirement audit, unless Phase 7E smoke testing finds a concrete report/archive response-shape parity gap.

## Response-Shape Compatibility Notes

Phase 7B first-group caveat: the six migrated GET routes project explicit snake_case keys from Drizzle and rebuild the same nested join objects used by the previous Supabase responses. Timestamps are still returned as JSON strings through `Response.json(...)`; manual route smoke should verify exact timestamp formatting against local runtime data if a UI depends on string formatting beyond normal JSON date strings.

- Preserve existing snake_case response fields. Do not silently camelCase route output except where a route already does so, such as `stepUrutan` and `createdAt` in `/api/dokumen/$id/log`.
- Preserve added display-name fields: `fungsi_nama`, `kegiatan_nama`, `jenis_nama`, `kategori_nama`, `jenis_permintaan_nama`, `kategori_permintaan_nama`, `detail_permintaan_nama`, and `jenis_dokumen_nama`.
- Preserve nested join objects when current responses include them by spreading Supabase joined rows, especially master data routes.
- Preserve array vs object vs null wrappers: `{ dokumen }`, `{ inbox }`, `{ aktif }`, `{ inaktif }`, `{ usul_musnah }`, `{ arsip }`, `{ logs }`, `{ assignments }`, `{ chairman: null }`.
- Preserve status fields and filters: `status`, `current_step`, `revision_target`, `status_arsip`, `is_ditolak`.
- Preserve `lampiran_urls` and `lampiran_snapshot` JSON array shape. Missing old Supabase files are not a read-shape reason to add fallback.
- Preserve `log_aktivitas` ordering by `timestamp` ascending unless the existing list route intentionally uses latest status logs.
- Preserve timestamp/date serialization as current JSON strings where UI expects strings.
- Preserve aggregate/count shapes, especially `search` returning `{ total, page, per_page }`.
- Preserve existing error status categories and messages where UI handles them: `401 Unauthorized`, `403 Akses ditolak`, `404 ... tidak ditemukan`, and current `500` labels.
- Preserve role-specific visibility fields like `ppk_user_id`, `ppk_validated_at`, `bendahara_approve_at`, `ppkValidation`, and `bendahara_approve`.

## Validation Strategy For Phase 7B Onward

- Use focused route tests where an existing route-test pattern is available; otherwise start with small contract assertions around response wrappers, status codes, and key field names.
- For each migrated endpoint, add or run response shape assertions/snapshots where practical using local seed/new data.
- After each endpoint group, run targeted grep/audit confirming the migrated route/helper no longer uses Supabase reads and that no Supabase fallback was introduced.
- Use guarded diffs for `src/routeTree.gen.ts`, unrelated route domains, submit route, package files, DB scripts, migrations, and seeds.
- Do not add DB scripts/migrations/seeds unless a later runtime phase explicitly scopes them.
- Run manual UI smoke only after a full endpoint group is migrated, starting with form dropdowns after the 7B master GET group.
- Do not run heavy tests automatically during planning-only or docs-only tasks.

## First Runtime Target For Phase 7B

Phase 7B first-group migration completed the master data GET reads in this exact order:

1. `src/routes/api/master-fungsi.ts` `GET /api/master-fungsi`.
2. `src/routes/api/master-jenis.ts` `GET /api/master-jenis`.
3. `src/routes/api/master-kegiatan.ts` `GET /api/master-kegiatan`.
4. `src/routes/api/master-kategori.ts` `GET /api/master-kategori`.
5. `src/routes/api/master-detail.ts` `GET /api/master-detail`.
6. `src/routes/api/master-kelengkapan.ts` `GET /api/master-kelengkapan`.

First-group response decisions:

- active filtering and ordering parity were preserved;
- raw snake_case row fields were preserved through explicit projections;
- derived display-name fields from manual joins were preserved;
- query params `fungsi_id`, `jenis_id`, `kategori_id`, `kegiatan_id`, and `is_ketua_tim` were preserved;
- public-read behavior was preserved and no auth was introduced;
- no Supabase fallback was added for the migrated GET handlers.

Phase 7B.2 response decisions:

- `GET /api/master-jenis/$id` keeps a raw single snake_case row object and `404 { error: 'Jenis permintaan tidak ditemukan' }` for a missing row.
- `GET /api/master-kategori/$id` keeps a raw single snake_case row object plus `master_jenis_permintaan: { id, nama } | null` and `jenis_nama`.
- `GET /api/master-detail/$id` keeps a raw single snake_case row object plus `master_kategori_permintaan`, `kategori_nama`, and `jenis_nama`.
- The three master detail GETs preserve public-read behavior and add no auth requirement.
- `GET /api/ketua-tim/` keeps `{ assignments }`, descending `created_at` ordering, `created_by`, and nested `kegiatan: { id, nama } | null`.
- `GET /api/ketua-tim/user/$userId` keeps `{ assignments }`, UUID validation, descending `created_at` ordering, and nested `kegiatan: { id, nama } | null`.
- `GET /api/ketua-tim/kegiatan/$kegiatanId` keeps `{ chairman: null }` when missing and `{ chairman: { id, user_id, kegiatan_id, created_at, user_name, user_email } }` when present, with user enrichment coming from local `auth.users`.
- Ketua Tim GET authorization now uses local `dms_session` and ADMIN role validation; POST/PATCH/DELETE handlers in the same files remain Supabase-backed and out of Phase 7B.2 scope.
- No Supabase fallback was added for the migrated GET handlers.

After Phase 7B.2, the remaining known master/current-user read blocker is the browser-based `jenis-dokumen` helper surface. Move next to Phase 7C role inbox/list reads unless that helper is explicitly converted through a compatible API-backed route in a separate narrow task.

## Phase 7C Role Inbox/List Dokumen Runtime Migration

Date: 2026-05-17.

Phase 7C migrated the scoped role inbox/list GET routes from Supabase-backed reads to local PostgreSQL/Drizzle reads while preserving endpoint paths, query parameters, wrappers, and list-specific field names.

### Migrated Routes

| Route | Wrapper | Local filters and joins | Compatibility notes |
|---|---|---|---|
| `GET /api/dokumen` | `{ dokumen }` | local `dms_session`, PEGAWAI role, `created_by = session.user.id`, `created_at desc`, left joins to fungsi/kegiatan names | only GET changed; `POST /api/dokumen` remains deferred write scope |
| `GET /api/pegawai/revisi` | `{ dokumen }` | PEGAWAI role, owner filter, `status='NEED_REVISION'`, `revision_target='USER'`, `updated_at desc` | preserves revision list fields and name fallback |
| `GET /api/ppk/inbox` | `{ dokumen }` | PPK role, `status='IN_PPK_VALIDATION'`, optional `fungsi_id`, `start_date`, `end_date`, `created_at desc` | preserves the PPK-specific forbidden message with `bukan PPK` |
| `GET /api/ppk/tervalidasi` | `{ dokumen }` | PPK role, `status in ('IN_BENDAHARA_APPROVAL','COMPLETED','ARCHIVED')`, `created_at desc` | preserves status in each row |
| `GET /api/ppk/ditolak` | `{ dokumen }` | PPK role, `status='NEED_REVISION'`, `revision_target='USER'`, `updated_at desc` | preserves `revision_notes` |
| `GET /api/ppk/revisi` | `{ dokumen }` | PPK role, `status='NEED_REVISION'`, `revision_target='PPK'`, `updated_at desc` | preserves compact revision row shape |
| `GET /api/bendahara/inbox` | `{ dokumen }` | BENDAHARA role, `status='IN_BENDAHARA_APPROVAL'`, optional `fungsi_id`, `start_date`, `end_date`, `created_at desc`, read-only `PPK_APPROVE` log lookup | preserves `ppk_user_id` and `ppk_validated_at` |
| `GET /api/bendahara/selesai` | `{ dokumen }` | BENDAHARA role, `status='COMPLETED'`, `updated_at desc` | preserves completed-list row shape |
| `GET /api/bendahara/ditolak` | `{ dokumen }` | BENDAHARA role, `status='NEED_REVISION'`, `revision_target='PPK'`, `updated_at desc` | preserves `revision_notes` |
| `GET /api/arsiparis/inbox` | `{ inbox }` | ARSIPARIS role, `status='COMPLETED'`, anti-join against `arsip.dokumen_id`, optional `fungsi_id`, `start_date`, `end_date`, `created_at desc`, read-only `BENDAHARA_APPROVE` log lookup | preserves completed-unarchived intake semantics, `nama_pegawai`, and `bendahara_approve_at` |

### Deferred From Phase 7C

- Dokumen detail routes, log detail routes, role-specific detail routes, preview/download, storage routes, workflow mutations, report/dashboard reads, archive active/inactive/usul-musnah/search reads, and archive lifecycle/destruction behavior remain deferred to later phases.
- Role list UI pages still contain browser Supabase reads for `master_fungsi` filter dropdowns. These are not the security boundary and remain deferred to the owning UI/helper retirement phase or a later narrow filter-read cleanup.
- `src/lib/master-data/jenis-dokumen.ts` remains deferred as recorded in Phase 7B.3.

## Phase 7D Dokumen Detail/Log Runtime Migration

Date: 2026-05-17.

Phase 7D migrated the scoped document metadata/detail and audit-log GET routes from Supabase-backed reads to local PostgreSQL/Drizzle reads while preserving endpoint paths, response wrappers, and the existing metadata-only behavior.

### Migrated Routes

| Route | Wrapper | Local filters and joins | Compatibility notes |
|---|---|---|---|
| `GET /api/dokumen/$id` | `{ dokumen }` | local `dms_session`, owner or relevant non-admin workflow role, left joins to fungsi/kegiatan/request-chain/jenis-dokumen names | only GET changed; PATCH/DELETE in the same route file remain deferred write/storage scope |
| `GET /api/dokumen/$id/log` | `{ logs }` | local `dms_session`, same owner/relevant-role visibility as central detail, left join to local `auth.users` for actor display | preserves ascending `timestamp` ordering and camelCase log fields |
| `GET /api/ppk/dokumen/$id` | `{ dokumen, logs }` | PPK role, status in `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, `NEED_REVISION`, `COMPLETED`, `ARCHIVED`, left joins to master display names | preserves PPK wrapper and raw log rows; no approve/reject migration |
| `GET /api/bendahara/dokumen/$id` | `{ dokumen, ppkValidation, logs }` | BENDAHARA role, status in Bendahara-relevant states, `PPK_APPROVE` metadata lookup, left joins to master display names | preserves `ppkValidation` single-object/null shape and raw log rows; no approve/reject migration |
| `GET /api/arsiparis/dokumen/$id` | `{ dokumen, bendahara_approve, arsip }` | ARSIPARIS role, `status='COMPLETED'`, `BENDAHARA_APPROVE` metadata lookup, read-only existing `arsip` lookup | preserves pre-archive review shape and does not touch archive mutation/lifecycle behavior |

### Phase 7D Compatibility Decisions

- No Supabase fallback was added for migrated GET handlers.
- Local authorization uses `dms_session` assigned roles through `getLocalServerSession(...)` and `hasLocalRole(...)`; `dms_active_role` is not trusted as proof.
- `ADMIN` is not treated as a substitute for PEGAWAI, PPK, BENDAHARA, or ARSIPARIS detail visibility.
- Central detail/log now fail closed to owner or relevant non-admin workflow role visibility instead of preserving the old broad approver/Admin behavior.
- `lampiran_urls` remains metadata-only JSON from `dokumen_transaksi`; the routes do not validate physical file existence and do not stream, sign, copy, or migrate files.
- Log reads remain append-only and read-only; actor enrichment uses local `auth.users.display_name`, `nama_lengkap`, then `email`, with `Unknown` fallback.
- Numeric `nominal_realisasi` is normalized to a JSON number or `null` in migrated detail responses where the legacy UI expects numeric formatting.
- Invalid UUID params are treated as not found for these metadata reads to avoid exposing database errors.

### Deferred From Phase 7D

- Preview/download/file-access routes remain storage/file-streaming work: central `$lampiranIndex` preview/download, raw `preview-url`/`download-url`, and role-specific PPK/Bendahara preview/download.
- Workflow mutations remain deferred: central PATCH/DELETE, submit/resubmit, PPK approve/reject/resubmit/kembalikan, Bendahara approve/reject, and Arsiparis archive.
- Archive active/inactive/usul-musnah detail routes that read `lampiran_snapshot`, archive list/search routes, and archive classification reads remain Phase 7E read work.
- Archive lifecycle/destruction/delete behavior remains Phase 8/9 work.

## Phase 7E Report/Dashboard/Archive Runtime Migration

Date: 2026-05-17.

Phase 7E migrated the scoped report and archive metadata/search/classification GET routes from Supabase-backed reads to local PostgreSQL/Drizzle reads. It did not migrate archive lifecycle mutations, destruction/delete behavior, preview/download, file streaming, storage cleanup, browser filter helper reads, or dashboard UI code.

### Migrated Routes

| Route | Wrapper | Local filters and joins | Compatibility notes |
|---|---|---|---|
| `GET /api/laporan/saya` | `{ dokumen }` | local `dms_session`, `created_by = session.user.id`, `status in ('COMPLETED','TERSIMPAN')`, joins to fungsi/kegiatan/request-chain names | preserves `tanggal desc`, chain IDs, display-name fields, `leaf_node_nama`, `pengaju_id`, and completed/tersimpan report bucket |
| `GET /api/laporan/kegiatan` | `{ dokumen, isKetuaTim }` | local `dms_session`, local `ketua_tim_assignments.user_id`, kegiatan-scoped `COMPLETED`/`TERSIMPAN` docs, local user-name enrichment | returns `{ dokumen: [], isKetuaTim: false }` when no Ketua Tim assignment exists; ADMIN is not granted broad access |
| `GET /api/arsiparis/aktif` | `{ aktif }` | ARSIPARIS role, `status_arsip='AKTIF'`, `is_ditolak=false`, optional `fungsi_id`, `tahun`, and `q` filters, joins to dokumen/fungsi/kegiatan | preserves active-list metadata-only shape and `archived_at desc` ordering |
| `GET /api/arsiparis/aktif/$id` | `{ arsip }` | ARSIPARIS role, archive ID plus `status_arsip='AKTIF'`, joins to dokumen/master names and local `auth.users` | preserves nested `dokumen`, `lampiran_snapshot` as `dokumen.lampiran_urls`, retention fields, and archived user-name fallback |
| `GET /api/arsiparis/inaktif` | `{ inaktif }` | ARSIPARIS role, `status_arsip='INAKTIF'`, `is_ditolak=false`, optional `fungsi_id` and `tahun`, joins to dokumen/fungsi/kegiatan | preserves inactive-list metadata fields and `archived_at desc` ordering |
| `GET /api/arsiparis/inaktif/$id` | `{ arsip }` | ARSIPARIS role, archive ID plus `status_arsip='INAKTIF'`, joins to dokumen/master names and local `auth.users` | preserves inactive detail shape and `lampiran_snapshot` metadata behavior |
| `GET /api/arsiparis/usul-musnah` | `{ usul_musnah }` | ARSIPARIS role, `status_arsip='USUL_MUSNAH'`, `is_ditolak=false`, inner join to `arsip_usul_musnah`, optional `fungsi_id` and `tahun` | preserves proposed-destruction list fields; no lifecycle write behavior changed |
| `GET /api/arsiparis/usul-musnah/$id` | `{ musnah, arsip }` | ARSIPARIS role, `arsip_usul_musnah.id`, joins to `arsip`, dokumen/master names, and local `auth.users` for names | only GET migrated; PATCH remains Supabase/storage-backed and out of scope |
| `GET /api/arsiparis/search` | `{ arsip, total, page, per_page }` | local authenticated session, base `arsip.is_ditolak=false` page, local role-specific document filtering, optional `fungsi_id`, `kegiatan_id`, `tahun`, and `q` post-filtering | preserves `PER_PAGE=20`, wrapper keys, and broad ADMIN/ARSIPARIS search visibility; legacy PPK `step_urutan` filter is approximated with status visibility because local schema has no `step_urutan` column |
| `GET /api/arsiparis/klasifikasi/` | `{ klasifikasi }` | public local Drizzle read of active `master_klasifikasi_arsip`, ordered by `nama`, then recursive tree sort by `kode`/`nama` | only GET migrated; POST/PATCH/DELETE classification mutations remain Supabase-backed and deferred |

### Skipped Or Deferred In 7E

- Dashboard counts/statistics: no dedicated `src/routes/api/dashboard*` or role dashboard count/stat API route was found. Dashboard cards appear UI-local/static or composed from already scoped list APIs, so no runtime dashboard API migration was performed.
- Browser filter reads in laporan/archive pages still use Supabase browser helpers for dropdown data. They are not server authorization boundaries and remain a later helper/UI retirement task.
- `src/routes/api/arsiparis/aktif.$id/pindahkan.ts`, `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts`, `POST /api/arsiparis/dokumen/$id/archive`, and `PATCH /api/arsiparis/usul-musnah/$id` remain lifecycle/destruction/write surfaces.
- Preview/download/file routes remain storage/file-access work. Phase 7E does not complete `DIMUSNAHKAN` file-access blocking.

### Phase 7E Compatibility Caveats

- Archive metadata routes can still expose `status_arsip='DIMUSNAHKAN'` through search metadata when present, matching the metadata/search boundary. File preview/download blocking remains a storage/file-access phase responsibility.
- `GET /api/arsiparis/search` preserves the legacy broad count and post-page filtering behavior as closely as practical, but the old PPK `step_urutan >= 5` predicate cannot be reproduced exactly because local `dokumen.dokumen_transaksi` does not model `step_urutan`. The local replacement uses status-based PPK visibility for documents past PPK.
- Local user-name enrichment uses `auth.users.display_name`, then `nama_lengkap`, then `email`, instead of Supabase Auth Admin metadata.

## Phase 7B.3 Browser Master Data Read Surface Inventory

Date: 2026-05-17.

Phase 7B.3 is docs/inventory only. It did not migrate browser helpers, did not add API routes, did not touch `src/routeTree.gen.ts`, and did not remove Supabase client usage. The inventory was created from lightweight listings/searches of `src/lib/master-data`, `src/routes`, and `src/components`.

### Helper Inventory

| Helper file | Exported read functions | Browser Supabase dependency | Read-only or mixed | Known active callers | Safe later API-backed read route? | Recommended placement |
|---|---|---|---|---|---|---|
| `src/lib/master-data/shared.ts` | none; row types only | none | type-only | `src/components/dokumen/form/dokumen-form-types.ts` re-exports row types | no route needed | keep temporarily |
| `src/lib/master-data/fungsi.ts` | `getAllFungsi`, `getFungsiById`, `getFungsiWithKegiatanCount` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation | `admin.master-data.fungsi.tsx`, `admin.master-data.kegiatan.tsx`, `admin.master-data.kelengkapan.tsx`, `pegawai/dokumen/aju.tsx`, `HierarchicalFilter.tsx` | yes for active list reads via existing `GET /api/master-fungsi`; count/id helper parity needs explicit scope | admin mixed pages: Phase 10/11; report filter: Phase 7E; Pegawai submit form only if a future narrow form-read phase is approved |
| `src/lib/master-data/kegiatan.ts` | `getAllKegiatan`, `getKegiatanByFungsi`, `getKegiatanById` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation | `admin.master-data.kegiatan.tsx`, `admin.master-data.kelengkapan.tsx`, `pegawai/dokumen/aju.tsx`, `HierarchicalFilter.tsx` | yes for list/filter reads via existing `GET /api/master-kegiatan?fungsi_id=`; id helper parity needs explicit scope | admin mixed pages: Phase 10/11; report filter: Phase 7E; Pegawai submit form only if a future narrow form-read phase is approved |
| `src/lib/master-data/jenis.ts` | `getAllJenis`, `getAllJenisWithCount` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation | `admin.master-data.jenis.tsx`, `admin.master-data.kategori.tsx`, `admin.master-data.detail.tsx`, `admin.master-data.kelengkapan.tsx`, `pegawai/dokumen/aju.tsx`, `HierarchicalFilter.tsx` | yes for active list reads via existing `GET /api/master-jenis`; count helper parity needs explicit scope | admin mixed pages: Phase 10/11; report filter: Phase 7E; Pegawai submit form only if a future narrow form-read phase is approved |
| `src/lib/master-data/kategori.ts` | `getAllKategoriWithCount`, `getKategoriByJenis` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation | `admin.master-data.kategori.tsx`, `admin.master-data.detail.tsx`, `admin.master-data.kelengkapan.tsx`, `pegawai/dokumen/aju.tsx`, `HierarchicalFilter.tsx` | yes for filtered list reads via existing `GET /api/master-kategori?jenis_id=`; count helper parity needs explicit scope | admin mixed pages: Phase 10/11; report filter: Phase 7E; Pegawai submit form only if a future narrow form-read phase is approved |
| `src/lib/master-data/detail.ts` | `getDetailByKategori`, `hasDetailChildren`, `getAllDetailWithInfo` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation/validation | `admin.master-data.detail.tsx`, `admin.master-data.kelengkapan.tsx`, `pegawai/dokumen/aju.tsx`, `HierarchicalFilter.tsx`; no active caller found for `hasDetailChildren` | yes for filtered list reads via existing `GET /api/master-detail?kategori_id=`; all-info/count-like parity needs explicit scope | admin mixed pages: Phase 10/11; report filter: Phase 7E; Pegawai submit form only if a future narrow form-read phase is approved; validation helper stays temporary |
| `src/lib/master-data/kelengkapan.ts` | `getAllKelengkapan`, `getKelengkapanByKegiatan`, `getKelengkapanByKegiatanWithInfo`, `getKelengkapanByChain` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation/validation | `admin.master-data.kelengkapan.tsx` through helper; separate direct browser queries exist in `KelengkapanChecklist.tsx`, `pegawai/dokumen/$id/revisi.tsx`, and `ppk/dokumen/$id/resubmit.tsx` | partial: existing `GET /api/master-kelengkapan?kegiatan_id=&is_ketua_tim=` covers basic list reads, but chain-filter parity needs explicit API scope | direct revision/resubmit/checklist surfaces belong with owning workflow/detail phases; admin mixed page stays Phase 10/11 |
| `src/lib/master-data/jenis-dokumen.ts` | `getAllJenisDokumen` | accepts caller-provided `SupabaseClient`; current browser callers create it with `getBrowserClient()` | mixed read/mutation | `pegawai/dokumen/aju.tsx` non-material branch and `admin.master-data.jenis-dokumen.tsx` | yes, but no existing `GET /api/master-jenis-dokumen` route was found | justified as a future API-backed read surface, but not an immediate 7B.4 blocker because the current form also depends on other browser Supabase master-data reads |

### Caller And Phase Placement

| Caller surface | Uses | Placement | Reason |
|---|---|---|---|
| `src/routes/pegawai/dokumen/aju.tsx` | helper-based browser reads for fungsi, kegiatan, jenis, kategori, detail, and jenis dokumen | no immediate 7B.4; future narrow form-read phase only if explicitly accepted | this is a real local-runtime concern for form dropdowns, but migrating it safely requires more than one helper/read surface; do not repeat the broad helper/UI rewrite |
| `src/components/dokumen/KelengkapanChecklist.tsx` | direct browser `master_kelengkapan_dokumen` query with chain filters | owning workflow/detail phase, likely Phase 7D or later workflow/storage phase | tied to submit/revision attachment behavior, required-item validation, and upload state rather than a standalone master list |
| `src/routes/pegawai/dokumen/$id/revisi.tsx` | direct browser `master_kelengkapan_dokumen` query | Phase 7C/7D owning-domain migration | revision workflow screen should move with Pegawai revision/detail reads, not as a generic helper migration |
| `src/routes/ppk/dokumen/$id/resubmit.tsx` | direct browser `master_kelengkapan_dokumen` query | Phase 7C/7D owning-domain migration | PPK resubmit is a role workflow/detail surface with attachment editing |
| `src/components/laporan/HierarchicalFilter.tsx` | helper-based browser reads for report filters | Phase 7E | report filter reads should move with laporan/dashboard read migration |
| `src/routes/ppk/inbox.tsx` and `src/routes/bendahara/inbox.tsx` | direct browser `master_fungsi` filter reads | Phase 7C | these are role inbox/list filters and should move with the role list APIs |
| `src/routes/arsiparis/inbox.tsx` | direct browser `master_fungsi` filter read | Phase 7C or Phase 7E depending on archive grouping | it is both a role inbox and archive intake list; keep with the owning list/archive phase instead of helper migration |
| `src/routes/arsiparis/aktif/index.tsx`, `inaktif/index.tsx`, `usul-musnah/index.tsx`, `search.tsx` | direct browser `master_fungsi`, and `search.tsx` also reads `master_kegiatan` | Phase 7E | archive/report filters should move with archive metadata/search reads |
| `src/routes/admin.master-data.*.tsx` | helper-based browser reads plus browser mutations in the same pages | Phase 10/11 for browser client retirement; mutations remain Phase 8/admin write work | these pages are mixed CRUD surfaces; do not rewrite admin pages during a read inventory phase |
| `src/components/dokumen/form/dokumen-form-types.ts` | type-only row exports | keep temporarily | no runtime read dependency |

### Phase 7B.4 Decision

Do not create an immediate Phase 7B.4 from this inventory. A `master_jenis_dokumen` API-backed read route is justified eventually because `getAllJenisDokumen(...)` has active browser callers and no existing `GET /api/master-jenis-dokumen` route was found, but it is not the only browser master-data dependency in the current submit form. A one-route `jenis_dokumen` carve-out would not by itself make `/pegawai/dokumen/aju` API-backed because the same page still reads fungsi, kegiatan, jenis, kategori, and detail through browser Supabase helpers.

The current next runtime phase should remain Phase 7C role inbox/list dokumen reads. If `jenis_dokumen` is later accepted as a concrete blocker before Phase 10/11, create a narrow Phase 7B.4 with only this scope:

- add `GET /api/master-jenis-dokumen` or reuse an existing route if one exists by then;
- migrate only `src/lib/master-data/jenis-dokumen.ts` read behavior and its minimal direct read callers if safe;
- allow `src/routeTree.gen.ts` changes only in that future route-creation phase;
- do not migrate broad master-data helpers;
- do not rewrite admin pages;
- do not migrate role, report, archive, or workflow callers.

### Guardrails From 7B.3

- Do not import Drizzle or `db` into browser-reachable helper modules.
- Browser callers should move through API-backed read surfaces, not direct local database imports.
- Caller migration should happen with the owning domain phase when broad UI context is involved.
- No Supabase fallback for migrated read endpoints.
- No old Supabase Storage migration, copy, download, backfill, or sync.
- Global Supabase client retirement remains later Phase 10/11 work.
