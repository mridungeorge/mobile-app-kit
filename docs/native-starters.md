# Native production scaffold helpers

[← back to the README](../README.md)

For proper native projects — not Expo Go, not a wrapper:

```bash
# Android: buildable Kotlin + Jetpack Compose project (Gradle version catalog, theme, tests)
./skills/mobile-app-factory/scripts/new-app.sh native-android "Night Notes" com.example.nightnotes

# iOS: buildable Swift + SwiftUI project (XcodeGen project.yml, PrivacyInfo, XCTest)
./skills/mobile-app-factory/scripts/new-app.sh native-ios "Night Notes" com.example.nightnotes
```

Each helper generates the actual project, not just notes: `android/` or `ios/` plus `.mobile/` state, design tokens, release/testing docs, and CI starters. Open the project in **Android Studio** / **Xcode**, or build from the command line:

```bash
cd "Night Notes/android" && ./gradlew :app:assembleDebug
cd "Night Notes/ios" && brew install xcodegen && xcodegen generate && open *.xcodeproj   # macOS
```

The Android starter ships the Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/`), so a machine with a JDK 17 and no Gradle install can build it. It also ships a version catalog, Material 3 theme wired to the design tokens, a `HomeScreen`, unit + instrumented tests, backup rules and an adaptive icon. The iOS starter ships a `Theme.swift` mapped to the same tokens, `PrivacyInfo.xcprivacy`, an asset catalog and an XCTest target. Both substitute your app name, package and bundle id — no `__PLACEHOLDER__` tokens survive.

## What the starters actually contain

Both are shells you can ship, not one demo screen. They have no network secret and no API key: the app runs offline on a fake client until you point it at a backend.

| Concern | Android (`assets/android/project`) | iOS (`assets/ios/project`) |
|---|---|---|
| Navigation | Navigation Compose `NavHost`; detail route with a typed `id` argument | `TabView` in compact width, `NavigationSplitView` in regular width; `NavigationStack` per tab |
| Adaptive layout | `WindowSizeClass` → bottom bar or navigation rail | `horizontalSizeClass` → tab bar or split view |
| DI | Hilt (`@HiltAndroidApp`, `di/AppModule.kt`) | `AppEnvironment` container, injected via `.environment(_:)` |
| Network | `ApiClient` interface + `FakeApiClient` | `APIClient` protocol + `MockAPIClient` + `LiveAPIClient` (URLSession) |
| Local data | Room: `HabitEntity`, `HabitDao`, `AppDatabase`, in-memory DAO test | SwiftData `@Model Habit` + `HabitRepository` + in-memory container test |
| Settings | DataStore preferences (`SettingsRepository`) | `SettingsStore` over `UserDefaults` |
| Screen state | `UiState` sealed interface + `StateHost` (loading/empty/offline/error/content) | `UiState` enum + `StateView` |
| Auth | `AuthProvider` protocol; email works, Apple and Google are stubs that fail loudly | same shape, `AuthService` + `AuthProvider` |
| Account deletion | `AccountDeletionScreen` with confirmation + web-deletion link copy | `AccountDeletionScreen` + local cache purge |
| Languages | `res/xml/locales_config.xml` + `android:localeConfig` | `Resources/Localizable.xcstrings` (String Catalog, en + de) |
| Motion | `ui/theme/Motion.kt`, honours the system animator setting | `DesignSystem/Motion.swift`, honours `accessibilityReduceMotion` |
| Edge-to-edge | `enableEdgeToEdge()` | safe-area-respecting SwiftUI layout |

Everything above is asserted by `node skills/mobile-app-factory/scripts/check-skill.mjs`: it scaffolds both starters into a temp directory and fails if a file disappears, if a placeholder survives, or if the Android manifest stops pointing at the Hilt application and the locale config.

Both starters also ship the motion tokens (`ui/theme/Motion.kt` and `DesignSystem/Motion.swift`), so a generated app starts with the same springs the motion skill uses.

## Optional modules

`node skills/mobile-app-factory/scripts/enable-modules.mjs --platform android --app <dir> --package <id> --modules billing,push,analytics-crash` (iOS: `--platform ios --app <dir> --project <ModuleName>`) copies the module sources into a scaffolded app and appends their dependencies. CI scaffolds both platforms with modules enabled and builds them (`modules-android`, `modules-ios`).

## Toolchain

The Android starter is pinned to the current stable line rather than a safe old one:

| Piece | Version | Why this one |
|---|---|---|
| Gradle | 9.9.1 | AGP 9.5 requires 9.6 or newer |
| Android Gradle plugin | 9.5.1 | newest stable; supports API 37 and compiles Kotlin itself |
| Kotlin | 2.2.10, built in | the KGP version AGP 9.5 embeds; the catalog pins it only for the Compose compiler plugin, which must match |
| KSP | 2.3.14 | the 2.3 line is the one that understands AGP's built-in Kotlin; 2.2-era KSP still writes `kotlin.sourceSets` and fails configuration |
| Hilt | 2.60.1 | 2.60+ is the line that requires AGP 9 |
| compileSdk / targetSdk / minSdk | 37 / 37 / 26 | the current AndroidX release requires compileSdk 37 |

AGP 9 removed `org.jetbrains.kotlin.android`: Kotlin is compiled by the Android plugin, and applying the old Kotlin plugin now fails the build. `jvmTarget` follows `compileOptions.targetCompatibility`, so the module does not repeat it.

## Verified where

| What | Where | Result |
|---|---|---|
| `:app:assembleDebug` | authoring machine: Windows 11, JDK 17.0.21, SDK Platform 37.0 | passes |
| `:app:testDebugUnitTest` | same | 3/3 tests pass |
| `:app:lintDebug` | same | 0 errors, 0 warnings |
| `:app:assembleDebugAndroidTest` | same | compiles; running it needs a device or emulator |
| `xcodegen generate`, `xcodebuild build`, `xcodebuild test` | macOS CI only | **not verified locally** — Xcode is macOS-only and the authoring machine is Windows |

The iOS sources have not been compiled on this machine. They are checked by inspection and by CI, and should be treated as unproven until that job has run once.

CI is set up to compile both starters on every push (`.github/workflows/audit.yml`): the Android job runs `assembleDebug`, `testDebugUnitTest`, `lintDebug` and `assembleDebugAndroidTest` with JDK 17, and the iOS job generates the project with XcodeGen, builds for the simulator with code signing disabled, then runs `xcodebuild test`. A template that stops compiling fails the build instead of rotting quietly.
