import content from '../../../data/content.json' assert { type: 'json' };

export function Hero() {
  const H = content.hero || {};

  const sec  = document.createElement('section');
  sec.className = 'hero';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h1 = document.createElement('h1');
  h1.className = 'h1';
  const span = document.createElement('span');
  span.className = 'accent';
  span.textContent = H.name || '';
  h1.append('Hello, I\'m ', span, '.');

  const lead = document.createElement('p');
  lead.className = 'lead';
  lead.textContent = H.subtitle || '';

  const actions = document.createElement('div');
  actions.className = 'actions';

  if (H.ctaPrimary) {
    const a1 = document.createElement('a');
    a1.className = 'btn';
    a1.href = H.ctaPrimary.href || '#contact';
    a1.textContent = H.ctaPrimary.text || 'Get in touch';
    actions.appendChild(a1);
  }

  if (H.ctaSecondary) {
    const a2 = document.createElement('a');
    a2.className = 'btn-outline';
    a2.href = H.ctaSecondary.href || '#work';
    a2.textContent = H.ctaSecondary.text || 'See projects';
    actions.appendChild(a2);
  }

  wrap.append(h1, lead, actions);
  sec.appendChild(wrap);
  return sec;
}

