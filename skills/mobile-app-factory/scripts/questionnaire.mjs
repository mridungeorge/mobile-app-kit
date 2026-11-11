#!/usr/bin/env node
// Interactive questionnaire for Mobile App Factory.
// Collects app requirements from a new developer and writes:
//   .mobile/00-intake.json, .mobile/00-intake.md
// Then runs route-idea to produce .mobile/00-profile.json.
//
// Usage:
//   node scripts/questionnaire.mjs
//   node scripts/questionnaire.mjs --out .mobile
//   node scripts/questionnaire.mjs --non-interactive --idea "..." --platforms both --monetisation subscription

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = { out: ".mobile", nonInteractive: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--out") opts.out = next();
    else if (a === "--non-interactive") opts.nonInteractive = true;
    else if (a === "--idea") opts.idea = next();
    else if (a === "--platforms") opts.platforms = next();
    else if (a === "--audience") opts.audience = next();
    else if (a === "--monetisation" || a === "--monetization") opts.monetisation = next();
    else if (a === "--accounts") opts.accounts = next();
    else if (a === "--offline") opts.offline = next();
    else if (a === "--design") opts.design = next();
    else if (a === "--team") opts.team = next();
  }
  return opts;
}

const questions = [
  { key: "idea", q: "1) App idea (one sentence): What should the app do?", def: "" },
  { key: "audience", q: "2) Who is it for? (target users/audience)", def: "General users" },
  { key: "problem", q: "3) What problem does it solve / core outcome?", def: "" },
  { key: "platforms", q: "4) Platforms? (android / ios / both)", def: "both" },
  { key: "monetisation", q: "5) Monetisation? (free / subscription / iap / ads / none)", def: "free" },
  { key: "accounts", q: "6) Need user accounts/login? (yes/no)", def: "no" },
  { key: "ugc", q: "7) User-generated content/social features? (yes/no)", def: "no" },
  { key: "ai", q: "8) AI features (chat, generation, summarisation)? (yes/no)", def: "no" },
  { key: "data", q: "9) Sensitive data? (none/health/finance/location/photos/other)", def: "none" },
  { key: "permissions", q: "10) Expected permissions/features? (camera, location, notifications, mic, health, files, none)", def: "notifications" },
  { key: "offline", q: "11) Must work offline? (yes/no)", def: "no" },
  { key: "backend", q: "12) Backend needed? (none / local-only / cloud e.g. Supabase/Firebase/custom)", def: "none" },
  { key: "design", q: "13) Design style/brand notes? (colors, vibe, reference apps, or 'default')", def: "default calm neutral" },
  { key: "team", q: "14) Who will build/maintain it? (solo/new dev, Android-Kotlin, iOS-Swift, both-native)", def: "both-native" },
  { key: "timeline", q: "15) Target timeline or priority? (MVP fast / production-ready / store launch date)", def: "production-ready" },
  { key: "mustHave", q: "16) Top 3 must-have features/screens?", def: "" },
  { key: "notes", q: "17) Anything else important (compliance, region, accessibility, integrations)?", def: "" }
];

function yn(v) {
  const s = String(v || "").trim().toLowerCase();
  return ["y", "yes", "true", "1"].includes(s);
}

async function runInteractive() {
  const rl = createInterface({ input, output });
  console.log("\nMobile App Factory — Requirements Questionnaire\n");
  console.log("Answer briefly. Press Enter to accept defaults where shown.\n");
  const answers = {};
  for (const item of questions) {
    const prompt = item.def ? `${item.q} [${item.def}]: ` : `${item.q}: `;
    const ans = (await rl.question(prompt)).trim();
    answers[item.key] = ans || item.def;
  }
  await rl.close();
  return answers;
}

function fromArgs(opts) {
  const answers = {};
  for (const item of questions) answers[item.key] = opts[item.key] ?? item.def ?? "";
  if (opts.idea) answers.idea = opts.idea;
  return answers;
}

function buildIntake(answers) {
  const platforms = /ios/i.test(answers.platforms) && /android/i.test(answers.platforms) ? "both"
    : /ios/i.test(answers.platforms) ? "ios" : /android/i.test(answers.platforms) ? "android" : "both";
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    idea: answers.idea,
    audience: answers.audience,
    problem: answers.problem,
    platforms,
    monetisation: answers.monetisation,
    accounts: yn(answers.accounts),
    ugc: yn(answers.ugc),
    ai: yn(answers.ai),
    sensitiveData: answers.data,
    permissions: String(answers.permissions).split(/[,\s]+/).filter(Boolean),
    offline: yn(answers.offline),
    backend: answers.backend,
    design: answers.design,
    team: answers.team,
    timeline: answers.timeline,
    mustHave: answers.mustHave,
    notes: answers.notes,
    raw: answers
  };
}

function toMarkdown(intake) {
  return `# App Intake (Questionnaire)

- **Created:** ${intake.createdAt}
- **Idea:** ${intake.idea}
- **Audience:** ${intake.audience}
- **Problem/Outcome:** ${intake.problem}
- **Platforms:** ${intake.platforms}
- **Monetisation:** ${intake.monetisation}
- **Accounts/Login:** ${intake.accounts ? "yes" : "no"}
- **User-generated content:** ${intake.ugc ? "yes" : "no"}
- **AI features:** ${intake.ai ? "yes" : "no"}
- **Sensitive data:** ${intake.sensitiveData}
- **Permissions/features:** ${(intake.permissions || []).join(", ") || "none"}
- **Offline required:** ${intake.offline ? "yes" : "no"}
- **Backend:** ${intake.backend}
- **Design/brand:** ${intake.design}
- **Build/maintain:** ${intake.team}
- **Timeline/priority:** ${intake.timeline}
- **Must-have:** ${intake.mustHave}
- **Notes:** ${intake.notes}

## Next steps (automated pipeline)
1. Generate profile: \`.mobile/00-profile.json\` (route idea + apply answers)
2. Produce PRD, design spec, and **illustrative app preview** for approval
3. Build native app (Android: Kotlin/Jetpack Compose in Android Studio; iOS: Swift/SwiftUI in Xcode), motion, compliance, release artifacts
4. Run review and prepare store submission package (metadata, privacy/data safety, checklists)

> External actions still required: developer accounts, signing keys/certificates, CI secrets, real-device testing, and store uploads/review.
`;
}

function routeProfile(idea, intake, outDir) {
  const router = join(__dirname, "route-idea.mjs");
  const args = ["--json", idea || "mobile app"];
  if (intake.accounts) args.push("--accounts"); else args.push("--no-accounts");
  if (intake.ugc) args.push("--ugc"); else args.push("--no-ugc");
  if (intake.ai) args.push("--ai"); else args.push("--no-ai");
  if (intake.offline) args.push("--offline");
  if (intake.monetisation) args.push("--monetisation", intake.monetisation);
  // prefer native production stack for both platforms unless specified
  if (intake.platforms === "android") args.push("--stack", "android-native");
  else if (intake.platforms === "ios") args.push("--stack", "ios-native");
  else args.push("--stack", "native");

  const res = spawnSync(process.execPath, [router, ...args], { encoding: "utf8" });
  if (res.status !== 0) {
    console.error(res.stderr || "route-idea failed");
    return null;
  }
  try {
    const profile = JSON.parse(res.stdout);
    profile.intake = {
      audience: intake.audience, problem: intake.problem, platforms: intake.platforms,
      backend: intake.backend, design: intake.design, team: intake.team,
      timeline: intake.timeline, mustHave: intake.mustHave, notes: intake.notes,
      sensitiveData: intake.sensitiveData, permissions: intake.permissions
    };
    writeFileSync(join(outDir, "00-profile.json"), JSON.stringify(profile, null, 2));
    return profile;
  } catch (e) {
    console.error("Failed to parse profile:", e.message);
    return null;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = resolve(opts.out);
  mkdirSync(outDir, { recursive: true });

  const answers = opts.nonInteractive ? fromArgs(opts) : await runInteractive();
  if (!answers.idea) {
    console.error("App idea is required.");
    process.exit(2);
  }
  const intake = buildIntake(answers);
  writeFileSync(join(outDir, "00-intake.json"), JSON.stringify(intake, null, 2));
  writeFileSync(join(outDir, "00-intake.md"), toMarkdown(intake));

  const profile = routeProfile(intake.idea, intake, outDir);
  if (!profile) process.exit(1);

  // initialize state
  const statePath = join(outDir, "STATE.md");
  if (!existsSync(statePath)) {
    writeFileSync(statePath, `# State\nstage: INTAKE_COMPLETE\nupdated: ${new Date().toISOString()}\nprofile: ${profile.archetype} (${profile.confidence})\nnext: generate preview for approval (.mobile/preview/index.html), then PRD/design/build/motion/compliance/release/review\n`);
  }

  console.log(`\nWrote: ${join(outDir, "00-intake.json")}`);
  console.log(`Wrote: ${join(outDir, "00-intake.md")}`);
  console.log(`Wrote: ${join(outDir, "00-profile.json")}`);
  console.log(`\nArchetype: ${profile.archetype} (${profile.archetypeLabel}) | confidence: ${profile.confidence}`);
  console.log(`Stack: ${profile.stack.primary} | screens: ${profile.screens.length} | motion: ${profile.motionBudget}`);
  console.log(`\nNext: run preview generation for user approval, then continue pipeline phases.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
