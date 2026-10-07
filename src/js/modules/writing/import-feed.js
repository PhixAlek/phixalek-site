import { importArticleBody } from '../../../shared/writing/article-body.js';
import { normalizeArticle } from '../../../shared/writing/model.js';
import { MAX_FEED_BYTES } from '../../../shared/writing/feed-response.js';

export function parseArticles(xml, Parser = globalThis.DOMParser, view = globalThis.window) {
  if (typeof xml !== 'string' || new TextEncoder().encode(xml).byteLength > MAX_FEED_BYTES || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid feed');
  const doc = new Parser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'rss') throw new Error('Invalid feed');
  const channel = [...doc.documentElement.children].find(node => node.localName === 'channel');
  if (!channel) throw new Error('Invalid feed');
  const unique = new Map();
  for (const item of [...channel.children].filter(node => node.localName === 'item')) {
    const child = name => [...item.children].find(node => node.localName === name);
    const enclosure = child('enclosure');
    const media = [...item.children].find(node => node.namespaceURI === 'http://search.yahoo.com/mrss/' && ['content', 'thumbnail'].includes(node.localName));
    const article = normalizeArticle({ title: child('title')?.textContent, url: child('link')?.textContent?.trim(),
      published: child('pubDate')?.textContent, language: child('language')?.textContent,
      image: enclosure?.getAttribute('type')?.startsWith('image/') ? enclosure.getAttribute('url') : media?.getAttribute('url') });
    if (!article || unique.has(article.id)) continue;
    const encoded = [...item.children].find(node => node.localName === 'encoded' && node.namespaceURI === 'http://purl.org/rss/1.0/modules/content/');
    const raw = encoded?.textContent?.trim() ? encoded.textContent : child('description')?.textContent || '';
    const body = importArticleBody(raw, { view, sourceUrl: article.sourceUrl });
    const prose = body.text;
    const description = child('description')?.textContent || '';
    const excerpt = (importArticleBody(description, { view, sourceUrl: article.sourceUrl }).text || prose).slice(0, 240);
    unique.set(article.id, { ...article, html: body.html, widgets: body.widgets, excerpt,
      categories: [...new Set([...item.children].filter(node => node.localName === 'category').map(node => node.textContent.trim()).filter(value => value && value.length <= 100))],
      readingMinutes: Math.max(1, Math.ceil(prose.split(/\s+/).filter(Boolean).length / 200)),
    });
  }
  return Object.freeze([...unique.values()].sort((a, b) => Date.parse(b.published) - Date.parse(a.published)).map(article =>
    Object.freeze({ ...article, categories: Object.freeze(article.categories), widgets: Object.freeze(article.widgets.map(Object.freeze)) })));
}

