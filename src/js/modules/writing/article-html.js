import createDOMPurify from 'dompurify';
const purifiers = new WeakMap();

// Only inert prose/media is imported. Provider forms, scripts and embeds stay outside the reader.
export function articleFragment(html, view = window) {
  if (!purifiers.has(view)) purifiers.set(view, createDOMPurify(view));
  const fragment = purifiers.get(view).sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's',
      'a', 'img', 'figure', 'figcaption', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
  });
  fragment.querySelectorAll('.subscription-widget-wrap-editor').forEach(node => node.remove());
  fragment.querySelectorAll('[class]').forEach(node => node.removeAttribute('class'));
  fragment.querySelectorAll('a, img').forEach(node => {
    const attribute = node.tagName === 'IMG' ? 'src' : 'href';
    if (!node.hasAttribute(attribute)) return;
    try {
      const url = new URL(node.getAttribute(attribute), 'https://phixalek.substack.com');
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      node.setAttribute(attribute, url.href);
      if (attribute === 'src') { node.loading = 'lazy'; node.decoding = 'async'; }
      else { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    } catch { node.removeAttribute(attribute); }
  });
  return fragment;
}
