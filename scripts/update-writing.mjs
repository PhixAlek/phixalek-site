import { readFile, writeFile, rename } from 'node:fs/promises';
import { refreshSnapshot } from './lib/writing-update.mjs';

const file = new URL('../src/content/writing-snapshot.json', import.meta.url);
let previous;
try { previous = JSON.parse(await readFile(file, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const { snapshot, stale } = await refreshSnapshot(previous);
if (stale) {
  console.warn('Writing: external refresh failed; keeping the last valid copy.');
  process.exitCode = 1;
} else {
  const temporary = new URL(`${file.href}.tmp`);
  await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
  await rename(temporary, file);
  console.log(`Writing: saved ${snapshot.articles.length} articles.`);
}
