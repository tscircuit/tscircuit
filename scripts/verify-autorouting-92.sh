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
echo "PR #4768 branch: should match local HEAD (last synced f619fcd); update GitHub PR description from submission/pr-4768-body.md if still showing old text"
echo "Posting identity: see submission/release-checklist.txt section 2"
echo ""

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
