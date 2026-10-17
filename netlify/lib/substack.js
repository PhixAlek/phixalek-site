import { JSON_HEADERS } from './security.js';
import { readPublicTags, readPublicLanguage } from '../../scripts/lib/writing-tags.mjs';
import { readFeedText } from '../../src/shared/writing/feed-response.js';
import { PUBLICATION, SUBSTACK_FEED } from '../../src/shared/writing/config.js';
export { SUBSTACK_FEED };

// Fixed public source: callers cannot turn this function into an arbitrary proxy.
export function createSubstackHandler({ fetchFeed = fetch, fetchPage = fetchFeed } = {}) {
  return async event => {
    if (event.httpMethod !== 'GET') return {
      statusCode: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' }, body: '',
    };
    try {
      const deadline = Date.now() + 7000;
      const feedURL = new URL(SUBSTACK_FEED);
      feedURL.searchParams.set('_refresh', String(Date.now()));
      const result = await fetchFeed(feedURL.href, {
        signal: AbortSignal.timeout(6000), redirect: 'error',
        headers: { Accept: 'application/rss+xml, application/xml, text/xml', 'Cache-Control': 'no-cache' },
        cache: 'no-store',
      });
      const xml = await readFeedText(result);
      if (!/<rss\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid feed');
      const includeTags = event.queryStringParameters?.tags === '1';
      const tagsBySource = {}, languagesBySource = {};
      if (includeTags) {
        const urls = new Set();
        for (const match of xml.matchAll(/<link>\s*([^<]+?)\s*<\/link>/g)) {
          try { const url = new URL(match[1].trim());
            if (url.origin === PUBLICATION && !url.username && !url.password && /^\/p\/[a-zA-Z0-9_-]+$/.test(url.pathname)) urls.add(url.origin + url.pathname);
          } catch { /* Reject malformed or foreign links. */ }
        }
        await Promise.all([...urls].slice(0, 20).map(async source => {
          try {
            const response = await fetchPage(source, { signal: AbortSignal.timeout(Math.max(1, Math.min(3000, deadline - Date.now()))), redirect: 'error', cache: 'no-store', headers: { Accept: 'text/html' } });
            if (!response.ok) return;
            const html = await readFeedText(response);
            const tags = readPublicTags(html, source);
            const language = readPublicLanguage(html, source);
            if (language) languagesBySource[source] = language;
            if (tags !== null) tagsBySource[source] = tags;
          } catch { /* RSS content remains available if tag metadata cannot load. */ }
        }));
      }
      return {
        statusCode: 200,
        headers: {
          'Content-Type': includeTags ? 'application/json; charset=utf-8' : 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
        body: includeTags ? JSON.stringify({ xml, tagsBySource, languagesBySource }) : xml,
      };
    } catch {
      return {
        statusCode: 503,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'writing_unavailable' }),
      };
    }
  };
}
