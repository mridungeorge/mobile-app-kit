#!/usr/bin/env node
// Deterministic artifact lint: no model, no network, no opinions.
//
//   node scripts/lint-artifacts.mjs --dir .mobile
//   node scripts/lint-artifacts.mjs --dir .mobile --json
//
// Checks the files that already exist against references/artifact-recipes.md. Missing phase
// files are readiness-report.mjs's job; this script catches the case where a file exists but
// the required fact was left in the chat instead. Exit 1 on any error.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname, basename } from "node:path";

function parseArgs(argv) {
  const opts = { dir: ".mobile", json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") opts.dir = argv[++i];
    else if (argv[i] === "--json") opts.json = true;
    else if (argv[i] === "--help" || argv[i] === "-h") opts.help = true;
  }
  return opts;
}

function read(path) {
  try { return readFileSync(path, "utf8"); } catch { return null; }
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

const checks = [];
const add = (level, file, message) => checks.push({ level, file, message });
const has = (text, pattern) => pattern.test(text);

// Each rule only runs when its file exists. `requires` names the strings the artifact-recipe
// table promises; every one is a word the grader (or the next agent) searches for.
const fileRules = [
  {
    file: "02-design.md",
    label: "design spec",
    rules: [
      ["spacing scale", /4\/8\/12\/16\/24|4, 8, 12, 16, 24/],
      ["hairline or separator", /hairline|separator/i],
      ["motion token", /settle|snap|glide/i],
    ],
  },
  {
    file: "03-build-log.md",
    label: "build log",
    rules: [
      ["real screens listed", /screen|view|composable/i],
      ["states wired", /loading|empty|offline|error/i],
    ],
  },
  {
    file: "04-motion.md",
    label: "motion spec",
    rules: [["reduce-motion path", /reduce[- ]motion|prefers-reduced-motion/i]],
  },
  {
    file: "05-compliance.md",
    label: "compliance pack",
    rules: [
      ["privacy manifest / PrivacyInfo", /privacy manifest|PrivacyInfo/i],
      ["Play data safety", /data safety/i],
      ["target API", /targetSdk|target API/i],
    ],
  },
  {
    file: "07-review.md",
    label: "review",
    rules: [["verdict", /blocker|PASS|FAIL/]],
  },
  {
    file: "00-migration-plan.md",
    label: "migration plan",
    rules: [
      ["identifiers", /bundle id|package name|applicationId/i],
      ["signing continuity", /signing|keystore|upload key/i],
      ["entitlements", /entitlement|subscriber/i],
    ],
  },
];

function profileModule(profile, name) {
  return Array.isArray(profile?.modules) && profile.modules.includes(name);
}

function lintProfile(dir, profile) {
  const path = join(dir, "00-profile.json");
  if (!profile) {
    add("error", "00-profile.json", "not valid JSON");
    return;
  }
  if (!profile.archetype) add("error", "00-profile.json", "no archetype");
  if (!Array.isArray(profile.screens) || profile.screens.length < 3) {
    add("error", "00-profile.json", "fewer than 3 screens");
  }
  if (Array.isArray(profile.screens) && profile.screens.length > 12) {
    add("warn", "00-profile.json", `${profile.screens.length} screens (> 12) — see product-architect`);
  }
  if (!profile.motionBudget) add("error", "00-profile.json", "no motionBudget");
}

function lintCompliance(dir, profile) {
  const path = join(dir, "05-compliance.md");
  const text = read(path);
  if (text === null) return;
  if (profileModule(profile, "billing") && !has(text, /restore/i)) {
    add("error", "05-compliance.md", "billing enabled but restore purchases is not covered");
  }
  if (profileModule(profile, "billing") && !has(text, /purchase history/i)) {
    add("error", "05-compliance.md", "billing enabled but purchase history is not declared");
  }
  if (profile?.accounts === true && !has(text, /account deletion/i)) {
    add("error", "05-compliance.md", "accounts enabled but account deletion is not covered");
  }
  if (profile?.accounts === true && !has(text, /5\.1\.1/)) {
    add("error", "05-compliance.md", "account deletion is not tied to Apple guideline 5.1.1");
  }
  if (profile?.accounts === true && !has(text, /web|url/i)) {
    add("error", "05-compliance.md", "no web deletion link for Play");
  }
  if (profileModule(profile, "push") && !has(text, /notification|device id/i)) {
    add("error", "05-compliance.md", "push enabled but no notification/device id declaration");
  }
}

function lintBuildLog(dir, profile) {
  const text = read(join(dir, "03-build-log.md"));
  if (text === null) return;
  if (profileModule(profile, "push")) {
    if (!has(text, /channel/i)) add("error", "03-build-log.md", "push enabled but no notification channel");
    if (!has(text, /POST_NOTIFICATIONS/)) {
      add("error", "03-build-log.md", "push enabled but Android 13 POST_NOTIFICATIONS is missing");
    }
    if (!has(text, /priming|in context|not at launch/i)) {
      add("error", "03-build-log.md", "push permission is not described as asked in context");
    }
  }
  if (profileModule(profile, "billing") && !has(text, /restore|purchase/i)) {
    add("error", "03-build-log.md", "billing enabled but the purchase path is not in the log");
  }
  if (/sentry/i.test(profile?.idea || "") && !has(text, /sentry/i)) {
    add("warn", "03-build-log.md", "idea mentions Sentry but the build log does not");
  }
}

// Declared vs actually referenced: an SDK in the source tree that compliance never names is
// the exact mismatch reconcile-declarations.mjs catches at build time, caught here instead.
function lintUndeclaredSdks(dir, profile) {
  const projectRoot = basename(dir) === ".mobile" ? resolve(dir, "..") : dir;
  // Never scan the agent's skill directories: the kit's own templates mention Sentry, RevenueCat
  // and Firebase, and counting them as the app's dependencies is a false positive.
  const ignored = /(^|[\\/])(node_modules|\.git|\.mobile|\.claude|\.agents|\.opencode|\.config)([\\/]|$)/i;
  const files = listFiles(projectRoot).filter((f) =>
    /\.(kt|swift|ts|tsx|js|jsx|json|gradle|kts|toml|yml|yaml)$/i.test(f) && !ignored.test(f)
  );
  const known = [
    ["RevenueCat", /revenuecat|purchases-ios|purchases-android/i],
    ["Sentry", /sentry/i],
    ["Firebase", /firebase/i],
    ["Amplitude", /amplitude/i],
    ["Mixpanel", /mixpanel/i],
  ];
  const text = files.map((f) => read(f) || "").join("\n");
  const compliance = read(join(dir, "05-compliance.md")) || "";
  for (const [name, pattern] of known) {
    if (pattern.test(text) && !new RegExp(name, "i").test(compliance)) {
      add("error", "05-compliance.md", `${name} appears in the project but not in the declarations`);
    }
  }
}

function lintMetadata(dir) {
  const metadataDir = join(dir, "metadata");
  if (!existsSync(metadataDir)) return;
  const files = ["ios.json", "android.json"].map((name) => join(metadataDir, name));
  const texts = files.map(read);
  if (texts.every((text) => text === null)) return;
  const anyLocales = texts.some((text) => text && /"locales"\s*:/.test(text));
  const languages = texts.join("\n").match(/"locales"\s*:\s*\{[^}]*\}/g) || [];
  if (anyLocales) {
    for (const [index, text] of texts.entries()) {
      if (text && !/"locales"\s*:/.test(text)) {
        add("error", basename(files[index]), "one metadata file has locales, the other does not");
      }
    }
    if (languages.length && !/de|fr|ar|es|ja|zh/i.test(languages.join(" "))) {
      add("warn", metadataDir, "locales block names no recognisable language tag");
    }
  } else {
    add("warn", metadataDir, "no \"locales\" block — add one if the listing ships in more than one language");
  }
}

function lintMotionCode(dir, profile) {
  const projectRoot = basename(dir) === ".mobile" ? resolve(dir, "..") : dir;
  const ignored = /(^|[\\/])(node_modules|\.git|\.mobile|\.claude|\.agents|\.opencode|\.config)([\\/]|$)/i;
  const files = listFiles(projectRoot).filter((f) => /\.(kt|swift|tsx|jsx|ts|js|css|scss)$/i.test(f) && !ignored.test(f));
  const text = files.map((f) => read(f) || "").join("\n");
  const animated = /withAnimation|AnimatedVisibility|animateItem|useAnimatedStyle|useGSAP|gsap\.|@keyframes|transition:/i.test(text);
  if (animated && !/reduceMotion|isReduceMotionEnabled|prefers-reduced-motion|accessibilityReduceMotion|ANIMATOR_DURATION_SCALE/i.test(text)) {
    add("warn", "motion code", "animation code has no reduced-motion branch");
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("Usage: node scripts/lint-artifacts.mjs --dir .mobile [--json]");
    return;
  }
  const dir = resolve(opts.dir);
  if (!existsSync(dir)) {
    console.error(`No .mobile directory at ${dir}.`);
    process.exit(2);
  }

  let profile = null;
  if (existsSync(join(dir, "00-profile.json"))) {
    try { profile = JSON.parse(readFileSync(join(dir, "00-profile.json"), "utf8")); } catch { profile = null; }
    lintProfile(dir, profile);
  }

  for (const rule of fileRules) {
    const text = read(join(dir, rule.file));
    if (text === null) continue;
    for (const [label, pattern] of rule.rules) {
      if (!has(text, pattern)) add("error", rule.file, `${rule.label} is missing: ${label}`);
    }
  }

  lintCompliance(dir, profile);
  lintBuildLog(dir, profile);
  lintUndeclaredSdks(dir, profile);
  lintMetadata(dir);
  lintMotionCode(dir, profile);

  const errors = checks.filter((check) => check.level === "error");
  const warns = checks.filter((check) => check.level === "warn");

  if (opts.json) {
    console.log(JSON.stringify({ dir, errors, warnings: warns }, null, 2));
  } else {
    console.log(`Artifact lint — ${dir}`);
    if (!checks.length) console.log("  ✓ no artifacts to contradict");
    for (const check of checks) {
      console.log(`  ${check.level === "error" ? "✗" : "!"} ${check.file}: ${check.message}`);
    }
    console.log(`\n${errors.length ? "FAIL" : "PASS"} — ${errors.length} error(s), ${warns.length} warning(s)`);
  }

  if (errors.length) process.exit(1);
}

main();
