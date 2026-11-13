# Definition of done

The ship checklist. `references/gap-closure.md` explains which of these the factory can close
itself and which need a human; `scripts/readiness-report.mjs --strict` tests the file-level ones.

- [ ] Profile exists and every later artifact is consistent with its archetype, stack, declarations and motion budget
- [ ] Questionnaire completed and the preview approved in `.mobile/00-approval.json` (status `approved`, or `approved-fast` with its assumptions stated and accepted)
- [ ] `readiness-report.mjs --strict` passes: no AI-fixable item is left open
- [ ] App launches cold in under 2s on a mid-range device; no red screens, no TODO copy
- [ ] Every screen in the profile-derived inventory implemented, empty/loading/error states included
- [ ] Adaptive UI verified: low tier, 200% text, Reduce Motion, both themes, offline, each permission denied
- [ ] Motion works within budget and respects reduce-motion; no layout shift on first paint
- [ ] Accessibility: 44×44pt targets, labels on icons, dynamic type survives, contrast ≥ 4.5:1
- [ ] Metadata validates against both stores; screenshots are the real app at required sizes
- [ ] Privacy declarations match the SDKs actually installed, and match between iOS and Play
- [ ] Reviewer verdict PASS with no unmitigated blockers

## Why each line exists

| Check | The failure it prevents |
|---|---|
| Profile consistency | A generic 8-screen app that ignores the archetype it was routed to |
| Preview approval | Writing code the user never agreed to, then re-litigating every decision |
| Readiness report | Handing back "done" with a PRD that was never written |
| Cold start | A launch that feels broken on the mid-range device most reviewers use |
| Screen inventory | A demo path with four screens behind a store listing that promises twelve |
| Adaptive UI | A build that is unreadable at 200% text or blank with Reduce Motion on |
| Motion budget | Confetti on a banking screen, or a checkout that animates for 800ms |
| Accessibility | Rejection under 1.2/UGC, 4.2 minimum functionality and platform a11y guidance |
| Metadata | Character-limit rejections and screenshot mismatches, the two most common ones |
| Privacy parity | "No data collected" on iOS while the same build declares analytics on Play |
| Reviewer verdict | Shipping with an open blocker nobody owns |
