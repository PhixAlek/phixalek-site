import { JSON_HEADERS, parseBookingRequest } from './security.js';
import { randomUUID } from 'node:crypto';
import { BookingError, TIME_ZONE, daySlots, validateSlot } from '../../src/shared/booking-policy.js';

const response = (statusCode, body) => ({ statusCode, headers: { ...JSON_HEADERS, ...(statusCode === 405 ? { Allow: 'POST' } : {}) }, body: JSON.stringify(body) });
function text(value, max, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f<>]/.test(value) || value.trim().length > max || (required && !value.trim())) throw new BookingError('invalid_fields');
  return value.trim();
}
function fail(error) {
  return response(error instanceof BookingError ? error.status : 503, { error: error instanceof BookingError ? error.message : 'calendar_unavailable' });
}
async function busyRanges(calendar, calendarId, start, end) {
  let result;
  try {
    result = await calendar.freebusy.query({ requestBody: { timeMin: start, timeMax: end, timeZone: TIME_ZONE, items: [{ id: calendarId }] } }, { timeout: 8000, retry: false });
  } catch (cause) {
    const error = new BookingError('calendar_unavailable', 503);
    const status = Number(cause?.response?.status);
    const timeout = ['ETIMEDOUT', 'ECONNABORTED'].includes(cause?.code);
    error.diagnostic = {
      code: timeout ? 'calendar_timeout' : [401, 403].includes(status) ? 'calendar_access_denied' : status === 429 ? 'calendar_rate_limited' : 'calendar_transport_failed',
      status: Number.isInteger(status) && status >= 400 && status <= 599 ? status : 503,
    };
    throw error;
  }
  const entry = result.data?.calendars?.[calendarId];
  if (!entry || entry.errors?.length || !Array.isArray(entry.busy)) {
    const error = new BookingError('calendar_unavailable', 503);
    const reasons = (entry?.errors || []).map(item => item.reason);
    error.diagnostic = { code: reasons.includes('forbidden') ? 'calendar_access_denied' : reasons.includes('notFound') ? 'calendar_not_found' : 'calendar_invalid_response', status:503 };
    throw error;
  }
  return entry.busy.map(range => {
    const start = Date.parse(range.start), end = Date.parse(range.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new BookingError('calendar_unavailable', 503);
    return { start, end };
  });
}
const escapeHTML = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const overlaps = (slot, busy) => busy.some(b => Date.parse(slot.start) < b.end && Date.parse(slot.end) > b.start);

// Dependency injection keeps all automated tests away from credentials and live calendars.
export function createBookingHandlers({ getCalendar, getCalendarId, now = () => Date.now(), allowedOrigins, log = () => {} }) {
  const payload = event => parseBookingRequest(event, allowedOrigins);
  const reject = error => {
    if (error?.diagnostic) {
      try { log({ event: 'booking_calendar_failed', ...error.diagnostic }); } catch { /* Logging cannot break availability. */ }
    }
    const result = fail(error);
    if ([403, 413, 503].includes(result.statusCode)) {
      try { log({ event: 'booking_request_rejected', code: JSON.parse(result.body).error, status: result.statusCode }); } catch { /* Logging cannot break the error response. */ }
    }
    return result;
  };
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
      } catch (error) { return reject(error); }
    },
    async book(event) {
      let insertionStarted = false;
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
        insertionStarted = true;
        const eventResult = await calendar.events.insert({
          calendarId: id, conferenceDataVersion: 1,
          requestBody: {
            summary: `${subject} — ${name}`, description: `Intro call with ${escapeHTML(name)} &lt;${escapeHTML(email)}&gt;`, location,
            start: { dateTime: slot.start, timeZone: TIME_ZONE },
            end: { dateTime: slot.end, timeZone: TIME_ZONE },
            transparency: 'opaque', reminders: { useDefault: true },
            conferenceData: { createRequest: { requestId: randomUUID() } },
          },
        }, { timeout: 12000, retry: false });
        const result = eventResult?.data;
        if (!result || typeof result.id !== 'string' || !result.id) throw new BookingError('booking_unconfirmed', 503);
        return response(200, { ok: true, id: result.id, start: slot.start, end: slot.end, tz: TIME_ZONE,
          meet: result.hangoutLink || result.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null,
          htmlLink: result.htmlLink || null });
      } catch (error) { return reject(insertionStarted ? new BookingError('booking_unconfirmed', 503) : error); }
    },
  };
}
