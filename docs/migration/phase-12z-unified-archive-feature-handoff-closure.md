# Phase 12Z - Unified Archive Feature Handoff / Closure Review

Date: 2026-05-28

Status: documented closure review. This phase is documentation-only and does not add runtime behavior, routes, lifecycle changes, preview/download changes, cleanup behavior, schema changes, migrations, package changes, route generation, DB work, storage work, or Supabase runtime behavior.

## 1. Scope And Closure Boundary

Phase 12Z closes the broad Phase 12 unified archive feature set as a documented internal/local/LAN development milestone.

This is a bounded archive feature handoff for human-controlled local/internal/LAN use. It is not production readiness, not public rollout approval, not go-live approval, not operational certification, not security certification, and not compliance validation.

The closure target is the current unified archive feature surface after Phase 12Q.1, with intentionally deferred production hardening and optional feature polish recorded as backlog.

## 2. Implemented Feature Inventory

Implemented Phase 12 archive/unified archive work includes:

- canonical archive parent model on `arsip.arsip`;
- unified canonical archive list pages for active, inactive, and proposed-destruction archives;
- unified canonical archive detail at `/arsiparis/arsip/$id`;
- source-aware `WORKFLOW` and linked `MANUAL` detail metadata;
- source-aware attachment metadata display;
- authorized preview/download actions from unified detail;
- modal preview UX and compact attachment card UX;
- unified lifecycle helper, API, and detail UI for `AKTIF -> INAKTIF`, `INAKTIF -> USUL_MUSNAH`, and `USUL_MUSNAH -> DIMUSNAHKAN`;
- server-side `DIMUSNAHKAN` blocking for preview/download/file access, including stale unified file action URLs;
- internal source-aware physical file destruction helper foundation for already-destroyed archives;
- obsolete legacy proposal/status-specific archive route removal;
- metadata-only unified aggregate and CSV export;
- internal local/development Manual Archive invalid metadata/storage cleanup helper;
- unified archive classification report at `/arsiparis/laporan-klasifikasi`;
- classification report detail drilldown at `/arsiparis/laporan-klasifikasi/detail` without per-archive detail actions.

## 3. Current Canonical Routes

Important user-facing routes:

- `/arsiparis/aktif`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/arsip/$id`
- `/arsiparis/laporan-klasifikasi`
- `/arsiparis/laporan-klasifikasi/detail`

Important APIs:

- `GET /api/arsiparis/arsip/$id`
- `POST /api/arsiparis/arsip/$id/lifecycle`
- `GET /api/arsiparis/arsip/aggregate`
- `GET /api/arsiparis/arsip/export`
- `GET /api/arsiparis/arsip/classification-report`
- `GET /api/arsiparis/arsip/classification-report-detail`

The retained list APIs for `/api/arsiparis/aktif`, `/api/arsiparis/inaktif`, and `/api/arsiparis/usul-musnah` remain read-only canonical list surfaces.

## 4. Data And Source Policy

Canonical `arsip.arsip` is the unified archive source of truth for list, detail, lifecycle, aggregate/export, and classification reporting.

Supported canonical source types are:

- `WORKFLOW`
- `MANUAL`

`WORKFLOW` rows represent archived workflow documents. Linked `MANUAL` rows represent Manual Archive source records connected through the canonical parent. Unlinked legacy `manual_arsip` rows are excluded from unified reports, unified lists, unified detail, lifecycle mutation, aggregate/export, and classification drilldown until a separate human-approved remediation/canonicalization path includes them.

Legacy proposal/status-specific archive routes are no longer authoritative runtime surfaces. Operators should use the canonical detail route and canonical lifecycle API.

Active Supabase runtime/package dependency remains retired. Historical Supabase docs, tests, comments, `.env.example` residue, and `supabase/` artifacts remain as traceability or cleanup backlog. This closure does not claim Supabase is fully removed from the repository.

## 5. Security And Access Policy

`dms_session` remains the authentication boundary. `dms_active_role` is UX-only state and is not authorization proof.

Server/API RBAC remains authoritative. The operational archive role is assigned `KEPALA_SUB_BAGIAN_UMUM`. `ADMIN` is a dedicated administration role and must not be treated as universal operational archive access.

Unsafe actions use server/API checks, including session validation, server-side role validation, request/body validation, and same-origin protection where applicable.

Archive APIs, pages, exports, and file actions must not expose physical filesystem paths, storage roots, logical file references, file tokens, signed token internals, raw attachment metadata, raw DB rows, SQL details, env values, session/cookie values, or secrets.

## 6. Lifecycle Policy

Current lifecycle flow:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Policy:

- `DIMUSNAHKAN` is terminal by default.
- No restore/reactivation path is approved in the current feature set.
- `DIMUSNAHKAN` blocks preview/download/file access server-side.
- Metadata may remain visible to authorized `KEPALA_SUB_BAGIAN_UMUM` users.
- Lifecycle mutation uses canonical archive ids, not legacy proposal ids.
- Linked `MANUAL` lifecycle mutation must sync canonical and source status in one guarded transaction and fail closed on drift.

Current physical deletion policy and limitations:

- the source-aware physical destruction helper exists;
- it is internal/helper-only unless a later human-approved runtime wiring phase changes that;
- it only targets archives already marked `DIMUSNAHKAN`;
- metadata preservation remains required;
- the helper does not create audit records, add UI/API/scheduler wiring, or run broad cleanup.

## 7. Reporting Policy

Aggregate/export is metadata-only. CSV export is metadata-only and bounded to the existing unified query limit.

The classification report uses canonical `arsip.arsip` rows across `WORKFLOW` and linked `MANUAL` sources. The classification drilldown lists archives for one classification/folder bucket and intentionally does not show per-archive detail actions.

`nominal_realisasi` totals count only safely available `WORKFLOW` material archive values. `MANUAL` archives do not contribute nominal totals. Non-material workflow rows do not contribute nominal totals.

Reports and exports must not include file contents, file URLs, signed URLs, token internals, physical paths, storage roots, raw attachment metadata, raw DB rows, SQL details, env values, session/cookie values, or secrets.

## 8. Cleanup Status

Invalid Manual Archive development metadata cleanup exists as an internal local/development helper and was used locally for development data hygiene.

Local orphan storage cleanup was performed through the existing admin analyze/cleanup workflow. That cleanup work is local/development evidence, not a production cleanup workflow or broad operational cleanup approval.

The existing admin cleanup API is analyze-first and generic. Future expansion should explicitly protect Manual Archive attachment references and canonical archive references before broader operational use.

No cleanup, physical deletion, migration, seed, or storage command is run by Phase 12Z.

## 9. Deferred And Backlog Items

Intentionally deferred:

- archive-native audit persistence/schema;
- runtime wiring for the physical deletion helper if the business explicitly approves it;
- production hardening and operational certification work;
- HTTPS plus `Secure` `dms_session` as the preferred final deployment posture;
- full CSRF token framework if deployment expands;
- persistent/distributed rate limiting;
- broader regression and E2E automation;
- historical Supabase artifact cleanup, if ever desired by human policy;
- optional CSV export for classification report/drilldown, if desired;
- optional UI polish, filtering, and wider report ergonomics.

These items must remain separate scoped phases and should not be mixed into Phase 12Z closure.

## 10. Manual Retest Checklist

Before final human acceptance, run a focused smoke pass:

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/aktif`, `/arsiparis/inaktif`, and `/arsiparis/usul-musnah`.
3. Open unified detail from each list where data exists.
4. Confirm source-aware `WORKFLOW` and linked `MANUAL` metadata display.
5. Confirm preview opens in the modal for available authorized attachments.
6. Confirm download uses the authorized server route.
7. Run `AKTIF -> INAKTIF` on disposable/safe data if available.
8. Run `INAKTIF -> USUL_MUSNAH` on disposable/safe data if available.
9. Run `USUL_MUSNAH -> DIMUSNAHKAN` only on approved disposable/safe data.
10. Confirm `DIMUSNAHKAN` hides file actions and stale preview/download URLs fail.
11. Open `/api/arsiparis/arsip/aggregate` as Kasubag and confirm counts look plausible.
12. Download CSV export from archive list pages and confirm metadata-only output.
13. Open `/arsiparis/laporan-klasifikasi`.
14. Open classification `Detail` drilldown and confirm it lists archives in the selected bucket without per-archive detail actions.
15. Login as `ADMIN`-only if available and confirm operational archive APIs return access denied.
16. Confirm no path, token, storage root, raw attachment metadata, SQL/env/session/cookie/secret leak is visible in UI, API errors, exports, or browser-visible output.

Use redacted identifiers in smoke notes. Do not record secrets, session/cookie values, storage roots, file references, token internals, raw DB rows, SQL parameters, or raw attachment metadata.

## 11. Closure Verdict

Phase 12 archive unified feature set is ready to be closed as local/internal/LAN development milestone pending/after human smoke.

This closure is bounded to the implemented local/internal/LAN archive feature surface. It does not approve production readiness, public internet rollout, go-live, operational certification, security certification, compliance validation, or full repository-wide Supabase artifact removal.

## 12. Validation For This Phase

Required validation for Phase 12Z:

```bash
git diff --check
```

No tests are required because this is a documentation-only closure phase. Do not run broad build/E2E, route generation, DB migrations/seeds, cleanup, physical deletion, or live backfill for this phase.

Required protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- db
git diff -- drizzle
git diff -- supabase
git diff -- src/routeTree.gen.ts
```

## 13. Commit Recommendation

Do not commit Phase 12Z closure docs until a human reviews the closure wording and accepts the bounded milestone framing.
