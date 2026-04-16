# Section 06: UI — Detail Dokumen & Edit/Resubmit

## Context

Section 05 (Form UI) sedang dikerjakan atau selesai. Komponen upload sudah ada (`FileUploadButton`, `KelengkapanChecklist`). Sekarang butuh halaman detail dokumen dan halaman edit/resubmit.

## Objective

Halaman detail (`/dokumen/[id]`) dan edit-resubmit (`/dokumen/[id]/edit`) yang lengkap dengan download lampiran, status display, revision notes, dan resubmit flow.

## Prerequisites

- Section 03 (Upload API) selesai — download signed URL berfungsi
- Section 04 (List Page) selesai — routing/navigation sudah jalan
- Section 05 (Form UI) selesai atau cukup — reuse `KelengkapanChecklist`, `FileUploadButton`
- Route guard: only owner can access detail and edit

## Implementation Steps

### 6a. Detail Page (`src/routes/dokumen.$id.tsx`)

**Loader:**
```typescript
const fetchDokumenDetail = createServerFn({ method: 'GET' })
  .handler(async ({ params }) => {
    const user = await requireAuth()
    const dok = await getDokumenById(db, params.id)

    if (!dok) throw new Error('Dokumen tidak ditemukan')

    const isOwner = dok.createdBy === user.id
    const isApprover = await userHasApproverRole(user.id)
    if (!isOwner && !isApprover) {
      throw redirect({ to: '/forbidden' })
    }

    return { dokumen: dok }
  })

export const Route = createFileRoute('/dokumen/$id')({
  beforeLoad: () => { guardAnyRole(['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS']) },
  loader: ({ params }) => fetchDokumenDetail({ params }),
  component: DokumenDetailPage,
})
```

**UI Layout:**
```
┌─ Header ──────────────────────────────────────┐
│ Judul: [Judul Dokumen]                         │
│ [Status Badge] [Current Step]                  │
├─ Info Card ────────────────────────────────────┤
│ Fungsi: [...] | Kegiatan: [...]                │
│ Tahun: [...] | Tanggal: [...]                  │
│ Role: [Ketua Tim / Anggota]                   │
├─ Status Timeline ──────────────────────────────┤
│ DRAFT → IN_PPK → IN_BENDAHARA → COMPLETED     │
│ (current step highlighted)                    │
├─ Revision Notes (if NEED_REVISION) ────────────┤
│ ⚠️ Catatan PPK: [revision_notes]               │
├─ Lampiran List ────────────────────────────────┤
│ 📄 [Nama Kelengkapan] [filename.pdf 2.3 MB]   │
│    [Download]                                  │
├─ Actions ──────────────────────────────────────┤
│ [Perbaiki & Resubmit] (conditional)            │
└────────────────────────────────────────────────┘
```

**Status Timeline:** Visual step indicator showing document journey.

**Revision Notes Box:** Red/orange warning box showing PPK's rejection notes. Only visible if `status === NEED_REVISION`.

**Lampiran List:**
- For each lampiran: [icon] [nama kelengkapan] [filename] [size] [Download button]
- Download button → calls `GET /api/dokumen/[id]/download/[index]` → navigate to signed URL

**Resubmit Button:**
- Visible: `status === NEED_REVISION && revisionTarget === 'USER' && isOwner`
- Link to `/dokumen/[id]/edit`
- Style: primary button

### 6b. Edit & Resubmit Page (`src/routes/dokumen.$id.edit.tsx`)

**Loader:**
```typescript
const fetchDokumenForEdit = createServerFn({ method: 'GET' })
  .handler(async ({ params }) => {
    const user = await requireAuth()
    const dok = await getDokumenById(db, params.id)

    if (!dok) throw new Error('Dokumen tidak ditemukan')
    if (dok.createdBy !== user.id) throw redirect({ to: '/forbidden' })
    if (dok.status !== 'NEED_REVISION') throw redirect({ to: `/dokumen/${params.id}` })
    if (dok.revisionTarget !== 'USER') throw redirect({ to: `/dokumen/${params.id}` })

    return { dokumen: dok }
  })

export const Route = createFileRoute('/dokumen/$id/edit')({
  beforeLoad: () => { guardAnyRole(['PEGAWAI']) },
  loader: ({ params }) => fetchDokumenForEdit({ params }),
  component: DokumenEditPage,
})
```

**UI:**
```
┌─ Revision Notes Banner ─────────────────────────┐
│ 📋 Catatan dari PPK:                           │
│ [revision_notes — read only]                   │
├─ Info Summary ─────────────────────────────────┤
│ Fungsi: [...] | Kegiatan: [...] | Tahun: [...] │
├─ Lampiran Upload ──────────────────────────────┤
│ [KelengkapanChecklist — pre-populated with     │
│  existing lampiran_urls, user can re-upload]   │
├─ Actions ──────────────────────────────────────┤
│ [Kembali] [Resubmit]                           │
└────────────────────────────────────────────────┘
```

**Reuse dari Section 05:**
- `KelengkapanChecklist` — dengan prop `initialLampirans` untuk pre-fill
- `FileUploadButton` — dengan state management untuk uploaded files
- `ReviewSummary` — optional, atau bisa inline

**Resubmit Flow:**
```typescript
async function handleResubmit() {
  // Update lampiran_urls
  const updateResult = await updateDokumenServerFn({
    id: dokumen.id,
    lampiranUrls: formData.lampiranUrls,
  })

  if (updateResult.error) {
    toast.error(updateResult.error)
    return
  }

  // Submit
  const submitResult = await submitDokumenServerFn({}, { params: { id: dokumen.id } })

  if (submitResult.error) {
    toast.error(submitResult.error)
    return
  }

  toast.success('Dokumen berhasil diajukan ulang')
  navigate({ to: '/dokumen/saya' })
}
```

### 6c. Dashboard Redirect

Check `/dokumen` redirect route — jika belum pointing ke `/dokumen/saya`, verify.

## Files to Create/Modify

- `src/routes/dokumen.$id.tsx` — detail page
- `src/routes/dokumen.$id.edit.tsx` — edit & resubmit page

## Test Stubs (from TDD Plan)

- [ ] Page loads document details with correct data
- [ ] Status badge shows correct status and color
- [ ] Current step indicator highlights correct position
- [ ] Lampiran list shows all uploaded files
- [ ] Download button generates signed URL and opens file
- [ ] Revision notes displayed in warning box (if NEED_REVISION)
- [ ] "Perbaiki & Resubmit" visible only when applicable
- [ ] Non-owner accessing detail returns 403/redirect
- [ ] Edit page loads only for valid resubmit conditions
- [ ] Edit page redirects for invalid conditions
- [ ] Resubmit creates log entry with aksi='RESUBMIT'
- [ ] After resubmit, redirect to /dokumen/saya with success toast

## Definition of Done

- [ ] Detail page shows all document information
- [ ] Status timeline visualizes document journey
- [ ] Revision notes visible with correct styling
- [ ] All lampiran downloadable via signed URL
- [ ] Edit page accessible only for valid resubmit conditions
- [ ] Resubmit flow updates lampiran and triggers FSM transition
- [ ] log_aktivitas entry created on resubmit
- [ ] Success/error feedback via toast
- [ ] Role guard blocks unauthorized access
- [ ] `pnpm build` succeeds without errors
