// webpack.config.mjs
import path from 'path';
import webpack from 'webpack';            // ← IMPORTANTE
import { fileURLToPath } from 'url';

// Utilidades para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default {
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      // CSS (ajústalo a tu setup real si usas SASS/PostCSS)
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      // Assets (imagenes, fuentes, etc.)
      { test: /\.(png|jpe?g|gif|svg|webp|ico)$/i, type: 'asset/resource', generator: { filename: 'media/[name][ext]' } },
    ],
  },
  plugins: [
    // Exponer SOLO variables PÚBLICAS al cliente
    new webpack.DefinePlugin({
      __EMAILJS_SERVICE__: JSON.stringify(process.env.PUBLIC_EMAILJS_SERVICE_ID || ''),
      __EMAILJS_TEMPLATE__: JSON.stringify(process.env.PUBLIC_EMAILJS_TEMPLATE_ID || ''),
      __EMAILJS_PUBLIC__:  JSON.stringify(process.env.PUBLIC_EMAILJS_PUBLIC_KEY  || ''),
      __DEFAULT_TZ__:      JSON.stringify(process.env.PUBLIC_DEFAULT_TZ         || 'America/Bogota'),
    }),
  ],
  mode: 'production',
};
