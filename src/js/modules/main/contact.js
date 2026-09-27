import content from '../../../data/content.json' assert { type: 'json' };

export function Contact(){
  const C = content.contact || {};

  const sec  = document.createElement('section');
  sec.id = 'contact';
  sec.className = 'section';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h2 = document.createElement('h2');
  h2.className = 'h2';
  h2.textContent = C.title || 'Contact';

  const form = document.createElement('form');
  form.id = 'contact-form';
  form.className = 'form';
  form.setAttribute('novalidate','true');

  const name  = Object.assign(document.createElement('input'), {
    type:'text', name:'name',
    placeholder: C.namePlaceholder || 'Your name',
    required:true
  });

  const email = Object.assign(document.createElement('input'), {
    type:'email', name:'email',
    placeholder: C.emailPlaceholder || 'Your email',
    required:true
  });

  const msg   = Object.assign(document.createElement('textarea'), {
    name:'message', rows:5,
    placeholder: C.messagePlaceholder || 'How can I help?',
    required:true
  });

  // Honeypot
  const hp    = Object.assign(document.createElement('input'), {
    type:'text', id:'company', name:'company',
    className:'hidden', tabIndex:-1, autoComplete:'off'
  });

  const send  = Object.assign(document.createElement('button'), {
    type:'submit', className:'btn', textContent: C.submitText || 'Send'
  });

  const status= Object.assign(document.createElement('div'), {
    id:'form-status', className:'muted'
  });

  form.append(name, email, msg, hp, send, status);
  wrap.append(h2, form);
  sec.appendChild(wrap);
  return sec;
}
