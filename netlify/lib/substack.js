import { readFeedText } from '../../src/shared/writing/feed-response.js';
import { SUBSTACK_FEED } from '../../src/shared/writing/config.js';
export { SUBSTACK_FEED };

// Fixed public source: callers cannot turn this function into an arbitrary proxy.
export function createSubstackHandler({ fetchFeed = fetch } = {}) {
  return async event => {
    if (event.httpMethod !== 'GET') return {
      statusCode: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' }, body: '',
    };
    try {
      const feedURL = new URL(SUBSTACK_FEED);
      feedURL.searchParams.set('_refresh', String(Date.now()));
      const result = await fetchFeed(feedURL.href, {
        signal: AbortSignal.timeout(6000), redirect: 'error',
        headers: { Accept: 'application/rss+xml, application/xml, text/xml', 'Cache-Control': 'no-cache' },
        cache: 'no-store',
      });
      const xml = await readFeedText(result);
      if (!/<rss\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid feed');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
        body: xml,
      };
    } catch {
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'writing_unavailable' }),
      };
    }
  };
}
