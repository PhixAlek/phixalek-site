import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSeo } from '../scripts/lib/seo.mjs';

const content = JSON.parse(readFileSync(new URL('../src/data/content.json', import.meta.url), 'utf8'));

test('SEO exposes approved content and excludes drafts and invalid links', () => {
  const data = structuredClone(content);
  data.projects.items.push({ publication: 'draft', title: 'PRIVATE DRAFT', desc: 'Unpublished' });
  data.projects.items[0].actions.push({ kind: 'link', text: 'Unsafe', href: 'javascript:alert(1)' });
  data.footer.social.push({ name: 'Unsafe', href: 'javascript:alert(1)' });
  const seo = buildSeo(data);
  assert.ok(seo.fallback.includes('Alejandro Segura'));
  assert.ok(seo.fallback.includes('Flowly'));
  assert.ok(seo.fallback.includes('https://github.com/PhixAlek/Flowly'));
  assert.ok(!seo.fallback.includes('PRIVATE DRAFT'));
  assert.ok(!seo.fallback.includes('javascript:'));
  const graph = JSON.parse(seo.structuredData)['@graph'];
  assert.equal(graph.find(n => n['@type'] === 'ProfilePage').mainEntity['@id'], graph.find(n => n['@type'] === 'Person')['@id']);
  assert.ok(!seo.structuredData.includes('javascript:'));
});

test('SEO escapes editorial markup in HTML and inline JSON', () => {
  const data = structuredClone(content);
  data.hero.subtitle = '[[.NET]] </script><script>alert("unsafe")</script>';
  data.projects.items[0].title = '<img src=x onerror=alert(1)>';
  const seo = buildSeo(data);
  assert.ok(!seo.fallback.includes('<script>'));
  assert.ok(!seo.fallback.includes('<img'));
  assert.ok(seo.fallback.includes('&lt;img'));
  assert.ok(!seo.structuredData.includes('</script>'));
  assert.ok(JSON.parse(seo.structuredData)['@graph'][0].description.includes('</script>'));
});
