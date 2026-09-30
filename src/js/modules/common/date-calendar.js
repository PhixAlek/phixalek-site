import { locale, ui, text } from '../../../content/index.js';
import { isBusinessDay } from '../../../shared/booking-policy.js';

// An inline calendar keeps the same date input and its change contract.
export function attachCalendar(input, container) {
  const panel = document.createElement('div');
  panel.className = 'booking-calendar'; panel.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'booking-calendar');
  panel.id = 'booking-calendar';
  let month;
  function hide() { panel.hidden = true; input.setAttribute('aria-expanded', 'false'); }
  function render() {
    panel.replaceChildren();
    const header = document.createElement('div'); header.className = 'booking-calendar-header';
    const title = document.createElement('strong');
    text(title, () => month.toLocaleDateString(locale, { month:'long', year:'numeric', timeZone:'UTC' }));
    for (const delta of [-1, 1]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = delta < 0 ? '‹' : '›';
      button.setAttribute('aria-label', delta < 0 ? ui.booking.previousMonth : ui.booking.nextMonth);
      button.addEventListener('click', () => { month.setUTCMonth(month.getUTCMonth()+delta); render(); panel.querySelector(delta < 0 ? 'button' : '.booking-calendar-header button:last-child').focus(); });
      if (delta < 0) header.append(button,title); else header.append(button);
    }
    const days = document.createElement('div'); days.className = 'booking-calendar-days';
    for (let i=0;i<7;i++) {
      const label = document.createElement('span');
      label.textContent = new Date(Date.UTC(2026,0,4+i)).toLocaleDateString(locale,{weekday:'short',timeZone:'UTC'});
      days.append(label);
    }
    for(let i=0;i<month.getUTCDay();i++) days.append(document.createElement('span'));
    const count = new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
    for(let day=1;day<=count;day++) {
      const date = new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),day));
      const value = date.toISOString().slice(0,10);
      const button = document.createElement('button'); button.type='button'; button.textContent=day;
      button.disabled = value < input.min || !isBusinessDay(value);
      button.setAttribute('aria-label',date.toLocaleDateString(locale,{dateStyle:'full',timeZone:'UTC'}));
      if(value===input.value) button.setAttribute('aria-current','date');
      button.addEventListener('click',()=>{ input.value=value; hide(); input.dispatchEvent(new Event('change',{bubbles:true})); input.focus(); });
      days.append(button);
    }
    panel.append(header,days);
  }
  input.addEventListener('click',e=>{
    e.preventDefault();
    if(!panel.hidden) { hide(); return; }
    month=new Date((input.value || input.min)+'T00:00:00Z'); month.setUTCDate(1);
    render(); panel.hidden=false; input.setAttribute('aria-expanded','true');
  });
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();hide();input.focus();}});
  input.addEventListener('change',hide);
  container.append(panel);
  return { hide };
}
