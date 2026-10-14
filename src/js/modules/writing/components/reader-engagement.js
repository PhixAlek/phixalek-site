import { mountShareDialog } from './share-dialog.js';
import { articlePath } from '../../../../shared/writing/routes.js';
import { SITE_ORIGIN } from '../../../../shared/writing/metadata.js';

const paths = {
  likes: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  comments: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/>',
  share: '<path d="M12 16V3m-5 5 5-5 5 5M5 14v7h14v-7"/>',
};

/** Counts are a dated public snapshot, never locally incremented reactions. */
export function mountReaderEngagement(story, prose, article, { ui, text, bind, release, view = window }) {
  const doc = story.ownerDocument;
  const row = doc.createElement('div'); row.className = 'editorial-reader-engagement'; row.id = 'article-engagement'; row.tabIndex = -1;
  const controls = doc.createElement('div'); controls.className = 'editorial-reader-social';
  const control = (kind, count) => {
    const node = doc.createElement(kind === 'comments' ? 'a' : 'button');
    if (kind === 'comments') node.href = '#comments'; else node.type = 'button';
    node.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${paths[kind]}</svg>`;
    const label = doc.createElement('span');
    if (count != null) label.textContent = String(count); else text(label, () => ui.writingPage[kind]);
    bind(node, 'attr:aria-label', () => `${ui.writingPage[kind]}${count != null ? `: ${count}` : ''}`);
    node.append(label); controls.append(node); return node;
  };
  // Missing counters render as an empty zero state; do not mutate the imported snapshot.
  const count = kind => !article.localDemo && Number.isSafeInteger(article.engagement?.[kind]) && article.engagement[kind] >= 0 ? article.engagement[kind] : 0;
  const like = control('likes', count('likes')); like.dataset.substackAction = 'likes';
  like.disabled = Boolean(article.localDemo); like.classList.toggle('has-reactions', count('likes') > 1);
  control('comments', count('comments'));
  const share = control('share');
  row.append(controls); prose.after(row);
  const sheet = mountShareDialog(story, { view, ui, text, bind, release });
  const open = () => sheet.open(new URL(articlePath(article.slug), SITE_ORIGIN).href, share);
  share.addEventListener('click', open);
  return () => { share.removeEventListener('click', open); sheet.dispose(); row.remove(); };
}
