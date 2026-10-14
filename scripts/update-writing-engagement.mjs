import { readFile, writeFile, rename } from 'node:fs/promises';
import { refreshEngagement } from './lib/writing-engagement.mjs';
import { validateSnapshot } from '../src/shared/writing/snapshot.js';

// Explicit local refresh only. Builds and reader visits never fetch social metadata.
const file = new URL('../src/content/writing-snapshot.json', import.meta.url);
const snapshot = validateSnapshot(JSON.parse(await readFile(file, 'utf8')));
for (let index = 0; index < snapshot.articles.length; index++) {
  snapshot.articles[index] = await refreshEngagement(snapshot.articles[index]);
}
validateSnapshot(snapshot);
const temporary = new URL(file.href + '.tmp');
await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
await rename(temporary, file);
console.log('Writing: public engagement refreshed; unavailable values keep their last valid copy.');
