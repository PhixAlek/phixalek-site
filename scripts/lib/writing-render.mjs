import { JSDOM } from 'jsdom';
import { importArticleBody } from '../../src/shared/writing/article-body.js';
import { writingMetadata, applyPageMetadata, SITE_ORIGIN, writingStructuredData, serializedSchema } from '../../src/shared/writing/metadata.js';
import { articlePath } from '../../src/shared/writing/routes.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);


export function renderWritingHTML(template, articles, { article, messages, fallbackImage, profileImage, siteName, notFound = false }) {
  const dom = new JSDOM(template);
  const { document } = dom.window;
  const metadata = writingMetadata(article, { title: messages.writingPage.title, description: messages.writingPage.intro, image: SITE_ORIGIN + fallbackImage });
  applyPageMetadata(document, metadata, { indexable: !notFound });
  if (notFound) document.querySelector('link[rel="canonical"]')?.remove();
  document.documentElement.lang = article?.language || 'en';
  document.querySelectorAll('script[type="application/ld+json"], noscript').forEach(node => node.remove());
  const image = record => `<img src="${escapeHTML(record.image || fallbackImage)}" width="1200" height="630" alt="" loading="lazy" decoding="async">`;
  const date = record => `<time datetime="${escapeHTML(record.published)}">${escapeHTML(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(record.published)))}</time>`;
  const back = `<a class="editorial-back" data-route-back href="${article ? '/blog' : '/#writing'}" aria-label="${escapeHTML(messages.writingPage.back)}">←</a>`;
  let body;
  if (notFound) {
    body = `<h1>${escapeHTML(messages.writingPage.empty)}</h1>`;
  } else if (article) {
    const clean = importArticleBody(article.html, { view: dom.window, sourceUrl: article.sourceUrl });
    body = `<article class="editorial-story" lang="${escapeHTML(article.language || 'en')}"><div class="editorial-meta">${date(article)} <span>${article.readingMinutes} ${escapeHTML(messages.writingPage.minutes)}</span></div><h1>${escapeHTML(article.title)}</h1><p class="editorial-deck">${escapeHTML(article.excerpt)}</p><div class="editorial-author"><img src="${escapeHTML(profileImage)}" width="44" height="44" alt=""><span>${escapeHTML(siteName)} · Software Developer</span></div>${image(article)}<div class="editorial-prose">${clean.html}</div></article>`;
  } else {
    body = `<div class="editorial-intro"><h1>${escapeHTML(messages.writingPage.title)}</h1><p>${escapeHTML(messages.writingPage.intro)}</p></div><div class="editorial-list">` + articles.map(record =>
      `<article class="editorial-card"><a class="editorial-card-link" href="${articlePath(record.slug)}">${image(record)}<div class="editorial-card-copy"><div class="editorial-meta">${date(record)} <span>${record.readingMinutes} ${escapeHTML(messages.writingPage.minutes)}</span></div><h2>${escapeHTML(record.title)}</h2><p>${escapeHTML(record.excerpt)}</p><span class="editorial-read">${escapeHTML(messages.writingPage.read)} →</span></div></a></article>`).join('') + '</div>';
  }
  document.getElementById('app').innerHTML = `<main id="main-content" class="site writing-page writing-prerender" data-writing-prerender><div class="container editorial-container">${back}${body}</div></main>`;
  const style = document.createElement('style');
  style.textContent = '@font-face{font-family:Nunito;src:url(/fonts/nunito-variable.woff2) format("woff2");font-weight:200 900;font-display:swap}.writing-prerender{font-family:Nunito,Arial,sans-serif;color:#292933;max-width:1200px;margin:auto;padding:40px 24px;line-height:1.6}.writing-prerender h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.2}.writing-prerender img{max-width:100%;height:auto}.writing-prerender .editorial-author img{width:44px}.writing-prerender a{color:inherit}.writing-prerender .editorial-card{margin-block:24px}.writing-prerender .editorial-prose{max-width:760px}.writing-prerender .editorial-meta{color:#626270}.writing-prerender pre{overflow:auto}.writing-prerender table{display:block;overflow:auto}';
  document.head.append(style);
  const structured = document.createElement('script'); structured.type = 'application/ld+json';
  structured.textContent = serializedSchema(writingStructuredData(article, articles, metadata));
  if (!notFound) document.head.append(structured);
  const html = dom.serialize(); dom.window.close(); return html;
}

export function writingSitemap(articles) {
  const urls = [`<url><loc>${SITE_ORIGIN}/</loc></url>`, `<url><loc>${SITE_ORIGIN}/blog</loc></url>`,
    ...articles.map(article => `<url><loc>${SITE_ORIGIN}${articlePath(article.slug)}</loc><lastmod>${escapeHTML(article.updatedAt)}</lastmod></url>`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}
