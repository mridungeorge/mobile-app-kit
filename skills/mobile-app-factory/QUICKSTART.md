# Quickstart — idea to store listing without knowing the jargon

This skill turns one sentence into a designed, animated, store-ready mobile app. You do not need to know Expo, Xcode, Play Console, or what a privacy manifest is. You do need to answer a few questions honestly and run the commands it gives you.

## What you get

| Phase | Output | What it means in plain English |
|---|---|---|
| 0 | `.mobile/00-profile.json` | The app classified: stack, screens, permissions, store risks |
| 1 | `.mobile/01-prd.md` | What the app does, for whom, and what is deliberately out of scope |
| 2 | `.mobile/02-design.md` | Colours, type, spacing, every screen's layout |
| 3 | working app code | The actual screens, running on your machine |
| 4 | `.mobile/04-motion.md` | The animation layer, including the reduce-motion version |
| 5 | `.mobile/05-compliance.md` + metadata | Store forms, privacy answers, listing copy, screenshots |
| 6 | `.mobile/06-release.md` + CI | Signed builds and a rollout plan |
| 7 | `.mobile/07-review.md` | An adversarial pass/fail review before you submit |

## 1. Check the skill is installed

```bash
ls ~/.claude/skills/mobile-app-factory/SKILL.md
ls ~/.claude/skills/motion-experiences/SKILL.md
```

If either is missing, copy the folder into `~/.claude/skills/`. Both skills are global: they work in any project directory.

Run the built-in audit any time the skill is edited (or if Claude behaves oddly):

```bash
node ~/.claude/skills/mobile-app-factory/scripts/check-skill.mjs
```

It checks file structure, frontmatter, referenced paths, archetype vocabulary, the metadata template, and classifies eight sample ideas. `PASS` means the kit is internally consistent.

## 2. Start with one sentence

In Claude, say:

> Use the mobile-app-factory skill. Build **a sleep tracker that plays white noise and shows weekly trends**. I have no code yet, I'm a solo developer, and I want a subscription.

Claude will ask at most five questions, then classify the idea and run the seven phases. If you already have a repo or a logo, mention the path.

You can also run the classifier yourself before talking to Claude:

```bash
node ~/.claude/skills/mobile-app-factory/scripts/route-idea.mjs \
  "a sleep tracker that plays white noise and shows weekly trends"
```

It prints the archetype, stack, screen list, permissions, store risks, motion budget and metadata hints. Add `--summary` for the short version, `--json` for the machine version.

## 3. What to answer (and what you can skip)

Only these change the build:

1. **What does it do, and for whom?** One sentence.
2. **Any existing code or brand?** Path, logo, colours, fonts.
3. **Who maintains it?** JS team → Expo; Android team → Kotlin Multiplatform; nobody → Expo.
4. **How does it make money?** Free / one-time / subscription / ads / contract.
5. **Accounts, user content, health data, location, or payments?** Each unlocks store declarations.

Anything else can be inferred. If you do not care, say "you decide" and Claude picks the safe default.

## 4. Watch the gates, not the files

Each phase writes a file and passes a gate. You only need to intervene when a gate fails or a question is genuinely yours (brand colour, pricing, legal entity). The `.mobile/STATE.md` file records where it stopped, so a new session can resume:

```bash
cat .mobile/STATE.md
```

## 5. Run the app locally

For an Expo app (the default):

```bash
cd <app-folder>
npm install
npx expo start
```

Press `i` for the iOS simulator (macOS + Xcode), `a` for an Android emulator, or scan the QR code with Expo Go. If you have no simulator, Expo Go on a real phone is enough for design review.

To scaffold with the Rune tokens already installed:

```bash
~/.claude/skills/mobile-app-factory/scripts/new-app.sh my-app
```

## 6. Check the metadata before you touch a store

```bash
node ~/.claude/skills/mobile-app-factory/scripts/validate-metadata.mjs .mobile/metadata
```

It checks character limits, required fields, rating completeness, screenshot sizes, and the traps that cause rejections (missing account-deletion URL, missing privacy policy, placeholder copy). Fix every error; warnings are judgement calls.

## 7. The two dates that catch everyone

- **Apple**: builds must use the current SDK; the minimum iOS version rises over time. Check `references/ios-app-store.md` before your first submission — the values there are dated, not eternal.
- **Google Play**: a new **personal** developer account must run a closed test with **12 testers opted in for 14 continuous days** before production. Start that on the first usable build. It is calendar time you cannot compress.

Everything else (icons, screenshots, privacy answers, content rating) is a few hours of work if the build is honest about what it collects.

## 8. Add motion

The `motion-experiences` skill is separate so you can use it on any web or app project:

> Use the motion-experiences skill to add scroll and in-screen animation to this page. Keep it premium and respect reduced motion.

For React Native it maps GSAP ideas onto Reanimated springs; for web/Capacitor it uses GSAP + React Bits. The rule is the same: entry, one reveal, one hero flourish, press feedback, and a reduce-motion path.

## 9. Common problems

| Symptom | Fix |
|---|---|
| "Skill not found" | The folder must be `~/.claude/skills/mobile-app-factory/` with `SKILL.md` directly inside, not nested twice. |
| Router says `confidence: low` | Add the closest archetype explicitly: `--archetype fintech`, or answer its `clarify` questions. |
| App builds but looks generic | Re-read `references/design-language.md` and `references/component-map.md`; the usual cause is mixing two UI kits or using more than one accent. |
| Animation is janky | Check the device tier in `references/adaptive-ui.md`; drop blur/parallax and animate only transform/opacity. |
| Store rejects for "minimum functionality" | The app is too thin or too close to a website wrapper. Add native value: offline, notifications, widgets, camera, or real device data. |
| Store rejects for privacy | The declaration does not match the SDKs. Use the iOS `PrivacyInfo.xcprivacy` and the Play data-safety worksheet in `assets/`. |
| Play production is locked | The 12-tester/14-day gate has not elapsed. Keep testers opted in; do not remove the track. |
| Screenshots rejected | Wrong dimensions or device frames. `references/metadata-and-assets.md` has the exact sizes; use real UI, not mockups. |

## 10. What "done" means

An app is done when the seven gates pass and `07-review.md` says **PASS**. Not when it compiles. The reviewer checks the store-sensitive UX, the empty/loading/error states, accessibility, and whether the metadata matches the build. Expect one round of fixes after the first review — that is the process working, not failing.
