#!/bin/sh
# Karan release preflight: run full local checks, then live GitHub PR status via gh.
# Exits 1 when GitHub-side release actions are still required.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== local packet checks ==="
sh "$ROOT/scripts/verify-autorouting-92.sh"
echo ""

echo "=== live GitHub PR status (requires gh auth) ==="
if ! command -v gh >/dev/null 2>&1; then
  echo "warning: gh not found — skip live PR check; paste submission/pr-4768-body.md manually"
  echo "preflight: incomplete (no gh) — see submission/release-checklist.txt"
  exit 1
fi

LOCAL_HEAD="$(git -C "$ROOT" rev-parse --short HEAD)"
PR_HEAD="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.head.sha[:7]' 2>/dev/null || true)"
PR_BODY="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.body // ""' 2>/dev/null || true)"

if [ -z "$PR_HEAD" ]; then
  echo "warning: could not read PR #4768 via gh — authenticate and retry"
  echo "preflight: incomplete (gh auth) — see submission/release-checklist.txt"
  exit 1
fi

NEEDS_ACTION=0

echo "PR #4768 head: $PR_HEAD (local: $LOCAL_HEAD)"
if [ "$PR_HEAD" != "$LOCAL_HEAD" ]; then
  echo "action: push local HEAD before release (see submission/release-checklist.txt section 1)"
  NEEDS_ACTION=1
fi

if printf '%s' "$PR_BODY" | grep -q 'Posting coordination'; then
  echo "PR description: updated"
else
  echo "action: run sh submission/update-github-pr-description.sh"
  NEEDS_ACTION=1
fi

echo ""
echo "=== posting identity (blocking) ==="
if grep -qE '^\[x\]|^\[X\]' "$ROOT/submission/identity-decision.txt" 2>/dev/null; then
  echo "identity-decision.txt: option recorded"
else
  echo "action: complete submission/identity-decision.txt (options A/B/C)"
  NEEDS_ACTION=1
fi

if [ "$NEEDS_ACTION" -eq 1 ]; then
  echo ""
  echo "preflight: release not ready — resolve actions above"
  exit 1
fi

echo ""
echo "preflight: GitHub PR checks passed; identity recorded — ready for Karan release steps"
