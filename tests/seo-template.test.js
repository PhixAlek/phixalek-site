import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { buildSeo } from '../scripts/lib/seo.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function compileTemplate(parameters) {
  const folder = await mkdtemp(path.join(tmpdir(), 'phixalek-seo-template-'));
  let compiler;
  try {
    await writeFile(path.join(folder, 'entry.js'), 'console.log("template check");');
    compiler = webpack({
      mode: 'development', context: root, entry: path.join(folder, 'entry.js'),
      output: { path: path.join(folder, 'dist'), filename: 'bundle.js' },
      plugins: [new HtmlWebpackPlugin({
        template: path.join(root, 'public/index.html'),
        ...(parameters ? { templateParameters: parameters } : {}),
      })],
    });
    const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : resolve(stats)));
    assert.equal(stats.hasErrors(), false, stats.toString({ all: false, errors: true }));
    return await readFile(path.join(folder, 'dist/index.html'), 'utf8');
  } finally {
    if (compiler) await new Promise(resolve => compiler.close(resolve));
    await rm(folder, { recursive: true, force: true });
  }
}

test('an already-running dev configuration without SEO parameters still renders the page', async () => {
  const html = await compileTemplate();
  assert.ok(html.includes('id="app"'));
  assert.ok(html.includes('bundle.js'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(!html.includes('ReferenceError'));
  assert.ok(!html.includes('application/ld+json'));
});

test('a fresh configuration renders valid structured data and approved fallback content', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'src/data/content.json'), 'utf8'));
  const html = await compileTemplate({ seo: buildSeo(content) });
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  const graph = JSON.parse(json)['@graph'];
  assert.equal(graph[0].name, 'Alejandro Segura');
  assert.equal(graph.find(n => n['@type'] === 'ProfilePage').name, 'PhixAlek - Software Developer | .NET & Angular');
  assert.ok(html.includes('<title>PhixAlek - Software Developer | .NET &amp; Angular</title>'));
  assert.ok(html.includes('property="og:title" content="PhixAlek - Software Developer | .NET &amp; Angular"'));
  assert.ok(html.includes('name="twitter:title" content="PhixAlek - Software Developer | .NET &amp; Angular"'));
  const description = 'Alejandro Segura, software developer with 5+ years building .NET and Angular web applications. Explore Flowly, selected projects and technical writing.';
  for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert.equal(html.split(`<meta ${attribute} `).length - 1, 1);
    assert.ok(html.includes(`<meta ${attribute} content="${description}">`));
  }
  assert.ok(html.includes('<div id="app"></div>'));
  const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  assert.ok(fallback.includes('https://github.com/PhixAlek/Flowly'));
  assert.ok(!html.replace(/<noscript>[\s\S]*?<\/noscript>/, '').includes('class="seo-fallback"'));
  assert.ok(html.includes('bundle.js'));
});
