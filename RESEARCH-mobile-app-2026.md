# Build & Ship a Mobile App on iOS + Google Play — Repo & Requirements Research

**Research date:** 10 November 2026
**Method:** GitHub REST API (repo metadata, star counts, last push), plus Apple Developer / App Store Connect help and Google Play Console policy pages fetched live.
**Note:** star counts are a snapshot, not a quality score. Store rules change ~twice a year — the dated requirements below were verified live and are the ones that will bite you.

---

## 1. TL;DR — what to pick

| Your situation | Stack | Why |
|---|---|---|
| Web/JS team, fastest path to both stores | **Expo (React Native)** | One TypeScript codebase, EAS builds/submits both stores, biggest UI-kit ecosystem |
| Design-heavy / custom pixel-perfect UI | **Flutter** | Single rendering engine, identical pixels on both platforms, strong design tooling |
| Existing Android/Kotlin team | **Kotlin Multiplatform + Compose Multiplatform** | Share business logic *and* UI, native performance, incremental migration |
| Premium consumer app, budget for two teams | **SwiftUI + Jetpack Compose** | Best platform feel, full access to new OS APIs day one, 2× cost |
| .NET shop | **.NET MAUI** | C#/XAML shared UI, mature tooling |
| Existing web app, want an app shell fast | **Ionic + Capacitor** | Reuse web code, native shell, store-submittable |

**My recommendation for a new product in 2026:** Expo + React Native, with `react-native-reusables` (shadcn-style) or Tamagui for UI, EAS for build/submit, and fastlane-style metadata managed in-repo. It is the only stack where "build → screenshot → metadata → submit to both stores" is a single automated pipeline.

---

## 2. Cross-platform frameworks (the actual engines)

| Repo | ⭐ | Lang | Notes |
|---|---|---|---|
| [flutter/flutter](https://github.com/flutter/flutter) | 181.1k | Dart | Own renderer (Impeller), pixel-identical iOS/Android, best-in-class for custom design |
| [react/react-native](https://github.com/react/react-native) | 126.9k | C++/TS | Native components, huge ecosystem; repo moved from `facebook/` to `react/` |
| [expo/expo](https://github.com/expo/expo) | 53.4k | TS | RN + managed native config, EAS Build/Submit/Update, OTA updates |
| [ionic-team/ionic-framework](https://github.com/ionic-team/ionic-framework) | 52.7k | TS | Web-component UI, native-feeling, Angular/React/Vue |
| [NativeScript/NativeScript](https://github.com/NativeScript/NativeScript) | 25.7k | TS | Direct native API access, no bridge |
| [dotnet/maui](https://github.com/dotnet/maui) | 23.3k | C# | Microsoft's Xamarin successor |
| [JetBrains/compose-multiplatform](https://github.com/JetBrains/compose-multiplatform) | 19.5k | Kotlin | Shared Compose UI for iOS/Android/desktop/web |
| [ionic-team/capacitor](https://github.com/ionic-team/capacitor) | 17.1k | TS | Native runtime for any web app |

---

## 3. UI kits & design systems (the "design + code UI" part)

### React Native / Expo
| Repo | ⭐ | What it gives you |
|---|---|---|
| [GeekyAnts/NativeBase](https://github.com/GeekyAnts/NativeBase) | 20.4k | Accessible component set, theming, works on web too |
| [callstack/react-native-paper](https://github.com/callstack/react-native-paper) | 14.5k | Material Design 3 for RN, batteries included |
| [tamagui/tamagui](https://github.com/tamagui/tamagui) | 14.3k | Universal styled components, 100% RN/web parity, compiler-optimised |
| [akveo/react-native-ui-kitten](https://github.com/akveo/react-native-ui-kitten) | 10.7k | Eva Design System, runtime light/dark theming |
| [founded-labs/react-native-reusables](https://github.com/founded-labs/react-native-reusables) | 8.7k | shadcn/ui ported to RN — copy-paste components, NativeWind |
| [nativewind/nativewind](https://github.com/nativewind/nativewind) | 8.1k | Tailwind utility classes in RN |
| [wix/react-native-ui-lib](https://github.com/wix/react-native-ui-lib) | 7.2k | Wix's production component library |
| [gluestack/gluestack-ui](https://github.com/gluestack/gluestack-ui) | 5.4k | Copy-paste components + patterns on NativeWind |
| [Shopify/restyle](https://github.com/Shopify/restyle) | 3.4k | Type-safe theme primitives (no components, just the system) |

### Flutter
| Repo | ⭐ | What it gives you |
|---|---|---|
| [Solido/awesome-flutter](https://github.com/Solido/awesome-flutter) | 61.9k | The index of every Flutter library/UI kit worth using |
| [mitesh77/Best-Flutter-UI-Templates](https://github.com/mitesh77/Best-Flutter-UI-Templates) | 22.9k | 10+ complete, production-quality app UI templates |
| [flutter/samples](https://github.com/flutter/samples) | 19.3k | Official samples, including adaptive/responsive patterns |
| [flutter/gallery](https://github.com/flutter/gallery) | 6.6k | Archived but still the best Material 3 reference app |

### Kotlin / native Android
| Repo | ⭐ | What it gives you |
|---|---|---|
| [android/compose-samples](https://github.com/android/compose-samples) | 23.6k | Official Jetpack Compose sample apps |
| [android/nowinandroid](https://github.com/android/nowinandroid) | 22.1k | Reference app: Material 3, adaptive layouts, modular architecture |
| [wasabeef/awesome-android-ui](https://github.com/wasabeef/awesome-android-ui) | 58.4k | Curated Android UI/UX libraries |

### iOS / SwiftUI
| Repo | ⭐ | What it gives you |
|---|---|---|
| [vsouza/awesome-ios](https://github.com/vsouza/awesome-ios) | 53.9k | Everything in the Apple ecosystem |
| [dkhamsing/open-source-ios-apps](https://github.com/dkhamsing/open-source-ios-apps) | 53.2k | Real open-source iOS apps to read for patterns |
| [pointfreeco/swift-composable-architecture](https://github.com/pointfreeco/swift-composable-architecture) | 15.0k | The de-facto SwiftUI architecture for large apps |

---

## 4. Starter templates / boilerplates (skip week 1)

| Repo | ⭐ | Stack | Why it matters |
|---|---|---|---|
| [infinitered/ignite](https://github.com/infinitered/ignite) | 20.0k | RN + Expo | Battle-tested boilerplate + generators + testing setup |
| [obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes) | 4.4k | Expo | TypeScript, NativeWind, EAS, GitHub Actions, env validation — closest to "production on day one" |
| [expo/examples](https://github.com/expo/examples) | 3.8k | Expo | Canonical examples for every Expo API |
| [roninoss/create-expo-stack](https://github.com/roninoss/create-expo-stack) | 2.6k | Expo | CLI that generates a typed, styled, pre-wired stack |
| [Kotlin/KMP-App-Template](https://github.com/Kotlin/KMP-App-Template) | 702 | KMP | Official shared-UI KMP template |
| [dotnet/maui-samples](https://github.com/dotnet/maui-samples) | 3.7k | MAUI | Official MAUI sample set |

---

## 5. Libraries you will almost certainly need

| Job | Repo | ⭐ |
|---|---|---|
| Navigation | [react-navigation/react-navigation](https://github.com/react-navigation/react-navigation) | 24.5k |
| Server state / caching | [TanStack/query](https://github.com/TanStack/query) | 50.5k |
| Animation / gestures | [software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) | 11.1k |
| Fast lists | [Shopify/flash-list](https://github.com/Shopify/flash-list) | 7.2k |
| Bottom sheets | [gorhom/react-native-bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet) | 9.1k |
| Icons | [oblador/react-native-vector-icons](https://github.com/oblador/react-native-vector-icons) | 17.9k |
| Lottie motion | [lottie-react-native/lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) | 17.2k |
| Maps | [react-native-maps/react-native-maps](https://github.com/react-native-maps/react-native-maps) | 16.0k |
| Camera | [margelo/react-native-vision-camera](https://github.com/margelo/react-native-vision-camera) | 9.7k |
| Subscriptions / paywall | [RevenueCat/react-native-purchases](https://github.com/RevenueCat/react-native-purchases) | 1.2k |
| Crash + performance | [getsentry/sentry-react-native](https://github.com/getsentry/sentry-react-native) | 1.8k |
| E2E tests | [mobile-dev-inc/Maestro](https://github.com/mobile-dev-inc/Maestro) | 16.4k |
| E2E tests (gray-box) | [wix/Detox](https://github.com/wix/Detox) | 12.1k |
| Cross-platform automation | [appium/appium](https://github.com/appium/appium) | 22.2k |

---

## 6. Build → screenshot → submit automation

| Repo | ⭐ | Role |
|---|---|---|
| [fastlane/fastlane](https://github.com/fastlane/fastlane) | 42.4k | `gym`/`supply`/`deliver`/`frameit` — build, upload, metadata, screenshots for both stores |
| [expo/eas-cli](https://github.com/expo/eas-cli) | 1.4k | Cloud build, submit to App Store Connect and Play Console, OTA updates |
| [expo/expo-github-action](https://github.com/expo/expo-github-action) | 1.0k | CI wiring for EAS |
| [appeeky/aso-skills](https://github.com/appeeky/aso-skills) | 2.3k | Agent skills for App Store Optimisation / store copy |
| [facundoolano/aso](https://github.com/facundoolano/aso) | 874 | Scriptable ASO: keywords, rankings, iTunes/Play scraping |

**Pipeline that works:** PR → CI (lint, typecheck, unit, Maestro smoke) → EAS build (or fastlane gym) → internal track/TestFlight → screenshot generation (`fastlane frameit` or a Playwright/RN screenshot harness) → `eas submit`/`fastlane deliver` + `supply` → store review.

---

## 7. iOS App Store — what's actually required

### 7.1 Account & programme
- **Apple Developer Program: US$99/year**, individual or organisation (organisations need a D-U-N-S number; verification can take days).
- Enrol → create an **App Store Connect** app record → bundle ID must match Xcode.
- **Agreements, Tax, and Banking** must be complete before you can sell or offer IAP (paid apps need banking + tax forms).
- Builds are uploaded via Xcode / Transporter / `xcrun altool` / EAS / fastlane; test through **TestFlight** (internal: up to 100 testers, instant; external: up to 10,000, needs a short beta review).

### 7.2 Non-negotiable technical build requirements (verified Nov 2026)
| Requirement | Status |
|---|---|
| Built with **Xcode 26+ / iOS 26 SDK** | **Required since 28 Apr 2026** |
| Minimum deployment target **iOS 13+** | **Required since 9 Sep 2026** |
| **Privacy manifest** `PrivacyInfo.xcprivacy` for apps using required-reason APIs and for listed third-party SDKs, plus **SDK signatures** | Required since 1 May 2024 |
| **App Tracking Transparency** prompt before IDFA/cross-app tracking | Required |
| **Age rating questionnaire** in the new 5-tier system (4+, 9+, 13+, 16+, 18+) | **New system live since 31 Jan 2026; unanswered apps are blocked from updates** |
| **DSA trader status** (EU) | **Required since 17 Feb 2025 — apps without it are removed from the EU storefront** |
| Export compliance (encryption) declaration | Every submission |

### 7.3 Metadata fields (App Store Connect)
**App-level (shared across platforms):** Name, Subtitle, Age Rating, Bundle ID, SKU, Content Rights, License Agreement (optional), Primary Language, Primary Category (+ secondary), DSA Status, Regulated Medical Device Status (if applicable), Korea/China/Vietnam availability declarations (conditional).

**Version-level:** Support URL, Marketing URL (optional), Version number, Copyright, App Review information (contact + **demo account**), Version release settings (manual/auto/phased), What's New.

**App privacy:** Privacy Policy URL (mandatory), Privacy Choices URL (if applicable), Data Types collected/linked/tracking.

**Character limits:** Name 30 · Subtitle 30 · Promotional text 170 · Keywords 100 (comma-separated, no spaces) · Description 4000 · What's New 4000.

**Assets:**
- App icon **1024×1024 PNG, no alpha** (single-size asset catalog icon in Xcode 14+).
- Screenshots: **6.9-inch iPhone required** (1320×2868 portrait / 2868×1320 landscape); **13-inch iPad required if you ship iPad**. 3–10 per size, PNG/JPG.
- App previews: 15–30 s, up to 3 per localisation, `.mov/.m4v/.mp4`.
- Screenshots must show the real app — Apple rejects mocked/device frames that misrepresent functionality (Guideline 2.3.3).

### 7.4 Review guidelines that cause most rejections
| Guideline | What reviewers enforce |
|---|---|
| **2.1 App Completeness** | Final build, no placeholder text, working URLs, **demo account credentials**, backend running |
| **2.3 Accurate Metadata** | Screenshots/description must match the app; no hidden features; no keyword stuffing |
| **4.2 Minimum Functionality** | Must be more than a website wrapper or a thin idea; "not useful, unique, or app-like" = rejected |
| **4.3 Spam** | No duplicate/template apps; saturated categories get extra scrutiny |
| **3.1.1 In-App Purchase** | Digital goods/subscriptions **must** use IAP; no external payment links (region-specific exceptions: US external purchase links, EU DMA) |
| **1.2 User-Generated Content** | Filtering, reporting, blocking, published contact info — required for UGC/social/AI-content apps |
| **4.8 Login Services** | If you offer third-party login (Google/Facebook), you must offer an equivalent privacy-preserving option (Sign in with Apple) |
| **5.1.1 Privacy** | Privacy policy link **in metadata and inside the app**; must state what is collected, how, and with whom |
| **5.1.2 Data Use** | ATT consent, no background location without justification, no contact-grabbing without consent |
| **2.5.1 Software Requirements** | Public APIs only, no private API, no downloaded executable code (interpreted JS is allowed under rules) |
| **2.5.2 / 3.2.2** | No encouraging users to bypass platform rules (e.g., sideloading to dodge IAP) |
| **1.4.1 / 5.1.3** | Health, medical, and kids' apps face additional evidence requirements (this is where the new Regulated Medical Device declaration matters) |

**Timeline:** first review typically 24–72 h; expect 1–3 rejection cycles. Rejections come with a resolution-centre message — reply with evidence, don't resubmit blindly.

---

## 8. Google Play — what's actually required

### 8.1 Account & verification
- **US$25 one-time** registration fee.
- **Identity verification** for the developer account (government ID + address); **organisation accounts need a D-U-N-S number** and can take days-to-weeks.
- A **payments profile** is needed even for free apps if you ever add IAP or paid apps.
- New **personal** accounts (created after 13 Nov 2023) must run the closed-testing gate below before they can publish to production.

### 8.2 The testing gate (this is the #1 surprise for new developers)
Before you can apply for **production access**:
- Run a **closed test** with **at least 12 testers opted in continuously for the previous 14 days**.
- Complete **app setup** (all App content declarations + store listing) first.
- Then answer Google's production-access questionnaire (about your test, your app, your readiness). Review can take several days.
- Internal testing has no gate; open testing unlocks only after production access.

### 8.3 Technical requirements (verified Nov 2026)
| Requirement | Status |
|---|---|
| **Target Android 16 (API level 36)** for new apps and updates | **Required from 31 Aug 2026** (extension to 1 Nov 2026 available). Existing apps must target API 35+ to stay discoverable |
| Upload **Android App Bundle (.aab)**, not APK | Required for new apps |
| **Play App Signing** enrolled | Mandatory for new apps |
| 64-bit native libraries | Required |
| **Data safety form** completed accurately | Mandatory; mismatches with actual SDK behaviour are a policy violation |
| **Content rating** via IARC questionnaire | Mandatory per app |
| **Account deletion** in-app + web link, if the app supports account creation | Mandatory under User Data policy |
| **Privacy policy URL** | Required for any app that collects data (effectively all) |
| **App access** declaration (login credentials for reviewers) | Mandatory if any feature is gated |

### 8.4 Store listing metadata
| Field | Limit / spec |
|---|---|
| App name | **30 characters** |
| Short description | **80 characters** — no emojis, no "download now", no "best/#1" |
| Full description | **4000 characters** |
| App icon | **512×512, 32-bit PNG with alpha, ≤1 MB** |
| Feature graphic | **1024×500, JPEG or 24-bit PNG (no alpha)** — required |
| Phone screenshots | **2–8**, 320–3840 px, aspect between 16:9 and 9:16 |
| 7"/10" tablet screenshots | Required only if you declare tablet support |
| Promo video | YouTube URL (optional) |
| Developer name, contact email, website, privacy policy URL | Required |

**Metadata policy landmines:** no emojis or repeated special characters in name/icon/developer name; no ranking/price/award claims ("#1", "App of the Year"); no misleading icon badges (e.g. fake notification dots); no keyword stuffing; screenshots must show the actual app.

### 8.5 App content declarations (all mandatory before review)
1. Privacy policy
2. Ads declaration (does the app contain ads)
3. App access (credentials for gated features)
4. Content rating (IARC questionnaire)
5. Target audience & content (age groups, "Designed for Families" if applicable)
6. News app declaration
7. Data safety (data collected, shared, encrypted in transit, deletion route)
8. Government app declaration
9. Financial features declaration
10. Health apps declaration
11. Advertising ID declaration
12. COVID-19 tracing (legacy, still shown)

### 8.6 Policies that cause most rejections/suspensions
| Area | Requirement |
|---|---|
| **User Data** | Disclose collection, get consent, minimise, allow deletion, no selling sensitive data |
| **Permissions & APIs** | Sensitive permissions (SMS/Call Log, All Files Access, background location, exact alarms) need a declaration form and a core-function justification; `READ_MEDIA_IMAGES`/`VIDEO` must use the photo picker where possible |
| **Deceptive Behaviour** | No misleading claims, fake functionality, hidden features, or impersonation |
| **Spam & Minimum Functionality** | No webview-only apps, no copycat apps, no broken/empty apps |
| **Monetisation & Ads** | No full-screen ads that appear unexpectedly; no ads on exit; ad behaviour must be disclosed |
| **Play Billing** | Digital goods must use Google Play Billing (user-choice billing in eligible regions only) |
| **Families** | Strict rules for apps targeting children: no behavioural ads, certified ads SDKs, content suitability |
| **SDK policy** | You are responsible for every third-party SDK's behaviour — including their data collection |
| **Broken functionality / crashes** | Android vitals thresholds (crash rate, ANR rate) trigger warnings and can reduce distribution |

**Timeline:** new-app review is often **3–7 days** (longer for new accounts); policy appeals take days. The 12-tester/14-day gate adds **at least two weeks** before first production release — plan for it.

---

## 9. Side-by-side

| | Apple App Store | Google Play |
|---|---|---|
| Fee | $99 / year | $25 one-time |
| Review time | ~24–72 h | 3–7 days (new accounts longer) |
| Pre-launch gate | TestFlight (external beta review) | **12 testers × 14 days closed test** (personal accounts) |
| Build format | `.ipa` (Xcode archive) | `.aab` + Play App Signing |
| SDK/OS floor | Xcode 26 / iOS 26 SDK, min iOS 13 | targetSdk 36 from 31 Aug 2026 |
| Metadata entry | App Store Connect | Play Console |
| Privacy disclosure | App Privacy "nutrition label" + privacy manifest + ATT | Data safety form + privacy policy |
| Content rating | Apple's own 5-tier questionnaire | IARC questionnaire (regional ratings) |
| Payments | IAP mandatory for digital goods | Play Billing mandatory for digital goods |
| Account deletion | Required in-app (5.1.1(v)) | Required in-app **and** web link |
| Kill risks | 4.2 thin app, 3.1.1 external payments, 2.3 metadata | Data safety mismatch, permission declarations, 12-tester gate |

---

## 10. Pre-submission checklist

**Both**
- [ ] Privacy policy hosted at a stable public URL, linked in store metadata **and** in-app
- [ ] Account deletion flow (in-app + web) if accounts exist
- [ ] Demo/test account credentials for reviewers, backend live and seeded
- [ ] Real screenshots of the shipped build at required sizes (no mockups)
- [ ] Age/content rating questionnaire completed
- [ ] Crash-free on a physical low-end device; no ANR/last-minute TODOs
- [ ] Analytics/crash reporting live (Sentry or Firebase Crashlytics)

**iOS**
- [ ] `PrivacyInfo.xcprivacy` present, required-reason APIs declared, third-party SDK signatures valid
- [ ] ATT prompt copy + purpose string for every permission (`NSCameraUsageDescription`, etc.)
- [ ] App icon 1024×1024, no alpha; 6.9" + 13" iPad screenshots
- [ ] IAP products configured, restore purchases implemented, StoreKit testing done
- [ ] DSA trader status submitted (EU)
- [ ] New age-rating questions answered (post-Jan 2026 system)
- [ ] Export compliance answered; no private APIs; no external payment links for digital goods

**Android**
- [ ] `targetSdkVersion 36`; AAB built; Play App Signing enrolled
- [ ] Data safety form matches actual SDK behaviour exactly
- [ ] Sensitive-permission declarations filed (location, SMS, media, alarms)
- [ ] App content declarations all green in Play Console
- [ ] 12 testers opted in for 14 continuous days → production access approved
- [ ] Store listing: icon 512², feature graphic 1024×500, 2–8 screenshots
- [ ] Play Billing wired if monetising; no misleading metadata

---

## 11. Suggested 4-week path (Expo route)

| Week | Work |
|---|---|
| 1 | `create-expo-app` from `obytes/react-native-template-obytes`; design tokens (Tamagui or NativeWind + react-native-reusables); navigation + auth |
| 2 | Screens against real API; Reanimated/FlashList/BottomSheet; analytics + Sentry; unit + Maestro smoke tests |
| 3 | EAS project, dev/preview/production channels, store assets generated (icon, feature graphic, 6.9" screenshots), metadata drafted to character limits |
| 4 | TestFlight external beta + Play internal → closed test with 12 testers (start the 14-day clock **now**), fix review feedback, submit |

The 14-day Play gate means: **start closed testing the moment you have a usable build**, not after polish.

---

## 12. Primary sources

- Apple App Store Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- Apple upcoming requirements (SDK, min OS, age ratings, DSA) — https://developer.apple.com/news/upcoming-requirements/
- App Store Connect required/localizable/editable properties — https://developer.apple.com/help/app-store-connect/reference/required-localizable-and-editable-properties/
- Screenshot specifications — https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Google Play target API level requirements — https://support.google.com/googleplay/android-developer/answer/11926878
- Google Play testing tracks & production access — https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play preview assets — https://support.google.com/googleplay/android-developer/answer/9866151
- Google Play metadata policy — https://support.google.com/googleplay/android-developer/answer/9898842
- Google Play account deletion — https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play data safety — https://support.google.com/googleplay/android-developer/answer/10787469
