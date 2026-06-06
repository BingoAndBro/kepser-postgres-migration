# Phase 15L.4 - Kasubag Archive Visual Polish Follow-up

Date: 2026-06-06

## Scope

- Presentation-only follow-up for Kepala Sub Bagian Umum archive pages.
- Aligns Pengklasifikasian Dokumen table behavior with the approved Dokumen Diajukan table baseline.
- Aligns Pengklasifikasian detail composition with the approved PPK/PPSPM validation detail baseline.
- Aligns Penambahan Dokumen create form presentation with the approved Ajukan Dokumen form baseline.

## Changes

- Pengklasifikasian Dokumen rows are clickable, keyboard-openable, and use the same hover/pointer affordance as workflow document tables.
- Nominal Realisasi display is simplified to orange text instead of a pill/badge treatment.
- Nominal Realisasi is centered in the Pengklasifikasian Dokumen table.
- Tanggal Selesai uses the same clock icon date cell pattern as workflow list pages.
- The Pengklasifikasian Dokumen search card keeps search, source filter, and sort controls; only the old Fungsi filter is not shown.
- Pengklasifikasian detail now uses compact header, tab strip, orange section header, main content shell, and right-side action panel composition.
- The Pengklasifikasian detail right-side action panel now follows the Formulir Pengindeksan / Klasifikasi Arsip mockup, including wider layout, numbered fields, textarea spacing, primary classify action, and Batal & Kembali action.
- Penambahan Dokumen now opens directly into the create wizard instead of showing the previous list-and-modal page.
- Penambahan Dokumen uses a four-stage Ajukan-style wizard: Informasi Dokumen, Jenis Pembayaran, Lampiran, and Review.
- Penambahan Dokumen only creates the manual record from the Review step; submit events on steps 1-3 advance the wizard instead of persisting data.
- The Lampiran step now follows the Dokumen Pendukung visual pattern from Ajukan Dokumen.
- The Lampiran step creates a supporting-document row from a saved title first, then exposes the upload action on that row.
- Penambahan Dokumen now uses the same DatePicker and local Select visual primitives as Ajukan Dokumen, and the extra lampiran limit info card was removed.
- Penambahan Dokumen no longer relies on native form submit for persistence; only the explicit Review-step action can create the manual document.
- The right-side notice panel was renamed to Perhatian, made more compact, and paired with a Kembali action.
- Penambahan Dokumen keeps the page/header spacing aligned with Ajukan Dokumen while compacting the form card and field heights.

## Boundaries

- No archive lifecycle behavior changes.
- No auth/session/RBAC changes.
- No storage/file-access or signed-token changes.
- No schema, migration, package, environment, or route tree changes.
- No prototype source copying.
- No legacy archive/search/report surface restoration.

## Verification

- Ran `pnpm exec tsc --noEmit --pretty false`.
- Full TypeScript check still fails on known repo-wide unrelated issues.
- A targeted filter found no TypeScript errors mentioning:
  - `src/routes/arsiparis/inbox.tsx`
  - `src/routes/arsiparis/dokumen/$id/index.tsx`
  - `src/routes/arsiparis/penambahan-arsip.tsx`
