# Android Gradle Starter (Kotlin + Jetpack Compose)

These are production-oriented starter snippets/templates to bootstrap a proper Android Studio project.

## Recommended setup in Android Studio
1. **New Project → Empty Activity** (Jetpack Compose), Language **Kotlin**, **Kotlin DSL**.
2. Set `applicationId`, `minSdk`, `targetSdk/compileSdk` per current Play requirements.
3. Apply:
   - `signing-and-build.gradle.kts.snippet` patterns to `app/build.gradle.kts`
   - `proguard-rules.pro`
   - `keystore.properties.example` → `keystore.properties` (gitignored)
4. Keep secrets out of git; use CI secrets for keystore and Play service account.

## Production checks
- Release build: `./gradlew :app:bundleRelease` (AAB)
- R8/minify + resource shrinking enabled
- Version code auto-incremented in CI/release process
- Data safety, permissions, and privacy manifest/declarations match shipped SDK behavior
- Lint/tests green: `./gradlew lint test`
