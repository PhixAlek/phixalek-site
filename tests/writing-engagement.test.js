import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicEngagement, refreshEngagement, readPublicReply } from '../scripts/lib/writing-engagement.mjs';
import { mergeArticles } from '../src/shared/writing/snapshot.js';
const sourceUrl = 'https://phixalek.substack.com/p/test-post-1';
const page = post => `window._preloads = JSON.parse(${JSON.stringify(JSON.stringify({ post }))})`;

test('public counts require a matching canonical article and explicit nonnegative integers', () => {
  const html = page({ canonical_url: sourceUrl, reaction_count: 1, comment_count: 3 });
  assert.deepEqual(readPublicEngagement(html, sourceUrl, '2026-10-13T12:00:00Z'), { likes: 1, comments: 3, sourceUrl, fetchedAt: '2026-10-13T12:00:00Z' });
  assert.equal(readPublicEngagement(html, sourceUrl + '-other'), null);
  assert.equal(readPublicEngagement('Unavailable', sourceUrl), null);
  assert.equal(readPublicEngagement(page({ canonical_url: sourceUrl, reaction_count: -1, comment_count: 3 }), sourceUrl), null);
});

test('unavailable social metadata and RSS updates preserve the last verified copy', async () => {
  const article = { id: sourceUrl, sourceUrl, slug: 'test-post-1', categories: [], engagement: { likes: 1, comments: 3 } };
  assert.equal(await refreshEngagement(article, async () => { throw new Error('Offline'); }), article);
  const result = mergeArticles([article], [{ ...article, engagement: undefined, title: 'Edited title' }]);
  assert.equal(result[0].title, 'Edited title'); assert.deepEqual(result[0].engagement, article.engagement);
});

test('public preview imports only published comments and leaves missing replies unavailable', () => {
  const post = { canonical_url: sourceUrl, reaction_count: 2, comment_count: 3, publishedBylines: [{ id: 7 }] };
  const comment = { id: 5, name: 'Author', user_id: 7, body: '<script>plain text</script>', date: '2026-10-03T12:00:00Z', reaction_count: 1, status: 'published', childrenSummary: '2 replies', photo_url: 'javascript:bad' };
  const html = `window._preloads = JSON.parse(${JSON.stringify(JSON.stringify({ post, comments: [comment, { ...comment, deleted: true }] }))})`;
  const result = readPublicEngagement(html, sourceUrl);
  assert.equal(result.preview.length, 1); assert.equal(result.preview[0].body, comment.body);
  assert.equal(result.preview[0].isAuthor, true); assert.equal(result.preview[0].avatar, null);
  assert.equal(result.preview[0].replies, '2 replies');
});

test('reply pages must match their comment ID, original post and root ancestor', () => {
  const root = { id: 11, postId: 25, authorId: 7, isAuthor: true };
  const comment = { id: 12, post_id: 25, user_id: 7, ancestor_path: '11', name: 'Author', body: 'Verified reply', date: '2026-10-03T12:00:00Z', reaction_count: 1 };
  const html = `window._preloads = JSON.parse(${JSON.stringify(JSON.stringify({ feedData: { feedItem: { comment } } }))})`;
  const url = 'https://substack.com/profile/7-author/note/c-12';
  assert.equal(readPublicReply(html, root, url).body, 'Verified reply');
  assert.equal(readPublicReply(html, root, url).parentId, 11);
  assert.equal(readPublicReply(html, { ...root, postId: 26 }, url), null);
  assert.equal(readPublicReply(html, { ...root, id: 99 }, url), null);
  assert.equal(readPublicReply(html, root, 'https://other.example/note/c-12'), null);
});
