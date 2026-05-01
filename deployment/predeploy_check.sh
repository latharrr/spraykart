#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFLIGHT_FILE="$ROOT_DIR/scripts/preflight.md"
MAX_AGE_SECONDS="${PREFLIGHT_MAX_AGE_SECONDS:-86400}"

if [[ ! -f "$PREFLIGHT_FILE" ]]; then
  echo "Missing scripts/preflight.md. Run production payment smoke tests before deploy." >&2
  exit 1
fi

if ! grep -q '^Status: PASS$' "$PREFLIGHT_FILE"; then
  echo "Payment preflight is not marked PASS in scripts/preflight.md." >&2
  exit 1
fi

if grep -q '^- \[ \]' "$PREFLIGHT_FILE"; then
  echo "Payment preflight still has unchecked rows." >&2
  exit 1
fi

now="$(date +%s)"
updated="$(stat -c %Y "$PREFLIGHT_FILE")"
age="$((now - updated))"

if [[ "$age" -gt "$MAX_AGE_SECONDS" ]]; then
  echo "Payment preflight is stale (${age}s old). Re-run and touch scripts/preflight.md before deploy." >&2
  exit 1
fi

echo "Predeploy payment preflight passed."
