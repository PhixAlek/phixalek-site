import { content, ui, bind, text } from '../../../content/index.js';

export function Contact(){
  const C = content.contact || {};

  const sec  = document.createElement('section');
  sec.id = 'contact';
  sec.className = 'section';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h2 = document.createElement('h2');
  h2.className = 'h2';
  text(h2, () => C.title);

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
  wrap.append(h2, form);
  sec.appendChild(wrap);
  return sec;
}
