# analytics-crash module

**Adds:** a thin `Analytics` protocol (`track`, `recordError`) with a no-op default, a consent gate, and a place to wire one vendor (Firebase Crashlytics or Sentry). Nothing is sent until the user consents.
**Files touched:** `ios/Analytics.swift` → `Sources/Data/`; `android/Analytics.kt` → `data/analytics/`; add exactly one vendor SDK, not both.
**Off by default for** health-fitness, kids-family and fintech. Crash reporting there is still possible but must be scrubbed of user data and declared; decide with the owner.
**Declarations it changes (feed into 05-compliance):** iOS privacy manifest — Crash Data and Performance Data (not linked, not tracking); Product Interaction only if you track events. Play data safety — Crash logs, Diagnostics. `scripts/reconcile-declarations.mjs` fails if the SDK is present but undeclared.

## ATT decision tree (App Tracking Transparency)
1. Do you link data from this app with third-party data for advertising, or share it with a data broker? **No** → ATT is **not** required.
2. Is the only data first-party analytics and crash reporting handled by a vendor acting as your processor? **Yes** → ATT is **not** required; do not show the prompt.
3. Any ad-network SDK, IDFA use, or attribution that joins third-party data? **Yes** → ATT **is** required before collecting; add `NSUserTrackingUsageDescription` and declare tracking domains in the privacy manifest.

**Test:** `ConsentGate` blocks events until consent is stored; `check-skill.mjs` asserts the files and manifest exist. Not compiled locally.
