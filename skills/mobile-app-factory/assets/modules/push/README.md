# push module

**Adds:** APNs (iOS) + FCM (Android) registration stubs, a permission-priming screen, and Android notification channels. Permission is asked in context (after the user does something that benefits from alerts), never at launch.
**Files touched:** `ios/PushRegistrar.swift`, `ios/PushPrimingView.swift` into `Sources/`; `android/PushChannels.kt`, `android/PushPrimingScreen.kt` into `ui/`; add `firebase-messaging` and your own `google-services.json` (never committed); add `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`; enable the Push Notifications capability and upload an APNs key to FCM or your server.
**Setup:** iOS — `registerForRemoteNotifications()` runs after the user taps "Turn on"; send the device token to your backend via `registerToken`. Android — create channels at startup (API 26+), request `POST_NOTIFICATIONS` (API 33+) from the priming screen, send the FCM token to your backend.
**Declarations it changes (feed into 05-compliance):** iOS privacy manifest — Device ID (linked if tied to an account, not tracking). Play data safety — Device or other IDs, app functionality. No promotional push without opt-in (App Review 4.5.4).
**Test:** the priming view must show a benefit line and a "Not now" path that leaves the app fully usable; `check-skill.mjs` asserts the files and manifest exist. Not compiled locally.
