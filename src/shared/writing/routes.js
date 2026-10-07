import { writingConfig } from './config.js';

const base = writingConfig.routes.index;
const validSlug = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value);

export function articlePath(slug) {
  if (!validSlug(slug)) throw new TypeError('Invalid article slug');
  return `${base}/${slug}`;
}

/** Keep Home navigation within its sections; Writing pages link to the archive. */
export function homeNavigationHref(destination, isHome) {
  if (destination === '#writing' && !isHome) return base;
  return `${isHome ? '' : '/'}${destination}`;
}

/** Resolve paths only: the caller owns navigation, history and page rendering. */
export function resolveWritingRoute(pathname) {
  if (typeof pathname !== 'string') return null;
  if (pathname === base || pathname === `${base}/`) return { kind: 'index' };
  if (!pathname.startsWith(`${base}/`)) return null;
  const slug = pathname.slice(base.length + 1).replace(/\/$/, '');
  return validSlug(slug) ? { kind: 'article', slug } : null;
}
