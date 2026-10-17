import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateWritingCategories } from '../scripts/lib/writing-categories.mjs';
import snapshot from '../src/content/writing-snapshot.json' with { type: 'json' };
import config from '../src/content/writing.json' with { type: 'json' };
import { compiledCategories } from '../src/js/modules/writing/categories.js';

test('category module loads without a Webpack-injected global', () => {
  assert.ok(Array.isArray(compiledCategories));
  assert.ok(compiledCategories.every(tag => typeof tag.id === 'string' && typeof tag.labels.en === 'string'));
});

test('compilation creates its JSON on a clean checkout and regenerates it only when tags change', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'phixalek-tags-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = pathToFileURL(directory + '/');
  await mkdir(new URL('src/content/', root), { recursive: true });
  const sourceUrl = snapshot.source + '/p/category-test';
  const source = { version: snapshot.version, source: snapshot.source, fetchedAt: '2026-10-06T12:00:00.000Z', articles: [{
    id: sourceUrl, sourceUrl, slug: 'category-test', title: 'Category fixture', published: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-06T12:00:00.000Z', image: null, language: null, html: '<p>Original.</p>', excerpt: 'Original.',
    categories: [], widgets: [], readingMinutes: 1,
  }] };
  const settings = { ...config, categories: [], articleOverrides: {}, removedSlugs: [] };
  const input = new URL('src/content/writing-snapshot.json', root);
  const output = new URL('src/content/writing-categories.generated.json', root);
  await writeFile(input, JSON.stringify(source));
  await writeFile(new URL('src/content/writing.json', root), JSON.stringify(settings));
  await generateWritingCategories(root);
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), []);
  const first = (await stat(output)).mtimeMs;
  await generateWritingCategories(root);
  assert.equal((await stat(output)).mtimeMs, first);
  source.articles[0].categories = ['Rust'];
  await writeFile(input, JSON.stringify(source));
  await generateWritingCategories(root);
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')).map(tag => tag.labels.en), ['Rust']);
  const example = { enabled: true, posts: [{ slug: 'local-demo-category', title: 'Local category preview',
    published: '2026-10-06T12:00:00Z', excerpt: 'Preview', paragraphs: ['Preview'], categories: ['Local tag'],
    readingMinutes: 1, image: '/media/mountains.svg' }] };
  await writeFile(new URL('src/content/writing.fake.local.json', root), JSON.stringify(example));
  const localCategories = await generateWritingCategories(root, { local: true });
  assert.deepEqual(localCategories.map(tag => tag.labels.en), ['Local tag']);
  await generateWritingCategories(root);
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')).map(tag => tag.labels.en), ['Rust']);
  assert.deepEqual(JSON.parse(await readFile(new URL('src/content/writing-local.generated.json', root), 'utf8')),
    { enabled: false, articles: [] });
  source.articles[0].categories = [];
  await writeFile(input, JSON.stringify(source));
  await generateWritingCategories(root);
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), []);
});
