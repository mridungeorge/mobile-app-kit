#!/usr/bin/env node
/**
 * Deterministic store-compliance checks for a Mobile App Factory project.
 *
 *   node scripts/check-store-compliance.mjs --dir examples/habit-tracker
 *   node scripts/check-store-compliance.mjs --dir . --strict
 *
 * Reads .mobile/00-profile.json + .mobile/metadata and the platform projects. Exits 1 on a
 * failed check; warnings do not fail unless --strict is passed. No network, no model.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const get = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i === -1 ? fallback : args[i + 1];
};
const root = resolve(get("--dir", "."));
const strict = args.includes("--strict");
const mobile = join(root, ".mobile");
const results = [];
const add = (status, name, detail) => results.push({ status, name, detail });
const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "");
const json = (path) => {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
};
const walk = (dir, found = []) => {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
};

const profile = json(join(mobile, "00-profile.json")) ?? {};
const iosMeta = json(join(mobile, "metadata", "ios.json"));
const androidMeta = json(join(mobile, "metadata", "android.json"));
const metadata = androidMeta ?? {};
const permissions = profile.permissions ?? [];
const accounts = Boolean(profile.accounts);
const subscription = /subscription|iap|one-time/.test(String(profile.monetisation || "")) ||
  (profile.payments ?? []).some((p) => p === "subscription" || p === "iap");

// 1. Privacy manifest (Apple requires a manifest and signatures for listed SDKs).
const files = walk(root);
const manifest = files.find((f) => /PrivacyInfo\.xcprivacy$/.test(f));
if (manifest) {
  const text = read(manifest);
  const missing = ["NSPrivacyCollectedDataTypes", "NSPrivacyAccessedAPITypes"].filter((key) => !text.includes(key));
  if (missing.length) add("FAIL", "privacy manifest", `${manifest} is missing ${missing.join(", ")}`);
  else add("PASS", "privacy manifest", "collected-data and required-reason API sections present");
} else if (existsSync(join(root, "package.json")) && !existsSync(join(root, "ios"))) {
  add("WARN", "privacy manifest", "Expo project: the manifest is generated at prebuild; commit the generated ios/ copy or declare it in app config");
} else {
  add("FAIL", "privacy manifest", "no PrivacyInfo.xcprivacy found");
}

// 2. Play data safety form.
if (androidMeta) {
  const declarations = metadata.declarations ?? {};
  const missing = ["dataSafety", "contentRating", "appAccess"].filter((key) => declarations[key] !== true);
  if (missing.length) add("FAIL", "data safety", `android.json declarations not completed: ${missing.join(", ")}`);
  else add("PASS", "data safety", "data safety, content rating and app access declared");
} else {
  add("FAIL", "data safety", ".mobile/metadata/android.json is missing");
}

// 3. Purpose strings for permissions that Apple/Play require to explain.
const purposeRules = [
  { permission: "camera", ios: "NSCameraUsageDescription", android: "CAMERA" },
  { permission: "photos", ios: "NSPhotoLibraryUsageDescription", android: "READ_MEDIA_IMAGES" },
  { permission: "microphone", ios: "NSMicrophoneUsageDescription", android: "RECORD_AUDIO" },
  { permission: "location-when-in-use", ios: "NSLocationWhenInUseUsageDescription", android: "ACCESS_FINE_LOCATION" },
  { permission: "location-background", ios: "NSLocationAlwaysAndWhenInUseUsageDescription", android: "ACCESS_BACKGROUND_LOCATION" }
];
const iosText = [...files.filter((f) => /Info\.plist$|project\.yml$|app\.json$/.test(f)).map(read), read(join(root, "app.json"))].join("\n");
const androidText = files.filter((f) => /AndroidManifest\.xml$/.test(f)).map(read).join("\n");
const purposeMisses = [];
for (const rule of purposeRules) {
  if (!permissions.includes(rule.permission)) continue;
  if (!iosText.includes(rule.ios)) purposeMisses.push(rule.ios);
  if (androidText && !androidText.includes(rule.android)) purposeMisses.push(rule.android);
}
if (purposeMisses.length) add("FAIL", "purpose strings", `declared permission without explanation: ${[...new Set(purposeMisses)].join(", ")}`);
else add("PASS", "purpose strings", permissions.length ? `every declared permission has an iOS usage string${androidText ? " and Android permission" : ""}` : "no sensitive permissions requested");

// 4. Play target API (36+; the extension window has passed).
const versionFiles = files.filter((f) => /libs\.versions\.toml$|build\.gradle(\.kts)?$/.test(f));
const targetLine = versionFiles.map(read).join("\n").match(/targetSdk(?:Version)?\s*=?\s*["']?(\d+)/);
const target = targetLine ? Number(targetLine[1]) : null;
if (target === null) add("WARN", "target API", "no targetSdk found (no Android project yet)");
else if (target < 36) add("FAIL", "target API", `targetSdk ${target}; Play requires 36 for new apps and updates`);
else add("PASS", "target API", `targetSdk ${target}`);

// 5. 16 KB page size: Java/Kotlin-only apps are already compatible; native libraries must be
//    built with a 16 KB-aware NDK and AGP.
const nativeLibs = files.filter((f) => /\.so$/.test(f));
if (!nativeLibs.length) {
  add("PASS", "16 KB pages", "no native libraries; Java/Kotlin-only build is compatible");
} else {
  const androidTextAll = versionFiles.map(read).join("\n");
  const agp = (androidTextAll.match(/agp\s*=\s*["'](\d+)\.(\d+)/) || []).slice(1, 3).map(Number);
  const agpOk = agp.length === 2 && (agp[0] > 8 || (agp[0] === 8 && agp[1] >= 5));
  if (agpOk) add("PASS", "16 KB pages", `${nativeLibs.length} native librar(ies) found; AGP ${agp.join(".")} supports 16 KB`);
  else add("FAIL", "16 KB pages", `${nativeLibs.length} native librar(ies) found but AGP is below 8.5; rebuild with NDK r27+`);
}

// 6. Account deletion, in-app plus a web link.
if (accounts) {
  const compliance = read(join(mobile, "05-compliance.md"));
  const listing = read(join(mobile, "metadata", "listing.md")) + read(join(mobile, "metadata", "ios.json")) + read(join(mobile, "metadata", "android.json"));
  const inApp = /delete account|account deletion|delete-account/i.test(compliance);
  const link = /https?:\/\/\S*delete/i.test(compliance + listing);
  if (inApp && link) add("PASS", "account deletion", "in-app path and web deletion link documented");
  else add("FAIL", "account deletion", `missing ${[!inApp && "in-app path", !link && "web link"].filter(Boolean).join(" and ")}`);
} else {
  add("PASS", "account deletion", "profile has no accounts, so 5.1.1(v) does not apply");
}

// 7. Restore purchases whenever there is a paid unlock.
const compliance = read(join(mobile, "05-compliance.md"));
if (subscription && !/restore/i.test(compliance)) add("FAIL", "restore purchases", "paid unlock declared without a restore path in 05-compliance.md");
else if (subscription) add("PASS", "restore purchases", "restore path documented");
else add("PASS", "restore purchases", "no paid unlock declared");

// 8. Screenshot and icon sizes from the store limits the kit already encodes.
const iosShots = (iosMeta?.screenshots ?? []).map(String);
const androidShots = (metadata.screenshots ?? []).map(String);
const iosAllowed = new Set(["1320x2868", "1290x2796", "1284x2778", "1242x2688", "1242x2208"]);
const badIos = iosShots.filter((size) => !iosAllowed.has(size));
const badIosIcon = iosMeta && iosMeta.icon !== "1024x1024";
const badAndroidIcon = androidMeta && androidMeta.icon !== "512x512";
const badFeature = androidMeta && androidMeta.featureGraphic !== "1024x500";
const badShots = androidShots.filter((size) => !/^\d{3,4}x\d{3,4}$/.test(size));
if (badIos.length || badIosIcon || badAndroidIcon || badFeature || badShots.length) {
  add("FAIL", "screenshot sizes", [
    badIos.length && `iOS screenshots not an accepted size: ${badIos.join(", ")}`,
    badIosIcon && "iOS icon must be 1024x1024",
    badAndroidIcon && "Android icon must be 512x512",
    badFeature && "feature graphic must be 1024x500",
    badShots.length && `malformed Android screenshot sizes: ${badShots.join(", ")}`
  ].filter(Boolean).join("; "));
} else {
  add("PASS", "screenshot sizes", `${iosShots.length} iOS / ${androidShots.length} Android screenshots match the documented sizes`);
}

for (const result of results) {
  const mark = result.status === "PASS" ? "✓" : result.status === "WARN" ? "!" : "✗";
  console.log(`  ${mark} ${result.name}: ${result.detail}`);
}
const failed = results.filter((r) => r.status === "FAIL").length;
const warned = results.filter((r) => r.status === "WARN").length;
const blocking = failed + (strict ? warned : 0);
console.log(`\n${blocking ? "FAIL" : "PASS"} — ${results.length - failed - warned} passed, ${warned} warning(s), ${failed} error(s) in ${root}`);
process.exit(blocking ? 1 : 0);
