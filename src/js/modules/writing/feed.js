import { normalizeArticle } from '../../../shared/writing/model.js';

export const FEED_SESSION_KEY = 'phixalek.writing-feed.v1';
let pending;
let memory;
export function parseArticles(xml, Parser = globalThis.DOMParser) {
  if (typeof xml !== 'string' || xml.length > 2 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid feed');
  const doc = new Parser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'rss') throw new Error('Invalid feed');
  const channel = [...doc.documentElement.children].find(node => node.localName === 'channel');
  if (!channel) throw new Error('Invalid feed');
  const unique = new Map();
  for (const item of [...channel.children].filter(node => node.localName === 'item')) {
    const child = name => [...item.children].find(node => node.localName === name);
    const enclosure = child('enclosure');
    const article = normalizeArticle({ title: child('title')?.textContent, url: child('link')?.textContent?.trim(),
      published: child('pubDate')?.textContent, language: child('language')?.textContent,
      image: enclosure?.getAttribute('type')?.startsWith('image/') ? enclosure.getAttribute('url') : null });
    if (!article || unique.has(article.id)) continue;
    const html = child('encoded')?.textContent || child('description')?.textContent || '';
    const plain = new Parser().parseFromString(html, 'text/html');
    plain.querySelectorAll('script, style, form, .subscription-widget-wrap-editor').forEach(node => node.remove());
    const prose = plain.body.textContent.replace(/\s+/g, ' ').trim();
    const description = child('description')?.textContent || '';
    const excerptDoc = new Parser().parseFromString(description, 'text/html');
    const excerpt = (excerptDoc.body.textContent || prose).trim().slice(0, 240);
    unique.set(article.id, { ...article, html, excerpt,
      categories: [...item.children].filter(node => node.localName === 'category').map(node => node.textContent.trim()).filter(Boolean),
      readingMinutes: Math.max(1, Math.ceil(prose.split(/\s+/).filter(Boolean).length / 200)),
    });
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}

export async function loadArticles({ fetchFeed = fetch, storage, force = false, Parser = globalThis.DOMParser } = {}) {
  if (storage === undefined) { try { storage = window.sessionStorage; } catch { /* Use in-memory cache. */ } }
  if (pending) return pending;
  if (!force) {
    if (memory) return parseArticles(memory, Parser);
    try { const saved = storage?.getItem(FEED_SESSION_KEY); if (saved) return parseArticles(saved, Parser); } catch { /* Invalid cache is refetched. */ }
  }
  pending = (async () => {
    const response = await fetchFeed('/.netlify/functions/latest-writing', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!response.ok) throw new Error('Writing unavailable');
    const xml = await response.text();
    const articles = parseArticles(xml, Parser);
    memory = xml;
    try { storage?.setItem(FEED_SESSION_KEY, xml); } catch { /* Storage quotas do not break reading. */ }
    return articles;
  })();
  try { return await pending; } finally { pending = undefined; }
}
