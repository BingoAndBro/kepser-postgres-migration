# Phase 13U - Manual Penambahan Dokumen De-Transitionalization

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13U de-transitionalizes only the manual `Penambahan Dokumen` write path.

The route remains:

```text
POST /api/arsiparis/manual-arsip
```

The route name and response shape remain compatible, but new manual creates now use the folder-first model. Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Behavior

For a valid manual document create request:

- the selected `klasifikasi_id` / `Jenis Pembayaran` is still validated server-side;
- the `manual_arsip` source row is still created as the MANUAL source;
- manual attachment upload and attachment rows remain handled by the existing attachment endpoint;
- the matching `OPEN` berkas is reused or created through the existing folder helper;
- a `MANUAL` `berkas_arsip_item` is inserted for the manual source;
- no new `arsip.arsip` row with `source_type='MANUAL'` is created;
- `manual_arsip.canonical_arsip_id` remains null for new manual writes;
- the MANUAL berkas item has no canonical bridge for new writes.

Final archive metadata and lifecycle remain folder-level concerns on `berkas_arsip`, applied when the berkas is closed/finalized.

## Duplicate And Eligibility Handling

Duplicate manual item assignment remains a safe conflict response:

```text
Dokumen sudah terhubung ke berkas
```

The route does not create an `arsip.arsip` fallback on duplicate attempts.

The Phase 13P.2 one-to-one rule remains active: if a selected `Jenis Pembayaran` only has a `CLOSED` berkas, new manual creation is rejected and a second berkas is not created.

## Compatibility Boundary

Existing old `manual_arsip` rows with `canonical_arsip_id` and existing old `arsip.arsip` `MANUAL` rows are preserved as compatibility/history data.

Old linked rows may still be read by existing transitional compatibility surfaces. Existing Manual Archive edit behavior for old linked `AKTIF` rows remains unchanged in this phase. New manual rows are source-first and folder-first.

## Attachment And File Access

Manual attachment upload, storage descriptors, logical storage paths, preview, and download responders are unchanged.

Folder item manual preview/download continues to resolve through the `manual_arsip_id` source and delegates to the existing Manual Archive attachment responder. It does not require `canonical_arsip_id`.

No response may expose logical paths, physical paths, storage roots, file tokens, signed-token internals, cookies, session values, SQL details, env values, or secrets.

## Not Changed

Phase 13U does not:

- change workflow `Pengklasifikasian Dokumen` behavior;
- change schema, Drizzle models, or migrations;
- backfill, delete, or mutate existing old canonical data;
- remove the `arsip.arsip` table;
- change manual attachment upload or storage layout;
- change preview/download authorization;
- change close berkas behavior;
- change lifecycle transitions;
- change CSV export behavior;
- move, rename, or delete physical files;
- add routes or regenerate `src/routeTree.gen.ts`;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Recommendation

1. Login as an assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `Penambahan Dokumen`.
3. Create a manual document using an eligible `Jenis Pembayaran`.
4. Confirm the request succeeds and the matching `OPEN` berkas contains the MANUAL item.
5. Confirm no new `arsip.arsip` `MANUAL` row is created.
6. Confirm the new `manual_arsip.canonical_arsip_id` remains null.
7. Upload a manual attachment and confirm preview/download still work through the existing responder.
8. Retry duplicate item attachment behavior where possible and confirm a safe conflict.
9. Try a `Jenis Pembayaran` whose only berkas is `CLOSED/AKTIF` and confirm it is rejected.
10. Confirm preview/download behavior is unchanged for non-`DIMUSNAHKAN` folder items.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/manual-arsip-route.test.ts tests/unit/arsiparis/manual-archive-canonical.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
