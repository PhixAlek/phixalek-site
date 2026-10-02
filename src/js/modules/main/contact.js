import { createFormReveal } from '../common/staggered-form.js';
import { mountNavigationWave } from '../common/navigation-wave.js';
import { createDisclosure } from '../common/disclosure.js';
import { content, ui, bind, text } from '../../../content/index.js';

export function Contact(){
  const C = content.contact || {};

  const sec  = document.createElement('section');
  sec.id = 'contact';
  sec.className = 'section closing-section';
  sec.setAttribute('aria-labelledby', 'contact-title');

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h2 = document.createElement('h2');
  h2.className = 'h2';
  h2.id = 'contact-title';
  text(h2, () => ui.closing.contactTitle);

  const form = document.createElement('form');
  form.id = 'contact-form';
  form.className = 'form';
  form.setAttribute('novalidate','true');

  const name  = Object.assign(document.createElement('input'), {
    type:'text', name:'name',
    placeholder: C.namePlaceholder || ui.contact.name,
    required:true
  });

  const email = Object.assign(document.createElement('input'), {
    type:'email', name:'email',
    placeholder: C.emailPlaceholder || ui.contact.email,
    required:true
  });

  const msg   = Object.assign(document.createElement('textarea'), {
    name:'message', rows:5,
    placeholder: C.messagePlaceholder || ui.contact.message,
    required:true
  });

  // Honeypot
  const hp    = Object.assign(document.createElement('input'), {
    type:'text', id:'company', name:'company',
    className:'hidden', tabIndex:-1, autoComplete:'off'
  });

  const send  = Object.assign(document.createElement('button'), {
    type:'submit', className:'btn', textContent: C.submitText || ui.contact.submit
  });

  const status= Object.assign(document.createElement('div'), {
    id:'form-status', className:'muted'
  });

  [[name, 'name'], [email, 'email'], [msg, 'message']].forEach(([field, key]) => {
    bind(field, 'placeholder', () => ui.contact[key]);
    bind(field, 'attr:aria-label', () => ui.contact[key]);
  });
  text(send, () => ui.contact.submit);
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  form.append(name, email, msg, hp, send, status);
  const eyebrow = document.createElement('span');
  eyebrow.className = 'about-eyebrow';
  text(eyebrow, () => ui.closing.talk);
  const actions = document.createElement('div');
  actions.className = 'contact-actions';
  const panel = document.createElement('div');
  panel.id = 'contact-panel';
  panel.className = 'contact-panel';
  panel.hidden = true;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'btn contact-message';
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-expanded', 'false');
  const messageLabel = document.createElement('span');
  let messageIcon = actionIcon('message');
  toggle.append(messageIcon, messageLabel);
  let expanded = false;
  const updateMessage = mountNavigationWave(messageLabel, sec, () => expanded ? ui.closing.closeMessage : ui.closing.sendMessage);
  bind(toggle, 'attr:aria-label', () => expanded ? ui.closing.closeMessage : ui.closing.sendMessage);
  const showForm = createDisclosure(panel, {
    openDuration: 0,
    onFinish: open => {
      if (!open) return;
      const header = document.querySelector('.header')?.getBoundingClientRect().height || 0;
      const available = window.innerHeight - header;
      const sectionBounds = sec.getBoundingClientRect();
      const target = sectionBounds.height <= available - 32 ? sec : panel;
      const bounds = target.getBoundingClientRect();
      const spacing = Math.max(16, (available - bounds.height) / 2);
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const destination = Math.max(0, Math.min(maximum, bounds.top + window.scrollY - header - spacing));
      window.scrollTo({ top: destination, behavior: 'instant' });
    },
    frames: open => {
      const box = panel.getBoundingClientRect();
      const origin = toggle.getBoundingClientRect();
      panel.style.transformOrigin = `${origin.left + origin.width / 2 - box.left}px ${origin.top + origin.height / 2 - box.top}px`;
      return [
        { height: `${open ? 0 : box.height}px`, opacity: open ? 0 : 1, transform: 'none', overflow: 'clip' },
        { height: `${open ? panel.scrollHeight : 0}px`, opacity: open ? 1 : 0, transform: open ? 'none' : 'scale(.85)', overflow: 'clip' },
      ];
    },
    onStart: open => {
      toggle.setAttribute('aria-expanded', String(open));
      const nextIcon = actionIcon(open ? 'close' : 'message');
      messageIcon.replaceWith(nextIcon);
      messageIcon = nextIcon;
      updateMessage();
      bind(toggle, 'attr:aria-label', () => expanded ? ui.closing.closeMessage : ui.closing.sendMessage);
      if (open) name.focus({ preventScroll: true });
      else if (panel.contains(document.activeElement)) toggle.focus({ preventScroll: true });
      revealForm(open);
    },
  });
  toggle.addEventListener('click', () => {
    expanded = !expanded;
    showForm(expanded);
  });
  name.autoComplete = 'name';
  email.autoComplete = 'email';
  const book = document.createElement('button');
  book.type = 'button';
  book.className = 'btn-outline';
  book.setAttribute('data-book', 'true');
  const bookLabel = document.createElement('span');
  mountNavigationWave(bookLabel, sec, () => ui.work.book, { after: messageLabel });
  bind(book, 'attr:aria-label', () => ui.work.book);
  book.append(actionIcon('calendar'), bookLabel);
  actions.append(toggle, book);
  const emailLink = document.createElement('a');
  emailLink.className = 'contact-email';
  emailLink.href = `mailto:${C.mailTo}`;
  text(emailLink, () => C.mailTo);
  const revealForm = createFormReveal([name, email, msg, send], emailLink);
  panel.append(form, emailLink);
  wrap.append(eyebrow, h2, actions, panel);
  sec.appendChild(wrap);
  return sec;
}

function actionIcon(type) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', type === 'message'
    ? 'M21 3 3 10l7 3 3 7 8-17ZM10 13 21 3M13 20l-3-7v6'
    : type === 'close' ? 'M6 6l12 12M18 6 6 18'
    : 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 10h18');
  svg.append(path);
  return svg;
}
