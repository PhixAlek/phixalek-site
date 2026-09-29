// src/js/modules/main/about.js
import { content, bind, text } from '../../../content/index.js';

export function About(){
  const A = content.about || {};

  const sec  = document.createElement('section');
  sec.id = 'about';
  sec.className = 'section';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const box = document.createElement('div');
  box.className = 'about-copy';

  // Eyebrow opcional
  if (A.eyebrow){
    const k = document.createElement('span');
    k.className = 'about-eyebrow';
    text(k, () => A.eyebrow);
    box.appendChild(k);
  }

  // Título
  const h2 = document.createElement('h2');
  h2.className = 'about-title';
  text(h2, () => A.title);
  box.appendChild(h2);

  // Lede con énfasis [[..]] y ((..))
  if (A.lead){
    const lede = document.createElement('p');
    lede.className = 'about-lede';
    bind(lede, 'innerHTML', () => transformInline(A.lead));
    box.appendChild(lede);
  }

  // Cuerpo: admite saltos dobles para nuevos párrafos
  if (A.body){
    const body = document.createElement('div');
    body.className = 'about-body';
    splitParagraphs(A.body).forEach((html, i) => {
      const p = document.createElement('p');
      bind(p, 'innerHTML', () => transformInline(splitParagraphs(A.body)[i]));
      body.appendChild(p);
    });
    box.appendChild(body);
  }

  // Lista de bullets (si la mantienes)
  if (A.bullets?.length){
    const list = document.createElement('ul');
    list.className = 'about-list';
    A.bullets.forEach((t, i) => {
      const li = document.createElement('li');
      bind(li, 'innerHTML', () => transformInline(A.bullets[i]));
      list.appendChild(li);
    });
    box.appendChild(list);
  }

  wrap.appendChild(box);
  sec.appendChild(wrap);
  return sec;
}

// --- helpers ---
function splitParagraphs(text){
  // divide por línea en blanco (doble salto) o '---'
  return text.trim().split(/\n\s*\n|^\s*---\s*$/m).map(s => s.trim()).filter(Boolean);
}
function transformInline(s=''){
  // [[em]] degradado, ((dim)) tenue, **bold**, *italic*
  return s
    .replace(/\[\[(.+?)\]\]/g, '<span class="em">$1</span>')
    .replace(/\(\((.+?)\)\)/g, '<span class="dim">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // enlaces en JSON como [texto](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
