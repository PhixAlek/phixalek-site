import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBookingHandlers } from '../netlify/lib/booking.js';
import { parseBookingRequest, MAX_REQUEST_BYTES, adaptBookingHandler } from '../netlify/lib/security.js';
import { CALENDAR_SCOPES } from '../netlify/functions/_auth.js';
import { config as bookingLimit } from '../netlify/functions/create-event.js';
import { config as availabilityLimit } from '../netlify/functions/freebusy.js';

const now = () => Date.parse('2026-10-04T12:00:00Z');
const valid = { name: 'Visitor', email: 'visitor@example.org', when: '2026-10-05T09:00:00-07:00', duration: 30 };
const request = data => ({ httpMethod: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });

test('Netlify Request adapter preserves JSON and bounds streamed bodies', async () => {
  const adapter = adaptBookingHandler(async event => {
    try { return { statusCode: 200, body: JSON.stringify(parseBookingRequest(event)), headers: {} }; }
    catch (error) { return { statusCode: error.status, body: '{}', headers: {} }; }
  });
  const headers = { 'content-type': 'application/json' };
  const accepted = await adapter(new Request('https://phixalek.com/api', { method: 'POST', headers, body: JSON.stringify(valid) }));
  assert.deepEqual(await accepted.json(), valid);
  const rejected = await adapter(new Request('https://phixalek.com/api', { method: 'POST', headers, body: 'x'.repeat(MAX_REQUEST_BYTES + 1) }));
  assert.equal(rejected.status, 413);
});

for (const [label, change, status] of [
  ['simple cross-site POST', e => ({ ...e, headers: { 'content-type': 'text/plain', origin: 'https://attacker.example' } }), 415],
  ['untrusted browser origin', e => ({ ...e, headers: { ...e.headers, origin: 'https://attacker.example' } }), 403],
  ['opaque browser origin', e => ({ ...e, headers: { ...e.headers, origin: 'null' } }), 403],
  ['cross-site fetch metadata', e => ({ ...e, headers: { ...e.headers, 'sec-fetch-site': 'cross-site' } }), 403],
  ['oversized body', e => ({ ...e, body: 'x'.repeat(MAX_REQUEST_BYTES + 1) }), 413],
  ['oversized declared length', e => ({ ...e, headers: { ...e.headers, 'content-length': String(MAX_REQUEST_BYTES + 1) } }), 413],
  ['base64 body', e => ({ ...e, isBase64Encoded: true }), 400],
]) test(`${label} is rejected before any Calendar access`, async () => {
  const api = createBookingHandlers({ getCalendar: () => assert.fail('Must not reach Calendar'), getCalendarId: () => 'test', now });
  for (const method of [api.book, api.availability]) {
    const result = await method(change(request(valid)));
    assert.equal(result.statusCode, status); assert.equal(result.headers['X-Content-Type-Options'], 'nosniff');
  }
});
test('JSON from trusted origins and scripts is accepted without pretending origin is authentication', () => {
  const base = request(valid);
  assert.deepEqual(parseBookingRequest(base), valid);
  assert.deepEqual(parseBookingRequest({ ...base, headers: { 'Content-Type': 'application/json; charset=utf-8', Origin: 'https://phixalek.com' } }), valid);
  assert.throws(() => parseBookingRequest({ ...base, body: 'null' }), /invalid_json/);
});
test('control characters and HTML cannot be injected into Calendar text fields', async () => {
  const api = createBookingHandlers({ getCalendar: () => assert.fail('Invalid fields must not reach Calendar'), getCalendarId: () => 'test', now });
  for (const changed of [{ name: '<a>name</a>' }, { subject: 'Title\r\nInjected' }, { location: 'Place\u0000' }]) {
    assert.equal((await api.book(request({ ...valid, ...changed }))).statusCode, 400);
  }
});
test('unexpected provider failures are generic and logged without personal data or credential text', async () => {
  const logs = [];
  const api = createBookingHandlers({ getCalendar: () => { throw new Error('PRIVATE provider detail visitor@example.org'); }, getCalendarId: () => 'test', now, log: event => logs.push(event) });
  const result = await api.book(request(valid));
  assert.equal(result.statusCode, 503); assert.equal(result.body, '{"error":"calendar_unavailable"}');
  assert.deepEqual(logs, [{ event: 'booking_request_rejected', code: 'calendar_unavailable', status: 503 }]);
});
test('a malformed insert response cannot report a successful booking', async () => {
  const api = createBookingHandlers({ getCalendarId: () => 'test', now, getCalendar: () => ({
    freebusy: { query: async () => ({ data: { calendars: { test: { busy: [] } } } }) },
    events: { insert: async () => ({ data: {} }) },
  }) });
  assert.equal((await api.book(request(valid))).statusCode, 503);
});
test('Google scopes are limited to events and availability; edge rules target the existing endpoints', () => {
  assert.deepEqual(CALENDAR_SCOPES, ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.events.freebusy']);
  assert.equal(bookingLimit.path, '/.netlify/functions/create-event');
  assert.equal(bookingLimit.rateLimit.windowLimit, 5);
  assert.equal(availabilityLimit.path, '/.netlify/functions/freebusy');
  assert.equal(availabilityLimit.rateLimit.windowLimit, 30);
});
test('static policy forbids script injection and framing while allowing the actual subscription flow', () => {
  const config = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const policy = config.match(/Content-Security-Policy = "([^"]+)"/)[1];
  assert.ok(policy.includes("script-src 'self';")); assert.ok(!policy.includes('unsafe-eval'));
  assert.ok(policy.includes("frame-ancestors 'none'")); assert.ok(policy.includes("base-uri 'none'"));
  assert.ok(policy.includes("form-action 'self' https://phixalek.substack.com"));
  assert.ok(policy.includes('connect-src \'self\' https://api.emailjs.com'));
});
