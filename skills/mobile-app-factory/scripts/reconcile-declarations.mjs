#!/usr/bin/env node
// Diffs the data types an app's SDKs imply against what the store declarations say.
//   node scripts/reconcile-declarations.mjs --app <project dir> [--profile .mobile/00-profile.json] [--declared .mobile/declarations.json]
// Implied = SDKs found in Gradle / Package.swift / project.yml / Podfile + data types of enabled modules.
// Declared = declarations.json ({"ios":[...],"android":[...]} with names like CrashData) and, for iOS,
// any NSPrivacyCollectedDataType* keys in PrivacyInfo.xcprivacy. Exit 1 when something implied is undeclared.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// SDK fingerprint -> data types it collects, per platform. Extend as SDKs are added to the kit.
const SDKS = [
  { re: /firebase-crashlytics|crashlytics/i, name: "Firebase Crashlytics", ios: ["CrashData", "PerformanceData"], android: ["CrashLogs", "Diagnostics"] },
  { re: /sentry/i, name: "Sentry", ios: ["CrashData", "PerformanceData"], android: ["CrashLogs", "Diagnostics"] },
  { re: /firebase-analytics|FirebaseAnalytics|google-analytics/i, name: "Firebase Analytics", ios: ["ProductInteraction", "DeviceID"], android: ["AppInteractions", "DeviceOrOtherIds"] },
  { re: /firebase-messaging|FirebaseMessaging/i, name: "Firebase Messaging", ios: ["DeviceID"], android: ["DeviceOrOtherIds"] },
  { re: /billing-ktx|com\.android\.billingclient|purchases-android|RevenueCat|purchases-ios/i, name: "Billing", ios: ["PurchaseHistory"], android: ["PurchaseHistory"] },
  { re: /play-services-ads|GoogleMobileAds|AppLovin|facebook-android-sdk|FBSDKCoreKit/i, name: "Ads / attribution SDK", ios: ["AdvertisingData", "DeviceID"], android: ["AdvertisingId", "DeviceOrOtherIds"] },
  { re: /play-services-location|CoreLocation/i, name: "Location", ios: ["CoarseLocation"], android: ["ApproximateLocation"] }
];

const BUILD_FILES = /(^|\/)(build\.gradle(\.kts)?|libs\.versions\.toml|Package\.swift|Package\.resolved|project\.yml|Podfile|Podfile\.lock|package\.json)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "build", "Pods", ".gradle"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (BUILD_FILES.test(full.replace(/\\/g, "/"))) out.push(full);
  }
  return out;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--app") o.app = argv[++i];
    else if (argv[i] === "--profile") o.profile = argv[++i];
    else if (argv[i] === "--declared") o.declared = argv[++i];
    else if (argv[i] === "--help") o.help = true;
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  return o;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || !opts.app) {
  console.log("usage: reconcile-declarations.mjs --app <dir> [--profile file] [--declared file]");
  process.exit(opts.help ? 0 : 2);
}

const app = resolve(opts.app);
const implied = { ios: new Map(), android: new Map() };
const add = (platform, type, why) => { if (!implied[platform].has(type)) implied[platform].set(type, why); };

for (const file of walk(app)) {
  const text = readFileSync(file, "utf8");
  for (const sdk of SDKS) {
    if (!sdk.re.test(text)) continue;
    const rel = file.slice(app.length + 1);
    for (const t of sdk.ios) add("ios", t, `${sdk.name} in ${rel}`);
    for (const t of sdk.android) add("android", t, `${sdk.name} in ${rel}`);
  }
}

const profilePath = opts.profile ? resolve(opts.profile) : join(app, ".mobile", "00-profile.json");
if (existsSync(profilePath)) {
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  for (const name of profile.modules ?? []) {
    const manifest = join(root, "assets", "modules", name, "module.json");
    if (!existsSync(manifest)) continue;
    const { dataTypes } = JSON.parse(readFileSync(manifest, "utf8"));
    for (const t of dataTypes?.ios ?? []) add("ios", t, `module ${name}`);
    for (const t of dataTypes?.android ?? []) add("android", t, `module ${name}`);
  }
}

const declared = { ios: new Set(), android: new Set() };
const declaredPath = opts.declared ? resolve(opts.declared) : join(app, ".mobile", "declarations.json");
if (existsSync(declaredPath)) {
  const json = JSON.parse(readFileSync(declaredPath, "utf8"));
  for (const t of json.ios ?? []) declared.ios.add(t);
  for (const t of json.android ?? []) declared.android.add(t);
}
for (const rel of readdirSync(app, { recursive: true })) {
  const file = join(app, String(rel));
  if (!file.endsWith("PrivacyInfo.xcprivacy") || /node_modules|Pods/.test(file)) continue;
  for (const m of readFileSync(file, "utf8").matchAll(/NSPrivacyCollectedDataType([A-Za-z]+)/g)) {
    if (!["Linked", "Tracking", "Purposes"].includes(m[1])) declared.ios.add(m[1]);
  }
}

let failed = false;
for (const platform of ["ios", "android"]) {
  const missing = [...implied[platform]].filter(([t]) => !declared[platform].has(t));
  const extra = [...declared[platform]].filter((t) => !implied[platform].has(t));
  console.log(`${platform}: implied ${implied[platform].size}, declared ${declared[platform].size}`);
  for (const [t, why] of missing) { console.log(`  MISSING  ${t}  (${why})`); failed = true; }
  for (const t of extra) console.log(`  note     ${t} declared but no SDK/module implies it — confirm it is real`);
}
console.log(failed ? "FAIL — declarations do not cover the SDKs in the build" : "PASS — declarations cover every SDK and module found");
process.exit(failed ? 1 : 0);
