import test from 'node:test';
import assert from 'node:assert/strict';
import { TIME_ZONE, localToISO, localParts, daySlots, validateSlot, firstBookingDate } from '../src/shared/booking-policy.js';
import { createBookingHandlers } from '../netlify/lib/booking.js';
const now = Date.parse('2026-10-04T12:00:00Z'); // Sunday: first bookable day is Monday
const request = data => ({ httpMethod: 'POST', body: JSON.stringify(data) });
const valid = { name: 'Visitor', email: 'visitor@example.com', when: '2026-10-05T09:00:00-07:00', duration: 30 };
function setup(entry = { busy: [] }) {
  const calls = { queries: [], inserts: [] };
  const calendar = {
    freebusy: { query: async x => { calls.queries.push(x); return { data: { calendars: { test: entry } } }; } },
    events: { insert: async x => { calls.inserts.push(x); return { data: { id: 'fake', hangoutLink: 'https://meet.google.com/test' } }; } },
  };
  const api = createBookingHandlers({ getCalendar: () => calendar, getCalendarId: () => 'test', now: () => now });
  return { api, calls, calendar };
}
test('09:00 Hermosillo always maps to 16:00 UTC, including summer and winter', () => {
  for (const date of ['2026-01-05', '2026-07-06', '2026-10-05']) {
    assert.equal(localToISO(date, '09:00'), `${date}T16:00:00.000Z`);
  }
  assert.equal(localParts('2026-10-06T02:00:00Z').date, '2026-10-05');
});
test('duration fits before lunch/closing, with valid exact boundaries', () => {
  const times = daySlots('2026-10-05', 30, now).map(s => s.time);
  assert.equal(times[0], '07:00'); assert.equal(times.at(-1), '15:30');
  assert.ok(times.includes('12:30')); assert.ok(times.includes('14:00'));
  for (const time of ['12:45','13:00','13:45','15:45','16:00']) assert.ok(!times.includes(time));
  const hourTimes = daySlots('2026-10-05', 60, now).map(s => s.time);
  assert.ok(hourTimes.includes('12:00')); assert.ok(!hourTimes.includes('12:15')); assert.equal(hourTimes.at(-1), '15:00');
  assert.equal(daySlots('2026-10-04', 30, now).length, 0);
});
test('first available date starts tomorrow and skips weekends in Hermosillo', () => {
  for (const instant of ['2026-09-25T19:00Z','2026-09-26T19:00Z','2026-09-27T19:00Z']) {
    assert.equal(firstBookingDate(Date.parse(instant)), '2026-09-28');
  }
  assert.equal(firstBookingDate(Date.parse('2026-09-28T19:00Z')), '2026-09-29');
  assert.equal(firstBookingDate(Date.parse('2026-09-29T02:00Z')), '2026-09-29');
  assert.equal(firstBookingDate(Date.parse('2026-09-29T07:00Z')), '2026-09-30');
  assert.equal(daySlots('2026-10-05', 30, Date.parse('2026-10-05T12:00Z')).length, 0);
  assert.throws(() => validateSlot('2026-10-05T16:00:00Z', 30, Date.parse('2026-10-05T12:00Z')), /next_business_day_required/);
});
for (const [label, changes] of [
  ['lunch', { when: '2026-10-05T13:15:00-07:00' }],
  ['crosses lunch', { when: '2026-10-05T12:45:00-07:00' }],
  ['crosses closing', { when: '2026-10-05T15:45:00-07:00' }],
  ['weekend', { when: '2026-10-10T09:00:00-07:00' }],
  ['past', { when: '2020-01-06T09:00:00-07:00' }],
  ['negative duration', { duration: -30 }],
  ['excessive duration', { duration: 480 }],
  ['string duration', { duration: '30' }],
  ['missing timezone', { when: '2026-10-05T09:00' }],
  ['invalid date', { when: '2026-02-30T09:00:00-07:00' }],
  ['off-grid start', { when: '2026-10-05T09:07:00-07:00' }],
  ['invalid email', { email: 'broken' }],
  ['nonstring name', { name: {} }],
]) test(`server rejects ${label} before touching Google`, async () => {
  const { api, calls } = setup();
  const result = await api.book(request({ ...valid, ...changes }));
  assert.equal(result.statusCode, 400); assert.equal(calls.queries.length, 0); assert.equal(calls.inserts.length, 0);
});
for (const entry of [undefined, { errors: [{ reason: 'notFound' }] }, {}, { busy: [{ start: 'bad', end: 'bad' }] }]) {
  test(`calendar failure is closed: ${JSON.stringify(entry)}`, async () => {
    const { api, calls, calendar } = setup();
    calendar.freebusy.query = async () => ({ data: { calendars: { test: entry } } });
    assert.equal((await api.availability(request({ date: '2026-10-05', duration: 30 }))).statusCode, 503);
    assert.equal((await api.book(request(valid))).statusCode, 503);
    assert.equal(calls.inserts.length, 0);
  });
}
test('busy filtering respects exclusive ends and includes overlapping long meetings', async () => {
  const { api } = setup({ busy: [{ start:'2026-10-05T16:00:00Z', end:'2026-10-05T17:00:00Z' }] });
  const response = await api.availability(request({ date: '2026-10-05', duration: 30 }));
  const times = JSON.parse(response.body).slots.map(s => s.time);
  assert.ok(times.includes('08:30')); assert.ok(times.includes('10:00'));
  for (const time of ['08:45', '09:00', '09:45']) assert.ok(!times.includes(time));
});
test('creation rechecks availability and rejects a now-occupied slot', async () => {
  const { api, calls } = setup({ busy: [{ start:'2026-10-05T16:00:00Z', end:'2026-10-05T17:00:00Z' }] });
  assert.equal((await api.book(request(valid))).statusCode, 409); assert.equal(calls.inserts.length, 0);
});
test('creation and availability use the same instant, server owns time zone', async () => {
  const { api, calls } = setup();
  const result = await api.book(request({ ...valid, tz: 'America/Bogota' }));
  assert.equal(result.statusCode, 200);
  const query = calls.queries[0].requestBody, event = calls.inserts[0].requestBody;
  assert.equal(event.start.dateTime, '2026-10-05T16:00:00.000Z');
  assert.equal(event.end.dateTime, '2026-10-05T16:30:00.000Z');
  assert.equal(query.timeMin, event.start.dateTime); assert.equal(query.timeMax, event.end.dateTime);
  assert.equal(event.start.timeZone, TIME_ZONE);
});
test('all-day busy event removes all slots', async () => {
  const { api } = setup({ busy: [{ start:'2026-10-05T07:00:00Z', end:'2026-10-06T07:00:00Z' }] });
  const result = await api.availability(request({ date:'2026-10-05', duration:30 }));
  assert.deepEqual(JSON.parse(result.body).slots, []);
});
test('bad payloads and methods never reach Google', async () => {
  const { api, calls } = setup();
  for (const method of [api.book, api.availability]) {
    assert.equal((await method({ httpMethod:'GET' })).statusCode, 405);
    for (const body of ['{','null','[]']) assert.equal((await method({httpMethod:'POST', body})).statusCode, 400);
  }
  assert.equal(calls.queries.length, 0);
});
test('Google transport failures return a generic error, not credential details', async () => {
  const { api, calendar } = setup();
  calendar.freebusy.query = async () => { throw new Error('sensitive details'); };
  const result = await api.book(request(valid));
  assert.equal(result.statusCode, 503); assert.equal(result.body.includes('sensitive'), false);
});
