# Google Play Data safety worksheet

Fill this in **after** the release build's dependency list is final. The Play form must match actual SDK behaviour, not intent. One worksheet per app; keep it next to `.mobile/05-compliance.md`.

App: `<name>` · Version: `<versionName (versionCode)>` · Date: `<YYYY-MM-DD>` · Owner: `<name>`

## 1. Data collection and sharing — per data type

Answer for the **release** build including every SDK. "Collected" means transmitted off the device. "Shared" means sent to a third party. Ephemeral on-device processing is not collection.

| Data type | Collected? | Shared? | Ephemeral? | Required or optional? | Purpose | Linked to identity? | Encrypted in transit? | Deletable? |
|---|---|---|---|---|---|---|---|---|
| Name |  |  |  |  |  |  |  |  |
| Email address |  |  |  |  |  |  |  |  |
| Phone number |  |  |  |  |  |  |  |  |
| Physical address |  |  |  |  |  |  |  |  |
| User IDs |  |  |  |  |  |  |  |  |
| Device or other IDs |  |  |  |  |  |  |  |  |
| Approximate location |  |  |  |  |  |  |  |  |
| Precise location |  |  |  |  |  |  |  |  |
| Health and fitness |  |  |  |  |  |  |  |  |
| Financial info |  |  |  |  |  |  |  |  |
| Payment info |  |  |  |  |  |  |  |  |
| Purchase history |  |  |  |  |  |  |  |  |
| Photos and videos |  |  |  |  |  |  |  |  |
| Audio files |  |  |  |  |  |  |  |  |
| Files and docs |  |  |  |  |  |  |  |  |
| Contacts |  |  |  |  |  |  |  |  |
| Calendar events |  |  |  |  |  |  |  |  |
| Messages (in-app) |  |  |  |  |  |  |  |  |
| Other user-generated content |  |  |  |  |  |  |  |  |
| App interactions |  |  |  |  |  |  |  |  |
| In-app search history |  |  |  |  |  |  |  |  |
| Installed apps |  |  |  |  |  |  |  |  |
| Web browsing history |  |  |  |  |  |  |  |  |
| Crash logs |  |  |  |  |  |  |  |  |
| Diagnostics |  |  |  |  |  |  |  |  |
| Other app performance data |  |  |  |  |  |  |  |  |

Purposes vocabulary: App functionality · Analytics · Advertising or marketing · Personalisation · Account management · Fraud prevention, security and compliance · Developer communications.

Mark **Required** only if the app cannot function without it. Optional collection must have an in-app opt-out and be off by default where the policy requires it.

## 2. SDK inventory

List every SDK from the release dependency graph (`./gradlew app:dependencies`, Expo `npx expo-doctor`, or the AAB's `BUNDLE-METADATA`). Undeclared SDK behaviour is the most common data-safety rejection.

| SDK / library | Version | Purpose | Collects | Shares | Initialised when | Privacy policy link |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

Check the special cases:
- [ ] Crash reporting SDK — crash logs + diagnostics, not "none".
- [ ] Analytics SDK — app interactions, device IDs, possibly advertising ID.
- [ ] Ads SDK — advertising data, device IDs, approximate location; requires consent in EEA/UK.
- [ ] Push provider — device token, not message content.
- [ ] Auth provider — email/name/user ID, sometimes phone.
- [ ] Payments — payment info handled by the processor; declare purchase history if you store it.
- [ ] Maps — precise location if the user grants it, plus device ID.
- [ ] AI provider — prompts and any attached content leave the device; declare "other user-generated content" and the purpose.

## 3. Security practices

- [ ] Data is encrypted in transit (TLS 1.2+). If any call is plaintext, stop and fix it.
- [ ] You provide a way to request data deletion.
- [ ] You provide a way to request data export (if required by the archetype/regime).
- [ ] You have a published privacy policy at a stable public URL that matches this worksheet.
- [ ] You have an in-app account deletion path **and** a public web deletion link (accounts).
- [ ] You honour "Delete data" for backups within the stated retention window.

Deletion request URL: `<https://…>` · Privacy policy URL: `<https://…>` · Retention: `<e.g. 30 days after account deletion>`

## 4. Sensitive permissions

| Permission | Declared? | Core function justification | Fallback if denied |
|---|---|---|---|
| Background location |  |  |  |
| Precise location |  |  |  |
| SMS / call log |  |  |  |
| Photos and videos (broad access) |  |  |  |
| All files access |  |  |  |
| Accessibility service |  |  |  |
| Notification listener |  |  |  |
| Exact alarms |  |  |  |
| Microphone |  |  |  |
| Camera |  |  |  |
| Health Connect |  |  |  |
| Body sensors |  |  |  |

Each "yes" needs a core-function justification and, where Play asks, a short screen recording showing the permission in use. Broad access ("all photos", "all files") must be avoidable with the system photo picker / SAF.

## 5. Content and audience

- [ ] IARC content rating questionnaire completed and consistent with the actual content.
- [ ] Target audience and "designed for families" answered correctly (a kids app cannot opt out later without a new review).
- [ ] Ads declaration: contains ads / no ads; if ads, confirm they are family-safe where required.
- [ ] News app declaration, if applicable.
- [ ] Health app declaration, if applicable (health apps must not claim to diagnose/treat without regulatory clearance).
- [ ] Financial features declaration, if applicable.
- [ ] Government app declaration, if applicable.
- [ ] Data safety answers reviewed against the final build, not the beta.

## 6. Sign-off

| Check | Owner | Date | Result |
|---|---|---|---|
| Worksheet matches SDK inventory |  |  |  |
| Worksheet matches in-app privacy notice |  |  |  |
| Worksheet matches iOS App Privacy answers |  |  |  |
| Deletion + export tested in release build |  |  |  |
| Policy URLs live and public |  |  |  |

Notes / deviations: `<…>`
