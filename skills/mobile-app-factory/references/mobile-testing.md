# Mobile Testing — Production-Ready Quality

A "proper" production app ships with automated checks and real-device confidence. Use this reference to plan testing for native Android/iOS (and cross-platform stacks when applicable).

## Test pyramid (practical)
- **Unit tests**: business logic, use cases, reducers/view models, data transforms. Fast, deterministic, no device.
- **UI/component tests**: render states, interactions, navigation within a screen/flow.
- **Integration tests**: repositories + local DB/network boundaries, feature flows with real dependencies where feasible.
- **E2E tests**: critical user journeys on emulator/simulator or device (smoke, login, core loop, purchase/permissions paths as applicable).
- **Manual/device QA**: accessibility, performance, offline/permissions edge cases, low-end devices, store-review scenarios.

## Native Android (Kotlin + Jetpack Compose, Android Studio)
- **Unit**: JUnit, Kotlin test, MockK/Turbine/Truth as needed. Run with `./gradlew test`.
- **Compose/UI**: Compose testing (`createComposeRule`), semantics, screenshot/snapshot tests where useful.
- **Instrumentation/E2E**: AndroidX Test, Espresso/UiAutomator, or Compose UI tests on emulator/device (`./gradlew connectedAndroidTest`).
- **Quality gates**: Android Lint, ktlint/detekt (optional), R8/release build verification, baseline profiles/startup metrics for production.

## Native iOS (Swift + SwiftUI, Xcode)
- **Unit**: XCTest for logic/view models/services. Run via Xcode Test or `xcodebuild test`.
- **UI**: XCUITest for critical flows; SwiftUI preview/snapshot checks as helpful.
- **Quality gates**: static analysis, warnings-as-errors where practical, performance profiling on device, crash/symbolication readiness.

## Cross-platform E2E (recommended for critical flows)
- **Maestro** (https://maestro.dev, reference skill: https://github.com/foreztgump/maestro-mobile-testing-skill): YAML-driven black-box UI flows across Android, iOS, and more. Good for smoke/regression of core journeys and CI.
  - Keep flows stable with resilient selectors (test IDs/accessibility labels), avoid brittle coordinates/text where possible.
  - Run in CI on emulators/simulators; use for pre-release gates.

## Production-readiness checklist
- [ ] Core business logic covered by unit tests
- [ ] Critical screens/states have UI tests (loading/empty/error/success)
- [ ] At least one E2E smoke path for the core loop runs in CI or before release
- [ ] Permissions denied/blocked, offline, and error-recovery paths tested
- [ ] Accessibility basics checked (labels, focus, dynamic type/font scale, contrast)
- [ ] Release build tested on real devices (not only debug/Expo Go-like dev runtimes)

## External reference repos (patterns & tooling)
- Android official skills: https://github.com/android/skills
- iOS/Apple agent skills & tooling: https://github.com/charleswiltgen/axiom
- Maestro mobile testing skill: https://github.com/foreztgump/maestro-mobile-testing-skill
- Expo skills: https://github.com/expo/skills
- Flutter agent plugins/skills: https://github.com/flutter/agent-plugins
- Vercel agent skills (skill structure): https://github.com/vercel-labs/agent-skills
