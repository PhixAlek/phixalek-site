import { ui, format, bind, text, locale, unbind } from '../../../content/index.js';
import { attachCalendar } from './date-calendar.js';
import { createTimeWheel } from './time-wheel.js';
import { TIME_ZONE, DURATIONS, firstBookingDate, isBusinessDay, daySlots, nextDate, validateSlot } from '../../../shared/booking-policy.js';

// src/js/modules/common/booking.js
export function mountBooking(){
  const copy = ui.booking;
  // --- Config horario ---
  let loading = false, submitting = false, booked = false;
  let requestVersion = 0, abortAvailability, returnFocus;
  let slots = [];

  // --- Helpers DOM ---
  const el=(t,c,a)=>{const n=document.createElement(t); if(c) n.className=c; if(a) Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v)); return n;};
  const div=(c,a)=>el('div',c,a);
  const btn=(c,txt)=>{const b=el('button',c); b.type='button'; b.textContent=txt; return b;};
  const inp=(ph,name,type='text')=>{const i=el('input','booking-input',{name}); i.placeholder=ph; i.setAttribute('aria-label', ph || name); i.required=true; i.type=type; return i;};

  // --- Base URL para Netlify Functions ---
  // Use Netlify Dev (port 8888) locally so page and functions share an origin.
  const FN_BASE = '/.netlify/functions';
  const tz = TIME_ZONE;

  // --- UI modal ---
  const modal = div('booking-modal', { id:'booking-modal','aria-hidden':'true' });
  const box   = div('booking-box',   { role:'dialog','aria-modal':'true','aria-labelledby':'booking-title' });

  const btnCloseX = el('button','booking-secondary',{ 'aria-label':copy.close, type:'button' });
  btnCloseX.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  Object.assign(btnCloseX.style,{ position:'absolute', right:'12px', top:'10px', width:'44px', height:'44px', borderRadius:'10px', display:'grid', placeItems:'center', padding:'0', lineHeight:'1', fontSize:'24px' });

  const h3  = el('h3','booking-title',{ id:'booking-title' }); text(h3, () => copy.title);
  const sub = el('p','booking-subtitle');
  const introduction = document.createTextNode(''); text(introduction, () => copy.hours);
  const weekdays = el('span', 'booking-weekdays'); text(weekdays, () => copy.weekdays);
  sub.append(introduction, document.createTextNode(' '), weekdays);

  const form = el('form', null, { id:'booking-form' });
  const grid = div('booking-grid');

  const inputName  = inp(copy.name,'name');
  const inputEmail = inp(copy.email,'email','email');

  // Fecha
  const rowDate = div(null,{ style:'display:grid;grid-template-columns:1fr;gap:8px;position:relative' });
  const inputDate = inp(copy.date,'date','date');
  inputDate.min = firstBookingDate();
  inputDate.id = 'booking-date';
  const dateLabel = el('label', null, { for: inputDate.id }); text(dateLabel, () => copy.date);
  rowDate.append(dateLabel, inputDate);
  const calendar = attachCalendar(inputDate, rowDate);

  const inputTime = createTimeWheel(updateSummary);
  const rowTime = inputTime.element;

  // Duración
  const durationRow = el('fieldset', 'booking-duration');
  const durationLegend = el('legend'); text(durationLegend, () => copy.duration);
  durationRow.append(durationLegend);
  const durationOptions = DURATIONS.map(m => {
    const label = el('label');
    const radio = el('input', null, { type:'radio', name:'duration', value:String(m) });
    radio.defaultChecked = m === 30;
    const caption = el('span'); text(caption, () => format(copy.minutes, { duration:m }));
    label.append(radio, caption); durationRow.append(label);
    return radio;
  });
  const inputDuration = {
    get value() { return durationOptions.find(r => r.checked)?.value || '30'; },
    set disabled(value) { durationOptions.forEach(r => r.disabled = value); },
  };

  // Opcionales
  const inputSubject  = inp(copy.subject,'subject','text');  inputSubject.required=false;
  const inputLocation = inp(copy.location,'location','text'); inputLocation.required=false;

  const details = el('details', 'booking-details');
  const detailsTitle = el('summary'); text(detailsTitle, () => copy.details);
  details.append(detailsTitle, inputSubject, inputLocation);

  // Resumen + estado
  const summaryEl = div('booking-status'); text(summaryEl, () => copy.initial);
  const statusEl  = div('booking-status',{ id:'booking-status', role:'status', 'aria-live':'polite' });

  // Honeypot
  const inputHp = inp('','company'); inputHp.required=false;
  inputHp.tabIndex = -1; inputHp.setAttribute('aria-hidden', 'true');
  Object.assign(inputHp.style,{position:'absolute',left:'-9999px'});

  const btnSubmit = btn('booking-primary',copy.submit); btnSubmit.type='submit'; btnSubmit.disabled=true;

  const identity = div('booking-identity'); identity.append(inputName, inputEmail);
  summaryEl.classList.add('booking-summary');

  // Ensamblar DOM
  Object.assign(box.style, { position: 'relative', maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' });
  box.append(btnCloseX);
  [identity,durationRow,rowDate,rowTime,details,inputHp,btnSubmit,summaryEl,statusEl]
    .forEach(n=>grid.appendChild(n));
  form.appendChild(grid);
  box.append(h3,sub,form);
  modal.appendChild(box);
  document.body.appendChild(modal);

  // Keep keyboard focus inside the modal and return it to the trigger.
  const onKey = e => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    const focusable = [...box.querySelectorAll('button, input, select, summary, a[href], [role="listbox"]')]
      .filter(n => !n.disabled && n.tabIndex !== -1 && n.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  const open = () => {
    if (modal.classList.contains('is-open')) return;
    returnFocus = document.activeElement;
    form.reset(); calendar.hide(); details.open = false; booked = false; text(statusEl, () => '');
    [inputDate, inputDuration, inputTime].forEach(n => n.disabled = false);
    inputDate.min = firstBookingDate();
    inputDate.value = '';
    slots = []; loading = false; retry.hidden = true;
    inputTime.setEmpty(() => copy.choose);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);
    inputName.focus();
    updateSummary();
  };
  const close = () => {
    if (submitting) return;
    requestVersion++; abortAvailability?.abort();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
    returnFocus?.focus();
  };
  modal.addEventListener('mousedown', e => { if (e.target === modal) close(); });
  btnCloseX.addEventListener('click', close);
  document.addEventListener('click', e => {
    if (e.target.closest('[data-book]')) { e.preventDefault(); open(); }
  });
  inputDate.addEventListener('change', () => { booked = false; inputTime.setEmpty(() => copy.loading); refreshSlots(); });
  durationRow.addEventListener('change', () => { booked = false; if (inputDate.value) refreshSlots(); });
  [inputName, inputEmail].forEach(n => n.addEventListener('input', updateSummary));

  const messages = copy.errors;
  async function refreshSlots() {
    const version = ++requestVersion;
    abortAvailability?.abort();
    abortAvailability = new AbortController();
    const previous = inputTime.value;
    inputDate.min = firstBookingDate();
    if (inputDate.value) {
      if (inputDate.value < inputDate.min) inputDate.value = inputDate.min;
      while (!isBusinessDay(inputDate.value)) inputDate.value = nextDate(inputDate.value);
    }
    retry.hidden = true;
    slots = []; loading = true; inputTime.setEmpty(() => copy.loading);
    text(statusEl, () => ''); updateSummary();
    try {
      // Invalid, past and weekend dates do not need a calendar request.
      if (!inputDate.value || !daySlots(inputDate.value, Number(inputDuration.value)).length) {
        inputTime.setEmpty(() => copy.empty);
        text(statusEl, () => copy.emptyHelp);
        return;
      }
      const res = await fetch(`${FN_BASE}/freebusy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abortAvailability.signal,
        body: JSON.stringify({ date: inputDate.value, duration: Number(inputDuration.value) }),
      });
      if (res.status === 404 || !(res.headers.get('content-type') || '').includes('application/json')) throw new Error('functions_unavailable');
      const data = await res.json();
      if (version !== requestVersion) return;
      if (!res.ok || !Array.isArray(data.slots) || data.tz !== tz) throw new Error('calendar_unavailable');
      slots = data.slots;
      inputTime.ready(slots, previous);
      text(statusEl, () => slots.length ? '' : copy.emptyHelp);
    } catch (error) {
      if (version !== requestVersion) return;
      retry.hidden = false;
      inputTime.setEmpty(() => copy.unavailable);
      const local = ['localhost','127.0.0.1'].includes(location.hostname);
      text(statusEl, () => local && error.message === 'functions_unavailable'
        ? copy.localHelp
        : copy.availabilityError);
    } finally {
      if (version === requestVersion) { loading = false; updateSummary(); }
    }
  }
  const retry = btn('booking-secondary', copy.retry);
  retry.hidden = true;
  retry.addEventListener('click', () => { booked = false; refreshSlots(); });
  grid.append(retry);
  function updateSummary() {
    const slot = slots.find(s => s.start === inputTime.value);
    text(summaryEl, () => slot
      ? format(copy.selected, { date: new Date(slot.start).toLocaleString(locale, { timeZone: tz, weekday:'long', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }), tz, duration: inputDuration.value })
      : '');
    btnSubmit.disabled = loading || submitting || booked || !slot || !inputName.value.trim() || !inputEmail.validity.valid || !inputEmail.value.trim();
    retry.disabled = loading || submitting || booked;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitting || loading || booked || !form.reportValidity()) return;
    const slot = slots.find(s => s.start === inputTime.value);
    if (!slot || inputHp.value) return;
    const duration = Number(inputDuration.value);
    try { validateSlot(slot.start, duration); }
    catch { await refreshSlots(); return; }
    submitting = true; inputTime.disabled = true;
    const controls = [...form.querySelectorAll('input, select, button'), btnCloseX];
    controls.forEach(n => n.disabled = true);
    text(statusEl, () => copy.sending);
    try {
      const res = await fetch(`${FN_BASE}/create-event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputName.value.trim(), email: inputEmail.value.trim(), when: slot.start,
          duration, subject: inputSubject.value.trim(), location: inputLocation.value.trim(), hp: inputHp.value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === 'slot_not_available' || data.error === 'past_slot') await refreshSlots();
        text(statusEl, () => messages[data.error] || copy.failed);
        return;
      }
      booked = true;
      text(statusEl, () => ''); unbind(statusEl, 'textContent');
      const successText = document.createTextNode('');
      text(successText, () => copy.success); statusEl.append(successText);
      const url = data.meet || data.htmlLink;
      if (typeof url === 'string' && /^https:\/\//.test(url)) {
        const link = document.createElement('a'); link.href = url;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        text(link, () => data.meet ? copy.openMeeting : copy.openCalendar);
        statusEl.appendChild(link);
      }
    } catch {
      // A dropped response may still mean Google created the event; do not auto-retry insertion.
      slots = []; inputTime.setEmpty(() => copy.unconfirmed);
      text(statusEl, () => copy.unconfirmedHelp);
    } finally {
      submitting = false;
      controls.forEach(n => n.disabled = false);
      inputTime.disabled = !slots.length;
      if (booked) [inputDate, inputDuration, inputTime].forEach(n => n.disabled = true);
      updateSummary();
    }
  });
  [[inputName, 'name'], [inputEmail, 'email'], [inputDate, 'date'], [inputSubject, 'subject'], [inputLocation, 'location']].forEach(([field, key]) => {
    bind(field, 'placeholder', () => copy[key]); bind(field, 'attr:aria-label', () => copy[key]);
  });
  bind(btnCloseX, 'attr:aria-label', () => copy.close);
  text(btnSubmit, () => copy.submit); text(retry, () => copy.retry);
  updateSummary();
}
