import { importArticleBody } from '../../../../shared/writing/article-body.js';
import { createArticleImage } from './card-dom.js';

/** Reuse the thumbnail glass, without repeating its caption or Featured badge. */
export function createReaderCover(article, fallback, { doc = document, featured = false } = {}) {
  const caption = article.cover?.captionHtml ? importArticleBody(article.cover.captionHtml, { view: doc.defaultView, sourceUrl: article.sourceUrl }).html : '';
  const frame = doc.createElement(caption ? 'div' : 'figure');
  frame.className = `editorial-thumbnail editorial-reader-cover${featured ? '' : ' is-regular-cover'}`;
  const image = createArticleImage(article, fallback, doc); image.setAttribute('loading', 'eager'); image.setAttribute('fetchpriority', 'high');
  frame.append(image);
  if (!caption) return frame;
  const figure = doc.createElement('figure'); figure.className = 'editorial-reader-cover-group';
  const label = doc.createElement('figcaption'); label.innerHTML = caption; figure.append(frame, label); return figure;
}
