import '../css/tokens.css';
import '../css/styles.css';

import { Header } from './modules/header/header.js';
import { Main }   from './modules/main/index.js';
import { Footer } from './modules/footer/footer.js';
import { mountBooking }    from './modules/common/booking.js';
import { mountContactEmailJS } from './modules/common/contact.js';

import { mountReveal } from './modules/common/reveal.js';
import { mountRouter } from './modules/writing/router.js';
import { buildSeo } from '../../scripts/lib/seo.mjs';
import homeContent from '../data/content.json';
import { applyPageMetadata, homeMetadata } from '../shared/writing/metadata.js';
import { homeNavigationHref } from '../shared/writing/routes.js';
import { mountNavigation } from './modules/common/navigation.js';

function bootstrap(){

  const app = document.getElementById('app');
  if(!app){ console.error('[index] #app no existe'); return; }

  const header = Header();
  const footer = Footer();
  let prerender = app.querySelector('[data-writing-prerender]');
  app.replaceChildren(header, ...(prerender ? [prerender] : []), footer);
  let home, currentPage, cleanupNavigation, disposePage;
  mountRouter(async (route, isCurrent) => {
    cleanupNavigation?.();
    cleanupNavigation = null;
    const isHome = route.kind === 'home';
    document.querySelectorAll('[data-home-href]').forEach(link => {
      const destination = link.dataset.homeHref;
      link.href = homeNavigationHref(destination, isHome);
      if (!isHome && destination === '#writing') link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const backTop = footer.querySelector('.ft-back');
    backTop.href = isHome ? '#home' : '#main-content';
    if (isHome) {
      applyPageMetadata(document, homeMetadata);
      document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
      const schema = document.createElement('script'); schema.type = 'application/ld+json';
      schema.textContent = buildSeo(homeContent).structuredData; document.head.append(schema);
    }
    if (isHome && prerender) { prerender.remove(); prerender = null; }
    disposePage?.();
    disposePage = null;
    currentPage?.remove();
    currentPage = null;
    if (home) {
      home.dataset.navigationReady = 'false';
      document.dispatchEvent(new CustomEvent('site:home-paused'));
      home.hidden = !isHome; home.id = isHome ? 'main-content' : 'home-content'; }
    if (isHome) {
      if (!home) { home = Main(); home.dataset.navigationReady = 'false'; app.insertBefore(home, footer); mountHome(home); }
      cleanupNavigation = mountNavigation(header, home);
    } else {
      const { WritingPage } = await import('./modules/writing/pages.js');
      if (!isCurrent()) return;
      const result = WritingPage(route);
      currentPage = result.page;
      disposePage = result.dispose;
      if (prerender) { prerender.id = 'prerender-content'; currentPage.hidden = true; }
      app.insertBefore(currentPage, footer);
      cleanupNavigation = mountNavigation(header, currentPage);
      await result.ready;
      if (!isCurrent()) return;
      if (prerender) { prerender.remove(); prerender = null; currentPage.hidden = false; }
    }
  });
}

function mountHome(main) {
  const closing = main.querySelector('.closing');
  if (closing) mountReveal(closing, window, { selector: '.closing-section', pendingClass: 'closing-pending' });
  const writing = main.querySelector('.writing');
  if (writing) mountReveal(writing, window, { selector: '.writing-header, .writing-entry', pendingClass: 'writing-pending' });
  const evidence = main.querySelector('.evidence-list');
  if (evidence) mountReveal(evidence, window, { selector: '.evidence-item', pendingClass: 'evidence-pending' });
  mountBooking();
  if (typeof __EMAILJS_SERVICE__ !== 'undefined') {
    mountContactEmailJS({ serviceId: __EMAILJS_SERVICE__, templateId: __EMAILJS_TEMPLATE__, publicKey: __EMAILJS_PUBLIC__ });
  }
}
bootstrap();

