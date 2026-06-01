# Agent Working Rules For Migration

AI coding agents working on this migration must follow these rules.

## Required Reading

- Read `AGENTS.md` first.
- Read `docs/migration/` before migration work.
- Read relevant `docs/best-practices/` notes before touching DB/auth/storage/deployment.
- Read current source behavior before changing implementation.

## Change Discipline

- Prefer small bounded changes.
- Do not perform broad refactors.
- Do not change endpoint contracts.
- Do not change UI behavior.
- Do not rewrite unrelated code.
- Do not touch `src/routeTree.gen.ts`.
- Do not modify `package.json` or install packages unless the task explicitly requires it.
- Do not commit unless asked.
- Do not add a git remote.

## Supabase Replacement Rule

- Do not delete Supabase code until the replacement is verified.
- Keep Supabase behavior as the compatibility reference.
- Migrate one domain and one behavior category at a time.

## Security Rules

- Do not expose local storage publicly.
- Do not serve `storage/` as static assets.
- Authorize before file preview/download.
- Keep server/API authorization authoritative.
- Treat client-side RBAC as UX only.
- Keep `log_aktivitas` append-only.

## Reporting Rules

After every task, summarize:

- Files changed.
- Behavior intentionally preserved.
- Tests run.
- Untested changes.
- Any assumptions or open decisions touched.

If tests were not run, say so explicitly.

## Command Safety

- Use `pnpm` for project scripts.
- Avoid destructive commands.
- Never run `git reset --hard`.
- Never remove files unless the task explicitly asks.
- Check git status before and after changes.

