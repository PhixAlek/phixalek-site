import { PUBLICATION } from '../../src/shared/writing/config.js';

/** The publication exposes postTags in public page JSON even when RSS omits categories. */
export function readPublicTags(html, sourceUrl) {
  if (typeof html !== 'string' || html.length > 2_000_000) return null;
  let url; try { url = new URL(sourceUrl); } catch { return null; }
  if (url.origin !== PUBLICATION || url.username || url.password || !url.pathname.startsWith('/p/')) return null;
  const match = html.match(/window\._preloads\s*=\s*JSON\.parse\(\s*("(?:\\.|[^"\\])*")\s*\)/);
  try {
    const post = match && JSON.parse(JSON.parse(match[1]))?.post;
    if (post?.canonical_url !== sourceUrl || !Array.isArray(post.postTags)) return null;
    const tags = post.postTags.filter(tag => tag.hidden !== true).map(tag => tag.name);
    if (tags.length > 50 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 100 || /[\u0000-\u001f<>]/.test(tag))) return null;
    return [...new Set(tags.map(tag => tag.trim()))];
  } catch { return null; }
}

export async function enrichArticleTags(article, previous, fetchPage = fetch) {
  let tags = null;
  try {
    const response = await fetchPage(article.sourceUrl, { signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store', headers: { Accept: 'text/html' } });
    if (response.ok) tags = readPublicTags(await response.text(), article.sourceUrl);
  } catch { /* Keep the last public tags on temporary page failures. */ }
  const categories = tags === null ? (article.categories.length ? article.categories : previous?.categories || []) : [...new Set([...article.categories, ...tags])];
  return { ...article, categories };
}
