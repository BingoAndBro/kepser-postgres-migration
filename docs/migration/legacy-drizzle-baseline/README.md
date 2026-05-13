# Legacy Drizzle Baseline

This folder preserves stale Drizzle migration artifacts that existed before the local PostgreSQL multi-schema migration baseline was regenerated.

These files targeted the older partial Drizzle model and generated application tables in the implicit/public schema. They are kept only for audit/reference context.

They are not active for the new local PostgreSQL migration baseline. Active Drizzle migrations for the local PostgreSQL target are generated under `drizzle/` from `src/db/schema/index.ts`.

Do not apply these legacy files to the local migration database.
