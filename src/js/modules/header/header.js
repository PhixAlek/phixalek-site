// src/js/modules/header/header.js
export function Header(){
  const header = document.createElement('header');
  header.className = 'header';

  const wrap = document.createElement('div');
  wrap.className = 'container row between center';

  // Brand como H1 (SEO). Si prefieres evitar 2 H1, baja el hero a <h2>.
  const brand = document.createElement('h1');
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
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label','Open menu');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `<span class="burger" aria-hidden="true"></span>`;

  // Drawer overlay
  const drawer = document.createElement('aside');
  drawer.className = 'menu-drawer';
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

  // Toggle
  const open = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
    btn.classList.add('x');
  };
  const close = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    btn.classList.remove('x');
  };

  btn.addEventListener('click', ()=> drawer.classList.contains('open') ? close() : open());
  drawer.querySelector('.drawer-close').addEventListener('click', close);
  drawer.addEventListener('click', (e)=> {
    if(e.target === drawer) close(); // click en backdrop cierra
  });
  drawer.querySelectorAll('a').forEach(a=> a.addEventListener('click', close));

  wrap.append(brand, nav, btn);
  header.append(wrap, drawer);
  return header;
}
