import { createSubstackHandler } from './netlify/lib/substack.js';
import path from 'path';
import { readFileSync } from 'node:fs';
import { WritingCategoriesPlugin } from './scripts/lib/writing-categories.mjs';
import { buildSeo } from './scripts/lib/seo.mjs';
import { developmentCSP } from './scripts/lib/dev-security.mjs';
import webpack from 'webpack';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

dotenv.config(); // carga .env

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default (_env, argv = {}) => ({
  mode: argv.mode || 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true,
  },
  devtool: argv.mode === 'production' ? false : 'source-map',
  devServer: {
    headers: { 'Content-Security-Policy': developmentCSP },
    host: '127.0.0.1',
    static: [
      { directory: path.join(__dirname, 'public') }, // sirve /public (imagenes, etc.)
      { directory: path.join(__dirname, 'dist') },   // y dist
    ],
    port: 5173,
    open: false,
    hot: true,
    compress: true,
    historyApiFallback: true,
    setupMiddlewares(middlewares) {
      // Standalone webpack serves the same fixed-source RSS route as Netlify.
      const writingFeed = createSubstackHandler();
      middlewares.unshift({ name: 'writing-feed', path: '/.netlify/functions/latest-writing', middleware: async (request, response) => {
        const result = await writingFeed({ httpMethod: request.method, queryStringParameters: request.query });
        response.status(result.statusCode).set(result.headers).send(result.body);
      } });
      return middlewares;
    },
  },
  experiments: { topLevelAwait: true },
  module: {
    rules: [
      { test: /\.woff2$/i, type: 'asset/resource', generator: { filename: 'fonts/[name][ext]' } },
      // CSS desde src (inyecta en runtime)
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
        include: path.resolve(__dirname, 'src/css'),
      },
      // IMPORTAR JSON como módulos (necesario para content.json e images.json)
      { test: /\.json$/i, type: 'json' },
    ],
  },
  plugins: [
    new WritingCategoriesPlugin(),
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      templateParameters: (compilation, assets, assetTags, options) => {
        const contentPath = fileURLToPath(new URL('./src/data/content.json', import.meta.url));
        compilation.fileDependencies.add(contentPath);
        return {
          compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: { tags: assetTags, files: assets, options },
          seo: buildSeo(JSON.parse(readFileSync(contentPath, 'utf8'))),
        };
      },
      inject: 'body',
    }),
    new CopyWebpackPlugin({
      patterns: [
        // Copia TODO public/ excepto index.html (lo gestiona HtmlWebpackPlugin)
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),
        new webpack.DefinePlugin({
      __EMAILJS_SERVICE__: JSON.stringify(process.env.EMAILJS_SERVICE_ID || ''),
      __EMAILJS_TEMPLATE__: JSON.stringify(process.env.EMAILJS_TEMPLATE_ID || ''),
      __EMAILJS_PUBLIC__: JSON.stringify(process.env.EMAILJS_PUBLIC_KEY || '')
    })
  ],
  resolve: { extensions: ['.js'] },
});
