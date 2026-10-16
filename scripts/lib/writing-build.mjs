import { readFile, writeFile } from 'node:fs/promises';
import { refreshSnapshot } from './writing-update.mjs';
import { validateSnapshot } from '../../src/shared/writing/snapshot.js';

export const BUILD_SNAPSHOT = 'src/content/writing-build.generated.json';
/** One immutable content edition feeds the bundle, HTML pages and sitemap. */
export async function prepareWritingBuild(root = new URL('../../', import.meta.url), {
  refresh = process.env.NETLIFY === 'true' || process.env.WRITING_REFRESH === '1',
  ...options
} = {}) {
  const previous = validateSnapshot(JSON.parse(await readFile(new URL('src/content/writing-snapshot.json', root), 'utf8')));
  const result = refresh ? await refreshSnapshot(previous, options) : { snapshot: previous, stale: false };
  if (result.stale) console.warn('Writing SEO: Substack unavailable; publishing the last valid content edition.');
  await writeFile(new URL(BUILD_SNAPSHOT, root), JSON.stringify(result.snapshot) + '\n');
  return result;
}
