# Orchestration

How the router and seven agents hand off, how to resume, and how to run this with or without subagents.

## Contents
1. State machine
2. Artifact contracts
3. Subagent prompt template
4. Parallel rules
5. Failure handling
6. Resume

---

## 1. State machine

```
INTAKE → PROFILE → PRD → DESIGN → BUILD → MOTION → COMPLIANCE ─┬→ RELEASE → REVIEW → DONE
                                                                └→ RELEASE (parallel)
```

Phase 0 is a script, not an agent: `node scripts/route-idea.mjs --json "<idea>" > .mobile/00-profile.json`. It runs before PRD and can be re-run for the same cost as editing a file. If `confidence` is `low`, answer its `clarify` questions or force an archetype before continuing.

Gate conditions are in `SKILL.md`. A gate fail returns to the owning agent, not forward. Cap loops at two attempts per gate; on the third, stop and report what's blocking rather than grinding.

Every transition appends to `.mobile/STATE.md`:

```markdown
# State
stage: BUILD
updated: 2026-11-10T09:12:00Z
profile: health-fitness (confidence high) — stack expo, motion restrained
gate1: passed — 9 screens, subscription model, no accounts
gate2: passed — neutral tokens, accent blue, 6 motion recipes
open:
  - waiting on API keys for map provider
next: motion-director
```

---

## 2. Artifact contracts

Each file is a contract: the next agent reads only these, not the whole conversation. Keep them short and specific.

**`00-profile.json`**
```
idea · archetype · secondary · confidence · clarify
coreLoop · stack {primary, ui, state, data, backend}
screens[] · dataSensitivity[] · permissions[] · accounts · ugc · aiGeneratedContent
payments[] · monetisation
ios {declarations[], ageRatingFloor, reviewRisks[]}
android {declarations[], contentRatingFloor, reviewRisks[]}
motionBudget · qaFocus[] · metadataHints · scores
```

**`01-prd.md`**
```
# <App>
One-liner · Audience · Problem · Core loop (one sentence)
Monetisation · Data model (entities + relations) · Integrations
Screen inventory (table: screen | purpose | primary action)
Profile deltas (screens added/cut vs 00-profile, with reason)
Out of scope (v1) · Risks (store-policy and technical)
```

**`02-design.md`**
```
# Design
Accent · Theme (light/dark) · Type overrides (if any)
Tokens (link to assets/design-tokens.json or inline diff)
Motion budget applied (from 00-profile) + how it constrains each screen
Per screen: layout spec (sections, order, spacing) · states · motion recipe
Component list (which kit components, which custom)
Accessibility notes · adaptive breakpoints
```

**`03-build-log.md`**
```
# Build
Stack + versions (from 00-profile, or the documented override) · Scaffold command · Folder map
Screens implemented (with file paths) · Known gaps
Adaptive UI implemented (tiers, permissions, offline) · Env vars / secrets needed
How to run
```

**`04-motion.md`**
```
# Motion
Budget (restrained | standard | expressive) and where it was spent
Token map (which spring for what, per platform)
Per screen: entry, reveal, gesture, press, exit
Reduced-motion behaviour · low-tier behaviour
Perf notes (which animations are on the UI thread)
```

**`05-compliance.md`**
```
# Compliance
Profile declarations verified (one line per declaration: present | missing | n/a)
Data inventory (what is collected, by which SDK, why)
iOS: privacy manifest entries, ATT yes/no, age rating, DSA, IAP
Android: data safety answers, permissions + justifications, declarations
Policy risks + mitigation · Open questions needing a human decision
```

**`06-release.md`**
```
# Release
Bundle IDs, signing, provisioning
CI pipeline (build → test → submit)
Store tracks and rollout plan
Calendar (the 14-day gate, review windows)
Rollback plan
```

**`07-review.md`**
```
# Review
Verdict: PASS | BLOCK
Blocking (owner: agent N) — evidence — fix
Non-blocking
Checklist results (SKILL.md definition of done + references/ux-checklist.md)
Profile consistency (does the build match 00-profile?)
```

---

## 3. Subagent prompt template

```
You are the {role} in the Mobile App Factory.

Read and follow exactly:
  /home/<user>/.claude/skills/mobile-app-factory/agents/{NN}-{role}.md
  /home/<user>/.claude/skills/mobile-app-factory/references/{relevant references}

Project root: {cwd}
Inputs: {absolute paths to prior artifacts, always including .mobile/00-profile.json}
Output: write {artifact path} and any files your role owns. Nothing else.

Constraints:
- Read 00-profile.json first; it defines stack, screens, declarations and motion budget.
- Do not re-open the PRD unless a gate fails.
- Use the bundled tokens; do not invent a second palette.
- If a store rule matters, cite the reference file section.
- If the profile conflicts with the user's answers, stop and report the conflict; do not silently pick one.
- Finish by listing what the next agent must know in 5 lines.
```

Give each subagent only its inputs. A subagent that can read every artifact will re-litigate decisions and drift.

---

## 4. Parallel rules

Safe:
- `store-compliance` and `release-engineer` after BUILD (different files, different knowledge).
- Screenshot generation and metadata drafting.
- Per-screen UI work when the design spec is frozen.

Unsafe:
- Design before PRD (you will design the wrong screens).
- Motion before the screen exists (you will animate placeholders).
- Two agents writing the same metadata file.
- Review before compliance — it will re-do compliance's work badly.

---

## 5. Failure handling

| Failure | Response |
|---|---|
| Router confidence low | Ask the `clarify` questions; re-run with `--archetype`. Do not let PRD invent a vertical |
| Profile conflicts with user answers | User wins for business intent; profile wins for store mechanics. Record the delta in STATE.md |
| PRD gate fails (too many screens) | Cut scope with the user; do not silently drop features, and do not keep the profile's screens beyond the archetype ceiling |
| Design gate fails (no states) | Return to design-director with the missing screens listed |
| Build doesn't run | Stop the pipeline; fix before motion. Never animate a broken screen |
| Store rule unknown | Open the reference; if still unknown, say so and mark as an open question — do not guess policy |
| Reviewer blocks twice on the same item | Escalate to the user with evidence and two options |
| User changes scope mid-build | Re-run the router (cheap), then the PRD gate, then design for the delta only |

---

## 6. Resume

1. Read `.mobile/STATE.md`.
2. Re-read only the artifacts named as inputs for that stage.
3. Verify the artifact still matches reality (`git status`, does the app run).
4. Continue from the stage, not from the beginning.

If `.mobile/` is missing but code exists, run the reviewer first in audit mode to reconstruct stage and gaps.
