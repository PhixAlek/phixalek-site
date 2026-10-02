// Animate presentation only; field values and submission remain untouched.
export function createFormReveal(fields, finalText) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map();
  const cancel = () => {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  [...fields, finalText].forEach(field => {
    const reveal = () => { animations.get(field)?.cancel(); animations.delete(field); };
    field.addEventListener('focus', reveal);
    field.addEventListener('input', reveal);
  });
  preference.addEventListener('change', event => { if (event.matches) cancel(); });
  return open => {
    cancel();
    if (!open || preference.matches) return;
    const duration = 220, step = 100, opening = 120;
    [...fields, finalText].forEach((node, index) => {
      if (!node.animate) return;
      const delay = node === finalText
        ? opening + (fields.length - 1) * step + duration + 400
        : opening + index * step;
      const animation = node.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' },
      ], { duration, delay, easing: 'ease-out', fill: 'backwards' });
      animations.set(node, animation);
    });
  };
}
