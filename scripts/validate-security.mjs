import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../dist/', import.meta.url);
const problems = [];
async function scan(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name), file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) { await scan(file, relative); continue; }
    if (/\.map$|\.(pem|key|p12|pfx)$|^\.env(?:\.|$)/i.test(entry.name)) problems.push(relative);
    if (/\.(js|json|html|txt|css)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      if (/-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----/.test(source)) problems.push(relative);
    }
  }
}
await scan(root);
if (problems.length) {
  console.error('Security: prohibited public artifacts found:', [...new Set(problems)].join(', '));
  process.exitCode = 1;
} else console.log('Security: production artifacts contain no public source maps or private-key files/markers.');
