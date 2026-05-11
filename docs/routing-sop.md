# Routing and API Auth SOP

## Phase 10 API Hardening

- API endpoints return `401` or `403` for auth failures. API handlers must not redirect.
- Signed URL endpoints must validate an authenticated session before creating storage signed URLs.
- Generic document signed URL endpoints may serve a storage path only when the path belongs to the current user, or when the current user has a document workflow role (`PPK`, `BENDAHARA`, `ARSIPARIS`).
- `rename-pending` must only formalize files for the current user and the target document must belong to that user.
- Master data `GET` endpoints are intentionally readable by the authenticated app UX and may remain public only when marked clearly in the endpoint.
