#!/bin/sh
# Print Karan's remaining release steps: local packet ok + optional live gh checks.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Karan quick start ==="
sed -n '/^## Karan quick start/,/^## Blocked on Karan/p' "$ROOT/submission/developer-handoff.txt" | sed '$d'

echo ""
echo "=== local PR body (submission/pr-4768-body.md) ==="
sh "$ROOT/scripts/check-pr-4768-body.sh"

echo ""
echo "=== live GitHub PR #4768 (requires gh auth) ==="
if ! command -v gh >/dev/null 2>&1; then
  echo "gh not found — install and authenticate, then rerun"
  exit 1
fi

LOCAL_HEAD="$(git -C "$ROOT" rev-parse --short HEAD)"
PR_HEAD="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.head.sha[:7]' 2>/dev/null || true)"
if [ -z "$PR_HEAD" ]; then
  echo "could not read PR #4768 — authenticate gh as karanp0202 and retry"
  exit 1
fi

echo "PR head: $PR_HEAD (local: $LOCAL_HEAD)"
if [ "$PR_HEAD" != "$LOCAL_HEAD" ]; then
  echo "action: $(sh "$ROOT/scripts/print-karan-push-command.sh")"
  echo "note: remote branch may predate submission packet fixes"
fi

if sh "$ROOT/scripts/check-live-pr-4768-body.sh"; then
  echo "PR description: matches local packet structure"
else
  echo "action: sh submission/update-github-pr-description.sh"
  echo "note: git push updates branch code only, not the PR description text"
fi

echo ""
echo "=== posting identity ==="
if grep -qE '^\[x\]|^\[X\]' "$ROOT/submission/identity-decision.txt" 2>/dev/null; then
  echo "identity-decision.txt: option recorded"
else
  echo "action: complete submission/identity-decision.txt (options A/B/C)"
  echo "see submission/blocking-gap-race-plan.txt"
fi

echo ""
echo "when all above pass: sh submission/release-preflight.sh"
