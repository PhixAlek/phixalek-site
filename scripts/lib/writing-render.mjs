import { createReaderCover } from '../../src/js/modules/writing/components/reader-cover.js';
import { createWritingHeading } from '../../src/shared/writing/hero-heading.js';
import { createWritingError } from '../../src/js/modules/writing/components/writing-error.js';
import { ArticleComments } from '../../src/js/modules/writing/components/article-comments.js';
import { createArticleCard } from '../../src/js/modules/writing/components/card-dom.js';
import { JSDOM } from 'jsdom';
import { importArticleBody, withOpeningCover } from '../../src/shared/writing/article-body.js';
import { writingMetadata, applyPageMetadata, SITE_ORIGIN, writingStructuredData, serializedSchema } from '../../src/shared/writing/metadata.js';
import { articlePath } from '../../src/shared/writing/routes.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);


export function renderWritingHTML(template, articles, { article, messages, fallbackImage, profileImage, siteName, notFound = false }) {
  const dom = new JSDOM(template);
  const { document } = dom.window;
  articles = articles.map(item => withOpeningCover(item, dom.window));
  if (article) article = withOpeningCover(article, dom.window);
  const failed = notFound || (!article && !articles.length);
  const metadata = writingMetadata(article, { title: failed ? messages.writingPage.errorHeading : messages.writingPage.title, description: failed ? messages.writingPage.errorDescription : messages.writingPage.intro, image: SITE_ORIGIN + fallbackImage });
  applyPageMetadata(document, metadata, { indexable: !failed });
  if (failed) document.querySelector('link[rel="canonical"]')?.remove();
  document.documentElement.lang = article?.language || 'en';
  document.querySelectorAll('script[type="application/ld+json"], noscript').forEach(node => node.remove());
  const image = record => `<img src="${escapeHTML(record.image || fallbackImage)}" width="1200" height="630" alt="" loading="lazy" decoding="async">`;
  const date = record => `<time datetime="${escapeHTML(record.published)}">${escapeHTML(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(record.published)))}</time>`;
  const back = `<a class="editorial-back" data-route-back href="${article ? '/blog' : '/#writing'}" aria-label="${escapeHTML(messages.writingPage.back)}">←</a>`;
  let body;
  if (notFound || (!article && !articles.length)) {
    body = createWritingError({ doc: document, ui: messages, text: (node, getter) => { node.textContent = getter(); }, articles, fallback: { src: fallbackImage } }).outerHTML;
  } else if (article) {
    const clean = importArticleBody(article.html, { view: dom.window, sourceUrl: article.sourceUrl, omitCover: article.cover?.src });
    const cover = createReaderCover(article, { src: fallbackImage }, { doc: document, featured: articles[0]?.id === article.id }).outerHTML;
    body = `<article class="editorial-story" lang="${escapeHTML(article.language || 'en')}"><div class="editorial-meta">${date(article)} <span>${article.readingMinutes} ${escapeHTML(messages.writingPage.minutes)}</span></div><h1>${escapeHTML(article.title)}</h1><p class="editorial-deck">${escapeHTML(article.excerpt)}</p><div class="editorial-author"><img src="${escapeHTML(profileImage)}" width="44" height="44" alt=""><span>${escapeHTML(siteName)} · Software Developer</span></div>${cover}<div class="editorial-prose">${clean.html}</div></article>`;
    body += ArticleComments(article, { doc: document, ui: messages, text: (node, getter) => { node.textContent = getter(); } }).outerHTML;
  } else {
    const bind = (node, property, getter) => property.startsWith('attr:') ? node.setAttribute(property.slice(5), getter()) : node[property] = getter();
    const text = (node, getter) => bind(node, 'textContent', getter);
    const cards = articles.map((record, index) => {
      const node = createArticleCard(record, { src: fallbackImage }, { doc: document, ui: messages, bind, text, getLocale: () => 'en', featured: index === 0 });
      return node.outerHTML;
    });
    const heading = createWritingHeading({ doc: document, text, getTitle: () => messages.writingPage.title });
    body = `<div class="editorial-intro"><div class="editorial-intro-lead">${back}<span class="editorial-eyebrow">${escapeHTML(messages.navigation.items.find(item => item.href === '#writing').label)}</span></div>${heading.outerHTML}<p>${escapeHTML(messages.writingPage.intro)}</p></div>${cards[0] ? `<div class="editorial-featured-shell">${cards[0]}</div>` : ''}<div class="editorial-list">${cards.slice(1).join('')}</div>`;
  }
  document.getElementById('app').innerHTML = `<main id="main-content" class="site writing-page writing-prerender" data-writing-prerender data-writing-view="${article ? 'article' : notFound ? 'not-found' : 'index'}"><div class="container editorial-container">${article || notFound ? back : ''}${body}</div></main>`;
  const style = document.createElement('style');
  style.textContent = '@font-face{font-family:Nunito;src:url(/fonts/nunito-variable.woff2) format("woff2");font-weight:200 900;font-display:swap}.writing-prerender{font-family:Nunito,Arial,sans-serif;color:#292933;max-width:1320px;margin:auto;padding:40px 24px;line-height:1.6}.writing-prerender h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.2}.writing-prerender img{max-width:100%;height:auto}.writing-prerender .editorial-author img{width:44px}.writing-prerender a{color:inherit}.writing-prerender .editorial-card{margin-block:24px}.writing-prerender .editorial-actions{display:none}.writing-prerender .editorial-prose{max-width:760px}.writing-prerender .editorial-meta{color:#626270}.writing-prerender pre{overflow:auto}.writing-prerender table{display:block;overflow:auto}';
  style.textContent += '.editorial-error-lead{text-align:center;max-width:660px;margin:0 auto 40px}.editorial-error-lead>img{width:min(100%,540px)}.editorial-error-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:24px}.editorial-error-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.editorial-error-cards article{padding:12px;border-radius:16px;background:white;box-shadow:0 3px 12px #1e28230a}.editorial-error-cards img{aspect-ratio:3/2;object-fit:cover;border-radius:10px}.editorial-error-cards a{text-decoration:none}@media(max-width:767px){.editorial-error-cards{grid-template-columns:1fr}}';
  style.textContent += '@font-face{font-family:"Cormorant Garamond";src:url(/fonts/cormorant-garamond-600-italic-latin.woff2) format("woff2");font-style:italic;font-weight:600;font-display:swap}.editorial-intro .editorial-heading{font-size:clamp(30px,3.4vw,44px);line-height:1.1}.editorial-heading-primary{display:block;font-weight:800}.editorial-heading-accent{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:1.12em;font-weight:600;font-style:italic;line-height:1.08;color:#35664f;margin-left:-.025em}.editorial-heading-accent:empty{display:none}';
  document.head.append(style);
  const structured = document.createElement('script'); structured.type = 'application/ld+json';
  structured.textContent = serializedSchema(writingStructuredData(article, articles, metadata));
  if (!failed) document.head.append(structured);
  const html = dom.serialize(); dom.window.close(); return html;
}

export function writingSitemap(articles) {
  const urls = [`<url><loc>${SITE_ORIGIN}/</loc></url>`, `<url><loc>${SITE_ORIGIN}/blog</loc></url>`,
    ...articles.map(article => `<url><loc>${SITE_ORIGIN}${articlePath(article.slug)}</loc><lastmod>${escapeHTML(article.updatedAt)}</lastmod></url>`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}
