# Section 04: UI — Dokumen Saya (List Page)

## Context

Section 03 (API Core) sudah selesai atau cukup mature. Dokumen list API (`GET /api/dokumen`) sudah berfungsi. Sekarang butuh halaman list dokumen saya.

## Objective

Halaman `/dokumen/saya` yang menampilkan daftar semua dokumen yang diajukan pegawai, dengan filter, search, dan navigasi ke detail.

## Prerequisites

- Section 02 (API CRUD) selesai — `GET /api/dokumen` berfungsi
- `src/components/layout/AppLayout.tsx` sudah ada (dari Spec 01/02)
- shadcn/ui components tersedia: Table, Badge, Button, Input, Select, Dialog
- Role guard: `/dokumen/saya` hanya bisa diakses PEGAWAI, PPK, BENDAHARA, ARSIPARIS (NOT ADMIN)

## Implementation Steps

### 4a. Redirect Route (`src/routes/dokumen.tsx`)

```typescript
// Redirect /dokumen → /dokumen/saya
export const Route = createFileRoute('/dokumen')({
  beforeLoad: async () => {
    // optional: redirect to /dokumen/saya
  },
  component: () => {
    const navigate = useNavigate()
    useEffect(() => {
      navigate({ to: '/dokumen/saya' })
    }, [])
    return <div>Redirecting...</div>
  },
})
```

### 4b. List Page (`src/routes/dokumen/saya.tsx`)

**Loader:**
```typescript
const fetchDokumenList = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await requireAuth()
    const list = await getDokumenByUser(db, user.id)
    return { dokumen: list }
  })

export const Route = createFileRoute('/dokumen/saya')({
  beforeLoad: () => { guardAnyRole(['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS']) },
  loader: () => fetchDokumenList(),
  component: DokumenSayaPage,
})
```

**Component:**
- Header: "Dokumen Saya" + tombol "Ajukan Dokumen Baru" (link ke `/dokumen/aju`)
- Filter toolbar: dropdown Status, dropdown Fungsi, search input
- Table: No | Judul | Fungsi | Kegiatan | Status | Tanggal | Aksi
- Empty state: ilustrasi + "Belum ada dokumen. Ajukan dokumen pertama Anda."
- Pagination: 10 per page, prev/next buttons

**Status Badge colors:**
- DRAFT → gray (`bg-muted text-muted-foreground`)
- IN_PPK_VALIDATION → yellow (`bg-yellow-100 text-yellow-800`)
- NEED_REVISION → red (`bg-red-100 text-red-800`)
- IN_BENDAHARA_APPROVAL → blue (`bg-blue-100 text-blue-800`)
- COMPLETED → green (`bg-green-100 text-green-800`)
- ARCHIVED → gray (`bg-gray-200 text-gray-600`)

**Row Actions:**
- View → link ke `/dokumen/${id}`

**Client-side filtering:** Filter by status + fungsi di client (setelah data di-load). Search by judul.

### 4c. Dashboard Landing Check

Check `src/routes/index.tsx` — jika belum redirect PEGAWAI ke `/dokumen/saya`, update.

```typescript
// In root route loader or index route
// If user is PEGAWAI (primary role) → redirect to /dokumen/saya
// If user is PPK → redirect to /ppk/inbox
// etc.
```

## Files to Create/Modify

- `src/routes/dokumen.tsx` — redirect route
- `src/routes/dokumen/saya.tsx` — list page
- `src/routes/index.tsx` — check/update landing redirect

## Test Stubs (from TDD Plan)

- [ ] Page loads and shows table of user's documents
- [ ] Empty state displays friendly message
- [ ] Filter by status works
- [ ] Filter by fungsi works
- [ ] Search by judul works
- [ ] "Ajukan Dokumen Baru" button links to /dokumen/aju
- [ ] Click document row navigates to detail
- [ ] Paginated at 10 per page
- [ ] Sorting by date descending
- [ ] Status badge shows correct color per status

## Definition of Done

- [ ] `/dokumen/saya` displays list of user's documents
- [ ] Empty state shows friendly message with CTA
- [ ] Filters work correctly (status, fungsi, search)
- [ ] Table pagination works
- [ ] Navigation to detail page works
- [ ] Role guard blocks ADMIN access
- [ ] UI follows ui-ux-pro-max (semantic colors, accessibility, loading states)
