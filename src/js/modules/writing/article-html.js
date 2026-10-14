import { importArticleBody } from '../../../shared/writing/article-body.js';

export function articleFragment(html, view = window, sourceUrl, { labelImageLink = node => node.setAttribute('aria-label', 'Open image in a new tab') } = {}) {
  const result = importArticleBody(html, { view, sourceUrl });
  const template = view.document.createElement('template');
  template.innerHTML = result.html;
  // An empty image alt is valid for decoration, but must not leave a clickable image unnamed.
  template.content.querySelectorAll('a[href]').forEach(link => {
    if (!link.textContent.trim() && link.querySelector('img') &&
      ![...link.querySelectorAll('img')].some(image => image.alt?.trim())) labelImageLink(link);
  });
  return template.content;
}
