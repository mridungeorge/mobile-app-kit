# Release

## Build
- Android: `./gradlew :app:assembleRelease` with the upload keystore from CI secrets.
- iOS: archive with the App Store distribution certificate; export via App Store Connect API key.

## Tracks
1. Internal: signed AAB + TestFlight build, smoke the offline path and check-in.
2. Closed: 12 testers, 14 continuous days (Play gate for new personal accounts).
3. Production: staged rollout 10% → 50% → 100%, watch crash-free sessions for 48h per step.

## Rollback
Keep the previous AAB/binary; halt the staged rollout in Play Console and remove the TestFlight
build. No remote kill switch in v1, so a data migration must be forward-only.

## Submission steps
- Fill data safety and privacy manifest from `05-compliance.md`.
- Upload six phone screenshots per platform at the sizes in `metadata/`.
- Demo account not required (no login gate); note it in App Review.
- Provide the web account-deletion URL.

## Human actions
Signing keys, store accounts, TestFlight/closed track, phased rollout.
