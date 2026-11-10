# Stacks, Repos, and Libraries

Star counts are a **November 2026 GitHub snapshot** — a popularity signal, not a quality score. Anything under ~6 months since last push deserves suspicion for a new build.

The decision table is a fallback for when the idea is unusual or the team overrides the profile. By default the stack comes from `.mobile/00-profile.json`, which already encodes the archetype's sensible choice (for example: Expo for most consumer apps, Unity for games, enterprise API + offline queue for B2B field work).

## Contents
1. Decision table
2. Expo / React Native stack
3. Flutter stack
4. Kotlin Multiplatform stack
5. Native iOS / Android
6. Web-to-app (Ionic / Capacitor)
7. Library map by job
8. What not to use for a new app in 2026

---

## 1. Decision table

| Constraint | Choose | Reason |
|---|---|---|
| Team knows TypeScript/React | **Expo** | One codebase, EAS builds both stores, largest UI ecosystem |
| Design is the product (custom motion, brand) | **Flutter** | Own renderer, identical output, strong implicit animation API |
| Existing Android app, Kotlin team | **KMP + Compose Multiplatform** | Share domain logic, adopt UI incrementally |
| Deep OS integration, two teams, budget | **SwiftUI + Compose** | Day-one API access, best platform feel |
| Existing web app, need a store presence fast | **Ionic + Capacitor** | Reuse the web build; native shell only |
| Enterprise Microsoft shop | **.NET MAUI** | C#/XAML, Visual Studio tooling |

Speed to first submission, roughly: Expo 1× · Flutter 1.2× · KMP 1.5× · native 2×.

---

## 2. Expo / React Native

**Scaffold**

```bash
npx create-expo-app@latest my-app --template blank-typescript
cd my-app
npx expo install expo-router react-native-safe-area-context react-native-screens
```

Then run `scripts/new-app.sh` from this skill to drop in tokens and components.

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

## 3. Flutter

**Scaffold**

```bash
flutter create --org com.yourco --platforms ios,android my_app
```

**Repos**
| Repo | ⭐ | Use |
|---|---|---|
| `flutter/flutter` | 181.1k | Framework |
| `flutter/samples` | 19.3k | Official patterns incl. adaptive layouts |
| `mitesh77/Best-Flutter-UI-Templates` | 22.9k | Complete screen templates to learn from |
| `Solido/awesome-flutter` | 61.9k | Library index |
| `flutter/gallery` (archived) | 6.6k | Material 3 reference |

**UI approach**: Material 3 as the base, then `ThemeData` overriding `ColorScheme` to the neutral ramp + one accent, `TextTheme` to the 13/14 body scale, and `PageTransitionsTheme` to platform-native. Motion via `AnimationController` or `flutter_animate` with durations from the motion table. Avoid shipping Cupertino and Material widgets mixed on the same screen.

---

## 4. Kotlin Multiplatform

| Repo | ⭐ | Use |
|---|---|---|
| `JetBrains/compose-multiplatform` | 19.5k | Shared Compose UI |
| `Kotlin/KMP-App-Template` | 702 | Official shared-UI starter |
| `android/nowinandroid` | 22.1k | Architecture reference (Material 3, adaptive) |
| `android/compose-samples` | 23.6k | Compose patterns |
| `InsertKoinIO/koin` | 10.0k | DI across platforms |
| `Kotlin/kotlinx.serialization` | 6.0k | Shared models |

Use KMP when the domain logic is the expensive part. Keep navigation and platform chrome native if you want App Store reviewers to see a "real" iOS app; shared Compose UI is acceptable but needs extra attention to iOS gestures and typography.

---

## 5. Native

**iOS**: SwiftUI + `pointfreeco/swift-composable-architecture` (15.0k) for large apps; `vsouza/awesome-ios` (53.9k) and `dkhamsing/open-source-ios-apps` (53.2k) for patterns.
**Android**: Compose + `android/nowinandroid` architecture; `wasabeef/awesome-android-ui` (58.4k) for components.

Native is the right answer when: camera/AR/health/Wallet/Bluetooth are core, or when the app must feel indistinguishable from system apps. It is the wrong answer for a 6-week MVP with one developer.

---

## 6. Web-to-app

`ionic-team/ionic-framework` (52.7k) + `ionic-team/capacitor` (17.1k). Good when the web app already exists and the native needs are push, camera, files, and a store listing. Watch out for: 60fps scrolling on low-end Android, safe-area handling, and Apple 4.2 (a wrapped website gets rejected — it must feel app-like).

This is also the only mobile path where **GSAP and react-bits** run natively (see the `motion-experiences` skill).

---

## 7. Library map by job

| Job | Expo/RN | Flutter | KMP |
|---|---|---|---|
| Navigation | `react-navigation` (24.5k) or Expo Router | `go_router` | Compose Navigation / Voyager |
| Server state | `TanStack/query` (50.5k) | `riverpod` + dio | Ktor + SQLDelight |
| Animation | `software-mansion/react-native-reanimated` (11.1k) | `flutter_animate` / implicit | Compose `animate*AsState` |
| Gestures | `react-native-gesture-handler` | built-in | Compose gestures |
| Lists | `Shopify/flash-list` (7.2k) | `ListView.builder` | `LazyColumn` |
| Sheets | `gorhom/react-native-bottom-sheet` (9.1k) | `showModalBottomSheet` | Material3 `ModalBottomSheet` |
| Icons | `oblador/react-native-vector-icons` (17.9k) | `lucide_icons` | `material-icons-extended` |
| Motion assets | `lottie-react-native` (17.2k) | `lottie` | `lottie-compose` |
| Camera | `margelo/react-native-vision-camera` (9.7k) | `camera` | CameraX |
| Maps | `react-native-maps` (16.0k) | `google_maps_flutter` | Google Maps KMP |
| Purchases | `RevenueCat/react-native-purchases` (1.2k) | `purchases_flutter` | RevenueCat KMP |
| Crash/analytics | `getsentry/sentry-react-native` (1.8k) | `sentry_flutter` | Sentry KMP |
| E2E | `mobile-dev-inc/Maestro` (16.4k) | integration_test | Compose UI test |
| Build/submit | `expo/eas-cli` (1.4k), `fastlane/fastlane` (42.4k) | fastlane | fastlane |

---

## 8. What not to use for a new app in 2026

- **Cordova / PhoneGap** — unmaintained relative to Capacitor.
- **Xamarin.Forms** — end of life; .NET MAUI is the successor.
- **React Native without Expo for a new app** — you inherit native config work EAS already solved.
- **Any UI kit last pushed before 2025** — RN/Flutter internals move; old kits break on new architecture.
- **Three UI kits in one app** — the result reads as assembled; reviewers and users both notice.
