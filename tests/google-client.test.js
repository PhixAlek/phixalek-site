import test from 'node:test';
import assert from 'node:assert/strict';
import { google } from 'googleapis';

// Exercise the installed SDK's request construction without Google credentials.
test('Calendar SDK preserves the freebusy request and response contract', async () => {
  const payload = {
    timeMin: '2026-10-01T14:00:00Z', timeMax: '2026-10-01T23:00:00Z',
    timeZone: 'America/Hermosillo', items: [{ id: 'calendar-test' }],
  };
  const data = { calendars: { 'calendar-test': { busy: [] } } };
  let request;
  const calendar = google.calendar({ version: 'v3', auth: {
    request: async options => { request = options; return { data }; },
  } });
  const response = await calendar.freebusy.query({ requestBody: payload });
  assert.equal(request.method, 'POST');
  assert.equal(new URL(request.url).pathname, '/calendar/v3/freeBusy');
  assert.deepEqual(request.data, payload);
  assert.deepEqual(response.data, data);
});

test('Calendar SDK preserves event insertion with conference data', async () => {
  const payload = {
    summary: 'Test call',
    start: { dateTime: '2026-10-01T14:00:00Z', timeZone: 'America/Hermosillo' },
    end: { dateTime: '2026-10-01T14:30:00Z', timeZone: 'America/Hermosillo' },
    conferenceData: { createRequest: { requestId: 'test-request' } },
  };
  let request;
  const calendar = google.calendar({ version: 'v3', auth: {
    request: async options => { request = options; return { data: { id: 'test-event' } }; },
  } });
  const response = await calendar.events.insert({
    calendarId: 'calendar-test', conferenceDataVersion: 1, requestBody: payload,
  });
  assert.equal(request.method, 'POST');
  assert.equal(new URL(request.url).pathname, '/calendar/v3/calendars/calendar-test/events');
  assert.equal(request.params.conferenceDataVersion, 1);
  assert.deepEqual(request.data, payload);
  assert.equal(response.data.id, 'test-event');
});
