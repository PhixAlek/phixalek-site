import englishContent from '../data/content.json' assert { type: 'json' };
import spanishContent from '../data/content.es.json' assert { type: 'json' };
import english from './locales/en.json' assert { type: 'json' };
import spanish from './locales/es.json' assert { type: 'json' };
import { validAction, publishedItems } from './model.js';
import { detectLanguage, readPreference, savePreference } from './language.js';
export { format } from './model.js';
let storage;
try { storage = window.sessionStorage; } catch { /* Private browsing may deny access. */ }
let manualPreference = readPreference(storage);
export let locale = detectLanguage(manualPreference, navigator.languages || [navigator.language]);
const catalogs = { en: english, es: spanish };
const editorial = { en: englishContent, es: spanishContent };
// Stable nested proxies keep existing references (booking copy, form content)
// current without remounting components or resetting any interaction state.
function live(getter) {
  const children = new Map();
  return new Proxy({}, { get(_, key) {
    const value = getter()[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!children.has(key)) children.set(key, live(() => getter()[key]));
      return children.get(key);
    }
    return value;
  }});
}
export const ui = live(() => catalogs[locale].messages);
export const content = live(() => ({
  ...editorial[locale],
  projects: { ...editorial[locale].projects,
    items: publishedItems({ ...editorial[locale].projects, publication: 'published' })
      .map(item => ({ ...item, actions: (item.actions || []).filter(validAction) })),
  },
}));
const bindings = new Map();
/** Update text/attributes in place, never replace inputs or their state. */
export function bind(node, property, getter) {
  if (!bindings.has(node)) bindings.set(node, new Map());
  bindings.get(node).set(property, getter);
  apply(node, property, getter());
  return node;
}
function apply(node, property, value) {
  if (property.startsWith('attr:')) node.setAttribute(property.slice(5), value);
  else node[property] = value;
}
export function unbind(node, property) { bindings.get(node)?.delete(property); }
export const text = (node, getter) => bind(node, 'textContent', getter);
export function setLanguage(next, persist = true) {
  if (!catalogs[next]) return;
  if (persist) { manualPreference = next; savePreference(storage, next); }
  if (next === locale) return;
  locale = next;
  document.documentElement.lang = locale;
  for (const [node, properties] of bindings) {
    if (!node.isConnected) { bindings.delete(node); continue; }
    for (const [property, getter] of properties) apply(node, property, getter());
  }
}
document.documentElement.lang = locale;
window.addEventListener('languagechange', () => setLanguage(detectLanguage(manualPreference, navigator.languages || [navigator.language]), false));
export function languageButton(className = '') {
  const button = document.createElement('button');
  button.type = 'button'; button.className = `language-toggle ${className}`;
  if (className === 'language-footer') {
    const active = document.createElement('strong');
    const alternative = document.createElement('span');
    text(active, () => locale === 'en' ? 'ES' : 'EN');
    text(alternative, () => locale);
    bind(active, 'attr:lang', () => locale === 'en' ? 'es' : 'en');
    bind(alternative, 'attr:lang', () => locale);
    button.append(active, document.createTextNode(' / '), alternative);
  } else {
    text(button, () => locale === 'en' ? 'Es' : 'En');
  }
  bind(button, 'attr:aria-label', () => ui.language.switch);
  bind(button, 'attr:lang', () => locale === 'en' ? 'es' : 'en');
  button.addEventListener('click', () => setLanguage(locale === 'en' ? 'es' : 'en'));
  return button;
}
