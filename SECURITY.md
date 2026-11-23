# Security

## Reporting a vulnerability

Do not open a public issue. Email **george@mridun.dev** with the skill or script, the version or
commit, a reproduction, and the impact. You should get an acknowledgement within 7 days. Please give
us 90 days before public disclosure.

## Scope

This repository ships instruction files and local Node scripts. The relevant risks are:

- a script writing outside the project directory or deleting user files;
- a scaffold or installer overwriting an existing app;
- a skill instructing an agent to exfiltrate source, secrets or environment variables;
- eval prompts or fixtures containing real credentials.

The scripts are dependency-free and run locally. They do not send project data anywhere. Evals invoke
an agent CLI you already installed and authenticated; that CLI's own data handling is out of scope.

## Handling secrets

No script should print values from `.env` files. `inventory-existing.mjs` records environment
**names only**, never values, and the same rule applies to CI logs and screenshots. Signing keys,
store API keys and `ANTHROPIC_API_KEY` belong in CI secrets, never in `.mobile/` artifacts.

## Supported versions

Fixes land on `main`. Tagged releases follow `docs/release.md`; only the latest minor receives
security fixes.
