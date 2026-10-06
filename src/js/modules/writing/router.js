import { resolveWritingRoute } from '../../../shared/writing/routes.js';
import { afterScrollArrival } from '../common/scroll-arrival.js';

export function resolveSiteRoute(pathname) {
  if (pathname === '/') return { kind: 'home' };
  return resolveWritingRoute(pathname) || { kind: 'not-found' };
}

// Rendering is injected so URL/history behavior stays independent of page components.
export function mountRouter(render, { view = window, doc = document } = {}) {
  let revision = 0;
  const previousRestoration = view.history.scrollRestoration;
  view.history.scrollRestoration = 'manual';
  const saveScroll = () => view.history.replaceState({ ...view.history.state, scroll: view.scrollY }, '', view.location.href);
  const display = async (restore = false) => {
    const current = ++revision;
    const route = resolveSiteRoute(view.location.pathname);
    await render(route, () => current === revision);
    if (current !== revision) return;
    let target;
    try { target = view.location.hash && doc.getElementById(decodeURIComponent(view.location.hash.slice(1))); } catch { /* Invalid URL escapes cannot interrupt rendering. */ }
    if (restore && Number.isFinite(view.history.state?.scroll)) view.scrollTo(0, view.history.state.scroll);
    else if (target) target.scrollIntoView({ block: 'start' });
    else view.scrollTo(0, 0);
    const focus = target || doc.getElementById('main-content');
    focus?.setAttribute('tabindex', '-1');
    focus?.focus({ preventScroll: true });
    if (route.kind === 'home' && await afterScrollArrival(view, () => current === revision)) {
      const main = doc.getElementById('main-content');
      if (main?.dataset) main.dataset.navigationReady = 'true';
      if (doc.dispatchEvent && view.CustomEvent) doc.dispatchEvent(new view.CustomEvent('site:home-arrived', {
        detail: { hash: view.location.hash || '#home' },
      }));
    }
  };
  const navigate = async href => {
    const url = new URL(href, view.location.href);
    if (url.origin !== view.location.origin) return;
    saveScroll();
    view.history.pushState({ siteNavigation: true }, '', url.href);
    await display();
  };
  const click = event => {
    const back = event.target.closest('[data-route-back]');
    if (back?.hasAttribute('data-route-back') && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      if (view.history.state?.siteNavigation) view.history.back();
      else navigate(back.href);
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, view.location.href);
    if (url.origin !== view.location.origin) return;
    if (url.pathname === view.location.pathname && url.pathname !== '/' && url.hash) {
      let target;
      try { target = doc.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      // In-page utilities must not replace the reader or add an extra Back step.
      view.history.replaceState(view.history.state, '', url.href);
      target.scrollIntoView({ block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      return;
    }
    // Keep native Home anchors and their existing animation/history handlers.
    if (url.pathname === '/' && view.location.pathname === '/' && url.hash) return;
    if (url.pathname !== '/' && !resolveWritingRoute(url.pathname)) return;
    event.preventDefault();
    navigate(url.href);
  };
  const pop = () => display(true);
  const requested = event => navigate(event.detail);
  doc.addEventListener('click', click);
  doc.addEventListener('site:navigate', requested);
  view.addEventListener('popstate', pop);
  // Native Home anchors keep their browser history; popstate restores the page.
  const ready = display(true);
  return { ready, navigate, destroy() {
    revision++;
    view.history.scrollRestoration = previousRestoration;
    doc.removeEventListener('click', click);
    doc.removeEventListener('site:navigate', requested);
    view.removeEventListener('popstate', pop);
  } };
}
