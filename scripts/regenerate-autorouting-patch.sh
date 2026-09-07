#!/bin/sh
# Regenerate submission/autorouting-92-candidate.patch from the autorouting fix commit.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTOROUTING="${AUTOROUTING_DIR:-$ROOT/../autorouting}"
PATCH="$ROOT/submission/autorouting-92-candidate.patch"
BASE=02dcdb6
FIX=2a3eb3b

if [ ! -d "$AUTOROUTING/.git" ]; then
  echo "error: autorouting repo not found at $AUTOROUTING" >&2
  exit 1
fi

cd "$AUTOROUTING"
git diff "$BASE".."$FIX" -- \
  algos/multi-layer-ijump/MultilayerIjump.ts \
  algos/multi-layer-ijump/tests/forward-after-obstacle.test.ts \
  algos/multi-layer-ijump/tests/__snapshots__/forward-after-obstacle.snap.svg \
  > "$PATCH"

echo "regenerated $PATCH from autorouting $BASE..$FIX"
