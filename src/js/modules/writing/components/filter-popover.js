/** Compact, non-modal filter panel with native buttons and no duplicated taxonomy. */
export function mountFilterPopover(wrapper, trigger, panel, { doc = document } = {}) {
  const buttons = () => [...panel.querySelectorAll('button')];
  panel.hidden = true;
  trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
  const close = (restoreFocus = false) => {
    const wasOpen = !panel.hidden;
    panel.hidden = true; trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && wasOpen) trigger.focus();
  };
  const open = () => {
    panel.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    panel.style.setProperty('--filter-panel-shift', '0px');
    const rect = panel.getBoundingClientRect(), width = doc.defaultView?.innerWidth;
    if (rect.width && width) {
      const shift = rect.left < 16 ? 16 - rect.left : rect.right > width - 16 ? width - 16 - rect.right : 0;
      panel.style.setProperty('--filter-panel-shift', `${shift}px`);
    }
    (buttons().find(button => button.getAttribute('aria-pressed') === 'true') || buttons()[0])?.focus({ preventScroll: true });
    const reducedMotion = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  };
  const toggle = () => { if (panel.hidden) open(); else close(true); };
  const outside = event => { if (!wrapper.contains(event.target)) close(); };
  const keys = event => {
    if (panel.hidden && event.target === trigger && event.key === 'ArrowDown') { event.preventDefault(); open(); return; }
    if (panel.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (!panel.contains(event.target) || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const rows = buttons(), index = rows.indexOf(doc.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
    rows[next]?.focus();
  };
  trigger.addEventListener('click', toggle);
  wrapper.addEventListener('keydown', keys);
  doc.addEventListener('pointerdown', outside);
  doc.addEventListener('focusin', outside);
  return { close, dispose() {
    close(); trigger.removeEventListener('click', toggle); wrapper.removeEventListener('keydown', keys);
    doc.removeEventListener('pointerdown', outside); doc.removeEventListener('focusin', outside);
  } };
}


/** Move existing controls between the row and panel when the layout changes. */
export function placeFilterButtons(row, panel, overflow, buttons, primaryCount) {
  buttons.forEach((button, index) => {
    if (index >= primaryCount) panel.append(button);
    else row.insertBefore(button, overflow.parentElement === row ? overflow : null);
  });
  if (buttons.length > primaryCount) row.append(overflow);
  else overflow.remove();
}
