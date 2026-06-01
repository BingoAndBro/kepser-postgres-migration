# Migration Architecture Decisions

This document records migration direction before implementation. Decisions here are documentation-level architecture decisions; they do not implement code.

## ADR-001: Preserve API Endpoint Paths

Status: Accepted

Context:
The current UI, route tree, and helper modules call existing `/api/*` paths across Auth, Pegawai, PPK, Bendahara, Arsiparis, Admin/master data, upload/storage, and reports.

Decision:
All migration work must preserve existing API endpoint paths. Replacement work changes internals behind the route, not the URL contract.

Consequences:
Existing UI route calls remain valid. Migration can be phased endpoint-by-endpoint. Any endpoint rename requires a separate compatibility plan and is out of scope for the migration foundation.

Related audit findings:
`docs/migration/supabase-audit.md` Section 7 maps API endpoints by domain and flags path compatibility as critical.

## ADR-002: Preserve Request And Response Shapes

Status: Accepted

Context:
The current app depends on specific JSON response fields such as `{ session, roles, activeRole }`, `{ signedUrl }`, `{ success, dokumen }`, and domain-specific enriched document fields.

Decision:
Migrated endpoints must preserve request payload fields, response fields, success/error status behavior where UI depends on it, and cookie-visible behavior.

Consequences:
Replacement services must be tested against current endpoint contracts. Improvements to response design are deferred until after parity.

Related audit findings:
The audit identifies manual enrichment fields, signed URL responses, auth session responses, and role-specific workflow responses as compatibility-sensitive.

## ADR-003: Keep Supabase Code As Reference Until Parity Is Verified

Status: Accepted

Context:
Supabase Auth, PostgreSQL, Storage, migrations, RLS assumptions, Edge Function behavior, and helpers are the current reference implementation.

Decision:
Do not delete Supabase code until the corresponding replacement layer has passed targeted tests and manual workflow checks.

Consequences:
Temporary duplication is expected. Cleanup happens only after DB, auth, storage, API, workflow, and deployment parity are proven.

Related audit findings:
The audit shows Supabase usage is broad and scattered across browser code, API routes, helpers, migrations, and storage operations.

## ADR-004: Use Local PostgreSQL Via Docker

Status: Accepted

Context:
The migration target is a local/LAN deployable system with PostgreSQL managed locally rather than Supabase-hosted PostgreSQL.

Decision:
PostgreSQL will run in Docker with persistent volumes. The initial app runtime may run on the host.

Consequences:
Future setup must include PostgreSQL volume persistence, backup/restore, environment variables, and port exposure rules. Docker Compose is not created in this documentation task.

Related audit findings:
Supabase DB usage must be replaced across auth, master data, dokumen, arsip, reports, and admin endpoints.

## ADR-005: Use Drizzle Schema From Scratch

Status: Accepted

Context:
`src/lib/db/schema.ts` is a partial mirror. `supabase/migrations/` and active endpoint/helper behavior are currently more complete sources of truth.

Decision:
The target PostgreSQL schema will be built from scratch using Drizzle, informed by Supabase migrations and runtime behavior, not copied blindly from the partial Drizzle mirror.

Consequences:
Schema design must preserve behavior while using domain schemas: `auth`, `master`, `dokumen`, `arsip`, and `app`. Generated migrations must be reviewed before execution.

Related audit findings:
The audit lists active tables and notes PostgREST nested select/manual enrichment behavior that must be modeled explicitly.

## ADR-006: Use Custom Cookie Session Auth

Status: Accepted

Context:
Current auth relies on Supabase Auth, browser auth state, Supabase Auth Admin APIs, and `dms_active_role`.

Decision:
Replace Supabase Auth with custom cookie session auth. Passwords use argon2id. Session tokens are stored hashed in PostgreSQL.

Consequences:
The session cookie must be `HttpOnly`. `/api/auth/session` becomes the canonical bootstrap endpoint. User management must replace Supabase Auth Admin behavior.

Related audit findings:
The audit flags `login.tsx`, `AppLayout`, `/api/auth/*`, `/api/users/*`, and `src/lib/user-helpers.ts` as critical auth replacement areas.

## ADR-007: Use Local Filesystem Storage

Status: Accepted

Context:
Current file handling uses Supabase Storage bucket `dokumen-lampiran`, pending/formal path conventions, and signed URLs.

Decision:
Replace Supabase Storage with local filesystem storage under `storage/`. Files must never be publicly exposed as static assets.

Consequences:
All upload, preview, download, move, delete, archive snapshot, cleanup, and destruction behavior must go through authorized API/server code.

Related audit findings:
The audit flags `/api/upload`, preview/download endpoints, `AttachmentEditor`, `src/lib/dokumen/storage.ts`, and archive destruction as high-risk storage areas.

## ADR-008: Keep Authorization In API/Server Layer

Status: Accepted

Context:
The current repo is SPA-heavy because root routing uses `ssr: false`; client-side role checks exist but are not authoritative.

Decision:
Authorization remains enforced in API/server handlers and server helpers. Client-side RBAC remains a UX hint only.

Consequences:
Every migrated endpoint must independently validate session, active role, and role/domain access. Browser-only guards cannot be treated as security.

Related audit findings:
The audit shows direct browser Supabase access and role page guards, but server/API authorization is the required security boundary.

## ADR-009: Defer PostgreSQL RLS

Status: Accepted

Context:
Supabase RLS exists historically, but many current workflow endpoints intentionally use admin/service-role clients while enforcing authorization in application code.

Decision:
Do not implement PostgreSQL RLS in the first migration. Design schema to be RLS-friendly, but keep enforcement in API/server code.

Consequences:
Application authorization must be complete and tested. RLS policy design can be introduced later as a hardening phase.

Related audit findings:
The audit identifies service-role bypass assumptions in workflow, storage, and user management.

## ADR-010: Do Not Containerize The App In The First Foundation Phase

Status: Accepted

Context:
The deployment target is LAN-capable, but DB/auth/storage behavior must stabilize before packaging decisions.

Decision:
Initial foundation targets PostgreSQL in Docker and app running on the host. App containerization is deferred.

Consequences:
No app Dockerfile or Compose app service is created during foundation. Deployment packaging occurs after DB/auth/storage parity.

Related audit findings:
The deployment notes and TanStack Start notes recommend delaying packaging until runtime behavior is stable.

## ADR-011: Plan LAN Deployment After DB/Auth/Storage Stabilize

Status: Accepted

Context:
The app should eventually run on one server machine and be accessed by other LAN devices.

Decision:
LAN deployment planning is accepted, but implementation happens after DB, auth, and storage replacement layers are stable.

Consequences:
Future deployment must address `0.0.0.0` app binding, firewall rules, static IP/hostname, persistent volumes/storage, backups, restore, environment variables, and optional HTTPS.

Related audit findings:
The audit shows local deployment must replace Supabase-hosted DB, auth, storage, and Edge/cron behavior before safe LAN packaging.

