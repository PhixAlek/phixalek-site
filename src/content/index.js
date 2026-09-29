import legacy from '../data/content.json' assert { type: 'json' };
import english from './locales/en.json' assert { type: 'json' };
import { validAction, publishedItems } from './model.js';
export { format } from './model.js';

// Phase 1 keeps the current English experience. Phase 2 will manage language
// selection and state-preserving UI updates; draft Spanish is not shipped.
export const ui = english.messages;
export const content = {
  ...legacy,
  projects: {
    ...legacy.projects,
    items: publishedItems({ ...legacy.projects, publication: 'published' })
      .map(item => ({ ...item, actions: (item.actions || []).filter(validAction) })),
  },
};
