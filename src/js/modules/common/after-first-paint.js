// Two frames let the mounted page paint before starting optional network work.
export function afterFirstPaint(callback, view = window) {
  if (typeof view.requestAnimationFrame === 'function') {
    view.requestAnimationFrame(() => view.requestAnimationFrame(callback));
  } else {
    view.setTimeout(callback, 0);
  }
}
