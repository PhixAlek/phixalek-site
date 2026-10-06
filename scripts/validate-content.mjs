import { readFileSync } from 'node:fs';
import { validateWritingConfig } from '../src/shared/writing/validate.js';
import { validateContent, validateTranslation } from '../src/content/model.js';
const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const errors = validateContent(read('../src/data/content.json'), {
  en: read('../src/content/locales/en.json'), es: read('../src/content/locales/es.json'),
}, read('../src/content/sections.json'));
errors.push(...validateTranslation(read('../src/data/content.json'), read('../src/data/content.es.json')));
errors.push(...validateWritingConfig(read('../src/content/writing.json')));
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Content valid. Unpublished sections and translations remain hidden.');
