import { readFileSync } from 'node:fs';

// Only webpack-dev-server uses this policy; deployed headers remain in netlify.toml.
const production = readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8')
  .match(/Content-Security-Policy = "([^"]+)"/)[1];
export const developmentCSP = production.replace("connect-src 'self'", "connect-src 'self' ws://127.0.0.1:5173 ws://localhost:5173");
