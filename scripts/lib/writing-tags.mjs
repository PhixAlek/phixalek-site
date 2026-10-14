import { PUBLICATION } from '../../src/shared/writing/config.js';

/** Only metadata tied to the exact canonical post can enrich the feed. */
function readPublicPost(html, sourceUrl) {
  if (typeof html !== 'string' || html.length > 2_000_000) return null;
  let url; try { url = new URL(sourceUrl); } catch { return null; }
  if (url.origin !== PUBLICATION || url.username || url.password || !url.pathname.startsWith('/p/')) return null;
  const match = html.match(/window\._preloads\s*=\s*JSON\.parse\(\s*("(?:\\.|[^"\\])*")\s*\)/);
  try {
    const post = match && JSON.parse(JSON.parse(match[1]))?.post;
    return post?.canonical_url === sourceUrl ? post : null;
  } catch { return null; }
}

export function readPublicLanguage(html, sourceUrl) {
  const language = readPublicPost(html, sourceUrl)?.language;
  if (typeof language !== 'string') return null;
  const code = language.toLowerCase().split('-')[0];
  return ['en', 'es'].includes(code) ? code : null;
}

/** The public post supplies tags even when RSS omits categories. */
export function readPublicTags(html, sourceUrl) {
  const post = readPublicPost(html, sourceUrl);
  if (!Array.isArray(post?.postTags) || post.postTags.some(tag => !tag || typeof tag !== 'object')) return null;
  const tags = post.postTags.filter(tag => tag.hidden !== true).map(tag => tag.name);
  if (tags.length > 50 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 100 || /[\u0000-\u001f<>]/.test(tag))) return null;
  return [...new Set(tags.map(tag => tag.trim()))];
}

export async function enrichArticleTags(article, previous, fetchPage = fetch) {
  let tags = null, language = null;
  try {
    const response = await fetchPage(article.sourceUrl, { signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store', headers: { Accept: 'text/html' } });
    if (response.ok) { const html = await response.text(); tags = readPublicTags(html, article.sourceUrl); language = readPublicLanguage(html, article.sourceUrl); }
  } catch { /* Keep the last public tags on temporary page failures. */ }
  const categories = tags === null ? (article.categories.length ? article.categories : previous?.categories || []) : [...new Set([...article.categories, ...tags])];
  return { ...article, categories, language: language || article.language || previous?.language || null };
}
