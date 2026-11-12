# Stacks, Repos, and Libraries

Star counts are a **November 2026 GitHub snapshot** — a popularity signal, not a quality score. Anything under ~6 months since last push deserves suspicion for a new build.

The decision table is a fallback for when the idea is unusual or the team overrides the profile. By default the stack comes from `.mobile/00-profile.json`, which already encodes the archetype's sensible choice — **native (Kotlin + Jetpack Compose / Swift + SwiftUI) for almost every consumer and B2B app**, Unity for games, and native plus an offline queue for B2B field work. Expo appears only when the team explicitly asks for a cross-platform JS prototype.

## Contents
1. Decision table
2. Native Android — Kotlin + Jetpack Compose
3. Native iOS — Swift + SwiftUI
4. Kotlin Multiplatform
5. Expo / React Native (prototype)
6. Flutter
7. Web-to-app (Ionic / Capacitor)
8. Library map by job
9. What not to use for a new app in 2026

---

## 1. Decision table

| Constraint | Choose | Reason |
|---|---|---|
| **Production-ready, both stores (default)** | **SwiftUI + Jetpack Compose (Kotlin)** | Proper native apps, full platform APIs, best performance/review fit, built in Xcode + Android Studio |
| Android-only or Android-first team | **Kotlin + Jetpack Compose** | Native Android, Gradle toolchain, Play-ready AAB/signing, deep OS integration |
| iOS-only or Apple-first team | **Swift + SwiftUI** | Native iOS, Xcode/Archive/TestFlight, best platform feel |
| Shared business logic, native UI | **KMP + Compose Multiplatform / SwiftUI** | Share domain/data while keeping production-native UI where needed |
| Design-heavy custom UI, single codebase | **Flutter** | Own renderer, consistent output |
| Existing web app, store shell needed | **Ionic + Capacitor** | Reuse web build; ensure it feels app-like (not a thin wrapper) |
| JS team, rapid prototype (explicit) | **Expo + React Native** | Fast iteration; for production use dev builds/EAS, not Expo Go |

For "proper" production apps, prefer native toolchains (Android Studio/Gradle, Xcode) over Expo Go-style runtime workflows.

---

## 2. Native Android — Kotlin + Jetpack Compose

**Scaffold**

```bash
# Buildable project: version catalog, theme, HomeScreen, tests, Gradle wrapper
./scripts/new-app.sh native-android "Night Notes" com.example.nightnotes

cd "Night Notes/android" && ./gradlew :app:assembleDebug
```

**Core repos and libraries**
| Repo / library | ⭐ | Use |
|---|---|---|
| `android/compose-samples` | 23.6k | Compose patterns, all the official samples |
| `android/nowinandroid` | 18.5k | Production architecture reference: modules, offline-first, tests |
| `wasabeef/awesome-android-ui` | 58.4k | Component inspiration (port to Compose, do not copy views) |
| `InsertKoinIO/koin` | 10.0k | DI (or Hilt if the team already uses Dagger) |
| `square/retrofit` + `Kotlin/kotlinx.serialization` | 43.4k / 6.0k | Networking + models |
| `coil-kt/coil` | 11.4k | Image loading, memory-safe by default |
| `androidx.room` | — | Persistence; required for offline queues |
| `androidx.work` | — | Background sync with declared constraints |
| `androidx.navigation` (compose) | — | One nav graph, typed routes |
| `androidx.camera` (CameraX) | — | Capture without fighting the camera API |
| `googlemaps/android-maps-compose` | — | Maps in Compose |
| `RevenueCat/purchases-android` | 0.6k | Subscriptions across Play Billing changes |
| `getsentry/sentry-android` | — | Crash + ANR reporting with release health |

**Rules**: Compose-only for new screens (no XML layouts mixed in), Material 3 theming driven by the design tokens copied into the generated project's `docs/` folder, `compileSdk`/`targetSdk` kept at the current Play requirement, R8 on for release with a written ProGuard rationale.

---

## 3. Native iOS — Swift + SwiftUI

**Scaffold**

```bash
# From this skill: SwiftUI sources, XcodeGen project.yml, PrivacyInfo, assets, XCTest
./scripts/new-app.sh native-ios "Night Notes" com.example.nightnotes

# On macOS
cd "Night Notes/ios" && brew install xcodegen && xcodegen generate && open *.xcodeproj
```

**Core repos and libraries**
| Repo / library | ⭐ | Use |
|---|---|---|
| `vsouza/awesome-ios` | 53.9k | Curated index of libraries and learning material |
| `dkhamsing/open-source-ios-apps` | 53.2k | Real apps to read for structure |
| `pointfreeco/swift-composable-architecture` | 15.0k | State management for large apps; skip for small ones |
| `Alamofire/Alamofire` | 42.1k | Networking (or plain `URLSession` + async/await) |
| `onevcat/Kingfisher` / `kean/Nuke` | 23.9k / 8.1k | Image loading and cache |
| `RevenueCat/purchases-ios` | 2.6k | StoreKit 2 subscriptions, receipt validation |
| `getsentry/sentry-cocoa` | 0.9k | Crash reporting |
| SwiftData / Core Data | — | Persistence; SwiftData for new apps, Core Data for migrations |
| SwiftUI `NavigationStack`, `Observation` | — | Native navigation and state |

**Rules**: SwiftUI-first, no UIKit view controllers except where a system feature requires them (camera picker, Mail composer). `PrivacyInfo.xcprivacy` in every target and extension. Deployment target set deliberately, not copied from a tutorial. Signing, capabilities and Archive stay in Xcode or CI — never in the repo.

---

## 4. Kotlin Multiplatform

**Scaffold**

```bash
# Gradle-based; use the JetBrains wizard for a new project
# https://kmp.jetbrains.com
```

**Core repos**
| Repo | ⭐ | Use |
|---|---|---|
| `JetBrains/compose-multiplatform` | 16.9k | Shared Compose UI across Android/iOS/desktop |
| `JetBrains/kotlin` | 50.1k | Language + KMP toolchain |
| `ktorio/ktor` | 13.4k | Shared HTTP client |
| `cashapp/sqldelight` | 6.2k | Shared SQL with platform drivers |
| `android/compose-samples` | 23.6k | Compose patterns |
| `InsertKoinIO/koin` | 10.0k | DI across platforms |
| `Kotlin/kotlinx.serialization` | 6.0k | Shared models |

Use KMP when the domain logic is the expensive part. Keep navigation and platform chrome native if you want App Store reviewers to see a "real" iOS app; shared Compose UI is acceptable but needs extra attention to iOS gestures and typography.

---

## 5. Expo / React Native (prototype)

Explicit request only. This is the fast path to a cross-platform prototype, not the production-native path.

**Scaffold**

```bash
npx create-expo-app@latest my-app --template blank-typescript
cd my-app
npx expo install expo-router react-native-safe-area-context react-native-screens
```

Then run `scripts/new-app.sh expo <name>` from this skill to drop in tokens and components.

**Core repos**
| Repo | ⭐ | Use |
|---|---|---|
| `expo/expo` | 53.4k | Framework, EAS, OTA updates |
| `react/react-native` | 126.9k | Runtime (repo moved from `facebook/`) |
| `expo/examples` | 3.8k | Canonical API examples |
| `obytes/react-native-template-obytes` | 4.4k | Production template: TS, NativeWind, EAS, CI |
| `infinitered/ignite` | 20.0k | Boilerplate + generators |
| `roninoss/create-expo-stack` | 2.6k | Interactive stack generator |

**UI systems — choose one**
| Repo | ⭐ | Character |
|---|---|---|
| `founded-labs/react-native-reusables` | 8.7k | shadcn/ui feel, copy-paste, NativeWind — closest to this skill's design language |
| `tamagui/tamagui` | 14.3k | Universal styled components, compiler, strong theming |
| `callstack/react-native-paper` | 14.5k | Material 3, opinionated, fast to ship |
| `GeekyAnts/NativeBase` | 20.4k | Accessible, broad component set |
| `wix/react-native-ui-lib` | 7.2k | Dense, production-tested |
| `akveo/react-native-ui-kitten` | 10.7k | Eva design system, runtime theming |
| `nativewind/nativewind` | 8.1k | Tailwind utilities (styling layer, not components) |

**Recommended pairing**: reusables + NativeWind + Reanimated. It is the only combination that lets you express "hairline border, 8px radius, spring 300ms" without fighting the kit's defaults.

---

## 6. Flutter

**Scaffold**

```bash
flutter create --org com.example --platforms=ios,android my_app
cd my_app
flutter pub add flutter_riverpod go_router dio
```

**Core repos**
| Repo | ⭐ | Use |
|---|---|---|
| `flutter/flutter` | 173.6k | Framework + engine |
| `rrousselGit/riverpod` | 6.4k | State + DI |
| `felangel/bloc` | 12.1k | Event-driven state for large apps |
| `flutter/packages` | 2.9k | Official `go_router`, `camera`, `url_launcher` |
| `jonataslaw/getx` | 6.1k | All-in-one; fast to start, hard to maintain |
| `VeryGoodOpenSource/very_good_cli` | 2.8k | Project scaffold + tests + CI |

Flutter is the answer for a design-heavy product that must look identical on both platforms and the team already knows Dart. It is not the answer for a native-feeling utility.

---

## 7. Web-to-app

`ionic-team/ionic-framework` (52.7k) + `ionic-team/capacitor` (17.1k). Good when the web app already exists and the native needs are push, camera, files, and a store listing. Watch out for: 60fps scrolling on low-end Android, safe-area handling, and Apple 4.2 (a wrapped website gets rejected — it must feel app-like).

This is also the only mobile path where **GSAP and react-bits** run natively (see the `motion-experiences` skill).

---

## 8. Library map by job

| Job | Android (Kotlin) | iOS (Swift) | Expo/RN | Flutter | KMP |
|---|---|---|---|---|---|
| Navigation | Compose Navigation / typed routes | `NavigationStack` | `react-navigation` (24.5k) or Expo Router | `go_router` | Compose Navigation / Voyager |
| Server state | Retrofit/Ktor + Flow | async/await `URLSession` | `TanStack/query` (50.5k) | `riverpod` + dio | Ktor |
| Local data | Room | SwiftData / Core Data | SQLite | drift / sqflite | SQLDelight |
| Animation | Compose `animate*AsState` | `withAnimation` / `.animation` | `react-native-reanimated` (11.1k) | `flutter_animate` | Compose animation |
| Gestures | Compose gestures | SwiftUI gestures | `react-native-gesture-handler` | built-in | Compose gestures |
| Lists | `LazyColumn` | `LazyVStack` / `List` | `Shopify/flash-list` (7.2k) | `ListView.builder` | `LazyColumn` |
| Sheets | Material3 `ModalBottomSheet` | `.sheet` / `.presentationDetents` | `gorhom/react-native-bottom-sheet` (9.1k) | `showModalBottomSheet` | Material3 sheet |
| Icons | `material-icons-extended` | SF Symbols | `oblador/react-native-vector-icons` (17.9k) | `lucide_icons` | Compose icons |
| Motion assets | `lottie-compose` | Lottie-iOS | `lottie-react-native` (17.2k) | `lottie` | `lottie-compose` |
| Camera | CameraX | AVFoundation | `margelo/react-native-vision-camera` (9.7k) | `camera` | CameraX |
| Maps | Maps Compose | MapKit / Maps SDK | `react-native-maps` (16.0k) | `google_maps_flutter` | Google Maps KMP |
| Purchases | Play Billing / RevenueCat | StoreKit 2 / RevenueCat | `RevenueCat/react-native-purchases` (1.2k) | `purchases_flutter` | RevenueCat KMP |
| Crash/analytics | `getsentry/sentry-android` | `getsentry/sentry-cocoa` | `getsentry/sentry-react-native` (1.8k) | `sentry_flutter` | Sentry KMP |
| E2E | Compose UI test / Maestro (16.4k) | XCUITest / Maestro | `mobile-dev-inc/Maestro` | integration_test | Compose UI test |
| Build/submit | Gradle + fastlane (42.4k) | Xcode Cloud / fastlane | `expo/eas-cli` (1.4k), fastlane | fastlane | fastlane |

---

## 9. What not to use for a new app in 2026

- **Cordova / PhoneGap** — unmaintained relative to Capacitor.
- **Xamarin.Forms** — end of life; .NET MAUI is the successor.
- **React Native without Expo for a new app** — you inherit native config work EAS already solved.
- **Any UI kit last pushed before 2025** — RN/Flutter internals move; old kits break on new architecture.
- **Three UI kits in one app** — the result reads as assembled; reviewers and users both notice.
- **Expo Go as the shipping runtime** — it is a development shell. Production needs a dev build/EAS build or a native project.
