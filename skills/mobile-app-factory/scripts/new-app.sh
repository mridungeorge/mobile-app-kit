#!/usr/bin/env bash
# App scaffold helper.
# Production default: native (Kotlin + Jetpack Compose in Android Studio, Swift + SwiftUI in Xcode).
# Expo scaffolding is available only when explicitly requested.
#
# Usage:
#   ./new-app.sh native-android <app-name> [applicationId]
#   ./new-app.sh native-ios <app-name> [bundle-id]
#   ./new-app.sh expo <app-name> [--no-install]   # prototype only
set -euo pipefail

MODE="${1:-}"
APP_NAME="${2:-}"
EXTRA="${3:-}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$MODE" in
  native-android|android)
    exec "$SKILL_DIR/scripts/new-android-app.sh" "$APP_NAME" "$EXTRA"
    ;;
  native-ios|ios)
    exec "$SKILL_DIR/scripts/new-ios-app.sh" "$APP_NAME" "$EXTRA"
    ;;
  expo)
    if [[ -z "$APP_NAME" ]]; then echo "Usage: $0 expo <app-name> [--no-install]" >&2; exit 1; fi
    ROOT="$(pwd)"; TARGET="$ROOT/$APP_NAME"
    if [[ -d "$TARGET" ]]; then echo "Directory $TARGET already exists - refusing to overwrite." >&2; exit 1; fi
    echo "-> Scaffolding Expo app (expo-router starter): $APP_NAME"
    SLUG="$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g' -e 's/-*$//')"
    BUNDLE="${EXTRA:-com.example.$(echo "$SLUG" | tr -d '-')}"
    [[ "$BUNDLE" == "--no-install" ]] && BUNDLE="com.example.$(echo "$SLUG" | tr -d '-')"
    mkdir -p "$TARGET"
    cp -R "$SKILL_DIR/assets/expo/." "$TARGET/"
    cd "$TARGET"
    for f in package.json app.json; do sed -i.bak -e "s/__APP_SLUG__/$SLUG/g" -e "s/__APP_NAME__/$APP_NAME/g" -e "s/__BUNDLE_ID__/$BUNDLE/g" "$f" && rm -f "$f.bak"; done
    mkdir -p src/components .mobile/metadata .mobile/screenshots
    cp "$SKILL_DIR/assets/rn/theme.ts" src/theme.ts
    cp "$SKILL_DIR/assets/rn/motion.ts" src/motion.ts
    cp "$SKILL_DIR/assets/rn/components/"*.tsx src/components/
    cp "$SKILL_DIR/assets/design-tokens.json" design-tokens.json
    cp "$SKILL_DIR/assets/ci/expo-eas.json" eas.json
    cat > .mobile/STATE.md <<EOF
# State
stage: INTAKE
app: $APP_NAME
stack: expo (explicit choice; see references/cross-platform-decision.md)
updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
next: route-idea (write .mobile/00-profile.json), then product-architect (write .mobile/01-prd.md)
EOF
    if [[ "$EXTRA" != "--no-install" ]]; then npm install; fi
    echo "Done. For production-ready native apps use: ./new-app.sh native-android <name> or ./new-app.sh native-ios <name>"
    ;;
  *)
    cat <<EOF
Production-ready default: native apps (not Expo Go).
  ./new-app.sh native-android <app-name> [applicationId]   # Kotlin + Compose + Android Studio (Gradle)
  ./new-app.sh native-ios <app-name> [bundle-id]           # Swift + SwiftUI + Xcode

Prototype option (explicit only):
  ./new-app.sh expo <app-name> [--no-install]
EOF
    exit 1
    ;;
esac
