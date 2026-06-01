# AGENTS.md - Project Constitution: DMS (Dynamic Document Workflow Management System)
> File ini adalah hukum kerja repo. Semua perubahan schema, routing, workflow, security boundary, storage, dan data boundary harus mengacu ke file ini. Jika realita aplikasi berubah, update file ini dulu atau bersamaan dengan kode/dokumen terkait.

---

## North Star

> Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh pihak yang berwenang.

Tujuan MVP tetap sama: menghapus kebingungan status dokumen, memperjelas inbox per role, dan menjaga jejak audit dari submit sampai arsip atau pemusnahan.

---

## Current Project Status

Kondisi aplikasi per 2026-05-22:

- Migrasi besar Supabase-to-local selesai sampai Phase 11H.3.
- Final classification 11H.3:

```text
Partial / bounded release handoff: local/LAN target is ready for human-controlled internal handoff, subject to deployment posture decisions and accepted limitations.
```

- Ini adalah human-controlled internal/local/LAN handoff yang bounded, bukan public production readiness, bukan go-live approval, bukan operational certification, bukan security certification, dan bukan compliance validation.
- Active runtime/package Supabase dependency retired untuk clean local target.
- Historical Supabase docs/tests/comments/.env-example references dan folder `supabase/` tetap ada sebagai traceability atau cleanup backlog.
- Jangan menulis atau menyimpulkan bahwa Supabase sudah fully removed from repository.
- No old Supabase data/file recovery, migration, copy, download, backfill, sync, or fallback is expected.
- Setelah 11H.3, recommended state adalah human-controlled maintenance/backlog governance.

Referensi utama:

- `docs/migration/phase-11h-final-release-classification.md`
- `docs/migration/phase-11h-final-readiness-plan.md`
- `docs/migration/phase-11h-final-supabase-audit.md`
- `docs/migration/phase-11h-p1-security-gate-decision.md`
- `docs/migration/phase-11g-rollback-release-handoff.md`
- `docs/migration/phase-11g-security-review.md`
- `docs/migration/deployment-target-contract.md`
- `docs/migration/local-deployment-notes.md`
- `docs/migration/open-decisions.md`
- `docs/migration/phase-12g-manual-archive-schema.md`
- `docs/migration/phase-12h-manual-archive-api-foundation.md`
- `docs/migration/phase-12j2d-manual-archive-required-nominal.md`
- `docs/migration/phase-12k-manual-archive-preview-download.md`
- `docs/migration/phase-12l-manual-archive-edit-aktif-only.md`
- `docs/migration/phase-12l2-canonical-archive-schema-foundation.md`
- `docs/migration/phase-12l3-compatibility-read-backfill-plan.md`
- `docs/migration/phase-12l4-report-only-db-compatibility-reader.md`
- `docs/migration/phase-12l5-remediation-policy-for-compatibility-gaps.md`
- `docs/migration/phase-12l7-workflow-archive-canonical-write-alignment.md`
- `docs/migration/phase-12l9-manual-archive-retention-schema-foundation.md`
- `docs/migration/phase-12l10-manual-archive-api-retention-validation.md`
- `docs/migration/phase-12l11-manual-archive-ui-required-metadata.md`
- `docs/migration/phase-12l14-manual-archive-create-canonical-write-alignment.md`
- `docs/migration/phase-12l15-manual-archive-edit-canonical-sync.md`
- `docs/migration/phase-12l16-existing-manual-archive-remediation-backfill-plan.md`
- `docs/migration/phase-12l17-read-only-manual-archive-remediation-report-helper.md`
- `docs/migration/phase-12l18-human-reviewed-manual-archive-canonicalization-helper.md`
- `docs/migration/phase-12l19-manual-archive-canonicalization-dry-run.md`
- `docs/migration/phase-12m1-unified-archive-query-service.md`
- `docs/migration/phase-12m2-unified-archive-list-page-integration.md`
- `docs/migration/phase-12m3-unified-archive-detail-policy.md`
- `docs/migration/phase-12m4-unified-archive-detail-read-service.md`
- `docs/migration/phase-12m5-unified-archive-detail-page-integration.md`
- `docs/migration/phase-12m6-source-aware-detail-attachment-metadata.md`
- `docs/migration/phase-12m6b-unified-detail-ui-label-dedup-cleanup.md`
- `docs/migration/phase-12m6c-unified-detail-actor-display-name-resolution.md`
- `docs/migration/phase-12m7-source-aware-preview-download-from-detail.md`
- `docs/migration/phase-12m8-unified-detail-file-access-smoke-review.md`
- `docs/migration/phase-12n1-unified-archive-lifecycle-policy-inventory.md`
- `docs/migration/phase-12n2-unified-archive-lifecycle-helper-foundation.md`
- `docs/migration/phase-12n3-unified-lifecycle-api-non-destructive.md`
- `docs/migration/phase-12n4-destruction-approval-policy-and-safety-plan.md`
- `docs/migration/phase-12n5-unified-approve-destruction-api-only.md`
- `docs/migration/phase-12n6-unified-lifecycle-detail-buttons-non-destructive.md`
- `docs/migration/phase-12n6b-unified-lifecycle-button-placement-redirect-ux.md`
- `docs/migration/phase-12n7-destruction-approval-ui-plan.md`
- `docs/migration/phase-12n8-unified-destruction-approval-ui.md`
- `docs/migration/phase-12n9-archive-native-destruction-audit-planning.md`
- `docs/migration/phase-12n10-physical-file-destruction-policy-implementation.md`
- `docs/migration/phase-12n11-legacy-proposal-route-compatibility-cleanup-plan.md`
- `docs/migration/phase-12n11b-legacy-proposal-route-removal-and-redirect-cleanup.md`
- `docs/migration/phase-12o-unified-archive-aggregate-export.md`
- `docs/migration/phase-12p-dev-manual-archive-data-storage-cleanup.md`
- `docs/migration/phase-12q-unified-archive-classification-report.md`
- `docs/migration/phase-12q1-classification-report-detail-drilldown.md`
- `docs/migration/phase-12z-unified-archive-feature-handoff-closure.md`
- `docs/migration/phase-13c-ppspm-display-rename.md`
- `docs/migration/phase-13d-pengklasifikasian-dokumen-terminology-flow.md`
- `docs/migration/phase-13e-penambahan-dokumen-manual-flow.md`
- `docs/migration/phase-13f-folder-berkas-data-model-foundation.md`
- `docs/migration/phase-13g-close-folder-helper-api-foundation.md`
- `docs/migration/phase-13h-folder-berkas-api-foundation.md`
- `docs/migration/phase-13i-pengklasifikasian-dokumen-open-berkas-integration.md`
- `docs/migration/phase-13j-penambahan-dokumen-open-berkas-integration.md`
- `docs/migration/phase-13k-folder-first-finalization-policy-and-detransitionalization-plan.md`
- `docs/migration/phase-13l-berkas-status-arsip-schema-foundation.md`
- `docs/migration/phase-13m-close-berkas-finalization-sets-aktif.md`
- `docs/migration/phase-13n-folder-first-read-model-foundation.md`
- `docs/migration/phase-13o-folder-first-archive-pages.md`
- `docs/migration/phase-13p-folder-item-file-access-and-dimusnahkan-block.md`
- `docs/migration/phase-13p2-open-berkas-visibility-and-jenis-pembayaran-eligibility.md`
- `docs/migration/phase-13q-folder-lifecycle-transitions-and-visibility.md`
- `docs/migration/phase-13q2-lifecycle-ux-placement-confirmation-and-filename-preservation.md`
- `docs/migration/phase-13r-folder-first-csv-export.md`
- `docs/migration/phase-13s-close-berkas-ui-form.md`
- `docs/migration/phase-13s1-close-berkas-modal-and-list-shortcut.md`
- `docs/migration/phase-13t-workflow-pengklasifikasian-detransitionalization.md`
- `docs/migration/phase-13t1-folder-item-attachment-name-preservation-bugfix.md`
- `docs/migration/phase-13t2-folder-attachment-name-runtime-hotfix.md`
- `docs/migration/phase-13u-manual-penambahan-dokumen-detransitionalization.md`
- `docs/migration/phase-13v-legacy-active-archive-route-cleanup.md`
- `docs/migration/phase-13w-folder-first-inaktif-usul-musnah-pages.md`
- `docs/migration/phase-13w1-lifecycle-redirects-and-destruction-modal.md`
- `docs/migration/phase-13w2-detail-destruction-modal-ux.md`
- `docs/migration/phase-13x-physical-file-destruction-policy-plan.md`
- `docs/migration/phase-13y1-folder-first-physical-deletion-helper.md`
- `docs/migration/phase-13y2-musnahkan-data-physical-deletion-integration.md`
- `docs/migration/phase-13y3-document-file-access-destroyed-folder-awareness.md`
- `docs/migration/phase-13y4-attachment-viewer-destroyed-file-ux.md`
- `docs/migration/phase-13z-legacy-canonical-archive-cleanup-decision-plan.md`
- `docs/migration/phase-14a-legacy-soft-deprecation-search-report-plan.md`
- `docs/migration/phase-14b-remove-global-archive-search.md`
- `docs/migration/phase-14c-local-archive-page-search-filters.md`
- `docs/migration/phase-14d-folder-first-report-export-alignment.md`
- `docs/migration/phase-14e-remove-laporan-klasifikasi-surface.md`
- `docs/migration/phase-14f-inaktif-usul-musnah-csv-export.md`
- `docs/migration/phase-14g-legacy-canonical-archive-removal-audit-plan.md`
- `docs/migration/phase-14h-remove-legacy-canonical-runtime.md`
- `docs/migration/phase-14i0-folder-first-storage-guards.md`
- `docs/migration/phase-14i-drop-legacy-canonical-archive-schema.md`
- `docs/migration/phase-14j-dev-db-migration-validation.md`
- `docs/migration/phase-14j2-local-seed-hash-handling-hardening.md`

---

## Active Stack

| Layer | Teknologi | Status |
|---|---|---|
| Framework | TanStack Start | aktif |
| Router | TanStack React Router file-based | aktif |
| Language | TypeScript | wajib |
| Database | local PostgreSQL | aktif |
| ORM | Drizzle ORM | aktif |
| Auth | local `dms_session` auth | aktif |
| Storage | local filesystem storage | aktif |
| Validation | Zod | wajib di boundary |
| UI | React 19 + Tailwind CSS v4 + komponen UI lokal | aktif |
| Testing | Vitest + Playwright | aktif |
| Package Manager | pnpm | wajib |

### Package Manager Rules

Gunakan `pnpm` untuk semua operasi package manager.

```bash
pnpm install
pnpm add <paket>
pnpm add -D <paket>
pnpm remove <paket>
pnpm dev
pnpm build
pnpm test
```

Aturan:

- jangan gunakan `npm` atau `yarn`
- commit `pnpm-lock.yaml` hanya jika phase eksplisit mengizinkan package change
- referensi praktik: `docs/pnpm-best-practices.md`

---

## Supabase Retirement Boundary

Klasifikasi yang benar:

```text
Active runtime/package Supabase dependency retired.
Historical Supabase artifacts remain.
```

Yang retired:

- active runtime/package dependency untuk clean local target
- active `@supabase/*` package dependency
- active Supabase Auth/Database/Storage runtime fallback
- old Supabase data/file recovery expectation

Yang masih ada sebagai historical/cleanup backlog:

- historical migration docs/specs
- stale test references or expectations
- source comments/type residue
- `.env.example` Supabase key-name residue
- retained `supabase/` folder and legacy artifacts

Rules:

- Do not reintroduce Supabase packages, helpers, runtime clients, storage fallback, or old file/data recovery.
- Do not delete or modify `supabase/` unless a later human-approved cleanup phase explicitly allows it.
- Do not claim Supabase is fully removed from repository.
- Treat historical Supabase references as traceability unless the active runtime/package audit proves otherwise.

---

## Security Posture

### Auth Boundary

- `dms_session` is the auth boundary.
- `dms_session` is an opaque `HttpOnly` cookie backed by hashed session-token storage.
- `dms_active_role` is UX-only state and is not authorization proof.
- Server/API RBAC is authoritative.
- Client-side role hiding is a UX hint only.
- `ADMIN` is a dedicated role and must not be broadened into or combined with `PEGAWAI`, `PPK`, `BENDAHARA`, `KEPALA_SUB_BAGIAN_UMUM`, or `PENANGGUNG_JAWAB_KINERJA`.
- Passwords use Argon2id.
- Logout and password-change/reset session revocation behavior must remain server-authoritative.
- Development seed password hashes use `DMS_DEV_SEED_PASSWORD_HASH` as a literal Argon2id PHC string beginning with `$argon2id$`; seed loading must not expand `$` segments.
- Seed commands, validation, tests, and docs must not print password hashes, env contents, DB URLs, credentials, tokens, cookies, sessions, or other secrets.

### Same-Origin And CSRF

- Unsafe API methods are protected by centralized same-origin `Origin`/`Referer` validation.
- This is a bounded same-origin foundation, not a full CSRF token framework.
- Safe methods must remain non-mutating.
- A full CSRF token framework remains future hardening if deployment expands.

### Rate Limit

- Login has an in-memory/local-process brute-force foundation.
- The limiter is not persistent and not distributed.
- Persistent/distributed rate-limit and reverse-proxy throttling remain maintenance backlog if topology expands.
- Broader throttling for upload, workflow, archive, admin, password-change, and file-token routes remains backlog.

### Admin Cleanup

- Destructive admin cleanup requires `POST` with explicit destructive intent.
- `GET` cleanup is non-destructive dry-run/report-only.
- Cleanup must protect referenced current source files from `dokumen_transaksi.lampiran_urls` and `manual_arsip_attachment.logical_path`.
- Cleanup and diagnostics must use folder-first/current-source guards, not legacy canonical `arsip.arsip`, `arsip.lampiran_snapshot`, or `canonical_arsip_id` bridge data.
- Cleanup responses must not expose physical storage paths or storage roots.
- Cleanup and diagnostics API responses must not expose logical paths, storage roots, raw rows, SQL details, tokens, env/session/cookie values, or secrets; return safe counts/categories only.

### File Access

- Raw logical-path file access must revalidate current document/archive state.
- `DIMUSNAHKAN` must block preview/download/file access, including stale token/path access.
- File access token internals must not be printed.
- File access must not expose physical storage path/root.

### Deployment Posture

- HTTPS plus `Secure` `dms_session` remains the preferred final deployment posture.
- Trusted HTTP LAN with `DMS_SESSION_COOKIE_SECURE=false` is bounded/internal only.
- Trusted HTTP LAN is not public internet approval, broad LAN certification, or production posture.
- PostgreSQL should not be broadly exposed to LAN clients unless a future explicit operational decision allows it.

---

## Canonical Domain Model

### Role

Role yang dipakai aplikasi:

```ts
type Role = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'KEPALA_SUB_BAGIAN_UMUM' | 'ADMIN'
```

After Phase 12E.1 this is extended to:

```ts
type Role =
  | 'PEGAWAI'
  | 'PPK'
  | 'BENDAHARA'
  | 'KEPALA_SUB_BAGIAN_UMUM'
  | 'PENANGGUNG_JAWAB_KINERJA'
  | 'ADMIN'
```

Display label tambahan: `Penanggung Jawab Kinerja`.

After Phase 13C, internal role enum/value `BENDAHARA` remains unchanged for DB values, RBAC, routes, API contracts, file paths, and workflow status semantics. User-facing display label for that role is `PPSPM`, with full wording `Pejabat Penandatangan Surat Perintah Membayar` where helpful.

Canonical constants ada di:

- `src/lib/constants/roles.ts`
- `src/lib/types/auth.ts`

Rules:

- Users can have multiple non-admin roles.
- `ADMIN` remains dedicated.
- `PENANGGUNG_JAWAB_KINERJA` has metadata-only access to Laporan Kinerja and is not inherited by `ADMIN`.
- Server-side role checks are mandatory.

### Status Dokumen

Status dokumen yang saat ini dikenal kode:

```ts
type StatusDokumen =
  | 'DRAFT'
  | 'IN_PPK_VALIDATION'
  | 'IN_BENDAHARA_APPROVAL'
  | 'NEED_REVISION'
  | 'COMPLETED'
  | 'TERSIMPAN'
  | 'ARCHIVED'
```

Catatan:

- `TERSIMPAN` dipakai untuk dokumen Non-Material yang selesai disimpan tanpa approval material.
- Transisi FSM formal tetap dipusatkan di `src/lib/fsm.ts`.
- `TERSIMPAN` dihasilkan oleh handler submit Non-Material, bukan oleh `transition()` FSM umum.

Canonical constants ada di:

- `src/lib/constants/document-status.ts`
- `src/lib/types/fsm.ts`
- `src/lib/fsm.ts`

### Current Step

```ts
type CurrentStep = 'PPK' | 'BENDAHARA' | null
```

### Revision Target

```ts
type RevisionTarget = 'USER' | 'PPK' | null
```

### Arsip Lifecycle

Lifecycle arsip setelah dokumen sudah `ARCHIVED`:

```ts
type StatusArsip = 'AKTIF' | 'INAKTIF' | 'USUL_MUSNAH' | 'DIMUSNAHKAN'
```

Alur aktif:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Catatan:

- migrasi lama pernah mengenal `VERIFIKASI_PENYUSUTAN`
- status itu sudah dihapus oleh migrasi berikutnya
- `DIMUSNAHKAN` must block preview/download/file access
- After Phase 13K, target lifecycle authority moves to folder/berkas level for new runtime; current `arsip.arsip` lifecycle remains transitional compatibility until de-transitionalization.

### Status Berkas

Folder/berkas status values after Phase 13F and Phase 13G:

```ts
type BerkasStatus = 'OPEN' | 'CLOSED'
```

Rules:

- `OPEN` means the folder/berkas may receive future classified documents once a write flow exists.
- `CLOSED` means final folder metadata has been filled and later phases may map the folder into archive lifecycle handling.
- Closed folders must not accept new documents/items in runtime write helpers or future APIs.
- Close-folder requires `Nomor SPM`, active retention, and inactive retention; `closed_at` is recorded using caller input or the server date, and `closed_by` plus calculated retention end dates are set server-side.
- `KEPALA_SUB_BAGIAN_UMUM` owns close-folder operation; future close-folder APIs must enforce this server-side through `dms_session` assigned roles, not only UI.
- Folder-level `status_arsip` schema foundation exists after Phase 13L; after Phase 13M, runtime close/finalization sets `status_arsip='AKTIF'`.
- Phase 13K accepts Option A: `berkas_arsip` becomes the canonical folder/archive parent for new runtime, `berkas_arsip_item` combines `WORKFLOW` and `MANUAL` source items, and `arsip.arsip` becomes legacy/transitional compatibility after de-transitionalization.
- Future folder model prefers `status_berkas = OPEN | CLOSED`, nullable `status_arsip` while `OPEN`, and `status_arsip='AKTIF'` when a folder is closed/finalized.
- Phase 13L adds the nullable folder-level `berkas_arsip.status_arsip` schema foundation with allowed values `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`; `OPEN` folders must keep it null.
- Phase 13M updates close/finalize runtime behavior so newly closed berkas set `status_berkas='CLOSED'` and `status_arsip='AKTIF'`. Existing `CLOSED` berkas rows may remain `status_arsip IS NULL` unless a later human-approved backfill/remediation phase changes them. Phase 13M does not implement lifecycle movement beyond initial `AKTIF`.
- Phase 13N adds a read-only folder-first query/read-model foundation for future folder-first archive pages. New folder-first pages should use `berkas_arsip` plus `berkas_arsip_item` as the primary read authority, with source metadata enriched from `dokumen_transaksi` and `manual_arsip`. `arsip.arsip` remains transitional compatibility and must not be treated as the primary read authority for new folder-first pages.
- Phase 13O adds bounded folder-first archive list/detail pages at `/arsiparis/berkas` and `/arsiparis/berkas/$id` plus read-only API wrappers that use the Phase 13N read model. New folder-first pages must use `berkas_arsip` and `berkas_arsip_item` as primary authority and must not de-transitionalize `arsip.arsip` writes. After Phase 13V, `/arsiparis/berkas` is the primary active archive folder-first surface; after Phase 14H, the old `/arsiparis/aktif` compatibility redirect and old `/arsiparis/arsip/$id` canonical detail route are removed from runtime registration.
- Phase 13P adds folder-aware item preview/download for folder-first detail pages. File access for folder items must revalidate the current `berkas_arsip` folder and `berkas_arsip_item` membership on every request. If a folder has `status_arsip='DIMUSNAHKAN'`, preview/download for every item in that folder must be blocked with the safe message `Data sudah dimusnahkan`. Phase 13P does not delete physical files, mutate lifecycle state, stop transitional `arsip.arsip` writes, or add schema/migration changes.
- Phase 13P.2 records the stricter 1:1 `Jenis Pembayaran` to `berkas_arsip` rule for new runtime. If an `OPEN` berkas exists for a `klasifikasi_id`, new workflow/manual documents may attach to that existing berkas. If only `CLOSED` berkas rows exist for that `klasifikasi_id`, including `AKTIF`, future `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN`, that Jenis Pembayaran must not be selectable for new Pengklasifikasian Dokumen or Penambahan Dokumen. Runtime open/get-create helpers must not create a second berkas for the same Jenis Pembayaran.
- Phase 13Q adds bounded folder-level lifecycle transitions at `berkas_arsip.status_arsip`: `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`. The lifecycle API/UI require assigned `KEPALA_SUB_BAGIAN_UMUM`, reject `OPEN/null`, `CLOSED/null`, invalid jumps, and terminal `DIMUSNAHKAN`, and update only folder lifecycle status plus `updated_at`.
- Phase 13Q.2 corrects folder-first lifecycle UX placement: `/arsiparis/berkas` keeps the title/navigation name `Pemberkasan Arsip Aktif` and shows only `Berkas Terbuka` plus `Pemberkasan Arsip Aktif`. `Arsip Inaktif` and `Usul Musnah` belong to their dedicated pages/future integration surfaces, and `Dimusnahkan` does not need a general list section.
- Phase 13Q.2 records the stricter status-destruction confirmation preference: `Musnahkan Data` / `approve_destruction` requires exact typed confirmation `MUSNAHKAN DATA FILE`, and confirmation copy must state that status becomes `Dimusnahkan`, preview/download is blocked, physical files are not deleted in this phase, and metadata remains.
- Phase 13Q.2 records filename preservation for folder item file access: `WORKFLOW` attachments should preserve safe original filename metadata from `dokumen_transaksi.lampiran_urls` where available, falling back only to safe attachment label plus logical-path extension; `MANUAL` attachments preserve existing manual archive responder filename semantics. Header sanitization must not expose logical paths, physical paths, storage roots, tokens, or signed-token internals.
- Phase 13R adds read-only client-side CSV export for `/arsiparis/berkas` and `/arsiparis/berkas/$id` using existing safe folder-first DTOs. CSV exports are limited to user-facing metadata and must not include raw IDs, item keys, paths, URLs, tokens, storage roots, signed-token internals, raw attachment metadata, SQL details, env/session/cookie/secret values, or file content. Phase 13R does not add routes, DB queries, lifecycle/write behavior, schema/migration/package/env/storage changes, Supabase runtime changes, physical deletion, backfill, or de-transitionalization.
- Phase 13S adds the user-facing `Tutup Berkas` form on `/arsiparis/berkas/$id` for `OPEN/null` berkas only. The form reuses the existing close API, sends `nomor_spm`, `retensi_aktif`, `retensi_inaktif`, and optional `closed_at`, refreshes detail after success, and close/finalize sets `status_berkas='CLOSED'` and `status_arsip='AKTIF'`.
- Phase 13S preserves the Phase 13P.2 1:1 rule: after close, the Jenis Pembayaran no longer accepts new workflow/manual documents because the only matching berkas is closed. It does not change dropdown eligibility logic, lifecycle semantics, CSV export behavior, schema/migration/package/env/storage/Supabase runtime behavior, transitional `arsip.arsip` writes, or physical file deletion.
- Phase 13S.1 makes the preferred close UX a modal/popup metadata form titled `Tutup Berkas`. The detail-page button and `Berkas Terbuka` list shortcut both reuse the existing close API and close metadata fields, preserve the 1:1 Jenis Pembayaran rule after close, and do not render close actions for `Pemberkasan Arsip Aktif` rows.
- Phase 13T de-transitionalizes workflow `Pengklasifikasian Dokumen` only: selected `COMPLETED` workflow documents attach to an `OPEN` berkas as `WORKFLOW` `berkas_arsip_item` rows, remain `dokumen_transaksi.status='COMPLETED'`, and no longer create new `arsip.arsip` `WORKFLOW` rows during classification. Final archive metadata and lifecycle remain folder-level.
- Phase 13T.1 fixes folder-first item attachment naming only. Folder item labels, preview titles, and `WORKFLOW` download filenames must preserve safe source naming semantics from `dokumen_transaksi.lampiran_urls` plus existing dokumen filename formatting; `MANUAL` labels/preview titles must use safe `manual_arsip_attachment.judul_lampiran` metadata while manual download responses continue using the existing Manual Archive responder policy. Generic labels such as `Lampiran 1` or `Lampiran` are fallback only when source metadata is missing or unsafe.
- Phase 13T.2 hotfix makes folder-first attachment naming defensive. `WORKFLOW` source filename reconstruction is best-effort only and must never crash folder detail or file access; if full dokumen persetujuan filename formatting cannot be safely built, runtime falls back to safe `lampiran_urls[].nama` plus logical-path extension, then `Lampiran N` plus extension, then `Lampiran N`. Manual download delegation remains unchanged.
- Phase 13U de-transitionalizes manual `Penambahan Dokumen` only: new manual creates still validate `Jenis Pembayaran`, create `manual_arsip` source data, create manual attachments through the existing upload path, open/reuse the matching `OPEN` berkas, and insert a `MANUAL` `berkas_arsip_item`, but no longer create new `arsip.arsip` `MANUAL` rows or set `manual_arsip.canonical_arsip_id`. Existing old manual canonical rows remain compatibility/history only. Final archive metadata and lifecycle remain folder-level.
- Phase 13V redirected legacy `/arsiparis/aktif` to `/arsiparis/berkas` so the old canonical active list was no longer the main active archive surface. Navigation kept label `Pemberkasan Arsip Aktif` and targeted `/arsiparis/berkas`. Phase 14H later removes the `/arsiparis/aktif` and `/arsiparis/arsip/$id` runtime route registrations; old canonical `arsip.arsip` rows remain history pending schema cleanup.
- Phase 13W makes `/arsiparis/inaktif` the folder-first `CLOSED/INAKTIF` lifecycle surface using `berkas_arsip` list data and the existing folder lifecycle API for `propose_destruction`.
- Phase 13W makes `/arsiparis/usul-musnah` the folder-first `CLOSED/USUL_MUSNAH` lifecycle surface using `berkas_arsip` list data and the existing folder lifecycle API for `approve_destruction` with exact typed confirmation `MUSNAHKAN DATA FILE`.
- Phase 13W does not create a general `Dimusnahkan` list page or section. Physical file deletion remains a future dedicated destructive phase; `DIMUSNAHKAN` continues to preserve metadata and block preview/download through existing file-access policy.
- Phase 13W.1 records the lifecycle success-navigation preference: successful close/lifecycle actions should redirect or land on their destination list page (`/arsiparis/berkas`, `/arsiparis/inaktif`, or `/arsiparis/usul-musnah`). `Musnahkan Data` on `/arsiparis/usul-musnah` uses a modal with exact typed confirmation `MUSNAHKAN DATA FILE`; `Dimusnahkan` still has no general list page.
- Phase 13W.2 records the detail-page destruction UX preference: `Musnahkan Data` confirmation is modal-based on both `/arsiparis/usul-musnah` list rows and `/arsiparis/berkas/$id` folder detail, with exact typed confirmation `MUSNAHKAN DATA FILE`, no physical deletion, and no general `Dimusnahkan` list page.
- Phase 13X records folder-first physical file destruction as a future dedicated destructive phase only. Preferred safeguards are a separate dry-run-first maintenance action after `CLOSED/DIMUSNAHKAN`, exact typed confirmation `HAPUS FILE FISIK ARSIP` for execution, server-side `KEPALA_SUB_BAGIAN_UMUM` authorization unless a later explicit maintenance role policy is approved, deletion candidates derived only from current `berkas_arsip_item` membership plus source tables, metadata preservation, idempotent already-missing handling, and safe count/category reports with no path/root/token leaks.
- Phase 13Y.1 added a server-only folder-first physical deletion helper foundation in `src/lib/archive/berkas-arsip-physical-destruction.ts` for berkas that are already `CLOSED/DIMUSNAHKAN`. The helper supports dry-run and exact-confirmation execution with `HAPUS FILE FISIK ARSIP`, derives candidates only from current `berkas_arsip_item` membership plus `dokumen_transaksi.lampiran_urls` or `manual_arsip_attachment.logical_path`, preserves all metadata rows and logical references, and returns safe counts/categories only. Phase 13Y.1 itself was helper-only; runtime integration is governed by Phase 13Y.2.
- Phase 13Y.2 integrates folder-first physical deletion into the existing `Musnahkan Data` / `approve_destruction` action. After server-side validation and exact typed confirmation `MUSNAHKAN DATA FILE`, the API moves `USUL_MUSNAH -> DIMUSNAHKAN`, then invokes the server-only physical deletion helper for the same berkas id with the helper confirmation phrase internally. The action preserves metadata/history and logical references, blocks preview/download through `DIMUSNAHKAN`, returns safe count/category physical deletion summaries only, and does not add a separate physical deletion button, route, page, modal, or `Dimusnahkan` list.
- Phase 13Y.3 makes legacy/document token file-access paths folder-first destroyed-aware. After token/session validation and document RBAC pass, document preview/download for a `WORKFLOW` source attached to a `CLOSED/DIMUSNAHKAN` `berkas_arsip` must return `Data file sudah dimusnahkan` with destroyed-file status instead of falling through to generic `File not found` after physical deletion. Unauthorized users must still receive auth/authorization failures, not destroyed-folder existence signals.
- Phase 13Y.4 makes `AttachmentViewer` display the backend destroyed-file message for preview/download failures. When authorized file access returns `410` with exact JSON `{ "error": "Data file sudah dimusnahkan" }`, the preview modal and download error path must show `Data file sudah dimusnahkan`; unauthorized or arbitrary backend errors must keep generic/fallback messaging and must not be converted into destroyed-file copy.
- Phase 13Z is planning/audit only. It records that folder-first `berkas_arsip` plus `berkas_arsip_item` is the runtime archive authority after lifecycle completion, while old canonical `arsip.arsip` surfaces remain historical compatibility until later implementation phases explicitly soft-deprecate, redirect, disable, or remove specific routes/APIs. `/arsiparis/arsip/$id` should remain available for old canonical rows for now, but future cleanup should make it clearly historical/read-only and remove it from primary navigation/search authority where safe.
- Phase 14A is planning-only. It records the high-level direction that folder-first `berkas_arsip` plus `berkas_arsip_item` is the runtime authority for future search, report/export, aggregate, and dashboard-count alignment. Canonical `arsip.arsip` remains historical compatibility until scoped implementation phases relabel, soft-deprecate, block, redirect, or remove specific legacy surfaces. Primary future search/report/dashboard behavior should not use old canonical APIs as runtime authority.
- Phase 14B removes the sidebar/global archive search surface. `Cari Arsip` / `Pencarian Arsip` must not appear as active sidebar or dashboard navigation, and archive search/filter behavior is local per archive page/table (`/arsiparis/berkas`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, and detail pages where needed). Phase 14H later removes the `/arsiparis/search` compatibility redirect and `GET /api/arsiparis/search` runtime API. Header search is a separate global UI surface and is not archive authority.
- Phase 14C implements or confirms local client-side archive search/filter controls on folder-first archive pages only. `/arsiparis/berkas` filters both `Berkas Terbuka` and `Pemberkasan Arsip Aktif`, `/arsiparis/inaktif` filters only the current inactive table, `/arsiparis/usul-musnah` filters only the current proposed-destruction table, and `/arsiparis/berkas/$id` filters only the documents/items inside that berkas. These filters use existing safe DTO/display fields and must not search or expose raw IDs, logical paths, URLs, tokens, storage roots, signed-token internals, SQL, env/session/cookie values, raw rows, or secrets. Do not reintroduce sidebar/global `Cari Arsip`; header search remains separate and is not archive authority.
- Phase 14D briefly aligned the classification report/drilldown implementation to folder-first runtime authority, but Phase 14E supersedes that product surface. Do not treat `Laporan Klasifikasi` as an active runtime/report feature.
- Phase 14E removes the `Laporan Klasifikasi` UI/API surface: `/arsiparis/laporan-klasifikasi`, `/arsiparis/laporan-klasifikasi/detail`, `GET /api/arsiparis/arsip/classification-report`, and `GET /api/arsiparis/arsip/classification-report-detail` are no longer active routes. Do not reintroduce them unless a later explicit human-approved phase restores the feature. Folder-first CSV exports remain on `/arsiparis/berkas` and `/arsiparis/berkas/$id`. Legacy DB/schema cleanup, including `arsip.arsip`, is a separate future phase.
- Phase 14F adds safe client-side folder-first CSV export to lifecycle list pages where useful: `/arsiparis/berkas`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, and `/arsiparis/berkas/$id`. Exports follow local filtered visible rows/items and must remain metadata-only with no raw IDs, item file keys, logical paths, physical paths, storage roots, URLs, signed-token internals, SQL/env/session/cookie values, secrets, raw rows, or file content. This does not restore `Laporan Klasifikasi`, global `Cari Arsip`, header search changes, backend export APIs, lifecycle behavior, schema/storage/package/env changes, Supabase runtime, or physical deletion behavior.
- Phase 14G records the active-development cleanup decision: old archive data is not important for the dev cleanup target, and legacy canonical archive compatibility is no longer a long-term goal. `berkas_arsip` plus `berkas_arsip_item` is the only intended archive runtime authority. Remaining `arsip.arsip` UI/API/helper/schema surfaces should be removed in phased cleanup: runtime routes/APIs/helpers/tests first, schema/drop migration separately, then dev DB reset/migration validation and final regression sweep.
- Phase 14H removes legacy canonical archive runtime routes, APIs, helpers, and tests that are no longer used by folder-first runtime. `/arsiparis/aktif`, `/arsiparis/search`, and `/arsiparis/arsip/$id` are no longer registered runtime browser routes; `/api/arsiparis/aktif`, `/api/arsiparis/inaktif`, `/api/arsiparis/usul-musnah`, `/api/arsiparis/search`, and legacy `/api/arsiparis/arsip/*` detail/lifecycle/aggregate/export APIs are removed. Archive dashboard counts now use folder-first `/api/arsiparis/berkas` filters for `CLOSED/AKTIF`, `CLOSED/INAKTIF`, and `CLOSED/USUL_MUSNAH`. Schema cleanup remains separate for Phase 14I; do not drop `arsip.arsip`, `arsip.lampiran_snapshot`, `arsip_usul_musnah`, or `canonical_arsip_id` columns in Phase 14H.
- Phase 14I removes legacy canonical archive schema from active Drizzle/runtime authority after 14H and 14I.0. Active Drizzle schema no longer exports `arsip.arsip`, `arsip.arsip_usul_musnah`, `arsip.lampiran_snapshot`, `manual_arsip.canonical_arsip_id`, or `berkas_arsip_item.canonical_arsip_id`. Folder-first `berkas_arsip` plus `berkas_arsip_item`, `dokumen_transaksi`, `manual_arsip`, and `manual_arsip_attachment` remain the archive runtime authority. Historical docs, old migrations, and retained Supabase artifacts may still mention old canonical objects and are not active runtime authority.
- Phase 14J validates the cleaned migration chain on the disposable local development PostgreSQL target after a documented local Docker DB reset. `pnpm db:local:migrate` applies through 0009 successfully, folder-first archive/source tables are present, legacy canonical archive tables/columns are absent, and the targeted archive/manual/storage regression set passes. This is development validation only; no feature behavior, schema design, storage cleanup, package/env, Supabase artifact, or route behavior changed.
- OPEN berkas must remain visible before finalization through folder-first read surfaces so users can see ongoing pemberkasan before the folder is closed/finalized.
- A `DIMUSNAHKAN` folder must block preview/download for every item in that folder. After Phase 13Y.2, `Musnahkan Data` is intended to physically delete folder-first berkas files while preserving metadata and logical references. Physical deletion targets folder-first berkas items before any legacy `arsip.arsip` physical deletion expansion, and safe responses must not expose paths, roots, tokens, SQL, env values, cookies, sessions, raw rows, or secrets.

---

## Database Source Of Truth

Current post-migration source-of-truth order:

1. Drizzle schema and migrations for local PostgreSQL.
2. Endpoint/helper behavior that uses those tables.
3. Historical Supabase migrations only as compatibility/provenance reference.

Do not treat `supabase/migrations/` as the active database authority after the local migration. They are retained historical artifacts unless a future cleanup policy changes that.

### Active Table Families

Auth/RBAC:

- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`

Master Data Dokumen:

- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_kelengkapan_dokumen`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.ketua_tim_assignments`

Workflow Dokumen:

- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`

Arsip:

- `arsip.arsip`
- `arsip.berkas_arsip`
- `arsip.berkas_arsip_item`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`
- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

### Schema Rules

- `ketua_tim_assignments` remains unique per `kegiatan_id`, not unique `(user_id, kegiatan_id)`.
- `dokumen_transaksi` includes `nominal_realisasi`, `is_non_material`, `jenis_dokumen_id`, and material request-chain columns.
- `nominal_realisasi` is only for Material documents.
- Non-Material documents do not have `nominal_realisasi`.
- `arsip.lampiran_snapshot` stores attachment metadata snapshot.
- `log_aktivitas` is append-only by contract.
- Manual archive for Penambahan Arsip uses separate tables and must not be forced into `dokumen_transaksi`.
- Phase 12L.2 extends `arsip.arsip` as the transitional canonical archive parent foundation with `source_type: 'WORKFLOW' | 'MANUAL'`; existing Manual Archive rows are not migrated into it yet.
- `arsip.arsip.dokumen_id` is nullable overall after Phase 12L.2 so future canonical `MANUAL` rows do not require `dokumen_transaksi`; current workflow archive writes still provide it.
- Strict `WORKFLOW`/`MANUAL` relationship checks for `dokumen_id` are future constraints after report-first backfill and write alignment.
- `manual_arsip_category` is separate from `master_klasifikasi_arsip`; `master_klasifikasi_arsip` remains the archival classification hierarchy.
- One `manual_arsip` parent row represents one report/archive record. `manual_arsip_attachment` child rows must not be counted as additional reports in future aggregates.
- Manual archive attachments are optional, and the schema supports many attachments per parent row.
- `manual_arsip_attachment.judul_lampiran` is the official attachment title column; existing rows are backfilled from `original_filename` by Phase 12J.2a.
- `manual_arsip.nominal_realisasi` remains nullable at the DB layer for compatibility, but Manual Archive create API/UI require a positive integer `nominal_realisasi` greater than 0.
- Manual archive file paths are logical storage paths only, never physical filesystem paths or storage roots.
- Phase 13F adds additive folder/berkas foundation tables `arsip.berkas_arsip` and `arsip.berkas_arsip_item`.
- `berkas_arsip.status_berkas` values are `OPEN` and `CLOSED`.
- `berkas_arsip.status_arsip` is a nullable folder-level archive lifecycle foundation after Phase 13L, limited to `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN` when present.
- Phase 13M close/finalize runtime behavior sets `status_arsip='AKTIF'` for newly closed berkas. Existing `CLOSED` rows may remain null unless a later backfill/remediation phase is approved.
- `berkas_arsip_item.source_type` values are `WORKFLOW` and `MANUAL`.
- `WORKFLOW` berkas items reference `dokumen_transaksi` through `dokumen_id`; `MANUAL` berkas items reference transitional `manual_arsip` through `manual_arsip_id`.
- Exactly one source reference is expected per berkas item according to `source_type`.
- One `OPEN` folder per `klasifikasi_id` is expected by schema foundation.
- After Phase 13P.2, new runtime treats Jenis Pembayaran and berkas as 1:1: server helpers must prevent creating a second berkas when any `CLOSED` berkas already exists for the same `klasifikasi_id`.
- Phase 13F does not backfill existing workflow or manual rows into folders and does not change current runtime writes.
- Phase 13G adds a server-only close-folder/helper foundation in `src/lib/archive/berkas-arsip-service.ts`; it does not add routes/UI, route generation, backfill, lifecycle mapping, schema changes, migrations, storage/file changes, or Supabase fallback.
- Phase 13G helper-created folders derive classification code/name snapshots from `master_klasifikasi_arsip`; callers must not supply trusted snapshot values.
- Phase 13G add-item helpers explicitly reject non-`OPEN` folders and require source classification/payment type to match the target folder.
- Phase 13G close helper rejects empty folders and already `CLOSED` folders, validates `Nomor SPM` and retention metadata, and calculates retention end dates without creating final canonical archive rows.
- Phase 13H adds backend-only API route files for opening/get-creating a folder by `Jenis Pembayaran`, adding workflow/manual source items to an `OPEN` folder, and closing a non-empty `OPEN` folder. The routes require local `dms_session`, assigned `KEPALA_SUB_BAGIAN_UMUM`, and same-origin protection for unsafe `POST`; `ADMIN` is not a substitute. Phase 13H does not add UI, backfill, lifecycle mapping, canonical archive mutation, schema/migrations, package changes, storage/file changes, or Supabase fallback. Phase 13H.1 registered these routes through the generated route tree.
- Phase 13I integrated the existing workflow `Pengklasifikasian Dokumen` route with folder/berkas writes while preserving transitional canonical workflow archive creation at that time. Phase 13T supersedes the workflow write behavior: after server-side `Jenis Pembayaran` validation, the route gets or creates the matching `OPEN` berkas and attaches the `COMPLETED` workflow document as a `WORKFLOW` item without creating a new `arsip.arsip` row and without transitioning the document to `ARCHIVED`. Duplicate item assignment must return a safe conflict response. This does not change manual creation, backfill, close-folder behavior, lifecycle mapping, schema/migrations, package changes, storage/file changes, or Supabase fallback.
- Phase 13J integrated the existing `Penambahan Dokumen` manual create runtime with folder/berkas writes while preserving transitional canonical Manual Archive creation at that time. Phase 13U supersedes the new manual write behavior: after server-side `Jenis Pembayaran` validation, the route creates the `manual_arsip` source row, gets or creates the matching `OPEN` berkas, and attaches the source as a `MANUAL` item without creating a new `arsip.arsip` row and without setting `manual_arsip.canonical_arsip_id`. Duplicate item assignment must return a safe conflict response. This does not change manual attachment upload/storage, preview/download responders, backfill, close-folder behavior, lifecycle mapping, schema/migrations, package changes, storage/file changes, or Supabase fallback.
- Phase 13K locks the folder-first finalization policy as docs/planning only. Future `Pengklasifikasian Dokumen` should keep workflow documents `COMPLETED`, attach them to an `OPEN` berkas, and stop writing new canonical `arsip.arsip` rows only in a later implementation phase. Final archive metadata and lifecycle belong to `berkas_arsip`, not individual item archive rows.
- Phase 13M updates close/finalize berkas behavior only: closing a non-empty `OPEN` berkas with valid final metadata sets `status_berkas='CLOSED'` and initial folder lifecycle `status_arsip='AKTIF'`. It does not backfill existing `CLOSED` rows, add lifecycle transitions, add folder-first pages, stop transitional `arsip.arsip` writes, change file access, implement `DIMUSNAHKAN` blocking, delete physical files, or change schema/migrations/packages/env/storage/Supabase behavior.
- Phase 13N adds `src/lib/archive/berkas-arsip-read-model.ts` as a read-only folder-first helper/query foundation. It returns folder list/detail DTOs, item counts, source metadata, and safe warning labels without adding routes/UI, mutating data, changing file access, stopping transitional `arsip.arsip` writes, or using `arsip.arsip` as the primary authority for new folder-first reads.
- Phase 13O adds read-only folder-first pages and API wrappers for active berkas archives. It points the Kepala Sub Bagian Umum active archive navigation to `/arsiparis/berkas` and does not add lifecycle mutation, file access, schema/migration, package/env, storage, or Supabase runtime changes. Phase 13V later changes `/arsiparis/aktif` from an old canonical active list into a compatibility redirect to `/arsiparis/berkas`; Phase 14H later removes that compatibility redirect and the old `/arsiparis/arsip/$id` canonical detail route from runtime registration.
- Phase 13Q adds `POST /api/arsiparis/berkas/$id/lifecycle` for status-only folder lifecycle transitions. It updates only `berkas_arsip.status_arsip` and `updated_at`, keeps `berkas_arsip_item`, workflow/manual sources, physical files, and transitional `arsip.arsip` writes unchanged. Phase 13Q.2 later narrows `/arsiparis/berkas` page placement to `OPEN/null` and `CLOSED/AKTIF` sections only; `CLOSED/INAKTIF`, `CLOSED/USUL_MUSNAH`, and `CLOSED/DIMUSNAHKAN` remain lifecycle states but do not belong as sections on that active pemberkasan page.
- Phase 13R CSV export is client-side/read-only from existing safe DTOs on folder-first pages. It must not be implemented as raw DB row export, must not expose `berkas_arsip`/`berkas_arsip_item` internal IDs or file keys, and must not mutate folder, item, workflow, manual, lifecycle, storage, or transitional `arsip.arsip` state.
- Phase 13S close UI is a detail-page form integration only. It uses the existing close API and close metadata schema, refuses obvious empty-folder submission in the UI while keeping server rejection authoritative, and refreshes the safe detail DTO after success. It does not add routes, schema/migration/storage/package/env changes, physical deletion, lifecycle semantic changes, backfill, or de-transitionalization.
- Phase 13S.1 refactors close UI into a shared client-side modal and adds an `OPEN/null` list shortcut. Closing from list/detail refreshes safe DTO data after success so the berkas can move from `Berkas Terbuka` to `Pemberkasan Arsip Aktif`; CSV export remains read-only and safe.
- Phase 13T de-transitionalizes workflow classification only. `POST /api/arsiparis/dokumen/$id/archive` remains a compatible route name but now performs folder-first classification for workflow documents: validate `COMPLETED`, validate `Jenis Pembayaran`, open/reuse the matching `OPEN` berkas, insert the `WORKFLOW` berkas item, keep the source document `COMPLETED`, do not write an `ARCHIVE` log tied to a status transition, and do not create a new `arsip.arsip` workflow row. The Pengklasifikasian inbox/detail read surface treats an existing `WORKFLOW` berkas item as classification evidence. Existing old `ARCHIVED` workflow data remains compatibility/history only and is rejected safely by this route.
- Phase 13T.1 preserves folder-first attachment names without changing schema, storage, lifecycle, classification, physical files, or transitional Manual Archive writes. Folder-first safe DTOs may expose sanitized attachment labels/titles, but must not expose raw `lampiran_urls`, logical paths, physical paths, storage roots, signed URLs, tokens, raw attachment metadata, SQL, env/session/cookie values, or internal route/file token details.
- Phase 13U de-transitionalizes manual creation only. `POST /api/arsiparis/manual-arsip` remains the compatible route name and response shape, but new creates no longer write `arsip.arsip` `MANUAL` rows or populate `manual_arsip.canonical_arsip_id`. Old linked manual canonical data remains readable through existing compatibility surfaces until those are explicitly replaced or cleaned up by a later human-approved phase.

---

## Architectural Invariants

1. **Local PostgreSQL/Drizzle is active.**
   - New DB work should update Drizzle schema/migrations first.
   - Historical Supabase migrations are reference only after local migration.

2. **FSM is the legal source for workflow transitions.**
   - All normal `dokumen_transaksi.status` transitions must match `src/lib/fsm.ts`.
   - Do not manually update status without FSM-equivalent reasoning and tests/docs.
   - If adding a state, update constants, types, FSM, tests, badges/filters, and this file.

3. **Audit trail is sacred.**
   - `log_aktivitas` append-only.
   - No `UPDATE` or `DELETE` to `log_aktivitas`.
   - Exception: the accepted scoped non-material `TERSIMPAN` document delete behavior may cascade logs only under the documented narrow conditions. Do not generalize it.

4. **Zod at every boundary.**
   - Request input, mutation payloads, and important response shapes should be validated by schema in `src/lib/schemas/` or equivalent local schema modules.

5. **No magic strings.**
   - Route paths use constants in `src/lib/constants/routes.ts` where shared.
   - Roles use constants in `src/lib/constants/roles.ts`.
   - Statuses use constants in `src/lib/constants/document-status.ts`.
   - Table names use constants in `src/lib/constants/tables.ts` when touching shared code.

6. **Secrets only in env.**
   - No hardcoded secret in `src/`.
   - Do not print env values, DB URLs, storage roots, password hashes, plaintext passwords, session tokens, cookie values, CSRF tokens, file tokens, signed file tokens, or physical paths.

7. **Server is the authority for RBAC.**
   - Client may hide UI.
   - Server handlers/helpers must make final access decisions.

8. **Prefer server/API boundaries for new work.**
   - Do not add new browser-direct DB/storage access.
   - Keep local filesystem access behind authorized API/server helpers.

9. **Update docs before behavior changes.**
   - If SOP, workflow, security posture, deployment posture, or storage behavior changes, update related docs and this file before or with code.

---

## Behavioral Rules

### 1. Auth And Active Role

- User login uses local auth and `dms_session`.
- Active role is stored in cookie `dms_active_role`.
- `dms_active_role` is readable UX state only.
- Helper auth utama:
  - `src/lib/auth.ts`
  - `src/lib/auth-state.ts`
- `AppLayout` bootstraps client auth state through local session APIs.
- `ADMIN` tetap diperlakukan sebagai akun dedicated.

### 2. Role Switcher

- If user has more than one non-admin role, role can be switched from header.
- Route default per role is defined by:
  - `src/lib/constants/routes.ts`
  - `src/config/navigation.ts`
- Role switch must be validated server-side against assigned roles.

### 3. Workflow Material

Alur approval material:

```text
DRAFT
-> IN_PPK_VALIDATION
-> IN_BENDAHARA_APPROVAL
-> COMPLETED
-> ARCHIVED
```

Rules:

- Material documents may use `nominal_realisasi`.
- For material workflow documents, report metadata including `nominal_realisasi` is locked once status is `COMPLETED`.
- PPK reject -> `NEED_REVISION`, `revision_target='USER'`.
- Bendahara reject -> `NEED_REVISION`, `revision_target='PPK'`.
- PPK `KEMBALIKAN` handles PPK-targeted revision back to Pegawai and must not be conflated with ordinary reject.
- `current_step` is `PPK`, `BENDAHARA`, or `null`.
- `revision_target` is `USER`, `PPK`, or `null`.

### 4. Workflow Non-Material

Dokumen Non-Material mengikuti shortcut:

```text
DRAFT -> TERSIMPAN
```

Rules:

- Does not enter PPK/Bendahara approval.
- Remains stored as document transaction.
- Can appear in selected reports.
- Does not have `nominal_realisasi`.
- `nominal_realisasi` must remain Material-only.

### 5. Arsip Flow

After document `COMPLETED`:

- Kepala Sub Bagian Umum can archive -> document becomes `ARCHIVED`, archive record is created with `status_arsip='AKTIF'`.
- Kepala Sub Bagian Umum skip action in FSM keeps document `COMPLETED`.
- After Phase 13D, the initial user-facing stage is `Pengklasifikasian Dokumen`, and the early classification label is `Jenis Pembayaran`. Internal archive/classification tables, fields, route paths, and API field names may still use `arsip`/`klasifikasi` terminology until a later schema/folder phase.
- Initial classification must not require `Nomor Surat` or `Nomor SPM`. `Nomor SPM` and final retention metadata are filled when closing/finalizing a folder/berkas.
- After Phase 13F, a real folder/berkas foundation exists in schema. After Phase 13G, server-only helpers can create/open folders, add source items to open folders, and close non-empty folders with final metadata. After Phase 13T, the workflow `Pengklasifikasian Dokumen` route attaches classified workflow documents to an `OPEN` berkas by `Jenis Pembayaran` without new `arsip.arsip` workflow writes. After Phase 13U, `Penambahan Dokumen` manual creates attach new manual document sources to an `OPEN` berkas by `Jenis Pembayaran` without new `arsip.arsip` manual writes or new `manual_arsip.canonical_arsip_id` links. Existing transitional canonical workflow/manual archive data remains compatibility/history only until later folder-first cleanup phases replace it safely.
- After Phase 13K, accepted final direction is folder-first Option A: new runtime archive parent is `berkas_arsip`, item list is `berkas_arsip_item`, workflow source remains `dokumen_transaksi`, manual source remains `manual_arsip` for now, and `arsip.arsip` becomes legacy/transitional compatibility after de-transitionalization.
- After Phase 13N, future folder-first list/detail pages should build on the read-only `berkas_arsip` read model first. They may enrich from workflow/manual source tables but should not use transitional `arsip.arsip` as the primary read authority for new folder-first pages.
- After Phase 13O, the first folder-first active archive pages exist at `/arsiparis/berkas` and `/arsiparis/berkas/$id`. They are read-only surfaces backed by read-only API wrappers and the Phase 13N read model. After Phase 13V, `/arsiparis/berkas` is the primary active archive folder-first surface and `/arsiparis/aktif` became legacy compatibility/redirect only. After Phase 14H, `/arsiparis/aktif` and old individual archive detail at `/arsiparis/arsip/$id` are removed from runtime registration. After Phase 14I, old canonical archive table/snapshot/proposal bridge objects are removed from active Drizzle schema; historical docs/migrations may still mention them.
- After Phase 13P, folder-first detail pages may show preview/download actions for item attachments through authorized folder-aware API routes. These routes use `berkas_arsip` and `berkas_arsip_item` as the folder/item authority, resolve attachments from the attached `WORKFLOW` or `MANUAL` source, and re-check folder `status_arsip` for every request. `DIMUSNAHKAN` folders block every item preview/download with `Data sudah dimusnahkan`.
- After Phase 13P.2, `/arsiparis/berkas` must keep `OPEN` berkas visible before finalization as `Berkas Terbuka` or equivalent, while finalized active berkas remain visible as active archives. Jenis Pembayaran dropdowns for `Pengklasifikasian Dokumen` and `Penambahan Dokumen` must use server-side eligibility so classifications with only `CLOSED` berkas are not selectable for new additions, and direct helper/API calls must not create a second berkas for the same Jenis Pembayaran. Phase 13P.2 does not add lifecycle mutation, file-access changes, destruction behavior, de-transitionalization, schema/migration changes, package/env changes, storage cleanup, or Supabase runtime changes.
- Folder close and final metadata remain separate from initial classification. Initial classification must not collect or require `Nomor SPM` or final retention metadata.
- Future initial workflow classification should not immediately set workflow documents to `ARCHIVED`; it should keep them `COMPLETED` and attach them to an `OPEN` berkas until folder finalization.
- Future close-folder API/UI work must require assigned `KEPALA_SUB_BAGIAN_UMUM` server-side; `ADMIN` must not be treated as the operational archive/folder role.
- Until folder-first lifecycle implementation replaces it, existing transitional archive lifecycle continues on `arsip.arsip`:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Rules:

- `arsip.lampiran_snapshot` stores attachment metadata snapshot.
- After Phase 12L.2, `arsip.arsip` is the transitional canonical archive parent foundation and uses `source_type='WORKFLOW'` for workflow archive rows. After Phase 12L.14, new Manual Archive POST creates also create canonical `source_type='MANUAL'` rows and link them through `manual_arsip.canonical_arsip_id`.
- After Phase 12L.7, new workflow archive writes explicitly populate canonical workflow fields on `arsip.arsip`, including derived `nama_arsip`, `klasifikasi_id`, classification snapshots from `master_klasifikasi_arsip`, `created_by` from `dokumen_transaksi.created_by`, and `archived_by` from the current `KEPALA_SUB_BAGIAN_UMUM` session user.
- `DIMUSNAHKAN` must block preview/download/file access.
- Destructive archive/file behavior must preserve authorization, audit logging, and safe file handling.

### 5A. Manual Archive / Penambahan Dokumen

Manual archive uses separate tables:

- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

Rules:

- Manual archive does not depend on `dokumen_transaksi`.
- Manual archive does not extend workflow-coupled `arsip.arsip` as its primary model.
- Manual archive category is separate from `master_klasifikasi_arsip`.
- Initial canonical categories are `Pemeliharaan`, `Pengadaan`, and `Lain-lain`.
- `keterangan` is required.
- `nominal_realisasi` remains nullable in the database for compatibility; Manual Archive creation through API/UI requires a positive integer value greater than 0.
- File attachment is optional, and one parent row may have many attachment child rows.
- Each manual archive attachment has official title column `judul_lampiran`; Phase 12J.2a backfills existing values from `original_filename`.
- After Phase 12J.2b, the manual archive attachment upload API requires one explicit `judul_lampiran` title per uploaded file and must not fall back from `original_filename`.
- One `manual_arsip` parent row counts as one report regardless of attachment count.
- Lifecycle values are `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`.
- Phase 12G adds schema/data-model foundation only. Do not add runtime UI/API/upload/preview/download/lifecycle/export behavior unless a future phase explicitly scopes it.
- Phase 12H adds minimal runtime API foundation for category list, parent list, create-without-upload, and detail. It does not add UI, upload, preview/download, file tokens, lifecycle transitions, aggregate report, Excel export, hard delete, schema changes, migrations, or seed changes.
- Phase 12K.1 adds direct authorized preview/download API responses for manual archive attachments only. It does not add UI buttons, file tokens, signed URLs, lifecycle transitions, aggregate report, Excel export, attachment delete, schema changes, migrations, upload changes, or public/static serving.
- Phase 12L.1 adds parent metadata edit through `PATCH /api/arsiparis/manual-arsip/$id` only while `status_arsip='AKTIF'`. It does not add UI edit behavior, attachment edit/delete, lifecycle transitions, retention fields, aggregate report, Excel export, schema changes, migrations, preview/download changes, upload changes, or public/static serving.
- Manual Archive create and edit APIs require a positive integer `nominal_realisasi` greater than 0 even though the database column remains nullable for compatibility.
- After Phase 13E, the user-facing manual entry surface is `Penambahan Dokumen`, not `Penambahan Arsip`. It collects initial document metadata (`Nama Dokumen`, category, source/document date, `Jenis Pembayaran`, nominal, required `keterangan`, optional attachments) while keeping internal `manual_arsip`, `klasifikasi_id`, and compatibility route/API paths unchanged.
- Phase 13E keeps transitional internal persistence through `manual_arsip` and linked canonical `source_type='MANUAL'` rows for new creates, but current UI no longer collects final archive metadata. Final archive metadata such as `Nomor SPM`, final retention, and folder closure remain deferred to a future folder/berkas phase.
- Phase 13F adds `berkas_arsip` and `berkas_arsip_item` as an additive schema/data-model foundation only. It does not attach existing Manual Archive rows to folders, change Manual Archive create/edit/upload/preview/download behavior, create close-folder UI/API, or change canonical `source_type='MANUAL'` writes.
- Phase 13G adds server-only helper support for attaching existing Manual Archive source rows to `OPEN` folders and storing `manual_arsip.canonical_arsip_id` as a bridge when present. It does not change Manual Archive create/edit/upload/preview/download behavior, create close-folder UI/API, backfill existing Manual Archive rows, or change canonical `source_type='MANUAL'` writes.
- Phase 13H adds backend-only folder/berkas API route files under `/api/arsiparis/berkas/*`. These routes are operational `KEPALA_SUB_BAGIAN_UMUM` routes protected by local `dms_session`, server-side assigned-role checks, and same-origin validation for unsafe `POST`. `ADMIN` is not accepted as a substitute. The phase does not add browser UI, backfill existing Manual Archive rows, change Manual Archive create/edit/upload/preview/download behavior, create lifecycle mapping, mutate canonical `arsip.arsip` rows, or change storage behavior.
- Phase 13U updates `Penambahan Dokumen` create behavior so each new Manual Archive source row is attached to the matching `OPEN` berkas by `Jenis Pembayaran` without creating a new canonical `source_type='MANUAL'` row and without setting `manual_arsip.canonical_arsip_id`. Existing old linked Manual Archive rows remain compatibility/history only. This does not change Manual Archive edit behavior for old linked rows, attachment upload, preview/download behavior, close-folder UI/API, backfill existing Manual Archive rows, require `Nomor SPM` or retention metadata in manual create, or change storage behavior.
- Phase 12L.2 is schema foundation only: it does not change runtime writes, Manual Archive APIs, workflow archive creation, lifecycle APIs, preview/download, upload behavior, list pages, route generation, data backfill, table deletion, seed data, or storage files.
- Phase 12L.3 adds transitional compatibility/report DTO mapping and report-first backfill planning only. It does not change runtime writes, Manual Archive APIs, workflow archive creation, lifecycle APIs, preview/download, upload behavior, list pages, route generation, data backfill, table deletion, seed data, or storage files.
- Phase 12L.4 adds an internal read-only compatibility report reader only. Phase 12L.5 adds human-reviewed remediation policy only. Neither phase changes runtime writes, adds routes/UI, mutates rows, creates migrations, performs backfill, deletes rows/files, or performs cleanup.
- The canonical archive parent target uses `source_type` values `WORKFLOW` and `MANUAL`; attachment models remain separate temporarily.
- Phase 12L.9 adds nullable Manual Archive source fields for future `nomor_surat`, archive date, retention, classification code snapshot, archive actor, and canonical parent link/idempotency support. It does not update APIs/UI, create canonical `MANUAL` rows, calculate retention, backfill rows, or change lifecycle/file behavior.
- Phase 12L.10 updates Manual Archive create/edit API validation and server-side writes for `nomor_surat`, required `klasifikasi_id`, `tanggal_diarsipkan`, retention labels, server-calculated retention dates, server-derived classification snapshots, and `archived_by` on create. It does not update UI, create canonical `MANUAL` rows, backfill existing rows, execute migrations, or change attachment/lifecycle behavior.
- Phase 12L.11 updates `/arsiparis/penambahan-arsip` create UI to collect and submit the required Phase 12L.10 Manual Archive metadata. It does not add edit UI, create canonical `MANUAL` rows, backfill rows, change APIs, execute migrations, or change attachment/lifecycle behavior.
- Phase 12L.14 aligns Manual Archive POST create writes: new source rows create one canonical `arsip.arsip` row with `source_type='MANUAL'` and update `manual_arsip.canonical_arsip_id` in the same DB transaction. It does not change PATCH/edit sync, attachment upload/preview/download, existing-row backfill, lifecycle APIs, aggregate/export, migrations, schema, or UI.
- Phase 12L.15 aligns Manual Archive PATCH/edit for `AKTIF` rows that already have `canonical_arsip_id`: source metadata and the linked canonical `source_type='MANUAL'` row are updated in one DB transaction. `AKTIF` rows without `canonical_arsip_id` remain transitional legacy source-only edits; PATCH does not create canonical rows, set canonical links, backfill existing rows, or change attachment behavior.
- Phase 12L.16 defines a docs-only, report-first remediation/backfill plan for existing Manual Archive rows without valid canonical `MANUAL` parents. It does not run a live report, mutate rows, create canonical rows, change APIs/UI/schema, touch attachments, execute migrations, or perform cleanup.
- Phase 12L.17 adds an internal read-only Manual Archive remediation report helper with controlled bucket labels, safe DTO output, bounded select-only reader support, and mocked unit tests. It does not run a live DB report, mutate rows, create canonical rows, update source links, add API/UI, change schema, touch attachments, execute migrations, or perform cleanup.
- Phase 12L.18 adds an internal dependency-injected one-row canonicalization helper for explicitly human-approved rows that are still `READY_FOR_CANONICALIZATION` at execution time. It is not wired to routes, UI, CLI, scheduler, report readers, live reports, or automatic backfill, and it must not process linked, broken-link, wrong-source, non-`AKTIF`, metadata-incomplete, or nominal-invalid rows.
- Phase 12L.19 adds an internal dependency-injected dry-run helper for exactly one human-approved Manual Archive row. It requires `approvedByUserId` before DB work, reloads the current row, returns safe preview metadata only for rows that would canonicalize, and must not call the live mutation helper, insert, update, delete, transaction, routes, UI, CLI, scheduler, live reports, or automatic backfill.
- Phase 12M.1 adds an internal read-only unified archive query service for canonical `arsip.arsip` rows only. It does not include unlinked legacy `manual_arsip` rows, add routes/UI, mutate rows, backfill, cleanup, run live reports, or change attachment/file behavior.
- Phase 12M.2 wires existing Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages to the unified canonical archive query service behind server-side `KEPALA_SUB_BAGIAN_UMUM` API authorization. It is read-only/list-only and does not add unified detail pages, lifecycle mutation, preview/download, search, export, cleanup, backfill, migrations, or route generation.
- Phase 12M.3 defines a planning-only unified archive detail policy and recommends future canonical detail route `/arsiparis/arsip/$id`. It does not add routes/UI, route generation, preview/download actions, lifecycle changes, search, export, cleanup, backfill, migrations, schema changes, source-link mutation, or file-access behavior changes.
- Phase 12M.4 adds an internal dependency-injected read-only unified archive detail service for one canonical `arsip.arsip.id`. It does not add routes/UI, route generation, preview/download actions, attachment metadata display, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-link mutation, or file-access behavior changes.
- Phase 12M.5 wires a read-only canonical detail API/page at `/api/arsiparis/arsip/$id` and `/arsiparis/arsip/$id` using the Phase 12M.4 detail service, and adds list `Detail` links from unified archive list rows by canonical `arsip.arsip.id`. It does not add attachment metadata display, preview/download actions, lifecycle mutation, export, cleanup, backfill, migrations, schema changes, or source-link mutation.
- Phase 12M.6 adds source-aware safe attachment metadata display to unified archive detail for `WORKFLOW` snapshot metadata and linked `MANUAL` attachment rows. It is metadata-only/read-only and does not add preview/download actions, file URLs, signed URLs, token generation, filesystem access, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-link mutation, or route generation.
- Phase 12M.6b cleans unified detail UI labels and removes duplicated actor/date metadata from source-specific sections. It is UI-only and does not change API/service behavior, DB queries, preview/download, lifecycle mutation, cleanup, backfill, migrations, schema, source-link mutation, or route generation.
- Phase 12M.6c resolves canonical archive actor ids to display names for unified detail `Dibuat oleh` and `Diarsipkan oleh` fields. It remains read-only and does not add preview/download, lifecycle mutation, cleanup, backfill, migrations, schema changes, source-section actor duplication, or route generation.
- Phase 12M.7 adds source-aware Preview/Download actions from unified archive detail for available `WORKFLOW` and linked `MANUAL` attachments through authorized server routes. It does not expose paths, storage roots, file URLs, signed URLs, token internals, or raw attachment metadata; `DIMUSNAHKAN` hides actions and stale action URLs must fail server-side.
- Phase 12M.8 documents a source-boundary review and human-smoke compatibility checklist for unified detail file access after 12M.7/12M.7b. It is documentation-only, separates expected behavior from actual human-smoke results, and does not change runtime source, schema, migrations, route generation, package files, DB rows, or storage files.
- Phase 12N.1 documents the unified archive lifecycle route inventory and target policy only. It does not implement lifecycle mutation, add routes/UI, change preview/download/file access, mutate rows, delete files, create migrations, run backfill, or alter storage cleanup behavior. During transition, canonical `arsip.arsip.status_arsip` is the unified list/detail lifecycle authority, while linked Manual Archive source status remains an edit/upload/file guard and drift must fail closed before future mutation.
- Phase 12N.2 adds a pure unified archive lifecycle helper/planner and focused unit tests only. It defines allowed transition plans, rejects Manual Archive source/canonical status drift, treats `DIMUSNAHKAN` as terminal, and always plans `fileDeletion: false`; it does not add routes/UI, execute DB writes, create migrations, change file access, delete files, or write audit logs.
- Phase 12N.3 adds `POST /api/arsiparis/arsip/$id/lifecycle` for non-destructive unified lifecycle transitions only: `mark_inactive` and `propose_destruction`. It requires `dms_session`, assigned `KEPALA_SUB_BAGIAN_UMUM`, centralized same-origin validation, server-side row reload, planner validation, and guarded transaction updates. It does not add UI buttons, audit writes, proposal approval, `DIMUSNAHKAN`, file deletion, storage cleanup, migrations, schema changes, or legacy route replacement.
- Phase 12N.4 documents destruction approval policy and the `DIMUSNAHKAN` safety plan only. It does not implement `approve_destruction`, `DIMUSNAHKAN` mutation, proposal bridging, audit writes, UI buttons, file deletion, snapshot clearing, storage cleanup, migrations, schema changes, file-access changes, or legacy proposal route changes. Future canonical-only `approve_destruction` must be accepted as a domain decision because it bypasses legacy proposal governance.
- Phase 12N.5 adds `approve_destruction` to `POST /api/arsiparis/arsip/$id/lifecycle` for canonical-only `USUL_MUSNAH -> DIMUSNAHKAN` after exact confirmation phrase and required reason validation. It updates canonical WORKFLOW status only, syncs linked MANUAL canonical/source statuses in one guarded transaction, and intentionally does not write audit rows, bridge legacy proposals, delete files, clear snapshots, change UI, change file helpers, create migrations, or modify legacy proposal routes.
- Phase 12N.6 adds unified detail page lifecycle buttons for non-destructive actions only: `AKTIF -> INAKTIF` and `INAKTIF -> USUL_MUSNAH`. Manual Kasubag movement is allowed for operational exceptions and does not require waiting for a scheduler. It does not expose `approve_destruction` or a `Musnahkan` UI button, and does not change APIs, list pages, file access, audit, storage, migrations, schema, route generation, or legacy proposal routes.
- Phase 12N.6b refines the 12N.6 UI only: `Aksi Lifecycle` renders below `Lampiran Arsip`, `mark_inactive` success redirects to `/arsiparis/inaktif`, and `propose_destruction` success redirects to `/arsiparis/usul-musnah`. It does not change lifecycle API behavior or expose destructive UI.
- Phase 12N.7 documents the future destructive approval UI policy only. It recommends `Musnahkan Arsip` only for `USUL_MUSNAH` after separate human approval, requires exact phrase `SETUJUI PEMUSNAHAN ARSIP` plus trimmed non-empty reason, recommends staying on detail with refreshed `DIMUSNAHKAN` metadata unless a destroyed list exists, and does not add runtime UI, API, file-access, storage, audit, schema, migration, route generation, or legacy route changes.
- Phase 12N.8 exposes destructive `Musnahkan Arsip` UI on unified detail only for `USUL_MUSNAH`, requires exact phrase `SETUJUI PEMUSNAHAN ARSIP` plus trimmed non-empty reason, sends only `approve_destruction` to the existing unified lifecycle API, stays on detail and refetches metadata after success, and intentionally does not delete files, clear snapshots, delete attachment rows, write audit logs, change legacy proposal routes, modify schema, run migrations, or run route generation.
- Phase 12N.8b hardens lifecycle confirmation copy only for `AKTIF -> INAKTIF`, `INAKTIF -> USUL_MUSNAH`, and `USUL_MUSNAH -> DIMUSNAHKAN`: users are told status cannot be returned through the current feature, `DIMUSNAHKAN` blocks preview/download, metadata remains visible to authorized users, and physical file deletion/storage cleanup is a separate future phase. It does not change lifecycle API behavior, request bodies, redirects, file access helpers, audit, storage files, schema, migrations, package files, route generation, or legacy proposal routes.
- Phase 12N.9 plans archive-native destruction audit only. Future audit should be canonical `arsip.arsip` based, cover `WORKFLOW` and `MANUAL` archives consistently, preserve metadata for future physical file deletion, and exclude paths, storage roots, tokens, raw attachment metadata, raw DB rows, SQL details, env values, sessions/cookies, and secrets. It does not create schema/migrations, write audit rows, change lifecycle API/UI/file access, delete files, clear snapshots, delete attachment rows, or modify legacy proposal routes.
- Phase 12N.10 adds an internal/manual-use source-aware physical file destruction helper for canonical archives that are already `DIMUSNAHKAN`. It supports WORKFLOW `lampiran_snapshot` and linked MANUAL attachment rows, preserves archive metadata rows and attachment metadata, returns safe counts/warnings only, rejects unsafe paths, treats missing files idempotently, and does not add UI/API/scheduler, audit rows, schema/migrations, route generation, broad cleanup, or legacy proposal route changes.
- Phase 12N.11 plans legacy proposal route compatibility cleanup only. Legacy proposal approval remains runtime-unchanged but must not be treated as authoritative unified destruction because it is proposal-id based, WORKFLOW-oriented, clears `lampiran_snapshot`, and directly deletes files outside the 12N.10 source-aware helper policy. It does not modify routes, UI, APIs, schema, migrations, storage files, audit, route generation, or roadmap order.
- Phase 12N.11b removes the obsolete legacy status-specific archive detail and mutation routes that were replaced by unified canonical archive detail and lifecycle. Current list pages remain intact and must link to `/arsiparis/arsip/$id`; lifecycle mutation must go through `POST /api/arsiparis/arsip/$id/lifecycle`. This closes the old proposal-id destructive route surface without deleting DB rows, files, snapshots, schema, migrations, list APIs, or storage metadata.
- Phase 12O adds metadata-only unified archive aggregate and CSV export APIs plus small export links on the active/inactive/proposed-destruction list pages. Export is bounded to the existing unified query max, uses a static filename, applies CSV/formula-injection escaping, and must not expose file contents, URLs, tokens, paths, storage roots, raw attachment metadata, SQL, env values, session/cookie values, or secrets.
- Phase 12P-dev adds an internal local/development-only helper for dry-run-first cleanup of invalid/unlinked Manual Archive source rows, their attachment metadata, and disposable physical files after exact confirmation. It must not delete canonical `arsip.arsip` rows, WORKFLOW data, valid linked Manual Archive rows, files referenced by canonical archive metadata, or any file outside local storage safety checks; it adds no route/UI/scheduler/schema/migration/package change and does not scan the whole storage root.
- Phase 12Q originally added a metadata-only unified archive classification report at `/arsiparis/laporan-klasifikasi` and `GET /api/arsiparis/arsip/classification-report` for `KEPALA_SUB_BAGIAN_UMUM`. Phase 14E removes that active UI/API surface; keep Phase 12Q references as historical context only.
- Phase 12Q.1 originally added a metadata-only classification report detail drilldown at `/arsiparis/laporan-klasifikasi/detail` and `GET /api/arsiparis/arsip/classification-report-detail`. Phase 14E removes that active UI/API surface; keep Phase 12Q.1 references as historical context only.
- Phase 12Z documents unified archive feature closure as a bounded local/internal/LAN development milestone pending/after human smoke. It closes Phase 12 documentation around unified lists/detail, source-aware file actions, lifecycle, aggregate/export, classification reporting/drilldown, cleanup status, safety boundaries, manual retest, and deferred backlog; it does not add runtime behavior, routes, migrations, cleanup, physical deletion wiring, audit schema, package changes, route generation, or production/go-live/security certification.
- Manual Archive parent metadata edit is locked for `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`; locked edits must return a safe conflict response.
- Future file access must go through authorized server/API boundaries and must block `DIMUSNAHKAN`, including stale token/path access.
- Aggregate/export behavior must be metadata-only by default and must not include file contents, file URLs, signed token internals, storage roots, or physical paths.

### 6. Ketua Tim

- Ketua Tim status comes from `ketua_tim_assignments`.
- One kegiatan has only one active ketua tim.
- A user can be ketua tim for many kegiatan.
- Laporan kegiatan permission and badges depend on this assignment.

### 7. Penanggung Jawab Kinerja

- `PENANGGUNG_JAWAB_KINERJA` has one main menu/page: Laporan Kinerja.
- Laporan Kinerja is metadata-only and includes final document statuses `COMPLETED`, `TERSIMPAN`, and `ARCHIVED`.
- Laporan Kinerja excludes `DRAFT`, `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, and `NEED_REVISION`.
- Laporan Kinerja does not provide preview, download, signed URL, file URL, attachment content, export, or detail actions by default.
- Server/API RBAC must require assigned `PENANGGUNG_JAWAB_KINERJA`; `dms_active_role` is not authorization proof.
- `ADMIN` remains dedicated and is not automatically treated as `PENANGGUNG_JAWAB_KINERJA`.

---

## Storage And File Rules

Local filesystem storage is active.

Rules:

- No Supabase Storage fallback.
- No old Supabase data/file migration, copy, download, backfill, sync, or recovery.
- Missing old files must fail cleanly.
- Files live outside public/static serving.
- Preview/download must go through authorized API routes.
- File access must prevent path traversal and root escape.
- File access must not expose physical storage path/root.
- File access token internals must not be printed.
- Referenced active source files must be protected from cleanup using current runtime references: `dokumen_transaksi.lampiran_urls` for `WORKFLOW` source files and `manual_arsip_attachment.logical_path` for `MANUAL` source files.
- Folder-first storage/file-access guards must use `berkas_arsip` plus `berkas_arsip_item` membership and folder `status_arsip` for destroyed-file behavior. Do not use legacy canonical `arsip.arsip`, `arsip.lampiran_snapshot`, or `canonical_arsip_id` as active storage cleanup, diagnostics, or file-access guards.
- `DIMUSNAHKAN` must block stale token/path access.
- Folder-first item file access must revalidate current folder status and item membership before serving files. `DIMUSNAHKAN` folder access must return safe file-specific blocking copy such as `Data file sudah dimusnahkan`; after Phase 13Y.2, the existing `Musnahkan Data` action also performs folder-first physical file deletion after the status becomes `DIMUSNAHKAN`.
- Legacy/document token preview/download paths must also revalidate folder-first `WORKFLOW` membership after authorization. If the requested document belongs to a `CLOSED/DIMUSNAHKAN` folder-first berkas, every authorized preview/download surface must return `Data file sudah dimusnahkan` instead of generic missing-file copy, including after physical deletion has removed the file contents.
- Preview/download UI surfaces must display `Data file sudah dimusnahkan` when backend file access returns the exact destroyed-file response. UI error parsing must be allowlisted and must not display arbitrary backend text, paths, storage roots, tokens, signed-token internals, SQL details, env values, cookies, session values, raw rows, or secrets.
- Folder-first physical deletion uses the server-only helper from Phase 13Y.1. It remains exact-confirmation gated internally, `CLOSED/DIMUSNAHKAN` only, metadata-preserving, idempotent for missing files, local-storage-only, and limited to candidates derived from current folder items plus source tables. It must never use client-supplied paths, broad storage-root scans, public/static targets, Supabase fallback, or user-facing reports containing logical paths, physical paths, storage roots, tokens, signed-token internals, SQL details, env values, cookies, session values, raw rows, or secrets. Phase 13Y.2 wires this helper into the existing `Musnahkan Data` action and does not require or allow a separate general physical deletion UI button/page.
- Folder-first item labels, preview titles, and download filenames must preserve safe source attachment names from `WORKFLOW` `dokumen_transaksi.lampiran_urls` and `MANUAL` attachment metadata where safe. `WORKFLOW` download filenames should follow the existing dokumen persetujuan filename formatting behavior; `MANUAL` download filenames must preserve the existing Manual Archive attachment responder policy. Generic fallback names like `Lampiran 1` or `Lampiran` are allowed only when source metadata is missing or unsafe.
- Folder-first file access and safe DTOs must never expose raw `lampiran_urls`, logical paths, physical paths, storage roots, signed URLs, file tokens, signed-token internals, cookies, session values, SQL details, or secrets.
- Admin diagnostics/cleanup API responses should report safe counts/categories only and must not expose logical paths.

Path semantics:

```text
Pending:
{userId}/{timestamp}-{random}-{filename.ext}

Formal:
{userId}/{dokumenId}/{uuid.ext}
```

Rules:

- File upload may create pending paths.
- Submit/resubmit/update movement must move pending files to formal paths where scoped.
- `arsip.lampiran_snapshot` is legacy canonical history after Phase 14I and is no longer present in active Drizzle schema. It must not be used as the active storage cleanup, diagnostics, or file-access guard after Phase 14I.0.
- Download/preview must re-check current document/archive state.

Helper sentral:

- `src/lib/dokumen-helpers.ts`
- `src/lib/storage-client.ts`
- `src/lib/utils/file.ts`
- `src/lib/file-helpers.ts`
- `src/lib/storage/*`

Manual archive attachments:

- Store logical storage paths in `arsip.manual_arsip_attachment.logical_path`.
- Store official attachment titles in `arsip.manual_arsip_attachment.judul_lampiran`; do not rely on metadata JSON as the only title source.
- Do not store physical storage paths or roots.
- Do not add public/static serving.
- Do not add Supabase Storage fallback or old file/data recovery.
- Future preview/download must re-check authorization and current manual archive lifecycle state.

---

## Canonical File Structure

Struktur aktual repo yang relevan:

```text
AGENTS.md
docs/
  migration/
  specs/
supabase/
  migrations/
  functions/
tests/
  e2e/
  unit/
src/
  router.tsx
  routeTree.gen.ts
  styles.css
  config/
  db/
  hooks/
  components/
  lib/
    auth.ts
    auth-state.ts
    fsm.ts
    constants/
    db/
    dokumen/
    schemas/
    storage/
    types/
    utils/
  routes/
    __root.tsx
    index.tsx
    login.tsx
    forbidden.tsx
    profile.tsx
    dokumen/
    pegawai/
    ppk/
    bendahara/
    arsiparis/
    penanggung-jawab-kinerja/
    admin.tsx
    admin.index.tsx
    admin.master-data.*.tsx
    api/
```

Manual archive schema files:

- `src/db/schema/arsip/manual-arsip.ts`
- `drizzle/0003_manual_archive_schema.sql`
- `drizzle/0005_canonical_archive_schema_foundation.sql`

### Route Notes

- root route remains `src/routes/__root.tsx`.
- `src/routes/dokumen/*` is legacy/compatibility path toward Pegawai flow.
- admin pages use flat file pattern such as `admin.master-data.user.tsx`.
- Do not modify `src/routeTree.gen.ts` unless the phase explicitly allows route generation.

---

## Route And Ownership Map

### Pegawai

UI utama:

- `/`
- `/pegawai/dokumen`
- `/pegawai/dokumen/aju`
- `/pegawai/dokumen/$id`
- `/pegawai/dokumen/$id/edit`
- `/pegawai/dokumen/$id/revisi`
- `/pegawai/laporan/saya`
- `/pegawai/laporan/kegiatan`

API utama:

- `/api/dokumen`
- `/api/dokumen/submit`
- `/api/dokumen/$id`
- `/api/dokumen/$id/submit`
- `/api/upload`
- `/api/laporan/saya`
- `/api/laporan/kegiatan`

### PPK

UI utama:

- `/ppk`
- `/ppk/inbox`
- `/ppk/tervalidasi`
- `/ppk/ditolak`
- `/ppk/revisi`
- `/ppk/dokumen/$id`
- `/ppk/dokumen/$id/resubmit`

API utama:

- `/api/ppk/inbox`
- `/api/ppk/tervalidasi`
- `/api/ppk/ditolak`
- `/api/ppk/revisi`
- `/api/ppk/dokumen/$id`
- `/api/ppk/dokumen/$id/approve`
- `/api/ppk/dokumen/$id/reject`
- `/api/ppk/resubmit/$id`
- `/api/ppk/kembalikan/$id`

### Bendahara

UI utama:

- `/bendahara`
- `/bendahara/inbox`
- `/bendahara/ditolak`
- `/bendahara/selesai`
- `/bendahara/dokumen/$id`

API utama:

- `/api/bendahara/inbox`
- `/api/bendahara/ditolak`
- `/api/bendahara/selesai`
- `/api/bendahara/dokumen/$id`
- `/api/bendahara/dokumen/$id/approve`
- `/api/bendahara/dokumen/$id/reject`

### Kepala Sub Bagian Umum

Route namespace remains `/arsiparis` for compatibility; the internal role name is `KEPALA_SUB_BAGIAN_UMUM`.

UI utama:

- `/arsiparis`
- `/arsiparis/inbox`
- `/arsiparis/dokumen/$id`
- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/klasifikasi`

API utama:

- `/api/arsiparis/inbox`
- `/api/arsiparis/dokumen.$id`
- `/api/arsiparis/dokumen.$id.archive`
- `/api/arsiparis/klasifikasi/*`
- `/api/arsiparis/berkas`
- `/api/arsiparis/berkas/$id`
- `/api/arsiparis/berkas/open`
- `/api/arsiparis/berkas/$id/items`
- `/api/arsiparis/berkas/$id/items/$itemId/preview/$lampiranIndex`
- `/api/arsiparis/berkas/$id/items/$itemId/download/$lampiranIndex`
- `/api/arsiparis/berkas/$id/close`
- `/api/arsiparis/berkas/$id/lifecycle`
- `/api/arsiparis/manual-arsip/categories`
- `/api/arsiparis/manual-arsip`
- `/api/arsiparis/manual-arsip/$id`
- `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview`
- `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download`

### Penanggung Jawab Kinerja

UI utama:

- `/penanggung-jawab-kinerja`
- `/penanggung-jawab-kinerja/laporan-kinerja`

API utama:

- `/api/laporan/kinerja`

Rules:

- `/penanggung-jawab-kinerja/laporan-kinerja` is the default route for `PENANGGUNG_JAWAB_KINERJA`.
- The role has only the Laporan Kinerja navigation item.
- The API returns safe final-document metadata only, with a conservative default limit.
- The API must not expose physical paths, storage roots, signed token internals, file URLs, attachment contents, SQL, or secrets.

### Admin

UI utama:

- `/admin`
- `/admin/master-data/user`
- `/admin/master-data/fungsi`
- `/admin/master-data/kegiatan`
- `/admin/master-data/jenis`
- `/admin/master-data/jenis-dokumen`
- `/admin/master-data/kategori`
- `/admin/master-data/detail`
- `/admin/master-data/kelengkapan`

API utama:

- `/api/users/*`
- `/api/master-fungsi*`
- `/api/master-kegiatan*`
- `/api/master-jenis*`
- `/api/master-jenis-dokumen*`
- `/api/master-kategori*`
- `/api/master-detail*`
- `/api/master-kelengkapan*`
- `/api/ketua-tim/*`
- `/api/admin/analyze-storage`
- `/api/admin/cleanup-orphan-files`

---

## Central Modules

Kalau menyentuh domain inti, baca file-file ini dulu:

- `src/components/layout/AppLayout.tsx`
- `src/config/navigation.ts`
- `src/lib/auth.ts`
- `src/lib/auth-state.ts`
- `src/lib/fsm.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/master-data.ts`
- `src/lib/user-helpers.ts`
- `src/lib/security/same-origin.ts`
- `src/lib/storage/*`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/routes/api/files/access.ts`
- `src/routes/api/admin/cleanup-orphan-files.ts`

---

## Protected Files And Commands

Hard rules:

- Do not modify `.env` or `.env.migration`.
- Do not print secrets/env values, DB URLs, storage roots, password hashes, plaintext passwords, session tokens, cookie values, CSRF tokens, file tokens, signed file tokens, or physical paths.
- Do not modify `src/routeTree.gen.ts` unless the phase explicitly allows route generation.
- Do not modify `package.json` or `pnpm-lock.yaml` unless the phase explicitly allows package changes.
- Do not modify DB/drizzle/supabase folders unless the phase explicitly allows it.
- Do not run broad tests/build/E2E/DB scripts/route generation unless requested by the phase or human.
- Do not run firewall/network commands.
- Do not run backup/restore commands unless explicitly requested and scoped.
- Do not run destructive storage cleanup unless explicitly requested and scoped.
- Prefer lightweight audits and targeted tests.
- Use `pnpm` only.
- In PowerShell examples, quote paths containing `$`, for example `'src/routes/api/dokumen/$id/submit.ts'`.

Before documentation/governance edits that must stay isolated, run:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

If unrelated changes exist, stop and report that they must be committed, stashed, reverted, or explicitly approved before continuing.

---

## Commit And Review Policy

Rules:

- Do not commit unless the human explicitly asks.
- Do not approve a commit from Codex summary alone.
- Avoid `git add -A` unless all changes are confirmed in scope.
- If changes are too broad or out of scope, suggest stash/revert rather than mixing scopes.
- Never revert user changes unless explicitly requested.

Minimum review checks before asking for commit approval:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

Also check:

- protected file diffs
- relevant targeted diffs/tests
- package diff if package files changed
- route generation diff if routes changed
- docs and constitution alignment if behavior changed

Protected diff checks for migration/governance phases:

```bash
git diff -- .env .env.migration
git diff -- src
git diff -- tests
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

---

## Testing Expectations

Default:

- Prefer smallest relevant tests first.
- For workflow/auth/storage changes, run targeted unit/API checks where available.
- Do not run broad tests/build/E2E unless the phase or human requests it.
- If tests are not run, state that explicitly.

Relevant checks by area:

- FSM/workflow: `tests/fsm.test.ts`
- submit flow: `tests/e2e/submit-flow.spec.ts` when explicitly requested
- approval flow: `tests/e2e/approval-flow.spec.ts` when explicitly requested
- user management: `tests/e2e/spec-06-user-management.spec.ts` when explicitly requested
- storage/file helpers: targeted unit tests under `tests/unit/storage/`

---

## Wording Policy

Forbidden unless explicitly proven and human-approved:

- `production ready`
- `go-live approved`
- `go live approved`
- `fully secure`
- `Supabase fully removed from repository`
- `fully removed from repository`
- `LAN ready` as an absolute phrase

Preferred wording:

- `partial/bounded release handoff`
- `human-controlled internal handoff`
- `active Supabase runtime/package dependency retired`
- `historical Supabase artifacts remain`
- `implemented pending human retest`
- `implemented and human-smoked`
- `trusted HTTP LAN is bounded/internal only`
- `HTTPS plus Secure dms_session remains preferred final posture`

When describing 11H.3:

- Say what is allowed: bounded human-controlled internal/local/LAN handoff.
- Say what is not approved: public production, public internet exposure, go-live, operational certification, security certification, full Supabase repository removal.

---

## Practical Rules For Future Changes

1. If adding/changing DB schema:
   - Update Drizzle schema/migrations first.
   - Update docs and this file if behavior/governance changes.
   - Update Zod schema/helper/API logic.
   - Keep historical Supabase migrations as reference only unless a phase explicitly says otherwise.

2. If adding/changing status:
   - Update `src/lib/constants/document-status.ts`.
   - Update `src/lib/fsm.ts`.
   - Update FSM tests.
   - Update badges/filters/pages that depend on status.
   - Update this file.

3. If changing routes:
   - Update `src/lib/constants/routes.ts`.
   - Update `src/config/navigation.ts`.
   - Update legacy redirect/compatibility if needed.
   - Regenerate `src/routeTree.gen.ts` only when phase explicitly allows route generation.
   - Update this file.

4. If changing archive lifecycle:
   - Check active archive endpoints.
   - Check file-access behavior after `DIMUSNAHKAN`.
   - Check folder-first `berkas_arsip` lifecycle and current source file guards.
   - Update docs and this file.

5. If changing auth/role resolution:
   - Check `AppLayout`.
   - Check `auth.ts`.
   - Check local session helpers.
   - Check server API role checks.
   - Preserve `dms_session` as auth boundary and `dms_active_role` as UX-only.

6. If changing storage/file access:
   - Preserve no static public storage serving.
   - Preserve no Supabase Storage fallback.
   - Revalidate authorization and current archive state.
   - Block `DIMUSNAHKAN`.
   - Avoid physical path/root/token leakage.

---

## Next Workstreams

Allowed future directions, each as separate scoped work:

- New product feature development after the post-migration handoff boundary is respected.
- Maintenance hardening:
  - HTTPS plus `Secure` cookie final posture
  - reverse proxy
  - persistent/distributed rate-limit
  - login audit/alerting
  - full CSRF token framework if deployment expands
  - broader throttling for upload/workflow/archive/admin/file-token routes
  - E2E and regression automation
- Historical Supabase cleanup:
  - `.env.example` Supabase key names
  - stale tests
  - old comments/type residue
  - docs wording
  - `supabase/` retention/removal policy
- Operations:
  - backup schedule and retention
  - periodic restore rehearsal
  - final HTTPS/certificate/reverse-proxy decision
  - archive scheduler replacement

Do not mix these workstreams unless the human explicitly approves a combined phase.

---

## Status

- Last updated: 2026-05-31
- App mode: Active development after local migration
- Architecture mode: TanStack Start SPA-heavy app with local PostgreSQL, Drizzle, local `dms_session` auth, and local filesystem storage
- Handoff mode: partial/bounded release handoff for human-controlled internal/local/LAN use
- Supabase mode: active runtime/package dependency retired; historical artifacts remain
- Constitution accuracy target: synced to post-11H.3 migration state and implemented features

---

## graphify

This project may have a Graphify knowledge graph at `graphify-out/`.

Rules:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture/codebase exploration.
- If `graphify-out/wiki/index.md` exists, use it as the first navigation map before reading many raw source files.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` when `graphify-out/graph.json` exists.
- If Graphify output does not exist or is stale, fall back to targeted `git grep`, direct file reads, and the project roadmap/constitution.
- Do not treat Graphify as the sole authority for security-sensitive work. Verify auth, RBAC, storage, workflow, and file-access behavior directly in source files before making changes.
- After modifying code files in a Graphify-enabled session, run `graphify update .` when practical to keep the graph current. Documentation-only changes do not require Graphify update unless the human requests it.
