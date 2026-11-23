# Cross-platform decision

The kit's default is native (Kotlin + Compose, Swift + SwiftUI) because it has the deepest
starters and the most verification. That is a default, not a ruling. **If the user explicitly
chooses Expo, Flutter, Capacitor or KMP, respect it**: say what the choice costs once, then build
it. `route-idea.mjs` keeps the choice (`--stack expo`) in the profile.

## How the stack is chosen

1. `--stack <name>` on `questionnaire.mjs` or `route-idea.mjs` always wins.
2. Otherwise the intake's `team` answer decides: a team described as React / React Native /
   Expo / JavaScript / TypeScript gets **Expo**. `route-idea.mjs --intake .mobile/00-intake.json`
   (or `--dir .mobile` when the intake exists) reads the same field.
3. Otherwise the archetype default is native for both platforms, or `android-native` /
   `ios-native` when the intake asks for one platform.

The router does not silently switch a native user to Expo. It only follows the team they stated.

## Decision table

| | Native (Kotlin + Swift) | KMP (shared logic, native UI) | Expo / React Native | Flutter | Capacitor |
|---|---|---|---|---|---|
| **Team skills** | Two native skill sets, or one team learning both | Kotlin team that also ships iOS | JS / TypeScript / React team | Dart-willing team | Web team with an existing web app |
| **Best app types** | Anything; platform-heavy, media, health, widgets | Logic-heavy apps with native feel | Content, commerce, social, forms, CRUD, internal tools | Brand-heavy custom UI | Wrapping an existing PWA |
| **Hardware depth** | Full, day one | Full via native UI | Good via modules; gaps need a dev client | Good via plugins | Weakest; plugin-dependent |
| **Performance ceiling** | Highest | Native | High for screen-based apps | High | Web view |
| **Time to ship** | Slowest for both platforms | Medium | Fastest for a JS team; EAS Update for JS-only fixes | Fast | Fast if the web app exists |
| **Kit support** | **Full starters, CI-compiled** | Router preset only, no starter | **Starter in `assets/expo/`**, typechecked, tested and bundled in CI | **No starter** | Router preset only |
| **Main risk** | Double the work | Two UI layers to keep aligned | Native-module and SDK-upgrade churn | Non-native feel; Dart hiring | App Review 4.2 web-wrapper rejection |

## What the Expo starter actually contains

`./scripts/new-app.sh expo <name> <bundle-id>` copies `assets/expo/` plus the shared Rune theme,
motion tokens and components from `assets/rn/`.

| Concern | Implementation | Test |
|---|---|---|
| Routing | expo-router stack + tabs, typed routes | typecheck |
| Auth | `assets/expo/src/auth.tsx` context, credential validation, token in **expo-secure-store** | `assets/expo/__tests__/auth.test.ts` |
| Persistence | `assets/expo/src/repository.ts` on expo-sqlite; cache survives a failed fetch | `assets/expo/__tests__/api.test.ts` (state machine) |
| API states | loading / empty / offline / error / content in `assets/expo/src/api.ts` + `StateView` | `assets/expo/__tests__/state-view.test.tsx` |
| Account deletion | `assets/expo/app/delete-account.tsx` + token and cache cleared | typecheck; in-app route |
| Settings | restore purchases, delete account, sign out | typecheck |
| Motion | shared `motion.ts`; Reanimated 4 | typecheck; motion recipes are tested in the motion skill |

The starter is deliberately key-free: `MockApi` implements the `Api` interface, so a live backend
is one file to swap. `npm test`, `npm run typecheck`, `npx expo-doctor` and
`npx expo export --platform android --platform ios` run in the `expo-build` CI job.

## Module support in Expo

| Module | Expo path | Status |
|---|---|---|
| `push` | `expo-notifications`; Expo push service or FCM/APNs direct | Supported; permission prompting and Android channels are the same rules as native |
| `billing` | `react-native-purchases` (RevenueCat) or `expo-iap`; both need a dev/production build | Supported, not in the starter (needs keys) |
| `deeplinks` | expo-router deep links + `expo-linking`; universal links need native config | Supported |
| `localization` | `expo-localization` + i18n-js; RTL via `I18nManager` and restart | Supported |
| `analytics-crash` | `@sentry/react-native` (Expo config plugin) | Supported |
| Camera, location, notifications, secure storage, SQLite | first-party Expo modules | Supported |
| Maps | `react-native-maps` or MapLibre via config plugin | Supported |
| Stripe payments | `@stripe/stripe-react-native` via config plugin | Supported |
| **Widgets, Live Activities, watchOS, App Clips, share/notification extensions** | require native targets and a config plugin or prebuild | **Not starter-supported**; needs native code |
| **HealthKit / Health Connect reads and writes** | no first-party Expo module; community modules need a dev client | **Not starter-supported**; write a native module |
| **Background audio, background location with continuous tracking** | possible with `expo-location` background tasks and `expo-audio`, but OS limits still apply and App Review checks the justification | Partly supported; test on device |
| **Custom Metal / heavy 3D or video pipelines** | possible via native modules, but the JS bridge is the wrong tool | **Not recommended**; use native or a game engine |

Every row above inherits the store rules unchanged: privacy manifest and Play data safety must
declare each SDK, accounts need in-app deletion, and subscription apps need a visible restore path.

## Flutter (reference only, no starter)

No Flutter starter is shipped or verified. If the user picks Flutter: `flutter create`, Material 3,
`go_router`, Riverpod; apply the kit's tokens from `assets/design-tokens.json` by hand. Mark every
Flutter-specific claim as unverified in the readiness report.

## What is not verified here

- Expo builds are verified by CI (typecheck, jest, expo-doctor, export) and by the commands above.
  They are **not** verified as store submissions in this repository; no EAS project or store
  account is attached.
- Device-only behaviour (push delivery, keychain after reinstall, SQLite migration under an app
  update) needs a real build. The starter documents it; the CI does not prove it.
- Native modules listed as "not starter-supported" have no code in this kit, so the agent must
  write and verify them rather than claim parity.
