# Metadata and Assets

Store listings are a constrained writing problem. Write to the limits, not around them, and never let a claim in the listing outrun the build.

## Contents
1. Limits at a glance
2. Listing copy formulas
3. Screenshot plan
4. Icon and feature graphic
5. The metadata JSON contract
6. Localisation

---

## 1. Limits at a glance

| Field | iOS | Android |
|---|---|---|
| Title | 30 | 30 |
| Subtitle / short description | 30 | 80 |
| Keywords | 100 (comma-separated, no spaces) | n/a (indexed from title + description) |
| Promotional text | 170 | n/a |
| Description | 4,000 | 4,000 |
| What's New | 4,000 | 500 (release notes) |
| Icon | 1024×1024 PNG, no alpha | 512×512 PNG, alpha, ≤ 1 MB |
| Hero | n/a (first screenshot does the job) | 1024×500 feature graphic, required |
| Screenshots | 6.9" iPhone required; 13" iPad if applicable | 2–8, 320–3840 px, 16:9–9:16 |
| Video | 15–30s preview, ≤ 3 | YouTube URL |

Character counts are **UTF-16 code units** on iOS and characters on Android — emoji and accented characters count more than once on iOS. The validator approximates with string length; if you're near a limit, cut.

---

## 2. Listing copy formulas

**Name (30)** — Brand + category noun. `Halcyon — Sleep Tracker` beats `Halcyon: the best sleep app ever`.
**Subtitle (30)** — The outcome, not the feature. `Fall asleep in 10 minutes`.
**Short description (80)** — One sentence: who it's for + what changes. No CTA, no claims.
**Keywords (100, iOS)** — 8–12 single words or short phrases, comma-separated, no duplicates of the name, no competitor brands, no plurals of the same word.
**Description** — First 3 lines are the hook (visible before "more"). Then: what it does, 3–5 benefits as short paragraphs, how it works in 3 steps, privacy sentence, support link. No ALL CAPS, no emoji unless brand-native, no testimonials you can't attribute.

**Example short description**
> `Track sleep, spot patterns, wake up at the right moment.` (57)

**Example description skeleton**
```
<One sentence outcome.>

WHY IT WORKS
• <benefit>
• <benefit>
• <benefit>

HOW IT WORKS
1. <step>
2. <step>
3. <step>

Your data stays on your device. <Privacy statement.>

Questions? <support email>
```

**What's New** — user-visible changes only. `Fixed a crash when exporting a PDF` is good; `Bug fixes and performance improvements` is noise and Apple has rejected builds for it when nothing else explains a version.

---

## 3. Screenshot plan

Six screenshots, same order on both stores, each answering one question:

1. **Value** — the core screen with a single headline overlay ("Sleep, decoded").
2. **Core loop** — the action the app exists for.
3. **Differentiator** — the thing competitors don't have.
4. **Trust** — privacy/offline/sync, stated plainly.
5. **Depth** — a secondary feature that proves it isn't a toy.
6. **Paywall or social proof** — optional; never fake ratings.

Rules:
- Real UI, real data, no lorem ipsum.
- One headline per image, ≤ 6 words, 40–56pt equivalent.
- Keep the device frame consistent across the set, or omit frames entirely.
- Localise the overlays for each store language; text baked into images is not auto-translated.
- Android: design for 1080×1920 baseline and check on a tall 20:9 device; the feature graphic is also the video cover.

---

## 4. Icon and feature graphic

**Icon**: one idea, one accent, no text, no gradient mesh, no drop shadow baked in. It must read at 48px in a search result and 1024px on the product page. Test it on both a light and dark home screen.

**Feature graphic (1024×500)**: brand mark + one line of value, safe margins 64px, no small text (it is cropped on some surfaces), no screenshots of UI inside it.

---

## 5. The metadata JSON contract

`scripts/validate-metadata.mjs` validates this shape. Keep it in `.mobile/metadata/ios.json` and `android.json`, or one `metadata.json` with both keys.

```json
{
  "ios": {
    "name": "Halcyon — Sleep Tracker",
    "subtitle": "Fall asleep in 10 minutes",
    "promotionalText": "",
    "keywords": "sleep,insomnia,alarm,bedtime,wind down",
    "description": "...",
    "whatsNew": "...",
    "supportUrl": "https://example.com/support",
    "privacyPolicyUrl": "https://example.com/privacy",
    "primaryCategory": "Health & Fitness",
    "ageRating": "13+",
    "demoAccount": { "username": "review@example.com", "password": "..." },
    "screenshots": ["1320x2868"],
    "icon": "1024x1024"
  },
  "android": {
    "appName": "Halcyon: Sleep Tracker",
    "shortDescription": "Track sleep, spot patterns, wake up at the right moment.",
    "fullDescription": "...",
    "contactEmail": "support@example.com",
    "privacyPolicyUrl": "https://example.com/privacy",
    "packageName": "com.example.halcyon",
    "targetSdk": 36,
    "icon": "512x512",
    "featureGraphic": "1024x500",
    "screenshots": ["1080x1920"],
    "declarations": {
      "dataSafety": true,
      "contentRating": true,
      "appAccess": true,
      "ads": true,
      "targetAudience": true,
      "accountDeletion": true
    }
  }
}
```

The validator errors on: missing required fields, over-limit strings, malformed URLs, screenshots with the wrong aspect ratio or too few, targetSdk < 36, and missing declarations.

---

## 6. Localisation

- Translate the **listing**, not just the app. The top three markets by revenue for most consumer apps are US, UK, DE/JP depending on category.
- Keywords are per-locale on iOS; do not paste the English list into every locale.
- Date/currency formatting must follow the device locale, not the store locale.
- Right-to-left: mirror layout, not icons with inherent direction (chevrons, playback).
- Screenshot text overlays need a per-locale pass; AI translation of short headlines is usually wrong in tone.
