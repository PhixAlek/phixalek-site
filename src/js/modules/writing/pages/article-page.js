import { ui, text, bind, content } from '../../../../content/index.js';
import { articleFragment } from '../article-html.js';
import { articleDate, articleImage } from '../components/article-card.js';
import { resolveImage } from '../../images/registry.js';

export function reader(container, article, fallback, registry) {
  const layout = document.createElement('div'); layout.className = 'editorial-reader-layout';
  const story = document.createElement('article'); story.className = 'editorial-story'; story.lang = article.language || '';
  const meta = document.createElement('div'); meta.className = 'editorial-meta';
  const minutes = document.createElement('span'); text(minutes, () => `${article.readingMinutes} ${ui.writingPage.minutes}`);
  meta.append(articleDate(article), minutes);
  const heading = document.createElement('h1'); heading.textContent = article.title;
  const excerpt = document.createElement('p'); excerpt.className = 'editorial-deck'; excerpt.textContent = article.excerpt;
  const author = document.createElement('div'); author.className = 'editorial-author';
  const portrait = resolveImage(registry, 'phixalek-profile');
  if (portrait) { const image = document.createElement('img'); image.src = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? '/media/' + portrait.staticSrc : portrait.src; image.alt = ''; image.width = 44; image.height = 44; author.append(image); }
  const authorName = document.createElement('span'); authorName.textContent = `${content.hero.name} · Software Developer`; author.append(authorName);
  const prose = document.createElement('div'); prose.className = 'editorial-prose'; prose.append(articleFragment(article.html));
  story.append(meta, heading, excerpt, author, articleImage(article, fallback), prose);
  const aside = document.createElement('aside'); aside.className = 'editorial-toc';
  const title = document.createElement('p'); text(title, () => ui.writingPage.contents);
  const nav = document.createElement('nav'); bind(nav, 'attr:aria-label', () => ui.writingPage.contents);
  prose.querySelectorAll('h1,h2,h3').forEach((heading, index) => {
    heading.id = `article-heading-${index + 1}`;
    const anchor = document.createElement('a'); anchor.href = `#${heading.id}`; anchor.textContent = heading.textContent; nav.append(anchor);
  });
  if (nav.children.length) { aside.append(title, nav); layout.append(story, aside); }
  else { layout.classList.add('without-toc'); layout.append(story); }
  container.append(layout);
  const progress = document.createElement('progress'); progress.className = 'editorial-progress'; progress.max = 1;
  bind(progress, 'attr:aria-label', () => ui.writingPage.progress);
  const update = () => { const rect = story.getBoundingClientRect(); progress.value = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight))); };
  window.addEventListener('scroll', update, { passive: true }); update(); container.append(progress);
  return () => window.removeEventListener('scroll', update);
}

