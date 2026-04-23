# TDD Stubs: Spec 04 — Approval Flow

## Tests for: Step 1 — Zod Schemas

### Happy Path
- [ ] `approveDokumenSchema` accepts empty object `{}`
- [ ] `rejectDokumenSchema` accepts valid catatan string ≥ 10 chars
- [ ] `resubmitDokumenSchema` accepts empty object
- [ ] `resubmitDokumenSchema` accepts object with lampiranUrls array

### Edge Cases
- [ ] `rejectDokumenSchema` rejects catatan < 10 chars (min length error)
- [ ] `rejectDokumenSchema` rejects catatan with only whitespace
- [ ] `rejectDokumenSchema` rejects empty body
- [ ] `rejectDokumenSchema` rejects missing catatan field
- [ ] `approveDokumenSchema` rejects body with extra fields (strict mode)

---

## Tests for: Step 2 — PPK Inbox API

### Happy Path
- [ ] GET /api/ppk/inbox returns 401 if not authenticated
- [ ] GET /api/ppk/inbox returns 403 if user not PPK
- [ ] GET /api/ppk/inbox returns array of documents with status IN_PPK_VALIDATION
- [ ] Response includes joined fungsi_nama and kegiatan_nama
- [ ] Documents ordered by created_at DESC
- [ ] Filter by fungsi_id returns only matching documents
- [ ] Filter by date range returns documents within range

### Edge Cases
- [ ] No documents in IN_PPK_VALIDATION → returns empty array
- [ ] Invalid fungsi_id format → returns 400

---

## Tests for: Step 3 — PPK Detail Page

### Happy Path
- [ ] GET /api/ppk/dokumen/[id] returns dokumen detail for valid PPK
- [ ] Includes creator user info (nama, tanggal ajuan)
- [ ] Includes joined fungsi_nama and kegiatan_nama
- [ ] Includes lampiran_urls array
- [ ] Non-PPK gets 403
- [ ] Document not found → 404

### Edge Cases
- [ ] Document in wrong status (not IN_PPK_VALIDATION) → 403 or 400
- [ ] Document already approved/rejected → proper error

---

## Tests for: Step 4 — PPK Approve/Reject Actions

### Happy Path (Approve)
- [ ] POST /api/ppk/dokumen/[id]/approve with valid PPK → status changes to IN_BENDAHARA_APPROVAL
- [ ] current_step changes to 'BENDAHARA'
- [ ] Log entry created with aksi='PPK_APPROVE', stepUrutan=2
- [ ] Returns success response

### Happy Path (Reject)
- [ ] POST /api/ppk/dokumen/[id]/reject with valid catatan → status changes to NEED_REVISION
- [ ] revision_target='USER', revision_notes=catatan
- [ ] Log entry created with aksi='PPK_REJECT', catatan, stepUrutan=1
- [ ] Returns success response

### Edge Cases
- [ ] Non-PPK trying to approve → 403
- [ ] Document not in IN_PPK_VALIDATION → 400
- [ ] Reject without catatan → 400 (Zod validation)
- [ ] Catatan < 10 chars → 400
- [ ] Already approved/rejected doc → 400 "already processed"

---

## Tests for: Step 5 — PPK Resubmit

### Happy Path
- [ ] POST /api/ppk/resubmit/[id] changes status from NEED_REVISION to IN_BENDAHARA_APPROVAL
- [ ] Log entry created with aksi='RESUBMIT_PPK', stepUrutan=2
- [ ] Optional lampiran_urls update applied

### Edge Cases
- [ ] Non-PPK → 403
- [ ] Document not in NEED_REVISION → 400
- [ ] Document revision_target not 'PPK' → 400
- [ ] Invalid lampiran_urls format → 400

---

## Tests for: Step 6 — Bendahara Inbox API

### Happy Path
- [ ] GET /api/bendahara/inbox returns 401/403 for non-Bendahara
- [ ] Returns documents with status IN_BENDAHARA_APPROVAL
- [ ] Includes PPK validation info (nama + tanggal from log)
- [ ] Ordered by created_at DESC

### Edge Cases
- [ ] No documents → empty array

---

## Tests for: Step 7 — Bendahara Detail Page

### Happy Path
- [ ] GET /api/bendahara/dokumen/[id] returns detail with PPK validation badge
- [ ] Includes result of PPK_APPROVE log entry (nama PPK, tanggal)

### Edge Cases
- [ ] Non-Bendahara → 403
- [ ] Document not in IN_BENDAHARA_APPROVAL → 400

---

## Tests for: Step 8 — Bendahara Approve/Reject

### Happy Path (Approve)
- [ ] BENDAHARA approve → status changes to COMPLETED, current_step=null
- [ ] Log entry: aksi='BENDAHARA_APPROVE', stepUrutan=2

### Happy Path (Reject)
- [ ] BENDAHARA reject → status=NEED_REVISION, revision_target='PPK', revision_notes=catatan
- [ ] Log entry: aksi='BENDAHARA_REJECT', catatan, stepUrutan=1

### Edge Cases
- [ ] Non-Bendahara → 403
- [ ] Document not in IN_BENDAHARA_APPROVAL → 400
- [ ] Reject without catatan → 400

---

## Tests for: Step 9-10 — List Pages

### Happy Path
- [ ] All list pages render empty state when no data
- [ ] All list pages show loading spinner during fetch
- [ ] All list pages show error state on fetch failure with retry button
- [ ] Table columns match spec requirements per page
- [ ] Status badges display correct colors

### Edge Cases
- [ ] Search/filter returns empty result → shows "tidak ada dokumen" message