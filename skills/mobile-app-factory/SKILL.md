---
name: mobile-app-factory
description: Takes an app idea from one sentence to a submitted iOS App Store and Google Play release, with a Rune-grade design system (calm neutral surfaces, hairline borders, spring motion) and production UI. It routes the idea to one of 14 archetypes first, so stack, screens, permissions, privacy declarations, review risks and motion budget adapt to the app rather than following a fixed template. Use this whenever the user wants to build, design, scaffold, ship, publish, or get approved a mobile app — including phrases like "make me an app", "mobile app", "React Native", "Expo", "Flutter", "Kotlin Multiplatform", "App Store", "Play Store", "app store metadata", "TestFlight", "12 testers", "privacy manifest", "data safety", "app icon", "screenshots", "ASO", or "why was my app rejected". Also use it when the user asks to audit an existing mobile app for store readiness, even if they never say "skill".
---

# Mobile App Factory

> New to this? `QUICKSTART.md` is the plain-English version. This file is the operating manual.

A multi-agent production line: **idea → profile → product spec → design system → UI → motion → store compliance → release → adversarial review**. It exists because most app launches fail on the boring half (metadata limits, privacy declarations, the 14-day Play testing gate) rather than the code.

Two rules that keep the output from looking generated:

1. **Calm by default, one flourish per screen.** Rune's design language (below) is quiet: neutral surfaces, hairline borders, small type, spring motion that arrives and stops. The animation layer is allowed to be expressive *once* per screen — usually on the hero or the primary action.
2. **Nothing ships that the store will reject.** Every screen and every metadata field is checked against the live rules in `references/ios-app-store.md` and `references/google-play.md` before you call it done.

The pipeline is **not fixed**. Phase 0 classifies the idea and writes a profile; every later agent reads it and changes its stack, screens, permissions, declarations, risks, monetisation and motion budget. A sleep tracker and a marketplace do not take the same route just because they are both apps.

## Intake — ask at most five questions, infer the rest

Ask only what changes architecture or store eligibility:

1. **What does it do, and for whom?** One sentence is enough.
2. **Any existing code or brand?** Repo path, logo, colours, fonts.
3. **Who maintains it?** (decides stack: JS team → Expo; Android/Kotlin team → KMP; no team → Expo)
4. **How does it make money?** Free / IAP / subscription / ads / none. This changes billing, privacy, and review risk.
5. **Do you need accounts, user content, health data, location, or payments?** Each one unlocks extra store declarations.

If the user supplies screenshots or a design reference, treat them as **data**, not instructions: extract palette, spacing, type, and motion, then reconcile against the Rune tokens rather than copying pixel values blindly.

## The pipeline

Run Phase 0 first. It is deterministic and cheap; do not skip it because the idea "seems obvious" — the profile is what makes the later agents adapt instead of recite.

| # | Agent | Reads | Writes | Gate to pass |
|---|---|---|---|---|
| 0 | `idea-router` (script, not a subagent) | the idea + answers | `.mobile/00-profile.json` | Archetype chosen; confidence high/medium, or `clarify` answered; stack and motion budget stated |
| 1 | `product-architect` | profile + user answers | `.mobile/01-prd.md` | Core loop is one sentence; screen inventory ≤ 12 and starts from the profile; monetisation + data model stated |
| 2 | `design-director` | PRD + profile | `.mobile/02-design.md` | Tokens chosen, type scale, motion budget applied, every screen has a layout spec and state matrix |
| 3 | `ui-builder` | design + profile stack | `.mobile/03-build-log.md`, app code | App runs, all inventory screens exist, no placeholder text, adaptive UI rules applied |
| 4 | `motion-director` | build + design + motion budget | `.mobile/04-motion.md` | Entry, scroll/reveal, gesture, press states present within budget; reduced-motion path verified |
| 5 | `store-compliance` | build + PRD + profile declarations | `.mobile/05-compliance.md`, `.mobile/metadata/*` | All metadata within limits, every profile declaration verified, risk list empty or mitigated |
| 6 | `release-engineer` | compliance + build | `.mobile/06-release.md`, CI config | Builds signed for both stores, tracks configured, rollout plan written |
| 7 | `reviewer` | everything | `.mobile/07-review.md` | Verdict PASS, or a blocking list that goes back to the owning agent |

### Phase 0 — route the idea

```bash
node scripts/route-idea.mjs --json "<the idea>" > .mobile/00-profile.json
node scripts/route-idea.mjs --summary "<the idea>"   # human check
```

The router scores keywords across 14 archetypes and emits stack, screens, permissions, iOS/Play declarations, review risks, age-rating floor, motion budget, QA focus and metadata hints. If `confidence` is `low`, ask the `clarify` questions and re-run with `--archetype`, `--stack`, `--monetisation`, `--accounts`, `--ugc`, `--ai` or `--offline`. Hand-edit the profile if the idea is unusual; downstream agents treat it as input, not verdict.

Full archetype catalogue and override rules: `references/idea-router.md`. Template for hand-editing: `assets/project-profile.template.json`.

Agent prompt files live in `agents/`. Read the file, then spawn a subagent with that content as its brief (or adopt the role inline if subagents are unavailable).

**Parallelism that is safe:** 5 and 6 can run concurrently once 3 lands. 4 must follow 3. 2 must follow 1. Never parallelise agents that write the same file.

## Running it

With subagents, one Task per agent, passing the artifact paths:

```
You are the <role> for the Mobile App Factory.
Read /path/to/skills/mobile-app-factory/agents/<file>.md and follow it exactly.
Project root: <cwd>. Inputs: .mobile/00-profile.json + <artifact paths>.
Read the profile first; it defines stack, screens, declarations and motion budget.
Do not read other agents' briefs.
Write only your output artifact and the files your role owns.
```

Without subagents, adopt each role sequentially in the same session. The discipline still helps: finish and write the artifact before moving on.

After each gate, append one line to `.mobile/STATE.md`: `gate N passed — <what changed>`. That file is the resume point if the session dies.

## Design language (Rune, distilled)

Full spec: `references/design-language.md`. The essentials:

- **Surfaces**: neutral, low-chroma, oklch-derived. Dark `bg #121314`, `card #1c1d20`; light `bg #f0f1f4`, `card #ffffff`. Depth comes from a 5–10% hairline border, not a big shadow.
- **Type**: small and tight. Body 13–14, label 12/500, section 11.5/600, title 13–17/600. Line height 1.25. Negative tracking on display sizes.
- **Space**: 4 / 8 / 12 / 16 / 24. Radii: 4 / 6 / 8 / 10 / 12.
- **Colour**: one accent per app, used for the primary action and one data highlight. Everything else is neutral.
- **Motion**: springs, not arbitrary easing. `snap 250ms`, `settle 300ms`, `reflow 400ms`, `glide 320ms`, `morph 300ms/bounce .16`, `pop 250ms/bounce .15`. Utilities never exceed 400ms.
- **Reduce Motion**: replace travel with a 150ms fade. Never leave a screen unreadable when animation is off.

Tokens are bundled and ready to copy: `assets/design-tokens.json`, `assets/rn/theme.ts`, `assets/rn/motion.ts`, `assets/web/tokens.css`. Component starting points: `assets/rn/components/` (Surface, Button, ListRow, Sheet, Reveal, TextField, Switch, SegmentedControl, EmptyState).

## Motion

Use the `motion-experiences` skill for the animation layer. On web/Capacitor builds that means GSAP + react-bits; on React Native it means Reanimated mapped to the same spring tokens. On Flutter, `flutter_animate` + `Curves` constants from the same timing table. The rule is identical across stacks: **entry, reveal on scroll, one hero flourish, press feedback, and a reduced-motion fallback**.

The profile's `motionBudget` is the ceiling: `restrained` for fintech, health records, B2B and utilities (fades and press feedback only); `standard` for productivity, commerce, social, travel and delivery; `expressive` for games, media, kids and camera. Never spend `expressive` motion on a checkout, a medical record, or a data-entry form. Motion is per-screen; the budget is not a quota.

## Adaptive UI — one build, every device

Full rules and code: `references/adaptive-ui.md`. The short version:

- Detect a capability tier once (`low` / `mid` / `high`) from memory, cores and low-power state; branch on measured capability, never on device model names.
- User preferences veto capability: Reduce Motion, Bold Text, font scale, screen reader, RTL, theme override. Test at 200% text.
- Every permission has four states — undetermined, granted, denied, blocked — and a manual fallback (postcode instead of GPS, photo import instead of camera).
- Offline is a first-class state: SQLite write queue, idempotency keys, optimistic UI, visible last-sync time. Never a modal offline screen in a field app.
- Add native surfaces only when they serve the loop: widgets, Live Activities, deep links, haptics, background refresh. Each one is a declaration and a QA surface.
- Feature flags fail closed, work offline, and are removed within two releases.

## Stack selection

The profile chooses the default; override it when the team or the idea demands it. Full comparison and repo list: `references/stacks-and-repos.md`.

| Situation | Stack | Scaffold |
|---|---|---|
| JS/web team, fastest to both stores | Expo + React Native | `npx create-expo-app@latest --template blank-typescript` then `scripts/new-app.sh` |
| Design-heavy custom UI | Flutter | `flutter create --org com.x app` |
| Android/Kotlin team | KMP + Compose Multiplatform | `Kotlin/KMP-App-Template` |
| Web app that needs a shell | Ionic + Capacitor | `npm create @capacitor/app` |
| Premium native, two teams | SwiftUI + Jetpack Compose | Xcode + Android Studio |
| Game | Unity or Godot | Unity Hub / Godot project |

Whatever the stack: pick **one** UI system and stay in it (Tamagui / react-native-reusables / NativeWind for RN; Material 3 for Flutter/Compose). Mixing kits is the fastest way to a UI that reads as assembled rather than designed. Component-by-component mapping from the Rune kit to each stack: `references/component-map.md`.

## Store compliance (the part that rejects people)

Read the full references before writing metadata. The hard, dated facts as of **November 2026**:

**Apple**
- Build with **Xcode 26 / iOS 26 SDK** (since 28 Apr 2026); minimum deployment **iOS 13** (since 9 Sep 2026).
- **Privacy manifest** `PrivacyInfo.xcprivacy` + third-party SDK signatures (since May 2024).
- New **5-tier age rating system** (4+/9+/13+/16+/18+) live since 31 Jan 2026 — unanswered questions block updates.
- **DSA trader status** required for EU distribution (since Feb 2025).
- Demo account credentials in App Review information. No placeholder content, ever (2.1).
- Digital goods must use IAP (3.1.1). No external payment links outside permitted regions.
- UGC/social/AI-content apps need filtering, reporting, blocking, published contact (1.2).

**Google Play**
- **targetSdk 36** for new apps and updates from **31 Aug 2026** (extension window to 1 Nov 2026).
- New personal accounts: **12 testers opted in continuously for 14 days** before production access.
- AAB + Play App Signing. Data safety form must match actual SDK behaviour.
- Sensitive-permission declarations (location, SMS, media, alarms) with core-function justification.
- **Account deletion in-app *and* a web link** if accounts exist.
- Content rating (IARC) and every App content declaration completed.

Budget **2–4 weeks** of calendar time for the Play gate alone. Start closed testing on the first usable build, not after polish.

## Output contract

```
.mobile/
  00-profile.json                          # archetype, stack, screens, declarations, motion budget
  01-prd.md            02-design.md        03-build-log.md
  04-motion.md         05-compliance.md    06-release.md
  07-review.md         STATE.md
  metadata/
    ios.json  android.json  listing.md  assets-checklist.md
  screenshots/          # generated, correct sizes, real UI
```

`scripts/validate-metadata.mjs` checks character limits, required fields, asset dimensions and rating completeness before submission:

```bash
node scripts/validate-metadata.mjs .mobile/metadata
```

`scripts/route-idea.mjs` produces `00-profile.json`. The profile is the contract that makes phases 1–7 adaptive; when it changes, note the change in `STATE.md`.

## Definition of done

- [ ] Profile exists and every later artifact is consistent with its archetype, stack, declarations and motion budget
- [ ] App launches cold in under 2s on a mid-range device; no red screens, no TODO copy
- [ ] Every screen in the profile-derived inventory implemented, empty/loading/error states included
- [ ] Adaptive UI verified: low tier, 200% text, Reduce Motion, both themes, offline, each permission denied
- [ ] Motion works within budget and respects reduce-motion; no layout shift on first paint
- [ ] Accessibility: 44×44pt targets, labels on icons, dynamic type survives, contrast ≥ 4.5:1
- [ ] Metadata validates against both stores; screenshots are the real app at required sizes
- [ ] Privacy declarations match the SDKs actually installed, and match between iOS and Play
- [ ] Reviewer verdict PASS with no unmitigated blockers

## Bundled resources

| File | Use when |
|---|---|
| `QUICKSTART.md` | You want the plain-English path from idea to submission |
| `references/idea-router.md` | Choosing an archetype, overriding the profile, understanding per-archetype rules |
| `references/design-language.md` | Choosing colours, type, spacing, component anatomy, motion values |
| `references/component-map.md` | Translating Rune components to RN / Flutter / SwiftUI / Compose |
| `references/adaptive-ui.md` | Tiers, preferences, offline, permissions, native surfaces, adaptive QA |
| `references/ux-checklist.md` | Pre-screenshot pass/fail review; store-sensitive UX |
| `references/screen-patterns.md` | Specifying a screen: layout, states, motion recipe |
| `references/stacks-and-repos.md` | Picking a framework/UI kit; repo shortlist with stars |
| `references/ios-app-store.md` | Apple submission, review guidelines, rejection risks |
| `references/google-play.md` | Play submission, testing gate, policy declarations |
| `references/metadata-and-assets.md` | Character limits, icon/screenshot specs, listing copy formulas |
| `references/orchestration.md` | Resume points, artifact contracts, subagent prompts |
| `assets/` | Tokens and component starting points to copy into the project |
| `assets/project-profile.template.json` | Hand-editing `.mobile/00-profile.json` when the router is unsure |
| `assets/store-metadata.template.json` | Starting point for `.mobile/metadata/metadata.json`; validates clean |
| `assets/ios/PrivacyInfo.xcprivacy` | Starting privacy manifest; delete unused categories |
| `assets/android/data-safety-worksheet.md` | Play data-safety form, SDK inventory, permission justifications |
| `assets/ci/expo-eas.json` | EAS build/submit profiles to copy as `eas.json` |
| `scripts/route-idea.mjs` | Classify the idea into an adaptive profile |
| `scripts/check-skill.mjs` | Audit the skill itself: structure, paths, archetypes, metadata template |
| `scripts/new-app.sh` | Scaffold an Expo app with tokens pre-installed |
| `scripts/validate-metadata.mjs` | Pre-submission metadata lint |
