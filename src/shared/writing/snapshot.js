import { normalizeArticle } from './model.js';
import { writingConfig, PUBLICATION } from './config.js';

export const SNAPSHOT_VERSION = 1;
const fingerprint = article => JSON.stringify([article.title, article.published, article.image, article.language,
  article.html, article.excerpt, article.categories, article.widgets, article.readingMinutes]);

export function validateSnapshot(snapshot) {
  if (snapshot?.version !== SNAPSHOT_VERSION || snapshot.source !== PUBLICATION || !Array.isArray(snapshot.articles)
    || !Number.isFinite(Date.parse(snapshot.fetchedAt))) throw new Error('Invalid Writing snapshot');
  const ids = new Set();
  for (const item of snapshot.articles) {
    const article = normalizeArticle({ ...item, url: item.sourceUrl });
    if (!article || article.id !== item.id || article.slug !== item.slug || ids.has(item.id)
      || typeof item.html !== 'string' || typeof item.excerpt !== 'string' || !Array.isArray(item.categories)
      || !item.categories.every(tag => typeof tag === 'string') || !Array.isArray(item.widgets)
      || !Number.isInteger(item.readingMinutes) || item.readingMinutes < 1
      || !Number.isFinite(Date.parse(item.updatedAt))) throw new Error('Invalid Writing article');
    ids.add(item.id);
  }
  return snapshot;
}

export function availableArticles(articles, removed = writingConfig.removedSlugs || []) {
  return articles.filter(article => !removed.includes(article.slug));
}

/** RSS is a window, not a deletion log. Explicit tombstones always win. */
export function mergeArticles(previous, incoming, removed = writingConfig.removedSlugs || []) {
  const records = new Map(previous.map(article => [article.id, article]));
  for (const article of incoming) records.set(article.id, article);
  return availableArticles([...records.values()], removed)
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published) || a.id.localeCompare(b.id));
}

export function updateSnapshot(previous, incoming, { now = new Date().toISOString(), removed = writingConfig.removedSlugs || [] } = {}) {
  if (previous) validateSnapshot(previous);
  const old = new Map((previous?.articles || []).map(article => [article.id, article]));
  const updated = incoming.map(article => ({ ...article,
    updatedAt: old.has(article.id) && fingerprint(old.get(article.id)) === fingerprint(article) ? old.get(article.id).updatedAt : now,
  }));
  return validateSnapshot({ version: SNAPSHOT_VERSION, source: PUBLICATION, fetchedAt: now,
    articles: mergeArticles(previous?.articles || [], updated, removed) });
}
