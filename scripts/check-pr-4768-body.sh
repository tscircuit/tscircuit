#!/bin/sh
# Validate a PR #4768 description body (default: submission/pr-4768-body.md).
# Optional first argument: path to body file (e.g. live GitHub body in preflight).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BODY="${1:-$ROOT/submission/pr-4768-body.md}"

if [ ! -f "$BODY" ]; then
  echo "error: missing PR body file: $BODY" >&2
  exit 1
fi

for heading in \
  "## Summary" \
  "## Changes in this branch" \
  "## How to check" \
  "## Scope note" \
  "## Posting coordination" \
  "Fixes #4764"
do
  if ! grep -q "$heading" "$BODY"; then
    echo "error: PR body missing section: $heading" >&2
    exit 1
  fi
done

if grep -q 'script runs the verify script' "$BODY"; then
  echo "error: PR body contains stale iteration-7 phrase" >&2
  exit 1
fi

for ref in \
  release-preflight.sh \
  blocking-gap-race-plan.txt \
  karan-after-identity.txt \
  regenerate-autorouting-patch.sh \
  verify-autorouting-92.sh \
  check-pr-4768-body.sh \
  print-karan-push-command.sh \
  print-karan-next-steps.sh \
  check-live-pr-4768-body.sh \
  developer-handoff.txt \
  identity-decision.txt \
  autorouting-92-candidate.patch \
  issue-4764-reply.txt \
  thread-context.txt \
  release-checklist.txt \
  upstream-scope.txt \
  update-github-pr-description.sh
do
  if ! grep -q "$ref" "$BODY"; then
    echo "error: PR body missing reference: $ref" >&2
    exit 1
  fi
done

if [ ! -f "$ROOT/submission/identity-decision.txt" ]; then
  echo "error: missing submission/identity-decision.txt" >&2
  exit 1
fi
if ! grep -qE '^\[ \] A\)' "$ROOT/submission/identity-decision.txt"; then
  echo "error: identity-decision.txt missing option A template" >&2
  exit 1
fi

echo "PR body ($BODY): structure and packet references ok"
