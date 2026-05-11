# Routing and API Auth SOP

## Phase 10 API Hardening

- API endpoints return `401` or `403` for auth failures. API handlers must not redirect.
- Signed URL endpoints must validate an authenticated session before creating storage signed URLs.
- Generic document signed URL endpoints may serve a storage path only when the path belongs to the current user, or when the current user has a document workflow role (`PPK`, `BENDAHARA`, `ARSIPARIS`).
- `rename-pending` must only formalize files for the current user and the target document must belong to that user.
- Master data `GET` endpoints are intentionally readable by the authenticated app UX and may remain public only when marked clearly in the endpoint.
- Role workspace parent routes (`/ppk`, `/bendahara`, `/arsiparis`, `/admin`) use a lightweight synchronous `beforeLoad` guard in client mode. The guard reads the AppLayout-fed client auth snapshot and must not call Supabase or other async APIs.
- If the client auth snapshot is not initialized yet, route guards defer to the existing AppLayout loading/login flow. API handlers remain the security enforcement layer for direct access.
- Client route guards must check `authState.isReady` before redirecting. When `isReady` is `false`, guards return without redirecting and emit debug logs for execution-order visibility.
- Role route guards use the curried form `guardRole(role)(ctx)` so each guard reads the auth snapshot once and calls `requireAuth` once.
