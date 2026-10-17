import { safeImageURL } from '../../src/shared/writing/model.js';
import { commentURL } from '../../src/shared/writing/comment-url.js';
import { readPublicData as publicData } from './writing-public-data.mjs';

/** A reply must belong to the same post and the requested root thread. */
export function readPublicReply(html, root, sourceUrl) {
  return publicReply(publicData(html)?.feedData?.feedItem?.comment, root, sourceUrl);
}

function publicReply(comment, root, sourceUrl) {
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
  try {
    const data = publicData(html), post = data?.post;
    if (post?.canonical_url !== sourceUrl || !Number.isSafeInteger(post.reaction_count) || post.reaction_count < 0
      || !Number.isSafeInteger(post.comment_count) || post.comment_count < 0) return null;
    const authors = new Set((post.publishedBylines || []).map(author => author.id));
    const preview = (Array.isArray(data.comments) ? data.comments : []).slice(0, 20)
      .filter(comment => !comment.deleted && !comment.suppressed && comment.status === 'published'
        && Number.isSafeInteger(comment.id) && typeof comment.body === 'string' && comment.body.length <= 20000
        && typeof comment.name === 'string' && Number.isFinite(Date.parse(comment.date)))
      .map(comment => ({ id: comment.id, postId: comment.post_id, authorId: comment.user_id,
        sourceUrl: commentURL({ id: comment.id, authorId: comment.user_id }),
        author: comment.name.slice(0, 200), body: comment.body, date: comment.date,
        avatar: safeImageURL(comment.photo_url),
        likes: Number.isSafeInteger(comment.reaction_count) && comment.reaction_count >= 0 ? comment.reaction_count : null,
        isAuthor: authors.has(comment.user_id),
        replies: typeof comment.childrenSummary === 'string' ? comment.childrenSummary.slice(0, 300) : '' }));
    for (const root of preview) {
      const original = data.comments.find(comment => comment.id === root.id);
      const rows = [], seen = new Set([root.id]);
      const collect = (children, parentId) => {
        for (const child of Array.isArray(children) ? children.slice(0, 20) : []) {
          if (rows.length >= 20 || seen.has(child?.id) || child?.post_id !== root.postId) continue;
          const row = publicReply(child, root, commentURL({ id: child.id, authorId: child.user_id }));
          if (!row || row.parentId !== parentId) continue;
          seen.add(child.id); rows.push(row); collect(child.children, child.id);
        }
      };
      collect(original.children, root.id);
      if (rows.length) root.repliesPreview = rows;
    }
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
      const available = new Map((previous || []).map(reply => [reply.id, reply]));
      for (const reply of root.repliesPreview || []) available.set(reply.id, reply);
      if (!available.size) continue;
      root.repliesPreview = [];
      for (const reply of [...available.values()].slice(0, 20)) {
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
