#!/usr/bin/env sh
# Render scripts/og/card.html to public/og.png (1200x630) with headless Chrome.
# Re-run after editing card.html. Requires Google Chrome on macOS, or set CHROME.
set -eu
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ ! -x "$CHROME" ]; then
  echo "render.sh: Chrome not found at '$CHROME'. Set CHROME to the browser binary." >&2
  exit 1
fi
OUT="$PWD/public/og.png"
TMPBASE="$(mktemp "${TMPDIR:-/tmp}/og.XXXXXX")"
TMP="$TMPBASE.png"
trap 'rm -f "$TMPBASE" "$TMP"' EXIT
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot="$TMP" "file://$PWD/scripts/og/card.html"
if [ ! -s "$TMP" ]; then
  echo "render.sh: Chrome exited but no screenshot was written." >&2
  exit 1
fi
mv "$TMP" "$OUT"
echo "wrote public/og.png"
