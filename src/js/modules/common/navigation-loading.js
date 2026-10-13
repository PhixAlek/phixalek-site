/** One navigation indicator follows the visible page chrome, never feed pagination. */
export function mountNavigationLoading(header, footer, { view = window, doc = document, shell } = {}) {
  const bar = doc.createElement('div'); bar.className = 'navigation-loading-bar'; bar.hidden = true;
  bar.setAttribute('aria-hidden', 'true');
  let active = false, originalMinHeight;
  const reserveLayout = next => {
    if (!shell) return;
    if (next && !active) {
      originalMinHeight = shell.style.minHeight;
      shell.style.minHeight = `${Math.max(doc.documentElement.scrollHeight, view.innerHeight)}px`;
    } else if (!next && active) shell.style.minHeight = originalMinHeight || '';
  };
  const place = () => {
    if (!active) return;
    const rect = footer.getBoundingClientRect();
    const atFooter = rect.top < view.innerHeight && rect.bottom > 0;
    const target = atFooter ? footer : header;
    bar.classList.toggle('at-footer', atFooter);
    if (bar.parentElement !== target) target.append(bar);
  };
  const loading = event => { const next = Boolean(event.detail?.active); reserveLayout(next); active = next; bar.hidden = !active; place(); };
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(place) : null;
  observer?.observe(footer);
  doc.addEventListener('site:navigation-loading', loading);
  view.addEventListener('scroll', place, { passive: true });
  view.addEventListener('resize', place);
  header.append(bar);
  return () => {
    reserveLayout(false); active = false;
    observer?.disconnect(); doc.removeEventListener('site:navigation-loading', loading);
    view.removeEventListener('scroll', place); view.removeEventListener('resize', place); bar.remove();
  };
}
