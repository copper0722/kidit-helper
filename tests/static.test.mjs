import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'src/bookmarklet.js'), 'utf8');
const built = (await readFile(path.join(root, 'dist/kidit-helper.bookmarklet.txt'), 'utf8')).trim();
const site = await readFile(path.join(root, 'docs/index.html'), 'utf8');
const favicon = await readFile(path.join(root, 'docs/favicon.svg'), 'utf8');
const faviconPng = await readFile(path.join(root, 'docs/favicon.png'));
const bookmarksImport = await readFile(path.join(root, 'docs/kidit-helper-bookmarks.html'), 'utf8');
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

function firstAlertFor(pathname) {
  const alerts = [];
  vm.runInNewContext(source, {
    window: {
      __KIDIT_HELPER_TEST__: false,
      location: { hostname: 'www.kidit-tsn.org.tw', pathname },
      alert: (message) => alerts.push(message),
    },
    document: { querySelector: () => null },
  });
  return alerts[0];
}

test('v0.1 scope is limited to transfer-hospital search', () => {
  assert.match(source, /option\.value !== ''/);
  assert.match(source, /TARGET_PATH_PATTERN = \/\^\\\/Start\\\/Edit/);
  assert.match(source, /TARGET_FORM_ACTION = '\/Start\/SaveDeleteCancel'/);
  assert.match(source, /TurnHospital: '搜尋轉入院所'/);
  assert.doesNotMatch(source, /\b(?:COUNTY|TOWN|MAILNO|ADDR|ROAD):/);
});

test('route guard accepts only numeric Start/Edit history pages', () => {
  assert.match(firstAlertFor('/Start/Edit/305'), /找不到預期的病史表單/);
  assert.match(firstAlertFor('/Start/Edit/305/'), /找不到預期的病史表單/);
  assert.match(firstAlertFor('/Start/Index'), /請開啟病人的「病史紀錄」頁/);
  assert.match(firstAlertFor('/Start/Edit/not-a-number'), /請開啟病人的「病史紀錄」頁/);
});

test('add-on sits beside and remains visually distinct from the native select', () => {
  assert.match(source, /\.kd-helper-host\{[^}]*flex-wrap:nowrap/);
  assert.match(source, /\.kd-helper-wrap\{[^}]*background:#ecfeff/);
  assert.match(source, /host\.insertBefore\(wrap, select\.nextSibling\)/);
  assert.match(source, /\.kd-helper-sr-only/);
  assert.doesNotMatch(source, /原下拉選單仍保留；本工具不會自動送出/);
});

test('release version is consistent across source and installation page', () => {
  assert.match(source, new RegExp(`var VERSION = '${pkg.version.replaceAll('.', '\\.')}'`));
  assert.match(site, new RegExp(`v${pkg.version.replaceAll('.', '\\.')}`));
  assert.match(bookmarksImport, new RegExp(`KiDit 小幫手 v${pkg.version.replaceAll('.', '\\.')}`));
  assert.doesNotMatch(`${site}\n${bookmarksImport}`, /__BOOKMARKLET_HREF__|__FAVICON_DATA__|__VERSION__|__SOURCE_SHA256__/);
});

test('installation page has no external runtime dependencies', () => {
  assert.doesNotMatch(site, /<script\b/i);
  assert.doesNotMatch(site, /<(img|link)\b[^>]+(?:src|href)=["']https?:/i);
  assert.match(site, /管理者：直接拖到書籤列/);
  assert.match(site, /id="installBookmarklet"/);
  assert.doesNotMatch(site, /下載自訂圖示書籤檔|匯入書籤和設定/);
  const draggedHref = site.match(/id="installBookmarklet"[^>]+href="(javascript:[^"]+)"/)?.[1];
  assert.equal(draggedHref, built, 'dragged bookmark should run the exact tested build');
});

test('custom bookmark favicon is embedded in the Chrome import artifact', () => {
  assert.match(site, /rel="icon"[^>]+href="\.\/favicon\.svg"/);
  assert.match(site, /rel="icon"[^>]+href="\.\/favicon\.png"/);
  assert.doesNotMatch(`${site}\n${bookmarksImport}\n${source}`, /💧/);
  assert.match(favicon, /<svg\b/);
  assert.match(favicon, /#0F172A/);
  assert.match(favicon, /#38BDF8/);
  assert.doesNotMatch(favicon, /<script\b/i);
  assert.deepEqual(faviconPng.subarray(0, 8), Buffer.from('89504e470d0a1a0a', 'hex'));
  assert.match(bookmarksImport, /PERSONAL_TOOLBAR_FOLDER="true"/);
  const importedHref = bookmarksImport.match(/HREF="(javascript:[^"]+)"/)?.[1];
  assert.equal(importedHref, built, 'imported bookmark should run the exact tested build');
  assert.match(bookmarksImport, new RegExp(`>KiDit 小幫手 v${pkg.version.replaceAll('.', '\\.')}(?:<|$)`));
  const iconData = bookmarksImport.match(/ICON="data:image\/png;base64,([A-Za-z0-9+/=]+)"/)?.[1];
  assert.ok(iconData, 'bookmark import should contain an embedded PNG icon');
  assert.deepEqual(Buffer.from(iconData, 'base64'), faviconPng);
});
