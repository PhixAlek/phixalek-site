import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createWritingError, relatedArticles } from '../src/js/modules/writing/components/writing-error.js';
import catalog from '../src/content/locales/en.json' with { type: 'json' };
const article = (slug, date = '2026-10-01') => ({ slug, title: slug, categories: [], excerpt: 'Preview', published: date });
const data = [article('notes'), article('angular-components'), article('architecture'), article('angular-testing')];
test('recovery recommendations rank the requested topic and never invent posts', () => {
  assert.deepEqual(relatedArticles(data, 'missing-angular').map(post => post.slug), ['angular-components', 'angular-testing', 'notes']);
  assert.equal(relatedArticles(data).length, 3);
  assert.equal(relatedArticles(data.slice(0, 1)).length, 1);
  assert.deepEqual(relatedArticles([]), []);
});
test('missing post recovery includes illustration, retry, safe provider link and real article destinations', () => {
  const dom = new JSDOM(''), doc = dom.window.document; let retried = 0;
  const error = createWritingError({ doc, ui: catalog.messages, text: (node, get) => { node.textContent = get(); }, articles: data, topic: 'angular', retry: () => retried++ });
  assert.equal(error.querySelector('img').getAttribute('src'), '/media/mountains.svg');
  assert.equal(error.querySelectorAll('h1').length, 1);
  assert.equal(error.querySelectorAll('article').length, 3);
  assert.equal(error.querySelector('article a').getAttribute('href'), '/blog/angular-components');
  error.querySelector('button').click(); assert.equal(retried, 1);
  const external = error.querySelector('[target=_blank]');
  assert.equal(external.href, 'https://phixalek.substack.com/'); assert.equal(external.rel, 'noopener noreferrer');
  dom.window.close();
});
test('empty archive recovery remains useful without an empty related-posts section', () => {
  const dom = new JSDOM('');
  const error = createWritingError({ doc: dom.window.document, ui: catalog.messages, text: (node, get) => { node.textContent = get(); } });
  assert.equal(error.querySelector('.editorial-error-related'), null);
  assert.equal(error.querySelector('button'), null);
  assert.equal(error.querySelectorAll('a').length, 2); dom.window.close();
});
