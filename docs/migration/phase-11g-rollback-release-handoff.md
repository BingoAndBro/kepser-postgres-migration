# Phase 11G.6 - Operations Rollback And Release Handoff

Date: 2026-05-21.

Status: handoff documentation prepared. No runtime source, tests, package files, env files, DB migrations, seeds, route generation, backup/restore command, LAN/firewall/network command, cleanup command, deployment command, or commit was changed or run by this phase.

This document consolidates rollback guidance, operator handoff, evidence inventory, Supabase retirement handoff, security decision gates, and Phase 11H release-input checklist for the clean local DMS target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no active Supabase runtime fallback.

11G.6 does not approve production readiness, LAN readiness, release readiness, operational certification, or go-live. Phase 11H remains human-controlled and is not automatically approved by this handoff.

## Evidence Inventory

The evidence below is bounded operational input. It is not exhaustive certification.

| Phase | Evidence | Classification | What it supports | What it does not prove |
|---|---|---|---|---|
| 11G.2a | `docs/migration/phase-11g-performance-baseline-plan.md` | Recorded clean preview Lighthouse evidence | Clean preview pages reported Performance 97-99 and Accessibility 92-96 on the recorded pages. | Not final serving performance certification, not HTTPS/reverse-proxy validation, not exhaustive route coverage. |
| 11G.3 | `docs/migration/phase-11g-backup-restore-evidence.md` | PASS for bounded backup/restore drill | Paired PostgreSQL dump plus storage backup was restored into a clean target and representative app checks passed. | Not automatic rollback approval, not exhaustive dataset proof, not permission to overwrite active DB/storage. |
| 11G.4 | `docs/migration/phase-11g-lan-smoke-evidence.md` | PASS for bounded trusted LAN smoke | Another trusted LAN client could use the app after 11G.4a/11G.4b, with PostgreSQL not broadly exposed. | Not LAN readiness, not public-network safety, not final HTTPS posture, not broad device/browser matrix coverage. |
| 11G.5 | `docs/migration/phase-11g-security-review.md` | Review complete | Cookie auth, CSRF/rate-limit posture, sensitive routes, and P1/P2 security gaps are documented. | Not security hardening implementation, not penetration testing, not final security acceptance. |

Prior source/package Supabase retirement audits remain recorded in Phase 11E/11F/11G docs. Historical Supabase documentation references may remain for migration traceability.

## Rollback Plan

These rollback steps are operational guidance unless explicitly tied to the bounded 11G.3 restore drill evidence. The 11G.3 drill validated a paired backup/restore flow into a clean target; it did not validate every future rollback scenario or authorize overwriting an active runtime.

### App Source Rollback

Preferred concept:

1. Human records current branch and commit before changing the runtime.
2. Human selects the previous known-good commit, branch, or tag.
3. Human reviews whether the selected app version is compatible with the selected DB dump and storage backup.
4. Human restores source using an approved non-interactive Git procedure.
5. Human rebuilds/restarts only after DB/storage/config compatibility is checked.

Command examples, if used later, must be treated as templates and reviewed before execution. Do not run destructive Git commands against an active working tree without explicit human approval.

Template labels:

- `<CURRENT_COMMIT>`
- `<KNOWN_GOOD_COMMIT_OR_TAG>`
- `<ROLLBACK_BRANCH>`
- `<APP_VERSION_LABEL>`

### Database Rollback

Use a paired PostgreSQL dump from the selected backup set.

Rules:

- Restore into a clean target first when possible.
- Do not overwrite the active DB unless the human explicitly approves the target and accepts data loss/divergence risk.
- Verify dump provenance and trust before restore.
- If post-backup runtime activity exists, explicitly decide how to handle data divergence before rollback.
- Do not run migrations or seeds during rollback unless a separate approved plan requires it.

Validated by 11G.3:

- Human evidence recorded a paired PostgreSQL dump, dump validation, clean-target restore, and representative app validation.

Guidance only:

- Any future active-environment overwrite, partial restore, point-in-time selection, or post-backup divergence handling.

### Storage Rollback

Use the storage archive/copy paired with the selected DB dump.

Rules:

- Preserve logical path alignment between `dokumen_transaksi.lampiran_urls`, `arsip.lampiran_snapshot`, and restored files.
- Restore to the configured storage root for the selected target without printing the physical path.
- Validate preview/download through app routes, not direct physical paths.
- Treat DB and storage as a pair.
- Never restore only DB or only storage unless the mismatch is understood, documented, and accepted by the human.

Validated by 11G.3:

- Human evidence recorded matching storage backup/restore file count and representative DB/storage alignment checks.

Guidance only:

- Large-dataset exhaustive hash validation, future retention rotation, and active storage overwrite operations.

### Config Rollback

Environment files remain human-controlled.

Record key names only, never values:

- `DATABASE_URL`
- `DMS_LOCAL_STORAGE_ROOT`
- `SESSION_SECRET`
- `DMS_FILE_TOKEN_SECRET`
- `APP_URL`
- `HOST`
- `PORT`
- `DMS_SESSION_COOKIE_SECURE`
- `NODE_ENV`

Rules:

- Do not copy `.env` from docs or chat.
- Do not print DB URLs, secrets, storage roots, tokens, cookie values, password hashes, or physical paths.
- Confirm whether restore-target overrides are still active before restarting normal runtime.
- Confirm `DMS_SESSION_COOKIE_SECURE` matches the selected serving posture.

### LAN Deployment Rollback

If a LAN serving change must be rolled back:

1. Stop the app serving process.
2. Return host binding to the prior local-only or approved serving mode.
3. Remove or close any temporary app-port firewall exception if it was added for smoke only.
4. Confirm PostgreSQL remains not broadly exposed to LAN.
5. Clear or revise temporary trusted HTTP LAN settings if moving back to HTTPS or local-only mode.
6. Record the rollback result without secrets or physical paths.

Do not run firewall or network commands from this handoff. The operator performs them manually if approved.

### Runtime Data Rollback Caveat

Rollback after new runtime activity may require explicit handling of post-backup data divergence:

- documents submitted after the backup;
- workflow approvals/rejections after the backup;
- password/session/user changes after the backup;
- uploaded files after the backup;
- archive lifecycle or destruction actions after the backup;
- admin cleanup actions after the backup.

If these exist, the human must decide whether to discard, re-enter, manually reconcile, or preserve them before restoring.

## Operator Handoff Checklist

Use this before Phase 11H or before any rollback rehearsal.

| Item | Required status | Reviewer/operator signoff |
|---|---|---|
| Current branch recorded | `<BRANCH>` recorded without secrets | `<SIGNOFF>` |
| Current commit recorded | `<COMMIT>` recorded by operator | `<SIGNOFF>` |
| Selected backup id recorded | `<BACKUP_ID>` recorded | `<SIGNOFF>` |
| PostgreSQL dump available | yes/no | `<SIGNOFF>` |
| Storage archive/copy available | yes/no | `<SIGNOFF>` |
| Backup manifest available | yes/no | `<SIGNOFF>` |
| Restore drill evidence reviewed | `phase-11g-backup-restore-evidence.md` reviewed | `<SIGNOFF>` |
| LAN smoke evidence reviewed | `phase-11g-lan-smoke-evidence.md` reviewed | `<SIGNOFF>` |
| Security review findings reviewed | `phase-11g-security-review.md` reviewed | `<SIGNOFF>` |
| P1 findings accepted or scheduled before 11H | explicit decision required | `<SIGNOFF>` |
| Final HTTPS decision noted | HTTPS, trusted HTTP LAN, or deferred with risk | `<SIGNOFF>` |
| `DMS_SESSION_COOKIE_SECURE` behavior understood | key behavior documented, no value printed | `<SIGNOFF>` |
| No old Supabase data/file recovery expected | confirmed | `<SIGNOFF>` |
| No Supabase runtime fallback expected | confirmed | `<SIGNOFF>` |
| DB/storage rollback pairing understood | confirmed | `<SIGNOFF>` |
| Post-backup divergence plan recorded | required if runtime activity occurred after backup | `<SIGNOFF>` |

## Release Input Checklist For 11H

### Completed Evidence

- 11G.2a clean preview Lighthouse evidence is recorded.
- 11G.3 paired backup/restore drill is recorded as bounded PASS.
- 11G.4 trusted LAN smoke is recorded as bounded PASS after 11G.4a and 11G.4b.
- 11G.5 cookie auth, CSRF, rate-limit, and sensitive-route review is complete.
- Active source/runtime/package Supabase grep audit for this phase returned no matches in `src`, `tests`, `package.json`, and `pnpm-lock.yaml`.

### Unresolved P1 Before 11H Or Wider Rollout

These are not implicitly accepted by 11G.6 documentation.

- CSRF/origin strategy for cookie-authenticated state-changing routes.
- Login rate-limit/brute-force foundation.
- Destructive admin cleanup hardening.
- Raw logical-path file-access narrowing or status revalidation for `DIMUSNAHKAN`.

11H cannot honestly claim final readiness unless these P1 items are implemented, explicitly accepted with bounded deployment constraints, or deferred with written risk acceptance.

### P2/P3 Backlog

- Scoped throttling/audit coverage for upload, file-token issuance, workflow, archive, and admin mutations.
- Optional re-auth/step-up confirmation for high-impact admin/account changes.
- Remember-me request shape confirmation.
- Optional `/bps-logo.png` asset hygiene.
- Dashboard/main-thread/TBT optimization only if clean evidence later shows meaningful lag.
- Broader accessibility polish beyond the recorded fixes.
- Backup schedule and retention policy.
- Final serving topology, cache, and compression ownership.
- Archive scheduler replacement.

### Accepted Residual Risks To Review

- Trusted HTTP LAN may temporarily use `DMS_SESSION_COOKIE_SECURE=false`; this remains internal/trusted only.
- HTTP blob download warning over insecure HTTP is expected and reinforces HTTPS preference.
- 11G.3 restore evidence is representative and bounded, not exhaustive full-dataset certification.
- 11G.4 LAN evidence is bounded to the recorded trusted LAN smoke, not a public exposure review.
- Historical Supabase docs references remain as migration traceability.
- No old Supabase data/file migration, copy, download, backfill, sync, or recovery is expected.

### Explicit Human Decisions Required

- Whether P1 security findings are implemented before 11H, accepted with bounded constraints, or deferred with written risk acceptance.
- Whether final deployment uses HTTPS plus `Secure` cookies or remains temporarily trusted HTTP LAN.
- Whether any remaining historical docs/package/env cleanup is required before final handoff.
- Whether backup retention/schedule is sufficient for the operator.
- Whether post-backup data divergence exists and how it is handled for rollback.
- Whether PostgreSQL remains localhost/Docker-network only, with no broad LAN exposure.
- Whether final 11H classification is complete, partial, or blocker.

## P1 Security Decision Gate

Carry-forward P1 items from 11G.5:

| P1 item | Current state | 11H gate |
|---|---|---|
| CSRF/origin strategy | Not implemented in 11G.5/11G.6 | Implement, explicitly accept trusted bounded constraints, or defer with written risk acceptance. |
| Login rate-limit/brute-force foundation | Not implemented in 11G.5/11G.6 | Implement app-layer protection or document why constrained deployment accepts the risk. |
| Destructive admin cleanup hardening | Current concern: destructive cleanup can be GET-triggered by query flags | Convert to safer semantics or explicitly block/accept risk before wider rollout. |
| Raw logical-path file-access narrowing/status revalidation | Current concern: raw compatibility path lacks independent archive status revalidation | Narrow or status-revalidate before final/wider rollout, or accept with written risk constraints. |

P1 findings must not be downgraded to P2/P3 merely because rollback documentation is complete.

Forward status: Phase 11H.2 is now recorded in `docs/migration/phase-11h-p1-security-gate-decision.md` as decision framework recorded, decisions pending. No P1 item was accepted as bounded risk, selected for implementation, deferred, or blocked by explicit human disposition in that phase.

## Supabase Retirement Handoff

Current handoff position:

- Active runtime/package Supabase references are retired based on prior audits and this phase's active source/runtime/package grep.
- Historical docs/spec/migration references may remain as migration history and traceability.
- No old Supabase data, Auth user, Storage file, migration copy, download, backfill, sync, or recovery is expected.
- No Supabase runtime fallback is expected or allowed for the clean local target.
- Final 11H should decide whether any remaining historical docs/package/env cleanup is required.

11H should distinguish:

- active runtime dependency: blocker if found;
- package dependency: blocker if found in package files;
- env value in human-controlled local files: human cleanup decision, never printed by Codex;
- historical docs reference: allowed if clearly migration history.

## Final Deployment Posture Notes

Preferred final posture:

- HTTPS serving.
- `dms_session` issued with `Secure`.
- `DMS_SESSION_COOKIE_SECURE=true` or unset secure default when the request/proxy protocol is HTTPS.
- PostgreSQL not broadly exposed to LAN.
- App port exposed only to the trusted/private network or final approved serving boundary.

Bounded temporary posture:

- Trusted HTTP LAN with `DMS_SESSION_COOKIE_SECURE=false`.
- Internal/trusted clients only.
- No public internet exposure.
- HTTP blob download warning is expected under HTTP and reinforces HTTPS recommendation.

Not accepted by this handoff:

- Public HTTP exposure.
- Broad PostgreSQL LAN exposure by default.
- Treating `dms_active_role` as authorization proof.
- Old Supabase fallback or old Supabase file recovery.

## Decision Classification

11G.6 classification is:

```text
complete
```

Rationale: handoff documentation is prepared, evidence is inventoried, rollback guidance is documented, P1 security decisions are carried forward, Supabase retirement posture is stated, and no runtime blocker was found by the required docs/source audits.

Classify as `partial` later if evidence is found incomplete or P1 decisions are not carried into 11H. Classify as `blocker` later if missing or invalid evidence undermines rollback/handoff.

## Next Phase

```text
Phase 11H.2 Decision Follow-up - Human disposition for P1 gates
```

11H remains human-controlled. 11H.0 is recorded in `docs/migration/phase-11h-final-readiness-plan.md` as planning and matrix creation only, and 11H.2 is recorded in `docs/migration/phase-11h-p1-security-gate-decision.md` as decision framework recorded with decisions pending. Neither phase is automatically approved by 11G.6, and neither makes the final release decision. Later 11H phases must address, explicitly accept, defer, or block on the P1 security findings with bounded deployment constraints and written risk acceptance.

## Evidence Handling Rules

- Do not store env values, secrets, DB URLs, storage roots, password hashes, session tokens, cookie values, CSRF tokens, file tokens, or physical paths.
- Do not store private device names, usernames, hostnames, or screenshots that expose sensitive values.
- Use placeholders such as `<APP_COMMIT>`, `<BACKUP_ID>`, `<SERVER_LAN_IP>`, `<APP_PORT>`, `<APP_URL>`, and `<SIGNOFF>`.
- Do not claim LAN readiness, production readiness, release readiness, operational certification, or go-live approval from this handoff.
