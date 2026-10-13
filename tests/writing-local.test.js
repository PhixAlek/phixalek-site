import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { localArticles, generateLocalWriting, LOCAL_WRITING_FILE, LOCAL_WRITING_OUTPUT } from '../scripts/lib/writing-local.mjs';
const data = { enabled: true, posts: [{ slug: 'local-demo-fixture', title: 'Local fixture', published: '2026-10-06T12:00:00Z',
  language: 'en', excerpt: 'Preview', paragraphs: ['<script>alert(1)</script>'], categories: ['Example'], image: '/media/mountains.svg', readingMinutes: 1 }] };

test('local examples escape plain text, keep tags and use local covers', () => {
  const [article] = localArticles(data);
  assert.equal(article.localDemo, true);
  assert.deepEqual(article.categories, ['Example']);
  assert.equal(article.image, '/media/mountains.svg');
  assert.equal(article.html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.deepEqual(localArticles({ ...data, enabled: false }), []);
  assert.throws(() => localArticles({ ...data, posts: [{ ...data.posts[0], image: 'https://external.example/img.jpg' }] }));
});

test('production ignores even an invalid local file and clears generated examples', async t => {
  const root = pathToFileURL((await mkdtemp(join(tmpdir(), 'writing-local-'))) + '/');
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(new URL('src/content/', root), { recursive: true });
  assert.deepEqual(await generateLocalWriting(root, { local: true }), []);
  await writeFile(new URL(LOCAL_WRITING_FILE, root), JSON.stringify(data));
  assert.equal((await generateLocalWriting(root, { local: true })).length, 1);
  await writeFile(new URL(LOCAL_WRITING_FILE, root), 'invalid json');
  assert.deepEqual(await generateLocalWriting(root), []);
  assert.deepEqual(JSON.parse(await readFile(new URL(LOCAL_WRITING_OUTPUT, root), 'utf8')), { enabled: false, articles: [] });
});
