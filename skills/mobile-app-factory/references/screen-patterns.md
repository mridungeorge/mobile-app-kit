# Screen Patterns

A library of the twelve screens almost every app needs, specified as layout + states + motion, using the tokens from `design-language.md`. Use these as the design-director's output format: one block per screen, no prose padding.

This is a **pattern library, not the inventory**. The inventory comes from `.mobile/00-profile.json`; use the blocks below for the screens the profile actually needs, and add the archetype-specific screens named in `references/idea-router.md`. If a profile screen has no block here, spec it from the closest pattern and note the difference.

## Contents
1. Onboarding
2. Auth
3. Home / dashboard
4. List + detail
5. Create / edit form
6. Search
7. Settings
8. Paywall
9. Empty / error / offline
10. Profile
11. Notifications
12. Modal sheet flow

---

## 1. Onboarding (3 panels max)

**Layout**: full-bleed surface; 60% visual (one accent gradient sweep or geometric mark), 40% content. Title 22/600, body 14/400 secondary, primary button pinned bottom with 16 gutter above safe area. Page dots as 6px circles, active 18×6 pill.

**States**: first-run only; skippable from panel 1; never re-shows after completion (store a flag).

**Motion**: panel transition `glide` horizontal; hero mark fades/scales from 0.96 on `drift` once; dots use `snap`.

**Copy rules**: title ≤ 6 words, body ≤ 20 words, benefit first, no feature list.

---

## 2. Auth (sign in / sign up)

**Layout**: logo 32, title 22/600, one field group, primary action, divider "or", 1–2 social buttons (44 height, hairline border). Terms + privacy line 11.5 secondary with real links.

**States**: idle, focus, validating, error (inline under field), loading (button spinner, disabled), success (navigate, no toast).

**Motion**: fields stagger 30ms on mount (`settle`); error appears with 4px slide + fade, field border → danger; no shake animation.

**Store note**: if you offer third-party login, iOS 4.8 requires an equivalent privacy option (Sign in with Apple). Include a demo account for review — mandatory.

---

## 3. Home / dashboard

**Layout**: large title (34/670 collapsing to 20/600), 24 gap, hero card (radius 12, accent at 8% or gradient sweep), then 2–4 sections with section header 11.5/600 + optional "See all". Bottom tab bar 49 + safe area, 3–5 tabs, icon 24 + label 10.

**States**: skeleton (3 pulses, `settle` 1.2s loop) on first load; stale data keeps previous content with a subtle 2px top progress bar; pull-to-refresh native.

**Motion**: hero `pop` on mount, sections `settle` with 40ms stagger; tab switch cross-fades content 150ms, no slide; pull-to-refresh uses native control.

---

## 4. List + detail

**Layout**: grouped list in one card; rows 56 min height; section headers 11.5/600 uppercase secondary with 8 top / 4 bottom. Detail: large media 16:9 radius 12, title 22/600, meta row 12 secondary, body 14/1.45, sticky action bar.

**States**: list empty (see §9), loading skeleton rows, error retry card, detail loading with hero placeholder to avoid layout shift.

**Motion**: row press = `press` overlay instantly; push transition = platform native (iOS slide, Android shared-axis); hero image shared-element transition if the stack supports it; otherwise fade 150ms.

**Perf**: virtualise over ~30 rows; images with `contentFit: cover` + blurhash/thumb; never animate row mount after the first screen.

---

## 5. Create / edit form

**Layout**: title, grouped fields, sticky bottom action with keyboard-aware offset. Field 44 height, labels above, helper text 11.5, character counter right-aligned when near limit.

**States**: pristine, dirty, validating, submitting, success, failure (preserve input). Destructive cancel requires confirm sheet if dirty.

**Motion**: keyboard avoidance uses platform animation, not a custom spring; save success = button morph to check (`morph`) then dismiss.

---

## 6. Search

**Layout**: search field in sticky header, 40 height, radius 8, leading icon, clear button. Recent searches as chips; results as list rows with query highlight (accent at 20% background, not coloured text).

**States**: idle (recent), typing (debounced 300ms), loading (3 skeleton rows), empty (query-specific copy), error.

**Motion**: results fade in 120ms; no per-row animation; expanding search field uses `snap`.

---

## 7. Settings

**Layout**: grouped sections; rows with icon 20, label, trailing value/chevron; toggles right-aligned. Destructive rows in danger colour, separated by 24 gap, require confirm.

**States**: optimistic toggles (flip immediately, revert on failure with toast); version row shows build number.

**Motion**: toggle `snap`; row press overlay; section collapse `reflow`.

**Store note**: account deletion must be reachable here (both stores). Privacy policy link also lives here.

---

## 8. Paywall

**Layout**: hero benefit (3 bullets max, icon + 13/500), plan cards (monthly/annual, annual marked "Save X%"), primary CTA, restore purchases link, terms + privacy. Price 20/670 with period 12 secondary.

**States**: loading products, purchased (dismiss), pending, failed (retry), restored (toast).

**Motion**: one flourish only — the selected plan card scales 1.02 with `pop` and border → accent. No confetti.

**Store note**: digital goods must use StoreKit/Play Billing. No external purchase links outside permitted regions (US external link entitlement, EU DMA). Restore purchases is mandatory.

---

## 9. Empty / error / offline

**Empty**: geometric mark 96 in accent 12%, title 15/600, one line 13/400 secondary, one action. Never a stock illustration.
**Error**: same structure, danger icon, message says what happened + what to do, retry button.
**Offline**: banner under header (card fill, 32 height, 12/500) + stale content, not a blocking screen.

**Motion**: fade 150ms; banner slides down 8px (`settle`).

---

## 10. Profile

**Layout**: avatar 72, name 17/600, handle/email 12 secondary, stats row (3 max, tabular numerals), grouped actions, sign out ghost. Edit via sheet, not a new screen.

**States**: signed-out state with sign-in CTA; avatar fallback = initials on accent 12%.

**Motion**: avatar press scale 0.97; sheet = `glide`.

---

## 11. Notifications

**Layout**: grouped by day ("Today", "Earlier"), unread dot 6 accent, row 64, swipe actions (mark read, delete). Header action "Mark all read".

**States**: permission denied → explain + deep link to settings (never a dead end); empty state.

**Motion**: swipe delete uses `instant` follow + `settle` collapse; unread dot fades when read.

**Store note**: push permission is asked in context, after value is shown; iOS requires `NSUserNotificationUsageDescription`-style clarity in the pre-prompt.

---

## 12. Modal sheet flow

**Layout**: detents (medium 50%, large 90%), grabber, sticky footer action. Content scrolls inside the sheet, header stays.

**Motion**: enter `glide`, exit `glideExit`, scrim fades 200ms, drag is velocity-aware and interruptible. Nested sheets stack with 8px inset + 0.96 scale on the one behind.

**States**: dirty-dismiss confirm; keyboard raise keeps footer above keyboard.

---

## Screen inventory discipline

- 12 screens is the ceiling for v1. If the PRD needs more, cut scope, not quality.
- Every screen must declare: purpose, entry points, primary action, empty/loading/error state, and its motion recipe.
- If two screens share >70% layout, they are one screen with a mode.
