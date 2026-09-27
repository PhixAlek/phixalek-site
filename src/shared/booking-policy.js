// Shared host-time policy. Never interpret a date in the visitor/server time zone.
export const TIME_ZONE = 'America/Hermosillo';
export const DURATIONS = [15, 30, 45, 60];
export const STEP_MINUTES = 15;
export const WINDOWS = [[420, 780], [840, 960]];
export class BookingError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function localParts(instant) {
  const p = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, seconds: Number(p.second) };
}
export function validateDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BookingError('invalid_date');
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new BookingError('invalid_date');
  return parsed;
}
export function validateDuration(duration) {
  if (!DURATIONS.includes(duration)) throw new BookingError('invalid_duration');
}
export function nextDate(date) {
  const d = validateDate(date); d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
export function isBusinessDay(date) {
  const day = validateDate(date).getUTCDay();
  return day !== 0 && day !== 6;
}
export function firstBookingDate(now = Date.now()) {
  let date = nextDate(localParts(now).date);
  while (!isBusinessDay(date)) date = nextDate(date);
  return date;
}
export function localToISO(date, time) {
  validateDate(date);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BookingError('invalid_time');
  const wall = Date.parse(`${date}T${time}:00Z`);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const p = localParts(instant);
    const adjustment = wall - Date.parse(`${p.date}T${p.time}:00Z`);
    if (!adjustment) break;
    instant += adjustment;
  }
  const p = localParts(instant);
  if (p.date !== date || p.time !== time) throw new BookingError('invalid_time');
  return new Date(instant).toISOString();
}
export function validateSlot(when, duration, now = Date.now()) {
  validateDuration(duration);
  if (typeof when !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(when)) throw new BookingError('timezone_required');
  validateDate(when.slice(0, 10));
  const start = new Date(when);
  if (!Number.isFinite(start.getTime())) throw new BookingError('invalid_time');
  if (start.getTime() <= Number(now)) throw new BookingError('past_slot');
  const p = localParts(start);
  if (p.date < firstBookingDate(now)) throw new BookingError('next_business_day_required');
  const [h, m] = p.time.split(':').map(Number);
  const minutes = h * 60 + m;
  if (!isBusinessDay(p.date)) throw new BookingError('weekday_required');
  if (m % STEP_MINUTES || p.seconds || start.getUTCMilliseconds()) throw new BookingError('invalid_time');
  if (!WINDOWS.some(([a, b]) => minutes >= a && minutes + duration <= b)) throw new BookingError('outside_hours');
  return { start: start.toISOString(), end: new Date(start.getTime() + duration * 60000).toISOString() };
}
export function daySlots(date, duration, now = Date.now()) {
  validateDuration(duration);
  if (!isBusinessDay(date) || date < firstBookingDate(now)) return [];
  const slots = [];
  for (const [a, b] of WINDOWS) {
    for (let m = a; m + duration <= b; m += STEP_MINUTES) {
      const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const start = localToISO(date, time);
      if (Date.parse(start) > Number(now)) slots.push({ time, ...validateSlot(start, duration, now) });
    }
  }
  return slots;
}
