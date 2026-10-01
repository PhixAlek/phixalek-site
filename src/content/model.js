/** @typedef {'draft'|'published'} Publication */
/** @typedef {{kind:'link', text:string, href:string}|{kind:'booking', text:string}} Action */
/** @typedef {{id:string, publication:Publication, role:string, organization:string, dates:{start:string,end:string|null}, industry:string, context:string, technologies:string[], responsibilities:string[], outcomes:Array<{description:string,evidence?:string}>, links:Action[]}} Experience */
/** @typedef {{id:string, slug:string, publication:Publication, title:string, status:'planned'|'in-progress'|'released', overview:string, problem:string, role:string, implementedStack:string[], inProgress:string[], planned:string[], screenshots:Array<{src:string,alt:string,width:number,height:number}>, decisions:string[], architecture:string[], repository:string|null, liveDemo:string|null, lessons:string[]}} Project */

export const ANCHORS = ['home', 'about', 'work', 'contact'];
export function validDestination(value) {
  if (typeof value !== 'string' || value !== value.trim() || !value) return false;
  if (value.startsWith('#')) return ANCHORS.includes(value.slice(1));
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}
export function validAction(action) {
  return Boolean(action && typeof action.text === 'string' && action.text.trim() &&
    (action.kind === 'booking' || (action.kind === 'link' && validDestination(action.href))));
}
export function publishedItems(section) {
  if (section?.publication !== 'published') return [];
  return (section.items || []).filter(item => item.publication === 'published');
}
export function format(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}
/** Unpublished translations fall back as a whole, avoiding mixed-language UI. */
export function resolveCatalog(locale, catalogs) {
  return catalogs[locale]?.publication === 'published' ? catalogs[locale] : catalogs.en;
}
function strings(value, visit, path = '') {
  if (typeof value === 'string') visit(value, path);
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => strings(item, visit, `${path}.${key}`));
}
export function validateContent(content, catalogs, sections) {
  const errors = [];
  const requireText = (value, path) => {
    if (typeof value !== 'string' || !value.trim() || /\bTODO\b/i.test(value)) errors.push(`${path}: required approved text`);
  };
  const checkPublished = (value, path) => strings(value, (text, field) => {
    if (/\bTODO\b/i.test(text)) errors.push(`${path}${field}: draft text cannot be published`);
  });
  checkPublished({ ...content, projects: { ...content.projects, items: (content.projects?.items || []).filter(item => item.publication === 'published') } }, 'content');
  for (const field of ['name', 'subtitle']) requireText(content.hero?.[field], `hero.${field}`);
  for (const key of ['ctaPrimary', 'ctaSecondary']) {
    const action = content.hero?.[key];
    if (!validAction({ ...action, kind: 'link' })) errors.push(`hero.${key}: invalid destination or label`);
  }
  const ids = new Set();
  for (const item of content.projects?.items || []) {
    if (!item.id || ids.has(item.id)) errors.push('projects: missing or duplicate id');
    ids.add(item.id);
    if (!['draft','published'].includes(item.publication)) errors.push(`${item.id}: invalid publication`);
    if (item.publication !== 'published') continue;
    requireText(item.title, `${item.id}.title`); requireText(item.desc, `${item.id}.desc`);
    for (const action of item.actions || []) if (!validAction(action)) errors.push(`${item.id}: invalid action`);
  }
  for (const link of content.footer?.social || []) if (!validDestination(link.href)) errors.push('footer: invalid social URL');
  const base = catalogs.en?.messages;
  if (!base || catalogs.en.publication !== 'published') errors.push('English fallback is required');
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (!['draft','published'].includes(catalog.publication)) errors.push(`${locale}: invalid publication`);
    if (catalog.publication !== 'published') continue;
    checkPublished(catalog.messages, locale);
    // Require every base key with the same type and interpolation variables.
    strings(base, (text, path) => {
      const value = path.slice(1).split('.').reduce((obj, key) => obj?.[key], catalog.messages);
      if (typeof value !== 'string' || !value.trim()) { errors.push(`${locale}${path}: missing translation`); return; }
      const tokens = v => [...v.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
      if (tokens(text) !== tokens(value)) errors.push(`${locale}${path}: mismatched placeholders`);
    });
    for (const item of catalog.messages.navigation?.items || []) if (!validDestination(item.href)) errors.push(`${locale}: invalid navigation destination`);
  }
  for (const [name, section] of Object.entries(sections)) {
    if (!['draft','published'].includes(section.publication)) errors.push(`${name}: invalid publication`);
    const sectionIds = new Set();
    for (const item of section.items || []) {
      if (!item.id || sectionIds.has(item.id)) errors.push(`${name}: missing or duplicate id`);
      sectionIds.add(item.id);
      if (!['draft','published'].includes(item.publication)) errors.push(`${name}.${item.id}: invalid publication`);
    }
    if (section.publication !== 'published') continue;
    for (const item of publishedItems(section)) {
      checkPublished(item, name);
      const fields = name === 'work' ? ['title','slug','overview','problem','role'] : name === 'experience' ? ['role','organization'] : name === 'evidence' ? ['value'] : ['title','url'];
      fields.forEach(field => requireText(item[field], `${name}.${item.id}.${field}`));
      if (name === 'evidence') {
        for (const [locale, catalog] of Object.entries(catalogs)) {
          if (catalog.publication === 'published') requireText(catalog.messages.evidence?.contexts?.[item.id], `${locale}.evidence.${item.id}.context`);
        }
      }
      if (name === 'work' && !['planned','in-progress','released'].includes(item.status)) errors.push(`${item.id}: invalid project status`);
      for (const field of ['repository','liveDemo','url']) if (item[field] != null && !validDestination(item[field])) errors.push(`${item.id}.${field}: invalid URL`);
      for (const action of item.links || []) if (!validAction(action)) errors.push(`${item.id}: invalid link`);
    }
    if (name === 'writing' && !validDestination(section.source?.url)) errors.push('writing: source URL required');
  }
  return errors;
}

/** Translations may alter prose, never routes, project IDs or action behavior. */
export function validateTranslation(base, translated) {
  const errors = [];
  function walk(a, b, path = '') {
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) { errors.push(`${path}: different structure`); return; }
      a.forEach((v, i) => walk(v, b[i], `${path}.${i}`));
    } else if (a && typeof a === 'object') {
      if (!b || typeof b !== 'object') { errors.push(`${path}: missing object`); return; }
      Object.keys(a).forEach(key => {
        if (['href','id','imageId','avatarId','kind','publication','className','mailTo','email','icon','name'].includes(key) && a[key] !== b[key]) errors.push(`${path}.${key}: translated invariant`);
        walk(a[key], b[key], `${path}.${key}`);
      });
    } else if (typeof a !== typeof b || (typeof b === 'string' && (!b.trim() || /\bTODO\b/.test(b)))) errors.push(`${path}: missing translation`);
  }
  walk(base, translated);
  return errors;
}
