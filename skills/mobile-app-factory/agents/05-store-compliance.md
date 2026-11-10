# Agent 5 — Store Compliance

## Mission
Make submission boring. You own metadata, privacy declarations, content ratings, permissions, and the policy-risk register. You are the agent most likely to save the launch.

## Read
- `.mobile/00-profile.json` (declarations, permissions, age floors, risks)
- `.mobile/01-prd.md`, `.mobile/03-build-log.md`
- `references/ios-app-store.md`
- `references/google-play.md`
- `references/metadata-and-assets.md`
- `references/ux-checklist.md` §5
- The actual dependency list / SDK inventory from the build
- `assets/ios/PrivacyInfo.xcprivacy`, `assets/android/data-safety-worksheet.md`

## Write
`.mobile/05-compliance.md`, `.mobile/metadata/ios.json`, `.mobile/metadata/android.json`, `.mobile/metadata/listing.md`, `.mobile/metadata/assets-checklist.md`.

## Method
1. **Data inventory first**: for every SDK and every permission, what data leaves the device, to whom, for what purpose, retention, deletion. Use the data-safety worksheet; do not invent answers.
2. Walk the profile's declarations one by one: `present`, `missing`, or `n/a with reason`. A declaration cannot be skipped because the build "probably" does not need it — verify against the dependency graph.
3. Write metadata to the limits. Name/subtitle/keywords/short description first, then descriptions. Use `metadataHints` as a starting point but do not copy a hint that overclaims. Run `scripts/validate-metadata.mjs` until clean.
4. iOS: privacy manifest entries, required-reason APIs, ATT yes/no, age rating answers, DSA trader status, IAP/restore, demo account.
5. Android: data safety answers matching the inventory, permission declarations with core-function justification, content rating, target audience, app access, account deletion URL.
6. Cross-check iOS and Play: the same SDK must be declared on both sides; the age floors must be defensible for the same content.
7. Screenshot plan: six per store, real UI, correct dimensions, localised overlays.
8. Risk register: each profile risk + any new one, the guideline/policy, likelihood, mitigation, owner.
9. Flag every question that needs a human (legal claims, health claims, children's audience, regulated categories).

## Gate
- Metadata validates with zero errors
- Every profile declaration is present, or marked n/a with evidence
- Declarations cover every SDK and permission actually present, on both stores
- Demo credentials provided
- No claim in the listing that the build can't demonstrate
- Account deletion path exists in-app and on the web if accounts exist
- Age rating floors in the profile are met or raised with a reason

## Handoff
Three highest-risk items · any declaration you could not verify · the exact assets still missing.

## Pitfalls
- Copying a competitor's keywords (trademark risk).
- Declaring "no data collected" with analytics installed.
- Assuming the 14-day Play gate can be skipped for a personal account.
- Writing descriptions before the build is final, then not re-checking claims.
