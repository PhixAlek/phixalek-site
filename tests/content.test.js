import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validDestination, validAction, publishedItems, resolveCatalog, format, validateContent } from '../src/content/model.js';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const fixtures = () => ({ content: read('../src/data/content.json'), catalogs: { en: read('../src/content/locales/en.json'), es: read('../src/content/locales/es.json') }, sections: read('../src/content/sections.json') });
const check = f => validateContent(f.content, f.catalogs, f.sections);
test('current content validates with both languages and draft future sections', () => assert.deepEqual(check(fixtures()), []));
test('reject empty, unsafe, unimplemented and credential-bearing destinations', () => {
  for (const url of ['', '#', '#experience', 'javascript:void(0)', '//example.com', 'https://user:pass@example.com', '/work/flowly', ' https://example.com']) assert.equal(validDestination(url), false, url);
  assert.equal(validDestination('#work'), true); assert.equal(validDestination('https://github.com/phixalek'), true);
});
test('booking is an explicit action; missing link destinations are rejected', () => {
  assert.equal(validAction({ kind:'booking',text:'Book a call' }),true);
  assert.equal(validAction({ kind:'link',text:'Demo' }),false);
});
test('drafts never enter the published collection', () => {
  const items = [{publication:'draft'},{publication:'published',id:'ready'}];
  assert.deepEqual(publishedItems({publication:'draft',items}),[]);
  assert.deepEqual(publishedItems({publication:'published',items}),[items[1]]);
});
test('unavailable languages fall back completely to English', () => {
  const {catalogs}=fixtures();
  assert.equal(resolveCatalog('es',catalogs),catalogs.es);
  assert.equal(resolveCatalog('fr',catalogs),catalogs.en);
});
test('publishing incomplete Spanish fails validation', () => {
  const f=fixtures(); f.catalogs.es.publication='published'; f.catalogs.es.messages = {};
  assert.ok(check(f).some(e=>e.includes('missing translation')));
});
test('translated templates must preserve substitution tokens', () => {
  const f=fixtures(); f.catalogs.es={...structuredClone(f.catalogs.en),locale:'es'};
  f.catalogs.es.messages.booking.selected='Selected: {date}';
  assert.ok(check(f).some(e=>e.includes('mismatched placeholders')));
  assert.equal(format('{date} ({tz})',{date:'09:00',tz:'America/Hermosillo'}),'09:00 (America/Hermosillo)');
});
test('a published Flowly draft is rejected until its required content is supplied', () => {
  const f=fixtures();f.sections.work.publication='published';f.sections.work.items[0].publication='published';
  assert.ok(check(f).some(e=>e.includes('draft text')));
});
test('duplicate project identifiers and invalid actions fail validation', () => {
  const f=fixtures();f.content.projects.items[1].id=f.content.projects.items[0].id;
  f.content.projects.items[0].actions.push({kind:'link',text:'Demo',href:'#'});
  assert.ok(check(f).some(e=>e.includes('duplicate id')));
  assert.ok(check(f).some(e=>e.includes('invalid action')));
});
