import { writingConfig } from '../../../../shared/writing/config.js';

/** Continue to the official subscription page with the email prefilled; only Substack confirms signup. */
export function SubscriptionEmbed({ doc, ui, text, bind }) {
  const section = doc.createElement('section'); section.className = 'editorial-subscribe editorial-subscribe-embedded';
  const icon = doc.createElement('span'); icon.className = 'editorial-subscribe-icon'; icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>';
  const copy = doc.createElement('div'); copy.className = 'editorial-subscribe-copy';
  const title = doc.createElement('h2'); text(title, () => ui.writingPage.subscribeHeading);
  const description = doc.createElement('p'); text(description, () => ui.writingPage.subscribeDescription); copy.append(title, description);
  const area = doc.createElement('div'); area.className = 'editorial-subscribe-form';
  const form = doc.createElement('form'); form.className = 'editorial-subscribe-fields';
  form.action = new URL('/subscribe', writingConfig.source.origin).href;
  form.method = 'get'; form.target = '_blank'; form.setAttribute('rel', 'noopener noreferrer');
  const email = doc.createElement('input'); email.type = 'email'; email.name = 'email'; email.required = true;
  const mobile = doc.defaultView?.matchMedia?.('(max-width:767px)');
  const placeholder = () => mobile?.matches ? ui.writingPage.emailMobile : ui.writingPage.email;
  const updatePlaceholder = () => { email.placeholder = placeholder(); };
  mobile?.addEventListener('change', updatePlaceholder);
  section.dispose = () => mobile?.removeEventListener('change', updatePlaceholder);
  email.autocomplete = 'email'; bind(email, 'attr:placeholder', placeholder);
  bind(email, 'attr:aria-label', () => ui.writingPage.email);
  const submit = doc.createElement('button'); submit.type = 'submit'; submit.className = 'btn';
  const label = doc.createElement('span'); text(label, () => ui.writingPage.subscribe);
  submit.append(label);
  form.append(email, submit);
  const terms = doc.createElement('p'); terms.className = 'editorial-subscribe-terms';
  const termsLink = doc.createElement('a'); termsLink.href = 'https://substack.com/tos'; termsLink.target = '_blank'; termsLink.rel = 'noopener noreferrer';
  text(termsLink, () => ui.writingPage.subscriptionTerms); terms.append(termsLink);
  area.append(form, terms); section.append(icon, copy, area); return section;
}
