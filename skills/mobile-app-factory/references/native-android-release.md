# Native Android (Kotlin + Jetpack Compose) — Production Build & Release

Use this when the profile stack is `native`, `android-native`, or `kmp`. Target: a proper production app built in **Android Studio** with **Gradle**, shipped as a signed **Android App Bundle (AAB)** to **Google Play**.

## Toolchain
- **IDE**: Android Studio (latest stable). Install Android SDK, command-line tools, and required platform/build-tools.
- **Language/UI**: Kotlin, Jetpack Compose, Material 3. Single UI system (Material 3/Compose) — do not mix legacy View/XML patterns in new screens unless required.
- **Build**: Gradle (Kotlin DSL preferred: `build.gradle.kts`). JDK 17+ (match AGP requirements).
- **Min/target**: set `minSdk` per product needs; set `targetSdk`/`compileSdk` to current Play requirements (e.g. `targetSdk 36` for new apps/updates from 31 Aug 2026 — re-verify in `references/google-play.md`).

## Project setup (production-ready)
- Use application modules with clear layers: `ui` (Compose screens/components), `domain`/`data` (repositories, use cases), `core` (design tokens/theme, utilities).
- Define design tokens in a central theme (`Color`, `Type`, `Dimens`, shapes) mapped from `assets/design-tokens.json`.
- Enable **R8/ProGuard** minification and resource shrinking for release builds; keep rules for reflection/serialization SDKs.
- Configure **build types**: `debug`, `release` (minify, no debuggable), and optional `staging` with distinct `applicationIdSuffix`/versionName suffix.
- Use **version catalogs** (`libs.versions.toml`) and lock dependency versions.

## Signing & Play App Signing
1. Generate an **upload keystore** (store securely, never commit): `keytool -genkeypair -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`.
2. Configure signing in Gradle via environment variables/CI secrets (not hardcoded):
   - `storeFile`, `storePassword`, `keyAlias`, `keyPassword` read from `keystore.properties` (gitignored) or CI secrets.
3. Enroll in **Play App Signing** in Play Console. Upload the AAB signed with your upload key; Google manages the app signing key.
4. Output: **AAB** for Play (`./gradlew :app:bundleRelease`). APKs only for internal/debug distribution if needed.

## Release checklist (Android)
- [ ] `applicationId`, `versionCode` (auto-increment), `versionName` set; release notes prepared
- [ ] `targetSdk` meets current Play policy; permissions minimal and justified
- [ ] Release build signed, minified, tested (R8 keeps verified)
- [ ] `PrivacyInfo`/data-safety declarations match actual SDKs; account deletion in-app + web if accounts exist
- [ ] App icons/adaptive icons, splash, deep links, backups/rules configured
- [ ] Crashes/ANRs checked on real devices; baseline profiles/startup optimized for prod
- [ ] Upload AAB to internal/closed track, then promote per rollout plan

## CI (example)
- GitHub Actions: checkout → JDK 17 → Gradle cache → `./gradlew lint test bundleRelease` → upload artifact / submit via Play Developer API or Fastlane supply.
- Store upload keystore and Play service-account JSON as encrypted CI secrets. Never commit credentials.

## References
- `references/google-play.md` (policy, targetSdk, 12-tester gate, data safety)
- `assets/android/data-safety-worksheet.md`
- `assets/ci/android-release.yml` (starter workflow) if present
