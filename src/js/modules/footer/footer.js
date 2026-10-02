import { content, ui, bind, text, languageButton } from '../../../content/index.js';

const ICONS = {
  substack: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 2h18v2H3zm0 5h18v2H3zm0 5h18v11l-9-5-9 5z"/></svg>`,
  hackerrank: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 1 2 6v12l10 5 10-5V6z"/><path fill="var(--panel)" d="M8 6h2v5h4V6h2v12h-2v-5h-4v5H8z"/></svg>`,
  github:  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.24 3.4 9.68 8.12 11.25.6.1.82-.26.82-.58v-2.1c-3.3.73-4-1.42-4-1.42-.55-1.4-1.35-1.78-1.35-1.78-1.1-.77.08-.75.08-.75 1.22.09 1.86 1.27 1.86 1.27 1.08 1.86 2.82 1.32 3.5 1.01.11-.8.42-1.32.76-1.63-2.64-.3-5.42-1.36-5.42-6.05 0-1.34.46-2.43 1.22-3.29-.12-.3-.53-1.52.11-3.17 0 0 1-.33 3.3 1.25a11.2 11.2 0 0 1 6 0c2.3-1.58 3.3-1.25 3.3-1.25.64 1.65.23 2.87.11 3.17.76.86 1.22 1.95 1.22 3.29 0 4.7-2.78 5.74-5.43 6.04.43.38.81 1.12.81 2.26v3.35c0 .32.21.69.83.57a11.52 11.52 0 0 0 8.1-11.24A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  linkedin:`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.6c0-1.34-.02-3.06-1.87-3.06-1.88 0-2.17 1.47-2.17 2.97v5.69H9.3V9.56h3.41v1.49h.05c.47-.89 1.62-1.82 3.33-1.82 3.56 0 4.21 2.34 4.21 5.4v5.82ZM5.34 8.07a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9.56h3.56v10.89Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M23.5 7.1a4.6 4.6 0 0 0-3.2-3.2C18.5 3.3 12 3.3 12 3.3s-6.6 0-8.3.6a4.6 4.6 0 0 0-3.2 3.2C0 8.9 0 12 0 12s0 3.1.5 4.9a4.6 4.6 0 0 0 3.2 3.2c1.7.6 8.3.6 8.3.6s6.5 0 8.3-.6a4.6 4.6 0 0 0 3.2-3.2c.5-1.8.5-4.9.5-4.9s0-3.1-.5-4.9ZM9.6 15.5V8.5L15.8 12l-6.2 3.5Z"/></svg>`,
};

export function Footer(){
  const { footer: data } = content;

  const el = document.createElement('footer');
  el.className = 'footer';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const back = document.createElement('a');
  back.className = 'ft-back';
  back.href = '#home';
  const arrow = document.createElement('span');
  arrow.textContent = '↑';
  arrow.setAttribute('aria-hidden', 'true');
  const backLabel = document.createElement('span');
  text(backLabel, () => ui.footer.backToTop);
  back.append(arrow, backLabel);

  const copyright = document.createElement('span');
  copyright.className = 'ft-copy';
  text(copyright, () => `© ${new Date().getFullYear()} ${content.hero.name}`);
  const language = languageButton('language-footer');

  // fila 2: redes sociales
  const social = document.createElement('nav');
  social.className = 'ft-social';
  bind(social, 'attr:aria-label', () => ui.footer.social);
  (data.social || []).forEach(s => {
    const a = document.createElement('a');
    a.className = 'ft-ico';
    a.dataset.profile = s.icon;
    a.href = s.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.ariaLabel = s.name;
    a.innerHTML = ICONS[s.icon] || '';
    const label = document.createElement('span');
    label.textContent = s.name;
    a.append(label);
    social.appendChild(a);
  });

  // Keep visual, reading and keyboard order aligned at each breakpoint.
  const profiles = [...social.children];
  const mobile = window.matchMedia('(max-width: 767px)');
  const priority = ['github', 'linkedin', 'substack', 'youtube', 'hackerrank'];
  const arrange = () => {
    const ordered = mobile.matches
      ? [...profiles].sort((a, b) => priority.indexOf(a.dataset.profile) - priority.indexOf(b.dataset.profile))
      : profiles;
    social.append(...ordered);
    wrap.append(...(mobile.matches
      ? [language, back, social, copyright]
      : [language, social, back, copyright]));
  };
  arrange();
  mobile.addEventListener('change', arrange);
  el.appendChild(wrap);
  return el;
}
