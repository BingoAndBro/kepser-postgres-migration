# Phase 6F.8 Submit File Preflight Helper Foundation

Date: 2026-05-16.

## Purpose And Scope

Phase 6F.8 adds an isolated submit local file preflight helper foundation.

The helper evaluates a logical submit move plan and runs injected source/target existence checks using logical storage paths only for move-required operations. It is route-independent and exists to prove the decision model before any submit runtime wiring.

`POST /api/dokumen/submit` remains unchanged and unwired. It is still not wired to local auth, the local submit write bridge, the local submit repository, the local submit Drizzle adapter, the submit move planner, this file preflight helper, local disk preflight, or local filesystem movement.

## Files Added

- `src/lib/dokumen/submit-file-preflight.ts`
- `tests/unit/dokumen/submit-file-preflight.test.ts`

## Helper Design Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

The helper accepts:

- `actorUserId`;
- a `SubmitMovePlan` produced by `buildSubmitMovePlan(...)`;
- an injected existence checker, optional only when the move plan contains no `move-required` operations.

The existence checker shape is intentionally narrow:

- `checkSourceExists(logicalPath)`;
- `checkTargetAvailable(logicalPath)`.

Checker methods receive logical storage paths only. The helper does not create a default filesystem-backed checker, does not resolve physical paths, does not read storage root configuration, and does not inspect disk by itself.

For any `move-required` operation, both injected methods are required before the helper can return `ok: true`:

- `checkSourceExists(logicalPath)`;
- `checkTargetAvailable(logicalPath)`.

If either method is missing for a move-required operation, preflight fails closed with `existence-checker-missing`. This is a configuration/preflight issue, not a checker execution failure.

The result model is all-or-nothing:

- `ok: true` includes safe planned operations and planned attachment metadata;
- `ok: false` includes safe issues and does not authorize movement;
- all issues contain logical metadata only.

Formal/already-final paths from the move plan are represented as `no-move-required` operations and do not require source or target checks in this foundation.

## Preflight Issue Codes And Semantics

Implemented issue codes:

- `move-plan-blocking-issue`: a blocking issue came from the logical submit move plan and is preserved through `movePlanIssueCode`.
- `owner-mismatch`: actor or attachment owner does not match the planned owner.
- `unsupported-source-path`: the move planner classified a safe path as unsupported for submit movement.
- `unsafe-logical-path`: the move planner rejected an unsafe source or target logical path.
- `existence-checker-missing`: a move-required operation did not receive an injected source or target checker.
- `source-missing`: an injected source existence check returned false.
- `target-already-exists`: an injected target availability check returned false.
- `existence-check-failed`: an injected checker threw or could not complete safely.

The helper also allows the original submit move plan issue codes in its issue type so future callers can preserve planner semantics without inventing incompatible names.

Safe client-facing categories are provided as metadata only:

- `validation`;
- `local-storage-missing`;
- `local-storage-conflict`;
- `preflight-unavailable`.

The helper does not create route-ready HTTP statuses or final submit route messages.

## Missing Local File Policy

Missing local source fails closed when an injected checker reports that a planned source does not exist.

The helper returns `ok: false` with `source-missing` before any movement can be authorized. It does not fallback to Supabase Storage and does not fetch, copy, download, backfill, or sync historical storage files.

If the source checker itself is not injected for a move-required operation, the helper returns `ok: false` with `existence-checker-missing`.

## Target Exists Policy

Target already exists fails closed when an injected checker reports that a planned target is unavailable.

The helper returns `ok: false` with `target-already-exists`. This preserves no-overwrite expectations for a later move executor without implementing movement in this phase.

If the target checker itself is not injected for a move-required operation, the helper returns `ok: false` with `existence-checker-missing`.

## All-Or-Nothing Policy

Preflight is all-or-nothing:

- if the move plan has any blocking issue, the helper returns `ok: false` and does not call injected existence checks;
- if any planned move is missing a source checker, missing a target checker, has a missing source, has an unavailable target, or has a checker failure, the helper returns `ok: false`;
- no operation is approved for runtime movement unless the full preflight result is `ok: true`.

## DB/File Ordering Implication

This helper supports the conservative ordering documented in Phase 6F.5:

1. validate request/auth/master/write preconditions in a future route phase;
2. build the submit move plan, preserving `temp-id` as the default target;
3. run logical and injected file preflight before any DB write and before any filesystem move;
4. only then decide whether a later approved route implementation may move files and write DB rows.

The helper does not implement DB/file compensation. A later route phase still needs an explicit rollback/recovery policy before filesystem movement is enabled.

## Explicitly Not Implemented

This phase does not implement:

- submit route wiring;
- route disk preflight wiring;
- filesystem movement;
- default filesystem-backed existence checker;
- physical path resolution;
- storage root resolution;
- Supabase fallback;
- Supabase calls;
- live PostgreSQL usage;
- DB scripts, migrations, or seeds;
- DB/file compensation or rollback;
- historical Supabase Storage migration, copy, download, backfill, or sync;
- UI behavior changes;
- preview/download changes;
- archive destruction changes;
- delete/remove changes;
- diagnostics/orphan cleanup changes;
- route generation.

## Remaining Blockers Before Submit Route Wiring

- Runtime submit route is not wired to local `dms_session`.
- Runtime submit route is not wired to the local submit write bridge, repository, or Drizzle adapter.
- Runtime submit route is not wired to the submit move planner or this preflight helper.
- Runtime route disk checks are not wired.
- Runtime filesystem movement is not implemented.
- DB/file compensation and rollback policy remain unimplemented.
- Missing local file route status/message remains unresolved.
- Unsupported safe logical path route policy remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains the default submit planning target.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused validation for this phase:

```powershell
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/storage/submit-move-plan.test.ts
pnpm test tests/unit/storage/local-storage-paths.test.ts
git diff --check
```

Result summary is recorded in the task final response for the implementation or fix that ran validation.

## Explicit Confirmations

This phase keeps the following unchanged:

- `POST /api/dokumen/submit`;
- `src/routeTree.gen.ts`;
- local storage movement helpers;
- local submit bridge/repository/adapter helpers;
- submit route parity tests unless a separate explicit need appears.

## Phase 6F.9 Follow-Up Note

Phase 6F.9 added the route-independent DB/file compensation policy foundation described in `docs/migration/submit-db-file-compensation-policy-foundation.md`.

The follow-up classifies submit orchestration outcomes only. It does not wire `POST /api/dokumen/submit`, does not implement runtime disk checks, does not execute filesystem movement, does not implement real rollback or compensation, and does not add Supabase fallback.

## Phase 6F.12 Follow-Up Note

Phase 6F.12 added the isolated submit disk preflight checker foundation described in `docs/migration/submit-disk-preflight-checker-foundation.md`.

The checker is the first submit-specific disk implementation that can satisfy this helper's injected `SubmitFilePreflightExistenceChecker` shape. It remains unwired from `POST /api/dokumen/submit`, performs no movement, and exposes only logical-path boolean checks or safe code-only diagnostics.
