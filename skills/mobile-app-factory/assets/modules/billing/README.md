# billing module

**Adds:** one `PurchaseService` protocol with StoreKit 2 (Swift) and Play Billing 7 (Kotlin) implementations, restore purchases, and an entitlement cache so the app works offline.
**Files touched:** copy `ios/PurchaseService.swift` into `Sources/Data/`; copy `android/PurchaseService.kt` into `data/billing/`; add `com.android.billingclient:billing-ktx` (7.x) to `libs.versions.toml`. Add the In-App Purchase capability in Xcode.
**Declarations it changes (feed into 05-compliance):** iOS privacy manifest — Purchase History (not linked, not tracking). Play data safety — Purchase history, collected for app functionality. A visible Restore button and a cancel/manage link are required (App Review 3.1.1, Play subscriptions policy).
**Server validation:** never trust the client. Send the StoreKit 2 signed transaction (JWS) or the Play purchase token to your backend; verify with the App Store Server API / Google Play Developer API `purchases.subscriptionsv2.get`, then grant the entitlement. Acknowledge Play purchases within 3 days or they are refunded.
**Alternative:** RevenueCat — see [revenuecat.md](revenuecat.md).
**Test:** `ios/PurchaseServiceTests.swift` round-trips the entitlement cache; `check-skill.mjs` asserts the module files and manifest exist. Not compiled locally.
