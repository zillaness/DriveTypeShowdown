#!/bin/sh
# Copyright (C) 2026 Projects and Mods
# GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
# Run full battery; flag any suite with a FAIL line or nonzero exit.
cd "$(dirname "$0")"
fail=0
for f in harness/tests/smoke*.js; do
  out=$(node "$f" 2>&1); rc=$?
  fcount=$(printf '%s\n' "$out" | grep -c -iE "^FAIL|— FAIL|FAIL —| fail$")
  flines=$(printf '%s\n' "$out" | grep -iE "FAIL" | grep -ivE "0 fail")
  if [ $rc -ne 0 ]; then echo "ERR  $(basename $f) (exit $rc): $(printf '%s\n' "$out" | tail -1)"; fail=1
  elif [ -n "$flines" ]; then echo "FAIL $(basename $f):"; printf '%s\n' "$flines" | sed 's/^/       /'; fail=1
  else echo "ok   $(basename $f): $(printf '%s\n' "$out" | tail -1)"; fi
done
echo "=== balance ==="
node harness/tests/balance.js /tmp/g.js 2>&1 | tail -1
[ $fail -eq 0 ] && echo "ALL GREEN" || { echo "SUITES FAILED"; exit 1; }
