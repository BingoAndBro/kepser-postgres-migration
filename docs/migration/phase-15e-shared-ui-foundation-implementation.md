# Phase 15E - Shared UI Foundation Implementation

Date: 2026-06-01

Status: implemented as a bounded shared UI foundation. No shell redesign, route/page integration, route generation, package change, schema change, API change, auth/session/RBAC change, storage/file-access change, archive lifecycle change, prototype import, commit, or push is included.

## Authority Read

Current authority used:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-15abc-frontend-audit-prototype-policy-and-mapping.md`
- `docs/migration/phase-15d-shared-ui-foundation-plan.md`

`docs/migration/_archive/` remains historical/superseded and was not used as current implementation authority.

## Components Added Or Changed

Shared UI components added under `src/components/ui/`:

- `EmptyState.tsx`: pure presentational empty/no-results state with title, description, optional icon, optional action, and compact mode.
- `LoadingState.tsx`: pure presentational loading wrapper using existing `Skeleton`, with `page`, `card`, and `list` variants that render placeholders only.
- `ErrorState.tsx`: pure presentational safe error panel with title, caller-owned safe description, optional action, and variants.
- `RoleBadge.tsx`: pure display badge for canonical role labels. `BENDAHARA` displays as `PPSPM`; `ADMIN` displays as `Admin Sistem` without implying operational substitution.
- `AppDialog.tsx`: small wrapper around existing Base UI-backed dialog primitives with title, optional description, size, trigger, content, and footer slots.
- `ConfirmDialog.tsx`: wrapper built on `AppDialog` with `default`, `warning`, and `destructive` variants, pending/disabled states, and optional exact typed confirmation support.
- `AppToast.tsx`: local React context/provider and viewport for caller-owned `success`, `error`, `info`, and `warning` messages. It is not wired globally in this phase.

Shared UI component changed:

- `StatusBadge.tsx`: replaced stale document-only badge that used `IN_REVIEW` and English labels with canonical DMS document, folder, archive lifecycle, and source-type mappings.

Focused test added:

- `tests/unit/components/ui-foundation.test.ts`: verifies canonical status and role badge mapping plus safe unknown fallbacks.

## Canonical Mapping Summary

Document statuses:

- `DRAFT` -> `Draft`
- `IN_PPK_VALIDATION` -> `Menunggu PPK`
- `IN_BENDAHARA_APPROVAL` -> `Menunggu PPSPM`
- `NEED_REVISION` -> `Perlu Revisi`
- `COMPLETED` -> `Selesai`
- `TERSIMPAN` -> `Tersimpan`
- `ARCHIVED` -> `Diarsipkan`

Folder statuses:

- `OPEN` -> `Berkas Terbuka`
- `CLOSED` -> `Berkas Ditutup`

Archive lifecycle:

- `AKTIF` -> `Aktif`
- `INAKTIF` -> `Inaktif`
- `USUL_MUSNAH` -> `Usul Musnah`
- `DIMUSNAHKAN` -> `Dimusnahkan`

Source types:

- `WORKFLOW` -> `Pengklasifikasian Dokumen`
- `MANUAL` -> `Penambahan Dokumen`

Roles:

- `PEGAWAI` -> `Pegawai`
- `PPK` -> `PPK`
- `BENDAHARA` -> `PPSPM`
- `KEPALA_SUB_BAGIAN_UMUM` -> `Kepala Sub Bagian Umum`
- `PENANGGUNG_JAWAB_KINERJA` -> `Penanggung Jawab Kinerja`
- `ADMIN` -> `Admin Sistem`

Unknown status and role values render safe generic fallback text and do not crash.

## Dialog And Confirmation Contract

`AppDialog` preserves the existing dialog primitive behavior and keeps API/data ownership outside the component.

`ConfirmDialog`:

- does not call APIs internally;
- calls only the caller-provided `onConfirm`;
- supports `default`, `warning`, and `destructive` variants;
- supports pending and disabled states;
- supports typed confirmation, including the archive destruction phrase `MUSNAHKAN DATA FILE`;
- does not replace existing page-local dialogs or `window.confirm` usages yet.

## Toast Decision

`AppToast` was implemented without package changes using local React state/context.

It remains unwired globally. Future phases can add `AppToastProvider` at an appropriate shell/layout boundary after deciding where outcome messages should be surfaced. Callers must pass sanitized messages only and must not pass raw backend errors, paths, tokens, SQL details, env/session/cookie values, raw rows, stack traces, or secrets.

## Boundaries Preserved

Unchanged:

- `dms_session` auth boundary.
- `dms_active_role` UX-only state.
- Server/API RBAC authority.
- `ADMIN` as a dedicated role, not an operational-role substitute.
- Folder-first archive authority: `berkas_arsip`, `berkas_arsip_item`, `dokumen_transaksi`, `manual_arsip`, and `manual_arsip_attachment`.
- Destroyed-file UX phrase where applicable: `Data file sudah dimusnahkan`.
- Destructive typed confirmation phrase where applicable: `MUSNAHKAN DATA FILE`.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

Not restored:

- `/arsiparis/aktif`
- `/arsiparis/search`
- `/arsiparis/arsip/$id`
- `/api/arsiparis/arsip/*`
- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`
- `/api/arsiparis/search`
- `Laporan Klasifikasi`
- global/sidebar `Cari Arsip`
- legacy canonical archive model: `arsip.arsip`, `lampiran_snapshot`, `canonical_arsip_id`

## Future Use

Recommended Phase 15F scope:

- Wire `AppToastProvider` only if shell integration is explicitly scoped and safe.
- Begin shell/theme design-token integration without changing auth/session/role-switch behavior.
- Use `EmptyState`, `LoadingState`, `ErrorState`, `StatusBadge`, `RoleBadge`, `AppDialog`, and `ConfirmDialog` as shared primitives during later route-slice redesigns.
- Keep route-local data fetching, API mutation, authorization, file access, CSV construction, and lifecycle behavior in the existing route/domain layers.

## Validation

Validation planned/performed for this phase:

- `git diff --check`
- focused Vitest mapping test for shared UI labels/fallbacks
- protected-file review before final handoff

No broad route generation, E2E, DB migration, DB seed, package install, or dev server command is part of this phase.

## Final Guardrails

- Prototype code was not copied or imported.
- No package/env/schema/migration/routeTree changes are intended.
- No route files are intended to be modified.
- No auth/session/RBAC/storage/file-access/archive lifecycle logic is intended to be modified.
- No commit or push is included.
