import { contentURL } from './content-url.js';

const wrappers = new Set(['DIV', 'P', 'SPAN', 'A', 'FIGURE', 'PICTURE']);
const empty = node => node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())
  || (node.nodeType === 1 && (['BR', 'SOURCE'].includes(node.tagName) || (wrappers.has(node.tagName) && !node.textContent.trim() && !node.querySelector('img,hr'))));

/** Only an opening image block qualifies; prose, headings and dividers are boundaries. */
export function openingImage(root) {
  const first = [...root.childNodes].find(node => !empty(node));
  if (!first || first.nodeType !== 1) return null;
  if (first.tagName === 'IMG') return first;
  return wrappers.has(first.tagName) ? openingImage(first) : null;
}

export function responsiveSources(value, base) {
  if (!value || value.length > 32768) return [];
  // Descriptors delimit candidates, so commas inside Substack CDN URLs stay intact.
  return [...value.matchAll(/(\S+)\s+(\d+(?:\.\d+)?)([wx])(?:\s*,\s*|$)/g)].flatMap(([, source, size, unit]) => {
    const url = contentURL(source, base, { image: true });
    return url && Number(size) > 0 ? [{ url, size: Number(size), unit }] : [];
  });
}

const imageBlock = node => node.nodeType === 8 || (node.nodeType === 3 ? !node.textContent.trim()
  : node.nodeType === 1 && (['IMG', 'FIGCAPTION', 'SOURCE', 'BR'].includes(node.tagName)
    || wrappers.has(node.tagName) && [...node.childNodes].every(imageBlock)));

export function coverCandidate(root, base, preferred = null) {
  const image = openingImage(root);
  if (!image) return null;
  const figure = image.closest('figure');
  if (figure && (figure.querySelectorAll('img').length !== 1 || !imageBlock(figure))) return null;
  let original;
  try {
    const attrs = JSON.parse(image.closest('[data-attrs]')?.getAttribute('data-attrs') || '{}');
    original = contentURL(attrs.src || attrs.original_src, base, { image: true });
  } catch { /* Optional provider metadata is not required. */ }
  const anchor = contentURL(image.closest('a')?.getAttribute('href'), base, { image: true });
  const fullLink = anchor && (/\.(?:png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(anchor) || new URL(anchor).hostname === 'substackcdn.com') ? anchor : null;
  const candidates = [...responsiveSources(image.getAttribute('srcset'), base),
    ...[...(image.closest('picture')?.querySelectorAll('source') || [])].flatMap(node => responsiveSources(node.getAttribute('srcset'), base))];
  const widths = candidates.filter(item => item.unit === 'w');
  const best = (widths.length ? widths : candidates).sort((a, b) => b.size - a.size)[0]?.url;
  const current = contentURL(image.getAttribute('src'), base, { image: true });
  const stable = preferred && preferred === current ? current : null;
  const src = stable || original || best || fullLink || contentURL(image.getAttribute('src') || image.getAttribute('data-src'), base, { image: true });
  return src ? { image, block: figure || image.closest('picture') || image, src } : null;
}
