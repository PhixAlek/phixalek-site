import { content, ui, bind, text } from '../../../content/index.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';

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
  const identity = document.createElement('span');
  identity.className = 'hero-identity';
  if (H.avatarId) {
    const portrait = document.createElement('span');
    portrait.className = 'hero-avatar';
    identity.append(portrait);
    loadImageRegistry().then(registry => {
      const image = resolveImage(registry, H.avatarId);
      if (!image?.src || !image.staticSrc) { portrait.remove(); return; }
      const picture = document.createElement('picture');
      const animation = document.createElement('source');
      animation.media = '(prefers-reduced-motion: no-preference)';
      animation.srcset = image.src;
      animation.type = 'image/gif';
      const still = document.createElement('img');
      still.src = registry.base + image.staticSrc;
      still.width = image.width; still.height = image.height;
      still.alt = ''; still.setAttribute('aria-hidden', 'true');
      still.decoding = 'async';
      picture.append(animation, still); portrait.append(picture);
    }).catch(() => portrait.remove());
  }
  span.append(ending);
  identity.append(span);
  h1.append(greeting, identity);

  const lead = document.createElement('p');
  lead.className = 'lead';
  bind(lead, 'innerHTML', () => {
    const subtitle = H.subtitle || '';
    const emphasis = subtitle.indexOf('[[');
    if (emphasis < 0) return highlight(subtitle);
    return `<span class="hero-description">${highlight(subtitle.slice(0, emphasis))}</span><span class="hero-technologies">${highlight(subtitle.slice(emphasis))}</span>`;
  });

  // One transition into work; contact remains available in the header.
  const transition = document.createElement('a');
  transition.className = 'hero-projects';
  bind(transition, 'attr:href', () => H.ctaSecondary.href);
  const label = document.createElement('span');
  text(label, () => H.ctaSecondary.text);
  const arrow = document.createElement('span');
  arrow.className = 'hero-projects-arrow'; arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  transition.append(label, arrow);
  const introduction = document.createElement('div');
  introduction.className = 'hero-introduction';
  introduction.append(h1, lead);
  wrap.append(introduction, transition);
  sec.appendChild(wrap);
  return sec;
}


// Keep editorial emphasis in JSON and reuse the existing color treatment.
function highlight(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[\[(.+?)\]\]/g, '<span class="em">$1</span>');
}
