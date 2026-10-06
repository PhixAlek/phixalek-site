import { content, ui, bind, text, languageButton } from '../../../content/index.js';
// src/js/modules/header/header.js
export function Header(){
  const header = document.createElement('header');
  header.className = 'header';
  const skip = document.createElement('a');
  skip.className = 'skip-link'; skip.href = '#main-content';
  text(skip, () => ui.navigation.skip);

  const wrap = document.createElement('div');
  wrap.className = 'container row between center';

  // The page heading belongs to the hero.
  const brand = document.createElement('div');
  brand.className = 'brand';
  const home = document.createElement('a');
  home.href = '#home';
  home.dataset.homeHref = '#home';
  home.textContent = content.hero.name;
  brand.appendChild(home);

  // Nav desktop
  const nav = document.createElement('nav');
  nav.className = 'nav';
  const fillNavigation = (target, destinations = ui.navigation.items.map(item => item.href)) => {
    destinations.forEach(href => {
      const link = document.createElement('a');
      link.dataset.homeHref = href;
      link.href = href === '#writing' ? '/blog' : href;
      text(link, () => ui.navigation.items.find(item => item.href === href).label);
      target.append(link);
    });
  };
  // Brand returns home; only implemented destinations enter desktop navigation.
  fillNavigation(nav, ['#work', '#about', '#writing']);
  const contact = document.createElement('a');
  contact.className = 'btn header-contact';
  contact.dataset.homeHref = content.hero.ctaPrimary.href;
  bind(contact, 'attr:href', () => `${window.location.pathname === '/' ? '' : '/'}${content.hero.ctaPrimary.href}`);
  text(contact, () => content.hero.ctaPrimary.text);
  nav.append(contact, languageButton('language-desktop'));

  // Burger
  const btn = document.createElement('button');
  btn.id = 'nav-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'mobile-menu');
  btn.className = 'nav-toggle';
  bind(btn, 'attr:aria-label', () => ui.navigation.open);
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `<span class="burger" aria-hidden="true"></span>`;

  // Drawer overlay
  const drawer = document.createElement('aside');
  drawer.className = 'menu-drawer';
  drawer.id = 'mobile-menu';
  drawer.hidden = true;
  drawer.inert = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  bind(drawer, 'attr:aria-label', () => ui.navigation.label);
  drawer.setAttribute('aria-hidden','true');
  const closeButton = document.createElement('button');
  closeButton.type = 'button'; closeButton.className = 'drawer-close';
  bind(closeButton, 'attr:aria-label', () => ui.navigation.close);
  const mobileNav = document.createElement('nav'); mobileNav.className = 'drawer-nav';
  fillNavigation(mobileNav);
  drawer.append(closeButton, mobileNav, languageButton('language-drawer'));

  const desktop = window.matchMedia('(min-width: 768px)');
  let previousOverflow = '';
  let background = [];
  const controls = () => [...drawer.querySelectorAll('button, a[href]')];
  const close = (restoreFocus = true) => {
    if (drawer.hidden) return;
    drawer.classList.remove('open');
    drawer.hidden = true;
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('x');
    document.body.style.overflow = previousOverflow;
    background.forEach(([node, wasInert]) => { node.inert = wasInert; });
    background = [];
    if (restoreFocus) (desktop.matches ? home : btn).focus();
  };
  const open = () => {
    if (desktop.matches || !drawer.hidden) return;
    previousOverflow = document.body.style.overflow;
    // Isolate siblings at each ancestor, without hiding the dialog itself.
    for (let node = drawer; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node) {
          background.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
    }
    drawer.hidden = false;
    drawer.inert = false;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('x');
    document.body.style.overflow = 'hidden';
    controls()[0].focus();
  };
  drawer.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key !== 'Tab') return;
    const items = controls(), first = items[0], last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  btn.addEventListener('click', open);
  drawer.querySelector('.drawer-close').addEventListener('click', () => close());
  drawer.addEventListener('click', e => { if (e.target === drawer) close(); });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    close(false);

  }));
  desktop.addEventListener('change', () => { if (desktop.matches) close(); });

  wrap.append(brand, nav, btn);
  header.append(skip, wrap);
  // Keep the fixed dialog outside the glass header’s backdrop containing block.
  document.body.append(drawer);
  return header;
}
