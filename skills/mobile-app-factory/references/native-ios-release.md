# Native iOS (Swift + SwiftUI) — Production Build & Release

Use this when the profile stack is `native`, `ios-native`, or `kmp` (iOS target). Target: a proper production app built in **Xcode** with **Swift/SwiftUI**, shipped via **Archive → TestFlight/App Store Connect**.

## Toolchain
- **IDE**: Xcode (current stable; meet Apple's current SDK/build requirements at submission time — see `references/ios-app-store.md`).
- **Language/UI**: Swift, SwiftUI. Prefer a single UI system (SwiftUI) and platform-native navigation/patterns. Use UIKit only where SwiftUI lacks capability.
- **Dependencies**: Swift Package Manager (preferred) or CocoaPods where required. Pin versions and audit SDK privacy manifests.
- **Min deployment**: set per product needs but meet App Store minimums (re-verify in `references/ios-app-store.md`).

## Project setup (production-ready)
- Structure: feature/screen modules, shared design tokens/theme, data/networking layer, clear state management (Observable/SwiftUI state, or a consistent architecture).
- Map design tokens from `assets/design-tokens.json` into SwiftUI theme/constants (colors, typography, spacing, radii).
- Configure **schemes/build configurations**: Debug, Release (and Staging if needed). Disable debug-only code/logging in Release.
- Signing: Automatic or manual signing with correct Team, Bundle ID, capabilities/entitlements.
- Capabilities/entitlements: enable only what you use (Push, HealthKit, Background Modes, Associated Domains, etc.) and provide matching purpose strings/declarations.

## Privacy & compliance
- Add `PrivacyInfo.xcprivacy` to the app target and complete required-reason APIs and tracking domains. Ensure third-party SDKs include manifests/signatures as required.
- `Info.plist` purpose strings must be specific and user-benefit oriented (camera, location, photos, mic, HealthKit, etc.).
- App Tracking Transparency only if tracking; App Privacy answers must match actual behavior/SDKs.
- If accounts exist: in-app account deletion flow (and support paths as required). Demo/review credentials ready.

## Build, archive, and submit
1. Set version (`MARKETING_VERSION`) and build number (`CURRENT_PROJECT_VERSION`, auto-increment in CI).
2. Select **Any iOS Device (arm64)** → **Product > Archive** in Xcode.
3. Validate and distribute to **TestFlight** / **App Store** from Organizer, or automate with `xcodebuild`, Fastlane, or Xcode Cloud.
4. Complete App Store Connect metadata, privacy, age rating, export compliance, screenshots, and review notes before submission.

## Release checklist (iOS)
- [ ] Builds with current required Xcode/SDK; deployment target meets policy
- [ ] Bundle ID, signing, capabilities, entitlements correct for Release
- [ ] `PrivacyInfo.xcprivacy` + purpose strings complete and accurate
- [ ] No placeholder content; crash-free on physical devices; accessibility basics verified
- [ ] Archive validated; TestFlight tested; metadata/screenshots match shipped build
- [ ] IAP/restore/terms links verified if applicable; demo account provided for review

## CI (example)
- GitHub Actions on macOS runners or Xcode Cloud: resolve packages → build/test (`xcodebuild test`) → archive → upload to TestFlight via Fastlane/App Store Connect API.
- Store certificates/profiles/API keys as encrypted CI secrets. Never commit signing material.

## References
- `references/ios-app-store.md` (policy, metadata, review risks)
- `assets/ios/PrivacyInfo.xcprivacy`
- `assets/ci/ios-release.yml` (starter workflow) if present
- Axiom (reference): https://github.com/CharlesWiltgen/Axiom — iOS build/debug/audit tooling and skills patterns
