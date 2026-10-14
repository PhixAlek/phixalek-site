import { safeImageURL } from '../../src/shared/writing/model.js';

function publicData(html) {
  const match = html.match(/window\._preloads\s*=\s*JSON\.parse\(\s*("(?:\\.|[^"\\])*")\s*\)/);
  if (!match) return null;
  try { return JSON.parse(JSON.parse(match[1])); } catch { return null; }
}

/** A reply must belong to the same post and the requested root thread. */
export function readPublicReply(html, root, sourceUrl) {
  const comment = publicData(html)?.feedData?.feedItem?.comment;
  const path = String(comment?.ancestor_path || '').split('.');
  let url; try { url = new URL(sourceUrl); } catch { return null; }
  if (url.origin !== 'https://substack.com' || url.username || url.password || !url.pathname.endsWith(`/note/c-${comment?.id}`)
    || comment?.post_id !== root.postId || !path.includes(String(root.id)) || comment.deleted || comment.suppressed
    || comment.status != null && comment.status !== 'published'
    || !Number.isSafeInteger(comment.id) || typeof comment.body !== 'string' || comment.body.length > 20000
    || typeof comment.name !== 'string' || !Number.isFinite(Date.parse(comment.date))) return null;
  return { id: comment.id, parentId: Number(path.at(-1)), sourceUrl, author: comment.name.slice(0, 200), body: comment.body,
    date: comment.date, avatar: safeImageURL(comment.photo_url),
    likes: Number.isSafeInteger(comment.reaction_count) && comment.reaction_count >= 0 ? comment.reaction_count : null,
    isAuthor: root.isAuthor && root.authorId === comment.user_id, replies: '' };
}

/** Read public page data as JSON, never execute provider scripts. */
export function readPublicEngagement(html, sourceUrl, fetchedAt = new Date().toISOString()) {
  const match = html.match(/window\._preloads\s*=\s*JSON\.parse\(\s*("(?:\\.|[^"\\])*")\s*\)/);
  if (!match) return null;
  try {
    const data = JSON.parse(JSON.parse(match[1])), post = data.post;
    if (post?.canonical_url !== sourceUrl || !Number.isSafeInteger(post.reaction_count) || post.reaction_count < 0
      || !Number.isSafeInteger(post.comment_count) || post.comment_count < 0) return null;
    const authors = new Set((post.publishedBylines || []).map(author => author.id));
    const preview = (Array.isArray(data.comments) ? data.comments : []).slice(0, 20)
      .filter(comment => !comment.deleted && !comment.suppressed && comment.status === 'published'
        && Number.isSafeInteger(comment.id) && typeof comment.body === 'string' && comment.body.length <= 20000
        && typeof comment.name === 'string' && Number.isFinite(Date.parse(comment.date)))
      .map(comment => ({ id: comment.id, postId: comment.post_id, authorId: comment.user_id,
        author: comment.name.slice(0, 200), body: comment.body, date: comment.date,
        avatar: safeImageURL(comment.photo_url),
        likes: Number.isSafeInteger(comment.reaction_count) && comment.reaction_count >= 0 ? comment.reaction_count : null,
        isAuthor: authors.has(comment.user_id),
        replies: typeof comment.childrenSummary === 'string' ? comment.childrenSummary.slice(0, 300) : '' }));
    return { likes: post.reaction_count, comments: post.comment_count, fetchedAt, sourceUrl, ...(preview.length ? { preview } : {}) };
  } catch { return null; }
}

export async function refreshEngagement(article, fetchPage = fetch) {
  try {
    const response = await fetchPage(article.sourceUrl, { signal: AbortSignal.timeout(8000), redirect: 'error', headers: { Accept: 'text/html' } });
    if (!response.ok) return article;
    const html = await response.text();
    if (html.length > 2_000_000) return article;
    const engagement = readPublicEngagement(html, article.sourceUrl);
    for (const root of engagement?.preview || []) {
      const previous = article.engagement?.preview?.find(comment => comment.id === root.id)?.repliesPreview;
      if (!previous?.length) continue;
      root.repliesPreview = [];
      for (const reply of previous.slice(0, 20)) {
        let updated = reply;
        try {
          const response = await fetchPage(reply.sourceUrl, { signal: AbortSignal.timeout(8000), redirect: 'error', headers: { Accept: 'text/html' } });
          if (response.ok) { const body = await response.text(); if (body.length <= 2_000_000) updated = readPublicReply(body, root, reply.sourceUrl) || reply; }
        } catch { /* Unavailable reply pages keep their verified copy. */ }
        root.repliesPreview.push(updated);
      }
    }
    return engagement ? { ...article, engagement } : article;
  } catch { return article; }
}
