# Rebuilding an app that is already live

A rebuild is a **replacement**, not a relaunch. The listing, the installed base, the subscribers
and the reviews stay; the binary changes. Every decision below exists to protect one of those four.

This is the reference for `agents/00-migration-analyst.md`. The inventory comes from
`scripts/inventory-existing.mjs`; the plan is `.mobile/00-migration-plan.md`.

## The one rule

**Update the existing listing. Never create a new one.**

A new bundle ID or package name means a new app: a new listing with zero reviews, a new 12-tester
gate on Play, no upgrade path for installed users, and subscribers who must buy again. The only
time a new listing is correct is when the user explicitly wants two apps (a companion or a
different brand), which is a product decision, not a technical one.

## Parity checklist

Work through this before any code moves. Each item is `keep`, `change`, `drop` or `add` in the
parity matrix.

**Screens and flows**
- [ ] Every screen in `00-existing.json` is accounted for
- [ ] Deep links into every screen still resolve (including links already in the wild)
- [ ] Onboarding and permission prompts behave the same or better
- [ ] Empty, loading, error and offline states exist for every network screen
- [ ] Account deletion still exists in-app (Apple 5.1.1(v)) **and** via a web link (Play)
- [ ] Restore purchases is reachable for a user who reinstalls
- [ ] Sign-in methods are unchanged, or the removed method has an account-recovery path

**Data**
- [ ] Local data has a one-time reader for the old format
- [ ] Cloud data migration is versioned and idempotent
- [ ] A user who updates mid-migration lands in a consistent state
- [ ] Rollback does not lose data written by the new version
- [ ] Export/delete paths cover the new schema

**Platform**
- [ ] Bundle ID / package name unchanged
- [ ] Signing keys unchanged (see below)
- [ ] Push tokens re-registered; old tokens invalidated
- [ ] Notification channels keep their IDs on Android, or users lose their preferences
- [ ] Widgets, watch apps, extensions, App Clips and shortcuts still build or are deliberately dropped
- [ ] Minimum OS version is raised only with a migration story
- [ ] Store metadata, screenshots and privacy declarations match the new binary

**Business**
- [ ] Product IDs unchanged, or existing subscribers are mapped to new products
- [ ] Prices and trials unchanged, or changes are disclosed
- [ ] Ads/consent behaviour unchanged, or consent is re-collected
- [ ] Analytics history has a continuity plan (event names map, or accept a break)
- [ ] Support links and legal URLs still resolve

## Preserving the store listing

1. **Same app record.** Update the existing app in App Store Connect / Play Console. Do not press
   "New app".
2. **Same bundle ID / package name.** `PRODUCT_BUNDLE_IDENTIFIER` and `applicationId` must match
   the live app exactly. Check the current value in the console, not in the old repo — they drift.
3. **Version, not identity.** Raise `MARKETING_VERSION` / `versionName` and `CURRENT_PROJECT_VERSION`
   / `versionCode`. A rebuild is a normal update to the store.
4. **Keep the store's existing signing identity.** iOS: same Team ID, same distribution
   certificate lineage. Android: same app signing key (see below).
5. **Metadata.** Screenshots must show the new UI before submission. Describe what changed in
   "What's New". Apple rejects "same app, no meaningful change" (4.3 spam, 2.3 misleading metadata)
   only when the update claims something it does not do — a genuine rewrite with a real changelog is
   fine.
6. **Reviews and ratings carry over.** Do not ask reviewers to delete old reviews; respond to the
   ones the rebuild fixes.
7. **Staged rollout.** iOS phased release over 7 days; Play staged rollout 5% → 20% → 50% → 100%.
   Halt on crash-free-sessions or ANR regression, not on install count.

## Signing keys

| Platform | What must not change | Where it lives | Failure mode if changed |
|---|---|---|---|
| Android | App signing key (Play App Signing) | Google holds the app signing key; you hold the **upload key** | A new upload key needs a reset request; a new app signing key is impossible without a new listing |
| Android | Upload keystore + passwords | CI secret, never the repo | Cannot upload updates |
| iOS | Team ID + distribution certificate/profiles | Apple Developer account, CI secret | Cannot upload; TestFlight groups break |
| iOS | App Store Connect API key | CI secret | Release pipeline stops |

Rules:
- Copy the **existing** keystore and certificates into the new project's CI, not new ones.
- Verify the upload key fingerprint against Play Console before the first upload.
- Keep the old CI pipeline running until the new one has shipped at least one build.
- Never commit a keystore, `.p12`, `.p8` or password. Record the secret **name** in `.env.example`.

## Subscriber entitlements

Revenue is the part a rebuild breaks silently: the code compiles, the app looks right, and paying
users arrive as free users.

**Apple (StoreKit 2)**
- Entitlements derive from `Transaction.currentEntitlements`, keyed by `productID` and
  `originalID`. A rebuild that reads only new transactions sees nothing for existing subscribers.
- Call `AppStore.sync()` behind a visible "Restore purchases" action, never at launch.
- If the product IDs change, the subscriber must be mapped by `originalTransactionID` on your
  server before the old product is removed from sale. Do not remove old products while subscribers
  remain on them.
- Keep the same bundle ID or `originalID` continuity is gone.

**Google Play (Billing 7)**
- Entitlements come from `queryPurchasesAsync` on app start, not from a local cache.
- `purchaseToken` is per-purchase and server-validated; a rebuild must keep the same backend
  validation and the same product IDs.
- Acknowledge purchases within 3 days or they are refunded automatically.
- Pending purchases (cash, slow payment methods) must be handled on every launch.

**RevenueCat or another wrapper**
- Entitlement identifiers are the contract, not the product IDs. Keep the identifiers, then map
  products to them. Use the vendor's transfer/restore path when the App User ID changes.
- If you drop the wrapper, export the entitlement state first and import it into your own backend.

**Verification before cutover**
1. Sandbox account with an active subscription, on the old build.
2. Update to the new build (same listing, same bundle ID).
3. The paid feature must be unlocked without a purchase prompt.
4. Reinstall: "Restore purchases" must re-unlock it.
5. Cancel and refund in the sandbox: the feature must lock on the next entitlement refresh.
6. Server-side: one receipt validated, no duplicate grants.

## User data

- **Identify users before migrating.** If the old app had anonymous local data, give it an owner
  (account or a generated device id) before copying it.
- **Never delete the old store until the new one is proven.** Keep a read-only copy or a backup
  file for one release cycle.
- **Write a migration flag** (`schema_version`) so the migration runs once and is safe to re-run.
- **Handle the downgrade case.** A user who restores an old backup or installs an older build must
  not corrupt the new data. Version the format; refuse to write an older version over a newer one.
- **Deletion must still delete everything**, including the migrated copy, the cache and any
  analytics identifiers tied to the account.
- **Push tokens:** the old token is tied to the old install. Re-register on first launch of the new
  build and delete the old token server-side when the new one arrives.

## Cutover order (strangler, not big-bang)

1. Maintenance release of the **old** app: version reporting + local data export/migration hook.
2. New shell ships behind a flag: auth, navigation, read-only screens.
3. One feature at a time moves over, each behind its own flag, each shipping to internal testing.
4. Billing moves last, after restore and entitlement continuity are proven in sandbox.
5. Staged rollout, halting on crash-free-sessions and ANR, not installs.
6. Old API and old binary stay alive for at least one release cycle.

Every step must be reversible without a store rollback (a flag flip is reversible; a submitted
binary is not).

## What the inventory cannot tell you

`inventory-existing.mjs` reads files. It cannot see the store console, the backend, the signing
keys, the subscriber count or the crash rate. Record those as human inputs in the migration plan:

- the live bundle ID / package name and current version from the console
- active subscriber count and product IDs from the store
- the API base URL actually used in production (it may differ from the repo)
- the signing-key fingerprints
- the crash-free-sessions baseline to beat

## Definition of done for a rebuild

- Parity matrix complete, every `drop` justified and policy-checked
- Data migration tested from a real old-version install, including rollback
- Subscribers keep access through update, reinstall and restore
- Deep links, push and widgets still work
- Same listing, same IDs, same signing identity, staged rollout with a halt rule
- `readiness-report.mjs --strict` passes with `00-migration-plan.md` present
