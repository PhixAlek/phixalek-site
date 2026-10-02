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
  const drawer = document.getElementById?.('mobile-menu');
  const links = [
    ...header.querySelectorAll('nav a[href^="#"]'),
    ...(drawer?.querySelectorAll('nav a[href^="#"]') || []),
  ];
  // Scroll tracking follows page order; desktop selection follows anchor navigation.
  const sections = [...main.querySelectorAll('section[id]')];
  let selectedHash = window.location?.hash || '';
  let frame = 0;
  function update() {
    frame = 0;
    header.classList?.toggle('is-scrolled', window.scrollY > 16);
    const headerHeight = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    const offset = headerHeight + 16;
    document.documentElement.style.setProperty('--anchor-offset', `${offset}px`);
    const atBottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    let current = activeSection(sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top })), offset, atBottom);
    // About and Contact share a compact row: preserve the requested anchor
    // while it is visible instead of letting their equal positions choose Contact.
    const requested = sections.find(section => `#${section.id}` === window.location?.hash);
    if (requested?.closest('.closing')) {
      const bounds = requested.getBoundingClientRect();
      if (bounds.bottom > headerHeight && bounds.top < window.innerHeight) current = requested.id;
    }
    const selectedSection = sections.find(section => `#${section.id}` === selectedHash);
    const selectedBounds = selectedSection?.getBoundingClientRect();
    const selectedVisible = selectedBounds && selectedBounds.bottom > headerHeight && selectedBounds.top < window.innerHeight;
    const activeHash = window.matchMedia?.('(min-width: 768px)').matches
      ? selectedHash
      : selectedVisible ? selectedHash : `#${current}`;
    links.forEach(link => {
      if (link.hash === activeHash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const select = hash => { selectedHash = hash; schedule(); };
  const onClick = event => {
    // Disclosure controls can prevent their native click; still reflect the interaction.
    const control = event.target.closest('[data-book], .contact-message, .about-details > summary');
    if (control) {
      select(control.matches('[data-book], .contact-message') ? '#contact' : '#about');
      return;
    }
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      select(link.hash);
      focusDestination(target);
    }
    // Let the browser keep native anchors, URL history and back/forward behavior.
  };
  const onPointerOver = event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const section = event.target.closest('section[id]');
    if (!section || section.contains(event.relatedTarget)) return;
    const hash = `#${section.id}`;
    if (links.some(link => link.hash === hash)) select(hash);
  };
  document.addEventListener('click', onClick);
  main.addEventListener?.('pointerover', onPointerOver);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  const onHashChange = () => { selectedHash = window.location?.hash || ''; schedule(); };
  window.addEventListener('hashchange', onHashChange);
  const observer = new ResizeObserver(schedule);
  observer.observe(header); observer.observe(main);
  update();
  return () => {
    cancelAnimationFrame(frame); observer.disconnect();
    document.removeEventListener('click', onClick);
    main.removeEventListener?.('pointerover', onPointerOver);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('hashchange', onHashChange);
  };
}
