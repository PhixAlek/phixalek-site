// src/js/modules/main/index.js
import { Hero } from './hero.js';
import { About } from './about.js';
import { Projects } from './projects.js';
import { Contact } from './contact.js';

export function Main(){
  const main = document.createElement('main');
  main.id = 'main-content';
  main.className = 'site';
  // --- Hero ---
  const hero    = Hero();

  // --- About ---
  const about   = About();

  // --- Projects (DINÁMICO via módulo) ---
  const work = Projects();   // ← AQUÍ usas el módulo que carga images.json/content.json

  // --- Contact ---
  const contact = Contact();

  main.append(hero, about, work, contact);
  return main;
}
