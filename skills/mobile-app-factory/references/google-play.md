# Google Play — Requirements, Policy, and the Testing Gate

Verified against Play Console Help in November 2026. Play policy is enforced by automated scans plus human review; most suspensions come from declarations that don't match app behaviour.

## Contents
1. Account and verification
2. The closed-testing gate
3. Dated technical requirements
4. Store listing metadata
5. App content declarations
6. Data safety
7. Policies that suspend apps
8. Submission flow and timeline
9. Pre-submission checklist

---

## 1. Account and verification

- **US$25 one-time** registration fee.
- **Identity verification**: government ID + address. **Organisation accounts need a D-U-N-S number**; verification can take days to weeks.
- A payments profile is required to publish paid apps or IAP, and to receive payouts.
- New **personal** accounts must pass the closed-testing gate before production access — the exact tester count and duration are in `store-facts.md`. Organisation accounts are exempt from the tester count but still need app setup complete.

---

## 2. The closed-testing gate

Before you can apply for production:

1. Complete **app setup** — every App content declaration and the store listing.
2. Run a **closed test** that meets Google's tester gate — count and duration in `store-facts.md`.
3. Apply for production access and answer the questionnaire: about your closed test, your app, and your production readiness.
4. Wait for Google's decision (often a few days, can be longer).

Internal testing has no gate. Open testing unlocks only after production access. **Start the clock on the first usable build** — this is calendar time you cannot compress, and the most common launch-date killer.

Recruit testers who match the future audience; Google asks what feedback you received and what you changed.

---

## 3. Dated technical requirements

`store-facts.md` is the single source for the target API level, the tester gate and the signing
rules, each with its official source and a `verified_on` stamp. Read it before every submission and
re-verify when the stamp is older than `review_every_days`.

Requirements that never change:

- **64-bit native libraries** — required.
- **Privacy policy URL** — required for any app that collects data.
- **App access declaration** — review credentials mandatory if anything is gated.

Wear OS / TV / Automotive / XR have their own, lower API floors — see Play Console Help if shipping those form factors.

---

## 4. Store listing metadata

| Field | Limit / spec |
|---|---|
| App name | **30 characters** |
| Short description | **80 characters** |
| Full description | **4,000 characters** |
| App icon | **512×512, 32-bit PNG with alpha, ≤ 1 MB** |
| Feature graphic | **1024×500, JPEG or 24-bit PNG, no alpha** — required |
| Phone screenshots | **2–8**, 320–3840 px, aspect 16:9 to 9:16 |
| 7" / 10" tablet screenshots | Required if tablet support declared |
| Promo video | YouTube URL, optional |
| Developer name, contact email, website | Required |
| Privacy policy URL | Required |

**Metadata policy** — the automated checks that catch people:
- No emojis, emoticons, kaomoji, or repeated special characters in name/icon/developer name.
- No ranking, price, award, or performance claims ("#1", "Best", "App of the Year", "Million downloads").
- No call-to-action in the short description ("Download now", "Install").
- No misleading icon badges (fake notification dots, download arrows, "new" tags).
- No keyword stuffing or competitor names.
- Screenshots and video must show the actual app experience.

Localise the listing for your top 3 markets; the short description is indexed and appears in search.

---

## 5. App content declarations

All must be complete and truthful before review:

1. Privacy policy
2. Ads (does the app contain ads)
3. App access (credentials for gated features)
4. Content rating (IARC questionnaire — produces regional ratings)
5. Target audience & content (age groups; "Designed for Families" if under-13 audience)
6. News app declaration
7. Data safety
8. Government app declaration
9. Financial features declaration
10. Health apps declaration
11. Advertising ID declaration (if used)
12. COVID-19 tracing (legacy, still listed)

---

## 6. Data safety

Declare, per data type: collected? shared? optional? purpose? encrypted in transit? deletable?

- The form must match **every SDK** in the build, including analytics, ads, crash reporting, and payments. A mismatch is a policy violation regardless of intent.
- If accounts exist, provide the account-deletion route (in-app + URL) and the data-deletion answers.
- "No data collected" is almost never true for a modern app — if you have analytics, you collect device IDs.

---

## 7. Policies that suspend apps

| Area | Requirement |
|---|---|
| **User Data** | Disclose collection, obtain consent, minimise, allow deletion, never sell sensitive data |
| **Permissions & APIs** | SMS/Call Log, All Files Access, background location, exact alarms need declaration + core-function justification; use the photo picker instead of broad media permissions |
| **Deceptive Behaviour** | No misleading claims, fake functionality, hidden features, impersonation |
| **Spam & Minimum Functionality** | No webview-only apps, copycats, or broken/empty apps |
| **Monetisation & Ads** | No unexpected full-screen ads, no ads on exit, ad behaviour disclosed |
| **Play Billing** | Digital goods via Google Play Billing (user-choice billing only in eligible regions) |
| **Families** | No behavioural ads to children, certified ad SDKs, suitable content |
| **SDK policy** | You are responsible for every third-party SDK's data behaviour |
| **Android vitals** | Crash/ANR thresholds trigger warnings and can reduce distribution |

**Common suspension causes**
1. Data safety form contradicts SDK behaviour.
2. Sensitive permission used for a non-core function (e.g. SMS for OTP autofill).
3. Account creation with no deletion path.
4. Listing claims not present in the app.
5. Target API level below the current requirement.

---

## 8. Submission flow and timeline

1. Create app → complete app setup (declarations + listing).
2. Upload AAB → internal testing → install on a real device.
3. Closed test with 12+ testers for 14 continuous days.
4. Apply for production access → answer the questionnaire.
5. Production review: **typically 3–7 days** for a new app, longer for new accounts.
6. Staged rollout 5% → 20% → 50% → 100%, watching vitals.
7. Policy appeal if rejected — reply with evidence, not a resubmission.

Total calendar time from first build to public launch: **3–5 weeks** for a new personal account. Plan the launch around the gate, not the code.

---

## 9. Pre-submission checklist

- [ ] Target API level, AAB and Play App Signing match `store-facts.md`
- [ ] App content declarations all green
- [ ] Data safety matches installed SDKs exactly
- [ ] Content rating completed
- [ ] Privacy policy URL live; account deletion in-app + web
- [ ] App access credentials supplied
- [ ] Icon 512², feature graphic 1024×500, 2–8 screenshots
- [ ] Name ≤ 30, short description ≤ 80, full description ≤ 4,000, no policy-banned claims
- [ ] Sensitive-permission declarations filed where relevant
- [ ] Closed test: tester gate in `store-facts.md` satisfied
- [ ] Pre-launch report reviewed (crashes, ANRs, accessibility)
- [ ] Staged rollout plan agreed
