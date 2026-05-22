# Local/LAN Deployment Notes

This document plans future LAN deployment. Do not implement deployment packaging before DB/auth/storage are stable.

## Intended Topology

- One server machine runs PostgreSQL and the DMS app.
- PostgreSQL runs in Docker.
- Client devices access the app from the same WiFi/LAN using server IP or hostname.
- Files live in persistent local storage on the server.

## Server Machine Assumptions

- Stable power and storage.
- Static LAN IP or reliable hostname.
- Firewall rules can be managed.
- Disk has enough room for PostgreSQL data, uploads, logs, and backups.
- Operator has access to run backup and restore commands.

## Port Exposure

- App port should be reachable from LAN clients.
- PostgreSQL port should preferably bind to localhost or Docker network only.
- Exposing PostgreSQL to the LAN should require an explicit operational reason.

Docker warns that published ports are reachable outside the host by default unless bound to a specific host address.

## Docker PostgreSQL Role

PostgreSQL should use:

- Official `postgres` image.
- Persistent Docker volume for data.
- Explicit database/user/password env vars.
- Healthcheck before app startup if the app is containerized later.
- Init scripts only for first-time database initialization.

The official image only applies initialization environment variables and init scripts when the data directory is empty.

## Possible Future App Container

The app may later run:

- Directly on the host with Node.
- In Docker beside PostgreSQL.

Do not decide too early. Stabilize DB/auth/storage first, then choose the simpler operational model.

## Persistent Volumes

Required persistent data:

- PostgreSQL Docker volume.
- `storage/` directory.
- Backup output directory.

If the app runs in Docker later, `storage/` must be a bind mount or named volume that survives container replacement.

## Backup Plan

Backups must include:

- PostgreSQL dump using `pg_dump`.
- File archive of `storage/`.
- Environment/config backup without exposing secrets publicly.

Use a timestamped backup set so database dump and files can be restored together.

## Restore Plan

Restore must include:

- Restore PostgreSQL dump with `pg_restore` or `psql`, depending on dump format.
- Restore `storage/` to the expected server path.
- Verify file metadata in DB points to existing files.
- Run login and document preview/download smoke checks.

PostgreSQL warns that restoring dumps executes SQL from the source. Restore only trusted dumps or inspect them first.

## Static IP And Hostname Notes

Open decisions:

- Static router DHCP reservation versus manual static IP.
- Local DNS hostname versus direct IP usage.
- Whether HTTPS certificate strategy depends on hostname.

## Firewall Notes

- Allow the app port on private/trusted network only.
- Do not allow PostgreSQL port from public/untrusted networks.
- Verify Windows Firewall profile if the server runs Windows.

## Environment Variable Strategy

Use environment variables for:

- `DATABASE_URL`
- Session cookie secret/signing secret.
- `DMS_SESSION_COOKIE_SECURE` for the explicit session-cookie `Secure` policy override.
- Storage root path.
- App base URL.
- LAN host/port.
- Backup path.

Do not commit secrets. Provide examples only.

`DMS_SESSION_COOKIE_SECURE` behavior:

- unset: keep the default behavior, which uses `Secure` in production or when the request/proxy protocol is HTTPS;
- `true`: force `Secure`;
- `false`: trusted HTTP LAN/local mode only, allowing the browser to store `dms_session` over `http://<SERVER_LAN_IP>:<APP_PORT>`.

Do not expose HTTP LAN mode to the public internet. Final/best-practice deployment should prefer HTTPS with the session cookie `Secure` flag enabled.

## Cookie Auth And Browser Security Posture

Phase 11G.5 reviewed the local cookie-auth posture for trusted LAN deployment:

- `dms_session` is an opaque `HttpOnly`, `SameSite=Lax`, `Path=/` cookie.
- `SameSite=Lax` reduces common cross-site request risk but is not complete CSRF protection.
- Trusted HTTP LAN/local testing may set `DMS_SESSION_COOKIE_SECURE=false`; final/best-practice deployment should prefer HTTPS with `Secure`.
- `dms_active_role` remains UX-only and is not authorization proof.
- Server/API session and role checks remain authoritative.

Before wider browser-accessible rollout, deployment planning must include:

- explicit CSRF/origin strategy for cookie-authenticated state-changing routes;
- app-layer login brute-force/rate-limit protection is implemented as a local single-process in-memory foundation in Phase 11H.2b; reverse-proxy and/or persistent limits remain future hardening if the final topology needs distributed or restart-persistent throttling;
- POST-only or strongly guarded destructive admin cleanup;
- status-aware or narrowed raw logical-path file-access compatibility so `DIMUSNAHKAN` archive access blocking cannot be bypassed.

Phase 11G.6 handoff note:

- Rollback and release-input handoff is recorded in `docs/migration/phase-11g-rollback-release-handoff.md`.
- Preferred final posture remains HTTPS with `Secure` `dms_session` cookies.
- Trusted HTTP LAN with `DMS_SESSION_COOKIE_SECURE=false` is bounded, temporary, and internal/trusted only.
- If LAN smoke or deployment settings are rolled back, stop the app serving process, close any temporary app-port firewall exception if one was added, and confirm PostgreSQL remains not broadly exposed.
- DB and storage rollback must use a matched backup pair unless a human explicitly accepts the mismatch and post-backup divergence risk.

## What Not To Implement Yet

- No Docker Compose yet.
- No app container yet.
- No HTTPS automation yet.
- No backup scripts yet.
- No firewall automation yet.

## References

- Docker Postgres image: https://hub.docker.com/_/postgres
- Docker Compose networking: https://docs.docker.com/compose/how-tos/networking/
- Docker port publishing: https://docs.docker.com/engine/network/port-publishing/
- PostgreSQL `pg_dump`: https://www.postgresql.org/docs/17/app-pgdump.html
- PostgreSQL `pg_restore`: https://www.postgresql.org/docs/current/app-pgrestore.html
- Vite LAN host option: https://vite.dev/config/server-options
