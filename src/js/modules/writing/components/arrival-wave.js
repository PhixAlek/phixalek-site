import { motionLetters } from '../../common/text-motion.js';

/** Reuse the site letter wave once the destination has arrived, with disposable listeners. */
export function mountWritingArrivalWave(page, { doc = document, view = window } = {}) {
  const arrive = () => {
    if (!page.isConnected || page.hidden || view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const title = page.querySelector('.editorial-intro h1, .editorial-story h1');
    if (!title) return;
    const letters = motionLetters(title);
    const step = Math.min(18, 400 / Math.max(1, letters.length));
    letters.forEach((letter, index) => {
      if (!letter.animate) return;
      letter.getAnimations().forEach(animation => animation.cancel());
      letter.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: .4 }, { transform: 'translateY(0)' }],
        { duration: 560, delay: index * step, easing: 'ease-in-out' });
    });
  };
  doc.addEventListener('site:writing-arrived', arrive);
  return () => {
    doc.removeEventListener('site:writing-arrived', arrive);
    page.querySelectorAll('.language-wave-letter').forEach(letter => letter.getAnimations?.().forEach(animation => animation.cancel()));
  };
}
