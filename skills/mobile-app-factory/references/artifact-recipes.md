# Artifact recipes

The quality failures of 2026-11-18 were not knowledge failures. The agent knew the answer and
typed it into the chat. The next agent, the reviewer and the grader read `.mobile/`, so an answer
that exists only in the transcript scores zero.

**Rule: every request below writes the named file, then the reply is a short summary plus the
path.** "What do I need for review?" is a pipeline request, not a conversation. If the project has
no `.mobile/` yet, create it and write `00-profile.json` first (`route-idea.mjs --fast "<idea>"`).

The strings in the "must contain" column are what `scripts/lint-artifacts.mjs` checks. They are
case-insensitive unless noted. Include them in prose or a table; the grader is a regex, not a
reader.

Every file also carries its **base facts**, because the lint checks the file, not the question:

- `05-compliance.md`: privacy manifest / PrivacyInfo, Play data safety, and `targetSdk`/target API.
- `03-build-log.md`: the real screens, and the loading / empty / offline / error states.
- `07-review.md`: a verdict word (`PASS`, `FAIL` or `blocker`).

A file written for one question that omits the base facts fails the lint even when the specific
answer is right.

## The table

| If the ask is… | Write | Must contain |
|---|---|---|
| "Is it ready for the App Store and Play?" | `.mobile/05-compliance.md` **and** `.mobile/07-review.md` | `privacy manifest`, `data safety`, `targetSdk` (or `target API`); review: `PASS` or `blocker` with an owner |
| "Use Rune for this screen" | `.mobile/02-design.md` | `4/8/12/16/24`, `hairline` (or `separator`), one of `settle`/`snap`/`glide` |
| "Test on a low-end device / 200% text / Reduce Motion / permission denied" | `.mobile/07-review.md` | literally `200%`, `Reduce Motion`, and `location` or `permission` |
| "What must stay the same when we rebuild?" | `.mobile/00-migration-plan.md` | `bundle id` (or `package name`), `signing` (or `keystore`), `entitlement` |
| Subscription, IAP, "add the purchase flow" | profile `"billing"`, `.mobile/03-build-log.md`, `.mobile/05-compliance.md` | `restore` purchases, `purchase history` |
| "Use RevenueCat" | `.mobile/03-build-log.md`, `.mobile/05-compliance.md` | `RevenueCat` in build log, `RevenueCat` or `third-party SDK` in compliance |
| Push notifications | profile `"push"`, `.mobile/03-build-log.md`, `.mobile/05-compliance.md` | `priming` / `in context` / `not at launch`; `channel`; `POST_NOTIFICATIONS`; `device id` or `notification` |
| Accounts, email sign-in, "what do I need for review?" | `.mobile/05-compliance.md` | `account deletion`, `5.1.1`, `web` or `url` |
| German/Arabic UI | `.mobile/03-build-log.md`, `.mobile/05-compliance.md` | `xcstrings` or `strings.xml`; `RTL`; per-locale metadata |
| Localised store listing | `.mobile/metadata/` — the iOS and Android JSON | `"locales"` with one entry per language |
| Added an SDK (Sentry, RevenueCat, …) | `.mobile/05-compliance.md` | `reconcile` or `PrivacyInfo`; `crash`; `data safety` |

## Snippets that satisfy the checks

### Store readiness — `05-compliance.md`

```markdown
# Store compliance

| Check | iOS | Android |
|---|---|---|
| Privacy manifest / data safety | PrivacyInfo.xcprivacy lists NSPrivacyCollectedDataTypes | data safety form matches dependencies |
| Target | iOS 18 SDK | targetSdk 36, target API 36 |
| Account deletion | in-app path + web URL | in-app path + web URL |
| Billing | StoreKit 2 restore purchases | Play Billing, purchase history |
```

Then `07-review.md`:

```markdown
# Review
Verdict: blocker
- blocker — privacy manifest missing `NSPrivacyAccessedAPICategoryFileTimestamp` — owner: store-compliance
```

A bare "looks good" is not a verdict. Name the blocker, or write `PASS` and list the evidence.

### Design drift — `02-design.md`

Rune's scale is written exactly `4/8/12/16/24`. Say it, then map it:

```markdown
Spacing: 4/8/12/16/24 (4 between label and value, 8 inside a row, 12 row gap,
16 screen margin, 24 section break). Borders are a 1px hairline, never a shadow.
Motion: rows settle in 300ms, toggles snap in 250ms.
```

### Adaptive UI — `07-review.md`

```markdown
# Review
Verdict: PASS — accessibility matrix below; no new blockers.
- Pixel 4a, 200% text: labels wrap, no clipping; row height follows content.
- Reduce Motion on: reveal becomes a 150ms fade; no parallax.
- Location denied: the screen renders with a permission explainer and a manual
  postcode fallback; it does not block the rest of the app.
```

### Rebuild continuity — `00-migration-plan.md`

```markdown
# Migration plan
- Identifiers: keep the existing bundle id (iOS) and package name / applicationId (Android).
- Signing: reuse the App Store distribution certificate and the Play upload key
  (keystore); do not rotate or re-key the listing.
- Subscriber entitlements: existing StoreKit/Play purchases must resolve in the new app;
  restore purchases on first launch and keep the same product ids.
```

### Billing — profile + build log + compliance

`00-profile.json` needs `"modules"` to include `"billing"` (the router writes an array). Build log:
`PurchaseService` implementation per platform, `restore purchases` wired to a visible button, plus
the base facts (screens, loading/empty/offline/error). Compliance: App Review requires restore;
declare `purchase history` in the privacy manifest and data safety form, and keep the base facts.

RevenueCat: name it in `03-build-log.md` (`RevenueCat Purchases SDK v5…`), with the base facts, and
in `05-compliance.md` as a third-party SDK with the data it collects (`purchase history`,
`device id`), alongside the base facts.

### Push — priming, channels, permission

Build log must say the permission is asked **in context / priming**, not at launch:
"the first booking-update screen shows a priming sheet, then the OS prompt". Android 13+:
`POST_NOTIFICATIONS` in the manifest, requested at the same moment. Create at least one
`NotificationChannel` per category (booking updates, marketing). Compliance: `device id` and
`notification` data declared, plus the base facts, in the same file as the build log.

### Account deletion — `05-compliance.md`

```markdown
Account deletion: Settings → Account → Delete account, plus a public web URL
(https://example.com/delete-account) that works without installing the app.
Apple guideline 5.1.1(v) requires in-app deletion; Play requires the web link in
the data safety form. Keep the privacy manifest / data safety / target API base facts here too.
```

### Metadata and localisation

The iOS and Android metadata JSON files both carry `"locales": { "de": {...}, "fr": {...} }`.
Character limits and asset dimensions: `metadata-and-assets.md`; validate with
`scripts/validate-metadata.mjs`.

## Where the answer goes when several files apply

Write every file the ask touches, in pipeline order (profile → build log → compliance → review).
One file with a heading per phase is not a substitute: the checks look for the phase file by name.

## Deterministic check

`node scripts/lint-artifacts.mjs --dir .mobile` applies this table to whatever exists and exits 1
when a present file omits a required string. (A missing phase file is `readiness-report.mjs`'s
job.) It is wired into `readiness-report.mjs --strict`, so a prose-only answer fails the readiness
gate without an LLM in the loop.
