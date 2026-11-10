#!/usr/bin/env node
/**
 * Store metadata validator for the Mobile App Factory.
 *
 * Usage:
 *   node validate-metadata.mjs <dir>
 *   node validate-metadata.mjs .mobile/metadata
 *
 * Accepts either ios.json + android.json, or a single metadata.json containing
 * { "ios": {...}, "android": {...} }.
 * Exits 1 when there are errors, 0 when clean (warnings do not fail).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? '.mobile/metadata';
const errors = [];
const warnings = [];

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${path}: invalid JSON — ${e.message}`);
    return null;
  }
};

const load = () => {
  if (!existsSync(dir)) {
    errors.push(`Directory not found: ${dir}`);
    return {};
  }
  const single = join(dir, 'metadata.json');
  if (existsSync(single)) {
    const j = readJson(single);
    return { ios: j?.ios, android: j?.android, source: single };
  }
  return {
    ios: existsSync(join(dir, 'ios.json')) ? readJson(join(dir, 'ios.json')) : undefined,
    android: existsSync(join(dir, 'android.json')) ? readJson(join(dir, 'android.json')) : undefined,
    source: dir,
  };
};

const isUrl = (v) => typeof v === 'string' && /^https?:\/\/[^\s]+\.[^\s]+/.test(v);
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const len = (v) => (typeof v === 'string' ? [...v].length : 0);

const checkLimit = (where, field, value, max, required = false) => {
  if (required && !value) {
    errors.push(`${where}.${field}: required`);
    return;
  }
  if (value == null) return;
  const n = len(value);
  if (n === 0 && required) errors.push(`${where}.${field}: empty`);
  else if (n > max) errors.push(`${where}.${field}: ${n}/${max} characters — over limit`);
  else if (n > max * 0.9) warnings.push(`${where}.${field}: ${n}/${max} — close to the limit`);
};

const parseDims = (s) => {
  const m = /^(\d+)\s*[x×]\s*(\d+)$/.exec(String(s).trim());
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
};

const checkScreenshots = (where, shots, { min, max, minEdge = 320, maxEdge = 3840 }) => {
  if (!Array.isArray(shots) || shots.length === 0) {
    errors.push(`${where}.screenshots: at least ${min} required (WxH strings, e.g. "1320x2868")`);
    return;
  }
  if (shots.length < min) errors.push(`${where}.screenshots: ${shots.length} provided, ${min} required`);
  if (max && shots.length > max) errors.push(`${where}.screenshots: ${shots.length} provided, max ${max}`);
  shots.forEach((s, i) => {
    const d = parseDims(s);
    if (!d) {
      errors.push(`${where}.screenshots[${i}]: "${s}" is not WxH`);
      return;
    }
    if (Math.min(d.w, d.h) < minEdge) errors.push(`${where}.screenshots[${i}]: ${s} — shortest edge below ${minEdge}px`);
    if (Math.max(d.w, d.h) > maxEdge) errors.push(`${where}.screenshots[${i}]: ${s} — longest edge above ${maxEdge}px`);
    const ratio = d.h / d.w;
    if (ratio < 1.5 || ratio > 2.4) {
      warnings.push(`${where}.screenshots[${i}]: ${s} — unusual aspect ratio for a phone (${ratio.toFixed(2)}:1)`);
    }
  });
};

const { ios, android } = load();

/* ---------------------------------- iOS --------------------------------- */
if (!ios) {
  errors.push('ios: missing (ios.json or metadata.json#ios)');
} else {
  const w = 'ios';
  checkLimit(w, 'name', ios.name, 30, true);
  checkLimit(w, 'subtitle', ios.subtitle, 30);
  checkLimit(w, 'promotionalText', ios.promotionalText, 170);
  checkLimit(w, 'keywords', ios.keywords, 100);
  checkLimit(w, 'description', ios.description, 4000, true);
  checkLimit(w, 'whatsNew', ios.whatsNew, 4000);

  if (!isUrl(ios.supportUrl)) errors.push('ios.supportUrl: required, must be a full URL');
  if (!isUrl(ios.privacyPolicyUrl)) errors.push('ios.privacyPolicyUrl: required, must be a full URL');
  if (!ios.primaryCategory) errors.push('ios.primaryCategory: required');
  if (!['4+', '9+', '13+', '16+', '18+'].includes(ios.ageRating)) {
    errors.push('ios.ageRating: must be one of 4+, 9+, 13+, 16+, 18+ (new system)');
  }
  if (!ios.demoAccount || !ios.demoAccount.username || !ios.demoAccount.password) {
    warnings.push('ios.demoAccount: missing — required if the app has a login (Guideline 2.1)');
  }
  if (ios.icon !== '1024x1024') errors.push('ios.icon: must be "1024x1024" (no alpha)');
  checkScreenshots('ios', ios.screenshots, { min: 1, max: 10, minEdge: 1290 });
  if (Array.isArray(ios.screenshots) && !ios.screenshots.some((s) => {
    const d = parseDims(s);
    return d && Math.min(d.w, d.h) >= 1290 && d.h > d.w;
  })) {
    errors.push('ios.screenshots: a portrait 6.9-inch iPhone set (>=1290px short edge, e.g. 1320x2868) is required');
  }
  if (typeof ios.keywords === 'string' && /\s/.test(ios.keywords.replace(/,/g, ''))) {
    warnings.push('ios.keywords: contains spaces — Apple expects comma-separated terms without spaces');
  }
}

/* -------------------------------- Android ------------------------------- */
if (!android) {
  errors.push('android: missing (android.json or metadata.json#android)');
} else {
  const w = 'android';
  checkLimit(w, 'appName', android.appName, 30, true);
  checkLimit(w, 'shortDescription', android.shortDescription, 80, true);
  checkLimit(w, 'fullDescription', android.fullDescription, 4000, true);

  if (!isEmail(android.contactEmail)) errors.push('android.contactEmail: required and valid');
  if (!isUrl(android.privacyPolicyUrl)) errors.push('android.privacyPolicyUrl: required, must be a full URL');
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(android.packageName ?? '')) {
    errors.push('android.packageName: required, reverse-DNS form (e.g. com.example.app)');
  }
  if (!(typeof android.targetSdk === 'number' && android.targetSdk >= 36)) {
    errors.push('android.targetSdk: must be >= 36 (Play requirement from 31 Aug 2026)');
  }
  if (android.icon !== '512x512') errors.push('android.icon: must be "512x512"');
  if (android.featureGraphic !== '1024x500') errors.push('android.featureGraphic: must be "1024x500"');
  checkScreenshots('android', android.screenshots, { min: 2, max: 8 });
  if (android.screenshots && android.screenshots.length > 8) {
    errors.push('android.screenshots: Play allows at most 8 per device type');
  }
  const d = android.declarations ?? {};
  for (const k of ['dataSafety', 'contentRating', 'appAccess', 'ads', 'targetAudience']) {
    if (d[k] !== true) errors.push(`android.declarations.${k}: must be completed/true before review`);
  }
  if (d.accountDeletion === false) {
    warnings.push('android.declarations.accountDeletion: false — Play requires an in-app and web deletion route if accounts exist');
  }
  if (typeof android.shortDescription === 'string') {
    if (/(download|install|play now|try now|#1|best )/i.test(android.shortDescription)) {
      errors.push('android.shortDescription: contains a call-to-action or ranking claim (policy violation)');
    }
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(android.shortDescription)) {
      errors.push('android.shortDescription: emojis are not allowed');
    }
  }
  if (typeof android.appName === 'string' && /[\u{1F300}-\u{1FAFF}]/u.test(android.appName)) {
    errors.push('android.appName: emojis are not allowed');
  }
}

/* -------------------------------- Report -------------------------------- */
const rel = (p) => p.replace(process.cwd() + '/', '');
console.log(`\nStore metadata check — ${rel(dir)}\n`);

if (warnings.length) {
  console.log(`Warnings (${warnings.length})`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
  console.log('');
}
if (errors.length) {
  console.log(`Errors (${errors.length})`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log('\nNot ready to submit.\n');
  process.exit(1);
}
console.log('All checks passed. Ready for submission.\n');
