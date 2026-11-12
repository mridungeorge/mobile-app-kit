/**
 * Shared browser plumbing for the promo renderers.
 *
 * Both `render.mjs` (frame-by-frame video) and `shot-preview.mjs` (README
 * screenshot of the real preview page) need the same Chrome discovery, the same
 * puppeteer resolution and the same launch flags. Keeping it here means the two
 * cannot drift apart.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export const WIN = process.platform === 'win32';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  path.join(HERE, 'node_modules', '.cache', 'chrome'),
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  path.join(process.env.HOME || '', '.cache', 'ms-playwright', 'chromium-1248', 'chrome-linux64', 'chrome'),
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
];

/** Resolve a usable Chrome/Chromium. An explicit path always wins. */
export function resolveChrome(explicit) {
  const candidates = [explicit, ...CHROME_CANDIDATES].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      'No Chrome/Chromium found. Set CHROME_PATH (or pass --chrome <path>).\n' +
        'Looked at:\n  ' + candidates.join('\n  '),
    );
  }
  return found;
}

/** puppeteer-core, from a local install or the global npm root. */
export function loadPuppeteer() {
  const candidates = [
    path.join(HERE, 'node_modules', 'puppeteer-core'),
    'puppeteer-core',
    path.join(process.env.NPM_GLOBAL_ROOT || '', 'puppeteer-core'),
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      /* try the next one */
    }
  }
  try {
    const globalRoot = execFileSync(WIN ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'puppeteer-core'));
  } catch {
    throw new Error(
      'puppeteer-core not found. Install it first:\n' +
        '  cd promo && npm install\n' +
        'or:  npm install --no-save puppeteer-core',
    );
  }
}

const BASE_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--force-color-profile=srgb',
  '--font-render-hinting=none',
];

/** Launch a headless browser with the flags the artwork expects. */
export async function launch({ chrome, args = [] } = {}) {
  const puppeteer = loadPuppeteer();
  return puppeteer.launch({
    executablePath: resolveChrome(chrome),
    headless: 'new',
    args: [...BASE_ARGS, ...args],
  });
}

/** Wait for webfonts and any page-level `window.__ready` promise. */
export async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__ready);
}
