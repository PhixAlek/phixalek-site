import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { ArticleComments } from '../src/js/modules/writing/components/article-comments.js';
import { relativeCommentDate } from '../src/shared/writing/relative-date.js';
import { readPublicEngagement, readPublicReply } from '../scripts/lib/writing-engagement.mjs';
import { readPublicData } from '../scripts/lib/writing-public-data.mjs';
import { readPublicLanguage } from '../scripts/lib/writing-tags.mjs';
import { developmentCSP } from '../scripts/lib/dev-security.mjs';
import { readFileSync } from 'node:fs';
import catalog from '../src/content/locales/en.json' with { type: 'json' };
const ui = catalog.messages, text = (node, get) => { node.textContent = get(); };

test('deep subthreads disclose one level at a time and retain collapse controls beyond four levels', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const base = { author: 'Reader', body: 'Reply', date: '2026-10-03T12:00:00Z', replies: '' };
  const replies = Array.from({ length: 7 }, (_, i) => ({ ...base, id: i + 2, parentId: i + 1 }));
  const root = { ...base, id: 1, repliesPreview: replies };
  const section = ArticleComments({ sourceUrl: 'https://phixalek.substack.com/p/test-post-1', engagement: { comments: 8, preview: [root] } }, { doc, ui, text });
  const disclosures = section.querySelectorAll('details');
  assert.equal(disclosures.length, 7);
  assert.equal(section.querySelectorAll('.editorial-comment').length, 8);
  assert.equal(disclosures[0].querySelector('summary').textContent, '7 replies');
  disclosures[0].open = true; disclosures[0].dispatchEvent(new dom.window.Event('toggle'));
  assert.equal(disclosures[0].querySelector('summary').textContent, 'Hide replies');
  assert.equal(disclosures[1].open, false);
  assert.equal(section.querySelector('.editorial-comment-more').textContent, '6 more comments…');
  for (const disclosure of disclosures) { disclosure.open = true; disclosure.dispatchEvent(new dom.window.Event('toggle')); }
  assert.equal(section.querySelector('.editorial-comment-more').textContent, ui.writingPage.allComments);
  assert.ok(section.querySelector('time').title.includes('2026'));
  assert.ok(!section.querySelector('time').textContent.includes('Oct'));
  dom.window.close();
});

test('comment dates use localized relative units and preserve readable recent dates', () => {
  const now = Date.parse('2026-10-15T12:00:00Z'), day = 86400000;
  assert.equal(relativeCommentDate(new Date(now - 3 * day).toISOString(), 'en', now), '3 days ago');
  assert.equal(relativeCommentDate(new Date(now - 14 * day).toISOString(), 'es', now), 'hace 2 semanas');
  assert.equal(relativeCommentDate(new Date(now - 400 * day).toISOString(), 'en', now), 'last year');
  assert.equal(relativeCommentDate(new Date(now - 2 * 3600000).toISOString(), 'en', now), '2 hours ago');
});

test('new public JSON script metadata retains exact-post checks and comment IDs without execution', () => {
  const sourceUrl = 'https://phixalek.substack.com/p/test-post-1';
  const data = { post: { canonical_url: sourceUrl, language: 'es', reaction_count: 1, comment_count: 1 }, comments: [{ id: 12, user_id: 7, post_id: 25, name: 'Reader', body: 'Hello', date: '2026-10-03', status: 'published' }] };
  const page = data => `<script type="application/json" id="preloads-json">${JSON.stringify(data)}</script>`;
  assert.equal(readPublicEngagement(page(data), sourceUrl).preview[0].sourceUrl, 'https://substack.com/note/c-12');
  assert.equal(readPublicEngagement(page(data), sourceUrl + '-other'), null);
  assert.equal(readPublicLanguage(page(data), sourceUrl), 'es');
  assert.equal(readPublicData('<script id="preloads-json" type="application/json">alert(1)</script>'), null);
  const reply = { id: 13, post_id: 25, ancestor_path: '12', name: 'Reader', body: 'Reply', date: '2026-10-03' };
  assert.equal(readPublicReply(page({ feedData: { feedItem: { comment: reply } } }), { id: 12, postId: 25 }, 'https://substack.com/note/c-13').parentId, 12);
  data.comments[0].children = [{ ...reply, user_id: 7, children: [{ ...reply, user_id: 7, id: 14, ancestor_path: '12.13' }] }];
  const rows = readPublicEngagement(page(data), sourceUrl).preview[0].repliesPreview;
  assert.deepEqual(rows.map(row => [row.id, row.parentId]), [[13, 12], [14, 13]]);
  data.comments[0].children[0].children.push({ ...reply, id: 15, user_id: 7, post_id: 999, ancestor_path: '12.13' });
  assert.equal(readPublicEngagement(page(data), sourceUrl).preview[0].repliesPreview.length, 2);
});

test('only the development response policy permits the fixed loopback HMR sockets', () => {
  const production = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8').match(/Content-Security-Policy = "([^"]+)"/)[1];
  assert.ok(developmentCSP.includes('ws://127.0.0.1:5173 ws://localhost:5173'));
  assert.ok(!production.includes('ws:'));
  assert.equal(developmentCSP.replace(' ws://127.0.0.1:5173 ws://localhost:5173', ''), production);
});
