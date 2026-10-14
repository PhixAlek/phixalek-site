// Match CSS: portrait tablets use the feed; wide landscape screens use list/grid.
export const EDITORIAL_DESKTOP_QUERY = '(min-width: 1024px) and (orientation: landscape), (min-width: 1200px)';

/** Keep Featured fixed above discovery; include it when a filter/search explicitly matches it. */
export function selectFeedArticles(articles, { desktop = false, filtered = false } = {}) {
  if (filtered) return articles;
  return desktop || articles.length > 1 ? articles.slice(1) : articles;
}
const searchable = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Compile the taxonomy from published item tags; definitions only rename/group existing tags. */
export function deriveCategories(articles, { definitions = [], removedSlugs = [], articleOverrides = {} } = {}) {
  const groups = new Map();
  for (const article of articles) {
    if (removedSlugs.includes(article.slug)) continue;
    const tags = [...(article.categories || []), ...(articleOverrides[article.sourceUrl]?.categories || [])];
    const seen = new Set();
    for (const tag of tags) {
      if (typeof tag !== 'string' || !tag.trim()) continue;
      const label = tag.trim(), key = searchable(label);
      const definition = definitions.find(item => [item.id, item.labels.en, item.labels.es, ...(item.aliases || [])]
        .some(alias => searchable(alias.trim()) === key));
      const id = definition?.id || `tag:${key}`;
      if (!groups.has(id)) groups.set(id, { id, labels: definition?.labels || { en: label, es: label },
        aliases: [...new Set([...(definition?.aliases || []), label])], count: 0 });
      const group = groups.get(id);
      if (!group.aliases.includes(label)) group.aliases.push(label);
      if (!seen.has(id)) { group.count++; seen.add(id); }
    }
  }
  return [...groups.values()];
}

export function filterArticles(articles, { query = '', category = '', language = '', categories = [] } = {}) {
  const needle = searchable(query.trim());
  const selected = categories.find(item => item.id === category);
  const aliases = selected ? [selected.id, selected.labels.en, selected.labels.es, ...(selected.aliases || [])].map(searchable) : [];
  return articles.filter(article => (!language || article.language === language) && (!category || article.categories.some(tag => aliases.includes(searchable(tag))))
    && (!needle || searchable(`${article.title} ${article.excerpt} ${article.categories.join(' ')}`).includes(needle)));
}

/** Repeated entries keep their source identity; only each visual occurrence gets a new key. */
export function feedBatch(articles, offset, count, { repeat = false } = {}) {
  if (!articles.length) return [];
  const length = repeat ? count : Math.min(count, Math.max(0, articles.length - offset));
  return Array.from({ length }, (_, index) => {
    const position = offset + index;
    const article = articles[position % articles.length];
    return { article, position: position + 1, key: `${article.id}:${position}` };
  });
}

export function categoryForTag(tag, categories) {
  const key = searchable(tag);
  return categories.find(item => [item.id, item.labels.en, item.labels.es, ...(item.aliases || [])]
    .some(alias => searchable(alias) === key))?.id || '';
}
