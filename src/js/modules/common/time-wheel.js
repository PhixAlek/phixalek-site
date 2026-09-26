import '../../../css/booking-time-wheel.css';
const ROW = 44;
export function createTimeWheel(onChange) {
  const root = document.createElement('div'); root.className = 'booking-time-picker';
  const label = document.createElement('div'); label.textContent = 'Available time · Hermosillo';
  const frame = document.createElement('div'); frame.className = 'booking-time-frame';
  const wheel = document.createElement('div'); wheel.className = 'booking-time-wheel';
  wheel.setAttribute('role','listbox'); wheel.setAttribute('aria-label',label.textContent);
  const empty = document.createElement('div'); empty.className = 'booking-time-empty';
  const hint = document.createElement('small'); hint.textContent = 'Scroll, tap a time, or use ↑ and ↓.';
  frame.append(wheel,empty); root.append(label,frame,hint);
  let slots = [], index = -1, disabled = true;
  function paint() {
    [...wheel.children].forEach((item,i)=>item.setAttribute('aria-selected',String(i===index)));
    if(index>=0) wheel.setAttribute('aria-activedescendant',`booking-time-${index}`);
    else wheel.removeAttribute('aria-activedescendant');
  }
  function select(i, align=true) {
    if(disabled || !slots.length) return;
    i=Math.max(0,Math.min(slots.length-1,i));
    const changed=i!==index; index=i; paint();
    if(align) wheel.scrollTop=i*ROW;
    if(changed) onChange();
  }
  wheel.addEventListener('scroll',()=>select(Math.round(wheel.scrollTop/ROW),false));
  wheel.addEventListener('click',e=>{
    const option=e.target.closest('[role="option"]');
    if(option && !disabled) {wheel.focus();select(Number(option.dataset.index));}
  });
  wheel.addEventListener('keydown',e=>{
    const moves={ArrowDown:index+1,ArrowUp:index-1,Home:0,End:slots.length-1,PageDown:index+3,PageUp:index-3};
    if(e.key in moves && !disabled) {e.preventDefault();select(moves[e.key]);}
  });
  const picker={
    element:root,
    get value(){return slots[index]?.start || '';},
    set disabled(value){
      disabled=Boolean(value)||!slots.length;
      wheel.tabIndex=disabled?-1:0;wheel.setAttribute('aria-disabled',String(disabled));
      root.classList.toggle('is-disabled',disabled);
    },
    ready(items,preferred=''){
      slots=items;index=items.length?Math.max(0,items.findIndex(s=>s.start===preferred)):-1;
      wheel.replaceChildren();
      items.forEach((slot,i)=>{
        const option=document.createElement('div');option.className='booking-time-option';
        option.id=`booking-time-${i}`;option.setAttribute('role','option');option.dataset.index=String(i);
        option.textContent=slot.time;wheel.appendChild(option);
      });
      empty.hidden=Boolean(items.length);empty.textContent='No available times';
      root.classList.toggle('is-empty',!items.length);
      picker.disabled=!items.length;paint();wheel.scrollTop=Math.max(0,index)*ROW;
    },
    setEmpty(message){picker.ready([]);empty.textContent=message;},
  };
  picker.setEmpty('Choose a date');return picker;
}
