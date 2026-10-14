import '../../../css/writing.css';
import { applyPageMetadata, writingMetadata, SITE_ORIGIN, writingStructuredData, serializedSchema } from '../../../shared/writing/metadata.js';
import { ui, text, bind, releaseBindings } from '../../../content/index.js';
import { writingConfig } from '../../../shared/writing/config.js';
import { mountWritingArrivalWave } from './components/arrival-wave.js';
import { loadArticles } from './feed.js';
import { listing, listingIntro } from './pages/index-page.js';
import { reader } from './pages/article-page.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';
import { createWritingError } from './components/writing-error.js';
import { mountSubstackInteractions } from './components/substack-interactions.js';

function backLink(route) {
  const back = document.createElement('a');
  back.href = route.kind === 'article' ? writingConfig.routes.index : '/#writing';
  back.className = 'editorial-back'; back.dataset.routeBack = '';
  back.textContent = '←'; bind(back, 'attr:aria-label', () => ui.writingPage.back);
  return back;
}

export function WritingPage(route) {
  const page = document.createElement('main'); page.id = 'main-content'; page.className = 'site writing-page'; page.dataset.writingView = route.kind;
  const container = document.createElement('div'); container.className = 'container editorial-container';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  text(status, () => ui.writing.states.loading.message); if (route.kind !== 'index') container.append(backLink(route));
  if (route.kind === 'index') listingIntro(container, backLink(route));
  container.append(status); page.append(container);
  const disposeWave = mountWritingArrivalWave(page);
  page.setAttribute('aria-busy', 'true'); let cleanup = () => {};
  let lastArticles = [], lastFallback;
  const showError = () => {
    cleanup(); releaseBindings(container); container.replaceChildren();
    const error = createWritingError({ ui, text, articles: lastArticles, topic: route.slug || '', fallback: lastFallback, retry: retryLoad });
    container.append(error); const heading = error.querySelector('h1'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); cleanup = () => { releaseBindings(error); error.remove(); };
    page.dataset.writingView = 'error';
    applyPageMetadata(document, writingMetadata(null, { title: ui.writingPage.errorHeading, description: ui.writingPage.errorDescription }), { indexable: false });
    document.querySelector('link[rel="canonical"]')?.remove();
    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  };
  const load = async (force = false) => {
    page.setAttribute('aria-busy', 'true');
    try {
      const [articles, registry] = await Promise.all([loadArticles({ force, preferSnapshot: true, writingVisit: true }), loadImageRegistry()]);
      if (!page.isConnected) return;
      const fallback = resolveImage(registry, writingConfig.fallbackImageId) || { src: '/media/mountains.svg' };
      lastArticles = articles; lastFallback = fallback;
      const article = route.kind === 'article' ? articles.find(item => item.slug === route.slug) : null;
      const metadata = writingMetadata(article, { title: ui.writingPage.title, description: ui.writingPage.intro, image: SITE_ORIGIN + fallback.src });
      // Unknown SPA URLs must not be indexed as duplicates of the archive.
      applyPageMetadata(document, metadata, { indexable: route.kind === 'index' || Boolean(article) });
      document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
      if (route.kind === 'index' || article) {
        const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.id = 'writing-structured-data';
        schema.textContent = serializedSchema(writingStructuredData(article, articles, metadata)); document.head.append(schema);
      }
      if (!articles.length || (route.kind !== 'index' && !article)) { showError(); return; }
      cleanup(); releaseBindings(container); container.replaceChildren();
      page.dataset.writingView = route.kind;
      if (route.kind === 'index') { listingIntro(container, backLink(route)); cleanup = listing(container, articles, fallback); }
      else { container.append(backLink(route)); cleanup = reader(container, article, fallback, registry, { featured: articles[0]?.id === article.id }); }
      const disposeContent = cleanup;
      const disposeProvider = mountSubstackInteractions(container, { article, ui, text, bind, release: releaseBindings });
      cleanup = () => { disposeProvider(); disposeContent(); };
    } catch { if (page.isConnected) showError(); }
    finally { page.setAttribute('aria-busy', 'false'); }
  };
  const retryLoad = () => { cleanup(); releaseBindings(container); container.replaceChildren(status); text(status, () => ui.writing.states.loading.message); void load(true); };
  const ready = load();
  return { page, ready, dispose: () => { cleanup(); disposeWave(); } };
}
