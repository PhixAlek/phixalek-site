// Defer page cues until scrolling has stopped; superseded navigation never fires them.
export function afterScrollArrival(view, isCurrent = () => true) {
  if (!view.requestAnimationFrame) return Promise.resolve(isCurrent());
  return new Promise(resolve => {
    let previousY = view.scrollY, stable = 0, frames = 0;
    const tick = () => {
      if (!isCurrent()) { resolve(false); return; }
      stable = Math.abs(view.scrollY - previousY) < .5 ? stable + 1 : 0;
      previousY = view.scrollY;
      if (stable >= 4) { resolve(true); return; }
      if (++frames > 240) { resolve(false); return; }
      view.requestAnimationFrame(tick);
    };
    view.requestAnimationFrame(tick);
  });
}
