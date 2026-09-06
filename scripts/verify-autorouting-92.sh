#!/bin/sh
# Verify the archived autorouting#92 candidate fix (NIO-112 deliverable).
# The fix lives in tscircuit/autorouting, not in this meta-package repo.
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
  echo "Clone tscircuit/autorouting at 02dcdb6 beside this repo, or set AUTOROUTING_DIR." >&2
  exit 1
fi

cd "$AUTOROUTING"

if [ ! -d node_modules ]; then
  echo "Installing autorouting dependencies..."
  "$BUN_BIN" install
fi

echo "=== targeted: forward-after-obstacle.test.ts ==="
"$BUN_BIN" test algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts

echo "=== full autorouting suite ==="
"$BUN_BIN" run build
"$BUN_BIN" test
