# Section 06: PPK Resubmit — API + Page (with Lampiran Edit)

## Context

Section 04 (PPK Approve/Reject) must be complete. The resubmit feature allows PPK to fix documents that Bendahara rejected. This is the most complex section — it includes lampiran file editing (delete + upload) and resubmit submission.

## Objective

Create three files:
1. `src/routes/api/ppk/resubmit/$id.ts` — POST handler for resubmit
2. `src/routes/ppk/revisi.tsx` — List page for documents needing PPK revision
3. `src/routes/ppk/dokumen/$id/resubmit.tsx` — Resubmit page with lampiran editing

## Prerequisites

- Section 04 (PPK approve/reject) — FSM pattern established
- `src/lib/fsm.ts` — transition('NEED_REVISION', 'RESUBMIT_PPK', 'PPK', 'PPK')
- Lampiran upload flow from Spec 03 — reuse `/api/upload` endpoint
- Preview modal from dokumen detail page

## Implementation Steps

### Part A: Resubmit API (`src/routes/api/ppk/resubmit/$id.ts`)

```
POST handler:
1. Auth + role check (PPK)
2. Parse body: resubmitDokumenSchema (optional lampiranUrls)
3. Fetch dokumen, verify:
   - status = 'NEED_REVISION' → 400 if wrong
   - revision_target = 'PPK' → 400 if wrong
4. If body.lampiranUrls provided:
   - Merge with existing lampiran_urls (replace entries with matching kelengkapan_id)
   - Update lampiran_urls in dokumen_transaksi
5. FSM: transition('NEED_REVISION', 'RESUBMIT_PPK', 'PPK', 'PPK')
   → expect: { newStatus: 'IN_BENDAHARA_APPROVAL', newCurrentStep: 'BENDAHARA', stepUrutan: 2 }
6. updateDokumenStatus(supabase, id, {
     status: 'IN_BENDAHARA_APPROVAL',
     currentStep: 'BENDAHARA',
     revisionTarget: null,
     revisionNotes: null, // clear notes
   })
7. insertLog(supabase, {
     dokumenId: id,
     userId: session.user.id,
     aksi: 'RESUBMIT_PPK',
     stepUrutan: 2,
   })
8. Return success
```

Note: revision_notes should be cleared (set to null) on resubmit since the document is now back in the approval flow. The bendahara rejection note remains in the log.

### Part B: Revisi List Page (`/ppk/revisi`)

```
1. DashboardShell role="PPK" showHero={false}
2. Title: "Revisi Dokumen" — dokumen dari Bendahara yang perlu diperbaiki
3. Fetch: /api/ppk/revisi (or reuse with filter params)
4. Table: No, Judul, Fungsi, Kegiatan, Tanggal Penolakan, Catatan Ringkas, Aksi
5. "Lihat" → /ppk/dokumen/[id]/resubmit
6. Show rejection notes preview in table (truncate to 50 chars)
```

API route: `GET /api/ppk/revisi` — query NEED_REVISION where revision_target='PPK', join fungsi+kegiatan, return list.

### Part C: Resubmit Page (`/ppk/dokumen/$id/resubmit`)

This is the most complex page in the spec. It shows:
1. Catatan penolakan dari Bendahara (read-only, highlighted)
2. Form edit lampiran (show existing files, delete button per file, upload new button)
3. Submit button

```
Page layout:
- Header: judul + badge "Revisi dari Bendahara" (merah)
- Info grid: Fungsi, Kegiatan, Tahun, Tanggal
- Catatan revisi banner: "Catatan dari Bendahara" — dalam kotak amber, read-only, menampilkan revision_notes dari dokumen
- Lampiran section:
  - List existing files (from lampiran_urls)
  - Per file: nama, ukuran, [Preview] [Hapus] buttons
  - Upload area: drag-drop or click-to-upload, same as Spec 03 upload flow
  - Upload → adds to lampiranUrls array in state
  - Hapus → removes from lampiranUrls array in state
- Action buttons: [Batal] + [Resubmit ke Bendahara]

Logic:
- State: lampiranUrls[] (initialized from existing lampiran_urls)
- Upload: POST /api/upload → get storage path → append to lampiranUrls
- Hapus: remove from lampiranUrls array (does NOT delete from storage — file stays, just not referenced)
- Resubmit: POST /api/ppk/resubmit/[id] with { lampiranUrls }
- Success: navigate to /ppk/revisi + toast "Dokumen berhasil resubmit ke Bendahara"

Note on lampiran update strategy:
- When user uploads new file: add new entry to lampiranUrls array
- When user deletes existing file: remove entry from lampiranUrls array
- When user replaces (delete then upload): old entry removed, new entry added
- Storage files are NOT deleted — only the reference in lampiran_urls is updated
- This is intentional: storage files are immutable for audit trail
```

## Files to Create/Modify

- `src/routes/api/ppk/resubmit/$id.ts` (NEW)
- `src/routes/api/ppk/revisi.ts` (NEW) — GET list
- `src/routes/ppk/revisi.tsx` (NEW)
- `src/routes/ppk/dokumen/$id/resubmit.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] POST /api/ppk/resubmit/[id] changes status to IN_BENDAHARA_APPROVAL
- [ ] Optional lampiran update applied correctly
- [ ] Log entry created with aksi='RESUBMIT_PPK'
- [ ] Revisi page lists documents correctly
- [ ] Resubmit page shows Bendahara's rejection notes
- [ ] Delete button removes file from local state
- [ ] Upload adds file to local state
- [ ] Resubmit with new files works
- [ ] Resubmit without changes works

### Edge Cases
- [ ] Non-PPK → 403
- [ ] Document not NEED_REVISION → 400
- [ ] Document revision_target not 'PPK' → 400
- [ ] Resubmit without changes → succeeds
- [ ] Resubmit with partial lampiran changes → succeeds

## Definition of Done

- [ ] API route handles FSM transition correctly (RESUBMIT_PPK)
- [ ] API route handles optional lampiran update
- [ ] Revisi list page shows correct documents
- [ ] Resubmit page shows rejection notes from Bendahara
- [ ] File delete removes from local state (not storage)
- [ ] File upload adds to local state
- [ ] Resubmit succeeds and navigates back