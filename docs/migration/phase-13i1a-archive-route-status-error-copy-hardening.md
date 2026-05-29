# Phase 13I.1a - Archive Route Status Error Copy Hardening

Date: 2026-05-29

Status: implemented and targeted verification passed.

## Scope

Phase 13I.1a hardens the error copy for the workflow `Pengklasifikasian Dokumen` archive route:

```text
POST /api/arsiparis/dokumen/$id/archive
```

This is a UX/API response-copy change only. The endpoint still allows classification/archive writes only when the current document status is `COMPLETED`.

## Behavior

When the selected workflow document is already `ARCHIVED`, the route now returns:

```text
400
Dokumen sudah diarsipkan
```

When the selected workflow document is not `COMPLETED` and not `ARCHIVED`, the route keeps the safe not-final response:

```text
400
Dokumen belum berada di tahap final
```

When the selected workflow document is `COMPLETED`, the existing archive/classification behavior remains unchanged.

## Unchanged Boundaries

This phase does not:

- change FSM transitions;
- allow `ARCHIVED` documents to be re-archived;
- make `ARCHIVED` valid for this endpoint;
- change status requirements;
- change auth, session, same-origin, or RBAC behavior;
- change `KEPALA_SUB_BAGIAN_UMUM` ownership;
- treat `ADMIN` as a substitute operational role;
- change canonical workflow archive creation;
- change `berkas_arsip` get/create behavior;
- change `berkas_arsip_item` insertion behavior;
- change `log_aktivitas` writes;
- add UI, schema, migrations, route generation, package changes, env changes, storage behavior, cleanup, seeds, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Validation

Targeted validation:

```bash
pnpm test tests/unit/arsiparis/workflow-archive-route.test.ts
```

Result:

```text
1 test file passed.
11 tests passed.
```

Protected validation:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase src/routeTree.gen.ts
```
