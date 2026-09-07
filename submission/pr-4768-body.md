## Summary

Submission packet for archived autorouting issue #92. The algorithm fix is a small change in `MultilayerIjump.getNeighbors` (remove parent `obstacleHit` forward-direction rejection) plus three regression tests and a debug SVG snapshot. The archived autorouting repo cannot accept PRs, so the patch and review materials live here.

## Changes in this branch

- `submission/autorouting-92-candidate.patch` — plain unified diff; apply at autorouting `02dcdb6`
- `submission/issue-4764-reply.txt` — maintainer summary, scope disclaimer, open questions
- `submission/thread-context.txt` — Sep 2026 issue-thread summary (AMZ92 validation, superset contributor)
- `submission/release-checklist.txt` — push/identity/compose steps for release (includes Karan quick start)
- `submission/upstream-scope.txt` — fork PR files vs session-only tooling
- `submission/pr-4768-body.md` — updated PR description text (paste or run `submission/update-github-pr-description.sh`)
- `submission/update-github-pr-description.sh` — one-command PR description update for release (Karan; supports --dry-run)
- `submission/release-preflight.sh` — local checks plus live GitHub PR status via gh (Karan; exits 1 if not ready; `--github-only` after npm run test)
- `submission/identity-decision.txt` — Rowan/Karan record for posting-identity option A/B/C (blocking)
- `submission/blocking-gap-race-plan.txt` — posting-identity BLOCKING_GAP for Rowan/Karan (options A/B/C)
- `submission/karan-after-identity.txt` — option-specific release paths after identity is recorded
- `submission/developer-handoff.txt` — developer lane complete vs Karan blockers
- `scripts/check-pr-4768-body.sh` — validates pr-4768-body.md before GitHub description update
- `scripts/regenerate-autorouting-patch.sh` — refresh submission patch from autorouting `02dcdb6..2a3eb3b`
- `scripts/verify-autorouting-92.sh` — patch apply/sync check, regression isolation, autorouting suite (session only)

## How to check

Clone `tscircuit/autorouting` at `02dcdb6` beside this repo (or set `AUTOROUTING_DIR`), then from this repo:

```
npm run test
```

This runs `scripts/verify-autorouting-92.sh` (patch apply, regression isolation, autorouting suite). When the GitHub API is reachable, it also warns if the live PR #4768 description fails the same body check used by `submission/release-preflight.sh`.

## Scope note

This patch fixes the parent-obstacle forward dead-end regression. It does not claim to resolve every wild jump on the original Wi-Fi board or dataset seed-8 zigzag; see issue #4764 thread for complementary work and AMZ92's validation table.

## Posting coordination

Issue author AMZ92 posted validation on the thread (2026-09-07): the narrow patch fixes the intermediate-state regression but does not reduce seed-8 turn count; a complementary superset patch from another contributor addresses that separately. Before merging or posting, confirm whether karanp0202 acts for AMZ92 or whether this PR should be withdrawn in favor of coordinated submission. See submission/blocking-gap-race-plan.txt, submission/karan-after-identity.txt (after identity is recorded), submission/thread-context.txt, and submission/release-checklist.txt.

## Note for release (not part of upstream merge)

This branch sets `package.json` `test` to run `scripts/verify-autorouting-92.sh` for the submission packet. Do not merge that change into upstream tscircuit main; see submission/upstream-scope.txt.

Fixes #4764
