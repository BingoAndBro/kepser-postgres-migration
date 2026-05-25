# Phase 12N.8b - Lifecycle Confirmation Copy Hardening

Date: 2026-05-25

Status: implemented for review. This phase improves confirmation copy for existing unified archive lifecycle UI actions only.

## 1. Scope And Boundary

Phase 12N.8b updates confirmation and warning copy on:

```text
/arsiparis/arsip/$id
```

The existing lifecycle API remains unchanged:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

This phase does not change lifecycle API behavior, request bodies, status transition rules, redirects, file-access helpers, list pages, legacy proposal routes, schema, migrations, package files, route generation, storage, cleanup, or database rows.

## 2. Human Clarification

Human clarification for this phase:

- `cancel_proposal` is skipped and remains backlog.
- The immediate requirement is clearer confirmation copy so Kasubag understands lifecycle movement consequences.
- Status movement must warn that the status cannot be easily reversed and cannot be returned through the current UI.
- `DIMUSNAHKAN` is currently interim status-based destruction: file access is blocked, but physical files are not deleted.
- The final business goal is future physical file deletion/storage cleanup while preserving archive metadata, but that requires a separate human-approved phase.

## 3. Confirmation Copy For AKTIF -> INAKTIF

The existing action body remains:

```json
{ "action": "mark_inactive" }
```

Confirmation copy:

```text
Pindahkan arsip ini ke status Inaktif?

Arsip akan keluar dari daftar Arsip Aktif dan masuk ke Arsip Inaktif.

Status ini tidak dapat dikembalikan lagi melalui fitur saat ini. Pastikan keputusan ini sudah benar sebelum melanjutkan.

Aksi ini tidak menghapus file arsip.
```

## 4. Confirmation Copy For INAKTIF -> USUL_MUSNAH

The existing action body remains:

```json
{ "action": "propose_destruction" }
```

Confirmation copy:

```text
Ajukan arsip ini ke Usul Musnah?

Arsip akan masuk ke daftar Usul Musnah dan siap untuk proses pemusnahan.

Status ini tidak dapat dikembalikan lagi melalui fitur saat ini. Pastikan arsip memang sudah layak diajukan untuk dimusnahkan.

Aksi ini belum memusnahkan arsip dan belum menghapus file.
```

## 5. Destructive Warning Copy Update

The `Musnahkan Arsip` panel now warns before final confirmation that:

- arsip akan berubah menjadi `DIMUSNAHKAN`;
- setelah dimusnahkan, status tidak dapat dikembalikan melalui fitur saat ini;
- preview dan download file akan diblokir;
- metadata arsip tetap dapat dilihat oleh pengguna berwenang;
- pada implementasi saat ini, file fisik belum dihapus dari storage;
- penghapusan file fisik akan menjadi fase terpisah;
- audit khusus belum ditulis di fase ini and remains a development/local-LAN limitation.

The exact phrase requirement remains:

```text
SETUJUI PEMUSNAHAN ARSIP
```

## 6. Current Interim File Behavior

Current 12N.5/12N.8/12N.8b behavior is status-based destruction only:

- `USUL_MUSNAH -> DIMUSNAHKAN` updates lifecycle status through the existing API.
- Preview/download file access is blocked server-side after `DIMUSNAHKAN`.
- Physical files remain in storage.
- `lampiran_snapshot` remains preserved.
- Manual archive attachment rows remain preserved.
- Metadata remains visible to authorized users.

## 7. Future Physical File Deletion Note

Future physical deletion/storage cleanup must be a separate human-approved phase. That phase should define:

- retention and deletion policy;
- authorized actor and confirmation requirements;
- file deletion transaction or compensation behavior;
- metadata preservation boundary;
- audit requirements;
- safe reporting that does not expose physical storage paths, storage roots, tokens, SQL, env values, or secrets.

## 8. What Is Intentionally Not Changed

This phase does not:

- change lifecycle API route behavior;
- change request bodies;
- change status transition rules;
- implement `cancel_proposal`;
- implement `restore_active`;
- implement transition out of `DIMUSNAHKAN`;
- change redirect behavior;
- change file access helpers;
- modify unified list pages;
- modify legacy proposal routes;
- write audit logs;
- create audit tables;
- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- change preview/download behavior;
- create migrations;
- modify schema;
- touch `db/`, `drizzle/`, or `supabase/`;
- modify package files;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run broad build/E2E;
- run DB migrations/seeds;
- run cleanup.

## 9. Validation

Required validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
```

Required protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

No broad build, E2E, DB migrations, seeds, route generation, cleanup, or destructive storage tests are required.

## 10. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for `AKTIF` archive.
3. Click `Pindahkan ke Inaktif`.
4. Confirm message explains it moves to Inaktif, cannot be returned through current feature, and does not delete files.
5. Cancel once and confirm no change.
6. Repeat and approve; expected redirect to `/arsiparis/inaktif`.
7. Open unified detail for `INAKTIF` archive.
8. Click `Pindahkan ke Usul Musnah`.
9. Confirm message explains it moves to Usul Musnah, cannot be returned through current feature, and is not final destruction.
10. Cancel once and confirm no change.
11. Repeat and approve; expected redirect to `/arsiparis/usul-musnah`.
12. Open unified detail for `USUL_MUSNAH` archive.
13. Open `Musnahkan Arsip` confirmation panel.
14. Confirm warning says status cannot be returned through current feature.
15. Confirm warning says file access is blocked.
16. Confirm warning says physical file deletion is not implemented yet and will be a separate phase.
17. Confirm warning says metadata remains visible.
18. Confirm no path/token/storage root/SQL/env/secrets appears.

## 11. Next Phase Recommendation

Recommended next phase:

```text
Phase 12N.9 - Archive-native destruction audit planning
```

After audit policy is settled, a later separate phase may define physical file deletion/storage cleanup while preserving archive metadata. Do not combine audit policy, physical deletion, legacy proposal bridging, and UI reversal features unless a human explicitly approves a combined scope.
