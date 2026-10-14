import { normalizeArticle, withArticleCategories, safeImageURL } from './model.js';
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
    if (item.engagement != null && (item.engagement.sourceUrl !== item.sourceUrl
      || !Number.isSafeInteger(item.engagement.likes) || item.engagement.likes < 0
      || !Number.isSafeInteger(item.engagement.comments) || item.engagement.comments < 0
      || !Number.isFinite(Date.parse(item.engagement.fetchedAt)))) throw new Error('Invalid Writing engagement');
    const preview = item.engagement?.preview;
    if (preview != null && (!Array.isArray(preview) || preview.length > 20 || !preview.every(comment =>
      Number.isSafeInteger(comment.id) && typeof comment.author === 'string' && comment.author.length <= 200
      && typeof comment.body === 'string' && comment.body.length <= 20000 && Number.isFinite(Date.parse(comment.date))
      && (comment.avatar === null || safeImageURL(comment.avatar) === comment.avatar)
      && (comment.likes === null || Number.isSafeInteger(comment.likes) && comment.likes >= 0)
      && typeof comment.isAuthor === 'boolean' && typeof comment.replies === 'string' && comment.replies.length <= 300))) {
      throw new Error('Invalid Writing comments');
    }
    for (const root of preview || []) {
      if (root.repliesPreview == null) continue;
      const rows = root.repliesPreview;
      if (!Array.isArray(rows) || rows.length > 20 || !Number.isSafeInteger(root.postId) || !Number.isSafeInteger(root.authorId)) throw new Error('Invalid Writing thread');
      const ids = new Set([root.id, ...rows.map(reply => reply.id)]);
      if (ids.size !== rows.length + 1 || !rows.every(reply =>
        Number.isSafeInteger(reply.id) && ids.has(reply.parentId) && reply.parentId !== reply.id
        && /^https:\/\/substack\.com\/(?:profile\/\d+(?:-[\w-]+)?|@[\w-]+)\/note\/c-\d+$/.test(reply.sourceUrl)
        && reply.sourceUrl.endsWith(`/c-${reply.id}`) && typeof reply.author === 'string' && reply.author.length <= 200
        && typeof reply.body === 'string' && reply.body.length <= 20000 && Number.isFinite(Date.parse(reply.date))
        && (reply.avatar === null || safeImageURL(reply.avatar) === reply.avatar)
        && (reply.likes === null || Number.isSafeInteger(reply.likes) && reply.likes >= 0)
        && typeof reply.isAuthor === 'boolean' && typeof reply.replies === 'string')) throw new Error('Invalid Writing reply');
    }
    ids.add(item.id);
  }
  return snapshot;
}

export function availableArticles(articles, removed = writingConfig.removedSlugs || []) {
  return articles.filter(article => !removed.includes(article.slug)).map(withArticleCategories);
}

/** RSS is a window, not a deletion log. Explicit tombstones always win. */
export function mergeArticles(previous, incoming, removed = writingConfig.removedSlugs || []) {
  const records = new Map(previous.map(article => [article.id, article]));
  for (const article of incoming) {
    const engagement = article.engagement || records.get(article.id)?.engagement;
    records.set(article.id, engagement ? { ...article, engagement } : article);
  }
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

/** Browser RSS refreshes cannot erase tags compiled from the public article page. */
export function mergeFeedArticles(previous, incoming) {
  const saved = new Map(previous.map(article => [article.id, article]));
  return mergeArticles(previous, incoming.map(article => ({ ...article,
    language: article.language || saved.get(article.id)?.language || null,
    categories: [...new Set([...(saved.get(article.id)?.categories || []), ...article.categories])],
  })));
}
