import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (await readFile(path.join(root, 'src/bookmarklet.js'), 'utf8')).trim();
const fixture = await readFile(path.join(root, 'fixtures/patient-create.template.html'), 'utf8');
const site = await readFile(path.join(root, 'site/index.template.html'), 'utf8');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const sourceVersion = source.match(/var VERSION = '([^']+)'/)?.[1];

if (sourceVersion !== pkg.version) {
  throw new Error(`Version mismatch: source=${sourceVersion}, package=${pkg.version}`);
}

const href = `javascript:${encodeURIComponent(source)}`;
const escapedHref = href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const sourceSha256 = createHash('sha256').update(source).digest('hex');
const render = (template) => template
  .replaceAll('__BOOKMARKLET_HREF__', escapedHref)
  .replaceAll('__VERSION__', pkg.version)
  .replaceAll('__SOURCE_SHA256__', sourceSha256);

await mkdir(path.join(root, 'dist'), { recursive: true });
await mkdir(path.join(root, 'docs'), { recursive: true });
await writeFile(path.join(root, 'dist/kidit-helper.bookmarklet.txt'), `${href}\n`);
await writeFile(path.join(root, 'dist/patient-create-test.html'), render(fixture));
await writeFile(path.join(root, 'docs/kidit-helper.bookmarklet.txt'), `${href}\n`);
await writeFile(path.join(root, 'docs/index.html'), render(site));
await writeFile(
  path.join(root, 'docs/version.json'),
  `${JSON.stringify({ version: pkg.version, source_sha256: sourceSha256 }, null, 2)}\n`,
);

console.log(`Built KiDit helper v${pkg.version}: ${Buffer.byteLength(href, 'utf8')} bytes`);
