import { validateSeo } from './lib/seo-validation.mjs';

const { errors, pages } = await validateSeo();
if (errors.length) {
  console.error('SEO validation failed:\n' + errors.join('\n'));
  process.exitCode = 1;
} else console.log(`SEO: ${pages} static pages, canonical URLs, social images, structured data and sitemap validated.`);
