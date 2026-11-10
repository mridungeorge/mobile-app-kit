#!/usr/bin/env bash
# Install both Claude skills globally from this repository.
#
#   ./install.sh
#
# Override the destination with CLAUDE_SKILLS_DIR, e.g.:
#   CLAUDE_SKILLS_DIR=/path/to/skills ./install.sh
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

if [[ ! -d "$SRC/mobile-app-factory" || ! -d "$SRC/motion-experiences" ]]; then
  echo "error: skills/ is incomplete — run this from the repository root" >&2
  exit 1
fi

mkdir -p "$DEST"

for skill in mobile-app-factory motion-experiences; do
  if [[ -d "$DEST/$skill" ]]; then
    echo "→ Replacing existing $DEST/$skill"
    rm -rf "$DEST/$skill"
  else
    echo "→ Installing $DEST/$skill"
  fi
  cp -R "$SRC/$skill" "$DEST/$skill"
done

echo
echo "Installed:"
echo "  $DEST/mobile-app-factory"
echo "  $DEST/motion-experiences"
echo
echo "Running the self-audit…"
node "$DEST/mobile-app-factory/scripts/check-skill.mjs"
