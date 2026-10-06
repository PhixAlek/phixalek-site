import path from 'path';
import { readFileSync } from 'node:fs';
import { buildSeo } from './scripts/lib/seo.mjs';
import webpack from 'webpack';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

dotenv.config(); // carga .env

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true,
  },
  devtool: 'source-map',
  devServer: {
    static: [
      { directory: path.join(__dirname, 'public') }, // sirve /public (imagenes, etc.)
      { directory: path.join(__dirname, 'dist') },   // y dist
    ],
    port: 5173,
    open: false,
    hot: true,
    compress: true,
    historyApiFallback: true,
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
};
