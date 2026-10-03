import { publishedItems, validAction, validDestination } from '../../src/content/model.js';

const origin = 'https://phixalek.com/';
const personId = `${origin}#person`;
const plain = value => String(value || '').replace(/\[\[(?:complement:)?(.+?)\]\]/g, '$1').replace(/\*\*|\*/g, '');
const escape = value => plain(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Build public HTML from the same approved content as the client-side portfolio.
export function buildSeo(content) {
  const projects = publishedItems({ ...content.projects, publication: 'published' });
  const socials = (content.footer?.social || []).filter(s => validDestination(s.href) && s.href.startsWith('https://'));
  const description = plain(content.hero?.subtitle);
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', '@id': personId,
        name: 'Alejandro Segura', alternateName: 'PhixAlek',
        url: origin, jobTitle: 'Software Developer', description,
        sameAs: socials.map(s => s.href),
        knowsAbout: ['Software Development', '.NET', 'Angular', 'Web Applications', 'Game Development'],
      },
      {
        '@type': 'WebSite', '@id': `${origin}#website`,
        url: origin, name: 'PhixAlek', alternateName: 'Alejandro Segura Portfolio',
        inLanguage: ['en', 'es'], publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage', '@id': `${origin}#profile`, url: origin,
        name: 'PhixAlek - Software Developer | .NET & Angular', description,
        isPartOf: { '@id': `${origin}#website` }, mainEntity: { '@id': personId },
      },
    ],
  };
  const cards = projects.map(project => {
    const links = (project.actions || []).filter(a => validAction(a) && a.kind === 'link')
      .map(a => `<a href="${escape(a.href)}">${escape(a.text)}</a>`).join(' · ');
    return `<article><h3>${escape(project.title)}</h3><p>${escape((project.badges || []).join(' · '))}</p><p>${escape(project.desc)}</p><p>${escape((project.tags || []).join(' · '))}</p>${links}</article>`;
  }).join('');
  const biography = [content.about?.lead, ...(content.about?.body || '').split('\n\n')]
    .filter(Boolean).map(p => `<p>${escape(p)}</p>`).join('');
  const profiles = socials.map(s => `<a href="${escape(s.href)}">${escape(s.name)}</a>`).join(' · ');
  return {
    // Prevent editorial text from terminating an inline script.
    structuredData: JSON.stringify(graph).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'),
    fallback: `<main class="seo-fallback" lang="en"><h1>Alejandro Segura — PhixAlek</h1><p>${escape(description)}</p><section><h2>${escape(content.projects?.title)}</h2>${cards}</section><section><h2>${escape(content.about?.title)}</h2>${biography}</section><nav aria-label="Social profiles">${profiles}</nav><p><a href="mailto:hi@phixalek.com">hi@phixalek.com</a></p></main>`,
  };
}
