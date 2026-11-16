# Changelog — ten-out-of-ten upgrade

One line per task, with the verification command that proves it.

- 2026-11-16 · Task 1 — rebuild path: `inventory-existing.mjs`, `00-migration-analyst`, `rebuild-existing-app.md`, questionnaire/route/readiness wiring, Expo fixture. Verified: `node skills/mobile-app-factory/scripts/check-skill.mjs` → PASS 17 checks.
- 2026-11-16 · Task 2 — production starters (Android: Nav Compose/Hilt/Room/DataStore/UiState/adaptive/locales; iOS: TabView+SplitView/AppEnvironment/SwiftData/xcstrings; auth stub, account deletion, settings). Verified: check-skill.mjs PASS (scaffold + file-exists + no placeholders). NOT compiled locally (no JDK/Android SDK, no macOS).
- 2026-11-16 · Task 3 — opt-in modules (billing, push, localization, deeplinks, analytics-crash), `profile.modules` routing, `reconcile-declarations.mjs`, per-locale metadata validation. Verified: check-skill.mjs PASS 18 checks (reconcile exits 1 on undeclared SDK; router enables modules; pseudo-localize self-test). Swift/Kotlin module code NOT compiled locally.
- 2026-11-16 · Task 4 — Expo starter (`assets/expo/`, expo-router, shared theme, EAS), `cross-platform-decision.md`, router keeps explicit stack. Verified locally: scaffolded app `tsc --noEmit` clean and `expo export --platform android` bundles (found+fixed RN 0.88 `absoluteFillObject` removal in Sheet.tsx). CI jobs added: expo-build, modules-android, modules-ios (not yet run on CI). Flutter: reference only.
