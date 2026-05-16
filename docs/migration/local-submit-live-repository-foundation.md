# Phase 6F.3 Local Submit Live Repository Planning / Foundation

Date: 2026-05-16.

## Purpose And Scope

Phase 6F.3 maps the Phase 6F.2 `LocalSubmitBridgeRepository` contract to the local Drizzle schema and adds an isolated repository foundation that can be tested without a live database.

This phase is schema-aware repository planning/foundation only.

It does not wire `POST /api/dokumen/submit`, does not change submit route behavior, does not execute filesystem movement, does not call Supabase, does not run database scripts, does not run migrations, does not run seeds, and does not change route generation.

## Files Added

- `src/lib/dokumen/local-submit-repository.ts`
- `tests/unit/dokumen/local-submit-repository.test.ts`

## Submit Route Status

`POST /api/dokumen/submit` is still not wired to local auth, this repository foundation, local Drizzle writes, local file preflight, or local filesystem movement.

Current submit route behavior remains the legacy Supabase-backed behavior:

- Supabase session through `getServerSession(supabase)`;
- Supabase master reads;
- Supabase Storage `.move(...)`;
- Supabase-backed `createDokumen(...)`;
- Supabase admin status update;
- Supabase admin append-only log insert.

No route imports `src/lib/dokumen/local-submit-repository.ts` in this phase.

## Repository Method To Local Schema Responsibilities

| Phase 6F.2 repository method | Local schema responsibility | Table(s) |
|---|---|---|
| `getKegiatanById(kegiatanId)` | Read the submit activity row and provide the route-needed `id`, `nama`, and optional `fungsiId`. | `master.master_kegiatan` |
| `getRequiredKelengkapan(input)` | Read required attachment checklist rows matching kegiatan, Ketua Tim flag, and optional material request-chain specificity. | `master.master_kelengkapan_dokumen` |
| `getJenisDokumenById(id)` | Read the non-material document type display name used as submit title leaf. | `master.master_jenis_dokumen` |
| `getJenisPermintaanById(id)` | Read material request type display name fallback. | `master.master_jenis_permintaan` |
| `getKategoriPermintaanById(id)` | Read material category display name fallback. | `master.master_kategori_permintaan` |
| `getDetailPermintaanById(id)` | Read material detail display name with highest leaf priority. | `master.master_detail_permintaan` |
| `hasKetuaTimAssignment(input)` | Check whether the local submit actor is assigned to the submitted kegiatan. | `master.ketua_tim_assignments` |
| `withSubmitWriteTransaction(operation)` | Group document creation, status update, and audit insert in one local DB transaction when a live adapter is later implemented. | `dokumen.dokumen_transaksi`, `dokumen.log_aktivitas` |
| `tx.createDokumen(payload)` | Insert a draft document row with logical attachment metadata. | `dokumen.dokumen_transaksi` |
| `tx.updateDokumenStatus(payload)` | Update only workflow status fields and `updated_at`. | `dokumen.dokumen_transaksi` |
| `tx.appendLog(payload)` | Insert one append-only audit row. | `dokumen.log_aktivitas` |

## Table And Column Mapping

### Kegiatan Read

Local Drizzle table:

- `masterKegiatan`

Database table:

- `master.master_kegiatan`

Columns:

| Bridge field | Drizzle property | DB column |
|---|---|---|
| `id` | `id` | `id` |
| `nama` | `nama` | `nama` |
| `fungsiId` | `fungsiId` | `fungsi_id` |

Required behavior:

- Return `null` when the kegiatan is missing.
- Do not create fallback kegiatan rows.
- Route wiring later should preserve current `400 { error: 'Kegiatan tidak ditemukan' }` behavior.

### Required Kelengkapan Read

Local Drizzle table:

- `masterKelengkapanDokumen`

Database table:

- `master.master_kelengkapan_dokumen`

Columns:

| Bridge/read field | Drizzle property | DB column |
|---|---|---|
| `kegiatanId` | `kegiatanId` | `kegiatan_id` |
| `isKetuaTim` | `isKetuaTim` | `is_ketua_tim` |
| `jenisPermintaanId` | `jenisPermintaanId` | `jenis_permintaan_id` |
| `kategoriPermintaanId` | `kategoriPermintaanId` | `kategori_permintaan_id` |
| `detailPermintaanId` | `detailPermintaanId` | `detail_permintaan_id` |
| result `id` | `id` | `id` |
| result `namaDokumen` | `namaDokumen` | `nama_dokumen` |
| result `required` | `required` | `required` |

Required behavior:

- Preserve current specificity rules from `getKelengkapanRequired(...)`: detail match first, else kategori with `detail_permintaan_id IS NULL`, else jenis with `kategori_permintaan_id IS NULL` and `detail_permintaan_id IS NULL`, else kegiatan plus role only.
- Missing required lampiran must fail before any transaction or file movement.
- Do not invent fallback attachment requirements.

### Jenis Dokumen Read

Local Drizzle table:

- `masterJenisDokumen`

Database table:

- `master.master_jenis_dokumen`

Columns:

| Bridge field | Drizzle property | DB column |
|---|---|---|
| `id` | `id` | `id` |
| `nama` | `nama` | `nama` |
| optional active filter | `isActive` | `is_active` |

Required behavior:

- Used for non-material submit title leaf when `jenisDokumenId` exists.
- If missing, Phase 6F.2 bridge currently falls back to kegiatan name.

### Request-Chain Reads

Local Drizzle tables:

- `masterJenisPermintaan`
- `masterKategoriPermintaan`
- `masterDetailPermintaan`

Database tables:

- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`

Columns:

| Bridge field | Drizzle property | DB column |
|---|---|---|
| `id` | `id` | `id` |
| `nama` | `nama` | `nama` |
| active filter if applied | `isActive` | `is_active` |
| kategori parent | `jenisPermintaanId` | `jenis_permintaan_id` |
| detail parent | `kategoriPermintaanId` | `kategori_permintaan_id` |

Required behavior:

- Preserve current leaf priority: detail, then kategori, then jenis, then kegiatan fallback.
- Do not weaken material/non-material branching to fit missing data.

### Ketua Tim Assignment Check

Local Drizzle table:

- `ketuaTimAssignments`

Database table:

- `master.ketua_tim_assignments`

Columns:

| Bridge field | Drizzle property | DB column |
|---|---|---|
| `userId` | `userId` | `user_id` |
| `kegiatanId` | `kegiatanId` | `kegiatan_id` |
| row id | `id` | `id` |
| creator | `createdBy` | `created_by` |

Required behavior:

- Check assignment using the local actor id from `dms_session`.
- Preserve the current failure as a 403-style route result later.
- Preserve the invariant that assignment uniqueness is per `kegiatan_id`, not `(user_id, kegiatan_id)`.

### Dokumen Creation Payload

Local Drizzle table:

- `dokumenTransaksi`

Database table:

- `dokumen.dokumen_transaksi`

Columns:

| Phase 6F.2 payload field | Local Drizzle insert property | DB column |
|---|---|---|
| `judul` | `judul` | `judul` |
| `fungsiId` | `fungsiId` | `fungsi_id` |
| `kegiatanJenisId` | `kegiatanJenisId` | `kegiatan_jenis_id` |
| `isKetuaTim` | `isKetuaTim` | `is_ketua_tim` |
| `status` | `status` | `status` |
| `currentStep` | `currentStep` | `current_step` |
| `revisionTarget` | `revisionTarget` | `revision_target` |
| `revisionNotes` | `revisionNotes` | `revision_notes` |
| `lampiranUrls` | `lampiranUrls` | `lampiran_urls` |
| `tahun` | `tahun` | `tahun` |
| `tanggal` | `tanggal` | `tanggal` |
| `createdBy` | `createdBy` | `created_by` |
| `nominalRealisasi` | `nominalRealisasi` | `nominal_realisasi` |
| `isNonMaterial` | `isNonMaterial` | `is_non_material` |
| `jenisDokumenId` | `jenisDokumenId` | `jenis_dokumen_id` |
| `keteranganDetail` | `keteranganDetail` | `keterangan_detail` |
| `jenisPermintaanId` | `jenisPermintaanId` | `jenis_permintaan_id` |
| `kategoriPermintaanId` | `kategoriPermintaanId` | `kategori_permintaan_id` |
| `detailPermintaanId` | `detailPermintaanId` | `detail_permintaan_id` |

Phase 6F.3 helper mapping:

- `lampiranUrls` remains an array for local JSONB, not `JSON.stringify(...)`.
- `nominalRealisasi` is converted from bridge `number` to a string for Drizzle/PostgreSQL numeric insert compatibility.
- `created_at` and `updated_at` are left to database defaults during insert.
- `id` is left to database default generation during insert.

### Dokumen Status Update

Local Drizzle table:

- `dokumenTransaksi`

Database table:

- `dokumen.dokumen_transaksi`

Columns:

| Phase 6F.2 payload field | Local Drizzle update property | DB column |
|---|---|---|
| `dokumenId` | update predicate on `id` | `id` |
| `status` | `status` | `status` |
| `currentStep` | `currentStep` | `current_step` |
| `revisionTarget` | `revisionTarget` | `revision_target` |
| `revisionNotes` | `revisionNotes` | `revision_notes` |
| `updatedAt` | `updatedAt` | `updated_at` |

Phase 6F.3 helper mapping:

- `updatedAt` is converted from ISO string to `Date` for Drizzle timestamp update compatibility.
- `revisionNotes` remains `null` for submit status update parity.

### Append-Only Log Aktivitas Insert

Local Drizzle table:

- `logAktivitas`

Database table:

- `dokumen.log_aktivitas`

Columns:

| Phase 6F.2 payload field | Local Drizzle insert property | DB column |
|---|---|---|
| `dokumenId` | `dokumenId` | `dokumen_id` |
| `userId` | `userId` | `user_id` |
| `aksi` | `aksi` | `aksi` |
| `catatan` | `catatan` | `catatan` |
| `stepUrutan` | `stepUrutan` | `step_urutan` |

Required behavior:

- Insert only.
- No update/delete helper is introduced.
- `timestamp` remains database-defaulted for this foundation.

### Transaction Boundary

Phase 6F.2 write sequence remains:

```text
create-draft -> update-status -> append-audit-log
```

Phase 6F.3 keeps the same shape through an injected adapter method:

```ts
withSubmitTransaction(operation)
```

This proves the live repository boundary shape without importing the concrete DB client or executing a real transaction.

Filesystem operations remain outside this transaction. A later route phase still needs explicit DB/file compensation behavior.

## Helper Foundation Summary

`src/lib/dokumen/local-submit-repository.ts` provides:

- `LOCAL_SUBMIT_SCHEMA_TABLES` with the exact narrow table responsibility surface.
- `createLocalSubmitBridgeRepository(adapter)` to adapt an injected adapter into the Phase 6F.2 `LocalSubmitBridgeRepository` contract.
- Pure mapping functions:
  - `mapLocalSubmitDocumentCreateToInsert(...)`
  - `mapLocalSubmitStatusUpdateToUpdate(...)`
  - `mapLocalSubmitAuditToInsert(...)`
  - `mapLocalSubmitDokumenRowToCreatedDocument(...)`
  - master row mappers for kegiatan, kelengkapan, and name lookups.

The helper does not import:

- the concrete live DB client;
- a connection pool;
- env loaders;
- route files;
- filesystem helpers;
- Supabase clients.

The helper does not execute:

- `db.insert`;
- `db.update`;
- `db.select`;
- a live `transaction(...)`;
- filesystem moves.

## Schema Mismatches And Notes

| Area | Mismatch or note | Phase 6F.3 handling |
|---|---|---|
| Bridge payload names vs DB columns | Phase 6F.2 uses camelCase payload names while database columns are snake_case. | Helper maps to Drizzle camelCase properties that correspond to snake_case columns. |
| Response names vs Drizzle names | Current submit response object uses snake_case fields such as `fungsi_id`, `current_step`, and `lampiran_urls`. | Helper maps Drizzle-like row names back to response-compatible snake_case names. |
| `lampiran_urls` storage type | Legacy Supabase helper writes `JSON.stringify(...)`; local Drizzle schema uses JSONB typed as an array. | Helper preserves the array and does not stringify. |
| `nominal_realisasi` | Bridge uses `number`; Drizzle numeric columns commonly read/write string values through the PostgreSQL driver. | Helper maps insert value to string and maps selected row string/number back to response number/null. |
| `updated_at` | Bridge status payload uses ISO string; Drizzle timestamp update should receive a `Date`. | Helper converts ISO string to `Date`. |
| `created_at` and `updated_at` row values | Live adapter may receive `Date` or string depending on query mapping. | Helper normalizes both to ISO strings for response-compatible document shape. |
| Request-chain FKs on dokumen rows | `dokumenTransaksi` request-chain columns are nullable UUID columns without Phase 3E FKs. | No stricter behavior added; route/helper validation must remain explicit. |
| `is_non_material` column nullability | Drizzle schema has `default(false)` but not `notNull()`. | Helper maps created rows to boolean according to adapter row input; a live adapter should coerce null defensively if encountered. |
| Audit insert errors | Current submit awaits `insertLog(...)` but does not fail route success on helper-returned error. Phase 6F.2 transaction boundary treats append failure as transactional failure. | This remains a route behavior parity blocker before wiring. |

## Live DB Execution Status

No live local database was opened or queried in this phase.

No DB scripts were run:

- no migrations;
- no seeds;
- no Drizzle generate;
- no Drizzle migrate;
- no auth hash script.

The new tests use fake adapters only.

## Filesystem Movement Status

No filesystem movement is executed in this phase.

No local file source existence checks are implemented in this phase.

No Supabase Storage files are migrated, copied, downloaded, backfilled, synced, or used as fallback.

Mixed storage remains expected:

- new `/api/upload` files are local;
- older Supabase-backed files may not exist locally;
- `AttachmentEditor` can still produce Supabase-backed dash pending files.

## Route Wiring Status

Submit route wiring remains blocked.

This phase does not modify:

- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/upload.ts`
- `src/routeTree.gen.ts`

## Remaining Blockers Before Submit Route Migration

- Implement a live local Drizzle adapter for the Phase 6F.3 adapter interface, still without route wiring first.
- Prove real local read filters for required kelengkapan preserve current specificity behavior.
- Prove response shape parity for the created and status-updated document object.
- Decide whether append-log failure should preserve current unchecked-helper behavior or use the stricter transaction failure behavior from Phase 6F.2.
- Add local file preflight for submit source existence and target non-existence.
- Select and document DB/file partial-failure compensation before any filesystem move execution.
- Preserve or explicitly replace `temp-id`; current approved default remains `temp-id`.
- Add route-level compatibility tests before runtime wiring.
- Preserve material `DRAFT -> IN_PPK_VALIDATION` and non-material `TERSIMPAN`/`STORE`.
- Ensure submit uses only local `dms_session` ids, local master data, local document writes, local audit writes, and local file owner segments in the same data domain.
- Keep missing local files visible as controlled failures with no Supabase fallback.

## Tests

Focused tests run:

```powershell
pnpm test tests/unit/dokumen/local-submit-repository.test.ts tests/unit/dokumen/local-submit-write-bridge.test.ts
```

Result:

- First sandboxed run failed before tests started because Vitest/esbuild hit `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- 2 test files passed.
- 12 tests passed.

Coverage added by Phase 6F.3:

- narrow schema responsibility table constants;
- document create payload to Drizzle-shaped insert mapping;
- numeric insert conversion;
- status update mapping and ISO-to-`Date` conversion;
- audit insert mapping;
- Drizzle-like row to response-compatible document mapping;
- fake-adapter repository factory behavior;
- fake transaction sequence through the Phase 6F.2 bridge contract;
- no sensitive or physical path exposure in helper results.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6F.4 Local Submit Live Drizzle Adapter Foundation, no route wiring and no filesystem movement
```

Scope recommendation:

- implement the live adapter behind the Phase 6F.3 interface using an injected Drizzle database/transaction object;
- keep the concrete runtime `db` singleton out of the adapter factory input;
- add tests with fake or mocked Drizzle-like chains first;
- only use a real local DB check in a later explicitly approved phase if migrations and seed prerequisites are approved;
- do not wire `POST /api/dokumen/submit` until repository behavior, file preflight, route response compatibility, and DB/file failure policy are proven.

Direct submit route wiring remains not recommended.
