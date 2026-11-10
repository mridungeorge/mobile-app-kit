# Mobile app kit — two global Claude skills + a motion demo

Two skills that work together, installed globally in `~/.claude/skills/`:

| Skill | Job | Trigger examples |
|---|---|---|
| **`mobile-app-factory`** | Idea → product spec → design → UI → motion → store compliance → release → review, with Rune's design language and dated Apple/Google rules | "make me an app", "App Store", "Play Store", "12 testers", "metadata", "why was my app rejected" |
| **`motion-experiences`** | Premium scroll and in-screen motion with GSAP + React Bits, mapped to Reanimated/Flutter/Compose | "add animations", "scroll effects", "premium feel", "React Bits", "GSAP" |

The design and motion languages are shared, so an app built with one feels consistent with the
other: one accent, neutral hairline surfaces, small type, springs that arrive and stop.

## Repository layout

```
skills/mobile-app-factory/   the build-and-ship skill (canonical copy)
skills/motion-experiences/   the GSAP + React Bits skill (canonical copy)
motion-demo/                 working React 19 + Vite reference page
RESEARCH-mobile-app-2026.md  the dated research report behind the skills
install.sh                   copy both skills into ~/.claude/skills/
```

## Install

```bash
git clone https://github.com/mridungeorge/mobile-app-kit.git
cd mobile-app-kit
./install.sh
```

The installer replaces `~/.claude/skills/mobile-app-factory` and
`~/.claude/skills/motion-experiences` with the versions in this repo, then runs the
skill self-audit. Set `CLAUDE_SKILLS_DIR` to install somewhere else.

## Try it

```bash
# In any project, ask Claude:
"Build a <your idea> with mobile-app-factory, then add motion with motion-experiences."

# Or run the reference page:
cd motion-demo
npm install
npm run dev
```

The demo is a Halcyon sleep-tracker landing page: GSAP hero timeline, SplitText headline,
pinned scrubbed "how it works", batched scroll reveals, count-ups, magnetic + spark CTA, and a
fully reduced-motion path.

## What is inside the mobile skill

```
~/.claude/skills/mobile-app-factory/
  SKILL.md                     the pipeline, intake, gates, definition of done
  QUICKSTART.md                plain-English path from idea to submission
  agents/01..07-*.md           one brief per role
  references/
    idea-router.md             14 archetypes: stack, screens, permissions, risks, motion budget
    design-language.md         tokens, type, components, motion, anti-patterns
    component-map.md           Rune kit → RN / Flutter / SwiftUI / Compose
    adaptive-ui.md             tiers, preferences, offline, permissions, native surfaces, QA matrix
    ux-checklist.md            pre-screenshot pass/fail list incl. store-sensitive UX
    screen-patterns.md         12 screens with states and motion recipes
    stacks-and-repos.md        Expo / Flutter / KMP / native / Capacitor + libraries
    ios-app-store.md           Apple rules, review risks, checklist
    google-play.md             Play rules incl. the 12-tester gate, checklist
    metadata-and-assets.md     character limits, screenshot plan, JSON contract
    orchestration.md           artifact contracts, subagent prompts, resume
  assets/
    project-profile.template.json   hand-editable .mobile/00-profile.json
    design-tokens.json         platform-neutral tokens
    rn/theme.ts motion.ts      React Native tokens + spring helpers
    rn/components/             Surface, Button, ListRow, Sheet, Reveal, TextField, Switch, SegmentedControl, EmptyState
    web/tokens.css             web/Capacitor tokens + primitives
    ios/PrivacyInfo.xcprivacy  starting privacy manifest
    android/data-safety-worksheet.md   Play data-safety + SDK inventory
    ci/expo-eas.json           EAS build/submit profiles (copy as eas.json)
    store-metadata.template.json
  scripts/
    route-idea.mjs             classify an idea into an adaptive profile
    check-skill.mjs            self-audit: paths, archetypes, metadata, router smoke tests
    new-app.sh                 scaffold Expo with tokens pre-installed
    validate-metadata.mjs      store metadata linter (zero dependencies)
  evals/prompts.md             trigger + quality test prompts
```

## What is inside the motion skill

```
~/.claude/skills/motion-experiences/
  SKILL.md
  references/
    react-bits-catalog.md      which component for which job
    gsap-recipes.md            copy-paste GSAP patterns
    mobile-motion.md           Reanimated / Flutter / Compose mapping
  assets/
    gsap-setup.ts              plugin registration, matchMedia helper
    ScrollReveal.tsx           drop-in reveal component
  evals/prompts.md
```

## Design decisions

- **Pipeline, not a mega-prompt.** Each of the seven agents reads only the previous artifact,
  so decisions do not get re-litigated and the output has receipts.
- **Adaptive before it is generative.** Phase 0 is a deterministic router, not a prompt. The
  same idea always yields the same profile, and every later agent changes its stack, screens,
  permissions, declarations, risks and motion budget from that profile. Fourteen archetypes,
  from fintech to kids to field ops. Override it with flags or hand-edit the JSON.
- **Store rules are dated.** Apple Xcode 26 / iOS 26 SDK, the 5-tier age ratings, Play targetSdk
  36, and the 12-tester/14-day gate are written with their effective dates, because these are
  what actually delay launches.
- **Motion has a budget.** Feedback → entry → reveal → one flourish → transition. The profile
  sets the ceiling: restrained for money/health/B2B, standard for productivity/commerce,
  expressive for games/media/kids. Reduced motion and low-tier fallbacks are branches, not flags.
- **One design language, every stack.** The Rune kit maps component by component to React Native,
  Flutter, SwiftUI and Compose (`references/component-map.md`), so the same screen spec builds
  anywhere instead of being re-invented per platform.
- **Vendored React Bits.** The demo copies components instead of hitting the registry at build
  time. Licence: MIT + Commons Clause v1.0, © 2026 David Haz (see `motion-demo/src/components/reactbits/NOTICE.md`).

## Coverage matrix

| Requirement | Where it is covered | Verified by |
|---|---|---|
| One sentence → buildable product | `SKILL.md` intake, `agents/01-product-architect.md` | evals quality 1 |
| Rune design principles, UI, animation | `references/design-language.md`, `assets/rn/*`, `motion-demo/` | evals quality 4; demo build |
| Dynamic adaptation to the idea | `references/idea-router.md`, `scripts/route-idea.mjs`, `.mobile/00-profile.json` | router run on 8 ideas; evals quality 5–6 |
| Runtime adaptation (device, text, motion, offline, permissions) | `references/adaptive-ui.md` | evals quality 7 |
| Component coverage across stacks | `references/component-map.md` | all `rune-kit` exports mapped |
| UI quality and states | `references/ux-checklist.md`, `assets/rn/components/` | checklist sections 1–9 |
| GSAP + React Bits motion | `motion-experiences/SKILL.md`, `references/gsap-recipes.md`, `references/react-bits-catalog.md` | demo build + headless run |
| iOS publication, metadata, approval | `references/ios-app-store.md`, `references/metadata-and-assets.md`, `assets/ios/PrivacyInfo.xcprivacy` | metadata validator; dated facts |
| Google Play publication, metadata, approval | `references/google-play.md`, `assets/android/data-safety-worksheet.md` | metadata validator; dated facts |
| Release engineering | `agents/06-release-engineer.md`, `assets/ci/expo-eas.json` | CI recipe review |
| Adversarial review before submission | `agents/07-reviewer.md`, `evals/prompts.md` | gate definition |
| Non-expert usability | `QUICKSTART.md` | plain-language pass |

## Known gap

The original request referenced an attached image ("can you implement any of these things")
that never arrived. Nothing in this kit was built from it; re-attach it to fold specific
screens or components in.
