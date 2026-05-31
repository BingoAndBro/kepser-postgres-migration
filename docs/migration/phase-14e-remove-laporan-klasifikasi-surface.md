# Phase 14E - Remove Laporan Klasifikasi Surface

Date: 2026-05-31

Status: implemented with targeted unit test validation pending/recorded in the phase result.

## Decision

The product decision after Phase 14D is that `Laporan Klasifikasi` is not needed as an active archive feature.

This is still active development, old data is not important, and obsolete UI/API/code that is not used by the folder-first runtime should be removed instead of kept as permanent compatibility.

## Removed Surface

Phase 14E removes:

- `/arsiparis/laporan-klasifikasi`;
- `/arsiparis/laporan-klasifikasi/detail`;
- `GET /api/arsiparis/arsip/classification-report`;
- `GET /api/arsiparis/arsip/classification-report-detail`;
- the folder-first classification-report helper that existed only for those APIs;
- the older canonical classification-report helpers and tests that existed only for the removed report API surface;
- the `Laporan Klasifikasi Arsip` navigation item.

Do not reintroduce this surface unless a later explicit human-approved phase restores the feature.

## Preserved Reporting And Export

Folder-first CSV exports remain the current reporting/export mechanism:

- `/arsiparis/berkas` keeps `Export CSV`;
- `/arsiparis/berkas/$id` keeps `Export Daftar Dokumen CSV`.

Local page filters from Phase 14C remain client-side and page-local. The header search remains separate and unchanged. Sidebar/global `Cari Arsip` remains absent.

## Boundaries

This phase does not:

- delete `arsip.arsip` or any other database table;
- delete database rows or old data;
- add schema or Drizzle migration changes;
- change lifecycle behavior;
- change `Musnahkan Data` or physical deletion behavior;
- change preview/download/file access behavior;
- change folder-first berkas pages beyond preserving their CSV/filter behavior;
- change package files, env files, storage code, or Supabase historical artifacts.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Route Tree

`src/routeTree.gen.ts` was regenerated only because route files were deleted.

The expected route-tree effect is deregistration of:

- `/arsiparis/laporan-klasifikasi`;
- `/arsiparis/laporan-klasifikasi/detail`;
- `/api/arsiparis/arsip/classification-report`;
- `/api/arsiparis/arsip/classification-report-detail`.

## Next Phase

The next cleanup phase should audit and remove broader legacy canonical archive code/API/schema where safe, including old `arsip.arsip`-based helpers or endpoints that no active folder-first runtime surface uses.
