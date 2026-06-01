# Phase 14K - Final Folder-First Archive Regression and Handoff

Date: 2026-06-01

Status: completed for targeted local/development regression and handoff documentation.

## Scope

Phase 14K performed the final technical regression audit and handoff after Phase 14 folder-first archive cleanup.

This phase did not add features, schema changes, migrations, package changes, env changes, route changes, storage changes, Supabase changes, physical file deletion, DB reset, seed execution, broad build, or E2E automation.

## Starting State

Initial working tree check:

```text
git status --short --branch
```

Result:

```text
## migration/postgres-local...origin/migration/postgres-local [ahead 7]
```

No modified or untracked files were present. Git emitted only a user-level ignore-file permission warning.

## Final Active Runtime Summary

Folder-first archive runtime authority remains:

- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`;
- `dokumen.dokumen_transaksi` for `WORKFLOW` source metadata;
- `arsip.manual_arsip` and `arsip.manual_arsip_attachment` for `MANUAL` source metadata;
- `arsip.manual_arsip_category`;
- `arsip.master_klasifikasi_arsip`.

Active archive browser surfaces are:

- `/arsiparis/berkas`;
- `/arsiparis/berkas/$id`;
- `/arsiparis/inaktif`;
- `/arsiparis/usul-musnah`.

Active folder-first APIs are:

- `/api/arsiparis/berkas`;
- `/api/arsiparis/berkas/$id`;
- `/api/arsiparis/berkas/$id/items`;
- `/api/arsiparis/berkas/$id/close`;
- `/api/arsiparis/berkas/$id/lifecycle`;
- `/api/arsiparis/berkas/$id/items/$itemId/preview/$lampiranIndex`;
- `/api/arsiparis/berkas/$id/items/$itemId/download/$lampiranIndex`;
- `/api/arsiparis/dokumen/$id.archive`;
- `/api/arsiparis/dokumen/$id`, with folder-first berkas evidence for classification state.

Folder lifecycle remains:

```text
OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN
```

`Musnahkan Data` remains the destructive lifecycle action that moves a folder-first berkas to `DIMUSNAHKAN`, invokes folder-first physical file deletion, preserves metadata, and keeps preview/download blocked. Destroyed-file UX copy remains:

```text
Data file sudah dimusnahkan
```

Local filters and safe CSV exports remain active on:

- `/arsiparis/berkas`;
- `/arsiparis/berkas/$id`;
- `/arsiparis/inaktif`;
- `/arsiparis/usul-musnah`.

## Removed Legacy Surfaces

Final audit confirmed removed legacy runtime surfaces remain absent from active route/API registration. Matching strings in `src` and `tests` are limited to absence assertions unless noted below.

Removed browser surfaces:

- `/arsiparis/aktif`;
- `/arsiparis/search`;
- `/arsiparis/arsip/$id`.

Removed API surfaces:

- `/api/arsiparis/aktif`;
- `/api/arsiparis/inaktif`;
- `/api/arsiparis/usul-musnah`;
- `/api/arsiparis/search`;
- `/api/arsiparis/arsip/$id`;
- `/api/arsiparis/arsip/$id/lifecycle`;
- `/api/arsiparis/arsip/aggregate`;
- `/api/arsiparis/arsip/export`;
- classification-report APIs.

Removed product surfaces:

- global/sidebar `Cari Arsip`;
- `Laporan Klasifikasi`.

Removed helper/runtime dependencies:

- `unified-archive-*`;
- legacy canonical archive file-access, lifecycle, aggregate/export, and physical-destruction helpers.

`canonical_arsip_id` and `canonicalArsipId` remain only as forbidden manual metadata keys and in the related unit test.

## Schema Audit

Active Drizzle schema contains:

- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`;
- `arsip.manual_arsip`;
- `arsip.manual_arsip_attachment`;
- `arsip.manual_arsip_category`;
- `arsip.master_klasifikasi_arsip`.

Active Drizzle schema does not contain:

- `arsip.arsip`;
- `arsip.lampiran_snapshot`;
- `arsip.arsip_usul_musnah`;
- `manual_arsip.canonical_arsip_id`;
- `berkas_arsip_item.canonical_arsip_id`.

Phase 14J already validated the migration chain through `0009_drop_legacy_canonical_archive_schema` on a disposable local development PostgreSQL database. That validation confirmed folder-first/source tables were present, legacy canonical archive objects were absent, and no production or live database approval was implied.

## Seed Hardening Audit

Phase 14J.2 seed hardening remains in place:

- `db:local:seed` uses `dotenv --no-expand`;
- a present `DMS_DEV_SEED_PASSWORD_HASH` must start with the Argon2id PHC prefix;
- missing hash still skips development-user seeding;
- invalid or empty hash values fail safely before inserts;
- validation errors do not echo the provided value.

The Phase 14K targeted seed test passed and did not require running `pnpm db:local:seed`.

## Tests

Command run:

```text
pnpm test tests/unit/auth/roles-navigation.test.ts tests/unit/dokumen/ppk-detail-and-log-route.test.ts tests/unit/arsiparis/workflow-archive-route.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-schema.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-csv.test.ts tests/unit/arsiparis/manual-arsip-route.test.ts tests/unit/storage/internal-file-access.test.ts tests/unit/storage/local-storage-diagnostics.test.ts tests/unit/storage/admin-cleanup-orphan-files-route.test.ts tests/unit/storage/admin-analyze-storage-route.test.ts tests/unit/db/seed-users.test.ts tests/unit/components/attachment-viewer-source.test.ts tests/unit/storage/storage-client.test.ts
```

Result:

- 17 test files passed.
- 255 tests passed.

No broad build or E2E automation was run because targeted regression passed and no runtime code changes were made.

## Human Smoke Status

The user reported a human-smoked browser flow after the Phase 14J.2 seed fix:

- login works after local seed hardening;
- Pegawai submit -> PPK validation -> PPSPM approval works;
- `Pengklasifikasian Dokumen` detail works after Phase 14J.1;
- core features appeared safe in browser.

This is human-smoked local/development evidence, not automated E2E coverage.

## Boundaries

Unchanged:

- `dms_session` remains the auth boundary;
- `dms_active_role` remains UX-only;
- server/API RBAC remains authoritative;
- `KEPALA_SUB_BAGIAN_UMUM` remains the archive/folder operation owner;
- `ADMIN` is not a substitute for operational archive roles;
- active runtime/package Supabase dependency remains retired;
- historical Supabase artifacts remain;
- file-access and storage responses must not leak raw paths, roots, tokens, env values, SQL details, sessions, cookies, secrets, raw rows, or file content.

## Remaining Limitations

- Browser smoke was manual, not E2E automation.
- Public production, go-live, operational certification, security certification, and compliance validation are not approved by this phase.
- HTTPS plus `Secure` `dms_session`, backup/restore rehearsal, persistent/distributed rate limiting, reverse-proxy posture, broader throttling, and final operational hardening remain separate work.
- Historical docs may still mention older phases or removed legacy canonical surfaces until a later cleanup phase.

## Final Classification

```text
Folder-first archive cleanup implemented and targeted-tested for local/development handoff; core flow human-smoked by user; not production/go-live/security certification.
```

## Next Phase

Recommended next scoped phase:

```text
Phase 14L - Historical docs/residue cleanup
```
