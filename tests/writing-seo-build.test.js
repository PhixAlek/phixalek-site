import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { prepareWritingBuild, BUILD_SNAPSHOT } from '../scripts/lib/writing-build.mjs';
import { renderWritingHTML, writingSitemap } from '../scripts/lib/writing-render.mjs';
import { applyPageMetadata, homeMetadata, writingMetadata } from '../src/shared/writing/metadata.js';
import { AUTHOR } from '../src/shared/site-seo.js';
import saved from '../src/content/writing-snapshot.json' with { type: 'json' };
import locale from '../src/content/locales/en.json' with { type: 'json' };

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'phixalek-seo-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = pathToFileURL(directory + '/');
  await mkdir(new URL('src/content/', root), { recursive: true });
  const original = JSON.stringify(saved);
  await writeFile(new URL('src/content/writing-snapshot.json', root), original);
  return { root, original };
}

test('a new public post receives a static page, author, cover, sitemap URL and stable lastmod in one build edition', async t => {
  const { root, original } = await fixture(t);
  const source = 'https://phixalek.substack.com/p/new-seo-post';
  const rss = `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>A new post</title><link>${source}</link><pubDate>2026-10-15</pubDate><content:encoded><![CDATA[<figure><img src="https://images.example.com/cover.jpg" alt="A cover"></figure><h2>A section</h2><p>Useful new content.</p>]]></content:encoded></item></channel></rss>`;
  const edition = await prepareWritingBuild(root, { refresh: true, now: '2026-10-15T12:00:00.000Z',
    fetchFeed: async () => new Response(rss), fetchPage: async () => new Response('', { status: 503 }) });
  assert.equal(edition.stale, false);
  assert.equal(await readFile(new URL('src/content/writing-snapshot.json', root), 'utf8'), original);
  assert.deepEqual(JSON.parse(await readFile(new URL(BUILD_SNAPSHOT, root), 'utf8')), edition.snapshot);
  assert.equal(edition.snapshot.articles.length, saved.articles.length + 1);
  for (const record of saved.articles) assert.equal(edition.snapshot.articles.find(post => post.id === record.id).updatedAt, record.updatedAt);
  const article = edition.snapshot.articles.find(post => post.slug === 'new-seo-post');
  const template = '<!doctype html><html><head></head><body><div id="app"></div></body></html>';
  const dom = new JSDOM(renderWritingHTML(template, edition.snapshot.articles, { article, messages: locale.messages,
    fallbackImage: '/media/mountains.svg', profileImage: '/media/phixalek-profile-static.png', siteName: 'PhixAlek' }));
  const doc = dom.window.document;
  const schema = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(schema.author.name, AUTHOR.name);
  assert.equal(schema.author['@id'], AUTHOR['@id']);
  assert.equal(schema.dateModified, article.updatedAt);
  assert.equal(schema.image, 'https://images.example.com/cover.jpg');
  assert.equal(doc.querySelector('.editorial-prose').textContent, 'A sectionUseful new content.');
  assert.equal(doc.querySelectorAll('.editorial-prose img').length, 0);
  assert.equal(doc.querySelector('link[rel=canonical]').href, 'https://phixalek.com/blog/new-seo-post/');
  assert.ok(writingSitemap(edition.snapshot.articles).includes('<loc>https://phixalek.com/blog/new-seo-post/</loc>'));
  dom.window.close();
});

test('offline builds avoid network calls; failed refreshes retain the reviewed source', async t => {
  const { root } = await fixture(t);
  const offline = await prepareWritingBuild(root, { refresh: false, fetchFeed: () => { throw new Error('Must not fetch'); } });
  assert.deepEqual(offline.snapshot, saved);
  const result = await prepareWritingBuild(root, { refresh: true, fetchFeed: async () => { throw new Error('Unavailable'); } });
  assert.equal(result.stale, true);
  assert.deepEqual(result.snapshot, saved);
});

test('SPA navigation removes inherited article fields and restores Home image metadata', () => {
  const dom = new JSDOM('<html><head><meta property="og:locale:alternate" content="es_MX"></head><body></body></html>');
  const doc = dom.window.document;
  const article = { ...saved.articles[0], language: 'es' };
  applyPageMetadata(doc, writingMetadata(article, {}));
  assert.equal(doc.querySelector('meta[property="og:locale"]').content, 'es_MX');
  assert.equal(doc.querySelector('meta[property="og:locale:alternate"]'), null);
  assert.equal(doc.querySelector('meta[property="article:author"]').content, AUTHOR.url);
  applyPageMetadata(doc, homeMetadata);
  assert.equal(doc.title, homeMetadata.title);
  assert.equal(doc.querySelector('meta[property="article:author"]'), null);
  assert.equal(doc.querySelector('meta[property="article:published_time"]'), null);
  assert.equal(doc.querySelector('meta[property="og:image:width"]').content, String(homeMetadata.imageWidth));
  dom.window.close();
});
