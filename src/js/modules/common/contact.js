import { ui, text } from '../../../content/index.js';
// src/js/modules/common/contact.js
import emailjs from '@emailjs/browser';

/**
 * Conecta #contact-form con EmailJS.
 * Requiere inputs: name="name", name="email", name="message"
 * Honeypot opcional: <input name="company">
 * Status: <div id="form-status">
 */
export function mountContactEmailJS({ serviceId, templateId, publicKey }){
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) {
    console.warn('[contact] #contact-form or #form-status not found');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');

  if (!serviceId || !templateId || !publicKey) {
    form.addEventListener('submit', e => e.preventDefault());
    submitBtn.disabled = true;
    text(status, () => ui.contact.unavailable);
    return;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;

    const fd = new FormData(form);
    const payload = {
      from_name: fd.get('name')?.toString().trim() || '',
      reply_to:  fd.get('email')?.toString().trim() || '',
      message:   fd.get('message')?.toString().trim() || '',
      // extra opcional:
      // subject:  'New message from portfolio'
    };

    // Honeypot: si viene con algo, no enviar
    const hp = fd.get('company')?.toString().trim();
    if (hp) { text(status, () => ui.contact.thanks); form.reset(); return; }

    if (!payload.from_name || !payload.reply_to || !payload.message) {
      text(status, () => ui.contact.required);
      return;
    }

    form.setAttribute('aria-busy', 'true');
    submitBtn?.classList.add('loading');
    submitBtn?.setAttribute('aria-busy', 'true');
    // UI feedback
    text(status, () => ui.contact.sending);
    if (submitBtn) { submitBtn.disabled = true; text(submitBtn, () => ui.contact.sending); }

    try{
      // Init + send
      emailjs.init(publicKey);
      const res = await emailjs.send(serviceId, templateId, payload);
      if (res.status >= 200 && res.status < 300) {
        text(status, () => ui.contact.success);
        form.reset();
      } else {
        throw new Error('EmailJS error: ' + res.text);
      }
    }catch(err){
      console.error(err);
      text(status, () => ui.contact.error);
    }finally{
      form.setAttribute('aria-busy', 'false');
      submitBtn?.classList.remove('loading');
      submitBtn?.setAttribute('aria-busy', 'false');
      if (submitBtn) { submitBtn.disabled = false; text(submitBtn, () => ui.contact.submit); }
    }
  });
}
