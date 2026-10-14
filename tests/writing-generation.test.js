import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { refreshSnapshot } from '../scripts/lib/writing-update.mjs';
import { updateSnapshot, validateSnapshot, mergeArticles } from '../src/shared/writing/snapshot.js';
import { renderWritingHTML, writingSitemap } from '../scripts/lib/writing-render.mjs';
import { applyPageMetadata, homeMetadata } from '../src/shared/writing/metadata.js';
import messages from '../src/content/locales/en.json' with { type: 'json' };

const now = '2026-10-06T12:00:00.000Z';
const later = '2026-10-07T12:00:00.000Z';
const source = 'https://phixalek.substack.com/p/example';
const article = { id: source, sourceUrl: source, slug: 'example', title: 'Original title', published: '2026-10-01T12:00:00.000Z',
  html: '<h2>Original heading</h2><p>Original body.</p>', excerpt: 'Original summary.', image: null, language: 'en',
  categories: ['Software'], widgets: [], readingMinutes: 1 };
const previous = () => updateSnapshot(null, [article], { now });
const feed = `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Edited title</title><link>${source}</link><pubDate>2026-10-01</pubDate><content:encoded><![CDATA[<p>Edited body.</p>]]></content:encoded></item></channel></rss>`;

test('edits replace content without changing identity, and unchanged articles retain lastmod', () => {
  const original = previous();
  const unchanged = updateSnapshot(original, [article], { now: later });
  assert.equal(unchanged.articles[0].updatedAt, now);
  const edited = updateSnapshot(original, [{ ...article, html: '<p>Edited.</p>' }], { now: later });
  assert.equal(edited.articles[0].id, article.id);
  assert.equal(edited.articles[0].updatedAt, later);
  assert.equal(edited.articles[0].html, '<p>Edited.</p>');
});

test('new posts are ordered; RSS window omissions retain the archive; explicit deletions remove it', () => {
  const newer = { ...article, id: source + '-2', sourceUrl: source + '-2', slug: 'example-2', published: later };
  const added = updateSnapshot(previous(), [newer], { now: later });
  assert.deepEqual(added.articles.map(item => item.slug), ['example-2', 'example']);
  assert.equal(updateSnapshot(added, [], { now: later }).articles.length, 2);
  const removed = updateSnapshot(added, [article], { now: later, removed: ['example'] });
  assert.deepEqual(removed.articles.map(item => item.slug), ['example-2']);
  assert.equal(mergeArticles(added.articles, [article], ['example']).length, 1);
  assert.ok(!writingSitemap(removed.articles).includes('/blog/example</loc>'));
});

test('successful refresh imports edited original content with the same sanitizer', async () => {
  const result = await refreshSnapshot(previous(), { now: later, fetchFeed: async () => new Response(feed) });
  assert.equal(result.stale, false);
  assert.equal(result.snapshot.articles[0].title, 'Edited title');
  assert.equal(result.snapshot.articles[0].html, '<p>Edited body.</p>');
});

test('timeouts, invalid XML, rejected items and HTTP failures preserve the exact last valid copy', async () => {
  for (const fetchFeed of [async () => { throw new Error('Timeout'); }, async () => new Response('unavailable', { status: 503 }),
    async () => new Response('<html>Bad feed</html>'), async () => new Response('<rss><channel><item><title>Incomplete</title></item></channel></rss>')]) {
    const original = previous();
    const result = await refreshSnapshot(original, { now: later, fetchFeed });
    assert.equal(result.stale, true);
    assert.deepEqual(result.snapshot, original);
  }
  await assert.rejects(refreshSnapshot(null, { fetchFeed: async () => { throw new Error('Offline'); } }), /Offline/);
});

test('invalid saved copies fail validation instead of publishing corrupt data', () => {
  assert.throws(() => validateSnapshot({ ...previous(), version: 100 }), /Invalid/);
  assert.throws(() => validateSnapshot({ ...previous(), articles: [{ ...previous().articles[0], slug: '../escape' }] }), /Invalid/);
});

const template = '<!doctype html><html><head><title>Home</title><meta name="robots" content="noindex"><link rel="canonical" href="https://phixalek.com/"><script type="application/ld+json">{"@type":"Person"}</script></head><body><div id="app"></div><script defer src="/bundle.js"></script></body></html>';
const options = { messages: messages.messages, fallbackImage: '/media/mountains.svg', profileImage: '/media/phixalek-profile.gif', siteName: 'PhixAlek' };

test('generated HTML exposes the full sanitized body, original title and distinct metadata without JavaScript', () => {
  const record = { ...previous().articles[0], title: 'Café </script><script>unsafe</script>', html: article.html + '<script>unsafe</script>' };
  const output = renderWritingHTML(template, [record], { ...options, article: record });
  const doc = new JSDOM(output).window.document;
  assert.equal(doc.querySelector('h1').textContent, record.title);
  assert.ok(doc.querySelector('.editorial-prose').textContent.includes('Original body.'));
  assert.equal(doc.querySelector('.editorial-prose script'), null);
  assert.equal(doc.querySelector('link[rel=canonical]').href, 'https://phixalek.com/blog/example');
  assert.ok(doc.querySelector('meta[name=robots]').content.startsWith('index'));
  assert.equal(doc.querySelector('meta[property="og:type"]').content, 'article');
  assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).headline, record.title);
  assert.ok(doc.querySelector('script[src="/bundle.js"]'));
});

test('archive links and sitemap describe only published routes; SPA metadata restores Home', () => {
  const articles = previous().articles;
  const doc = new JSDOM(renderWritingHTML(template, articles, options)).window.document;
  assert.ok(doc.querySelector('a[href="/blog/example"]'));
  assert.equal(doc.querySelector('link[rel=canonical]').href, 'https://phixalek.com/blog');
  const sitemap = writingSitemap(articles);
  assert.ok(sitemap.includes('<loc>https://phixalek.com/blog/example</loc>'));
  assert.ok(sitemap.includes(`<lastmod>${now}</lastmod>`));
  applyPageMetadata(doc, homeMetadata);
  assert.equal(doc.title, homeMetadata.title);
  assert.equal(doc.querySelector('link[rel=canonical]').href, 'https://phixalek.com/');
});


test('unknown/deleted article fallback has noindex and no misleading canonical or article schema', () => {
  const doc = new JSDOM(renderWritingHTML(template, [], { ...options, notFound: true })).window.document;
  assert.equal(doc.querySelector('meta[name=robots]').content, 'noindex, follow');
  assert.equal(doc.querySelector('link[rel=canonical]'), null);
  assert.equal(doc.querySelector('script[type="application/ld+json"]'), null);
  assert.equal(doc.querySelector('h1').textContent, messages.messages.writingPage.errorHeading);
  assert.equal(doc.querySelector('.editorial-error-lead img').getAttribute('src'), '/media/mountains.svg');
  assert.equal(doc.querySelector('.editorial-error-controls [target=_blank]').href, 'https://phixalek.substack.com/');
});
