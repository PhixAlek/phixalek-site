// src/js/modules/main/index.js
import { Hero } from './hero.js';
import { About } from './about.js';
import { Projects } from './projects.js';
import { Contact } from './contact.js';

export function Main(){
  const main = document.createElement('main');
  main.id = 'home';
  main.className = 'site';
  main.style.position = 'relative';

  // helper: centra y limita ancho SIN tocar tu contenido
  const wrapInContainer = (section) => {
    const wrap = document.createElement('div');
    wrap.className = 'container';
    while (section.firstChild) wrap.appendChild(section.firstChild);
    section.appendChild(wrap);
    return section;
  };

  // capa orbes
  const orbs = document.createElement('div');
  orbs.id = 'orbs';
  orbs.setAttribute('aria-hidden','true');
  main.prepend(orbs);

  // --- Hero ---
  const hero    = Hero();

  // --- About ---
  const about   = About();

  // --- Projects (DINÁMICO via módulo) ---
  const work = Projects();   // ← AQUÍ usas el módulo que carga images.json/content.json

  // --- Contact ---
  const contact = Contact();

  // envuelve cada sección en .container
  wrapInContainer(hero);
  wrapInContainer(about);
  wrapInContainer(work);     // ← también al Projects dinámico
  wrapInContainer(contact);

  main.append(hero, about, work, contact);
  return main;
}
