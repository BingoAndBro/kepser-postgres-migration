# Phase 14I.0 - Folder-First Storage Guards

Date: 2026-05-31

Status: implemented pending targeted validation and human smoke.

## Why This Phase Exists

Phase 14I schema cleanup was blocked because active storage/file-access/admin cleanup code still read legacy canonical archive storage guards, especially `arsip.arsip.lampiran_snapshot`.

Dropping legacy canonical schema before replacing those guards would risk weakening file protection, cleanup diagnostics, and destroyed-file handling. Phase 14I.0 removes those active runtime dependencies first.

## Replaced Legacy Guards

The following active runtime areas no longer use legacy canonical archive snapshots as storage guards:

- document token file access;
- raw internal logical-path file access;
- replaced-attachment cleanup reference protection;
- local storage diagnostics;
- admin storage analysis;
- admin orphan cleanup.

Removed as active guards:

- `arsip.arsip`;
- `arsip.lampiran_snapshot`;
- `canonical_arsip_id` bridge data.

## New Guard Policy

Folder-first/current-source authority is:

- `dokumen.dokumen_transaksi.lampiran_urls` for `WORKFLOW` source files;
- `arsip.manual_arsip_attachment.logical_path` for `MANUAL` source files;
- `arsip.berkas_arsip_item` for folder membership;
- `arsip.berkas_arsip.status_arsip` for lifecycle and `DIMUSNAHKAN` destroyed-file blocking.

Admin diagnostics and cleanup may use internal logical paths to compute candidates, but API responses must return safe counts/categories only. They must not expose logical paths, physical paths, storage roots, tokens, signed-token internals, SQL details, env/session/cookie values, raw rows, or secrets.

File access continues to authorize first, then revalidate current source/folder state. `CLOSED/DIMUSNAHKAN` folder membership blocks stale access with safe destroyed-file copy.

## Schema Boundary

No schema, migration, or data cleanup is included in Phase 14I.0.

Do not drop or modify yet:

- `arsip.arsip`;
- `arsip.lampiran_snapshot`;
- `manual_arsip.canonical_arsip_id`;
- `berkas_arsip_item.canonical_arsip_id`;
- Drizzle schema files;
- Drizzle migrations.

## Next Phase

Phase 14I can proceed as the schema-drop phase after targeted validation confirms active storage/admin code no longer depends on legacy canonical snapshot guards.
