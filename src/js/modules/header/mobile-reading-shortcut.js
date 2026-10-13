/** Separate single and double taps so the first tap never scrolls before a double tap. */
export function mountMobileReadingShortcut(button, { doc = document, view = window, delay = 300 } = {}) {
  let pending = null;
  const clear = () => { if (pending !== null) view.clearTimeout(pending); pending = null; };
  const listing = () => doc.querySelector('.writing-page[data-writing-view="index"]') || doc.querySelector('main.site:not(.writing-page):not([hidden])');
  const scroll = (page, top, keyboard = false) => {
    if (listing() !== page || !view.matchMedia('(max-width: 767px)').matches) return;
    const behavior = view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (top) view.scrollTo({ top: 0, behavior });
    else {
      const toolbar = page.querySelector('.editorial-toolbar') || page.querySelector('#writing');
      toolbar?.scrollIntoView({ block: 'start', behavior });
      if (keyboard) toolbar?.querySelector('button')?.focus({ preventScroll: true });
    }
  };
  const click = event => {
    const page = listing();
    if (!page) return;
    if (event.detail === 0) { clear(); scroll(page, false, true); return; }
    if (pending !== null) { clear(); scroll(page, true); return; }
    pending = view.setTimeout(() => { pending = null; scroll(page, false); }, delay);
  };
  button.addEventListener('click', click);
  view.addEventListener('pagehide', clear);
  return () => { clear(); button.removeEventListener('click', click); view.removeEventListener('pagehide', clear); };
}
