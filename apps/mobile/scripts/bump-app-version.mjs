#!/usr/bin/env node
/**
 * Bumps fitcupons marketing version + Android versionCode + iOS buildNumber.
 * Usage: node scripts/bump-app-version.mjs [patch|minor|major|x.y.z]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJsonPath = join(mobileRoot, 'app.json');
const packageJsonPath = join(mobileRoot, 'package.json');

const spec = (process.argv[2] || 'patch').trim();

function parseSemver(raw) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(raw || '').trim());
  if (!match) {
    throw new Error(`Invalid semver (expected x.y.z): ${raw}`);
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function nextSemver(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const parsed = parseSemver(current);
  if (bump === 'major') return formatSemver({ major: parsed.major + 1, minor: 0, patch: 0 });
  if (bump === 'minor') return formatSemver({ major: parsed.major, minor: parsed.minor + 1, patch: 0 });
  if (bump === 'patch') return formatSemver({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 });
  throw new Error(`Unknown bump "${bump}". Use patch, minor, major, or x.y.z`);
}

function toPositiveInt(value) {
  const n = Number.parseInt(String(value ?? '0'), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const app = JSON.parse(readFileSync(appJsonPath, 'utf8'));
const expo = app.expo;
if (!expo || typeof expo !== 'object') {
  throw new Error('app.json is missing expo');
}

const before = {
  version: String(expo.version || ''),
  versionCode: expo.android?.versionCode ?? 1,
  buildNumber: String(expo.ios?.buildNumber ?? '1'),
};

expo.version = nextSemver(before.version, spec);
const storeBuild = Math.max(toPositiveInt(before.versionCode), toPositiveInt(before.buildNumber)) + 1;
expo.android = { ...(expo.android || {}), versionCode: storeBuild };
expo.ios = { ...(expo.ios || {}), buildNumber: String(storeBuild) };

writeFileSync(appJsonPath, `${JSON.stringify(app, null, 2)}\n`);

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
pkg.version = expo.version;
writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(
  `fitcupons ${before.version} → ${expo.version} (android ${expo.android.versionCode}, ios ${expo.ios.buildNumber})`,
);
