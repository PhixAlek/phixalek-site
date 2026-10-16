import { articlePath } from './routes.js';
import { writingConfig } from './config.js';
import { SITE_ORIGIN, homeMetadata, AUTHOR } from '../site-seo.js';
export { SITE_ORIGIN, homeMetadata };

export function writingMetadata(article, { title, description }) {
  return article ? { title: `${article.title} | Alejandro Segura · PhixAlek`, description: article.excerpt,
    canonical: SITE_ORIGIN + articlePath(article.slug) + '/', image: article.cover?.src || article.image || homeMetadata.image, type: 'article',
    language: article.language, published: article.published, modified: article.updatedAt, imageAlt: article.cover?.alt || article.title }
    : { title: `${title} | Alejandro Segura · PhixAlek`, description, canonical: SITE_ORIGIN + writingConfig.routes.index + '/', image: homeMetadata.image, type: 'website' };
}
export function applyPageMetadata(doc, meta, { indexable = true } = {}) {
  doc.title = meta.title;
  const set = (selector, key, value) => {
    let node = doc.querySelector(selector);
    if (!node) {
      node = doc.createElement('meta');
      const [attribute, content] = selector.match(/\[(name|property)="([^"]+)"\]/).slice(1);
      node.setAttribute(attribute, content); doc.head.append(node);
    }
    node.setAttribute(key, value);
  };
  set('meta[name="description"]', 'content', meta.description);
  set('meta[name="author"]', 'content', AUTHOR.name);
  set('meta[name="robots"]', 'content', indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  let canonical = doc.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = doc.createElement('link'); canonical.rel = 'canonical'; doc.head.append(canonical); }
  canonical.setAttribute('href', meta.canonical);
  for (const [property, value] of Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, image: meta.image, type: meta.type })) {
    set(`meta[property="og:${property}"]`, 'content', value);
  }
  for (const property of ['title', 'description', 'image']) set(`meta[name="twitter:${property}"]`, 'content', meta[property]);
  const locales = { en: 'en_US', es: 'es_MX', fr: 'fr_FR', pt: 'pt_BR', de: 'de_DE' };
  set('meta[property="og:locale"]', 'content', locales[meta.language] || 'en_US');
  if (meta.canonical !== homeMetadata.canonical) doc.querySelectorAll('meta[property="og:locale:alternate"]').forEach(node => node.remove());
  for (const [property, value] of Object.entries({ published_time: meta.published, modified_time: meta.modified, author: meta.type === 'article' ? AUTHOR.url : null })) {
    if (value) set(`meta[property="article:${property}"]`, 'content', value);
    else doc.querySelector(`meta[property="article:${property}"]`)?.remove();
  }
  // Article covers have unknown dimensions; never inherit Home's dimensions or alt text.
  if (meta.canonical !== homeMetadata.canonical) doc.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"], meta[property="og:image:type"], meta[property="og:image:alt"], meta[name="twitter:image:alt"]').forEach(node => node.remove());
  for (const [property, value] of Object.entries({ width: meta.imageWidth, height: meta.imageHeight, type: meta.imageType, alt: meta.imageAlt })) {
    if (value) set(`meta[property="og:image:${property}"]`, 'content', value);
  }
  if (meta.imageAlt) set('meta[name="twitter:image:alt"]', 'content', meta.imageAlt);
}


export function writingStructuredData(article, articles, metadata) {
  return article ? { '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: article.title, description: article.excerpt, datePublished: article.published,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    url: metadata.canonical, mainEntityOfPage: metadata.canonical, image: metadata.image,
    ...(article.language ? { inLanguage: article.language } : {}),
    author: AUTHOR, publisher: { '@id': AUTHOR['@id'], '@type': 'Person', name: AUTHOR.name },
    isPartOf: { '@type': 'Blog', '@id': `${SITE_ORIGIN}/blog/#blog`, url: `${SITE_ORIGIN}/blog/`, name: 'Writing — PhixAlek' },
    ...(article.categories?.length ? { keywords: article.categories.join(', ') } : {}),
  } : { '@context': 'https://schema.org', '@type': 'CollectionPage', name: metadata.title, url: metadata.canonical,
    mainEntity: { '@type': 'ItemList', itemListElement: articles.map((record, index) => ({
      '@type': 'ListItem', position: index + 1, url: SITE_ORIGIN + articlePath(record.slug) + '/', name: record.title,
    })) } };
}

export function serializedSchema(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
