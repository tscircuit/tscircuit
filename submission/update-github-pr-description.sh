#!/bin/sh
# Update GitHub PR #4768 description from submission/pr-4768-body.md.
# Run by Karan at release time (developer session cannot push or edit remotes).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BODY="$ROOT/submission/pr-4768-body.md"

validate_live_pr_body() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI not found — cannot validate live PR body" >&2
    return 1
  fi
  LIVE_BODY="$(mktemp)"
  gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.body // ""' > "$LIVE_BODY"
  if sh "$ROOT/scripts/check-pr-4768-body.sh" "$LIVE_BODY"; then
    rm -f "$LIVE_BODY"
    return 0
  fi
  rm -f "$LIVE_BODY"
  return 1
}

case "${1:-}" in
  --dry-run|-n)
    sh "$ROOT/scripts/check-pr-4768-body.sh"
    echo "dry-run: would update PR #4768 with $BODY ($(wc -c <"$BODY") bytes)"
    echo "--- preview ---"
    sed -n '1,20p' "$BODY"
    echo "... (see full file in repo)"
    exit 0
    ;;
  --check-live)
    if validate_live_pr_body; then
      echo "live PR #4768 description: matches local packet structure"
      exit 0
    fi
    echo "error: live PR #4768 description stale or incomplete — run without --check-live to update" >&2
    exit 1
    ;;
esac

sh "$ROOT/scripts/check-pr-4768-body.sh"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found — paste $BODY into PR #4768 manually" >&2
  exit 1
fi

gh pr edit 4768 --repo tscircuit/tscircuit --body-file "$BODY"
echo "PR #4768 description updated from submission/pr-4768-body.md"

if validate_live_pr_body; then
  echo "live PR body post-edit: validated on GitHub"
else
  echo "error: live PR body still invalid after gh pr edit — retry or paste manually" >&2
  exit 1
fi
