import { validateSnapshot, availableArticles, mergeArticles, mergeFeedArticles } from '../../../shared/writing/snapshot.js';
import { readFeedText } from '../../../shared/writing/feed-response.js';

export const FEED_SESSION_KEY = 'phixalek.writing-feed.v1';
let pending;
let memory;
let writingVisitStarted = false;
const mergeFreshFeed = (saved, incoming, tagsBySource = {}) => {
  const tags = article => { const value = tagsBySource?.[article.sourceUrl]; return Array.isArray(value) && value.length <= 50 && value.every(tag => typeof tag === 'string' && tag.trim() && tag.length <= 100 && !/[\u0000-\u001f<>]/.test(tag)) ? value : null; };
  const base = saved.map(article => tags(article) !== null ? { ...article, categories: tags(article) } : article);
  const fresh = incoming.map(article => tags(article) !== null ? { ...article, categories: [...new Set([...article.categories, ...tags(article)])] } : article);
  return mergeFeedArticles(base, fresh);
};
const immutableArticles = articles => Object.freeze(articles.map(article => Object.freeze(article)));

export async function loadArticles({ fetchFeed = fetch, storage, force = false, preferSnapshot = false, writingVisit = false, Parser = globalThis.DOMParser, view = globalThis.window } = {}) {
  if (writingVisit && !writingVisitStarted) { writingVisitStarted = true; force = true; }
  if (storage === undefined) { try { storage = window.sessionStorage; } catch { /* Use in-memory cache. */ } }
  if (pending) return pending;
  if (memory && !force) return memory;
  pending = (async () => {
    const { default: preview } = await import('../../../content/writing-local.generated.json', { with: { type: 'json' } });
    if (preview.enabled && ['localhost', '127.0.0.1', '[::1]'].includes(view?.location?.hostname)) {
      const { default: original } = await import('../../../content/writing-snapshot.json', { with: { type: 'json' } });
      memory = immutableArticles(mergeArticles(availableArticles(validateSnapshot(original).articles), preview.articles)); return memory;
    }
    // Parsing and HTML sanitization are loaded only when writing content is requested.
    const [{ parseArticles }, { default: snapshot }] = await Promise.all([
      import('./import-feed.js'), import('../../../content/writing-snapshot.json', { with: { type: 'json' } }),
    ]);
    const savedArticles = availableArticles(validateSnapshot(snapshot).articles);
    if (!force) {
      try {
        const saved = storage?.getItem(FEED_SESSION_KEY);
        if (saved) {
          const cached = JSON.parse(saved);
          if (cached.snapshotFetchedAt === snapshot.fetchedAt && typeof cached.xml === 'string') {
            memory = immutableArticles(mergeFreshFeed(savedArticles, parseArticles(cached.xml, Parser, view), cached.tagsBySource)); return memory;
          }
        }
      } catch { /* Invalid caches are refetched, never rendered. */ }
    }
    // Render the compiled copy immediately; only explicit refresh waits for the provider.
    if (!force && preferSnapshot && savedArticles.length) { memory = immutableArticles(savedArticles); return memory; }
    try {
      const response = await fetchFeed('/.netlify/functions/latest-writing?tags=1', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (!response.ok) throw new Error('Writing unavailable');
      const body = await readFeedText(response);
      const payload = response.headers.get('content-type')?.includes('application/json') ? JSON.parse(body) : { xml: body };
      const xml = payload.xml; const tagsBySource = payload.tagsBySource || {};
      const articles = parseArticles(xml, Parser, view);
      memory = immutableArticles(mergeFreshFeed(savedArticles, articles, tagsBySource));
      try { storage?.setItem(FEED_SESSION_KEY, JSON.stringify({ snapshotFetchedAt: snapshot.fetchedAt, xml, tagsBySource })); } catch { /* Storage quotas do not break reading. */ }
      return memory;
    } catch {
      // Keep the last successfully rendered copy when an explicit refresh or the provider fails.
      memory = immutableArticles(availableArticles(memory || savedArticles));
      return memory;
    }
  })();
  try { return await pending; } finally { pending = undefined; }
}
