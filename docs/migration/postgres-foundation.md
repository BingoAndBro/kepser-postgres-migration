# PostgreSQL Docker Foundation

This phase adds the local PostgreSQL Docker foundation for the migration branch. It creates a PostgreSQL 16 service, a persistent database volume, and first-run initialization SQL for domain schemas.

This phase does not implement the Drizzle schema yet. It also does not replace Supabase Auth, Supabase Storage, API internals, workflow behavior, or UI behavior.

## Start PostgreSQL

```bash
docker compose -f infra/docker/postgres/docker-compose.yml up -d
```

## Stop PostgreSQL

```bash
docker compose -f infra/docker/postgres/docker-compose.yml down
```

## Inspect Logs

```bash
docker logs -f kepser-postgres
```

## Check Health

```bash
docker exec -it kepser-postgres pg_isready -U kepser -d kepser
```

## Inspect Schemas

Open `psql` inside the container:

```bash
docker exec -it kepser-postgres psql -U kepser -d kepser
```

Then list schemas:

```sql
\dn
```

Expected migration foundation schemas:

```text
auth
master
dokumen
arsip
app
```

These schemas are for domain separation only. Authorization remains enforced in API/server code, and PostgreSQL RLS is intentionally deferred.

## Persistence

PostgreSQL data is stored in the named Docker volume `kepser_postgres_data`. The volume persists across `docker compose down` and container recreation.

Deleting the named volume deletes local database data:

```bash
docker volume rm kepser_postgres_data
```

Use volume deletion only when intentionally resetting the local database.

## App Runtime

The app still runs on the host in this phase. App containerization is intentionally deferred until database, auth, and storage behavior are stable.
