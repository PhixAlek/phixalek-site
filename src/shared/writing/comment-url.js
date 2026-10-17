/** Resolve a public comment from provider metadata, including older cached previews. */
export function commentURL(comment) {
  if (!Number.isSafeInteger(comment?.id) || comment.id <= 0) return null;
  if (comment.sourceUrl) {
    try {
      const url = new URL(comment.sourceUrl);
      if (url.origin === 'https://substack.com' && !url.username && !url.password
        && /^\/(?:(?:profile\/\d+(?:-[\w-]+)?|@[\w-]+)\/)?note\/c-\d+$/.test(url.pathname)
        && url.pathname.endsWith(`/c-${comment.id}`)) {
        return `https://substack.com/note/c-${comment.id}`;
      }
    } catch { /* Use verified numeric provider IDs when a URL is unavailable. */ }
  }
  if (!Number.isSafeInteger(comment.authorId) || comment.authorId <= 0) return null;
  return `https://substack.com/note/c-${comment.id}`;
}
