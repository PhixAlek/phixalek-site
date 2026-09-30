import { content, ui, bind, text } from '../../../content/index.js';

export function Hero() {
  const H = content.hero || {};

  const sec  = document.createElement('section');
  sec.className = 'hero';
  sec.id = 'home';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h1 = document.createElement('h1');
  h1.className = 'h1';
  const span = document.createElement('span');
  span.className = 'accent';
  span.textContent = H.name || '';
  const greeting = document.createTextNode(''), ending = document.createTextNode('');
  text(greeting, () => ui.hero.greeting); text(ending, () => ui.hero.ending);
  h1.append(greeting, span, ending);

  const lead = document.createElement('p');
  lead.className = 'lead';
  bind(lead, 'innerHTML', () => highlight(H.subtitle || ''));

  const actions = document.createElement('div');
  actions.className = 'actions';

  if (H.ctaPrimary) {
    const a1 = document.createElement('a');
    a1.className = 'btn';
    a1.href = H.ctaPrimary.href || '#contact';
    text(a1, () => H.ctaPrimary.text);
    actions.appendChild(a1);
  }

  if (H.ctaSecondary) {
    const a2 = document.createElement('a');
    a2.className = 'btn-outline';
    a2.href = H.ctaSecondary.href || '#work';
    text(a2, () => H.ctaSecondary.text);
    actions.appendChild(a2);
  }

  wrap.append(h1, lead, actions);
  sec.appendChild(wrap);
  return sec;
}


// Keep editorial emphasis in JSON and reuse the existing color treatment.
function highlight(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[\[(.+?)\]\]/g, '<span class="em">$1</span>');
}
