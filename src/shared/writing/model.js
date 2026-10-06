import { PUBLICATION, writingConfig } from './config.js';

export function safeImageURL(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function articleLanguage(value) {
  if (typeof value !== 'string') return null;
  const language = value.toLowerCase().split('-')[0];
  return ['en', 'es'].includes(language) ? language : null;
}

/** Normalize public metadata only. HTML must pass a separate sanitizer before rendering. */
export function normalizeArticle(source) {
  if (!source || typeof source !== 'object') return null;
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  const published = typeof source.published === 'string' ? Date.parse(source.published) : NaN;
  if (!title || title.length > 500 || !Number.isFinite(published)) return null;
  let url;
  try { url = new URL(source.url); } catch { return null; }
  if (url.origin !== PUBLICATION || url.username || url.password) return null;
  const match = url.pathname.match(/^\/p\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/?$/);
  if (!match) return null;
  const slug = match[1];
  const sourceUrl = `${PUBLICATION}/p/${slug}`;
  // The source URL survives title edits and repeated imports. Never use array indexes.
  return {
    id: sourceUrl,
    slug,
    sourceUrl,
    title,
    published: new Date(published).toISOString(),
    image: safeImageURL(source.image),
    // Publication/browser locale is not evidence of an individual article's language.
    language: articleLanguage(writingConfig.articleOverrides[sourceUrl]?.language ?? source.language),
  };
}

export function orderedArticles(items) {
  const byId = new Map();
  for (const source of Array.isArray(items) ? items : []) {
    const article = normalizeArticle(source);
    if (article && !byId.has(article.id)) byId.set(article.id, article);
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.published) - Date.parse(a.published) || a.id.localeCompare(b.id));
}
