import { randomUUID } from 'node:crypto';
import { BookingError, TIME_ZONE, daySlots, validateSlot } from '../../src/shared/booking-policy.js';

const response = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
function payload(event) {
  if (event.httpMethod !== 'POST') throw new BookingError('method_not_allowed', 405);
  let data;
  try { data = JSON.parse(event.body || '{}'); } catch { throw new BookingError('invalid_json'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new BookingError('invalid_json');
  return data;
}
function text(value, max, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new BookingError('invalid_fields');
  return value.trim();
}
function fail(error) {
  return response(error instanceof BookingError ? error.status : 503, { error: error instanceof BookingError ? error.message : 'calendar_unavailable' });
}
async function busyRanges(calendar, calendarId, start, end) {
  const result = await calendar.freebusy.query({ requestBody: { timeMin: start, timeMax: end, timeZone: TIME_ZONE, items: [{ id: calendarId }] } });
  const entry = result.data?.calendars?.[calendarId];
  if (!entry || entry.errors?.length || !Array.isArray(entry.busy)) throw new BookingError('calendar_unavailable', 503);
  return entry.busy.map(range => {
    const start = Date.parse(range.start), end = Date.parse(range.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new BookingError('calendar_unavailable', 503);
    return { start, end };
  });
}
const overlaps = (slot, busy) => busy.some(b => Date.parse(slot.start) < b.end && Date.parse(slot.end) > b.start);

// Dependency injection keeps all automated tests away from credentials and live calendars.
export function createBookingHandlers({ getCalendar, getCalendarId, now = () => Date.now() }) {
  function client() {
    const id = getCalendarId();
    if (!id) throw new BookingError('calendar_unavailable', 503);
    return { calendar: getCalendar(), id };
  }
  return {
    async availability(event) {
      try {
        const { date, duration = 30 } = payload(event);
        const candidates = daySlots(date, duration, now());
        if (!candidates.length) return response(200, { slots: [], tz: TIME_ZONE });
        const { calendar, id } = client();
        const busy = await busyRanges(calendar, id, candidates[0].start, candidates.at(-1).end);
        return response(200, { slots: candidates.filter(s => !overlaps(s, busy)), tz: TIME_ZONE });
      } catch (error) { return fail(error); }
    },
    async book(event) {
      try {
        const data = payload(event);
        if (data.hp) throw new BookingError('invalid_fields');
        const name = text(data.name, 120, true), email = text(data.email, 254, true);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingError('invalid_email');
        const subject = text(data.subject, 200) || 'Intro call';
        const location = text(data.location, 300) || 'Google Meet';
        const slot = validateSlot(data.when, data.duration ?? 30, now());
        const { calendar, id } = client();
        const busy = await busyRanges(calendar, id, slot.start, slot.end);
        if (overlaps(slot, busy)) throw new BookingError('slot_not_available', 409);
        validateSlot(slot.start, data.duration ?? 30, now());
        const eventResult = await calendar.events.insert({
          calendarId: id, conferenceDataVersion: 1, sendUpdates: 'all',
          requestBody: {
            summary: `${subject} — ${name}`, description: `Intro call with ${name} <${email}>`, location,
            start: { dateTime: slot.start, timeZone: TIME_ZONE },
            end: { dateTime: slot.end, timeZone: TIME_ZONE },
            attendees: [{ email, displayName: name }],
            transparency: 'opaque', reminders: { useDefault: true },
            conferenceData: { createRequest: { requestId: randomUUID() } },
          },
        });
        const result = eventResult.data;
        // Do not claim confirmation if the provider omitted the requested guest.
        const attendee = result.attendees?.find(a => a.email?.toLowerCase() === email.toLowerCase());
        if (!result.id || !attendee) throw new BookingError('booking_confirmation_unavailable', 503);
        return response(200, { ok: true, id: result.id, start: slot.start, end: slot.end, tz: TIME_ZONE, invitationRequested: true,
          meet: result.hangoutLink || result.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null,
          htmlLink: result.htmlLink || null });
      } catch (error) { return fail(error); }
    },
  };
}
