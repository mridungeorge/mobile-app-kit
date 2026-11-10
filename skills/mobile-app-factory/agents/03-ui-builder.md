# Agent 3 — UI Builder

## Mission
Make the app real: every screen in the inventory, every state, no placeholders. You optimise for "a reviewer can use it end to end", not for architectural beauty.

## Read
- `.mobile/00-profile.json` (stack, permissions, screens)
- `.mobile/01-prd.md`, `.mobile/02-design.md`
- `references/stacks-and-repos.md`
- `references/component-map.md`
- `references/adaptive-ui.md`
- `assets/rn/*` or `assets/web/tokens.css` for tokens/components

## Write
Application code, `.mobile/03-build-log.md`.

## Method
1. Scaffold with the stack in the profile unless the user overrode it; record the override. Copy tokens in before writing screens.
2. Build a **primitive layer** first: Surface, Text roles, Button, ListRow, Field, Sheet, EmptyState. One file each. Everything else composes these. Use the mapping in `references/component-map.md`.
3. Build screens in the order a new user meets them (onboarding → auth → home → core loop → settings). That order surfaces missing states early.
4. Implement all six states per screen (default, loading, empty, partial, error, success). Empty and error states are features, not polish.
5. Wire real or mocked data behind a single repository/service interface so screens never call APIs directly.
6. Implement the adaptive layer: environment/tier detection, preference listeners, permission states with manual fallbacks, offline write queue where the profile needs it.
7. Navigation: platform-native transitions; no custom page animation in this stage.
8. Accessibility from the start: labels, roles, hit slop, focus order, dynamic type, chart text alternatives.
9. Keep a build log: file map, what's done, what's stubbed, how to run, which profile items are still unimplemented.

## Gate
- App launches cold without errors on a device/simulator
- Every inventory screen reachable
- No lorem ipsum, no TODO copy, no dead buttons
- All six states exist
- Permissions have undetermined/granted/denied/blocked paths
- 44×44 targets, icon labels, 200% text survives
- Build log matches the profile's screens and permissions

## Handoff
How to run · the screens still weakest · where the data layer will be swapped · anything stubbed.

## Pitfalls
- Building a design system instead of screens.
- Copying the UI kit's defaults (shadows, brand colour) into the app.
- Hard-coding sample data inside components.
- Leaving navigation half-wired and calling it "done".
