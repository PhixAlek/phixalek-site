import { mountNavigationWave } from '../common/navigation-wave.js';
import { content, ui, bind } from '../../../content/index.js';
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
  mountNavigationWave(h1, sec, () => `${ui.hero.greeting}${H.name || ''}${ui.hero.ending}`);
  if (H.avatarId) {
    const portrait = document.createElement('span');
    portrait.className = 'hero-avatar';
    wrap.append(portrait);
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
  mountNavigationWave(label, sec, () => H.ctaSecondary.text, { hover: transition });
  const arrow = document.createElement('span');
  arrow.className = 'hero-projects-arrow'; arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  transition.append(label, arrow);
  const introduction = document.createElement('div');
  introduction.className = 'hero-introduction';
  const portrait = wrap.querySelector('.hero-avatar');
  if (portrait) introduction.append(portrait);
  introduction.append(h1, lead);
  wrap.append(introduction, transition);
  sec.appendChild(wrap);
  return sec;
}


// Keep editorial emphasis in JSON and reuse the existing color treatment.
function highlight(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[\[complement:(.+?)\]\]/g, '<strong class="em em-complement">$1</strong>')
    .replace(/\[\[(.+?)\]\]/g, '<strong class="em">$1</strong>');
}
