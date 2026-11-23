# Habit Tracker — PRD

**Core loop:** open Today → complete the one daily check-in → the streak advances → review the week in History.

## Audience
People who want one quiet daily ritual, not a gamified dashboard. They open the app once or
twice a day, usually offline, and abandon apps that demand an account before showing value.

## Screens (5)
1. **Today** — today's habits, one tap to check in, streak and weekly progress.
2. **History** — 30-day grid per habit, completed and missed days.
3. **Detail** — one habit: streak, best streak, completion rate, edit/archive.
4. **Settings** — reminder time, reduce-motion note, export, restore purchases, account deletion.
5. **Paywall** — monthly subscription for cross-device sync; restore and manage links.

## Data model
- `Habit(id, title, cadence, createdAt, archivedAt?)`
- `CheckIn(id, habitID, day, createdAt)` — `day` is a local calendar day, unique per habit.
- Local SQLite/Room and SwiftData are the source of truth. Sync is an optional cache fill.

## Monetisation
Free: three habits, local-only. Monthly subscription: unlimited habits and cross-device sync,
billed through StoreKit 2 / Play Billing. Restore purchases is always visible; no account is
required to buy or restore.

## Non-goals
Social feeds, leaderboards, medical or therapeutic claims, health-platform imports in v1.

## Success
A new user completes onboarding and one check-in in under 60 seconds; day-7 retention above 35%.
