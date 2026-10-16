import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { importArticleBody, withOpeningCover } from '../src/shared/writing/article-body.js';
import { parseArticles } from '../src/js/modules/writing/import-feed.js';
import { createReaderCover } from '../src/js/modules/writing/components/reader-cover.js';
import { createArticleCard } from '../src/js/modules/writing/components/card-dom.js';
import { renderWritingHTML } from '../scripts/lib/writing-render.mjs';
import catalog from '../src/content/locales/en.json' with { type: 'json' };

const view = new JSDOM('').window, sourceUrl = 'https://phixalek.substack.com/p/cover-rule';
const options = { view, sourceUrl };
const cover = 'https://images.example.org/cover.jpg', diagram = 'https://images.example.org/diagram.png';
const feed = html => `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Cover rule</title><link>${sourceUrl}</link><pubDate>2026-10-14</pubDate><enclosure type="image/jpeg" url="https://images.example.org/rss.jpg"/><content:encoded><![CDATA[${html}]]></content:encoded><category>Guides</category><category>Angular</category></item></channel></rss>`;
const imported = html => parseArticles(feed(html), view.DOMParser, view)[0];
const root = html => { const node = view.document.createElement('div'); node.innerHTML = html; return node; };
const text = (node, get) => { node.textContent = get(); };

for (const [name, html] of [
  ['single opening image', `<img src="${cover}" alt="Workspace">`],
  ['linked image wrapper', `<div><a href="${cover}"><span><img src="${cover}"></span></a></div><p>Body</p>`],
  ['captioned opening figure', `<figure><img src="${cover}" alt="Workspace" width="1200" height="800"><figcaption>Photo by <em>Author</em></figcaption></figure><p>Body</p>`],
  ['picture sources and whitespace', `<p><br></p><!-- gap --><figure><picture><source srcset="${cover} 1200w"><img src="${cover}"></picture><figcaption>Caption</figcaption></figure>`],
]) test(`cover convention: ${name}`, () => {
  const article = imported(html);
  assert.equal(article.image, cover); assert.equal(article.cover.src, cover);
  assert.equal(root(article.html).querySelectorAll('img').length, 1, 'stored source keeps the designated node');
  const rendered = importArticleBody(article.html, { ...options, omitCover: article.cover.src });
  assert.equal(root(rendered.html).querySelectorAll('img').length, 0);
});

test('only the opening node is removed, including when a later image has the same URL', () => {
  const article = imported(`<figure><img src="${cover}"><figcaption>Cover caption</figcaption></figure><h2>Technical steps</h2><figure><img src="${diagram}" alt="Sequence" width="900" height="600"><figcaption>Diagram caption</figcaption></figure><p>Details</p><img src="${cover}" alt="Repeated example">`);
  const result = root(importArticleBody(article.html, { ...options, omitCover: article.cover.src }).html);
  assert.deepEqual([...result.querySelectorAll('img')].map(image => image.src), [diagram, cover]);
  assert.equal(result.querySelector('figcaption').textContent, 'Diagram caption');
  assert.equal(result.querySelector('img').alt, 'Sequence');
  assert.equal(result.firstElementChild.tagName, 'H2');
  assert.equal(root(importArticleBody(article.html, { ...options, omitCover: diagram }).html).querySelectorAll('img').length, 3, 'a mismatching cover cannot delete content');
});

for (const html of ['<p>No images</p>', `<p>Introduction</p><img src="${diagram}">`, `<div><h3>Steps</h3><img src="${diagram}"></div>`, `<p>Text <img src="${diagram}"></p>`]) test(`no automatic promotion after prose or headings: ${html.slice(0, 25)}`, () => {
  const article = imported(html);
  assert.equal(article.cover, null); assert.equal(article.image, 'https://images.example.org/rss.jpg');
  assert.equal(root(importArticleBody(article.html, { ...options, omitCover: article.image }).html).querySelectorAll('img').length, root(html).querySelectorAll('img').length);
});

test('responsive CDN URLs retain internal commas and choose the largest safe declared source', () => {
  const small = 'https://substackcdn.com/image/fetch/w_320,c_limit/https%3A%2F%2Fimages.example.org%2Fcover.jpg';
  const large = 'https://substackcdn.com/image/fetch/w_1600,c_limit/https%3A%2F%2Fimages.example.org%2Fcover.jpg';
  const article = imported(`<picture><source srcset="${small} 320w, ${large} 1600w"><img src="${small}" srcset="javascript:evil 2400w, ${large} 1600w"></picture>`);
  assert.equal(article.image, large); assert.ok(!article.html.includes('javascript:'));
});

test('original provider metadata is preferred and unsafe image URLs cannot become covers', () => {
  assert.equal(imported(`<div data-attrs='{"src":"${cover}"}'><img src="https://images.example.org/thumb.jpg"></div>`).image, cover);
  assert.equal(imported('<img src="javascript:alert(1)"><p>Body</p>').cover, null);
});

test('hero, Featured, List and Grid use the same cover with alt, dimensions and appropriate loading', () => {
  const article = withOpeningCover(imported(`<figure><img src="${cover}" alt="Workspace" width="1200" height="800"><figcaption>Photo by <em>Author</em></figcaption></figure><p>Body</p>`), view);
  const bindings = { doc: view.document, ui: catalog.messages, text, bind: () => {}, getLocale: () => 'en' };
  for (const featured of [false, true]) {
    const card = createArticleCard(article, { src: '/media/mountains.svg' }, { ...bindings, featured });
    const image = card.querySelector('img');
    assert.equal(image.src, cover); assert.equal(image.alt, 'Workspace');
    assert.equal(image.getAttribute('loading'), featured ? 'eager' : 'lazy');
  }
  const hero = createReaderCover(article, { src: '/media/mountains.svg' }, { doc: view.document });
  assert.equal(hero.querySelector('img').getAttribute('width'), '1200');
  assert.equal(hero.querySelector('img').getAttribute('fetchpriority'), 'high');
  assert.equal(hero.querySelector('figcaption em').textContent, 'Author');
  const html = renderWritingHTML('<html><head></head><body><div id="app"></div></body></html>', [article], { article, messages: catalog.messages, fallbackImage: '/media/mountains.svg', profileImage: '/media/avatar.png', siteName: 'PhixAlek' });
  const rendered = root(html);
  assert.equal(rendered.querySelector('.editorial-prose img'), null);
  assert.equal(rendered.querySelector('.editorial-reader-cover img').src, cover);
  assert.equal(rendered.querySelectorAll('h1').length, 1);
});

test('cached normalization retains an original selected from provider metadata over smaller srcset variants', () => {
  const original = imported(`<figure data-attrs='{"src":"${cover}"}'><img src="https://images.example.org/thumb.jpg" srcset="https://images.example.org/small.jpg 320w"></figure><p>Body</p>`);
  const cached = withOpeningCover(original, view);
  assert.equal(cached.image, cover);
  assert.equal(root(importArticleBody(cached.html, { ...options, omitCover: cached.cover.src }).html).querySelector('img'), null);
});

test('no image or enclosure keeps the established fallback', () => {
  const xml = feed('<p>Text only</p>').replace(/<enclosure[^>]*\/>/, '');
  const article = parseArticles(xml, view.DOMParser, view)[0];
  assert.equal(article.image, null); assert.equal(article.cover, null);
  const hero = createReaderCover(article, { src: '/media/mountains.svg' }, { doc: view.document });
  assert.equal(hero.querySelector('img').getAttribute('src'), '/media/mountains.svg');
});

test('ambiguous galleries and figures containing prose are never removed as a cover', () => {
  for (const html of [`<figure><img src="${cover}"><img src="${diagram}"><figcaption>Gallery</figcaption></figure>`, `<figure><img src="${cover}"><p>Required explanation</p></figure>`]) {
    const article = imported(html);
    assert.equal(article.cover, null);
    const result = root(importArticleBody(article.html, { ...options, omitCover: article.image }).html);
    assert.equal(result.textContent, root(html).textContent);
    assert.equal(result.querySelectorAll('img').length, root(html).querySelectorAll('img').length);
  }
});
