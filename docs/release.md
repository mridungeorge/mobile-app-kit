# Releases

The repository ships skills, not a package, so a release is a tag on `main` with a changelog entry
and a short note describing which behaviour changed.

## Versioning

Semantic versioning for the skill contract:

| Change | Bump |
|---|---|
| A new archetype, module, script, reference or optional flag | **minor** |
| Fixes to instructions, checks, starters or docs that do not change the pipeline contract | **patch** |
| A renamed/removed flag, artifact filename, required field or stack default | **major** |

The artifact filenames (`.mobile/00-intake.json`, `01-prd.md`, …) and the profile schema are part of
the public contract. `profile.version` stays `1` until a breaking change.

## Cutting a release

```bash
node skills/mobile-app-factory/scripts/check-skill.mjs
node skills/mobile-app-factory/scripts/run-evals.mjs --validate
git switch main && git pull --ff-only
git tag -a v1.2.0 -m "v1.2.0"
git push origin v1.2.0
gh release create v1.2.0 --generate-notes --title "v1.2.0"
```

Then add a dated entry at the top of `docs/CHANGELOG.md` with the commands that were run, and update
the "Verified vs not verified" table in `README.md` from those results. A tag with no evidence row is
not a release.

## Release notes template

```markdown
## v1.2.0 — <one line>

### Added
- <user-visible capability, with the flag or file>

### Fixed
- <bug, and the test/check that now covers it>

### Verified
- `check-skill.mjs`: PASS, N checks
- CI: <jobs that ran>
- Evals: <set, agent, model, result, date>

### Known gaps
- <what still needs a human, device or store account>
```

## Tags that exist

Tags are the only supported versions. `main` is development; if you need stability, pin a tag.
