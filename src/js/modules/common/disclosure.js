// Keep interrupted transitions from hiding a panel that was reopened.
export function createDisclosure(panel, {
  view = window,
  onStart = () => {},
  onFinish = () => {},
  frames,
} = {}) {
  let animation, revision = 0;
  return async function setOpen(open) {
    const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    const currentOpacity = panel.hidden ? 0 : Number(view.getComputedStyle(panel).opacity);
    const version = ++revision;
    animation?.cancel();
    panel.hidden = false;
    panel.inert = !open;
    onStart(open);
    if (panel.animate && !view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation = panel.animate(frames ? frames(open) : [
        { height: `${currentHeight}px`, opacity: currentOpacity, overflow: 'clip' },
        { height: `${open ? panel.scrollHeight : 0}px`, opacity: open ? 1 : 0, overflow: 'clip' },
      ], { duration: open ? 420 : 260, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
      try { await animation.finished; } catch { return; }
    }
    if (version !== revision) return;
    animation?.cancel();
    animation = undefined;
    panel.hidden = !open;
    onFinish(open);
  };
}
