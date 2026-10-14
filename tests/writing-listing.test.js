import { mountReaderEngagement } from '../src/js/modules/writing/components/reader-engagement.js';
import { ArticleComments } from '../src/js/modules/writing/components/article-comments.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { filterArticles, feedBatch, deriveCategories, categoryForTag, selectFeedArticles } from '../src/shared/writing/listing-model.js';
import { createArticleCard } from '../src/js/modules/writing/components/card-dom.js';
import { mountFeed } from '../src/js/modules/writing/components/feed-controller.js';
import { ArticleActions, mountArticleActions } from '../src/js/modules/writing/components/article-actions.js';
import { validateWritingConfig } from '../src/shared/writing/validate.js';
import { writingConfig } from '../src/shared/writing/config.js';
import catalog from '../src/content/locales/en.json' with { type: 'json' };

const article = (slug, extra = {}) => ({ id: `https://phixalek.substack.com/p/${slug}`, slug, sourceUrl: `https://phixalek.substack.com/p/${slug}`,
  title: slug, excerpt: 'Short original text', categories: [], ...extra });
const data = [article('net', { title: 'Café with .NET', categories: ['Software'] }), article('game', { categories: ['Game Development'] })];
const categories = [{ id: 'software', labels: { en: 'Software', es: 'Software' } },
  { id: 'game-dev', labels: { en: 'Game Dev', es: 'Game Dev' }, aliases: ['Game Development'] }];

test('filters and search include matching Featured without changing the fixed hero', () => {
  const featured = article('featured', { categories: ['Software'] });
  const articles = [featured, ...data];
  for (const desktop of [false, true]) {
    const rows = selectFeedArticles(articles, { desktop, filtered: true });
    assert.deepEqual(filterArticles(rows, { category: 'software', categories }).map(item => item.slug), ['featured', 'net']);
    assert.deepEqual(filterArticles(rows, { query: 'featured' }).map(item => item.slug), ['featured']);
    assert.equal(articles[0], featured);
    assert.deepEqual(selectFeedArticles(articles, { desktop }), data);
  }
  assert.deepEqual(selectFeedArticles([featured]), [featured]);
  assert.deepEqual(selectFeedArticles([featured], { filtered: true }), [featured]);
});

test('search is case/accent insensitive and composes with JSON category aliases', () => {
  assert.deepEqual(filterArticles(data, { query: 'CAFE' }).map(item => item.slug), ['net']);
  assert.deepEqual(filterArticles(data, { category: 'game-dev', categories }).map(item => item.slug), ['game']);
  assert.equal(filterArticles(data, { category: 'game-dev', query: '.net', categories }).length, 0);
  assert.equal(filterArticles(data, { query: 'missing' }).length, 0);
  assert.deepEqual(filterArticles(data).map(item => item.slug), ['net', 'game']);
});
test('feed repetitions keep stable source IDs but unique occurrence keys and cannot fabricate articles', () => {
  const result = feedBatch(data, 0, 5, { repeat: true });
  assert.deepEqual(result.map(entry => entry.article.slug), ['net', 'game', 'net', 'game', 'net']);
  assert.equal(new Set(result.map(entry => entry.key)).size, 5);
  assert.equal(result[0].article.id, result[2].article.id);
  assert.deepEqual(feedBatch([], 0, 4, { repeat: true }), []);
  assert.equal(feedBatch(data, 1, 4).length, 1);
  assert.equal(feedBatch(data, 2, 4).length, 0);
});

function fixture() {
  const dom = new JSDOM('<main><div id="list"></div><button id="more"></button><button id="auto"></button></main>', { url: 'https://phixalek.com/blog' });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  const doc = dom.window.document;
  const observers = [];
  const view = { ...dom.window, navigator: {},
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; this.active = true; }
      disconnect() { this.active = false; }
    }, getComputedStyle: () => ({ rowGap: '24px' }), scrollBy() {},
  };
  return { dom, doc, view, observers, container: doc.querySelector('main'), list: doc.getElementById('list'), more: doc.getElementById('more'), automatic: doc.getElementById('auto') };
}
const createCard = doc => record => { const node = doc.createElement('article'); node.textContent = record.title; return node; };

test('progressive loading uses cached articles, respects empty/finite results and cleans up observers', () => {
  const f = fixture();
  const dispose = mountFeed({ ...f, articles: data, batchSize: 1, createCard: createCard(f.doc) });
  assert.equal(f.list.children.length, 1); assert.equal(f.more.hidden, false);
  f.more.click(); assert.equal(f.list.children.length, 2); assert.equal(f.more.hidden, true);
  assert.equal(f.list.children[1].getAttribute('aria-posinset'), '2');
  assert.equal(f.list.children[1].getAttribute('aria-setsize'), '2');
  dispose(); assert.equal(f.observers[0].active, false);
  f.more.click(); assert.equal(f.list.children.length, 2);
});
test('automatic loading can be paused; offscreen recycling caps DOM without removing focused cards', () => {
  const f = fixture(); let removed = 0;
  const dispose = mountFeed({ ...f, articles: data, repeat: true, batchSize: 2, maxCards: 4,
    onRemove: () => removed++, createCard: record => {
      const card = createCard(f.doc)(record); card.getBoundingClientRect = () => ({ bottom: -100, height: 100 }); return card;
    } });
  f.observers[0].callback([{ isIntersecting: true }]);
  f.observers[0].callback([{ isIntersecting: true }]);
  assert.equal(f.list.children.length, 4); assert.equal(removed, 2);
  f.automatic.click(); assert.equal(f.automatic.getAttribute('aria-pressed'), 'false');
  assert.equal(f.observers[0].active, false);
  const before = f.list.lastElementChild.dataset.entryKey;
  f.observers[0].callback([{ isIntersecting: true }]); assert.equal(f.list.lastElementChild.dataset.entryKey, before);
  f.more.click(); assert.equal(f.list.children.length, 4);
  dispose();
});

const bind = (node, property, getter) => { if (property.startsWith('attr:')) node.setAttribute(property.slice(5), getter()); else node[property] = getter(); };
const text = (node, getter) => bind(node, 'textContent', getter);
const ui = catalog.messages;

test('comment action navigates to the internal comments destination without activating the card link', () => {
  const f = fixture(); let destination;
  f.doc.addEventListener('site:navigate', event => { destination = event.detail; });
  const actions = ArticleActions(data[0], { doc: f.doc, ui, bind }); f.container.append(actions);
  const dispose = mountArticleActions(f.container, data, { view: f.view, ui, text });
  actions.querySelector('[data-article-action="comments"]').click();
  assert.equal(destination, '/blog/net#comments');
  assert.equal(actions.querySelector('a button'), null);
  dispose();
});
test('comments destination exists, can receive focus and opens the provider notice before redirecting', () => {
  const f = fixture();
  const section = ArticleComments(data[0], { doc: f.doc, ui, text }); f.container.append(section);
  assert.equal(section.id, 'comments'); section.focus(); assert.equal(f.doc.activeElement, section);
  assert.ok(section.textContent.includes('Substack'));
  assert.equal(section.querySelector('a').href, data[0].sourceUrl + '/comments');
  assert.equal(section.querySelector('.editorial-comment-cta').dataset.substackAction, 'comments');
  assert.equal(section.querySelector('form'), null);
});
test('share copies our article URL; it does not navigate readers to Substack', async () => {
  const f = fixture(); let copied;
  f.view.navigator.share = () => { assert.fail("Native share must not open"); };
  f.view.navigator.clipboard = { writeText: async value => { copied = value; } };
  f.container.append(ArticleActions(data[0], { doc: f.doc, ui, bind }));
  const dispose = mountArticleActions(f.container, data, { view: f.view, ui, bind, text });
  const button = f.container.querySelector('[data-article-action="share"]'); button.click();
  assert.equal(f.container.querySelector('dialog').open, true);
  assert.equal(copied, undefined);
  f.container.querySelector('dialog .btn').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(copied, 'https://phixalek.com/blog/net');
  assert.equal(button.disabled, false); assert.equal(f.container.querySelector('[role="status"]').textContent, 'Link copied.');
  dispose();
});
test('invalid feed settings fail validation before a build', () => {
  assert.deepEqual(validateWritingConfig(writingConfig), []);
  assert.ok(validateWritingConfig({ ...writingConfig, listing: { batchSize: 0, maxRenderedCards: 1000, repeatMobile: 'yes' } }).some(error => error.includes('listing')));
});

test('restored feed recreates the saved window and leaves automatic loading paused', () => {
  const f = fixture();
  const dispose = mountFeed({ ...f, articles: data, repeat: true, batchSize: 2, initialOffset: 10, initialCount: 4,
    automaticEnabled: false, createCard: createCard(f.doc) });
  assert.equal(f.list.children.length, 4);
  assert.equal(f.list.firstElementChild.getAttribute('aria-posinset'), '11');
  assert.equal(f.list.lastElementChild.getAttribute('aria-posinset'), '14');
  assert.equal(f.automatic.getAttribute('aria-pressed'), 'false');
  f.more.click(); assert.equal(f.list.lastElementChild.getAttribute('aria-posinset'), '16');
  dispose();
});


test('reusable cards keep content literal, isolate actions from article links and recover missing images', () => {
  const f = fixture();
  const record = { ...data[0], title: '<strong>Original title</strong>', published: '2026-10-01T12:00:00Z', readingMinutes: 3, language: 'en', image: 'https://example.com/missing.jpg' };
  const card = createArticleCard(record, { src: '/media/mountains.svg' }, { doc: f.doc, ui, bind, text, getLocale: () => 'en' });
  assert.equal(card.querySelector('h2').textContent, record.title);
  assert.equal(card.querySelector('h2 strong'), null);
  assert.equal(card.querySelector('a button'), null);
  assert.equal(card.querySelectorAll('[data-article-action]').length, 2);
  assert.equal(card.querySelector('a').getAttribute('href'), '/blog/net');
  const image = card.querySelector('img'); image.onerror();
  assert.equal(image.getAttribute('src'), '/media/mountains.svg');
  assert.equal(image.onerror, null);
  assert.equal(image.loading, 'lazy');
});


test('compiled filters come only from item categories, never unused configuration entries', () => {
  assert.deepEqual(deriveCategories([article('untagged')], { definitions: categories }), []);
  const actual = deriveCategories(data, { definitions: [...categories, { id: 'flowly', labels: { en: 'Flowly', es: 'Flowly' } }] });
  assert.deepEqual(actual.map(item => item.id), ['software', 'game-dev']);
  assert.equal(actual.some(item => item.id === 'flowly'), false);
  assert.deepEqual(filterArticles(data, { category: 'game-dev', categories: actual }).map(item => item.slug), ['game']);
});

test('unknown item tags become filters without hardcoded names; duplicates count each post once', () => {
  const actual = deriveCategories([article('a', { categories: ['Rust', 'Rust', 'RUST'] }), article('b', { categories: ['Rust', 'Graphics'] })]);
  assert.deepEqual(actual.map(item => item.labels.en), ['Rust', 'Graphics']);
  assert.deepEqual(actual.map(item => item.count), [2, 1]);
  assert.equal(filterArticles([article('a', { categories: ['RUST'] })], { category: actual[0].id, categories: actual }).length, 1);
});

test('removed/edited item tags disappear from the next compiled manifest; owner item overrides are inherited', () => {
  const tagged = article('a', { categories: ['Rust'] });
  assert.deepEqual(deriveCategories([tagged], { removedSlugs: ['a'] }), []);
  assert.deepEqual(deriveCategories([{ ...tagged, categories: [] }]), []);
  const actual = deriveCategories([article('a')], { articleOverrides: { [tagged.sourceUrl]: { categories: ['Graphics'] } } });
  assert.deepEqual(actual.map(item => item.labels.en), ['Graphics']);
});


test('local examples navigate to local comments and copy only their local preview URL', async () => {
  const f = fixture(); let copied, destination;
  f.view.location = { origin: 'http://localhost:5173' };
  f.view.navigator.clipboard = { writeText: async value => { copied = value; } };
  f.doc.addEventListener('site:navigate', event => { destination = event.detail; });
  const example = { ...data[0], localDemo: true };
  f.container.append(ArticleActions(example, { doc: f.doc, ui, bind }));
  const dispose = mountArticleActions(f.container, [example], { view: f.view, ui, bind, text });
  f.container.querySelector('[data-article-action="comments"]').click();
  assert.equal(destination, '/blog/net#comments');
  const share = f.container.querySelector('[data-article-action="share"]'); share.focus(); share.click();
  assert.equal(f.container.querySelector('dialog').open, true);
  f.container.querySelector('dialog .btn').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(copied, 'http://localhost:5173/blog/net');
  f.container.querySelector('dialog button').click(); assert.equal(f.doc.activeElement, share);
  dispose();
});


test('cards place the image first and prioritize only the featured cover', () => {
  const f = fixture();
  const record = { ...data[0], published: '2026-10-01T12:00:00Z', readingMinutes: 3, language: 'en' };
  const options = { doc: f.doc, ui, bind, text, getLocale: () => 'en' };
  const featured = createArticleCard(record, { src: '/media/mountains.svg' }, { ...options, featured: true });
  assert.equal(featured.querySelector('.editorial-card-link > figure').className, 'editorial-thumbnail');
  assert.equal(featured.querySelector('img').loading, 'eager');
  const regular = createArticleCard(record, { src: '/media/mountains.svg' }, options);
  assert.equal(regular.querySelector('img').loading, 'lazy');
});

test('finite desktop batches load automatically without a load-more button', () => {
  const f = fixture(); const sentinel = f.doc.createElement('div');
  f.more.replaceWith(sentinel);
  const dispose = mountFeed({ ...f, more: sentinel, articles: data, batchSize: 1, createCard: createCard(f.doc) });
  assert.equal(f.list.children.length, 1);
  f.observers[0].callback([{ isIntersecting: true }]);
  assert.equal(f.list.children.length, 2);
  assert.equal(sentinel.hidden, true);
  assert.equal(f.observers[0].active, false);
  dispose();
});

test('lazy feed shows a loading state before rendering, deduplicates triggers and cancels disposed batches', () => {
  const f = fixture(); const frames = [], states = [];
  f.view.requestAnimationFrame = callback => { frames.push(callback); };
  const dispose = mountFeed({ ...f, articles: data, repeat: true, batchSize: 1, createCard: createCard(f.doc), onLoading: value => states.push(value) });
  f.observers[0].callback([{ isIntersecting: true }]);
  f.observers[0].callback([{ isIntersecting: true }]);
  assert.equal(f.list.children.length, 1); assert.deepEqual(states, [true]);
  assert.equal(frames.length, 1); assert.equal(f.list.getAttribute('aria-busy'), 'true');
  frames.shift()(); frames.shift()();
  assert.equal(f.list.children.length, 2); assert.deepEqual(states, [true, false]);
  f.observers[0].callback([{ isIntersecting: true }]); dispose();
  frames.shift()(); frames.shift()(); assert.equal(f.list.children.length, 2);
  assert.equal(f.list.getAttribute('aria-busy'), 'false');
});

test('cards retain four original tags without inventing tags for untagged posts', () => {
  const f = fixture();
  const record = { ...data[0], published: '2026-10-01T12:00:00Z', readingMinutes: 3, categories: ['Design', 'Portfolio', 'Writing', 'Notes', 'Other'] };
  const options = { doc: f.doc, ui, bind, text, getLocale: () => 'en' };
  const card = createArticleCard(record, { src: '/media/mountains.svg' }, options);
  assert.deepEqual([...card.querySelectorAll('.editorial-tags button')].map(node => node.textContent), record.categories.slice(0, 4));
  const untagged = createArticleCard({ ...record, categories: [] }, { src: '/media/mountains.svg' }, options);
  assert.equal(untagged.querySelectorAll('.editorial-tags button').length, 0);
});

test('thumbnail overlay uses source metadata without duplicating the featured label', () => {
  const f = fixture();
  const record = { ...data[0], published: '2026-10-01T12:00:00Z', readingMinutes: 3, language: 'en' };
  const options = { doc: f.doc, ui, bind, text, getLocale: () => 'en' };
  const featured = createArticleCard(record, { src: '/media/mountains.svg' }, { ...options, featured: true });
  const caption = featured.querySelector('figcaption');
  assert.equal(caption.getAttribute('aria-hidden'), 'true');
  assert.equal(caption.querySelector('.editorial-thumbnail-meta').textContent, 'EN');
  assert.equal(caption.querySelector('.editorial-thumbnail-meta').hidden, false);
  assert.equal(featured.querySelector('.editorial-card-copy .article-language'), null);
  assert.equal(caption.querySelector('.editorial-thumbnail-title'), null);
  assert.equal(caption.querySelector('.editorial-featured-label').textContent, 'Featured');
  assert.equal(featured.querySelector('.editorial-card-copy .editorial-featured-label'), null);
  assert.equal(caption.querySelector('.editorial-thumbnail-author'), null);
  const card = createArticleCard(record, { src: '/media/mountains.svg' }, options);
  assert.ok(card.querySelector('.editorial-thumbnail-meta').textContent.includes('3 min read'));
  assert.equal(card.querySelector('h2').textContent, record.title);
  assert.equal(card.querySelector('.editorial-thumbnail-title').textContent, record.title);
  assert.equal(card.querySelectorAll('.editorial-title-line').length, 2);
});

 test('mobile repetition stops at the configured cycle boundary, including partial batches', () => {
  const f = fixture();
  const dispose = mountFeed({ ...f, articles: data, repeat: true, batchSize: 4, maxEntries: 6, createCard: createCard(f.doc) });
  assert.equal(f.list.children.length, 4);
  f.more.click();
  assert.equal(f.list.children.length, 6);
  assert.equal(f.more.hidden, true);
  assert.equal(f.automatic.hidden, true);
  assert.equal(f.observers[0].active, false);
  f.more.click();
  assert.equal(f.list.children.length, 6);
  dispose();
});

test('article tags resolve their actual compiled category and remain outside the reading link', () => {
  const groups = deriveCategories(data, { definitions: categories });
  assert.equal(categoryForTag('game development', groups), 'game-dev');
  assert.equal(categoryForTag('unused', groups), '');
  const f = fixture();
  const card = createArticleCard({ ...data[0], published: '2026-10-01', readingMinutes: 2 }, { src: '/media/mountains.svg' }, { doc: f.doc, ui, bind, text, getLocale: () => 'en' });
  assert.equal(card.querySelector('a button'), null);
  assert.equal(card.querySelector('[data-article-tag]').textContent, 'Software');
  assert.equal(card.querySelector('.editorial-card-target').getAttribute('href'), '/blog/net');
});

test('share sheet closes two seconds after successful copy, restores focus and cancels stale timers', async () => {
  const f = fixture(); let timer, cancelled;
  f.view.setTimeout = (callback, delay) => { timer = { callback, delay }; return timer; };
  f.view.clearTimeout = id => { cancelled = id; };
  f.view.navigator.clipboard = { writeText: async () => {} };
  f.container.append(ArticleActions(data[0], { doc: f.doc, ui, bind }));
  const dispose = mountArticleActions(f.container, data, { view: f.view, ui, text });
  const trigger = f.container.querySelector('[data-article-action="share"]'); trigger.click();
  const dialog = f.container.querySelector('dialog'); dialog.querySelector('.btn').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(timer.delay, 2000); assert.equal(dialog.open, true);
  timer.callback(); assert.equal(dialog.open, false); assert.equal(f.doc.activeElement, trigger);
  trigger.click(); dialog.querySelector('.btn').click(); await new Promise(resolve => setTimeout(resolve, 0));
  const stale = timer; dialog.querySelector('button').click(); trigger.click();
  assert.equal(cancelled, stale); stale.callback(); assert.equal(dialog.open, true);
  dispose();
});
test('failed copying keeps the sheet open for manual copy without scheduling dismissal', async () => {
  const f = fixture();
  f.view.setTimeout = () => { assert.fail('Failure must not schedule dismissal'); };
  f.view.navigator.clipboard = { writeText: async () => { throw new Error('Denied'); } };
  f.container.append(ArticleActions(data[0], { doc: f.doc, ui, bind }));
  const dispose = mountArticleActions(f.container, data, { view: f.view, ui, text });
  f.container.querySelector('[data-article-action="share"]').click();
  const dialog = f.container.querySelector('dialog'); dialog.querySelector('.btn').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(dialog.open, true); assert.equal(f.doc.activeElement, dialog.querySelector('input'));
  dispose();
});

test('grid/mobile actions retain empty icons with zero and show available counts and keep like navigation independent of the card', () => {
  const dom = new JSDOM(''); const doc = dom.window.document;
  const bind = (node, property, get) => node.setAttribute(property.slice(5), get());
  const ui = catalog.messages;
  const post = article('real-post', { engagement: { likes: 2, comments: 3 } });
  const actions = ArticleActions(post, { doc, ui, bind });
  assert.equal(actions.querySelector('.editorial-card-likes').getAttribute('href'), '/blog/real-post#article-engagement');
  assert.equal(actions.querySelector('.editorial-card-likes span').textContent, '2');
  assert.ok(actions.querySelector('.editorial-card-likes').classList.contains('has-reactions'));
  assert.equal(actions.querySelector('[data-article-action=comments] span').textContent, '3');
  assert.equal(actions.querySelector('[data-article-action=share] span'), null);
  const unknown = ArticleActions(article('no-counts'), { doc, ui, bind });
  assert.equal(unknown.querySelector('.editorial-card-likes span').textContent, '0');
  assert.equal(unknown.querySelector('[data-article-action=comments] span').textContent, '0');
  const fake = ArticleActions({ ...post, localDemo: true }, { doc, ui, bind });
  assert.equal(fake.querySelector('.editorial-card-likes span').textContent, '0');
  const zero = ArticleActions({ ...post, engagement: { likes: 0, comments: 0 } }, { doc, ui, bind });
  assert.equal(zero.querySelector('.editorial-card-likes span').textContent, '0');
  assert.equal(zero.querySelector('[data-article-action=comments] span').textContent, '0');
  dom.window.close();
});

test('reader keeps empty heart and comment icons as zeros without visible Comments labels', () => {
  const f = fixture(); const post = article('empty-counter');
  const story = f.doc.createElement('article'), prose = f.doc.createElement('div'); story.append(prose); f.container.append(story);
  const dispose = mountReaderEngagement(story, prose, post, { ui, text, bind, view: f.view });
  const controls = story.querySelector('.editorial-reader-social');
  assert.equal(controls.querySelectorAll('svg').length, 3);
  assert.equal(controls.querySelector('[data-substack-action=likes] span').textContent, '0');
  assert.equal(controls.querySelector('[href="#comments"] span').textContent, '0');
  assert.equal(controls.children[2].querySelector('span').textContent, ui.writingPage.share);
  assert.equal(post.engagement, undefined);
  dispose();
});

test('cards retain up to four source tags for desktop; compact visibility is controlled by CSS', () => {
  const f = fixture();
  const record = { ...data[0], published: '2026-10-01', readingMinutes: 2, categories: ['One','Two','Three','Four','Five'] };
  const card = createArticleCard(record, { src: '/media/mountains.svg' }, { doc: f.doc, ui, bind, text, getLocale: () => 'en' });
  assert.deepEqual([...card.querySelectorAll('[data-article-tag]')].map(node => node.textContent), ['One','Two','Three','Four']);
});
