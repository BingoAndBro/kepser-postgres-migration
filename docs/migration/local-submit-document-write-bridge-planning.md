# Phase 6F.1 Local Submit Document/Write Compatibility Bridge Planning

Date: 2026-05-16.

## 1. Phase Scope

Phase 6F.1 is docs and planning only.

No runtime source code changed in this phase.

No local submit document/write bridge, helper, repository, or Drizzle write service was implemented.

`POST /api/dokumen/submit` route wiring is not implemented in this phase.

No database scripts, migrations, seed scripts, auth hash scripts, build, dev server, full typecheck, route generation, or full test suite were run.

## 2. Why This Bridge Planning Is Needed

Submit is currently blocked by identity-domain and write-domain compatibility, not by storage planning alone.

Storage-side readiness has improved:

- local upload now writes new `/api/upload` files to local filesystem storage using local `dms_session` identity;
- local `rename-pending` now moves local files for files that already exist locally;
- the submit move plan builder can plan logical submit paths, including `temp-id`, without route wiring or filesystem IO.

But submit still writes and reads through Supabase-backed helpers and direct Supabase queries. Current submit uses Supabase session user ids for document creator, storage owner segment, Ketua Tim checks, status update actor, and audit actor. New local uploads use local `auth.users.id` as the owner segment.

Mixing local `dms_session.userId` into Supabase-backed document writes, audit writes, and `ketua_tim_assignments` reads is unsafe because the local migration intentionally uses fresh local UUIDs and does not import or preserve old Supabase Auth user ids.

The bridge planning is therefore needed before submit can safely switch to local `dms_session` identity and local filesystem move execution.

## 3. Current Submit Write-Domain Inventory

| Dependency | Current module/function | Current backing source | Can local `dms_session` id be used now? | Bridge need | Risk |
|---|---|---|---|---|---|
| Auth/session source | `getServerSession(supabase)` in `src/routes/api/dokumen/submit.ts` | Supabase Auth through request-scoped Supabase server client | No | Replace with local actor resolver only after local write/read domain exists | Critical identity-domain mixing |
| User id source | `session.user.id` | Supabase Auth user id | No | Local submit actor must expose one canonical local user id used by DB writes and storage owner paths | Critical creator/audit/assignment mismatch |
| Display-name source | `session.user.user_metadata`, `session.user.email` | Supabase Auth metadata | Partially | Local actor adapter should derive compatible display name from local session/user profile | Medium title drift |
| Master kegiatan read | direct `.from('master_kegiatan')` in submit | Supabase PostgREST | Not relevant by id, but not local | Local master read helper needed | Medium missing or divergent data |
| Required attachment reads | `getKelengkapanRequired(supabase, ...)` | Supabase PostgREST through `src/lib/dokumen/queries.ts` | Not user-id dependent, but not local | Local required-kelengkapan read helper needed | Medium validation drift |
| Ketua Tim assignment check | direct `.from('ketua_tim_assignments').eq('user_id', session.user.id)` | Supabase PostgREST | No | Local assignment read using local `auth.users.id` | High false allow/deny |
| Title/leaf resolution | direct `master_jenis_dokumen` read and `resolveLeafNodeName(supabase, ...)` | Supabase PostgREST | Not user-id dependent, but not local | Local leaf/name resolver needed | Medium title drift |
| Document creation | `createDokumen(supabase, payload)` | Supabase insert into `dokumen_transaksi` | No | Local create helper/repository needed | Critical write-domain mismatch |
| Status update | `updateDokumenStatus(admin, dok.id, ...)` | Supabase admin update of `dokumen_transaksi` | No | Local status update helper inside submit write unit | High workflow state mismatch |
| Audit insert | `insertLog(admin, payload)` | Supabase admin insert into `log_aktivitas` | No | Local append-only audit helper needed | High audit-domain mismatch |
| Attachment metadata persistence | `createDokumen(... lampiranUrls: processedLampirans)` | Supabase `dokumen_transaksi.lampiran_urls`, JSON string | No | Local JSONB-compatible metadata write preserving response shape | High metadata can point at wrong storage domain |
| FSM transition | `transition(dok.status, 'SUBMIT', 'PEGAWAI')` | Local TypeScript FSM | Yes for pure material transition | Preserve exactly; bridge should call or mirror existing FSM behavior | Medium if bypassed |
| Material/non-material branch | `validateNominalForMaterial(...)`, FSM for material, manual `TERSIMPAN` for non-material | Local Zod/helper plus route-local shortcut | Yes for local validation logic | Bridge must preserve material `SUBMIT` and non-material `STORE`/`TERSIMPAN` | High behavior drift if normalized incorrectly |
| Storage move planning | `buildSubmitMovePlan(...)` | Local TypeScript logical planner | Yes as planner only | Route wiring still needs local write bridge and file preflight/executor later | Medium if treated as executor |
| Storage move execution | route-local Supabase Storage `.move(...)` | Supabase Storage admin client | No | Future local move executor after bridge and preflight | Critical DB/file partial failure |

Current local-compatible dependencies are limited to pure TypeScript validation, FSM transition semantics, nominal validation, constants, Zod request schema, local auth helper availability, local storage path/move primitives, and the submit move planner.

Current Supabase-backed dependencies are submit auth, master reads, required attachment reads, Ketua Tim assignment check, document create, status update, audit insert, route-local storage move execution, and helper response enrichment reads.

## 4. Local PostgreSQL Schema Availability Check

This phase inspected local Drizzle schema files, generated SQL, seed files, and migration planning docs only. It did not run database scripts or verify the live database state.

| Table/domain | Schema location | Required columns appear to exist? | Seed data exists? | Write helpers exist? | Runtime APIs currently use local table? |
|---|---|---:|---:|---:|---:|
| `auth.users` | `src/db/schema/auth/users.ts`, generated SQL | Yes: `id`, `email`, password/profile/status metadata | Yes for dev users when seed is enabled | Auth/session helpers exist | Yes for auth/session and `/api/users/me` |
| `auth.roles` | `src/db/schema/auth/roles.ts`, generated SQL | Yes: `id`, `nama` | Yes, 5 canonical roles | Auth helpers exist | Yes for auth/session |
| `auth.user_roles` | `src/db/schema/auth/user-roles.ts`, generated SQL | Yes: `user_id`, `role_id` | Yes, 8 dev joins per prior seed doc | Auth helpers exist | Yes for auth/session |
| `master.master_kegiatan` | `src/db/schema/master/kegiatan.ts`, generated SQL | Yes: `id`, `fungsi_id`, `nama`, `is_active` | Yes, minimal dev row | Limited local read usage in current-user Ketua Tim endpoints only | Partially, not submit |
| `master.master_kelengkapan_dokumen` | `src/db/schema/master/kelengkapan-dokumen.ts`, generated SQL | Yes: `id`, `kegiatan_id`, `is_ketua_tim`, `nama_dokumen`, `required`, request-chain columns | Yes, 3 minimal dev rows | No submit-specific helper | No submit/runtime use |
| `master.master_jenis_dokumen` | `src/db/schema/master/jenis-dokumen.ts`, generated SQL | Yes: `id`, `nama`, `is_active` | Yes, minimal dev row | No submit-specific helper | No submit/runtime use |
| `master.master_jenis_permintaan` | `src/db/schema/master/jenis-permintaan.ts`, generated SQL | Yes: `id`, `nama`, `is_active` | Yes, minimal dev row | No submit-specific helper | No submit/runtime use |
| `master.master_kategori_permintaan` | `src/db/schema/master/kategori-permintaan.ts`, generated SQL | Yes: `id`, `jenis_permintaan_id`, `nama`, `is_active` | Yes, minimal dev row | No submit-specific helper | No submit/runtime use |
| `master.master_detail_permintaan` | `src/db/schema/master/detail-permintaan.ts`, generated SQL | Yes: `id`, `kategori_permintaan_id`, `nama`, `is_active` | Yes, minimal dev row | No submit-specific helper | No submit/runtime use |
| `master.ketua_tim_assignments` | `src/db/schema/master/ketua-tim-assignments.ts`, generated SQL | Yes: `id`, `user_id`, `kegiatan_id`, `created_by`; unique `kegiatan_id` | Yes, optional dev fixture when users are seeded | Read helpers exist only in current-user endpoints | Partially, not submit |
| `dokumen.dokumen_transaksi` | `src/db/schema/dokumen/dokumen-transaksi.ts`, generated SQL | Yes: submit-required columns including status fields, `lampiran_urls` JSONB, creator, nominal, non-material fields, request chain | No workflow rows seeded | No local submit write helper | No submit/runtime use |
| `dokumen.log_aktivitas` | `src/db/schema/dokumen/log-aktivitas.ts`, generated SQL | Yes: `dokumen_id`, `user_id`, `aksi`, `catatan`, `step_urutan`, `timestamp` | No workflow logs seeded | No local audit helper | No submit/runtime use |

Schema readiness is broadly sufficient for a helper-foundation phase, but runtime readiness is not. The required local tables appear modeled and seeded enough for clean local submit fixtures, but local submit-specific read/write helpers do not exist and current submit does not use local Drizzle.

`src/lib/db/schema.ts` remains a legacy partial public-schema mirror and is not the local migration source of truth.

## 5. Identity-Domain Compatibility

Current local identity facts:

- `getLocalServerSession(request)` returns `session.userId`, `session.user.id`, local roles, active role, and session id from local `auth.sessions`, `auth.users`, `auth.user_roles`, and `auth.roles`.
- `/api/upload` uses `session.userId` as the local pending file owner segment.
- `rename-pending` uses local `dms_session`, requires body `userId` to match the local session, and checks document ownership before moving local files.
- Local seed users use fresh deterministic local UUIDs.
- Migration docs explicitly state old Supabase Auth UUIDs are not imported or preserved.

Current submit identity facts:

- Submit uses Supabase `session.user.id`.
- Submit uses that id for `created_by`.
- Submit uses that id for `log_aktivitas.user_id`.
- Submit uses that id for `ketua_tim_assignments.user_id`.
- Submit uses that id for storage target owner segment.
- Submit uses Supabase Auth metadata/email to build the display name used in `judul`.

Decision:

- Local ids cannot safely be used in submit today while submit still writes and reads through Supabase-backed helpers.
- The local id can become safe only when submit's actor, master-data reads, assignment checks, document writes, status updates, audit inserts, and storage owner segments all use the local data domain.

Before route migration, prove:

- actor id from `dms_session` exists in local `auth.users`;
- actor has the required submit role semantics;
- `created_by`, `log_aktivitas.user_id`, and `ketua_tim_assignments.user_id` all point at local `auth.users.id`;
- local seed/master data can satisfy the same submit validation paths;
- local upload owner segments and submit actor id match;
- response shape does not depend on Supabase metadata fields that have no local equivalent.

A compatibility assertion helper is recommended. It should be server-only and should fail closed if actor id, role, required local user fields, or local data-domain expectations are missing.

## 6. Minimum Bridge Surface

The minimum bridge should be server-only and should not be route-wired in Phase 6F.2.

Required capabilities:

- resolve local submit actor from `dms_session`;
- validate actor has `PEGAWAI` or otherwise explicitly compatible submit authority;
- derive a submit display name compatible with current title behavior;
- read local kegiatan by id and return the same name fields submit needs;
- read local required kelengkapan by kegiatan, Ketua Tim flag, and optional request chain;
- read local non-material jenis dokumen name;
- resolve local material leaf node name from detail, kategori, jenis, or fallback;
- check local Ketua Tim assignment by local actor id and kegiatan id;
- create local `dokumen.dokumen_transaksi` row with submit-compatible fields;
- update local `status`, `current_step`, `revision_target`, `revision_notes`, and `updated_at`;
- append local `dokumen.log_aktivitas` row and never update/delete logs;
- persist `lampiran_urls` logical metadata as the same array shape;
- preserve material `DRAFT -> IN_PPK_VALIDATION`, `current_step='PPK'`, `revision_target=null`;
- preserve non-material `TERSIMPAN`, `current_step=null`, `revision_target=null`, `aksi='STORE'`;
- return a document object compatible with current submit response expectations, including enriched `fungsi_nama` and `kegiatan_nama` where current helpers provide them.

Recommended shape:

- Build smaller domain helpers, with one route-specific submit compatibility service composing them.
- Avoid one broad generic mutation layer in the first bridge phase because submit has route-specific `temp-id`, title, required-lampiran, non-material, and audit semantics.
- Avoid adapting current Supabase-backed helpers for local ids. That would hide the core identity-domain risk.

Suggested helper surfaces for a future implementation phase:

- `getLocalSubmitActor(request)` or equivalent actor resolver.
- `assertLocalSubmitActorCompatible(actor)` for role and local identity invariants.
- `readLocalSubmitMasterData(input)` for kegiatan, required kelengkapan, jenis dokumen, and leaf names.
- `assertLocalKetuaTimAssignment(actorId, kegiatanId)` for the optional Ketua Tim path.
- `createLocalSubmitDraft(tx, payload)` for `dokumen_transaksi` creation.
- `applyLocalSubmitTransition(tx, dokumenId, transitionResult)` for status fields.
- `appendLocalDokumenLog(tx, payload)` for append-only audit.
- `submitDocumentWriteCompatibilityBridge(input)` as a no-route-wiring composition helper that can be unit-tested.

## 7. Transaction And Failure Strategy

Local DB writes should be grouped in a transaction once implemented:

- create `dokumen_transaksi`;
- update status/current-step/revision-target;
- append `log_aktivitas`.

The transaction should not include filesystem operations because filesystem moves are not database-transactional.

Storage planning relationship:

- `buildSubmitMovePlan(...)` fits before move execution as logical planning and attachment metadata mapping.
- Future file preflight must verify local source existence and target non-existence before any move.
- `moveLocalPendingFileToFormal(...)` fits after all request/auth/master/assignment validation and after route policy chooses `temp-id` or a real document id.

Ordering options:

- Move before DB transaction preserves current submit order and supports `temp-id`, but DB failure after move can leave orphaned local files.
- DB create before move enables a real document id target, but move failure can leave an incomplete row or pending metadata.
- DB transaction alone cannot solve file/DB atomicity.

Bridge recommendation:

- Phase 6F.2 should include local DB transaction helper planning/implementation for document/status/audit only, without storage move execution and without route wiring.
- Do not execute local file moves until the write helper can prove all DB writes succeed or fail as one unit.
- A later route phase should define compensation: if local file move succeeds but DB write fails, attempt best-effort move-back or record a server-side recovery marker without exposing physical paths.
- Until diagnostics/orphan cleanup exists, prefer avoiding DB metadata that points at missing files over avoiding orphan files. Broken document metadata is more user-visible than recoverable orphan files.

## 8. `temp-id` And Real Document ID Decision

Current submit uses `temp-id` because it moves pending files before `createDokumen(...)` returns a real document id. The persisted path can be:

```text
{userId}/temp-id/{uuid}.{ext}
```

The submit move planner defaults to `temp-id` for compatibility.

Risks of keeping `temp-id`:

- logical storage path does not contain the real document id;
- diagnostics/orphan cleanup and document-scoped file checks are harder;
- archive snapshots can preserve this mismatch.

Risks of switching to real document id:

- changes persisted storage path semantics for submit-created documents;
- requires changing operation order;
- can create draft rows that need cleanup if file movement fails;
- requires more DB/file compensation logic;
- affects preview/download, archive snapshot, and cleanup assumptions.

Recommendation:

- Keep `temp-id` as the short-term bridge default.
- The local write bridge may expose an explicit real-document-id capability for future tests, but route wiring should not switch to real ids until DB/file ordering and response/metadata compatibility are proven.
- If a future route uses real document ids, that should be an explicit behavior decision, not an incidental bridge side effect.

## 9. Bridge Testing Strategy

Future Phase 6F.2 tests should cover the bridge/helper without route wiring, filesystem movement, or Supabase calls:

- local session actor lookup returns local user id, email, display name, roles, and active role;
- unauthenticated actor lookup fails closed;
- actor without `PEGAWAI` compatibility fails closed;
- `ADMIN`-only actor cannot submit unless an explicit compatible rule is later approved;
- local kegiatan read returns submit-needed fields;
- required attachment read matches kegiatan, Ketua Tim flag, and material request chain;
- local non-material jenis dokumen read returns title leaf name;
- local material leaf resolution priority remains detail, kategori, jenis, fallback;
- Ketua Tim assignment check uses local `auth.users.id`;
- material submit creation shape includes `DRAFT`, `is_non_material=false`, nominal, request chain, creator id, and logical `lampiran_urls`;
- non-material submit creation shape includes `is_non_material=true`, `jenis_dokumen_id`, `keterangan_detail`, and logical `lampiran_urls`;
- status/current_step/revision_target behavior matches material and non-material route behavior;
- audit insert is append-only and inserts `SUBMIT` or `STORE` correctly;
- transaction rollback leaves no document/status/log partial write on simulated failure;
- no Supabase client imports or calls exist in bridge helpers;
- no storage/file movement occurs;
- no route files change;
- no physical path, storage root, signed token, env value, or file content appears in helper result or error output.

Later route tests, not Phase 6F.2 helper tests, should cover file preflight/execution and `201 { success: true, dokumen }` route response compatibility.

## 10. Boundaries With Other Phases

These remain separate:

| Boundary | Why separate |
|---|---|
| Submit route wiring | It changes runtime workflow/storage behavior and must wait until bridge helpers are tested. |
| Filesystem move execution | It creates non-transactional DB/file failure modes beyond write bridge scope. |
| Update/resubmit local moves | Those routes combine edit/revision state rules, old-file cleanup, PPK role checks, and different response contracts. |
| `AttachmentEditor` migration | It changes browser direct Supabase upload/delete behavior and local ownership semantics. |
| Delete/remove behavior | Destructive cleanup needs retry/orphan policy and should not be hidden in submit bridge work. |
| Archive destruction deletion | It mutates archive lifecycle, clears snapshots, deletes files, and must preserve `DIMUSNAHKAN` access blocking. |
| Diagnostics/orphan cleanup | It needs local filesystem scanning, dry-run behavior, and DB/archive metadata comparison. |
| Preview/download default migration | It requires authorization, token/streaming behavior, local file availability policy, and destroyed-archive checks. |
| Supabase Storage retirement | Supabase remains the reference until all storage surfaces reach parity. |
| Broad API migration not required by submit bridge | The bridge should cover only submit-needed master/document/status/audit surfaces first. |

## 11. Recommended Next Phase

Recommended next phase:

```text
Phase 6F.2 Local Submit Document/Write Bridge Helper Foundation, no route wiring
```

Reasoning:

- Local schema and seed readiness appear sufficient for a bounded helper foundation.
- Submit-specific local write helpers do not exist yet.
- Direct submit route implementation is still not safe because route wiring would mix local storage/local ids with unproven write helpers and DB/file compensation behavior.
- A smaller read audit alone is less useful than implementing isolated helper foundations, because the required schema surfaces are already present and prior docs already identify the dependency boundary.

Direct `Phase 6E.15 Submit Route Wiring Implementation Plan` is not recommended yet. The route implementation would still be speculative until a local bridge proves actor, master-data, document creation, status update, and append-only audit compatibility in the same local data domain.

## 12. Explicitly Not Implemented

Phase 6F.1 does not implement:

- runtime source changes;
- local submit bridge implementation;
- submit route wiring;
- submit auth migration;
- local Drizzle write helpers;
- filesystem movement;
- update/resubmit local move behavior;
- upload behavior changes;
- rename-pending behavior changes;
- UI caller changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL default enablement;
- Supabase Storage migration, copy, download, backfill, or sync;
- routeTree changes;
- DB schema changes;
- DB scripts.

## 13. Validation Performed

Files read for this planning phase included:

- `AGENTS.md`
- migration planning and storage/auth handoff docs under `docs/migration/`
- `src/routes/api/dokumen/submit.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/dokumen/logs.ts`
- `src/lib/dokumen/storage.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/auth/local-server-auth.ts`
- `src/lib/auth.ts`
- `src/lib/fsm.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/schemas/dokumen.ts`
- `src/lib/storage/submit-move-plan.ts`
- local Drizzle schema files under `src/db/schema/`
- local seed files under `src/db/seed/`
- generated Drizzle SQL in `drizzle/`
- focused storage/auth/workflow tests listed in the task.

Commands run:

```powershell
git status --short --branch
```

Result when run during final validation:

```text
## migration/postgres-local
 M docs/migration/open-decisions.md
 M docs/migration/phase-plan.md
?? docs/migration/local-submit-document-write-bridge-planning.md
```

```powershell
rg -n "createFileRoute\('/api/dokumen/submit'\)|getServerSession|getLocalServerSession|session\.user\.id|session\.userId|createDokumen|updateDokumenStatus|insertLog|getKelengkapanRequired|resolveLeafNodeName|ketua_tim_assignments|master_kegiatan|master_jenis_dokumen|master_kelengkapan_dokumen|dokumen_transaksi|log_aktivitas" src tests docs/migration
```

Result: confirmed submit route registration, Supabase session usage, local session helper usage in other routes, Supabase-backed submit helpers, local schema/table definitions, and prior migration documentation.

```powershell
rg -n "lampiran_urls|created_by|status|current_step|revision_target|is_non_material|transition\(|SUBMIT|STORE|TERSIMPAN|IN_PPK_VALIDATION|buildSubmitMovePlan|moveLocalPendingFileToFormal" src tests docs/migration
```

Result: confirmed attachment metadata shape, submit status behavior, material/non-material branch, audit actions, submit planner usage in tests/docs, and local pending move helper boundaries.

```powershell
rg -n "drizzle|schema|auth\.users|roles|user_roles" src tests docs/migration drizzle
```

Result: confirmed local Drizzle schema, auth/session helper usage, generated SQL, and migration docs. The broad output also confirmed many non-submit legacy Supabase-backed areas remain.

```powershell
rg -n "from '#/db|from '../db|from '../../db|src/db|db\.insert|db\.update|transaction\(" src tests
```

Result: confirmed current local Drizzle runtime usage is limited to auth/session and current-user support endpoints; no submit document write helpers were found.

```powershell
rg -n "createAdminClient|createServerSupabaseClient|\.from\('dokumen_transaksi'\)|\.from\('log_aktivitas'\)|\.from\('master_kelengkapan_dokumen'\)|\.from\('ketua_tim_assignments'\)|\.from\('master_kegiatan'\)|\.from\('master_jenis_dokumen'\)" src/routes/api/dokumen/submit.ts src/lib/dokumen src/lib/dokumen-helpers.ts
```

Result: confirmed submit and document helper dependencies remain Supabase-backed.

Final validation after documentation edits:

```powershell
git diff --check
git diff --name-only -- src/routeTree.gen.ts
git status --short --branch
```

Result:

- `git diff --check` passed. Git reported CRLF conversion warnings for migration docs only.
- `git diff --name-only -- src/routeTree.gen.ts` returned no output.
- `git status --short --branch` returned the status shown above.
