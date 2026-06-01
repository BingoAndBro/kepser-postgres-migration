# Phase 13Q.1 - Runtime Smoke Report For Folder Lifecycle Transitions

Date: 2026-05-30

Status: targeted static smoke completed; runtime HTTP probe blocked because no already-running app server was reachable; authenticated UI smoke remains human-run pending or externally performed.

## Scope

Phase 13Q.1 is a bounded smoke verification pass for folder-level lifecycle transitions at `arsip.berkas_arsip.status_arsip`.

Covered transition policy:

```text
AKTIF -> INAKTIF
INAKTIF -> USUL_MUSNAH
USUL_MUSNAH -> DIMUSNAHKAN
```

Expected rejected cases:

- `OPEN/null`;
- `CLOSED/null` transitional rows;
- invalid direct jumps;
- terminal `DIMUSNAHKAN`;
- missing berkas.

`DIMUSNAHKAN` remains status-only in this phase. Physical files are not deleted. Preview/download blocking remains handled by Phase 13P folder-aware file-access revalidation.

## RouteTree Preflight

Preflight command:

```bash
git status --short --branch
```

Result:

- branch: `migration/postgres-local...origin/migration/postgres-local [ahead 1]`;
- no modified or untracked repository files were present;
- `src/routeTree.gen.ts` was not dirty;
- no routeTree diff or restore was required.

Git also reported a user-global ignore permission warning. That warning did not indicate repository dirt.

## Targeted Tests

Command run:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
```

Result:

```text
Test Files: 3 passed
Tests: 54 passed
```

Coverage confirmed by the targeted tests:

- service accepts only legal folder lifecycle transitions;
- `OPEN/null`, `CLOSED/null`, invalid jumps, terminal `DIMUSNAHKAN`, and missing/changed lifecycle states are safely rejected;
- lifecycle status update is status-only and does not perform item, source, storage, or delete work;
- lifecycle API requires same-origin validation before auth/service work;
- lifecycle API requires local `dms_session` and assigned `KEPALA_SUB_BAGIAN_UMUM`;
- `ADMIN` alone is rejected;
- invalid action body is rejected with a safe error;
- UI/page formatting exposes only legal lifecycle actions and keeps `DIMUSNAHKAN` file-action blocking copy.

## Runtime Server Reachability

Codex did not start `pnpm dev`.

Already-running app server check:

```text
http://127.0.0.1:3000/ - no HTTP response
http://127.0.0.1:3001/ - no HTTP response
http://127.0.0.1:5173/ - no HTTP response
http://127.0.0.1:5174/ - no HTTP response
```

Runtime HTTP smoke is blocked because no allowed common local port had an already-running reachable app server.

## Safe Unauthenticated Probe

Not performed.

Reason: no app server was reachable on the allowed local ports. Codex did not start a server, did not request cookies, did not use session values, and did not bypass auth.

Expected result if a server is already running later:

- `POST /api/arsiparis/berkas/<safe-placeholder-uuid>/lifecycle` without cookies should return `401 Unauthorized` or same-origin `403`;
- if an invalid body is evaluated before auth in any future shape, a safe `400` is acceptable;
- no lifecycle mutation should occur;
- responses must not leak SQL, env values, storage roots, paths, file tokens, signed token internals, session/cookie values, raw rows, or secrets.

## Authenticated UI Smoke Status

Authenticated UI smoke is human-run pending or externally performed.

Codex did not perform authenticated lifecycle transitions and did not mutate runtime lifecycle state.

The human operator should report only a safe summary. Do not paste cookie, session, token, env, DB URL, storage path, physical path, logical path, file token, signed token, password hash, or raw DB row values.

## Manual UI Smoke Checklist

Prerequisites:

- `pnpm dev` running;
- login as assigned `KEPALA_SUB_BAGIAN_UMUM`;
- use a safe local `CLOSED/AKTIF` berkas with no production value.

Manual UI steps:

1. Open `/arsiparis/berkas`.
2. Confirm sections visible:
   - `Berkas Terbuka`;
   - `Pemberkasan Arsip Aktif`;
   - `Arsip Inaktif`;
   - `Usul Musnah`;
   - `Dimusnahkan`.
3. On a `CLOSED/AKTIF` berkas, click `Jadikan Inaktif`.
   Expected:
   - confirmation says documents are not deleted;
   - berkas moves to `Arsip Inaktif`.
4. On the same berkas now `INAKTIF`, click `Usulkan Musnah`.
   Expected:
   - confirmation says documents are not deleted;
   - berkas moves to `Usul Musnah`.
5. On the same berkas now `USUL_MUSNAH`, click `Musnahkan Data`.
   Expected:
   - confirmation says preview/download will be blocked and physical files are not deleted in this phase;
   - berkas moves to `Dimusnahkan`.
6. Open detail page.
   Expected:
   - `status_arsip = DIMUSNAHKAN` / `Dimusnahkan`;
   - `Data sudah dimusnahkan` is shown;
   - preview/download actions are hidden or blocked.
7. If a previous preview/download URL exists for an item in the folder, retry it.
   Expected:
   - `410` or safe blocked response;
   - message includes `Data sudah dimusnahkan`;
   - no file content served.
8. Confirm no physical deletion occurred in this phase.

## Boundary Confirmation

This smoke pass did not:

- mutate lifecycle state;
- delete physical files;
- implement physical destruction;
- change schema or migrations;
- run migrations or seeds;
- change package files;
- change env files;
- change storage or file-access behavior;
- change Supabase runtime behavior;
- stop transitional `arsip.arsip` writes;
- modify `src/routeTree.gen.ts`;
- run broad build, broad tests, E2E, cleanup scripts, or `pnpm dev`;
- commit changes.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

No source, test, schema, migration, package, env, storage, routeTree, or Supabase runtime changes were made for this smoke phase.

No secrets, cookie/session values, env values, DB URLs, storage roots, physical paths, logical paths, file tokens, signed tokens, raw rows, SQL params, or password hashes were requested or printed.
