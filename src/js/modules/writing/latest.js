const PUBLICATION = 'https://phixalek.substack.com';

function httpsURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function selectLatestPost(items) {
  return items.map(item => {
    const url = httpsURL(item.url);
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const published = Date.parse(item.published);
    if (!title || title.length > 500 || !url || url.origin !== PUBLICATION || !url.pathname.startsWith('/p/') || !Number.isFinite(published)) return null;
    return { title, url: url.href, published: new Date(published).toISOString(), image: httpsURL(item.image)?.href || null };
  }).filter(Boolean).sort((a, b) => Date.parse(b.published) - Date.parse(a.published))[0] || null;
}

export function parseSubstackFeed(xml) {
  const feed = new DOMParser().parseFromString(xml, 'application/xml');
  if (feed.querySelector('parsererror') || feed.documentElement.localName !== 'rss') throw new Error('Invalid Substack feed');
  const channel = [...feed.documentElement.children].find(node => node.localName === 'channel');
  if (!channel) throw new Error('Invalid Substack feed');
  const items = [...channel.children].filter(node => node.localName === 'item').map(item => {
    const child = name => [...item.children].find(node => node.localName === name);
    const enclosure = child('enclosure');
    const media = [...item.children].find(node => node.namespaceURI === 'http://search.yahoo.com/mrss/' && ['content', 'thumbnail'].includes(node.localName));
    return {
      title: child('title')?.textContent,
      url: child('link')?.textContent?.trim(),
      published: child('pubDate')?.textContent,
      image: enclosure?.getAttribute('type')?.startsWith('image/') ? enclosure.getAttribute('url') : media?.getAttribute('url'),
    };
  });
  return selectLatestPost(items);
}

export async function loadLatestPost(fetchFeed = fetch) {
  const result = await fetchFeed('/.netlify/functions/latest-writing', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!result.ok) throw new Error('Writing unavailable');
  return parseSubstackFeed(await result.text());
}

// Keep the existing local cover visible until a remote image has fully loaded.
export async function applyPostImage(img, source, fallback, isCurrent = () => true) {
  img.onerror = null;
  if (!source) { img.src = fallback; return; }
  const candidate = new Image();
  candidate.src = source;
  try {
    await candidate.decode();
    if (!isCurrent()) return;
    img.onerror = () => { if (isCurrent()) { img.onerror = null; img.src = fallback; } };
    img.src = source;
  } catch { if (isCurrent()) img.src = fallback; }
}


export const WRITING_SESSION_KEY = 'phixalek.writing-session.v1';
const pendingSessions = new WeakMap();
function sessionStorage() {
  try { return globalThis.window?.sessionStorage; } catch { return undefined; }
}
function readSession(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(WRITING_SESSION_KEY) || 'null');
    if (!saved || !['ready', 'empty', 'unavailable'].includes(saved.status) || !Number.isFinite(Date.parse(saved.accessedAt))) return null;
    if (saved.status !== 'ready') return { status:saved.status, post:null, accessedAt:saved.accessedAt };
    const post = selectLatestPost([saved.post || {}]);
    return post ? { status:'ready', post, accessedAt:saved.accessedAt } : null;
  } catch { return null; }
}

// Reload keeps the tab session; an explicit writing click can request fresh data.
export async function loadWritingState(load = loadLatestPost, { storage = sessionStorage(), force = false } = {}) {
  const saved = readSession(storage);
  if (saved && !force) return saved;
  if (storage && pendingSessions.has(storage)) return pendingSessions.get(storage);
  const request = (async () => {
    const accessedAt = saved?.accessedAt || new Date().toISOString();
    let result;
    try {
      const post = await load();
      result = post ? { status:'ready', post, accessedAt } : { status:'empty', post:null, accessedAt };
    } catch { result = { status:'unavailable', post:null, accessedAt }; }
    try { storage?.setItem(WRITING_SESSION_KEY, JSON.stringify(result)); } catch { /* Storage restrictions must not break the card. */ }
    return result;
  })();
  if (storage) pendingSessions.set(storage, request);
  try { return await request; }
  finally { if (storage) pendingSessions.delete(storage); }
}


// Reserve the new tab during the click, then navigate to the refreshed article.
export function openLatestArticle(event, refresh, loadingText, view = window) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    refresh();
    return;
  }
  const popup = view.open('about:blank', '_blank');
  if (!popup) { refresh(); return; }
  popup.opener = null;
  popup.document.title = loadingText;
  popup.document.body.textContent = loadingText;
  event.preventDefault();
  Promise.resolve(refresh()).then(destination => {
    if (!popup.closed) popup.location.replace(destination);
  }).catch(() => { if (!popup.closed) popup.close(); });
}
