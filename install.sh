#!/usr/bin/env bash
# Install both skills from this repository for any agent that reads SKILL.md.
#
#   ./install.sh                      # auto: ~/.claude/skills + ~/.agents/skills, plus
#                                     # ~/.config/opencode/skills when OpenCode is configured
#   ./install.sh --target all         # all three, even if ~/.config/opencode is absent
#   ./install.sh --target claude      # one target: claude | agents | opencode | all
#   ./install.sh --dir /path/skills   # add an explicit destination (repeatable)
#
# The kit is plain SKILL.md plus Node scripts, so the same files work in Claude Code,
# OpenCode, Codex, or any agent that reads a skills directory:
#
#   ~/.claude/skills              Claude Code; OpenCode also reads this for compatibility
#   ~/.agents/skills              Codex user scope; OpenCode reads this too
#   ~/.config/opencode/skills     OpenCode's own location
#
# CLAUDE_SKILLS_DIR still overrides the Claude target. Nothing here needs an Anthropic key.
set -euo pipefail

usage() {
  sed -n '2,17p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
TARGETS=""
EXTRA=""

add_target() { TARGETS="$TARGETS"$'\n'"$1"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) add_target "${2:?--target needs claude, agents, opencode, or all}"; shift 2 ;;
    --target=*) add_target "${1#*=}"; shift ;;
    --dir) EXTRA="$EXTRA"$'\n'"${2:?--dir needs a path}"; shift 2 ;;
    --dir=*) EXTRA="$EXTRA"$'\n'"${1#*=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "error: unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ ! -d "$SRC/mobile-app-factory" || ! -d "$SRC/motion-experiences" ]]; then
  echo "error: skills/ is incomplete — run this from the repository root" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node (>= 18) is required — the factory scripts and the self-audit are Node" >&2
  exit 1
fi

DESTINATIONS=""
add_dest() { DESTINATIONS="$DESTINATIONS"$'\n'"$1"; }

if [[ -z "$TARGETS" ]]; then add_target auto; fi

while IFS= read -r target; do
  if [[ -z "$target" ]]; then continue; fi
  case "$target" in
    auto)
      add_dest "${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
      add_dest "$HOME/.agents/skills"
      if [[ -d "$HOME/.config/opencode" ]]; then add_dest "$HOME/.config/opencode/skills"; fi
      ;;
    claude) add_dest "${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}" ;;
    agents) add_dest "$HOME/.agents/skills" ;;
    opencode) add_dest "$HOME/.config/opencode/skills" ;;
    all)
      add_dest "${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
      add_dest "$HOME/.agents/skills"
      add_dest "$HOME/.config/opencode/skills"
      ;;
    *)
      echo "error: --target must be claude, agents, opencode, or all (got \"$target\")" >&2
      exit 2
      ;;
  esac
done <<< "$TARGETS"

if [[ -n "$EXTRA" ]]; then
  while IFS= read -r line; do
    if [[ -n "$line" ]]; then add_dest "$line"; fi
  done <<< "$EXTRA"
fi

SEEN=""
INSTALLED=""
while IFS= read -r DEST; do
  if [[ -z "$DEST" ]]; then continue; fi
  case "$SEEN" in *$'\n'"$DEST"$'\n'*) echo "→ Skipping duplicate $DEST"; continue ;; esac
  SEEN="$SEEN"$'\n'"$DEST"$'\n'

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

  # `cp -R` preserves modes on POSIX, but a checkout from a filesystem without
  # executable bits (Windows, some CI caches) leaves the helpers unusable.
  chmod +x "$DEST/mobile-app-factory/scripts/"*.sh 2>/dev/null || true
  chmod +x "$DEST/mobile-app-factory/assets/android/project/gradlew" 2>/dev/null || true
  INSTALLED="$INSTALLED"$'\n'"$DEST"
done <<< "$DESTINATIONS"

echo
echo "Installed for these agents:"
while IFS= read -r DEST; do
  if [[ -n "$DEST" ]]; then echo "  $DEST/{mobile-app-factory,motion-experiences}"; fi
done <<< "$INSTALLED"
echo
echo "Running the self-audit against the source tree…"
node "$SRC/mobile-app-factory/scripts/check-skill.mjs"
