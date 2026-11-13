# What's inside

[← back to the README](../README.md)

```
skills/mobile-app-factory/
  SKILL.md                     pipeline, intake, preview gate, gates, definition of done
  QUICKSTART.md                idea → submission, without the jargon
  agents/01..07-*.md           7 role briefs, one per phase
  references/                  18 deep references (router, archetypes, design, stores,
                               store facts, native release, testing, gap closure, ...)
  assets/
    project-profile.template.json    hand-editable .mobile/00-profile.json
    design-tokens.json               platform-neutral tokens
    android/project/                 buildable Kotlin + Compose Gradle starter
                                     (incl. the Gradle wrapper — no Gradle install needed)
    android/data-safety-worksheet.md Play data-safety form + SDK inventory
    ios/project/                     buildable SwiftUI + XcodeGen starter
    ios/PrivacyInfo.xcprivacy        privacy manifest starter
    rn/theme.ts  rn/motion.ts        React Native tokens (prototype path only)
    rn/components/                   9 primitives: Surface, Button, ListRow,
                                     Sheet, Reveal, TextField, Switch,
                                     SegmentedControl, EmptyState
    web/tokens.css                   web / Capacitor tokens + primitives
    ci/android-release.yml           native Android CI: lint, test, signed AAB
    ci/ios-release.yml               native iOS CI: test, archive, TestFlight hook
    ci/expo-eas.json                 EAS build/submit profiles (prototype only)
    store-metadata.template.json     validates clean out of the box
  scripts/
    questionnaire.mjs                requirements intake → intake + profile + STATE
    route-idea.mjs                   deterministic idea → profile classifier (--fast skips the gate)
    generate-preview.mjs             illustrative preview + exportable feedback
    review-preview.mjs               change requests / approval → regenerate preview
    scaffold-native.mjs              copy native starter, substitute package/bundle id
    readiness-report.mjs             AI-fixable vs human/external gap report
    check-skill.mjs                  self-audit + end-to-end pipeline smoke test
    run-evals.mjs                    trigger + quality eval runner
    new-app.sh                       scaffold native Android/iOS (Expo explicit only)
    new-android-app.sh               full Android project + docs + CI starter
    new-ios-app.sh                   full iOS project + docs + Fastlane + CI starter
    validate-metadata.mjs            zero-dependency store metadata linter
  evals/
    trigger.json                     20 prompts, 10 should trigger / 10 should not
    quality.json                     cases with machine-checkable assertions
    prompts.md                       the original manual prompt list

skills/motion-experiences/
  SKILL.md
  references/                    react-bits-catalog, gsap-recipes, mobile-motion, native-motion
  assets/                        gsap-setup.ts, ScrollReveal.tsx
  evals/                         trigger.json, quality.json, prompts.md

motion-demo/                     React 19 + Vite reference page
promo/                           source for the banner, the promo video and the preview shot
docs/                            rendered artwork, plus the long-form README pages
.github/workflows/audit.yml      self-audit on Linux, macOS and Windows, plus native builds
.github/workflows/evals.yml      on-demand trigger and quality evals
.gitattributes                   LF everywhere; gradlew stays executable-safe, *.bat CRLF
RESEARCH-mobile-app-2026.md      the dated research behind the store rules
install.sh                       install both skills globally
```

## Run the reference page

[`motion-demo/`](../motion-demo) is a working React 19 + Vite page that exercises both skills: a GSAP hero timeline, SplitText headline, pinned scrubbed section, batched scroll reveals, count-ups, and a magnetic/spark CTA — with a full reduced-motion path.

```bash
cd motion-demo
npm install
npm run dev
```
