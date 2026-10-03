import '../css/tokens.css';
import '../css/styles.css';

import { Header } from './modules/header/header.js';
import { Main }   from './modules/main/index.js';
import { Footer } from './modules/footer/footer.js';
import { mountBooking }    from './modules/common/booking.js';
import { mountContactEmailJS } from './modules/common/contact.js';

import { mountReveal } from './modules/common/reveal.js';
import { mountNavigation } from './modules/common/navigation.js';

function bootstrap(){

  const app = document.getElementById('app');
  if(!app){ console.error('[index] #app no existe'); return; }

  const header = Header();
  const main   = Main();
  const footer = Footer();
  app.replaceChildren(header, main, footer);

  mountNavigation(header, main);
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


