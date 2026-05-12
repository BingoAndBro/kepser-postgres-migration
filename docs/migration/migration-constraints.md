# Migration Constraints

These constraints are binding for the PostgreSQL local migration.

## Hard Compatibility Rules

- Preserve all existing API endpoint paths.
- Preserve request payload shapes.
- Preserve response shapes.
- Preserve UI behavior and route behavior.
- Preserve FSM/workflow behavior.
- Preserve auth UX, including active role behavior.
- Preserve pending upload behavior.
- Preserve preview/download behavior.
- Preserve audit log append-only behavior.
- Keep `ADMIN` as a dedicated role that is not combined with other roles.
- Treat client-side RBAC as a UX hint only; server/API authorization remains authoritative.

## Forbidden Refactors

- Do not perform broad refactors during migration phases.
- Do not rewrite unrelated UI.
- Do not remove Supabase code until the replacement path is verified.
- Do not rewrite API routes only to change style.
- Do not rewrite auth, storage, or Drizzle schema before their planned phase.
- Do not touch `src/routeTree.gen.ts`.
- Do not modify `package.json` unless a later implementation phase explicitly requires a dependency change.
- Do not install packages in planning-only tasks.
- Do not add a git remote.
- Do not commit unless explicitly asked.

## API Compatibility Contract

Each migrated endpoint must keep:

- Same URL path.
- Same HTTP method.
- Same request body fields and field names.
- Same success status and response shape unless the current behavior is already documented as a bug.
- Same error status categories where the UI depends on them.
- Same cookie/session behavior from the browser point of view.

Use Zod at API boundaries. `safeParse` is preferred for user-facing request parsing so invalid input returns structured errors rather than uncaught exceptions.

## Auth Compatibility Contract

The target auth layer must provide:

- Cookie-based sessions.
- `HttpOnly` session cookie.
- `SameSite=Lax` or stricter by default.
- `Secure` cookie flag when HTTPS is active.
- Password storage using argon2id.
- Hashed session token storage in PostgreSQL.
- Default expiration of 8 hours.
- Remember-me expiration of 30 days.
- Explicit logout/session invalidation.
- Active role behavior compatible with the current `dms_active_role` behavior.
- Dedicated `ADMIN` behavior.

Session IDs must be high-entropy random tokens and must not contain user data. OWASP recommends meaningless session identifiers generated with a cryptographically secure random source.

## Storage Security Contract

The target storage layer must:

- Store files under `storage/`, outside public/static assets.
- Never expose `storage/` as a static served directory.
- Authorize before preview or download.
- Stream files through API routes.
- Prevent path traversal.
- Validate expected MIME types and file size limits.
- Preserve pending-to-formal file path semantics.
- Replace Supabase signed URLs with internal signed-token behavior.
- Keep database metadata and filesystem files backup-aligned.

## FSM And Workflow Constraints

- `src/lib/fsm.ts` remains the conceptual source of truth for status transitions.
- No manual status updates outside the state machine behavior.
- `log_aktivitas` remains append-only.
- Reject notes remain required where current workflow requires them.
- Non-material shortcut behavior must be preserved.
- Arsip lifecycle behavior must be preserved.

## RBAC Constraints

- Roles remain `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`.
- Users can have multiple non-admin roles.
- `ADMIN` remains dedicated.
- Role resolution must be enforced server-side.
- UI role hiding is not security.

## Testing Expectations

Each implementation phase should validate with the smallest relevant checks first, then expand:

- Unit tests for FSM/auth/storage helpers where available.
- API contract checks for migrated endpoints.
- Manual workflow checks for Pegawai, PPK, Bendahara, Arsiparis, and Admin.
- Playwright smoke tests after workflow-affecting changes.

If tests are not run, the task summary must say so explicitly.

## LAN Deployment Constraints

- PostgreSQL must run in Docker with persistent volumes.
- Database ports should not be exposed to the whole LAN unless there is a clear operational need.
- App access can be exposed on the LAN after binding and firewall rules are understood.
- Environment variables must be documented for host/server deployment.
- Backups must cover both PostgreSQL dumps and `storage/` files.

## References

- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Path Traversal: https://owasp.org/www-community/attacks/Path_Traversal
- TanStack Start server functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions

