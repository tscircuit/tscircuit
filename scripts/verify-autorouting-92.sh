#!/bin/sh
# Run autorouting#92 regression tests from the sibling autorouting checkout.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTOROUTING="${AUTOROUTING_DIR:-$ROOT/../autorouting}"

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

if [ ! -f "$AUTOROUTING/algos/multi-layer-ijump/MultilayerIjump.ts" ]; then
  echo "error: autorouting repo not found at $AUTOROUTING" >&2
  exit 1
fi

cd "$AUTOROUTING"
[ -d node_modules ] || "$BUN_BIN" install

echo "autorouting fix: $(git log -1 --oneline)"

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

echo "=== targeted regression ==="
"$BUN_BIN" test algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts
echo "=== full suite ==="
"$BUN_BIN" run build
"$BUN_BIN" test
