# Section 04: Master User Page — Real Data

## Context

Halaman `/admin/master-data/user` saat ini menggunakan mock data. Perlu di-update untuk menggunakan real API endpoints dari Section 02.

## Objective

Replace mock data dengan real data:
- Fetch dari `/api/users` saat mount
- Display dengan role badges
- Add modals untuk create/edit/delete
- Add filter dan pagination

## Prerequisites
- Section 02 (Admin API) harus selesai dan working

## Implementation Steps

### 1. Update component imports

Tambahkan hooks yang needed:

```typescript
import { useEffect, useState } from 'react'
import { useRouteLink } from '#/hooks/use-link'
```

### 2. Add state management

```typescript
const [users, setUsers] = useState<UserWithRoles[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [search, setSearch] = useState('')
const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'nonaktif'>('all')
```

### 3. Fetch data on mount

```typescript
useEffect(() => {
  fetchUsers()
}, [])

async function fetchUsers() {
  setLoading(true)
  const res = await fetch('/api/users')
  if (!res.ok) {
    setError('Gagal memuat data')
    return
  }
  const data = await res.json()
  setUsers(data.users)
  setLoading(false)
}
```

### 4. Update table display

- Ganti mock role string dengan role badge component
- Ganti mock status dengan real status indicator
- Add search/filter functionality
- Add pagination controls

### 5. Add modals

**Create User Modal:**
- Email input
- Password input + confirmation
- Nama Lengkap input
- NIP/NRP input
- Departemen input (optional)
- Roles checkboxes (PEGAWAI pre-checked + disabled)

**Edit User Modal:**
- Read-only email display
- Nama Lengkap, NIP/NRP, Departemen inputs
- Roles checkboxes

**Reset Password Modal:**
- Password baru input + confirmation
- Info text about password

**Deactivate/Activate Modal:**
- Confirmation text
- Action button

### 6. Connect API calls

- Create: POST /api/users
- Update: PATCH /api/users/[id]
- Reset: POST /api/users/[id]/reset-password
- Deactivate: POST /api/users/[id]/deactivate
- Activate: POST /api/users/[id]/activate

## Files to Modify
- `src/routes/admin.master-data.user.tsx` — major rewrite

## Test Stubs
- [ ] Page loads with real data
- [ ] Create user modal submits successfully
- [ ] Edit user modal updates user
- [ ] Reset password changes user password
- [ ] Deactivate changes user status
- [ ] Activate restores user status
- [ ] Search filters users
- [ ] Status filter works
- [ ] Pagination navigates correctly

## Definition of Done
- [ ] All mock data replaced with API calls
- [ ] Create user flow works end-to-end
- [ ] Edit user flow works end-to-end
- [ ] Deactivate/activate works
- [ ] Reset password works
- [ ] Search and filter work
- [ ] Pagination works
- [ ] Loading states shown
- [ ] Error states handled
