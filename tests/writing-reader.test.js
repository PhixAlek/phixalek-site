import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { articleFragment } from '../src/js/modules/writing/article-html.js';
import { parseArticles, loadArticles } from '../src/js/modules/writing/feed.js';
import { selectLatestPost } from '../src/js/modules/writing/latest.js';

const view = new JSDOM('').window;
const feed = `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
  <item><title>Older</title><link>https://phixalek.substack.com/p/older</link><pubDate>2026-10-01</pubDate>
  <content:encoded><![CDATA[<h2>Introduction</h2><p>Real article body.</p>]]></content:encoded><category>Software</category></item>
  <item><title>Newest</title><link>https://phixalek.substack.com/p/newest</link><pubDate>2026-10-05</pubDate>
  <description>Actual excerpt</description><content:encoded><![CDATA[<p>Complete newest post.</p>]]></content:encoded></item>
</channel></rss>`;
test('reader receives all available articles and full RSS bodies independently of the latest preview', () => {
  const items = parseArticles(feed, view.DOMParser);
  assert.deepEqual(items.map(item => item.slug), ['newest', 'older']);
  assert.ok(items[1].html.includes('Real article body.'));
  assert.equal(items[0].excerpt, 'Actual excerpt');
  assert.deepEqual(items[1].categories, ['Software']);
  assert.equal(items[0].readingMinutes, 1);
});
test('Home preview accepts normalized feed articles and opens the actual latest post', () => {
  const post = selectLatestPost(parseArticles(feed, view.DOMParser));
  assert.equal(post.title, 'Newest');
  assert.equal(post.url, 'https://phixalek.substack.com/p/newest');
});
test('article HTML preserves prose but removes scripts, handler attributes, dangerous URLs and provider forms', () => {
  const fragment = articleFragment(`<h2 id="app">Safe heading</h2><script>alert(1)</script>
    <img src="https://example.com/image.jpg" onerror="alert(1)"><a href="javascript:alert(1)">Bad link</a>
    <iframe src="https://attacker.example"></iframe><form action="https://attacker.example"><input name="password"></form>
    <div class="subscription-widget-wrap-editor"><p>Provider widget</p></div><p>Actual content.</p>`, view);
  assert.equal(fragment.querySelectorAll('script,iframe,form,input,[onerror],[id]').length, 0);
  assert.ok(!fragment.textContent.includes('Provider widget'));
  assert.ok(fragment.textContent.includes('Actual content.'));
  assert.ok(!fragment.querySelector('a').hasAttribute('href'));
  assert.equal(fragment.querySelector('img').loading, 'lazy');
});
test('reader links have safe external navigation and relative links resolve against the publication', () => {
  const fragment = articleFragment('<a href="/p/post">Source</a><img src="data:text/html,unsafe"><svg onload="alert(1)"></svg>', view);
  const anchor = fragment.querySelector('a');
  assert.equal(anchor.href, 'https://phixalek.substack.com/p/post');
  assert.equal(anchor.rel, 'noopener noreferrer');
  assert.equal(fragment.querySelector('svg'), null);
  assert.equal(fragment.querySelector('img').hasAttribute('src'), false);
});
test('reading, list navigation and reload reuse the session feed; explicit refresh refetches', async () => {
  const storage = { value: feed, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
  let requests = 0;
  const fetchFeed = async () => { requests++; return new Response(feed); };
  const options = { storage, fetchFeed, Parser: view.DOMParser };
  await loadArticles(options); await loadArticles(options);
  assert.equal(requests, 0);
  await loadArticles({ ...options, force: true });
  await loadArticles(options); assert.equal(requests, 1);
});
test('entity declarations and invalid feeds cannot enter the reader', () => {
  assert.throws(() => parseArticles('<!DOCTYPE rss><rss/>', view.DOMParser));
  assert.throws(() => parseArticles('<html/>', view.DOMParser));
});
