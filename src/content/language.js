export const LANGUAGE_KEY = 'phixalek-language';
export function detectLanguage(preference, languages = []) {
  if (preference === 'en' || preference === 'es') return preference;
  for (const language of languages) {
    const base = String(language).toLowerCase().split('-')[0];
    if (base === 'en' || base === 'es') return base;
  }
  return 'en';
}
export function readPreference(storage) {
  try { return storage?.getItem(LANGUAGE_KEY); } catch { return null; }
}
export function savePreference(storage, locale) {
  try { storage?.setItem(LANGUAGE_KEY, locale); } catch { /* Storage is optional. */ }
}
