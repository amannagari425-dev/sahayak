import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('manifest.json has required Manifest V3 configurations', () => {
  const manifestPath = path.join(rootDir, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  assert.equal(manifest.manifest_version, 3, 'Manifest version must be 3');
  assert.ok(manifest.name, 'Extension must have a name');
  assert.ok(manifest.version, 'Extension must have a version');
  assert.ok(manifest.icons['16'], 'Icon 16 must be defined');
  assert.ok(manifest.icons['48'], 'Icon 48 must be defined');
  assert.ok(manifest.icons['128'], 'Icon 128 must be defined');

  // Permissions check
  const requiredPermissions = ['sidePanel', 'storage', 'activeTab', 'scripting', 'contextMenus'];
  requiredPermissions.forEach(perm => {
    assert.ok(manifest.permissions.includes(perm), `Permission ${perm} must be declared`);
  });

  // Host permissions
  assert.ok(manifest.host_permissions.includes('https://generativelanguage.googleapis.com/*'));
  assert.ok(manifest.host_permissions.includes('https://api.groq.com/*'));

  // Background service worker
  assert.equal(manifest.background.service_worker, 'src/background/index.js');
  assert.equal(manifest.background.type, 'module');

  // Side panel
  assert.equal(manifest.side_panel.default_path, 'src/sidepanel/index.html');
});

test('Referenced files in manifest.json actually exist on disk', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8'));

  // Verify icon files
  Object.values(manifest.icons).forEach(iconRelPath => {
    assert.ok(fs.existsSync(path.join(rootDir, iconRelPath)), `Icon ${iconRelPath} must exist`);
  });

  // Verify background worker
  assert.ok(fs.existsSync(path.join(rootDir, manifest.background.service_worker)), 'Service worker must exist');

  // Verify sidepanel
  assert.ok(fs.existsSync(path.join(rootDir, manifest.side_panel.default_path)), 'Side panel HTML must exist');

  // Verify content scripts
  manifest.content_scripts.forEach(cs => {
    cs.js.forEach(jsPath => assert.ok(fs.existsSync(path.join(rootDir, jsPath)), `Content script ${jsPath} must exist`));
    cs.css.forEach(cssPath => assert.ok(fs.existsSync(path.join(rootDir, cssPath)), `Content css ${cssPath} must exist`));
  });
});

