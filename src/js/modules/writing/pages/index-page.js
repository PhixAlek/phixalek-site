import { isArticleType } from '../../../../shared/writing/taxonomy.js';
import { createWritingHeading } from '../../../../shared/writing/hero-heading.js';
import { ui, text, bind, releaseBindings } from '../../../../content/index.js';
import { writingConfig } from '../../../../shared/writing/config.js';
import { EDITORIAL_DESKTOP_QUERY, deriveCategories, filterArticles, categoryForTag, selectFeedArticles } from '../../../../shared/writing/listing-model.js';
import { ArticleCard } from '../components/article-card.js';
import { mountFeed } from '../components/feed-controller.js';
import { mountFilterPopover, placeFilterButtons } from '../components/filter-popover.js';
import { mountArticleActions } from '../components/article-actions.js';

export function listingIntro(container, back) {
  const intro = document.createElement('div'); intro.className = 'editorial-intro';
  const label = document.createElement('span'); label.className = 'editorial-eyebrow';
  text(label, () => ui.navigation.items.find(item => item.href === '#writing').label);
  const heading = createWritingHeading({ doc: document, text, getTitle: () => ui.writingPage.title });
  const description = document.createElement('p'); text(description, () => ui.writingPage.intro);
  bind(description, 'hidden', () => document.documentElement.lang === 'es');
  const lead = document.createElement('div'); lead.className = 'editorial-intro-lead';
  if (back) lead.append(back); lead.append(label);
  intro.append(lead, heading, description); container.append(intro);
}

export function listing(container, articles, fallback, view = window) {
  const featured = articles.length ? ArticleCard(articles[0], fallback, true) : null;
  const featuredShell = document.createElement('div'); featuredShell.className = 'editorial-featured-shell';
  if (featured) { featuredShell.append(featured); container.append(featuredShell); }
  const toolbar = document.createElement('div'); toolbar.className = 'editorial-toolbar';
  const filters = document.createElement('div'); filters.className = 'editorial-filters'; filters.setAttribute('role', 'group');
  bind(filters, 'attr:aria-label', () => ui.writingPage.filtersLabel);
  const searchWrap = document.createElement('div'); searchWrap.className = 'editorial-search';
  const searchIcon = document.createElement('span'); searchIcon.className = 'editorial-search-icon'; searchIcon.setAttribute('aria-hidden', 'true');
  searchIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
  const search = document.createElement('input'); search.type = 'search';
  bind(search, 'attr:placeholder', () => ui.writingPage.search); bind(search, 'attr:aria-label', () => ui.writingPage.search);
  const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'editorial-search-clear'; clear.textContent = '×'; clear.hidden = true;
  bind(clear, 'attr:aria-label', () => ui.writingPage.clearSearch); searchWrap.append(searchIcon, search, clear);
  const views = document.createElement('div'); views.className = 'editorial-views'; views.setAttribute('role', 'group');
  bind(views, 'attr:aria-label', () => ui.writingPage.viewsLabel);
  const list = document.createElement('div'); list.className = 'editorial-list';
  const hasObserver = typeof view.IntersectionObserver === 'function';
  const more = document.createElement(hasObserver ? 'div' : 'button');
  more.className = hasObserver ? 'editorial-feed-sentinel' : 'editorial-load-more';
  if (hasObserver) more.setAttribute('aria-hidden', 'true');
  else { more.type = 'button'; text(more, () => ui.writingPage.loadMore); }
  const automatic = document.createElement('button'); automatic.type = 'button'; automatic.className = 'editorial-automatic'; text(automatic, () => ui.writingPage.automatic);
  const loader = document.createElement('div'); loader.className = 'editorial-feed-loading'; loader.hidden = true; loader.setAttribute('role', 'status');
  bind(loader, 'attr:aria-label', () => ui.writing.states.loading.message);
  const spinner = document.createElement('span'); spinner.className = 'editorial-loading-spinner'; spinner.setAttribute('aria-hidden', 'true'); loader.append(spinner);
  const loadingControls = document.createElement('div'); loadingControls.className = 'editorial-loading-controls'; loadingControls.append(loader, more, automatic);
  const currentCategories = deriveCategories(articles, { definitions: writingConfig.categories });
  const saved = view.history?.state?.writingListing;
  search.value = typeof saved?.query === 'string' ? saved.query : '';
  search.maxLength = 500;
  let category = currentCategories.some(item => item.id === saved?.category) ? saved.category : '';
  const availableLanguages = [...new Set(articles.map(article => article.language).filter(code => /^[a-z]{2}$/.test(code)))].sort();
  let language = currentCategories.length && availableLanguages.length > 1 && availableLanguages.includes(saved?.language) ? saved.language : '';
  const languageButtons = [];
  let mode = saved?.mode === 'grid' ? 'grid' : 'list', disposeFeed = () => {}, restoring = true;
  const categories = [{ id: '', labels: null }, ...currentCategories];
  const filterButtons = [];
  let filterPopover;
  const wide = view.matchMedia(EDITORIAL_DESKTOP_QUERY);
  const saveState = () => {
    if (!view.history?.replaceState) return;
    const cards = [...list.children].filter(node => node.classList.contains('editorial-card'));
    const state = { query: search.value, category, language, mode, compact: !wide.matches,
      startOffset: Math.max(0, Number(cards[0]?.getAttribute('aria-posinset') || 1) - 1),
      rendered: cards.length, auto: automatic.getAttribute('aria-pressed') !== 'false' };
    try { view.history.replaceState({ ...view.history.state, writingListing: state }, '', view.location.href); } catch { /* History storage is optional. */ }
  };
  const update = ({ preservePagination = false } = {}) => {
    const previousCards = preservePagination ? [...list.children].filter(node => node.classList.contains('editorial-card')) : [];
    const previousOffset = Math.max(0, Number(previousCards[0]?.getAttribute('aria-posinset') || 1) - 1);
    filterPopover?.close(panel.contains(document.activeElement));
    disposeFeed(); releaseBindings(list); list.replaceChildren();
    if (!wide.matches) {
      search.value = '';
    }
    searchWrap.hidden = !wide.matches;
    const primaryCount = wide.matches ? 4 : 3;
    placeFilterButtons(filters, panel, overflow, filterButtons.map(([button]) => button), primaryCount);
    moreFilters.classList.toggle('has-selected-filter', Boolean(language) || categories.findIndex(item => item.id === category) >= primaryCount);
    const isFiltered = Boolean(search.value.trim() || category || language);
    const matches = filterArticles(selectFeedArticles(articles, { desktop: wide.matches, filtered: isFiltered }),
      { query: search.value, category, language, categories: currentCategories });
    container.classList.toggle('editorial-feed-layout', !wide.matches);
    list.classList.toggle('is-grid', wide.matches && mode === 'grid');
    list.setAttribute('role', wide.matches ? 'list' : 'feed');
    bind(list, 'attr:aria-label', () => ui.writingPage.feedLabel);
    if (!wide.matches && (views.contains(document.activeElement) || searchWrap.contains(document.activeElement))) filterButtons[0]?.[0].focus();
    views.hidden = !wide.matches;
    clear.hidden = !search.value;
    filterButtons.forEach(([button, id]) => button.setAttribute('aria-pressed', String(id === category)));
    languageButtons.forEach(([button, code]) => button.setAttribute('aria-pressed', String(code === language)));
    [...views.children].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === mode)));
    const rows = matches;
    loadingControls.hidden = !rows.length;
    if (!matches.length && (isFiltered || !articles.length)) {
      const empty = document.createElement('div'); empty.className = 'editorial-empty';
      const image = document.createElement('img'); image.src = fallback.src; image.alt = ''; image.width = 640; image.height = 336;
      const title = document.createElement('h2'); text(title, () => ui.writingPage.empty);
      const reason = document.createElement('p'); text(reason, () => search.value.trim() && (category || language) ? ui.writingPage.emptyCombined : search.value.trim() ? ui.writingPage.emptySearch : category ? ui.writingPage.emptyFilter : language ? ui.writingPage.emptyLanguage : ui.writingPage.emptyArchive);
      const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'btn';
      text(reset, () => ui.writingPage.clearFilters); reset.hidden = !isFiltered;
      reset.addEventListener('click', () => { category = ''; language = ''; search.value = ''; update(); filterButtons[0][0].focus({ preventScroll: true }); });
      empty.append(image, title, reason, reset); list.append(empty); saveState(); restoring = false; return;
    }
    const settings = writingConfig.listing;
    const restoreCards = restoring && saved?.compact === !wide.matches;
    const initialOffset = restoreCards && Number.isInteger(saved.startOffset) && saved.startOffset >= 0 ? saved.startOffset : previousOffset;
    const initialCount = restoreCards && Number.isInteger(saved.rendered) && saved.rendered > 0 ? Math.min(settings.maxRenderedCards, saved.rendered) : previousCards.length || (wide.matches ? Math.min(settings.batchSize * 2, rows.length) : settings.batchSize);
    disposeFeed = mountFeed({ list, more, automatic, articles: rows, view,
      repeat: !wide.matches && !isFiltered && settings.repeatMobile,
      maxEntries: !wide.matches && !isFiltered ? rows.length * (settings.mobileCycles || 3) : rows.length,
      onLoading: active => { loader.hidden = !active; },
      initialOffset, initialCount, automaticEnabled: wide.matches || !restoreCards || saved.auto !== false, onAppend: saveState,
      batchSize: settings.batchSize, maxCards: settings.maxRenderedCards, onRemove: releaseBindings,
      createCard: article => {
        const card = ArticleCard(article, fallback);
        card.setAttribute('role', wide.matches ? 'listitem' : 'article');
        return card;
      },
    });
    restoring = false;
  };
  const overflow = document.createElement('div'); overflow.className = 'editorial-filter-overflow';
  const moreFilters = document.createElement('button'); moreFilters.type = 'button'; moreFilters.className = 'editorial-more-filters';
  const dots = document.createElement('span'); dots.setAttribute('aria-hidden', 'true'); dots.textContent = '⋯'; dots.className = 'editorial-more-dots';
  moreFilters.append(dots);
  bind(moreFilters, 'attr:aria-label', () => ui.writingPage.moreFilters);
  bind(moreFilters, 'attr:title', () => ui.writingPage.moreFilters);
  const panel = document.createElement('div'); panel.className = 'editorial-filter-panel'; panel.id = 'writing-additional-filters';
  panel.setAttribute('role', 'dialog'); bind(panel, 'attr:aria-label', () => ui.writingPage.filtersLabel);
  moreFilters.setAttribute('aria-controls', panel.id); overflow.append(moreFilters, panel);
  categories.forEach((item, index) => {
    const button = document.createElement('button'); button.type = 'button';
    text(button, () => item.labels ? item.labels[document.documentElement.lang] || item.labels.en : ui.writingPage.all);
    if (item.labels && isArticleType(item.labels.en)) button.dataset.filterType = 'type';
    button.addEventListener('click', () => {
      category = item.id;
      if (!category) { search.value = ''; language = ''; }
      filterPopover?.close(panel.contains(button));
      update();
    });
    (index > 3 ? panel : filters).append(button); filterButtons.push([button, item.id]);
  });
  const languageGroup = document.createElement('div'); languageGroup.className = 'editorial-language-filters';
  languageGroup.dataset.filterSection = 'language'; languageGroup.setAttribute('role', 'group');
  bind(languageGroup, 'attr:aria-label', () => ui.writingPage.languageFilter);
  for (const code of currentCategories.length && availableLanguages.length > 1 ? availableLanguages : []) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.languageFilter = code;
    text(button, () => availableLanguages.length > 2 || !['en', 'es'].includes(code) ? code.toUpperCase() : code === 'en' ? ui.writingPage.english : ui.writingPage.spanish);
    button.addEventListener('click', () => { language = language === code ? '' : code; filterPopover?.close(true); update(); });
    languageButtons.push([button, code]); languageGroup.append(button);
  }
  if (languageButtons.length) panel.append(languageGroup);
  filters.append(overflow);
  filterPopover = mountFilterPopover(overflow, moreFilters, panel);
  for (const value of ['list', 'grid']) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.view = value;
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">${value === 'list' ? '<path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"/>' : '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'}</svg>`;
    const label = document.createElement('span'); text(label, () => ui.writingPage[value]); button.append(icon, label);
    button.addEventListener('click', () => { mode = value; update({ preservePagination: true }); }); views.append(button);
  }
  const clearSearch = () => { search.value = ''; update(); search.focus(); };
  clear.addEventListener('click', clearSearch); search.addEventListener('input', update);
  toolbar.append(filters, searchWrap, views);
  const explore = document.createElement('div'); explore.className = 'editorial-explore';
  const surface = document.createElement('div'); surface.className = 'editorial-feed-surface';
  surface.append(list, loadingControls); explore.append(toolbar, surface); container.append(explore);
  const selectTag = event => {
    const tag = event.target.closest('button[data-article-tag]');
    if (!tag || !container.contains(tag)) return;
    const selected = categoryForTag(tag.dataset.articleTag, currentCategories);
    if (!selected) return;
    category = selected; search.value = ''; update();
    toolbar.scrollIntoView({ block: 'start', behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    const active = filterButtons.find(([, id]) => id === category)?.[0];
    (active && filters.contains(active) ? active : moreFilters).focus({ preventScroll: true });
  };
  container.addEventListener('click', selectTag);
  const disposeActions = mountArticleActions(container, articles, { view, ui, text, bind, release: releaseBindings });
  wide.addEventListener('change', update); update();
  return () => { container.removeEventListener('click', selectTag); filterPopover.dispose(); disposeFeed(); releaseBindings(container); disposeActions(); wide.removeEventListener('change', update); search.removeEventListener('input', update); clear.removeEventListener('click', clearSearch); };
}
