import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectLanguage, readPreference, savePreference } from '../src/content/language.js';
import { validateTranslation } from '../src/content/model.js';
test('manual preference wins over browser language', () => {
  assert.equal(detectLanguage('es',['en-US']), 'es');
  assert.equal(detectLanguage('en',['es-MX']), 'en');
});
test('regional browser languages and ordered fallback', () => {
  for (const lang of ['es-MX','es-CO','es-ES']) assert.equal(detectLanguage(null,[lang]),'es');
  for (const lang of ['en-US','en-GB']) assert.equal(detectLanguage(null,[lang]),'en');
  assert.equal(detectLanguage('invalid',['fr-FR','es-MX','en-US']),'es');
  assert.equal(detectLanguage(null,['de']), 'en');
  assert.equal(detectLanguage(null,[]), 'en');
});
test('blocked storage never prevents choosing a language', () => {
  const denied={getItem(){throw Error();},setItem(){throw Error();}};
  assert.equal(readPreference(denied),null);
  assert.doesNotThrow(()=>savePreference(denied,'es'));
});
test('manual preference persists', () => {
  const values=new Map(); const store={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  savePreference(store,'es');assert.equal(readPreference(store),'es');
});
test('Spanish preserves every route, image and action', () => {
  const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
  const en=read('../src/data/content.json'),es=read('../src/data/content.es.json');
  assert.deepEqual(validateTranslation(en,es),[]);
  es.projects.items[0].actions[0].href='https://wrong.example';
  assert.ok(validateTranslation(en,es).some(e=>e.includes('invariant')));
  es.hero.avatarId='another-avatar';
  assert.ok(validateTranslation(en,es).some(e=>e.includes('avatarId')));
});

test('localized project tags preserve their palette roles and reject stale English keys', async () => {
  const { projectTagClass } = await import('../src/content/model.js');
  const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
  const en=read('../src/data/content.json'),es=read('../src/data/content.es.json');
  const project = data => data.projects.items.find(item => item.id === 'consulting');
  for (const data of [en, es, en]) {
    assert.equal(projectTagClass(project(data), 0), 'tag-primary');
    assert.equal(projectTagClass(project(data), 1), 'tag-neutral');
    assert.equal(projectTagClass(project(data), 2), 'tag-primary');
  }
  project(es).tagStyles = { Integrations:'primary', Refactoring:'primary' };
  assert.ok(validateTranslation(en,es).some(e=>e.includes('no matching tag')));
  project(es).tagStyles = { Integraciones:'complement', Refactorización:'primary' };
  assert.ok(validateTranslation(en,es).some(e=>e.includes('translated invariant')));
});
