# Idea Router — adapting the pipeline to the app in front of you

The factory is not a fixed script. Phase 0 classifies the idea and writes `.mobile/00-profile.json`; every later agent reads that profile and changes its stack, screen inventory, permissions, declarations, risk list, monetisation model, motion budget, and QA focus accordingly.

Two ways to produce the profile:

```bash
node scripts/route-idea.mjs "a sleep tracker that plays white noise and shows weekly trends"
node scripts/route-idea.mjs --json "marketplace for local dog walkers" > .mobile/00-profile.json
```

The router is deliberately deterministic — keyword and flag scoring, no model call — so the same idea always yields the same profile and the agents can be tested. You may override any field by hand; the profile is an input, not a verdict. When the idea is ambiguous, the router returns `confidence: "low"` and a `clarify` list; ask those questions before Phase 1.

## Profile shape

```json
{
  "idea": "…",
  "archetype": "health-fitness",
  "secondary": ["media"],
  "confidence": "high",
  "stack": { "primary": "native", "ui": "swiftui-compose", "state": "platform-state", "data": "sqlite-room-datastore", "backend": "supabase", "android": "kotlin-jetpack-compose", "ios": "swift-swiftui" },
  "screens": ["onboarding", "today", "log-entry", "history", "trends", "settings"],
  "dataSensitivity": ["health"],
  "permissions": ["notifications"],
  "accounts": true,
  "ugc": false,
  "aiGeneratedContent": false,
  "payments": ["subscription"],
  "ios": { "declarations": ["HealthKit", "privacy-manifest"], "ageRatingFloor": "13+", "reviewRisks": ["…"] },
  "android": { "declarations": ["health-connect", "data-safety"], "contentRatingFloor": "Teen", "reviewRisks": ["…"] },
  "motionBudget": "restrained",
  "qaFocus": ["…"],
  "metadataHints": { "subtitle": "…", "keywords": ["…"], "category": { "ios": "Health & Fitness", "android": "Health & Fitness" } }
}
```

`confidence` is `high` (one archetype dominates), `medium` (two plausible), or `low` (no clear match — treat as `utility` and clarify). `secondary` never overrides `primary`; it only adds declarations and screens.

## How each agent consumes the profile

| Agent | Uses the profile to… |
|---|---|
| 1 product-architect | start from the archetype's core loop and screen set instead of inventing one; size the inventory to the archetype's ≤ 12 ceiling |
| 2 design-director | pick the motion budget, density (data-dense vs calm), and which screen patterns apply |
| 3 ui-builder | choose stack, UI kit, state and persistence from `stack`; scaffold the native project (`scaffold-native.mjs`) and only the listed screens |
| 4 motion-director | cap flourish count and animation intensity by `motionBudget`; choose gesture vocabulary for the archetype |
| 5 store-compliance | copy `permissions`, `ios.declarations`, `android.declarations`, `reviewRisks`, `ageRatingFloor` into the compliance file and verify each one |
| 6 release-engineer | pick CI recipe (Gradle / Xcode Cloud / Fastlane), track plan, and whether a 14-day Play test is mandatory |
| 7 reviewer | run `qaFocus` as the test checklist; block on any unmitigated `reviewRisks` |

## Pipeline switches

Beyond the profile fields, these switches change what actually runs. Record every skip in `STATE.md`; a skipped phase is a decision, not a silent omission.

| Profile signal | Switch |
|---|---|
| `accounts: false` | Skip auth screens, account deletion flows, session refresh, and the "sign in with Apple" requirement |
| `payments: []` / `monetisation: "none"` | Skip the paywall screen, IAP/Play Billing setup, restore-purchases QA, and subscription metadata fields |
| `ugc: false` | Skip report/block/moderation screens and the 1.2 UGC review block (but keep content licensing checks if the app ships media) |
| `aiGeneratedContent: false` | Skip the AI disclosure, output-reporting control, provider data-sharing declaration, and prompt-injection QA |
| `stack.backend: "none"` | Skip API integration, auth proxy, and server-side rate limiting; keep local persistence and export |
| `motionBudget: "restrained"` | Phase 4 is a short pass: press feedback + entry fades + one progress reveal; no scroll timeline work |
| Existing codebase | Phase 3 becomes integration and gap-filling, not scaffolding; keep the existing stack unless a store rule forces a change |
| `monetisation: "contract"` | Skip consumer ASO and store billing; plan Managed Google Play / Apple Business Manager and a demo tenant instead |
| `secondary` includes `media` | Add licensing evidence and background-audio declarations even if the primary archetype is not media |

The reverse also applies: a single `ai: true` flag on a utility app must add the AI disclosure and reporting controls without turning the whole app into `ai-assistant`.

## Motion budgets

| Budget | Use for | Allowed |
|---|---|---|
| `restrained` | finance, health records, B2B, utilities, accessibility-first | press feedback, 150–300ms fades, one count-up or progress reveal. No parallax, no scroll-jacking, no autoplay loops. |
| `standard` | productivity, commerce, social feeds, travel | entry + stagger reveal, one hero flourish, gesture-driven transitions, haptic confirmations. |
| `expressive` | games, media, kids, creative tools, brand-led consumer | full GSAP timeline, pinned scrub sections, particle/glow effects, sound + haptics — still with a reduced-motion path. |

Never let `expressive` reach a checkout, medical record, or data-entry form. Motion is per-screen; the budget is a ceiling, not a quota.

## Archetypes

Fourteen archetypes, all defined in `scripts/route-idea.mjs` and documented in
`archetypes.md`. The router scores keywords and flags, picks the best match, and copies the
archetype's stack, screens, permissions, declarations, risks, motion budget and metadata hints
into the profile. Nothing here is prose the agent has to invent at run time.

| Archetype | Label | Motion | Age floor (iOS / Play) | Screens |
|---|---|---|---|---|
| `utility` | Utility / tool | restrained | 4+ / Everyone | 5 |
| `health-fitness` | Health & fitness | restrained | 13+ / Teen | 9 |
| `social-ugc` | Social / user-generated content | standard | 13+ / Teen | 10 |
| `commerce-marketplace` | Commerce / marketplace | standard | 4+ / Everyone | 12 |
| `media` | Media / content | expressive | 4+ / Everyone | 9 |
| `ai-assistant` | AI assistant | standard | 13+ / Teen | 8 |
| `fintech` | Finance / fintech | restrained | 18+ / Mature | 10 |
| `kids-family` | Kids / family | expressive | 4+ / Everyone | 7 |
| `travel-maps` | Travel / maps | standard | 4+ / Everyone | 8 |
| `b2b-field` | B2B / field operations | restrained | 18+ / Mature | 8 |
| `camera-photo` | Camera / photo | expressive | 4+ / Everyone | 7 |
| `game` | Game | expressive | 9+ / Everyone | 8 |
| `dating` | Dating / matching | standard | 18+ / Mature | 9 |
| `delivery-logistics` | Delivery / ride-hailing | standard | 18+ / Mature | 9 |

Read `archetypes.md` when you need the reasoning behind a row: the core loop, why the screen
set is that size, which declarations the vertical unlocks, and the review risks that recur.

## Overrides and combinations

- **Two archetypes** (e.g. health + social): primary drives the stack and motion budget; secondary contributes declarations and screens. Never stack two `expressive` budgets into a checkout.
- **Existing codebase**: skip scaffolding; keep the existing stack unless it cannot meet a store rule (e.g. no privacy manifest support). Record the deviation in `00-profile.json` under `stack.notes`.
- **Regulated verticals** (health, finance, kids, dating, delivery): add a legal-review line to `.mobile/05-compliance.md` and list the governing regime (HIPAA-adjacent, ASIC/AFSL, COPPA/GDPR-K, DSA, local transport licensing).
- **AI features inside a non-AI archetype**: add the `ai-assistant` declaration subset (disclosure, reporting, provider key handling) without changing the primary archetype.

## Worked examples

The point of the router is that these do **not** share a route:

| | Sleep tracker | Dog-walker marketplace | Kids phonics |
|---|---|---|---|
| Archetype | `health-fitness` | `commerce-marketplace` | `kids-family` |
| Stack | Kotlin/Compose + SwiftUI, Room/Core Data, Supabase | Native + StoreKit/Play Billing, Postgres, Shopify/Medusa | Kotlin/Compose + SwiftUI, Room/Core Data, no backend |
| Screens | today, log, trends, export | home, product, cart, checkout, orders | parent gate, child home, activity, parent dashboard |
| Permissions | notifications, HealthKit | notifications | none (parent notifications optional) |
| Declarations | HealthKit, privacy manifest, data safety | 3.1.1 payments, tracking, account deletion | Kids Category, Families, 5.1.4 |
| Age floor | 13+ / Teen | 4+ / Everyone | 4+ / Everyone with Families designation |
| Motion | restrained | standard, restrained at checkout | expressive but calm, no rapid flashing |
| Money | subscription | transaction fee | one-time or subscription behind a parent gate |
| Biggest risk | medical claims | wrong payment path | child data / ads |

If two ideas produce nearly the same profile, either they genuinely share an archetype or the keyword set is too thin. Fix the archetype or add keywords — do not let the pipeline flatten them.

## When the router is wrong

Fix the profile, not the pipeline. Edit `.mobile/00-profile.json`, note why in `STATE.md`, and continue. If a whole new vertical keeps appearing, add an archetype here and a keyword block in `scripts/route-idea.mjs` — keep both in sync; the eval suite checks that every archetype name is reachable.
