# Phase 14B - Remove Global Archive Search Surface

Date: 2026-05-31

Status: implemented with targeted unit test validation.

## Decision

The global sidebar/menu entry for `Cari Arsip` is removed. The product decision is not to build a replacement global archive search in this phase.

Archive lookup is now local to each archive surface/table:

- `/arsiparis/berkas`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/berkas/$id` if needed

Non-`KEPALA_SUB_BAGIAN_UMUM` roles should not receive a broad archive search menu. The top header search is intentionally unchanged and is not archive authority.

## Runtime Outcome

`/arsiparis/search` is retained only as a compatibility browser route and redirects to `/arsiparis/berkas`. It no longer renders the old canonical/workflow-oriented search page and no active sidebar or dashboard entry should point to it.

`GET /api/arsiparis/search` remains in place as a deprecated compatibility-only canonical search API. No active UI navigation should call it after this phase. It is not folder-first runtime authority.

## Boundaries

This phase does not:

- implement folder-first global search;
- change local page search/filter behavior;
- change the top header search;
- change archive lifecycle behavior;
- change physical deletion behavior;
- change file access behavior;
- change report/export behavior;
- mutate or delete database rows;
- delete physical files;
- change schema or migrations;
- change package or env files;
- modify historical Supabase artifacts.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.
