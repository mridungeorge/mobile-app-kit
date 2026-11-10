#!/usr/bin/env bash
# Scaffold an Expo app with the Rune design tokens and starting components.
# Usage: ./new-app.sh <app-name> [--no-install]
set -euo pipefail

APP_NAME="${1:-}"
SKIP_INSTALL="${2:-}"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: $0 <app-name> [--no-install]" >&2
  exit 1
fi

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(pwd)"
TARGET="$ROOT/$APP_NAME"

if [[ -d "$TARGET" ]]; then
  echo "Directory $TARGET already exists — refusing to overwrite." >&2
  exit 1
fi

echo "→ Scaffolding Expo app: $APP_NAME"
npx create-expo-app@latest "$APP_NAME" --template blank-typescript

cd "$TARGET"

echo "→ Installing runtime dependencies"
npx expo install react-native-safe-area-context react-native-screens
npx expo install react-native-reanimated
npm install --save-dev typescript @types/react

echo "→ Copying design tokens"
mkdir -p src/components
cp "$SKILL_DIR/assets/rn/theme.ts" src/theme.ts
cp "$SKILL_DIR/assets/rn/motion.ts" src/motion.ts
cp "$SKILL_DIR/assets/rn/components/"*.tsx src/components/
cp "$SKILL_DIR/assets/design-tokens.json" design-tokens.json

echo "→ Creating project state directory"
mkdir -p .mobile/metadata .mobile/screenshots
cat > .mobile/STATE.md <<EOF
# State
stage: INTAKE
app: $APP_NAME
updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
next: route-idea (write .mobile/00-profile.json), then product-architect (write .mobile/01-prd.md)
EOF

if [[ "$SKIP_INSTALL" != "--no-install" ]]; then
  echo "→ Installing dependencies"
  npm install
fi

cat <<EOF

Done. Next:

  1. cd $APP_NAME
  2. Ask Claude: "Build <your idea> with mobile-app-factory"
  3. Artifacts will land in .mobile/

Design tokens: src/theme.ts, src/motion.ts
Components:    src/components/{Surface,Button,ListRow,Sheet,Reveal,TextField,Switch,SegmentedControl,EmptyState}.tsx

Note: Reanimated requires the Babel plugin. Expo SDK 54+ includes it by default;
if you see "Reanimated 2 failed to create a worklet", add to babel.config.js:

  plugins: ['react-native-reanimated/plugin']
EOF
