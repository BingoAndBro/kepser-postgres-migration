# Section 05: Master User Edit/Create Dialog

## Context

Setelah kolom display selesai (Section 04), kita perlu update Edit dan Create dialogs untuk allow admin managing chairman assignments dari dalam dialog.

## Objective

Update dialog Edit User dan Create User dengan:
1. Section "Kegiatan sebagai Ketua Tim"
2. Chips kegiatan yang di-assign (dengan X button untuk remove)
3. Dropdown "Tambah Kegiatan" (hanya kegiatan tanpa chairman)
4. Confirmation dialog saat replace chairman

## Prerequisites

- Section(s) yang harus selesai dulu: **04 (Master User Display)** atau parallel
- Files/modules yang harus sudah tersedia:
  - `src/routes/admin.master-data.user.tsx` (existing dialogs)
  - API endpoints dari Section 02

## Implementation Steps

### 5.1 Add State untuk Dialog Management

```typescript
// State untuk chairman di dialog
const [dialogChairmanAssignments, setDialogChairmanAssignments] = useState<{ id: string; kegiatan_id: string; kegiatan_nama: string }[]>([])
const [availableKegiatan, setAvailableKegiatan] = useState<{ id: string; nama: string }[]>([])
const [showChairmanConfirm, setShowChairmanConfirm] = useState(false)
const [pendingChairmanReplace, setPendingChairmanReplace] = useState<{ kegiatan_id: string; kegiatan_nama: string; old_user: string } | null>(null)
```

### 5.2 Load Chairman Assignments saat Open Edit Dialog

```typescript
async function loadChairmanForUser(userId: string) {
  try {
    const res = await fetch(`/api/ketua-tim/user/${userId}`, { credentials: 'include' })
    const data = await res.json()
    if (data.assignments) {
      setDialogChairmanAssignments(data.assignments.map((a: any) => ({
        id: a.id,
        kegiatan_id: a.kegiatan_id,
        kegiatan_nama: a.kegiatan?.nama
      })))
    }
  } catch (err) {
    console.error('Failed to load chairman assignments:', err)
  }
}

async function loadAvailableKegiatan() {
  // Fetch kegiatan yang belum punya chairman
  // Alternatif: fetch all kegiatan, filter yang belum ada di dialogChairmanAssignments
  try {
    const res = await fetch('/api/master-kegiatan', { credentials: 'include' })
    const data = await res.json()
    if (data.kegiatan) {
      // Filter: hanya kegiatan yang belum di-assign sebagai chairman
      const assignedKegiatanIds = dialogChairmanAssignments.map(c => c.kegiatan_id)
      const available = data.kegiatan.filter((k: any) => !assignedKegiatanIds.includes(k.id))
      setAvailableKegiatan(available)
    }
  } catch (err) {
    console.error('Failed to load kegiatan:', err)
  }
}
```

### 5.3 Add Section di Edit User Dialog

```tsx
{/* Di dalam Edit User Dialog, sebelum/ sesudah form fields */}

{/* Section: Kegiatan sebagai Ketua Tim */}
<div className="space-y-3 border-t border-outline-variant/20 pt-4 mt-4">
  <div className="flex items-center justify-between">
    <h4 className="text-sm font-semibold text-on-surface">🏆 Kegiatan sebagai Ketua Tim</h4>
    <span className="text-[10px] text-on-surface-variant">
      {dialogChairmanAssignments.length} kegiatan
    </span>
  </div>

  {/* Chips kegiatan yang sudah di-assign */}
  <div className="flex flex-wrap gap-2">
    {dialogChairmanAssignments.map((c) => (
      <span
        key={c.id}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"
      >
        {c.kegiatan_nama}
        <button
          type="button"
          onClick={() => handleRemoveChairman(c.id)}
          className="ml-1 text-amber-600 hover:text-amber-900 hover:bg-amber-200 rounded-full p-0.5"
        >
          <X size={12} />
        </button>
      </span>
    ))}
    {dialogChairmanAssignments.length === 0 && (
      <span className="text-xs text-on-surface-variant">Belum ada kegiatan</span>
    )}
  </div>

  {/* Dropdown Tambah Kegiatan */}
  {availableKegiatan.length > 0 && (
    <div className="flex gap-2">
      <select
        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
        value=""
        onChange={(e) => handleAddChairman(e.target.value)}
      >
        <option value="">Tambah kegiatan...</option>
        {availableKegiatan.map((k) => (
          <option key={k.id} value={k.id}>{k.nama}</option>
        ))}
      </select>
    </div>
  )}

  <p className="text-[10px] text-on-surface-variant">
    Satu kegiatan hanya boleh memiliki 1 ketua tim
  </p>
</div>
```

### 5.4 Handle Add Chairman

```typescript
async function handleAddChairman(kegiatanId: string) {
  // Check jika kegiatan sudah punya chairman (API will return 409)
  try {
    const res = await fetch('/api/ketua-tim', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: editingUserId,
        kegiatan_id: kegiatanId,
      })
    })

    if (res.status === 409) {
      // Kegiatan sudah punya chairman - show confirmation
      const data = await res.json()
      setPendingChairmanReplace({
        kegiatan_id: kegiatanId,
        kegiatan_nama: availableKegiatan.find(k => k.id === kegiatanId)?.nama ?? '',
        old_user: data.existing_chairman?.name ?? 'Chairman sebelumnya'
      })
      setShowChairmanConfirm(true)
      return
    }

    if (!res.ok) {
      throw new Error('Failed to add chairman')
    }

    // Success - refresh assignments
    await loadChairmanForUser(editingUserId!)
    await loadAvailableKegiatan()

  } catch (err) {
    console.error('Failed to add chairman:', err)
    // Show error toast
  }
}
```

### 5.5 Confirmation Dialog

```tsx
{showChairmanConfirm && pendingChairmanReplace && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
      <h3 className="text-lg font-bold text-on-surface mb-2">Ganti Ketua Tim?</h3>
      <p className="text-sm text-on-surface-variant mb-4">
        Apakah Anda yakin ingin menunjuk user ini sebagai chairman kegiatan{" "}
        <span className="font-semibold text-on-surface">{pendingChairmanReplace.kegiatan_nama}</span>?
        Ini akan menggantikan <span className="font-semibold text-on-surface">{pendingChairmanReplace.old_user}</span>.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => {
          setShowChairmanConfirm(false)
          setPendingChairmanReplace(null)
        }}>
          Batal
        </Button>
        <Button onClick={handleConfirmReplace}>
          Ya, Ganti
        </Button>
      </div>
    </div>
  </div>
)}
```

### 5.6 Handle Remove Chairman

```typescript
async function handleRemoveChairman(assignmentId: string) {
  try {
    const res = await fetch(`/api/ketua-tim/${assignmentId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error('Failed to remove chairman')
    }

    // Refresh assignments
    await loadChairmanForUser(editingUserId!)
    await loadAvailableKegiatan()

  } catch (err) {
    console.error('Failed to remove chairman:', err)
    // Show error toast
  }
}
```

### 5.7 Add Section di Create User Dialog

Sama seperti Edit, tapi:
- Load available kegiatan on dialog open
- Empty assignments initially
- No "old chairman" info needed (user baru)

## Files to Modify

- `src/routes/admin.master-data.user.tsx` — Update Edit and Create dialogs

## Test Stubs

### Happy Path
- [ ] Section chairman tampil di Edit dialog
- [ ] Chips tampil dengan X button
- [ ] Click X berhasil remove assignment
- [ ] Dropdown tampil dengan kegiatan yang available
- [ ] Select kegiatan berhasil add assignment

### Edge Cases
- [ ] Kegiatan sudah punya chairman → confirmation dialog appears
- [ ] Confirm replacement → old deleted, new created
- [ ] Cancel replacement → no changes

### Error Cases
- [ ] Add fail → show error toast
- [ ] Remove fail → show error toast

## Definition of Done

- [ ] Section "Kegiatan sebagai Ketua Tim" tampil di Edit dialog
- [ ] Chips kegiatan dengan X button untuk remove berfungsi
- [ ] Dropdown "Tambah Kegiatan" berfungsi
- [ ] Confirmation dialog muncul saat replace chairman
- [ ] Section yang sama tampil di Create dialog
- [ ] Info text "Satu kegiatan hanya boleh memiliki 1 ketua tim" tampil