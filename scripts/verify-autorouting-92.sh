#!/bin/sh
# Verify the archived autorouting#92 candidate fix.
# The fix lives in tscircuit/autorouting, not in this meta-package repo.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTOROUTING="${AUTOROUTING_DIR:-$ROOT/../autorouting}"
PATCH="$ROOT/submission/autorouting-92-candidate.patch"

if [ -n "${BUN:-}" ] && [ -x "$BUN" ]; then
  BUN_BIN="$BUN"
elif command -v bun >/dev/null 2>&1; then
  BUN_BIN="$(command -v bun)"
elif [ -x "/.bun/bin/bun" ]; then
  BUN_BIN="/.bun/bin/bun"
else
  echo "error: bun not found (set BUN or install bun)" >&2
  exit 1
fi

if [ ! -f "$PATCH" ]; then
  echo "error: patch not found at $PATCH" >&2
  exit 1
fi

if grep -qE 'agent-nio\.local|Co-authored-by: Cursor' "$PATCH"; then
  echo "error: patch contains session/agent metadata — regenerate as plain diff" >&2
  exit 1
fi

echo "=== tscircuit branch packet ==="
cd "$ROOT"
git diff --stat main...HEAD
echo "local HEAD: $(git rev-parse --short HEAD)"
echo "PR #4768 branch: should match local HEAD; update GitHub PR description from submission/pr-4768-body.md if still showing old text"
echo "Posting identity: see submission/release-checklist.txt section 2"
echo ""

echo "=== submission packet files ==="
for f in \
  submission/autorouting-92-candidate.patch \
  submission/issue-4764-reply.txt \
  submission/thread-context.txt \
  submission/release-checklist.txt \
  submission/upstream-scope.txt \
  submission/pr-4768-body.md \
  submission/update-github-pr-description.sh \
  submission/release-preflight.sh \
  submission/identity-decision.txt \
  submission/developer-handoff.txt
do
  if [ ! -f "$ROOT/$f" ]; then
    echo "error: missing $f" >&2
    exit 1
  fi
done
echo "submission packet: 10 required files present"
echo ""

echo "=== pr-4768-body.md structure ==="
for heading in \
  "## Summary" \
  "## Changes in this branch" \
  "## How to check" \
  "## Scope note" \
  "## Posting coordination" \
  "Fixes #4764"
do
  if ! grep -q "$heading" "$ROOT/submission/pr-4768-body.md"; then
    echo "error: pr-4768-body.md missing section: $heading" >&2
    exit 1
  fi
done
if grep -q 'script runs the verify script' "$ROOT/submission/pr-4768-body.md"; then
  echo "error: pr-4768-body.md contains stale iteration-7 phrase" >&2
  exit 1
fi
if ! grep -q 'release-preflight.sh' "$ROOT/submission/pr-4768-body.md"; then
  echo "error: pr-4768-body.md missing release-preflight.sh reference" >&2
  exit 1
fi
if ! grep -qE '^\[ \] A\)' "$ROOT/submission/identity-decision.txt"; then
  echo "error: identity-decision.txt missing option A template" >&2
  exit 1
fi
echo "pr-4768-body.md: required sections present"
echo ""

if command -v curl >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
  PR_JSON="$(curl -sS "https://api.github.com/repos/tscircuit/tscircuit/pulls/4768" 2>/dev/null || true)"
  if printf '%s' "$PR_JSON" | grep -qi 'rate limit'; then
    echo "warning: GitHub API rate limited — live PR status skipped"
    echo "  local HEAD: $(git rev-parse --short HEAD)"
    echo "  Karan: run submission/release-preflight.sh (with gh auth) before release"
  else
    PR_BODY="$(printf '%s' "$PR_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('body') or '')" 2>/dev/null || true)"
    PR_HEAD="$(printf '%s' "$PR_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('head',{}).get('sha','')[:7])" 2>/dev/null || true)"
    LOCAL_HEAD="$(git rev-parse --short HEAD)"
    if [ -n "$PR_HEAD" ]; then
      echo "GitHub PR #4768 head: $PR_HEAD (local: $LOCAL_HEAD)"
      if [ "$PR_HEAD" != "$LOCAL_HEAD" ]; then
        echo "warning: PR branch differs from local HEAD — push before release (see release-checklist.txt)"
      fi
    fi
    if [ -n "$PR_BODY" ] && ! printf '%s' "$PR_BODY" | grep -q 'Posting coordination'; then
      echo "warning: GitHub PR #4768 description still stale — run submission/update-github-pr-description.sh"
    elif [ -n "$PR_BODY" ]; then
      echo "GitHub PR #4768 description: looks updated (has posting-coordination section)"
    fi
  fi
  echo ""
fi

if [ ! -f "$AUTOROUTING/algos/multi-layer-ijump/MultilayerIjump.ts" ]; then
  echo "error: autorouting repo not found at $AUTOROUTING" >&2
  echo "Clone tscircuit/autorouting at 02dcdb6 beside this repo, or set AUTOROUTING_DIR." >&2
  exit 1
fi

cd "$AUTOROUTING"

if [ ! -d node_modules ]; then
  echo "Installing autorouting dependencies..."
  "$BUN_BIN" install
fi

echo "=== patch applies cleanly at 02dcdb6 ==="
PATCH_CHECK_DIR="$(mktemp -d)"
git archive 02dcdb6 | tar -x -C "$PATCH_CHECK_DIR"
(cd "$PATCH_CHECK_DIR" && git apply --check "$PATCH")
rm -rf "$PATCH_CHECK_DIR"
echo "patch apply check: ok"
echo ""

echo "=== patch matches autorouting fix commit ==="
FRESH_PATCH="$(mktemp)"
git diff 02dcdb6..2a3eb3b -- \
  algos/multi-layer-ijump/MultilayerIjump.ts \
  algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts \
  algos/multi-layer-ijump/tests/__snapshots__/forward-after-obstacle.snap.svg \
  > "$FRESH_PATCH"
if ! diff -q "$FRESH_PATCH" "$PATCH" >/dev/null 2>&1; then
  echo "error: submission patch differs from autorouting 02dcdb6..2a3eb3b" >&2
  echo "hint: run sh scripts/regenerate-autorouting-patch.sh" >&2
  rm -f "$FRESH_PATCH"
  exit 1
fi
rm -f "$FRESH_PATCH"
echo "patch sync: ok (matches autorouting 02dcdb6..2a3eb3b)"
echo ""

echo "=== deliverable summary ==="
git log -1 --oneline
git show --stat HEAD | tail -n +2
echo ""

FIXED_FILE="algos/multi-layer-ijump/MultilayerIjump.ts"
if grep -q 'node.parent?.obstacleHit' "$FIXED_FILE"; then
  echo "error: MultilayerIjump.ts still contains parent obstacleHit forward rejection" >&2
  exit 1
fi

echo "=== regression isolation (base MultilayerIjump.ts, tests kept) ==="
TMP_FIXED="$(mktemp)"
cp "$FIXED_FILE" "$TMP_FIXED"
git show 02dcdb6:"$FIXED_FILE" > "$FIXED_FILE"
set +e
"$BUN_BIN" test algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts >/tmp/regression-isolation.log 2>&1
ISOLATION_EXIT=$?
set -e
cp "$TMP_FIXED" "$FIXED_FILE"
rm -f "$TMP_FIXED"
if [ "$ISOLATION_EXIT" -eq 0 ]; then
  echo "error: targeted tests should fail with pre-patch MultilayerIjump.ts" >&2
  tail -20 /tmp/regression-isolation.log >&2
  exit 1
fi
grep -E "fail$" /tmp/regression-isolation.log | tail -3
echo "regression isolation: pre-patch code fails targeted tests (expected)"
echo ""

echo "=== targeted: forward-after-obstacle.test.ts ==="
"$BUN_BIN" test algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts

echo "=== full autorouting suite ==="
"$BUN_BIN" run build
"$BUN_BIN" test

echo ""
echo "=== release blockers (Karan/Rowan) ==="
if ! grep -qE '^\[x\]|^\[X\]' "$ROOT/submission/identity-decision.txt" 2>/dev/null; then
  echo "  - complete submission/identity-decision.txt (options A/B/C)"
fi
echo "  - update GitHub PR #4768 description: sh submission/update-github-pr-description.sh"
echo "  - run sh submission/release-preflight.sh before release (requires gh auth)"
