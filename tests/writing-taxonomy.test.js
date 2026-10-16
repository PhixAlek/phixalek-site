import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { writingConfig } from '../src/shared/writing/config.js';
import { deriveCategories, categoryForTag } from '../src/shared/writing/listing-model.js';
import { isArticleType, orderedTags } from '../src/shared/writing/taxonomy.js';
import { createArticleCard } from '../src/js/modules/writing/components/card-dom.js';
import catalog from '../src/content/locales/en.json' with { type: 'json' };

test('published types lead the taxonomy without inventing empty filters; topic aliases stay compatible', () => {
  const categories = deriveCategories([{ categories: ['Angular', 'Guides', 'Notes', '.NET'] }], { definitions: writingConfig.categories });
  assert.deepEqual(categories.map(item => item.labels.en), ['Notes', 'Guides', 'Angular', 'C# / .NET']);
  assert.equal(categories.some(item => item.id === 'thoughts'), false);
  assert.equal(categoryForTag('C#', categories), 'dotnet');
  assert.deepEqual(deriveCategories([{ categories: [] }], { definitions: writingConfig.categories }), []);
  assert.deepEqual(orderedTags(['Software', 'Guides', 'Thoughts', 'Notes']), ['Notes', 'Thoughts', 'Guides', 'Software']);
});

test('all three types are marked independently of tag position and topics never receive the type marker', () => {
  const dom = new JSDOM('');
  const categories = ['Design', 'Guides', 'Thoughts', 'Notes'];
  const card = createArticleCard({ id: 'example', slug: 'example', title: 'An example', categories, published: '2026-10-14', excerpt: 'Preview', readingMinutes: 1 }, { src: '/media/mountains.svg' }, {
    doc: dom.window.document, ui: catalog.messages, text: (node, get) => { node.textContent = get(); }, bind: () => {}, getLocale: () => 'en', related: true,
  });
  assert.deepEqual([...card.querySelectorAll('[data-article-type]')].map(node => node.textContent), ['Notes', 'Thoughts', 'Guides']);
  assert.equal(card.querySelector('.editorial-tags > :last-child').hasAttribute('data-article-type'), false);
  assert.equal(isArticleType('Angular'), false); dom.window.close();
});
