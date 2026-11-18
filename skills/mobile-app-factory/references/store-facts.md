---
verified_on: 2026-11-16
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
| Age ratings | **Five tiers — 4+, 9+, 13+, 16+, 18+** — replacing the old 4+/9+/12+/17+ set; unanswered questions risk interruptions on update submissions † | 31 Jan 2026 | https://developer.apple.com/news/?id=ks775ehf |
| EU DSA trader status | Declare **trader status** in App Store Connect; undeclared apps are removed from the EU storefront | 17 Feb 2025 | https://developer.apple.com/news/?id=yfacfeal |
| Digital goods payment | Digital content and features must use **In-App Purchase** (3.1.1), with working restore | standing rule | https://developer.apple.com/app-store/review/guidelines/#business |
| User-generated content | **Filtering, reporting, blocking and published contact info** required (1.2); also applies to AI content | standing rule | https://developer.apple.com/app-store/review/guidelines/#user-generated-content |
| App completeness | No placeholder content, dead links or missing demo account (2.1) | standing rule | https://developer.apple.com/app-store/review/guidelines/#app-completeness |
| Account deletion | In-app account deletion required wherever account creation exists (5.1.1(v)) | standing rule | https://developer.apple.com/app-store/review/guidelines/#privacy |
| Privacy Nutrition Labels | **App Privacy details** (incl. third-party partners' practices) and a privacy policy URL are required in App Store Connect to submit apps and updates; answers can be edited without a new build | standing rule (no effective date on the page) | https://developer.apple.com/app-store/app-privacy-details/ |
| App Tracking Transparency | ATT permission required to **track** (link app data with other companies' data for advertising/measurement, or share with data brokers) or read the IDFA on iOS/iPadOS/tvOS 14.5+; without it the IDFA is zeros. First-party analytics and crash reporting alone do not require it | iOS 14.5 (date not on the page) | https://developer.apple.com/app-store/user-privacy-and-data-use/ |
| EU DMA / alternative distribution (informational) | Notarized iOS apps may ship via authorized alternative marketplaces or the developer's website in the EU; Apple authorization is required; Core Technology Commission 5%; unified EU business terms replace earlier addenda | licence update 18 Aug 2026; unified terms 1 Oct 2026 | https://developer.apple.com/support/dma-and-apps-in-the-eu/ |

## Google Play

| Rule | Value | Effective date | Source |
|---|---|---|---|
| Target API level | New apps and updates must target **Android 16 (API level 36)**; the 1 Nov 2026 extension window has now passed | 31 Aug 2026 | https://support.google.com/googleplay/android-developer/answer/11926878 |
| New personal-account testing | Closed test with **at least 12 testers opted in continuously for 14 days** before production access | Personal accounts created after 13 Nov 2023 | https://support.google.com/googleplay/android-developer/answer/14151465 |
| App format and signing | **Play App Signing** (new apps are enrolled automatically); .aab as the upload format is standard practice, but the source page states no deadline | standing rule | https://support.google.com/googleplay/android-developer/answer/9842756 |
| Data safety | Form is **mandatory** and must match actual SDK and runtime behaviour | standing rule | https://support.google.com/googleplay/android-developer/answer/10787469 |
| Account deletion | **In-app deletion path *and* a web link** where users can request deletion | standing rule | https://support.google.com/googleplay/android-developer/answer/13327111 |
| Content rating | **Content-rating questionnaire** (IARC coalition) completed and kept current as content changes | standing rule | https://support.google.com/googleplay/android-developer/answer/9859655 |
| Sensitive permissions | Location, SMS, media and alarm permissions need a **core-function justification**; new location-button and contacts limits apply to apps targeting API 37+ | standing rule; location button 27 Jan 2027, contacts/Local Network declarations 25 Aug 2027 | https://support.google.com/googleplay/android-developer/answer/9888170 |
| 16 KB page size | Apps targeting Android 15 (API 35)+ must support **16 KB memory page sizes** on 64-bit devices or updates are blocked; Java/Kotlin-only apps are already compatible, native code (NDK, SDKs) must rebuild (AGP 8.5.1+, NDK r28+) | 1 Feb 2027 | https://developer.android.com/guide/practices/page-sizes |
| Data safety + deletion link | Form mandatory for every published app (except internal-test-only, system, private); apps with account creation declare an in-app deletion path **and** a web deletion link in the form | Form: after 20 Jul 2022; deletion questions 7 Dec 2023 (enforcement from 31 May 2024) | https://support.google.com/googleplay/android-developer/answer/13327111 |
| EU DMA / alternative distribution (informational) | Android already allows alternative stores and sideloading; in the EEA Play offers alternative billing and external offers with service fees (fee-tier dates not confirmed from the primary page) | external offers since Mar 2024 | https://developer.android.com/distribute/marketing-tools/alternative-distribution |

## Changes at the 2026-11-16 re-verification

- Play target API row: the 1 Nov 2026 extension has passed.
- Apple age ratings: source says unanswered questions risk "interruptions", not a hard block — wording softened.
- Play signing row: the source does not state an .aab deadline — wording corrected.
- Play content rating: source calls it a rating questionnaire (IARC is the coalition) — wording corrected.
- Play sensitive permissions: added the 27 Jan 2027 and 25 Aug 2027 dates.
- Not confirmable from the primary page: the 1 May 2024 privacy-manifest date, the ATT start date, and the Google DMA fee-tier dates. Rows keep their sources; treat those dates as unverified.
- New rows: 16 KB page size, Data safety + deletion link, Privacy Nutrition Labels, ATT, EU DMA (Apple and Google, informational).

## What the dates cost in calendar time

The tester gate is the one that surprises people: 12 testers for 14 *continuous* days is a minimum
of two weeks of wall-clock time that cannot be compressed, and testers who opt out reset their
clock. Start closed testing on the first usable build, not after polish. Budget **2–4 weeks** for
the gate plus review before you promise a launch date.

## When a row looks wrong

Do not edit the row from memory. Open the source URL, confirm the current value, then change the
value **and** bump `verified_on` to the date you checked. If a source has moved, cite the page that
now carries the rule and note the old URL in the commit message rather than silently dropping it.
