import { articleLanguage } from '../../../../shared/writing/model.js';
import { createTitleLines } from './title-lines.js';

/** Decorative preview text; the card's original heading remains the accessible title. */
export function createThumbnail(article, image, { doc, ui, text, getLocale, featured = false }) {
  const frame = doc.createElement('figure'); frame.className = 'editorial-thumbnail';
  const caption = doc.createElement('figcaption'); caption.className = 'editorial-thumbnail-caption'; caption.setAttribute('aria-hidden', 'true');
  const label = doc.createElement('span'); label.className = 'editorial-thumbnail-meta';
  const language = articleLanguage(article.language); label.hidden = featured && !language;
  if (featured) text(label, () => language?.toUpperCase() || '');
  else {
    const date = doc.createElement('time'); date.dateTime = article.published;
    text(date, () => new Intl.DateTimeFormat(getLocale() === 'es' ? 'es-MX' : 'en-US', {
      dateStyle: 'medium', timeZone: 'UTC',
    }).format(new Date(article.published)));
    const reading = doc.createElement('span'); reading.className = 'editorial-thumbnail-reading';
    text(reading, () => ` · ${article.readingMinutes} ${ui.writingPage.minutes}`);
    label.append(date, reading);
  }
  const title = doc.createElement('span'); title.className = 'editorial-thumbnail-title';
  title.append(...createTitleLines(article.title, doc));
  caption.append(label);
  if (featured) {
    const badge = doc.createElement('span'); badge.className = 'editorial-featured-label';
    text(badge, () => ui.writingPage.featured); caption.append(badge);
  }
  if (!featured) {
    const languageLabel = doc.createElement('span'); languageLabel.className = 'editorial-thumbnail-language';
    languageLabel.textContent = language?.toUpperCase() || ''; languageLabel.hidden = !language;
    caption.append(title, languageLabel);
  }
  frame.append(image, caption); return frame;
}
