# Section 06: AppLayout Conditional Menu

## Context

Setelah Section 03 (API user check) selesai, kita perlu update AppLayout untuk conditionally render menu "Laporan Kegiatan". Menu ini hanya tampil untuk user yang punya hak chairman.

## Objective

Update `AppLayout.tsx` untuk:
1. Fetch `/api/users/me/ketua-tim` saat mount
2. Conditionally add "Laporan Kegiatan" ke navigation
3. Refresh saat logout/login

## Prerequisites

- Section(s) yang harus selesai dulu: **03 (API User Check)**
- Files/modules yang harus sudah tersedia:
  - `src/components/layout/AppLayout.tsx` (existing)
  - API endpoint `/api/users/me/ketua-tim` sudah ada

## Implementation Steps

### 6.1 Add State untuk Chairman Status

```typescript
// Di dalam AppLayout component
const [chairmanKegiatan, setChairmanKegiatan] = useState<{ id: string; nama: string }[]>([])
const [loadingChairman, setLoadingChairman] = useState(false)
```

### 6.2 Fetch Chairman Status

```typescript
// Di useEffect atau useCallback untuk fetchSession
const fetchChairmanStatus = useCallback(async () => {
  if (!hasSession) return

  setLoadingChairman(true)
  try {
    const res = await fetch('/api/users/me/ketua-tim', {
      credentials: 'include'
    })
    const data = await res.json()

    if (data.kegiatan && Array.isArray(data.kegiatan)) {
      setChairmanKegiatan(data.kegiatan)
    } else {
      setChairmanKegiatan([])
    }
  } catch (err) {
    console.error('Failed to fetch chairman status:', err)
    setChairmanKegiatan([]) // Fail gracefully - treat as non-chairman
  } finally {
    setLoadingChairman(false)
  }
}, [hasSession])

// Panggil di useEffect utama
useEffect(() => {
  if (hasSession) {
    fetchChairmanStatus()
  }
}, [hasSession, fetchChairmanStatus])
```

### 6.3 Conditional Navigation Config

Buat computed nav items berdasarkan chairman status:

```typescript
// Build MANAGEMENT items based on role and chairman status
const getManagementItems = (): NavItem[] => {
  const baseItems: NavItem[] = [
    { id: 'aju', label: 'Ajukan Dokumen', icon: FilePlus, to: '/pegawai/dokumen/aju' },
    { id: 'diajukan', label: 'Dokumen Diajukan', icon: ClipboardList, to: '/pegawai/dokumen' },
    { id: 'revisi', label: 'Revisi Dokumen', icon: FileEdit, to: '/pegawai/dokumen?status=NEED_REVISION' },
    { id: 'laporan_saya', label: 'Laporan Saya', icon: FileText, to: '/pegawai/laporan/saya' },
  ]

  // Add "Laporan Kegiatan" hanya jika user punya chairman assignments
  if (chairmanKegiatan.length > 0) {
    baseItems.push({
      id: 'laporan_kegiatan',
      label: 'Laporan Kegiatan',
      icon: BarChart3,
      to: '/pegawai/laporan/kegiatan'
    })
  }

  return baseItems
}

// Di NAV_CONFIG PEGAWAI
PEGAWAI: [
  {
    title: 'MANAGEMENT',
    items: getManagementItems(),
  },
  // ... other groups
]
```

### 6.4 Update Navigation Groups

Karena NAV_CONFIG di-declare di luar component (static), kita perlu berbeda approach:

**Option A: Dynamic build inside component**
- Build NAV_CONFIG di dalam component berdasarkan state
- More flexible, re-render saat state change

**Option B: Conditional render di nav items**
- Keep static NAV_CONFIG
- Filter items berdasarkan state di render phase

**Rekomendasi: Option A** karena lebih clean dan predictable.

```typescript
// Di dalam component, buat computed config
const pegawaiNav = useMemo(() => [
  {
    title: 'GENERAL',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/' }],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'aju', label: 'Ajukan Dokumen', icon: FilePlus, to: '/pegawai/dokumen/aju' },
      { id: 'diajukan', label: 'Dokumen Diajukan', icon: ClipboardList, to: '/pegawai/dokumen' },
      { id: 'revisi', label: 'Revisi Dokumen', icon: FileEdit, to: '/pegawai/dokumen?status=NEED_REVISION' },
      { id: 'laporan_saya', label: 'Laporan Saya', icon: FileText, to: '/pegawai/laporan/saya' },
      ...(chairmanKegiatan.length > 0 ? [{
        id: 'laporan_kegiatan',
        label: 'Laporan Kegiatan',
        icon: BarChart3,
        to: '/pegawai/laporan/kegiatan'
      }] : [])
    ],
  },
  // ... other groups
], [chairmanKegiatan])

// Combine dengan static configs untuk other roles
const navGroups = useMemo(() => {
  if (activeRole === 'PEGAWAI') {
    return pegawaiNav
  }
  return NAV_CONFIG[activeRole] ?? []
}, [activeRole, pegawaiNav])
```

### 6.5 Refetch on Session Change

```typescript
// Di onAuthStateChange handler
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
  fetchSession()
  fetchChairmanStatus() // <-- Add this
}
```

## Files to Modify

- `src/components/layout/AppLayout.tsx` — Update navigation logic

## Test Stubs

### Happy Path
- [ ] User dengan chairman assignments melihat menu "Laporan Kegiatan"
- [ ] User tanpa chairman assignments TIDAK melihat menu "Laporan Kegiatan"
- [ ] Menu visibility check dilakukan saat mount

### Edge Cases
- [ ] User logout dan login sebagai user berbeda → menu refresh correctly
- [ ] User chairman di kegiatan yang kemudian dihapus → menu update on next session

### Error Cases
- [ ] API fail → menu tidak tampil (fail gracefully to non-chairman)

## Definition of Done

- [ ] "Laporan Kegiatan" menu hanya tampil untuk chairman
- [ ] Menu check dilakukan saat page load
- [ ] Menu refresh saat user logout/login
- [ ] Fail gracefully jika API error