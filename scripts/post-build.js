import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Copy manifest.json
const manifestSrc = path.join(rootDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('Copied manifest.json to dist/');
}

// 2. Copy assets directory
const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(distDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('Copied assets/ to dist/');
}

// 3. Ensure src/content/badges.css is copied to dist/src/content/badges.css if present
const badgesCssSrc = path.join(rootDir, 'src/content/badges.css');
const badgesCssDestDir = path.join(distDir, 'src/content');
const badgesCssDest = path.join(badgesCssDestDir, 'badges.css');
if (fs.existsSync(badgesCssSrc)) {
  if (!fs.existsSync(badgesCssDestDir)) {
    fs.mkdirSync(badgesCssDestDir, { recursive: true });
  }
  fs.copyFileSync(badgesCssSrc, badgesCssDest);
  console.log('Copied badges.css to dist/src/content/');
}

console.log('Post-build sync complete.');

