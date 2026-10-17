import { feedBatch } from '../../../../shared/writing/listing-model.js';

/** Extend cached data only. The bounded DOM recycles cards already above the viewport. */
export function mountFeed({ list, more, automatic, createCard, articles, repeat = false, batchSize = 4, maxCards = 32,
  maxEntries = Infinity, initialOffset = 0, initialCount = batchSize, automaticEnabled = true, view = window, onAppend = () => {}, onRemove = () => {}, onLoading = () => {} }) {
  let offset = initialOffset, auto = automaticEnabled, destroyed = false, loading = false;
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    if (auto && entries.some(entry => entry.isIntersecting)) scheduleAppend();
  }, { rootMargin: '160px 0px' }) : null;
  const recycle = () => {
    if (!repeat) return;
    let removedHeight = 0;
    const gap = parseFloat(view.getComputedStyle?.(list).rowGap) || 0;
    while (list.children.length > maxCards) {
      const first = list.firstElementChild;
      const rect = first.getBoundingClientRect();
      if (rect.bottom >= 0 || first.contains(list.ownerDocument.activeElement)) break;
      removedHeight += rect.height + gap;
      onRemove(first); first.remove();
    }
    if (removedHeight) view.scrollBy?.({ top: -removedHeight, behavior: 'instant' });
  };
  const append = (count = batchSize) => {
    if (destroyed) return;
    const entries = feedBatch(articles, offset, Math.min(count, Math.max(0, maxEntries - offset)), { repeat });
    if (!entries.length) { more.hidden = true; observer?.disconnect(); return; }
    list.setAttribute('aria-busy', 'true');
    const nodes = entries.map(entry => {
      const card = createCard(entry.article);
      card.dataset.entryKey = entry.key;
      card.setAttribute('aria-posinset', String(entry.position));
      card.setAttribute('aria-setsize', repeat ? '-1' : String(articles.length));
      return card;
    });
    list.append(...nodes); offset += entries.length;
    recycle(); list.setAttribute('aria-busy', 'false');
    more.hidden = offset >= maxEntries || (!repeat && offset >= articles.length);
    if (more.hidden) automatic.hidden = true;
    if (!more.hidden && auto) observer?.observe(more);
    else observer?.disconnect();
    onAppend(entries.length);
  };
  // Yield to painting before extending the DOM; no artificial network delay.
  const scheduleAppend = () => {
    if (destroyed || loading || offset >= maxEntries || (!repeat && offset >= articles.length)) return;
    loading = true; list.setAttribute('aria-busy', 'true'); onLoading(true);
    const complete = () => {
      if (destroyed) return;
      try { append(); }
      finally { loading = false; list.setAttribute('aria-busy', 'false'); onLoading(false); }
    };
    if (view.requestAnimationFrame) view.requestAnimationFrame(() => view.requestAnimationFrame(complete));
    else complete();
  };
  const toggle = () => {
    auto = !auto; automatic.setAttribute('aria-pressed', String(auto));
    if (auto && !more.hidden) observer?.observe(more); else observer?.disconnect();
    onAppend(0);
  };
  const loadMore = () => scheduleAppend();
  more.addEventListener('click', loadMore);
  automatic.addEventListener('click', toggle);
  automatic.hidden = !repeat || !observer;
  automatic.setAttribute('aria-pressed', String(auto));
  append(initialCount);
  return () => {
    destroyed = true; observer?.disconnect(); onLoading(false); list.setAttribute('aria-busy', 'false');
    more.removeEventListener('click', loadMore); automatic.removeEventListener('click', toggle);
  };
}
