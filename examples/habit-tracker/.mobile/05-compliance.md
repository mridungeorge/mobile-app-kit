# Store compliance

| Check | iOS | Android |
|---|---|---|
| Privacy manifest | `PrivacyInfo.xcprivacy` declares collected data: purchase history, identifiers, crash data | — |
| Data safety | — | data safety form matches dependencies: purchase history, device id, crash logs |
| Target API | iOS 18 SDK | targetSdk 36, target API 36 |
| Account deletion | in-app Settings → Delete account, plus web URL | same web URL in the data safety form |
| Billing | StoreKit 2; **restore purchases** visible in Settings | Play Billing; restore purchases; purchase history declared |
| Tracking | no ATT prompt: no tracking SDK | no ad ID |
| Permissions | notifications only, asked after the first check-in | `POST_NOTIFICATIONS` requested at the same moment |

Apple guideline **5.1.1(v)** requires in-app account deletion; Play requires the web link
(https://example.com/delete-account) in the data safety form.

## Third-party SDKs
None in this sample. The billing module would add StoreKit/Play Billing only (first-party), and
RevenueCat if enabled — then declare RevenueCat as a third-party SDK with purchase history and
device id. `scripts/reconcile-declarations.mjs` fails when an SDK is present but undeclared.

## Rules applied
Privacy manifest and data safety per `references/store-facts.md` rows verified 2026-11-16.
