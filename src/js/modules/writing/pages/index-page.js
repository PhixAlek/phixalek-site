import { ui, text, bind } from '../../../../content/index.js';
import { writingConfig } from '../../../../shared/writing/config.js';
import { ArticleCard } from '../components/article-card.js';

export function listingIntro(container) {
  const intro = document.createElement('div'); intro.className = 'editorial-intro';
  const label = document.createElement('span'); label.className = 'editorial-eyebrow';
  text(label, () => ui.navigation.items.find(item => item.href === '#writing').label);
  const heading = document.createElement('h1'); text(heading, () => ui.writingPage.title);
  const description = document.createElement('p'); text(description, () => ui.writingPage.intro);
  bind(description, 'hidden', () => document.documentElement.lang === 'es');
  intro.append(label, heading, description); container.append(intro);
}

export function listing(container, articles, fallback) {
  const featured = articles.length ? ArticleCard(articles[0], fallback, true) : null;
  if (featured) container.append(featured);
  const toolbar = document.createElement('div'); toolbar.className = 'editorial-toolbar';
  const filters = document.createElement('div'); filters.className = 'editorial-filters';
  const search = document.createElement('input'); search.type = 'search';
  bind(search, 'attr:placeholder', () => ui.writingPage.search); bind(search, 'attr:aria-label', () => ui.writingPage.search);
  const views = document.createElement('div'); views.className = 'editorial-views';
  const list = document.createElement('div'); list.className = 'editorial-list';
  let category = '', mode = 'list';
  const categories = [{ id: '', labels: null }, ...writingConfig.categories];
  const filterButtons = [];
  const update = () => {
    const needle = search.value.trim().toLowerCase();
    const selected = categories.find(item => item.id === category);
    if (featured) featured.hidden = Boolean(needle || category);
    const matches = (needle || category ? articles : articles.slice(1)).filter(article => (!category || article.categories.some(tag =>
      [selected.id, selected.labels.en, selected.labels.es].some(name => name.toLowerCase() === tag.toLowerCase())))
      && `${article.title} ${article.excerpt} ${article.categories.join(' ')}`.toLowerCase().includes(needle));
    list.classList.toggle('is-grid', mode === 'grid');
    list.replaceChildren(...matches.map(article => ArticleCard(article, fallback)));
    if (!matches.length && (needle || category)) { const empty = document.createElement('p'); text(empty, () => ui.writingPage.empty); list.append(empty); }
    filterButtons.forEach(([button, id]) => button.setAttribute('aria-pressed', String(id === category)));
    [...views.children].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === mode)));
  };
  categories.forEach(item => {
    const button = document.createElement('button'); button.type = 'button';
    text(button, () => item.labels ? item.labels[document.documentElement.lang] || item.labels.en : ui.writingPage.all);
    button.addEventListener('click', () => { category = item.id; update(); });
    filters.append(button); filterButtons.push([button, item.id]);
  });
  for (const value of ['list', 'grid']) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.view = value;
    text(button, () => ui.writingPage[value]); button.addEventListener('click', () => { mode = value; update(); }); views.append(button);
  }
  search.addEventListener('input', update);
  toolbar.append(filters, search, views); container.append(toolbar, list); update();
}

