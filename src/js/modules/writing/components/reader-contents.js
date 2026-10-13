/** One section index shared by desktop and mobile, with disposable observation. */
export function mountReaderContents(layout, story, prose, { doc = document, view = window, label }) {
  // Imported article headings must not introduce a second page-level h1.
  prose.querySelectorAll('h1').forEach(source => {
    const heading = doc.createElement('h2');
    [...source.attributes].forEach(attribute => heading.setAttribute(attribute.name, attribute.value));
    heading.append(...source.childNodes); source.replaceWith(heading);
  });
  const headings = [...prose.querySelectorAll('h2,h3')].filter(heading => heading.textContent.trim());
  if (!headings.length) { layout.classList.add('without-toc'); return () => {}; }
  const panel = doc.createElement('details'); panel.className = 'editorial-toc';
  const summary = doc.createElement('summary'); summary.id = 'reader-contents-title'; label(summary);
  const nav = doc.createElement('nav'); nav.setAttribute('aria-labelledby', summary.id);
  const links = new Map(), ids = new Set([...doc.querySelectorAll('[id]')].map(node => node.id));
  headings.forEach((heading, index) => {
    let id = heading.id || `article-heading-${index + 1}`;
    while (ids.has(id)) id += '-section';
    heading.id = id; ids.add(id); heading.tabIndex = -1;
    const link = doc.createElement('a'); link.href = `#${id}`; link.textContent = heading.textContent;
    if (heading.tagName === 'H3') link.className = 'editorial-toc-subsection';
    links.set(heading, link); nav.append(link);
  });
  panel.append(summary, nav);
  const desktop = view.matchMedia('(min-width: 1024px)');
  const place = () => {
    panel.open = desktop.matches;
    if (desktop.matches) layout.append(panel);
    else story.insertBefore(panel, prose);
  };
  const activate = heading => links.forEach((link, target) => {
    if (target === heading) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  activate(headings[0]); place(); desktop.addEventListener('change', place);
  let lastSelected = null;
  const reopen = () => {
    if (!panel.open || desktop.matches) return;
    const link = lastSelected || nav.querySelector('[aria-current="location"]');
    if (!link) return;
    const row = link.getBoundingClientRect(), frame = nav.getBoundingClientRect();
    nav.scrollTop = Math.max(0, nav.scrollTop + row.top - frame.top - (nav.clientHeight - row.height) / 2);
  };
  const click = event => {
    const link = event.target.closest('a');
    if (link && nav.contains(link)) {
      lastSelected = link;
      activate([...links].find(([, anchor]) => anchor === link)?.[0]);
      if (!desktop.matches) panel.open = false;
    }
  };
  nav.addEventListener('click', click);
  panel.addEventListener('toggle', reopen);
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) activate(visible[0].target);
  }, { rootMargin: '-110px 0px -55% 0px' }) : null;
  headings.forEach(heading => observer?.observe(heading));
  return () => { observer?.disconnect(); desktop.removeEventListener('change', place); nav.removeEventListener('click', click); panel.removeEventListener('toggle', reopen); };
}
