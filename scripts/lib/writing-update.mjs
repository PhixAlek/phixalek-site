import { enrichArticleTags } from './writing-tags.mjs';
import { JSDOM } from 'jsdom';
import { parseArticles } from '../../src/js/modules/writing/import-feed.js';
import { readFeedText } from '../../src/shared/writing/feed-response.js';
import { SUBSTACK_FEED } from '../../src/shared/writing/config.js';
import { updateSnapshot, validateSnapshot, availableArticles } from '../../src/shared/writing/snapshot.js';

export async function refreshSnapshot(previous, { fetchFeed = fetch, fetchPage = fetchFeed, now } = {}) {
  try {
    const url = new URL(SUBSTACK_FEED);
    url.searchParams.set('_refresh', String(Date.now()));
    const response = await fetchFeed(url.href, {
      signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/rss+xml', 'Cache-Control': 'no-cache' },
    });
    const xml = await readFeedText(response);
    const dom = new JSDOM('');
    let articles;
    try {
      articles = parseArticles(xml, dom.window.DOMParser, dom.window);
      // A nonempty feed with rejected items must not be mistaken for an empty publication.
      if (/<item\b/i.test(xml) && !articles.length) throw new Error('Invalid feed items');
    } finally { dom.window.close(); }
    const enriched = [];
    for (const article of articles) enriched.push(await enrichArticleTags(article, previous?.articles.find(saved => saved.id === article.id), fetchPage));
    return { snapshot: updateSnapshot(previous, enriched, { now }), stale: false };
  } catch (error) {
    // A clean checkout can always use the reviewed, versioned copy. Never replace it on failure.
    if (!previous) throw error;
    validateSnapshot(previous);
    return { snapshot: { ...previous, articles: availableArticles(previous.articles) }, stale: true };
  }
}
