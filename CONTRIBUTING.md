# Contributing

The kit is plain `SKILL.md` packages plus dependency-free Node scripts. Keep it that way: no build
step, no runtime dependency, and every claim backed by a command.

## Before you change anything

```bash
node skills/mobile-app-factory/scripts/check-skill.mjs
git status --short
```

`check-skill.mjs` must stay at zero errors. It checks structure, frontmatter, every referenced path,
archetype vocabulary, the metadata template, 30 router cases, the pipeline smoke test, the Expo
starter, store compliance and the README artwork.

## Rules

- **Size budget:** each `SKILL.md` stays under 12 KB and 300 lines. Move detail into
  `references/` and link it from the "Where the detail lives" list.
- **One source for store rules:** dates, fees, limits and guideline numbers belong in
  `references/store-facts.md` with a source URL and `verified_on`. Other files link to it.
- **Every artifact has a contract:** if you add a pipeline output, add the exact strings an agent
  must write to `references/artifact-recipes.md` and, where it is mechanical, a check in
  `scripts/lint-artifacts.mjs`.
- **No loosened assertions.** A failing quality case is fixed in the skill instructions or the
  harness, not by deleting the assertion. Record the classification (missing instruction, brittle
  assertion, timeout, model limit) in the commit message.
- **Examples are evidence.** If you add or change an example under `examples/`, run its documented
  commands and say in the README what was actually run. Do not turn a FAIL review into a PASS.
- **Honest status.** `README.md` has a "Verified vs not verified" table. Only move a row to Verified
  when a command or CI job ran; add the command or run to the evidence column.

## Adding an archetype

1. Add the entry to `ARCHETYPES` in `scripts/route-idea.mjs` (keywords, stack, screens, permissions,
   declarations, risks, motion budget, QA focus, metadata hints).
2. Add a `### <name>` section to `references/archetypes.md` with the same vocabulary.
3. Add at least one case to `evals/router-cases.json` asserting the archetype, stack, a permission or
   declaration, and a risk. Cite a rule from `store-facts.md` when the case is a negative one.
4. Run `check-skill.mjs`; the archetype-count and vocabulary checks must agree.

## Adding a module

Follow `assets/modules/README.md`: a `module.json`, platform sources or config, a README, and a test
artefact. Add it to `enable-modules.mjs`, the declaration map in `reconcile-declarations.mjs`, and
the module table in `SKILL.md` if it is user-facing. CI compiles modules on both mobile platforms.

## Adding an eval case

Add to `evals/quality.json` with a realistic prompt, a category, and assertions that name files and
strings the answer must produce. Run one case first:

```bash
node scripts/run-evals.mjs --quality --skill mobile-app-factory --only <case> --agent codex
```

Use `--repeat 3` before committing a result; a flaky case is a finding, not a pass.

## Commit and release

Small, themed commits with a message that says what changed and what was run. Do not push to `main`
directly; open a PR and let `.github/workflows/audit.yml` run. Versioning and tags are described in
`docs/release.md`.

## Reporting a skill miss

If a prompt should have triggered a skill and did not:

```bash
node skills/mobile-app-factory/scripts/skill-miss.mjs "your prompt" --expected mobile-app-factory
```

It writes a local `skill-misses.md` entry and prints a prefilled issue URL. Include the agent and
model; trigger behaviour differs between CLIs.
