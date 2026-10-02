import { motionLetters } from '../js/modules/common/text-motion.js';

// Include navigation and social controls even when their labels do not translate.
export function animateLanguageChange(nodes) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const controls = document.querySelectorAll(
    '.header .nav a, .header .language-toggle, .menu-drawer .drawer-nav a, ' +
    '.menu-drawer .language-toggle, .footer .ft-ico > span, .footer .ft-ico > svg, .footer .ft-back > [aria-hidden]'
  );
  const targets = new Set();
  new Set([...nodes, ...controls]).forEach(node => {
    if (!node.animate || !node.closest('main, .header, .booking-modal, .footer, .menu-drawer')) return;
    if (node.closest('[hidden], [inert], [aria-hidden="true"]') && !node.matches('svg, .ft-back > [aria-hidden]')) return;
    // Decorative icons may be aria-hidden, but their containing control must be visible.
    if (node.parentElement?.closest('[hidden], [inert]')) return;
    const bounds = node.getBoundingClientRect();
    if (!bounds.width || !bounds.height || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
    const letters = node.matches('svg, .ft-back > [aria-hidden]') ? [node] : motionLetters(node);
    letters.forEach(target => targets.add(target));
  });
  // Each control gets the same short wave, without duplicating animations on nested labels.
  const groups = new Map();
  targets.forEach(target => {
    const control = target.closest('a, button') || target.parentElement;
    if (!groups.has(control)) groups.set(control, []);
    groups.get(control).push(target);
  });
  groups.forEach(letters => {
    const stagger = Math.min(18, 300 / Math.max(1, letters.length));
    letters.forEach((target, index) => {
      target.getAnimations().forEach(animation => animation.cancel());
      target.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-4px)', offset: .4 },
        { transform: 'translateY(0)' },
      ], { duration: 560, delay: index * stagger, easing: 'ease-in-out' });
    });
  });
}
