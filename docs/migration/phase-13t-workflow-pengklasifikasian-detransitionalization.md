# Phase 13T - Workflow Pengklasifikasian De-Transitionalization

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13T de-transitionalizes only the workflow `Pengklasifikasian Dokumen` write path.

The route remains:

```text
POST /api/arsiparis/dokumen/$id/archive
```

The route name remains compatible, but the behavior is now folder-first for workflow classification. Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Behavior

For a valid `COMPLETED` workflow document:

- the selected `klasifikasi_id` / `Jenis Pembayaran` is still validated server-side;
- the matching `OPEN` berkas is reused or created through the existing folder helper;
- a `WORKFLOW` `berkas_arsip_item` is inserted for the document;
- no new `arsip.arsip` row is created;
- `dokumen_transaksi.status` remains `COMPLETED`;
- no `COMPLETED -> ARCHIVED` transition is performed;
- no final archive metadata, retention metadata, nominal values, file paths, or attachment snapshots are moved into `arsip.arsip`.

Final archive metadata and lifecycle remain folder-level concerns on `berkas_arsip`, applied when the berkas is closed/finalized.

## Duplicate And Status Handling

Duplicate workflow item assignment remains a safe conflict response:

```text
Dokumen sudah terhubung ke berkas
```

The route does not create an `arsip.arsip` fallback and does not transition document status on duplicate attempts.

Existing old `ARCHIVED` workflow documents remain compatibility/history data and are rejected safely. Non-`COMPLETED` workflow statuses remain rejected with the existing safe not-final message.

The Phase 13P.2 one-to-one rule remains active: if a selected `Jenis Pembayaran` only has a `CLOSED` berkas, new workflow classification is rejected and a second berkas is not created.

## Audit Decision

The old append-only `log_aktivitas` entry used action `ARCHIVE`, which was semantically tied to creating a canonical archive row and moving the workflow document to `ARCHIVED`.

Phase 13T does not write that log because the document remains `COMPLETED` and the canonical archive row is no longer created. No schema is added for a new folder-level classification audit action in this phase.

## Manual Flow Boundary

Manual `Penambahan Dokumen` remains transitional after this phase. It may still create linked `arsip.arsip` `MANUAL` rows according to the existing Phase 13J behavior. Manual de-transitionalization is a later separate phase.

## Not Changed

Phase 13T does not:

- change schema, Drizzle models, or migrations;
- backfill or delete existing data;
- delete or modify existing `arsip.arsip` rows;
- change manual document creation;
- change close berkas behavior;
- change lifecycle transitions;
- change preview/download/file-access behavior;
- move or delete physical files;
- change CSV export behavior;
- add routes or regenerate `src/routeTree.gen.ts`;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## UI Compatibility

After successful workflow classification, the detail UI redirects to the folder-first berkas page:

```text
/arsiparis/berkas
```

This avoids implying that the document has become an individual archived row. The API success response remains safe and minimal:

```json
{ "success": true, "message": "Dokumen berhasil diklasifikasikan" }
```

The Pengklasifikasian inbox/detail read surface now treats an existing `WORKFLOW` `berkas_arsip_item` as classification evidence for workflow documents, instead of depending only on `arsip.arsip`. This keeps classified `COMPLETED` workflow documents from reappearing as unclassified after de-transitionalized writes.

## Manual Smoke Recommendation

1. Login as an assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `Pengklasifikasian Dokumen`.
3. Classify a `COMPLETED` workflow document using an eligible `Jenis Pembayaran`.
4. Confirm the request succeeds and redirects to `/arsiparis/berkas`.
5. Confirm the matching `OPEN` berkas contains the workflow item.
6. Confirm the source workflow document remains `COMPLETED`.
7. Confirm no new `arsip.arsip` `WORKFLOW` row is created.
8. Retry the same classification request and confirm a safe duplicate conflict.
9. Try a `Jenis Pembayaran` whose only berkas is `CLOSED/AKTIF` and confirm it is rejected.
10. Confirm preview/download behavior is unchanged for non-`DIMUSNAHKAN` folder items.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/workflow-archive-route.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
