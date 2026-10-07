import { articlePath } from './routes.js';
import { writingConfig } from './config.js';

export const SITE_ORIGIN = 'https://phixalek.com';
export const homeMetadata = {
  title: 'PhixAlek - Software Developer | .NET & Angular',
  description: 'Alejandro Segura, software developer with 5+ years building .NET and Angular web applications. Explore Flowly, selected projects and technical writing.',
  canonical: `${SITE_ORIGIN}/`, image: `${SITE_ORIGIN}/media/portfolio-preview-v2.jpg`, type: 'website',
};
export function writingMetadata(article, { title, description, image }) {
  return article ? { title: `${article.title} | PhixAlek`, description: article.excerpt,
    canonical: SITE_ORIGIN + articlePath(article.slug), image: article.image || image, type: 'article' }
    : { title: `${title} | PhixAlek`, description, canonical: SITE_ORIGIN + writingConfig.routes.index, image, type: 'website' };
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
  set('meta[name="robots"]', 'content', indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  let canonical = doc.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = doc.createElement('link'); canonical.rel = 'canonical'; doc.head.append(canonical); }
  canonical.setAttribute('href', meta.canonical);
  for (const [property, value] of Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, image: meta.image, type: meta.type })) {
    set(`meta[property="og:${property}"]`, 'content', value);
  }
  for (const property of ['title', 'description', 'image']) set(`meta[name="twitter:${property}"]`, 'content', meta[property]);
  // Article covers have unknown dimensions; never inherit Home's dimensions or alt text.
  if (meta.canonical !== homeMetadata.canonical) doc.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"], meta[property="og:image:type"], meta[property="og:image:alt"], meta[name="twitter:image:alt"]').forEach(node => node.remove());
}


export function writingStructuredData(article, articles, metadata) {
  return article ? { '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: article.title, description: article.excerpt, datePublished: article.published,
    url: metadata.canonical, mainEntityOfPage: metadata.canonical, image: metadata.image,
    ...(article.language ? { inLanguage: article.language } : {}),
    author: { '@type': 'Person', name: 'Alejandro Segura', url: SITE_ORIGIN },
  } : { '@context': 'https://schema.org', '@type': 'CollectionPage', name: metadata.title, url: metadata.canonical,
    mainEntity: { '@type': 'ItemList', itemListElement: articles.map((record, index) => ({
      '@type': 'ListItem', position: index + 1, url: SITE_ORIGIN + articlePath(record.slug), name: record.title,
    })) } };
}

export function serializedSchema(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
