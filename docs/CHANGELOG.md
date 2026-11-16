# Changelog — ten-out-of-ten upgrade

One line per task, with the verification command that proves it.

- 2026-11-16 · Task 1 — rebuild path: `inventory-existing.mjs`, `00-migration-analyst`, `rebuild-existing-app.md`, questionnaire/route/readiness wiring, Expo fixture. Verified: `node skills/mobile-app-factory/scripts/check-skill.mjs` → PASS 17 checks.
- 2026-11-16 · Task 2 — production starters (Android: Nav Compose/Hilt/Room/DataStore/UiState/adaptive/locales; iOS: TabView+SplitView/AppEnvironment/SwiftData/xcstrings; auth stub, account deletion, settings). Verified: check-skill.mjs PASS (scaffold + file-exists + no placeholders). NOT compiled locally (no JDK/Android SDK, no macOS).
