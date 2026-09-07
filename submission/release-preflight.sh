#!/bin/sh
# Karan release preflight: run full local checks, then live GitHub PR status via gh.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== local packet checks ==="
sh "$ROOT/scripts/verify-autorouting-92.sh"
echo ""

echo "=== live GitHub PR status (requires gh auth) ==="
if ! command -v gh >/dev/null 2>&1; then
  echo "warning: gh not found — skip live PR check; paste submission/pr-4768-body.md manually"
  exit 0
fi

LOCAL_HEAD="$(git -C "$ROOT" rev-parse --short HEAD)"
PR_HEAD="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.head.sha[:7]' 2>/dev/null || true)"
PR_BODY="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.body // ""' 2>/dev/null || true)"

if [ -z "$PR_HEAD" ]; then
  echo "warning: could not read PR #4768 via gh — authenticate and retry"
  exit 0
fi

echo "PR #4768 head: $PR_HEAD (local: $LOCAL_HEAD)"
if [ "$PR_HEAD" != "$LOCAL_HEAD" ]; then
  echo "action: push local HEAD before release (see submission/release-checklist.txt section 1)"
fi

if printf '%s' "$PR_BODY" | grep -q 'Posting coordination'; then
  echo "PR description: updated"
else
  echo "action: run sh submission/update-github-pr-description.sh"
fi

echo ""
echo "=== posting identity (blocking) ==="
echo "Confirm AMZ92 / karanp0202 / 85heisenberg85 per submission/release-checklist.txt section 2"
