export const SITE_ORIGIN = 'https://phixalek.com';
export const AUTHOR = Object.freeze({
  '@type': 'Person', '@id': `${SITE_ORIGIN}/#person`,
  name: 'Alejandro Segura', alternateName: 'PhixAlek', jobTitle: 'Software Developer',
  url: `${SITE_ORIGIN}/`, image: `${SITE_ORIGIN}/media/phixalek-profile-static.png`,
});
export const homeMetadata = Object.freeze({
  title: 'Alejandro Segura — Software Developer | PhixAlek',
  description: 'Alejandro Segura (PhixAlek), software developer focused on C#, .NET and Angular. Projects, technical articles and notes on building web applications.',
  canonical: `${SITE_ORIGIN}/`, image: `${SITE_ORIGIN}/media/demome-01.webp`, type: 'website',
  imageWidth: 1109, imageHeight: 624, imageType: 'image/webp',
  imageAlt: 'PhixAlek — Alejandro Segura’s software development portfolio',
});
