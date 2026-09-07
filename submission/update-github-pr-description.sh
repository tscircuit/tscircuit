#!/bin/sh
# Update GitHub PR #4768 description from submission/pr-4768-body.md.
# Run by Karan at release time (developer session cannot push or edit remotes).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BODY="$ROOT/submission/pr-4768-body.md"

if [ ! -f "$BODY" ]; then
  echo "error: missing $BODY" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found — paste $BODY into PR #4768 manually" >&2
  exit 1
fi

gh pr edit 4768 --repo tscircuit/tscircuit --body-file "$BODY"
echo "PR #4768 description updated from submission/pr-4768-body.md"
