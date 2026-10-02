// Keep the readable text and inline emphasis; animate a decorative copy.
export function motionLetters(root) {
  const existing = [...root.querySelectorAll('.navigation-wave-letter, .language-wave-letter')];
  if (existing.length) return existing;
  const visit = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3 && child.textContent.trim()) {
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        child.textContent.split(/(\s+)/).forEach(word => {
          if (/^\s+$/.test(word)) { visual.append(document.createTextNode(word)); return; }
          const group = document.createElement('span');
          group.className = 'navigation-wave-word';
          [...word].forEach(character => {
            const letter = document.createElement('span');
            letter.className = 'language-wave-letter';
            letter.textContent = character;
            group.append(letter);
          });
          visual.append(group);
        });
        const readable = document.createElement('span');
        readable.className = 'visually-hidden';
        readable.textContent = child.textContent;
        child.replaceWith(readable, visual);
      } else if (child.nodeType === 1 && !child.matches('.visually-hidden, svg, input, textarea')) visit(child);
    });
  };
  visit(root);
  return [...root.querySelectorAll('.language-wave-letter')];
}

export function revealAboutLines(root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const letters = reduce ? [] : motionLetters(root);
  letters.forEach(letter => letter.getAnimations().forEach(animation => animation.cancel()));
  const markers = [...root.querySelectorAll('.about-list-marker')];
  markers.forEach(marker => marker.getAnimations().forEach(animation => animation.cancel()));
  // Prepare the hidden line animation before the browser can paint the full text.
  if (!reduce) root.style.visibility = 'hidden';
  const header = document.querySelector('.header')?.getBoundingClientRect().height || 0;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const start = mobile ? root.closest('.about-details')?.querySelector('summary') || root : root;
  const destination = Math.max(0, Math.min(maximum, start.getBoundingClientRect().top + window.scrollY - header - 24));
  window.scrollTo({ top: destination, behavior: 'instant' });
  if (reduce) return;
  const tops = letters.map(letter => Math.round(letter.getBoundingClientRect().top));
  const rows = [...new Set(tops)].sort((a,b) => a-b);
  const step = Math.min(65, 600 / Math.max(1, rows.length));
  letters.forEach((letter, index) => {
    letter.animate([{ opacity:0, transform:'translateY(5px)' }, { opacity:1, transform:'none' }],
      { duration:260, delay:rows.indexOf(tops[index]) * step, easing:'ease-out', fill:'backwards' });
  });
  markers.forEach(marker => {
    const first = marker.parentElement.querySelector('.language-wave-letter');
    if (!first) return;
    const index = letters.indexOf(first);
    marker.animate([{ opacity:0 }, { opacity:1 }],
      { duration:260, delay:rows.indexOf(tops[index]) * step, easing:'ease-out', fill:'backwards' });
  });
  root.style.visibility = '';
}
