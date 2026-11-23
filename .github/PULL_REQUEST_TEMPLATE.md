# Pull request

## What changed

<!-- One paragraph. Link the issue or name the eval case. -->

## Evidence

<!-- Paste the command and the result line. "Ran it locally" is not evidence. -->

- [ ] `node skills/mobile-app-factory/scripts/check-skill.mjs` — PASS, 0 errors
- [ ] `node skills/mobile-app-factory/scripts/run-evals.mjs --validate` — PASS
- [ ] Build/test command for any starter or example touched: <!-- command + result -->

## Rules

- [ ] No assertion was loosened to make a case pass; a failing case is fixed in the skill or the harness
- [ ] `SKILL.md` files are still under 12 KB / 300 lines; new detail went to `references/`
- [ ] New store rules live in `references/store-facts.md` with a source URL and `verified_on`
- [ ] The "Verified vs not verified" table only changed where a command or CI job actually ran
- [ ] No secrets, signing material, real store credentials or user data in the diff
