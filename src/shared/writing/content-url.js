import { PUBLICATION } from './config.js';

export function contentURL(value, base = PUBLICATION, { image = false } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > 8192) return null;
  try {
    const url = new URL(value, base);
    if (url.username || url.password || !['https:', ...(image ? [] : ['mailto:'])].includes(url.protocol)) return null;
    return url.href;
  } catch { return null; }
}
