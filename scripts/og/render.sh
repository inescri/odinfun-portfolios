#!/usr/bin/env sh
# Render scripts/og/card.html to public/og.png (1200x630) with headless Chrome.
# Re-run after editing card.html. Requires Google Chrome on macOS, or set CHROME.
set -eu
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot="$PWD/public/og.png" "file://$PWD/scripts/og/card.html" 2>/dev/null
echo "wrote public/og.png"
