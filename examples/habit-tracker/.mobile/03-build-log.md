# Build log

## Stack
Native: Kotlin + Jetpack Compose (`android/`), Swift + SwiftUI (`ios/`), scaffolded with
`scaffold-native.mjs` from the kit's habit starter. Local source of truth: Room (Android) and
SwiftData (iOS). No backend in v1; sync is behind the subscription and not implemented.

## What is implemented (both platforms)
- Today screen with a habit list, streak caption and a check-in action.
- Detail screen with streak, best streak and completion copy.
- Settings: reminder time, appearance, export, restore purchases, account deletion.
- Auth stub (email validation only, no vendor SDK) and a delete-account screen wired to the API
  client protocol; the mock client keeps the starter runnable without a key.
- Shared `UiState` machine: loading, empty, offline, error, content.
- Every network boundary is a protocol, so a live client is one file to swap.

## What is specified but not implemented
- History grid and the weekly-paywall screen from `02-design.md`.
- RevenueCat purchase path (the kit's `billing` module has the `PurchaseService` shape; this
  sample does not enable it, to keep the project key-free).
- Cross-device sync.

## Verification
- Android: `./gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug`.
- iOS: `xcodegen generate` then `xcodebuild ... test` on a CI macOS runner (no Xcode on the
  authoring machine).
- The example has its own CI jobs in `.github/workflows/audit.yml`.
