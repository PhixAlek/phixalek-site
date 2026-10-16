/** Slow mobile discovery cue; desktop and reduced-motion users keep manual navigation. */
export function mountRelatedCarousel(list, { view = window, delay = 10000 } = {}) {
  if (!list || list.children.length < 2 || !view.matchMedia) return () => {};
  const doc = list.ownerDocument;
  const dots = [...(list.parentElement?.querySelectorAll('[data-carousel-dot]') || [])];
  const position = () => {
    const cards = [...list.children], base = cards[0].offsetLeft;
    const offsets = cards.map(card => card.offsetLeft - base);
    const current = offsets.reduce((best, left, index) => Math.abs(left - list.scrollLeft) < Math.abs(offsets[best] - list.scrollLeft) ? index : best, 0);
    dots.forEach((dot, index) => dot.classList.toggle('is-active', index === current));
    return { offsets, current };
  };
  position();
  const mobile = view.matchMedia('(max-width: 767px)');
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let timer, visible = false, hovered = false, touching = false, disposed = false;
  const clear = () => { view.clearTimeout(timer); timer = undefined; };
  const eligible = () => !disposed && list.isConnected && mobile.matches && !reduced.matches
    && visible && !doc.hidden && !hovered && !touching && !list.contains(doc.activeElement);
  const schedule = () => {
    clear();
    if (!eligible()) return;
    timer = view.setTimeout(() => {
      if (!eligible()) return;
      const { offsets, current } = position();
      list.scrollTo({ left: offsets[(current + 1) % offsets.length], behavior: 'smooth' });
      schedule();
    }, delay);
  };
  const enter = event => { if (event.pointerType !== 'touch') { hovered = true; clear(); } };
  const leave = event => { if (event.pointerType !== 'touch') { hovered = false; schedule(); } };
  const down = () => { touching = true; clear(); };
  const up = () => { touching = false; schedule(); };
  const focusOut = () => { view.queueMicrotask(schedule); };
  const scrolled = () => { position(); schedule(); };
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .5); schedule();
  }, { threshold: [0, .5] }) : null;
  observer?.observe(list);
  const listeners = [[list, 'pointerenter', enter], [list, 'pointerleave', leave], [list, 'pointerdown', down],
    [doc, 'pointerup', up], [doc, 'pointercancel', up], [list, 'focusin', clear], [list, 'focusout', focusOut],
    [list, 'scroll', scrolled], [doc, 'visibilitychange', schedule], [mobile, 'change', scrolled], [reduced, 'change', schedule]];
  listeners.forEach(([target, type, callback]) => target.addEventListener(type, callback));
  return () => {
    disposed = true; clear(); observer?.disconnect();
    listeners.forEach(([target, type, callback]) => target.removeEventListener(type, callback));
  };
}
