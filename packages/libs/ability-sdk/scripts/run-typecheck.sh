#!/usr/bin/env bash

print_box() {
  local message="$1"
  local width=$(( ${#message} + 4 ))
  local line=$(printf '─%.0s' $(seq 1 $width))
  echo ""
  echo "╭${line}╮"
  echo "│  $message  │"
  echo "╰${line}╯"
}

echo ""
echo "────────────────────────────────────────────"
echo "🔁 Type check triggered at $(date +'%T')"
echo "────────────────────────────────────────────"
echo ""

if tsc --noEmit -p src/type-inference-verification/tsconfig.inferencetests.json; then
  print_box "✅ Type check passed"
fi
