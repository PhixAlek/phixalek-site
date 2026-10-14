import { createReaderCover } from '../components/reader-cover.js';
import { ArticleComments } from '../components/article-comments.js';
import { ui, text, bind, content } from '../../../../content/index.js';
import { articleFragment } from '../article-html.js';
import { articleDate } from '../components/article-card.js';
import { resolveImage } from '../../images/registry.js';
import { mountReaderContents } from '../components/reader-contents.js';
import { mountReaderEngagement } from '../components/reader-engagement.js';

export function reader(container, article, fallback, registry, { featured = false } = {}) {
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
  const authorDetails = document.createElement('div'); authorDetails.className = 'editorial-author-details';
  const authorName = document.createElement('span'); authorName.className = 'editorial-author-name'; authorName.textContent = content.hero.name;
  const authorRole = document.createElement('span'); authorRole.className = 'editorial-author-role'; authorRole.textContent = 'Software Developer';
  authorDetails.append(authorName, authorRole); author.append(authorDetails);
  const prose = document.createElement('div'); prose.className = 'editorial-prose'; prose.append(articleFragment(article.html, window, article.sourceUrl));
  const cover = createReaderCover(article, fallback, { featured });
  story.append(meta, heading, excerpt, author, cover, prose, ArticleComments(article, { ui, text, bind }));
  layout.append(story);
  const disposeContents = mountReaderContents(layout, story, prose, { label: node => text(node, () => ui.writingPage.contents), includeComments: article.engagement?.comments > 0 || Boolean(article.engagement?.preview?.length), commentsLabel: node => text(node, () => ui.writingPage.comments) });
  const disposeEngagement = mountReaderEngagement(story, prose, article, { ui, text, bind });
  container.append(layout);
  const progress = document.createElement('progress'); progress.className = 'editorial-progress'; progress.max = 1;
  bind(progress, 'attr:aria-label', () => ui.writingPage.progress);
  const update = () => { const rect = story.getBoundingClientRect(); progress.value = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight))); };
  window.addEventListener('scroll', update, { passive: true }); update(); container.append(progress);
  return () => { disposeEngagement(); disposeContents(); window.removeEventListener('scroll', update); };
}
