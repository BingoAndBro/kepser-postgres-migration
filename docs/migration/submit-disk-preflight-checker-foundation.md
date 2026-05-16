# Phase 6F.12 Submit Disk Preflight Checker Foundation

Date: 2026-05-16.

## Purpose And Scope

This phase adds an isolated submit-specific disk preflight checker foundation for later injection into `preflightSubmitFiles(...)`.

The checker verifies local source existence and target availability from logical storage paths only. It is route-independent and does not change runtime submit behavior.

`POST /api/dokumen/submit` remains unchanged, legacy Supabase-backed, and unwired to this checker.

## Files Added

- `src/lib/dokumen/submit-disk-preflight-checker.ts`
- `tests/unit/dokumen/submit-disk-preflight-checker.test.ts`

## Checker Design Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

Exported public functions and factory:

- `createSubmitDiskPreflightChecker(options?)`
- `checkSubmitSourceExists(logicalPath, options?)`
- `checkSubmitTargetAvailable(logicalPath, options?)`
- `inspectSubmitSource(logicalPath, options?)`
- `inspectSubmitTarget(logicalPath, options?)`

The factory returns a checker compatible with `SubmitFilePreflightExistenceChecker`:

- `checkSourceExists(logicalPath): Promise<boolean>`
- `checkTargetAvailable(logicalPath): Promise<boolean>`

The checker accepts an optional injected read-only filesystem adapter for tests. The adapter exposes only `stat(...)`.

## Public Logical-Path-Only Boundary

Public checker methods accept logical storage paths only.

The boolean checks return booleans only. Optional diagnostic checks return safe code-only results:

- source: `exists`, `missing`, `unsafe-logical-path`, `check-failed`
- target: `target-available`, `target-already-exists`, `unsafe-logical-path`, `check-failed`

No public result returns a physical path, storage root, raw filesystem error, token, signed URL, or file content.

## Internal Physical Path Handling Rule

Physical path resolution is internal only.

The helper validates logical paths with the existing local storage path helper, resolves the physical path through existing safe local storage helper APIs, and uses the resolved physical path only for a read-only `stat(...)` check.

If storage root or physical path resolution fails, the checker fails closed with a safe code and does not expose the root or physical path.

## Source Existence Behavior

Source behavior:

- source exists as a regular file: `true`
- source missing: `false`
- unsafe source logical path: `false`
- filesystem check error: `false`
- non-file source: `false`

## Target Availability Behavior

Target behavior:

- target missing: `true`
- target already exists: `false`
- unsafe target logical path: `false`
- filesystem check error: `false`

This preserves no-overwrite expectations for later submit movement without executing movement.

## Unsafe Path Behavior

Unsafe logical paths fail closed before any filesystem adapter call.

Examples include traversal paths, URL-like paths, and absolute Windows-style paths. The public outcome is only `false` or `unsafe-logical-path`.

## No Supabase Fallback Policy

The checker does not import or call Supabase clients, Supabase Storage, or external storage fallback logic.

Missing local files remain controlled local failures. The checker does not fetch, copy, download, backfill, sync, or migrate historical Supabase Storage files.

## No Movement, Write, Or Delete Policy

The checker does not move files.

The checker does not write files, delete files, copy files, create directories, remove directories, open streams, or execute submit route side effects.

The only runtime filesystem operation in the helper is read-only `stat(...)`.

## Later Injection Into Submit File Preflight

A later approved route composition phase can inject this checker into `preflightSubmitFiles(...)` as:

```ts
const checker = createSubmitDiskPreflightChecker()
```

Then pass it as `existenceChecker`.

This phase does not perform that route wiring. It only proves the checker contract and its compatibility with the existing preflight helper in unit tests.

## Tests Implemented

Focused tests cover:

- source exists returns true through an injected read-only adapter;
- source missing returns false;
- target available returns true when the target is absent;
- target already exists returns false;
- unsafe logical paths fail closed without adapter calls;
- checker failures return false and safe code-only results;
- public checker methods accept one logical-path argument;
- public results do not expose physical paths, roots, tokens, links, or file contents;
- checker can be passed into `preflightSubmitFiles(...)` for a move-required plan and return `ok: true`;
- missing source causes `preflightSubmitFiles(...)` to fail closed;
- existing target causes `preflightSubmitFiles(...)` to fail closed;
- the injected adapter surface is read-only;
- implementation strings avoid route, external storage, data-client, UI, and direct env markers.

## Remaining Blockers Before Submit Route Wiring

- `POST /api/dokumen/submit` is not wired to local `dms_session`.
- Submit route response mapping from local runtime categories to HTTP status/body is not implemented.
- Submit route does not import or use this checker.
- Runtime filesystem movement is not implemented.
- Runtime DB/file compensation and rollback are not implemented.
- Missing local file route status/message remains unresolved.
- Target-already-exists route status/message remains unresolved.
- Unsupported safe logical path route policy remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains the default submit planning target.
- Historical Supabase Storage files are not locally available.
- `AttachmentEditor` can still produce Supabase-backed dash pending files.
- Supabase cannot be removed.

## Validation Results

Focused validation was run after implementation:

```powershell
git status --short --branch
pnpm test tests/unit/dokumen/submit-disk-preflight-checker.test.ts
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/dokumen/submit-runtime-orchestrator.test.ts
pnpm test tests/unit/storage/local-storage-paths.test.ts
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\storage\submit-move-plan.ts
git diff -- src\lib\storage\local-pending-move.ts
git diff -- src\lib\storage\local-upload.ts
git diff -- src\lib\dokumen\submit-file-preflight.ts
git diff -- src\lib\dokumen\submit-db-file-compensation.ts
git diff -- src\lib\dokumen\submit-runtime-orchestrator.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
git diff -- src\lib\dokumen\local-submit-write-bridge.ts
git diff -- src\lib\dokumen\local-submit-repository.ts
git diff -- tests\unit\dokumen\submit-route-parity.test.ts
git diff -- tests\unit\dokumen\submit-file-preflight.test.ts
git diff -- tests\unit\dokumen\submit-db-file-compensation.test.ts
git diff -- tests\unit\dokumen\submit-runtime-orchestrator.test.ts
Select-String -Path src\lib\dokumen\submit-disk-preflight-checker.ts -Pattern "supabase|createClient|storage\.from|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|routeTree|src/routes|components/|db\.|drizzle" -CaseSensitive:$false
Select-String -Path tests\unit\dokumen\submit-disk-preflight-checker.test.ts -Pattern "supabase|createClient|storage\.from|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|process\.env|DATABASE_URL|routeTree|src/routes|components/|db\.|drizzle" -CaseSensitive:$false
```

Result summary is recorded in the implementation final response.

## Explicit Non-Claims

This phase does not claim submit has migrated.

This phase does not claim route preflight is wired.

This phase does not claim filesystem movement is implemented.

This phase does not claim runtime DB/file compensation is implemented.

This phase does not claim rollback is implemented against real files.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.

This phase does not claim route behavior changed.
