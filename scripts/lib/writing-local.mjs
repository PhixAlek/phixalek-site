import { readFile, writeFile } from 'node:fs/promises';
import { normalizeArticle } from '../../src/shared/writing/model.js';

export const LOCAL_WRITING_FILE = 'src/content/writing.fake.local.json';
export const LOCAL_WRITING_OUTPUT = 'src/content/writing-local.generated.json';
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Local fixtures contain plain text, never executable or unsanitized article HTML.
export function localArticles(data) {
  if (!data?.enabled) return [];
  if (!Array.isArray(data.posts)) throw new Error('Local Writing requires a posts array.');
  const ids = new Set();
  return data.posts.map(post => {
    const article = normalizeArticle({ ...post, url: `https://phixalek.substack.com/p/${post.slug}` });
    if (!article || !post.slug.startsWith('local-demo-') || ids.has(article.id)
      || typeof post.excerpt !== 'string' || !Array.isArray(post.paragraphs)
      || !post.paragraphs.every(value => typeof value === 'string')
      || !Array.isArray(post.categories) || !post.categories.every(value => typeof value === 'string')
      || !Number.isInteger(post.readingMinutes) || post.readingMinutes < 1
      || (post.image != null && !/^\/media\/[a-zA-Z0-9_-]+\.(webp|jpg|png|svg)$/.test(post.image))) {
      throw new Error('Invalid local Writing example.');
    }
    ids.add(article.id);
    return { ...article, image: post.image ?? null, localDemo: true, excerpt: post.excerpt,
      html: post.paragraphs.map(value => `<p>${escape(value)}</p>`).join(''),
      categories: post.categories, readingMinutes: post.readingMinutes, widgets: [], updatedAt: article.published };
  }).sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}

export async function generateLocalWriting(root, { local = false } = {}) {
  let articles = [];
  if (local) {
    try { articles = localArticles(JSON.parse(await readFile(new URL(LOCAL_WRITING_FILE, root), 'utf8'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const content = JSON.stringify({ enabled: articles.length > 0, articles }, null, 2) + '\n';
  const output = new URL(LOCAL_WRITING_OUTPUT, root);
  let previous;
  try { previous = await readFile(output, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous !== content) await writeFile(output, content);
  return articles;
}
