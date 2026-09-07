## Summary

Submission packet for archived autorouting issue #92. The algorithm fix is a small change in `MultilayerIjump.getNeighbors` (remove parent `obstacleHit` forward-direction rejection) plus three regression tests and a debug SVG snapshot. The archived autorouting repo cannot accept PRs, so the patch and review materials live here.

## Changes in this branch

- `submission/autorouting-92-candidate.patch` — apply at autorouting `02dcdb6` (3 files: MultilayerIjump.ts, forward-after-obstacle.test.ts, SVG snapshot)
- `submission/issue-4764-reply.txt` — maintainer-facing summary, scope disclaimer, and open questions
- `submission/upstream-scope.txt` — fork PR files vs session-only tooling
- `scripts/verify-autorouting-92.sh` — checks patch applies, confirms regression isolation, runs targeted + full autorouting suite against sibling checkout

## How to check

Clone `tscircuit/autorouting` at `02dcdb6` beside this repo (or set `AUTOROUTING_DIR`), then from this repo:

```
npm run test
```

When bun is not on PATH, the test script falls back to the verify script automatically.

## Scope note

This patch fixes the parent-obstacle forward dead-end regression. It does not claim to resolve every wild jump on the original Wi-Fi board or dataset seed-8 zigzag; see issue #4764 thread for complementary work and AMZ92's validation table.

## Posting coordination

Issue author AMZ92 posted the original narrow candidate on #4764. Contributor 85heisenberg85 published a superset patch (includes this exact parent-obstacleHit removal plus overcome-distance gating) and deferred bounty priority to AMZ92. Before merging or posting, confirm whether karanp0202 acts for AMZ92 or whether this PR should be withdrawn in favor of coordinated submission. See submission/release-checklist.txt.

Fixes #4764
