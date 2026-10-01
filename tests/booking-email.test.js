import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBookingEmail } from '../netlify/lib/booking-email.js';

test('booking email formats the booking instant in Hermosillo with explicit offset', () => {
  for (const start of ['2026-10-01T14:30:00Z', '2026-10-01T07:30:00-07:00']) {
    const { subject, html } = renderBookingEmail({ name: 'Sam', start, duration: 30, meet: 'https://meet.google.com/example', htmlLink: 'https://calendar.google.com/calendar/event?eid=example' });
    assert.equal(subject, 'Your call is booked — Pixalek');
    assert.match(html, /Thursday, October 1, 2026/);
    assert.match(html, /7:30 AM GMT-07:00 \(America\/Hermosillo\)/);
    assert.match(html, /30 minutes/);
    assert.match(html, /Join the call/);
    assert.match(html, /View in Calendar/);
    assert.doesNotMatch(html, /Cancel booking|Reschedule/);
  }
});

test('booking email escapes names and URL attributes and rejects unsafe links', () => {
  const { html } = renderBookingEmail({ name: '<img src=x onerror="alert(1)"> & Sam', meet: 'javascript:alert(1)', htmlLink: 'https://calendar.google.com/?a=1&b=2', cancelUrl: 'https://user:pass@example.com', rescheduleUrl: 'bad-url' });
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Sam/);
  assert.match(html, /a=1&amp;b=2/);
  assert.doesNotMatch(html, /<img|javascript:|Join the call|Cancel booking|Reschedule/);
});

test('missing details and links produce no empty fields or buttons', () => {
  const { html } = renderBookingEmail();
  assert.match(html, /Hi,/);
  assert.doesNotMatch(html, /Date and time|Duration|Join the call|View in Calendar|Cancel booking|Reschedule|undefined|null/);
});

test('template accepts optional management links only when supplied', () => {
  const { html } = renderBookingEmail({ cancelUrl: 'https://example.com/cancel', rescheduleUrl: 'https://example.com/reschedule' });
  assert.match(html, /Cancel booking/);
  assert.match(html, /Reschedule/);
});

test('ambiguous dates and invalid time zones cannot silently change the time', () => {
  for (const start of ['2026-10-01T07:30:00', 'not-a-date']) assert.throws(() => renderBookingEmail({ start }), TypeError);
  assert.throws(() => renderBookingEmail({ start: '2026-10-01T14:30:00Z', tz: 'invalid-zone' }), RangeError);
});
