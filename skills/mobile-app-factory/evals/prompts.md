# Mobile App Factory — trigger and quality evals

Run each prompt in a fresh session. A pass means the skill activates **and** the output meets
the quality bar. Use these when editing `SKILL.md` or the references.

## Trigger set

| Prompt | Should activate? | Why |
|---|---|---|
| "I want to build a habit tracker app and put it on both app stores." | yes | build + publish |
| "How do I get my app through Google Play's testing requirement?" | yes | store gate |
| "Write App Store metadata for my recipe app." | yes | metadata |
| "My app got rejected under guideline 4.2, what do I change?" | yes | review |
| "Design the onboarding flow for an iOS app." | yes | design, mobile |
| "Which native stack should I use, Kotlin or Swift first?" | yes | stack selection |
| "Make me a logo for my bakery." | no | brand/design skill |
| "Fix this Python stack trace." | no | unrelated |

## Quality set

**1. One-paragraph idea → PRD**
> "A quiet app that helps me stop doomscrolling at night. Free, maybe a subscription later."

Pass:
- Asks no more than 5 questions or states assumptions
- One-sentence core loop
- ≤ 12 screens with a primary action each
- Names the store risk (accounts? screen-time API? health claims?)
- Writes `.mobile/01-prd.md`, not a chat essay

Fail:
- Designs 20 screens
- Skips monetisation
- Invents a backend without saying so

**2. Store-readiness audit**
> "Here's my app. Is it ready for the App Store and Play?"

Pass:
- Reads the dependency list before declaring privacy answers
- Checks Xcode 26 / iOS 26 SDK and targetSdk 36
- Checks the Play 12-tester/14-day gate and says the calendar cost
- Verifies account deletion (in-app + web) if accounts exist
- Runs `scripts/readiness-report.mjs --strict` and separates AI-fixable gaps from human/external ones
- Produces a blocker list with owners, not a vibe check

Fail:
- Says "looks good"
- Declares "no data collected" with analytics installed
- Forgets the demo account and privacy policy link

**3. Metadata lint**
> "Write and validate the store listing for Halcyon."

Pass:
- Runs `scripts/validate-metadata.mjs` and reports zero errors
- Name ≤ 30, subtitle ≤ 30, keywords ≤ 100, short description ≤ 80 with no CTA
- Screenshots use real sizes (1320×2868 iOS, 1080×1920 Android)
- Copy makes claims the build can demonstrate

**4. Design system drift**
> "Use Rune's design language for the settings screen."

Pass:
- One accent, neutral surfaces, hairline borders
- 4/8/12/16/24 spacing, 4–12px radii, 13–14px body
- Motion tokens named (`settle`, `glide`), reduce-motion path stated
- No glassmorphism, no rainbow gradients, no second font

**5. Idea routing — two ideas diverge**
> "Build a budgeting app that connects to my bank." then, in a fresh session, "Build a kids phonics and bedtime app."

Pass:
- First routes to `fintech`: 18+/Mature, financial declarations, restrained motion, SQLite encrypted, biometrics, no playful money animation
- Second routes to `kids-family`: Families/Kids Category, parental gate, no third-party analytics in the child experience, expressive-but-calm motion
- Both write `00-profile.json` before the PRD and reference it in later artifacts
- Neither recites the same generic stack/screens

Fail:
- Both get an identical generic template and a generic 8-screen list
- The kids app gets ads or crash analytics without a Families review
- The finance app gets a confetti/hero flourish

**6. Router override**
> "It's a social app for hikers, but it must work offline and have no accounts."

Pass:
- Runs `route-idea.mjs --no-accounts --offline` (or edits the profile)
- Keeps UGC declarations (report/block/moderation) despite no accounts
- Uses an offline queue and local identity, and states the moderation consequence
- Notes the delta from the default profile in `STATE.md`

**7. Adaptive UI audit**
> "Test this app on a low-end Android, with Reduce Motion on, at 200% text, and with location denied."

Pass:
- Names the tier rules (no blur/parallax/pinned scrub; fades only)
- Keeps all content visible under Reduce Motion
- Checks label wrapping and chart text fallbacks at 200%
- Shows a manual location fallback and the blocked-permission Settings path
- Reports file/screen evidence, not a general statement

**8. Intake → preview → approval loop**
> "I want a quiet sleep tracker with white noise and weekly trends. Build it."

Pass:
- Runs the questionnaire (or asks its questions), writes `.mobile/00-intake.json` + `00-profile.json`
- Generates `.mobile/preview/index.html` and asks for approval before writing code
- On "add a settings screen and drop the paywall", runs `review-preview.mjs` so the profile and preview both change
- Refuses to start Phase 1 until `00-approval.json` has `status: approved`
- Says which actions remain human (accounts, signing, devices, store upload)

Fail:
- Jumps straight to code with no preview
- Regenerates the preview but leaves the profile unchanged (drift)
- Claims the app is "published" or "approved by Apple/Google"

## Regression checks

After any edit to the skill, confirm:
- [ ] `node scripts/check-skill.mjs` passes (structure, paths, archetypes, metadata template, router smoke cases, pipeline smoke test, native template substitution)
- [ ] The metadata template validates: copy `assets/store-metadata.template.json` to a temp dir as `metadata.json`, then run the script
- [ ] All files referenced in `SKILL.md` exist
- [ ] The pipeline table and `agents/` filenames match
- [ ] `node scripts/route-idea.mjs --summary "<idea>"` returns a plausible archetype for the eight eval ideas: sleep, social, receipts, AI journal, kids tutor, marketplace, offline bird identifier, B2B field ops
- [ ] Every archetype name in `references/idea-router.md` exists in `ARCHETYPES` in the router script
- [ ] `node scripts/questionnaire.mjs --non-interactive --out <tmp> --idea "..."` writes intake + profile + STATE, and `--approve` unlocks the pipeline
- [ ] `node scripts/scaffold-native.mjs --platform android|ios` leaves no `__PLACEHOLDER__` tokens behind
- [ ] Dated store facts are still current (Apple upcoming requirements, Play target API)
