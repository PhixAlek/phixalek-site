import { articlePath } from '../../../../shared/writing/routes.js';
import { ui, text, locale } from '../../../../content/index.js';
import { ArticleLanguage } from './article-language.js';

export function articleDate(article) {
  const date = document.createElement('time'); date.dateTime = article.published;
  text(date, () => new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    dateStyle: 'medium', timeZone: 'UTC',
  }).format(new Date(article.published)));
  return date;
}
export function articleImage(article, fallback) {
  const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
  image.src = article.image || fallback.src; image.width = 1200; image.height = 630;
  image.onerror = () => { image.onerror = null; image.src = fallback.src; };
  return image;
}
export function ArticleCard(article, fallback, featured = false) {
  const card = document.createElement('article'); card.className = `editorial-card${featured ? ' editorial-featured' : ''}`;
  const link = document.createElement('a'); link.href = articlePath(article.slug); link.className = 'editorial-card-link';
  const copy = document.createElement('div'); copy.className = 'editorial-card-copy';
  const meta = document.createElement('div'); meta.className = 'editorial-meta';
  const minutes = document.createElement('span'); text(minutes, () => `${article.readingMinutes} ${ui.writingPage.minutes}`);
  const language = ArticleLanguage(article.language);
  meta.append(articleDate(article), minutes); if (language) meta.append(language);
  const heading = document.createElement('h2'); heading.textContent = article.title;
  const excerpt = document.createElement('p'); excerpt.textContent = article.excerpt;
  const categories = document.createElement('div'); categories.className = 'editorial-tags';
  article.categories.forEach(category => { const tag = document.createElement('span'); tag.textContent = category; categories.append(tag); });
  const action = document.createElement('span'); action.className = 'editorial-read';
  text(action, () => `${ui.writingPage.read} →`);
  copy.append(meta, heading, excerpt, categories, action);
  link.append(articleImage(article, fallback), copy); card.append(link);
  return card;
}
