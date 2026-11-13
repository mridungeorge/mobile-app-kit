# Archetypes — what each route actually builds

Every block lists: **core loop**, default stack, screen set, sensitive data, permissions,
declarations, monetisation, age-rating floor, motion budget, top review risks, QA focus and
metadata hints. These 14 blocks are the prose behind the `ARCHETYPES` table in
`scripts/route-idea.mjs`; when you add or change one, change both.

For how a profile is produced and consumed, read `idea-router.md`. For the exact JSON shape,
run `node scripts/route-idea.mjs --json "<idea>"`.

## Archetypes

Each block lists: **core loop**, default stack, screen set, sensitive data, permissions, declarations, monetisation, age-rating floor, motion budget, top review risks, QA focus, metadata hints.

### utility
Calculator, converter, scanner, notes, timer, offline reference, file tool.

- **Core loop**: open → do the one thing → result is saved or shareable.
- **Stack**: native — Kotlin + Jetpack Compose (Android) and Swift + SwiftUI (iOS); Room/Core Data or SQLDelight for storage; no backend unless sync is requested. Expo prototype only if explicitly requested.
- **Screens**: onboarding (optional, ≤3 cards), home/tool, history, detail, settings, paywall (if IAP).
- **Sensitive data**: none by default; scans may contain personal documents.
- **Permissions**: camera (scanner), notifications (timer), files.
- **Declarations**: iOS privacy manifest if any SDK collects data; Play data safety; camera/microphone declaration only if used.
- **Monetisation**: one-time unlock or lifetime IAP; avoid subscriptions for a single-purpose tool.
- **Age floor**: 4+ / Everyone.
- **Motion**: restrained.
- **Risks**: 4.2 minimum functionality (a thin web wrapper or single-button app gets rejected); 2.3 accurate metadata; 3.1.1 if selling digital goods outside IAP.
- **QA**: offline behaviour, large inputs, permission-denied path, share/export correctness.
- **Metadata**: lead with the verb ("Scan", "Convert", "Track"); keywords are task synonyms, not brand words.

### health-fitness
Sleep, workouts, nutrition, symptom logs, meditation, cycle tracking, rehab.

- **Core loop**: log or import a measurement → see today → see a trend → adjust.
- **Stack**: native + Room/Core Data for local history + optional Supabase; HealthKit / Health Connect adapters written per platform.
- **Screens**: onboarding + consent, today, log entry, history, trends/charts, detail, settings, export, paywall.
- **Sensitive data**: health, biometric, sleep, reproductive.
- **Permissions**: notifications, HealthKit/Health Connect read+write, motion & fitness, camera (meal photos).
- **Declarations**: iOS HealthKit entitlement + purpose strings, privacy manifest, "not for medical use" positioning; Play Health Connect declaration + data safety + sensitive-data policy.
- **Monetisation**: subscription is normal here, but the free tier must be genuinely useful.
- **Age floor**: 13+ / Teen (4+ only if no data collection and no social features).
- **Motion**: restrained. Progress rings and count-ups are fine; celebratory confetti is not.
- **Risks**: 1.4.1 medical claims; 5.1.3 health data misuse; unsubstantiated "diagnose/treat/cure" copy; Play health misinformation policy; missing export/delete.
- **QA**: units and time zones, import dedupe, empty history, export integrity, permission denial, accessibility of charts (values available as text).
- **Metadata**: never promise diagnosis. "Sleep insights", not "cures insomnia".

### social-ugc
Feeds, communities, photo sharing, reviews, forums, dating-adjacent.

- **Core loop**: create or browse → interact → return for new content.
- **Stack**: native + platform HTTP client or Ktor/URLSession + Supabase/Firebase; image CDN; APNs/FCM push.
- **Screens**: auth, feed, compose, post detail, comments, profile, search, notifications, report/block, moderation queue (if creator tools), settings.
- **Sensitive data**: account, contacts (optional), precise location (optional), photos.
- **Permissions**: photos, camera, notifications, contacts (optional), location (optional).
- **Declarations**: Apple 1.2 UGC (filtering, reporting, blocking, published contact, timely response), 5.1.1 account deletion, DSA trader status for EU; Play UGC policy, child safety standards, data safety.
- **Monetisation**: ads, subscription, or creator tools — ads raise the age floor and add ATT/consent.
- **Age floor**: 13+ / Teen minimum; 16+/18+ if mature content is possible.
- **Motion**: standard, but never animate content into place in a way that hides a report/block control.
- **Risks**: 1.2 missing moderation, 1.6 data collection without permission, 2.1 placeholder content, 5.1.1(v) account deletion, Play's UGC and child-safety policies.
- **QA**: report → block → hide flows, blocked-user invisibility, deep links into deleted content, offline compose queue, image upload failure.
- **Metadata**: screenshots must show real community content you have rights to; no fake testimonials.

### commerce-marketplace
Storefronts, DTC brands, multi-vendor marketplaces, bookings with payment.

- **Core loop**: discover → product/service detail → cart or booking → pay → track.
- **Stack**: native + StoreKit 2 / Play Billing via RevenueCat (optional) + Shopify/Medusa backend. Digital goods must use in-app purchase on iOS.
- **Screens**: home, category, search, product, cart, checkout, order confirmation, orders, order detail, account, addresses, support, paywall/loyalty.
- **Sensitive data**: payment, address, purchase history.
- **Permissions**: notifications, camera (barcode/returns), location (store finder, optional).
- **Declarations**: Apple 3.1.1 (physical goods may use external payment; digital goods must use IAP), 3.1.3 exceptions, privacy manifest + tracking; Play payments policy, data safety, account deletion.
- **Monetisation**: transaction fees, subscription, or ads.
- **Age floor**: 4+ / Everyone for physical goods; 13+/Teen if accounts and UGC reviews.
- **Motion**: standard, restrained on checkout.
- **Risks**: 3.1.1 wrong payment path, 2.1 incomplete catalogue, 5.1.1 account deletion, misleading pricing, Play's payments policy.
- **QA**: price/tax/currency correctness, out-of-stock, payment failure, refund path, order state transitions, guest checkout.
- **Metadata**: first two screenshots must show product discovery and checkout confidence; no "free" claims that hide IAP.

### media
Music, podcasts, video, reading, photo galleries, streaming.

- **Core loop**: browse → play/read → resume → collect.
- **Stack**: native + Media3/ExoPlayer (Android) and AVPlayer/AVKit (iOS) + Room/Core Data; background audio config; CDN.
- **Screens**: home, library, player/reader, queue, search, detail, downloads, settings, paywall.
- **Sensitive data**: account, listening/reading history.
- **Permissions**: notifications, background audio, photos (import), storage.
- **Declarations**: Apple 2.5.2 background audio justified, 3.1.1 for digital content, music licensing evidence; Play foreground-service media playback declaration, data safety.
- **Monetisation**: subscription, ads, or one-time purchase.
- **Age floor**: 4+ / Everyone; 13+ if UGC or explicit content possible.
- **Motion**: expressive on the player/hero, restrained in settings and library management.
- **Risks**: unlicensed content, 2.5.2 misuse of background modes, 4.2 thin functionality, Play's background-playback policy.
- **QA**: interruption handling (calls, Siri, headphones), resume position, offline downloads, lock-screen controls, background drain.
- **Metadata**: show the player and the library; say "offline" only if downloads actually work.

### ai-assistant
Chat, writing helpers, journaling with AI, image generation, summarisation.

- **Core loop**: prompt or capture → generated result → refine → save/export.
- **Stack**: native + a serverless proxy (Cloudflare Workers / Supabase Edge Functions); never ship provider keys in the app.
- **Screens**: onboarding + AI disclosure, chat/compose, result, history, detail, settings, usage/limits, paywall.
- **Sensitive data**: prompts may contain anything — treat as high sensitivity; add a "don't enter sensitive data" notice.
- **Permissions**: microphone (voice), photos (vision), notifications.
- **Declarations**: Apple 1.2 UGC for AI output (filter + report), 5.1.2 data sharing with third-party AI, privacy manifest; Play generative-AI policy (in-app reporting of offensive output, safety filters), data safety, account deletion.
- **Monetisation**: subscription with visible usage limits; credit packs must not expire misleadingly.
- **Age floor**: 13+ / Teen; 18+ if the model can produce adult content.
- **Motion**: standard; typing/streaming effects are on-brand, but never delay the stop button.
- **Risks**: 1.2 unfiltered output, 5.1.2 undisclosed sharing, 4.2 wrapper app, Play's AI-generated content policy, hallucinated medical/legal/financial advice.
- **QA**: refusal path, report flow, rate-limit UX, streaming cancel, offline queue, cost runaway per user, prompt-injection handling if tool-using.
- **Metadata**: state the model/provider and what leaves the device; no "100% private" unless true.

### fintech
Banking views, budgeting, expense tracking, invoicing, crypto portfolio (not custody).

- **Core loop**: connect or enter → categorise → see balance/trend → act or export.
- **Stack**: native + encrypted Room/Core Data + Plaid/Stripe/bank API; biometrics via BiometricPrompt / LocalAuthentication.
- **Screens**: onboarding + KYC (if required), accounts, transactions, detail, budgets, trends, settings, security, export, support.
- **Sensitive data**: financial, identity, authentication.
- **Permissions**: notifications, biometrics/Face ID, camera (receipts/cheque).
- **Declarations**: Apple 3.1.1, 5.1.1, 5.1.2, financial-services review notes, privacy manifest; Play financial-services policy, data safety, account deletion, sensitive-permission declarations.
- **Monetisation**: subscription or per-transaction; no misleading "free".
- **Age floor**: 18+ / Mature.
- **Motion**: restrained. No playful animation around money.
- **Risks**: regulatory licensing, 2.1 incomplete demo account, 5.1.1 data handling, misleading financial claims, Play's financial-services declarations.
- **QA**: rounding and currency, timezone of transactions, demo account for review, biometric fallback, session timeout, export accuracy.
- **Metadata**: never imply insured/guaranteed returns; name the regulated entity if applicable.

### kids-family
Tutoring, bedtime, chores, parental controls, child-facing games.

- **Core loop**: child does an activity → earns progress → parent sees it.
- **Stack**: native + Room/Core Data / SwiftData; offline-first; COPPA/GDPR-K compliant analytics (or none).
- **Screens**: parent gate, child home, activity, reward/progress, parent dashboard, settings, privacy notice.
- **Sensitive data**: children's data — highest sensitivity.
- **Permissions**: notifications (parent only), camera (optional, never required).
- **Declarations**: Apple Kids Category rules (no third-party analytics/ads, parental gate, no external links), 1.3, 5.1.4; Play Families policy, teacher-approved/designed-for-families declarations, data safety.
- **Monetisation**: one-time purchase or subscription through the parent gate; no manipulative ads.
- **Age floor**: 4+ / Everyone, with Kids/Families designation.
- **Motion**: expressive but calm; no rapid flashing, no variable-ratio reward loops.
- **Risks**: 1.3 Kids Category violations, 5.1.4 collecting child data, Play Families policy, ads in child experience, external purchase links behind a gate.
- **QA**: parental gate strength, no data leaving the device without consent, offline play, no dark patterns, no unmoderated chat.
- **Metadata**: describe the learning outcome, not "fun for kids"; show the parent dashboard.

### travel-maps
Trip planners, guides, transit, navigation, local discovery.

- **Core loop**: choose a place → see it on a map/list → save or navigate → use offline.
- **Stack**: native + MapLibre/Mapbox SDK for each platform + Room/Core Data; offline tile packs.
- **Screens**: onboarding (location rationale), discover, map, place detail, itinerary, saved, offline downloads, settings.
- **Sensitive data**: precise location, travel plans.
- **Permissions**: location (when-in-use, optional precise), notifications (trip reminders), camera.
- **Declarations**: Apple 5.1.1 location purpose + background justification if used, 5.1.5; Play location declaration with core-function justification, data safety, background-location video if requested.
- **Monetisation**: subscription for offline/guides, affiliate links (disclose), ads.
- **Age floor**: 4+ / Everyone.
- **Motion**: standard; map transitions should be interruptible.
- **Risks**: 5.1.1 vague location purpose, background location overreach, 2.3 misleading offline claims, Play sensitive-permission rejection.
- **QA**: permission denial with manual location entry, offline map integrity, background battery, timezone and transit changes, deep links to a place.
- **Metadata**: show the map and offline mode; name the cities/regions covered.

### b2b-field
Field ops, inspections, inventory, CRM, shift work, logistics.

- **Core loop**: sign in → receive assignment → capture evidence → sync → report.
- **Stack**: native + Room/Core Data (offline queue) + SSO via AppAuth/MSAL or Okta OIDC/SAML through the customer's IdP.
- **Screens**: SSO login, today/assignments, job detail, capture (photo/signature/scan), sync status, history, profile, settings, admin (optional web).
- **Sensitive data**: employee, customer, site, and sometimes health/safety data.
- **Permissions**: camera, location (job geofence), notifications, Bluetooth (sensors), files.
- **Declarations**: Apple 5.1.1, enterprise distribution considerations, privacy manifest; Play data safety, location/Bluetooth declarations, managed Google Play if private.
- **Monetisation**: per-seat contract, billed outside the stores; no IAP.
- **Age floor**: 18+ / Mature if workplace data; 4+ otherwise but usually not consumer-listed.
- **Motion**: restrained. Speed and legibility beat delight.
- **Risks**: 2.1 demo account for reviewers, 5.1.1 data handling, 4.2 thin consumer value, MDM/private distribution misconfiguration.
- **QA**: offline capture and conflict resolution, photo compression, SSO expiry, geofence accuracy, battery under shift-length use, audit trail.
- **Metadata**: if public, describe the operational outcome; usually distributed via Managed Google Play / Apple Business Manager.

### camera-photo
Scanner, editor, filters, OCR, AR try-on.

- **Core loop**: capture → process/edit → save/share.
- **Stack**: native + CameraX / AVFoundation capture + Core Image / Android graphics for filters; on-device ML Kit / Vision where possible.
- **Screens**: camera, review, editor, export/share, gallery, settings, paywall.
- **Sensitive data**: photos, possibly documents/identity.
- **Permissions**: camera, photos, microphone (video).
- **Declarations**: Apple 5.1.1 purpose strings, 2.5.13 if using ARKit, privacy manifest; Play camera/microphone declarations, data safety, photo/video permissions policy.
- **Monetisation**: one-time unlock, subscription for cloud/advanced features.
- **Age floor**: 4+ / Everyone; 13+ if social sharing.
- **Motion**: expressive in editing previews, restrained in capture (never animate the shutter).
- **Risks**: 4.2 thin filter app, 2.5.13, misleading AI claims, Play photo-permission overreach.
- **QA**: capture latency, orientation/EXIF, large-image memory, export colour fidelity, permission denial, on-device vs cloud clarity.
- **Metadata**: show before/after with real images you own.

### game
Casual, puzzle, arcade, narrative.

- **Core loop**: session → challenge → reward → next session.
- **Stack**: Unity or Godot for 3D/render-heavy work; SpriteKit/SceneKit or Jetpack Compose Canvas for simple 2D. Not the native app pipeline, and not Expo.
- **Screens**: title, tutorial, play, pause, results, shop, settings, leaderboard (if any).
- **Sensitive data**: account, purchase history, gameplay analytics.
- **Permissions**: notifications, Game Center/Play Games.
- **Declarations**: Apple 3.1.1, 4.3 spam, 5.1.1, age rating with in-game content questions; Play IARC content rating, data safety, families policy if child-directed.
- **Monetisation**: IAP, ads (with consent), battle pass; disclose odds for loot boxes.
- **Age floor**: 4+/9+/13+/16+/18+ by content; Play Everyone/Teen/Mature.
- **Motion**: expressive by definition; still provide reduced-motion for UI chrome.
- **Risks**: 4.3 saturated category/clone, loot-box odds, ads to children, Play's families and ads policies.
- **QA**: frame rate on low-end devices, save integrity, interrupt/resume, purchase restore, offline behaviour.
- **Metadata**: gameplay footage in the video preview; no fake gameplay.

### dating
Matchmaking, friendship, community meetups.

- **Core loop**: profile → discover → match → chat → meet.
- **Stack**: native + Supabase/Firebase + server-side image moderation + APNs/FCM push.
- **Screens**: onboarding + verification, profile builder, discover, match, chat, report/block, safety centre, settings, paywall.
- **Sensitive data**: identity, photos, precise location, sexual orientation (special category).
- **Permissions**: photos, camera, location (optional, coarse by default), notifications.
- **Declarations**: Apple 1.2 UGC, 5.1.1, 5.1.4 if minors could access, DSA trader; Play UGC, dating-app policy, data safety, account deletion.
- **Monetisation**: subscription + consumables.
- **Age floor**: 18+ / Mature.
- **Motion**: standard; never gamify rejection or hide safety controls.
- **Risks**: 1.2 moderation, age verification, 5.1.1 sensitive data, Play's dating policies, scam/impersonation.
- **QA**: report/block immediacy, photo verification, location privacy, screenshot/recording warnings, account deletion.
- **Metadata**: lead with safety and verification, not just matching.

### delivery-logistics
Courier, food delivery, ride-hailing, last-mile tracking.

- **Core loop**: request → match → track live → complete → rate.
- **Stack**: native + Maps SDK + push + realtime (Supabase/Firebase) + Stripe Connect for payouts.
- **Screens**: role select, request, tracking, chat/call, history, receipt, driver/runner mode, earnings, settings.
- **Sensitive data**: precise location, payment, identity (drivers).
- **Permissions**: location (background for drivers), notifications, camera (proof of delivery), phone.
- **Declarations**: Apple 5.1.1 + background location justification, 3.1.1; Play background-location declaration and video, data safety, account deletion.
- **Monetisation**: per-trip fee, subscription, or commission.
- **Age floor**: 18+ / Mature.
- **Motion**: standard; live tracking animation must degrade to a static map on low power.
- **Risks**: background-location rejection, 5.1.1 data sharing with drivers, payment compliance, Play's location policy, safety disclosures.
- **QA**: background location on both OSes, battery, offline tracking gaps, fare calculation, cancellation/refund, SOS path.
- **Metadata**: show tracking and fare transparency; state the service area.
