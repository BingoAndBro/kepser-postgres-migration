# Test Stubs — Spec 03: Submit Flow

## Tests for: Step 1 — DB Migration

### Happy Path
- [ ] Migration generates correct SQL for `dokumen_transaksi` table
- [ ] Migration generates correct SQL for `log_aktivitas` table
- [ ] RLS policies are created correctly
- [ ] Storage bucket `dokumen-lampiran` is created (private)
- [ ] Storage RLS policies allow upload by authenticated users

### Edge Cases
- [ ] FK constraints: deleting fungsi/kegiatan does not cascade to dokumen_transaksi (restrict)
- [ ] JSONB lampiran_urls accepts valid structure

## Tests for: Step 2 — Zod Schemas & DB Helpers

### Happy Path
- [ ] `createDokumenSchema` validates valid input
- [ ] `createDokumenSchema` rejects missing required fields
- [ ] `lampiranUrlSchema` validates valid lampiran entry
- [ ] `getDokumenByUser` returns only user's own documents
- [ ] `createDokumen` inserts record and returns it
- [ ] `insertLog` appends entry to log_aktivitas

### Edge Cases
- [ ] `createDokumenSchema` rejects invalid UUID for fungsi_id
- [ ] `createDokumenSchema` rejects year out of reasonable range (e.g., year 1900)
- [ ] Empty lampiran_urls array is valid (pre-upload state)

### Error Cases
- [ ] `getDokumenById` throws if dokumen not found
- [ ] `getDokumenByUser` returns empty array if user has no documents

## Tests for: Step 3 — Dokumen API Endpoints

### Happy Path
- [ ] GET /api/dokumen returns list of user's own documents
- [ ] GET /api/dokumen returns empty array if no documents
- [ ] POST /api/dokumen creates DRAFT dokumen with correct judul
- [ ] POST /api/dokumen generates judul: "[Kegiatan] [Tahun] [Nama Pegawai]"
- [ ] GET /api/dokumen/[id] returns full document with relations
- [ ] PATCH /api/dokumen/[id] updates lampiran_urls
- [ ] POST /api/dokumen/[id]/submit transitions DRAFT → IN_PPK_VALIDATION via FSM
- [ ] POST /api/dokumen/[id]/submit inserts log_aktivitas entry with aksi='SUBMIT'
- [ ] POST /api/dokumen/[id]/submit sets current_step='PPK'
- [ ] POST /api/dokumen/[id]/submit (resubmit) transitions NEED_REVISION → IN_PPK_VALIDATION

### Edge Cases
- [ ] GET /api/dokumen/[id] by non-owner returns 403
- [ ] PATCH /api/dokumen/[id] on non-NEED_REVISION dokumen returns 400
- [ ] PATCH /api/dokumen/[id] on NEED_REVISION but wrong target returns 400
- [ ] PATCH /api/dokumen/[id] on dokumen owned by different user returns 403
- [ ] POST /api/dokumen/[id]/submit on already-submitted dokumen returns 400

### Error Cases
- [ ] POST /api/dokumen without auth returns 401
- [ ] POST /api/dokumen/[id]/submit without lampiran required returns 400 with specific error
- [ ] GET /api/dokumen/[id] with invalid UUID returns 400

## Tests for: Step 4 — Upload & Download

### Happy Path
- [ ] POST /api/upload accepts valid PDF file < 10MB
- [ ] POST /api/upload returns { url, nama, kelengkapan_id, uploaded_at }
- [ ] GET /api/dokumen/[id]/download/[index] returns signed URL
- [ ] Signed URL expires in 1 hour

### Edge Cases
- [ ] POST /api/upload with file exactly 10MB succeeds
- [ ] POST /api/upload with DOCX succeeds
- [ ] POST /api/upload with XLSX succeeds

### Error Cases
- [ ] POST /api/upload with file > 10MB returns 400
- [ ] POST /api/upload with .exe file returns 400
- [ ] POST /api/upload with .jpg file returns 400
- [ ] POST /api/upload without auth returns 401
- [ ] GET /api/dokumen/[id]/download/[index] without auth returns 401
- [ ] GET /api/dokumen/[id]/download with invalid index returns 400

## Tests for: Step 5 — Dokumen Saya List Page

### Happy Path
- [ ] Page loads and shows table of user's documents
- [ ] Empty state displays friendly message
- [ ] Filter by status works
- [ ] Filter by fungsi works
- [ ] Search by judul works
- [ ] "Ajukan Dokumen Baru" button links to /dokumen/aju
- [ ] Click document row navigates to detail

### Edge Cases
- [ ] Paginated at 10 per page
- [ ] Sorting by date descending (newest first)
- [ ] Status badge shows correct color per status

## Tests for: Step 6 — Ajukan Dokumen Form

### Happy Path
- [ ] Step 1: Dropdown fungsi loads 6 fungsi from DB
- [ ] Step 1: Tahun dropdown shows correct range (current-5 to current+2)
- [ ] Step 1: Tanggal date picker accepts valid date
- [ ] Step 2: Dropdown kegiatan filters by selected fungsi
- [ ] Step 2: Cannot advance without selecting kegiatan
- [ ] Step 3: Toggle "Ya" shows text about Ketua Tim kelengkapan
- [ ] Step 4: Checklist shows correct kelengkapan for kegiatan + role
- [ ] Step 4: Required items marked with orange "WAJIB" badge
- [ ] Step 4: Upload button opens file picker
- [ ] Step 4: After upload, filename and size displayed with check icon
- [ ] Step 4: Cannot advance to step 5 if required items missing
- [ ] Step 5: Review summary shows all entered data
- [ ] Submit creates dokumen and redirects to /dokumen/saya
- [ ] Submit shows success toast

### Edge Cases
- [ ] Back button from step 5 to step 4 preserves uploaded files
- [ ] Navigate away mid-form: browser warns about data loss
- [ ] Double-submit is prevented (button disabled during loading)

### Error Cases
- [ ] Submit fails: shows error toast with message from server
- [ ] Network error during upload: shows retry option

## Tests for: Step 7 — Detail Dokumen

### Happy Path
- [ ] Page loads document details
- [ ] Status badge shows correct status
- [ ] Current step indicator shows correct position
- [ ] Lampiran list shows all uploaded files with download buttons
- [ ] Download button generates signed URL and opens/downloads file
- [ ] "Perbaiki & Resubmit" button visible only when status=NEED_REVISION & target=USER
- [ ] Revision notes displayed in warning box when status=NEED_REVISION

### Error Cases
- [ ] Non-owner accessing detail returns 403 → redirect

## Tests for: Step 8 — Edit & Resubmit

### Happy Path
- [ ] Page loads only for dokumen owned by user with NEED_REVISION target=USER
- [ ] Revision notes from PPK displayed (read-only)
- [ ] Already-uploaded files shown with filename
- [ ] Can re-upload files (replace existing)
- [ ] "Resubmit" button creates log entry with aksi='RESUBMIT'
- [ ] After resubmit, redirect to /dokumen/saya with success toast

### Edge Cases
- [ ] Accessing edit page for dokumen not owned by user → redirect
- [ ] Accessing edit page for dokumen with status != NEED_REVISION → redirect
- [ ] Accessing edit page for NEED_REVISION but target=PPK → redirect

## FSM Tests (Cross-Cutting)

### Happy Path
- [ ] transition('DRAFT', 'SUBMIT', 'PEGAWAI') returns IN_PPK_VALIDATION, step='PPK'
- [ ] transition('NEED_REVISION', 'RESUBMIT', 'PEGAWAI') returns IN_PPK_VALIDATION, step='PPK'

### Error Cases
- [ ] transition('IN_PPK_VALIDATION', 'SUBMIT', 'PEGAWAI') returns error (already submitted)
- [ ] transition('COMPLETED', 'SUBMIT', 'PEGAWAI') returns error (invalid state)
- [ ] transition('NEED_REVISION', 'RESUBMIT', 'PPK') returns error (wrong actor for this target)
