# iOS App Store — Requirements and Review

Verified against Apple's own pages in November 2026. Apple changes these roughly twice a year; re-check `developer.apple.com/news/upcoming-requirements/` before a launch.

## Contents
1. Account and programme
2. Dated technical requirements
3. App Store Connect metadata
4. Assets
5. Review guidelines that reject people
6. Privacy, tracking, and manifests
7. Submission flow and timeline
8. Pre-submission checklist

---

## 1. Account and programme

- **Apple Developer Program — US$99/year.** Individual or organisation. Organisations need a **D-U-N-S number**; verification can take days.
- Enrol → **App Store Connect** → create the app record with the exact bundle ID from Xcode.
- **Agreements, Tax, and Banking** must be complete before paid apps or IAP go live.
- Builds upload via Xcode, Transporter, `xcrun altool`, EAS, or fastlane. Beta through **TestFlight**: internal (up to 100 testers, no review) and external (up to 10,000, short beta review).

---

## 2. Dated technical requirements

| Requirement | Deadline / status |
|---|---|
| Built with **Xcode 26 or later**, SDK for **iOS 26** | Required since **28 Apr 2026** |
| Minimum deployment target **iOS 13+** | Required since **9 Sep 2026** |
| **Privacy manifest** `PrivacyInfo.xcprivacy` + third-party SDK signatures | Since **1 May 2024** |
| **New age-rating system** (4+, 9+, 13+, 16+, 18+) and updated questionnaire | Live since **31 Jan 2026**; unanswered = blocked updates |
| **DSA trader status** for EU distribution | Since **17 Feb 2025**; absent = removed from EU storefront |
| Export compliance (encryption) declaration | Every submission |
| App Tracking Transparency prompt before IDFA/cross-app tracking | Required |

If a requirement is missed, the build is rejected at upload (not review) — check the "Upcoming Requirements" page first.

---

## 3. App Store Connect metadata

**App-level (shared across platforms)**

| Field | Notes |
|---|---|
| Name | 30 characters, must match the app's actual name |
| Subtitle | 30 characters, value proposition |
| Age Rating | New 5-tier questionnaire |
| Bundle ID | Immutable after first upload |
| SKU | Internal, unique |
| Content Rights | Do you own/have licence for all content |
| License Agreement | Optional custom EULA |
| Primary Language | Required |
| Primary / Secondary Category | Choose honestly; miscategorisation is a rejection |
| DSA Status | Required for EU |
| Regulated Medical Device Status | If applicable |
| Korea / China / Vietnam availability | Conditional declarations |

**Version-level**

| Field | Limit |
|---|---|
| Support URL | Required, must resolve |
| Marketing URL | Optional |
| Version number | Required |
| Copyright | Required |
| App Review information | Contact + **demo account credentials** |
| Version release | Manual / automatic / phased (7 days) |
| What's New | 4,000 characters |

**Localisable marketing copy**

| Field | Limit |
|---|---|
| Promotional text | 170 (editable without review) |
| Keywords | 100, comma-separated, no spaces after commas, no competitor brands |
| Description | 4,000 |
| What's New | 4,000 |

**App privacy**: Privacy Policy URL (mandatory), Privacy Choices URL (if applicable), data types collected / linked to identity / used for tracking.

---

## 4. Assets

| Asset | Spec |
|---|---|
| App icon | **1024×1024 PNG, no alpha**, single-size asset catalog icon |
| iPhone screenshots | **6.9-inch required** — 1320×2868 portrait (2868×1320 landscape) |
| iPad screenshots | **13-inch required if you ship iPad** — 2064×2752 |
| Screenshot count | 3–10 per size, PNG/JPG, no device frames that misrepresent the UI |
| App preview | 15–30s, up to 3 per localisation, `.mov`/`.m4v`/`.mp4` |
| In-app events | Separate media specs; optional |

Screenshots must show the **shipped build**. Composite marketing images are allowed only if the UI within them is real.

---

## 5. Review guidelines that reject people

| Guideline | What gets rejected |
|---|---|
| **2.1 App Completeness** | Crashes, placeholder copy, dead links, missing demo account, backend offline |
| **2.3 Accurate Metadata** | Screenshots/description that don't match; hidden features; keyword stuffing; misleading icon |
| **2.3.3** | Screenshots that misrepresent functionality |
| **3.1.1 In-App Purchase** | Unlocking digital features via Stripe/PayPal/licence keys; no restore purchases |
| **3.1.2 Subscriptions** | Unclear pricing, no terms link, no cancellation path |
| **4.2 Minimum Functionality** | Website wrapper, thin idea, "not app-like" |
| **4.3 Spam** | Duplicate/template apps; saturated categories are scrutinised |
| **4.8 Login Services** | Third-party login without an equivalent privacy-preserving option (Sign in with Apple) |
| **1.2 User-Generated Content** | No filtering, reporting, blocking, or contact info (also applies to AI content apps) |
| **1.4.1 / 5.1.3** | Health/medical claims without evidence; kids' apps with tracking or behavioural ads |
| **5.1.1 Privacy** | No privacy policy link in metadata **and** in-app; vague data-use statements |
| **5.1.2 Data Use** | Tracking without ATT consent; background location without justification; contact upload without consent |
| **2.5.1 Software Requirements** | Private APIs, downloaded executable code (interpreted JS under the rules is fine) |
| **2.5.2 / 3.2.2** | Encouraging users to bypass platform rules or payments |

**Common real-world rejections**
1. Demo account not provided (2.1) — one line in the review notes saves a week.
2. Screenshots show features not in the build (2.3).
3. Paywall without restore + terms links (3.1.2).
4. "Sign in with Apple" missing when Google login exists (4.8).
5. Privacy manifest missing for an SDK that touches required-reason APIs (upload-time rejection).
6. Age-rating questions unanswered after the Jan 2026 migration.

---

## 6. Privacy, tracking, and manifests

- `PrivacyInfo.xcprivacy` declares: data collected, tracking domains, and **required-reason APIs** (file timestamp, user defaults, disk space, active keyboard). Missing declarations surface as an upload warning, then a rejection.
- Third-party SDKs on Apple's list must ship their own manifest **and signature**.
- **ATT**: prompt before any cross-app tracking. If you never track, do not add the prompt — but declare "no tracking" in App Privacy.
- Permission strings must state the concrete user benefit: "Camera is used to scan receipts", not "needs camera".
- Account deletion must be available in-app if account creation exists (5.1.1(v)).

---

## 7. Submission flow and timeline

1. Archive and upload (TestFlight appears in minutes to hours).
2. Complete App Privacy, age rating, DSA status, export compliance.
3. Attach the build to a version, add review notes + demo credentials.
4. Submit → **review usually 24–72h**; weekends are slower.
5. Rejection → reply in Resolution Centre with evidence; do not resubmit unchanged.
6. Approval → manual release, automatic, or phased over 7 days.

Plan for **one to three review cycles**. The most common cause of a second cycle is a metadata/build mismatch, not code quality.

---

## 8. Pre-submission checklist

- [ ] Builds with Xcode 26 / iOS 26 SDK; deployment target ≥ iOS 13
- [ ] `PrivacyInfo.xcprivacy` + SDK signatures; required-reason APIs declared
- [ ] ATT implemented only if tracking; App Privacy answers match SDKs
- [ ] Age rating questionnaire completed in the new system
- [ ] DSA trader status submitted (EU)
- [ ] Icon 1024×1024 no alpha; 6.9" screenshots (+13" iPad if applicable)
- [ ] Description, keywords, promo text within limits; no competitor names
- [ ] Demo account + review notes; backend live and seeded
- [ ] IAP products approved, restore purchases working, terms/privacy links
- [ ] Account deletion in-app
- [ ] Crash-free on a physical device; no placeholder copy
- [ ] Export compliance answered
