/** Split only the decorative title at a word boundary; never shorten source text. */
export function splitTitleLines(title, measure = value => value.length) {
  let split = -1, best = Infinity;
  for (const match of title.matchAll(/\s+/gu)) {
    const left = title.slice(0, match.index), right = title.slice(match.index + match[0].length);
    if (!left || !right) continue;
    const first = measure(left), second = measure(right);
    if (first >= second) continue;
    const score = Math.abs(first / second - .7);
    if (score < best) { best = score; split = match.index; }
  }
  if (split < 0) split = title.search(/\s/u);
  return split < 0 ? [title, '', ''] : [title.slice(0, split), title.slice(split).match(/^\s+/u)[0], title.slice(split).replace(/^\s+/u, '')];
}

export function createTitleLines(title, doc) {
  let measure;
  if (doc.defaultView?.CanvasRenderingContext2D) {
    const context = doc.createElement('canvas').getContext('2d');
    if (context) {
      const family = doc.defaultView.getComputedStyle(doc.documentElement).getPropertyValue('--font-ui').trim() || 'Nunito, sans-serif';
      context.font = `700 23px ${family}`;
      measure = value => context.measureText(value).width;
    }
  }
  const [first, space, second] = splitTitleLines(title, measure);
  const top = doc.createElement('span'), bottom = doc.createElement('span');
  top.className = 'editorial-title-line editorial-title-line-first'; top.textContent = first;
  bottom.className = 'editorial-title-line'; bottom.textContent = second;
  return [top, doc.createTextNode(space), bottom];
}
