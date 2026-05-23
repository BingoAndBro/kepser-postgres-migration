# Phase 12J.2a - Manual Archive Attachment Title Schema

Date: 2026-05-23

Status: implemented pending human review and migration execution.

Scope: schema, migration, narrow runtime insert compatibility, focused tests, and documentation. This phase does not implement upload-row UI, explicit title validation, preview/download, signed file tokens, attachment delete, lifecycle transitions, aggregate reports, Excel export, package changes, route generation, seed execution, or Supabase runtime behavior.

## Boundary

Manual archive attachment titles are now official data, not metadata-only data.

The canonical column is:

- `arsip.manual_arsip_attachment.judul_lampiran`

`metadata` remains available for supplemental future attributes, but attachment title must not rely on metadata JSON as its only storage location.

This phase remains within the post-migration partial/bounded release handoff posture for human-controlled internal/local/LAN use. It does not approve public production use, public internet exposure, go-live, operational certification, security certification, or a full Supabase repository cleanup. The active Supabase runtime/package dependency remains retired, and historical Supabase artifacts remain.

## Migration Notes

Migration created:

- `drizzle/0004_manual_archive_attachment_title.sql`

The migration:

- adds `judul_lampiran` as nullable first;
- backfills blank or missing values from `original_filename`;
- uses `Lampiran` as a defensive fallback if an existing `original_filename` is blank;
- sets `judul_lampiran` to `NOT NULL`;
- adds `manual_arsip_attachment_judul_lampiran_nonempty` with `CHECK (length(trim(judul_lampiran)) > 0)`.

The migration was not executed in this phase.

## Runtime Compatibility

Existing upload behavior stays compatible for Phase 12J.1/12J.2. The attachment upload API does not require an explicit title yet and temporarily writes `judul_lampiran` from `original_filename`.

Phase 12J.2b should add explicit upload rows where each row has one `judul_lampiran` value and exactly one file, following the intended Non-Material document upload pattern.

## Out Of Scope

This phase does not add manual archive preview/download, signed URL/file tokens, attachment delete, lifecycle actions, manual archive PATCH, aggregate/report/export behavior, or public/static file serving.
