import { createArticleCard } from './card-dom.js';
import { motionLetters } from '../../common/text-motion.js';
import { writingConfig } from '../../../../shared/writing/config.js';

const words = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .match(/[a-z0-9]+/g)?.filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'local', 'demo', 'post'].includes(word)) || [];

export function relatedArticles(articles, topic = '') {
  const terms = new Set(words(topic));
  return articles.map((article, index) => {
    const content = new Set(words(`${article.slug} ${article.title} ${(article.categories || []).join(' ')}`));
    return { article, index, score: [...terms].filter(term => content.has(term)).length };
  }).sort((a, b) => b.score - a.score || Date.parse(b.article.published) - Date.parse(a.article.published) || a.index - b.index)
    .slice(0, 3).map(item => item.article);
}

/** Recovery UI is shared by missing articles, empty archives and failed requests. */
export function createWritingError({ doc = document, ui, text, getLocale = () => doc.documentElement.lang || 'en', articles = [], topic = '', retry, fallback = { src: '/media/mountains.svg' } }) {
  const section = doc.createElement('section'); section.className = 'editorial-error';
  const lead = doc.createElement('div'); lead.className = 'editorial-error-lead';
  const image = doc.createElement('img'); image.src = fallback.src; image.alt = ''; image.width = 1200; image.height = 400;
  const heading = doc.createElement('h1'); text(heading, () => ui.writingPage.errorHeading);
  const explanation = doc.createElement('p'); text(explanation, () => ui.writingPage.errorDescription);
  const controls = doc.createElement('div'); controls.className = 'editorial-error-controls';
  if (retry) {
    const button = doc.createElement('button'); button.type = 'button'; button.className = 'btn';
    text(button, () => ui.writingPage.retry); button.addEventListener('click', retry); controls.append(button);
  }
  const archive = doc.createElement('a'); archive.href = writingConfig.routes.index; archive.className = 'editorial-error-back';
  const backArrow = doc.createElement('span'); backArrow.textContent = '←'; backArrow.setAttribute('aria-hidden', 'true');
  const backLabel = doc.createElement('span'); text(backLabel, () => ui.writingPage.backToWriting); archive.append(backArrow, backLabel);
  const provider = doc.createElement('a'); provider.href = writingConfig.source.origin; provider.className = 'editorial-error-provider'; provider.target = '_blank'; provider.rel = 'noopener noreferrer';
  text(provider, () => ui.writingPage.postsOnSubstack);
  const links = doc.createElement('div'); links.className = 'editorial-error-links'; links.append(archive, provider); controls.append(links);
  lead.append(image, heading, explanation, controls); section.append(lead);
  const related = relatedArticles(articles, topic);
  if (related.length) {
    const suggestions = doc.createElement('section'); suggestions.className = 'editorial-error-related';
    const title = doc.createElement('h2'); title.id = 'writing-related-title';
    const hasMatch = related.some(article => words(`${article.slug} ${article.title} ${(article.categories || []).join(' ')}`).some(word => words(topic).includes(word)));
    text(title, () => hasMatch ? ui.writingPage.relatedPosts : ui.writingPage.keepReading);
    const cards = doc.createElement('div'); cards.className = 'editorial-list is-grid editorial-error-cards';
    cards.tabIndex = 0; cards.setAttribute('role', 'region'); cards.setAttribute('aria-labelledby', title.id);
    related.forEach(article => {
      const card = createArticleCard(article, fallback, { doc, ui, text, getLocale, related: true });
      const wave = () => {
        if (doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const title = card.querySelector('.editorial-thumbnail-title');
        const letters = motionLetters(title);
        letters.forEach((letter, index) => {
          if (!letter.animate) return;
          letter.getAnimations().forEach(animation => animation.cancel());
          letter.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: .4 }, { transform: 'translateY(0)' }],
            { duration: 560, delay: index * Math.min(18, 400 / letters.length), easing: 'ease-in-out' });
        });
      };
      card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') wave(); });
      card.addEventListener('focusin', wave);
      cards.append(card);
    });
    suggestions.append(title, cards);
    if (related.length > 1) {
      const dots = doc.createElement('div'); dots.className = 'editorial-carousel-dots'; dots.setAttribute('aria-hidden', 'true');
      related.forEach((_, index) => {
        const dot = doc.createElement('span'); dot.dataset.carouselDot = String(index);
        dot.classList.toggle('is-active', index === 0); dots.append(dot);
      });
      suggestions.append(dots);
    }
    section.append(suggestions);
  }
  return section;
}
