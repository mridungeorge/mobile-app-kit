#!/usr/bin/env node
// Copies a native project starter and substitutes placeholders.
// Used by new-android-app.sh / new-ios-app.sh, but runnable directly.
//
//   node scripts/scaffold-native.mjs --platform android --name "Night Notes" \
//     --package com.example.nightnotes --out ./NightNotes/android
//
//   node scripts/scaffold-native.mjs --platform ios --name "Night Notes" \
//     --bundle-id com.example.nightnotes --out ./NightNotes/ios
//
// Placeholders replaced in both file contents and file/folder names:
//   __PROJECT_NAME__   PascalCase project/target name (letters/digits only)
//   __APP_NAME__       human display name
//   __APP_SLUG__       kebab-case slug
//   __PACKAGE__        Android applicationId / namespace
//   __PACKAGE_PATH__   Android package as a directory path
//   __BUNDLE_ID__      iOS bundle identifier

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, chmodSync } from "node:fs";
import { join, resolve, dirname, relative, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, "..");

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--platform") opts.platform = next();
    else if (a === "--name") opts.name = next();
    else if (a === "--package") opts.package = next();
    else if (a === "--bundle-id") opts.bundleId = next();
    else if (a === "--out") opts.out = next();
    else if (a === "--force") opts.force = true;
    else if (a === "--help" || a === "-h") opts.help = true;
  }
  return opts;
}

function usage() {
  return `Usage:
  node scripts/scaffold-native.mjs --platform android --name "<App Name>" [--package com.example.app] --out <dir>
  node scripts/scaffold-native.mjs --platform ios     --name "<App Name>" [--bundle-id com.example.app] --out <dir>

Options:
  --platform   android | ios
  --name       human readable app name (also used to derive project names)
  --package    Android applicationId/namespace (default com.example.<slug>)
  --bundle-id  iOS bundle identifier (default com.example.<slug>)
  --out        destination directory for the project starter
  --force      write into a non-empty destination`;
}

function pascalCase(input) {
  const words = String(input || "App")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const joined = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const safe = joined.replace(/^[0-9]/, "App$&");
  return safe || "App";
}

function kebabCase(input) {
  return String(input || "app")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "app";
}

// Extensions that are always copied byte-for-byte. A `.jar` is a ZIP: it happens to
// contain NUL bytes in its first 4 KB today, but relying on that is luck. Decoding a
// binary as UTF-8 and re-encoding it silently corrupts the file, so the extension is
// checked first and the NUL scan is only the fallback for unknown types.
const BINARY_EXT = new Set([
  ".jar", ".aar", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf",
  ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".mov", ".mp3",
  ".keystore", ".jks", ".p12", ".p8",
]);

function isProbablyText(fileName, buffer) {
  if (BINARY_EXT.has(extname(fileName).toLowerCase())) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  for (const byte of sample) if (byte === 0) return false;
  return true;
}

function substitute(value, tokens) {
  let out = value;
  for (const [key, replacement] of Object.entries(tokens)) {
    out = out.split(key).join(replacement);
  }
  return out;
}

function copyTree(src, dest, tokens) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const from = join(src, entry);
    const to = join(dest, substitute(entry, tokens));
    const stat = statSync(from);
    if (stat.isDirectory()) {
      copyTree(from, to, tokens);
      continue;
    }
    const buffer = readFileSync(from);
    if (isProbablyText(entry, buffer)) {
      writeFileSync(to, substitute(buffer.toString("utf8"), tokens));
    } else {
      writeFileSync(to, buffer);
    }
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(usage());
    return;
  }
  if (!opts.platform || !["android", "ios"].includes(opts.platform)) {
    console.error("error: --platform must be android or ios\n");
    console.error(usage());
    process.exit(2);
  }
  if (!opts.name) {
    console.error("error: --name is required\n");
    console.error(usage());
    process.exit(2);
  }
  if (!opts.out) {
    console.error("error: --out is required\n");
    console.error(usage());
    process.exit(2);
  }

  const slug = kebabCase(opts.name);
  const projectName = pascalCase(opts.name);
  const pkg = opts.platform === "android"
    ? (opts.package || `com.example.${slug.replace(/-/g, "")}`)
    : (opts.bundleId || `com.example.${slug.replace(/-/g, "")}`);

  const tokens = {
    "__PROJECT_NAME__": projectName,
    "__APP_NAME__": opts.name,
    "__APP_SLUG__": slug,
    "__PACKAGE__": pkg,
    "__PACKAGE_PATH__": pkg.split(".").join(sep),
    "__BUNDLE_ID__": pkg
  };

  const template = join(SKILL_DIR, "assets", opts.platform, "project");
  if (!existsSync(template)) {
    console.error(`error: missing template ${template}`);
    process.exit(2);
  }

  const out = resolve(opts.out);
  if (existsSync(out) && readdirSync(out).length && !opts.force) {
    console.error(`error: ${out} is not empty (use --force to write anyway)`);
    process.exit(2);
  }

  copyTree(template, out, tokens);

  // writeFileSync gives 0644. On macOS/Linux that makes `./gradlew` fail with
  // "permission denied", which looks like a broken project rather than a file mode.
  if (opts.platform === "android") {
    const gradlew = join(out, "gradlew");
    if (existsSync(gradlew)) {
      try {
        chmodSync(gradlew, 0o755);
      } catch {
        /* Windows has no executable bit; ignore */
      }
    }
  }

  console.log(`Scaffolded ${opts.platform} project: ${out}`);
  console.log(`  project: ${projectName}`);
  console.log(`  ${opts.platform === "android" ? "applicationId" : "bundle id"}: ${pkg}`);
  if (opts.platform === "android") {
    console.log("\nNext: `./gradlew :app:assembleDebug` (the Gradle wrapper is included, so no");
    console.log("local Gradle install is needed), or open the folder in Android Studio.");
  } else {
    console.log("\nNext: `brew install xcodegen && xcodegen generate && open *.xcodeproj` (macOS),");
    console.log("or create an Xcode project from the same Sources/ folder.");
  }
}

main();
