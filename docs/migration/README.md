# PostgreSQL Local Migration

This folder tracks the documentation-only planning work for migrating the DMS app from Supabase-managed services to local infrastructure.

## What This Migration Is

The migration target is a fresh local PostgreSQL-backed version of the existing internal DMS workflow app. The goal is to preserve the current product behavior while replacing the infrastructure behind it:

- Supabase PostgreSQL becomes local PostgreSQL running in Docker.
- Supabase Auth becomes custom cookie session auth.
- Supabase Storage becomes local filesystem storage under `storage/`.
- Supabase signed URLs become internal signed-token preview/download routes.

This is not a feature rewrite. API paths, request payloads, response shapes, UI behavior, workflow status transitions, active role behavior, pending upload behavior, preview/download behavior, and audit log behavior must remain compatible.

## Current Architecture

The current app is a TanStack Start, React, and TypeScript application. It is currently SPA-heavy because the root route uses `ssr: false`, so authentication bootstrap happens mainly in the browser layout while API/server routes still enforce authorization.

Current runtime services:

- Supabase Auth for users and sessions.
- Supabase PostgreSQL as the real database.
- Supabase Storage for document files.
- Drizzle exists as a partial mirror/schema helper, not the full source of truth.
- Zod is required at request/response boundaries.
- Vitest and Playwright exist for regression testing.

Current schema truth must be read from existing Supabase migrations and active API/helper behavior, not only from `src/lib/db/schema.ts`.

## Target Architecture

Target runtime services:

- PostgreSQL in Docker.
- New Drizzle PostgreSQL schema from scratch.
- PostgreSQL schemas: `auth`, `master`, `dokumen`, `arsip`, and `app`.
- Custom cookie session auth using argon2id password hashes.
- Session token stored hashed in the database.
- Default session expiration of 8 hours.
- Remember-me expiration of 30 days.
- Local filesystem storage under `storage/`.
- Files served only through authorized API routes, never as static public files.
- Internal signed-token behavior for preview/download.

PostgreSQL RLS is intentionally deferred. The schema should remain RLS-friendly, but authorization remains enforced in API/server code during this migration.

## Local And LAN Deployment Goal

The eventual deployment target is a local network setup:

- One computer acts as the server.
- PostgreSQL runs in Docker on that server.
- Other devices on the same WiFi/LAN access the app through the server IP address or hostname.
- Persistent PostgreSQL volumes, persistent local file storage, backup/restore, environment variables, firewall rules, and LAN binding must be planned before deployment.

Application containerization can be considered later, but should not happen before DB/auth/storage behavior is stable.

## Why This Branch Is Isolated

This branch is an isolated migration clone and intentionally has no git remote. Do not add a remote. The isolation exists so migration planning and later implementation can proceed without accidentally affecting the active Supabase-backed development line.

## Why Supabase Remains As Reference

Do not remove Supabase code early. Supabase Auth, database calls, storage calls, migrations, and helper behavior are the current reference implementation. They should remain available until each replacement layer has proven compatibility through targeted tests and manual workflow checks.

## References

- TanStack Start environment variables: https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables
- TanStack Start server routes: https://tanstack.com/start/v0/docs/framework/react/guide/server-routes
- Drizzle migrations: https://orm.drizzle.team/docs/migrations
- PostgreSQL schemas: https://www.postgresql.org/docs/17/ddl-schemas.html
- Docker Compose volumes: https://docs.docker.com/reference/compose-file/volumes/

