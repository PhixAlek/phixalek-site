import { importArticleBody } from '../../../shared/writing/article-body.js';

export function articleFragment(html, view = window, sourceUrl) {
  const result = importArticleBody(html, { view, sourceUrl });
  const template = view.document.createElement('template');
  template.innerHTML = result.html;
  return template.content;
}
