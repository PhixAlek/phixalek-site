import { checkLiveSeo } from './lib/live-seo.mjs';
const report = await checkLiveSeo();
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
