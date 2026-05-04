# Section 09: Laporan Kegiatan - Permission Check

## Context

Setelah Section 03 (API user check) selesai, kita perlu memastikan halaman Laporan Kegiatan hanya bisa diakses oleh user yang punya hak chairman. Jika tidak, redirect atau show error.

## Objective

Update `src/routes/pegawai/laporan/kegiatan.tsx` untuk:
1. Fetch `/api/users/me/ketua-tim` saat mount
2. Jika user bukan chairman, show access denied atau redirect
3. Jika chairman, load documents seperti biasa

## Prerequisites

- Section(s) yang harus selesai dulu: **03 (API User Check)**
- Files/modules yang harus sudah tersedia:
  - `src/routes/pegawai/laporan/kegiatan.tsx` (existing)
  - API endpoint `/api/users/me/ketua-tim` sudah ada

## Implementation Steps

### 9.1 Read Existing Code

Check existing Laporan Kegiatan page structure.

### 9.2 Add State untuk Permission Check

```typescript
const [isAuthorized, setIsAuthorized] = useState(true)
const [checkingAuth, setCheckingAuth] = useState(true)
```

### 9.3 Add Permission Check Effect

```typescript
useEffect(() => {
  async function checkPermission() {
    setCheckingAuth(true)
    try {
      const res = await fetch('/api/users/me/ketua-tim', {
        credentials: 'include'
      })

      if (!res.ok) {
        // Not authenticated or error
        setIsAuthorized(false)
        return
      }

      const data = await res.json()

      // Check if user has any chairman assignments
      if (!data.is_ketua_tim || !data.kegiatan || data.kegiatan.length === 0) {
        setIsAuthorized(false)
        return
      }

      // User is authorized
      setIsAuthorized(true)
      // Store kegiatan for filter (optional)
      setAllowedKegiatan(data.kegiatan)

    } catch (err) {
      console.error('Permission check failed:', err)
      setIsAuthorized(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  checkPermission()
}, [])
```

### 9.4 Add State untuk Allowed Kegiatan

```typescript
const [allowedKegiatan, setAllowedKegiatan] = useState<{ id: string; nama: string }[]>([])
```

### 9.5 Render Access Denied State

```typescript
// While checking auth
if (checkingAuth) {
  return (
    <PageLayout>
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Memuat...</span>
        </div>
      </div>
    </PageLayout>
  )
}

// Not authorized
if (!isAuthorized) {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-error" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Akses Ditolak</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-md">
          Halaman Laporan Kegiatan hanya dapat diakses oleh user yang ditunjuk sebagai
          Ketua Tim pada suatu kegiatan.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Kembali ke Dashboard
        </Button>
      </div>
    </PageLayout>
  )
}

// Authorized - render page as normal
return <LaporanKegiatanContent allowedKegiatan={allowedKegiatan} />
```

### 9.6 Option: Restrict Filter to Allowed Kegiatan

Jika ingin restrict filter dropdown untuk hanya show kegiatan yang user chairman:

```typescript
// In HierarchicalFilter usage
<HierarchicalFilter
  value={filter}
  onChange={setFilter}
  kegiatanFilter={allowedKegiatan.map(k => k.id)} // Add this prop if supported
/>
```

Atau di client-side filter:

```typescript
const filtered = useMemo(() => {
  return dokumen.filter(d => {
    // Existing filters...

    // Extra check: only show dokumen from kegiatan user is chairman
    if (!allowedKegiatan.some(k => k.id === d.kegiatan_jenis_id)) {
      return false
    }

    return true
  })
}, [dokumen, filter, allowedKegiatan])
```

## Files to Modify

- `src/routes/pegawai/laporan/kegiatan.tsx` — Add permission check

## Test Stubs

### Happy Path
- [ ] Chairman user bisa akses halaman
- [ ] Data dokumen kegiatan tampil dengan benar
- [ ] Filter berfungsi dengan benar

### Edge Cases
- [ ] Non-chairman accessing URL directly → access denied page
- [ ] User chairman but no kegiatan → access denied

### Error Cases
- [ ] API fail → access denied (fail safely)

## Definition of Done

- [ ] Page checks authorization on mount
- [ ] Loading state shown while checking
- [ ] Access denied shown for non-chairman
- [ ] Documents only from user's chairman kegiatan (if filter added)