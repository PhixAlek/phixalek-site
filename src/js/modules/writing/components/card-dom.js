import { isArticleType, orderedTags } from '../../../../shared/writing/taxonomy.js';
import { createThumbnail } from './thumbnail.js';
import { ArticleActions } from './article-actions.js';
import { articlePath } from '../../../../shared/writing/routes.js';


export function createArticleDate(article, { doc = document, text, getLocale }) {
  const date = doc.createElement('time'); date.dateTime = article.published;
  text(date, () => new Intl.DateTimeFormat(getLocale() === 'es' ? 'es-MX' : 'en-US', {
    dateStyle: 'medium', timeZone: 'UTC',
  }).format(new Date(article.published)));
  return date;
}
export function createArticleImage(article, fallback, doc = document) {
  const image = doc.createElement('img'); image.alt = article.cover?.alt || ''; image.setAttribute('loading', 'lazy'); image.setAttribute('decoding', 'async');
  image.src = article.image || fallback.src; image.width = article.cover?.width || 1200; image.height = article.cover?.height || 630;
  image.onerror = () => { image.onerror = null; image.src = fallback.src; };
  return image;
}
export function createArticleCard(article, fallback, { doc = document, ui, text, bind, getLocale, featured = false, related = false }) {
  const card = doc.createElement('article'); card.dataset.articleId = article.id; card.className = `editorial-card${featured ? ' editorial-featured' : ''}`;
  const link = doc.createElement('div'); link.className = 'editorial-card-link';
  const target = doc.createElement('a'); target.href = articlePath(article.slug); target.className = 'editorial-card-target';
  target.setAttribute('aria-label', article.title);
  const copy = doc.createElement('div'); copy.className = 'editorial-card-copy';
  const meta = doc.createElement('div'); meta.className = 'editorial-meta';
  const minutes = doc.createElement('span'); text(minutes, () => `${article.readingMinutes} ${ui.writingPage.minutes}`);
  meta.append(createArticleDate(article, { doc, text, getLocale }), minutes);
  const heading = doc.createElement(related ? 'h3' : 'h2'); heading.textContent = article.title;
  const excerpt = doc.createElement('p'); excerpt.textContent = article.excerpt;
  const categories = doc.createElement('div'); categories.className = 'editorial-tags';
  orderedTags(article.categories).slice(0, 4).forEach(category => { const tag = doc.createElement(related ? 'span' : 'button'); if (!related) { tag.type = 'button'; tag.dataset.articleTag = category; } tag.textContent = category; if (isArticleType(category)) tag.dataset.articleType = ''; categories.append(tag); });
  const action = doc.createElement('span'); action.className = 'editorial-read';
  text(action, () => `${ui.writingPage.read} →`);
  copy.append(meta, heading, excerpt, categories, action);
  // Cover first on mobile; the shared grid places it beside the text on desktop.
  const image = createArticleImage(article, fallback, doc);
  if (featured) { image.setAttribute('loading', 'eager'); image.setAttribute('fetchpriority', 'high'); }
  link.append(target, createThumbnail(article, image, { doc, ui, text, getLocale, featured }), copy); card.append(link);
  if (!featured && !related) card.append(ArticleActions(article, { doc, ui, bind }));
  return card;
}
