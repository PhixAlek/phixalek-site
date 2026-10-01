import '../css/tokens.css';
import '../css/styles.css';

import { Header } from './modules/header/header.js';
import { Main }   from './modules/main/index.js';
import { Footer } from './modules/footer/footer.js';
import { mountBooking }    from './modules/common/booking.js';
import { mountContactEmailJS } from './modules/common/contact.js';

import { mountReveal } from './modules/common/reveal.js';
import { mountNavigation } from './modules/common/navigation.js';

async function bootstrap(){

  const app = document.getElementById('app');
  if(!app){ console.error('[index] #app no existe'); return; }
  app.replaceChildren();

  const header = Header();
  const main   = Main();
  const footer = Footer();
  app.append(header, main, footer);

  mountNavigation(header, main);
  const evidence = main.querySelector('.evidence-list');
  if (evidence) mountReveal(evidence, window, { selector: '.evidence-item', pendingClass: 'evidence-pending' });
  mountBooking();
  if (typeof __EMAILJS_SERVICE__ !== 'undefined') {
    mountContactEmailJS({ serviceId: __EMAILJS_SERVICE__, templateId: __EMAILJS_TEMPLATE__, publicKey: __EMAILJS_PUBLIC__ });
  }
}
bootstrap();


