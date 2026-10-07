import { applyPageMetadata, writingMetadata, SITE_ORIGIN, writingStructuredData, serializedSchema } from '../../../shared/writing/metadata.js';
import { ui, text, bind } from '../../../content/index.js';
import { writingConfig } from '../../../shared/writing/config.js';
import { loadArticles } from './feed.js';
import { listing, listingIntro } from './pages/index-page.js';
import { reader } from './pages/article-page.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';

function backLink(route) {
  const back = document.createElement('a');
  back.href = route.kind === 'article' ? writingConfig.routes.index : '/#writing';
  back.className = 'editorial-back'; back.dataset.routeBack = '';
  back.textContent = '←'; bind(back, 'attr:aria-label', () => ui.writingPage.back);
  return back;
}

export function WritingPage(route) {
  const page = document.createElement('main'); page.id = 'main-content'; page.className = 'site writing-page';
  const container = document.createElement('div'); container.className = 'container editorial-container';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  text(status, () => ui.writing.states.loading.message); container.append(backLink(route));
  if (route.kind === 'index') listingIntro(container);
  container.append(status); page.append(container);
  page.setAttribute('aria-busy', 'true'); let cleanup = () => {};
  const ready = (async () => {
    try {
      const [articles, registry] = await Promise.all([loadArticles(), loadImageRegistry()]);
      if (!page.isConnected) return;
      const fallback = resolveImage(registry, writingConfig.fallbackImageId);
      const article = route.kind === 'article' ? articles.find(item => item.slug === route.slug) : null;
      const metadata = writingMetadata(article, { title: ui.writingPage.title, description: ui.writingPage.intro, image: SITE_ORIGIN + fallback.src });
      // Unknown SPA URLs must not be indexed as duplicates of the archive.
      applyPageMetadata(document, metadata, { indexable: route.kind === 'index' || Boolean(article) });
      document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
      if (route.kind === 'index' || article) {
        const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.id = 'writing-structured-data';
        schema.textContent = serializedSchema(writingStructuredData(article, articles, metadata)); document.head.append(schema);
      }
      if (route.kind === 'index' && !articles.length) {
        text(status, () => ui.writing.states.empty.message);
        return;
      }
      status.remove();
      if (route.kind === 'index') listing(container, articles, fallback);
      else {
        if (!article) { text(status, () => ui.writing.states.empty.message); container.append(status); return; }
        cleanup = reader(container, article, fallback, registry);
      }
    } catch { text(status, () => ui.writing.states.unavailable.message); }
    finally { page.setAttribute('aria-busy', 'false'); }
  })();
  return { page, ready, dispose: () => cleanup() };
}
