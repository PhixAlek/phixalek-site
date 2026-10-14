import { createArticleImage } from './card-dom.js';

/** Reuse the thumbnail glass, without repeating its caption or Featured badge. */
export function createReaderCover(article, fallback, { doc = document, featured = false } = {}) {
  const frame = doc.createElement('figure');
  frame.className = `editorial-thumbnail editorial-reader-cover${featured ? '' : ' is-regular-cover'}`;
  const image = createArticleImage(article, fallback, doc); image.loading = 'eager'; image.fetchPriority = 'high';
  frame.append(image); return frame;
}
