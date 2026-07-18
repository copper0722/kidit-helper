import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'src/bookmarklet.js'), 'utf8');
const built = (await readFile(path.join(root, 'dist/kidit-helper.bookmarklet.txt'), 'utf8')).trim();
const site = await readFile(path.join(root, 'docs/index.html'), 'utf8');
const favicon = await readFile(path.join(root, 'docs/favicon.svg'), 'utf8');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

test('bookmarklet source parses', () => {
  assert.doesNotThrow(() => new Function(source));
});

test('bookmarklet is self-contained and does not persist or submit data', () => {
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/);
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|cookie)\b/);
  assert.doesNotMatch(source, /\.(submit|requestSubmit)\s*\(/);
  assert.match(source, /www\.kidit-tsn\.org\.tw/);
});

test('built artifact is a bounded javascript URL', () => {
  assert.match(built, /^javascript:/);
  assert.ok(Buffer.byteLength(built, 'utf8') < 40000, 'bookmarklet should remain below 40 KB');
});

test('blank option protection and manual-save message remain explicit', () => {
  assert.match(source, /option\.value !== ''/);
  assert.match(source, /選項已由 KiDit 更新/);
  assert.match(source, /不會自動送出/);
  assert.match(source, /再由人工存檔/);
});

test('release version is consistent across source and installation page', () => {
  assert.match(source, new RegExp(`var VERSION = '${pkg.version.replaceAll('.', '\\.')}'`));
  assert.match(site, new RegExp(`v${pkg.version.replaceAll('.', '\\.')}`));
  assert.doesNotMatch(site, /__BOOKMARKLET_HREF__|__VERSION__|__SOURCE_SHA256__/);
});

test('installation page has no external runtime dependencies', () => {
  assert.doesNotMatch(site, /<script\b/i);
  assert.doesNotMatch(site, /<(img|link)\b[^>]+(?:src|href)=["']https?:/i);
  assert.match(site, /拖到書籤列/);
});

test('vivid bookmark identity is present without a plugin dependency', () => {
  assert.match(site, /rel="icon"[^>]+href="\.\/favicon\.svg"/);
  assert.match(site, /💧 KiDit 小幫手 v/);
  assert.match(favicon, /<svg\b/);
  assert.match(favicon, /#0F172A/);
  assert.match(favicon, /#38BDF8/);
  assert.doesNotMatch(favicon, /<script\b/i);
});
