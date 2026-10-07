import { readFeedText } from '../../../shared/writing/feed-response.js';

export const FEED_SESSION_KEY = 'phixalek.writing-feed.v1';
let pending;
let memory;

export async function loadArticles({ fetchFeed = fetch, storage, force = false, Parser = globalThis.DOMParser, view = globalThis.window } = {}) {
  if (storage === undefined) { try { storage = window.sessionStorage; } catch { /* Use in-memory cache. */ } }
  if (pending) return pending;
  if (memory && !force) return memory;
  pending = (async () => {
    // Parsing and HTML sanitization are loaded only when writing content is requested.
    const { parseArticles } = await import('./import-feed.js');
    if (!force) {
      try {
        const saved = storage?.getItem(FEED_SESSION_KEY);
        if (saved) { memory = parseArticles(saved, Parser, view); return memory; }
      } catch { /* Invalid caches are refetched, never rendered. */ }
    }
    const response = await fetchFeed('/.netlify/functions/latest-writing', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!response.ok) throw new Error('Writing unavailable');
    const xml = await readFeedText(response);
    const articles = parseArticles(xml, Parser, view);
    memory = articles;
    try { storage?.setItem(FEED_SESSION_KEY, xml); } catch { /* Storage quotas do not break reading. */ }
    return articles;
  })();
  try { return await pending; } finally { pending = undefined; }
}
