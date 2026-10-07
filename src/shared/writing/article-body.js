import createDOMPurify from 'dompurify';
import { PUBLICATION } from './config.js';
const purifiers = new WeakMap();
const blocked = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'template', 'noscript'];
const widgetSelectors = '.subscription-widget-wrap-editor, .subscription-widget, [data-component-name="SubscribeWidgetToDOM"], [data-component-name="ButtonToDOM"], [data-component-name="EmbedToDOM"]';

export function contentURL(value, base = PUBLICATION, { image = false } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > 8192) return null;
  try {
    const url = new URL(value, base);
    if (url.username || url.password || !['https:', ...(image ? [] : ['mailto:'])].includes(url.protocol)) return null;
    return url.href;
  } catch { return null; }
}

function plainText(root) {
  const blocks = new Set(['P', 'DIV', 'BR', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE', 'TR']);
  const visit = node => node.nodeType === 3 ? node.textContent
    : [...node.childNodes].map(child => `${blocks.has(child.nodeName) ? '\n' : ''}${visit(child)}${blocks.has(child.nodeName) ? '\n' : ''}`).join('');
  return visit(root).replace(/\s+/g, ' ').trim();
}

/** Clean once at import, and again at rendering: cached content is never implicitly trusted. */
export function importArticleBody(html, { view = globalThis.window, sourceUrl = PUBLICATION } = {}) {
  if (typeof html !== 'string' || !view?.document) throw new TypeError('Article HTML and a DOM are required');
  if (!purifiers.has(view)) purifiers.set(view, createDOMPurify(view));
  const fragment = purifiers.get(view).sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup',
      'a', 'img', 'figure', 'figcaption', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'scope', 'start', 'reversed', 'type', 'width', 'height', 'data-attrs', 'data-component-name'],
    FORBID_TAGS: blocked, FORBID_CONTENTS: blocked,
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
  });
  const widgets = [];
  // Select outer wrappers only so a nested subscription widget becomes one record.
  const wrappers = [...fragment.querySelectorAll(widgetSelectors)].filter(node => !node.parentElement?.closest(widgetSelectors));
  for (const node of wrappers) {
    const component = node.getAttribute('data-component-name') || '';
    const kind = component === 'EmbedToDOM' ? 'embed' : component === 'ButtonToDOM' ? 'action' : 'subscribe';
    let attrs;
    try { attrs = JSON.parse(node.getAttribute('data-attrs') || '{}'); } catch { attrs = {}; }
    let url = contentURL(attrs?.url || node.querySelector('a[href]')?.getAttribute('href'), sourceUrl);
    if (kind === 'subscribe' && url && new URL(url).origin !== PUBLICATION) url = null;
    widgets.push({ kind, url, label: (typeof attrs?.text === 'string' ? attrs.text.trim() : plainText(node)).slice(0, 200) });
    node.remove();
  }
  fragment.querySelectorAll('[class], [data-attrs], [data-component-name]').forEach(node => {
    node.removeAttribute('class'); node.removeAttribute('data-attrs'); node.removeAttribute('data-component-name');
  });
  const anchors = new Map();
  fragment.querySelectorAll('[id]').forEach((node, index) => {
    const original = node.id;
    // Stable per-article namespace prevents imported IDs from clobbering the site shell.
    node.id = `article-anchor-${index + 1}`;
    if (!anchors.has(original)) anchors.set(original, node.id);
  });
  fragment.querySelectorAll('a, img').forEach(node => {
    const image = node.tagName === 'IMG', attribute = image ? 'src' : 'href';
    const raw = node.getAttribute(attribute);
    if (raw === null) return;
    if (!image && raw.startsWith('#')) {
      let original;
      try { original = decodeURIComponent(raw.slice(1)); } catch { original = raw.slice(1); }
      if (anchors.has(original)) { node.setAttribute('href', `#${anchors.get(original)}`); return; }
    }
    const url = contentURL(raw, sourceUrl, { image });
    if (!url) { node.removeAttribute(attribute); return; }
    node.setAttribute(attribute, url);
    if (image) { node.setAttribute('loading', 'lazy'); node.setAttribute('decoding', 'async'); }
    else if (new URL(url).protocol === 'https:') { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  });
  fragment.querySelectorAll('[colspan], [rowspan], [width], [height]').forEach(node => {
    for (const attr of ['colspan', 'rowspan', 'width', 'height']) {
      const value = node.getAttribute(attr);
      if (value !== null && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 10000)) node.removeAttribute(attr);
    }
  });
  const container = view.document.createElement('div'); container.append(fragment);
  return { html: container.innerHTML, text: plainText(container), widgets };
}
