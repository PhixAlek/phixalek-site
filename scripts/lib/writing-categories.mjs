import { generateLocalWriting, LOCAL_WRITING_FILE, LOCAL_WRITING_OUTPUT } from './writing-local.mjs';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import webpack from 'webpack';
import { readFile, writeFile } from 'node:fs/promises';
import { deriveCategories } from '../../src/shared/writing/listing-model.js';
import { validateSnapshot } from '../../src/shared/writing/snapshot.js';
import { validateWritingConfig } from '../../src/shared/writing/validate.js';
import { prepareWritingBuild, BUILD_SNAPSHOT } from './writing-build.mjs';

export async function generateWritingCategories(root = new URL('../../', import.meta.url), { local = false, snapshot: suppliedSnapshot } = {}) {
  const read = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
  const snapshot = validateSnapshot(suppliedSnapshot || await read('src/content/writing-snapshot.json'));
  const config = await read('src/content/writing.json');
  const errors = validateWritingConfig(config);
  if (errors.length) throw new Error(errors.join('\n'));
  const examples = await generateLocalWriting(root, { local });
  const categories = deriveCategories(examples.length ? examples : snapshot.articles, { definitions: config.categories,
    removedSlugs: config.removedSlugs, articleOverrides: config.articleOverrides });
  const output = new URL('src/content/writing-categories.generated.json', root);
  const content = JSON.stringify(categories, null, 2) + '\n';
  let previous;
  try { previous = await readFile(output, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // Avoid triggering another watch compilation when the manifest is unchanged.
  if (previous !== content) await writeFile(output, content);
  return categories;
}

export class WritingCategoriesPlugin {
  apply(compiler) {
    const production = compiler.options.mode !== 'development';
    const productionCategories = fileURLToPath(new URL('../../src/content/writing-categories.production.generated.json', import.meta.url));
    if (production) {
      new webpack.NormalModuleReplacementPlugin(/writing-snapshot\.json$/, resource => {
        resource.request = fileURLToPath(new URL('../../' + BUILD_SNAPSHOT, import.meta.url));
      }).apply(compiler);
      new webpack.NormalModuleReplacementPlugin(/writing-local\.generated\.json$/, resource => {
        resource.request = fileURLToPath(new URL('../../src/content/writing-preview-disabled.json', import.meta.url));
      }).apply(compiler);
      new webpack.NormalModuleReplacementPlugin(/writing-categories\.generated\.json$/, resource => {
        resource.request = productionCategories;
      }).apply(compiler);
    }
    compiler.hooks.beforeCompile.tapPromise('WritingCategories', async () => {
      const edition = production ? await prepareWritingBuild() : null;
      const categories = await generateWritingCategories(undefined, { local: !production, snapshot: edition?.snapshot });
      if (production) compiler.inputFileSystem?.purge?.(fileURLToPath(new URL('../../' + BUILD_SNAPSHOT, import.meta.url)));
      if (production) {
        await writeFile(productionCategories, JSON.stringify(categories));
        compiler.inputFileSystem?.purge?.(productionCategories);
      }
      compiler.inputFileSystem?.purge?.(fileURLToPath(new URL('../../' + LOCAL_WRITING_OUTPUT, import.meta.url)));
      compiler.inputFileSystem?.purge?.(fileURLToPath(new URL('../../src/content/writing-categories.generated.json', import.meta.url)));
    });
    compiler.hooks.afterCompile.tap('WritingCategories', compilation => {
      for (const path of ['src/content/writing-snapshot.json', 'src/content/writing.json', ...(compiler.options.mode === 'development' ? [LOCAL_WRITING_FILE] : [])]) {
        const file = fileURLToPath(new URL(path, new URL('../../', import.meta.url)));
        (existsSync(file) ? compilation.fileDependencies : compilation.missingDependencies).add(file);
      }
    });
  }
}
