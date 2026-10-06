/** Validate owner-managed settings before publishing; never accept visitor-controlled sources. */
export function validateWritingConfig(config) {
  const errors = [];
  let origin;
  try {
    origin = new URL(config?.source?.origin);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error();
  } catch { errors.push('writing.source.origin: HTTPS origin required'); }
  if (config?.source?.provider !== 'substack') errors.push('writing.source.provider: unsupported provider');
  if (config?.source?.feedPath !== '/feed') errors.push('writing.source.feedPath: expected /feed');
  if (!/^\/[a-z0-9-]+$/.test(config?.routes?.index || '')) errors.push('writing.routes.index: one path segment required');
  if (!config?.fallbackImageId) errors.push('writing.fallbackImageId: image identifier required');
  const categories = config?.categories;
  if (!Array.isArray(categories)) errors.push('writing.categories: array required');
  else {
    const ids = new Set();
    for (const category of categories) {
      if (!category?.id || ids.has(category.id)) errors.push('writing.categories: missing or duplicate identifier');
      ids.add(category?.id);
      if (typeof category?.labels?.en !== 'string' || !category.labels.en.trim() || typeof category?.labels?.es !== 'string' || !category.labels.es.trim()) errors.push('writing.categories: approved English and Spanish labels required');
    }
  }
  const overrides = config?.articleOverrides;
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) errors.push('writing.articleOverrides: object required');
  else for (const [sourceUrl, override] of Object.entries(overrides)) {
    try {
      const url = new URL(sourceUrl);
      if (!origin || url.origin !== origin.origin || url.username || url.password || url.search || url.hash || !/^\/p\/[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(url.pathname)) throw new Error();
    } catch { errors.push('writing.articleOverrides: canonical publication URL required'); }
    if (override?.language != null && !['en', 'es'].includes(override.language)) errors.push('writing.articleOverrides.language: en or es required');
  }
  return errors;
}
