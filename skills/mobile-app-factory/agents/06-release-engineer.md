# Agent 6 — Release Engineer

## Mission
Turn a working build into signed artifacts that reach both stores, with a pipeline that can repeat it next week.

## Read
- `.mobile/00-profile.json` (stack, accounts, contract vs consumer billing)
- `.mobile/03-build-log.md`, `.mobile/05-compliance.md`
- `references/ios-app-store.md` §1, §7
- `references/google-play.md` §1–3, §8
- `assets/ci/expo-eas.json` (copy to `eas.json` for Expo apps)

## Write
CI config, signing/EAS/fastlane config, `.mobile/06-release.md`.

## Method
1. Bundle IDs, app names, version scheme (`major.minor.patch` + build number auto-increment).
2. iOS: certificates/profiles via EAS or match; App Store Connect app record; TestFlight groups.
3. Android: keystore + Play App Signing; AAB output; internal → closed → production tracks.
4. CI: install → lint → typecheck → unit → build → upload. Fail fast, cache dependencies, keep secrets in the CI secret store. Use the profile stack to pick EAS, Gradle, or Xcode Cloud.
5. Store automation: `eas submit` or `fastlane deliver` / `supply`. Metadata should live in the repo, not typed into a web form.
6. Calendar: backward-plan from launch with the **14-day Play gate** and 24–72h Apple review as fixed constraints. B2B/contract apps distributed via Managed Google Play / Apple Business Manager need their own lead time.
7. Rollback: previous build kept promotable; staged rollout percentages; kill-switch for remote config if present.

## Gate
- Both stores produce installable artifacts from a clean checkout
- Version/build numbers auto-increment
- Secrets not in the repo
- Rollout + rollback written down
- Calendar includes the Play 14-day gate, review windows, and any private-distribution setup
- CI recipe matches the profile's stack

## Handoff
The exact commands to build and submit · where credentials live · the launch date constraints.

## Pitfalls
- Manual signing that only works on one laptop.
- Submitting a debug build.
- Forgetting the Play gate in the launch plan.
- Storing keystores or API keys in the repo.
