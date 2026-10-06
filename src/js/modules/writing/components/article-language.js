import { articleLanguage } from '../../../../shared/writing/model.js';

// This describes the article, independently of the UI's language toggle.
export function ArticleLanguage(language, doc = document) {
  const code = articleLanguage(language);
  if (!code) return null;
  const label = doc.createElement('span');
  label.className = 'article-language';
  label.lang = code;
  label.textContent = code.toUpperCase();
  return label;
}
