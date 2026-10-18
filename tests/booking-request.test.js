import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingRequest } from '../src/js/modules/common/booking-request.js';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('availability submits one same-origin request and preserves the API error', async () => {
  let calls = 0;
  await assert.rejects(bookingRequest('freebusy', { date:'2026-10-19', duration:30 }, { fetchImpl: async (url, options) => {
    calls++; assert.equal(url, '/.netlify/functions/freebusy'); assert.equal(options.method, 'POST');
    return json({ error:'calendar_unavailable' }, 503);
  } }), /calendar_unavailable/);
  assert.equal(calls, 1);
});
test('plain-text rate limits are distinct from function routing failures', async () => {
  await assert.rejects(bookingRequest('freebusy', {}, { fetchImpl: async () => new Response('Too many requests', { status:429 }) }), /rate_limited/);
  await assert.rejects(bookingRequest('freebusy', {}, { fetchImpl: async () => new Response('<html>', { status:404 }) }), /functions_unavailable/);
});
test('a stalled request is aborted and never retried automatically', async () => {
  let calls = 0;
  const pending = bookingRequest('create-event', {}, { timeoutMs:10, fetchImpl: (_url, { signal }) => {
    calls++;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  } });
  await assert.rejects(pending, /request_timeout/);
  assert.equal(calls, 1);
});
test('cancelled availability remains a cancellation, not a timeout', async () => {
  const controller = new AbortController();
  const pending = bookingRequest('freebusy', {}, { signal:controller.signal, fetchImpl: (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }) });
  controller.abort();
  await assert.rejects(pending, { name:'AbortError' });
});
