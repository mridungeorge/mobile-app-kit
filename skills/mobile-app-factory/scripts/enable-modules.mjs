#!/usr/bin/env node
// Copies opt-in modules into a scaffolded native app and adds their dependencies.
//   node scripts/enable-modules.mjs --platform android --app <dir> --package com.example.app --modules billing,push,analytics-crash
//   node scripts/enable-modules.mjs --platform ios --app <dir> --project <XcodeModuleName> --modules billing,push,analytics-crash
// Android: Kotlin goes under app/src/main/java/<package path>/modules/<name>/ and dependencies are appended to app/build.gradle.kts.
// iOS: Swift goes under Sources/Modules/<name>/ (picked up by the XcodeGen Sources glob). Module tests go under Tests/.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const { platform, app, package: pkg, project = "App" } = args;
const modules = (args.modules ?? "").split(",").map((m) => m.trim()).filter(Boolean);
if (!["android", "ios"].includes(platform) || !app || !modules.length || (platform === "android" && !pkg)) {
  console.error("usage: enable-modules.mjs --platform android|ios --app <dir> [--package id] --modules a,b");
  process.exit(2);
}

// Pinned: billing-ktx 7.1.1 and the Firebase BoM were checked against dl.google.com/android/maven2.
const GRADLE = {
  billing: ['implementation("com.android.billingclient:billing-ktx:7.1.1")'],
  push: ['implementation(platform("com.google.firebase:firebase-bom:35.2.0"))', 'implementation("com.google.firebase:firebase-messaging")'],
  "analytics-crash": []
};

const put = (from, to, transform = (s) => s) => {
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, transform(readFileSync(from, "utf8")));
};

for (const name of modules) {
  const src = join(root, "assets", "modules", name);
  if (!existsSync(join(src, "module.json"))) { console.error(`unknown module ${name}`); process.exit(2); }
  const side = join(src, platform);
  if (!existsSync(side)) continue; // localization, deeplinks: docs/templates only
  for (const file of readdirSync(side)) {
    if (platform === "android") {
      const dir = join(app, "app", "src", "main", "java", ...pkg.split("."), "modules", name);
      put(join(side, file), join(dir, file), (s) => s.replace(/^package __PACKAGE__\.(.*)$/m, `package ${pkg}.modules.${name.replace(/-/g, "")}`).replaceAll("__PACKAGE__", pkg));
    } else {
      const dest = file.endsWith("Tests.swift") ? join(app, "Tests", file) : join(app, "Sources", "Modules", name, file);
      put(join(side, file), dest, (s) => s.replaceAll("__PROJECT_NAME__", project));
    }
  }
  if (platform === "android" && GRADLE[name]?.length) {
    appendFileSync(join(app, "app", "build.gradle.kts"), `\ndependencies {\n${GRADLE[name].map((l) => `    ${l}`).join("\n")}\n}\n`);
  }
  console.log(`enabled ${name} on ${platform}`);
}
