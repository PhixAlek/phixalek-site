import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArticle, orderedArticles } from '../src/shared/writing/model.js';
import { articlePath, resolveWritingRoute } from '../src/shared/writing/routes.js';
import { ArticleLanguage } from '../src/js/modules/writing/components/article-language.js';

const source = (slug, published = '2026-10-01', extra = {}) => ({
  url: `https://phixalek.substack.com/p/${slug}`, title: slug, published, ...extra,
});

test('article identity and route survive title changes and tracking parameters', () => {
  const original = normalizeArticle(source('test-post-1'));
  const edited = normalizeArticle(source('test-post-1', '2026-10-01', {
    title: 'A new title', url: 'https://phixalek.substack.com/p/test-post-1?utm_source=email#comments',
  }));
  assert.equal(original.id, edited.id);
  assert.equal(articlePath(original.slug), '/blog/test-post-1');
  assert.deepEqual(resolveWritingRoute('/blog/test-post-1/'), { kind: 'article', slug: 'test-post-1' });
  assert.deepEqual(resolveWritingRoute('/blog/'), { kind: 'index' });
});

test('unknown article language stays unknown; explicit metadata and author overrides are supported', () => {
  assert.equal(normalizeArticle(source('unknown')).language, null);
  assert.equal(normalizeArticle(source('spanish', undefined, { language: 'es-MX' })).language, 'es');
  assert.equal(normalizeArticle(source('test-post-1')).language, 'en');
  assert.equal(normalizeArticle(source('unsupported', undefined, { language: 'fr' })).language, null);
  assert.equal(normalizeArticle(source('original', undefined, { language: 'en', html: '<p>Original</p>' })).html, undefined);
});

test('untrusted sources cannot create foreign, credentialed or nested article routes', () => {
  for (const url of ['https://other.example/p/post', 'https://user:password@phixalek.substack.com/p/post',
    'https://phixalek.substack.com/p/post/nested', 'javascript:alert(1)', 'https://phixalek.substack.com/p/%2Fpost']) {
    assert.equal(normalizeArticle(source('post', undefined, { url })), null);
  }
  for (const path of ['/blogging/post', '/blog/a/b', '/blog/%2Fpost', '/blog/../home']) assert.equal(resolveWritingRoute(path), null);
  assert.throws(() => articlePath('../home'), TypeError);
});

test('duplicate imports produce one article and invalid records do not displace the latest post', () => {
  const records = orderedArticles([source('older', '2026-09-30'), source('newer'), source('newer'),
    source('invalid', 'bad date'), null]);
  assert.deepEqual(records.map(a => a.slug), ['newer', 'older']);
  assert.equal(normalizeArticle(source('image', undefined, { image: 'javascript:alert(1)' })).image, null);
});

test('language badges reflect article metadata without translating its content', () => {
  const doc = { createElement: tag => ({ tag }) };
  assert.deepEqual(ArticleLanguage('en', doc), { tag: 'span', className: 'article-language', lang: 'en', textContent: 'EN' });
  assert.equal(ArticleLanguage(null, doc), null);
});

test('invalid blog configuration fails before publishing routes or source overrides', async () => {
  const { writingConfig } = await import('../src/shared/writing/config.js');
  const { validateWritingConfig } = await import('../src/shared/writing/validate.js');
  assert.deepEqual(validateWritingConfig(writingConfig), []);
  const config = structuredClone(writingConfig);
  config.routes.index = '/blog/../';
  config.categories = [{ id: 'software', labels: { en: 'Software', es: 'Software' } }, { id: 'software' }];
  config.articleOverrides = { 'https://other.example/p/post': { language: 'xx' } };
  const errors = validateWritingConfig(config);
  assert.ok(errors.some(e => e.includes('routes.index')));
  assert.ok(errors.some(e => e.includes('duplicate identifier')));
  assert.ok(errors.some(e => e.includes('canonical publication URL')));
  assert.ok(errors.some(e => e.includes('language')));
});
