import { writingConfig } from './config.js';
const key = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export function tagDefinition(tag, definitions = writingConfig.categories) {
  return definitions.find(item => [item.id, item.labels.en, item.labels.es, ...(item.aliases || [])].some(alias => key(alias) === key(tag)));
}
export const isArticleType = tag => tagDefinition(tag)?.kind === 'type';
export function orderedTags(tags) {
  const rank = tag => { const index = writingConfig.categories.findIndex(item => item.kind === 'type' && item === tagDefinition(tag)); return index < 0 ? Infinity : index; };
  return [...tags].sort((a, b) => rank(a) - rank(b));
}
