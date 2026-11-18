#!/usr/bin/env node
// Inventory an existing app before rebuilding it. Read-only and dependency-free.
//
//   node scripts/inventory-existing.mjs --src ../my-app
//   node scripts/inventory-existing.mjs --src ../my-app --dir .mobile
//   node scripts/inventory-existing.mjs --src ../my-app --json
//
// Writes .mobile/00-existing.json and .mobile/00-existing.md. Every field is derived from
// files on disk; nothing is inferred from a prompt. Environment variable NAMES are recorded,
// never their values — a secret in an inventory file is how rebuilds leak credentials.

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, relative, extname, basename, dirname } from "node:path";

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".gradle", ".expo", ".next", ".nuxt", "build", "dist", "out",
  "Pods", "DerivedData", ".dart_tool", ".idea", ".vscode", "vendor", "coverage", ".mobile",
  "__pycache__", ".cache", "bin", "obj"
]);
const CODE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".swift", ".kt", ".kts", ".java", ".dart",
  ".html", ".vue", ".svelte", ".json", ".plist", ".xml", ".gradle", ".toml", ".yaml", ".yml",
  ".env", ".md", ".xcconfig", ".pbxproj", ".strings"
]);

function parseArgs(argv) {
  const opts = { dir: ".mobile", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--src") opts.src = argv[++i];
    else if (a === "--dir") opts.dir = argv[++i];
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else throw new Error(`unknown flag ${a}`);
  }
  return opts;
}

function usage() {
  return `Usage:
  node scripts/inventory-existing.mjs --src <path> [--dir .mobile] [--json]

Reads an existing React Native/Expo, Flutter, Capacitor/Ionic, native iOS, native Android or
web/PWA codebase and writes .mobile/00-existing.json + 00-existing.md for the migration analyst.
Read-only: it never edits the source app, and it records environment variable names only.`;
}

function walk(root, limit = 6000) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < limit) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.endsWith(".xcassets")) stack.push(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  return files.sort();
}

function read(path) {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function rel(root, file) {
  return relative(root, file).replace(/\\/g, "/");
}

function versionOf(spec) {
  return String(spec ?? "").replace(/^[\^~>=<\s]+/, "").trim() || "unpinned";
}

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

function detectStack(root, files, pkg) {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name);
  const names = new Set(files.map((f) => rel(root, f)));
  const frameworks = [];
  if (has("expo") || has("expo-router")) frameworks.push("expo");
  if (has("react-native")) frameworks.push("react-native");
  if (has("@capacitor/core")) frameworks.push("capacitor");
  if (has("@ionic/react") || has("@ionic/angular") || has("@ionic/vue")) frameworks.push("ionic");
  if (has("next")) frameworks.push("next");
  if (has("vite")) frameworks.push("vite");
  if (names.has("pubspec.yaml") && read(join(root, "pubspec.yaml")).includes("flutter:")) frameworks.push("flutter");
  if ([...names].some((n) => /(^|\/)settings\.gradle(\.kts)?$/.test(n)) && [...names].some((n) => n.endsWith("AndroidManifest.xml"))) frameworks.push("android-native");
  if ([...names].some((n) => /\.xcodeproj\/project\.pbxproj$/.test(n)) || (names.has("Package.swift") && [...names].some((n) => n.endsWith(".swift")))) frameworks.push("ios-native");
  if (!frameworks.length && [...names].some((n) => n.endsWith("index.html"))) frameworks.push("web");

  const languages = [];
  const ext = (e) => [...names].some((n) => n.endsWith(e));
  if (ext(".tsx") || ext(".ts") || ext(".jsx") || ext(".js")) languages.push("TypeScript/JavaScript");
  if (ext(".kt")) languages.push("Kotlin");
  if (ext(".swift")) languages.push("Swift");
  if (ext(".dart")) languages.push("Dart");

  const primary = frameworks.includes("expo") ? "expo"
    : frameworks.includes("react-native") ? "react-native"
    : frameworks.includes("flutter") ? "flutter"
    : frameworks.includes("capacitor") ? "capacitor"
    : frameworks.includes("ionic") ? "ionic"
    : frameworks.includes("android-native") && frameworks.includes("ios-native") ? "native-both"
    : frameworks.includes("android-native") ? "native-android"
    : frameworks.includes("ios-native") ? "native-ios"
    : frameworks.includes("web") ? "web-pwa"
    : "unknown";

  return { primary, frameworks, languages, confidence: primary === "unknown" ? "low" : frameworks.length > 1 ? "high" : "medium" };
}

// ---------------------------------------------------------------------------
// Screens, routes and the navigation graph
// ---------------------------------------------------------------------------

function routeFromFile(relativePath) {
  let route = relativePath
    .replace(/^app\//, "/")
    .replace(/\/?index\.(tsx|ts|jsx|js)$/, "")
    .replace(/\.(tsx|ts|jsx|js)$/, "")
    .replace(/\[([^\]]+)\]/g, ":$1")
    .replace(/\(([^)]+)\)\//g, "");
  route = `/${route.replace(/^\/+/, "")}`.replace(/\/+$/, "");
  return route || "/";
}

function detectScreens(root, files, stack) {
  const screens = [];
  const seen = new Set();
  const add = (name, file, route, kind) => {
    const key = `${name}|${file}|${route ?? ""}`;
    if (!name || seen.has(key)) return;
    seen.add(key);
    screens.push({ name, file, route: route ?? null, kind });
  };

  for (const file of files) {
    const name = rel(root, file);
    const text = read(file);
    const base = basename(file);

    if (stack.frameworks.includes("expo") && /(^|\/)app\/.+\.(tsx|ts|jsx|js)$/.test(name)) {
      let exportName = base.replace(/\.(tsx|ts|jsx|js)$/, "");
      if (exportName === "index" || exportName === "_layout") exportName = basename(dirname(file));
      if (exportName.startsWith("_")) continue;
      add(exportName, name, routeFromFile(name), "expo-router");
    }
    if (/(^|\/)(screens?|views?|pages?)\//i.test(name) && /\.(tsx|jsx|swift|kt|dart|vue|svelte)$/.test(name)) {
      const exported = text.match(/export\s+(?:default\s+)?function\s+([A-Z]\w+)/)?.[1];
      const swift = text.match(/struct\s+([A-Z]\w+(?:View|Screen))\s*:\s*View/)?.[1];
      const kotlin = text.match(/(?:@Composable\s+)?fun\s+([A-Z]\w+(?:Screen|Route))\s*\(/)?.[1];
      const dart = text.match(/class\s+([A-Z]\w+(?:Screen|Page))\b/)?.[1];
      const fallback = base.replace(/\.(tsx|jsx|swift|kt|dart|vue|svelte)$/, "");
      add(exported || swift || kotlin || dart || fallback, name, null, "file");
    }
    for (const m of text.matchAll(/<Stack\.Screen\b[^>]*\bname=["']([^"']+)["']/g)) add(m[1], name, m[1], "react-navigation");
    for (const m of text.matchAll(/<(?:Tab|Drawer)\.Screen\b[^>]*\bname=["']([^"']+)["']/g)) add(m[1], name, m[1], "react-navigation");
    for (const m of text.matchAll(/class\s+([A-Z]\w+(?:Screen|Page))\s+extends\s+State/gi)) add(m[1], name, null, "flutter");
    for (const m of text.matchAll(/GoRoute\(\s*path:\s*['"]([^'"]+)['"]/g)) add(m[1], name, m[1], "flutter");
    for (const m of text.matchAll(/composable\(\s*["']([^"']+)["']\s*\)/g)) add(m[1], name, m[1], "navigation-compose");
    for (const m of text.matchAll(/@Composable\s*\n\s*fun\s+([A-Z]\w+)\s*\(/g)) {
      if (!/(Screen|App|Theme|Content)$/.test(m[1]) && !/Theme/.test(m[1])) continue;
      add(m[1], name, null, "compose");
    }
    for (const m of text.matchAll(/struct\s+([A-Z]\w+(?:View|Screen))\s*:\s*View/g)) add(m[1], name, null, "swiftui");
    for (const m of text.matchAll(/<Route\s+path=["']([^"']+)["']/g)) add(m[1], name, m[1], "web-router");
  }

  // A screen found by filename ("StatsScreen") and by navigator name ("Stats") is one screen.
  const normalizeName = (name) => String(name).replace(/(Screen|View|Page|Route)$/i, "").toLowerCase();
  const deduped = screens.filter((screen) => !(screen.kind === "file" && screens.some((other) =>
    other !== screen && other.kind !== "file" && normalizeName(other.name) === normalizeName(screen.name))));
  deduped.sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file));
  return deduped;
}

function detectNavigation(root, files, screens) {
  const all = files.filter((f) => CODE_EXT.has(extname(f))).map((f) => read(f)).join("\n");
  const type = /expo-router/.test(all) ? "expo-router"
    : /createNativeStackNavigator|createBottomTabNavigator|NavigationContainer/.test(all) ? "react-navigation"
    : /NavHost\(|navigation-compose/.test(all) ? "navigation-compose"
    : /NavigationStack|TabView\s*\{/.test(all) ? "swiftui-navigation"
    : /GoRouter|MaterialApp\(\s*[^)]*routes:/.test(all) ? "flutter-router"
    : /react-router|next\/router|useRouter/.test(all) ? "web-router"
    : screens.length ? "none-detected" : "none";

  const byName = new Map(screens.map((s) => [s.name, s]));
  const graph = [];
  for (const screen of screens) {
    if (!screen.file) continue;
    const text = read(join(root, screen.file));
    for (const other of screens) {
      if (other.name === screen.name) continue;
      // Screens declared in the same navigator file are siblings, not edges.
      if (other.file === screen.file) continue;
      const named = new RegExp(`\\b${other.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);
      const routed = other.route && other.route !== "/" && new RegExp(`["'\`]${other.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`).test(text);
      if (named || routed) graph.push({ from: screen.name, to: other.name });
    }
  }
  const initial = all.match(/initialRouteName=["']([^"']+)["']/)?.[1]
    ?? all.match(/initialRoute\s*=\s*["']([^"']+)["']/)?.[1]
    ?? null;
  return {
    type,
    graph: graph.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
    initialRoute: initial,
    note: graph.length ? "edges are literal references between screen files" : "no edges found; treat the graph as flat"
  };
}

// ---------------------------------------------------------------------------
// APIs, auth, storage
// ---------------------------------------------------------------------------

const URL_NOISE = /(schemas\.|w3\.org|npmjs\.com|github\.com|gradle\.org|apache\.org|creativecommons|apple\.com\/DTDs|developer\.android\.com|example\.(com|org)\/docs|reactnative\.dev|docs\.expo\.dev)/i;

function detectApi(root, files) {
  const baseUrls = [];
  const endpoints = [];
  for (const file of files) {
    if (!CODE_EXT.has(extname(file))) continue;
    const text = read(file);
    for (const m of text.matchAll(/https?:\/\/[^\s"'`)<>\]]+/g)) {
      const url = m[0].replace(/[.,;:]+$/, "");
      if (URL_NOISE.test(url)) continue;
      if (/\/\/(localhost|127\.0\.0\.1)/.test(url)) { baseUrls.push(url); continue; }
      const origin = url.match(/^https?:\/\/[^/]+/)?.[0];
      if (origin) baseUrls.push(origin);
    }
    for (const m of text.matchAll(/(?:baseURL|BASE_URL|apiUrl|API_URL|baseUrl)\s*[:=]\s*["'`]([^"'`]+)["'`]/g)) baseUrls.push(m[1]);
    for (const m of text.matchAll(/["'`](\/api\/[A-Za-z0-9_\-./{}$:]+)["'`]/g)) endpoints.push(m[1]);
    for (const m of text.matchAll(/["'`](\/v\d+\/[A-Za-z0-9_\-./{}$:]+)["'`]/g)) endpoints.push(m[1]);
    // A file that makes HTTP calls or exports an endpoint map holds real API paths, not
    // file imports. One- and two-segment paths ("/habits", "/habits/:id/streaks") count.
    if (/fetch\(|axios|request\(|endpoints/i.test(text)) {
      for (const m of text.matchAll(/["'`](\/[a-z][A-Za-z0-9_-]*(?:\/[:A-Za-z0-9_{}$-]+)*)["'`]/g)) {
        if (/\.(ts|tsx|js|jsx|json|png|css|svg|html|md)$/.test(m[1])) continue;
        endpoints.push(m[1]);
      }
    }
  }
  return { baseUrls: uniq(baseUrls).sort(), endpoints: uniq(endpoints).sort(), note: baseUrls.length ? "base URLs found in source" : "no base URL found; check native networking layers" };
}

const AUTH_PATTERNS = [
  ["supabase-auth", /supabase.*auth|auth\.signIn|createClient\([^)]*supabase/i],
  ["firebase-auth", /@react-native-firebase\/auth|firebase\/auth|FirebaseAuth/i],
  ["auth0", /auth0|Auth0/i],
  ["clerk", /@clerk\/|clerk\./],
  ["sign-in-with-apple", /expo-apple-authentication|ASAuthorizationAppleIDProvider|SignInWithAppleButton/i],
  ["google-sign-in", /GoogleSignin|google-signin|expo-google-app-auth/i],
  ["custom-jwt", /\bjwt\b|Bearer\s|jsonwebtoken|Authorization/i],
  ["session-cookie", /withCredentials|cookie-session|sessionStorage/i]
];

function detectAuth(root, files, pkg) {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const providers = [];
  const evidence = [];
  const source = files.filter((f) => CODE_EXT.has(extname(f)));
  const blob = source.map((f) => read(f)).join("\n");
  for (const [name, pattern] of AUTH_PATTERNS) {
    if (pattern.test(blob)) { providers.push(name); }
  }
  for (const [dep, label] of [["@supabase/supabase-js", "supabase-auth"], ["firebase", "firebase-auth"], ["@react-native-firebase/auth", "firebase-auth"], ["@clerk/clerk-expo", "clerk"], ["expo-auth-session", "oauth"], ["next-auth", "next-auth"]]) {
    if (deps[dep]) providers.push(label);
  }
  for (const file of source) {
    const text = read(file);
    if (/signIn|sign_in|login|Login/.test(text) && /auth/i.test(text)) evidence.push(rel(root, file));
  }
  const unique = uniq(providers);
  return {
    method: unique.length ? unique.join(" + ") : "none detected",
    providers: unique,
    evidence: uniq(evidence).slice(0, 12),
    note: "detected from imports and auth calls; confirm the real session/token flow by hand"
  };
}

const STORAGE_LIBS = [
  ["@react-native-async-storage/async-storage", "AsyncStorage"],
  ["expo-secure-store", "SecureStore (keychain/keystore)"],
  ["expo-sqlite", "SQLite"],
  ["react-native-mmkv", "MMKV"],
  ["realm", "Realm"],
  ["@realm/react", "Realm"],
  ["watermelondb", "WatermelonDB"],
  ["firebase", "Firebase"],
  ["@react-native-firebase/firestore", "Firestore"],
  ["shared_preferences", "shared_preferences"],
  ["sqflite", "sqflite"],
  ["hive", "Hive"],
  ["isar", "Isar"],
  ["androidx.room", "Room"],
  ["androidx.datastore", "DataStore"],
  ["CoreData", "Core Data"],
  ["SwiftData", "SwiftData"],
  ["localStorage", "localStorage"],
  ["IndexedDB", "IndexedDB"]
];

function detectStorage(root, files, pkg, manifest) {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const blob = files.filter((f) => CODE_EXT.has(extname(f))).map((f) => read(f)).join("\n");
  const found = [];
  for (const [needle, label] of STORAGE_LIBS) {
    if (Object.prototype.hasOwnProperty.call(deps, needle)) found.push(label);
    else if (/^[A-Z]/.test(needle) && new RegExp(`\\b${needle}\\b`).test(blob)) found.push(label);
  }
  if (/(^|\/)AndroidManifest\.xml$/m.test(manifest)) {
    if (/androidx\.room/.test(blob)) found.push("Room");
  }
  return uniq(found);
}

// ---------------------------------------------------------------------------
// SDKs, permissions, billing, push, env, assets, tests
// ---------------------------------------------------------------------------

function detectSdks(root, files, pkg) {
  const sdks = [];
  const push = (name, version, source) => sdks.push({ name, version: version || "unknown", source });
  for (const [name, spec] of Object.entries(pkg?.dependencies ?? {})) push(name, versionOf(spec), "package.json");
  for (const file of files) {
    const name = rel(root, file);
    if (/(^|\/)podfile$/i.test(name)) {
      for (const m of read(file).matchAll(/^\s*pod\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/gm)) push(m[1], m[2] ?? "", name);
    } else if (/build\.gradle(\.kts)?$/.test(name) || name === "gradle/libs.versions.toml") {
      const text = read(file);
      for (const m of text.matchAll(/"([\w.\-]+:[\w.\-]+)(?::([\w.\-${}]+))?"/g)) {
        if (!m[1].startsWith("org.gradle") && !m[1].startsWith("com.android.tools")) push(m[1], m[2] ?? "catalog", name);
      }
    } else if (/pubspec\.yaml$/.test(name)) {
      for (const m of read(file).matchAll(/^\s{2}([a-z0-9_]+):\s*[\^~]?([\d.]+)?/gm)) push(m[1], m[2] ?? "", name);
    }
  }
  const seen = new Set();
  return sdks.filter((sdk) => {
    const key = `${sdk.name}@${sdk.version}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function detectPermissions(root, files) {
  const ios = [];
  const android = [];
  const appJson = readJson(join(root, "app.json")) ?? readJson(join(root, "app.config.json"));
  for (const [key] of Object.entries(appJson?.expo?.ios?.infoPlist ?? {})) if (/UsageDescription$/.test(key)) ios.push(key.replace(/^NS/, "").replace(/UsageDescription$/, ""));
  for (const entry of appJson?.expo?.android?.permissions ?? []) android.push(String(entry).replace(/^android\.permission\./, ""));
  for (const file of files) {
    if (!/Info\.plist$/.test(file)) continue;
    for (const m of read(file).matchAll(/<key>(NS\w+UsageDescription)<\/key>/g)) ios.push(m[1].replace(/^NS/, "").replace(/UsageDescription$/, ""));
  }
  for (const file of files) {
    if (!/AndroidManifest\.xml$/.test(file)) continue;
    for (const m of read(file).matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)) android.push(m[1].replace(/^android\.permission\./, ""));
  }
  return { ios: uniq(ios).sort(), android: uniq(android).sort() };
}

function detectBilling(root, files, pkg) {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const providers = [];
  for (const [dep, label] of [
    ["react-native-iap", "react-native-iap"], ["expo-in-app-purchases", "expo-in-app-purchases"],
    ["react-native-purchases", "RevenueCat"], ["@revenuecat/purchases-js", "RevenueCat"],
    ["in_app_purchase", "flutter in_app_purchase"], ["com.android.billingclient", "Play Billing"],
    ["StoreKit", "StoreKit"]
  ]) if (Object.prototype.hasOwnProperty.call(deps, dep)) providers.push(label);
  const blob = files.filter((f) => CODE_EXT.has(extname(f))).map((f) => read(f)).join("\n");
  if (/com\.android\.billingclient/.test(blob)) providers.push("Play Billing");
  if (/import\s+StoreKit|Product\.products\(for:/.test(blob)) providers.push("StoreKit");
  if (/react-native-purchases|Purchases\.configure/.test(blob)) providers.push("RevenueCat");
  const products = [];
  for (const m of blob.matchAll(/(?:productId|product_id|sku|SKU)s?\s*[:=]\s*\[?\s*["']([^"']+)["']/g)) products.push(m[1]);
  for (const m of blob.matchAll(/["']((?:com|io|app)\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*\.(?:monthly|yearly|annual|pro|premium|lifetime|sub))["']/gi)) products.push(m[1]);
  return { providers: uniq(providers), products: uniq(products).sort(), note: products.length ? "product ids found in source" : "no product ids found; read them from the store console" };
}

function detectPush(root, files, pkg) {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const providers = [];
  for (const dep of ["expo-notifications", "@react-native-firebase/messaging", "@capacitor/push-notifications", "firebase_messaging", "OneSignal"]) {
    if (Object.prototype.hasOwnProperty.call(deps, dep)) providers.push(dep.replace(/^@/, ""));
  }
  const blob = files.filter((f) => CODE_EXT.has(extname(f))).map((f) => read(f)).join("\n");
  if (/FirebaseMessagingService|FirebaseMessaging\.getInstance/.test(blob)) providers.push("FCM");
  if (/UNUserNotificationCenter|registerForRemoteNotifications/.test(blob)) providers.push("APNs");
  const googleServices = files.some((f) => /google-services\.json$/.test(f)) || /googleServicesFile/.test(read(join(root, "app.json")));
  const apsEntitlement = files.some((f) => /\.entitlements$/.test(f) && /aps-environment/.test(read(f)));
  return { providers: uniq(providers), configured: googleServices || apsEntitlement, signals: { googleServices, apsEntitlement } };
}

function detectEnv(root, files) {
  const names = [];
  const sources = [];
  const add = (name, file) => { if (name) { names.push(name); sources.push({ name, file }); } };
  for (const file of files) {
    const name = rel(root, file);
    if (/(^|\/)\.env(\.|$)/.test(basename(file)) || basename(file) === ".env") {
      for (const line of read(file).split("\n")) {
        const key = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1];
        if (key) add(key, name);
      }
    } else if (CODE_EXT.has(extname(file))) {
      const text = read(file);
      for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) add(m[1], name);
      for (const m of text.matchAll(/process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g)) add(m[1], name);
      for (const m of text.matchAll(/--dart-define=([A-Z][A-Z0-9_]*)/g)) add(m[1], name);
    }
  }
  const unique = new Map();
  for (const row of sources) {
    if (!unique.has(row.name)) unique.set(row.name, { name: row.name, files: [] });
    const entry = unique.get(row.name);
    if (!entry.files.includes(row.file)) entry.files.push(row.file);
  }
  return {
    valuesRecorded: false,
    names: [...unique.values()].sort((a, b) => a.name.localeCompare(b.name)),
    note: "names only; values were never read into the inventory"
  };
}

function detectAssets(root, files) {
  const imageExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf"]);
  const fontExt = new Set([".ttf", ".otf", ".woff", ".woff2"]);
  const images = files.filter((f) => imageExt.has(extname(f).toLowerCase())).map((f) => rel(root, f));
  const fonts = files.filter((f) => fontExt.has(extname(f).toLowerCase())).map((f) => rel(root, f));
  const appJson = readJson(join(root, "app.json")) ?? readJson(join(root, "app.config.json"));
  return {
    images: images.length,
    fonts: fonts.length,
    icon: appJson?.expo?.icon ?? images.find((f) => /icon/i.test(f)) ?? null,
    splash: appJson?.expo?.splash?.image ?? images.find((f) => /splash/i.test(f)) ?? null,
    sample: images.slice(0, 40)
  };
}

function detectTests(root, files, pkg) {
  const testFiles = files.filter((f) => {
    const name = rel(root, f);
    return /(^|\/)(__tests__|tests?|src\/test)\//i.test(name) && !/node_modules|Pods/.test(name)
      || /\.(test|spec)\.(tsx?|jsx?|mjs)$/.test(name)
      || /_test\.dart$/.test(name)
      || /Tests\/.*\.swift$/.test(name);
  }).map((f) => rel(root, f));
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const frameworks = [];
  for (const dep of ["jest", "vitest", "mocha", "@testing-library/react-native", "flutter_test", "junit", "XCTest"]) {
    if (Object.prototype.hasOwnProperty.call(deps, dep)) frameworks.push(dep);
  }
  if (files.some((f) => /flutter_test/.test(read(f)))) frameworks.push("flutter_test");
  if (testFiles.some((f) => /\.swift$/.test(f))) frameworks.push("XCTest");
  return { files: testFiles, count: testFiles.length, frameworks: uniq(frameworks), coverage: "not measured — run the suite to get real coverage" };
}

// ---------------------------------------------------------------------------

function inventory(src) {
  const root = resolve(src);
  const pkg = readJson(join(root, "package.json"));
  const files = walk(root);
  const manifest = files.filter((f) => /AndroidManifest\.xml$/.test(f)).map((f) => rel(root, f)).join("\n");
  const stack = detectStack(root, files, pkg);
  const screens = detectScreens(root, files, stack);
  return {
    schema: "mobile-app-factory/existing-inventory@1",
    generatedAt: new Date().toISOString(),
    source: { path: root, filesScanned: files.length, truncated: files.length >= 6000 },
    stack,
    screens: screens.map((s) => ({ ...s })),
    navigation: detectNavigation(root, files, screens),
    api: detectApi(root, files),
    auth: detectAuth(root, files, pkg),
    storage: detectStorage(root, files, pkg, manifest),
    sdks: detectSdks(root, files, pkg),
    permissions: detectPermissions(root, files),
    billing: detectBilling(root, files, pkg),
    push: detectPush(root, files, pkg),
    env: detectEnv(root, files),
    assets: detectAssets(root, files),
    tests: detectTests(root, files, pkg),
    packageJson: pkg ? { name: pkg.name ?? null, version: pkg.version ?? null, scripts: Object.keys(pkg.scripts ?? {}) } : null
  };
}

function toMarkdown(inv) {
  const rows = (items, render) => items.length ? items.map(render).join("\n") : "| — | — |";
  const screenRows = inv.screens.length
    ? inv.screens.map((s) => `| ${s.name} | ${s.route ?? "—"} | ${s.file} | ${s.kind} |`).join("\n")
    : "| none found | — | — | — |";
  const edgeRows = inv.navigation.graph.length
    ? inv.navigation.graph.map((e) => `${e.from} → ${e.to}`).join(", ")
    : "flat — no literal references between screen files";
  return `# Existing app inventory

- **Source:** \`${inv.source.path}\`
- **Generated:** ${inv.generatedAt}
- **Files scanned:** ${inv.source.filesScanned}${inv.source.truncated ? " (truncated at 6000)" : ""}

## Detected stack

| Field | Value |
|---|---|
| Primary | ${inv.stack.primary} |
| Frameworks | ${inv.stack.frameworks.join(", ") || "none detected"} |
| Languages | ${inv.stack.languages.join(", ") || "none detected"} |
| Confidence | ${inv.stack.confidence} |

## Screens and routes (${inv.screens.length})

| Screen | Route | File | Detected as |
|---|---|---|---|
${screenRows}

**Navigation type:** ${inv.navigation.type} · **initial route:** ${inv.navigation.initialRoute ?? "not declared"}

**Graph:** ${edgeRows}

_${inv.navigation.note}._

## API

- **Base URLs:** ${inv.api.baseUrls.join(", ") || "none found"}
- **Endpoints:** ${inv.api.endpoints.join(", ") || "none found"}

## Auth

- **Method:** ${inv.auth.method}
- **Evidence:** ${inv.auth.evidence.join(", ") || "none"}

## Local storage / database

${inv.storage.length ? inv.storage.map((s) => `- ${s}`).join("\n") : "- none detected"}

## Third-party SDKs (${inv.sdks.length})

| SDK | Version | Source |
|---|---|---|
${rows(inv.sdks, (s) => `| ${s.name} | ${s.version} | ${s.source} |`)}

## Permissions

- **iOS:** ${inv.permissions.ios.join(", ") || "none declared"}
- **Android:** ${inv.permissions.android.join(", ") || "none declared"}

## Billing

- **Providers:** ${inv.billing.providers.join(", ") || "none detected"}
- **Products:** ${inv.billing.products.join(", ") || "none found"}

## Push

- **Providers:** ${inv.push.providers.join(", ") || "none detected"}
- **Configured files present:** ${inv.push.configured ? "yes" : "no"}

## Environment variables (names only)

${inv.env.names.length ? inv.env.names.map((e) => `- \`${e.name}\` (${e.files.join(", ")})`).join("\n") : "- none found"}

> ${inv.env.note}.

## Assets

- **Images:** ${inv.assets.images} · **fonts:** ${inv.assets.fonts}
- **Icon:** ${inv.assets.icon ?? "not declared"} · **Splash:** ${inv.assets.splash ?? "not declared"}

## Tests

- **Files:** ${inv.tests.count}${inv.tests.files.length ? ` (${inv.tests.files.slice(0, 10).join(", ")}${inv.tests.count > 10 ? ", …" : ""})` : ""}
- **Frameworks:** ${inv.tests.frameworks.join(", ") || "none detected"}
- **Coverage:** ${inv.tests.coverage}

## Next

Run the migration analyst (\`agents/00-migration-analyst.md\`) to turn this into
\`.mobile/00-migration-plan.md\`: a keep/change/drop/add parity matrix, data migration,
API contract, SDK replacements, risks and a strangler cutover order.
`;
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (error) {
    console.error(`error: ${error.message}\n\n${usage()}`);
    process.exit(2);
  }
  if (opts.help) { console.log(usage()); return; }
  if (!opts.src) { console.error(`error: --src is required\n\n${usage()}`); process.exit(2); }
  if (!existsSync(resolve(opts.src)) || !statSync(resolve(opts.src)).isDirectory()) {
    console.error(`error: no directory at ${resolve(opts.src)}`);
    process.exit(2);
  }
  const inv = inventory(opts.src);
  if (opts.json) { console.log(JSON.stringify(inv, null, 2)); return; }
  const dir = resolve(opts.dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "00-existing.json"), `${JSON.stringify(inv, null, 2)}\n`);
  writeFileSync(join(dir, "00-existing.md"), toMarkdown(inv));
  console.log(`Inventory: ${inv.stack.primary} · ${inv.screens.length} screen(s) · ${inv.sdks.length} SDK(s) · ${inv.api.baseUrls.length} base URL(s)`);
  console.log(`Wrote: ${join(dir, "00-existing.json")}`);
  console.log(`Wrote: ${join(dir, "00-existing.md")}`);
  console.log(`Next: agents/00-migration-analyst.md → ${join(dir, "00-migration-plan.md")}`);
}

main();

export { inventory };
