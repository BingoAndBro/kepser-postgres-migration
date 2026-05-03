# Section 05: Profile Page

## Context

Halaman baru untuk user melihat profil mereka sendiri dan mengganti password. Accessible oleh semua authenticated user.

## Objective

Buat halaman `/profile` dengan:
- Display user info (name, email, NIP, departemen, roles)
- Change password form
- Read-only display (tidak bisa edit langsung)

## Prerequisites
- Section 03 (User API) harus selesai dan working

## Implementation Steps

### 1. Create page file

Create `src/routes/profile.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'
import { PageLayout } from '#/components/dashboard/PageLayout'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
  beforeLoad: async (event) => {
    const cookieHeader = event.request.headers.get('cookie')
    const supabase = createServerSupabaseClient(event, cookieHeader)
    const session = await getServerSession(supabase)
    if (!session) {
      throw redirect({ to: '/login' })
    }
  }
})
```

### 2. Fetch profile data (SSR)

```typescript
async function ProfilePage() {
  const data = await useRouteLoaderData('routes/profile')

  return (
    <PageLayout>
      {/* Profile Card */}
      <div className="card">
        <div className="avatar">{/* initials */}</div>
        <h2>{data.user.metadata.nama_lengkap}</h2>
        <p>{data.user.email}</p>
        <div className="roles">
          {data.user.roles.map(role => (
            <Badge key={role}>{role}</Badge>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <dl>
          <dt>Email</dt>
          <dd>{data.user.email}</dd>
          <dt>NIP/NRP</dt>
          <dd>{data.user.metadata.nip_nrp}</dd>
          <dt>Departemen</dt>
          <dd>{data.user.metadata.departemen ?? '-'}</dd>
        </dl>
      </div>

      {/* Change Password Form */}
      <div className="card">
        <h3>Ganti Password</h3>
        <form>
          <Input label="Password Lama" type="password" />
          <Input label="Password Baru" type="password" />
          <Input label="Konfirmasi Password" type="password" />
          <Button type="submit">Simpan</Button>
        </form>
      </div>
    </PageLayout>
  )
}
```

### 3. Add route to routeTree

Route automatically registered via TanStack Router file convention. No manual routeTree update needed.

### 4. Add link in navigation

Update sidebar navigation untuk show profile link untuk semua user.

## Files to Create/Modify
- `src/routes/profile.tsx` — new
- Navigation component — add profile link

## Test Stubs
- [ ] Page loads with own profile data
- [ ] Profile displays name, email, NIP, roles
- [ ] Change password form submits successfully
- [ ] Wrong old password shows error
- [ ] Short new password shows error
- [ ] Unauthenticated access redirects to login

## Definition of Done
- [ ] Profile page created at /profile
- [ ] Profile displays all user info
- [ ] Role badges displayed correctly
- [ ] Change password works
- [ ] Old password verification works
- [ ] Unauthenticated redirect works
