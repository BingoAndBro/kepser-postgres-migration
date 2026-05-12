# Open Decisions

## Already Decided

- Local PostgreSQL via Docker.
- No Supabase local stack.
- No Supabase dummy restore.
- Drizzle schema from scratch.
- Custom cookie session auth.
- Argon2id password hashing.
- Session token stored hashed.
- Default session expiration: 8 hours.
- Remember me expiration: 30 days.
- PostgreSQL schemas: `auth`, `master`, `dokumen`, `arsip`, `app`.
- Local filesystem storage under `storage/`.
- Storage not exposed as static public files.
- Preview/download via API.
- Do not implement RLS yet.
- Authorization remains in API/server layer.
- Local/LAN deployment is a target.

## Still Open

- Exact Drizzle schema naming conventions.
- Exact seed strategy.
- Exact signed-token implementation details.
- Exact repository folder structure.
- Exact transition strategy for old Supabase helpers.
- Whether final LAN deployment runs app directly on host or in Docker.
- Backup schedule and retention.
- HTTPS strategy for LAN, if needed.
- Server hostname/static IP strategy.

## Decision Log Rules

- Add the date when a decision is made.
- Record the reason and rejected alternatives.
- Update `AGENTS.md` if the decision becomes a project invariant.
- Do not encode an open decision in implementation by accident.

