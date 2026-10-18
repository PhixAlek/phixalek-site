import { JSDOM } from 'jsdom';
import { SITE_ORIGIN } from '../../src/shared/site-seo.js';

/** Read-only production audit: never builds, deploys or calls booking endpoints. */
export async function checkLiveSeo({ fetchImpl = fetch, origin = SITE_ORIGIN } = {}) {
  const errors = [], pages = [];
  const read = async path => {
    const response = await fetchImpl(new URL(path, origin), { signal: AbortSignal.timeout(12000) });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    if (response.redirected) throw new Error(`redirects to ${response.url}`);
    return response.text();
  };
  let urls = [];
  try {
    const xml = new JSDOM(await read('/sitemap.xml'), { contentType: 'application/xml' });
    urls = [...xml.window.document.querySelectorAll('url > loc')].map(n => n.textContent.trim());
    xml.window.close();
    if (!urls.length) errors.push('Sitemap is empty');
    if (urls.length > 1000) throw new Error('Audit limited to 1000 URLs');
  } catch (error) { errors.push(`sitemap.xml: ${error.message}`); return { errors, pages }; }
  try {
    const robots = await read('/robots.txt');
    if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt: missing sitemap declaration');
    if (/^Disallow:\s*\/\s*$/im.test(robots)) errors.push('robots.txt: root is blocked');
  } catch (error) { errors.push(`robots.txt: ${error.message}`); }
  const seen = new Set();
  for (const location of urls) {
    try {
      const url = new URL(location);
      if (url.origin !== origin || url.search || url.hash || url.username || url.password) throw new Error('unexpected sitemap destination');
      if (seen.has(location)) throw new Error('duplicate sitemap URL');
      seen.add(location);
      const dom = new JSDOM(await read(location));
      try {
        const doc = dom.window.document;
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const title = doc.title.trim();
        if (doc.querySelectorAll('link[rel="canonical"]').length !== 1 || canonical !== location) errors.push(`${location}: canonical missing or differs from sitemap`);
        if (/\bnoindex\b/i.test(robots)) errors.push(`${location}: noindex`);
        if (!title) errors.push(`${location}: missing title`);
        if (!doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()) errors.push(`${location}: missing description`);
        if (doc.querySelector('meta[property="og:url"]')?.getAttribute('content') !== location) errors.push(`${location}: incorrect og:url`);
        pages.push({ url: location, status: 200, canonical, title });
      } finally { dom.window.close(); }
    } catch (error) { errors.push(`${location}: ${error.message}`); }
  }
  for (const path of ['/', '/blog/']) if (!seen.has(origin + path)) errors.push(`Sitemap missing ${origin + path}`);
  return { errors, pages };
}
