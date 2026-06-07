# Phase 15L.3C.4 - Berkas Activity Timeline and Destroyed Metadata Access

Date: 2026-06-07

## 1. Status

Implemented for focused local validation. Manual browser QA remains required.

No schema, migration, package, env, storage, file-access, auth/session, routeTree, DB, Drizzle, Supabase, commit, or push changes are included.

## 2. Timestamp / Source Audit Matrix

| Event | Data source | Timestamp source | Display decision |
|---|---|---|---|
| Berkas dibuka | `berkas_arsip` | `created_at` | Full datetime if present. |
| Dokumen Persetujuan diklasifikasikan | `berkas_arsip_item` + `dokumen_transaksi` metadata | `berkas_arsip_item.added_at` exposed as `item_added_at` | Full datetime if present; do not use document source date as fake classification time. |
| Penambahan dokumen manual sukses | `berkas_arsip_item` + `manual_arsip` metadata | `berkas_arsip_item.added_at` exposed as `item_added_at` | Full datetime if present; do not use document source date as fake insertion time. |
| Berkas ditutup | `berkas_arsip` | `closed_at` | Full datetime if present; UTC-midnight values from date-only close input are displayed as date-only to avoid fake event time. |
| Metadata arsip aktif diperbarui | none append-only for berkas edit | unavailable | Not displayed. |
| Berkas dipindahkan ke Inaktif | `berkas_arsip.status_arsip` current status | `updated_at` for current status only | Displayed only when current status is `INAKTIF`; note limitation that there is no per-transition log. |
| Berkas dipindahkan ke Usul Musnah | `berkas_arsip.status_arsip` current status | `updated_at` for current status only | Displayed only when current status is `USUL_MUSNAH`; note limitation. |
| Berkas dimusnahkan | `berkas_arsip.status_arsip` current status | `updated_at` for terminal status | Final event; no later event is shown. |

## 3. Activity Timeline Semantics

`Riwayat Aktivitas Berkas` is berkas lifecycle-oriented, not workflow approval history.

The timeline now starts with `Berkas dibuka`, then item insertion/classification events, then close/lifecycle events supported by actual folder-first data. Workflow source display uses `Persetujuan` / `Dokumen Persetujuan`, not `Workflow`.

No fake timestamps are generated. Missing timestamps show an unavailable-time label and explanatory limitation text. Date-only close input stored as UTC midnight is shown as date-only, not as a fabricated midnight event.

## 4. Visual Changes

The berkas activity section now uses an icon-based vertical chronology with compact off-white rows, a subtle line, and restrained orange accents. It is intentionally distinct from generic workflow approval history.

## 5. Destroyed Metadata Access

No new route was added because `src/routeTree.gen.ts` is protected in this phase.

The existing `/arsiparis/usul-musnah` page now includes a visible status filter for:

- `Usul Musnah`
- `Arsip Dimusnahkan`

`Arsip Dimusnahkan` rows open the existing folder detail page, where metadata and document rows remain visible and read-only.

## 6. Destroyed Detail Behavior

For `DIMUSNAHKAN` folders:

- metadata remains visible;
- document metadata rows remain visible;
- lifecycle actions are hidden;
- edit metadata remains unavailable;
- attachment preview/download actions are replaced with `Data file sudah dimusnahkan`;
- final timeline event is `Berkas dimusnahkan`.

Physical deletion and file-access blocking behavior are unchanged.

## 7. Validation

Passed:

```text
pnpm test tests/unit/arsiparis
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/components/attachment-viewer-source.test.ts
pnpm exec tsx -e "void (async () => { await import('./src/routes/arsiparis/berkas/`$id.tsx'); await import('./src/routes/arsiparis/usul-musnah/index.tsx'); await import('./src/lib/archive/berkas-arsip-read-model.ts') })()"
```

Repository-wide `pnpm exec tsc --noEmit --pretty false` was attempted and still fails on pre-existing unrelated errors outside this scoped phase. One local issue surfaced by that attempt was fixed.

## 8. Protected Files Confirmation

Protected files and trees are not part of this phase:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

No commit or push was performed.
