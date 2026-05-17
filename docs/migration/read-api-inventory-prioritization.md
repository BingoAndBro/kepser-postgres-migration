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
| `src/routes/api/master-fungsi.ts` `GET /api/master-fungsi` | Supabase-backed | active fungsi dropdown/list | returns raw snake_case rows array; active filter and `nama` ordering | public read today | 7B first |
| `src/routes/api/master-kegiatan.ts` `GET /api/master-kegiatan?fungsi_id=` | Supabase-backed | kegiatan dropdown/list | adds `fungsi_nama` while preserving nested `master_fungsi` row data | public read today | 7B first |
| `src/routes/api/master-kelengkapan.ts` `GET /api/master-kelengkapan?kegiatan_id=&is_ketua_tim=` | Supabase-backed | required document checklist | adds `kegiatan_nama` and `fungsi_nama`; no `is_active` filter in current route | public read today | 7B first |
| `src/routes/api/master-jenis.ts` `GET /api/master-jenis` | Supabase-backed | jenis permintaan dropdown/list | raw snake_case rows array, active filter, `nama` ordering | public read today | 7B first |
| `src/routes/api/master-kategori.ts` `GET /api/master-kategori?jenis_id=` | Supabase-backed | kategori permintaan dropdown/list | adds `jenis_nama`, preserves nested join object if callers rely on it | public read today | 7B first |
| `src/routes/api/master-detail.ts` `GET /api/master-detail?kategori_id=` | Supabase-backed | detail permintaan dropdown/list | adds `kategori_nama` and `jenis_nama`, preserves nested join object | public read today | 7B first |
| `src/routes/api/master-jenis.$id.ts`, `master-kategori.$id.ts`, `master-detail.$id.ts` `GET` | Supabase-backed | admin/detail read for edit flows | single object or `404 { error }`; joined display names for kategori/detail | public read today | 7B after list reads |
| `src/lib/master-data/jenis-dokumen.ts` `getAllJenisDokumen(...)` | Supabase browser/helper-backed | non-material jenis dokumen dropdown/admin page | returns `JenisDokumenRow[]`; no API route exists in current listing | currently client-helper based, not server API | 7B after route GETs |
| `src/routes/api/users/me.ts` | already local | current profile | maps local auth user fields through existing profile parser | local `dms_session` already authoritative | done before 7B |
| `src/routes/api/users/me/ketua-tim.ts` and `src/routes/api/users/me/is-ketua-tim/$kegiatanId.ts` | already local | current-user Ketua Tim support | `{ is_ketua_tim, kegiatan }` and `{ is_ketua_tim }` | local `dms_session` already authoritative | done before 7B |
| `src/routes/api/ketua-tim/index.ts`, `user/$userId.ts`, `kegiatan/$kegiatanId.ts` `GET` | Supabase-backed | admin Ketua Tim assignment reads | `{ assignments }` / `{ chairman }`, nested `kegiatan`, user-name enrichment via Supabase Admin | ADMIN must stay dedicated; local session/role validation needed | 7B after master reads |

Mutation handlers in the same master/ketua-tim files are not Phase 7 read targets.

### Role Inbox/List Dokumen Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/dokumen/index.ts` `GET /api/dokumen` via `getDokumenByUser` | Supabase-backed | Pegawai document list | `{ dokumen }`; helper parses rows and joins `fungsi_nama`, `kegiatan_nama` | owner filter must be server-side local session | 7C |
| `src/routes/api/pegawai/revisi.ts` | Supabase-backed | Pegawai revision inbox | `{ dokumen }`; only selected fields, `revision_notes`, `updated_at` | owner plus `NEED_REVISION`/`USER` filters | 7C |
| `src/routes/api/ppk/inbox.ts`, `tervalidasi.ts`, `ditolak.ts`, `revisi.ts` | Supabase-backed | PPK role lists | `{ dokumen }`; status-specific fields and manual master joins | PPK role check must use local assigned roles, not UI state | 7C |
| `src/routes/api/bendahara/inbox.ts`, `selesai.ts`, `ditolak.ts` | Supabase-backed | Bendahara role lists | `{ dokumen }`; inbox includes `ppk_user_id` and `ppk_validated_at` from `log_aktivitas` | Bendahara role check and status filters | 7C |
| `src/routes/api/arsiparis/inbox.ts` | Supabase-backed | completed documents awaiting archive | `{ inbox }`; excludes existing `arsip`, includes `bendahara_approve_at` | Arsiparis role check and completed/unarchived filter | 7C or 7E if grouped with archive |

### Dokumen Detail Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/dokumen.$id.ts` `GET` via `getDokumenById` | Supabase-backed | central document detail | `{ dokumen }`; parsed `lampiran_urls`, chain names, `jenis_dokumen_nama` for non-material | owner or approver role must be local and server-side | 7D |
| `src/routes/api/dokumen.$id.log.ts` | Supabase-backed plus Supabase Auth Admin user lookup | document audit log | `{ logs }`; camelCase output `stepUrutan`, `createdAt`, `userNama`, `userEmail`; timestamp order ascending | owner or approver role check currently broad | 7D |
| `src/routes/api/ppk/dokumen/$id.ts` | Supabase-backed | PPK detail | `{ dokumen, logs }`; status/current_step/revision_target/lampiran fields | PPK role plus allowed statuses | 7D |
| `src/routes/api/bendahara/dokumen/$id.ts` | Supabase-backed | Bendahara detail | `{ dokumen, ppkValidation, logs }`; PPK approval log is single-object/null | Bendahara role plus detail visibility | 7D |
| `src/routes/api/arsiparis/dokumen.$id.ts` | Supabase-backed | Arsiparis review detail before archive | `{ dokumen, bendahara_approve, arsip }`; nested `fungsi`/`kegiatan` objects | Arsiparis role and `COMPLETED` status check | 7D or 7E |

Preview/download routes with `$lampiranIndex`, `preview-url`, and `download-url` are storage/file-access surfaces and are deferred.

### Report, Dashboard, Archive Read/Search/List/Metadata Reads

| Surface | Current backing | Purpose | Shape risk | Auth/RBAC risk | Target |
|---|---|---|---|---|---|
| `src/routes/api/laporan/saya.ts` via `getDokumenSelesaiByUser` | Supabase-backed | current user's completed/tersimpan report | `{ dokumen }`; enriched chain names and `leaf_node_nama`; date ordering by `tanggal` | owner filter | 7E |
| `src/routes/api/laporan/kegiatan.ts` via `getDokumenKegiatanByKetuaTim` | Supabase-backed plus Supabase Auth Admin enrichment | Ketua Tim activity report | `{ dokumen, isKetuaTim }`; `pengaju_nama` enrichment may differ under local users | Ketua Tim assignment must be server-side | 7E |
| Dashboard pages under `src/routes/*/index.tsx` | no dedicated dashboard API found | role dashboard/stat display | appears UI-local/static or composed from existing list APIs | depends on caller endpoints | validate in 7E |
| `src/routes/api/arsiparis/aktif.ts`, `aktif.$id.ts` | Supabase-backed | archive active list/detail | `{ aktif }` and `{ arsip }`; detail uses `lampiran_snapshot`, user-name enrichment | Arsiparis role; metadata only, not file access | 7E |
| `src/routes/api/arsiparis/inaktif.ts`, `inaktif.$id.ts` | Supabase-backed | archive inactive list/detail | `{ inaktif }` and `{ arsip }`; same snapshot/user-name risks | Arsiparis role | 7E |
| `src/routes/api/arsiparis/usul-musnah.ts`, `usul-musnah.$id.ts` `GET` | Supabase-backed | proposed destruction list/detail | `{ usul_musnah }`, `{ musnah, arsip }`; detail includes destruction metadata and snapshot | Arsiparis role; PATCH destruction deferred | 7E read-only GET only |
| `src/routes/api/arsiparis/search.ts` | Supabase-backed | archive search across roles | `{ arsip, total, page, per_page }`; count/pagination and post-query filtering are high parity risk | role-specific server filtering is critical | 7E |
| `src/routes/api/arsiparis/klasifikasi/index.ts` `GET` | Supabase-backed | classification tree | `{ klasifikasi }`; recursive tree order by code/name and `is_root` derived from code `000` | currently public read; mutations auth-gated | 7E |

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

1. Phase 7B first: read-only master data GET endpoints:
   - `src/routes/api/master-fungsi.ts` `GET`;
   - `src/routes/api/master-kegiatan.ts` `GET`;
   - `src/routes/api/master-kelengkapan.ts` `GET`;
   - `src/routes/api/master-jenis.ts` `GET`;
   - `src/routes/api/master-kategori.ts` `GET`;
   - `src/routes/api/master-detail.ts` `GET`.
2. Continue Phase 7B:
   - `src/routes/api/master-jenis.$id.ts` `GET`;
   - `src/routes/api/master-kategori.$id.ts` `GET`;
   - `src/routes/api/master-detail.$id.ts` `GET`;
   - `src/lib/master-data/jenis-dokumen.ts` `getAllJenisDokumen(...)` and its UI callers, because no `/api/master-jenis-dokumen` route exists in the current API listing;
   - `src/routes/api/ketua-tim/index.ts` `GET`;
   - `src/routes/api/ketua-tim/user/$userId.ts` `GET`;
   - `src/routes/api/ketua-tim/kegiatan/$kegiatanId.ts` `GET`;
   - any remaining current-user support reads discovered during 7B. Current inventory found `/api/users/me`, `/api/users/me/ketua-tim`, and `/api/users/me/is-ketua-tim/$kegiatanId` already local.
3. Phase 7C: role inbox/list dokumen reads.
4. Phase 7D: dokumen detail and log reads.
5. Phase 7E: laporan, dashboard validation, archive list/detail/search/classification reads.
6. Phase 7F: stabilization, audit, response-shape checks, and deferred-read documentation.

## Response-Shape Compatibility Notes

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

Start Phase 7B with master data GET reads in this exact order:

1. `src/routes/api/master-fungsi.ts` `GET /api/master-fungsi`.
2. `src/routes/api/master-jenis.ts` `GET /api/master-jenis`.
3. `src/routes/api/master-kegiatan.ts` `GET /api/master-kegiatan`.
4. `src/routes/api/master-kategori.ts` `GET /api/master-kategori`.
5. `src/routes/api/master-detail.ts` `GET /api/master-detail`.
6. `src/routes/api/master-kelengkapan.ts` `GET /api/master-kelengkapan`.

Expected first-group response risks:

- active filtering and ordering parity;
- preserving raw snake_case row fields;
- preserving derived display-name fields from manual joins;
- preserving query params `fungsi_id`, `jenis_id`, `kategori_id`, `kegiatan_id`, and `is_ketua_tim`;
- preserving public-read behavior unless the runtime phase explicitly decides to tighten access with compatible UI impact.

After those six routes, inspect and migrate the three existing detail GETs and the `jenis-dokumen` helper surface before moving to role inbox/list reads.
