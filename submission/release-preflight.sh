#!/bin/sh
# Karan release preflight: run full local checks, then live GitHub PR status via gh.
# Exits 1 when GitHub-side release actions are still required.
# Optional: --github-only skips local verify (use after npm run test).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IDENTITY="$ROOT/submission/identity-decision.txt"
GITHUB_ONLY=0

case "${1:-}" in
  --github-only)
    GITHUB_ONLY=1
    ;;
esac

if [ "$GITHUB_ONLY" -eq 0 ]; then
  echo "=== local packet checks ==="
  sh "$ROOT/scripts/verify-autorouting-92.sh"
  echo ""
else
  echo "=== local packet checks skipped (--github-only) ==="
  echo ""
fi

echo "=== live GitHub PR status (requires gh auth) ==="
if ! command -v gh >/dev/null 2>&1; then
  echo "warning: gh not found — skip live PR check; paste submission/pr-4768-body.md manually"
  echo "preflight: incomplete (no gh) — see submission/release-checklist.txt"
  exit 1
fi

LOCAL_HEAD="$(git -C "$ROOT" rev-parse --short HEAD)"
PR_HEAD="$(gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.head.sha[:7]' 2>/dev/null || true)"

if [ -z "$PR_HEAD" ]; then
  echo "warning: could not read PR #4768 via gh — authenticate and retry"
  echo "preflight: incomplete (gh auth) — see submission/release-checklist.txt"
  exit 1
fi

NEEDS_ACTION=0

echo "PR #4768 head: $PR_HEAD (local: $LOCAL_HEAD)"
if [ "$PR_HEAD" != "$LOCAL_HEAD" ]; then
  echo "action: push local HEAD — $(sh "$ROOT/scripts/print-karan-push-command.sh")"
  NEEDS_ACTION=1
fi

if sh "$ROOT/scripts/check-live-pr-4768-body.sh"; then
  echo "PR description: matches local packet structure"
else
  echo "action: run sh submission/update-github-pr-description.sh"
  NEEDS_ACTION=1
fi

echo ""
echo "=== posting identity (blocking) ==="
if grep -qE '^\[x\]|^\[X\]' "$IDENTITY" 2>/dev/null; then
  echo "identity-decision.txt: option recorded"
  if grep -qiE '^\[x\].*A\)' "$IDENTITY"; then
    echo "next (option A): follow submission/karan-after-identity.txt — proceed with PR #4768 quick start"
  elif grep -qiE '^\[x\].*B\)' "$IDENTITY"; then
    echo "next (option B): follow submission/karan-after-identity.txt — close or coordinate; do not merge duplicate"
  elif grep -qiE '^\[x\].*C\)' "$IDENTITY"; then
    echo "next (option C): follow submission/karan-after-identity.txt — compose with superset branch first"
  else
    echo "next: see submission/karan-after-identity.txt for option-specific release path"
  fi
else
  echo "action: complete submission/identity-decision.txt (options A/B/C)"
  echo "see submission/blocking-gap-race-plan.txt (Rowan/Karan decision required)"
  NEEDS_ACTION=1
fi

if [ "$NEEDS_ACTION" -eq 1 ]; then
  echo ""
  echo "preflight: release not ready — resolve actions above"
  exit 1
fi

echo ""
echo "preflight: GitHub PR checks passed; identity recorded — see submission/karan-after-identity.txt"
