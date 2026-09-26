import { createTimeWheel } from './time-wheel.js';
import { TIME_ZONE, DURATIONS, firstBookingDate, isBusinessDay, daySlots, nextDate, validateSlot } from '../../../shared/booking-policy.js';

// src/js/modules/common/booking.js
export function mountBooking(){
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

  const btnCloseX = el('button','booking-secondary',{ 'aria-label':'Close', type:'button' });
  btnCloseX.textContent = '×';
  Object.assign(btnCloseX.style,{ position:'absolute', right:'12px', top:'10px', width:'36px', height:'36px', borderRadius:'10px' });

  const h3  = el('h3','booking-title',{ id:'booking-title' }); h3.textContent='Book a call';
  const sub = el('p','booking-subtitle'); sub.textContent=`Mon–Fri 07:00–13:00 / 14:00–16:00 (${tz}). All times are in Hermosillo.`;

  const form = el('form', null, { id:'booking-form' });
  const grid = div('booking-grid');

  const inputName  = inp('Your name','name');
  const inputEmail = inp('Your email','email','email');

  // Fecha
  const rowDate = div(null,{ style:'display:grid;grid-template-columns:1fr auto;gap:8px;position:relative' });
  const inputDate = inp('Pick a date','date','date');
  inputDate.min = firstBookingDate();
  const btnDate   = btn('booking-secondary','📅');
  rowDate.append(inputDate, btnDate);

  const inputTime = createTimeWheel(updateSummary);
  const rowTime = inputTime.element;

  // Duración
  const durationRow = div(null,{ style:'display:grid;grid-template-columns:1fr;gap:8px' });
  const inputDuration = document.createElement('select');
  inputDuration.className = 'booking-input';
  inputDuration.setAttribute('aria-label', 'Duration');
  DURATIONS.forEach(m=>{
    const o=document.createElement('option'); o.value=m; o.textContent=`${m} min`; inputDuration.appendChild(o);
  });
  inputDuration.value = '30';
  inputDuration.querySelector('[value="30"]').defaultSelected = true;
  durationRow.appendChild(inputDuration);

  // Opcionales
  const inputSubject  = inp('Subject (optional)','subject','text');  inputSubject.required=false;
  const inputLocation = inp('Location (optional, e.g. Google Meet)','location','text'); inputLocation.required=false;

  // Resumen + estado
  const summaryEl = div('booking-status'); summaryEl.textContent='Pick a date and time.';
  const statusEl  = div('booking-status',{ id:'booking-status', role:'status', 'aria-live':'polite' });

  // Honeypot
  const inputHp = inp('','company'); inputHp.required=false;
  inputHp.tabIndex = -1; inputHp.setAttribute('aria-hidden', 'true');
  Object.assign(inputHp.style,{position:'absolute',left:'-9999px'});

  const btnSubmit = btn('booking-primary','Book'); btnSubmit.type='submit'; btnSubmit.disabled=true;
  const btnCancel = btn('booking-secondary','Cancel');

  // Ensamblar DOM
  Object.assign(box.style, { position: 'relative', maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' });
  box.append(btnCloseX);
  [inputName,inputEmail,rowDate,rowTime,durationRow,inputSubject,inputLocation,summaryEl,inputHp,btnSubmit,btnCancel,statusEl]
    .forEach(n=>grid.appendChild(n));
  form.appendChild(grid);
  box.append(h3,sub,form);
  modal.appendChild(box);
  document.body.appendChild(modal);

  // Keep keyboard focus inside the modal and return it to the trigger.
  const onKey = e => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    const focusable = [...box.querySelectorAll('button, input, select, a[href], [role="listbox"]')]
      .filter(n => !n.disabled && n.tabIndex !== -1);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  const open = () => {
    if (modal.classList.contains('is-open')) return;
    returnFocus = document.activeElement;
    form.reset(); booked = false; statusEl.textContent = '';
    [inputDate, inputDuration, inputTime].forEach(n => n.disabled = false);
    inputDate.min = firstBookingDate();
    let date = inputDate.min;
    while (!daySlots(date, Number(inputDuration.value)).length) date = nextDate(date);
    inputDate.value = date;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);
    inputName.focus();
    refreshSlots();
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
  btnCancel.addEventListener('click', close);
  btnCloseX.addEventListener('click', close);
  btnDate.addEventListener('click', () => { inputDate.showPicker?.(); inputDate.focus(); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-book]')) { e.preventDefault(); open(); }
  });
  inputDate.addEventListener('change', () => { booked = false; refreshSlots(); });
  inputDuration.addEventListener('change', () => { booked = false; refreshSlots(); });
  [inputName, inputEmail].forEach(n => n.addEventListener('input', updateSummary));

  const messages = {
    slot_not_available: 'That time was just booked. Please choose another time.',
    next_business_day_required: 'Choose the next business day or later.',
    past_slot: 'That time has passed. Please choose another time.',
    calendar_unavailable: 'Availability could not be verified. Please try again.',
    outside_hours: 'Choose a time within business hours, excluding lunch.',
    weekday_required: 'Appointments are available Monday–Friday.',
    invalid_email: 'Please enter a valid email address.',
  };
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
    slots = []; loading = true; inputTime.setEmpty('Loading available times…');
    statusEl.textContent = 'Checking available times...'; updateSummary();
    try {
      // Invalid, past and weekend dates do not need a calendar request.
      if (!inputDate.value || !daySlots(inputDate.value, Number(inputDuration.value)).length) {
        inputTime.setEmpty('No available times on this date');
        statusEl.textContent = 'No available times on this date. Choose another weekday.';
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
      statusEl.textContent = slots.length ? '' : 'No available times on this date. Choose another weekday.';
    } catch (error) {
      if (version !== requestVersion) return;
      inputTime.setEmpty('Availability is unavailable');
      const local = ['localhost','127.0.0.1'].includes(location.hostname);
      statusEl.textContent = local && error.message === 'functions_unavailable'
        ? 'Start npm run dev and open http://localhost:8888 to use the calendar.'
        : 'Could not verify calendar availability. Please retry or contact me.';
    } finally {
      if (version === requestVersion) { loading = false; updateSummary(); }
    }
  }
  const retry = btn('booking-secondary', 'Retry availability');
  retry.addEventListener('click', () => { booked = false; refreshSlots(); });
  grid.insertBefore(retry, statusEl);
  function updateSummary() {
    const slot = slots.find(s => s.start === inputTime.value);
    summaryEl.textContent = slot
      ? `Selected: ${new Date(slot.start).toLocaleString(undefined, { timeZone: tz, weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })} (${tz}) · ${inputDuration.value} min`
      : 'Choose an available date and time.';
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
    statusEl.textContent = 'Booking...';
    try {
      const res = await fetch(`${FN_BASE}/create-event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputName.value.trim(), email: inputEmail.value.trim(), when: slot.start,
          duration, subject: inputSubject.value.trim(), location: inputLocation.value.trim(), hp: inputHp.value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === 'slot_not_available' || data.error === 'past_slot') await refreshSlots();
        statusEl.textContent = messages[data.error] || 'Could not book this time. Please try again.';
        return;
      }
      booked = true;
      statusEl.textContent = 'Booked. Save your meeting details here. ';
      const url = data.meet || data.htmlLink;
      if (typeof url === 'string' && /^https:\/\//.test(url)) {
        const link = document.createElement('a'); link.href = url;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = data.meet ? 'Open meeting' : 'Open Calendar';
        statusEl.appendChild(link);
      }
    } catch {
      // A dropped response may still mean Google created the event; do not auto-retry insertion.
      slots = []; inputTime.setEmpty('Booking could not be confirmed');
      statusEl.textContent = 'The booking could not be confirmed. Check your calendar or contact me before retrying.';
    } finally {
      submitting = false;
      controls.forEach(n => n.disabled = false);
      inputTime.disabled = !slots.length;
      if (booked) [inputDate, inputDuration, inputTime].forEach(n => n.disabled = true);
      updateSummary();
    }
  });
  updateSummary();
}
