# Phase 13Q - Folder Lifecycle Transitions And Visibility

Date: 2026-05-30

Status: implemented pending targeted test and human review.

## Phase Status

Phase 13Q adds bounded folder-level archive lifecycle transitions for the folder-first archive model.

Lifecycle authority for new runtime remains at:

- `arsip.berkas_arsip` as the folder/archive parent;
- `arsip.berkas_arsip_item` as the folder item list;
- `dokumen_transaksi` as `WORKFLOW` source;
- `manual_arsip` as `MANUAL` source for now.

`arsip.arsip` remains transitional compatibility. This phase does not de-transitionalize old archive writes.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Lifecycle Transitions

The new folder lifecycle API supports only:

```text
AKTIF -> INAKTIF
INAKTIF -> USUL_MUSNAH
USUL_MUSNAH -> DIMUSNAHKAN
```

Invalid transitions are rejected safely:

- `OPEN` berkas cannot transition lifecycle;
- `CLOSED` berkas with `status_arsip IS NULL` cannot transition until remediated;
- direct jumps are rejected;
- `DIMUSNAHKAN` is terminal;
- missing berkas returns a safe not-found response.

The transition helper updates only `berkas_arsip.status_arsip` and `updated_at`.

## API

New route:

```text
POST /api/arsiparis/berkas/$id/lifecycle
```

Request body:

```json
{
  "action": "mark_inactive"
}
```

Allowed actions:

- `mark_inactive`;
- `propose_destruction`;
- `approve_destruction`.

The route requires same-origin validation, local `dms_session`, and assigned `KEPALA_SUB_BAGIAN_UMUM`. `ADMIN` is not a substitute.

Responses use safe DTOs and do not expose raw rows, storage paths, tokens, SQL, env values, or session/cookie values.

## UI Visibility

`/arsiparis/berkas` keeps the page title/navigation name `Pemberkasan Arsip Aktif` and now shows:

- `Berkas Terbuka` for `OPEN/null`;
- `Pemberkasan Arsip Aktif` for `CLOSED/AKTIF`;
- `Arsip Inaktif` for `CLOSED/INAKTIF`;
- `Usul Musnah` for `CLOSED/USUL_MUSNAH`;
- `Dimusnahkan` for `CLOSED/DIMUSNAHKAN`.

The list keeps safe metadata fields: Jenis Pembayaran, Status Berkas, Status Arsip, source counts, total nominal, closing or last-updated date, and detail link.

## UI Actions

Lifecycle actions are shown only for legal next steps:

- `CLOSED/AKTIF`: `Jadikan Inaktif`;
- `CLOSED/INAKTIF`: `Usulkan Musnah`;
- `CLOSED/USUL_MUSNAH`: `Musnahkan Data`;
- `OPEN/null`: no lifecycle action;
- `CLOSED/DIMUSNAHKAN`: no lifecycle action.

Confirmation copy:

- `Berkas akan dipindahkan ke status Inaktif. Dokumen tidak dihapus.`
- `Berkas akan masuk daftar Usul Musnah. Dokumen tidak dihapus.`
- `Berkas akan ditandai sebagai Dimusnahkan. Preview dan download akan diblokir. File fisik belum dihapus pada fase ini.`

## DIMUSNAHKAN Boundary

`DIMUSNAHKAN` in this phase is status-only.

Existing Phase 13P folder-aware file access continues to block preview/download with:

```text
Data sudah dimusnahkan
```

This phase does not delete physical files, clear item rows, clear attachment metadata, or remove source document metadata. Future physical deletion must be a separate destructive phase with explicit safeguards.

## Route Tree Status

`src/routeTree.gen.ts` was generated through the local TanStack router generator path and was not manually edited.

The route tree diff is scoped to registering:

```text
/api/arsiparis/berkas/$id/lifecycle
```

## Non-Goals

Phase 13Q does not:

- delete physical files;
- implement physical destruction;
- remove metadata;
- mutate `berkas_arsip_item`;
- mutate `dokumen_transaksi` or `manual_arsip`;
- stop transitional `arsip.arsip` writes;
- de-transitionalize old archive pages or routes;
- add schema, migration, backfill, seed, package, env, storage, or Supabase runtime changes.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm all sections render when fixture data exists for each lifecycle status.
4. Move one closed active berkas through `Jadikan Inaktif`.
5. Move one inactive berkas through `Usulkan Musnah`.
6. Move one proposed berkas through `Musnahkan Data`.
7. Open the Dimusnahkan detail page and confirm preview/download actions are hidden and `Data sudah dimusnahkan` is shown.
8. Confirm physical files remain present because this phase is status-only.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
