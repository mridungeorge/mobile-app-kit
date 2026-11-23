# The ten rejections that actually happen

Each play names what the reviewer sees, the evidence that clears it, and where the dated rule
lives. Rule numbers come from `store-facts.md`; verify the row before quoting it to a user.

## 1. "We could not evaluate your app" (2.1, demo account)
Reviewer cannot get past a login or a paywall. **Evidence:** a reviewer account in the notes field
for both stores, seeded with realistic data, no MFA prompt, no SMS code. **Fix:** a demo path that
skips onboarding, or a built-in demo mode. Fintech and B2B profiles list this risk by default.

## 2. "Minimum functionality" / repackaged website (4.2)
The app is a web wrapper or too thin. **Evidence:** native interactions used for a real job (camera,
offline data, notifications), not just a WebView around a marketing site. **Fix:** drop Capacitor
for a content-only wrapper, or add the native capability the job needs.

## 3. Missing UGC controls (1.2)
A feed, comments, chat or AI output with no filter/report/block path. **Evidence:** report and block
reachable from every piece of content, a published moderation contact, and a response timeline.
**Fix:** ship the controls before the feature; route-idea adds `ugc-1.2` when it sees sharing.

## 4. Account deletion missing (5.1.1(v))
The app creates accounts but deletion is support-email only. **Evidence:** an in-app path plus a web
URL declared in Play data safety. **Fix:** delete or anonymise the account and its data, and clear
the token and local cache. Verify with `check-store-compliance.mjs`.

## 5. Wrong payment path (3.1.1)
Digital content unlocked outside IAP, or no visible restore. **Evidence:** StoreKit 2 / Play Billing
for digital goods, restore purchases on the settings screen, and a receipt-validation path.
**Fix:** external payment links only where the store's current rules allow them; never assume.

## 6. Background mode without a reason (2.5.2)
Background audio or location declared but not core to the app, or the reason is vague. **Evidence:**
a user-visible feature that stops working without the mode, a purpose string that names the specific
job, and a battery/denial test. **Fix:** remove the mode or narrow it (when-in-use instead of always).

## 7. Spam or saturated clone (4.3)
A template game or a thin clone with no differentiation. **Evidence:** a specific audience, a
distinct loop, and original assets. **Fix:** do not submit; change the product. Games route to Unity
with `4.3-spam` in the risk list for this reason.

## 8. Kids Category and child data (1.3, 5.1.4)
Third-party analytics or ads in a child experience, an external link without a gate, or a privacy
policy that does not cover children. **Evidence:** no ad SDK in the child surface, a parental gate on
external links, and data minimisation. **Fix:** use the Kids Category rules in `store-facts.md`; the
`kids-family` profile switches the declarations and removes analytics by default.

## 9. Privacy manifest / data safety mismatch (Apple manifest, Play data safety)
An SDK is linked but not declared, or the manifest names data the app does not collect. **Evidence:**
`reconcile-declarations.mjs` passes, `PrivacyInfo.xcprivacy` lists each SDK's data, and Play data
safety matches the dependency list. **Fix:** declare or remove the SDK; do not copy a template.

## 10. Misleading metadata or screenshots (2.3)
Screenshots show features that do not exist, the subtitle overpromises, or the age rating is wrong.
**Evidence:** screenshots captured from the submitted build, copy that names a real screen, and an
age rating that matches the content questionnaire. **Fix:** regenerate from the build; the example
keeps honest screenshots in `metadata/` and CI captures them.

## Using this list

The readiness report and `route-idea.mjs --explain` name which of these apply before build. After
build, `check-store-compliance.mjs` checks the mechanical ones (manifest, data safety, target API,
16 KB pages, deletion, restore, screenshot sizes). The judgement ones (2.1, 4.2, 4.3, 2.3) need a
human review of the actual build.
