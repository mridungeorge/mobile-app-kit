# Routing: one idea, fourteen archetypes

[← back to the README](../README.md)

Phase 0 scores your idea against **14 archetypes** and writes the profile the whole pipeline reads:

`utility` · `health-fitness` · `social-ugc` · `commerce-marketplace` · `media` · `ai-assistant` · `fintech` · `kids-family` · `travel-maps` · `b2b-field` · `camera-photo` · `game` · `dating` · `delivery-logistics`

```bash
node skills/mobile-app-factory/scripts/route-idea.mjs \
  "a sleep tracker that plays white noise and shows weekly trends"
```

```
Archetype:   health-fitness (Health & fitness)   Confidence: high
Stack:       native — Kotlin + Jetpack Compose (Android) · Swift + SwiftUI (iOS)
Data:        Room / Core Data · Supabase
Screens:     onboarding-consent, today, log-entry, history, trends, detail,
             settings, export, paywall
Permissions: notifications, health-kit
Motion:      restrained        Age floor: 13+
Risks:       1.4.1 medical claims · 5.1.3 health data · Play health policy
```

The profile drives everything downstream — including what gets **skipped**. `accounts: false` removes auth screens and the account-deletion requirement; an empty `payments` array removes the paywall and billing QA; `ugc: false` removes report/block flows and the Apple 1.2 UGC block. Override any field by hand; the profile is an input, not a verdict.

Routing is a script, not a prompt, so the same idea always produces the same profile. The rules it applies are in [`references/idea-router.md`](../skills/mobile-app-factory/references/idea-router.md) and the per-archetype detail is in [`references/archetypes.md`](../skills/mobile-app-factory/references/archetypes.md).

If you already know what you are shipping, `route-idea.mjs --fast` skips the questionnaire and the preview gate, writes the same three artifacts, and records every inferred answer as an assumption for you to correct.
