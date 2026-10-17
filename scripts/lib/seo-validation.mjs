import { readFile, access } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { AUTHOR, SITE_ORIGIN } from '../../src/shared/site-seo.js';

/** Validate the deployable files, not only the metadata-generating functions. */
export async function validateSeo(dist = new URL('../../dist/', import.meta.url)) {
  const errors = [];
  const xml = await readFile(new URL('sitemap.xml', dist), 'utf8');
  const sitemap = new JSDOM(xml, { contentType: 'application/xml' });
  const entries = [...sitemap.window.document.querySelectorAll('url')];
  const seen = new Set();
  const titles = new Set();
  if (!entries.length) errors.push('Sitemap is empty');
  for (const entry of entries) {
    const location = entry.querySelector('loc')?.textContent;
    let url;
    try { url = new URL(location); } catch { errors.push(`Invalid sitemap URL: ${location}`); continue; }
    if (url.origin !== SITE_ORIGIN || !/^\/(?:blog\/(?:[\w-]+\/)?)?$/.test(url.pathname) || url.search || url.hash) {
      errors.push(`Unexpected sitemap URL: ${location}`); continue;
    }
    if (seen.has(location)) errors.push(`Duplicate sitemap URL: ${location}`);
    seen.add(location);
    let html;
    try { html = await readFile(new URL(url.pathname.slice(1) + 'index.html', dist), 'utf8'); }
    catch { errors.push(`Missing static page: ${location}`); continue; }
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const check = (condition, message) => { if (!condition) errors.push(`${location}: ${message}`); };
    check(doc.querySelectorAll('h1').length === 1, 'expected one h1');
    check(doc.querySelectorAll('title').length === 1 && doc.title.trim(), 'missing title');
    check(!titles.has(doc.title), 'duplicate title'); titles.add(doc.title);
    check(doc.querySelectorAll('link[rel=canonical]').length === 1 && doc.querySelector('link[rel=canonical]')?.href === location, 'canonical differs from sitemap');
    check(doc.querySelector('meta[name=robots]')?.content.startsWith('index,'), 'page is not indexable');
    check(doc.querySelectorAll('meta[name=description]').length === 1 && doc.querySelector('meta[name=description]')?.content.trim(), 'missing description');
    check(doc.querySelector('meta[property="og:url"]')?.content === location, 'incorrect Open Graph URL');
    const image = doc.querySelector('meta[property="og:image"]')?.content;
    try {
      const target = new URL(image);
      check(target.protocol === 'https:', 'social image must use HTTPS');
      if (target.origin === SITE_ORIGIN) await access(new URL(target.pathname.slice(1), dist));
    } catch { check(false, 'missing or invalid social image'); }
    try {
      const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => {
        const data = JSON.parse(node.textContent); return data['@graph'] || [data];
      });
      check(schemas.length > 0, 'missing structured data');
      if (/^\/blog\/[^/]+\/$/.test(url.pathname)) {
        const post = schemas.find(data => data['@type'] === 'BlogPosting');
        check(post?.url === location && post?.author?.name === AUTHOR.name && post?.author?.['@id'] === AUTHOR['@id'], 'incorrect article identity');
        const lastmod = entry.querySelector('lastmod')?.textContent;
        check(lastmod && Number.isFinite(Date.parse(lastmod)) && post?.dateModified === lastmod, 'article and sitemap modification dates differ');
        check(Boolean(doc.querySelector('.editorial-prose')?.textContent.trim() || doc.querySelector('.editorial-prose img')), 'missing article body');
      }
    } catch { check(false, 'invalid structured data'); }
    dom.window.close();
  }
  sitemap.window.close();
  for (const url of [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/blog/`]) {
    if (!seen.has(url)) errors.push(`Missing primary sitemap URL: ${url}`);
  }
  const robots = await readFile(new URL('robots.txt', dist), 'utf8');
  if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) errors.push('robots.txt does not declare the sitemap');
  for (const file of ['404.html', 'blog/__not-found.html']) {
    const dom = new JSDOM(await readFile(new URL(file, dist), 'utf8'));
    if (!dom.window.document.querySelector('meta[name=robots]')?.content.startsWith('noindex')) errors.push(`${file} must be noindex`);
    if (dom.window.document.querySelector('link[rel=canonical]')) errors.push(`${file} must not claim a valid page canonical`);
    dom.window.close();
  }
  return { errors, pages: seen.size };
}
