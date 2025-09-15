// src/js/modules/common/booking.js
export function mountBooking(){
  // --- Config horario ---
  const BUSINESS_START = '09:00';  // HH:mm
  const BUSINESS_END   = '16:00';  // HH:mm
  const STEP_MIN       = 15;       // 15 min

  // --- Helpers DOM ---
  const el=(t,c,a)=>{const n=document.createElement(t); if(c) n.className=c; if(a) Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v)); return n;};
  const div=(c,a)=>el('div',c,a);
  const btn=(c,txt)=>{const b=el('button',c); b.type='button'; b.textContent=txt; return b;};
  const inp=(ph,name,type='text')=>{const i=el('input','booking-input',{name}); i.placeholder=ph; i.required=true; i.type=type; return i;};

  // --- Base URL para Netlify Functions ---
  const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
  const FN_BASE = isLocal ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';
  // const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = 'America/Bogota';

  // --- UI modal ---
  const modal = div('booking-modal', { id:'booking-modal','aria-hidden':'true' });
  const box   = div('booking-box',   { role:'dialog','aria-modal':'true','aria-labelledby':'booking-title' });

  const btnCloseX = el('button','booking-secondary',{ 'aria-label':'Close', type:'button' });
  btnCloseX.textContent = '×';
  Object.assign(btnCloseX.style,{ position:'absolute', right:'12px', top:'10px', width:'36px', height:'36px', borderRadius:'10px' });

  const h3  = el('h3','booking-title',{ id:'booking-title' }); h3.textContent='Book a call';
  const sub = el('p','booking-subtitle'); sub.textContent=`Mon–Fri ${BUSINESS_START}–${BUSINESS_END} (${tz}).`;

  const form = el('form', null, { id:'booking-form' });
  const grid = div('booking-grid');

  const inputName  = inp('Your name','name');
  const inputEmail = inp('Your email','email','email');

  // Fecha
  const rowDate = div(null,{ style:'display:grid;grid-template-columns:1fr auto;gap:8px;position:relative' });
  const inputDate = inp('Pick a date','date','date');
  inputDate.min = todayLocal();
  const btnDate   = btn('booking-secondary','📅');
  rowDate.append(inputDate, btnDate);

  // Hora (select 15 min, 09:00–16:00)
  const rowTime = div(null,{ style:'display:grid;grid-template-columns:1fr;gap:8px' });
  const inputTime = document.createElement('select');
  inputTime.className = 'booking-input';
  buildTimeOptions(inputTime, BUSINESS_START, BUSINESS_END, STEP_MIN);
  rowTime.appendChild(inputTime);

  // Duración
  const durationRow = div(null,{ style:'display:grid;grid-template-columns:1fr;gap:8px' });
  const inputDuration = document.createElement('select');
  inputDuration.className = 'booking-input';
  ['15','30','45','60'].forEach(m=>{
    const o=document.createElement('option'); o.value=m; o.textContent=`${m} min`; inputDuration.appendChild(o);
  });
  inputDuration.value = '30';
  durationRow.appendChild(inputDuration);

  // Opcionales
  const inputSubject  = inp('Subject (optional)','subject','text');  inputSubject.required=false;
  const inputLocation = inp('Location (optional, e.g. Google Meet)','location','text'); inputLocation.required=false;

  // Resumen + estado
  const summaryEl = div('booking-status'); summaryEl.textContent='Pick a date and time.';
  const statusEl  = div('booking-status',{ id:'booking-status' });

  // Honeypot
  const inputHp = inp('','company'); inputHp.required=false;
  Object.assign(inputHp.style,{position:'absolute',left:'-9999px'});

  const btnSubmit = btn('booking-primary','Book'); btnSubmit.type='submit'; btnSubmit.disabled=true;
  const btnCancel = btn('booking-secondary','Cancel');

  // Ensamblar DOM
  box.style.position = 'relative';
  box.append(btnCloseX);
  [inputName,inputEmail,rowDate,rowTime,durationRow,inputSubject,inputLocation,summaryEl,inputHp,btnSubmit,btnCancel,statusEl]
    .forEach(n=>grid.appendChild(n));
  form.appendChild(grid);
  box.append(h3,sub,form);
  modal.appendChild(box);
  document.body.appendChild(modal);

  // --- Abrir / cerrar ---
  const onEsc = e=>{ if(e.key==='Escape') close(); };

  const open = ()=>{
    const next = nextValidSlot(tz, BUSINESS_START, BUSINESS_END, STEP_MIN);
    inputDate.value = next.date;
    if (hasOption(inputTime, next.time)) inputTime.value = next.time;
    else if (inputTime.options.length)   inputTime.value = inputTime.options[0].value;

    updateSummary();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setTimeout(()=>inputName.focus(),0);
    document.addEventListener('keydown', onEsc);
  };

  const close = ()=>{
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    statusEl.textContent='';
    form.reset();
    updateSummary();
    document.removeEventListener('keydown', onEsc);
  };

  modal.addEventListener('mousedown', (e)=>{ if (e.target === modal) close(); });
  btnCancel.addEventListener('click', close);
  btnCloseX.addEventListener('click', close);
  btnDate.addEventListener('click',e=>{ e.preventDefault(); inputDate.showPicker?.(); inputDate.focus(); });

  document.addEventListener('click',e=>{
    const trigger = e.target.closest('[data-book]');
    if (trigger){ e.preventDefault(); open(); }
  });

  inputDate.addEventListener('change', ()=>{
    if (isWeekend(inputDate.value, tz)){
      inputDate.value = nextBusinessDay(inputDate.value, tz);
    }
    updateSummary();
  });
  [inputName,inputEmail,inputDate,inputTime,inputSubject,inputLocation,inputDuration].forEach(n=>n.addEventListener('input', updateSummary));
  updateSummary();

  function canBook(){
    return Boolean(
      inputName.value.trim() &&
      inputEmail.value.trim() &&
      inputDate.value &&
      inputTime.value
    );
  }

  function updateSummary(){
    if (!inputDate.value || !inputTime.value){
      summaryEl.textContent='Pick a date and time.';
      btnSubmit.disabled = !canBook();
      return;
    }
    const local = new Date(`${inputDate.value}T${inputTime.value}:00`);
    const pretty = local.toLocaleString(undefined,{
      timeZone: tz, weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
    summaryEl.textContent = `Selected: ${pretty} (${tz}) · ${inputDuration.value} min`;
    btnSubmit.disabled = !canBook();
  }

  // --- Submit ---
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const name=inputName.value.trim(), email=inputEmail.value.trim(),
          date=inputDate.value, time=inputTime.value,
          subject=inputSubject.value.trim(), location=inputLocation.value.trim(),
          durMin=parseInt(inputDuration.value,10),
          hp=inputHp.value;

    if (hp){ statusEl.textContent='Thanks.'; return; }
    if (!name || !email || !date || !time){ statusEl.textContent='Missing fields.'; return; }
    if (isWeekend(date, tz)){ statusEl.textContent='Only Monday–Friday.'; return; }
    if (!hasOption(inputTime, time)){ statusEl.textContent=`Only ${BUSINESS_START}–${BUSINESS_END}.`; return; }

    let startISO, endISO;
    try{
      const startLocal = `${date}T${time}`;
      // Validación fuerte para evitar ".split" con undefined
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startLocal)) {
        statusEl.textContent='Invalid date/time selected.'; return;
      }
      startISO = toRFC3339(startLocal, tz);
      endISO   = addMinutesRFC3339(startISO, durMin);
    }catch(err){
      console.error('[booking] fecha/hora inválida', err);
      statusEl.textContent='Invalid date/time selected.';
      return;
    }

    statusEl.textContent='Checking availability...';

    try {
      const fb = await fetch(`${FN_BASE}/freebusy`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ start:startISO, end:endISO })
      });
      const fbData = await fb.json();
      if (!fb.ok) { statusEl.textContent = 'Server error (freebusy).'; return; }
      const isBusy = Array.isArray(fbData.busy) ? fbData.busy.length > 0 : !!fbData.busy;
      if (isBusy) {
        statusEl.textContent = 'That time is unavailable. Try another slot.';
        return;
      }
    } catch (err){
      console.warn('[freebusy]', err);
      statusEl.textContent='Could not verify availability. Attempting to book...';
    }

    try{
      const res=await fetch(`${FN_BASE}/create-event`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          name,email,when: `${date}T${time}`, tz, subject, location, duration: durMin
        })
      });
      const data=await res.json();
      if(!res.ok){
        statusEl.textContent = data?.error || 'Error creating the event.'; return;
      }
      statusEl.innerHTML = data.meet
        ? `Booked. Meet: <a href="${data.meet}" target="_blank" rel="noopener">Open</a>`
        : `Booked. <a href="${data.htmlLink}" target="_blank" rel="noopener">Open Calendar</a>`;
    }catch(err){
      console.error('[create-event]',err);
      statusEl.textContent='Error creating the event.';
    }
  });

  // --- Helpers de opciones/slots ---
  function buildTimeOptions(selectEl, startHHMM, endHHMM, stepMin){
    selectEl.innerHTML = '';
    const start = hmToMinutes(startHHMM);
    const end   = hmToMinutes(endHHMM);
    for(let m=start; m<=end; m+=stepMin){
      const hh = String(Math.floor(m/60)).padStart(2,'0');
      const mm = String(m%60).padStart(2,'0');
      const opt=document.createElement('option');
      opt.value=`${hh}:${mm}`;
      opt.textContent=`${hh}:${mm}`;
      selectEl.appendChild(opt);
    }
  }
  function hasOption(selectEl, value){
    return Array.from(selectEl.options).some(o=>o.value===value);
  }
  function hmToMinutes(hhmm){ const [h,m]=hhmm.split(':').map(Number); return h*60+m; }

  // --- Helpers business days ---
  function isWeekend(dateStr, zone){
    if (!dateStr) return false;
    const d = new Date(`${dateStr}T12:00:00`);
    const wd = new Intl.DateTimeFormat('en-US',{weekday:'short', timeZone: zone}).format(d);
    return wd === 'Sat' || wd === 'Sun';
  }
  function nextBusinessDay(dateStr, zone){
    let d = new Date(`${dateStr}T12:00:00`);
    do { d.setDate(d.getDate()+1); } while (isWeekend(d.toISOString().slice(0,10), zone));
    return d.toISOString().slice(0,10);
  }
  function nextValidSlot(zone, startHHMM, endHHMM, stepMin){
    const now = new Date();
    let date = now.toISOString().slice(0,10);
    const mins = now.getMinutes();
    const add = (stepMin - (mins % stepMin)) % stepMin;
    now.setMinutes(mins + add, 0, 0);
    let hh = String(now.getHours()).padStart(2,'0');
    let mm = String(now.getMinutes()).padStart(2,'0');
    let time = `${hh}:${mm}`;
    if (isWeekend(date, zone) || time > endHHMM){
      date = nextBusinessDay(date, zone);
      time = startHHMM;
    }
    if (time < startHHMM) time = startHHMM;
    return { date, time };
  }

  // --- Helpers tiempo (RFC3339) ---
  function todayLocal(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

  function toRFC3339(localStr,tz){
    // Espera: YYYY-MM-DDTHH:MM
    if (!localStr || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localStr)) {
      throw new Error('toRFC3339: localStr inválido: ' + String(localStr));
    }
    const [y,m,d,h,mi]=localStr.replace('T','-').split(/[-:]/).map(n=>parseInt(n,10));
    const off=tzOffsetMinutes(y,m,d,h,mi,tz);
    const utcMs=Date.UTC(y,m-1,d,h,mi)-off*60000;
    return formatRFC3339(new Date(utcMs),off);
  }
  function addMinutesRFC3339(rfc,minutes){
    const p=parseRFC3339(rfc); const utcMs=Date.UTC(p.y,p.mo-1,p.d,p.hh,p.mm,p.ss)+minutes*60000;
    return formatRFC3339(new Date(utcMs),p.offsetMin);
  }
  function tzOffsetMinutes(y,m,d,hh,mi,tz){
    const fmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'shortOffset'});
    const parts=fmt.formatToParts(new Date(Date.UTC(y,m-1,d,hh,mi)));
    const tzn=parts.find(p=>p.type==='timeZoneName')?.value||'GMT+00:00';
    const m2=tzn.match(/GMT([+-])(\d{2}):(\d{2})/); if(!m2) return 0;
    const sign=m2[1]==='-'?-1:1; return sign*(parseInt(m2[2],10)*60+parseInt(m2[3],10));
  }
  function formatRFC3339(dt,off){
    const y=dt.getUTCFullYear(),mo=pad(dt.getUTCMonth()+1),da=pad(dt.getUTCDate()),h=pad(dt.getUTCHours()),mi=pad(dt.getUTCMinutes()),s=pad(dt.getUTCSeconds());
    const sign=off>=0?'+':'-'; const abs=Math.abs(off); const oh=pad(Math.floor(abs/60)), om=pad(abs%60);
    return `${y}-${mo}-${da}T${h}:${mi}:${s}${sign}${oh}:${om}`;
  }
  function parseRFC3339(s){ const m=s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-])(\d{2}):(\d{2})$/); return {y:+m[1],mo:+m[2],d:+m[3],hh:+m[4],mm:+m[5],ss:+m[6],offsetMin:(m[7]==='-'?-1:1)*(+m[8]*60+ +m[9])}; }
  function pad(n){ return String(n).padStart(2,'0'); }
}
