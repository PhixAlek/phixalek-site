import { afterFirstPaint } from '../common/after-first-paint.js';
import { loadWritingState, applyPostImage, openLatestArticle } from '../writing/latest.js';
import { mountNavigationWave } from '../common/navigation-wave.js';
import { writingContent, ui, bind, text, locale } from '../../../content/index.js';
import { publishedItems, validDestination } from '../../../content/model.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';

export function Writing() {
  const source = writingContent?.source?.url;
  if (writingContent?.publication !== 'published' || !validDestination(source)) return null;
  const entry = publishedItems(writingContent)[0];
  let latestPost = null;
  let state = 'loading';
  let accessedAt = new Date();
  let coverImage = null, fallbackImage = null;
  const section = document.createElement('section');
  section.className = 'section writing';
  section.id = 'writing';
  section.setAttribute('aria-labelledby', 'writing-title');
  const container = document.createElement('div');
  container.className = 'container';
  const heading = document.createElement('h2');
  heading.id = 'writing-title';
  heading.className = 'h2';
  mountNavigationWave(heading, section, () => ui.writing.title);
  const header = document.createElement('div');
  header.className = 'writing-header';
  const allPosts = document.createElement('a');
  allPosts.className = 'writing-all';
  allPosts.href = source;
  allPosts.target = '_blank';
  allPosts.rel = 'noopener noreferrer';
  const allText = document.createElement('span');
  text(allText, () => ui.writing.allPosts);
  const allArrow = document.createElement('span');
  allArrow.textContent = '→';
  allArrow.setAttribute('aria-hidden', 'true');
  allPosts.append(allText, allArrow);
  header.append(heading, allPosts);
  const link = document.createElement('a');
  link.className = 'writing-entry';
  link.href = entry?.kind === 'article' ? entry.url : source;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const mark = document.createElement('span');
  mark.className = 'writing-mark';
  mark.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  copy.className = 'writing-entry-copy';
  const label = document.createElement('time');
  label.className = 'writing-label';
  const labelText = () => new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year:'numeric', month:'short', day:'numeric', ...(latestPost ? { timeZone:'UTC' } : {}),
  }).format(latestPost ? new Date(latestPost.published) : accessedAt);
  bind(label, 'attr:datetime', () => latestPost?.published || accessedAt.toISOString());
  text(label, labelText);
  const title = document.createElement('h3');
  const refreshTitle = mountNavigationWave(title, section,
    () => latestPost?.title || ui.writing.states[state].title,
    { after: heading });
  const status = document.createElement('p');
  status.className = 'writing-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const refreshStatus = () => {
    text(status, () => state === 'ready' ? '' : ui.writing.states[state].message);
    bind(status, 'hidden', () => state === 'ready');
    bind(copy, 'attr:aria-busy', () => String(state === 'loading'));
  };
  refreshStatus();
  copy.append(label, title, status);
  const action = document.createElement('span');
  action.className = 'writing-action';
  const arrow = document.createElement('span');
  arrow.textContent = '→';
  arrow.setAttribute('aria-hidden', 'true');
  action.append(arrow);
  link.append(mark, copy, action);
  if (entry?.imageId) {
    link.classList.add('has-cover');
    const cover = document.createElement('div');
    cover.className = 'writing-cover';
    link.append(cover);
    loadImageRegistry().then(async registry => {
      const image = resolveImage(registry, entry.imageId);
      if (!image?.src) return;
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = image.width;
      img.height = image.height;
      cover.append(img);
      coverImage = img;
      fallbackImage = image.src;
      if (latestPost) {
        const current = latestPost;
        await applyPostImage(img, current.image, fallbackImage, () => latestPost === current);
      }
    }).catch(error => console.error('[writing image]', error));
  }
  const refreshWriting = async (force = false) => {
    const result = await loadWritingState(undefined, { force });
    if (!section.isConnected) return source;
    accessedAt = new Date(result.accessedAt);
    state = result.status;
    latestPost = result.post;
    link.href = latestPost?.url || source;
    text(label, labelText);
    bind(label, 'attr:datetime', () => latestPost?.published || accessedAt.toISOString());
    refreshTitle();
    refreshStatus();
    const current = latestPost;
    if (coverImage) applyPostImage(coverImage, current?.image, fallbackImage, () => latestPost === current);
    return latestPost?.url || source;
  };
  afterFirstPaint(() => { if (section.isConnected) refreshWriting(); });
  allPosts.addEventListener('click', () => { refreshWriting(true); });
  link.addEventListener('click', event => {
    openLatestArticle(event, () => refreshWriting(true), ui.writing.states.loading.title);
  });
  container.append(header, link);
  // Keep the primary preview before the external archive in mobile reading order.
  const mobile = window.matchMedia('(max-width: 767px)');
  const arrange = () => {
    if (mobile.matches) container.append(allPosts);
    else header.append(allPosts);
  };
  arrange();
  mobile.addEventListener('change', arrange);
  section.append(container);
  return section;
}
