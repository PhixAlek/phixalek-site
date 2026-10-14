import { deriveCategories } from '../src/shared/writing/listing-model.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { validateSnapshot, availableArticles } from '../src/shared/writing/snapshot.js';
import { renderWritingHTML, writingSitemap } from './lib/writing-render.mjs';
import { articlePath } from '../src/shared/writing/routes.js';

const root = new URL('../', import.meta.url);
const readJSON = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const snapshot = validateSnapshot(await readJSON('src/content/writing-snapshot.json'));
const articles = availableArticles(snapshot.articles);
const template = await readFile(new URL('dist/index.html', root), 'utf8');
const images = await readJSON('src/data/images.json');
const config = await readJSON('src/content/writing.json');
const media = id => '/' + images.base + images.images.find(image => image.id === id).src;
const options = { messages: (await readJSON('src/content/locales/en.json')).messages,
  fallbackImage: media(config.fallbackImageId), profileImage: media('phixalek-profile'),
  siteName: (await readJSON('src/data/content.json')).hero.name };
async function page(path, article) {
  const directory = new URL(`dist${path}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderWritingHTML(template, articles, { ...options, article }));
}
await page(config.routes.index);
for (const article of articles) await page(articlePath(article.slug), article);
await mkdir(new URL('dist/data/', root), { recursive: true });
await writeFile(new URL('dist/data/writing.json', root), JSON.stringify({ ...snapshot, articles, categories: deriveCategories(articles, { definitions: config.categories }) }) + '\n');
await writeFile(new URL('dist/sitemap.xml', root), writingSitemap(articles));
console.log(`Writing: generated archive, ${articles.length} article pages and sitemap from the saved copy.`);

// Static files take precedence; unknown/deleted article URLs return an actual 404.
const notFoundHTML = renderWritingHTML(template, articles, { ...options, notFound: true });
await writeFile(new URL('dist/blog/__not-found.html', root), notFoundHTML);
await writeFile(new URL('dist/404.html', root), notFoundHTML);
await writeFile(new URL('dist/_redirects', root), '/blog/* /blog/__not-found.html 404\n');
