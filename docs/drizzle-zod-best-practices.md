# Drizzle ORM + Zod + TanStack Start Best Practices

> Research compiled using Context7 MCP (Upstash) — April 2026. Libraries researched:
> `drizzle-team/drizzle-orm`, `colinhacks/zod`, `websites/tanstack_start`, `supabase/ssr`.
>
> Current-runtime note, 2026-05-19: Supabase SSR examples in this document are legacy/pre-migration reference material. The active DMS migration runtime uses local PostgreSQL through Drizzle, local `dms_session` auth, local filesystem storage, and local env variables rather than `@supabase/ssr`.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Schema Design (Drizzle)](#2-schema-design-drizzle)
3. [Migrations](#3-migrations)
4. [Zod Schemas (with Drizzle)](#4-zod-schemas-with-drizzle)
5. [Legacy Supabase SSR Auth Integration](#5-legacy-supabase-ssr-auth-integration)
6. [Drizzle + Legacy Supabase Patterns](#6-drizzle--legacy-supabase-patterns)
7. [Type Safety](#7-type-safety)
8. [Common Patterns & Anti-Patterns](#8-common-patterns--anti-patterns)

---

## 1. Architecture

### Recommended Stack

| Layer | Technology |
|---|---|
| Full-stack framework | TanStack Start (React or Solid) |
| ORM | Drizzle ORM |
| Database | Local PostgreSQL |
| Validation | Zod |
| Auth | Local `dms_session` cookie auth |

### Key Architectural Principles

- **Server Functions over API Routes**: TanStack Start `createServerFn` keeps sensitive logic on the server. Use loaders for data fetching, server functions for mutations.
- **Type-safe boundaries**: Zod schemas at API boundaries, Drizzle types for DB operations. Never let raw JSON flow unchecked through the stack.
- **Server/API authorization as the security perimeter**: local `dms_session` checks and role validation are authoritative; PostgreSQL RLS is not the current runtime boundary.
- **Co-locate schema files**: Keep Drizzle schema in `src/db/schema.ts` alongside the DB client.

### Directory Structure (Recommended)

```
src/
  db/
    schema.ts        # Drizzle table definitions
    index.ts         # Drizzle client instance
  lib/
    auth/            # local session helpers
    storage/         # local filesystem storage helpers
  routes/
    $.tsx             # File-based TanStack Start routes
  server/
    auth.ts          # Server functions for auth
    queries.ts       # Server functions for data access
```

---

## 2. Schema Design (Drizzle)

### Defining Tables

Drizzle supports both SQL-like (DDL-first) and relational (ORM-style) APIs. Use the relational API for complex queries.

```typescript
// src/db/schema.ts
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  index,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  name: text('name').notNull(),
  role: varchar('role', { length: 32 }).notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Index for frequently queried columns
export const usersEmailIdx = index('users_email_idx', table.email)

// Relationships defined via references
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 256 }).notNull(),
  content: text('content').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Indexes and composite keys
export const postsAuthorIdx = index('posts_author_idx', table.authorId)
export const postsPublishedIdx = index('posts_published_idx', [
  table.publishedAt,
  table.authorId,
])
```

### Best Practices

- **Always define explicit indexes** on foreign keys and columns used in WHERE clauses.
- **Use `$type<T>()**` for JSON columns to preserve TypeScript generics on deserialized data.
- **Co-locate related tables** in the same schema file; split by domain (auth, billing, content) for large projects.
- **Prefer `timestamp` with timezone** for all time-related columns.
- **Use `uuid` from `pg-extension`** for user-facing IDs; use serial for internal join keys.

---

## 3. Migrations

### Drizzle Kit Configuration

Create `drizzle.config.ts` at the project root:

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Migration Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema directly (dev only — never in production)
npx drizzle-kit push

# Apply migrations to database
npx drizzle-kit migrate

# Open visual schema editor
npx drizzle-kit studio

# Detect drift between schema and DB
npx drizzle-kit check
```

### Custom Migration Table

```typescript
// Custom table for migrations
await migrate(db, {
  migrationsFolder: './drizzle',
  migrationsTable: 'my_migrations',
})

// Custom schema (PostgreSQL only)
await migrate(db, {
  migrationsFolder: './drizzle',
  migrationsSchema: 'custom',
})
```

### Migration Best Practices

- **Review generated SQL** before applying — do not blindly run migrations in production.
- **Use named migrations** (`drizzle-kit generate --name add_users_table`) for traceability.
- **Never modify existing migration files** after they are applied — create a new migration instead.
- **Test migrations locally first** against a staging database.
- **Keep the `drizzle` folder in version control** alongside schema files.

---

## 4. Zod Schemas (with Drizzle)

### Generate Zod Schemas from Drizzle Tables

Use `@drizzle/zod` to auto-generate insert/update/select schemas from your Drizzle tables. This guarantees your validation layer and DB schema never diverge.

```typescript
// src/lib/schemas.ts
import { createInsertSchema, createUpdateSchema, createSelectSchema } from 'drizzle-zod'
import { users, posts } from '@/db/schema'
import * as z from 'zod'

// Auto-generated from Drizzle schema — no manual sync needed
export const InsertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
})

export const UpdateUserSchema = createUpdateSchema(users, {
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
})

export const SelectUserSchema = createSelectSchema(users)

// Infer TypeScript types from Zod schemas
export type InsertUser = z.infer<typeof InsertUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>
```

### Combining Zod with Drizzle Insert Types

For full type safety, use `z.infer` alongside Drizzle's `$inferInsert`:

```typescript
import type { $inferInsert } from 'drizzle-orm'

type InsertUser = $inferInsert<typeof users>

// Zod schema for API input — validated at the boundary
const UserRegistrationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(256),
  password: z.string().min(8),
})

// Parse at server function entry, then use with Drizzle
export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(UserRegistrationSchema)
  .handler(async ({ data }) => {
    const parsed = UserRegistrationSchema.parse(data)
    const [user] = await db.insert(users).values(parsed).returning()
    return user
  })
```

### Zod Validation Patterns

```typescript
// Preprocess — accept string or number for ID fields
const UserIdSchema = z.preprocess(
  (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
  z.number().int().positive()
)

// Transforms — normalize data after validation
const NormalizedEmailSchema = z.string()
  .email()
  .transform((email) => email.toLowerCase().trim())

// Discriminated unions — for typed API responses
const ApiResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: SelectUserSchema }),
  z.object({ status: z.literal('error'), message: z.string() }),
])

// Async refinement — for uniqueness checks
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await db.query.users.findFirst({ where: eq(users.email, email) })
    return !exists
  },
  { message: 'Email already registered' }
)

// superRefine — multiple validation issues at once
const TagsSchema = z.array(z.string()).superRefine((arr, ctx) => {
  if (arr.length < 1) ctx.addIssue({ code: 'too_small', minimum: 1, message: 'At least one tag' })
  if (new Set(arr).size !== arr.length) ctx.addIssue({ code: 'custom', message: 'No duplicates' })
})
```

### Safe Parse vs Parse

```typescript
// Use safeParse for user-facing endpoints — never let Zod throw at the API boundary
const result = UserRegistrationSchema.safeParse(data)
if (!result.success) {
  return { error: result.error.flatten() }
  // Return structured field errors to the client
}

// Use parse for trusted internal data or server-to-server calls
const trusted = SomeSchema.parse(internalData)
```

---

## 5. Legacy Supabase SSR Auth Integration

This section is preserved for historical migration context only. Do not use it as current DMS setup guidance.

### Core Concept

`@supabase/ssr` handles cookie-based session management for SSR frameworks. It consolidates the deprecated `@supabase/auth-helpers-*` packages into a single framework-agnostic library.

### Middleware — Token Refresh on Every Request

The middleware runs on every request and uses `createServerClient` with full cookie read/write access.

```typescript
// middleware.ts (TanStack Start / Next.js compatible)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always use getUser() — not getSession() — to verify the JWT server-side
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}
```

### Server Components — Read-Only Cookie Access

In server-side route handlers and components, use `cookies()` from the framework to get a read-only view.

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to ignore in Server Components — middleware handles session refresh
          }
        },
      },
    }
  )
}
```

### Browser Client — Auto Cookie Management

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### AuthKit / TanStack Start Session Pattern

TanStack Start uses `createServerFn` with session storage (e.g., `@tanstack/react-start` session helpers):

```typescript
// server/auth.ts
import { createServerFn } from '@tanstack/solid-start'
import { redirect } from '@tanstack/solid-router'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (!authData.user) return { error: 'Invalid credentials' }

    const session = await useAppSession()
    await session.update({ userId: authData.user.id, email: authData.user.email })
    throw redirect({ to: '/dashboard' })
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/' })
})

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await useAppSession()
  const userId = session.get('userId')
  if (!userId) return null
  return await getUserById(userId)
})
```

### Critical Rules

- **Use `getUser()` not `getSession()`** in middleware and server-side code. `getSession()` reads the cookie without verifying the JWT. `getUser()` calls the Supabase Auth server to validate the token.
- **Always return `supabaseResponse`** from middleware — do not create a new `NextResponse` and discard the original, or the session will desynchronize.
- **Set `Cache-Control: private, no-store`** on authenticated responses to prevent CDN caching.
- **Do not use global Supabase client variables** in serverless/Fluid compute environments — always create per-request clients.

---

## 6. Drizzle + Legacy Supabase Patterns

The current DMS runtime connects Drizzle to local PostgreSQL through `DATABASE_URL`. Supabase-specific connection examples below are historical/reference patterns.

### Connecting Drizzle to Supabase Postgres

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

Or via Supabase edge-compatible driver (Neon, Supabase Branch):

```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

### Type-Safe Queries

```typescript
// Relational API — fetch with nested relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
})

// Nested relations with filters
const userWithDetails = await db.query.users.findFirst({
  where: eq(schema.users.id, 1),
  with: {
    posts: {
      with: {
        comments: {
          with: { author: true },
        },
      },
    },
  },
})

// Pagination
const paginatedUsers = await db.query.users.findMany({
  limit: 10,
  offset: 0,
  orderBy: desc(schema.users.createdAt),
  with: {
    posts: { columns: { id: true, title: true }, limit: 3 },
  },
})
```

### Transactions

```typescript
// Atomic transaction — rollback on any failure
await db.transaction(async (tx) => {
  const [newUser] = await tx.insert(users).values({ name: 'John', email: 'john@example.com' }).returning()
  await tx.insert(posts).values({
    title: 'First Post',
    content: 'Hello World',
    authorId: newUser.id,
  })
})

// With isolation level
await db.transaction(
  async (tx) => {
    await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} - 100` })
      .where(eq(accounts.userId, fromUserId))
    await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} + 100` })
      .where(eq(accounts.userId, toUserId))
  },
  { isolationLevel: 'serializable' }
)
```

### Prepared Statements

```typescript
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user_by_id')

const user = await getUserById.execute({ id: 1 })
```

### Row Level Security with Supabase

Configure RLS on your Supabase tables, then let Drizzle write data normally — Supabase enforces access:

```sql
-- profiles table with RLS
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
)

alter table public.profiles enable row level security

-- Public profiles readable by anyone
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true)

-- Users can only insert/update their own profile
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id)

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id)
```

### Auth Trigger — Auto-create Profile on Signup

```sql
create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  return new
end;
$$ language plpgsql security definer

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user()
```

---

## 7. Type Safety

### Drizzle Type Inference

```typescript
// $inferSelect — return type when querying
type SelectUser = typeof users.$inferSelect

// $inferInsert — type for inserting data
type InsertUser = typeof users.$inferInsert

// With custom JSON types
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  metadata: jsonb('metadata').$type<Record<string, string>>(), // Typed JSON
})

type AccountMeta = $inferSelect<typeof accounts>['metadata'] // Record<string, string>
```

### Zod Type Inference

```typescript
// z.infer — parsed output type
type User = z.infer<typeof UserSchema>       // { email: string; name: string; ... }
type Output = z.output<typeof StringToNum>   // For transform schemas: number

// z.input — raw input before validation
type RawUser = z.input<typeof UserSchema>    // same as output if no transforms
```

### Bridging Drizzle and Zod

```typescript
import { createInsertSchema } from 'drizzle-zod'
import type { $inferInsert } from 'drizzle-orm'

const InsertPostSchema = createInsertSchema(posts, {
  title: (schema) => schema.min(1).max(256),
})

type InsertPost = z.infer<typeof InsertPostSchema>
// This is identical to: $inferInsert<typeof posts>
```

### Server Function Input Validation

```typescript
import { zodValidator } from '@tanstack/react-start'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().min(1),
})

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator(zodValidator(CreatePostSchema))
  .handler(async ({ data }) => {
    // data is fully typed: { title: string; content: string }
    const [post] = await db.insert(posts).values(data).returning()
    return post
  })
```

---

## 8. Common Patterns & Anti-Patterns

### TanStack Start — Correct Loader Usage

```typescript
// ✅ CORRECT: Server functions keep secrets server-side
const getUsersSecurely = createServerFn().handler(() => {
  const secret = process.env.SECRET // Server-only, never exposed to client
  return db.select().from(users).all()
})

export const Route = createFileRoute('/users')({
  loader: () => getUsersSecurely(), // Isomorphic call — works on server and client
})

// ❌ WRONG: Loaders run on both server AND client
export const Route = createFileRoute('/users')({
  loader: () => {
    const secret = process.env.SECRET // LEAKED TO CLIENT BUNDLE
    return fetch(`/api?key=${secret}`)
  },
})
```

### TanStack Start — SSR Modes

```typescript
// Default SSR — full server rendering (recommended for SEO-sensitive pages)
export const Route = createFileRoute('/blog/$postId')()

// data-only SSR — loader runs on server, component on client
export const Route = createFileRoute('/posts/$postId')({
  ssr: 'data-only', // Ideal for dashboard/UI pages
  loader: ({ params }) => fetchPost(params.postId),
})
```

### TanStack Query + TanStack Start Loader Integration

```typescript
import { queryOptions } from '@tanstack/react-query'

const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
  })

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.postId)),
})

function Post() {
  const { postId } = Route.useParams()
  const { data } = useQuery(postQueryOptions(postId)) // Uses pre-fetched cache
}
```

### Supabase Auth — Anti-Patterns

```typescript
// ❌ WRONG: getSession() is unverified
const { data: { session } } = await supabase.auth.getSession()

// ✅ CORRECT: getUser() verifies the JWT
const { data: { user } } = await supabase.auth.getUser()

// ❌ WRONG: Global client in serverless
const supabase = createServerClient(...) // DO NOT store in global

// ✅ CORRECT: Create per-request
export async function handler(request: Request) {
  const supabase = createServerClient(...) // Fresh per request
}
```

### Zod — Anti-Patterns

```typescript
// ❌ WRONG: Throwing at the API boundary
const user = UserSchema.parse(input) // throws ZodError — handle gracefully

// ✅ CORRECT: safeParse for user-facing endpoints
const result = UserSchema.safeParse(input)
if (!result.success) return { error: result.error.flatten() }
const user = result.data

// ❌ WRONG: Missing error path for async refinements
await UniqueEmailSchema.parse(email) // must use parseAsync

// ✅ CORRECT: parseAsync for async refinements
await UniqueEmailSchema.parseAsync(email)

// ❌ WRONG: mutate() without typed validator
const mutationFn = createServerFn({ method: 'POST' }).handler(...)

// ✅ CORRECT: Always validate with Zod at the input boundary
.inputValidator(zodValidator(CreatePostSchema))
```

### Drizzle — Anti-Patterns

```typescript
// ❌ WRONG: Insert without returning — no feedback
await db.insert(users).values(userData)

// ✅ CORRECT: Always return the inserted row for type safety
const [user] = await db.insert(users).values(userData).returning()

// ❌ WRONG: Missing indexes on FK columns
authorId: integer('author_id').references(() => users.id) // No index

// ✅ CORRECT: Explicit index on FK for JOIN performance
authorId: integer('author_id').notNull().references(() => users.id)
export const postsAuthorIdx = index('posts_author_idx', table.authorId)

// ❌ WRONG: Raw SQL interpolation
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)

// ✅ CORRECT: Parameterized queries via sql template tag
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${sql.placeholder('id')}`, { id: userId })
```

---

## Quick Reference

| Concern | Solution |
|---|---|
| Auth state in runtime | Local `dms_session` cookie checked by server/API helpers |
| DB schema as code | Drizzle `pgTable` + `drizzle-kit generate` |
| API input validation | `drizzle-zod` + `z.infer` |
| Server-only secrets | `createServerFn`, never in loader |
| Type from DB to client | `$inferSelect` / `$inferInsert` + Zod `z.infer` |
| Migrations | `drizzle-kit generate` + review SQL + `drizzle-kit migrate` |
| Session management | Opaque local cookie sessions; never localStorage for session credentials |
| Data access in routes | Relational API `db.query.X.findMany({ with: ... })` |
| Optimistic UI | TanStack Query `useMutation` with `onMutate` |
| Authorization enforcement | Server/API role checks against local session and local PostgreSQL |

---

*Document generated from Context7 documentation research. For the latest API details, always consult the official docs: [Drizzle](https://orm.drizzle.team), [Zod](https://zod.dev), [TanStack Start](https://tanstack.com/start), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).*
