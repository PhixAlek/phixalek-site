import { ui, text, bind, locale } from '../../../../content/index.js';
import { createArticleCard, createArticleDate, createArticleImage } from './card-dom.js';
const bindings = { ui, text, bind, getLocale: () => locale };
export const articleDate = article => createArticleDate(article, bindings);
export const articleImage = (article, fallback) => createArticleImage(article, fallback);
export const ArticleCard = (article, fallback, featured = false) => createArticleCard(article, fallback, { ...bindings, featured });
