# Best Practices - MVP Project

## Tech Stack
- **Framework**: TanStack Start (TanStack Router + React Start)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Database/Auth/Storage**: local PostgreSQL + local `dms_session` auth + local filesystem storage
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm

---

## 1. Project Structure

### Directory Layout
```
src/
├── router.tsx           # Router configuration (file-based routes)
├── routeTree.gen.ts    # Auto-generated route tree (DO NOT EDIT)
├── styles.css          # Global styles + Tailwind imports
│
├── routes/              # File-based routes (auto-detected)
│   ├── __root.tsx      # Root route - document shell
│   ├── index.tsx       # Route: /
│   ├── about.tsx       # Route: /about
│   ├── posts.tsx       # Layout route for /posts/*
│   ├── posts/
│   │   ├── index.tsx   # Route: /posts/
│   │   └── $postId.tsx # Route: /posts/:postId
│   └── $.tsx           # Wildcard route (catch-all)
│
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card)
│   └── domain/          # Domain-specific components
│
└── lib/                 # Utilities and helpers
    ├── utils.ts        # cn(), formatDate(), etc.
    ├── db.ts           # Local PostgreSQL/Drizzle access
    ├── auth.ts         # Local session helpers
    ├── storage.ts      # Local filesystem storage helpers
    └── validations.ts  # Zod schemas
```

### File Conventions

| File Pattern | Route Type | URL |
|-------------|------------|-----|
| `index.tsx` | Index Route | `/` or `/posts/` |
| `about.tsx` | Static Route | `/about` |
| `$param.tsx` | Dynamic Route | `/posts/:param` |
| `$.tsx` | Wildcard/Splat | `/rest/*` |
| `__root.tsx` | Root Route | (no path, always matched) |
| `posts.tsx` | Layout Route | `/posts` (groups children) |

### Server vs Client Files

```
src/
├── lib/
│   ├── db.server.ts    # Database queries (NEVER import in client)
│   ├── auth.server.ts  # Auth logic (NEVER import in client)
│   └── utils.ts        # Shared utilities (safe everywhere)
├── components/         # Components split by responsibility
│   ├── ServerList.tsx  # Server Component (data fetching)
│   └── ClientForm.tsx # Client Component (interactivity)
└── routes/             # Routes have both server + client
```

---

## 2. Routing Patterns

### File-Based Route Definition
```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  // Client-side config
  beforeLoad: ({ params }) => {
    // Run before component renders
  },

  // Server-side API handlers
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ request, params, context }) => {
        return Response.json({ post: await getPost(params.postId) })
      }
    }
  },

  // Component
  component: PostDetail,
})

function PostDetail() {
  return <div>Post detail page</div>
}
```

### Layout Routes (Grouping)
```tsx
// src/routes/dashboard.tsx (no path = layout only)
export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

// src/routes/dashboard/index.tsx renders inside DashboardLayout
// src/routes/dashboard/settings.tsx renders inside DashboardLayout
```

### Wildcard Routes
```tsx
// src/routes/$.tsx - catch-all for unmatched routes
export const Route = createFileRoute('/$')({
  component: NotFound,
})

function NotFound() {
  return <div>Page not found</div>
}
```

---

## 3. API & Server Functions

### Server Functions (Recommended for Mutations)
```tsx
// src/routes/api/posts.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// GET function
export const getPosts = createServerFn().handler(async () => {
  return db.query('SELECT * FROM posts ORDER BY created_at DESC')
})

// POST function with validation
export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    return db.posts.create(data)
  })

// With middleware
export const deletePost = createServerFn({ method: 'DELETE' })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    return db.posts.delete(data.id, context.session.user.id)
  })
```

### Route API Handlers
```tsx
// For RESTful API endpoints
export const Route = createFileRoute('/api/posts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const posts = await db.query('SELECT * FROM posts')
        return Response.json({ posts })
      },
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ post: await db.posts.create(body) }, { status: 201 })
      },
    }
  }
})
```

### Error Handling
```tsx
export const getPost = createServerFn().handler(async ({ data }) => {
  const post = await db.posts.find(data.id)

  if (!post) {
    throw notFound()
  }

  if (!post.published && !context.session.user.isAdmin) {
    throw new Response('Forbidden', { status: 403 })
  }

  return post
})
```

---

## 4. Data Fetching Patterns

### Server-Side with createServerFn
```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getPost } from './api/posts'

export const Route = createFileRoute('/posts/$postId')({
  beforeLoad: async ({ params }) => {
    const post = await getPost({ data: { id: params.postId } })
    if (!post) throw notFound()
    return { post }
  },
  component: PostDetail,
})

function PostDetail() {
  const { post } = Route.useLoaderData()
  return <PostView post={post} />
}
```

### Client-Side with TanStack Query
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function PostList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(r => r.json()),
  })

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return <PostGrid posts={data.posts} />
}
```

### Optimistic Updates
```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: (newPost) => createPost({ data: newPost }),
  onMutate: async (newPost) => {
    await queryClient.cancelQueries({ queryKey: ['posts'] })
    const previous = queryClient.getQueryData(['posts'])

    queryClient.setQueryData(['posts'], (old) => ({
      posts: [...old.posts, { ...newPost, id: 'temp' }]
    }))

    return { previous }
  },
  onError: (err, newPost, context) => {
    queryClient.setQueryData(['posts'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
})
```

---

## 5. Component Architecture

### Server vs Client Components

**Use Server Components (default) when:**
- Fetching data
- Accessing server resources (DB, filesystem)
- Keeping sensitive logic secure
- Rendering static content

**Use Client Components when:**
- Adding interactivity (onClick, onChange)
- Using React state (useState, useReducer)
- Using browser APIs (window, localStorage)
- Using hooks (useEffect, useCallback)
- Using animations (framer-motion)

### Client Component Declaration
```tsx
// Add 'use client' directive at the top
'use client'

import { useState } from 'react'
import { useActionState } from 'react'

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    async (prev, formData) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })
      return response.json()
    },
    null
  )

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
```

### Component Patterns

```tsx
// 1. Props Typing with Interface
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  onClick
}: ButtonProps) {
  const base = "font-medium rounded-lg transition-colors"
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "bg-transparent hover:bg-gray-100",
  }
  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Composition Pattern
```tsx
function Card({ children, className }) {
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border p-6",
      className
    )}>
      {children}
    </div>
  )
}

Card.Header = function Header({ children }) {
  return <div className="border-b pb-4 mb-4">{children}</div>
}

Card.Content = function Content({ children }) {
  return <div>{children}</div>
}

Card.Footer = function Footer({ children }) {
  return <div className="border-t pt-4 mt-4">{children}</div>
}

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content here</Card.Content>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

---

## 6. TypeScript Patterns

### Discriminated Unions for State
```tsx
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function useRequest<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' })

  const execute = async () => {
    setState({ status: 'loading' })
    try {
      const data = await fetcher()
      setState({ status: 'success', data })
    } catch (error) {
      setState({ status: 'error', error })
    }
  }

  return { state, execute }
}
```

### Zod Validation
```tsx
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.coerce.date(),
})

export type User = z.infer<typeof userSchema>

// Usage in API
export const createUserSchema = z.object({
  email: z.string().email('Email invalid'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
})

export const updatePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
})
```

### useReducer with Type Safety
```tsx
type CounterState = { count: number }
type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'set'; value: number }
  | { type: 'reset' }

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 }
    case 'decrement': return { count: state.count - 1 }
    case 'set': return { count: action.value }
    case 'reset': return { count: 0 }
  }
}

const [state, dispatch] = useReducer(counterReducer, { count: 0 })
```

---

## 7. Tailwind CSS v4 Patterns

### Setup (v4)
```css
/* src/styles.css */
@import "tailwindcss";
```

### Custom Theme
```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  --color-brand-50: oklch(0.97 0.02 261);
  --color-brand-500: oklch(0.55 0.15 261);
  --color-brand-900: oklch(0.25 0.05 261);

  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

### Utility Classes
```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Component Variants
```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
        ghost: "hover:bg-gray-100 focus:ring-gray-500",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)
```

### Dark Mode
```css
/* src/styles.css */
@custom-variant dark (&:where(.dark, .dark *));
```

```tsx
// Theme toggle component
export function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    localStorage.theme || 'system'
  )

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.theme = newTheme
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return <button onClick={toggleTheme}>Toggle {theme}</button>
}
```

### Mobile-First Responsive
```html
<!-- CORRECT: Base styles for mobile, enhance at breakpoints -->
<button className="w-full md:w-auto">
  Submit
</button>

<!-- WRONG: Starting from breakpoint (mobile gets nothing) -->
<button className="sm:w-auto">
  Submit
</button>
```

---

## 8. Legacy Supabase Patterns

This section is retained only as pre-migration reference material. The current DMS runtime uses local PostgreSQL through Drizzle, local `dms_session` cookie auth, local filesystem storage, and local env variables such as `DATABASE_URL`, `SESSION_SECRET`, file-token/storage-root settings, `APP_URL`, `HOST`, and `PORT`.

### Server Client (Server-Side)
```tsx
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

### Browser Client (Client-Side)
```tsx
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}
```

### Auth Middleware
```tsx
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own posts
CREATE POLICY "Users read own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own posts
CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own posts
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own posts
CREATE POLICY "Users delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Public posts are readable by everyone
CREATE POLICY "Public posts readable by all" ON posts
  FOR SELECT USING (published = true);
```

---

## 9. Security Best Practices

### Input Validation (Always Validate)
```tsx
// Server function with validation
export const submitForm = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    email: z.string().email('Email tidak valid'),
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    message: z.string().min(10, 'Pesan minimal 10 karakter').max(1000),
  }))
  .handler(async ({ data }) => {
    // data is guaranteed to be valid
    await sendEmail(data)
    return { success: true }
  })
```

### Authentication Check
```tsx
// src/lib/auth.server.ts
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const requireAuth = createServerFn().handler(async () => {
  const session = await getSession()

  if (!session) {
    throw redirect({ to: '/login' })
  }

  return session
})

// Usage in route
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    return await requireAuth()
  },
})
```

### SQL Injection Prevention
```tsx
// ALWAYS use parameterized queries
// BAD
const result = await db.query(`SELECT * FROM users WHERE id = '${userId}'`)

// GOOD
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
)

// Legacy Supabase example
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', user.id) // Automatically parameterized
```

### XSS Prevention
```tsx
// Always sanitize user input when rendering HTML
import DOMPurify from 'dompurify'

// For rich text content
const sanitizedContent = DOMPurify.sanitize(userHtmlContent, {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'target'],
})
```

---

## 10. Performance Optimizations

### Code Splitting
```tsx
// Lazy load heavy components
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  )
}
```

### Memoization
```tsx
// Use memo for expensive components
import { memo } from 'react'

const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />)
})

// Use useCallback for event handlers passed to memoized children
const handleClick = useCallback((id: string) => {
  doSomething(id)
}, [doSomething])

return <MemoizedButton onClick={handleClick} />
```

### Image Optimization
```tsx
// Always specify dimensions
<img
  src="/api/image?src=photo.jpg"
  width={400}
  height={300}
  alt="Description"
  loading="lazy"
/>

// Or use next/image if available
import Image from 'next/image'
```

### Bundle Size
```bash
# Analyze bundle
pnpm build
npx vite-bundle-visualizer

# Check what to tree-shake
pnpm why <package-name>
```

### Server-Side Rendering
```tsx
// Use SSR for initial page load
export const Route = createFileRoute('/posts')({
  ssr: true, // Default - full SSR with streaming
  beforeLoad: async () => {
    const posts = await getPosts() // Runs on server
    return { posts }
  },
})
```

---

## 11. Error Handling

### Error Boundaries
```tsx
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
```

### API Error Responses
```tsx
// Standard error format
export function errorResponse(message: string, status: number = 400) {
  return Response.json(
    {
      error: true,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

// Usage
export const Route = createFileRoute('/api/posts')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const posts = await getPosts()
          return Response.json({ posts })
        } catch (error) {
          if (error instanceof NotFoundError) {
            return errorResponse('Post tidak ditemukan', 404)
          }
          return errorResponse('Terjadi kesalahan server', 500)
        }
      },
    }
  }
})
```

---

## 12. Testing Patterns

### Component Testing
```tsx
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
```

### API Testing
```tsx
// src/routes/__tests__/api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getPosts } from '../routes/api/posts'

vi.mock('../lib/db', () => ({
  db: {
    query: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Post' }]),
  },
}))

describe('getPosts', () => {
  it('returns posts', async () => {
    const result = await getPosts.handler()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Test Post')
  })
})
```

### E2E Testing with Playwright
```tsx
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('[type="submit"]')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})
```

---

## 13. Git & Version Control

### Commit Messages
```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
style: apply consistent formatting
refactor: extract validation logic
test: add unit tests for validation
chore: update dependencies
```

### Branch Naming
```
feature/user-authentication
fix/login-redirect-bug
hotfix/security-patch
release/v1.0.0
```

### Pull Request Checklist
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] No console.log/debugger
- [ ] Documentation updated
- [ ] Self-reviewed changes

---

## 14. Development Workflow

### Daily Commands
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Type Checking
```bash
# Run TypeScript check
pnpm exec tsc --noEmit

# Or add to scripts
"typecheck": "tsc --noEmit"
```

### Pre-commit Hooks
```bash
# Install Husky
pnpm add -D husky lint-staged
npx husky init

# .husky/pre-commit
pnpm lint-staged
```

---

## Summary

| Category | Best Practice |
|----------|--------------|
| **Structure** | Clear separation: routes/, components/, lib/ |
| **Routing** | File-based with TanStack Router |
| **API** | Use `createServerFn` for type-safe RPC |
| **Data** | Server-side first, TanStack Query for client |
| **Components** | Server by default, client when needed |
| **TypeScript** | Discriminated unions, Zod validation |
| **Styling** | Tailwind v4 + CVA for variants |
| **Database** | Local PostgreSQL through Drizzle |
| **Security** | Always validate, parameterize queries |
| **Performance** | SSR, lazy loading, memoization |
| **Testing** | Unit, integration, and E2E tests |
