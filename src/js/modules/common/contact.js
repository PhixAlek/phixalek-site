// src/js/modules/common/contact.js
import emailjs from '@emailjs/browser';

/**
 * Conecta #contact-form con EmailJS.
 * Requiere inputs: name="name", name="email", name="message"
 * Honeypot opcional: <input name="company">
 * Status: <div id="form-status">
 */
export function mountContactEmailJS({ serviceId, templateId, publicKey }){
  // Validaciones mínimas de config
  if (!serviceId || !templateId || !publicKey) {
    console.warn('[contact] Missing EmailJS config');
    return;
  }

  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) {
    console.warn('[contact] #contact-form or #form-status not found');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

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
    if (hp) { status.textContent = 'Thanks.'; form.reset(); return; }

    if (!payload.from_name || !payload.reply_to || !payload.message) {
      status.textContent = 'Please complete all fields.'; 
      return;
    }

    // UI feedback
    status.textContent = 'Sending...';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

    try{
      // Init + send
      emailjs.init(publicKey);
      const res = await emailjs.send(serviceId, templateId, payload);
      if (res.status >= 200 && res.status < 300) {
        status.textContent = 'Message sent. I will get back to you soon.';
        form.reset();
      } else {
        throw new Error('EmailJS error: ' + res.text);
      }
    }catch(err){
      console.error(err);
      status.textContent = 'Error sending the message. Please try again later.';
    }finally{
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
    }
  });
}
