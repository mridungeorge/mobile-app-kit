#!/usr/bin/env node
// Publish-readiness report: separates what the factory can still fix from what
// genuinely needs a human or an external account.
//
//   node scripts/readiness-report.mjs --dir .mobile
//   node scripts/readiness-report.mjs --dir .mobile --strict    # exit 1 on missing AI items
//   node scripts/readiness-report.mjs --dir .mobile --json
//
// Exit codes: 0 report produced (or --strict passed), 1 missing AI-fixable items under --strict,
// 2 the .mobile directory is unusable.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname, sep, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = { dir: ".mobile", strict: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") opts.dir = argv[++i];
    else if (argv[i] === "--strict") opts.strict = true;
    else if (argv[i] === "--json") opts.json = true;
    else if (argv[i] === "--help" || argv[i] === "-h") opts.help = true;
  }
  return opts;
}

const ok = (detail) => ({ status: "pass", detail });
const bad = (detail) => ({ status: "missing", detail });
const warn = (detail) => ({ status: "warn", detail });

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  try {
    return readdirSync(root, { recursive: true })
      .filter((entry) => typeof entry === "string")
      .map((entry) => join(root, entry))
      .filter((path) => {
        try { return statSync(path).isFile(); } catch { return false; }
      });
  } catch {
    return [];
  }
}

function hasApproval(dir) {
  const path = join(dir, "00-approval.json");
  if (!existsSync(path)) return bad("run review-preview.mjs --approve after the user approves the preview");
  try {
    const record = JSON.parse(readFileSync(path, "utf8"));
    if (record.status === "approved") return ok(`approved ${record.decidedAt || ""}`.trim());
    return bad(`preview status is "${record.status}" — re-approve before build`);
  } catch {
    return bad("00-approval.json is unreadable");
  }
}

function checkArtifact(dir, file, label) {
  const path = join(dir, file);
  if (!existsSync(path)) return bad(`${label} missing (${file})`);
  const text = read(path) || "";
  if (text.trim().length < 40) return warn(`${file} looks empty`);
  return ok(`${label} (${file})`);
}

function checkReview(dir) {
  const path = join(dir, "07-review.md");
  if (!existsSync(path)) return bad("reviewer verdict missing (07-review.md)");
  const text = read(path) || "";
  if (/verdict\s*[:\-]?\s*PASS/i.test(text) && !/verdict\s*[:\-]?\s*FAIL/i.test(text)) return ok("reviewer verdict PASS");
  return bad("07-review.md does not contain a PASS verdict");
}

function checkMetadata(dir) {
  const metadataDir = join(dir, "metadata");
  if (!existsSync(metadataDir)) return bad("metadata/ missing (ios.json, android.json, listing.md)");
  const validator = join(__dirname, "validate-metadata.mjs");
  try {
    execFileSync(process.execPath, [validator, metadataDir], { stdio: "pipe" });
    return ok("metadata validates against store limits");
  } catch (error) {
    const output = String(error.stdout || error.message || "").trim().split("\n").slice(0, 3).join(" | ");
    return bad(`metadata linter failed: ${output || "see validate-metadata.mjs"}`);
  }
}

function checkNativeProject(root) {
  const files = listFiles(root).filter((f) => !f.includes("node_modules") && !f.includes(".git" + sep));
  const gradle = files.find((f) => f.endsWith("settings.gradle.kts") || f.endsWith("settings.gradle"));
  const xcode = files.find((f) => f.endsWith("project.yml") || f.endsWith(".xcodeproj/project.pbxproj"));
  const kotlin = files.find((f) => f.endsWith(".kt"));
  const swift = files.find((f) => f.endsWith(".swift"));
  const found = [];
  if (gradle || kotlin) found.push("Android");
  if (xcode || swift) found.push("iOS");
  if (!found.length) return bad("no native project found (expected android/ Gradle or ios/ XcodeGen sources)");
  return ok(`native project present: ${found.join(" + ")}`);
}

function checkScreenshots(dir) {
  const root = join(dir, "screenshots");
  const files = listFiles(root).filter((f) => [".png", ".jpg", ".jpeg", ".webp"].includes(extname(f).toLowerCase()));
  if (!files.length) return bad("no real-device screenshots in .mobile/screenshots/");
  return ok(`${files.length} screenshot(s) present`);
}

function checkCi(root) {
  const files = listFiles(root).filter((f) => /\.(ya?ml)$/i.test(f) && /(ci|\.github)[\\/]/i.test(f));
  if (!files.length) return bad("no CI workflow copied into the project (see assets/ci/)");
  return ok(`${files.length} CI workflow file(s) present`);
}

function checkLegal(dir) {
  const candidates = ["metadata", "docs"].flatMap((sub) => listFiles(join(dir, sub)));
  const text = candidates.map((f) => read(f) || "").join("\n");
  const missing = [];
  if (!/privacy policy/i.test(text)) missing.push("privacy policy URL");
  if (!/terms/i.test(text)) missing.push("terms of use");
  if (!/support (email|url|contact)/i.test(text)) missing.push("support contact");
  if (missing.length) return bad(`listing copy is missing: ${missing.join(", ")}`);
  return ok("privacy, terms and support contact referenced");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("Usage: node scripts/readiness-report.mjs --dir .mobile [--strict] [--json]");
    return;
  }
  const dir = resolve(opts.dir);
  if (!existsSync(dir)) {
    console.error(`No .mobile directory at ${dir}. Run the questionnaire first.`);
    process.exit(2);
  }
  const projectRoot = basename(dir) === ".mobile" ? resolve(dir, "..") : dir;

  const ai = [
    { name: "Intake captured", ...(existsSync(join(dir, "00-intake.json")) ? ok("00-intake.json") : bad("run questionnaire.mjs")) },
    { name: "Profile routed", ...(existsSync(join(dir, "00-profile.json")) ? ok("00-profile.json") : bad("run route-idea.mjs")) },
    { name: "Preview approved", ...hasApproval(dir) },
    { name: "PRD", ...checkArtifact(dir, "01-prd.md", "product spec") },
    { name: "Design spec", ...checkArtifact(dir, "02-design.md", "design system + screen specs") },
    { name: "Build log", ...checkArtifact(dir, "03-build-log.md", "build log") },
    { name: "Native project", ...checkNativeProject(projectRoot) },
    { name: "Motion spec", ...checkArtifact(dir, "04-motion.md", "motion spec") },
    { name: "Compliance pack", ...checkArtifact(dir, "05-compliance.md", "compliance decisions") },
    { name: "Release plan", ...checkArtifact(dir, "06-release.md", "release plan") },
    { name: "CI workflow", ...checkCi(projectRoot) },
    { name: "Store metadata", ...checkMetadata(dir) },
    { name: "Listing legal links", ...checkLegal(dir) },
    { name: "Screenshots", ...checkScreenshots(dir) },
    { name: "Adversarial review", ...checkReview(dir) }
  ];

  const human = [
    { name: "Apple Developer Program", detail: "membership, agreements, tax and banking; App Store Connect access" },
    { name: "Google Play Console", detail: "developer account + identity verification; Play App Signing" },
    { name: "Signing material", detail: "Android upload keystore, iOS certificates/profiles or App Store Connect API key" },
    { name: "CI secrets", detail: "keystore base64/passwords, Apple API key, Play service account JSON" },
    { name: "Backend and providers", detail: "Supabase/Firebase/API keys, push certificates, maps/AI provider accounts" },
    { name: "Real-device QA", detail: "physical iOS + Android devices, accessibility pass, 200% text, reduced motion" },
    { name: "Store operations", detail: "uploads, TestFlight/closed track, review responses, phased rollout" },
    { name: "Google 12-tester gate", detail: "12 testers opted in for 14 continuous days (new personal accounts)" },
    { name: "Legal entity and policies", detail: "published privacy policy, terms, support contact, EU DSA trader status" }
  ];

  const missing = ai.filter((item) => item.status === "missing");
  const warns = ai.filter((item) => item.status === "warn");

  if (opts.json) {
    console.log(JSON.stringify({ dir, ai, human, missing: missing.length, warnings: warns.length }, null, 2));
  } else {
    console.log(`Mobile App Factory — readiness report\n${dir}\n`);
    console.log("AI-fixable pipeline items");
    for (const item of ai) {
      const mark = item.status === "pass" ? "✓" : item.status === "warn" ? "!" : "✗";
      console.log(`  ${mark} ${item.name}: ${item.detail}`);
    }
    console.log("\nHuman / external actions (cannot be automated by the skill)");
    for (const item of human) console.log(`  → ${item.name}: ${item.detail}`);
    const verdict = missing.length ? "NOT READY" : "PIPELINE COMPLETE";
    console.log(`\n${verdict} — ${ai.length - missing.length}/${ai.length} AI items done, ${warns.length} warning(s), ${human.length} human actions remaining.`);
    if (missing.length) console.log(`Fix next: ${missing.map((m) => m.name).join(", ")}`);
  }

  if (opts.strict && missing.length) process.exit(1);
}

main();
