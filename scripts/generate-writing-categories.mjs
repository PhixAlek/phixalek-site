import { generateWritingCategories } from './lib/writing-categories.mjs';
await generateWritingCategories(undefined, { local: process.argv.includes('--local') });
