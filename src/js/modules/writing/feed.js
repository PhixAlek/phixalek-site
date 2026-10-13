import { validateSnapshot, availableArticles, mergeArticles } from '../../../shared/writing/snapshot.js';
import { readFeedText } from '../../../shared/writing/feed-response.js';

export const FEED_SESSION_KEY = 'phixalek.writing-feed.v1';
let pending;
let memory;

export async function loadArticles({ fetchFeed = fetch, storage, force = false, preferSnapshot = false, Parser = globalThis.DOMParser, view = globalThis.window } = {}) {
  if (storage === undefined) { try { storage = window.sessionStorage; } catch { /* Use in-memory cache. */ } }
  if (pending) return pending;
  if (memory && !force) return memory;
  pending = (async () => {
    const { default: preview } = await import('../../../content/writing-local.generated.json', { with: { type: 'json' } });
    if (preview.enabled && ['localhost', '127.0.0.1', '[::1]'].includes(view?.location?.hostname)) { memory = Object.freeze(preview.articles); return memory; }
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
            memory = Object.freeze(mergeArticles(savedArticles, parseArticles(cached.xml, Parser, view))); return memory;
          }
        }
      } catch { /* Invalid caches are refetched, never rendered. */ }
    }
    // Render the compiled copy immediately; only explicit refresh waits for the provider.
    if (!force && preferSnapshot && savedArticles.length) { memory = Object.freeze(savedArticles); return memory; }
    try {
      const response = await fetchFeed('/.netlify/functions/latest-writing', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (!response.ok) throw new Error('Writing unavailable');
      const xml = await readFeedText(response);
      const articles = parseArticles(xml, Parser, view);
      memory = Object.freeze(mergeArticles(savedArticles, articles));
      try { storage?.setItem(FEED_SESSION_KEY, JSON.stringify({ snapshotFetchedAt: snapshot.fetchedAt, xml })); } catch { /* Storage quotas do not break reading. */ }
      return memory;
    } catch {
      // Keep the last successfully rendered copy when an explicit refresh or the provider fails.
      memory = Object.freeze(availableArticles(memory || savedArticles));
      return memory;
    }
  })();
  try { return await pending; } finally { pending = undefined; }
}
