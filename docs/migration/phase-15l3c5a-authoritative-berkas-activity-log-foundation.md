# Phase 15L.3C.5A - Authoritative Berkas Activity Log Foundation

Date: 2026-06-07

## 1. Status

Implemented for focused local validation. Manual browser QA remains required.

No package, env, routeTree, Supabase, data deletion/reset, commit, or push changes are included.

## 2. Problem

Phase 15L.3C.4 improved `Riwayat Aktivitas Berkas`, but lifecycle rows were still partially inferred from current `berkas_arsip` fields. That allowed a destroyed folder to show `Berkas dimusnahkan` without reliable historical `Inaktif` and `Usul Musnah` events when those transition timestamps were never stored as append-only berkas events.

## 3. Existing Log Audit

Existing `dokumen.log_aktivitas` is not appropriate as the berkas authority because it is workflow-document scoped:

- requires `dokumen_id`;
- references workflow approval actions and step order;
- cascades with `dokumen_transaksi`;
- is used for document approval history, not folder lifecycle history.

`Riwayat Aktivitas Berkas` is not workflow approval history. Workflow approval history still ends at PPSPM approval/completion.

## 4. Schema Decision

Added a narrow folder-first table:

```text
arsip.berkas_arsip_activity
```

The table is append-only by application contract and stores:

- `id`
- `berkas_id`
- `event_type`
- `actor_user_id`
- `source_type`
- `workflow_document_id`
- `manual_document_id`
- `catatan`
- `metadata_snapshot`
- `created_at`

It does not store physical paths, logical storage paths, URLs, tokens, cookies/session values, DB URLs, env values, password hashes, or secrets.

Migration:

- `drizzle/0010_berkas_activity_log_foundation.sql`

The migration creates only the new table, indexes, FKs, and checks. It does not mutate or delete old rows.

## 5. Event Types

Implemented event types and user-facing labels:

| Event type | Label |
|---|---|
| `BERKAS_DIBUKA` | Berkas dibuka |
| `DOKUMEN_PERSETUJUAN_DIKLASIFIKASIKAN` | Dokumen Persetujuan diklasifikasikan |
| `DOKUMEN_MANUAL_DITAMBAHKAN` | Penambahan dokumen manual sukses |
| `BERKAS_DITUTUP` | Berkas ditutup |
| `METADATA_ARSIP_AKTIF_DIPERBARUI` | Metadata arsip aktif diperbarui |
| `BERKAS_DIPINDAHKAN_KE_INAKTIF` | Berkas dipindahkan ke Inaktif |
| `BERKAS_DIPINDAHKAN_KE_USUL_MUSNAH` | Berkas dipindahkan ke Usul Musnah |
| `BERKAS_DIMUSNAHKAN` | Berkas dimusnahkan |

## 6. Write Points

Event writes are server-side and occur at the source of action:

- berkas opened through `getOrCreateOpenBerkasForKlasifikasi` when a new row is inserted;
- workflow/Persetujuan document classified into berkas;
- manual document added into berkas;
- berkas closed;
- active archive metadata edited;
- lifecycle moved to Inaktif;
- lifecycle moved to Usul Musnah;
- destruction approved and status moved to Dimusnahkan.

Workflow classification and manual document creation use transaction-scoped repository inserts so event writes occur with the business write.

## 7. Read Model And Timeline

`getBerkasArsipDetail` now loads safe authoritative activity events for the berkas detail DTO.

The API response exposes only safe display fields:

- `activity_key`
- `event_type`
- `source_type`
- `message`
- `created_at`
- `actor_display_name`

The response does not expose activity row ids, actor ids, source document ids, metadata snapshots, paths, tokens, raw SQL, env/session/cookie values, or secrets.

The detail page timeline:

- prefers authoritative activity events when present;
- sorts by real event `created_at` ascending;
- shows oldest at top and newest at bottom;
- does not fake timestamps;
- truncates displayed activity at `BERKAS_DIMUSNAHKAN`;
- keeps the existing fallback only for old/dev berkas rows with no activity events.

## 8. Lifecycle And File Access

Lifecycle semantics are unchanged:

```text
OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN
```

`DIMUSNAHKAN` remains terminal. File access behavior is unchanged:

- metadata remains visible;
- preview/download remains blocked after destruction;
- exact destroyed-file phrase remains `Data file sudah dimusnahkan`;
- exact confirmation phrase remains `MUSNAHKAN DATA FILE`;
- physical deletion remains part of the existing destruction approval path.

## 9. Validation

Passed:

```text
pnpm test tests/unit/arsiparis
```

Additional required validation remains:

```text
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/components/attachment-viewer-source.test.ts
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts supabase
```

## 10. Deferred Dev Reset

Existing development rows may not have activity events. This phase does not backfill or delete existing data.

A separate controlled dev reset/remediation phase may clean or reseed old data later if humans approve it.

## 11. Safety Confirmation

- Append-only activity foundation added.
- No fake timestamps added.
- No lifecycle semantics changed.
- No RBAC/auth weakening.
- No file-access weakening after destruction.
- No package/env/routeTree changes intended.
- No data deletion in this phase.
- No commit or push performed.
