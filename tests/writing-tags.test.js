import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicTags, enrichArticleTags } from '../scripts/lib/writing-tags.mjs';
import { mergeFeedArticles } from '../src/shared/writing/snapshot.js';
const url = 'https://phixalek.substack.com/p/tagged-post';
const html = (tags, canonical = url) => 'window._preloads = JSON.parse(' + JSON.stringify(JSON.stringify({ post: { canonical_url: canonical, postTags: tags } })) + ')';
const article = { id: url, sourceUrl: url, slug: 'tagged-post', published: '2026-10-01', categories: [] };
test('public postTags supply only visible tags belonging to the exact source post', () => {
  assert.deepEqual(readPublicTags(html([{ name: 'Design' }, { name: 'Frontend' }, { name: 'Internal', hidden: true }, { name: 'Design' }]), url), ['Design', 'Frontend']);
  assert.deepEqual(readPublicTags(html([]), url), []);
  assert.equal(readPublicTags(html([{ name: 'Foreign' }], 'https://other.example/p/tagged-post'), url), null);
  assert.equal(readPublicTags(html([{ name: 'Design' }]), 'https://other.example/p/tagged-post'), null);
  assert.equal(readPublicTags(html([{ name: '<script>' }]), url), null);
  assert.equal(readPublicTags('window._preloads=malicious()', url), null);
});
test('tag refresh fills absent RSS categories and preserves previous tags on failure', async () => {
  const imported = await enrichArticleTags(article, null, async () => new Response(html([{ name: 'Software' }, { name: 'Product' }])));
  assert.deepEqual(imported.categories, ['Software', 'Product']);
  const failed = await enrichArticleTags(article, imported, async () => { throw new Error('Unavailable'); });
  assert.deepEqual(failed.categories, imported.categories);
  const removed = await enrichArticleTags(article, imported, async () => new Response(html([])));
  assert.deepEqual(removed.categories, []);
});
test('a browser RSS refresh does not erase compiled page tags or mutate the saved item', () => {
  const saved = { ...article, categories: ['Design', 'Frontend'] };
  const refreshed = mergeFeedArticles([saved], [{ ...article, title: 'Edited title' }]);
  assert.deepEqual(refreshed[0].categories, ['Design', 'Frontend']);
  assert.deepEqual(mergeFeedArticles([saved], [{ ...article, categories: ['Notes'] }])[0].categories, ['Design', 'Frontend', 'Notes']);
  assert.deepEqual(saved.categories, ['Design', 'Frontend']);
});
