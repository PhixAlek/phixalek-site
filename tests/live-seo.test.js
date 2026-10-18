import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLiveSeo } from '../scripts/lib/live-seo.mjs';
const origin = 'https://phixalek.com';
function fixture(change = {}) {
  const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/blog/'].map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`;
  const calls = [];
  const fetchImpl = async url => {
    calls.push(String(url));
    const path = new URL(url).pathname;
    if (path === '/sitemap.xml') return new Response(change.xml || xml);
    if (path === '/robots.txt') return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`);
    const html = `<title>Page ${path}</title><link rel=canonical href="${origin}${path}"><meta name=description content="Description"><meta property="og:url" content="${origin}${path}">`;
    return new Response(change.html || html, { status:change.status || 200 });
  };
  return { fetchImpl, calls };
}
test('production audit accepts minified metadata without quoted attribute names', async () => {
  const f = fixture(), result = await checkLiveSeo(f);
  assert.deepEqual(result.errors, []); assert.equal(result.pages.length, 2);
  assert.ok(f.calls.every(url => url.startsWith(origin)));
});
test('production audit reports bad status and canonical rather than deploying', async () => {
  assert.ok((await checkLiveSeo(fixture({ status:503 }))).errors.some(e=>e.includes('HTTP 503')));
  assert.ok((await checkLiveSeo(fixture({ html:'<title>Wrong</title><meta name=robots content=noindex>' }))).errors.some(e=>e.includes('canonical')));
});
test('sitemap cannot cause fetching a foreign URL', async () => {
  const f = fixture({ xml:'<urlset><url><loc>https://foreign.example/</loc></url></urlset>' });
  assert.ok((await checkLiveSeo(f)).errors.some(e=>e.includes('unexpected sitemap destination')));
  assert.ok(f.calls.every(url=>url.startsWith(origin)));
});
