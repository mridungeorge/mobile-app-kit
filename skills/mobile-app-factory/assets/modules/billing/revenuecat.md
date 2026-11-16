# RevenueCat instead of hand-rolled billing

Use when you want server receipt validation, cross-platform entitlements and a paywall dashboard without running a backend. Trade-off: a third-party SDK (declare it: identifiers + purchase history), a fee above the free tier, and a dependency in your purchase path.

Keep the `PurchaseService` protocol; implement it with `Purchases.shared` (iOS, SPM `RevenueCat`) and `Purchases.sharedInstance` (Android, `com.revenuecat.purchases:purchases`). Map `CustomerInfo.entitlements["pro"]` to `Entitlement`. Restore = `restorePurchases()`. Ship only the public SDK key, never the secret key.

Verify current pricing and SDK versions on revenuecat.com before adopting.
