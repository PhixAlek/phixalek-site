import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { importArticleBody, contentURL } from '../src/shared/writing/article-body.js';
import { readFeedText, MAX_FEED_BYTES } from '../src/shared/writing/feed-response.js';
import { normalizeArticle } from '../src/shared/writing/model.js';
import { parseArticles } from '../src/js/modules/writing/import-feed.js';
import { articleFragment } from '../src/js/modules/writing/article-html.js';

const view = new JSDOM('').window;
const options = { view, sourceUrl: 'https://phixalek.substack.com/p/example' };
const doc = html => { const node = view.document.createElement('div'); node.innerHTML = html; return node; };

test('prose, accents, entities, emphasis and code whitespace survive import without rewriting', () => {
  const html = '<h2>Café &amp; código</h2><p>“Texto original” — <strong>.NET</strong> y <em>Angular</em>.</p><pre><code>if (a &lt; b) {\n  return "á";\n}</code></pre>';
  const result = importArticleBody(html, options);
  assert.equal(doc(result.html).textContent, doc(html).textContent);
  assert.equal(doc(result.html).querySelector('pre code').textContent, 'if (a < b) {\n  return "á";\n}');
  assert.ok(doc(result.html).querySelector('strong'));
  assert.ok(doc(result.html).querySelector('em'));
  assert.deepEqual(result.widgets, []);
});

test('provider widgets become separate records, leaving surrounding paragraphs intact', () => {
  const html = `<p>Before.</p><div class="subscription-widget-wrap-editor" data-component-name="SubscribeWidgetToDOM"
    data-attrs='{"url":"https://phixalek.substack.com/subscribe","text":"Subscribe"}'>
    <p>Widget caption.</p><div class="subscription-widget"><form><input name="email"></form></div></div><p>After.</p>`;
  const result = importArticleBody(html, options);
  assert.equal(result.text, 'Before. After.');
  assert.deepEqual(result.widgets, [{ kind: 'subscribe', url: 'https://phixalek.substack.com/subscribe', label: 'Subscribe' }]);
  assert.equal(doc(result.html).querySelectorAll('form, input, [data-attrs], [class]').length, 0);
  assert.deepEqual(importArticleBody(result.html, options).widgets, []);
});

test('unsafe widget destinations cannot become actionable subscription data', () => {
  for (const url of ['javascript:alert(1)', 'https://other.example/subscribe', 'https://user:secret@phixalek.substack.com/subscribe']) {
    const result = importArticleBody(`<div data-component-name="SubscribeWidgetToDOM" data-attrs='{"url":"${url}"}'><p>Subscribe</p></div>`, options);
    assert.equal(result.widgets[0].url, null);
    assert.equal(result.text, '');
  }
});

test('images, captions, lists, blockquotes and table structure retain their meaningful attributes', () => {
  const result = doc(importArticleBody('<figure><img src="/image.webp" alt="Architecture" width="800" height="400"><figcaption>Original caption</figcaption></figure><ol start="3" reversed><li>Three</li></ol><blockquote>Quote</blockquote><table><caption>Data</caption><tbody><tr><th scope="row" colspan="2">Header</th><td rowspan="2">Value</td></tr></tbody></table>', options).html);
  assert.equal(result.querySelector('img').getAttribute('src'), 'https://phixalek.substack.com/image.webp');
  assert.equal(result.querySelector('img').getAttribute('alt'), 'Architecture');
  assert.equal(result.querySelector('img').getAttribute('loading'), 'lazy');
  assert.equal(result.querySelector('ol').getAttribute('start'), '3');
  assert.ok(result.querySelector('ol').hasAttribute('reversed'));
  assert.equal(result.querySelector('th').getAttribute('scope'), 'row');
  assert.equal(result.querySelector('th').getAttribute('colspan'), '2');
  assert.equal(result.querySelector('td').getAttribute('rowspan'), '2');
});

test('relative links, email and internal anchors survive repeated sanitization safely', () => {
  const result = importArticleBody('<h2 id="topic">Topic</h2><a href="#topic">Jump</a><a href="related">Related</a><a href="mailto:hello@example.com">Email</a>', options);
  const fragment = articleFragment(result.html, view, options.sourceUrl);
  const links = [...fragment.querySelectorAll('a')];
  assert.equal(links[0].getAttribute('href'), `#${fragment.querySelector('h2').id}`);
  assert.equal(links[0].hasAttribute('target'), false);
  assert.equal(links[1].getAttribute('href'), 'https://phixalek.substack.com/p/related');
  assert.equal(links[1].rel, 'noopener noreferrer');
  assert.equal(links[2].getAttribute('href'), 'mailto:hello@example.com');
});

test('scripts, forms, event handlers, inline styles and unsafe URI schemes are removed', () => {
  const result = doc(importArticleBody('<p style="position:fixed" onclick="alert(1)">Safe text</p><script>secretScript</script><style>secretStyle</style><form>secretForm<input></form><iframe srcdoc="bad"></iframe><img src="data:text/html,bad" onerror="alert(1)"><a href="java&#x73;cript:alert(1)">Link</a><svg><script>alert(1)</script></svg>', options).html);
  assert.equal(result.querySelectorAll('script,style,form,input,iframe,svg,[onclick],[onerror],[style]').length, 0);
  assert.equal(result.textContent, 'Safe textLink');
  assert.equal(result.querySelector('img').hasAttribute('src'), false);
  assert.equal(result.querySelector('a').hasAttribute('href'), false);
  assert.equal(contentURL('https://user:secret@example.com'), null);
});

test('RSS uses the proper content namespace, supports media covers and deduplicates categories', () => {
  const xml = `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:evil="https://other.example"><channel><item><title>Real title</title><link>https://phixalek.substack.com/p/example</link><pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate><evil:encoded>Wrong namespace</evil:encoded><content:encoded><![CDATA[<p>Actual article.</p>]]></content:encoded><description><![CDATA[<script>noise</script><p>Actual summary.</p>]]></description><media:thumbnail url="https://example.com/cover.jpg"/><category>Software</category><category>Software</category></item></channel></rss>`;
  const article = parseArticles(xml, view.DOMParser, view)[0];
  assert.equal(doc(article.html).textContent, 'Actual article.');
  assert.equal(article.excerpt, 'Actual summary.');
  assert.equal(article.image, 'https://example.com/cover.jpg');
  assert.deepEqual(article.categories, ['Software']);
  assert.ok(Object.isFrozen(article));
});

test('empty encoded content falls back to the RSS description; invalid required fields are excluded', () => {
  const xml = '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Valid</title><link>https://phixalek.substack.com/p/valid</link><pubDate>2026-10-05</pubDate><content:encoded> </content:encoded><description><![CDATA[<p>Fallback body.</p>]]></description></item><item><title>Missing URL</title><pubDate>2026-10-05</pubDate></item></channel></rss>';
  const articles = parseArticles(xml, view.DOMParser, view);
  assert.equal(articles.length, 1);
  assert.equal(doc(articles[0].html).textContent, 'Fallback body.');
  for (const published of ['2026-02-30', '2026-10-05T12:00:00', 'invalid']) assert.equal(normalizeArticle({ title:'Bad date', url:options.sourceUrl, published }), null);
});

test('shared transport enforces byte limits without Content-Length and preserves split UTF-8', async () => {
  const bytes = new TextEncoder().encode('Café — texto');
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes.slice(0,4)); controller.enqueue(bytes.slice(4)); controller.close(); } }));
  assert.equal(await readFeedText(response), 'Café — texto');
  await assert.rejects(readFeedText(new Response('x'.repeat(MAX_FEED_BYTES + 1))), /too large/);
  await assert.rejects(readFeedText(new Response('error', {status:503})), /unavailable/);
});
