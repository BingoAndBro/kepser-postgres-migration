# Section 05: UI — Ajukan Dokumen (Multi-Step Form)

## Context

Section 04 (List Page) sedang dikerjakan atau selesai. API sudah berfungsi (upload, submit). Sekarang butuh form multi-step untuk ajukan dokumen baru.

## Objective

Halaman `/dokumen/aju` dengan 5-step form yang lengkap: Fungsi+Tahun+Tanggal → Kegiatan → Ketua Tim → Upload → Review & Submit.

## Prerequisites

- Section 02 (API CRUD) selesai
- Section 03 (Upload API) selesai
- Route guards: only PEGAWAI (single role) or multi-role with PEGAWAI active
- shadcn/ui: Button, Dialog, Select, Checkbox, FileInput, Toast
- `src/lib/master-data.ts` — fetch fungsi/kegiatan/kelengkapan (Spec 02 already)
- Loader untuk tahun range

## Implementation Steps

### 5a. Year Options Helper

Buat utility untuk generate year dropdown options:

```typescript
// src/lib/utils/tahun.ts
export function getTahunOptions() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    years.push(y)
  }
  return years.reverse() // newest first
}
```

### 5b. Multi-Step State Management

Simpan state form antar step. Gunakan React state (useState) karena ini client-side wizard — tidak perlu URL params untuk step navigation.

```typescript
// Form state
const [step, setStep] = useState(1)
const [formData, setFormData] = useState({
  fungsiId: '',
  tahun: new Date().getFullYear(),
  tanggal: format(new Date(), 'yyyy-MM-dd'),
  kegiatanId: '',
  isKetuaTim: false,
  lampiranUrls: [] as LampiranUrl[],
})
```

### 5c. Step Indicator Component

```tsx
// src/components/dokumen/StepIndicator.tsx
// Horizontal bar showing: 1-Fungsi → 2-Kegiatan → 3-Ketua Tim → 4-Unggah → 5-Review
// Active step: filled circle, text bold
// Completed step: checkmark
// Future step: empty circle
```

### 5d. Step 1 — Fungsi & Info Dasar

```tsx
// Dropdown Fungsi: fetch from /api/master-fungsi
// Tahun: dropdown from getTahunOptions()
// Tanggal: date input (html date picker)
```

- Fetch fungsi dari server (loader atau client fetch)
- Disabled "Lanjut" sampai fungsi + tanggal dipilih
- Tahun default = tahun saat ini

### 5e. Step 2 — Kegiatan

```tsx
// Dropdown Kegiatan ter-filter by fungsiId
// Fetch: /api/master-kegiatan?fungsi_id=[fungsiId]
// Show loading state while fetching
```

- Disabled sampai step 1 selesai
- Fetch kegiatan based on fungsi
- Selected kegiatan stored for later (needed for judul generation)

### 5f. Step 3 — Role Toggle

```tsx
// Toggle: "Apakah Anda Ketua Tim?"
// Ya → "Anda perlu mengunggah kelengkapan untuk Ketua Tim"
// Tidak → "Anda perlu mengunggah kelengkapan untuk Anggota"
```

### 5g. Step 4 — Upload Lampiran

**Component:** `KelengkapanChecklist`

```tsx
// Fetch kelengkapan: /api/master-kelengkapan?kegiatan_id=[kegiatanId]
// Filter: is_ketua_tim matches selected role
// For each kelengkapan:
[ ] [Nama Kelengkapan] — WAJIB badge (orange) if required
    [Unggah File] → opens file picker
    OR [filename.pdf ✓ 2.3 MB] → shows uploaded state
```

**Component:** `FileUploadButton`

```tsx
// Props: kelengkapan_id, dokumen_id, nama_dokumen, onUploaded callback
// States: idle | uploading (spinner) | uploaded (filename + size + check) | error
// Upload flow:
  1. Click → file picker opens
  2. Select file → validate type + size
  3. POST /api/upload (FormData)
  4. onUploaded({ url, nama, kelengkapan_id, uploaded_at })
  5. Show success state
  6. On error → show toast error
```

**Validasi:** Cannot advance to step 5 if any required kelengkapan missing upload.

### 5h. Step 5 — Review & Submit

```tsx
// Summary card:
  Fungsi: [nama]
  Kegiatan: [nama]
  Tahun: [tahun]
  Tanggal: [DD/MM/YYYY]
  Role: [Ketua Tim / Anggota]
  Lampiran: [list — filename + size]

// Tombol: "Ajukan" + "Kembali ke Edit"
```

**Submit flow:**
1. Create dokumen: POST /api/dokumen (DRAFT — with lampiran URLs)
2. Submit: POST /api/dokumen/[id]/submit
3. Disable button during loading (prevent double-submit)
4. Success: toast "Dokumen berhasil diajukan" → navigate to `/dokumen/saya`
5. Error: toast error with message from server

### 5i. Create Dokumen + Submit Flow

Karena dokumen harus dibuat DULU untuk dapat ID (needed for file storage path), flow-nya:

```typescript
async function handleSubmit() {
  // 1. Create DRAFT dokumen first (to get ID)
  const createResult = await createDokumenServerFn({
    fungsiId: formData.fungsiId,
    kegiatanJenisId: formData.kegiatanId,
    isKetuaTim: formData.isKetuaTim,
    tahun: formData.tahun,
    tanggal: formData.tanggal,
    lampiranUrls: formData.lampiranUrls,
  })

  if (createResult.error) {
    toast.error(createResult.error)
    return
  }

  const dokumenId = createResult.data.dokumen.id

  // 2. Submit (triggers FSM transition)
  const submitResult = await submitDokumenServerFn({}, { params: { id: dokumenId } })

  if (submitResult.error) {
    toast.error(submitResult.error)
    return
  }

  toast.success('Dokumen berhasil diajukan')
  navigate({ to: '/dokumen/saya' })
}
```

### 5j. Create Dokumen Server Fn

Tambahkan di `src/routes/api/dokumen/index.ts` — atau buat dedicated server fn:

```typescript
// src/routes/api/dokumen/create-and-submit.ts
export const createAndSubmitDokumen = createServerFn({ method: 'POST' })
  .validator(zodValidator(createDokumenSchema))
  .handler(async ({ data }) => {
    // 1. requireAuth + get user name
    // 2. Fetch kegiatan name for judul
    // 3. Validate required lampiran
    // 4. Create DRAFT dokumen
    // 5. Insert log SUBMIT
    // 6. Return
  })
```

**Alternatif lebih clean:** Buat satu endpoint `POST /api/dokumen/submit` yang langsung create + submit dalam satu transaction.

## Files to Create/Modify

- `src/routes/dokumen.aju.tsx` — redirect route (aji → aju)
- `src/routes/dokumen/aju.tsx` — main multi-step form
- `src/components/dokumen/StepIndicator.tsx` — step progress bar
- `src/components/dokumen/KelengkapanChecklist.tsx` — checklist + upload
- `src/components/dokumen/FileUploadButton.tsx` — upload button
- `src/components/dokumen/ReviewSummary.tsx` — review card
- `src/lib/utils/tahun.ts` — tahun options helper
- `src/routes/api/dokumen/submit.ts` — combined create+submit endpoint (optional optimization)

## Test Stubs (from TDD Plan)

- [ ] Step 1: Dropdown fungsi loads 6 fungsi
- [ ] Step 1: Tahun dropdown shows correct range
- [ ] Step 1: Tanggal date picker accepts valid date
- [ ] Step 2: Dropdown kegiatan filters by selected fungsi
- [ ] Step 3: Toggle shows correct text for each option
- [ ] Step 4: Checklist shows correct kelengkapan for kegiatan + role
- [ ] Step 4: Required items marked with orange "WAJIB" badge
- [ ] Step 4: Upload flow works (pick → validate → upload → show state)
- [ ] Step 4: Cannot advance to step 5 if required items missing
- [ ] Step 5: Review summary shows all entered data
- [ ] Submit creates dokumen and redirects to /dokumen/saya
- [ ] Double-submit prevented (button disabled)
- [ ] Submit error shows toast with server message

## Definition of Done

- [ ] All 5 steps navigable in sequence
- [ ] Back button preserves state
- [ ] Step indicator shows correct progress
- [ ] Kelengkapan dynamically loads based on kegiatan + role
- [ ] File upload works with validation (type + size)
- [ ] Required validation prevents incomplete submissions
- [ ] Submit creates dokumen with correct judul
- [ ] Success redirect to /dokumen/saya with toast
- [ ] Error handling with user-friendly messages
- [ ] Loading states on all async operations
- [ ] UI follows ui-ux-pro-max (accessibility, semantic colors, feedback)
