#!/bin/sh
# Fetch GitHub PR #4768 description via gh and validate with check-pr-4768-body.sh.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found — cannot validate live PR body" >&2
  exit 1
fi

LIVE_BODY="$(mktemp)"
gh api repos/tscircuit/tscircuit/pulls/4768 --jq '.body // ""' > "$LIVE_BODY"
if sh "$ROOT/scripts/check-pr-4768-body.sh" "$LIVE_BODY"; then
  rm -f "$LIVE_BODY"
  exit 0
fi
rm -f "$LIVE_BODY"
exit 1
