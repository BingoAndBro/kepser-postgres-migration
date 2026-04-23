# Best Practices: DMS MVP Tech Stack

Best practice document untuk proyek DMS (Dynamic Document Workflow Management System) menggunakan TanStack Start, Drizzle ORM, Supabase, shadcn/ui, dan Zod.

## Tech Stack Overview

| Layer | Teknologi | Catatan |
|---|---|---|
| **Framework** | TanStack Start (SSR) | File-based routing, server functions built-in |
| **Language** | TypeScript | Type safety di seluruh stack |
| **Database** | Supabase (PostgreSQL) | Managed DB, RLS built-in |
| **Auth** | Supabase Auth | JWT + RLS native |
| **File Storage** | Supabase Storage | 1GB free tier |
| **ORM** | Drizzle ORM | Type-safe query, schema-as-code |
| **UI Components** | shadcn/ui | Headless + styled, copy-paste |
| **Validation** | Zod | Schema validation: form → API → DB |
| **Hosting** | Vercel | Deploy TanStack Start MVP |
| **Package Manager** | pnpm | Wajib digunakan |

---

## 1. TanStack Start Best Practices

### 1.1 File Structure & Routing

TanStack Start menggunakan file-based routing. Ikuti struktur berikut:

```
src/
├── routes/
│   ├── index.tsx              # /
│   ├── login.tsx             # /login
│   ├── dokumen/
│   │   ├── index.tsx         # /dokumen
│   │   ├── new.tsx           # /dokumen/new
│   │   └── $id.tsx           # /dokumen/:id
│   └── api/
│       └── dokumen.ts        # Server function
├── components/
│   └── *.tsx                 # Smart components
└── lib/
    ├── db/
    ├── schemas/
    └── supabase.ts
```

### 1.2 Server Functions

Gunakan `createServerFn` untuk semua data fetching dan mutations:

```typescript
// src/routes/api/dokumen.ts
import { createServerFn } from "@tanstack/react-start/server";
import { db } from "~/lib/db";
import { dokumenTransaksi } from "~/lib/db/schema";
import { z } from "zod";

const CreateDokumenSchema = z.object({
  judul: z.string().min(1).max(255),
  fungsi_id: z.string().uuid(),
  kegiatan_jenis_id: z.string().uuid(),
  is_ketua_tim: z.boolean(),
});

export const createDokumen = createServerFn({
  method: "POST",
})
  .validator(CreateDokumenSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const [result] = await db
      .insert(dokumenTransaksi)
      .values({
        ...data,
        created_by: user.id,
        status: "DRAFT",
      })
      .returning();

    return result;
  });
```

### 1.3 Data Fetching

Gunakan `createServerFn` + TanStack Query untuk caching:

```typescript
// Di component
const queryClient = useQueryClient();
const dokumenQuery = useQuery({
  queryKey: ["dokumen", id],
  queryFn: () => getDokumen.query({ id }),
});
```

### 1.4 Route Groups

Gunakan route groups untuk middleware (auth, role checking):

```typescript
// src/routes/_dashboard/dokumen/index.tsx
// _dashboard prefix = authenticated routes
```

---

## 2. Drizzle ORM Best Practices

### 2.1 Schema Definition

Definisikan schema di `src/lib/db/schema/`:

```typescript
// src/lib/db/schema/dokumen.ts
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const dokumenTransaksi = pgTable("dokumen_transaksi", {
  id: uuid("id").primaryKey().defaultRandom(),
  kegiatan_id: uuid("kegiatan_id").references(() => kegiatan.id),
  kelengkapan_id: uuid("kelengkapan_id").references(() => masterKelengkapanDokumen.id),
  judul: text("judul").notNull(),
  fungsi_id: uuid("fungsi_id").references(() => masterFungsi.id),
  kegiatan_jenis_id: uuid("kegiatan_jenis_id").references(() => masterKegiatan.id),
  is_ketua_tim: boolean("is_ketua_tim").notNull().default(false),
  status: text("status").notNull().default("DRAFT"),
  current_step: text("current_step"), // 'PPK' | 'BENDAHARA' | null
  revision_target: text("revision_target"), // 'USER' | 'PPK' | null
  lampiran_urls: jsonb("lampiran_urls").default("[]"),
  created_by: uuid("created_by").notNull().references(() => authUsers.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

### 2.2 Query Patterns

**Select dengan relations:**

```typescript
const result = await db.query.dokumenTransaksi.findMany({
  where: eq(dokumenTransaksi.status, "DRAFT"),
  with: {
    kegiatan: true,
    fungsi: true,
  },
});
```

**Insert dengan returning:**

```typescript
const [newDokumen] = await db
  .insert(dokumenTransaksi)
  .values(data)
  .returning();
```

**Update dengan where:**

```typescript
await db
  .update(dokumenTransaksi)
  .set({ status: "IN_PPK_VALIDATION", updated_at: new Date() })
  .where(eq(dokumenTransaksi.id, id));
```

### 2.3 Transactions

Gunakan transactions untuk operasi multi-step:

```typescript
import { transaction } from "~/lib/db";

const result = await transaction(async (tx) => {
  const [dokumen] = await tx
    .insert(dokumenTransaksi)
    .values(data)
    .returning();

  await tx.insert(logAktivitas).values({
    dokumen_id: dokumen.id,
    user_id: user.id,
    aksi: "CREATE",
    step_urutan: 0,
  });

  return dokumen;
});
```

### 2.4 Migrations

```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate

# Push schema (development only)
pnpm drizzle-kit push
```

---

## 3. Supabase Best Practices

### 3.1 Row Level Security (RLS)

**WAJIKAN RLS di semua tabel.** Contoh kebijakan untuk `dokumen_transaksi`:

```sql
-- Enable RLS
ALTER TABLE dokumen_transaksi ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat dokumen miliknya
CREATE POLICY "Users can view own documents" ON dokumen_transaksi
  FOR SELECT USING (auth.uid() = created_by);

-- Policy: PPK bisa lihat semua dokumen
CREATE POLICY "PPK can view all documents" ON dokumen_transaksi
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      JOIN roles ON roles.id = user_roles.role_id
      WHERE user_roles.user_id = auth.uid()
      AND roles.nama = 'PPK'
    )
  );
```

### 3.2 Auth Integration

```typescript
// src/lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
  );
}
```

### 3.3 Storage

Gunakan Supabase Storage untuk lampiran:

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from("dokumen-lampiran")
  .upload(`${userId}/${dokumenId}/${fileName}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from("dokumen-lampiran")
  .getPublicUrl(`${userId}/${dokumenId}/${fileName}`);
```

### 3.4 Realtime (Optional)

Untuk live updates:

```typescript
const channel = supabase
  .channel("dokumen-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "dokumen_transaksi",
      filter: `created_by=eq.${userId}`,
    },
    (payload) => {
      queryClient.invalidateQueries(["dokumen"]);
    }
  )
  .subscribe();
```

---

## 4. shadcn/ui Best Practices

### 4.1 Component Installation

```bash
# Install komponen individual
npx shadcn@latest add button card dialog form input table

# Atau tambahkan semua yang diperlukan
npx shadcn@latest add -y button card dialog dropdown-menu form input label select table tabs toast
```

### 4.2 Form Integration dengan Zod

```typescript
// src/lib/schemas/dokumen.ts
import { z } from "zod";

export const createDokumenSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi").max(255),
  fungsi_id: z.string().uuid("Fungsi wajib dipilih"),
  kegiatan_jenis_id: z.string().uuid("Kegiatan wajib dipilih"),
  is_ketua_tim: z.boolean(),
  lampiran_urls: z.array(z.object({
    nama: z.string(),
    url: z.string().url(),
    tipe: z.string(),
    ukuran: z.number(),
  })).default([]),
});

// React Hook Form + Zod resolver
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDokumenSchema } from "~/lib/schemas/dokumen";

const form = useForm({
  resolver: zodResolver(createDokumenSchema),
  defaultValues: {
    judul: "",
    fungsi_id: "",
    kegiatan_jenis_id: "",
    is_ketua_tim: false,
    lampiran_urls: [],
  },
});
```

### 4.3 Component Composition

```typescript
// Bad
<Button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600">
  <Icon /> Submit
</Button>

// Good - Gunakan preset dan composable API
<Button className="gap-2">
  <Icon />
  Submit
</Button>
```

### 4.4 Dark Mode

shadcn/ui mendukung dark mode out-of-the-box:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  // ...
} satisfies Config;
```

---

## 5. Zod Best Practices

### 5.1 Schema Organization

```
src/lib/schemas/
├── index.ts           # Export semua schema
├── dokumen.ts         # Schema untuk dokumen
├── user.ts            # Schema untuk user
└── api.ts            # Schema untuk API validation
```

### 5.2 Shared Schemas

Gunakan shared schemas untuk form, API, dan DB:

```typescript
// src/lib/schemas/dokumen.ts
import { z } from "zod";

export const lampiranSchema = z.object({
  nama: z.string(),
  url: z.string().url(),
  tipe: z.string(),
  ukuran: z.number(),
});

export const createDokumenSchema = z.object({
  judul: z.string().min(1).max(255),
  fungsi_id: z.string().uuid(),
  kegiatan_jenis_id: z.string().uuid(),
  is_ketua_tim: z.boolean(),
  lampiran_urls: z.array(lampiranSchema).default([]),
});

// Re-export untuk convenience
export type CreateDokumenInput = z.infer<typeof createDokumenSchema>;
```

### 5.3 Error Handling

```typescript
try {
  const validated = createDokumenSchema.parse(formData);
} catch (error) {
  if (error instanceof z.ZodError) {
    const fieldErrors = error.errors.reduce((acc, err) => {
      acc[err.path.join(".")] = err.message;
      return acc;
    }, {});
    // Tampilkan error di form
  }
}
```

---

## 6. Security Best Practices

### 6.1 Environment Variables

```bash
# .env - Local development
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**PERINGATAN: Jangan pernah commit .env ke git!**

### 6.2 Server-Side Only

```typescript
// Bendaharam - Server-side only
const supabase = createServerClient();

// Browser - Client-side only
const supabase = createBrowserClient(); // Hanya gunakan anon key
```

### 6.3 Input Validation

**Selalu validasi di server function:**

```typescript
export const someAction = createServerFn({
  method: "POST",
})
  .validator(SomeSchema) // Zod validator
  .handler(async ({ data }) => {
    // Data sudah divalidasi
    // ...
  });
```

### 6.4 RBAC

Lakukan pengecekan role di server:

```typescript
export const getDokumenForPpk = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const hasPpkRole = await checkUserRole(user.id, "PPK");
    if (!hasPpkRole) throw new Error("Forbidden");

    // Logic here
  });
```

---

## 7. Performance Best Practices

### 7.1 Database Indexes

```typescript
// Tambahkan indexes untuk query yang sering
export const dokumenTransaksi = pgTable("dokumen_transaksi", {
  // ... columns
  status: text("status"),
  created_by: uuid("created_by"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  createdByIdx: index("created_by_idx").on(table.created_by),
  fungsiIdx: index("fungsi_idx").on(table.fungsi_id),
}));
```

### 7.2 Query Optimization

```typescript
// Bad - N+1 query
const dokumens = await db.select().from(dokumenTransaksi);
for (const doc of dokumens) {
  doc.fungsi = await db.select().from(masterFungsi).where(eq(masterFungsi.id, doc.fungsi_id));
}

// Good - Gunakan JOIN/relations
const dokumens = await db.query.dokumenTransaksi.findMany({
  with: {
    fungsi: true,
    kegiatan: true,
  },
});
```

### 7.3 Caching dengan TanStack Query

```typescript
const { data } = useQuery({
  queryKey: ["dokumen", id],
  queryFn: () => fetchDokumen(id),
  staleTime: 1000 * 60 * 5, // 5 menit
  gcTime: 1000 * 60 * 30, // 30 menit
});
```

---

## 8. Project Structure

```
d:\GitHub\mvp\
├── AGENTS.md                    # Project Constitution - HUKUM
├── docs/
│   ├── routing-sop.md
│   ├── drizzle-schema.md
│   ├── supabase-rls.md
│   └── *-best-practices.md    # Dokumen ini
├── src/
│   ├── routes/                # TanStack file-based routes & server functions
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── _dashboard/        # Authenticated routes
│   │   │   ├── dokumen/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── $id.tsx
│   │   │   └── admin/
│   │   └── api/               # Server functions
│   │       └── dokumen.ts
│   ├── components/           # Smart components (business logic)
│   │   ├── dokumen/
│   │   │   ├── DokumenForm.tsx
│   │   │   └── DokumenList.tsx
│   │   └── ui/               # shadcn/ui components
│   │       ├── button.tsx
│   │       └── ...
│   └── lib/
│       ├── db/
│       │   ├── index.ts      # Drizzle client
│       │   ├── schema/       # Schema definitions
│       │   │   ├── index.ts
│       │   │   ├── dokumen.ts
│       │   │   ├── user.ts
│       │   │   └── ...
│       │   └── migrations/   # SQL migrations
│       ├── schemas/          # Zod schemas
│       │   ├── index.ts
│       │   ├── dokumen.ts
│       │   └── user.ts
│       ├── fsm.ts           # Document status FSM
│       └── supabase.ts      # Supabase clients
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── functions/           # Edge functions
└── .env                     # Environment variables
```

---

## 9. Testing Best Practices

### 9.1 Component Testing

```typescript
import { render, screen } from "@testing-library/react";
import { DokumenForm } from "./DokumenForm";

test("should show validation error when judul is empty", async () => {
  render(<DokumenForm />);

  const submitButton = screen.getByRole("button", { name: /submit/i });
  await userEvent.click(submitButton);

  expect(await screen.findByText(/judul wajib diisi/i)).toBeInTheDocument();
});
```

### 9.2 API Testing

```typescript
import { createDokumen } from "~/routes/api/dokumen";

test("should create dokumen with valid data", async () => {
  const result = await createDokumen({
    judul: "Test Dokumen",
    fungsi_id: "valid-uuid",
    kegiatan_jenis_id: "valid-uuid",
    is_ketua_tim: false,
  });

  expect(result).toHaveProperty("id");
  expect(result.status).toBe("DRAFT");
});
```

---

## 10. Deployment Best Practices

### 10.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "tanstack-start",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### 10.2 Environment Variables di Vercel

Set environment variables di Vercel Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (jika needed, set sebagai secret)

---

*Document version: 1.0.0*
*Last updated: 2026-04-18*