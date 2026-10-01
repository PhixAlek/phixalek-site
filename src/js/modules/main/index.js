// src/js/modules/main/index.js
import { Hero } from './hero.js';
import { About } from './about.js';
import { Projects } from './projects.js';
import { Evidence } from './evidence.js';
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

  const evidence = Evidence();
  main.append(hero, work);
  if (evidence) main.append(evidence);
  main.append(about, contact);
  return main;
}
