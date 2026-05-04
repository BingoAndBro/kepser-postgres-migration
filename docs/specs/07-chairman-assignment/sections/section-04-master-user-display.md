# Section 04: Master User Table Display

## Context

Setelah API endpoints selesai (Section 02), kita update Master User page untuk menampilkan kolom "Kegiatan Ketua Tim". Kolom ini menampilkan chip/badge per kegiatan untuk user yang chairman.

## Objective

Update tabel Master User (`admin/master-data/user.tsx`) untuk:
1. Fetch chairman assignments saat load user list
2. Tampilkan kolom baru "Kegiatan Ketua Tim"
3. Tampilkan chip per kegiatan untuk chairman, "-" untuk non-chairman

## Prerequisites

- Section(s) yang harus selesai dulu: **02 (API CRUD)**
- Files/modules yang harus sudah tersedia:
  - `src/routes/admin.master-data.user.tsx` (existing)
  - API endpoint `/api/ketua-tim/user/[user_id]` sudah ada

## Implementation Steps

### 4.1 Read Existing Code

Pertama, baca existing Master User page untuk memahami structure-nya.

### 4.2 Add State untuk Chairman Assignments

```typescript
// Tambahkan state untuk chairman assignments
const [chairmanAssignments, setChairmanAssignments] = useState<Record<string, { id: string; kegiatan_id: string; kegiatan_nama: string }[]>>({})
const [loadingChairmen, setLoadingChairmen] = useState(false)

// Fetch chairman assignments saat component mount
useEffect(() => {
  // Jika users sudah loaded, fetch chairman untuk setiap user
  // Atau bisa fetch all dan map berdasarkan user_id
}, [users])
```

### 4.3 Fetch Chairman Assignments

```typescript
// Fetch all chairman assignments (batch) atau per-user
async function fetchChairmanAssignments() {
  setLoadingChairmen(true)
  try {
    // Option 1: Fetch all
    const res = await fetch('/api/ketua-tim', { credentials: 'include' })
    const data = await res.json()
    
    if (data.assignments) {
      // Group by user_id
      const grouped: Record<string, any[]> = {}
      data.assignments.forEach((a: any) => {
        const userId = a.user_id
        if (!grouped[userId]) grouped[userId] = []
        grouped[userId].push({
          id: a.id,
          kegiatan_id: a.kegiatan_id,
          kegiatan_nama: a.kegiatan?.nama
        })
      })
      setChairmanAssignments(grouped)
    }
  } catch (err) {
    console.error('Failed to fetch chairman assignments:', err)
  } finally {
    setLoadingChairmen(false)
  }
}
```

### 4.4 Add Kolom di Table

```tsx
{/* Tambahkan kolom header */}
<TableHead className="text-[10px]">Kegiatan Ketua Tim</TableHead>

{/* Di setiap row, tampilkan chips atau "-" */}
<TableCell>
  {loadingChairmen ? (
    <span className="text-outline">...</span>
  ) : chairmanAssignments[user.id]?.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {chairmanAssignments[user.id].map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
        >
          {c.kegiatan_nama}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-outline">—</span>
  )}
</TableCell>
```

## Files to Modify

- `src/routes/admin.master-data.user.tsx` — Update table display

## Test Stubs

### Happy Path
- [ ] Tabel menampilkan kolom baru "Kegiatan Ketua Tim"
- [ ] User chairman menampilkan chip per kegiatan
- [ ] User tanpa chairman menampilkan "-"

### Edge Cases
- [ ] User chairman di banyak kegiatan menampilkan semua chips
- [ ] Long kegiatan nama di-truncate jika perlu

### Error Cases
- [ ] API fail menampilkan error state atau placeholder

## Definition of Done

- [ ] Kolom "Kegiatan Ketua Tim" tampil di tabel
- [ ] Chips menampilkan nama kegiatan untuk chairman
- [ ] "-" tampil untuk user tanpa chairman
- [ ] Loading state handled
- [ ] Error state handled