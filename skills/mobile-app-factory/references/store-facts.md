---
verified_on: 2026-11-13
review_every_days: 90
---

# Store facts — dated, sourced, self-expiring

Every hard, checkable store rule lives here and nowhere else. `ios-app-store.md` and
`google-play.md` cover the process, the metadata fields and the review guidelines; they link back
to this file instead of repeating a date or a number, so there is one place to update and one place
to check.

**How to use it.** Read this before writing metadata, privacy manifests or data-safety answers.
If `verified_on` is older than `review_every_days`, re-verify every row with web search against the
official source before relying on it, and tell the user which rows changed. `scripts/check-skill.mjs`
warns when the file is stale and errors when a row has no source URL.

`†` marks a date that comes from the developer-facing migration deadline rather than the rule's own
publication page.

## Apple App Store

| Rule | Value | Effective date | Source |
|---|---|---|---|
| Build toolchain | Apps uploaded to App Store Connect must be built with **Xcode 26 or later** using the **iOS 26 SDK** | 28 Apr 2026 | https://developer.apple.com/news/upcoming-requirements/?id=04282026a |
| Minimum deployment target | iOS and iPadOS apps must target **iOS 13 or later** | 9 Sep 2026 | https://developer.apple.com/news/upcoming-requirements/?id=0992026a |
| Privacy manifest | **`PrivacyInfo.xcprivacy`** required, plus **signatures for listed third-party SDKs** | 1 May 2024 | https://developer.apple.com/support/third-party-SDK-requirements/ |
| Age ratings | **Five tiers — 4+, 9+, 13+, 16+, 18+** — replacing the old 4+/9+/12+/17+ set; unanswered questions block updates † | 31 Jan 2026 | https://developer.apple.com/news/?id=ks775ehf |
| EU DSA trader status | Declare **trader status** in App Store Connect; undeclared apps are removed from the EU storefront | 17 Feb 2025 | https://developer.apple.com/news/?id=yfacfeal |
| Digital goods payment | Digital content and features must use **In-App Purchase** (3.1.1), with working restore | standing rule | https://developer.apple.com/app-store/review/guidelines/#business |
| User-generated content | **Filtering, reporting, blocking and published contact info** required (1.2); also applies to AI content | standing rule | https://developer.apple.com/app-store/review/guidelines/#user-generated-content |
| App completeness | No placeholder content, dead links or missing demo account (2.1) | standing rule | https://developer.apple.com/app-store/review/guidelines/#app-completeness |
| Account deletion | In-app account deletion required wherever account creation exists (5.1.1(v)) | standing rule | https://developer.apple.com/app-store/review/guidelines/#privacy |

## Google Play

| Rule | Value | Effective date | Source |
|---|---|---|---|
| Target API level | New apps and updates must target **Android 16 (API level 36)**; extension to 1 Nov 2026 available in Play Console | 31 Aug 2026 | https://support.google.com/googleplay/android-developer/answer/11926878 |
| New personal-account testing | Closed test with **at least 12 testers opted in continuously for 14 days** before production access | Personal accounts created after 13 Nov 2023 | https://support.google.com/googleplay/android-developer/answer/14151465 |
| App format and signing | **Android App Bundle (.aab)** plus **Play App Signing** | standing rule | https://support.google.com/googleplay/android-developer/answer/9842756 |
| Data safety | Form is **mandatory** and must match actual SDK and runtime behaviour | standing rule | https://support.google.com/googleplay/android-developer/answer/10787469 |
| Account deletion | **In-app deletion path *and* a web link** where users can request deletion | standing rule | https://support.google.com/googleplay/android-developer/answer/13327111 |
| Content rating | **IARC questionnaire** completed and kept current as content changes | standing rule | https://support.google.com/googleplay/android-developer/answer/9859655 |
| Sensitive permissions | Location, SMS, media and alarm permissions need a **core-function justification** | standing rule | https://support.google.com/googleplay/android-developer/answer/9888170 |

## What the dates cost in calendar time

The tester gate is the one that surprises people: 12 testers for 14 *continuous* days is a minimum
of two weeks of wall-clock time that cannot be compressed, and testers who opt out reset their
clock. Start closed testing on the first usable build, not after polish. Budget **2–4 weeks** for
the gate plus review before you promise a launch date.

## When a row looks wrong

Do not edit the row from memory. Open the source URL, confirm the current value, then change the
value **and** bump `verified_on` to the date you checked. If a source has moved, cite the page that
now carries the rule and note the old URL in the commit message rather than silently dropping it.
