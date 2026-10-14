import { articlePath } from '../../../../shared/writing/routes.js';
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
export function createWritingError({ doc = document, ui, text, articles = [], topic = '', retry, fallback = { src: '/media/mountains.svg' } }) {
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
  const archive = doc.createElement('a'); archive.href = writingConfig.routes.index; text(archive, () => ui.writingPage.backToWriting);
  const provider = doc.createElement('a'); provider.href = writingConfig.source.origin; provider.target = '_blank'; provider.rel = 'noopener noreferrer';
  text(provider, () => ui.writingPage.postsOnSubstack); controls.append(archive, provider);
  lead.append(image, heading, explanation, controls); section.append(lead);
  const related = relatedArticles(articles, topic);
  if (related.length) {
    const suggestions = doc.createElement('section'); suggestions.className = 'editorial-error-related';
    const title = doc.createElement('h2');
    const hasMatch = related.some(article => words(`${article.slug} ${article.title} ${(article.categories || []).join(' ')}`).some(word => words(topic).includes(word)));
    text(title, () => hasMatch ? ui.writingPage.relatedPosts : ui.writingPage.keepReading);
    const cards = doc.createElement('div'); cards.className = 'editorial-error-cards';
    related.forEach(article => {
      const card = doc.createElement('article'); const link = doc.createElement('a'); link.href = articlePath(article.slug);
      const cover = doc.createElement('img'); cover.src = article.image || fallback.src; cover.alt = ''; cover.width = 600; cover.height = 400; cover.loading = 'lazy';
      cover.onerror = () => { cover.onerror = null; cover.src = fallback.src; };
      const name = doc.createElement('h3'); name.textContent = article.title;
      const excerpt = doc.createElement('p'); excerpt.textContent = article.excerpt || '';
      link.append(cover, name, excerpt); card.append(link); cards.append(card);
    });
    suggestions.append(title, cards); section.append(suggestions);
  }
  return section;
}
