import { mountShareDialog } from './share-dialog.js';
import { articlePath } from '../../../../shared/writing/routes.js';
import { SITE_ORIGIN } from '../../../../shared/writing/metadata.js';

const icons = {
  comments: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
  share: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
};
const icon = kind => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]}</svg>`;

// No RSS reaction counters are invented. This does not submit a comment or reaction.
export function ArticleActions(article, { doc = document, ui, bind }) {
  const actions = doc.createElement('div'); actions.className = 'editorial-actions';
  for (const kind of ['comments', 'share']) {
    const button = doc.createElement('button'); button.type = 'button'; button.innerHTML = icon(kind);
    button.dataset.articleAction = kind;
    bind(button, 'attr:aria-label', () => `${ui.writingPage[kind]}: ${article.title}`);
    actions.append(button);
  }
  actions.dataset.slug = article.slug;
  return actions;
}

/** Delegated controls stay outside the main article link. */
export function mountArticleActions(container, articles, { view = window, ui, text }) {
  const bySlug = new Map(articles.map(article => [article.slug, article]));
  const doc = container.ownerDocument;
  const share = mountShareDialog(container, { view, ui, text });
  const click = async event => {
    const button = event.target.closest('button[data-article-action]');
    if (!button || !container.contains(button) || button.disabled) return;
    const article = bySlug.get(button.parentElement.dataset.slug);
    if (!article) return;
    if (button.dataset.articleAction === 'comments') {
      doc.dispatchEvent(new doc.defaultView.CustomEvent('site:navigate', { detail: articlePath(article.slug) + '#comments' }));
      return;
    }
    const origin = article.localDemo ? view.location?.origin || doc.location.origin : SITE_ORIGIN;
    share.open(origin + articlePath(article.slug), button);
  };
  container.addEventListener('click', click);
  return () => { container.removeEventListener('click', click); share.dispose(); };
}
