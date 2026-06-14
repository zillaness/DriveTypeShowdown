#!/bin/sh
# Run full test battery. Assumes /tmp/g.js is current.
cd "$(dirname "$0")"
fail=0
for f in harness/tests/smoke*.js; do
  out=$(node "$f" 2>&1)
  rc=$?
  last=$(printf '%s\n' "$out" | tail -1)
  if [ $rc -ne 0 ]; then
    echo "ERROR $(basename $f): $last"
    fail=1
  else
    echo "$(basename $f): $last"
  fi
done
echo "=== balance ==="
node harness/tests/balance.js /tmp/g.js 2>&1 | tail -3
