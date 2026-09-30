/** Last section whose start has passed the reading line below the header. */
export function activeSection(sections, readingLine, atBottom = false) {
  if (!sections.length) return null;
  if (atBottom) return sections.at(-1).id;
  let active = sections[0].id;
  for (const section of sections) {
    if (section.top > readingLine) break;
    active = section.id;
  }
  return active;
}
export function focusDestination(target) {
  if (!target) return;
  const previous = target.getAttribute('tabindex');
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => {
    if (previous === null) target.removeAttribute('tabindex');
    else target.setAttribute('tabindex', previous);
  }, { once: true });
}
export function mountNavigation(header, main) {
  const links = [...header.querySelectorAll('nav a[href^="#"]')];
  const ids = [...new Set(links.map(link => link.hash.slice(1)))];
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  let frame = 0;
  function update() {
    frame = 0;
    const offset = header.getBoundingClientRect().height + 16;
    document.documentElement.style.setProperty('--anchor-offset', `${offset}px`);
    const atBottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const current = activeSection(sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top })), offset, atBottom);
    links.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const onClick = event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target) focusDestination(target);
    // Let the browser keep native anchors, URL history and back/forward behavior.
  };
  document.addEventListener('click', onClick);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  const observer = new ResizeObserver(schedule);
  observer.observe(header); observer.observe(main);
  update();
  return () => {
    cancelAnimationFrame(frame); observer.disconnect();
    document.removeEventListener('click', onClick);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('hashchange', schedule);
  };
}
