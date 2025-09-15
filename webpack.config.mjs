import path from 'path';
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
    clean: true,
  },
  devtool: 'source-map',
  devServer: {
    static: [
      { directory: path.join(__dirname, 'public') }, // sirve /public (imagenes, etc.)
      { directory: path.join(__dirname, 'dist') },   // y dist
    ],
    port: 5173,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  experiments: { topLevelAwait: true },
  module: {
    rules: [
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
