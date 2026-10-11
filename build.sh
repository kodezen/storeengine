#!/usr/bin/env bash
#
# build.sh — Fast production zip builder for storeengine
#
# Default behavior:
#   • Excludes files via .distignore
#   • Runs `composer install --no-dev --optimize-autoloader` for a slim vendor
#   • Strips composer.json / composer.lock from the final artifact
#   • Uses max zip compression (-9)
#   • Writes the zip to ~/Desktop
#
# Usage:
#   ./build.sh                  # production build → ~/Desktop/storeengine.zip
#   ./build.sh --no-composer    # skip composer install (use vendor as-is)
#   ./build.sh --npm            # run `npm run build` before zipping
#   ./build.sh --out /tmp       # override output dir
#   ./build.sh --name foo       # override output file name (no .zip)
#
# Reads ignore patterns from .distignore in this directory.

set -euo pipefail

# ---------- config ----------
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SLUG="$(basename "$PLUGIN_DIR")"
DISTIGNORE="$PLUGIN_DIR/.distignore"
OUT_DIR="$HOME/Desktop"
OUT_NAME="$PLUGIN_SLUG"
DO_COMPOSER=1
DO_NPM=0

# ---------- args ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-composer) DO_COMPOSER=0; shift ;;
    --npm)         DO_NPM=1; shift ;;
    --out)         OUT_DIR="$2"; shift 2 ;;
    --name)        OUT_NAME="$2"; shift 2 ;;
    -h|--help)     sed -n '2,20p' "$0"; exit 0 ;;
    *)             echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# ---------- prerequisites ----------
command -v rsync >/dev/null || { echo "rsync required"; exit 1; }
command -v zip   >/dev/null || { echo "zip required"; exit 1; }
[[ -f "$DISTIGNORE" ]] || { echo "Missing .distignore at $DISTIGNORE"; exit 1; }
if [[ "$DO_COMPOSER" -eq 1 ]] && [[ -f "$PLUGIN_DIR/composer.json" ]]; then
  command -v composer >/dev/null || { echo "composer required (or pass --no-composer)"; exit 1; }
fi

# ---------- prep working dir ----------
WORK_DIR="$(mktemp -d -t "${PLUGIN_SLUG}-build-XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

STAGE_DIR="$WORK_DIR/$PLUGIN_SLUG"
mkdir -p "$STAGE_DIR"
mkdir -p "$OUT_DIR"

EXCLUDE_FILE="$WORK_DIR/.rsync-exclude"
grep -Ev '^\s*(#|$)' "$DISTIGNORE" > "$EXCLUDE_FILE" || true

echo "==> Plugin:   $PLUGIN_SLUG"
echo "==> Source:   $PLUGIN_DIR"
echo "==> Output:   $OUT_DIR"
echo "==> Excludes: $(wc -l < "$EXCLUDE_FILE" | tr -d ' ') patterns from .distignore"

# ---------- optional npm pre-build ----------
if [[ "$DO_NPM" -eq 1 ]]; then
  echo "==> npm run build"
  (cd "$PLUGIN_DIR" && npm run build)
fi

# ---------- copy clean tree ----------
echo "==> Copying files..."
rsync -a \
  --exclude-from="$EXCLUDE_FILE" \
  --exclude='dist' \
  --exclude='build.sh' \
  "$PLUGIN_DIR/" "$STAGE_DIR/"

# Prune empty directories left after exclusions (e.g. vendor/* removed).
find "$STAGE_DIR" -depth -type d -empty -delete

# ---------- composer production install ----------
if [[ "$DO_COMPOSER" -eq 1 ]] && [[ -f "$PLUGIN_DIR/composer.json" ]]; then
  echo "==> composer install --no-dev --optimize-autoloader"
  # composer.json/lock are excluded by .distignore — restore briefly for install.
  cp "$PLUGIN_DIR/composer.json" "$STAGE_DIR/"
  [[ -f "$PLUGIN_DIR/composer.lock" ]] && cp "$PLUGIN_DIR/composer.lock" "$STAGE_DIR/"

  (cd "$STAGE_DIR" && composer install --no-dev --optimize-autoloader --no-interaction --quiet)

  # Strip composer metadata from final artifact.
  rm -f "$STAGE_DIR/composer.json" "$STAGE_DIR/composer.lock"

  # Re-prune in case composer left empty dirs.
  find "$STAGE_DIR" -depth -type d -empty -delete
fi

# ---------- zip (max compression) ----------
ZIP_PATH="$OUT_DIR/${OUT_NAME}.zip"
rm -f "$ZIP_PATH"
echo "==> Creating $ZIP_PATH (max compression)"
(cd "$WORK_DIR" && zip -rq9 "$ZIP_PATH" "$PLUGIN_SLUG")

# ---------- done ----------
SIZE=$(du -h "$ZIP_PATH" | awk '{print $1}')
echo "==> Done. $ZIP_PATH ($SIZE)"
