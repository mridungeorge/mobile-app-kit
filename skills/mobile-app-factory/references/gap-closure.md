# Gap closure — what the factory automates, and what only a human can do

The promise is **idea → publish-ready**, with no silent gaps. That is not the same as
"no human involvement". This page is the honest boundary, and the rule the agents follow:

> **If an AI can do it with files and commands, do it — do not ask the user to.**
> **If it needs an account, a secret, a physical device, or a store decision, stop and hand off with exact instructions.**

Run the machine-readable version at any point:

```bash
node scripts/readiness-report.mjs --dir .mobile
node scripts/readiness-report.mjs --dir .mobile --strict   # exit 1 while AI items are missing
```

---

## 1. The boundary

| Stage | Artifact / action | Who | Notes |
|---|---|---|---|
| Q | Questionnaire intake | **AI** | `scripts/questionnaire.mjs` |
| 0 | Archetype profile | **AI** | `scripts/route-idea.mjs`, deterministic |
| P | Illustrative preview + approval | **AI + user decision** | AI generates; the user approves or requests changes |
| P | Apply change requests, re-route, regenerate | **AI** | `scripts/review-preview.mjs` |
| 1 | PRD, scope, screen inventory | **AI** | `.mobile/01-prd.md` |
| 2 | Design system + per-screen specs | **AI** | `.mobile/02-design.md` |
| 3 | Native project + screen implementation | **AI** | Android Kotlin/Compose, iOS SwiftUI; `scripts/scaffold-native.mjs` |
| 3 | Unit/UI test files | **AI** | Write tests for new logic and screens |
| 4 | Motion implementation + reduce-motion path | **AI** | `.mobile/04-motion.md` |
| 5 | Privacy manifest, data-safety answers, metadata copy, content rating | **AI** | Must match the SDKs actually shipped |
| 5 | Privacy policy / terms legal review | **Human** | AI drafts; a human/legal owner publishes |
| 6 | Signed AAB / Archive | **Human + CI** | Needs keystore/certificates and account access |
| 6 | Store listing upload, TestFlight, tracks | **Human** | Store APIs need account credentials |
| 7 | Adversarial review | **AI** | `.mobile/07-review.md` |
| 7 | Real-device QA, accessibility feel | **Human** | Simulators do not catch everything |
| — | Apple/Google developer accounts, agreements, tax, banking | **Human** | Cannot be created by an agent |
| — | Google Play 12 testers × 14 continuous days | **Human + calendar** | Cannot be compressed |
| — | Store review and appeals | **Human** | Requires the account holder |

---

## 2. Things an AI must never hand back to the user

These are file-level jobs. Do them in the same session; do not ask.

- Character-limit, screenshot-size and required-field failures → fix the copy/assets and re-run `validate-metadata.mjs`.
- Privacy manifest or data-safety answers that do not match the SDK list → reconcile to the real dependency list.
- Missing empty / loading / error / offline / permission-denied states → implement them.
- Placeholder copy, lorem ipsum, TODOs in user-visible strings → replace with real copy.
- Missing accessibility labels, 44pt targets, contrast failures → fix them.
- Missing unit tests for pure logic, or a build that does not compile → fix and run the build.
- Broken internal references, stale dates, inconsistent stack claims in docs → fix the docs.
- Preview/profile drift after a change request → re-route, regenerate the preview, update `STATE.md`.
- Any check the agent can run (`lint`, `test`, `assembleDebug`, `xcodebuild`, `validate-metadata`, `readiness-report`) → run it and act on the result.

## 3. Things an AI must not fake

Never claim any of these happened without evidence:

- A signed build, an uploaded build, a TestFlight build, a Play release.
- Passing store review, or a live listing.
- A developer account, a verified identity, a tax/banking setup.
- A privacy policy being legally sufficient.
- Real-device testing you did not perform.
- The 12-tester/14-day gate being satisfied.

If a credential is missing, stop at the gate with the exact file/secret needed and the command that will use it.

---

## 4. Handoff format

When you hit a human-only step, write it into `.mobile/STATE.md` and the review artifact:

```markdown
BLOCKED (external) — iOS signing
Needed: App Store Connect API key (.p8), key id, issuer id; Team ID
Where it goes: CI secret ASC_KEY / ASC_KEY_ID / ASC_ISSUER_ID
Then run: fastlane beta
Owner: account holder
```

That is a complete handoff: what, where, command, owner. "You need to sign it" is not.

---

## 5. Definition of publish-ready

`readiness-report.mjs --strict` passes **and** every human item has an owner and a status.
The report is the single source of truth — it is generated from the actual files, not from memory.
