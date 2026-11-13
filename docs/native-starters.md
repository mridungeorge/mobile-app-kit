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

Both starters also ship the motion tokens (`ui/theme/Motion.kt` and `DesignSystem/Motion.swift`), so a generated app starts with the same springs the motion skill uses.

CI compiles both starters on every push (`.github/workflows/audit.yml`): the Android job runs `assembleDebug` + `lint` with JDK 17, the iOS job generates the project with XcodeGen and builds it for the iOS Simulator with code signing disabled. A template that stops compiling fails the build instead of rotting quietly.
