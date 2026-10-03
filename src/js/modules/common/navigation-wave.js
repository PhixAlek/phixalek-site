import { bind } from '../../../content/index.js';

const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A brief navigation cue, after arrival, without changing native anchors.
export function mountNavigationWave(node, section, getText, { after, hover = false } = {}) {
  const render = () => `<span aria-hidden="true">${getText().split(/(\s+)/).map(word =>
    /\s/.test(word) ? escape(word) : `<span class="navigation-wave-word">${[...word].map(letter =>
      `<span class="navigation-wave-letter">${escape(letter)}</span>`
    ).join('')}</span>`
  ).join('')}</span>`;
  const refreshText = () => {
    bind(node, 'attr:aria-label', getText);
    bind(node, 'innerHTML', render);
  };
  refreshText();
  const wave = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = [...node.querySelectorAll('.navigation-wave-letter')];
    const stagger = Math.min(18, 400 / Math.max(1, letters.length));
    const precedingLetters = after?.querySelectorAll('.navigation-wave-letter').length || 0;
    const startDelay = precedingLetters
      ? 560 + (precedingLetters - 1) * Math.min(18, 400 / precedingLetters) + 80
      : 0;
    letters.forEach((letter, index) => {
      if (!letter.animate) return;
      letter.getAnimations().forEach(animation => animation.cancel());
      letter.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-4px)', offset: .4 },
        { transform: 'translateY(0)' },
      ], { duration: 560, delay: startDelay + index * stagger, easing: 'ease-in-out' });
    });
  };
  if (hover) {
    const trigger = hover === true ? node : hover;
    trigger.addEventListener('pointerenter', wave);
    trigger.addEventListener('focus', wave);
  }
  let pendingWave = 0;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    cancelAnimationFrame(pendingWave);
    if (link.hash !== `#${section.id}`) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const inset = document.querySelector('.header')?.getBoundingClientRect().height || 0;
    const bounds = node.getBoundingClientRect();
    if (bounds.top >= inset && bounds.bottom <= window.innerHeight) {
      wave();
    } else {
      // Visibility alone is not arrival: wait for the native anchor scroll to settle.
      const started = performance.now();
      let previousY = window.scrollY, stableFrames = 0;
      const waitForArrival = () => {
        pendingWave = 0;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || performance.now() - started > 4000) return;
        const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const destination = Math.max(0, Math.min(maximum, section.getBoundingClientRect().top + window.scrollY - margin));
        const current = node.getBoundingClientRect();
        const visible = current.top >= inset && current.bottom <= window.innerHeight;
        const arrived = Math.abs(window.scrollY - destination) <= 2;
        stableFrames = arrived && visible && Math.abs(window.scrollY - previousY) < .5 ? stableFrames + 1 : 0;
        previousY = window.scrollY;
        if (stableFrames >= 3) wave();
        else pendingWave = requestAnimationFrame(waitForArrival);
      };
      pendingWave = requestAnimationFrame(waitForArrival);
    }
  });
  return refreshText;
}
