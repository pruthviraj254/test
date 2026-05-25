#!/usr/bin/env node
/**
 * Bump package.json version and create a git tag to trigger the Windows CI release.
 *
 * Usage:
 *   npm run release:tag -- 1.0.1
 *   git push origin v1.0.1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('Usage: npm run release:tag -- <semver>');
  console.error('Example: npm run release:tag -- 1.0.1');
  process.exit(1);
}

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = version;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

execSync(`git add package.json package-lock.json`, { stdio: 'inherit' });
execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit' });
execSync(`git tag v${version}`, { stdio: 'inherit' });

console.log(`\nCreated tag v${version}. Push to trigger CI:\n  git push origin main --follow-tags\n`);
