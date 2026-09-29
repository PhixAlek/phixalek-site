// src/js/modules/header/header.js
export function Header(){
  const header = document.createElement('header');
  header.className = 'header';

  const wrap = document.createElement('div');
  wrap.className = 'container row between center';

  // The page heading belongs to the hero.
  const brand = document.createElement('div');
  brand.className = 'brand';
  const home = document.createElement('a');
  home.href = '#home';
  home.textContent = 'Phixalek';
  brand.appendChild(home);

  // Nav desktop
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="#home">Home</a>
    <a href="#about"><strong>About</strong></a>
    <a href="#work"><strong>Projects</strong></a>
    <a href="#contact"><strong>Contact</strong></a>
  `;

  // Burger
  const btn = document.createElement('button');
  btn.id = 'nav-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'mobile-menu');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label','Open menu');
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
  drawer.setAttribute('aria-label', 'Navigation');
  drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML = `
    <button class="drawer-close" aria-label="Close menu"></button>
    <nav class="drawer-nav">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#work">Projects</a>
      <a href="#contact">Contact</a>
    </nav>
  `;

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
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  }));
  desktop.addEventListener('change', () => { if (desktop.matches) close(); });

  wrap.append(brand, nav, btn);
  header.append(wrap, drawer);
  return header;
}
