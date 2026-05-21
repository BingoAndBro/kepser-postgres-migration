# Deployment Target Contract

This contract defines the future local/LAN deployment direction. It is documentation only and does not create Docker Compose, scripts, or runtime configuration.

## Intended Topology

```text
LAN clients
  -> server IP/hostname
  -> TanStack Start app
  -> PostgreSQL Docker container
  -> local storage folder/volume
```

The app serves the UI and API. PostgreSQL stores structured data. `storage/` stores uploaded files outside public/static serving.

## Initial Development Deployment

Accepted initial direction:

- PostgreSQL runs in Docker.
- The app runs directly on the host.
- The app connects to PostgreSQL through `DATABASE_URL`.
- Local file storage uses the host `storage/` folder.

Rationale:

This keeps the first foundation phase focused on DB/auth/storage correctness rather than app packaging.

## Later Deployment Option

Deferred option:

- App and PostgreSQL can later run together in Docker Compose.
- App containerization should happen after DB/auth/storage behavior is stable.
- If containerized, `storage/` must be a persistent bind mount or named volume.

## Server Bind Requirement

For LAN access, the app server must listen on:

```text
0.0.0.0
```

or an equivalent LAN-reachable interface.

Do not assume local-only dev defaults are reachable from other devices. Firewall rules must allow the chosen app port on the trusted/private network.

## PostgreSQL Exposure Rule

PostgreSQL should not be exposed to LAN clients unless explicitly needed.

Preferred access:

- App talks to PostgreSQL on localhost or Docker network.
- PostgreSQL port is not broadly published to the LAN.

If PostgreSQL must be exposed for administration, document and restrict it explicitly.

## Persistent Volume And Storage Strategy

Persistent data:

- PostgreSQL Docker volume.
- `storage/` folder or volume.
- Backup output directory.

Rules:

- PostgreSQL data must survive container replacement.
- Uploaded files must survive app restarts and deployments.
- Storage path must be configurable via environment variable or documented default.
- Local storage must not be inside transient build output.

## Backup Strategy

Backup must include a consistent pair:

- PostgreSQL dump.
- `storage/` folder archive.

Recommended backup set metadata:

- Timestamp.
- App version or migration version.
- Database dump filename.
- Storage archive filename.
- Environment/config reference without secrets.

Backup schedule and retention remain open.

## Restore Strategy

Restore must:

- Restore PostgreSQL dump using the selected dump format.
- Restore `storage/` to the configured storage root.
- Verify DB file metadata points to existing files.
- Verify login.
- Verify document preview/download.
- Verify archive `DIMUSNAHKAN` files remain inaccessible.
- Verify admin/orphan analysis if available.

## Environment Variable Strategy

Required future environment groups:

- Database: `DATABASE_URL`.
- Auth/session: session secret/signing secret, cookie name, cookie security settings.
- Storage: storage root, max file size, allowed MIME types if configurable.
- App: `APP_URL`, host, port.
- Deployment: backup path, LAN hostname if needed.

Rules:

- Do not commit secrets.
- Provide examples with placeholders only.
- Keep client-exposed variables separate from server-only variables.

## Windows Firewall, Static IP, And Hostname Notes

The likely LAN server is Windows-based because this repo is currently worked from a Windows path.

Deployment planning must decide:

- Static DHCP reservation versus manual static IP.
- Direct IP access versus local hostname.
- Windows Firewall inbound rule for the app port.
- Whether PostgreSQL port remains localhost-only.

## HTTPS Decision

Status: Deferred

HTTPS is deferred for LAN unless required by security policy, browser behavior, or production data sensitivity.

Implications:

- Without HTTPS, session cookie cannot use `Secure`.
- With HTTPS, session cookie should use `Secure`.
- `DMS_SESSION_COOKIE_SECURE` controls the explicit session-cookie `Secure` override for local deployment:
  - unset: default app behavior, `Secure` in production or HTTPS/proxy-HTTPS requests;
  - `true`: force `Secure`;
  - `false`: allow trusted HTTP LAN/local mode to issue `dms_session` without `Secure`.
- `DMS_SESSION_COOKIE_SECURE=false` is only for trusted HTTP LAN/local smoke or internal deployment. Final/best-practice deployment should prefer HTTPS plus `DMS_SESSION_COOKIE_SECURE=true` or the secure default.
- If HTTPS is required, hostname/certificate strategy must be decided before rollout.

## Deployment Security Constraints

Phase 11G.5 records these constraints for any serious/final browser-accessible deployment:

- Cookie-authenticated state-changing routes need explicit CSRF/origin protection; `SameSite=Lax` alone is not sufficient as the final story.
- Login needs app-layer brute-force/rate-limit protection. Reverse proxy, firewall, Docker, and trusted-LAN placement may reduce exposure but must not be the only control for final deployment.
- Destructive admin cleanup must not rely on GET query flags without strong origin/CSRF protection.
- Raw logical-path preview/download compatibility must be narrowed or status-aware before final rollout so archive `DIMUSNAHKAN` access blocking remains authoritative.
- HTTPS plus `Secure` session cookies is the preferred final posture.

## What Not To Implement Yet

- Do not create Docker Compose yet.
- Do not create an app Dockerfile yet.
- Do not containerize the app yet.
- Do not create backup scripts yet.
- Do not automate firewall rules yet.
- Do not implement HTTPS/certificates yet.
- Do not expose PostgreSQL to LAN.

## Validation Checklist For Future Deployment Work

- App is reachable from another LAN device.
- PostgreSQL persists across container restart.
- Uploaded files persist across app restart.
- App can preview/download restored files.
- Backup and restore are tested as a pair.
- Firewall allows app port only on trusted network.
- PostgreSQL is not exposed beyond intended interface.
- Environment variables are documented with placeholders.
