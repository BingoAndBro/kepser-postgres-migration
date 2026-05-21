# Phase 11H.1 - Final Supabase Runtime/Package/Env/Docs Audit

Date: 2026-05-21.

Status: audit complete for the bounded 11H.1 documentation scope. This phase made no runtime, package, env, test, DB, Drizzle, Supabase folder, route-generation, firewall/network, backup/restore, cleanup, or commit changes.

This audit classifies Supabase retirement for the clean local target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no old Supabase data or file recovery expected;
- no active Supabase runtime fallback expected.

## Scope And Non-Goals

Reviewed:

- `src`;
- `tests`;
- `docs`;
- `package.json`;
- `pnpm-lock.yaml`;
- tracked env examples by key name only;
- `db`;
- `drizzle`;
- `supabase/` folder listing and grep results.

Not done:

- no source implementation;
- no package cleanup;
- no env cleanup;
- no test edits;
- no DB, Drizzle, or Supabase folder edits;
- no route generation;
- no old Supabase data/file migration, copy, download, backfill, sync, or recovery;
- no final release decision.

No `.env` or `.env.migration` values were inspected or printed. Env handling was limited to tracked examples and key-name-only grep output.

## Command And Audit Summary

Required commands were run:

- `git status --short --branch`;
- `git diff --check`;
- `git diff --name-only`;
- `git log --oneline -n 20`;
- broad Supabase grep across source, tests, docs, package files, DB/Drizzle, and `supabase/`;
- runtime-pattern grep for Supabase client factories and `supabase.*` calls across source, tests, and package files;
- Supabase env-key grep across source, tests, docs, and package files;
- overclaim-language grep across migration docs, source, and tests;
- protected diff checks for `.env`, `.env.migration`, `src`, `tests`, package files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`.

Pre-edit protected diffs were empty. Post-update protected diffs remain limited to docs covered by this phase.

## Active Runtime Findings

Runtime-pattern grep across `src`, `tests`, `package.json`, and `pnpm-lock.yaml` found no active matches for:

- Supabase client factories;
- `supabase.auth`;
- `auth.admin`;
- `supabase.from`;
- `supabase.storage`;
- `storage.from`;
- `SupabaseClient`.

Source-side broad Supabase hits in `src` are classified as non-runtime residue:

| Location | Classification | Notes |
|---|---|---|
| `src/db/schema/master/kelengkapan-dokumen.ts` | Historical comment | Points to old Supabase migration provenance for a constraint. |
| `src/lib/db/schema.ts` | Historical comment | Legacy partial mirror wording mentions Supabase Auth UUIDs. |
| `src/lib/dokumen/local-submit-drizzle-adapter.ts` | Comment/reference-only | Explicitly says Supabase calls are excluded from the adapter. |
| `src/lib/guards.ts` | Type-only residue / cleanup backlog | Imports only a type from the old Supabase server helper name. No runtime Supabase client call was found. |
| `src/lib/master-data/shared.ts` | Historical comment | Explains legacy snake_case response shape. |
| `src/lib/storage/file-access-token.ts` | False positive / defensive denylist | `supabaseSignedUrl` is a sensitive-claim key that is rejected, not used as a dependency. |
| `src/lib/types/auth.ts` | Historical type comments | Legacy Supabase session wording remains in comments/types. |
| `src/routes/__root.tsx` | Outdated comment | Comment still says auth is handled through Supabase session. Runtime code uses `AppLayout` and current local auth path. Cleanup recommended. |

Classification:

```text
Active runtime Supabase dependency: retired
```

No active Supabase runtime dependency was found by the required runtime-pattern grep. Source comments/type-only residue remain cleanup backlog.

## Package Dependency Findings

`package.json` and `pnpm-lock.yaml` contain no `@supabase`, `supabase-js`, or `supabase/ssr` package dependency matches.

Classification:

```text
Package Supabase dependency: retired
```

No package-file change was made.

## Env Reference Findings

`.env` and `.env.migration` are human-controlled and were not inspected or printed.

Tracked env examples:

- `.env.example` still contains Supabase key names.
- `.env.migration.example` did not appear in the Supabase key-name match set.

Source runtime env constants:

- Supabase env-key grep in `src` returned no matches for the audited Supabase keys or `ENV_KEYS.SUPABASE*` names.
- Current source env usage observed in the local runtime points to local DB/session/storage-related keys, not Supabase keys.

Docs contain many Supabase env-key references in historical migration plans, specs, and best-practice examples.

Classification:

```text
Env Supabase references: human-controlled / cleanup required, not runtime blocker
```

`.env.example` Supabase key names are cleanup backlog if the human wants examples to match only the local target. They are not an active runtime blocker because source runtime env-key grep is clean and package dependencies are retired.

## Docs Reference Findings

Docs still contain many Supabase references. They fall into these buckets:

- historical migration traceability;
- old specs and planning notes;
- best-practice examples with legacy Supabase SSR/Auth patterns;
- previous phase audit records;
- current 11G/11H guardrails that explicitly say no active Supabase fallback is expected.

Some older docs still contain current-runtime wording from earlier phases, such as the migration README and older architecture/spec documents. These are cleanup backlog unless a human chooses a broad docs cleanup phase.

No 11H.1 blocker was found solely from docs because the current Phase 11G/11H docs clearly state the local target and the no-fallback posture. The broad docs corpus should not be read as one current-runtime source of truth without the Phase 11 migration context.

Classification:

```text
Docs Supabase references: historical allowed / cleanup required, not blocker
```

## Tests Reference Findings

Test Supabase references are classified as:

| Location | Classification | Notes |
|---|---|---|
| `tests/e2e/approval-flow.spec.ts` | False positive naming | A variable named `supabase` wraps Playwright request context; it calls local app URLs. |
| `tests/e2e/spec-06-user-management.spec.ts` | Historical comment | Mentions creating an admin user through Supabase Dashboard. Cleanup backlog. |
| `tests/e2e/submit-flow.spec.ts` | Outdated active expectation / cleanup backlog | Expects a download popup URL to contain `supabase`; this is stale against local file-access behavior and should be updated in a separate test cleanup phase. |
| `tests/unit/storage/*` | Reference-only guardrail | Test names assert no Supabase fallback. |

Classification:

```text
Tests Supabase references: cleanup required, not runtime/package blocker
```

The stale E2E expectation is not an active app runtime dependency, but it is a test-suite cleanup item before relying on that E2E file as current local-target evidence.

## Supabase Folder Findings

The `supabase/` folder remains in the repository and contains historical migrations, an old Edge Function, and legacy CLI metadata. It was not modified.

Classification:

```text
supabase/ folder: historical allowed / cleanup policy requires human decision, not active runtime blocker
```

Important caveat: legacy CLI metadata exists under the folder. 11H.1 did not print or record any values from that metadata. A separate human-approved hygiene phase should decide whether to remove or redact legacy CLI temp artifacts from the repository history/worktree. That is not part of 11H.1.

## DB And Drizzle Findings

`db` has no tracked file hits in the Supabase grep set.

`drizzle` has no Supabase grep matches.

Source Drizzle schema comments contain only historical Supabase provenance in `src/db` and the older partial mirror under `src/lib/db/schema.ts`; no Supabase-specific Drizzle runtime assumption was found in the `drizzle` folder.

Classification:

```text
DB/drizzle Supabase references: none in db/drizzle; historical comments in source only
```

## Final Supabase Retirement Classification

```text
Active runtime Supabase: retired
Package Supabase dependency: retired
Env Supabase references: human-controlled / cleanup required, not runtime blocker
Docs Supabase references: historical allowed / cleanup required, not blocker
Tests Supabase references: cleanup required, not runtime/package blocker
supabase/ folder: historical allowed unless human cleanup policy changes, not active runtime blocker
DB/drizzle references: none in db/drizzle; source comments only
Overall Supabase retirement: active runtime/package dependency retired; historical docs, tests, env-example key names, source comments/type residue, and supabase/ artifacts remain for traceability unless human policy chooses cleanup
```

Required classification language:

```text
Supabase is retired from active runtime/package dependency; historical docs and supabase/ artifacts remain for traceability unless human policy chooses cleanup.
```

This does not mean Supabase is fully removed from the repository.

## Blockers, Cleanup Backlog, And Accepted Historical References

Blockers found by 11H.1:

- none for active runtime/package Supabase retirement.

Cleanup backlog:

- stale source comments/type-only Supabase residue, especially `src/lib/guards.ts` and `src/routes/__root.tsx`;
- `.env.example` Supabase key names;
- stale E2E expectation in `tests/e2e/submit-flow.spec.ts`;
- historical/current-runtime wording cleanup in older docs if the human wants the docs corpus to be less ambiguous;
- human decision on retaining or removing `supabase/` historical folder and legacy CLI metadata;
- old specs and best-practice examples that still show Supabase implementation patterns.

Accepted historical references:

- migration docs and specs documenting prior Supabase behavior;
- old Supabase migrations retained as compatibility/schema traceability;
- old Edge Function retained as scheduler-replacement traceability;
- test names/comments that explicitly assert no Supabase fallback.

Unrelated P1 gates remain unresolved and are not downgraded:

- CSRF/origin strategy;
- login rate-limit/brute-force foundation;
- destructive admin cleanup hardening;
- raw logical-path file-access narrowing or status revalidation for `DIMUSNAHKAN`.

Forward status: Phase 11H.2 is now recorded in `docs/migration/phase-11h-p1-security-gate-decision.md` as decision framework recorded, decisions pending. This does not change the 11H.1 Supabase retirement classification and does not accept or resolve the P1 security gates.

## Next Phase Recommendation

Because active runtime and package Supabase blockers were not found and 11H.2 recorded only the decision framework without explicit human dispositions, the recommended next phase is:

```text
Phase 11H.2 Decision Follow-up - Human disposition for P1 gates
```

If the human instead wants repository hygiene first, open a separate cleanup phase for source comments, env examples, stale tests, docs wording, and `supabase/` retention policy. Do not mix that cleanup with the P1 security gate decision unless explicitly approved.

## What Is Not Claimed

- Not final release approval.
- Not production readiness.
- Not LAN readiness.
- Not operational certification.
- Not go-live approval.
- Not full Supabase removal from the repository.
- Not permission to delete `supabase/`.
- Not acceptance of unresolved P1 security gates.
- Not evidence that all historical docs/tests are current.
