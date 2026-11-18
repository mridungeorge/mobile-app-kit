# Cross-platform decision

The kit's default is native (Kotlin + Compose, Swift + SwiftUI) because it has the deepest starters and the most verification. That is a default, not a ruling. **If the user explicitly chooses Expo, Flutter, Capacitor or KMP, respect it**: route-idea keeps the choice (`--stack expo`) and the pipeline adapts; say what the choice costs once, then build it.

## Decision table

| | Native (Kotlin + Swift) | KMP (shared logic, native UI) | Expo / React Native | Flutter | Capacitor / Ionic |
|---|---|---|---|---|---|
| **Team skills** | Two native skill sets, or one team learning both | Kotlin team that also ships iOS | JS / TypeScript / React team | Dart-willing team; one UI codebase | Web team with an existing web app |
| **Best app types** | Anything; platform-heavy, media, health, widgets, long-lived products | Business-logic-heavy apps with platform-native feel | Content, commerce, social, forms, CRUD, internal tools | Brand-heavy custom UI, consistent look on both | Wrapping an existing PWA/web product |
| **Hardware / platform depth** | Full and first (new OS APIs on day one) | Full on each side via native UI | Good via modules; gaps need a native module or dev client | Good via plugins; gaps need platform channels | Plugin-dependent, weakest |
| **Performance ceiling** | Highest | Native | High for UI apps; heavy animation/graphics needs care | High, own renderer | Lowest; web view |
| **Time to ship (one platform → both)** | Slowest for both | Medium | Fastest for a JS team; OTA updates via EAS Update | Fast; one codebase | Fast if the web app exists |
| **Kit support here** | **Full starters, CI-compiled** | Router preset only, no starter | **Starter in `assets/expo/`**, typechecked and bundled in CI | **No starter** — doc only | Router preset only, no starter |
| **Main risk** | Double the work | Two UI layers to keep aligned | Native-module and SDK-upgrade churn | Non-native feel on new OS features; Dart hiring | App Review 4.2 "web wrapper" rejection |

## How to choose in one pass
1. **Existing codebase or team?** Their stack wins unless it blocks a core feature (check the hardware column).
2. **Needs deep platform features** (HealthKit/Health Connect, widgets, Live Activities, background audio, camera pipelines)? → native.
3. **One small team, both stores, mostly screens and APIs?** → Expo (JS team) or Flutter (Dart-willing).
4. **Already a web product?** → Capacitor only if it adds real native value; otherwise Apple can reject it as a repackaged site.
5. **Games** → Unity or a game engine, not this table.

## Expo (starter ships)
`./scripts/new-app.sh expo <name> [bundle-id]` copies `assets/expo/`: expo-router tabs + detail + delete-account route, the shared `theme.ts` / `motion.ts` / components from `assets/rn/`, and `eas.json` from `assets/ci/expo-eas.json`. Production use means EAS dev/production builds, never Expo Go. Apps with accounts still need in-app deletion (the starter includes the route); declare SDKs in the privacy manifest and Play data safety exactly as for native — `reconcile-declarations.mjs` reads `package.json`.

## Flutter (reference only, **no starter**)
No Flutter starter is shipped or verified. If the user picks Flutter: use `flutter create`, Material 3, `go_router`, Riverpod; apply the kit's design tokens by hand from `assets/design-tokens.json`; store, privacy, account-deletion and metadata rules in this kit apply unchanged. Mark everything Flutter-specific as unverified in the readiness report.
