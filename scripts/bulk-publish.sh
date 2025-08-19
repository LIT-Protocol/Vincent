#!/bin/sh
# scripts/bulk-publish.sh
# Run from repo root (vincent). Publishes selected packages under packages/

set -eu

# --- Input (POSIX) ---
ask() {
  var="$1"; prompt="$2"
  val=""
  while :; do
    printf "%s" "$prompt"
    IFS= read -r val || true
    if [ -n "$val" ]; then
      eval "$var=\$val"
      break
    else
      echo "Value required."
    fi
  done
}

ask VERSION "Version (e.g. 0.0.10-mma): "
ask TAG     "Tag (e.g. mma): "

printf "Version: %s\nTag: %s\n" "$VERSION" "$TAG"
printf "Proceed with publish? [y/N] "
IFS= read -r CONFIRM || true
case "$CONFIRM" in
  y|Y) ;;
  *) echo "Aborted."; exit 1 ;;
esac

# --- Locate repo root and packages dir (no BASH_SOURCE) ---
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd -P)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd -P)
PACKAGES_DIR="$REPO_ROOT/packages"
[ -d "$PACKAGES_DIR" ] || { echo "Error: packages/ not found at $PACKAGES_DIR"; exit 1; }

# --- Targets (no arrays, no nullglob) ---
targets="
$PACKAGES_DIR/libs/contracts-sdk
$PACKAGES_DIR/libs/ability-sdk
$PACKAGES_DIR/libs/app-sdk
"

for d in "$PACKAGES_DIR"/apps/policies-* "$PACKAGES_DIR"/apps/policy-* "$PACKAGES_DIR"/apps/ability-*; do
  [ -d "$d" ] && targets="$targets
$d"
done

echo "Will process:"
for dir in $targets; do
  [ -z "$dir" ] && continue
  rel=${dir#"$REPO_ROOT"/}
  echo " - $rel"
done
echo

success=""
skipped=""
failed=""

# --- Publish loop ---
for dir in $targets; do
  [ -z "$dir" ] && continue
  rel=${dir#"$REPO_ROOT"/}
  echo "=== $rel ==="

  if [ ! -f "$dir/package.json" ]; then
    echo "skip: no package.json"
    skipped="$skipped
$rel (no package.json)"
    echo
    continue
  fi

  # skip private packages
  if node -e "const p=require('${dir}/package.json');process.exit(p.private?0:1)" 2>/dev/null; then
    echo "skip: private package"
    skipped="$skipped
$rel (private)"
    echo
    continue
  fi

  (
    cd "$dir" || exit 1
    echo "> pnpm version $VERSION"
    pnpm version "$VERSION"
    echo "> pnpm publish --tag $TAG --no-git-checks"
    pnpm publish --tag "$TAG" --no-git-checks
  ) && {
    success="$success
$rel"
    echo "ok"
  } || {
    failed="$failed
$rel"
    echo "FAIL"
  }

  echo
done

# --- Summary (portable) ---
count_lines() { printf "%s" "$1" | awk 'NF{c++} END{print c+0}'; }

echo "=== Summary ==="
echo "Published: $(count_lines "$success")"
printf "%s\n" "$success" | awk 'NF{print " - "$0}'
echo
echo "Skipped:   $(count_lines "$skipped")"
printf "%s\n" "$skipped" | awk 'NF{print " - "$0}'
echo
echo "Failed:    $(count_lines "$failed")"
printf "%s\n" "$failed" | awk 'NF{print " - "$0}'
