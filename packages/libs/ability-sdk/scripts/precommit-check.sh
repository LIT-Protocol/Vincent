#!/usr/bin/env bash

# Get relative path from repo root to the current package
RELATIVE_PACKAGE_DIR="$(git rev-parse --show-prefix | sed 's:/$::')"

# Check if any staged files are under this package
if git diff --cached --name-only | grep -q "^$RELATIVE_PACKAGE_DIR/"; then
  echo "🔍 Running type check in $RELATIVE_PACKAGE_DIR"
  pnpm exec tsc --noEmit -p src/type-inference-verification/tsconfig.inferencetests.json && \
  echo "✅ Type check passed" || {
    echo "❌ Type check failed"
    exit 1
  }
else
  echo "✅ No changes in $RELATIVE_PACKAGE_DIR — skipping type check"
fi
