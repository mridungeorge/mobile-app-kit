# Quickstart — idea to store listing without knowing the jargon

This skill turns one sentence into a designed, animated, **native** app and takes it to
publish-readiness. You do not need to know Gradle, Xcode, Play Console, or what a privacy
manifest is. You answer a questionnaire, approve an illustrative preview, and the factory
does the rest — stopping only for things that need your accounts, money, or a physical device.

## What you get

| Phase | Output | What it means in plain English |
|---|---|---|
| Q | `.mobile/00-intake.json` | Your answers: idea, audience, platforms, data, permissions, money |
| 0 | `.mobile/00-profile.json` | The app classified: stack, screens, permissions, store risks |
| P | `.mobile/preview/index.html` + `00-approval.json` | An illustrative preview you approve or send back with changes |
| 1 | `.mobile/01-prd.md` | What the app does, for whom, and what is deliberately out of scope |
| 2 | `.mobile/02-design.md` | Colours, type, spacing, every screen's layout |
| 3 | `android/` or `ios/` project | A buildable native app, screens implemented |
| 4 | `.mobile/04-motion.md` | The animation layer, including the reduce-motion version |
| 5 | `.mobile/05-compliance.md` + metadata | Store forms, privacy answers, listing copy, screenshots |
| 6 | `.mobile/06-release.md` + CI | Signed release builds and a rollout plan |
| 7 | `.mobile/07-review.md` | An adversarial pass/fail review before you submit |

## 1. Check the skill is installed

```bash
ls ~/.claude/skills/mobile-app-factory/SKILL.md
ls ~/.claude/skills/motion-experiences/SKILL.md
```

If either is missing, copy the folder into `~/.claude/skills/`. Both skills are global:
they work in any project directory.

Run the built-in audit any time the skill is edited (or if Claude behaves oddly):

```bash
node ~/.claude/skills/mobile-app-factory/scripts/check-skill.mjs
```

It checks file structure, frontmatter, referenced paths, archetype vocabulary, the metadata
template, classifies eight sample ideas, and runs the intake → preview → approval pipeline
on a throwaway project. `PASS` means the kit is internally consistent.

## 2. Answer the questionnaire (start here)

```bash
node ~/.claude/skills/mobile-app-factory/scripts/questionnaire.mjs
```

It asks about the idea, audience, platforms, must-have features, accounts, data,
permissions, offline/backend needs, design, and timeline. It writes `.mobile/00-intake.json`,
`.mobile/00-intake.md`, and `.mobile/00-profile.json`.

If you already know the answers, run it non-interactively:

```bash
node ~/.claude/skills/mobile-app-factory/scripts/questionnaire.mjs --non-interactive \
  --idea "a sleep tracker that plays white noise" --platforms both --monetisation subscription
```

## 3. Approve the illustrative preview

```bash
node ~/.claude/skills/mobile-app-factory/scripts/generate-preview.mjs --dir .mobile
```

Open `.mobile/preview/index.html` in a browser. You will see:

- the app summary (idea, archetype, stack, monetisation, motion budget)
- every screen as an illustrative phone mockup with its purpose and required states
- an approval checklist, change-request box, add/remove screen controls, platform and pricing controls

Click **Download feedback.json**, save it to `.mobile/preview/feedback.json`, then run:

```bash
node ~/.claude/skills/mobile-app-factory/scripts/review-preview.mjs \
  --dir .mobile --from-feedback .mobile/preview/feedback.json
```

Or decide directly:

```bash
# approved — unlock the build
node ~/.claude/skills/mobile-app-factory/scripts/review-preview.mjs --dir .mobile --approve

# changes — applied to intake/profile and the preview is regenerated
node ~/.claude/skills/mobile-app-factory/scripts/review-preview.mjs \
  --dir .mobile --request-changes "Calmer home screen, add settings, drop the paywall" \
  --add-screen settings --remove-screen paywall
```

The preview is an **illustrative approval step** — screen structure, flow and tone — not the
final UI. Final screens are built natively with real states, accessibility and motion.

## 4. Do you need to answer anything else?

Only these change the build, and the questionnaire already covers them:

1. **What does it do, and for whom?**
2. **Any existing code or brand?** Path, logo, colours, fonts.
3. **Who maintains it?** Default: native SwiftUI + Compose. KMP for shared logic, Flutter for
   one custom-design codebase, Expo only if explicitly requested for a prototype.
4. **How does it make money?** Free / one-time / subscription / ads / none.
5. **Accounts, user content, health data, location, or payments?** Each unlocks store declarations.

If you do not care, say "you decide" and the factory picks the safe default.

## 5. Watch the gates, not the files

Each phase writes a file and passes a gate. You only need to intervene when a gate fails or a
question is genuinely yours (brand colour, pricing, legal entity). `.mobile/STATE.md` records
where it stopped, so a new session can resume:

```bash
cat .mobile/STATE.md
```

## 6. Build and run the app (production-native)

The scaffold generates a **buildable project**, not just a folder of notes:

```bash
# Android: Kotlin + Jetpack Compose, Gradle version catalog, Material 3, tests
~/.claude/skills/mobile-app-factory/scripts/new-app.sh native-android "Night Notes" com.example.nightnotes

# iOS: Swift + SwiftUI, XcodeGen project.yml, PrivacyInfo, XCTest
~/.claude/skills/mobile-app-factory/scripts/new-app.sh native-ios "Night Notes" com.example.nightnotes
```

Android:

```bash
cd "Night Notes/android"
gradle wrapper --gradle-version 8.13   # one-time
./gradlew :app:assembleDebug
```

iOS (macOS):

```bash
cd "Night Notes/ios"
brew install xcodegen && xcodegen generate && open *.xcodeproj
```

> **Not default:** Expo/Expo Go is a prototype option only (`./new-app.sh expo <name>` when
> explicitly requested). It is not the production-native path.

## 7. Check the metadata before you touch a store

```bash
node ~/.claude/skills/mobile-app-factory/scripts/validate-metadata.mjs .mobile/metadata
```

It checks character limits, required fields, rating completeness, screenshot sizes, and the
traps that cause rejections (missing account-deletion URL, missing privacy policy, placeholder
copy). Fix every error; warnings are judgement calls.

## 8. Know exactly what is left

```bash
node ~/.claude/skills/mobile-app-factory/scripts/readiness-report.mjs --dir .mobile --strict
```

This is the honest gap report. It checks the actual files and lists:

- **AI-fixable items** still open — the factory must close these, not hand them back.
- **Human / external actions** — developer accounts, signing, CI secrets, real devices,
  store uploads, review, and the Google 12-tester gate.

`references/gap-closure.md` explains the boundary and the handoff format.

## 9. The two dates that catch everyone

- **Apple**: builds must use the current SDK; the minimum iOS version rises over time. Check
  `references/ios-app-store.md` before your first submission — the values are dated, not eternal.
- **Google Play**: a new **personal** developer account must run a closed test with **12 testers
  opted in for 14 continuous days** before production. Start that on the first usable build.
  It is calendar time you cannot compress.

## 10. Add motion

The `motion-experiences` skill is separate so you can use it on any web or app project:

> Use the motion-experiences skill to add scroll and in-screen animation. Keep it premium and respect reduced motion.

For native apps it maps onto Compose animation APIs and SwiftUI springs; for web/Capacitor it
uses GSAP + React Bits. The rule is the same: entry, one reveal, one hero flourish, press
feedback, and a reduce-motion path.

## 11. Common problems

| Symptom | Fix |
|---|---|
| "Skill not found" | The folder must be `~/.claude/skills/mobile-app-factory/` with `SKILL.md` directly inside, not nested twice. |
| Scripts cannot be found | Run them from the skill folder, or use the absolute path `~/.claude/skills/mobile-app-factory/scripts/...`. |
| Router says `confidence: low` | Add the closest archetype explicitly: `--archetype fintech`, or answer its `clarify` questions. |
| Preview never approves | Run `review-preview.mjs --dir .mobile --approve`; Phase 1 is gated on `00-approval.json`. |
| Android build fails on `gradlew` | Run `gradle wrapper --gradle-version 8.13` once inside `android/`. |
| iOS project will not open | Run `xcodegen generate` inside `ios/` (macOS + XcodeGen required). |
| App builds but looks generic | Re-read `references/design-language.md` and `references/component-map.md`; the usual cause is mixing two UI kits or using more than one accent. |
| Animation is janky | Check the device tier in `references/adaptive-ui.md`; drop blur/parallax and animate only transform/opacity. |
| Store rejects for "minimum functionality" | The app is too thin or too close to a website wrapper. Add native value: offline, notifications, widgets, camera, or real device data. |
| Store rejects for privacy | The declaration does not match the SDKs. Use the iOS `PrivacyInfo.xcprivacy` and the Play data-safety worksheet in `assets/`. |
| Play production is locked | The 12-tester/14-day gate has not elapsed. Keep testers opted in; do not remove the track. |
| Screenshots rejected | Wrong dimensions or device frames. `references/metadata-and-assets.md` has the exact sizes; use real UI, not mockups. |

## 12. What "done" means

An app is done when:

1. the preview is approved,
2. the seven phase gates pass,
3. `readiness-report.mjs --strict` has no AI-fixable items left,
4. `07-review.md` says **PASS**, and
5. every human item has an owner and a status.

Not when it compiles. Expect one round of fixes after the first review — that is the process
working, not failing.
