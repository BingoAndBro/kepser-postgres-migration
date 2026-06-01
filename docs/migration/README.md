# Migration Documentation Index

Last updated: 2026-06-01

This index is the first navigation document for migration history. Use it to separate current authority from older phase records before starting new implementation work.

## Current Active Authority

Read these first for current project truth:

- `AGENTS.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-14j2-local-seed-hash-handling-hardening.md`
- `docs/migration/phase-14j-dev-db-migration-validation.md`
- `docs/migration/phase-14i-drop-legacy-canonical-archive-schema.md`
- `docs/migration/phase-14i0-folder-first-storage-guards.md`
- `docs/migration/phase-14h-remove-legacy-canonical-runtime.md`
- `docs/migration/phase-13k-folder-first-finalization-policy-and-detransitionalization-plan.md`
- `docs/migration/phase-13y2-musnahkan-data-physical-deletion-integration.md`

For future frontend redesign starting context, read:

- `docs/migration/phase-15-frontend-redesign-starting-context.md`

## Active Runtime Summary

Folder-first archive runtime is active. The current archive browser surfaces are:

- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`

Active archive API authority is:

- `/api/arsiparis/berkas/**`
- `/api/arsiparis/dokumen/$id.archive`
- `/api/arsiparis/dokumen/$id`, with folder-first evidence for classification/detail state

Active archive DB authority is:

- `arsip.berkas_arsip`
- `arsip.berkas_arsip_item`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`
- `dokumen.dokumen_transaksi`

Security and domain boundaries remain:

- `dms_session` is the auth boundary.
- `dms_active_role` is UX-only state.
- Server/API RBAC is authoritative.
- `ADMIN` is not a substitute for operational roles.
- Active runtime/package Supabase dependency is retired.
- Historical Supabase artifacts remain.

## Removed Or Deprecated Surfaces

These surfaces are not active runtime authority and must not be resurrected by frontend redesign unless a later explicit human-approved phase scopes that work:

- `/arsiparis/aktif` removed
- `/arsiparis/search` removed
- `/arsiparis/arsip/$id` removed
- `/api/arsiparis/aktif` removed
- `/api/arsiparis/inaktif` removed
- `/api/arsiparis/usul-musnah` removed
- `/api/arsiparis/search` removed
- legacy `/api/arsiparis/arsip/*` removed
- `Laporan Klasifikasi` removed
- global/sidebar `Cari Arsip` removed
- legacy `arsip.arsip` schema removed
- `lampiran_snapshot` removed from active Drizzle schema
- `canonical_arsip_id` bridge removed from active Drizzle schema

Local, page-scoped archive search/filter controls remain active on folder-first pages. Header search is separate UI and is not archive authority.

## Historical Docs Policy

Older phase docs are retained for audit and traceability only. They may mention Supabase, `arsip.arsip`, `lampiran_snapshot`, `canonical_arsip_id`, legacy archive routes, `Laporan Klasifikasi`, or old lifecycle designs.

Do not treat older docs as current implementation authority unless their claims are cross-checked against `AGENTS.md`, this index, and the Phase 14K handoff.

Do not rewrite old phase docs to pretend they were current all along. If a historical doc is dangerous for future work, add a short historical note instead of changing its original decision record.

## Frontend Redesign Preparation

Future frontend redesign should start from current active surfaces:

- Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, Penanggung Jawab Kinerja, and Admin role pages as documented in `AGENTS.md`.
- Folder-first archive pages: `/arsiparis/berkas`, `/arsiparis/berkas/$id`, `/arsiparis/inaktif`, and `/arsiparis/usul-musnah`.
- Local page filters and safe metadata-only CSV exports where already implemented.

Do not restore removed pages, reports, search routes, legacy canonical archive detail, or legacy canonical APIs as part of visual redesign.

Preserve:

- folder-first archive model;
- `dms_session` auth boundary;
- server/API RBAC;
- no Supabase runtime fallback;
- no production, go-live, operational certification, security certification, or full Supabase repository removal claims.
